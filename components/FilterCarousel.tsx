import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useRef, useState } from "react";
import {
  Alert,
  Dimensions,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import FilterPreviewModal from "./FilterPreviewModal";

// Placeholder image for filter preview
const PLACEHOLDER_IMAGE = require("../assets/filter-preview.jpg");

export type Filter = {
  name: string;
  displayName: string;
  color: string;
  opacity: number;
  description: string;
  icon: string;
};

// Type for the filter icon map, using the Ionicons type
type FilterIconMap = Record<string, keyof typeof Ionicons.glyphMap>;

interface FilterCarouselProps {
  filters: Filter[];
  selectedFilter: number;
  onSelectFilter: (index: number) => void;
  filterIconMap: FilterIconMap;
}

// Animated item for FlatList for better performance
const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const ITEM_WIDTH = 80; // Width of each filter item
const ITEM_SPACING = 10; // Spacing between items

// Using the viewabilityConfig to trigger filter preview on scroll
const viewabilityConfig = {
  minimumViewTime: 100, // Time item must be visible to trigger callback
  viewAreaCoveragePercentThreshold: 60, // Percent of item that must be visible
  waitForInteraction: false,
};

const FilterItem = React.memo(
  ({
    item,
    index,
    selected,
    onPress,
    filterIconMap,
    onLongPress,
  }: {
    item: Filter;
    index: number;
    selected: boolean;
    onPress: () => void;
    filterIconMap: FilterIconMap;
    onLongPress: () => void;
  }) => {
    // Animation values for selected state
    const scale = useSharedValue(1);
    const elevation = useSharedValue(selected ? 5 : 0);

    // Update animations when selected changes
    React.useEffect(() => {
      scale.value = withSpring(selected ? 1.08 : 1, {
        damping: 12,
        stiffness: 120,
      });
      elevation.value = withTiming(selected ? 5 : 0, {
        duration: 200,
      });
    }, [selected, scale, elevation]);

    // Apply animated styles
    const animatedStyle = useAnimatedStyle(() => {
      return {
        transform: [{ scale: scale.value }],
        elevation: elevation.value,
        zIndex: elevation.value > 0 ? 1 : 0,
        shadowOpacity: interpolate(
          elevation.value,
          [0, 5],
          [0.1, 0.3],
          Extrapolation.CLAMP
        ),
      };
    });

    return (
      <AnimatedTouchable
        onPress={onPress}
        onLongPress={onLongPress}
        delayLongPress={500}
        activeOpacity={0.7}
        style={[styles.filterOption, animatedStyle]}
      >
        <View
          style={[
            styles.filterSwatch,
            {
              backgroundColor:
                item.color === "transparent" ? "#424242" : item.color,
            },
            selected && styles.selectedFilterSwatch,
          ]}
        >
          {/* Preview circle for filter effect */}
          <View
            style={[
              styles.filterPreviewCircle,
              {
                backgroundColor:
                  item.color === "transparent" ? "#FFFFFF" : item.color,
              },
            ]}
          >
            {/* Filter preview image with pseudo-effect */}
            <Image
              source={PLACEHOLDER_IMAGE}
              style={[
                styles.previewImage,
                {
                  tintColor: item.name === "Ilford HP5" ? "#333" : undefined,
                  opacity: item.name === "Normal" ? 1 : 0.85,
                },
              ]}
              resizeMode="cover"
            />

            <Ionicons
              name={filterIconMap[item.icon]}
              size={24}
              color={
                item.name === "Normal"
                  ? "white"
                  : item.name === "Ilford HP5"
                  ? "white"
                  : "#f8f8f8"
              }
              style={styles.iconOverlay}
            />
          </View>

          {/* Film edges effect for vintage look */}
          {item.name !== "Normal" && (
            <>
              <View style={styles.filmEdgeTop} />
              <View style={styles.filmEdgeBottom} />
              <View style={styles.filmEdgeLeft} />
              <View style={styles.filmEdgeRight} />
            </>
          )}

          {/* Info badge */}
          {item.name !== "Normal" && (
            <TouchableOpacity
              style={styles.filterInfoBadge}
              onPress={() => {
                // Show filter description in an alert
                Alert.alert(item.name, item.description);
              }}
            >
              <Ionicons name="information-circle" size={16} color="#FFFFFF" />
            </TouchableOpacity>
          )}

          {/* Retro texture overlay */}
          {item.name !== "Normal" && <View style={styles.retroTexture} />}
        </View>
        <Text style={styles.filterName}>{item.displayName}</Text>
        {selected && <View style={styles.selectedIndicator} />}
      </AnimatedTouchable>
    );
  }
);

// Function to handle create your own filter
const handleCreateYourOwnFilter = () => {
  Alert.alert(
    "Coming Soon!",
    "The ability to create your own custom filters will be available in a future update. Stay tuned!",
    [{ text: "OK", style: "default" }]
  );
};

// Custom filter button component
const CreateYourOwnFilterButton = React.memo(() => {
  return (
    <TouchableOpacity
      style={styles.createFilterButton}
      onPress={handleCreateYourOwnFilter}
      activeOpacity={0.7}
    >
      <View style={styles.createFilterCircle}>
        <Ionicons name="add" size={30} color="white" />
      </View>
      <Text style={styles.createFilterText}>Create Filter</Text>
    </TouchableOpacity>
  );
});

const FilterCarousel: React.FC<FilterCarouselProps> = ({
  filters,
  selectedFilter,
  onSelectFilter,
  filterIconMap,
}) => {
  const flatListRef = useRef<FlatList>(null);
  const [scrolling, setScrolling] = useState(false);
  const [previewFilter, setPreviewFilter] = useState<number | null>(null);

  // State for filter preview modal
  const [previewModalVisible, setPreviewModalVisible] = useState(false);
  const [previewFilterIndex, setPreviewFilterIndex] = useState(0);

  // Function to show full screen preview
  const showFullScreenPreview = (index: number) => {
    setPreviewFilterIndex(index);
    setPreviewModalVisible(true);
  };

  // Scroll to selected filter
  React.useEffect(() => {
    if (flatListRef.current && !scrolling) {
      flatListRef.current.scrollToIndex({
        index: selectedFilter,
        animated: true,
        viewPosition: 0.5, // Center the item
      });
    }
  }, [selectedFilter, scrolling]);

  // Handle viewable items change to preview filter on scroll
  const handleViewableItemsChanged = useCallback(
    ({ viewableItems }) => {
      if (viewableItems.length > 0 && scrolling) {
        // Get the most visible item
        const mostVisible = viewableItems.reduce((prev, current) => {
          return prev.percentVisible > current.percentVisible ? prev : current;
        });

        // Set as preview filter (this will be used for live preview)
        setPreviewFilter(mostVisible.index);
      }
    },
    [scrolling]
  );

  // When user stops scrolling, apply the preview filter
  const handleMomentumScrollEnd = useCallback(() => {
    setScrolling(false);
    // Apply the previewed filter if there is one
    if (previewFilter !== null && previewFilter !== selectedFilter) {
      onSelectFilter(previewFilter);
    }
    setPreviewFilter(null);
  }, [previewFilter, selectedFilter, onSelectFilter]);

  const viewabilityConfigCallbackPairs = useRef([
    { viewabilityConfig, onViewableItemsChanged: handleViewableItemsChanged },
  ]);

  return (
    <View style={styles.container}>
      <View style={styles.filterTitleContainer}>
        <Text style={styles.filterTitleText}>Film Emulation</Text>
        <Text style={styles.filterSubtitleText}>
          {scrolling && previewFilter !== null
            ? `Previewing: ${filters[previewFilter].displayName}`
            : `Selected: ${filters[selectedFilter].displayName}`}
        </Text>
      </View>

      <FlatList
        ref={flatListRef}
        data={filters}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filtersScrollContent}
        snapToInterval={ITEM_WIDTH + ITEM_SPACING}
        snapToAlignment="center"
        decelerationRate="fast"
        keyExtractor={(item) => item.name}
        onScrollBeginDrag={() => setScrolling(true)}
        onMomentumScrollEnd={handleMomentumScrollEnd}
        viewabilityConfigCallbackPairs={viewabilityConfigCallbackPairs.current}
        renderItem={({ item, index }) => (
          <FilterItem
            item={item}
            index={index}
            selected={selectedFilter === index}
            onPress={() => onSelectFilter(index)}
            onLongPress={() => showFullScreenPreview(index)}
            filterIconMap={filterIconMap}
          />
        )}
        // Add button to create your own filter at the end
        ListFooterComponent={<CreateYourOwnFilterButton />}
        // Performance optimizations
        getItemLayout={(_, index) => ({
          length: ITEM_WIDTH + ITEM_SPACING,
          offset: (ITEM_WIDTH + ITEM_SPACING) * index,
          index,
        })}
        initialNumToRender={5}
        maxToRenderPerBatch={7}
        windowSize={7}
        removeClippedSubviews={true}
      />

      {/* Filter Preview Modal */}
      <FilterPreviewModal
        visible={previewModalVisible}
        onClose={() => setPreviewModalVisible(false)}
        filterName={filters[previewFilterIndex].name}
        filterColor={filters[previewFilterIndex].color}
        filterOpacity={filters[previewFilterIndex].opacity}
        filterDescription={filters[previewFilterIndex].description}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.2)",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.2)",
  },
  filtersScrollContent: {
    paddingHorizontal: 10,
    paddingVertical: 10,
    alignItems: "center",
  },
  filterTitleContainer: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.2)",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  filterTitleText: {
    color: "white",
    fontSize: 14,
    fontWeight: "500",
  },
  filterSubtitleText: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 12,
    fontWeight: "400",
  },
  filterOption: {
    marginHorizontal: ITEM_SPACING / 2,
    alignItems: "center",
    width: ITEM_WIDTH,
    // Shadow properties for iOS
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 5,
    // Android elevation handled in animated style
  },
  filterSwatch: {
    width: 64,
    height: 64,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
    overflow: "hidden",
  },
  selectedFilterSwatch: {
    borderColor: "#FFFFFF",
    borderWidth: 2,
  },
  filterPreviewCircle: {
    width: 60,
    height: 60,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  previewImage: {
    width: "100%",
    height: "100%",
    position: "absolute",
  },
  iconOverlay: {
    zIndex: 2,
    opacity: 0.7,
  },
  filmEdgeTop: {
    position: "absolute",
    top: 0,
    left: 4,
    right: 4,
    height: 2,
    backgroundColor: "rgba(255, 255, 255, 0.5)",
  },
  filmEdgeBottom: {
    position: "absolute",
    bottom: 0,
    left: 4,
    right: 4,
    height: 2,
    backgroundColor: "rgba(255, 255, 255, 0.5)",
  },
  filmEdgeLeft: {
    position: "absolute",
    left: 0,
    top: 4,
    bottom: 4,
    width: 2,
    backgroundColor: "rgba(255, 255, 255, 0.5)",
  },
  filmEdgeRight: {
    position: "absolute",
    right: 0,
    top: 4,
    bottom: 4,
    width: 2,
    backgroundColor: "rgba(255, 255, 255, 0.5)",
  },
  filterInfoBadge: {
    position: "absolute",
    top: 5,
    right: 5,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    borderRadius: 12,
    padding: 2,
  },
  retroTexture: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "transparent",
    opacity: 0.05,
    // In a real app, you would use a noise texture image here
    // backgroundImage: 'url(noise.png)'
  },
  filterName: {
    color: "white",
    fontSize: 12,
    marginTop: 6,
    textAlign: "center",
  },
  selectedIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#007AFF",
    marginTop: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 2,
  },
  createFilterButton: {
    marginHorizontal: ITEM_SPACING / 2,
    alignItems: "center",
    width: ITEM_WIDTH,
    padding: 10,
    justifyContent: "center",
    height: 90,
  },
  createFilterCircle: {
    width: 64,
    height: 64,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(60, 60, 60, 0.5)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
    borderStyle: "dashed",
  },
  createFilterText: {
    color: "white",
    fontSize: 12,
    marginTop: 6,
    textAlign: "center",
    opacity: 0.8,
  },
});

export default FilterCarousel;
