import { Animated, View, Text, FlatList, Dimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import styles from "./styles/styles";

const { width: screenWidth } = Dimensions.get("window");

export const SummaryCarousel = ({ summaryCards, scrollX }: any) => {
  const renderSummaryCard = ({ item, index }: { item: any; index: number }) => {
    const inputRange = [
      (index - 1) * screenWidth * 0.85,
      index * screenWidth * 0.85,
      (index + 1) * screenWidth * 0.85,
    ];
    const scale = scrollX.interpolate({
      inputRange,
      outputRange: [0.9, 1, 0.9],
      extrapolate: "clamp",
    });
    const opacity = scrollX.interpolate({
      inputRange,
      outputRange: [0.6, 1, 0.6],
      extrapolate: "clamp",
    });

    return (
      <Animated.View
        style={[styles.summaryCard, { transform: [{ scale }], opacity }]}
      >
        <LinearGradient
          colors={item.bgGradient}
          style={styles.cardGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.cardHeader}>
            <View style={styles.cardIconContainer}>
              <LinearGradient
                colors={item.gradient}
                style={styles.iconGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Ionicons name={item.icon} size={24} color="white" />
              </LinearGradient>
            </View>
            <Text style={styles.cardTitle}>{item.title}</Text>
          </View>
          <Text style={[styles.cardAmount, { color: item.gradient[0] }]}>
            {" "}
            {item.amount}{" "}
          </Text>
        </LinearGradient>
      </Animated.View>
    );
  };

  return (
    <FlatList
      data={summaryCards}
      renderItem={renderSummaryCard}
      keyExtractor={(item) => item.id.toString()}
      horizontal
      pagingEnabled
      showsHorizontalScrollIndicator={false}
      snapToInterval={screenWidth * 0.85}
      decelerationRate="fast"
      contentContainerStyle={styles.carouselContent}
      onScroll={Animated.event(
        [{ nativeEvent: { contentOffset: { x: scrollX } } }],
        { useNativeDriver: false }
      )}
    />
  );
};
