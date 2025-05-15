import { GLSL, Shaders } from "gl-react";

// Glitch shader - digital distortion with RGB shifts, blocks, and noise
export const GlitchShader = Shaders.create({
  glitch: {
    frag: GLSL`
      precision highp float;
      varying vec2 uv;
      uniform sampler2D texture;
      uniform float time; // For animated effects
      uniform float intensity; // 0.0-1.0
      uniform float blockIntensity; // 0.0-1.0
      uniform float rgbShiftAmount; // 0.0-0.05
      
      // Random and noise functions
      float random(vec2 p) {
        return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
      }
      
      float noise(vec2 p) {
        vec2 ip = floor(p);
        vec2 u = fract(p);
        u = u * u * (3.0 - 2.0 * u);
        
        float res = mix(
          mix(random(ip), random(ip + vec2(1.0, 0.0)), u.x),
          mix(random(ip + vec2(0.0, 1.0)), random(ip + vec2(1.0, 1.0)), u.x),
          u.y
        );
        return res * res;
      }
      
      void main() {
        // Create glitch blocks
        float blockNoise = pow(noise(floor(uv * 8.0) + floor(time * 2.0)), 1.0) * blockIntensity;
        
        // Shift UVs for blocks
        vec2 blockShift = vec2(
          mix(-0.05, 0.05, noise(vec2(time * 4.0, uv.y * 2.0))),
          mix(-0.05, 0.05, noise(vec2(time * 4.0, uv.x * 2.0)))
        ) * blockNoise * intensity;
        
        // Create glitch lines
        float lineNoise = step(0.96, noise(vec2(time * 5.0, uv.y * 48.0)));
        vec2 lineShift = vec2(
          mix(-0.1, 0.1, noise(vec2(time * 5.0, uv.y * 1.0))),
          0.0
        ) * lineNoise * intensity;
        
        // Apply RGB shift
        float rgbShift = rgbShiftAmount * intensity;
        float redShift = noise(vec2(time * 0.5, uv.y * 20.0)) * rgbShift;
        float blueShift = noise(vec2(time * 0.5 + 0.2, uv.y * 20.0)) * rgbShift;
        
        // Sample with distortions
        vec4 colorR = texture2D(texture, uv + blockShift + lineShift + vec2(redShift, 0.0));
        vec4 colorG = texture2D(texture, uv + blockShift + lineShift);
        vec4 colorB = texture2D(texture, uv + blockShift + lineShift - vec2(blueShift, 0.0));
        
        // Combine channels
        vec4 finalColor = vec4(colorR.r, colorG.g, colorB.b, 1.0);
        
        // Add digital noise
        float digitalNoise = noise(uv * 100.0 + time) * 0.02 * intensity;
        finalColor.rgb += digitalNoise;
        
        // Ensure values are in valid range
        finalColor.rgb = clamp(finalColor.rgb, 0.0, 1.0);
        
        gl_FragColor = finalColor;
      }
    `,
  },
});

// Default uniform values
export const GlitchDefaults = {
  time: 0.0, // This should be updated in animation frame
  intensity: 0.7,
  blockIntensity: 0.6,
  rgbShiftAmount: 0.02,
}; 