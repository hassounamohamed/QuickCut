import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
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
import { AppTheme } from "@/constants/theme";
import { registerUser, UserRole } from "@/services/auth";
import { useAppColors } from '@/hooks/use-app-colors';

const { colors } = AppTheme;

export default function RegisterScreen() {
	const router = useRouter();
	const { colors } = useAppColors();
	const [email, setEmail] = useState("");
	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [role, setRole] = useState<UserRole>("user");
	const [showPassword, setShowPassword] = useState(false);
	const [showConfirmPassword, setShowConfirmPassword] = useState(false);
	const [isLoading, setIsLoading] = useState(false);

	const toSimpleMessage = (error: unknown) => {
		const message = error instanceof Error ? error.message.toLowerCase() : "";

		if (message.includes("email is already in use")) {
			return "This email is already used. Try another one.";
		}

		if (message.includes("username is already in use")) {
			return "This username is already used. Try another one.";
		}

		if (message.includes("do not match")) {
			return "Passwords do not match.";
		}

		if (message.includes("network") || message.includes("timeout")) {
			return "Cannot connect to server. Please check your internet and try again.";
		}

		return "Registration failed. Please try again.";
	};

	const passwordMismatch = useMemo(() => {
		if (!confirmPassword) return false;
		return password !== confirmPassword;
	}, [password, confirmPassword]);

	const handleRegister = async () => {
		const trimmedEmail = email.trim();
		const trimmedUsername = username.trim();

		if (!trimmedEmail || !trimmedUsername || !password || !confirmPassword) {
			Alert.alert("Missing Fields", "Please complete all fields.");
			return;
		}

		if (passwordMismatch) {
			Alert.alert("Password Mismatch", "Passwords do not match.");
			return;
		}

		try {
			setIsLoading(true);
			await registerUser({
				email: trimmedEmail,
				username: trimmedUsername,
				password,
				confirme_password: confirmPassword,
				role,
			});

			Alert.alert("Success", "Account created successfully.", [
				{ text: "OK", onPress: () => router.back() },
			]);
		} catch (error) {
			Alert.alert("Registration Failed", toSimpleMessage(error));
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
				<Image
					source={require("@/assets/images/logo.png")}
					style={styles.logo}
					resizeMode="contain"
				/>

				<Text style={styles.heading}>
					Create Your <Text style={styles.headingBlack}>Quick</Text>
					<Text style={styles.headingGold}>Cut</Text> Account
				</Text>

				<TextInput
					style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.divider }]}
					placeholder="Email"
					placeholderTextColor="#aaa"
					keyboardType="email-address"
					autoCapitalize="none"
					value={email}
					onChangeText={setEmail}
				/>

				<TextInput
					style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.divider }]}
					placeholder="Username"
					placeholderTextColor="#aaa"
					autoCapitalize="none"
					value={username}
					onChangeText={setUsername}
				/>

				<Text style={styles.roleLabel}>Select Role</Text>
				<View style={styles.roleRow}>
					<Pressable
						style={[
							styles.roleOption,
							{ backgroundColor: colors.surface, borderColor: colors.divider },
							role === "user" && [styles.roleOptionActive, { backgroundColor: colors.primary, borderColor: colors.primary }],
						]}
						onPress={() => setRole("user")}
					>
						<Text
							style={[styles.roleOptionText, role === "user" && styles.roleOptionTextActive]}
						>
							Client
						</Text>
					</Pressable>
					<Pressable
						style={[
							styles.roleOption,
							{ backgroundColor: colors.surface, borderColor: colors.divider },
							role === "barber" && [styles.roleOptionActive, { backgroundColor: colors.primary, borderColor: colors.primary }],
						]}
						onPress={() => setRole("barber")}
					>
						<Text
							style={[
								styles.roleOptionText,
								role === "barber" && styles.roleOptionTextActive,
							]}
						>
							Barber
						</Text>
					</Pressable>
				</View>

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

				<View
					style={[
						styles.passwordWrapper,
						{ backgroundColor: colors.surface, borderColor: colors.divider },
						passwordMismatch && styles.passwordWrapperError,
					]}
				>
					<TextInput
						style={[styles.passwordInput, { color: colors.text }]}
						placeholder="Confirm Password"
						placeholderTextColor="#aaa"
						secureTextEntry={!showConfirmPassword}
						value={confirmPassword}
						onChangeText={setConfirmPassword}
					/>
					<Pressable
						onPress={() => setShowConfirmPassword((v) => !v)}
						style={styles.eyeBtn}
					>
						<Ionicons
							name={showConfirmPassword ? "eye-off-outline" : "eye-outline"}
							size={20}
							color="#6B7280"
						/>
					</Pressable>
				</View>

				{passwordMismatch ? (
					<Text style={styles.errorText}>Passwords do not match.</Text>
				) : null}

				<Pressable
					style={({ pressed }) => [
						styles.btnPrimary,
						{ backgroundColor: colors.primary },
						pressed && styles.pressed,
						passwordMismatch && styles.btnDisabled,
						isLoading && styles.btnDisabled,
					]}
					disabled={passwordMismatch || isLoading}
					onPress={handleRegister}
				>
					<Text style={styles.btnPrimaryText}>
						{isLoading ? "Creating Account..." : "Create Account"}
					</Text>
				</Pressable>

				<Pressable
					style={({ pressed }) => [
						styles.btnSecondary,
						{ backgroundColor: colors.surface, borderColor: colors.divider },
						pressed && styles.pressed,
					]}
					onPress={() => router.back()}
				>
					<Text style={[styles.btnSecondaryText, { color: colors.primary }]}>Back to Login</Text>
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
	title: {
		fontSize: 24,
		fontWeight: "700",
		color: "#1a1a1a",
		marginBottom: 24,
		textAlign: "center",
	},
	logo: {
		width: 120,
		height: 120,
		marginBottom: 10,
	},
	heading: {
		fontSize: 22,
		fontWeight: "700",
		color: "#111827",
		marginBottom: 24,
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
	roleLabel: {
		width: "100%",
		fontSize: 13,
		fontWeight: "600",
		color: "#4B5563",
		marginBottom: 8,
	},
	roleRow: {
		width: "100%",
		flexDirection: "row",
		gap: 10,
		marginBottom: 14,
	},
	roleOption: {
		flex: 1,
		height: 44,
		borderRadius: 8,
		borderWidth: 1,
		borderColor: "#D1D5DB",
		backgroundColor: "#FFFFFF",
		alignItems: "center",
		justifyContent: "center",
	},
	roleOptionActive: {
		backgroundColor: colors.primary,
		borderColor: colors.primary,
	},
	roleOptionText: {
		fontSize: 14,
		fontWeight: "600",
		color: "#111827",
	},
	roleOptionTextActive: {
		color: "#fff",
	},
	passwordWrapper: {
		width: "100%",
		flexDirection: "row",
		alignItems: "center",
		backgroundColor: "#F9FAFB",
		borderRadius: 8,
		borderWidth: 1,
		borderColor: "#D1D5DB",
		marginBottom: 14,
	},
	passwordWrapperError: {
		borderColor: "#D13D3D",
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
	errorText: {
		width: "100%",
		color: "#D13D3D",
		marginBottom: 14,
		marginTop: -4,
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
	btnDisabled: {
		opacity: 0.6,
	},
	pressed: {
		opacity: 0.92,
		transform: [{ translateY: 1 }],
	},
});
