import { FILTER_METADATA } from "@/filters";
import React, { useState } from "react";
import { StyleSheet, View } from "react-native";
import ShaderFilterImage from "./ShaderFilterImage";

interface FilterEngineProps {
  imageUri: string;
  selectedFilterId: string;
  width?: number;
  height?: number;
  customUniforms?: Record<string, unknown>;
  onFilterProcessed?: () => void;
}

/**
 * FilterEngine - Main component for applying shader-based filters to images
 * Uses the shader registry to apply the appropriate filter effect to the provided image
 */
export default function FilterEngine({
  imageUri,
  selectedFilterId = "Normal",
  width = 300,
  height = 300,
  customUniforms = {},
  onFilterProcessed,
}: FilterEngineProps) {
  const [isProcessing, setIsProcessing] = useState(false);

  // Find the selected filter's metadata
  const filterMeta =
    FILTER_METADATA.find((filter) => filter.id === selectedFilterId) ||
    FILTER_METADATA[0];

  const handleFilterApplied = () => {
    setIsProcessing(false);
    if (onFilterProcessed) {
      onFilterProcessed();
    }
  };

  return (
    <View style={[styles.container, { width, height }]}>
      {/* Use the new ShaderFilterImage component with the selected filter */}
      <ShaderFilterImage
        imageUri={imageUri}
        filterId={selectedFilterId}
        width={width}
        height={height}
        customUniforms={customUniforms}
        onFilterApplied={handleFilterApplied}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: "hidden",
    backgroundColor: "#000",
  },
});
