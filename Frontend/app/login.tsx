import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
} from "react-native";
import { useRouter } from "expo-router";

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [secure, setSecure] = useState(true);

  return (
    <View style={styles.container}>
      {/* Left Panel */}
      <View style={styles.formContainer}>
        <Text style={styles.logo}>Expense Tracker</Text>
        <Text style={styles.heading}>Welcome Back</Text>
        <Text style={styles.subheading}>Please enter your details to log in</Text>

        <TextInput
          placeholder="john@example.com"
          value={email}
          onChangeText={setEmail}
          style={styles.input}
          keyboardType="email-address"
        />
        <View style={styles.passwordContainer}>
          <TextInput
            placeholder="Min 8 Characters"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={secure}
            style={[styles.input, { flex: 1, borderRightWidth: 0 }]}
          />
          <TouchableOpacity
            onPress={() => setSecure(!secure)}
            style={styles.eyeToggle}
          >
            <Text style={{ fontSize: 16 }}>{secure ? "🙈" : "👁️"}</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.loginBtn}>
          <Text style={styles.loginText}>LOGIN</Text>
        </TouchableOpacity>

        <Text style={styles.footerText}>
          Don’t have an account?{" "}
          <Text style={styles.signup} onPress={() => router.push("/signup")}>
            SignUp
          </Text>
        </Text>
      </View>

      {/* Right Visual (Optional for web preview only) */}
      <View style={styles.graphPreview}>
        <Image
          source={require("../assets/images/login-visual.jpeg")}
          style={styles.graphImage}
          resizeMode="contain"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, flexDirection: "row", backgroundColor: "#f5f5f5" },
  formContainer: {
    flex: 1,
    padding: 40,
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  logo: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 30,
    color: "#111",
  },
  heading: { fontSize: 24, fontWeight: "700", marginBottom: 8 },
  subheading: { color: "#666", marginBottom: 30 },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 14,
    borderRadius: 8,
    backgroundColor: "#f5f6fa",
    marginBottom: 16,
  },
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    backgroundColor: "#f5f6fa",
    marginBottom: 16,
  },
  eyeToggle: {
    paddingHorizontal: 12,
    justifyContent: "center",
    borderLeftWidth: 1,
    borderColor: "#ccc",
  },
  loginBtn: {
    backgroundColor: "#6C47FF",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
  },
  loginText: {
    color: "#fff",
    fontWeight: "bold",
  },
  footerText: {
    marginTop: 20,
    fontSize: 14,
    color: "#444",
  },
  signup: {
    color: "#6C47FF",
    fontWeight: "600",
  },
  graphPreview: {
    flex: 1.2,
    backgroundColor: "#ede7f6",
    alignItems: "center",
    justifyContent: "center",
    display: "none", // Mobile-first: disable for small screens
  },
  graphImage: {
    width: "80%",
    height: "80%",
  },
});
