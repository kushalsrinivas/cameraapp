import { GLSL, Shaders } from "gl-react";

// VHS shader - vintage VHS tape look with scanlines, noise, and color bleeding
export const VHSShader = Shaders.create({
  vhs: {
    frag: GLSL`
      precision highp float;
      varying vec2 uv;
      uniform sampler2D texture;
      uniform float time; // For animated effects
      uniform float noiseAmount; // 0.0-0.1
      uniform float scanlineIntensity; // 0.0-1.0
      uniform float colorShiftAmount; // 0.0-0.01
      
      // Random function for noise
      float random(vec2 p) {
        return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
      }
      
      void main() {
        // Add VHS tracking distortion
        float distortion = sin(uv.y * 30.0 + time) * 0.001;
        vec2 uv_distorted = vec2(uv.x + distortion, uv.y);
        
        // Add color channel shifting/bleeding (RGB shift)
        vec4 colorR = texture2D(texture, uv_distorted + vec2(colorShiftAmount, 0.0));
        vec4 colorG = texture2D(texture, uv_distorted);
        vec4 colorB = texture2D(texture, uv_distorted - vec2(colorShiftAmount, 0.0));
        
        vec4 color = vec4(colorR.r, colorG.g, colorB.b, 1.0);
        
        // Add VHS noise
        float noise = random(uv * time) * noiseAmount;
        
        // Add scanlines
        float scanline = sin(uv.y * 120.0) * 0.03 * scanlineIntensity;
        
        // Mix in the effects
        color.rgb = color.rgb - scanline;
        color.rgb = color.rgb + noise;
        
        // Add slight contrast and saturation adjustments
        vec3 gray = vec3(dot(color.rgb, vec3(0.299, 0.587, 0.114)));
        color.rgb = mix(gray, color.rgb, 1.2); // Boost saturation slightly
        color.rgb = (color.rgb - 0.5) * 1.2 + 0.5; // Boost contrast
        
        // Ensure values are in valid range
        color.rgb = clamp(color.rgb, 0.0, 1.0);
        
        gl_FragColor = color;
      }
    `,
  },
});

// Default uniform values
export const VHSDefaults = {
  time: 0.0, // This should be updated in animation frame
  noiseAmount: 0.04,
  scanlineIntensity: 0.6,
  colorShiftAmount: 0.003,
}; 