import React, { useState } from "react";
import { Slider, StyleSheet, Text, View } from "react-native";
import FilterEngine from "./FilterEngine";
import ShaderFilterCarousel from "./ShaderFilterCarousel";

interface ShaderFilterDemoProps {
  imageUri: string;
  width?: number;
  height?: number;
}

/**
 * ShaderFilterDemo - Component to showcase the new shader-based filter system
 * Includes a filter carousel and parameter adjustment controls
 */
export default function ShaderFilterDemo({
  imageUri,
  width = 300,
  height = 400,
}: ShaderFilterDemoProps) {
  const [selectedFilterId, setSelectedFilterId] = useState("Normal");
  const [customUniforms, setCustomUniforms] = useState<Record<string, number>>(
    {}
  );

  // Handle filter selection
  const handleSelectFilter = (filterId: string) => {
    setSelectedFilterId(filterId);

    // Reset custom uniforms when changing filters
    setCustomUniforms({});
  };

  // Update shader uniforms based on slider changes
  const updateUniform = (name: string, value: number) => {
    setCustomUniforms((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Render filter-specific controls based on selected filter
  const renderFilterControls = () => {
    switch (selectedFilterId) {
      case "RetroCam":
        return (
          <View style={styles.controlsContainer}>
            <Text style={styles.controlLabel}>Grain Amount</Text>
            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={0.1}
              step={0.01}
              value={customUniforms.grainAmount ?? 0.03}
              onValueChange={(value) => updateUniform("grainAmount", value)}
            />

            <Text style={styles.controlLabel}>Vignette Intensity</Text>
            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={1}
              step={0.05}
              value={customUniforms.vignetteIntensity ?? 0.5}
              onValueChange={(value) =>
                updateUniform("vignetteIntensity", value)
              }
            />

            <Text style={styles.controlLabel}>Warmth</Text>
            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={1}
              step={0.05}
              value={customUniforms.warmth ?? 0.6}
              onValueChange={(value) => updateUniform("warmth", value)}
            />
          </View>
        );

      case "VHS":
        return (
          <View style={styles.controlsContainer}>
            <Text style={styles.controlLabel}>Noise Amount</Text>
            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={0.1}
              step={0.01}
              value={customUniforms.noiseAmount ?? 0.04}
              onValueChange={(value) => updateUniform("noiseAmount", value)}
            />

            <Text style={styles.controlLabel}>Scanline Intensity</Text>
            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={1}
              step={0.05}
              value={customUniforms.scanlineIntensity ?? 0.6}
              onValueChange={(value) =>
                updateUniform("scanlineIntensity", value)
              }
            />

            <Text style={styles.controlLabel}>Color Shift</Text>
            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={0.01}
              step={0.001}
              value={customUniforms.colorShiftAmount ?? 0.003}
              onValueChange={(value) =>
                updateUniform("colorShiftAmount", value)
              }
            />
          </View>
        );

      case "Glitch":
        return (
          <View style={styles.controlsContainer}>
            <Text style={styles.controlLabel}>Intensity</Text>
            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={1}
              step={0.05}
              value={customUniforms.intensity ?? 0.7}
              onValueChange={(value) => updateUniform("intensity", value)}
            />

            <Text style={styles.controlLabel}>Block Intensity</Text>
            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={1}
              step={0.05}
              value={customUniforms.blockIntensity ?? 0.6}
              onValueChange={(value) => updateUniform("blockIntensity", value)}
            />

            <Text style={styles.controlLabel}>RGB Shift</Text>
            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={0.05}
              step={0.005}
              value={customUniforms.rgbShiftAmount ?? 0.02}
              onValueChange={(value) => updateUniform("rgbShiftAmount", value)}
            />
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      {/* Filter preview */}
      <View style={styles.previewContainer}>
        <FilterEngine
          imageUri={imageUri}
          selectedFilterId={selectedFilterId}
          width={width}
          height={height}
          customUniforms={customUniforms}
        />
      </View>

      {/* Filter controls */}
      {renderFilterControls()}

      {/* Filter selection carousel */}
      <ShaderFilterCarousel
        selectedFilterId={selectedFilterId}
        onSelectFilter={handleSelectFilter}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  previewContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#111",
  },
  controlsContainer: {
    padding: 15,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
  },
  controlLabel: {
    color: "#fff",
    fontSize: 14,
    marginTop: 8,
  },
  slider: {
    width: "100%",
    height: 40,
  },
});
