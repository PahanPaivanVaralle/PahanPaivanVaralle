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
import { pb, getUserID } from '../lib/pocketbase';
import { RecordModel } from 'pocketbase';
import { BarChart, LineChart, PieChart, PopulationPyramid, RadarChart, BubbleChart } from "react-native-gifted-charts";
import { useHeaderHeight } from '@react-navigation/elements';

type GpsAccuracy = 'best' | 'high' | 'balanced';

const GPS_OPTIONS: { value: GpsAccuracy; label: string }[] = [
  { value: 'best', label: 'Tarkin' },
  { value: 'high', label: 'Perus' },
  { value: 'balanced', label: 'Virransäästö' },
];

const MAP_GPS_KEY = 'ppv_map_gps_accuracy';
const MAP_TRACKING_KEY = 'ppv_map_default_tracking';
const MAP_ZOOM_KEY = 'ppv_map_default_zoom';

type NumberStat = {
  label: string;
  value: number;
};

type Number2Stat = {
  text: string;
  value: number;
};

export default function Settings() {
  const { theme, setThemeName } = useTheme();
  const [appearanceOpen, setAppearanceOpen] = useState(false);
  const [mapOpen, setMapOpen] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);
  const [gpsAccuracy, setGpsAccuracyState] = useState<GpsAccuracy>('best');
  const [defaultTracking, setDefaultTrackingState] = useState(false);
  const [defaultZoom, setDefaultZoomState] = useState(5);
  const [profileOpen, setProfileOpen] = useState(false);
  const [userName, setUserName] = useState('');
  const [userRecordId, setUserRecordId] = useState('');
  const [nameSaved, setNameSaved] = useState(false);
  const [batteryData, setBatteryData] = useState<NumberStat[]>([]);
  const [manufacturerData, setManufacturerData] = useState<NumberStat[]>([]);
  const [osData, setOSData] = useState<Number2Stat[]>([]);
  const [likeData, setLikesData] = useState<NumberStat[]>([]);
  const headerHeight = useHeaderHeight();

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

  useEffect(() => {
    (async () => {
      console.log("Loading statistics..")
      const records = await pb.collection('users').getFullList({
        fields:
          'device_battery_level,device_manufacturer,device_os_version',
      });

      const likes = await pb.collection('likes').getFullList({
        expand: 'user',
      });

      const colors = [
        '#4CAF50',
        '#2196F3',
        '#FF9800',
        '#F44336',
        '#9C27B0',
        '#00BCD4',
      ];

      const batteryData = records.map((record) => ({
        label: record.username,
        value: parseInt(record.device_battery_level?.replace('%', '') || '0'),
      }));

      const manufacturerCounts: Record<string, number> = {};
      const OSCounts: Record<string, number> = {};
      const LikeCounts: Record<string, number> = {};

      for (const like of likes) {
        const liked_user = like.expand?.user.username ?? 'Unknown';

        LikeCounts[liked_user] = (LikeCounts[liked_user] || 0) + 1;
      }

      for (const record of records) {
        const manufacturer = record.device_manufacturer ?? 'Unknown';
        const os = record.device_os_version ?? 'Unknown';

        manufacturerCounts[manufacturer] =
          (manufacturerCounts[manufacturer] || 0) + 1;

        OSCounts[os] = (OSCounts[os] || 0) + 1;
      }

      const manufacturerData = Object.entries(manufacturerCounts).map(
        ([label, value]) => ({ label, value }),
      );

      const totalOS = Object.values(OSCounts).reduce((a, b) => a + b, 0);

      const OSData = Object.entries(OSCounts).map(([label, value], index) => {
        const percent = (value / totalOS) * 100;

        return {
          text: `${label} (${percent.toFixed(1)}%)`,
          value,
          color: colors[index % colors.length],
        };
      });

      const LikeData = Object.entries(LikeCounts).map(([label, value]) => ({
        label,
        value,
      }));

      setLikesData(LikeData);
      setOSData(OSData);
      setManufacturerData(manufacturerData);
      setBatteryData(batteryData);
    })();
  }, [adminOpen]);

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
    <ScrollView
      contentContainerStyle={[
        styles.settingsContainer,
        { paddingBottom: headerHeight },
      ]}
    >
      {/* Profiili */}
      <View style={styles.settingsSection}>
        <TouchableOpacity
          style={styles.settingsSectionHeader}
          onPress={() => setProfileOpen((o) => !o)}
          activeOpacity={0.7}
        >
          <Text style={[styles.text, styles.settingsSectionTitle]}>
            Käyttäjä
          </Text>
          <Ionicons
            name={profileOpen ? 'chevron-up' : 'chevron-down'}
            size={18}
            color="#555"
          />
        </TouchableOpacity>
        {profileOpen && (
          <View style={{ gap: 12 }}>
            <TextInput
              style={[styles.text, styles.settingsNameInput]}
              value={userName}
              onChangeText={setUserName}
              placeholder="Nimesi"
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
                  styles.text,
                  styles.settingsSaveBtnText,
                  nameSaved && styles.settingsSaveBtnTextSaved,
                ]}
              >
                {nameSaved ? 'Tallennettu!' : 'Tallenna'}
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
          <Text style={[styles.text, styles.settingsSectionTitle]}>Teemat</Text>
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
                <Text style={[styles.text, styles.settingsLabel]}>
                  {t.name}
                </Text>
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
          <Text style={[styles.text, styles.settingsSectionTitle]}>Kartta</Text>
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
              <Text style={[styles.settingsRowLabel, styles.text]}>
                Sijainnin tarkkuus
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
                        styles.text,
                        styles.settingsOptionBtnText,
                        gpsAccuracy === opt.value &&
                          styles.settingsOptionBtnTextActive,
                        ,
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
              <Text style={[styles.settingsRowLabel, styles.text]}>
                Sijainnin seuranta oletuksena
              </Text>
              <Switch
                value={defaultTracking}
                onValueChange={setDefaultTracking}
              />
            </View>

            {/* Default zoom */}
            <View style={styles.settingsRow}>
              <Text style={[styles.settingsRowLabel, styles.text]}>
                Vakiosuurennus
              </Text>
              <View style={styles.settingsStepper}>
                <TouchableOpacity
                  style={styles.settingsStepperBtn}
                  onPress={() => setDefaultZoom(defaultZoom - 1)}
                >
                  <Text style={[styles.text, styles.settingsStepperBtnText]}>
                    −
                  </Text>
                </TouchableOpacity>
                <Text style={[styles.text, styles.settingsStepperValue]}>
                  {defaultZoom}
                </Text>
                <TouchableOpacity
                  style={styles.settingsStepperBtn}
                  onPress={() => setDefaultZoom(defaultZoom + 1)}
                >
                  <Text style={[styles.text, styles.settingsStepperBtnText]}>
                    +
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </View>
      {/* Admin */}
      <View style={styles.settingsSection}>
        <TouchableOpacity
          style={styles.settingsSectionHeader}
          onPress={() => setAdminOpen((o) => !o)}
          activeOpacity={0.7}
        >
          <Text
            style={[styles.text, styles.settingsSectionTitle, { color: 'red' }]}
          >
            Admin
          </Text>
          <Ionicons
            name={adminOpen ? 'chevron-up' : 'chevron-down'}
            size={18}
            color="#555"
          />
        </TouchableOpacity>
        {adminOpen && (
          <View style={{ gap: 16 }}>
            <View>
              <Text
                style={[
                  styles.settingsRowLabel,
                  styles.text,
                  { textAlign: 'center', paddingBottom: 10 },
                ]}
              >
                Käyttäjien akkuprosentit
              </Text>
              <LineChart
                maxValue={100}
                adjustToWidth={true}
                showValuesAsDataPointsText={true}
                data={batteryData}
              />
              <Text
                style={[
                  styles.settingsRowLabel,
                  styles.text,
                  { textAlign: 'center', paddingTop: 25 },
                ]}
              >
                Käyttäjien puhelinvalmistajat
              </Text>
              <BarChart adjustToWidth={true} data={manufacturerData} />
              <Text
                style={[
                  styles.settingsRowLabel,
                  styles.text,
                  { textAlign: 'center', paddingTop: 25, paddingBottom: 25 },
                ]}
              >
                Käyttäjien käyttöjärjestelmät
              </Text>
              <View style={{ alignItems: 'center' }}>
                <PieChart
                  showText={true}
                  textSize={8}
                  radius={150}
                  data={osData}
                />
              </View>
              <Text
                style={[
                  styles.settingsRowLabel,
                  styles.text,
                  { textAlign: 'center', paddingTop: 25 },
                ]}
              >
                Käyttäjien tykkäykset
              </Text>
              <BarChart adjustToWidth={true} data={likeData} />
            </View>
          </View>
        )}
      </View>
    </ScrollView>
  );
}
