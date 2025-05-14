import type { AspectRatio, CropParams } from "@/types/editor";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface CropRotateTabProps {
  cropParams: CropParams;
  onCropParamsChange: (params: CropParams) => void;
}

const ASPECT_RATIOS: { label: string; value: AspectRatio; icon: string }[] = [
  { label: "Freeform", value: "freeform", icon: "crop-outline" },
  { label: "Square", value: "1:1", icon: "square-outline" },
  { label: "4:3", value: "4:3", icon: "phone-portrait-outline" },
  { label: "16:9", value: "16:9", icon: "tv-outline" },
  { label: "Cinematic", value: "2.35:1", icon: "film-outline" },
];

export default function CropRotateTab({
  cropParams,
  onCropParamsChange,
}: CropRotateTabProps) {
  // Handle rotation left (counterclockwise)
  const rotateLeft = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const newRotation = (cropParams.rotation - 90) % 360;
    onCropParamsChange({ ...cropParams, rotation: newRotation });
  };

  // Handle rotation right (clockwise)
  const rotateRight = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const newRotation = (cropParams.rotation + 90) % 360;
    onCropParamsChange({ ...cropParams, rotation: newRotation });
  };

  // Handle horizontal flip
  const toggleHorizontalFlip = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onCropParamsChange({
      ...cropParams,
      flipHorizontal: !cropParams.flipHorizontal,
    });
  };

  // Handle vertical flip
  const toggleVerticalFlip = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onCropParamsChange({
      ...cropParams,
      flipVertical: !cropParams.flipVertical,
    });
  };

  // Change aspect ratio
  const setAspectRatio = (ratio: AspectRatio) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // For this implementation, we're just storing the aspect ratio
    // In a real app, you'd recalculate the crop rectangle here based on the ratio
    onCropParamsChange({
      ...cropParams,
      aspectRatio: ratio,
    });
  };

  // Reset crop to original dimensions
  const resetCrop = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onCropParamsChange({
      crop: { originX: 0, originY: 0, width: 1, height: 1 },
      rotation: 0,
      flipHorizontal: false,
      flipVertical: false,
      aspectRatio: "freeform",
    });
  };

  return (
    <View style={styles.container}>
      {/* Rotation and flip controls */}
      <View style={styles.controlsRow}>
        <TouchableOpacity style={styles.controlButton} onPress={rotateLeft}>
          <Ionicons name="refresh-outline" size={24} color="#fff" />
          <Text style={styles.controlLabel}>Rotate Left</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.controlButton} onPress={rotateRight}>
          <Ionicons
            name="refresh-outline"
            size={24}
            color="#fff"
            style={{ transform: [{ scaleX: -1 }] }}
          />
          <Text style={styles.controlLabel}>Rotate Right</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.controlButton,
            cropParams.flipHorizontal && styles.activeControl,
          ]}
          onPress={toggleHorizontalFlip}
        >
          <Ionicons
            name="swap-horizontal-outline"
            size={24}
            color={cropParams.flipHorizontal ? "#3498db" : "#fff"}
          />
          <Text
            style={[
              styles.controlLabel,
              cropParams.flipHorizontal && styles.activeLabel,
            ]}
          >
            Flip H
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.controlButton,
            cropParams.flipVertical && styles.activeControl,
          ]}
          onPress={toggleVerticalFlip}
        >
          <Ionicons
            name="swap-vertical-outline"
            size={24}
            color={cropParams.flipVertical ? "#3498db" : "#fff"}
          />
          <Text
            style={[
              styles.controlLabel,
              cropParams.flipVertical && styles.activeLabel,
            ]}
          >
            Flip V
          </Text>
        </TouchableOpacity>
      </View>

      {/* Aspect ratio selection */}
      <Text style={styles.sectionTitle}>Aspect Ratio</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.aspectRatioContainer}
      >
        {ASPECT_RATIOS.map((ratio) => (
          <TouchableOpacity
            key={ratio.value}
            style={[
              styles.aspectRatioButton,
              cropParams.aspectRatio === ratio.value &&
                styles.activeAspectRatio,
            ]}
            onPress={() => setAspectRatio(ratio.value)}
          >
            <Ionicons
              name={ratio.icon as keyof typeof Ionicons.glyphMap}
              size={20}
              color={
                cropParams.aspectRatio === ratio.value ? "#3498db" : "#ddd"
              }
            />
            <Text
              style={[
                styles.aspectRatioLabel,
                cropParams.aspectRatio === ratio.value &&
                  styles.activeAspectRatioLabel,
              ]}
            >
              {ratio.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Reset button */}
      <View style={styles.resetContainer}>
        <TouchableOpacity style={styles.resetButton} onPress={resetCrop}>
          <Ionicons name="refresh-circle-outline" size={20} color="#3498db" />
          <Text style={styles.resetLabel}>Reset Crop</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#111",
    height: "100%",
    padding: 10,
  },
  controlsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
    paddingHorizontal: 5,
  },
  controlButton: {
    alignItems: "center",
    justifyContent: "center",
    padding: 8,
    borderRadius: 8,
    backgroundColor: "rgba(50, 50, 50, 0.5)",
    width: 80,
  },
  activeControl: {
    backgroundColor: "rgba(52, 152, 219, 0.2)",
  },
  controlLabel: {
    color: "#ddd",
    fontSize: 12,
    marginTop: 5,
  },
  activeLabel: {
    color: "#3498db",
  },
  sectionTitle: {
    color: "#ddd",
    fontSize: 14,
    marginTop: 15,
    marginBottom: 8,
    paddingHorizontal: 5,
  },
  aspectRatioContainer: {
    flexDirection: "row",
    paddingVertical: 5,
  },
  aspectRatioButton: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: "rgba(50, 50, 50, 0.5)",
    marginRight: 10,
  },
  activeAspectRatio: {
    backgroundColor: "rgba(52, 152, 219, 0.2)",
  },
  aspectRatioLabel: {
    color: "#ddd",
    fontSize: 12,
    marginTop: 5,
  },
  activeAspectRatioLabel: {
    color: "#3498db",
  },
  resetContainer: {
    alignItems: "center",
    marginTop: 15,
  },
  resetButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
    borderRadius: 20,
    backgroundColor: "rgba(52, 152, 219, 0.1)",
  },
  resetLabel: {
    color: "#3498db",
    fontSize: 14,
    marginLeft: 5,
  },
});
