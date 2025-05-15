import type { EditorAdjustments } from "@/types/editor";
import { Ionicons } from "@expo/vector-icons";
import Slider from "@react-native-community/slider";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface AdjustmentsTabProps {
  adjustments: EditorAdjustments;
  onAdjustmentChange: (key: keyof EditorAdjustments, value: number) => void;
}

// Define adjustment config with min, max and display info
interface AdjustmentConfig {
  key: keyof EditorAdjustments;
  label: string;
  icon: string;
  min: number;
  max: number;
  step: number;
  defaultValue: number;
  formatValue: (value: number) => string;
}

const ADJUSTMENTS_CONFIG: AdjustmentConfig[] = [
  {
    key: "exposure",
    label: "Exposure",
    icon: "sunny-outline",
    min: -3,
    max: 3,
    step: 0.1,
    defaultValue: 0,
    formatValue: (value) => `${value > 0 ? "+" : ""}${value.toFixed(1)} EV`,
  },
  {
    key: "brightness",
    label: "Brightness",
    icon: "contrast-outline",
    min: -100,
    max: 100,
    step: 1,
    defaultValue: 0,
    formatValue: (value) => `${value > 0 ? "+" : ""}${value}`,
  },
  {
    key: "contrast",
    label: "Contrast",
    icon: "remove-outline",
    min: -100,
    max: 100,
    step: 1,
    defaultValue: 0,
    formatValue: (value) => `${value > 0 ? "+" : ""}${value}`,
  },
  {
    key: "saturation",
    label: "Saturation",
    icon: "color-palette-outline",
    min: 0,
    max: 200,
    step: 1,
    defaultValue: 100,
    formatValue: (value) => `${value}%`,
  },
  {
    key: "temperature",
    label: "Temperature",
    icon: "thermometer-outline",
    min: -100,
    max: 100,
    step: 1,
    defaultValue: 0,
    formatValue: (value) =>
      value < 0
        ? `${Math.abs(value)} Cold`
        : value > 0
        ? `${value} Warm`
        : "Neutral",
  },
  {
    key: "fade",
    label: "Fade",
    icon: "water-outline",
    min: 0,
    max: 100,
    step: 1,
    defaultValue: 0,
    formatValue: (value) => `${value}%`,
  },
  {
    key: "highlights",
    label: "Highlights",
    icon: "sunny-outline",
    min: -100,
    max: 100,
    step: 1,
    defaultValue: 0,
    formatValue: (value) => `${value > 0 ? "+" : ""}${value}`,
  },
  {
    key: "shadows",
    label: "Shadows",
    icon: "moon-outline",
    min: -100,
    max: 100,
    step: 1,
    defaultValue: 0,
    formatValue: (value) => `${value > 0 ? "+" : ""}${value}`,
  },
  {
    key: "tint",
    label: "Tint",
    icon: "color-filter-outline",
    min: -100,
    max: 100,
    step: 1,
    defaultValue: 0,
    formatValue: (value) =>
      value < 0
        ? `${Math.abs(value)} Green`
        : value > 0
        ? `${value} Magenta`
        : "Neutral",
  },
  {
    key: "shadowsTint",
    label: "Shadows Tint",
    icon: "color-wand-outline",
    min: -100,
    max: 100,
    step: 1,
    defaultValue: 0,
    formatValue: (value) => `${value > 0 ? "+" : ""}${value}`,
  },
  {
    key: "blacks",
    label: "Blacks",
    icon: "contrast-outline",
    min: -100,
    max: 100,
    step: 1,
    defaultValue: 0,
    formatValue: (value) => `${value > 0 ? "+" : ""}${value}`,
  },
  {
    key: "whites",
    label: "Whites",
    icon: "sunny-outline",
    min: -100,
    max: 100,
    step: 1,
    defaultValue: 0,
    formatValue: (value) => `${value > 0 ? "+" : ""}${value}`,
  },
];

export default function AdjustmentsTab({
  adjustments,
  onAdjustmentChange,
}: AdjustmentsTabProps) {
  // Set active adjustment for focused interaction
  const [activeAdjustment, setActiveAdjustment] = useState<
    keyof EditorAdjustments | null
  >(null);

  // Handle value change with haptic feedback
  const handleValueChange = (key: keyof EditorAdjustments, value: number) => {
    onAdjustmentChange(key, value);

    // Only trigger haptics on slider complete to avoid too much feedback
    if (activeAdjustment === key) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  // Reset a specific adjustment to its default value
  const resetAdjustment = (adjustment: AdjustmentConfig) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onAdjustmentChange(adjustment.key, adjustment.defaultValue);
  };

  // Check if an adjustment has been modified from default
  const isAdjustmentModified = (config: AdjustmentConfig) => {
    return adjustments[config.key] !== config.defaultValue;
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.noteContainer}>
        <Ionicons name="information-circle-outline" size={16} color="#f39c12" />
        <Text style={styles.noteText}>
          Advanced adjustments are currently being optimized. Basic
          transformations (crop, flip, rotate) are fully functional.
        </Text>
      </View>

      {ADJUSTMENTS_CONFIG.map((config) => (
        <View key={config.key} style={styles.adjustmentRow}>
          <View style={styles.labelContainer}>
            <Ionicons
              name={config.icon as keyof typeof Ionicons.glyphMap}
              size={18}
              color="#ddd"
            />
            <Text style={styles.label}>{config.label}</Text>
            {isAdjustmentModified(config) && (
              <TouchableOpacity
                style={styles.resetButton}
                onPress={() => resetAdjustment(config)}
              >
                <Ionicons name="refresh-outline" size={16} color="#3498db" />
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.sliderContainer}>
            <Slider
              style={styles.slider}
              minimumValue={config.min}
              maximumValue={config.max}
              step={config.step}
              value={adjustments[config.key]}
              onValueChange={(value) => handleValueChange(config.key, value)}
              onSlidingStart={() => setActiveAdjustment(config.key)}
              onSlidingComplete={() => setActiveAdjustment(null)}
              minimumTrackTintColor="#3498db"
              maximumTrackTintColor="#333"
              thumbTintColor="#fff"
            />
          </View>

          <View style={styles.valueContainer}>
            <Text style={styles.valueText}>
              {config.formatValue(adjustments[config.key])}
            </Text>
          </View>
        </View>
      ))}

      {/* Add some extra padding at the bottom for scrolling */}
      <View style={styles.spacer} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#111",
  },
  adjustmentRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#222",
  },
  labelContainer: {
    width: 100,
    flexDirection: "row",
    alignItems: "center",
  },
  label: {
    color: "#ddd",
    fontSize: 14,
    marginLeft: 8,
  },
  resetButton: {
    marginLeft: 8,
    padding: 2,
  },
  sliderContainer: {
    flex: 1,
    marginHorizontal: 10,
  },
  slider: {
    height: 30,
  },
  valueContainer: {
    width: 60,
    alignItems: "flex-end",
  },
  valueText: {
    color: "#ddd",
    fontSize: 12,
  },
  spacer: {
    height: 40,
  },
  noteContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    backgroundColor: "rgba(243, 156, 18, 0.1)",
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  noteText: {
    color: "#ddd",
    fontSize: 12,
    marginLeft: 8,
    flex: 1,
  },
});
