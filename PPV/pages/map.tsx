import React, { useEffect, useRef, useState } from "react";
import {
  StyleSheet,
  View,
  TouchableOpacity,
  Text,
  ActivityIndicator,
  Alert,
} from "react-native";
import { WebView, WebViewMessageEvent } from "react-native-webview";
import * as Location from "expo-location";
import * as ImagePicker from "expo-image-picker";
import { pb } from "../lib/pocketbase";

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
    var map = L.map('map').setView([64.5, 26.0], 5);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap'
    }).addTo(map);

    var gpsMarker = L.circleMarker([64.5, 26.0], {
      radius: 10,
      color: '#fff',
      fillColor: '#3388ff',
      fillOpacity: 1,
      weight: 3
    }).addTo(map).bindPopup("Sijaintisi");

    // clusters: key = "lat,lon" -> { marker, images: [] }
    var clusters = {};

    function clusterKey(lat, lon) {
      return parseFloat(lat).toFixed(5) + ',' + parseFloat(lon).toFixed(5);
    }

    function buildPopupHTML(images) {
      var imgs = images.map(function(url) {
        return '<img src="' + url + '" />';
      }).join('');
      var count = images.length > 1 ? '<div style="font-size:12px;color:#666;margin-bottom:6px;">' + images.length + ' kuvaa</div>' : '';
      return '<div class="photo-popup"><div class="photo-gallery">' + count + imgs + '</div></div>';
    }

    function makeIcon(count) {
      var badge = count > 1
        ? '<div class="photo-count">' + count + '</div>'
        : '';
      return L.divIcon({
        html: '<div class="marker-wrap"><div style="background:#fff;border-radius:50%;width:36px;height:36px;display:flex;align-items:center;justify-content:center;font-size:18px;box-shadow:0 2px 6px rgba(0,0,0,0.35);">📷</div>' + badge + '</div>',
        iconSize: [36, 36],
        iconAnchor: [18, 36],
        popupAnchor: [0, -38],
        className: ''
      });
    }

    function makeTaskIcon(iconName, color) {
      return L.divIcon({
        html: '<div style="background:' + (color || '#fff') + ';border-radius:50%;width:36px;height:36px;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 6px rgba(0,0,0,0.35);"><ion-icon name="' + iconName + '" style="font-size:20px;color:#fff;"></ion-icon></div>',
        iconSize: [36, 36],
        iconAnchor: [18, 36],
        popupAnchor: [0, -38],
        className: ''
      });
    }

    function addTaskMarker(lat, lon, title, iconName, color, desc) {
      var popupContent = '<b>' + title + '</b>';
      if (desc) popupContent += '<br><span style="font-size:13px;color:#555;">' + desc + '</span>';
      L.marker([lat, lon], { icon: makeTaskIcon(iconName || 'location', color || '#3388ff') })
        .addTo(map)
        .bindPopup(popupContent);
    }

    function addPhotoToCluster(lat, lon, imageUrl) {
      var key = clusterKey(lat, lon);
      if (clusters[key]) {
        clusters[key].images.push(imageUrl);
        clusters[key].marker.setIcon(makeIcon(clusters[key].images.length));
        clusters[key].marker.setPopupContent(buildPopupHTML(clusters[key].images));
      } else {
        var marker = L.marker([lat, lon], { icon: makeIcon(1) })
          .addTo(map)
          .bindPopup(buildPopupHTML([imageUrl]), { maxWidth: 300 });
        clusters[key] = { marker: marker, images: [imageUrl] };
      }
    }

    var firstLocation = true;

    function updateLocation(lat, lon) {
      gpsMarker.setLatLng([lat, lon]);
      if (firstLocation) {
        map.setView([lat, lon], 15);
        firstLocation = false;
      }
    }

    function centerOnUser() {
      map.setView(gpsMarker.getLatLng(), map.getZoom());
    }

    // Merkitään kartta valmiiksi vasta kun Leaflet on täysin alustettu
    window.mapReady = true;

    function notifyReady() {
      if (window.ReactNativeWebView && window.mapReady) {
        window.ReactNativeWebView.postMessage('ready');
      } else {
        setTimeout(notifyReady, 50);
      }
    }
    setTimeout(notifyReady, 0);
  </script>
</body>
</html>
`;

export default function MapPage() {
  const webViewRef = useRef<WebView>(null);
  const locationRef = useRef<Location.LocationObject | null>(null);
  const [uploading, setUploading] = useState(false);

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
      console.log("Yritetään yhdistää:", pb.baseURL);
      const records = await pb.collection("map_markers").getList(1, 500, {
        sort: "-created",
        expand: "image",
      });
      console.log("Löydettiin tietueita:", records.totalItems);
      records.items.forEach((record) => {
        const imageRecord = (record.expand as any)?.image;
        if (imageRecord) {
          // Valokuvamarkkeri
          const imageUrl = pb.files.getURL(
            imageRecord,
            imageRecord["image"] as string,
          );
          webViewRef.current?.injectJavaScript(
            `addPhotoToCluster(${record["lang"]}, ${record["long"]}, "${imageUrl}"); true;`,
          );
        } else if (record["title"]) {
          // Tehtävämarkkeri — hallitaan PocketBase-adminissa
          const icon = (record["icon"] as string) || "location";
          const color = (record["color"] as string) || "#3388ff";
          const desc = (record["desc"] as string) || "";
          webViewRef.current?.injectJavaScript(
            `addTaskMarker(${record["lang"]}, ${record["long"]}, ${JSON.stringify(record["title"])}, ${JSON.stringify(icon)}, ${JSON.stringify(color)}, ${JSON.stringify(desc)}); true;`,
          );
        }
      });
    } catch (e: any) {
      console.error("Markkereiden lataus epäonnistui:", e);
      console.error("Status:", e?.status);
      console.error("Viesti:", e?.message);
    }
  };

  const handleWebViewMessage = (event: WebViewMessageEvent) => {
    if (event.nativeEvent.data === "ready") {
      loadMarkers();
    }
  };

  const takePhoto = async () => {
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

    if (result.canceled) return;

    if (!locationRef.current) {
      Alert.alert("Sijainti puuttuu", "Odota hetki kunnes sijainti on saatu.");
      return;
    }

    setUploading(true);
    try {
      const photo = result.assets[0];
      const { latitude, longitude } = locationRef.current.coords;

      // 1. Tallennetaan kuva images-collectioniin
      const imageFormData = new FormData();
      imageFormData.append("image", {
        uri: photo.uri,
        name: "photo.jpg",
        type: "image/jpeg",
      } as any);
      const imageRecord = await pb.collection("images").create(imageFormData);

      // 2. Luodaan markkeri joka viittaa kuvaan
      const markerRecord = await pb.collection("map_markers").create({
        lang: latitude,
        long: longitude,
        image: imageRecord.id,
      });

      const imageUrl = pb.files.getURL(
        imageRecord,
        imageRecord["image"] as string,
      );
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
        style={styles.locateButton}
        onPress={() =>
          webViewRef.current?.injectJavaScript("centerOnUser(); true;")
        }
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  cameraButton: {
    position: "absolute",
    bottom: 40,
    right: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#3388ff",
    alignItems: "center",
    justifyContent: "center",
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  cameraButtonDisabled: {
    backgroundColor: "#9e9e9e",
  },
  cameraIcon: {
    fontSize: 26,
  },
  locateButton: {
    position: "absolute",
    bottom: 116,
    right: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  locateIcon: {
    fontSize: 26,
  },
});
