import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from 'react-i18next';
import {
	Alert,
    Image,
    KeyboardAvoidingView,
	Modal,
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
import { useSettings } from '@/context/SettingsContext';

const { colors } = AppTheme;

export default function RegisterScreen() {
	const router = useRouter();
	const { t } = useTranslation();
	const { colors } = useAppColors();
	const { language, setLanguage } = useSettings();
	const [email, setEmail] = useState("");
	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [role, setRole] = useState<UserRole>("user");
	const [showPassword, setShowPassword] = useState(false);
	const [showConfirmPassword, setShowConfirmPassword] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [languageSheetVisible, setLanguageSheetVisible] = useState(false);

	const languageOptions = [
		{ code: 'en', label: 'EN' },
		{ code: 'fr', label: 'FR' },
		{ code: 'ar', label: 'AR' },
	] as const;

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
			Alert.alert(t('auth.missingFieldsTitle'), t('auth.loginMissingFieldsMessage'));
			return;
		}

		if (passwordMismatch) {
			Alert.alert(t('auth.passwordMismatchTitle'), t('auth.passwordMismatchMessage'));
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

			Alert.alert(t('auth.registrationSuccessTitle'), t('auth.registrationSuccessMessage'), [
				{ text: t('common.ok'), onPress: () => router.back() },
			]);
		} catch (error) {
			Alert.alert(t('auth.registrationFailedTitle'), toSimpleMessage(error));
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
					{t('auth.createYourAccount')} <Text style={styles.headingBlack}>Quick</Text>
					<Text style={styles.headingGold}>Cut</Text> {t('auth.accountSuffix')}
				</Text>

				<View style={styles.languageTopRight}>
					<Pressable
						style={[styles.languageIconBtn, { backgroundColor: colors.surface, borderColor: colors.divider }]}
						onPress={() => setLanguageSheetVisible(true)}
					>
						<Ionicons name="language-outline" size={16} color={colors.primary} />
						<Text style={[styles.languageCodeText, { color: colors.primary }]}>{language.toUpperCase()}</Text>
					</Pressable>
				</View>

				<TextInput
					style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.divider }]}
					placeholder={t('auth.email')}
					placeholderTextColor="#aaa"
					keyboardType="email-address"
					autoCapitalize="none"
					value={email}
					onChangeText={setEmail}
				/>

				<TextInput
					style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.divider }]}
					placeholder={t('auth.username')}
					placeholderTextColor="#aaa"
					autoCapitalize="none"
					value={username}
					onChangeText={setUsername}
				/>

				<Text style={styles.roleLabel}>{t('auth.selectRole')}</Text>
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
							{t('auth.client')}
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
							{t('auth.barber')}
						</Text>
					</Pressable>
				</View>

				<View style={[styles.passwordWrapper, { backgroundColor: colors.surface, borderColor: colors.divider }]}> 
					<TextInput
						style={[styles.passwordInput, { color: colors.text }]}
						placeholder={t('auth.password')}
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
						placeholder={t('auth.confirmPassword')}
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
					<Text style={styles.errorText}>{t('auth.passwordMismatchMessage')}</Text>
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
						{isLoading ? t('auth.creatingAccount') : t('auth.createAccount')}
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
					<Text style={[styles.btnSecondaryText, { color: colors.primary }]}>{t('auth.backToLogin')}</Text>
				</Pressable>
			</ScrollView>

			<Modal
				visible={languageSheetVisible}
				transparent
				animationType="slide"
				onRequestClose={() => setLanguageSheetVisible(false)}
			>
				<Pressable style={styles.sheetBackdrop} onPress={() => setLanguageSheetVisible(false)}>
					<Pressable
						style={[styles.sheetCard, { backgroundColor: colors.surface, borderColor: colors.divider }]}
						onPress={(event) => event.stopPropagation()}
					>
						<View style={styles.sheetHandle} />
						<Text style={[styles.sheetTitle, { color: colors.text }]}>{t('common.language')}</Text>

						{languageOptions.map((item) => {
							const active = language === item.code;
							const title = item.code === 'en' ? t('common.english') : item.code === 'fr' ? t('common.french') : t('common.arabic');
							return (
								<Pressable
									key={item.code}
									style={[
										styles.sheetItem,
										{ borderColor: colors.divider, backgroundColor: active ? colors.primaryMuted : colors.background },
									]}
									onPress={() => {
										if (!active) {
											void setLanguage(item.code);
										}
										setLanguageSheetVisible(false);
									}}
								>
									<Text style={[styles.sheetItemText, { color: colors.text }]}>{title}</Text>
									{active ? <Ionicons name="checkmark-circle" size={18} color={colors.primary} /> : null}
								</Pressable>
							);
						})}
					</Pressable>
				</Pressable>
			</Modal>
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
	languageTopRight: {
		width: "100%",
		alignItems: "flex-start",
		marginTop: -4,
		marginBottom: 14,
	},
	languageIconBtn: {
		flexDirection: "row",
		alignItems: "center",
		gap: 6,
		minHeight: 34,
		paddingHorizontal: 10,
		borderWidth: 1,
		borderRadius: 999,
	},
	languageCodeText: {
		fontSize: 12,
		fontWeight: '800',
		letterSpacing: 0.3,
	},
	sheetBackdrop: {
		flex: 1,
		backgroundColor: 'rgba(0,0,0,0.35)',
		justifyContent: 'flex-end',
	},
	sheetCard: {
		borderTopLeftRadius: 20,
		borderTopRightRadius: 20,
		paddingHorizontal: 16,
		paddingTop: 10,
		paddingBottom: 24,
		borderWidth: 1,
		borderBottomWidth: 0,
		gap: 10,
	},
	sheetHandle: {
		alignSelf: 'center',
		width: 44,
		height: 5,
		borderRadius: 999,
		backgroundColor: '#C9CDD4',
		marginBottom: 4,
	},
	sheetTitle: {
		fontSize: 17,
		fontWeight: '800',
		marginBottom: 4,
	},
	sheetItem: {
		minHeight: 48,
		borderRadius: 12,
		borderWidth: 1,
		paddingHorizontal: 12,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
	},
	sheetItemText: {
		fontSize: 14,
		fontWeight: '700',
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
