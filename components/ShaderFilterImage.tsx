import { FILTER_SHADER_MAP } from "@/filters";
import { DuotoneDefaults } from "@/filters/shaders/DuotoneShader";
import { FujiDefaults } from "@/filters/shaders/FujiShader";
import { GlitchDefaults } from "@/filters/shaders/GlitchShader";
import { RetroCamDefaults } from "@/filters/shaders/RetroCamShader";
import { VHSDefaults } from "@/filters/shaders/VHSShader";
import { Node } from "gl-react";
import { Surface } from "gl-react-expo";
import React, { useEffect, useRef, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";

// Map filter IDs to their default uniform values
const FILTER_DEFAULTS = {
  RetroCam: RetroCamDefaults,
  VHS: VHSDefaults,
  Glitch: GlitchDefaults,
  FujiFilm: FujiDefaults,
  Duotone: DuotoneDefaults,
};

// Component props
interface ShaderFilterImageProps {
  imageUri: string;
  filterId: string;
  width?: number;
  height?: number;
  customUniforms?: Record<string, unknown>;
  onFilterApplied?: () => void;
}

export default function ShaderFilterImage({
  imageUri,
  filterId = "Normal",
  width = 300,
  height = 300,
  customUniforms = {},
  onFilterApplied,
}: ShaderFilterImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [time, setTime] = useState(0);
  const surfaceRef = useRef(null);
  const animationRef = useRef<number | null>(null);

  // Handle time-based animation for filters that need it
  useEffect(() => {
    // Only animate time-based filters
    const needsAnimation = ["VHS", "Glitch"].includes(filterId);

    if (needsAnimation) {
      const startTime = Date.now();

      const animate = () => {
        const now = Date.now();
        const elapsed = (now - startTime) / 1000; // seconds
        setTime(elapsed);
        animationRef.current = requestAnimationFrame(animate);
      };

      animationRef.current = requestAnimationFrame(animate);

      return () => {
        if (animationRef.current !== null) {
          cancelAnimationFrame(animationRef.current);
        }
      };
    }
  }, [filterId]);

  // Handle image loading
  useEffect(() => {
    setIsLoading(true);

    // Small delay to ensure the surface is ready
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 300);

    return () => clearTimeout(timer);
  }, []);

  // Select shader based on filter ID
  const getFilterShader = () => {
    if (filterId === "Normal" || !FILTER_SHADER_MAP[filterId]) {
      // For normal filter, just pass through the image
      return ({ children }) => children;
    }

    // Return the appropriate shader component
    return FILTER_SHADER_MAP[filterId];
  };

  // Combine default uniforms with custom overrides
  const getUniforms = () => {
    const defaults = FILTER_DEFAULTS[filterId] || {};
    const timeUniforms = ["VHS", "Glitch"].includes(filterId) ? { time } : {};

    return {
      ...defaults,
      ...timeUniforms,
      ...customUniforms,
      texture: imageUri, // All shaders use 'texture' as the image uniform
    };
  };

  return (
    <View style={[styles.container, { width, height }]}>
      {isLoading ? (
        <ActivityIndicator size="large" color="#0000ff" />
      ) : (
        <Surface
          ref={surfaceRef}
          style={{ width, height }}
          onLoad={() => {
            setIsLoading(false);
            onFilterApplied?.();
          }}
        >
          {filterId === "Normal" ? (
            <Node
              shader={{
                frag: "precision highp float; varying vec2 uv; uniform sampler2D texture; void main() { gl_FragColor = texture2D(texture, uv); }",
              }}
              uniforms={{ texture: imageUri }}
            />
          ) : (
            <Node
              shader={getFilterShader()[Object.keys(getFilterShader())[0]]}
              uniforms={getUniforms()}
            />
          )}
        </Surface>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000",
  },
});
