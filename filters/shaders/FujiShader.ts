import { GLSL, Shaders } from "gl-react";

// FujiShader - inspired by Fujifilm colors with rich greens and vibrant reds
export const FujiShader = Shaders.create({
  fuji: {
    frag: GLSL`
      precision highp float;
      varying vec2 uv;
      uniform sampler2D texture;
      uniform float greenBoost; // 0.0-1.0
      uniform float redContrast; // 0.0-1.0
      uniform float shadowColor; // 0.0-1.0 (blue tint in shadows)
      
      // Helper to adjust contrast
      vec3 contrast(vec3 color, float contrast) {
        return (color - 0.5) * (1.0 + contrast) + 0.5;
      }
      
      void main() {
        vec4 color = texture2D(texture, uv);
        
        // Extract luminance
        float luminance = dot(color.rgb, vec3(0.299, 0.587, 0.114));
        
        // Apply Fuji-like color adjustments
        
        // Enhance greens (characteristic of Fuji)
        color.g = color.g + (color.g * greenBoost * 0.15);
        
        // Enhance reds while keeping natural tones (Fuji's signature)
        color.r = contrast(vec3(color.r), redContrast).r;
        
        // Add a slight blue tint to shadows (Fuji cool shadows)
        color.b = mix(color.b, color.b + 0.05, (1.0 - luminance) * shadowColor);
        
        // Reduce blue in highlights slightly (Fuji warm highlights)
        color.b = mix(color.b, color.b - 0.05, luminance * 0.5);
        
        // Adjust contrast per channel (giving that film-like dimensionality)
        color.r = (color.r - 0.5) * 1.15 + 0.5;
        color.g = (color.g - 0.5) * 1.05 + 0.5;
        color.b = (color.b - 0.5) * 1.1 + 0.5;
        
        // Slightly boost saturation in midtones (Fuji's vibrant colors)
        vec3 gray = vec3(luminance);
        float midtoneMask = 1.0 - 2.0 * abs(luminance - 0.5);
        color.rgb = mix(color.rgb, mix(gray, color.rgb, 1.2), midtoneMask);
        
        // Ensure values are in valid range
        color.rgb = clamp(color.rgb, 0.0, 1.0);
        
        gl_FragColor = color;
      }
    `,
  },
});

// Default uniform values
export const FujiDefaults = {
  greenBoost: 0.7,
  redContrast: 0.5,
  shadowColor: 0.6,
}; 