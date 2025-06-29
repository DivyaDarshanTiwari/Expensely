import React, { useRef, useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Image,
  TouchableOpacity,
} from "react-native";
import { Camera, CameraType } from "expo-camera";
import * as FileSystem from "expo-file-system";
import * as ImageManipulator from "expo-image-manipulator";
import Tesseract from "tesseract.js";

export default function OCRScreen() {
  const cameraRef = useRef<Camera | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [extractedText, setExtractedText] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === "granted");
    })();
  }, []);

  const handleCapture = async () => {
    if (cameraRef.current) {
      const photo = await cameraRef.current.takePictureAsync();
      const result = await ImageManipulator.manipulateAsync(photo.uri, [], {
        compress: 0.8,
        format: ImageManipulator.SaveFormat.JPEG,
      });

      setImageUri(result.uri);
      await handleOCR(result.uri);
    }
  };

  const handleOCR = async (uri: string) => {
    setIsProcessing(true);
    setExtractedText("");

    try {
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      const imageData = `data:image/jpeg;base64,${base64}`;

      const result = await Tesseract.recognize(imageData, "eng+hin", {
        logger: (m) => console.log(m),
      });

      setExtractedText(result.data.text);
    } catch (error) {
      console.error("OCR error:", error);
      setExtractedText("Failed to extract text.");
    }

    setIsProcessing(false);
  };

  const handleRetake = () => {
    setImageUri(null);
    setExtractedText("");
  };

  if (hasPermission === null) return <View />;
  if (hasPermission === false) return <Text>No access to camera</Text>;

  return (
    <View style={styles.container}>
      {!imageUri ? (
        <View style={styles.cameraWrapper}>
          <Camera
            style={styles.camera}
            type={CameraType.back}
            ref={(ref) => {
              cameraRef.current = ref;
            }}
          />
          <TouchableOpacity style={styles.captureButton} onPress={handleCapture}>
            <Text style={styles.buttonText}>Capture</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.resultContainer}>
          <Image source={{ uri: imageUri }} style={styles.preview} />
          {isProcessing ? (
            <ActivityIndicator size="large" color="#007AFF" />
          ) : (
            <>
              <Text style={styles.resultText}>{extractedText}</Text>
              <TouchableOpacity style={styles.retakeButton} onPress={handleRetake}>
                <Text style={styles.buttonText}>Retake</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  cameraWrapper: { flex: 1, position: "relative" },
  camera: { flex: 1 },
  captureButton: {
    position: "absolute",
    bottom: 40,
    alignSelf: "center",
    backgroundColor: "#007AFF",
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 8,
  },
  buttonText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  resultContainer: { flex: 1, alignItems: "center", padding: 20 },
  preview: {
    width: "100%",
    height: 300,
    resizeMode: "contain",
    borderRadius: 10,
    marginBottom: 20,
  },
  resultText: { fontSize: 16, color: "#333", marginVertical: 10 },
  retakeButton: {
    backgroundColor: "#FF3B30",
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 8,
    marginTop: 16,
  },
});
