import { Asset } from "expo-asset";
import * as FileSystem from "expo-file-system";
import ndarray from "ndarray";
import ops from "ndarray-ops";

/**
 * Parse a .cube file and convert it to a format suitable for WebGL shaders
 *
 * @param {string} cubePath - Path to the .cube file
 * @returns {Promise<{ data: Float32Array, size: number }>} - LUT data and size
 */
export const parseCubeFile = async (cubePath) => {
  try {
    // Read the .cube file
    const fileContent = await FileSystem.readAsStringAsync(cubePath);
    const lines = fileContent.split("\n");

    // Parse header to find LUT size
    let lutSize = 0;
    let dataStartLine = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Skip empty lines and comments
      if (!line || line.startsWith("#")) continue;

      // Parse LUT size
      if (line.startsWith("LUT_3D_SIZE")) {
        lutSize = Number.parseInt(line.split(/\s+/)[1], 10);
        continue;
      }

      // Find start of data section (first line with 3 float values)
      if (lutSize > 0) {
        const values = line.split(/\s+/).map((val) => Number.parseFloat(val));
        if (values.length >= 3 && !Number.isNaN(values[0])) {
          dataStartLine = i;
          break;
        }
      }
    }

    if (lutSize === 0) {
      throw new Error("Invalid .cube file: LUT_3D_SIZE not found");
    }

    // Create a 3D texture data array to hold the LUT
    const lutArray = new Float32Array(lutSize * lutSize * lutSize * 4);

    // Fill the array with RGBA values from the .cube file
    let dataIndex = 0;

    for (
      let i = dataStartLine;
      i < lines.length && dataIndex < lutSize * lutSize * lutSize * 4;
      i++
    ) {
      const line = lines[i].trim();

      // Skip empty lines and comments
      if (!line || line.startsWith("#")) continue;

      // Parse RGB values
      const values = line.split(/\s+/).map((val) => Number.parseFloat(val));

      if (values.length >= 3 && !Number.isNaN(values[0])) {
        lutArray[dataIndex] = values[0]; // R
        lutArray[dataIndex + 1] = values[1]; // G
        lutArray[dataIndex + 2] = values[2]; // B
        lutArray[dataIndex + 3] = 1.0; // A (always 1.0)

        dataIndex += 4;
      }
    }

    return {
      data: lutArray,
      size: lutSize,
    };
  } catch (error) {
    console.error("Error parsing .cube file:", error);
    throw error;
  }
};

/**
 * Convert a 3D LUT to a 2D texture for use with WebGL 1.0
 * This creates a 2D texture with slices of the 3D texture.
 *
 * @param {Float32Array} lutData - 3D LUT data
 * @param {number} lutSize - Size of the LUT cube
 * @returns {ndarray} - 2D texture data in a format suitable for WebGL
 */
export const convert3DLutTo2DTexture = (lutData, lutSize) => {
  // Create 3D ndarray
  const lut3d = ndarray(lutData, [lutSize, lutSize, lutSize, 4]);

  // Create 2D texture with slices of the 3D LUT arranged in a grid
  // Each slice is a 2D plane of the 3D LUT at a specific blue value
  const width = lutSize * lutSize;
  const height = lutSize;
  const textureData = new Float32Array(width * height * 4);
  const texture2d = ndarray(textureData, [height, width, 4]);

  // Copy data from 3D LUT to 2D texture
  for (let z = 0; z < lutSize; z++) {
    for (let y = 0; y < lutSize; y++) {
      for (let x = 0; x < lutSize; x++) {
        // Calculate position in 2D texture
        const tx = x + z * lutSize;
        const ty = y;

        // Copy RGBA values
        for (let c = 0; c < 4; c++) {
          texture2d.set(ty, tx, c, lut3d.get(x, y, z, c));
        }
      }
    }
  }

  return texture2d;
};

/**
 * Format a 3D LUT as a 2D texture image with color squares (8x8 grid format)
 * This is the format expected by the LutFilterShader component.
 *
 * @param {Float32Array} lutData - 3D LUT data
 * @param {number} lutSize - Size of the LUT cube
 * @returns {ndarray} - 2D texture in 8x8 grid format
 */
