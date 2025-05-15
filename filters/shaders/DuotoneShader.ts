import { GLSL, Shaders } from "gl-react";

// DuotoneShader - maps image luminance to a gradient between two colors
export const DuotoneShader = Shaders.create({
  duotone: {
    frag: GLSL`
      precision highp float;
      varying vec2 uv;
      uniform sampler2D texture;
      uniform vec3 darkColor; // RGB for shadows
      uniform vec3 lightColor; // RGB for highlights
      uniform float contrast; // 0.0-1.0
      
      void main() {
        vec4 color = texture2D(texture, uv);
        
        // Extract luminance (brightness)
        float luminance = dot(color.rgb, vec3(0.299, 0.587, 0.114));
        
        // Apply contrast adjustment to luminance
        luminance = (luminance - 0.5) * (1.0 + contrast) + 0.5;
        luminance = clamp(luminance, 0.0, 1.0);
        
        // Mix between the two colors based on luminance
        vec3 duotoneColor = mix(darkColor, lightColor, luminance);
        
        // Preserve original alpha
        gl_FragColor = vec4(duotoneColor, color.a);
      }
    `,
  },
});

// Default uniform values (purple to yellow duotone)
export const DuotoneDefaults = {
  darkColor: [0.3, 0.15, 0.4], // Dark purple
  lightColor: [0.9, 0.8, 0.3], // Yellow
  contrast: 0.4,
};

// Preset color pairs
export const DuotonePresets = {
  purpleYellow: {
    darkColor: [0.3, 0.15, 0.4], // Dark purple
    lightColor: [0.9, 0.8, 0.3], // Yellow
  },
  bluePink: {
    darkColor: [0.1, 0.2, 0.4], // Dark blue
    lightColor: [0.9, 0.3, 0.5], // Pink
  },
  greenRed: {
    darkColor: [0.1, 0.3, 0.15], // Dark green
    lightColor: [0.9, 0.3, 0.2], // Red
  },
  cyanOrange: {
    darkColor: [0.15, 0.4, 0.4], // Cyan
    lightColor: [0.9, 0.5, 0.15], // Orange
  },
}; 