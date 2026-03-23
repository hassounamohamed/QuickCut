import { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import { AppTheme } from "@/constants/theme";

const { colors } = AppTheme;

interface Props {
  onFinish: () => void;
}

export default function SplashScreen({ onFinish }: Props) {
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.85)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const textY = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    Animated.sequence([
      // Logo fades + scales in
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.spring(scale, {
          toValue: 1,
          friction: 6,
          useNativeDriver: true,
        }),
      ]),
      // Text slides up
      Animated.parallel([
        Animated.timing(textOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(textY, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
      ]),
      Animated.delay(1400),
      // Fade everything out
      Animated.timing(opacity, {
        toValue: 0,
        duration: 450,
        useNativeDriver: true,
      }),
    ]).start(() => onFinish());
  }, [onFinish, opacity, scale, textOpacity, textY]);

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.content, { opacity }]}>
        <Animated.Image
          source={require("@/assets/images/logo.png")}
          style={[styles.logo, { transform: [{ scale }] }]}
          resizeMode="contain"
        />
        <Animated.View
          style={{ opacity: textOpacity, transform: [{ translateY: textY }] }}
        >
          <View style={styles.nameRow}>
            <Text style={styles.nameDark}>Quick</Text>
            <Text style={styles.nameGold}>Cut</Text>
          </View>
          <Text style={styles.tagline}>Book Your Perfect Cut</Text>
        </Animated.View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 999,
  },
  content: {
    alignItems: "center",
  },
  logo: {
    width: 200,
    height: 200,
    marginBottom: 12,
  },
  nameRow: {
    flexDirection: "row",
    justifyContent: "center",
  },
  nameDark: {
    fontSize: 42,
    fontWeight: "800",
    color: colors.text,
    letterSpacing: -0.5,
  },
  nameGold: {
    fontSize: 42,
    fontWeight: "800",
    color: colors.primary,
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 15,
    color: colors.textMuted,
    marginTop: 4,
    textAlign: "center",
    letterSpacing: 0.3,
  },
});
