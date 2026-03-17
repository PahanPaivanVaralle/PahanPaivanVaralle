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

    const clusterKey = (lat, lon) =>
      parseFloat(lat).toFixed(5) + ',' + parseFloat(lon).toFixed(5);

    const buildPopupHTML = (images) => {
      const imgs = images.map(url => '<img src="' + url + '" />').join('');
      const count = images.length > 1
        ? '<div style="font-size:12px;color:#666;margin-bottom:6px;">' + images.length + ' kuvaa</div>'
        : '';
      return '<div class="photo-popup"><div class="photo-gallery">' + count + imgs + '</div></div>';
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

    const addTaskMarker = (lat, lon, title, iconName, color, desc, imageUrl) => {
      let popupContent = '<b>' + title + '</b>';
      if (desc) popupContent += '<br><span style="font-size:13px;color:#555;">' + desc + '</span>';
      if (imageUrl) popupContent += '<br><img src="' + imageUrl + '" style="width:200px;max-height:200px;object-fit:cover;border-radius:8px;margin-top:8px;" />';
      L.marker([lat, lon], { icon: makeTaskIcon(iconName || 'location', color || '#3388ff') })
        .addTo(map)
        .bindPopup(popupContent, { maxWidth: 240 });
    };

    const addPhotoToCluster = (lat, lon, imageUrl) => {
      const key = clusterKey(lat, lon);
      if (clusters[key]) {
        clusters[key].images.push(imageUrl);
        clusters[key].marker.setIcon(makeIcon(clusters[key].images.length));
        clusters[key].marker.setPopupContent(buildPopupHTML(clusters[key].images));
      } else {
        const marker = L.marker([lat, lon], { icon: makeIcon(1) })
          .addTo(map)
          .bindPopup(buildPopupHTML([imageUrl]), { maxWidth: 300 });
        clusters[key] = { marker, images: [imageUrl] };
      }
    };

    const clearMarkers = () => {
      Object.values(clusters).forEach(c => map.removeLayer(c.marker));
      Object.keys(clusters).forEach(k => delete clusters[k]);
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
      map.setView(gpsMarker.getLatLng(), map.getZoom());
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
            `addTaskMarker(${record.lang}, ${record.long}, ${JSON.stringify(record.title)}, ${JSON.stringify(icon)}, ${JSON.stringify(color)}, ${JSON.stringify(desc)}, ${JSON.stringify(imageUrl)}); true;`,
          );
        } else if (imageRecord) {
          // Valokuvamarkkeri
          const imageUrl = pb.files.getURL(imageRecord, imageRecord.image);
          webViewRef.current?.injectJavaScript(
            `addPhotoToCluster(${record.lang}, ${record.long}, "${imageUrl}"); true;`,
          );
        }
      });
    } catch (e) {
      console.error("Markkereiden lataus epäonnistui:", e);
    }
  };

  const handleWebViewMessage = (event: WebViewMessageEvent) => {
    if (event.nativeEvent.data === "ready") {
      loadMarkers();
    } else if (event.nativeEvent.data === "unlock") {
      setTracking(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
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

      await pb.collection("map_markers").create({
        lang: latitude,
        long: longitude,
        image: imageRecord.id,
      });

      const imageUrl = pb.files.getURL(imageRecord, imageRecord.image);
      webViewRef.current?.injectJavaScript(
        `addPhotoToCluster(${latitude}, ${longitude}, "${imageUrl}"); true;`,
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
