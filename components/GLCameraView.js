import { Asset } from "expo-asset";
import { CameraView } from "expo-camera";
import { Surface } from "gl-react-expo";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { captureRef } from "react-native-view-shot";

import { FILTERS } from "@/constants/CameraConfig";
import { ensureDirectories, saveImagePermanently } from "@/utils/fileUtils";
import { GLSL, Node, Shaders } from "gl-react";
import lutTextureUtils from "../utils/lutTextureUtils";

// Define shaders for applying filters
const shaders = Shaders.create({
  cubeData: {
    frag: GLSL`
      precision highp float;
      varying vec2 uv;
      uniform sampler2D inputImage;
      uniform sampler2D lutCube;
      uniform float lutSize;
      uniform float intensity;
      
      vec4 lookup(vec4 color, sampler2D lutTexture, float lutSize) {
        float sliceSize = 1.0 / lutSize;
        float slicePixelSize = sliceSize / lutSize;
        float sliceInnerSize = slicePixelSize * (lutSize - 1.0);
        float size = lutSize - 1.0;
        
        float bValue = floor(color.b * size);
        float blueOffset = bValue * sliceSize;
        
        float xOffset = color.r * sliceInnerSize + 0.5 * slicePixelSize;
        float yOffset = color.g * sliceInnerSize + 0.5 * slicePixelSize;
        
        vec2 texPos1 = vec2(xOffset + blueOffset, yOffset);
        vec2 texPos2 = vec2(xOffset + blueOffset + sliceSize, yOffset);
        
        vec4 slice0Color = texture2D(lutTexture, texPos1);
        vec4 slice1Color = texture2D(lutTexture, texPos2);
        
        float bRemainder = color.b * size - bValue;
        
        return mix(slice0Color, slice1Color, bRemainder);
      }
      
      void main() {
        vec4 originalColor = texture2D(inputImage, uv);
        vec4 lutColor = lookup(originalColor, lutCube, lutSize);
        gl_FragColor = mix(originalColor, lutColor, intensity);
      }
    `,
  },

  lutFilter: {
    frag: GLSL`
      precision highp float;
      varying vec2 uv;
      uniform sampler2D inputImage;
      uniform sampler2D lutTexture;
      uniform float intensity;
      
      vec4 applyLUT(vec4 color) {
        float blueColor = color.b * 63.0;
        vec2 quad = vec2(mod(blueColor, 8.0), floor(blueColor / 8.0));
        vec2 texPos = vec2(
          (quad.x * 0.125) + (0.125 - 1.0/512.0) * color.r,
          (quad.y * 0.125) + (0.125 - 1.0/512.0) * color.g
        );
        return texture2D(lutTexture, texPos);
      }
      
      void main() {
        vec4 originalColor = texture2D(inputImage, uv);
        vec4 lutColor = applyLUT(originalColor);
        gl_FragColor = mix(originalColor, lutColor, intensity);
      }
    `,
  },

  colorOverlay: {
    frag: GLSL`
      precision highp float;
      varying vec2 uv;
      uniform sampler2D inputImage;
      uniform vec4 color;
      uniform float opacity;
      
      void main() {
        vec4 originalColor = texture2D(inputImage, uv);
        vec4 overlayColor = vec4(color.rgb, opacity);
        gl_FragColor = vec4(
          mix(originalColor.rgb, color.rgb * originalColor.rgb, opacity),
          originalColor.a
        );
      }
    `,
  },
});

// Helper function to parse color string
const parseColor = (colorString) => {
  if (!colorString || colorString === "transparent") {
    return [1, 1, 1, 0];
  }

  if (colorString.startsWith("rgba")) {
    const values = colorString
      .match(/rgba\(([^)]+)\)/)[1]
      .split(",")
      .map((v) => Number.parseFloat(v.trim()));
    return [values[0] / 255, values[1] / 255, values[2] / 255, values[3]];
  }

  return [1, 1, 1, 0.5];
};

// Camera texture component - wraps the camera for use in GL React
const CameraTexture = ({ cameraRef }) => {
  if (!cameraRef.current) {
    return null;
  }
  return cameraRef.current;
};

