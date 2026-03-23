import { Ionicons } from '@expo/vector-icons';
import { Alert, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppTheme } from '@/constants/theme';
import { useSettings } from '@/context/SettingsContext';

const { colors } = AppTheme;

export default function ProfileScreen() {
  const { darkMode, notificationsEnabled, setDarkMode, setNotificationsEnabled } = useSettings();
  const bg = darkMode ? '#12131A' : colors.background;
  const surface = darkMode ? '#1B1D28' : colors.surface;
  const text = darkMode ? '#ECEDEE' : colors.text;
  const border = darkMode ? '#2B2F3A' : colors.divider;
  const muted = darkMode ? '#A7AFBD' : '#606A7A';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bg }]}>
      <Text style={[styles.title, { color: text }]}>Settings</Text>

      <View style={[styles.card, { backgroundColor: surface, borderColor: border }]}> 
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 20,
  },
  title: { fontSize: 26, fontWeight: '800', color: colors.text, marginBottom: 16 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: colors.divider,
  },
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
});
