import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

type EditorTab = "filters" | "adjustments" | "crop" | "effects" | "presets";

interface EditorToolbarProps {
  currentTab: EditorTab;
  onTabChange: (tab: EditorTab) => void;
  onShare: () => void;
  onSaveAsPreset: () => void;
}

export default function EditorToolbar({
  currentTab,
  onTabChange,
  onShare,
  onSaveAsPreset,
}: EditorToolbarProps) {
  // Function to handle tab change with haptic feedback
  const handleTabChange = (tab: EditorTab) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onTabChange(tab);
  };

  return (
    <View style={styles.container}>
      <View style={styles.tabContainer}>
        <TabButton
          icon="color-filter-outline"
          label="Filters"
          active={currentTab === "filters"}
          onPress={() => handleTabChange("filters")}
        />
        <TabButton
          icon="options-outline"
          label="Adjust"
          active={currentTab === "adjustments"}
          onPress={() => handleTabChange("adjustments")}
        />
        <TabButton
          icon="crop-outline"
          label="Crop"
          active={currentTab === "crop"}
          onPress={() => handleTabChange("crop")}
        />
        <TabButton
          icon="aperture-outline"
          label="Effects"
          active={currentTab === "effects"}
          onPress={() => handleTabChange("effects")}
        />
        <TabButton
          icon="bookmark-outline"
          label="Presets"
          active={currentTab === "presets"}
          onPress={() => handleTabChange("presets")}
        />
      </View>

      <View style={styles.actionButtons}>
        <TouchableOpacity style={styles.actionButton} onPress={onShare}>
          <Ionicons name="share-outline" size={22} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={onSaveAsPreset}>
          <Ionicons name="save-outline" size={22} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

// Tab Button Component
interface TabButtonProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  active: boolean;
  onPress: () => void;
}

function TabButton({ icon, label, active, onPress }: TabButtonProps) {
  return (
    <TouchableOpacity
      style={[styles.tab, active && styles.activeTab]}
      onPress={onPress}
    >
      <Ionicons name={icon} size={22} color={active ? "#3498db" : "#999"} />
      <Text style={[styles.tabLabel, active && styles.activeTabLabel]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#111",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderTopWidth: 1,
    borderTopColor: "#333",
  },
  tabContainer: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingRight: 10,
  },
  tab: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  activeTab: {
    backgroundColor: "rgba(52, 152, 219, 0.15)",
    borderRadius: 8,
  },
  tabLabel: {
    color: "#999",
    fontSize: 10,
    marginTop: 2,
  },
  activeTabLabel: {
    color: "#3498db",
    fontWeight: "500",
  },
  actionButtons: {
    flexDirection: "row",
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
});
