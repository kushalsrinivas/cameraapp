import AdjustmentsTab from "@/components/editor/AdjustmentsTab";
import CropRotateTab from "@/components/editor/CropRotateTab";
// Components
import EditorToolbar from "@/components/editor/EditorToolbar";
import EffectsTab from "@/components/editor/EffectsTab";
import FilterTab from "@/components/editor/FilterTab";
import PresetsTab from "@/components/editor/PresetsTab";
import SavePresetModal from "@/components/editor/SavePresetModal";
import { Ionicons } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import * as ImageManipulator from "expo-image-manipulator";
import { FlipType } from "expo-image-manipulator";
import * as MediaLibrary from "expo-media-library";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

// Types
import type { EditorAdjustments, UserPreset } from "@/types/editor";
import { validateFileExists } from "@/utils/fileUtils";
import { type LutFilter, loadLutFilters } from "@/utils/lutUtils";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Constants
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

// Editor tabs
type EditorTab = "filters" | "adjustments" | "crop" | "effects" | "presets";

export default function EditorScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const imageUri = params.uri as string;

  // State
  const [currentTab, setCurrentTab] = useState<EditorTab>("filters");
  const [originalImageUri, setOriginalImageUri] = useState<string>(imageUri);
  const [previewImageUri, setPreviewImageUri] = useState<string>(imageUri);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isPresetModalVisible, setIsPresetModalVisible] = useState(false);
  const [availableFilters, setAvailableFilters] = useState<LutFilter[]>([]);
  const [selectedFilterIndex, setSelectedFilterIndex] = useState(0);
  const [isImageReady, setIsImageReady] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const [isHelpVisible, setIsHelpVisible] = useState(true);

  // Editing state
  const [adjustments, setAdjustments] = useState<EditorAdjustments>({
    exposure: 0,
    brightness: 0,
    contrast: 0,
    saturation: 100,
    temperature: 0,
    fade: 0,
    highlights: 0,
    shadows: 0,
    grain: 0,
    vignette: 0,
    tint: 0,
    shadowsTint: 0,
    blacks: 0,
    whites: 0,
  });

  // Crop/Rotate state
  const [cropParams, setCropParams] = useState({
    crop: { originX: 0, originY: 0, width: 1, height: 1 },
    rotation: 0,
    flipHorizontal: false,
    flipVertical: false,
  });

  // Presets
  const [userPresets, setUserPresets] = useState<UserPreset[]>([]);

  // Load filters and presets on mount, and prepare the image
  useEffect(() => {
    const initializeEditor = async () => {
      try {
        setIsLoading(true);

        // Check if image URI is valid
        if (!imageUri) {
          setImageError("No image found. Please try again.");
          setIsLoading(false);
          return;
        }

        // Validate that the image file exists
        const fileExists = await validateFileExists(imageUri);

        if (!fileExists) {
          console.error("Image file doesn't exist:", imageUri);
          setImageError("Image file not found. Please try again.");
          setIsLoading(false);
          return;
        }

        console.log("Image file exists and is accessible:", imageUri);

        // Load LUT filters
        const filters = await loadLutFilters();
        setAvailableFilters(filters);

        // Load user presets from AsyncStorage
        const presetsJson = await AsyncStorage.getItem("userPresets");
        if (presetsJson) {
          setUserPresets(JSON.parse(presetsJson));
        }

        // Prepare the image for editing
        await prepareImageForEditing(imageUri);

        setIsLoading(false);
      } catch (error) {
        console.error("Error initializing editor:", error);
        setImageError("Failed to initialize the editor. Please try again.");
        setIsLoading(false);
      }
    };

    initializeEditor();
  }, [imageUri]);

  // Function to prepare an image for editing
  const prepareImageForEditing = async (uri: string) => {
    try {
      // Create a local, scaled copy to work with
      const maxDimension = Math.min(SCREEN_WIDTH * 2, 1920); // Cap at 1920px or 2x screen width

      // Create a cache directory if it doesn't exist
      const cacheDir = `${FileSystem.cacheDirectory}edited_images/`;
      const dirInfo = await FileSystem.getInfoAsync(cacheDir);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(cacheDir, { intermediates: true });
      }

      // Generate a unique filename for our cached image
      const filename = `image_${Date.now()}.jpg`;
      const cachedPath = `${cacheDir}${filename}`;

      // Get image dimensions first
      try {
        // Just make a copy at high quality
        const result = await ImageManipulator.manipulateAsync(uri, [], {
          compress: 0.95,
          format: ImageManipulator.SaveFormat.JPEG,
        });

        setOriginalImageUri(result.uri);
        setPreviewImageUri(result.uri);
        setIsImageReady(true);
      } catch (error) {
        console.error("Error preparing image:", error);
        throw new Error("Failed to prepare image for editing");
      }
    } catch (error) {
      console.error("Error in prepareImageForEditing:", error);
      throw error;
    }
  };

  // If there's an error loading the image, show an error message with a back button
  if (imageError) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{imageError}</Text>
        <TouchableOpacity
          style={styles.errorButton}
          onPress={() => router.back()}
        >
          <Text style={styles.errorButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Show loading while preparing the image
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#ffffff" />
        <Text style={styles.loadingText}>Loading image...</Text>
      </View>
    );
  }

  // Apply edits to create preview image
  const applyEdits = async () => {
    if (!isImageReady) {
      console.log("Image not ready for editing yet");
      return;
    }

    try {
      // Starting with manipulations that can be performed directly by ImageManipulator
      const actions: ImageManipulator.Action[] = [];

      // Apply crop and rotation actions
      if (
        cropParams.rotation !== 0 ||
        cropParams.flipHorizontal ||
        cropParams.flipVertical ||
        cropParams.crop.width !== 1 ||
        cropParams.crop.height !== 1
      ) {
        // Rotation
        if (cropParams.rotation !== 0) {
          actions.push({ rotate: cropParams.rotation });
        }

        // Flips
        if (cropParams.flipHorizontal) {
          actions.push({ flip: FlipType.Horizontal });
        }

        if (cropParams.flipVertical) {
          actions.push({ flip: FlipType.Vertical });
        }

        // Crop
        if (cropParams.crop.width !== 1 || cropParams.crop.height !== 1) {
          actions.push({
            crop: {
              originX: cropParams.crop.originX,
              originY: cropParams.crop.originY,
              width: cropParams.crop.width,
              height: cropParams.crop.height,
            },
          });
        }
      }

      // Create a cache directory if needed
      const cacheDir = `${FileSystem.cacheDirectory}edited_images/`;
      const dirInfo = await FileSystem.getInfoAsync(cacheDir);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(cacheDir, { intermediates: true });
      }

      // Process the image with a lower quality for preview (faster)
      const manipResult = await ImageManipulator.manipulateAsync(
        originalImageUri,
        actions,
        { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
      );

      // Use this as the base for further adjustments
      // Note: In a full implementation, you'd process the adjustments
      // using shaders or another image processing library
      setPreviewImageUri(manipResult.uri);

      // For a production app, here is where you would apply complex adjustments
      // like exposure, contrast, saturation, etc. using a library
      // like GLView or a shader implementation
    } catch (error) {
      console.error("Error applying edits:", error);
      Alert.alert(
        "Image Processing Error",
        "There was a problem processing your image."
      );
    }
  };

  // Save edited image with all applied adjustments
  const saveImage = async () => {
    if (!isImageReady) {
      Alert.alert(
        "Please wait",
        "The image is still being prepared for editing."
      );
      return;
    }

    try {
      setIsSaving(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Create a cache directory if needed
      const cacheDir = `${FileSystem.cacheDirectory}edited_images/`;
      const dirInfo = await FileSystem.getInfoAsync(cacheDir);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(cacheDir, { intermediates: true });
      }

      // Apply all manipulations for the final image
      const actions: ImageManipulator.Action[] = [];

      // Add crop and rotation actions
      if (cropParams.rotation !== 0) {
        actions.push({ rotate: cropParams.rotation });
      }

      if (cropParams.flipHorizontal) {
        actions.push({ flip: FlipType.Horizontal });
      }

      if (cropParams.flipVertical) {
        actions.push({ flip: FlipType.Vertical });
      }

      if (cropParams.crop.width !== 1 || cropParams.crop.height !== 1) {
        actions.push({
          crop: {
            originX: cropParams.crop.originX,
            originY: cropParams.crop.originY,
            width: cropParams.crop.width,
            height: cropParams.crop.height,
          },
        });
      }

      // Create a final copy of the image at high quality
      // Note: In a full implementation, you'd process the adjustments
      // in addition to the transformations
      const finalImage = await ImageManipulator.manipulateAsync(
        originalImageUri,
        actions,
        { compress: 0.95, format: ImageManipulator.SaveFormat.JPEG }
      );

      // Save to media library
      try {
        const asset = await MediaLibrary.createAssetAsync(finalImage.uri);

        // Add to recent edits in AsyncStorage
        try {
          // Get existing recent edits
          const recentJson = await AsyncStorage.getItem("recentEditedImages");
          let recentImages = recentJson ? JSON.parse(recentJson) : [];

          // Add this edit to the list
          const now = new Date();
          const formattedDate = `${now.toLocaleDateString()}`;

          // Add at the beginning (newest first)
          recentImages.unshift({
            uri: asset.uri, // Use the asset URI as it's more stable
            date: formattedDate,
          });

          // Keep only the last 10 edits
          recentImages = recentImages.slice(0, 10);

          // Save back to AsyncStorage
          await AsyncStorage.setItem(
            "recentEditedImages",
            JSON.stringify(recentImages)
          );
        } catch (error) {
          console.error("Error saving to recent edits:", error);
          // Continue anyway, this is not critical
        }

        // Success message
        Alert.alert(
          "Success",
          "Your edited photo has been saved to your gallery!"
        );
      } catch (mediaErr) {
        console.error("Error saving to media library:", mediaErr);

        // Try an alternative approach for Android
        if (Platform.OS === "android") {
          try {
            // Create a local file in Pictures directory
            const timestamp = Date.now();
            const picturePath = `${FileSystem.documentDirectory}Edited_${timestamp}.jpg`;

            // Copy our final image to the pictures directory
            await FileSystem.copyAsync({
              from: finalImage.uri,
              to: picturePath,
            });

            // Then save from there
            const asset = await MediaLibrary.createAssetAsync(picturePath);

            Alert.alert(
              "Success",
              "Your edited photo has been saved to your gallery!"
            );
          } catch (finalErr) {
            console.error("Final save attempt failed:", finalErr);
            throw new Error(
              "Could not save to gallery after multiple attempts"
            );
          }
        } else {
          throw mediaErr; // Re-throw on iOS
        }
      }

      setIsSaving(false);
      router.back();
    } catch (error) {
      setIsSaving(false);
      console.error("Error saving image:", error);
      Alert.alert(
        "Error",
        "Failed to save the edited photo. Please check app permissions and try again."
      );
    }
  };

  // Share image
  const shareImage = async () => {
    // This would use the Share API to share the edited image
    Alert.alert("Share", "Sharing functionality to be implemented");
  };

  // Save as preset
  const openSavePresetModal = () => {
    setIsPresetModalVisible(true);
  };

  // Save the current editing state as a preset
  const saveAsPreset = async (presetName: string) => {
    try {
      // Create a small preview image
      const previewImageResult = await ImageManipulator.manipulateAsync(
        previewImageUri,
        [{ resize: { width: 150 } }],
        { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
      );

      // Create preset object
      const newPreset: UserPreset = {
        id: Date.now().toString(),
        name: presetName,
        adjustments: { ...adjustments },
        filterId: availableFilters[selectedFilterIndex]?.name || "Normal",
        previewImageUri: previewImageResult.uri,
      };

      // Add to presets list
      const updatedPresets = [...userPresets, newPreset];
      setUserPresets(updatedPresets);

      // Save to AsyncStorage
      await AsyncStorage.setItem("userPresets", JSON.stringify(updatedPresets));

      // Close modal and show success
      setIsPresetModalVisible(false);
      Alert.alert("Success", `Preset "${presetName}" has been saved!`);
    } catch (error) {
      console.error("Error saving preset:", error);
      Alert.alert("Error", "Failed to save preset.");
    }
  };

  // Apply a preset to the current image
  const applyPreset = (preset: UserPreset) => {
    // Apply the adjustment values
    setAdjustments({ ...preset.adjustments });

    // Apply the filter
    const filterIndex = availableFilters.findIndex(
      (f) => f.name === preset.filterId
    );
    if (filterIndex >= 0) {
      setSelectedFilterIndex(filterIndex);
    }

    // Provide feedback
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  // Render the current editing tab
  const renderTabContent = () => {
    switch (currentTab) {
      case "filters":
        return (
          <FilterTab
            filters={availableFilters}
            selectedFilterIndex={selectedFilterIndex}
            onSelectFilter={(index) => {
              setSelectedFilterIndex(index);
              applyEdits();
            }}
          />
        );
      case "adjustments":
        return (
          <AdjustmentsTab
            adjustments={adjustments}
            onAdjustmentChange={(key, value) => {
              setAdjustments((prev) => ({ ...prev, [key]: value }));
              applyEdits();
            }}
          />
        );
      case "crop":
        return (
          <CropRotateTab
            cropParams={cropParams}
            onCropParamsChange={(params) => {
              setCropParams(params);
              applyEdits();
            }}
          />
        );
      case "effects":
        return (
          <EffectsTab
            effects={{
              grain: adjustments.grain,
              vignette: adjustments.vignette,
            }}
            onEffectChange={(key, value) => {
              setAdjustments((prev) => ({ ...prev, [key]: value }));
              applyEdits();
            }}
          />
        );
      case "presets":
        return (
          <PresetsTab
            presets={userPresets}
            onApplyPreset={(preset) => {
              applyPreset(preset);
              applyEdits();
            }}
            onAddNewPreset={openSavePresetModal}
          />
        );
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: "Edit Photo",
          headerRight: () => (
            <TouchableOpacity
              onPress={saveImage}
              disabled={isSaving || !isImageReady}
              style={styles.saveButtonContainer}
              hitSlop={{ top: 20, right: 20, bottom: 20, left: 20 }}
            >
              <Text
                style={[
                  styles.saveButton,
                  (!isImageReady || isSaving) && styles.disabledButton,
                ]}
              >
                {isSaving ? "Saving..." : "Save"}
              </Text>
            </TouchableOpacity>
          ),
        }}
      />

      {/* Main image preview with loading state */}
      <View style={styles.imageContainer}>
        {!isImageReady ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3498db" />
            <Text style={styles.loadingText}>Preparing image...</Text>
          </View>
        ) : (
          <Image
            source={{ uri: previewImageUri }}
            style={styles.image}
            contentFit="contain"
          />
        )}
      </View>

      {/* Help overlay - shown the first time a user opens the editor */}
      {isHelpVisible && isImageReady && (
        <Modal
          visible={true}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setIsHelpVisible(false)}
        >
          <TouchableOpacity
            style={styles.helpOverlay}
            activeOpacity={0.9}
            onPress={() => setIsHelpVisible(false)}
          >
            <View style={styles.helpContent}>
              <Text style={styles.helpTitle}>Quick Tips</Text>

              <ScrollView style={styles.helpScrollView}>
                <View style={styles.helpItem}>
                  <Ionicons
                    name="color-filter-outline"
                    size={22}
                    color="#3498db"
                  />
                  <Text style={styles.helpText}>
                    Use Filters for quick style changes
                  </Text>
                </View>
                <View style={styles.helpItem}>
                  <Ionicons name="crop-outline" size={22} color="#3498db" />
                  <Text style={styles.helpText}>
                    Crop and rotate are fully functional
                  </Text>
                </View>
                <View style={styles.helpItem}>
                  <Ionicons name="save-outline" size={22} color="#3498db" />
                  <Text style={styles.helpText}>
                    Save presets for your favorite styles
                  </Text>
                </View>
                <View style={styles.helpItem}>
                  <Ionicons
                    name="information-circle-outline"
                    size={22}
                    color="#f39c12"
                  />
                  <Text style={styles.helpText}>
                    Advanced adjustments coming soon!
                  </Text>
                </View>
                <View style={styles.helpItem}>
                  <Ionicons name="flash-outline" size={22} color="#3498db" />
                  <Text style={styles.helpText}>
                    Basic transforms should be much faster now
                  </Text>
                </View>
              </ScrollView>

              <TouchableOpacity
                style={styles.helpDismissButton}
                onPress={() => setIsHelpVisible(false)}
              >
                <Text style={styles.helpDismissText}>Got it!</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>
      )}

      {/* Help button - always visible when image is ready */}
      {isImageReady && !isHelpVisible && (
        <TouchableOpacity
          style={styles.helpButton}
          onPress={() => setIsHelpVisible(true)}
        >
          <Ionicons name="help-circle" size={28} color="#3498db" />
        </TouchableOpacity>
      )}

      {/* Bottom editing toolbar - disabled while image is loading */}
      <EditorToolbar
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        onShare={shareImage}
        onSaveAsPreset={openSavePresetModal}
        disabled={!isImageReady}
      />

      {/* Tab content - disabled while image is loading */}
      <View
        style={[styles.tabContent, !isImageReady && styles.disabledContent]}
      >
        {isImageReady ? renderTabContent() : null}
      </View>

      {/* Save Preset Modal */}
      <SavePresetModal
        visible={isPresetModalVisible}
        onClose={() => setIsPresetModalVisible(false)}
        onSave={saveAsPreset}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  imageContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  image: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.6,
  },
  tabContent: {
    height: 150,
    backgroundColor: "#111",
    borderTopWidth: 1,
    borderTopColor: "#333",
  },
  saveButton: {
    color: "#3498db",
    fontSize: 18,
    fontWeight: "600",
    paddingHorizontal: 10,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "#fff",
    marginTop: 10,
    fontSize: 16,
  },
  disabledButton: {
    opacity: 0.5,
  },
  disabledContent: {
    opacity: 0.5,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    color: "#fff",
    marginBottom: 20,
    textAlign: "center",
  },
  errorButton: {
    backgroundColor: "#3498db",
    padding: 10,
    borderRadius: 5,
  },
  errorButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  helpOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  helpContent: {
    backgroundColor: "#222",
    padding: 20,
    borderRadius: 10,
    width: "85%",
    maxWidth: 400,
    borderWidth: 1,
    borderColor: "#444",
  },
  helpTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
    color: "#fff",
    textAlign: "center",
  },
  helpItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
    paddingHorizontal: 5,
  },
  helpText: {
    marginLeft: 10,
    color: "#ddd",
    fontSize: 14,
    flex: 1,
  },
  helpDismissButton: {
    backgroundColor: "#3498db",
    padding: 10,
    borderRadius: 5,
    alignItems: "center",
    marginTop: 15,
  },
  helpDismissText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  helpButton: {
    position: "absolute",
    bottom: 160,
    right: 15,
    padding: 8,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    borderRadius: 20,
    zIndex: 100,
    borderWidth: 1,
    borderColor: "#3498db",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 3,
    elevation: 5,
  },
  helpScrollView: {
    maxHeight: 250,
    marginBottom: 5,
  },
  saveButtonContainer: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    minWidth: 70,
    alignItems: "center",
  },
});
