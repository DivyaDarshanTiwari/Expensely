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
  Platform,
} from "react-native";
import { useForm, Controller } from "react-hook-form";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";

// Firebase
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../auth/firebase";// adjust if path differs

type FormData = {
  email: string;
  password: string;
};

const schema = yup.object().shape({
  email: yup.string().email("Invalid email").required("Email is required"),
  password: yup
    .string()
    .min(8, "Password must be at least 8 characters")
    .required("Password is required"),
});

export default function LoginScreen() {
  const router = useRouter();
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
      await signInWithEmailAndPassword(auth, data.email, data.password);
      alert("Login successful");
      router.replace("/(tabs)/dashboard");
    } catch (error: any) {
      alert(error.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Image
        source={require("../assets/images/login-visual.png")}
        style={styles.image}
        resizeMode="contain"
      />

      <View style={styles.formContainer}>
        <Text style={styles.logo}>Expense Tracker</Text>
        <Text style={styles.heading}>Welcome Back</Text>
        <Text style={styles.subheading}>Login to continue</Text>

        {/* Email input */}
        <Controller
          control={control}
          name="email"
          render={({ field: { onChange, value } }) => (
            <TextInput
              placeholder="john@example.com"
              value={value}
              onChangeText={onChange}
              style={styles.input}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          )}
        />
        {errors.email && (
          <Text style={styles.error}>{errors.email.message}</Text>
        )}

        {/* Password input */}
        <View style={styles.passwordContainer}>
          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, value } }) => (
              <TextInput
                placeholder="Min 8 Characters"
                value={value}
                onChangeText={onChange}
                secureTextEntry={secure}
                style={[styles.input, { flex: 1, borderRightWidth: 0 }]}
              />
            )}
          />
          <TouchableOpacity
            onPress={() => setSecure(!secure)}
            style={styles.eyeToggle}
          >
            <Text style={{ fontSize: 16 }}>{secure ? "🙈" : "👁️"}</Text>
          </TouchableOpacity>
        </View>
        {errors.password && (
          <Text style={styles.error}>{errors.password.message}</Text>
        )}

        {/* Forgot password */}
        <TouchableOpacity onPress={() => router.push("/forgot-password")}>
          <Text style={styles.forgot}>Forgot Password?</Text>
        </TouchableOpacity>

        {/* Submit */}
        <TouchableOpacity onPress={handleSubmit(onSubmit)}>
          <LinearGradient
            colors={["#6C47FF", "#8E2DE2"]}
            style={styles.loginBtn}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.loginText}>LOGIN</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>

        {/* Footer */}
        <Text style={styles.footerText}>
          Don’t have an account?{" "}
          <Text style={styles.signup} onPress={() => router.push("/signup")}>
            Sign Up
          </Text>
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    paddingBottom: 60,
    backgroundColor: "#fff",
    flexGrow: 1,
  },
  image: {
    width: "100%",
    height: Platform.OS === "web" ? 280 : 200,
    marginBottom: 24,
    borderRadius: 16,
  },
  formContainer: {
    justifyContent: "center",
  },
  logo: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 20,
  },
  heading: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 6,
  },
  subheading: {
    color: "#666",
    marginBottom: 20,
  },
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
  error: {
    color: "red",
    fontSize: 13,
    marginBottom: 8,
    marginLeft: 4,
  },
  forgot: {
    alignSelf: "flex-end",
    color: "#6C47FF",
    marginBottom: 12,
    fontSize: 13,
  },
  loginBtn: {
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 4,
  },
  loginText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  footerText: {
    marginTop: 20,
    fontSize: 14,
    color: "#444",
    textAlign: "center",
  },
  signup: {
    color: "#6C47FF",
    fontWeight: "600",
  },
});
