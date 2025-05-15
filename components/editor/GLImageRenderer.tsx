import type { EditorAdjustments, GLImageRendererRef } from "@/types/editor";
import type { LutFilter } from "@/utils/lutUtils";
import { GLSL, Node, Shaders } from "gl-react";
import { Surface } from "gl-react-expo";
import type React from "react";
import { forwardRef, useImperativeHandle, useMemo, useRef } from "react";
import { Dimensions, View } from "react-native";

interface GLImageRendererProps {
  uri: string;
  lut?: LutFilter;
  adjustments: EditorAdjustments;
  width?: number;
  height?: number;
}

// Define the shader for image adjustments
const shaders = Shaders.create({
  imageFx: {
    // Fragment shader for image processing
    frag: GLSL`
      precision highp float;
      varying vec2 uv;
      uniform sampler2D inputImage;
      uniform sampler2D lutTexture;
      uniform bool hasLut;
      uniform float lutSize;
      
      // Adjustment uniforms
      uniform float exposure;
      uniform float brightness;
      uniform float contrast;
      uniform float saturation;
      uniform float temperature;
      uniform float fade;
      uniform float highlights;
      uniform float shadows;
      uniform float grain;
      uniform float vignette;
      uniform float tint;
      uniform float shadowsTint;
      uniform float blacks;
      uniform float whites;
      
      // Noise function for grain effect
      float rand(vec2 co) {
        return fract(sin(dot(co.xy, vec2(12.9898, 78.233))) * 43758.5453);
      }
      
      // Color temperature adjustment
      vec3 adjustTemperature(vec3 color, float temperature) {
        // Convert from -100 to +100 range to a multiplier
        float t = temperature / 100.0;
        
        // Apply blue-yellow shift
        if (t > 0.0) {
          // Warmer (more yellow)
          color.r += t * 0.2;
          color.g += t * 0.1;
          color.b -= t * 0.2;
        } else {
          // Cooler (more blue)
          float tb = -t;
          color.r -= tb * 0.2;
          color.g -= tb * 0.1;
          color.b += tb * 0.2;
        }
        
        return color;
      }
      
      // Apply LUT
      vec3 applyLUT(vec3 color, sampler2D lut, float lutSize) {
        float sliceSize = 1.0 / lutSize;
        float slicePixelSize = sliceSize / lutSize;
        float sliceInnerSize = slicePixelSize * (lutSize - 1.0);
        
        float cell = color.b * (lutSize * lutSize - 1.0);
        float blueCellRow = floor(cell / lutSize);
        float blueCellCol = cell - blueCellRow * lutSize;
        
        vec2 blueUV = vec2(
          (blueCellCol + color.r * (sliceSize - slicePixelSize)) / lutSize,
          (blueCellRow + color.g * (sliceSize - slicePixelSize)) / lutSize
        );
        
        return texture2D(lut, blueUV).rgb;
      }
      
      // Tint adjustment
      vec3 adjustTint(vec3 color, float tintValue) {
        // Convert from -100 to +100 range to a multiplier
        float t = tintValue / 100.0;
        
        // Apply green-magenta shift
        if (t > 0.0) {
          // More magenta
          color.r += t * 0.1;
          color.g -= t * 0.1;
          color.b += t * 0.1;
        } else {
          // More green
          float tg = -t;
          color.r -= tg * 0.1;
          color.g += tg * 0.1;
          color.b -= tg * 0.1;
        }
        
        return color;
      }
      
      // Main shader function
      void main() {
        // Sample original image
        vec3 color = texture2D(inputImage, uv).rgb;
        
        // Exposure adjustment (applied first, in EV)
        color *= pow(2.0, exposure);
        
        // Apply brightness
        color += brightness / 100.0;
        
        // Apply contrast
        if (contrast != 0.0) {
          float contrastFactor = (100.0 + contrast) / 100.0;
          vec3 grayValue = vec3(0.5);
          color = (color - grayValue) * contrastFactor + grayValue;
        }
        
        // Apply saturation
        if (saturation != 100.0) {
          float luminance = dot(color, vec3(0.2126, 0.7152, 0.0722));
          color = mix(vec3(luminance), color, saturation / 100.0);
        }
        
        // Apply temperature
        color = adjustTemperature(color, temperature);
        
        // Apply tint
        color = adjustTint(color, tint);
        
        // Apply fade
        if (fade > 0.0) {
          vec3 fadeColor = vec3(0.8, 0.8, 0.8); // Slightly warm fade
          color = mix(color, fadeColor, fade / 100.0);
        }
        
        // Apply highlights and shadows
        if (highlights != 0.0) {
          float highValue = (highlights / 100.0) * 0.3;
          vec3 highlightsAdjust = vec3(1.0 + highValue);
          
          // Apply only to brighter areas
          float luminance = dot(color, vec3(0.2126, 0.7152, 0.0722));
          float highlightsMask = smoothstep(0.5, 1.0, luminance);
          color = mix(color, color * highlightsAdjust, highlightsMask);
        }
        
        if (shadows != 0.0) {
          float shadowValue = (shadows / 100.0) * 0.3;
          vec3 shadowsAdjust = vec3(1.0 + shadowValue);
          
          // Apply only to darker areas
          float luminance = dot(color, vec3(0.2126, 0.7152, 0.0722));
          float shadowsMask = 1.0 - smoothstep(0.0, 0.5, luminance);
          color = mix(color, color * shadowsAdjust, shadowsMask);
        }
        
        // Apply shadows tint
        if (shadowsTint != 0.0) {
          float tintValue = shadowsTint / 100.0;
          vec3 tintColor;
          
          if (tintValue > 0.0) {
            // Warm shadows
            tintColor = vec3(1.0 + tintValue * 0.2, 1.0, 1.0 - tintValue * 0.1);
          } else {
            // Cool shadows
            float coolValue = -tintValue;
            tintColor = vec3(1.0 - coolValue * 0.1, 1.0, 1.0 + coolValue * 0.2);
          }
          
          float luminance = dot(color, vec3(0.2126, 0.7152, 0.0722));
          float shadowsMask = 1.0 - smoothstep(0.0, 0.5, luminance);
          color = mix(color, color * tintColor, shadowsMask * abs(tintValue));
        }
        
        // Apply blacks and whites
        if (blacks != 0.0) {
          float blacksValue = blacks / 100.0 * 0.2;
          color = mix(color, vec3(0.0), blacksValue);
        }
        
        if (whites != 0.0) {
          float whitesValue = whites / 100.0 * 0.2;
          float luminance = dot(color, vec3(0.2126, 0.7152, 0.0722));
          float whitesMask = smoothstep(0.7, 1.0, luminance);
          color = mix(color, vec3(1.0), whitesMask * whitesValue);
        }
        
        // Apply LUT if provided
        if (hasLut) {
          color = applyLUT(color, lutTexture, lutSize);
        }
        
        // Apply grain
        if (grain > 0.0) {
          float grainAmount = grain / 100.0 * 0.2;
          float grainNoise = rand(uv + vec2(fract(sin(12.9898)), fract(cos(78.233))));
          color = mix(color, color * vec3(grainNoise), grainAmount);
        }
        
        // Apply vignette
        if (vignette > 0.0) {
          float vignetteAmount = vignette / 100.0;
          float dist = distance(uv, vec2(0.5));
          float vignetteFactor = 1.0 - smoothstep(0.5, 1.2, dist * (1.0 + vignetteAmount));
          color *= mix(1.0, vignetteFactor, vignetteAmount);
        }
        
        // Output final color
        gl_FragColor = vec4(clamp(color, 0.0, 1.0), 1.0);
      }
    `,
  },
});

