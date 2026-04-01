import React, { useEffect, useState } from 'react';
import {
  ScrollView,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { THEMES, ThemeName, useTheme } from '../lib/ThemeContext';
import { styles } from '../global';
import { pb, getUserID } from '../lib/Pocketbase';

type GpsAccuracy = 'best' | 'high' | 'balanced';

const GPS_OPTIONS: { value: GpsAccuracy; label: string }[] = [
  { value: 'best', label: 'Most accurate' },
  { value: 'high', label: 'Normal' },
  { value: 'balanced', label: 'Battery saving' },
];

const MAP_GPS_KEY = 'ppv_map_gps_accuracy';
const MAP_TRACKING_KEY = 'ppv_map_default_tracking';
const MAP_ZOOM_KEY = 'ppv_map_default_zoom';

export default function Settings() {
  const { theme, setThemeName } = useTheme();
  const [appearanceOpen, setAppearanceOpen] = useState(false);
  const [mapOpen, setMapOpen] = useState(false);
  const [gpsAccuracy, setGpsAccuracyState] = useState<GpsAccuracy>('best');
  const [defaultTracking, setDefaultTrackingState] = useState(false);
  const [defaultZoom, setDefaultZoomState] = useState(5);
  const [profileOpen, setProfileOpen] = useState(false);
  const [userName, setUserName] = useState('');
  const [userRecordId, setUserRecordId] = useState('');
  const [nameSaved, setNameSaved] = useState(false);

  useEffect(() => {
    (async () => {
      const [acc, track, zoom] = await Promise.all([
        AsyncStorage.getItem(MAP_GPS_KEY),
        AsyncStorage.getItem(MAP_TRACKING_KEY),
        AsyncStorage.getItem(MAP_ZOOM_KEY),
      ]);
      if (acc) setGpsAccuracyState(acc as GpsAccuracy);
      if (track) setDefaultTrackingState(track === 'true');
      if (zoom) setDefaultZoomState(parseInt(zoom, 10));

      const uid = await getUserID();
      if (uid) {
        const record = await pb
          .collection('users')
          .getFirstListItem(`userid="${uid}"`);
        setUserName(record.username ?? '');
        setUserRecordId(record.id);
      }
    })();
  }, []);

  const saveUserName = async () => {
    if (!userRecordId) return;
    await pb.collection('users').update(userRecordId, { username: userName });
    setNameSaved(true);
    setTimeout(() => setNameSaved(false), 2000);
  };

  const setGpsAccuracy = async (val: GpsAccuracy) => {
    setGpsAccuracyState(val);
    await AsyncStorage.setItem(MAP_GPS_KEY, val);
  };

  const setDefaultTracking = async (val: boolean) => {
    setDefaultTrackingState(val);
    await AsyncStorage.setItem(MAP_TRACKING_KEY, val ? 'true' : 'false');
  };

  const setDefaultZoom = async (val: number) => {
    const clamped = Math.min(15, Math.max(4, val));
    setDefaultZoomState(clamped);
    await AsyncStorage.setItem(MAP_ZOOM_KEY, String(clamped));
  };

  return (
    <ScrollView contentContainerStyle={styles.settingsContainer}>
      {/* Profiili */}
      <View style={styles.settingsSection}>
        <TouchableOpacity
          style={styles.settingsSectionHeader}
          onPress={() => setProfileOpen((o) => !o)}
          activeOpacity={0.7}
        >
          <Text style={styles.settingsSectionTitle}>Profile</Text>
          <Ionicons
            name={profileOpen ? 'chevron-up' : 'chevron-down'}
            size={18}
            color="#555"
          />
        </TouchableOpacity>
        {profileOpen && (
          <View style={{ gap: 12 }}>
            <TextInput
              style={styles.settingsNameInput}
              value={userName}
              onChangeText={setUserName}
              placeholder="Your name"
              placeholderTextColor="#aaa"
              maxLength={40}
              returnKeyType="done"
            />
            <TouchableOpacity
              style={[
                styles.settingsSaveBtn,
                nameSaved && styles.settingsSaveBtnSaved,
              ]}
              onPress={saveUserName}
              activeOpacity={0.7}
            >
              <Ionicons
                name={nameSaved ? 'checkmark' : 'checkmark-outline'}
                size={15}
                color={nameSaved ? '#1a7a3f' : '#333'}
              />
              <Text
                style={[
                  styles.settingsSaveBtnText,
                  nameSaved && styles.settingsSaveBtnTextSaved,
                ]}
              >
                {nameSaved ? 'Saved!' : 'Save'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Ulkonäkö */}
      <View style={styles.settingsSection}>
        <TouchableOpacity
          style={styles.settingsSectionHeader}
          onPress={() => setAppearanceOpen((o) => !o)}
          activeOpacity={0.7}
        >
          <Text style={styles.settingsSectionTitle}>Themes</Text>
          <Ionicons
            name={appearanceOpen ? 'chevron-up' : 'chevron-down'}
            size={18}
            color="#555"
          />
        </TouchableOpacity>
        {appearanceOpen && (
          <View style={styles.settingsGrid}>
            {THEMES.map((t) => (
              <TouchableOpacity
                key={t.name}
                onPress={() => setThemeName(t.name as ThemeName)}
                style={[
                  styles.settingsCard,
                  theme.name === t.name && styles.settingsCardActive,
                ]}
              >
                <LinearGradient
                  colors={t.gradient}
                  style={styles.settingsPreview}
                />
                <Text style={styles.settingsLabel}>{t.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* Kartta */}
      <View style={styles.settingsSection}>
        <TouchableOpacity
          style={styles.settingsSectionHeader}
          onPress={() => setMapOpen((o) => !o)}
          activeOpacity={0.7}
        >
          <Text style={styles.settingsSectionTitle}>Map</Text>
          <Ionicons
            name={mapOpen ? 'chevron-up' : 'chevron-down'}
            size={18}
            color="#555"
          />
        </TouchableOpacity>
        {mapOpen && (
          <View style={{ gap: 16 }}>
            {/* GPS accuracy */}
            <View>
              <Text style={[styles.settingsRowLabel, { marginBottom: 8 }]}>
                GPS accuracy
              </Text>
              <View style={styles.settingsOptionRow}>
                {GPS_OPTIONS.map((opt) => (
                  <TouchableOpacity
                    key={opt.value}
                    onPress={() => setGpsAccuracy(opt.value)}
                    style={[
                      styles.settingsOptionBtn,
                      gpsAccuracy === opt.value &&
                        styles.settingsOptionBtnActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.settingsOptionBtnText,
                        gpsAccuracy === opt.value &&
                          styles.settingsOptionBtnTextActive,
                      ]}
                    >
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Tracking by default */}
            <View style={styles.settingsRow}>
              <Text style={styles.settingsRowLabel}>Tracking by default</Text>
              <Switch
                value={defaultTracking}
                onValueChange={setDefaultTracking}
              />
            </View>

            {/* Default zoom */}
            <View style={styles.settingsRow}>
              <Text style={styles.settingsRowLabel}>Default zoom</Text>
              <View style={styles.settingsStepper}>
                <TouchableOpacity
                  style={styles.settingsStepperBtn}
                  onPress={() => setDefaultZoom(defaultZoom - 1)}
                >
                  <Text style={styles.settingsStepperBtnText}>−</Text>
                </TouchableOpacity>
                <Text style={styles.settingsStepperValue}>{defaultZoom}</Text>
                <TouchableOpacity
                  style={styles.settingsStepperBtn}
                  onPress={() => setDefaultZoom(defaultZoom + 1)}
                >
                  <Text style={styles.settingsStepperBtnText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </View>
    </ScrollView>
  );
}
