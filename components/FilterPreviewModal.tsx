import { Ionicons } from "@expo/vector-icons";
import type React from "react";
import {
  Dimensions,
  Image,
  Modal,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import FilterLUT from "./FilterLUT";

// Sample high-quality image for filter preview
const PREVIEW_IMAGE = require("../assets/filter-preview.jpg");

interface FilterPreviewModalProps {
  visible: boolean;
  onClose: () => void;
  filterName: string;
  filterColor: string;
  filterOpacity: number;
  filterDescription: string;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

const FilterPreviewModal: React.FC<FilterPreviewModalProps> = ({
  visible,
  onClose,
  filterName,
  filterColor,
  filterOpacity,
  filterDescription,
}) => {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <StatusBar hidden />
      <View style={styles.modalContainer}>
        <View style={styles.previewContainer}>
          {/* Header with filter name and close button */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>{filterName}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="white" />
            </TouchableOpacity>
          </View>

          {/* Filter preview with sample image */}
          <View style={styles.previewImageContainer}>
            <FilterLUT
              filter={filterName}
              color={filterColor}
              opacity={filterOpacity}
              width={SCREEN_WIDTH}
              height={SCREEN_WIDTH * 1.25} // 4:5 aspect ratio
            >
              <Image
                source={PREVIEW_IMAGE}
                style={styles.previewImage}
                resizeMode="cover"
              />
            </FilterLUT>
          </View>

          {/* Filter description */}
          <View style={styles.descriptionContainer}>
            <Text style={styles.descriptionTitle}>About this filter</Text>
            <Text style={styles.descriptionText}>{filterDescription}</Text>
          </View>

          {/* Vintage film branding */}
          <View style={styles.filmBrandingContainer}>
            <View style={styles.filmFrameEdges} />
            <Text style={styles.exposureText}>ISO 400 • 35mm</Text>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.9)",
    justifyContent: "center",
    alignItems: "center",
  },
  previewContainer: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    backgroundColor: "#121212",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#000",
  },
  headerTitle: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
  },
  closeButton: {
    padding: 8,
  },
  previewImageContainer: {
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH * 1.25, // 4:5 aspect ratio
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
  },
  previewImage: {
    width: "100%",
    height: "100%",
  },
  descriptionContainer: {
    padding: 20,
    backgroundColor: "#1a1a1a",
  },
  descriptionTitle: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  descriptionText: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 14,
    lineHeight: 20,
  },
  filmBrandingContainer: {
    padding: 20,
    alignItems: "center",
  },
  filmFrameEdges: {
    width: "80%",
    height: 40,
    borderColor: "rgba(255, 255, 255, 0.3)",
    borderWidth: 1,
    borderStyle: "dashed",
    marginBottom: 8,
  },
  exposureText: {
    color: "rgba(255, 255, 255, 0.5)",
    fontSize: 12,
    fontFamily: "monospace",
  },
});

export default FilterPreviewModal;
