"use client";

import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useRef } from "react";
import {
  Animated,
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const { width: screenWidth } = Dimensions.get("window");

const GroupsLoadingScreen = () => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const shimmerAnim = useRef(new Animated.Value(-1)).current;
  const headerSlide = useRef(new Animated.Value(-50)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

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
      Animated.timing(headerSlide, {
        toValue: 0,
        duration: 700,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
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

  const SkeletonGroupCard = ({ delay = 0 }: { delay?: number }) => {
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
          colors={["#FFFFFF", "#F8FAFC"]}
          style={styles.skeletonCardGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          {/* Header */}
          <View style={styles.skeletonHeader}>
            <View style={styles.skeletonIcon} />
            <View style={styles.skeletonHeaderContent}>
              <View style={[styles.skeletonText, styles.skeletonTitle]} />
              <View style={[styles.skeletonText, styles.skeletonDescription]} />
            </View>
            <View style={styles.skeletonDeleteButton} />
          </View>

          {/* Stats */}
          <View style={styles.skeletonStats}>
            <View style={styles.skeletonStatItem}>
              <View style={[styles.skeletonText, styles.skeletonStatValue]} />
              <View style={[styles.skeletonText, styles.skeletonStatLabel]} />
            </View>
            <View style={styles.skeletonStatItem}>
              <View style={[styles.skeletonText, styles.skeletonStatValue]} />
              <View style={[styles.skeletonText, styles.skeletonStatLabel]} />
            </View>
            <View style={styles.skeletonStatItem}>
              <View style={[styles.skeletonText, styles.skeletonStatValue]} />
              <View style={[styles.skeletonText, styles.skeletonStatLabel]} />
            </View>
          </View>

          {/* Progress Bar */}
          <View style={styles.skeletonProgressContainer}>
            <View style={styles.skeletonProgressBar}>
              <View style={styles.skeletonProgressFill} />
            </View>
            <View style={[styles.skeletonText, styles.skeletonProgressText]} />
          </View>

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
              colors={["transparent", "rgba(99, 102, 241, 0.1)", "transparent"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.shimmerGradient}
            />
          </Animated.View>
        </LinearGradient>
      </Animated.View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <Animated.View
        style={[
          styles.header,
          {
            opacity: fadeAnim,
            transform: [{ translateY: headerSlide }],
          },
        ]}
      >
        <TouchableOpacity style={styles.backButton} disabled>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <View style={[styles.skeletonText, styles.headerTitleSkeleton]} />
          <View style={[styles.skeletonText, styles.headerSubtitleSkeleton]} />
        </View>
        <View style={styles.headerRight} />
      </Animated.View>

      {/* Search Bar */}
      <Animated.View
        style={[
          styles.searchContainer,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <View style={styles.searchBar}>
          <Ionicons
            name="search"
            size={20}
            color="#6B7280"
            style={styles.searchIcon}
          />
          <View style={[styles.skeletonText, styles.searchInputSkeleton]} />
        </View>
      </Animated.View>

      {/* Loading Icon and Text */}
      <Animated.View
        style={[
          styles.loadingSection,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <Animated.View
          style={[
            styles.loadingIconContainer,
            {
              transform: [{ rotate: spin }],
            },
          ]}
        >
          <LinearGradient
            colors={["#6366F1", "#8B5CF6", "#A855F7"]}
            style={styles.loadingIcon}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Ionicons name="people" size={32} color="white" />
          </LinearGradient>
        </Animated.View>
        <Text style={styles.loadingText}>Curating your groups...</Text>
        <Text style={styles.loadingSubtext}>
          Preparing your collaborative workspace
        </Text>
      </Animated.View>

      {/* Skeleton Group Cards */}
      <View style={styles.skeletonCardsContainer}>
        {[0, 1, 2].map((index) => (
          <SkeletonGroupCard key={index} delay={index * 200} />
        ))}
      </View>

      {/* Floating Action Button Skeleton */}
      <Animated.View
        style={[
          styles.fab,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <View style={styles.fabButton}>
          <LinearGradient
            colors={["#8B5CF6", "#7C3AED"]}
            style={styles.fabGradient}
          >
            <Ionicons name="add" size={28} color="white" />
          </LinearGradient>
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F9FAFB",
    justifyContent: "center",
    alignItems: "center",
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
  },
  headerTitleSkeleton: {
    width: 100,
    height: 20,
    marginBottom: 4,
  },
  headerSubtitleSkeleton: {
    width: 60,
    height: 14,
  },
  headerRight: {
    width: 40,
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#FFFFFF",
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 48,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInputSkeleton: {
    flex: 1,
    height: 16,
  },
  loadingSection: {
    alignItems: "center",
    paddingVertical: 30,
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
    paddingBottom: 100,
  },
  skeletonCard: {
    borderRadius: 16,
    overflow: "hidden",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    marginBottom: 16,
  },
  skeletonCardGradient: {
    padding: 20,
    position: "relative",
  },
  skeletonHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  skeletonIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#E5E7EB",
    marginRight: 16,
  },
  skeletonHeaderContent: {
    flex: 1,
  },
  skeletonTitle: {
    width: 120,
    height: 18,
    marginBottom: 4,
  },
  skeletonDescription: {
    width: 80,
    height: 14,
  },
  skeletonDeleteButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#E5E7EB",
  },
  skeletonStats: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  skeletonStatItem: {
    alignItems: "center",
  },
  skeletonStatValue: {
    width: 50,
    height: 16,
    marginBottom: 4,
  },
  skeletonStatLabel: {
    width: 40,
    height: 12,
  },
  skeletonProgressContainer: {
    marginBottom: 16,
  },
  skeletonProgressBar: {
    height: 6,
    backgroundColor: "#E5E7EB",
    borderRadius: 3,
    overflow: "hidden",
    marginBottom: 8,
  },
  skeletonProgressFill: {
    height: "100%",
    width: "60%",
    backgroundColor: "#D1D5DB",
    borderRadius: 3,
  },
  skeletonProgressText: {
    width: 60,
    height: 12,
    alignSelf: "center",
  },
  skeletonText: {
    backgroundColor: "#E5E7EB",
    borderRadius: 4,
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
  fab: {
    position: "absolute",
    bottom: 30,
    right: 20,
  },
  fabButton: {
    borderRadius: 28,
    elevation: 8,
    shadowColor: "#8B5CF6",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  fabGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default GroupsLoadingScreen;
