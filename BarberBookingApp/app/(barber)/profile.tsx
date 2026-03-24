import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { AppTheme } from '@/constants/theme';
import { useAuthContext } from '@/context/AuthContext';
import { useSettings } from '@/context/SettingsContext';
import { barberApi, BarberProfile } from '@/services/barber.api';

const GOLD = AppTheme.colors.primary;
const BG = AppTheme.colors.background;
const DARK = AppTheme.colors.text;

export default function BarberProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuthContext();
  const { darkMode, notificationsEnabled, setDarkMode, setNotificationsEnabled } = useSettings();
  const bg = darkMode ? '#12131A' : BG;
  const surface = darkMode ? '#1B1D28' : '#FFFFFF';
  const border = darkMode ? '#2B2F3A' : '#E8E8E8';
  const textMain = darkMode ? '#ECEDEE' : DARK;
  const textMuted = darkMode ? '#A7AFBD' : '#4B5563';
  const inputBg = darkMode ? '#141725' : '#F5F7FA';

  const [profile, setProfile] = useState<BarberProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [shopName, setShopName] = useState('');
  const [address, setAddress] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [addingPhoto, setAddingPhoto] = useState(false);
  const [locating, setLocating] = useState(false);

  const loadProfile = useCallback(async () => {
    try {
      const barbers = await barberApi.listAllBarbers();
      const mine = barbers.find((b) => String(b.user_id) === user?.id);
      if (mine) {
        setProfile(mine);
        setShopName(mine.shop_name ?? '');
        setAddress(mine.address ?? '');
        setLatitude(mine.latitude != null ? String(mine.latitude) : '');
        setLongitude(mine.longitude != null ? String(mine.longitude) : '');
      }
    } catch {
      // pass
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const handleSave = async () => {
    const latNum = latitude.trim() ? Number(latitude.trim()) : undefined;
    const lngNum = longitude.trim() ? Number(longitude.trim()) : undefined;

    if (latitude.trim() && Number.isNaN(latNum)) {
      Alert.alert('Invalid Location', 'Latitude must be a valid number');
      return;
    }
    if (longitude.trim() && Number.isNaN(lngNum)) {
      Alert.alert('Invalid Location', 'Longitude must be a valid number');
      return;
    }

    try {
      setSaving(true);
      await barberApi.updateProfile({
        shop_name: shopName.trim() || undefined,
        address: address.trim() || undefined,
        latitude: latNum,
        longitude: lngNum,
      });
      Alert.alert('Saved', 'Profile updated successfully');
      await loadProfile();
    } catch {
      Alert.alert('Error', 'Could not save profile');
    } finally {
      setSaving(false);
    }
  };

  const handleAddPhoto = async () => {
    try {
      setAddingPhoto(true);

      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission Needed', 'Allow gallery permission to upload photos.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.7,
      });

      if (result.canceled || !result.assets?.length) return;

      const asset = result.assets[0];
      if (!asset.uri) {
        Alert.alert('Error', 'Could not read selected image');
        return;
      }

      const mimeType = asset.mimeType ?? 'image/jpeg';
      const extension = mimeType.split('/')[1] || 'jpg';
      await barberApi.addPhotoFile({
        uri: asset.uri,
        mimeType,
        name: asset.fileName ?? `portfolio-${Date.now()}.${extension}`,
      });
      await loadProfile();
    } catch (error: any) {
      const detail = error?.response?.data?.detail;
      const message = typeof detail === 'string' ? detail : 'Could not add photo';
      Alert.alert('Error', message);
    } finally {
      setAddingPhoto(false);
    }
  };

  const handleUseCurrentLocation = async () => {
    try {
      setLocating(true);
      const permission = await Location.requestForegroundPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission Needed', 'Allow location permission to autofill your coordinates.');
        return;
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      setLatitude(position.coords.latitude.toFixed(6));
      setLongitude(position.coords.longitude.toFixed(6));
    } catch {
      Alert.alert('Error', 'Could not get current location');
    } finally {
      setLocating(false);
    }
  };

  const handleDeletePhoto = (photoId: number) => {
    Alert.alert('Remove Photo', 'Delete this photo?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await barberApi.deletePhoto(photoId);
            await loadProfile();
          } catch {
            Alert.alert('Error', 'Could not delete photo');
          }
        },
      },
    ]);
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

  if (loading) {
    return (
      <SafeAreaView style={[styles.safeArea, styles.center, { backgroundColor: bg }]}>
        <ActivityIndicator color={GOLD} size="large" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: bg }]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* ─── Hero ─── */}
          <View style={styles.heroSection}>
            <View style={styles.bigAvatar}>
              <Text style={styles.bigAvatarText}>
                {(user?.username?.[0] ?? user?.email?.[0] ?? 'B').toUpperCase()}
              </Text>
            </View>
            <Text style={styles.heroName}>{user?.username ?? 'Barber'}</Text>
            <Text style={[styles.heroEmail, { color: textMuted }]}>{user?.email}</Text>
            <View style={[styles.rolePill, darkMode && { backgroundColor: '#26212D' }]}>
              <Ionicons name="cut" size={12} color={GOLD} />
              <Text style={styles.rolePillText}>Professional Barber</Text>
            </View>
          </View>

          {/* ─── Shop Info ─── */}
          <View style={[styles.card, { backgroundColor: surface, borderColor: border }]}> 
            <Text style={[styles.cardTitle, { color: textMain }]}>Shop Information</Text>
            <Text style={[styles.fieldLabel, { color: textMuted }]}>Shop Name</Text>
            <TextInput
              style={[styles.input, { backgroundColor: inputBg, borderColor: border, color: textMain }]}
              value={shopName}
              onChangeText={setShopName}
              placeholder="Enter your shop name"
              placeholderTextColor="#CBD5E0"
            />
            <Text style={[styles.fieldLabel, { color: textMuted }]}>Address</Text>
            <TextInput
              style={[styles.input, { minHeight: 72, textAlignVertical: 'top', backgroundColor: inputBg, borderColor: border, color: textMain }]}
              value={address}
              onChangeText={setAddress}
              placeholder="Enter your address"
              placeholderTextColor="#CBD5E0"
              multiline
            />
            <Text style={[styles.fieldLabel, { color: textMuted }]}>Location</Text>
            <View style={styles.locationRow}>
              <TextInput
                style={[styles.input, styles.locationInput, { backgroundColor: inputBg, borderColor: border, color: textMain }]}
                value={latitude}
                onChangeText={setLatitude}
                placeholder="Latitude"
                placeholderTextColor="#CBD5E0"
                keyboardType="numbers-and-punctuation"
              />
              <TextInput
                style={[styles.input, styles.locationInput, { backgroundColor: inputBg, borderColor: border, color: textMain }]}
                value={longitude}
                onChangeText={setLongitude}
                placeholder="Longitude"
                placeholderTextColor="#CBD5E0"
                keyboardType="numbers-and-punctuation"
              />
            </View>
            <TouchableOpacity
              style={[styles.secondaryBtn, locating && styles.btnDisabled]}
              onPress={handleUseCurrentLocation}
              disabled={locating}
            >
              <Ionicons name="locate-outline" size={16} color={GOLD} />
              <Text style={styles.secondaryBtnText}>
                {locating ? 'Locating…' : 'Use Current Location'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.primaryBtn, saving && styles.btnDisabled]}
              onPress={handleSave}
              disabled={saving}
            >
              <Text style={styles.primaryBtnText}>{saving ? 'Saving…' : 'Save Changes'}</Text>
            </TouchableOpacity>
          </View>

          {/* ─── Photos ─── */}
          <View style={[styles.card, { backgroundColor: surface, borderColor: border }]}> 
            <Text style={[styles.cardTitle, { color: textMain }]}>Portfolio Photos</Text>
            {profile?.photos && profile.photos.length > 0 && (
              <View style={styles.photosGrid}>
                {profile.photos.map((p) => (
                  <TouchableOpacity
                    key={p.id}
                    style={styles.photoItem}
                    onLongPress={() => handleDeletePhoto(p.id)}
                    activeOpacity={0.7}
                  >
                    <Image source={{ uri: p.photo_url }} style={styles.photoImage} contentFit="cover" />
                  </TouchableOpacity>
                ))}
              </View>
            )}
            <TouchableOpacity
              style={[styles.addPhotoWideBtn, addingPhoto && styles.btnDisabled]}
              onPress={handleAddPhoto}
              disabled={addingPhoto}
            >
              <Ionicons name="images-outline" size={18} color="#fff" />
              <Text style={styles.addPhotoWideText}>
                {addingPhoto ? 'Uploading…' : 'Upload From Gallery'}
              </Text>
            </TouchableOpacity>
            {profile?.photos && profile.photos.length > 0 && (
              <Text style={[styles.hintText, { color: textMuted }]}>Long-press a photo to remove it</Text>
            )}
          </View>

          {/* ─── Stats ─── */}
          <View style={[styles.card, { backgroundColor: surface, borderColor: border }]}> 
            <Text style={[styles.cardTitle, { color: textMain }]}>Profile Stats</Text>
            <View style={styles.statRow}>
              <Ionicons name="star" size={18} color={GOLD} />
              <Text style={[styles.statLabel, { color: textMuted }]}>Rating</Text>
              <Text style={[styles.statValue, { color: textMain }]}>
                {profile?.rating && profile.rating > 0 ? profile.rating.toFixed(1) : '—'}
              </Text>
            </View>
          </View>

          {/* ─── Settings ─── */}
          <View style={[styles.card, { backgroundColor: surface, borderColor: border }]}> 
            <Text style={[styles.cardTitle, { color: textMain }]}>Settings</Text>

            <View style={styles.settingRow}>
              <View style={styles.settingLabelWrap}>
                <Ionicons name="moon-outline" size={17} color={GOLD} />
                <Text style={[styles.settingLabel, { color: textMuted }]}>Dark Mode</Text>
              </View>
              <Switch value={darkMode} onValueChange={setDarkMode} />
            </View>

            <View style={[styles.settingDivider, { backgroundColor: border }]} />

            <View style={styles.settingRow}>
              <View style={styles.settingLabelWrap}>
                <Ionicons name="notifications-outline" size={17} color={GOLD} />
                <Text style={[styles.settingLabel, { color: textMuted }]}>Notifications</Text>
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
          </View>

          {/* ─── Logout ─── */}
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={18} color="#FF3B30" />
            <Text style={styles.logoutText}>Log Out</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: BG },
  center: { justifyContent: 'center', alignItems: 'center' },
  scroll: { flex: 1 },
  content: { padding: 20, paddingBottom: 40 },

  heroSection: { alignItems: 'center', paddingVertical: 24, marginBottom: 8 },
  bigAvatar: {
    width: 82,
    height: 82,
    borderRadius: 41,
    backgroundColor: DARK,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  bigAvatarText: { color: '#fff', fontSize: 34, fontWeight: '800' },
  heroName: { fontSize: 18, color: DARK, fontWeight: '700', marginBottom: 3 },
  heroEmail: { fontSize: 14, color: '#4B5563', marginBottom: 8 },
  rolePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FFF8E7',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  rolePillText: { fontSize: 12, fontWeight: '700', color: GOLD },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  cardTitle: { fontSize: 15, fontWeight: '700', color: DARK, marginBottom: 16 },
  fieldLabel: { fontSize: 12, color: '#8E8E93', fontWeight: '600', marginBottom: 6 },
  input: {
    backgroundColor: '#F5F7FA',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: DARK,
    borderWidth: 1,
    borderColor: '#E8E8E8',
    marginBottom: 12,
  },
  primaryBtn: {
    backgroundColor: GOLD,
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  secondaryBtn: {
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    backgroundColor: '#FFF8E7',
    borderWidth: 1,
    borderColor: '#F1E3B8',
    flexDirection: 'row',
    gap: 6,
  },
  secondaryBtnText: { color: GOLD, fontWeight: '700', fontSize: 13 },
  btnDisabled: { opacity: 0.6 },
  primaryBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 15 },
  locationRow: { flexDirection: 'row', gap: 8 },
  locationInput: { flex: 1 },

  photosGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  photoItem: {
    width: 80,
    height: 80,
    borderRadius: 10,
    backgroundColor: '#F5F7FA',
    borderWidth: 1,
    borderColor: '#E8E8E8',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  photoImage: { width: '100%', height: '100%' },
  addPhotoWideBtn: {
    width: '100%',
    height: 46,
    borderRadius: 10,
    backgroundColor: GOLD,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  addPhotoWideText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  hintText: { fontSize: 11, color: '#CBD5E0', marginTop: 2 },

  statRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  statLabel: { flex: 1, fontSize: 14, color: '#4B5563' },
  statValue: { fontSize: 18, fontWeight: '800', color: DARK },

  settingRow: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  settingLabelWrap: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  settingLabel: { fontSize: 14, color: '#4B5563', fontWeight: '600' },
  settingDivider: { height: 1, backgroundColor: '#E8E8E8' },

  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FFF5F5',
    borderWidth: 1,
    borderColor: '#FF3B3030',
    borderRadius: 12,
    padding: 14,
    marginTop: 6,
  },
  logoutText: { color: '#FF3B30', fontWeight: '700', fontSize: 15 },
});
