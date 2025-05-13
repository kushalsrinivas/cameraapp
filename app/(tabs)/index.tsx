import FilterCarousel from "@/components/FilterCarousel";
import FilterLUT from "@/components/FilterLUT";
import {
  CAMERA_SETTINGS,
  COMPOSITION_GRIDS,
  FILTERS,
} from "@/constants/CameraConfig";
import { Ionicons } from "@expo/vector-icons";
import {
  type CameraType,
  CameraView,
  type FlashMode,
  useCameraPermissions,
} from "expo-camera";
import * as MediaLibrary from "expo-media-library";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
  PanGestureHandler,
} from "react-native-gesture-handler";
import Reanimated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import Svg, { Line, Path, Rect } from "react-native-svg";
import { useMediaLibraryPermission } from "../../hooks/useMediaLibraryPermission";

type GridType =
  | "none"
  | "rule-of-thirds"
  | "golden-ratio"
  | "triangle-grid"
  | "fibonacci-spiral"
  | "diagonal-composition";

// Define a type for the CameraView ref that includes takePictureAsync method
// interface CameraViewRef {
//   takePictureAsync: (options?: {
//     quality?: number;
//     skipProcessing?: boolean;
//   }) => Promise<{ uri: string; width: number; height: number }>;
// }

// Helper function that maps our icon strings to valid Ionicons names
const filterIconMap: Record<string, keyof typeof Ionicons.glyphMap> = {
  "image-outline": "image-outline",
  "film-outline": "film-outline",
  "leaf-outline": "leaf-outline",
  "square-outline": "square-outline",
  "contrast-outline": "contrast-outline",
  "videocam-outline": "videocam-outline",
  "tv-outline": "tv-outline",
  "aperture-outline": "aperture-outline",
  "information-circle": "information-circle",
};

