import { GLSL, Shaders } from "gl-react";

// RetroCam shader - gives a vintage film look with grain, vignette, and warm tones
export const RetroCamShader = Shaders.create({
  retroCam: {
    frag: GLSL`
      precision highp float;
      varying vec2 uv;
      uniform sampler2D texture;
      uniform float grainAmount; // 0.0-0.1
      uniform float vignetteIntensity; // 0.0-1.0
      uniform float warmth; // 0.0-1.0
      
      // Random function for film grain
      float random(vec2 p) {
        return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
      }
      
      void main() {
        vec2 center = vec2(0.5, 0.5);
        
        // Apply vignette
        float dist = distance(uv, center);
        float vignette = smoothstep(0.4, 1.4, dist);
        
        // Sample original color
        vec4 color = texture2D(texture, uv);
        
        // Add film grain
        float grain = random(uv * 12.0) * grainAmount;
        
        // Apply color adjustments for "vintage" look
        // Boost red/yellow channels, slightly reduce blue
        color.r = color.r + color.r * warmth * 0.1;
        color.g = color.g + color.g * warmth * 0.05;
        color.b = color.b - color.b * warmth * 0.05;
        
        // Apply slight contrast boost
        color.rgb = (color.rgb - 0.5) * 1.1 + 0.5;
        
        // Apply vignette effect
        color.rgb = mix(color.rgb, color.rgb * (1.0 - vignette * vignetteIntensity), 0.8);
        
        // Add grain
        color.rgb += vec3(grain);
        
        // Ensure values are in valid range
        color.rgb = clamp(color.rgb, 0.0, 1.0);
        
        gl_FragColor = color;
      }
    `,
  },
});

// Default uniform values
export const RetroCamDefaults = {
  grainAmount: 0.03,
  vignetteIntensity: 0.5,
  warmth: 0.6,
}; 