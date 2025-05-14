import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  Keyboard,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";

interface SavePresetModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (name: string) => void;
}

export default function SavePresetModal({
  visible,
  onClose,
  onSave,
}: SavePresetModalProps) {
  const [presetName, setPresetName] = useState("");

  // Handle save
  const handleSave = () => {
    if (presetName.trim().length === 0) {
      // Alert user or add validation styling
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onSave(presetName);
    setPresetName(""); // Clear input for next time
  };

  // Handle cancel
  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPresetName(""); // Clear input
    onClose();
  };

  // Dismiss keyboard when tapping outside the modal content
  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <TouchableWithoutFeedback onPress={dismissKeyboard}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Save Preset</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={handleClose}
              >
                <Ionicons name="close-outline" size={28} color="#999" />
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>Preset Name:</Text>
            <TextInput
              style={styles.input}
              value={presetName}
              onChangeText={setPresetName}
              placeholder="E.g. Vintage Film"
              placeholderTextColor="#777"
              autoFocus
              returnKeyType="done"
              onSubmitEditing={handleSave}
            />

            <View style={styles.buttonsContainer}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={handleClose}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.saveButton,
                  presetName.trim().length === 0 && styles.saveButtonDisabled,
                ]}
                onPress={handleSave}
                disabled={presetName.trim().length === 0}
              >
                <Text style={styles.saveButtonText}>Save Preset</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.7)",
  },
  modalContent: {
    width: "85%",
    backgroundColor: "#222",
    borderRadius: 12,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "600",
  },
  closeButton: {
    padding: 5,
  },
  label: {
    color: "#ddd",
    fontSize: 16,
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#333",
    borderRadius: 8,
    padding: 12,
    color: "#fff",
    fontSize: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#444",
  },
  buttonsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  cancelButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#555",
  },
  cancelButtonText: {
    color: "#ddd",
    fontSize: 16,
  },
  saveButton: {
    backgroundColor: "#3498db",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  saveButtonDisabled: {
    backgroundColor: "#3498db80", // Semi-transparent for disabled state
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "500",
  },
});
