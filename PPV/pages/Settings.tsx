import React, { useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { THEMES, ThemeName, useTheme } from '../lib/ThemeContext';
import { styles } from '../global';

export default function Settings() {
  const { theme, setThemeName } = useTheme();
  const [appearanceOpen, setAppearanceOpen] = useState(true);

  return (
    <ScrollView contentContainerStyle={styles.settingsContainer}>
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
    </ScrollView>
  );
}