export const formatLutAs2DImage = (lutData, lutSize) => {
  // We assume lutSize is 32 for a typical 3D LUT
  // But the 2D representation will use a 8x8 grid of 64x64 squares
  const gridSize = 8; // 8x8 grid
  const cellSize = 64; // 64x64 pixels per cell
  const width = gridSize * cellSize;
  const height = gridSize * cellSize;

  // Create the 2D texture
  const textureData = new Float32Array(width * height * 4);
  const texture2d = ndarray(textureData, [height, width, 4]);

  // Fill the texture with default values (black, fully transparent)
  ops.assigns(texture2d, 0);

  // Map the 3D LUT to the 2D grid
  for (let z = 0; z < gridSize; z++) {
    for (let y = 0; y < gridSize; y++) {
      for (let cellY = 0; cellY < cellSize; cellY++) {
        for (let cellX = 0; cellX < cellSize; cellX++) {
          // Calculate the normalized position within the cell (0.0 to 1.0)
          const r = cellX / (cellSize - 1);
          const g = cellY / (cellSize - 1);
          const b = (z * gridSize + y) / (gridSize * gridSize - 1);

          // Convert to indices in the 3D LUT
          const lutX = Math.round(r * (lutSize - 1));
          const lutY = Math.round(g * (lutSize - 1));
          const lutZ = Math.round(b * (lutSize - 1));

          // Get the RGB value from the 3D LUT
          const i = (lutX + lutY * lutSize + lutZ * lutSize * lutSize) * 4;

          // Set the pixel in the 2D texture
          const tx = cellX + y * cellSize;
          const ty = cellY + z * cellSize;

          texture2d.set(ty, tx, 0, lutData[i]); // R
          texture2d.set(ty, tx, 1, lutData[i + 1]); // G
          texture2d.set(ty, tx, 2, lutData[i + 2]); // B
          texture2d.set(ty, tx, 3, 1.0); // A
        }
      }
    }
  }

  return texture2d;
};

/**
 * Load a LUT from a .cube file and prepare it for use with shaders
 *
 * @param {string} cubeFilePath - Path to the .cube file
 * @returns {Promise<{ lutTexture: ndarray, lutSize: number }>} - LUT texture and size
 */
export const loadLutFromCubeFile = async (cubeFilePath) => {
  // Parse the .cube file
  const { data, size } = await parseCubeFile(cubeFilePath);

  // Format as 2D image for use with shaders
  const lutTexture = convert3DLutTo2DTexture(data, size);

  return {
    lutTexture,
    lutSize: size,
  };
};

/**
 * Create an image-like LUT texture (8x8 grid format)
 *
 * @param {string} cubeFilePath - Path to the .cube file
 * @returns {Promise<ndarray>} - LUT as image texture
 */
export const createLutImageTexture = async (cubeFilePath) => {
  const { data, size } = await parseCubeFile(cubeFilePath);
  return formatLutAs2DImage(data, size);
};

/**
 * Load a LUT from a PNG image file
 * PNG LUTs are typically stored as 8x8 grids with 64x64 cells
 *
 * @param {string} pngPath - Path to the PNG LUT file
 * @returns {Promise<{ lutTexture: string, lutSize: number }>} - LUT texture URI and size
 */
export const loadLutFromPngFile = async (pngPath) => {
  try {
    // Load the PNG file as an asset
    const assetModule = require(`../assets/${pngPath}`);
    await Asset.loadAsync(assetModule);
    const asset = Asset.fromModule(assetModule);
    await asset.downloadAsync();

    if (!asset.localUri) {
      throw new Error(`Failed to load PNG LUT file: ${pngPath}`);
    }

    // For PNG LUTs, we simply return the URI for direct use in gl-react
    // The shader will handle the LUT lookup based on the 8x8 grid format
    return {
      lutTexture: asset.localUri,
      lutSize: 64, // This is the size of each cell in the 8x8 grid
    };
  } catch (error) {
    console.error("Error loading PNG LUT:", error);
    throw error;
  }
};

export default {
  parseCubeFile,
  convert3DLutTo2DTexture,
  formatLutAs2DImage,
  loadLutFromCubeFile,
  createLutImageTexture,
  loadLutFromPngFile,
};
