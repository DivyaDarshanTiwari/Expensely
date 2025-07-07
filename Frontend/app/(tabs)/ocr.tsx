import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import axios from "axios";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../../auth/firebase";
import { useFocusEffect } from "expo-router";

export default function CameraUploadScreen() {
  useFocusEffect(
    useCallback(() => {
      const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        if (firebaseUser) {
          try {
            const token = await firebaseUser.getIdToken();
            setIdToken(token);
          } catch (error) {
            console.error("Error fetching ID token:", error);
            Alert.alert("Error", "Could not retrieve authentication token.");
          }
        } else {
          setIdToken(null);
        }
      });

      return () => unsubscribe();
    }, [])
  );

  const [ocrResult, setOcrResult] = useState<{
    category: string;
    total_amount: number;
    description: string;
  } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [hasCaptured, setHasCaptured] = useState(false);
  const [idToken, setIdToken] = useState<string | null>(null);

  const requestCameraPermissions = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    return status === "granted";
  };

  const openCamera = async () => {
    try {
      const isPermitted = await requestCameraPermissions();
      if (!isPermitted) {
        Alert.alert(
          "Permission Required",
          "Camera permission is required to take photos."
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8, // Increased quality for better OCR
        base64: true, // Get base64 for potential direct processing
      });

      if (!result.canceled) {
        setHasCaptured(true);
        await processImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error("Camera error:", error);
      Alert.alert("Error", "Could not open camera.");
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
        "https://zp5k3bcx-8082.inc1.devtunnels.ms/api/v1/ocr/get/json",
        formData,
        {
          headers: {
            Authorization: `Bearer ${idToken}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (response.data) {
        // Process the OCR result
        const extractedText = response.data.expense;
        setOcrResult(extractedText);
        Alert.alert("OCR Successful", "Text extracted successfully!");
      } else {
        throw new Error("No data received from OCR service");
      }
    } catch (error: any) {
      console.error("OCR Error:", error);
      let errorMessage = "OCR processing failed";
      if (error.response) {
        errorMessage += `: ${error.response.data?.message || "Server error"}`;
      } else if (error.message) {
        errorMessage += `: ${error.message}`;
      }
      Alert.alert("OCR Error", errorMessage);
      setOcrResult(null);
    } finally {
      setUploading(false);
    }
  };

  // Helper function to clean up OCR results
  const extractCleanText = (ocrData: any): string => {
    try {
      // Adjust this based on your API's response structure
      if (ocrData.ParsedResults && ocrData.ParsedResults[0]?.ParsedText) {
        let text = ocrData.ParsedResults[0].ParsedText;

        // Basic cleaning of OCR results
        text = text
          .replace(/\r\n/g, "\n") // Normalize line breaks
          .replace(/\s+/g, " ") // Remove extra spaces
          .trim();

        return text;
      }
      return "No readable text found in the OCR results";
    } catch (e) {
      console.error("Error parsing OCR results:", e);
      return "Error processing OCR results";
    }
  };

  const resetCapture = () => {
    setOcrResult(null);
    setHasCaptured(false);
  };

  return (
    <View style={styles.container}>
      {!hasCaptured ? (
        <TouchableOpacity
          style={styles.button}
          onPress={openCamera}
          disabled={uploading}
        >
          <Text style={styles.buttonText}>
            {uploading ? "Processing..." : "Capture Document"}
          </Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.resultContainer}>
          <TouchableOpacity
            style={[styles.button, styles.secondaryButton]}
            onPress={resetCapture}
          >
            <Text style={styles.buttonText}>Capture Again</Text>
          </TouchableOpacity>

          <ScrollView style={styles.resultBox}>
            {ocrResult ? (
              <>
                <Text style={styles.resultText}>
                  Category: {ocrResult.category}
                </Text>
                <Text style={styles.resultText}>
                  Total Amount: {ocrResult.total_amount}
                </Text>
                <Text style={styles.resultText}>
                  Description: {ocrResult.description}
                </Text>
              </>
            ) : (
              <Text style={styles.resultText}>Processing OCR results...</Text>
            )}
          </ScrollView>

          {uploading && <ActivityIndicator size="large" color="#0000ff" />}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    backgroundColor: "#f5f5f5",
  },
  button: {
    backgroundColor: "#007AFF",
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 8,
    marginBottom: 20,
  },
  primaryButton: {
    backgroundColor: "#34C759",
  },
  secondaryButton: {
    backgroundColor: "#FF3B30",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
    textAlign: "center",
  },
  resultContainer: {
    width: "100%",
    flex: 1,
  },
  resultBox: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 15,
    marginTop: 20,
    minHeight: 200,
  },
  resultText: {
    fontSize: 16,
    lineHeight: 24,
  },
});
