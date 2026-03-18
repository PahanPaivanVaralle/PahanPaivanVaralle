import { StatusBar } from 'expo-status-bar';
import {
  View,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useNavigation } from '@react-navigation/native';
import { pb } from '../lib/pocketbase';

interface ImageRecord {
  id: string;
  image: string;
}

export default function Camera() {
  const navigation = useNavigation<any>();
  const [uploading, setUploading] = useState(false);

  const uploadAndNavigate = async (uri: string) => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Sijainti vaaditaan',
        'Sijaintilupa tarvitaan kuvan lisäämiseksi karttaan.',
      );
      return;
    }
    const loc = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
    });
    setUploading(true);
    try {
      const { latitude: la, longitude: lo } = loc.coords;
      const fd = new FormData();
      fd.append('image', { uri, name: 'photo.jpg', type: 'image/jpeg' } as any);
      const img = await pb.collection<ImageRecord>('images').create(fd);
      await pb
        .collection('map_markers')
        .create({ lang: la, long: lo, image: img.id });
      navigation.navigate('Map' as never);
    } catch {
      Alert.alert('Virhe', 'Kuvan tallennus epäonnistui.');
    } finally {
      setUploading(false);
    }
  };

  const openCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Lupa vaaditaan', 'Kameran käyttö vaatii luvan.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 0.7,
    });
    if (!result.canceled) await uploadAndNavigate(result.assets[0].uri);
  };

  const pickFromGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Lupa vaaditaan', 'Gallerian käyttö vaatii luvan.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.7,
    });
    if (!result.canceled) await uploadAndNavigate(result.assets[0].uri);
  };

  return (
    <View style={s.container}>
      <TouchableOpacity style={s.btn} onPress={openCamera} disabled={uploading}>
        <Ionicons name="camera" size={48} color={uploading ? '#aaa' : '#fff'} />
      </TouchableOpacity>
      {uploading && <ActivityIndicator color="#fff" size="large" />}
      <TouchableOpacity style={s.btn} onPress={pickFromGallery} disabled={uploading}>
        <Ionicons name="image" size={48} color={uploading ? '#aaa' : '#fff'} />
      </TouchableOpacity>
      <StatusBar style="auto" />
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#222',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 40,
  },
  btn: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#444',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
