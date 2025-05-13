import { CAMERA_SETTINGS, FILTERS } from "@/constants/CameraConfig";
import { Ionicons } from "@expo/vector-icons";
import {
  type CameraType,
  CameraView,
  type FlashMode,
  useCameraPermissions,
} from "expo-camera";
import * as MediaLibrary from "expo-media-library";
import { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Reanimated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useMediaLibraryPermission } from "../../hooks/useMediaLibraryPermission";

type GridType = "rule-of-thirds" | "golden-ratio" | "none";

// Define a type for the CameraView ref that includes takePictureAsync method
interface CameraViewRef {
  takePictureAsync: (options?: {
    quality?: number;
    skipProcessing?: boolean;
  }) => Promise<{ uri: string; width: number; height: number }>;
}

export default function CameraScreen() {
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const {
    hasPermission: hasMediaLibraryPermission,
    requestPermission: requestMediaLibraryPermission,
  } = useMediaLibraryPermission();

  // Using any type for ref to bypass type checking for now
  const cameraRef = useRef<any>(null);

  const [type, setType] = useState<CameraType>("back");
  const [flash, setFlash] = useState<FlashMode>("off");
  const [isTakingPicture, setIsTakingPicture] = useState(false);
  const [gridType, setGridType] = useState<GridType>("none");
  const [selectedFilter, setSelectedFilter] = useState(0); // Index of the selected filter

  // Animation for filter overlay
  const filterOpacity = useSharedValue(0);
  const animatedFilterStyle = useAnimatedStyle(() => ({
    opacity: filterOpacity.value,
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

  const toggleCameraType = useCallback(() => {
    setType((current) => (current === "back" ? "front" : "back"));
  }, []);

  const toggleFlash = useCallback(() => {
    setFlash((current) => (current === "off" ? "on" : "off"));
  }, []);

  const toggleGrid = useCallback(() => {
    setGridType((prev) => {
      if (prev === "none") return "rule-of-thirds";
      if (prev === "rule-of-thirds") return "golden-ratio";
      return "none";
    });
  }, []);

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

  return (
    <View style={styles.container}>
      <CameraView
        style={styles.camera}
        facing={type}
        flash={flash}
        ref={cameraRef}
      >
        {/* Camera view content can go here */}
      </CameraView>

      {/* Composition grid overlay */}
      {gridType === "rule-of-thirds" && (
        <View style={styles.gridOverlay} pointerEvents="none">
          <View style={styles.gridRowThirds}>
            <View style={styles.gridLine} />
            <View style={styles.gridLine} />
          </View>
          <View style={styles.gridColThirds}>
            <View style={styles.gridLine} />
            <View style={styles.gridLine} />
          </View>
        </View>
      )}

      {gridType === "golden-ratio" && (
        <View style={styles.gridOverlay} pointerEvents="none">
          <View style={styles.gridRowGolden}>
            <View style={styles.gridLine} />
            <View style={styles.gridLine} />
          </View>
          <View style={styles.gridColGolden}>
            <View style={styles.gridLine} />
            <View style={styles.gridLine} />
          </View>
        </View>
      )}

      {/* Color filter overlay */}
      <Reanimated.View
        style={[
          styles.filterOverlay,
          animatedFilterStyle,
          { backgroundColor: FILTERS[selectedFilter].color },
        ]}
        pointerEvents="none"
      />

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
        </TouchableOpacity>
      </View>

      {/* Filter selection */}
      <View style={styles.filtersContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {FILTERS.map((filter, index) => (
            <TouchableOpacity
              key={filter.name}
              style={[
                styles.filterOption,
                selectedFilter === index && styles.selectedFilterOption,
              ]}
              onPress={() => applyFilter(index)}
            >
              <Text style={styles.filterText}>{filter.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "black",
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
  },
  filtersContainer: {
    position: "absolute",
    bottom: 120,
    left: 0,
    right: 0,
    paddingHorizontal: 10,
  },
  filterOption: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginHorizontal: 5,
    borderRadius: 20,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  selectedFilterOption: {
    borderColor: "white",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },
  filterText: {
    color: "white",
    fontSize: 14,
  },
  bottomContainer: {
    position: "absolute",
    bottom: 30,
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
  },
  gridRowThirds: {
    flex: 1,
    justifyContent: "space-around",
    paddingVertical: "33.3%",
  },
  gridColThirds: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: "row",
    justifyContent: "space-around",
    paddingHorizontal: "33.3%",
  },
  gridRowGolden: {
    flex: 1,
    justifyContent: "space-around",
    paddingVertical: "38.2%",
  },
  gridColGolden: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: "row",
    justifyContent: "space-around",
    paddingHorizontal: "38.2%",
  },
  gridLine: {
    backgroundColor: "rgba(255, 255, 255, 0.5)",
    height: 1,
    width: "100%",
  },
  filterOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
});
