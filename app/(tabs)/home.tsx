import type { UserPreset } from "@/types/editor";
import { saveImagePermanently, validateFileExists } from "@/utils/fileUtils";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import * as MediaLibrary from "expo-media-library";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Dimensions,
  FlatList,

  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function HomeScreen() {
  const router = useRouter();
  const [recentImages, setRecentImages] = useState<
    { uri: string; date: string }[]
  >([]);
  const [savedPresets, setSavedPresets] = useState<UserPreset[]>([]);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  useEffect(() => {
    // Check permissions and load data
    checkPermissions();
    loadRecentImages();
    loadSavedPresets();
  }, []);

  // Check for media library permissions
  const checkPermissions = async () => {
    const { status } = await MediaLibrary.requestPermissionsAsync();
    setHasPermission(status === "granted");
  };

  // Load recently edited images from AsyncStorage
  const loadRecentImages = async () => {
    try {
      const recentImagesJson = await AsyncStorage.getItem("recentEditedImages");
      if (recentImagesJson) {
        const images = JSON.parse(recentImagesJson);
        setRecentImages(images);
      }
    } catch (error) {
      console.error("Error loading recent images:", error);
    }
  };

  // Load saved presets
  const loadSavedPresets = async () => {
    try {
      const presetsJson = await AsyncStorage.getItem("userPresets");
      if (presetsJson) {
        const presets = JSON.parse(presetsJson);
        setSavedPresets(presets);
      }
    } catch (error) {
      console.error("Error loading saved presets:", error);
    }
  };

  // Handle importing a photo for editing
  const importPhoto = async () => {
    try {
      // Check for permissions
      if (!hasPermission) {
        const { status } = await MediaLibrary.requestPermissionsAsync();
        if (status !== "granted") {
          Alert.alert(
            "Permission Required",
            "Please allow access to your photo library to import images."
          );
          return;
        }
        setHasPermission(true);
      }

      // Open image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 1,
        allowsMultipleSelection: false,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        try {
          // Get the selected image
          const selectedImage = result.assets[0];

          // Save the image to a permanent location before navigation
          const permanentUri = await saveImagePermanently(selectedImage.uri);

          // Verify the file exists before navigating
          const fileExists = await validateFileExists(permanentUri);

          if (!fileExists) {
            throw new Error("Failed to save image to permanent storage");
          }

          // Navigate to editor with the permanent URI
          router.push({
            pathname: "/editor",
            params: { uri: permanentUri },
          });
        } catch (error) {
          console.error("Error preprocessing image:", error);
          Alert.alert(
            "Error",
            "Failed to process the selected image. Please try another one."
          );
        }
      }
    } catch (error) {
      console.error("Error importing photo:", error);
      Alert.alert("Error", "Failed to import photo. Please try again.");
    }
  };

  // Open a recent image in the editor
  const openRecentImage = (imageUri: string) => {
    router.push({
      pathname: "/editor",
      params: { uri: imageUri },
    });
  };

  // Navigate to presets screen
  const navigateToPresets = () => {
    // This would navigate to a dedicated presets screen
    Alert.alert("Presets", "Navigate to presets management screen");
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" translucent backgroundColor="transparent" />
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>FilmLab</Text>
        <Text style={styles.subtitle}>Professional Photo Editing</Text>
      </View>

      {/* Import Photo Button */}
      <TouchableOpacity style={styles.importButton} onPress={importPhoto}>
        <Ionicons name="add-circle" size={28} color="#fff" />
        <Text style={styles.importButtonText}>Import Photo</Text>
      </TouchableOpacity>

      {/* Recent Images */}
      <View style={styles.sectionContainer}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recently Edited</Text>
        </View>

        {recentImages.length > 0 ? (
          <FlatList
            data={recentImages}
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.recentsList}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.recentItem}
                onPress={() => openRecentImage(item.uri)}
              >
                <Image
                  source={{ uri: item.uri }}
                  style={styles.recentImage}
                  contentFit="cover"
                />
                <Text style={styles.recentDate}>{item.date}</Text>
              </TouchableOpacity>
            )}
            keyExtractor={(item, index) => `recent-${index}`}
          />
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No recent edits</Text>
          </View>
        )}
      </View>

      {/* Saved Presets */}
      <View style={styles.sectionContainer}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Saved Presets</Text>
          <TouchableOpacity onPress={navigateToPresets}>
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        </View>

        {savedPresets.length > 0 ? (
          <FlatList
            data={savedPresets.slice(0, 4)}
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.presetsList}
            renderItem={({ item }) => (
              <View style={styles.presetItem}>
                <Image
                  source={{ uri: item.previewImageUri }}
                  style={styles.presetImage}
                  contentFit="cover"
                />
                <Text style={styles.presetName}>{item.name}</Text>
              </View>
            )}
            keyExtractor={(item) => `preset-${item.id}`}
          />
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No saved presets</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121212",
    padding: 20,
  },
  header: {
    marginTop: 20,
    marginBottom: 30,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#fff",
  },
  subtitle: {
    fontSize: 16,
    color: "#aaa",
    marginTop: 5,
  },
  importButton: {
    backgroundColor: "#3498db",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 30,
  },
  importButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
    marginLeft: 10,
  },
  sectionContainer: {
    marginBottom: 30,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#fff",
  },
  viewAllText: {
    color: "#3498db",
    fontSize: 14,
  },
  recentsList: {
    marginLeft: -5,
  },
  recentItem: {
    width: 150,
    marginHorizontal: 5,
  },
  recentImage: {
    width: "100%",
    height: 150,
    borderRadius: 10,
  },
  recentDate: {
    color: "#aaa",
    fontSize: 12,
    marginTop: 5,
  },
  presetsList: {
    marginLeft: -5,
  },
  presetItem: {
    width: 120,
    marginHorizontal: 5,
  },
  presetImage: {
    width: "100%",
    height: 120,
    borderRadius: 10,
  },
  presetName: {
    color: "#ddd",
    fontSize: 14,
    marginTop: 5,
    textAlign: "center",
  },
  emptyContainer: {
    height: 100,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 10,
  },
  emptyText: {
    color: "#777",
    fontSize: 14,
  },
});
