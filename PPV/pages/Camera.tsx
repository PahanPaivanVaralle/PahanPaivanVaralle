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
import { useState, useRef, useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useNavigation, useRoute } from '@react-navigation/native';
import { pb } from '../lib/pocketbase';
import { styles } from '../global';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { distanceMetres, TaskMarker } from '../utils/streak';
import { Platform } from 'react-native';

interface ImageRecord {
  id: string;
  image: string;
}

export default function Camera() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const [taskMarkers, setTaskMarkers] = useState<TaskMarker[]>([]);
  const [pendingTask, setPendingTask] = useState<{
    id: string;
    title: string;
  } | null>(null);
  const [uploading, setUploading] = useState(false);

  // Pick up task from navigation params (from Map's "Suorita" button)
  useEffect(() => {
    const { taskId, taskTitle } = route.params ?? {};
    if (taskId) {
      setPendingTask({ id: taskId, title: taskTitle ?? 'Tehtävä' });
      navigation.setParams({ taskId: undefined, taskTitle: undefined });
    }
  }, [route.params?.taskId]);

  useEffect(() => {
    pb.collection('map_markers')
      .getFullList({ filter: 'title != ""', fields: 'id,lang,long,title' })
      .then((rows) =>
        setTaskMarkers(
          rows.map((r: any) => ({
            id: r.id,
            la: r.lang,
            lo: r.long,
            title: r.title,
          })),
        ),
      )
      .catch(console.error);
  }, []);
  const [facing, setFacing] = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const ref = useRef<CameraView>(null);
  const insets = useSafeAreaInsets();
  const askDestination = (uri: string) => setPreviewUri(uri);
  const closePreview = () => setPreviewUri(null);

  const uploadAndNavigate = async (uri: string, forceTaskId?: string) => {
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
    const { latitude: la, longitude: lo } = loc.coords;

    // Find the target task and always enforce the 10m distance check
    const targetTask = forceTaskId
      ? (taskMarkers.find((t) => t.id === forceTaskId) ?? null)
      : null;

    if (targetTask) {
      const dist = distanceMetres(la, lo, targetTask.la, targetTask.lo);
      if (dist > 10) {
        Alert.alert(
          'Liian kaukana!',
          `Olet ${Math.round(dist)} metrin päässä tehtävästä. Siirry lähemmäs tehtävää.`,
        );
        return;
      }
    }

    const nearbyTask = targetTask;

    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('image', { uri, name: 'photo.jpg', type: 'image/jpeg' } as any);
      const img = await pb.collection<ImageRecord>('images').create(fd);
      const rec = await pb
        .collection('map_markers')
        .create({ lang: la, long: lo, image: img.id });

      if (nearbyTask) {
        Alert.alert(
          'Tehtävä suoritettu! 🎉',
          `"${nearbyTask.title}" on merkitty tehdyksi.`,
        );
        navigation.navigate('Map', {
          newMarker: {
            la,
            lo,
            url: pb.files.getURL(img, img.image),
            id: rec.id,
          },
          completedTaskId: nearbyTask.id,
          completedImageUrl: pb.files.getURL(img, img.image),
        } as never);
      } else {
        navigation.navigate('Map', {
          newMarker: {
            la,
            lo,
            url: pb.files.getURL(img, img.image),
            id: rec.id,
          },
        } as never);
      }
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
      {pendingTask && (
        <View style={styles.taskBanner}>
          <Text style={styles.taskBannerText}>🎯 {pendingTask.title}</Text>
        </View>
      )}
      <View
        style={{
          paddingBottom: insets.bottom + 40,
          position: 'absolute',
          flexDirection: 'row',
          bottom: 25,
          alignSelf: 'center',
          gap: 50,
        }}
      >
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
              onPress={() => {
                closePreview();
              }}
              disabled={uploading}
            >
              <Ionicons name="arrow-back" size={24} color="#fff" />
              <Text style={styles.previewBtnText}>Peruuta</Text>
            </TouchableOpacity>
            {pendingTask ? (
              <TouchableOpacity
                style={[styles.previewBtn, styles.previewBtnSuccess]}
                onPress={() => {
                  const tid = pendingTask.id;
                  setPendingTask(null);
                  closePreview();
                  uploadAndNavigate(previewUri!, tid);
                }}
                disabled={uploading}
              >
                {uploading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Ionicons name="checkmark-circle" size={24} color="#fff" />
                )}
                <Text style={styles.previewBtnText}>Suorita</Text>
              </TouchableOpacity>
            ) : (
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
            )}
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