// Define an interface for the ImageShader props
interface ImageShaderProps {
  uri: string;
  adjustments: EditorAdjustments;
  lut?: LutFilter;
}

// Create a shader component with memoization to improve performance
const ImageShader: React.FC<ImageShaderProps> = ({ uri, adjustments, lut }) => {
  // Memoize the uniforms to prevent unnecessary re-renders
  const uniforms = useMemo(() => {
    const result = {
      inputImage: { uri },
      ...adjustments,
      hasLut: !!lut,
    };

    if (lut) {
      result.lutTexture = { uri: lut.imageUri };
      result.lutSize = lut.size || 8;
    }

    return result;
  }, [uri, adjustments, lut]);

  return <Node shader={shaders.imageFx} uniforms={uniforms} />;
};

// Main component with forwardRef to expose the capture method
const GLImageRenderer = forwardRef<GLImageRendererRef, GLImageRendererProps>(
  ({ uri, lut, adjustments, width, height }, ref) => {
    const screenWidth = Dimensions.get("window").width;
    const screenHeight = Dimensions.get("window").height;

    // Use provided dimensions or default to screen size
    const renderWidth = width || screenWidth;
    const renderHeight = height || screenHeight * 0.6;

    // Reference to the GL Surface with correct typing
    const surfaceRef = useRef<{ captureAsURI?: () => Promise<string> }>(null);

    // Expose the capture method to the parent component
    useImperativeHandle(ref, () => ({
      capture: async () => {
        if (
          surfaceRef.current &&
          typeof surfaceRef.current.captureAsURI === "function"
        ) {
          try {
            // Capture the current GL render as a URI
            const uri = await surfaceRef.current.captureAsURI();
            return uri;
          } catch (error) {
            console.error("Error capturing GL renderer:", error);
            throw error;
          }
        } else {
          console.error("GL Surface ref or captureAsURI method not available");
          throw new Error("Unable to capture image");
        }
      },
    }));

    // Wrap in a View to handle any overflow issues
    return (
      <View style={{ width: renderWidth, height: renderHeight }}>
        <Surface
          ref={surfaceRef}
          style={{ width: renderWidth, height: renderHeight }}
        >
          <ImageShader uri={uri} adjustments={adjustments} lut={lut} />
        </Surface>
      </View>
    );
  }
);

// Set display name for debugging
GLImageRenderer.displayName = "GLImageRenderer";

export default GLImageRenderer;
