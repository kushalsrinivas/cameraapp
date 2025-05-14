import type { LutFilter } from "@/utils/lutUtils";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React from "react";
import {
  Dimensions,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface FilterTabProps {
  filters: LutFilter[];
  selectedFilterIndex: number;
  onSelectFilter: (index: number) => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const FILTER_ITEM_WIDTH = 80;

export default function FilterTab({
  filters,
  selectedFilterIndex,
  onSelectFilter,
}: FilterTabProps) {
  const handleFilterSelect = (index: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSelectFilter(index);
  };

  const renderFilterItem = ({
    item,
    index,
  }: {
    item: LutFilter;
    index: number;
  }) => {
    const isSelected = index === selectedFilterIndex;

    return (
      <TouchableOpacity
        style={[styles.filterItem, isSelected && styles.selectedFilterItem]}
        onPress={() => handleFilterSelect(index)}
        activeOpacity={0.7}
      >
        <View
          style={[
            styles.filterIconContainer,
            { backgroundColor: item.colorValue || "rgba(50, 50, 50, 0.5)" },
          ]}
        >
          <Ionicons
            name={
              (item.icon as keyof typeof Ionicons.glyphMap) || "image-outline"
            }
            size={24}
            color="#fff"
          />
        </View>
        <Text
          style={[styles.filterName, isSelected && styles.selectedFilterName]}
        >
          {item.displayName}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={filters}
        renderItem={renderFilterItem}
        keyExtractor={(item, index) => `filter-${item.name}-${index}`}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        snapToInterval={FILTER_ITEM_WIDTH + 10} // item width + padding
        decelerationRate="fast"
        initialScrollIndex={
          selectedFilterIndex > 0 ? selectedFilterIndex - 1 : 0
        }
        getItemLayout={(data, index) => ({
          length: FILTER_ITEM_WIDTH + 10,
          offset: (FILTER_ITEM_WIDTH + 10) * index,
          index,
        })}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 150,
    backgroundColor: "#111",
  },
  listContent: {
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  filterItem: {
    width: FILTER_ITEM_WIDTH,
    marginRight: 10,
    alignItems: "center",
  },
  selectedFilterItem: {
    // No visible style change needed here as we style child components
  },
  filterIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  filterName: {
    color: "#999",
    fontSize: 12,
    textAlign: "center",
  },
  selectedFilterName: {
    color: "#fff",
    fontWeight: "500",
  },
});