export default function CameraScreen() {
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const {
    hasPermission: hasMediaLibraryPermission,
    requestPermission: requestMediaLibraryPermission,
  } = useMediaLibraryPermission();

  // Using the correct CameraView type from expo-camera
  const cameraRef = useRef<CameraView>(null);

  const [type, setType] = useState<CameraType>("back");
  const [flash, setFlash] = useState<FlashMode>("off");
  const [isTakingPicture, setIsTakingPicture] = useState(false);
  const [gridType, setGridType] = useState<GridType>("none");
  const [selectedFilter, setSelectedFilter] = useState(0); // Index of the selected filter

  // Zoom control state
  const [zoomLevel, setZoomLevel] = useState(0);
  const maxZoomLevel = 0.9; // From 0 to 1, where 1 is max zoom
  const [showZoomSlider, setShowZoomSlider] = useState(false);

  // Focus point state
  const [focusPoint, setFocusPoint] = useState<{ x: number; y: number } | null>(
    null
  );
  const focusAnimatedValue = useRef(new Animated.Value(0)).current;

  // Screen dimensions
  const screenWidth = Dimensions.get("window").width;
  const screenHeight = Dimensions.get("window").height;

  // Animation for filter overlay
  const filterOpacity = useSharedValue(0);
  const animatedFilterStyle = useAnimatedStyle(() => ({
    opacity: filterOpacity.value,
  }));

  // Grid overlay animation
  const gridOpacity = useSharedValue(0);
  const animatedGridStyle = useAnimatedStyle(() => ({
    opacity: gridOpacity.value,
  }));

  // Update filter opacity when filter changes
  const applyFilter = useCallback(
    (index: number) => {
      setSelectedFilter(index);
      filterOpacity.value = withTiming(FILTERS[index].opacity, {
        duration: CAMERA_SETTINGS.filterTransitionDuration,
      });
    },
    [filterOpacity]
  );

  // Animate grid overlay when grid type changes
  useEffect(() => {
    gridOpacity.value = withTiming(gridType === "none" ? 0 : 1, {
      duration: 300,
    });
  }, [gridType, gridOpacity]);

  // Handle focus point animation
  useEffect(() => {
    if (focusPoint) {
      Animated.sequence([
        Animated.timing(focusAnimatedValue, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.delay(800),
        Animated.timing(focusAnimatedValue, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setFocusPoint(null);
      });
    }
  }, [focusPoint, focusAnimatedValue]);

  const toggleCameraType = useCallback(() => {
    setType((current) => (current === "back" ? "front" : "back"));
  }, []);

  const toggleFlash = useCallback(() => {
    setFlash((current) => (current === "off" ? "on" : "off"));
  }, []);

  const toggleGrid = useCallback(() => {
    setGridType((prev) => {
      // Find the current grid index
      const currentIndex = COMPOSITION_GRIDS.findIndex(
        (grid) => grid.id === prev
      );
      // Get the next grid in the sequence (or loop back to the beginning)
      const nextIndex = (currentIndex + 1) % COMPOSITION_GRIDS.length;
      return COMPOSITION_GRIDS[nextIndex].id as GridType;
    });
  }, []);

  const toggleZoomSlider = useCallback(() => {
    setShowZoomSlider((prev) => !prev);
  }, []);

  const handleZoomChange = useCallback((value: number) => {
    // Update the zoom level state for UI
    setZoomLevel(Math.max(0, Math.min(value, maxZoomLevel)));

    // Note: We don't need to call setZoom as the zoom value is passed directly
    // to the CameraView component as a prop
  }, []);

  const handleFocus = useCallback(
    (event: { nativeEvent: { locationX: number; locationY: number } }) => {
      const { locationX, locationY } = event.nativeEvent;

      // Set the focus point for visual feedback only
      setFocusPoint({ x: locationX, y: locationY });

      // Note: We don't have direct focus control with expo-camera
      // The focus animation is purely visual feedback
    },
    []
  );

  const tapGesture = Gesture.Tap()
    .maxDuration(250)
    .onEnd((event) => {
      handleFocus({
        nativeEvent: {
          locationX: event.x,
          locationY: event.y,
        },
      });
    });

  const pinchGesture = Gesture.Pinch().onUpdate((event) => {
    // Convert pinch scale to zoom level
    // Start from current zoom level and adjust based on pinch scale
    const newZoom = Math.max(
      0,
      Math.min(zoomLevel * event.scale, maxZoomLevel)
    );
    handleZoomChange(newZoom);
  });

  const composed = Gesture.Simultaneous(tapGesture, pinchGesture);

  const takePicture = async () => {
    if (cameraRef.current && !isTakingPicture) {
      try {
        setIsTakingPicture(true);
        const photo = await cameraRef.current.takePictureAsync({
          quality: CAMERA_SETTINGS.photoQuality,
          skipProcessing: Platform.OS === "android", // Skip processing on Android for faster capture
        });

        // Request permissions if needed
        if (!hasMediaLibraryPermission) {
          const granted = await requestMediaLibraryPermission();
          if (!granted) {
            Alert.alert(
              "Permission required",
              "Please allow access to your photo library to save images."
            );
            setIsTakingPicture(false);
            return;
          }
        }

        // Save the photo to the media library
        await MediaLibrary.saveToLibraryAsync(photo.uri);

        // Show brief "Saved!" notification
        Alert.alert("Success", "Photo saved to your library!");
      } catch (error) {
        console.error("Error taking picture:", error);
        Alert.alert("Error", "Failed to take picture");
      } finally {
        setIsTakingPicture(false);
      }
    }
  };

  // Show permission request UI if necessary
  if (!cameraPermission) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#ffffff" />
        <Text style={styles.loadingText}>Requesting permissions...</Text>
      </View>
    );
  }

  if (!cameraPermission.granted) {
    return (
      <View style={styles.permissionsContainer}>
        <Text style={styles.permissionsText}>
          Camera permission is required
        </Text>
        <TouchableOpacity
          style={styles.permissionsButton}
          onPress={requestCameraPermission}
        >
          <Text style={styles.permissionsButtonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const getZoomLabelText = () => {
    // Convert from 0-1 scale to 1x-6x scale
    const zoomX = (1 + zoomLevel * 5).toFixed(1);
    return `${zoomX}x`;
  };

  return (
    <GestureHandlerRootView style={styles.container}>
      <GestureDetector gesture={composed}>
        <View style={styles.cameraContainer}>
          {/* Camera view */}
          <CameraView
            style={styles.camera}
            facing={type}
            flash={flash}
            ref={cameraRef}
            zoom={zoomLevel}
          />

          {/* Filter effect overlay with shader */}
          <Reanimated.View
            style={[styles.filterOverlay, animatedFilterStyle]}
            pointerEvents="none"
          >
            <FilterLUT
              filter={FILTERS[selectedFilter].name}
              color={FILTERS[selectedFilter].color}
              opacity={FILTERS[selectedFilter].opacity}
            >
              <View style={StyleSheet.absoluteFill} />
            </FilterLUT>
          </Reanimated.View>

          {/* Focus point indicator */}
          {focusPoint && (
            <Animated.View
              style={[
                styles.focusIndicator,
                {
                  left: focusPoint.x - 30,
                  top: focusPoint.y - 30,
                  opacity: focusAnimatedValue,
                  transform: [
                    {
                      scale: focusAnimatedValue.interpolate({
                        inputRange: [0, 1],
                        outputRange: [1.5, 1],
                      }),
                    },
                  ],
                },
              ]}
            />
          )}
        </View>
      </GestureDetector>

      {/* Composition grid overlays */}
      <Reanimated.View
        style={[styles.gridOverlay, animatedGridStyle]}
        pointerEvents="none"
      >
        {gridType === "rule-of-thirds" && (
          <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
            {/* Horizontal lines */}
            <Line
              x1="0"
              y1="33.3%"
              x2="100%"
              y2="33.3%"
              stroke="rgba(255, 255, 255, 0.5)"
              strokeWidth="1"
            />
            <Line
              x1="0"
              y1="66.7%"
              x2="100%"
              y2="66.7%"
              stroke="rgba(255, 255, 255, 0.5)"
              strokeWidth="1"
            />

            {/* Vertical lines */}
            <Line
              x1="33.3%"
              y1="0"
              x2="33.3%"
              y2="100%"
              stroke="rgba(255, 255, 255, 0.5)"
              strokeWidth="1"
            />
            <Line
              x1="66.7%"
              y1="0"
              x2="66.7%"
              y2="100%"
              stroke="rgba(255, 255, 255, 0.5)"
              strokeWidth="1"
            />
          </Svg>
        )}

        {gridType === "golden-ratio" && (
          <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
            {/* Horizontal lines */}
            <Line
              x1="0"
              y1="38.2%"
              x2="100%"
              y2="38.2%"
              stroke="rgba(255, 255, 255, 0.5)"
              strokeWidth="1"
            />
            <Line
              x1="0"
              y1="61.8%"
              x2="100%"
              y2="61.8%"
              stroke="rgba(255, 255, 255, 0.5)"
              strokeWidth="1"
            />

            {/* Vertical lines */}
            <Line
              x1="38.2%"
              y1="0"
              x2="38.2%"
              y2="100%"
              stroke="rgba(255, 255, 255, 0.5)"
              strokeWidth="1"
            />
            <Line
              x1="61.8%"
              y1="0"
              x2="61.8%"
              y2="100%"
              stroke="rgba(255, 255, 255, 0.5)"
              strokeWidth="1"
            />
          </Svg>
        )}

        {gridType === "triangle-grid" && (
          <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
            {/* Diagonal lines */}
            <Line
              x1="0"
              y1="0"
              x2="100%"
              y2="100%"
              stroke="rgba(255, 255, 255, 0.5)"
              strokeWidth="1"
            />
            <Line
              x1="100%"
              y1="0"
              x2="0"
              y2="100%"
              stroke="rgba(255, 255, 255, 0.5)"
              strokeWidth="1"
            />

            {/* Optional horizontal and vertical midlines */}
            <Line
              x1="0"
              y1="50%"
              x2="100%"
              y2="50%"
              stroke="rgba(255, 255, 255, 0.3)"
              strokeWidth="1"
            />
            <Line
              x1="50%"
              y1="0"
              x2="50%"
              y2="100%"
              stroke="rgba(255, 255, 255, 0.3)"
              strokeWidth="1"
            />
          </Svg>
        )}

        {gridType === "fibonacci-spiral" && (
          <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
            {/* Fibonacci squares */}
            <Rect
              x="0%"
              y="0%"
              width="61.8%"
              height="61.8%"
              stroke="rgba(255, 255, 255, 0.5)"
              strokeWidth="1"
              fill="transparent"
            />
            <Rect
              x="61.8%"
              y="0%"
              width="38.2%"
              height="61.8%"
              stroke="rgba(255, 255, 255, 0.5)"
              strokeWidth="1"
              fill="transparent"
            />
            <Rect
              x="61.8%"
              y="61.8%"
              width="38.2%"
              height="38.2%"
              stroke="rgba(255, 255, 255, 0.5)"
              strokeWidth="1"
              fill="transparent"
            />
            <Rect
              x="38.2%"
              y="61.8%"
              width="23.6%"
              height="38.2%"
              stroke="rgba(255, 255, 255, 0.5)"
              strokeWidth="1"
              fill="transparent"
            />
            <Rect
              x="38.2%"
              y="38.2%"
              width="23.6%"
              height="23.6%"
              stroke="rgba(255, 255, 255, 0.5)"
              strokeWidth="1"
              fill="transparent"
            />

            {/* Spiral curve */}
            <Path
              d="M 61.8 61.8 Q 61.8 0 0 0 Q 100 0 100 100 Q 100 0 0 0 Q 0 100 100 100 Q 0 100 0 0"
              stroke="rgba(255, 255, 255, 0.7)"
              strokeWidth="1"
              fill="transparent"
            />
          </Svg>
        )}

        {gridType === "diagonal-composition" && (
          <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
            {/* Main diagonals */}
            <Line
              x1="0"
              y1="0"
              x2="100%"
              y2="100%"
              stroke="rgba(255, 255, 255, 0.5)"
              strokeWidth="1"
            />
            <Line
              x1="100%"
              y1="0"
              x2="0"
              y2="100%"
              stroke="rgba(255, 255, 255, 0.5)"
              strokeWidth="1"
            />

            {/* Sub-diagonals parallel to main diagonals */}
            <Line
              x1="0"
              y1="25%"
              x2="75%"
              y2="100%"
              stroke="rgba(255, 255, 255, 0.3)"
              strokeWidth="1"
            />
            <Line
              x1="25%"
              y1="0"
              x2="100%"
              y2="75%"
              stroke="rgba(255, 255, 255, 0.3)"
              strokeWidth="1"
            />
            <Line
              x1="100%"
              y1="25%"
              x2="25%"
              y2="100%"
              stroke="rgba(255, 255, 255, 0.3)"
              strokeWidth="1"
            />
            <Line
              x1="75%"
              y1="0"
              x2="0"
              y2="75%"
              stroke="rgba(255, 255, 255, 0.3)"
              strokeWidth="1"
            />
          </Svg>
        )}
      </Reanimated.View>

      {/* Color filter overlay */}
      <Reanimated.View
        style={[
          styles.filterOverlay,
          animatedFilterStyle,
          { backgroundColor: FILTERS[selectedFilter].color },
        ]}
        pointerEvents="none"
      />

      {/* Zoom slider */}
      {showZoomSlider && (
        <View style={styles.zoomSliderContainer}>
          <Text style={styles.zoomLevelText}>{getZoomLabelText()}</Text>
          <View style={styles.zoomSlider}>
            <PanGestureHandler
              onGestureEvent={(event) => {
                const { translationY } = event.nativeEvent;
                // Convert vertical pan to zoom value (inverted: up = zoom in, down = zoom out)
                const height = 200; // Height of the slider track
                const newZoom = Math.max(
                  0,
                  Math.min(maxZoomLevel - translationY / height, maxZoomLevel)
                );
                handleZoomChange(newZoom);
              }}
            >
              <View style={styles.zoomSliderTrack}>
                <View
                  style={[
                    styles.zoomSliderFill,
                    { height: `${(zoomLevel / maxZoomLevel) * 100}%` },
                  ]}
                />
                <View
                  style={[
                    styles.zoomSliderThumb,
                    { bottom: `${(zoomLevel / maxZoomLevel) * 100}%` },
                  ]}
                />
              </View>
            </PanGestureHandler>
          </View>
        </View>
      )}

      {/* Camera controls */}
      <View style={styles.controlsContainer}>
        <TouchableOpacity style={styles.controlButton} onPress={toggleFlash}>
          <Ionicons
            name={flash === "on" ? "flash" : "flash-off"}
            size={24}
            color="white"
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.controlButton}
          onPress={toggleCameraType}
        >
          <Ionicons name="camera-reverse" size={24} color="white" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.controlButton} onPress={toggleGrid}>
          <Ionicons name="grid" size={24} color="white" />
          {gridType !== "none" && (
            <Text style={styles.gridTypeIndicator}>
              {COMPOSITION_GRIDS.find(
                (grid) => grid.id === gridType
              )?.name.charAt(0)}
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.controlButton}
          onPress={toggleZoomSlider}
        >
          <Ionicons name="search" size={24} color="white" />
        </TouchableOpacity>
      </View>

      {/* Filter selection - using our new FilterCarousel component */}
      <View style={[styles.filtersContainer]}>
        <FilterCarousel
          filters={FILTERS}
          selectedFilter={selectedFilter}
          onSelectFilter={applyFilter}
          filterIconMap={filterIconMap}
        />
      </View>

      {/* Bottom toolbar */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={styles.captureButton}
          onPress={takePicture}
          disabled={isTakingPicture}
        >
          {isTakingPicture ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <View style={styles.captureButtonInner} />
          )}
        </TouchableOpacity>
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "black",
  },
  cameraContainer: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  permissionsContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "black",
  },
  permissionsText: {
    color: "white",
    fontSize: 18,
    marginBottom: 20,
  },
  permissionsButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  permissionsButtonText: {
    color: "white",
    fontSize: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "black",
  },
  loadingText: {
    color: "white",
    marginTop: 10,
  },
  controlsContainer: {
    position: "absolute",
    top: 50,
    right: 20,
    flexDirection: "column",
  },
  controlButton: {
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    borderRadius: 30,
    padding: 10,
    marginBottom: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  gridTypeIndicator: {
    position: "absolute",
    bottom: -5,
    right: -5,
    backgroundColor: "#007AFF",
    color: "white",
    fontSize: 10,
    width: 14,
    height: 14,
    borderRadius: 7,
    textAlign: "center",
    overflow: "hidden",
  },
  filtersContainer: {
    position: "absolute",
    bottom: 100,
    left: 0,
    right: 0,
  },
  bottomContainer: {
    position: "absolute",
    bottom: 20,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  captureButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "white",
  },
  gridOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: "none",
  },
  // Focus indicator
  focusIndicator: {
    position: "absolute",
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: "rgba(255, 220, 0, 0.8)",
  },
  // Zoom slider
  zoomSliderContainer: {
    position: "absolute",
    right: 70,
    top: 50,
    height: 220,
    width: 40,
    alignItems: "center",
  },
  zoomLevelText: {
    color: "white",
    fontSize: 12,
    marginBottom: 5,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    overflow: "hidden",
  },
  zoomSlider: {
    height: 200,
    width: 30,
    justifyContent: "center",
    alignItems: "center",
  },
  zoomSliderTrack: {
    height: 200,
    width: 6,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    borderRadius: 3,
    overflow: "visible",
    position: "relative",
  },
  zoomSliderFill: {
    width: 6,
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    borderRadius: 3,
    position: "absolute",
    bottom: 0,
    left: 0,
  },
  zoomSliderThumb: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "white",
    position: "absolute",
    left: -6, // Center the thumb on the track
    marginBottom: -9, // Center the thumb vertically
  },
  filterOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  filterPreviewCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
  },
  filmEdgeTop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.5)",
  },
  filmEdgeBottom: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.5)",
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
  filterTitleContainer: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.2)",
  },
  filterTitleText: {
    color: "white",
    fontSize: 14,
    fontWeight: "500",
  },
  filterInfoBadge: {
    position: "absolute",
    top: 5,
    right: 5,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    borderRadius: 12,
    padding: 2,
  },
});
