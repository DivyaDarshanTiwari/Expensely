import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { useForm, Controller } from "react-hook-form";
import * as ImagePicker from "expo-image-picker";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";

// Firebase imports
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { auth } from "../auth/firebase"; // adjust if your path differs

type FormData = {
  fullName: string;
  email: string;
  password: string;
};

const schema = yup.object().shape({
  fullName: yup.string().required("Full name is required"),
  email: yup.string().email("Invalid email").required("Email is required"),
  password: yup
    .string()
    .min(8, "Password must be at least 8 characters")
    .required("Password is required"),
});

export default function SignUpScreen() {
  const router = useRouter();
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [secure, setSecure] = useState(true);
  const [loading, setLoading] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: yupResolver(schema) });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);

      await updateProfile(userCredential.user, {
        displayName: data.fullName,
        photoURL: avatarUri || undefined,
      });

      alert("Account created!");
      router.replace("/login");
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

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
      <Text style={styles.subheading}>Join us by filling the information below</Text>

      {/* Avatar Picker */}
      <TouchableOpacity onPress={pickAvatar} style={styles.avatarContainer}>
        {avatarUri ? (
          <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarText}>+</Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Full Name */}
      <Controller
        control={control}
        name="fullName"
        render={({ field: { onChange, value } }) => (
          <TextInput
            placeholder="Full Name"
            value={value}
            onChangeText={onChange}
            style={styles.input}
          />
        )}
      />
      {errors.fullName && <Text style={styles.error}>{errors.fullName.message}</Text>}

      {/* Email */}
      <Controller
        control={control}
        name="email"
        render={({ field: { onChange, value } }) => (
          <TextInput
            placeholder="Email"
            value={value}
            onChangeText={onChange}
            style={styles.input}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        )}
      />
      {errors.email && <Text style={styles.error}>{errors.email.message}</Text>}

      {/* Password */}
      <View style={styles.passwordContainer}>
        <Controller
          control={control}
          name="password"
          render={({ field: { onChange, value } }) => (
            <TextInput
              placeholder="Password"
              value={value}
              onChangeText={onChange}
              secureTextEntry={secure}
              style={[styles.input, { flex: 1, borderRightWidth: 0 }]}
            />
          )}
        />
        <TouchableOpacity onPress={() => setSecure(!secure)} style={styles.eyeToggle}>
          <Text>{secure ? "🙈" : "👁️"}</Text>
        </TouchableOpacity>
      </View>
      {errors.password && <Text style={styles.error}>{errors.password.message}</Text>}

      {/* Sign Up Button */}
      <TouchableOpacity onPress={handleSubmit(onSubmit)}>
        <LinearGradient colors={["#6C47FF", "#8E2DE2"]} style={styles.signupBtn}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.signupText}>SIGN UP</Text>
          )}
        </LinearGradient>
      </TouchableOpacity>

      <Text style={styles.footerText}>
        Already have an account?{" "}
        <Text style={styles.login} onPress={() => router.replace("/login")}>
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
  logo: { fontSize: 20, fontWeight: "600", marginBottom: 20 },
  heading: { fontSize: 24, fontWeight: "700", marginBottom: 6 },
  subheading: { color: "#666", marginBottom: 20 },
  avatarContainer: {
    alignSelf: "center",
    marginBottom: 24,
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    backgroundColor: "#eee",
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: { fontSize: 32, color: "#999" },
  avatarImage: { width: 80, height: 80, borderRadius: 40 },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 14,
    borderRadius: 8,
    backgroundColor: "#f9f9f9",
    marginBottom: 12,
  },
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    backgroundColor: "#f9f9f9",
  },
  eyeToggle: {
    paddingHorizontal: 12,
    justifyContent: "center",
    borderLeftWidth: 1,
    borderColor: "#ccc",
  },
  error: { color: "red", fontSize: 13, marginBottom: 8, marginLeft: 4 },
  signupBtn: {
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 8,
  },
  signupText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  footerText: {
    textAlign: "center",
    marginTop: 20,
    fontSize: 14,
    color: "#444",
  },
  login: {
    color: "#6C47FF",
    fontWeight: "600",
  },
});