// CubeLUT filter component
const CubeLutFilter = ({ children, lutData, lutSize, intensity }) => {
  return (
    <Node
      shader={shaders.cubeData}
      uniforms={{
        inputImage: children,
        lutCube: lutData,
        lutSize,
        intensity,
      }}
    />
  );
};

// PNG LUT filter component
const PngLutFilter = ({ children, lutUri, intensity }) => {
  return (
    <Node
      shader={shaders.lutFilter}
      uniforms={{
        inputImage: children,
        lutTexture: lutUri,
        intensity,
      }}
    />
  );
};

// Color Overlay filter component
const ColorOverlayFilter = ({ children, color, opacity }) => {
  const parsedColor = parseColor(color);

  return (
    <Node
      shader={shaders.colorOverlay}
      uniforms={{
        inputImage: children,
        color: parsedColor,
        opacity,
      }}
    />
  );
};

const GLCameraView = ({
  cameraType,
  flashMode,
  zoom,
  selectedFilter,
  style,
  onCaptureStart,
  onCaptureComplete,
}) => {
  const cameraRef = useRef(null);
  const surfaceRef = useRef(null);
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [lutData, setLutData] = useState(null);
  const [lutUri, setLutUri] = useState(null);
  const [lutSize, setLutSize] = useState(32);
  const [isPngLut, setIsPngLut] = useState(false);

  // Handle when the GL surface is loaded
  const handleSurfaceLoad = useCallback(() => {
    setIsReady(true);
  }, []);

  // Load LUT data when the filter changes
  useEffect(() => {
    const loadLutData = async () => {
      try {
        // Skip loading if using the default filter (index 0)
        if (selectedFilter === 0) {
          setLutData(null);
          setLutUri(null);
          setIsPngLut(false);
          return;
        }

        setIsLoading(true);

        const filter = FILTERS[selectedFilter];

        // Skip LUT loading if no file path
        if (!filter.filePath || filter.filePath.length === 0) {
          setLutData(null);
          setLutUri(null);
          setIsPngLut(false);
          setIsLoading(false);
          return;
        }

        // Check if it's a PNG LUT or CUBE LUT
        const isPng = filter.filePath.toLowerCase().endsWith(".png");

        if (isPng) {
          try {
            // For PNG files, we use the Asset API
            // We need to use a different approach for loading assets
            // since we can't use dynamic requires

            // Use a direct import based on the file name
            let assetModule;

            if (filter.filePath === "luts/tokyodeception.png") {
              assetModule = require("../assets/luts/tokyodeception.png");
            } else if (filter.filePath === "luts/chinatown.png") {
              assetModule = require("../assets/luts/chinatown.png");
            } else {
              console.error(`Unknown PNG LUT file: ${filter.filePath}`);
              setLutUri(null);
              setIsPngLut(false);
              setIsLoading(false);
              return;
            }

            await Asset.loadAsync(assetModule);
            const asset = Asset.fromModule(assetModule);
            await asset.downloadAsync();

            if (!asset.localUri) {
              throw new Error(
                `Failed to load PNG LUT file: ${filter.filePath}`
              );
            }

            setLutUri(asset.localUri);
            setIsPngLut(true);
            setLutData(null); // Clear any existing CUBE LUT data
          } catch (error) {
            console.error("Error loading PNG LUT:", error);
            setLutUri(null);
            setIsPngLut(false);
          }
        } else {
          try {
            // Need to handle CUBE file loading similarly with static imports
            let assetModule;

            // Map file paths to static imports
            if (filter.filePath === "luts/Landscape1.cube") {
              // For CUBE files we can try an alternative approach
              // since we don't have static imports for them

              // Load the file as an asset by full path
              const assetUri = Asset.fromModule(
                require("../assets/luts/Landscape1.cube")
              );
              await assetUri.downloadAsync();

              if (!assetUri.localUri) {
                throw new Error(`Failed to load CUBE file: ${filter.filePath}`);
              }

              // Parse CUBE and convert to texture using lutTextureUtils
              const { lutTexture, lutSize: size } =
                await lutTextureUtils.loadLutFromCubeFile(assetUri.localUri);

              setLutData(lutTexture);
              setLutSize(size);
            }
            // Add similar cases for other CUBE files as needed
            else {
              console.error(`Unsupported CUBE file: ${filter.filePath}`);
              setLutData(null);
            }

            setLutUri(null); // Clear any existing PNG LUT data
            setIsPngLut(false);
          } catch (error) {
            console.error("Error loading CUBE LUT:", error);
            setLutData(null);
          }
        }

        setIsLoading(false);
      } catch (error) {
        console.error("Error loading LUT data:", error);
        setLutData(null);
        setLutUri(null);
        setIsPngLut(false);
        setIsLoading(false);
      }
    };

    loadLutData();
  }, [selectedFilter]);

  // Function to take a picture with the applied filter
  const takePictureAsync = useCallback(
    async (options = {}) => {
      if (!cameraRef.current || !surfaceRef.current) {
        return null;
      }

      try {
        if (onCaptureStart) {
          onCaptureStart();
        }

        // Create directories if necessary
        await ensureDirectories();

        // Take a picture with the camera
        const photo = await cameraRef.current.takePictureAsync({
          quality: options.quality || 0.9,
          skipProcessing: options.skipProcessing || false,
        });

        // Capture the GL Surface with the filter applied
        const filteredUri = await captureRef(surfaceRef, {
          format: "jpg",
          quality: options.quality || 0.9,
        });

        // Save the filtered image permanently
        const permanentUri = await saveImagePermanently(filteredUri, true);

        const result = {
          uri: permanentUri,
          width: photo.width,
          height: photo.height,
          exif: photo.exif,
        };

        if (onCaptureComplete) {
          onCaptureComplete(result);
        }

        return result;
      } catch (error) {
        console.error("Error taking picture:", error);
        if (onCaptureComplete) {
          onCaptureComplete(null, error);
        }
        return null;
      }
    },
    [onCaptureStart, onCaptureComplete]
  );

  // Expose takePictureAsync method via the ref
  useEffect(() => {
    if (cameraRef.current) {
      cameraRef.current.takePictureAsync = takePictureAsync;
    }
  }, [takePictureAsync]);

  return (
    <View style={[styles.container, style]}>
      {/* Hidden camera view */}
      <View style={styles.cameraContainer}>
        <CameraView
          style={styles.hiddenCamera}
          ref={cameraRef}
          facing={cameraType}
          flash={flashMode}
          zoom={zoom}
        />
      </View>

      {/* GL React Surface for applying filters */}
      <Surface
        style={styles.surface}
        ref={surfaceRef}
        onLoad={handleSurfaceLoad}
      >
        {isReady && cameraRef.current ? (
          isPngLut && lutUri ? (
            // PNG LUT filter
            <PngLutFilter lutUri={lutUri} intensity={1.0}>
              <CameraTexture cameraRef={cameraRef} />
            </PngLutFilter>
          ) : lutData ? (
            // CUBE LUT filter
            <CubeLutFilter lutData={lutData} lutSize={lutSize} intensity={1.0}>
              <CameraTexture cameraRef={cameraRef} />
            </CubeLutFilter>
          ) : selectedFilter > 0 ? (
            // Color overlay filter
            <ColorOverlayFilter
              color={FILTERS[selectedFilter].color}
              opacity={FILTERS[selectedFilter].opacity}
            >
              <CameraTexture cameraRef={cameraRef} />
            </ColorOverlayFilter>
          ) : (
            // No filter
            <CameraTexture cameraRef={cameraRef} />
          )
        ) : null}
      </Surface>

      {/* Loading indicator */}
      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#ffffff" />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: "relative",
  },
  cameraContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    width: 1,
    height: 1,
    overflow: "hidden",
    opacity: 0,
  },
  hiddenCamera: {
    width: 1,
    height: 1,
  },
  surface: {
    flex: 1,
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
});

export default GLCameraView;
