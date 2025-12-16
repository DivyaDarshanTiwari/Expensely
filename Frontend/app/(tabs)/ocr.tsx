"use client";

import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import axios from "axios";
import { useFocusEffect, useRouter } from "expo-router";
import Constants from "expo-constants";
import { LinearGradient } from "expo-linear-gradient";
import { useCallback, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
  Animated,
  StatusBar,
  Image,
  SafeAreaView,
} from "react-native";
import { getStoredToken } from "../../utils/storage";
import { refreshInvalidToken } from "@/utils/refreshIfInvalid";
import { useDispatch } from "react-redux";
import { triggerRefresh } from "@/hooks/redux/dashboardSlice";



const sassyMessages = {
  processing: [
    "Hold up, I'm working my magic! ✨",
    "Crunching numbers like a boss... 💪",
    "Reading your receipt better than you do! 👀",
    "AI powers activated! 🚀",
    "Decoding this masterpiece... 🎨",
  ],
  success: [
    "Boom! Nailed it! 🎯",
    "I'm basically a receipt whisperer! 🔮",
    "Another one bites the dust! 💥",
    "Easy peasy, lemon squeezy! 🍋",
    "Flawless victory! 👑",
  ],
  tips: [
    "Pro tip: Good lighting = happy AI! 💡",
    "Keep it steady, we're not doing yoga here! 🧘‍♀️",
    "Flat receipts only - no origami please! 📄",
    "The clearer the better, darling! ✨",
    "Make it crisp, make it count! 📸",
  ],
};

