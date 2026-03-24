import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ClientUi } from '@/constants/client-ui';
import { AppTheme } from '@/constants/theme';
import { useAuthContext } from '@/context/AuthContext';
import { useSettings } from '@/context/SettingsContext';
import { clientApi } from '@/services/client.api';
import { updateMyProfile } from '@/services/auth';

const { colors } = AppTheme;

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout, syncProfile } = useAuthContext();
  const { darkMode, notificationsEnabled, setDarkMode, setNotificationsEnabled } = useSettings();
  const bg = darkMode ? '#12131A' : colors.background;
  const surface = darkMode ? '#1B1D28' : colors.surface;
  const text = darkMode ? '#ECEDEE' : colors.text;
  const border = darkMode ? '#2B2F3A' : colors.divider;
  const muted = darkMode ? '#A7AFBD' : '#606A7A';
  const inputBg = darkMode ? '#141725' : '#F8FAFC';

  const [username, setUsername] = useState(user?.username || '');
  const [email, setEmail] = useState(user?.email || '');
  const [saving, setSaving] = useState(false);
  const [statsLoading, setStatsLoading] = useState(true);
  const [favoritesCount, setFavoritesCount] = useState(0);
  const [appointmentsCount, setAppointmentsCount] = useState(0);

  useEffect(() => {
    setUsername(user?.username || '');
    setEmail(user?.email || '');
  }, [user?.email, user?.username]);

  useEffect(() => {
    (async () => {
      try {
        const [favorites, appointments] = await Promise.all([
          clientApi.listFavorites().catch(() => []),
          clientApi.myHistory().catch(() => []),
        ]);
        setFavoritesCount(Array.isArray(favorites) ? favorites.length : 0);
        setAppointmentsCount(Array.isArray(appointments) ? appointments.length : 0);
      } finally {
        setStatsLoading(false);
      }
    })();
  }, []);

  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      const payload = {
        username: username.trim(),
        email: email.trim(),
      };
      const data = await updateMyProfile(payload);
      syncProfile({ username: data.username, email: data.email });
      Alert.alert('Saved', 'Your profile info was updated.');
    } catch (error: any) {
      const message = error?.message || 'Could not update profile info';
      Alert.alert('Update Failed', message);
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out',
        style: 'destructive',
        onPress: () => {
          logout();
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bg }]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.heroSection}>
          <View style={[styles.bigAvatar, { backgroundColor: darkMode ? '#171C37' : '#171A3A' }]}> 
            <Text style={styles.bigAvatarText}>
              {(user?.username?.[0] ?? user?.email?.[0] ?? 'C').toUpperCase()}
            </Text>
          </View>
          <Text style={[styles.heroName, { color: text }]}>{user?.username || 'Client'}</Text>
          <Text style={[styles.heroEmail, { color: muted }]}>{user?.email || 'No email'}</Text>
          <View style={[styles.rolePill, darkMode && { backgroundColor: '#26212D' }]}>
            <Ionicons name="person-outline" size={12} color={colors.primary} />
            <Text style={[styles.rolePillText, { color: colors.primary }]}>Client Account</Text>
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: surface, borderColor: border }]}> 
          <Text style={[styles.sectionTitle, { color: text }]}>Account Information</Text>
          <Text style={[styles.fieldLabel, { color: muted }]}>Username</Text>
          <TextInput
            style={[styles.input, { backgroundColor: inputBg, borderColor: border, color: text }]}
            value={username}
            onChangeText={setUsername}
            placeholder="Your username"
            placeholderTextColor={muted}
            autoCapitalize="none"
          />

          <Text style={[styles.fieldLabel, { color: muted }]}>Email</Text>
          <TextInput
            style={[styles.input, { backgroundColor: inputBg, borderColor: border, color: text }]}
            value={email}
            onChangeText={setEmail}
            placeholder="Your email"
            placeholderTextColor={muted}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Pressable
            style={[styles.saveBtn, { backgroundColor: colors.primary, opacity: saving ? 0.7 : 1 }]}
            onPress={handleSaveProfile}
            disabled={saving}
          >
            <Text style={styles.saveBtnText}>{saving ? 'Saving...' : 'Save Changes'}</Text>
          </Pressable>

          <View style={styles.accountActionsRow}>
            <Pressable
              style={[styles.actionBtn, { borderColor: border, backgroundColor: darkMode ? '#141725' : '#F8FAFC' }]}
              onPress={() => router.push('/(tabs)/favorites')}
            >
              <Ionicons name="heart-outline" size={15} color={colors.primary} />
              <Text style={[styles.actionBtnText, { color: text }]}>Favorites</Text>
            </Pressable>

            <Pressable
              style={[styles.actionBtn, { borderColor: border, backgroundColor: darkMode ? '#141725' : '#F8FAFC' }]}
              onPress={() => router.push('/(tabs)/appointments')}
            >
              <Ionicons name="calendar-outline" size={15} color={colors.primary} />
              <Text style={[styles.actionBtnText, { color: text }]}>Appointments</Text>
            </Pressable>
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: surface, borderColor: border }]}> 
          <Text style={[styles.sectionTitle, { color: text }]}>Profile Stats</Text>
          {statsLoading ? (
            <ActivityIndicator color={colors.primary} />
          ) : (
            <>
              <View style={styles.statRow}>
                <View style={styles.statLeft}>
                  <Ionicons name="heart-outline" size={17} color={colors.primary} />
                  <Text style={[styles.statLabel, { color: muted }]}>Favorites</Text>
                </View>
                <Text style={[styles.statValue, { color: text }]}>{favoritesCount}</Text>
              </View>
              <View style={[styles.divider, { backgroundColor: border }]} />
              <View style={styles.statRow}>
                <View style={styles.statLeft}>
                  <Ionicons name="calendar-outline" size={17} color={colors.primary} />
                  <Text style={[styles.statLabel, { color: muted }]}>Appointments</Text>
                </View>
                <Text style={[styles.statValue, { color: text }]}>{appointmentsCount}</Text>
              </View>
            </>
          )}
        </View>

        <View style={[styles.card, { backgroundColor: surface, borderColor: border }]}> 
          <Text style={[styles.sectionTitle, { color: text }]}>Settings</Text>
          <View style={styles.row}>
            <View style={styles.labelWrap}>
              <Ionicons name="moon-outline" size={18} color={colors.primary} />
              <Text style={[styles.label, { color: text }]}>Dark Mode</Text>
            </View>
            <Switch value={darkMode} onValueChange={setDarkMode} />
          </View>

          <View style={[styles.divider, { backgroundColor: border }]} />

          <View style={styles.row}>
            <View style={styles.labelWrap}>
              <Ionicons name="notifications-outline" size={18} color={colors.primary} />
              <Text style={[styles.label, { color: text }]}>Notifications</Text>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={async (value) => {
                const ok = await setNotificationsEnabled(value);
                if (!ok && value) {
                  Alert.alert(
                    'Permission Required',
                    'Notification permission was denied. You can enable it in phone settings.',
                  );
                }
              }}
            />
          </View>
          <Text style={[styles.note, { color: muted }]}>Theme applies to supported screens.</Text>
        </View>

        <Pressable
          style={[
            styles.logoutBtn,
            {
              borderColor: darkMode ? '#7F1D1D' : '#FCA5A5',
              backgroundColor: darkMode ? '#2A1616' : '#FEF2F2',
            },
          ]}
          onPress={handleLogout}
        >
          <Ionicons name="log-out-outline" size={18} color="#DC2626" />
          <Text style={styles.logoutText}>Log Out</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: ClientUi.spacing.screen,
    paddingBottom: 30,
    gap: 14,
  },
  heroSection: {
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  bigAvatar: {
    width: 86,
    height: 86,
    borderRadius: 43,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  bigAvatarText: {
    color: '#fff',
    fontSize: 38,
    fontWeight: '800',
  },
  heroName: { fontSize: 33, fontWeight: '800' },
  heroEmail: { fontSize: 13 },
  rolePill: {
    marginTop: 7,
    borderRadius: 999,
    backgroundColor: '#F5EFD7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  rolePillText: { fontSize: 12, fontWeight: '700' },
  card: {
    backgroundColor: colors.surface,
    borderRadius: ClientUi.radius.card,
    paddingHorizontal: ClientUi.spacing.card,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: colors.divider,
    ...ClientUi.shadow.card,
  },
  sectionTitle: { fontSize: 30, fontWeight: '800', color: colors.text, marginBottom: 8 },
  fieldLabel: { fontSize: 12, fontWeight: '700', marginTop: 2, marginBottom: 5 },
  input: {
    borderWidth: 1,
    borderRadius: ClientUi.radius.input,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  saveBtn: {
    borderRadius: ClientUi.radius.input,
    paddingVertical: 11,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
  },
  saveBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
  },
  accountActionsRow: {
    marginTop: 12,
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 999,
    paddingVertical: 8,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  actionBtnText: { fontSize: 12, fontWeight: '700' },
  statRow: {
    minHeight: 46,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statLabel: { fontSize: 14, fontWeight: '600' },
  statValue: { fontSize: 20, fontWeight: '800' },
  row: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  labelWrap: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  label: { fontSize: 15, fontWeight: '600', color: colors.text },
  divider: { height: 1, backgroundColor: colors.divider },
  note: { marginTop: 10, fontSize: 12 },
  logoutBtn: {
    borderWidth: 1,
    borderRadius: ClientUi.radius.tile,
    paddingVertical: 12,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  logoutText: {
    color: '#DC2626',
    fontSize: 14,
    fontWeight: '800',
  },
});
