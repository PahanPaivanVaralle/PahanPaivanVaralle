import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  TouchableOpacity,
  Text,
  ActivityIndicator,
  Alert,
} from "react-native";
import { WebView, WebViewMessageEvent } from "react-native-webview";
import * as Location from "expo-location";
import * as ImagePicker from "expo-image-picker";
import { useFocusEffect } from "@react-navigation/native";
import { pb } from "../lib/pocketbase";
import { styles } from "../global";

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

const LEAFLET_HTML = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script type="module" src="https://unpkg.com/ionicons@7.4.0/dist/ionicons/ionicons.esm.js"></script>
  <script nomodule src="https://unpkg.com/ionicons@7.4.0/dist/ionicons/ionicons.js"></script>
  <style>
    html, body, #map { height: 100%; margin: 0; padding: 0; }
    .photo-popup { min-width: 280px; }
    .photo-gallery { display: flex; flex-direction: column; gap: 10px; max-height: 400px; overflow-y: auto; }
    .photo-gallery img { width: 260px; max-height: 260px; object-fit: cover; border-radius: 10px; display: block; }
    .photo-count { background:#3388ff; color:#fff; border-radius:50%; width:20px; height:20px; display:flex; align-items:center; justify-content:center; font-size:11px; font-weight:bold; position:absolute; top:-4px; right:-4px; pointer-events:none; }
    .marker-wrap { position:relative; width:36px; height:36px; }
    .like-btn { background:none; border:1px solid #e0aab0; cursor:pointer; font-size:13px; color:#c0392b; padding:3px 10px; border-radius:12px; margin-top:6px; display:inline-block; }
    .photo-entry { display:flex; flex-direction:column; align-items:flex-start; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    const map = L.map('map').setView([64.5, 26.0], 5);
    L.tileLayer('https://api.maptiler.com/maps/streets/256/{z}/{x}/{y}.png?key=O5UEYayzmhespubk3jjK', {
      maxZoom: 19,
    }).addTo(map);

    const gpsMarker = L.circleMarker([64.5, 26.0], {
      radius: 10,
      color: '#fff',
      fillColor: '#3388ff',
      fillOpacity: 1,
      weight: 3
    }).addTo(map).bindPopup("Sijaintisi");

    const clusters = {};
    const taskMarkers = {};

    const clusterKey = (lat, lon) =>
      parseFloat(lat).toFixed(5) + ',' + parseFloat(lon).toFixed(5);

    const sendLike = (markerId) => {
      window.ReactNativeWebView && window.ReactNativeWebView.postMessage('like:' + markerId);
    };

    const buildPhotoEntryHTML = (entry) =>
      '<img src="' + entry.imageUrl + '" />' +
      '<button class="like-btn" onclick="sendLike(\\'' + entry.markerId + '\\')">\u2764\ufe0f ' + entry.likes + '</button>';

    const buildPopupHTML = (entries) => {
      const count = entries.length > 1
        ? '<div style="font-size:12px;color:#666;margin-bottom:6px;">' + entries.length + ' kuvaa</div>'
        : '';
      const items = entries.map(e => '<div class="photo-entry">' + buildPhotoEntryHTML(e) + '</div>').join('');
      return '<div class="photo-popup"><div class="photo-gallery">' + count + items + '</div></div>';
    };

    const buildTaskPopupHTML = (title, desc, imageUrl, markerId, likes) => {
      let html = '<b>' + title + '</b>';
      if (desc) html += '<br><span style="font-size:13px;color:#555;">' + desc + '</span>';
      if (imageUrl) html += '<br><img src="' + imageUrl + '" style="width:200px;max-height:200px;object-fit:cover;border-radius:8px;margin-top:8px;" />';
      html += '<br><button class="like-btn" onclick="sendLike(\\'' + markerId + '\\')">\u2764\ufe0f ' + likes + '</button>';
      return html;
    };

    const makeIcon = (count) => {
      const badge = count > 1 ? '<div class="photo-count">' + count + '</div>' : '';
      return L.divIcon({
        html: '<div class="marker-wrap"><div style="background:#fff;border-radius:50%;width:36px;height:36px;display:flex;align-items:center;justify-content:center;font-size:18px;box-shadow:0 2px 6px rgba(0,0,0,0.35);">📷</div>' + badge + '</div>',
        iconSize: [36, 36],
        iconAnchor: [18, 36],
        popupAnchor: [0, -38],
        className: ''
      });
    };

    const makeTaskIcon = (iconName, color) => L.divIcon({
      html: '<div style="background:' + (color || '#fff') + ';border-radius:50%;width:36px;height:36px;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 6px rgba(0,0,0,0.35);"><ion-icon name="' + iconName + '" style="font-size:20px;color:#fff;"></ion-icon></div>',
      iconSize: [36, 36],
      iconAnchor: [18, 36],
      popupAnchor: [0, -38],
      className: ''
    });

    const addTaskMarker = (lat, lon, title, iconName, color, desc, imageUrl, markerId, likes) => {
      const marker = L.marker([lat, lon], { icon: makeTaskIcon(iconName || 'location', color || '#3388ff') })
        .addTo(map)
        .bindPopup(buildTaskPopupHTML(title, desc, imageUrl, markerId, likes), { maxWidth: 240 });
      taskMarkers[markerId] = { marker, title, desc, imageUrl, likes };
    };

    const addPhotoToCluster = (lat, lon, imageUrl, markerId, likes) => {
      const key = clusterKey(lat, lon);
      const entry = { imageUrl, markerId, likes };
      if (clusters[key]) {
        clusters[key].entries.push(entry);
        clusters[key].marker.setIcon(makeIcon(clusters[key].entries.length));
        clusters[key].marker.setPopupContent(buildPopupHTML(clusters[key].entries));
      } else {
        const marker = L.marker([lat, lon], { icon: makeIcon(1) })
          .addTo(map)
          .bindPopup(buildPopupHTML([entry]), { maxWidth: 300 });
        clusters[key] = { marker, entries: [entry] };
      }
    };

    const clearMarkers = () => {
      Object.values(clusters).forEach(c => map.removeLayer(c.marker));
      Object.keys(clusters).forEach(k => delete clusters[k]);
      Object.values(taskMarkers).forEach(m => map.removeLayer(m.marker));
      Object.keys(taskMarkers).forEach(k => delete taskMarkers[k]);
    };

    const updateLikes = (markerId, newCount) => {
      if (taskMarkers[markerId]) {
        const m = taskMarkers[markerId];
        m.likes = newCount;
        m.marker.setPopupContent(buildTaskPopupHTML(m.title, m.desc, m.imageUrl, markerId, newCount));
        return;
      }
      for (const key in clusters) {
        const entry = clusters[key].entries.find(e => e.markerId === markerId);
        if (entry) {
          entry.likes = newCount;
          clusters[key].marker.setPopupContent(buildPopupHTML(clusters[key].entries));
          return;
        }
      }
    };

    let firstLocation = true;
    let tracking = false;

    const updateLocation = (lat, lon) => {
      gpsMarker.setLatLng([lat, lon]);
      if (firstLocation) {
        map.setView([lat, lon], 15);
        firstLocation = false;
      } else if (tracking) {
        map.panTo([lat, lon]);
      }
    }

    const centerOnUser = () => {
      tracking = true;
      map.setView(gpsMarker.getLatLng(), 16);
    };

    map.on('dragstart', () => {
      if (tracking) {
        tracking = false;
        window.ReactNativeWebView && window.ReactNativeWebView.postMessage('unlock');
      }
    });

    window.mapReady = true;

    const notifyReady = () => {
      if (window.ReactNativeWebView && window.mapReady) {
        window.ReactNativeWebView.postMessage('ready');
      } else {
        setTimeout(notifyReady, 50);
      }
    };
    setTimeout(notifyReady, 0);
  </script>
</body>
</html>
`;

export default function MapPage() {
  const webViewRef = useRef<WebView>(null);
  const locationRef = useRef<Location.LocationObject | null>(null);
  const likedMarkers = useRef<Set<string>>(new Set());
  const isMapReady = useRef(false);
  const [uploading, setUploading] = useState(false);
  const [tracking, setTracking] = useState(false);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return;

      Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation,
          distanceInterval: 1,
          timeInterval: 1000,
        },
        (loc) => {
          locationRef.current = loc;
          webViewRef.current?.injectJavaScript(
            `updateLocation(${loc.coords.latitude}, ${loc.coords.longitude}); true;`,
          );
        },
      );
    })();
  }, []);

  const loadMarkers = async () => {
    try {
      const result = await pb
        .collection("map_markers")
        .getList<MapMarkerRecord>(1, 500, {
          sort: "-created",
          expand: "image",
        });
      result.items.forEach((record) => {
        const imageRecord = record.expand?.image;
        if (record.title) {
          // Tehtävämarkkeri — kuva näytetään popupissa ikonin lisäksi
          const icon = record.icon || "location";
          const color = record.color || "#3388ff";
          const desc = record.desc || "";
          const imageUrl = imageRecord
            ? pb.files.getURL(imageRecord, imageRecord.image)
            : "";
          webViewRef.current?.injectJavaScript(
            `addTaskMarker(${record.lang}, ${record.long}, ${JSON.stringify(record.title)}, ${JSON.stringify(icon)}, ${JSON.stringify(color)}, ${JSON.stringify(desc)}, ${JSON.stringify(imageUrl)}, ${JSON.stringify(record.id)}, ${record.likes ?? 0}); true;`,
          );
        } else if (imageRecord) {
          // Valokuvamarkkeri
          const imageUrl = pb.files.getURL(imageRecord, imageRecord.image);
          webViewRef.current?.injectJavaScript(
            `addPhotoToCluster(${record.lang}, ${record.long}, ${JSON.stringify(imageUrl)}, ${JSON.stringify(record.id)}, ${record.likes ?? 0}); true;`,
          );
        }
      });
    } catch (e) {
      console.error("Markkereiden lataus epäonnistui:", e);
    }
  };

  const handleWebViewMessage = (event: WebViewMessageEvent) => {
    const data = event.nativeEvent.data;
    if (data === "ready") {
      isMapReady.current = true;
      loadMarkers();
    } else if (data === "unlock") {
      setTracking(false);
    } else if (data.startsWith("like:")) {
      const markerId = data.slice(5);
      if (likedMarkers.current.has(markerId)) return;
      likedMarkers.current.add(markerId);
      pb.collection("map_markers")
        .getOne(markerId)
        .then((record) => {
          const newLikes = ((record.likes as number) ?? 0) + 1;
          return pb
            .collection("map_markers")
            .update(markerId, { likes: newLikes })
            .then(() => newLikes);
        })
        .then((newLikes) => {
          webViewRef.current?.injectJavaScript(
            `updateLikes(${JSON.stringify(markerId)}, ${newLikes}); true;`,
          );
        })
        .catch((e) => {
          likedMarkers.current.delete(markerId);
          console.error("Tykkäys epäonnistui:", e);
        });
    }
  };

  useFocusEffect(
    useCallback(() => {
      if (!isMapReady.current) return;
      webViewRef.current?.injectJavaScript("clearMarkers(); true;");
      loadMarkers();
    }, []),
  );

  const uploadPhoto = async (uri: string) => {
    if (!locationRef.current) {
      Alert.alert("Sijainti puuttuu", "Odota hetki kunnes sijainti on saatu.");
      return;
    }

    setUploading(true);
    try {
      const { latitude, longitude } = locationRef.current.coords;

      const imageFormData = new FormData();
      imageFormData.append("image", {
        uri,
        name: "photo.jpg",
        type: "image/jpeg",
      } as any);
      const imageRecord = await pb
        .collection<ImageRecord>("images")
        .create(imageFormData);

      const markerRecord = await pb.collection("map_markers").create({
        lang: latitude,
        long: longitude,
        image: imageRecord.id,
      });

      const imageUrl = pb.files.getURL(imageRecord, imageRecord.image);
      webViewRef.current?.injectJavaScript(
        `addPhotoToCluster(${latitude}, ${longitude}, ${JSON.stringify(imageUrl)}, ${JSON.stringify(markerRecord.id)}, 0); true;`,
      );
    } catch (e) {
      Alert.alert("Virhe", "Kuvan tallennus epäonnistui. Tarkista yhteys.");
      console.error(e);
    } finally {
      setUploading(false);
    }
  };

  const takePhoto = async () => {
    Alert.alert("Lisää kuva", "Valitse lähde", [
      {
        text: "Kamera",
        onPress: async () => {
          const { status } = await ImagePicker.requestCameraPermissionsAsync();
          if (status !== "granted") {
            Alert.alert(
              "Lupa vaaditaan",
              "Anna sovellukselle kameralupa asetuksista.",
            );
            return;
          }
          const result = await ImagePicker.launchCameraAsync({
            mediaTypes: ["images"],
            quality: 0.7,
          });
          if (!result.canceled) await uploadPhoto(result.assets[0].uri);
        },
      },
      {
        text: "Galleria",
        onPress: async () => {
          const { status } =
            await ImagePicker.requestMediaLibraryPermissionsAsync();
          if (status !== "granted") {
            Alert.alert(
              "Lupa vaaditaan",
              "Anna sovellukselle gallerian käyttölupa asetuksista.",
            );
            return;
          }
          const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ["images"],
            quality: 0.7,
          });
          if (!result.canceled) await uploadPhoto(result.assets[0].uri);
        },
      },
      { text: "Peruuta", style: "cancel" },
    ]);
  };

  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        source={{ html: LEAFLET_HTML, baseUrl: "https://unpkg.com" }}
        style={styles.map}
        originWhitelist={["*"]}
        mixedContentMode="always"
        onMessage={handleWebViewMessage}
      />
      <TouchableOpacity
        style={[styles.locateButton, tracking && styles.locateButtonActive]}
        onPress={() => {
          setTracking(true);
          webViewRef.current?.injectJavaScript("centerOnUser(); true;");
        }}
      >
        <Text style={styles.locateIcon}>📍</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.cameraButton, uploading && styles.cameraButtonDisabled]}
        onPress={takePhoto}
        disabled={uploading}
      >
        {uploading ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <Text style={styles.cameraIcon}>📷</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}