export default function CameraUploadScreen() {
  const router = useRouter();
  const [ocrResult, setOcrResult] = useState<{
    category: string;
    total_amount: number;
    description: string;
  } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [hasCaptured, setHasCaptured] = useState(false);
  const [idToken, setIdToken] = useState<string | null>(null);
  const [capturedImageUri, setCapturedImageUri] = useState<string | null>(null);
  const [currentSassyMessage, setCurrentSassyMessage] = useState("");
  const dispatch = useDispatch();

  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const bounceAnim = useRef(new Animated.Value(0)).current;

  const getRandomMessage = (type: keyof typeof sassyMessages) => {
    const messages = sassyMessages[type];
    return messages[Math.floor(Math.random() * messages.length)];
  };

  useFocusEffect(
    useCallback(() => {
      // Start animations
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
      ]).start();

      // Set random tip message
      setCurrentSassyMessage(getRandomMessage("tips"));

      // Try to get the stored token on focus

      (async () => {
        await refreshInvalidToken();
        try {
          const token = await getStoredToken();
          if (token) {
            setIdToken(token);
          } else {
            setIdToken(null);
          }
        } catch (error) {
          console.error("Error fetching stored token:", error);
          Alert.alert("Oops! 😅", "Couldn't get your auth token. Try again?");
          setIdToken(null);
        }
      })();
    }, [])
  );

  // Bounce animation for success
  const startBounceAnimation = () => {
    Animated.sequence([
      Animated.timing(bounceAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(bounceAnim, {
        toValue: 0,
        tension: 100,
        friction: 3,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const [status, requestPermission] = ImagePicker.useCameraPermissions();

  const openCamera = async () => {
    try {
      if (!status?.granted) {
        const permission = await requestPermission();
        if (!permission.granted) {
          Alert.alert(
            "Hold up! 📸",
            "I need camera permission to work my magic!"
          );
          return;
        }
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: 'images',
        allowsEditing: true,
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled) {
        setHasCaptured(true);
        setCapturedImageUri(result.assets[0].uri);
        setCurrentSassyMessage(getRandomMessage("processing"));
        await processImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error("Camera error:", error);
      Alert.alert("Oops! 📱", "Camera had a little hiccup. Try again?");
    }
  };

  const processImage = async (imageUri: string) => {
    setUploading(true);
    try {
      const filename = `photo_${Date.now()}.jpg`;
      const formData = new FormData();
      formData.append("bill", {
        uri: imageUri,
        name: filename,
        type: "image/jpeg",
      } as any);

      const response = await axios.post(
        `${Constants.expoConfig?.extra?.OCR_URL}/api/v1/ocr/get/json`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${idToken}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (response.data) {
        const extractedText = response.data.expense;
        setOcrResult(extractedText);
        setCurrentSassyMessage(getRandomMessage("success"));
        startBounceAnimation();
        dispatch(triggerRefresh());
        Alert.alert("Yasss! 🎉", "Receipt decoded like a pro!");
      } else {
        throw new Error("No data received from OCR service");
      }
    } catch (error: any) {
      console.error("OCR Error:", error);
      let errorMessage = "OCR had a moment 😵";
      if (error.response) {
        errorMessage += ` Server said: ${error.response.data?.message || "Something went wrong"}`;
      } else if (error.message) {
        errorMessage += ` Error: ${error.message}`;
      }
      Alert.alert("Uh oh! 😬", errorMessage);
      setOcrResult(null);
    } finally {
      setUploading(false);
    }
  };

  const resetCapture = () => {
    setOcrResult(null);
    setHasCaptured(false);
    setCapturedImageUri(null);
    setCurrentSassyMessage(getRandomMessage("tips"));

    // Restart animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const addToExpenses = () => {
    if (ocrResult) {
      // Navigate to add transaction screen with pre-filled data
      router.push({
        pathname: "/(tabs)/add-transactions",
        params: {
          type: "expense",
          amount: ocrResult.total_amount.toString(),
          description: ocrResult.description,
          category: ocrResult.category.toLowerCase(),
        },
      });
    }
  };

  const renderInitialScreen = () => (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={true}
      >
        <Animated.View
          style={[
            styles.initialContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }, { scale: scaleAnim }],
            },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Ionicons name="arrow-back" size={24} color="#111827" />
            </TouchableOpacity>
            <View style={styles.headerCenter}>
              <Text style={styles.headerTitle}>Receipt Scanner</Text>
              <View style={styles.headerBadge}>
                <Ionicons name="sparkles" size={12} color="#8B5CF6" />
                <Text style={styles.headerBadgeText}>AI Powered</Text>
              </View>
            </View>
            <View style={styles.headerRight} />
          </View>

          {/* Hero Section */}
          <View style={styles.heroSection}>
            <Animated.View
              style={[
                styles.iconContainer,
                { transform: [{ translateY: bounceAnim }] },
              ]}
            >
              <LinearGradient
                colors={["#8B5CF6", "#7C3AED"]}
                style={styles.iconGradient}
              >
                <Ionicons name="camera" size={48} color="white" />
              </LinearGradient>
            </Animated.View>
            <Text style={styles.heroTitle}>Smart Receipt Scanner</Text>
            <Text style={styles.heroSubtitle}>
              Snap it, scan it, track it! Let AI do the heavy lifting 🚀
            </Text>

            {/* Sassy Message */}
            <View style={styles.sassyMessageContainer}>
              <Text style={styles.sassyMessage}>{currentSassyMessage}</Text>
            </View>
          </View>

          {/* Features */}
          <View style={styles.featuresContainer}>
            <View style={styles.featureItem}>
              <View
                style={[styles.featureIcon, { backgroundColor: "#10B98115" }]}
              >
                <Ionicons name="flash" size={20} color="#10B981" />
              </View>
              <Text style={styles.featureText}>Lightning Fast</Text>
              <Text style={styles.featureSubtext}>⚡ In seconds</Text>
            </View>
            <View style={styles.featureItem}>
              <View
                style={[styles.featureIcon, { backgroundColor: "#3B82F615" }]}
              >
                <Ionicons name="shield-checkmark" size={20} color="#3B82F6" />
              </View>
              <Text style={styles.featureText}>Super Secure</Text>
              <Text style={styles.featureSubtext}>🔒 Privacy first</Text>
            </View>
            <View style={styles.featureItem}>
              <View
                style={[styles.featureIcon, { backgroundColor: "#F59E0B15" }]}
              >
                <Ionicons name="analytics" size={20} color="#F59E0B" />
              </View>
              <Text style={styles.featureText}>Smart AF</Text>
              <Text style={styles.featureSubtext}>🧠 AI powered</Text>
            </View>
          </View>

          {/* Camera Button */}
          <View style={styles.cameraButtonContainer}>
            <TouchableOpacity
              style={styles.cameraButton}
              onPress={openCamera}
              disabled={uploading}
            >
              <LinearGradient
                colors={["#10B981", "#059F69"]}
                style={styles.cameraButtonGradient}
              >
                <Text style={styles.cameraButtonText}>Snap That Receipt!</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Instructions */}
          <View style={styles.instructionsContainer}>
            <View style={styles.instructionsHeader}>
              <Ionicons name="bulb" size={20} color="#F59E0B" />
              <Text style={styles.instructionsTitle}>
                Pro Tips for Perfect Scans
              </Text>
            </View>
            <View style={styles.instructionsList}>
              <View style={styles.instructionItem}>
                <Text style={styles.instructionEmoji}>💡</Text>
                <Text style={styles.instructionText}>
                  Good lighting is your BFF
                </Text>
              </View>
              <View style={styles.instructionItem}>
                <Text style={styles.instructionEmoji}>📐</Text>
                <Text style={styles.instructionText}>
                  Keep it flat and straight (no yoga poses!)
                </Text>
              </View>
              <View style={styles.instructionItem}>
                <Text style={styles.instructionEmoji}>🎯</Text>
                <Text style={styles.instructionText}>
                  Get all the text in frame
                </Text>
              </View>
              <View style={styles.instructionItem}>
                <Text style={styles.instructionEmoji}>🚫</Text>
                <Text style={styles.instructionText}>
                  No blurry pics - we are not Instagram!
                </Text>
              </View>
            </View>
          </View>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );

  const renderResultScreen = () => (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={true}
      >
        <Animated.View
          style={[
            styles.resultContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Ionicons name="arrow-back" size={24} color="#111827" />
            </TouchableOpacity>
            <View style={styles.headerCenter}>
              <Text style={styles.headerTitle}>Scan Results</Text>
              <Text style={styles.headerSubtitle}>AI extracted data</Text>
            </View>
            <TouchableOpacity style={styles.resetButton} onPress={resetCapture}>
              <Ionicons name="refresh" size={20} color="#8B5CF6" />
            </TouchableOpacity>
          </View>

          {/* Sassy Status */}
          <View style={styles.sassyStatusContainer}>
            <Text style={styles.sassyStatusText}>{currentSassyMessage}</Text>
          </View>

          {/* Image Preview */}
          {capturedImageUri && (
            <View style={styles.imagePreviewContainer}>
              <Image
                source={{ uri: capturedImageUri }}
                style={styles.previewImage}
              />
              <View style={styles.imageOverlay}>
                <Ionicons name="checkmark-circle" size={24} color="#10B981" />
                <Text style={styles.imageOverlayText}>Scanned! ✨</Text>
              </View>
            </View>
          )}

          {/* Processing State */}
          {uploading && (
            <View style={styles.processingCard}>
              <ActivityIndicator size="large" color="#8B5CF6" />
              <Text style={styles.processingText}>Working my magic... ✨</Text>
              <Text style={styles.processingSubtext}>
                Hang tight, this would not take long!
              </Text>
              <View style={styles.processingDots}>
                <Text style={styles.processingDot}>🔮</Text>
                <Text style={styles.processingDot}>⚡</Text>
                <Text style={styles.processingDot}>🎯</Text>
              </View>
            </View>
          )}

          {/* Results */}
          {ocrResult && !uploading && (
            <Animated.View
              style={[
                styles.resultsCard,
                { transform: [{ translateY: bounceAnim }] },
              ]}
            >
              <View style={styles.resultsHeader}>
                <Ionicons name="document-text" size={24} color="#10B981" />
                <Text style={styles.resultsTitle}>
                  Extracted Like a Boss! 💪
                </Text>
              </View>

              <View style={styles.resultItem}>
                <View style={styles.resultLabel}>
                  <Ionicons name="pricetag" size={16} color="#8B5CF6" />
                  <Text style={styles.resultLabelText}>Category</Text>
                </View>
                <View style={styles.resultValueContainer}>
                  <Text style={styles.resultValue}>{ocrResult.category}</Text>
                  <Text style={styles.resultEmoji}>🏷️</Text>
                </View>
              </View>

              <View style={styles.resultItem}>
                <View style={styles.resultLabel}>
                  <Ionicons name="cash" size={16} color="#10B981" />
                  <Text style={styles.resultLabelText}>Amount</Text>
                </View>
                <View style={styles.resultValueContainer}>
                  <Text style={[styles.resultValue, styles.amountValue]}>
                    ₹{ocrResult.total_amount}
                  </Text>
                  <Text style={styles.resultEmoji}>💰</Text>
                </View>
              </View>

              <View style={styles.resultItem}>
                <View style={styles.resultLabel}>
                  <Ionicons name="document" size={16} color="#F59E0B" />
                  <Text style={styles.resultLabelText}>Description</Text>
                </View>
                <View style={styles.resultValueContainer}>
                  <Text style={styles.resultValue}>
                    {ocrResult.description}
                  </Text>
                  <Text style={styles.resultEmoji}>📝</Text>
                </View>
              </View>
            </Animated.View>
          )}

          {/* Action Buttons */}
          {ocrResult && !uploading && (
            <View style={styles.actionButtonsContainer}>
              <TouchableOpacity
                style={styles.addExpenseButton}
                onPress={addToExpenses}
              >
                <LinearGradient
                  colors={["#10B981", "#059F69"]}
                  style={styles.addExpenseGradient}
                >
                  {/*
                  <Ionicons name="add-circle" size={24} color="white" />
                  */}
                  <Text style={styles.addExpenseText}>
                    Added to Expenses 🚀
                  </Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.retryButton}
                onPress={resetCapture}
              >
                <Ionicons name="camera" size={20} color="#8B5CF6" />
                <Text style={styles.retryText}>Scan Another One! 📸</Text>
              </TouchableOpacity>
            </View>
          )}
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FAFAFA" />
      {!hasCaptured ? renderInitialScreen() : renderResultScreen()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FAFAFA",
  },
  safeArea: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F9FAFB",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
    textAlign: "center",
  },
  headerSubtitle: {
    fontSize: 12,
    color: "#6B7280",
    textAlign: "center",
    marginTop: 2,
  },
  headerBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#8B5CF615",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    marginTop: 4,
    borderWidth: 1,
    borderColor: "#8B5CF630",
  },
  headerBadgeText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#8B5CF6",
    marginLeft: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  headerRight: {
    width: 40,
  },
  resetButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  initialContainer: {
    flex: 1,
  },
  heroSection: {
    alignItems: "center",
    paddingVertical: 32,
    paddingHorizontal: 20,
  },
  iconContainer: {
    marginBottom: 24,
    position: "relative",
  },
  iconGradient: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: "center",
    alignItems: "center",
    elevation: 8,
    shadowColor: "#8B5CF6",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    position: "relative",
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 8,
    textAlign: "center",
  },
  heroSubtitle: {
    fontSize: 15,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 22,
    paddingHorizontal: 10,
    marginBottom: 20,
  },
  sassyMessageContainer: {
    backgroundColor: "#8B5CF615",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#8B5CF630",
    marginHorizontal: 20,
  },
  sassyMessage: {
    fontSize: 14,
    fontWeight: "600",
    color: "#8B5CF6",
    textAlign: "center",
  },
  sassyStatusContainer: {
    backgroundColor: "#10B98115",
    marginHorizontal: 20,
    marginVertical: 16,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#10B98130",
  },
  sassyStatusText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#10B981",
    textAlign: "center",
  },
  featuresContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 24,
    paddingHorizontal: 30,
    marginHorizontal: 20,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  featureItem: {
    alignItems: "center",
    flex: 1,
    paddingHorizontal: 8,
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  featureText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#374151",
    textAlign: "center",
    marginBottom: 4,
  },
  featureSubtext: {
    fontSize: 12,
    color: "#6B7280",
    textAlign: "center",
  },
  cameraButtonContainer: {
    paddingHorizontal: 40,
    marginVertical: 32,
  },
  cameraButton: {
    borderRadius: 20,
    overflow: "hidden",
    elevation: 8,
    shadowColor: "#10B981",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  cameraButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
    paddingHorizontal: 32,
  },
  cameraButtonText: {
    fontSize: 18,
    fontWeight: "700",
    color: "white",
    marginLeft: 12,
  },
  instructionsContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 20,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  instructionsHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#374151",
    marginLeft: 8,
  },
  instructionsList: {
    gap: 12,
  },
  instructionItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  instructionEmoji: {
    fontSize: 16,
    marginRight: 12,
    width: 20,
  },
  instructionText: {
    fontSize: 14,
    color: "#6B7280",
    flex: 1,
    lineHeight: 20,
  },
  resultContainer: {
    flex: 1,
  },
  imagePreviewContainer: {
    position: "relative",
    marginHorizontal: 20,
    marginVertical: 20,
    borderRadius: 16,
    overflow: "hidden",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  previewImage: {
    width: "100%",
    height: 200,
    resizeMode: "cover",
  },
  imageOverlay: {
    position: "absolute",
    top: 12,
    right: 12,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(16, 185, 129, 0.9)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  imageOverlayText: {
    color: "white",
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 4,
  },
  processingCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 32,
    alignItems: "center",
    marginHorizontal: 20,
    marginVertical: 20,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  processingText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#374151",
    marginTop: 16,
  },
  processingSubtext: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 8,
    textAlign: "center",
  },
  processingDots: {
    flexDirection: "row",
    marginTop: 16,
    gap: 8,
  },
  processingDot: {
    fontSize: 20,
  },
  resultsCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 24,
    marginHorizontal: 20,
    marginVertical: 20,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  resultsHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  resultsTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
    marginLeft: 12,
  },
  resultItem: {
    marginBottom: 20,
  },
  resultLabel: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  resultLabelText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6B7280",
    marginLeft: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  resultValueContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  resultValue: {
    fontSize: 16,
    color: "#111827",
    fontWeight: "500",
    lineHeight: 24,
    flex: 1,
  },
  resultEmoji: {
    fontSize: 20,
    marginLeft: 8,
  },
  amountValue: {
    fontSize: 24,
    fontWeight: "700",
    color: "#10B981",
  },
  actionButtonsContainer: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    paddingBottom: 40,
  },
  addExpenseButton: {
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 16,
    elevation: 4,
    shadowColor: "#10B981",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  addExpenseGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  addExpenseText: {
    fontSize: 18,
    fontWeight: "700",
    color: "white",
    marginLeft: 12,
  },
  retryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  retryText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#8B5CF6",
    marginLeft: 8,
  },
});
