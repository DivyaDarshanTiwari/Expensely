// components/Modals/CategoryModal.tsx
import React from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { styles } from "@/components/AddTransactions/styles/styles";

export default function CategoryModal({
  show,
  setShow,
  formScale,
  transactionType,
  recentCategories,
  allCategories,
  transactionData,
  setTransactionData,
  setShowAddCategoryModal,
}: any) {
  return (
    <Modal
      visible={show}
      transparent
      animationType="slide"
      onRequestClose={() => setShow(false)}
    >
      <View style={styles.classyModalOverlay}>
        <Animated.View
          style={[
            styles.classyModalContent,
            { transform: [{ scale: formScale }] },
          ]}
        >
          {/* Modal Header */}
          <View style={styles.classyModalHeader}>
            <View style={styles.modalHeaderContent}>
              <Text style={styles.classyModalTitle}>Choose Category</Text>
              <Text style={styles.classyModalSubtitle}>
                Select a category for your {transactionType}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => setShow(false)}
              style={styles.classyCloseButton}
            >
              <Ionicons name="close" size={20} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.classyModalScrollView}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.classyScrollContent}
          >
            {recentCategories.length > 0 && (
              <>
                <View style={styles.sectionHeaderContainer}>
                  <Ionicons name="time-outline" size={16} color="#8B5CF6" />
                  <Text style={styles.classySectionTitle}>Recently Used</Text>
                </View>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.recentCategoriesContainer}
                >
                  {recentCategories.map((item: any) => (
                    <TouchableOpacity
                      key={item.id}
                      style={[
                        styles.recentCategoryChip,
                        transactionData.category === item.id &&
                          styles.recentCategoryChipSelected,
                      ]}
                      onPress={() => {
                        setTransactionData((prev: any) => ({
                          ...prev,
                          category: item.id,
                        }));
                        setShow(false);
                      }}
                    >
                      <View
                        style={[
                          styles.recentChipIcon,
                          { backgroundColor: item.color + "20" },
                        ]}
                      >
                        <Ionicons
                          name={item.icon as any}
                          size={16}
                          color={item.color}
                        />
                      </View>
                      <Text
                        style={[
                          styles.recentChipText,
                          transactionData.category === item.id &&
                            styles.recentChipTextSelected,
                        ]}
                      >
                        {item.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </>
            )}

            {/* All Categories Section */}
            <View style={styles.sectionHeaderContainer}>
              <Ionicons name="grid-outline" size={16} color="#10B981" />
              <Text style={styles.classySectionTitle}>All Categories</Text>
            </View>

            <View style={styles.classyCategoriesContainer}>
              <View style={styles.categoriesGrid}>
                {allCategories.map((item: any, index: number) => {
                  const isSelected = transactionData.category === item.id;
                  return (
                    <TouchableOpacity
                      key={`${item.id}-${index}`}
                      style={[
                        styles.classyCategoryCardGrid,
                        isSelected && styles.classyCategoryCardSelected,
                        index % 2 === 0
                          ? styles.categoryCardLeft
                          : styles.categoryCardRight,
                      ]}
                      onPress={() => {
                        setTransactionData((prev: any) => ({
                          ...prev,
                          category: item.id,
                        }));
                        setShow(false);
                      }}
                      activeOpacity={0.7}
                    >
                      <View style={styles.classyCategoryContentGrid}>
                        <View
                          style={[
                            styles.classyCategoryIconContainerGrid,
                            { backgroundColor: item.color + "15" },
                            isSelected && {
                              backgroundColor: item.color + "25",
                            },
                          ]}
                        >
                          <Ionicons
                            name={item.icon as any}
                            size={20}
                            color={item.color}
                          />
                        </View>
                        <View style={styles.classyCategoryTextContainerGrid}>
                          <Text
                            style={[
                              styles.classyCategoryNameGrid,
                              isSelected && styles.classyCategoryNameSelected,
                            ]}
                            numberOfLines={1}
                          >
                            {item.name}
                          </Text>
                          <Text style={styles.classyCategoryTypeGrid}>
                            {item.type === "custom"
                              ? "Custom"
                              : transactionType === "expense"
                                ? "Expense"
                                : "Income"}
                          </Text>
                        </View>
                      </View>
                      {isSelected && (
                        <View style={styles.selectedIndicatorGrid}>
                          <Ionicons
                            name="checkmark-circle"
                            size={16}
                            color={item.color}
                          />
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}

                {/* Add New Category Card */}
                <TouchableOpacity
                  style={styles.addCategoryCardClassyGrid}
                  onPress={() => {
                    setShow(false);
                    setShowAddCategoryModal(true);
                  }}
                  activeOpacity={0.7}
                >
                  <View style={styles.classyCategoryContentGrid}>
                    <View style={styles.addCategoryIconContainerGrid}>
                      <Ionicons
                        name="add-circle-outline"
                        size={20}
                        color="#10B981"
                      />
                    </View>
                    <View style={styles.classyCategoryTextContainerGrid}>
                      <Text style={styles.addCategoryTextGrid}>
                        Create New Category
                      </Text>
                      <Text style={styles.addCategorySubtextGrid}>
                        Add your custom category
                      </Text>
                    </View>
                  </View>
                  <View style={styles.addCategoryArrowGrid}>
                    <Ionicons
                      name="chevron-forward"
                      size={14}
                      color="#10B981"
                    />
                  </View>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}
