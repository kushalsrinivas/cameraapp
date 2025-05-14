import * as FileSystem from "expo-file-system";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import * as ImageManipulator from "expo-image-manipulator";
import * as MediaLibrary from "expo-media-library";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import AdjustmentsTab from "@/components/editor/AdjustmentsTab";
import CropRotateTab from "@/components/editor/CropRotateTab";
// Components
import EditorToolbar from "@/components/editor/EditorToolbar";
import EffectsTab from "@/components/editor/EffectsTab";
import FilterTab from "@/components/editor/FilterTab";
import PresetsTab from "@/components/editor/PresetsTab";
import SavePresetModal from "@/components/editor/SavePresetModal";

// Types
import type { EditorAdjustments, UserPreset } from "@/types/editor";
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
  const [isPresetModalVisible, setIsPresetModalVisible] = useState(false);
  const [availableFilters, setAvailableFilters] = useState<LutFilter[]>([]);
  const [selectedFilterIndex, setSelectedFilterIndex] = useState(0);
  const [isImageReady, setIsImageReady] = useState(false);

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
        // Load LUT filters
        const filters = await loadLutFilters();
        setAvailableFilters(filters);

        // Load user presets from AsyncStorage
        const presetsJson = await AsyncStorage.getItem("userPresets");
        if (presetsJson) {
          setUserPresets(JSON.parse(presetsJson));
        }

        // Prepare the image for editing (especially important for Android)
        await prepareImageForEditing(imageUri);
      } catch (error) {
        console.error("Error initializing editor:", error);
        Alert.alert(
          "Error",
          "Failed to initialize the editor. Please try again."
        );
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
        // Skip the resize step on iOS as it's usually not needed
        if (Platform.OS === "ios") {
          // Just make a copy at high quality
          const result = await ImageManipulator.manipulateAsync(uri, [], {
            compress: 0.95,
            format: ImageManipulator.SaveFormat.JPEG,
          });
          setOriginalImageUri(result.uri);
          setPreviewImageUri(result.uri);
          setIsImageReady(true);
          return;
        }

        // For Android, always resize and save to our cache
        const result = await ImageManipulator.manipulateAsync(
          uri,
          [{ resize: { width: maxDimension } }],
          { compress: 0.9, format: ImageManipulator.SaveFormat.JPEG }
        );

        // Copy the file to our cache location
        await FileSystem.copyAsync({
          from: result.uri,
          to: cachedPath,
        });

        // Set as the working image
        setOriginalImageUri(cachedPath);
        setPreviewImageUri(cachedPath);
        setIsImageReady(true);
      } catch (error) {
        console.error("Error preparing image:", error);

        // Fallback: try direct file system copy
        try {
          await FileSystem.copyAsync({
            from: uri,
            to: cachedPath,
          });

          setOriginalImageUri(cachedPath);
          setPreviewImageUri(cachedPath);
          setIsImageReady(true);
        } catch (copyError) {
          console.error("Error copying image:", copyError);
          throw new Error("Could not prepare image for editing");
        }
      }
    } catch (error) {
      console.error("Failed to prepare image:", error);
      Alert.alert(
        "Image Error",
        "There was a problem loading the image. Please try a different image."
      );
      router.back();
    }
  };

  // Apply edits to create preview image
  const applyEdits = async () => {
    if (!isImageReady) {
      console.log("Image not ready for editing yet");
      return;
    }

    try {
      // Apply manipulations based on current state
      const actions: ImageManipulator.Action[] = [];

      // Apply crop if changed
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
          actions.push({ flip: "horizontal" });
        }

        if (cropParams.flipVertical) {
          actions.push({ flip: "vertical" });
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

      // Make the image URI a usable format for Android
      const imageToProcess = originalImageUri;

      // Apply adjustments using ImageManipulator
      try {
        // Create a temporary cache directory path
        const cacheDir = `${FileSystem.cacheDirectory}edited_images/`;
        const filename = `preview_${Date.now()}.jpg`;
        const cachedPath = `${cacheDir}${filename}`;

        // Process the image
        const manipResult = await ImageManipulator.manipulateAsync(
          imageToProcess,
          actions,
          { compress: 0.9, format: ImageManipulator.SaveFormat.JPEG }
        );

        // On Android, copy to our cache location to ensure it remains accessible
        if (Platform.OS === "android") {
          await FileSystem.copyAsync({
            from: manipResult.uri,
            to: cachedPath,
          });
          setPreviewImageUri(cachedPath);
        } else {
          // On iOS, we can use the manipulated image directly
          setPreviewImageUri(manipResult.uri);
        }
      } catch (err) {
        console.error("Manipulation failed:", err);

        // If the edit fails, notify the user
        Alert.alert(
          "Edit Failed",
          "Could not apply these edits. Try a different adjustment."
        );
      }
    } catch (error) {
      console.error("Error applying edits:", error);
      Alert.alert(
        "Image Processing Error",
        "There was a problem processing your image."
      );
    }
  };

  // Save edited image
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

      // Create a final copy of the image at high quality
      const finalImage = await ImageManipulator.manipulateAsync(
        previewImageUri,
        [], // No additional manipulations
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
            uri: finalImage.uri,
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
    fontSize: 16,
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
});
