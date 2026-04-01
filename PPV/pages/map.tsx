import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, TouchableOpacity, Text, Alert } from 'react-native';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import * as Location from 'expo-location';
import {
  useFocusEffect,
  useRoute,
  useNavigation,
} from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  pb,
  loadLikedMarkerIds,
  toggleMarkerLike,
  loadStreakFromDB,
  saveStreakToDB,
  loadCompletedTaskIds,
  saveTaskCompletion,
} from '../lib/Pocketbase';
import { styles } from '../global';
import {
  recordTaskCompletionDB,
  isStreakAlive,
  StreakData,
  TaskMarker,
  distanceMetres,
} from '../utils/streak';

interface ImageRecord {
  id: string;
  image: string;
}
interface MapMarkerRecord {
  id: string;
  lang: number;
  long: number;
  title?: string;
  icon?: string;
  color?: string;
  desc?: string;
  likes?: number;
  expand?: { image?: ImageRecord };
}

const MAP_HTML = require('../assets/map.html');
const js = (code: string) => `${code}; true;`;
const S = JSON.stringify;

export default function MapPage() {
  const webRef = useRef<WebView>(null);
  const locRef = useRef<Location.LocationObject | null>(null);
  const liked = useRef<Set<string>>(new Set());
  const ready = useRef(false);
  const genRef = useRef(0);
  const needsReload = useRef(false);
  const [tracking, setTracking] = useState(false);
  const [streak, setStreak] = useState<StreakData>({
    count: 0,
    lastCompleted: 0,
  });
  const [gpsAccuracy, setGpsAccuracy] = useState<'best' | 'high' | 'balanced'>(
    'best',
  );
  const [defaultZoom, setDefaultZoom] = useState(5);
  const taskMarkersRef = useRef<TaskMarker[]>([]);
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const newMarkerParamRef = useRef<any>(undefined);
  newMarkerParamRef.current = route.params?.newMarker;

  const run = (code: string) => webRef.current?.injectJavaScript(js(code));

  const refreshStreak = async () => {
    const s = await loadStreakFromDB();
    setStreak(s);
  };

  useEffect(() => {
    refreshStreak();
    (async () => {
      const [acc, track, zoom] = await Promise.all([
        AsyncStorage.getItem('ppv_map_gps_accuracy'),
        AsyncStorage.getItem('ppv_map_default_tracking'),
        AsyncStorage.getItem('ppv_map_default_zoom'),
      ]);
      if (acc) setGpsAccuracy(acc as 'best' | 'high' | 'balanced');
      if (track) setTracking(track === 'true');
      if (zoom) setDefaultZoom(parseInt(zoom, 10));
    })();
  }, []);

  useEffect(() => {
    const accuracyMap = {
      best: Location.Accuracy.BestForNavigation,
      high: Location.Accuracy.High,
      balanced: Location.Accuracy.Balanced,
    };
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      Location.watchPositionAsync(
        {
          accuracy: accuracyMap[gpsAccuracy],
          distanceInterval: 1,
          timeInterval: 1000,
        },
        (loc) => {
          locRef.current = loc;
          run(`updateLocation(${loc.coords.latitude},${loc.coords.longitude})`);
        },
      );
    })();
  }, [gpsAccuracy]);

  const loadMarkers = async () => {
    try {
      liked.current = await loadLikedMarkerIds();
      run(`setLikedIds(${S([...liked.current])})`);
      const completedIds = await loadCompletedTaskIds();
      const { items } = await pb
        .collection('map_markers')
        .getList<MapMarkerRecord>(1, 500, {
          sort: '-created',
          expand: 'image',
        });
      const tasks: TaskMarker[] = [];
      items.forEach((r) => {
        const img = r.expand?.image;
        const url = img ? pb.files.getURL(img, img.image) : '';
        if (r.title) {
          tasks.push({ id: r.id, la: r.lang, lo: r.long, title: r.title });
          run(
            `addTaskMarker(${r.lang},${r.long},${S(r.title)},${S(r.icon || 'location')},${S(r.color || '#3388ff')},${S(r.desc || '')},${S(url)},${S(r.id)},${r.likes ?? 0})`,
          );
          if (liked.current.has(r.id) && completedIds.has(r.id)) {
            run(`completeTaskMarkerUI(${S(r.id)},${S('')})`);
          }
        } else if (img) {
          run(
            `addPhotoToCluster(${r.lang},${r.long},${S(url)},${S(r.id)},${r.likes ?? 0})`,
          );
        }
      });
      taskMarkersRef.current = tasks;
    } catch (e) {
      console.error('Markkereiden lataus epäonnistui:', e);
    }
  };

  const handleToggle = (markerId: string, isLike: boolean) => {
    if (isLike) liked.current.add(markerId);
    else liked.current.delete(markerId);
    toggleMarkerLike(markerId, isLike)
      .then((n) => run(`updateLikes(${S(markerId)},${n},${isLike})`))
      .catch((e) => {
        if (isLike) liked.current.delete(markerId);
        else liked.current.add(markerId);
        console.error('Tykkäys epäonnistui:', e);
      });
  };

  const handleTaskCompletedFromCamera = async (
    markerId: string,
    imgUrl: string,
  ) => {
    if (!liked.current.has(markerId)) {
      liked.current.add(markerId);
      toggleMarkerLike(markerId, true).catch(console.error);
    }
    await saveTaskCompletion(markerId);
    run(`completeTaskMarkerUI(${S(markerId)},${S(imgUrl)})`);
    const updated = await recordTaskCompletionDB();
    setStreak(updated);
  };

  const onMessage = (e: WebViewMessageEvent) => {
    const d = e.nativeEvent.data;
    if (d === 'ready') {
      ready.current = true;
      needsReload.current = false;
      run(`map.setZoom(${defaultZoom})`);
      run('clearMarkers()');
      loadMarkers();
    } else if (d === 'unlock') setTracking(false);
    else if (d.startsWith('like:')) handleToggle(d.slice(5), true);
    else if (d.startsWith('unlike:')) handleToggle(d.slice(7), false);
    else if (d.startsWith('do-task:')) {
      const taskId = d.slice(8);
      const task = taskMarkersRef.current.find((t) => t.id === taskId);
      const loc = locRef.current;
      if (task && loc) {
        const dist = distanceMetres(
          loc.coords.latitude,
          loc.coords.longitude,
          task.la,
          task.lo,
        );
        if (dist > 20) {
          Alert.alert(
            'Liian kaukana!',
            `Olet ${Math.round(dist)} metrin päässä tehtävästä. Siirry lähemmäs tehtävää.\n\n[debug] sinä: ${loc.coords.latitude.toFixed(5)}, ${loc.coords.longitude.toFixed(5)}\ntehtävä: ${task.la}, ${task.lo}`,
          );
          return;
        }
      }
      navigation.navigate('Camera', {
        taskId,
        taskTitle: task?.title ?? 'Tehtävä',
      });
    }
  };

  useFocusEffect(
    useCallback(() => {
      if (newMarkerParamRef.current) {
        // newMarker param present — useEffect will inject it directly, skip full reload
        return;
      }
      if (!ready.current) {
        needsReload.current = true;
        return;
      }
      run('clearMarkers()');
      loadMarkers();
    }, []),
  );

  useEffect(() => {
    const m = route.params?.newMarker;
    if (!m) return;
    navigation.setParams({ newMarker: undefined });
    if (ready.current) {
      run(`addPhotoToCluster(${m.la},${m.lo},${S(m.url)},${S(m.id)},0)`);
    }
  }, [route.params?.newMarker]);

  useEffect(() => {
    const completedId = route.params?.completedTaskId;
    const completedImageUrl = route.params?.completedImageUrl ?? '';
    if (!completedId) return;
    navigation.setParams({
      completedTaskId: undefined,
      completedImageUrl: undefined,
    });
    handleTaskCompletedFromCamera(completedId, completedImageUrl);
  }, [route.params?.completedTaskId]);

  const streakAlive = isStreakAlive(streak);

  return (
    <View style={styles.mapContainer}>
      <WebView
        ref={webRef}
        source={MAP_HTML}
        style={styles.map}
        originWhitelist={['*']}
        mixedContentMode="always"
        onMessage={onMessage}
        onLoadStart={() => {
          ready.current = false;
        }}
      />
      <TouchableOpacity
        style={[styles.locateButton, tracking && styles.locateButtonActive]}
        onPress={() => {
          setTracking(true);
          run('centerOnUser()');
        }}
      >
        <Text style={styles.locateIcon}>📍</Text>
      </TouchableOpacity>
      {streak.count > 0 && (
        <TouchableOpacity
          style={[styles.streakBadge, !streakAlive && styles.streakBadgeDead]}
          onLongPress={async () => {
            await saveStreakToDB(0, 0);
            setStreak({ count: 0, lastCompleted: 0 });
          }}
        >
          <Text style={styles.streakText}>
            {streakAlive ? '🔥' : '💀'} {streak.count}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
