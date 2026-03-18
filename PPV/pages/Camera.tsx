import { StatusBar } from 'expo-status-bar';
import { View, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useState, useRef } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useNavigation } from '@react-navigation/native';
import { pb } from '../lib/pocketbase';
import { styles } from '../global';

interface ImageRecord {
  id: string;
  image: string;
}

export default function Camera() {
  const navigation = useNavigation<any>();
  const [uploading, setUploading] = useState(false);
  const [facing, setFacing] = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const ref = useRef<CameraView>(null);

  const askDestination = (uri: string) => {
    Alert.alert('Kuva ladataan', 'Valitse minne kuva lisätään:', [
      { text: 'Kartta', onPress: () => uploadAndNavigate(uri) },
      { text: 'Feed', onPress: () => {} },
    ]);
  };

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
      const rec = await pb
        .collection('map_markers')
        .create({ lang: la, long: lo, image: img.id });
      navigation.navigate('Map', {
        newMarker: { la, lo, url: pb.files.getURL(img, img.image), id: rec.id },
      } as never);
    } catch {
      Alert.alert('Virhe', 'Kuvan tallennus epäonnistui.');
    } finally {
      setUploading(false);
    }
  };

  const takePicture = async () => {
    if (!ref.current || uploading) return;
    const photo = await ref.current.takePictureAsync({ quality: 0.7 });
    if (photo?.uri) askDestination(photo.uri);
  };

  const openNativeCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Lupa vaaditaan', 'Kameran käyttö vaatii luvan.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 0.7,
    });
    if (!result.canceled) askDestination(result.assets[0].uri);
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
    if (!result.canceled) askDestination(result.assets[0].uri);
  };

  if (!permission) return null;

  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <TouchableOpacity
          style={styles.permissionButton}
          onPress={requestPermission}
        >
          <Ionicons name="camera" size={32} color="#fff" />
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.CameraContainer}>
      <CameraView ref={ref} style={styles.camera} facing={facing} />
      <View style={styles.CameraButtons}>
        <TouchableOpacity
          onPress={() => setFacing((f) => (f === 'back' ? 'front' : 'back'))}
          disabled={uploading}
        >
          <Ionicons
            name="camera-reverse"
            size={64}
            color={uploading ? '#888' : 'white'}
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.captureButton}
          onPress={takePicture}
          disabled={uploading}
        >
          {uploading && <ActivityIndicator color="#fff" />}
        </TouchableOpacity>
        <TouchableOpacity onPress={pickFromGallery} disabled={uploading}>
          <Ionicons
            name="image"
            size={64}
            color={uploading ? '#888' : 'white'}
          />
        </TouchableOpacity>
      </View>
      <TouchableOpacity
        style={styles.nativeCameraButton}
        onPress={openNativeCamera}
        disabled={uploading}
      >
        <Ionicons name="phone-portrait" size={24} color="white" />
      </TouchableOpacity>
      <StatusBar style="auto" />
    </View>
  );
}
