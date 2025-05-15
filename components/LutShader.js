import { GLSL, Node, Shaders } from "gl-react";
import React, { memo } from "react";

// Define the shaders
const shaders = Shaders.create({
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
        
        // Only apply LUT if available
        vec4 lutColor = lutTexture == null ? originalColor : applyLUT(originalColor);
        
        gl_FragColor = mix(originalColor, lutColor, intensity);
      }
    `,
  },
  colorFilter: {
    frag: GLSL`
      precision highp float;
      varying vec2 uv;
      uniform sampler2D inputImage;
      uniform vec4 color;
      uniform float intensity;
      
      void main() {
        vec4 originalColor = texture2D(inputImage, uv);
        vec4 filteredColor = originalColor * color;
        gl_FragColor = mix(originalColor, filteredColor, intensity);
      }
    `,
  },
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
  cube3D: {
    frag: GLSL`
      precision highp float;
      varying vec2 uv;
      uniform sampler2D inputImage;
      uniform sampler3D lut3D;
      uniform float lutSize;
      uniform float intensity;
      
      vec4 applyLut3D(vec4 color) {
        // Convert RGB to texture coordinates in 3D texture
        vec3 lutCoords = color.rgb * (lutSize - 1.0) / lutSize + 0.5 / lutSize;
        // Sample the 3D texture
        vec4 lutColor = texture(lut3D, lutCoords);
        return lutColor;
      }
      
      void main() {
        vec4 originalColor = texture2D(inputImage, uv);
        vec4 lutColor = applyLut3D(originalColor);
        gl_FragColor = mix(originalColor, lutColor, intensity);
      }
    `,
  },
});

// Helper function to parse color string to vec4
const parseColor = (colorString) => {
  // Default to white transparent color
  if (!colorString || colorString === "transparent") {
    return [1, 1, 1, 0];
  }

  // Parse rgba string: rgba(r, g, b, a)
  if (colorString.startsWith("rgba")) {
    const values = colorString
      .match(/rgba\(([^)]+)\)/)[1]
      .split(",")
      .map((v) => Number.parseFloat(v.trim()));
    return [values[0] / 255, values[1] / 255, values[2] / 255, values[3]];
  }

  // If not recognized, return white semi-transparent as fallback
  return [1, 1, 1, 0.5];
};

// LUT Shader component using PNG LUT textures (8x8 grid format)
export const LutFilterShader = memo(
  ({ children, lut, intensity = 1.0, color }) => {
    // Use color filter if no LUT but color is provided
    if (!lut && color && color !== "transparent") {
      const colorVec = parseColor(color);
      return (
        <Node
          shader={shaders.colorFilter}
          uniforms={{
            inputImage: children,
            color: colorVec,
            intensity,
          }}
        />
      );
    }

    // Otherwise use the LUT filter
    return (
      <Node
        shader={shaders.lutFilter}
        uniforms={{
          inputImage: children,
          lutTexture: lut,
          intensity,
        }}
      />
    );
  }
);

// Fallback component for when we don't have 3D textures available
// This uses a 2D texture with slices of the 3D LUT
export const CubeLutShader = memo(
  ({ children, lutData, lutSize = 32, intensity = 1.0 }) => {
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
  }
);

export default LutFilterShader;
