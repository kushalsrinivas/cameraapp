import { FILTER_METADATA } from "@/filters";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useRef } from "react";
import {
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface ShaderFilterCarouselProps {
  selectedFilterId: string;
  onSelectFilter: (filterId: string) => void;
}

/**
 * ShaderFilterCarousel - UI component for selecting shader-based filters
 */
export default function ShaderFilterCarousel({
  selectedFilterId = "Normal",
  onSelectFilter,
}: ShaderFilterCarouselProps) {
  const scrollViewRef = useRef<ScrollView>(null);
  const itemWidth = 80;
  const screenWidth = Dimensions.get("window").width;

  // Find the index of the selected filter
  const selectedIndex = FILTER_METADATA.findIndex(
    (filter) => filter.id === selectedFilterId
  );

  // Scroll to the selected filter when it changes
  useEffect(() => {
    if (scrollViewRef.current && selectedIndex >= 0) {
      scrollViewRef.current.scrollTo({
        x: selectedIndex * itemWidth - screenWidth / 2 + itemWidth / 2,
        animated: true,
      });
    }
  }, [selectedIndex, screenWidth]);

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollViewRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        decelerationRate="fast"
        snapToInterval={itemWidth}
      >
        {FILTER_METADATA.map((filter, index) => (
          <TouchableOpacity
            key={`${filter.id}-${index}`}
            style={[
              styles.filterButton,
              selectedFilterId === filter.id && styles.selectedFilterButton,
            ]}
            onPress={() => onSelectFilter(filter.id)}
          >
            <View
              style={[
                styles.filterIcon,
                {
                  backgroundColor: filter.previewColor || "transparent",
                },
              ]}
            >
              <Ionicons
                name={filter.icon as keyof typeof Ionicons.glyphMap}
                size={24}
                color={selectedFilterId === filter.id ? "#ffffff" : "#e0e0e0"}
              />
            </View>
            <Text
              style={[
                styles.filterName,
                selectedFilterId === filter.id && styles.selectedFilterName,
              ]}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {filter.displayName}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 90,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    paddingVertical: 10,
  },
  scrollContent: {
    paddingHorizontal: 10,
    alignItems: "center",
  },
  filterButton: {
    width: 70,
    marginHorizontal: 5,
    alignItems: "center",
    opacity: 0.7,
  },
  selectedFilterButton: {
    opacity: 1,
  },
  filterIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(80, 80, 80, 0.5)",
    marginBottom: 5,
  },
  filterName: {
    color: "#e0e0e0",
    fontSize: 12,
    textAlign: "center",
  },
  selectedFilterName: {
    color: "#ffffff",
    fontWeight: "bold",
  },
});
