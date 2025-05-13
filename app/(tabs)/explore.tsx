import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as MediaLibrary from "expo-media-library";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function GalleryScreen() {
  const [photos, setPhotos] = useState<MediaLibrary.Asset[]>([]);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<MediaLibrary.Asset | null>(
    null
  );

  useEffect(() => {
    (async () => {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      setHasPermission(status === "granted");

      if (status === "granted") {
        loadPhotos();
      } else {
        setLoading(false);
      }
    })();
  }, []);

  const loadPhotos = async () => {
    setLoading(true);
    try {
      const { assets } = await MediaLibrary.getAssetsAsync({
        mediaType: MediaLibrary.MediaType.photo,
        first: 100,
        sortBy: MediaLibrary.SortBy.creationTime,
      });
      setPhotos(assets);
    } catch (error) {
      console.error("Error loading photos:", error);
    } finally {
      setLoading(false);
    }
  };

  const closePreview = () => {
    setSelectedImage(null);
  };

  // Permission not determined yet
  if (hasPermission === null) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text style={styles.text}>Requesting permissions...</Text>
      </View>
    );
  }

  // Permission denied
  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <Ionicons name="images-outline" size={80} color="#aaa" />
        <Text style={styles.text}>Gallery access denied</Text>
        <Text style={styles.subText}>
          Please grant media library permission to view your photos
        </Text>
        <TouchableOpacity
          style={styles.permissionButton}
          onPress={async () => {
            const { status } = await MediaLibrary.requestPermissionsAsync();
            setHasPermission(status === "granted");
          }}
        >
          <Text style={styles.permissionButtonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Loading state
  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text style={styles.text}>Loading photos...</Text>
      </View>
    );
  }

  // No photos found
  if (photos.length === 0) {
    return (
      <View style={styles.container}>
        <Ionicons name="images-outline" size={80} color="#aaa" />
        <Text style={styles.text}>No photos found</Text>
        <Text style={styles.subText}>
          Photos you take with the camera will appear here
        </Text>
      </View>
    );
  }

  // Full-size image preview
  if (selectedImage) {
    return (
      <View style={styles.previewContainer}>
        <Image
          source={{ uri: selectedImage.uri }}
          style={styles.previewImage}
          resizeMode="contain"
        />
        <TouchableOpacity style={styles.closeButton} onPress={closePreview}>
          <Ionicons name="close-circle" size={36} color="white" />
        </TouchableOpacity>
      </View>
    );
  }

  // Gallery grid view
  return (
    <View style={styles.galleryContainer}>
      <FlatList
        data={photos}
        numColumns={3}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.imageContainer}
            onPress={() => setSelectedImage(item)}
          >
            <Image source={{ uri: item.uri }} style={styles.image} />
          </TouchableOpacity>
        )}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.photoGrid}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  text: {
    fontSize: 18,
    marginTop: 16,
    textAlign: "center",
  },
  subText: {
    fontSize: 14,
    textAlign: "center",
    color: "#666",
    marginTop: 8,
  },
  permissionButton: {
    marginTop: 20,
    backgroundColor: "#007AFF",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  permissionButtonText: {
    color: "white",
    fontSize: 16,
  },
  galleryContainer: {
    flex: 1,
    backgroundColor: "#fff",
  },
  photoGrid: {
    paddingHorizontal: 1,
    paddingBottom: 5,
  },
  imageContainer: {
    flex: 1 / 3,
    aspectRatio: 1,
    padding: 1,
  },
  image: {
    flex: 1,
    borderRadius: 3,
  },
  previewContainer: {
    flex: 1,
    backgroundColor: "black",
    justifyContent: "center",
  },
  previewImage: {
    flex: 1,
    width: "100%",
  },
  closeButton: {
    position: "absolute",
    top: 40,
    right: 20,
    zIndex: 10,
  },
});
