import {
  type LutFilter,
  loadLutFilters,
  loadLutTexture,
} from "@/utils/lutUtils";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface DynamicFilterCarouselProps {
  onSelectFilter: (filter: LutFilter, index: number) => void;
  selectedFilterIndex: number;
}

export default function DynamicFilterCarousel({
  onSelectFilter,
  selectedFilterIndex,
}: DynamicFilterCarouselProps) {
  const [filters, setFilters] = useState<LutFilter[]>([]);
  const [loadingFilters, setLoadingFilters] = useState(true);
  const scrollViewRef = useRef<ScrollView>(null);
  const itemWidth = 80;
  const screenWidth = Dimensions.get("window").width;

  // Load the filters metadata on mount
  useEffect(() => {
    const fetchFilters = async () => {
      try {
        setLoadingFilters(true);
        const availableFilters = await loadLutFilters();
        setFilters(availableFilters);
      } catch (error) {
        console.error("Error loading filters:", error);
      } finally {
        setLoadingFilters(false);
      }
    };

    fetchFilters();
  }, []);

  // Handle filter selection
  const handleSelectFilter = async (filter: LutFilter, index: number) => {
    // If the filter is not loaded yet, load its LUT data
    if (filter.filePath && !filter.isLoaded) {
      try {
        const loadedFilter = await loadLutTexture(filter);

        // Update the filter in our state with the loaded data
        const updatedFilters = [...filters];
        updatedFilters[index] = loadedFilter;
        setFilters(updatedFilters);

        // Notify parent of selection with the loaded filter
        onSelectFilter(loadedFilter, index);
      } catch (error) {
        console.error(`Error loading filter ${filter.name}:`, error);

        // Select the filter anyway, it will fall back to color-based filtering
        onSelectFilter(filter, index);
      }
    } else {
      // Filter already loaded or is the 'Normal' filter
      onSelectFilter(filter, index);
    }
  };

  // Scroll to the selected filter
  useEffect(() => {
    if (
      scrollViewRef.current &&
      selectedFilterIndex >= 0 &&
      selectedFilterIndex < filters.length
    ) {
      scrollViewRef.current.scrollTo({
        x: selectedFilterIndex * itemWidth - screenWidth / 2 + itemWidth / 2,
        animated: true,
      });
    }
  }, [selectedFilterIndex, filters.length, screenWidth]);

  if (loadingFilters) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color="#ffffff" />
        <Text style={styles.loadingText}>Loading filters...</Text>
      </View>
    );
  }

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
        {filters.map((filter, index) => (
          <TouchableOpacity
            key={`${filter.name}-${index}`}
            style={[
              styles.filterButton,
              selectedFilterIndex === index && styles.selectedFilterButton,
            ]}
            onPress={() => handleSelectFilter(filter, index)}
          >
            <View
              style={[
                styles.filterIcon,
                {
                  backgroundColor: filter.colorValue || "transparent",
                },
              ]}
            >
              <Ionicons
                name={filter.icon as any}
                size={24}
                color={selectedFilterIndex === index ? "#ffffff" : "#e0e0e0"}
              />
            </View>
            <Text
              style={[
                styles.filterName,
                selectedFilterIndex === index && styles.selectedFilterName,
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
  loadingContainer: {
    height: 90,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "#ffffff",
    marginTop: 5,
    fontSize: 12,
  },
});
