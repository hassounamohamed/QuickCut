import { useRouter } from "expo-router";
import { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import {
  Alert,
    Image,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import { loginUser } from "@/services/auth";
import { useAuthContext } from "@/context/AuthContext";
import { useSettings } from '@/context/SettingsContext';
import { AppTheme } from '@/constants/theme';
import { useAppColors } from '@/hooks/use-app-colors';

const { colors } = AppTheme;

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuthContext();
  const { permissionFlowSeen } = useSettings();
  const { colors } = useAppColors();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const toSimpleMessage = (error: unknown) => {
    const message = error instanceof Error ? error.message.toLowerCase() : "";

    if (message.includes("invalid username/email or password")) {
      return "Email/username or password is incorrect.";
    }

    if (message.includes("network") || message.includes("timeout")) {
      return "Cannot connect to server. Please check your internet and try again.";
    }

    return "Login failed. Please try again.";
  };

  const handleLogin = async () => {
    const identifier = email.trim();

    if (!identifier || !password) {
      Alert.alert("Missing Fields", "Please enter your email/username and password.");
      return;
    }

    try {
      setIsLoading(true);
      const response = await loginUser({ identifier, password });
      // Decode JWT payload to determine role
      let role = 'user';
      try {
        const b64 = response.access_token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
        const json = globalThis.atob(b64);
        role = JSON.parse(json)?.role ?? 'user';
      } catch {
        // malformed token — default to user route
      }
      login(response.access_token);
      if (permissionFlowSeen) {
        router.replace(role === 'barber' ? '/(barber)/dashboard' : '/(tabs)/home');
      } else {
        router.replace(`/(permissions)/welcome?role=${role}` as any);
      }
    } catch (error) {
      Alert.alert("Login Failed", toSimpleMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.flex, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={[styles.container, { backgroundColor: colors.background }]}
        keyboardShouldPersistTaps="handled"
      >
        {/* Logo */}
        <Image
          source={require("@/assets/images/logo.png")}
          style={styles.logo}
          resizeMode="contain"
        />

        {/* Heading */}
        <Text style={styles.heading}>
          Welcome to <Text style={styles.headingBlack}>Quick</Text>
          <Text style={styles.headingGold}>Cut</Text>
        </Text>

        {/* Email or Username */}
        <TextInput
          style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.divider }]}
          placeholder="Email or Username"
          placeholderTextColor="#aaa"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />

        {/* Password */}
        <View style={[styles.passwordWrapper, { backgroundColor: colors.surface, borderColor: colors.divider }]}> 
          <TextInput
            style={[styles.passwordInput, { color: colors.text }]}
            placeholder="Password"
            placeholderTextColor="#aaa"
            secureTextEntry={!showPassword}
            value={password}
            onChangeText={setPassword}
          />
          <Pressable
            onPress={() => setShowPassword((v) => !v)}
            style={styles.eyeBtn}
          >
            <Ionicons
              name={showPassword ? "eye-off-outline" : "eye-outline"}
              size={20}
              color="#6B7280"
            />
          </Pressable>
        </View>

        {/* Log In */}
        <Pressable
          style={({ pressed }) => [styles.btnPrimary, { backgroundColor: colors.primary }, pressed && styles.pressed]}
          onPress={handleLogin}
          disabled={isLoading}
        >
          <Text style={styles.btnPrimaryText}>{isLoading ? "Logging In..." : "Log In"}</Text>
        </Pressable>

        {/* Register */}
        <Pressable
          style={({ pressed }) => [
            styles.btnSecondary,
            { backgroundColor: colors.surface, borderColor: colors.divider },
            pressed && styles.pressed,
          ]}
          onPress={() => router.push("/(auth)/register")}
        >
          <Text style={[styles.btnSecondaryText, { color: colors.primary }]}>Register</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  container: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
    paddingVertical: 40,
    backgroundColor: colors.background,
  },
  logo: {
    width: 140,
    height: 140,
    marginBottom: 12,
  },
  heading: {
    fontSize: 22,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 28,
    textAlign: "center",
  },
  headingGold: {
    color: colors.primary,
  },
  headingBlack: {
    color: "#111827",
  },
  input: {
    width: "100%",
    height: 48,
    backgroundColor: "#F9FAFB",
    borderRadius: 8,
    paddingHorizontal: 14,
    fontSize: 15,
    color: "#111827",
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#D1D5DB",
  },
  passwordWrapper: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    marginBottom: 20,
  },
  passwordInput: {
    flex: 1,
    height: 48,
    paddingHorizontal: 14,
    fontSize: 15,
    color: "#111827",
  },
  eyeBtn: {
    paddingHorizontal: 12,
    height: 48,
    justifyContent: "center",
  },
  btnPrimary: {
    width: "100%",
    height: 48,
    backgroundColor: colors.primary,
    borderRadius: 8,
    borderWidth: 0,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    shadowColor: "#9B7B2B",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  btnPrimaryText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  btnSecondary: {
    width: "100%",
    height: 48,
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    alignItems: "center",
    justifyContent: "center",
  },
  btnSecondaryText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: "700",
  },
  pressed: {
    opacity: 0.92,
    transform: [{ translateY: 1 }],
  },
});
