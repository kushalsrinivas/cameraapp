import type { UserPreset } from "@/types/editor";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import React from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface PresetsTabProps {
  presets: UserPreset[];
  onApplyPreset: (preset: UserPreset) => void;
  onAddNewPreset: () => void;
}

export default function PresetsTab({
  presets,
  onApplyPreset,
  onAddNewPreset,
}: PresetsTabProps) {
  // Apply a preset with haptic feedback
  const handleApplyPreset = (preset: UserPreset) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onApplyPreset(preset);
  };

  // Add new preset
  const handleAddNewPreset = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onAddNewPreset();
  };

  // Render a preset item in the grid
  const renderPresetItem = ({ item }: { item: UserPreset }) => (
    <TouchableOpacity
      style={styles.presetItem}
      onPress={() => handleApplyPreset(item)}
      activeOpacity={0.7}
    >
      <Image
        source={{ uri: item.previewImageUri }}
        style={styles.presetImage}
        contentFit="cover"
      />
      <View style={styles.presetNameContainer}>
        <Text style={styles.presetName} numberOfLines={1}>
          {item.name}
        </Text>
      </View>
    </TouchableOpacity>
  );

  // Render the "add new" button
  const renderAddNewItem = () => (
    <TouchableOpacity
      style={[styles.presetItem, styles.addNewItem]}
      onPress={handleAddNewPreset}
      activeOpacity={0.7}
    >
      <View style={styles.addIconContainer}>
        <Ionicons name="add-circle-outline" size={32} color="#3498db" />
      </View>
      <Text style={styles.addNewText}>Save New Preset</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {presets.length === 0 ? (
        // No presets yet
        <View style={styles.emptyContainer}>
          <Ionicons name="bookmarks-outline" size={48} color="#666" />
          <Text style={styles.emptyText}>No presets saved yet</Text>
          <Text style={styles.emptySubtext}>
            Save your current adjustments as a preset to quickly apply them
            later.
          </Text>
          <TouchableOpacity
            style={styles.emptyButton}
            onPress={handleAddNewPreset}
          >
            <Text style={styles.emptyButtonText}>Save Current Settings</Text>
          </TouchableOpacity>
        </View>
      ) : (
        // Show presets grid
        <FlatList
          data={[...presets, { id: "add-new", name: "Add New" } as UserPreset]}
          renderItem={({ item, index }) =>
            index === presets.length
              ? renderAddNewItem()
              : renderPresetItem({ item })
          }
          keyExtractor={(item) => item.id}
          numColumns={3}
          contentContainerStyle={styles.gridContainer}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#111",
  },
  gridContainer: {
    paddingHorizontal: 8,
    paddingVertical: 10,
  },
  presetItem: {
    flex: 1 / 3,
    aspectRatio: 0.9,
    margin: 4,
    borderRadius: 8,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#333",
  },
  presetImage: {
    width: "100%",
    height: "75%",
  },
  presetNameContainer: {
    height: "25%",
    backgroundColor: "#222",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 5,
  },
  presetName: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "500",
    textAlign: "center",
  },
  addNewItem: {
    backgroundColor: "rgba(52, 152, 219, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    borderStyle: "dashed",
  },
  addIconContainer: {
    marginBottom: 8,
  },
  addNewText: {
    color: "#3498db",
    fontSize: 12,
    fontWeight: "500",
    textAlign: "center",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  emptyText: {
    color: "#ddd",
    fontSize: 18,
    marginTop: 10,
  },
  emptySubtext: {
    color: "#999",
    fontSize: 14,
    textAlign: "center",
    marginTop: 10,
    marginBottom: 20,
  },
  emptyButton: {
    backgroundColor: "rgba(52, 152, 219, 0.2)",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#3498db",
  },
  emptyButtonText: {
    color: "#3498db",
    fontSize: 14,
    fontWeight: "500",
  },
});
