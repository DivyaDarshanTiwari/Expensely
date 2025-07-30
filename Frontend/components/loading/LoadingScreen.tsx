"use client";

import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useRef } from "react";
import { Animated, Dimensions, StyleSheet, Text, View } from "react-native";

const { width: screenWidth } = Dimensions.get("window");

const LoadingScreen = () => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const shimmerAnim = useRef(new Animated.Value(-1)).current;

  useEffect(() => {
    // Start all animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();

    // Continuous rotation for loading icon
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true,
      })
    ).start();

    // Pulse animation for cards
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.95,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Shimmer effect
    Animated.loop(
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  const shimmerTranslate = shimmerAnim.interpolate({
    inputRange: [-1, 1],
    outputRange: [-screenWidth, screenWidth],
  });

  const SkeletonCard = ({
    gradient,
    delay = 0,
  }: {
    gradient: string[];
    delay?: number;
  }) => {
    const cardAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
      Animated.timing(cardAnim, {
        toValue: 1,
        duration: 600,
        delay,
        useNativeDriver: true,
      }).start();
    }, []);

    return (
      <Animated.View
        style={[
          styles.skeletonCard,
          {
            opacity: cardAnim,
            transform: [{ scale: pulseAnim }],
          },
        ]}
      >
        <LinearGradient
          colors={[`${gradient[0]}15`, `${gradient[1]}10`]}
          style={styles.skeletonCardGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.skeletonHeader}>
            <View
              style={[
                styles.skeletonIcon,
                { backgroundColor: `${gradient[0]}30` },
              ]}
            />
            <View style={styles.skeletonTextContainer}>
              <View style={[styles.skeletonText, styles.skeletonTitle]} />
              <View style={[styles.skeletonText, styles.skeletonSubtitle]} />
            </View>
          </View>
          <View style={[styles.skeletonText, styles.skeletonAmount]} />

          {/* Shimmer overlay */}
          <Animated.View
            style={[
              styles.shimmerOverlay,
              {
                transform: [{ translateX: shimmerTranslate }],
              },
            ]}
          >
            <LinearGradient
              colors={["transparent", "rgba(255,255,255,0.4)", "transparent"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.shimmerGradient}
            />
          </Animated.View>
        </LinearGradient>
      </Animated.View>
    );
  };

  const SkeletonTransaction = ({ delay = 0 }: { delay?: number }) => {
    const transactionAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
      Animated.timing(transactionAnim, {
        toValue: 1,
        duration: 400,
        delay,
        useNativeDriver: true,
      }).start();
    }, []);

    return (
      <Animated.View
        style={[
          styles.skeletonTransaction,
          {
            opacity: transactionAnim,
            transform: [{ translateX: Animated.multiply(transactionAnim, 20) }],
          },
        ]}
      >
        <View style={styles.skeletonTransactionIcon} />
        <View style={styles.skeletonTransactionContent}>
          <View
            style={[styles.skeletonText, styles.skeletonTransactionTitle]}
          />
          <View
            style={[styles.skeletonText, styles.skeletonTransactionSubtitle]}
          />
        </View>
        <View style={styles.skeletonTransactionRight}>
          <View
            style={[styles.skeletonText, styles.skeletonTransactionAmount]}
          />
          <View style={[styles.skeletonText, styles.skeletonTransactionDate]} />
        </View>
      </Animated.View>
    );
  };

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.profileImageSkeleton} />
            <View style={styles.userInfoSkeleton}>
              <View style={[styles.skeletonText, styles.greetingSkeleton]} />
              <View style={[styles.skeletonText, styles.userNameSkeleton]} />
            </View>
          </View>
          <View style={styles.settingsButtonSkeleton} />
        </View>

        {/* Loading Icon and Text */}
        <View style={styles.loadingSection}>
          <Animated.View
            style={[
              styles.loadingIconContainer,
              {
                transform: [{ rotate: spin }],
              },
            ]}
          >
            <LinearGradient
              colors={["#8B5CF6", "#7C3AED"]}
              style={styles.loadingIcon}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Ionicons name="analytics" size={32} color="white" />
            </LinearGradient>
          </Animated.View>
          <Text style={styles.loadingText}>Loading your dashboard...</Text>
          <Text style={styles.loadingSubtext}>
            Fetching your financial data
          </Text>
        </View>

        {/* Skeleton Cards */}
        <View style={styles.skeletonCardsContainer}>
          <SkeletonCard gradient={["#8B5CF6", "#7C3AED"]} delay={0} />
          <SkeletonCard gradient={["#EF4444", "#DC2626"]} delay={200} />
          <SkeletonCard gradient={["#10B981", "#059669"]} delay={400} />
        </View>

        {/* Skeleton Transactions */}
        <View style={styles.skeletonSection}>
          <View style={[styles.skeletonText, styles.sectionTitleSkeleton]} />
          <View style={styles.skeletonTransactionsList}>
            {[0, 1, 2, 3].map((index) => (
              <SkeletonTransaction key={index} delay={index * 100} />
            ))}
          </View>
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FAFAFA",
  },
  content: {
    flex: 1,
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
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  profileImageSkeleton: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: "#E5E7EB",
    marginRight: 12,
  },
  userInfoSkeleton: {
    justifyContent: "center",
  },
  greetingSkeleton: {
    width: 80,
    height: 12,
    marginBottom: 4,
  },
  userNameSkeleton: {
    width: 120,
    height: 16,
  },
  settingsButtonSkeleton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#E5E7EB",
  },
  loadingSection: {
    alignItems: "center",
    paddingVertical: 40,
  },
  loadingIconContainer: {
    marginBottom: 20,
  },
  loadingIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    elevation: 8,
    shadowColor: "#8B5CF6",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  loadingText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 8,
  },
  loadingSubtext: {
    fontSize: 14,
    color: "#6B7280",
  },
  skeletonCardsContainer: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  skeletonCard: {
    width: "100%",
    height: 120,
    marginBottom: 16,
    borderRadius: 16,
    overflow: "hidden",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  skeletonCardGradient: {
    flex: 1,
    padding: 20,
    justifyContent: "space-between",
    position: "relative",
  },
  skeletonHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  skeletonIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 12,
  },
  skeletonTextContainer: {
    flex: 1,
  },
  skeletonText: {
    backgroundColor: "#E5E7EB",
    borderRadius: 4,
  },
  skeletonTitle: {
    width: 80,
    height: 12,
    marginBottom: 4,
  },
  skeletonSubtitle: {
    width: 60,
    height: 10,
  },
  skeletonAmount: {
    width: 120,
    height: 24,
    marginTop: 12,
  },
  shimmerOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  shimmerGradient: {
    flex: 1,
    width: 100,
  },
  skeletonSection: {
    paddingHorizontal: 20,
  },
  sectionTitleSkeleton: {
    width: 150,
    height: 20,
    marginBottom: 16,
  },
  skeletonTransactionsList: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 4,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  skeletonTransaction: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F9FAFB",
  },
  skeletonTransactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#E5E7EB",
    marginRight: 12,
  },
  skeletonTransactionContent: {
    flex: 1,
  },
  skeletonTransactionTitle: {
    width: 100,
    height: 14,
    marginBottom: 4,
  },
  skeletonTransactionSubtitle: {
    width: 80,
    height: 12,
  },
  skeletonTransactionRight: {
    alignItems: "flex-end",
  },
  skeletonTransactionAmount: {
    width: 60,
    height: 14,
    marginBottom: 4,
  },
  skeletonTransactionDate: {
    width: 40,
    height: 10,
  },
});

export default LoadingScreen;
