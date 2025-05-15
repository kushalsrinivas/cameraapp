import { GLSL, Node, Shaders } from "gl-react";
import { Surface } from "gl-react-expo";
import React, { useEffect, useRef, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { captureRef } from "react-native-view-shot";

import { FILTERS } from "@/constants/CameraConfig";
import { Asset } from "expo-asset";
import lutTextureUtils from "../utils/lutTextureUtils";

// Define the shaders
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

// Component to create a texture from an image URI
const URIImage = ({ uri }) => {
  return uri;
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

const GLFilterImage = ({
  imageUri,
  filterIndex = 0,
  onFilterApplied,
  width = 300,
  height = 300,
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [lutData, setLutData] = useState(null);
  const [lutUri, setLutUri] = useState(null);
  const [lutSize, setLutSize] = useState(32);
  const [isPngLut, setIsPngLut] = useState(false);
  const surfaceRef = useRef(null);

  // Load the LUT data when the filter changes
  useEffect(() => {
    const loadLutData = async () => {
      try {
        setIsLoading(true);
        setIsPngLut(false);
        setLutData(null);
        setLutUri(null);

        // No filter for index 0
        if (filterIndex === 0) {
          setIsLoading(false);
          return;
        }

        const filter = FILTERS[filterIndex];

        // Skip LUT loading if no file path
        if (!filter.filePath || filter.filePath.length === 0) {
          setIsLoading(false);
          return;
        }

        // Check if it's a PNG LUT or CUBE LUT
        const isPng = filter.filePath.toLowerCase().endsWith(".png");

        if (isPng) {
          try {
            // For PNG files, we use direct imports based on the filename
            let assetModule;

            if (filter.filePath === "luts/tokyodeception.png") {
              assetModule = require("../assets/luts/tokyodeception.png");
            } else if (filter.filePath === "luts/chinatown.png") {
              assetModule = require("../assets/luts/chinatown.png");
            } else {
              console.error(`Unknown PNG LUT file: ${filter.filePath}`);
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
          } catch (error) {
            console.error("Error loading PNG LUT:", error);
          }
        } else {
          try {
            // Need to handle CUBE file loading with static imports
            let assetUri;

            // Map file paths to static requires
            if (filter.filePath === "luts/Landscape1.cube") {
              assetUri = Asset.fromModule(
                require("../assets/luts/Landscape1.cube")
              );
            } else {
              console.error(`Unsupported CUBE file: ${filter.filePath}`);
              setIsLoading(false);
              return;
            }

            await assetUri.downloadAsync();

            if (!assetUri.localUri) {
              throw new Error(`Failed to load CUBE file: ${filter.filePath}`);
            }

            // Parse CUBE and convert to texture using lutTextureUtils
            const { lutTexture, lutSize: size } =
              await lutTextureUtils.loadLutFromCubeFile(assetUri.localUri);

            setLutData(lutTexture);
            setLutSize(size);
          } catch (error) {
            console.error("Error loading CUBE LUT:", error);
          }
        }

        setIsLoading(false);
      } catch (error) {
        console.error("Error in loadLutData:", error);
        setLutData(null);
        setLutUri(null);
        setIsPngLut(false);
        setIsLoading(false);
      }
    };

    loadLutData();
  }, [filterIndex]);

  // Function to capture the filtered image
  const captureFilteredImage = async () => {
    if (!surfaceRef.current) {
      return null;
    }

    try {
      // Capture the GL Surface with the filter applied
      const capturedUri = await captureRef(surfaceRef, {
        format: "jpg",
        quality: 0.9,
      });

      // Call the onFilterApplied callback with the captured URI
      if (onFilterApplied) {
        onFilterApplied(capturedUri);
      }

      return capturedUri;
    } catch (error) {
      console.error("Error capturing filtered image:", error);
      return null;
    }
  };

  // Render the filtered image
  return (
    <View style={[styles.container, { width, height }]}>
      <Surface ref={surfaceRef} style={{ width, height }}>
        {isPngLut && lutUri ? (
          // Render with PNG LUT filter
          <PngLutFilter lutUri={lutUri} intensity={1.0}>
            <URIImage uri={imageUri} />
          </PngLutFilter>
        ) : lutData ? (
          // Render with CUBE LUT filter
          <CubeLutFilter lutData={lutData} lutSize={lutSize} intensity={1.0}>
            <URIImage uri={imageUri} />
          </CubeLutFilter>
        ) : filterIndex > 0 ? (
          // Render with color overlay filter
          <ColorOverlayFilter
            color={FILTERS[filterIndex].color}
            opacity={FILTERS[filterIndex].opacity}
          >
            <URIImage uri={imageUri} />
          </ColorOverlayFilter>
        ) : (
          // No filter
          <URIImage uri={imageUri} />
        )}
      </Surface>

      {isLoading && (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color="#fff" />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: "hidden",
  },
  loading: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
});

// Add method to capture filtered image
GLFilterImage.captureFilteredImage = (ref) => {
  if (ref?.current) {
    return ref.current.captureFilteredImage();
  }
  return Promise.reject(new Error("Filter ref not available"));
};

export default GLFilterImage;
