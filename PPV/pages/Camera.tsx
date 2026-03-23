import { StatusBar } from 'expo-status-bar';
import {
  View,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
  Image,
  Text,
} from 'react-native';
import { useState, useRef } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useNavigation } from '@react-navigation/native';
import { pb } from '../lib/pocketbase';
import { styles } from '../global';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface ImageRecord {
  id: string;
  image: string;
}

export default function Camera() {
  const navigation = useNavigation<any>();
  const [uploading, setUploading] = useState(false);
  const [facing, setFacing] = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const ref = useRef<CameraView>(null);
  const [insetOffset, setInsetOffset] = useState(0);
  const insets = useSafeAreaInsets();

  const askDestination = (uri: string) => setPreviewUri(uri);

  const closePreview = () => setPreviewUri(null);

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

  const uploadToFeed = async (uri: string) => {
    const fd = new FormData();
    fd.append('image', { uri, name: 'photo.jpg', type: 'image/jpeg' } as any);
    await pb.collection('feed_images').create(fd);
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
    else setInsetOffset(50);
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
      <CameraView 
      ref={ref}
      style={styles.camera}
      facing={facing}
      />
      <View style={styles.CameraButtons}>
        <TouchableOpacity
          style={{ paddingBottom: insets.top + insetOffset }}
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
        <Ionicons name="camera" size={48} color="white" />
      </TouchableOpacity>
      <Modal visible={!!previewUri} transparent animationType="fade">
        <View style={styles.previewOverlay}>
          {previewUri && (
            <Image
              source={{ uri: previewUri }}
              style={styles.previewImage}
              resizeMode="contain"
            />
          )}
          <View style={styles.previewActions}>
            <TouchableOpacity
              style={styles.previewBtn}
              onPress={closePreview}
              disabled={uploading}
            >
              <Ionicons name="arrow-back" size={24} color="#fff" />
              <Text style={styles.previewBtnText}>Peruuta</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.previewBtn, styles.previewBtnPrimary]}
              onPress={() => {
                closePreview();
                uploadAndNavigate(previewUri!);
              }}
              disabled={uploading}
            >
              {uploading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Ionicons name="map" size={24} color="#fff" />
              )}
              <Text style={styles.previewBtnText}>Kartta</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.previewBtn, styles.previewBtnSecondary]}
              onPress={() => {
                closePreview();
                uploadToFeed(previewUri!);
              }}
              disabled={uploading}
            >
              <Ionicons name="newspaper" size={24} color="#aaa" />
              <Text style={[styles.previewBtnText, { color: '#aaa' }]}>
                Feed
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      <StatusBar style="auto" />
    </View>
  );
}
