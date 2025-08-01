// components/AddTransactions/AddCategoryModal.tsx
import React from "react";
import { Modal, View, Text, TextInput, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { styles } from "@/components/AddTransactions/styles/styles";

export default function AddCategoryModal({
  showAddCategoryModal,
  setShowAddCategoryModal,
  newCategoryName,
  setNewCategoryName,
  addingCategory,
  handleAddPersonalCategory,
  transactionType,
}: any) {
  return (
    <Modal visible={showAddCategoryModal} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add Personal Category</Text>
            <TouchableOpacity
              onPress={() => {
                setShowAddCategoryModal(false);
                setNewCategoryName("");
              }}
              style={styles.modalCloseButton}
            >
              <Ionicons name="close" size={20} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <View style={{ padding: 20 }}>
            <Text style={styles.inputLabel}>Category Name</Text>
            <TextInput
              style={styles.textInput}
              placeholder={`Enter ${transactionType} category name`}
              value={newCategoryName}
              onChangeText={setNewCategoryName}
              autoFocus
              maxLength={50}
            />

            <TouchableOpacity
              style={[
                styles.submitButton,
                {
                  marginTop: 20,
                  opacity: !newCategoryName.trim() || addingCategory ? 0.6 : 1,
                },
              ]}
              onPress={handleAddPersonalCategory}
              disabled={!newCategoryName.trim() || addingCategory}
            >
              <LinearGradient
                colors={["#10B981", "#059F69"]}
                style={styles.submitGradient}
              >
                <Text style={styles.submitText}>
                  {addingCategory ? "Adding..." : "Add Category"}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
