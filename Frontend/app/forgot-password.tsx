// app/forgot-password.tsx

import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useForm, Controller } from "react-hook-form";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";

type ForgotForm = {
  email: string;
};

const schema = yup.object().shape({
  email: yup.string().email("Invalid email").required("Email is required"),
});

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotForm>({ resolver: yupResolver(schema) });

  const onSubmit = (data: ForgotForm) => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      Alert.alert(
        "Password Reset",
        `A password reset link has been sent to ${data.email}`
      );
      router.replace("/login");
    }, 1500);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.logo}>Expense Tracker</Text>
      <Text style={styles.heading}>Forgot Password</Text>
      <Text style={styles.subheading}>
        Enter your email to receive password reset instructions.
      </Text>

      <Controller
        control={control}
        name="email"
        render={({ field: { onChange, value } }) => (
          <TextInput
            placeholder="you@example.com"
            style={styles.input}
            keyboardType="email-address"
            autoCapitalize="none"
            value={value}
            onChangeText={onChange}
          />
        )}
      />
      {errors.email && (
        <Text style={styles.error}>{errors.email.message}</Text>
      )}

      <TouchableOpacity onPress={handleSubmit(onSubmit)}>
        <LinearGradient
          colors={["#6C47FF", "#8E2DE2"]}
          style={styles.submitBtn}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitText}>SEND RESET LINK</Text>
          )}
        </LinearGradient>
      </TouchableOpacity>

      <Text style={styles.backText}>
        Remembered your password?{" "}
        <Text style={styles.loginLink} onPress={() => router.replace("/login")}>
          Login
        </Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    flex: 1,
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  logo: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 28,
  },
  heading: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 6,
  },
  subheading: {
    fontSize: 14,
    color: "#666",
    marginBottom: 24,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 14,
    borderRadius: 8,
    backgroundColor: "#f9f9f9",
    marginBottom: 10,
  },
  error: {
    color: "red",
    fontSize: 13,
    marginBottom: 12,
  },
  submitBtn: {
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 6,
  },
  submitText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 15,
  },
  backText: {
    textAlign: "center",
    marginTop: 24,
    fontSize: 13,
    color: "#333",
  },
  loginLink: {
    color: "#6C63FF",
    fontWeight: "bold",
  },
});
