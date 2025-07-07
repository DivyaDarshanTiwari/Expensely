import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Dimensions,
  Animated,
  StyleSheet,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { auth } from "../auth/firebase";
import axios from "axios";
import {
  createUserWithEmailAndPassword,
  updateProfile,
  getIdToken,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
} from "firebase/auth";
import Constants from "expo-constants";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

const ExpenselyAuth = () => {
  const router = useRouter();

  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    fullName: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const logoScale = useRef(new Animated.Value(0.8)).current;
  const formSlide = useRef(new Animated.Value(30)).current;
  const switchAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Initial animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(logoScale, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.timing(formSlide, {
        toValue: 0,
        duration: 600,
        delay: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  useEffect(() => {
    // Animation when switching between login/signup
    Animated.timing(switchAnim, {
      toValue: isLogin ? 0 : 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [isLogin]);

  const login = async (email: string, password: string) => {
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );

      const idToken = await getIdToken(userCredential.user);
      // Send token to backend
      try {
        await axios.post(
          `${Constants.expoConfig?.extra?.User_URL}/api/v1/auth/validToken`,
          {},
          {
            headers: {
              Authorization: `Bearer ${idToken}`,
            },
          }
        );
      } catch (apiError: any) {
        console.error(
          "API error:",
          apiError?.response?.data || apiError.message
        );
        Alert.alert(
          "Server Error",
          apiError?.response?.data?.message ||
            "Something went wrong while communicating with backend."
        );
        return null;
      }

      Alert.alert("Login Successful", "Welcome back!");
      return userCredential;
    } catch (firebaseError: any) {
      throw firebaseError;
    }
  };

  const signUp = async () => {
    setIsLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );

      await updateProfile(userCredential.user, {
        displayName: formData.fullName,
      });

      const idToken = await getIdToken(userCredential.user);

      // Send UID + token + other user data to backend
      try {
        await axios.post(
          `${Constants.expoConfig?.extra?.User_URL}/api/v1/auth/signUp`,
          {},
          {
            headers: {
              Authorization: `Bearer ${idToken}`,
            },
          }
        );
      } catch (apiError: any) {
        // Handle backend/API error separately
        console.error(
          "API error:",
          apiError?.response?.data || apiError.message
        );
        Alert.alert(
          "Server Error",
          apiError?.response?.data?.message ||
            "Something went wrong while saving user data to backend."
        );
        return; // Exit early — don’t proceed
      }

      Alert.alert("Success", "Account created successfully!");
      return userCredential;
    } catch (firebaseError: any) {
      throw firebaseError;
    } finally {
      setIsLoading(false); // Always clear loading state
    }
  };

  // forgot password
  const handleForgotPassword = async () => {
    if (!formData.email) {
      Alert.alert("Error", "Please enter your email to reset password.");
      return;
    }

    try {
      await sendPasswordResetEmail(auth, formData.email);
      Alert.alert("Password Reset", "Check your email for reset instructions.");
    } catch (error: any) {
      Alert.alert("Error", error.message);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const validateForm = () => {
    const { email, password, confirmPassword, fullName } = formData;

    if (!email.trim()) {
      Alert.alert("Error", "Please enter your email address");
      return false;
    }

    if (!email.includes("@")) {
      Alert.alert("Error", "Please enter a valid email address");
      return false;
    }

    if (!password.trim()) {
      Alert.alert("Error", "Please enter your password");
      return false;
    }

    if (password.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters long");
      return false;
    }

    if (!isLogin) {
      if (!fullName.trim()) {
        Alert.alert("Error", "Please enter your full name");
        return false;
      }

      if (password !== confirmPassword) {
        Alert.alert("Error", "Passwords do not match");
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    if (isLogin) {
      try {
        const userCredential = await login(formData.email, formData.password);
        if (userCredential?.user) {
          Alert.alert("Login Successful", "Welcome back!");
          router.replace("/(tabs)/dashboard");
        } else {
          Alert.alert("Login Failed", "No user found after login.");
        }
      } catch (err: any) {
        console.log(err.message);
        Alert.alert("Login Failed", err.message || "Invalid email or password");
      }
    } else {
      try {
        await signUp();
        Alert.alert("Signup Successfully");
        setIsLogin(true);
      } catch (err: any) {
        console.log(err.message);
        Alert.alert("Signup Failed", err.message || "Error from backend");
      }
    }
  };

  const toggleAuthMode = () => {
    setIsLogin(!isLogin);
    setFormData({
      email: "",
      password: "",
      confirmPassword: "",
      fullName: "",
    });
  };

  const renderInput = (
    placeholder: string | undefined,
    value: string | undefined,
    onChangeText: ((text: string) => void) | undefined,
    secureTextEntry = false,
    showPasswordToggle = false,
    icon: any
  ) => (
    <Animated.View
      style={[
        styles.inputContainer,
        {
          opacity: fadeAnim,
          transform: [{ translateY: formSlide }],
        },
      ]}
    >
      <View style={styles.inputWrapper}>
        <Ionicons
          name={icon}
          size={20}
          color="#8B5CF6"
          style={styles.inputIcon}
        />
        <TextInput
          style={styles.textInput}
          placeholder={placeholder}
          placeholderTextColor="#9CA3AF"
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={
            secureTextEntry && !showPassword && !showConfirmPassword
          }
          autoCapitalize="none"
          keyboardType={
            placeholder?.includes("Email") ? "email-address" : "default"
          }
        />
        {showPasswordToggle && (
          <TouchableOpacity
            onPress={() => {
              if (placeholder?.includes("Confirm")) {
                setShowConfirmPassword(!showConfirmPassword);
              } else {
                setShowPassword(!showPassword);
              }
            }}
            style={styles.eyeIcon}
          >
            <Ionicons
              name={
                (
                  placeholder?.includes("Confirm")
                    ? showConfirmPassword
                    : showPassword
                )
                  ? "eye-off"
                  : "eye"
              }
              size={20}
              color="#6B7280"
            />
          </TouchableOpacity>
        )}
      </View>
    </Animated.View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#8B5CF6" />

      {/* Background Gradient */}
      <LinearGradient
        colors={["#8B5CF6", "#7C3AED", "#6D28D9"]}
        style={styles.backgroundGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      {/* Decorative Circles */}
      <Animated.View
        style={[
          styles.decorativeCircle1,
          {
            opacity: fadeAnim,
            transform: [{ scale: logoScale }, { rotate: "45deg" }],
          },
        ]}
      />
      <Animated.View
        style={[
          styles.decorativeCircle2,
          {
            opacity: fadeAnim,
            transform: [{ scale: logoScale }, { rotate: "-30deg" }],
          },
        ]}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Logo Section */}
          <Animated.View
            style={[
              styles.logoSection,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }, { scale: logoScale }],
              },
            ]}
          >
            <View style={styles.logoContainer}>
              <LinearGradient
                colors={["#FFFFFF", "#F3E8FF"]}
                style={styles.logoGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Ionicons name="wallet" size={40} color="#8B5CF6" />
              </LinearGradient>
            </View>
            <Text style={styles.appName}>Expensely</Text>
            <Text style={styles.tagline}>
              {isLogin ? "Welcome back!" : "Join us today!"}
            </Text>
          </Animated.View>

          {/* Form Section */}
          <Animated.View
            style={[
              styles.formSection,
              {
                opacity: fadeAnim,
                transform: [{ translateY: formSlide }],
              },
            ]}
          >
            <View style={styles.formContainer}>
              {/* Auth Mode Toggle */}
              <View style={styles.toggleContainer}>
                <TouchableOpacity
                  style={[styles.toggleButton, isLogin && styles.activeToggle]}
                  onPress={() => !isLogin && toggleAuthMode()}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.toggleText,
                      isLogin && styles.activeToggleText,
                    ]}
                  >
                    Login
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.toggleButton, !isLogin && styles.activeToggle]}
                  onPress={() => isLogin && toggleAuthMode()}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.toggleText,
                      !isLogin && styles.activeToggleText,
                    ]}
                  >
                    Sign Up
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Form Fields */}
              <View style={styles.formFields}>
                {!isLogin &&
                  renderInput(
                    "Full Name",
                    formData.fullName,
                    (value: any) => handleInputChange("fullName", value),
                    false,
                    false,
                    "person-outline"
                  )}

                {renderInput(
                  "Email Address",
                  formData.email,
                  (value: any) => handleInputChange("email", value),
                  false,
                  false,
                  "mail-outline"
                )}

                {renderInput(
                  "Password",
                  formData.password,
                  (value: any) => handleInputChange("password", value),
                  true,
                  true,
                  "lock-closed-outline"
                )}

                {!isLogin &&
                  renderInput(
                    "Confirm Password",
                    formData.confirmPassword,
                    (value: any) => handleInputChange("confirmPassword", value),
                    true,
                    true,
                    "lock-closed-outline"
                  )}
              </View>

              {/* Forgot Password */}
              {isLogin && (
                <TouchableOpacity
                  style={styles.forgotPassword}
                  activeOpacity={0.7}
                  onPress={handleForgotPassword}
                >
                  <Text style={styles.forgotPasswordText}>
                    Forgot Password?
                  </Text>
                </TouchableOpacity>
              )}

              {/* Submit Button */}
              <TouchableOpacity
                style={styles.submitButton}
                onPress={handleSubmit}
                disabled={isLoading}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={
                    isLoading ? ["#9CA3AF", "#6B7280"] : ["#8B5CF6", "#7C3AED"]
                  }
                  style={styles.submitGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  {isLoading ? (
                    <View style={styles.loadingContainer}>
                      <Animated.View
                        style={[
                          styles.loadingSpinner,
                          {
                            transform: [
                              {
                                rotate: fadeAnim.interpolate({
                                  inputRange: [0, 1],
                                  outputRange: ["0deg", "360deg"],
                                }),
                              },
                            ],
                          },
                        ]}
                      >
                        <Ionicons name="refresh" size={20} color="white" />
                      </Animated.View>
                      <Text style={styles.submitButtonText}>
                        {isLogin ? "Signing In..." : "Creating Account..."}
                      </Text>
                    </View>
                  ) : (
                    <>
                      <Text style={styles.submitButtonText}>
                        {isLogin ? "Sign In" : "Create Account"}
                      </Text>
                      <Ionicons name="arrow-forward" size={20} color="white" />
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              {/* Social Login */}
              <View style={styles.socialSection}>
                <View style={styles.dividerContainer}>
                  <View style={styles.divider} />
                  <Text style={styles.dividerText}>or continue with</Text>
                  <View style={styles.divider} />
                </View>

                <View style={styles.socialButtons}>
                  <TouchableOpacity
                    style={styles.socialButton}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="logo-google" size={24} color="#EA4335" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: screenWidth,
    flex: 1,
    backgroundColor: "#8B5CF6",
  },
  backgroundGradient: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  decorativeCircle1: {
    position: "absolute",
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    top: -50,
    right: -50,
  },
  decorativeCircle2: {
    position: "absolute",
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    bottom: 100,
    left: -30,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  logoSection: {
    alignItems: "center",
    marginBottom: 40,
  },
  logoContainer: {
    marginBottom: 20,
  },
  logoGradient: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  appName: {
    fontSize: 32,
    fontWeight: "700",
    color: "white",
    marginBottom: 8,
    textAlign: "center",
  },
  tagline: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.8)",
    textAlign: "center",
  },
  formSection: {
    flex: 1,
    justifyContent: "center",
  },
  formContainer: {
    backgroundColor: "white",
    borderRadius: 24,
    padding: 24,
    elevation: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },
  toggleContainer: {
    flexDirection: "row",
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    padding: 4,
    marginBottom: 24,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  activeToggle: {
    backgroundColor: "white",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  toggleText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#6B7280",
  },
  activeToggleText: {
    color: "#8B5CF6",
  },
  formFields: {
    marginBottom: 16,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingHorizontal: 16,
    height: 56,
  },
  inputIcon: {
    marginRight: 12,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: "#111827",
    fontWeight: "500",
  },
  eyeIcon: {
    padding: 4,
  },
  forgotPassword: {
    alignSelf: "flex-end",
    marginBottom: 24,
  },
  forgotPasswordText: {
    fontSize: 14,
    color: "#8B5CF6",
    fontWeight: "600",
  },
  submitButton: {
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 24,
    elevation: 4,
    shadowColor: "#8B5CF6",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  submitGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  submitButtonText: {
    fontSize: 18,
    fontWeight: "600",
    color: "white",
    marginRight: 8,
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  loadingSpinner: {
    marginRight: 8,
  },
  socialSection: {
    alignItems: "center",
  },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: "#E5E7EB",
  },
  dividerText: {
    fontSize: 14,
    color: "#6B7280",
    marginHorizontal: 16,
  },
  socialButtons: {
    flexDirection: "row",
    justifyContent: "center",
  },
  socialButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#F9FAFB",
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
});

export default ExpenselyAuth;
