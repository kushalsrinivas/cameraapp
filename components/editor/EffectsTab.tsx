import { Ionicons } from "@expo/vector-icons";
import Slider from "@react-native-community/slider";
import * as Haptics from "expo-haptics";
import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

interface EffectsTabProps {
  effects: {
    grain: number;
    vignette: number;
  };
  onEffectChange: (key: "grain" | "vignette", value: number) => void;
}

// Effect types
const EFFECTS = [
  {
    key: "grain" as const,
    label: "Film Grain",
    icon: "contrast-outline",
    description: "Adds realistic film grain texture",
    min: 0,
    max: 100,
    step: 1,
  },
  {
    key: "vignette" as const,
    label: "Vignette",
    icon: "radio-outline",
    description: "Darkens the edges of the image",
    min: 0,
    max: 100,
    step: 1,
  },
];

export default function EffectsTab({
  effects,
  onEffectChange,
}: EffectsTabProps) {
  // Handle value change with haptic feedback
  const handleValueChange = (key: "grain" | "vignette", value: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onEffectChange(key, value);
  };

  return (
    <ScrollView style={styles.container}>
      {EFFECTS.map((effect) => (
        <View key={effect.key} style={styles.effectContainer}>
          <View style={styles.effectHeader}>
            <Ionicons
              name={effect.icon as keyof typeof Ionicons.glyphMap}
              size={24}
              color="#ddd"
            />
            <View style={styles.effectTitleContainer}>
              <Text style={styles.effectTitle}>{effect.label}</Text>
              <Text style={styles.effectDescription}>{effect.description}</Text>
            </View>
            <Text style={styles.effectValue}>{effects[effect.key]}%</Text>
          </View>

          <View style={styles.sliderContainer}>
            <Slider
              style={styles.slider}
              minimumValue={effect.min}
              maximumValue={effect.max}
              step={effect.step}
              value={effects[effect.key]}
              onValueChange={(value) => handleValueChange(effect.key, value)}
              minimumTrackTintColor="#3498db"
              maximumTrackTintColor="#333"
              thumbTintColor="#fff"
            />
            <View style={styles.sliderLabels}>
              <Text style={styles.sliderLabel}>None</Text>
              <Text style={styles.sliderLabel}>Max</Text>
            </View>
          </View>
        </View>
      ))}

      {/* Sample effect presets */}
      <View style={styles.presetsContainer}>
        <Text style={styles.presetsTitle}>Effect Presets</Text>
        <View style={styles.presetButtonsContainer}>
          <View style={styles.presetButton}>
            <Ionicons name="film-outline" size={20} color="#fff" />
            <Text style={styles.presetLabel}>Vintage</Text>
          </View>
          <View style={styles.presetButton}>
            <Ionicons name="contrast-outline" size={20} color="#fff" />
            <Text style={styles.presetLabel}>Grainy</Text>
          </View>
          <View style={styles.presetButton}>
            <Ionicons name="radio-outline" size={20} color="#fff" />
            <Text style={styles.presetLabel}>Dark Edges</Text>
          </View>
          <View style={styles.presetButton}>
            <Ionicons name="color-filter-outline" size={20} color="#fff" />
            <Text style={styles.presetLabel}>Film</Text>
          </View>
        </View>
      </View>

      {/* Note: The preset buttons above are just for UI display
          In a real implementation, they would be TouchableOpacity components
          with onPress handlers to apply specific preset combinations */}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#111",
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  effectContainer: {
    marginBottom: 20,
  },
  effectHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  effectTitleContainer: {
    flex: 1,
    marginLeft: 10,
  },
  effectTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "500",
  },
  effectDescription: {
    color: "#999",
    fontSize: 12,
    marginTop: 2,
  },
  effectValue: {
    color: "#3498db",
    fontSize: 16,
    fontWeight: "500",
  },
  sliderContainer: {
    paddingHorizontal: 5,
  },
  slider: {
    width: "100%",
    height: 40,
  },
  sliderLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 5,
    marginTop: -10,
  },
  sliderLabel: {
    color: "#999",
    fontSize: 12,
  },
  presetsContainer: {
    marginTop: 10,
    marginBottom: 20,
  },
  presetsTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 10,
  },
  presetButtonsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    flexWrap: "wrap",
  },
  presetButton: {
    backgroundColor: "rgba(50, 50, 50, 0.8)",
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    alignItems: "center",
    width: "23%",
  },
  presetLabel: {
    color: "#ddd",
    fontSize: 11,
    marginTop: 5,
  },
});
