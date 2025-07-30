"use client";
import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import Constants from "expo-constants";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { signOut, updateProfile, type User } from "firebase/auth";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { auth } from "../auth/firebase";
import {
  getStoredUser,
  clearUserData,
  getStoredToken,
  storeUser,
} from "../utils/storage";

const { width: screenWidth } = Dimensions.get("window");

interface UserProfile {
  displayName: string;
  email: string;
  phoneNumber: string;
  bio: string;
}

export default function ProfileScreen() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const [profile, setProfile] = useState<UserProfile>({
    displayName: "",
    email: "",
    phoneNumber: "",
    bio: "",
  });

  const [editedProfile, setEditedProfile] = useState<UserProfile>({
    displayName: "",
    email: "",
    phoneNumber: "",
    bio: "",
  });

  const [photoURL, setPhotoURL] = useState<string | null>(null);

  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    (async () => {
      const storedUser = await getStoredUser();
      if (!storedUser) {
        router.replace("/auth");
      } else {
        setUser(storedUser);
        const userProfile = {
          displayName: storedUser.displayName || "",
          email: storedUser.email || "",
          photoURL: storedUser.photoURL || "",
          phoneNumber: storedUser.phoneNumber || "",
          bio: "", // This would come from your database
        };
        setProfile(userProfile);
        setEditedProfile(userProfile);
        setPhotoURL(storedUser.photoURL || null);
        setLoading(false);

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
        ]).start();
      }
    })();
  }, []);

  const handleImagePicker = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== "granted") {
      Alert.alert(
        "Permission Required",
        "Please grant camera roll permissions to change your profile picture."
      );
      return;
    }

    Alert.alert(
      "Select Image",
      "Choose how you'd like to select your profile picture",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Camera", onPress: () => openCamera() },
        { text: "Gallery", onPress: () => openGallery() },
      ]
    );
  };

  const fileType = (fileName: string) => {
    const extension = fileName.split(".").pop()?.toLowerCase();
    let mimeType = "image/jpeg";
    if (extension === "png") mimeType = "image/png";
    else if (extension === "jpg" || extension === "jpeg")
      mimeType = "image/jpeg";

    return mimeType;
  };

  const openCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();

    if (status !== "granted") {
      Alert.alert(
        "Permission Required",
        "Please grant camera permissions to take a photo."
      );
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const idToken = await getStoredToken();
      const asset = result.assets[0];

      const formData = new FormData();
      const fileName = asset.fileName ?? `photo_${Date.now()}.jpg`;
      const mimeType: string = fileType(fileName);
      formData.append("picture", {
        uri: asset.uri,
        name: fileName,
        type: mimeType,
      } as any);
      setIsUploading(true);
      try {
        const imageCloudURL = await axios.post(
          `${Constants.expoConfig?.extra?.User_URL}/api/v1/upload/profilePic`,
          formData,
          {
            headers: {
              Authorization: `Bearer ${idToken}`,
              "Content-Type": "multipart/form-data",
            },
          }
        );
        const user = auth.currentUser;

        if (user) {
          await updateProfile(user, {
            photoURL: imageCloudURL.data.data, // URL returned from your backend
          });
          setPhotoURL(imageCloudURL.data.data);
          await storeUser({
            ...user,
            photoURL: imageCloudURL.data.data,
          });
          Alert.alert("Success", "Profile photo updated!");
        } else {
          console.error("No user is currently signed in.");
        }
      } catch (error) {
        console.error("Image upload failed:", error);
        Alert.alert(
          "Upload Failed",
          "Could not upload your profile picture. Please try again."
        );
      } finally {
        setIsUploading(false);
      }
    }
  };

  const openGallery = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const idToken = await getStoredToken();
      const asset = result.assets[0];

      const formData = new FormData();
      const fileName = asset.fileName ?? `photo_${Date.now()}.jpg`;
      const mimeType: string = fileType(fileName);
      formData.append("picture", {
        uri: asset.uri,
        name: fileName,
        type: mimeType,
      } as any);

      setIsUploading(true);
      try {
        const imageCloudURL = await axios.post(
          `${Constants.expoConfig?.extra?.User_URL}/api/v1/upload/profilePic`,
          formData,
          {
            headers: {
              Authorization: `Bearer ${idToken}`,
              "Content-Type": "multipart/form-data",
            },
          }
        );
        const user = auth.currentUser;

        if (user) {
          await updateProfile(user, {
            photoURL: imageCloudURL.data.data, // URL returned from your backend
          });
          setPhotoURL(imageCloudURL.data.data);
          await storeUser({
            ...user,
            photoURL: imageCloudURL.data.data,
          });
          Alert.alert("Success", "Profile photo updated!");
        } else {
          console.error("No user is currently signed in.");
        }
      } catch (error) {
        console.error("Image upload failed:", error);
        Alert.alert(
          "Upload Failed",
          "Could not upload your profile picture. Please try again."
        );
      } finally {
        setIsUploading(false);
      }
    }
  };

  const handleSave = async () => {
    const user = auth.currentUser;
    if (!user) return;

    setSaving(true);
    try {
      // Update Firebase Auth profile
      console.log("Updating profile with");
      await updateProfile(user, {
        displayName: editedProfile.displayName,
      });

      // Here you would also update your backend database with additional fields
      // like phoneNumber and bio

      setProfile(editedProfile);
      await storeUser({
        ...user,
        displayName: editedProfile.displayName,
        phoneNumber: editedProfile.phoneNumber,
        bio: editedProfile.bio,
      });
      setEditing(false);
      Alert.alert("Success", "Profile updated successfully!");
    } catch (error) {
      console.error("Profile update error:", error);
      Alert.alert("Error", "Failed to update profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditedProfile(profile);
    setEditing(false);
  };

  const handleLogout = async () => {
    Alert.alert(
      "Confirm Logout",
      "Are you sure you want to logout?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Logout",
          style: "destructive",
          onPress: async () => {
            try {
              setLoggingOut(true);
              await clearUserData();
              await signOut(auth);
              setUser(null);
              router.replace("/auth");
            } catch (error) {
              console.error("Logout error:", error);
              Alert.alert("Error", "Something went wrong while logging out.");
            } finally {
              setLoggingOut(false);
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8B5CF6" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <Animated.View
        style={[
          styles.header,
          {
            opacity: fadeAnim,
          },
        ]}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => setEditing(!editing)}
          disabled={saving}
        >
          <Ionicons
            name={editing ? "close" : "pencil"}
            size={20}
            color={editing ? "#EF4444" : "#8B5CF6"}
          />
        </TouchableOpacity>
      </Animated.View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Profile Picture Section */}
        <Animated.View
          style={[
            styles.avatarSection,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <View style={styles.avatarContainer}>
            <Image
              source={{
                uri: isUploading
                  ? "https://media.tenor.com/UnFx-k_lSckAAAAM/amalie-steiness.gif" // or your loading spinner gif
                  : photoURL ||
                    "https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y",
              }}
              style={styles.avatar}
            />
            {
              <TouchableOpacity
                style={styles.cameraButton}
                onPress={async () => {
                  await handleImagePicker();
                }}
                disabled={saving}
              >
                <Ionicons name="camera" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            }
          </View>
        </Animated.View>

        {/* Profile Information */}
        <Animated.View
          style={[
            styles.infoSection,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {/* Display Name */}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Display Name</Text>
            {editing ? (
              <TextInput
                style={styles.textInput}
                value={editedProfile.displayName}
                onChangeText={(text) =>
                  setEditedProfile((prev) => ({ ...prev, displayName: text }))
                }
                placeholder="Enter your display name"
                placeholderTextColor="#9CA3AF"
              />
            ) : (
              <Text style={styles.fieldValue}>
                {profile.displayName || "Not set"}
              </Text>
            )}
          </View>

          {/* Email */}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Email</Text>
            <Text style={[styles.fieldValue, styles.emailText]}>
              {profile.email}
            </Text>
          </View>

          {/* Phone Number */}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Phone Number</Text>
            {editing ? (
              <TextInput
                style={styles.textInput}
                value={editedProfile.phoneNumber}
                onChangeText={(text) =>
                  setEditedProfile((prev) => ({ ...prev, phoneNumber: text }))
                }
                placeholder="Enter your phone number"
                placeholderTextColor="#9CA3AF"
                keyboardType="phone-pad"
              />
            ) : (
              <Text style={styles.fieldValue}>
                {profile.phoneNumber || "Not set"}
              </Text>
            )}
          </View>

          {/* Bio */}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Bio</Text>
            {editing ? (
              <TextInput
                style={[styles.textInput, styles.bioInput]}
                value={editedProfile.bio}
                onChangeText={(text) =>
                  setEditedProfile((prev) => ({ ...prev, bio: text }))
                }
                placeholder="Tell us about yourself"
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            ) : (
              <Text style={styles.fieldValue}>
                {profile.bio || "No bio added"}
              </Text>
            )}
          </View>
        </Animated.View>

        {/* Action Buttons */}
        <Animated.View
          style={[
            styles.actionSection,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {editing ? (
            <View style={styles.editActions}>
              <TouchableOpacity
                style={[styles.actionButton, styles.cancelButton]}
                onPress={handleCancel}
                disabled={saving}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.saveButton]}
                onPress={handleSave}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.saveButtonText}>Save Changes</Text>
                )}
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              onPress={handleLogout}
              style={[styles.actionButton, styles.logoutButton]}
              disabled={loggingOut}
            >
              {loggingOut ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="log-out-outline" size={20} color="#FFFFFF" />
                  <Text style={styles.logoutButtonText}>Logout</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FAFAFA",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FAFAFA",
  },
  loadingText: {
    fontSize: 16,
    color: "#6B7280",
    marginTop: 12,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#111827",
  },
  editButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F9FAFB",
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  avatarSection: {
    alignItems: "center",
    paddingVertical: 32,
    backgroundColor: "#FFFFFF",
    marginBottom: 20,
  },
  avatarContainer: {
    position: "relative",
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#E5E7EB",
    borderWidth: 4,
    borderColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  cameraButton: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#8B5CF6",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#FFFFFF",
  },
  infoSection: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  fieldContainer: {
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  fieldValue: {
    fontSize: 16,
    color: "#111827",
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  emailText: {
    color: "#6B7280",
  },
  textInput: {
    fontSize: 16,
    color: "#111827",
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#D1D5DB",
  },
  bioInput: {
    height: 80,
    textAlignVertical: "top",
  },
  actionSection: {
    paddingHorizontal: 20,
  },
  editActions: {
    flexDirection: "row",
    gap: 12,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  cancelButton: {
    backgroundColor: "#F3F4F6",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#6B7280",
  },
  saveButton: {
    backgroundColor: "#8B5CF6",
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  logoutButton: {
    backgroundColor: "#EF4444",
    gap: 8,
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F9FAFB",
    justifyContent: "center",
    alignItems: "center",
  },
});
