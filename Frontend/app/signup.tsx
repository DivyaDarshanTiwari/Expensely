import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";

export default function SignUpScreen() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [avatarUri, setAvatarUri] = useState<string | null>(null);

  const pickAvatar = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.5,
      allowsEditing: true,
      aspect: [1, 1],
    });

    if (!result.canceled) {
      setAvatarUri(result.assets[0].uri);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.logo}>Expense Tracker</Text>

      <Text style={styles.heading}>Create an Account</Text>
      <Text style={styles.subheading}>
        Join us today by entering your details below.
      </Text>

      <View style={styles.avatarContainer}>
        <TouchableOpacity onPress={pickAvatar}>
          <View style={styles.avatarCircle}>
            {avatarUri ? (
              <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
            ) : (
              <Ionicons name="person-outline" size={36} color="#6C63FF" />
            )}
          </View>
          <View style={styles.uploadIcon}>
            <Ionicons name="cloud-upload-outline" size={16} color="#fff" />
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.row}>
        <View style={styles.halfInputContainer}>
          <Text style={styles.label}>Full Name</Text>
          <TextInput
            style={styles.input}
            placeholder="John"
            value={fullName}
            onChangeText={setFullName}
            placeholderTextColor="#999"
          />
        </View>
        <View style={styles.halfInputContainer}>
          <Text style={styles.label}>Email Address</Text>
          <TextInput
            style={styles.input}
            placeholder="john@example.com"
            value={email}
            onChangeText={setEmail}
            placeholderTextColor="#999"
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>
      </View>

      <Text style={styles.label}>Password</Text>
      <View style={styles.passwordContainer}>
        <TextInput
          style={styles.input}
          placeholder="Min 8 Characters"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!showPassword}
          placeholderTextColor="#999"
        />
        <TouchableOpacity
          style={styles.eyeIcon}
          onPress={() => setShowPassword((prev) => !prev)}
        >
          <Ionicons
            name={showPassword ? "eye-outline" : "eye-off-outline"}
            size={20}
            color="#666"
          />
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.signupBtn}>
        <Text style={styles.signupText}>SIGN UP</Text>
      </TouchableOpacity>

      <Text style={styles.footerText}>
        Already have an account?{" "}
        <Text style={styles.link} onPress={() => router.replace("../login")}>
          Login
        </Text>
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    backgroundColor: "#fff",
    flexGrow: 1,
    justifyContent: "center",
  },
  logo: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 36,
  },
  heading: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 6,
  },
  subheading: {
    fontSize: 14,
    color: "#666",
    marginBottom: 24,
  },
  avatarContainer: {
    alignItems: "center",
    marginBottom: 24,
  },
  avatarCircle: {
    width: 70,
    height: 70,
    backgroundColor: "#EDE9FE",
    borderRadius: 35,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  uploadIcon: {
    position: "absolute",
    right: -2,
    bottom: -2,
    backgroundColor: "#6C63FF",
    padding: 4,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "#fff",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
    borderRadius: 35,
  },
  row: {
    flexDirection: "row",
    gap: 10,
  },
  halfInputContainer: {
    flex: 1,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 14,
    marginBottom: 18,
    fontSize: 14,
    color: "#000",
  },
  passwordContainer: {
    position: "relative",
  },
  eyeIcon: {
    position: "absolute",
    right: 12,
    top: 16,
  },
  signupBtn: {
    backgroundColor: "#6C63FF",
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 6,
  },
  signupText: {
    color: "#fff",
    fontWeight: "bold",
  },
  footerText: {
    textAlign: "center",
    marginTop: 20,
    fontSize: 13,
    color: "#333",
  },
  link: {
    color: "#6C63FF",
    fontWeight: "bold",
  },
});
