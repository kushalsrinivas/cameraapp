import { GLSL, Node, Shaders } from "gl-react";
import { Surface } from "gl-react-expo";
import type React from "react";
import { Dimensions, StyleSheet } from "react-native";

// Define shader for color lookup table effect
const shaders = Shaders.create({
  lutFilter: {
    frag: GLSL`
      precision highp float;
      varying vec2 uv;
      uniform sampler2D inputTexture; // Input camera texture
      uniform sampler2D lutTexture; // Lookup table texture
      uniform float intensity; // Filter intensity (0-1)
      
      // Function to apply LUT to a color
      vec4 applyLUT(vec4 color, sampler2D lut) {
        float blueColor = color.b * 63.0;
        
        vec2 quad1;
        quad1.y = floor(floor(blueColor) / 8.0);
        quad1.x = floor(blueColor) - (quad1.y * 8.0);
        
        vec2 quad2;
        quad2.y = floor(ceil(blueColor) / 8.0);
        quad2.x = ceil(blueColor) - (quad2.y * 8.0);
        
        vec2 texPos1;
        texPos1.x = (quad1.x * 0.125) + 0.5/512.0 + ((0.125 - 1.0/512.0) * color.r);
        texPos1.y = (quad1.y * 0.125) + 0.5/512.0 + ((0.125 - 1.0/512.0) * color.g);
        
        vec2 texPos2;
        texPos2.x = (quad2.x * 0.125) + 0.5/512.0 + ((0.125 - 1.0/512.0) * color.r);
        texPos2.y = (quad2.y * 0.125) + 0.5/512.0 + ((0.125 - 1.0/512.0) * color.g);
        
        vec4 newColor1 = texture2D(lut, texPos1);
        vec4 newColor2 = texture2D(lut, texPos2);
        
        vec4 lutColor = mix(newColor1, newColor2, fract(blueColor));
        
        // Mix with original based on intensity
        return mix(color, vec4(lutColor.rgb, color.a), intensity);
      }
      
      vec4 applyColorTint(vec4 color, vec4 tint) {
        // Simple tint effect blended with original color
        return vec4(
          mix(color.rgb, tint.rgb * color.rgb, tint.a), 
          color.a
        );
      }
      
      void main() {
        vec4 originalColor = texture2D(inputTexture, uv);
        
        // Apply LUT if available
        #ifdef HAS_LUT
        vec4 lutColor = applyLUT(originalColor, lutTexture);
        gl_FragColor = lutColor;
        #else
        gl_FragColor = originalColor;
        #endif
      }
    `,
  },
  simpleFilter: {
    frag: GLSL`
      precision highp float;
      varying vec2 uv;
      uniform sampler2D inputTexture;
      uniform vec4 filterColor; // Color tint with alpha as intensity
      uniform float vignette; // Vignette intensity

      void main() {
        vec4 color = texture2D(inputTexture, uv);
        
        // Apply color tint
        color.rgb = mix(color.rgb, color.rgb * filterColor.rgb, filterColor.a);
        
        // Vignette effect
        float dist = distance(uv, vec2(0.5, 0.5));
        color.rgb *= smoothstep(0.8, 0.2, dist * vignette);
        
        gl_FragColor = color;
      }
    `,
  },
});

interface FilterLUTProps {
  children: React.ReactNode;
  filter: string;
  color: string;
  opacity: number;
  width?: number;
  height?: number;
}

function hexToRgba(hex: string, alpha = 1): [number, number, number, number] {
  let r = 1,
    g = 1,
    b = 1;

  // If transparent color, return white with 0 alpha
  if (hex === "transparent") {
    return [r, g, b, 0];
  }

  // Parse rgba string
  if (hex.startsWith("rgba")) {
    const parts = hex.slice(5, -1).split(",");
    r = Number.parseInt(parts[0]) / 255;
    g = Number.parseInt(parts[1]) / 255;
    b = Number.parseInt(parts[2]) / 255;
    return [r, g, b, alpha];
  }

  // Parse hex
  if (hex.startsWith("#")) {
    hex = hex.slice(1);
    if (hex.length === 3) {
      r = Number.parseInt(hex[0] + hex[0], 16) / 255;
      g = Number.parseInt(hex[1] + hex[1], 16) / 255;
      b = Number.parseInt(hex[2] + hex[2], 16) / 255;
    } else if (hex.length === 6) {
      r = Number.parseInt(hex.slice(0, 2), 16) / 255;
      g = Number.parseInt(hex.slice(2, 4), 16) / 255;
      b = Number.parseInt(hex.slice(4, 6), 16) / 255;
    }
  }

  return [r, g, b, alpha];
}

// This will create vignette and color effects for filters that don't have LUT files
function getVignetteSettings(filterName: string): number {
  switch (filterName) {
    case "Lomo LC-A":
      return 2.0; // Strong vignette
    case "Polaroid 600":
      return 1.5; // Medium vignette
    case "CineStill 800T":
      return 1.2; // Slight vignette
    default:
      return 0.5; // Default minimum vignette
  }
}

export function FilterLUT({
  children,
  filter,
  color,
  opacity,
  width,
  height,
}: FilterLUTProps) {
  const screenWidth = width || Dimensions.get("window").width;
  const screenHeight = height || Dimensions.get("window").height;

  // For demonstration, we'll use the color filter directly
  // In a real app, you would load LUT files for each filter
  const rgba = hexToRgba(color, opacity);
  const vignette = getVignetteSettings(filter);

  if (filter === "Normal" || opacity === 0) {
    // No filter, pass through
    return <>{children}</>;
  }

  return (
    <Surface style={{ width: screenWidth, height: screenHeight }}>
      <Node
        shader={shaders.simpleFilter}
        uniforms={{
          inputTexture: children,
          filterColor: rgba,
          vignette: vignette,
        }}
      />
    </Surface>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default FilterLUT;
