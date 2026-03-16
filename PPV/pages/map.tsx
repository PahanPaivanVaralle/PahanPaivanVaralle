import React, { useEffect, useRef } from "react";
import { View } from "react-native";
import {styles} from "../global";
import { WebView } from "react-native-webview";
import * as Location from "expo-location";

const getLeafletHTML = (lat: number, lon: number) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    html, body, #map { height: 100%; margin: 0; padding: 0; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    var map = L.map('map').setView([${lat}, ${lon}], 15);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap'
    }).addTo(map);

    var gpsMarker = L.circleMarker([${lat}, ${lon}], {
      radius: 10,
      color: '#fff',
      fillColor: '#3388ff',
      fillOpacity: 1,
      weight: 3
    }).addTo(map).bindPopup("Sijaintisi");

    function updateLocation(lat, lon) {
      gpsMarker.setLatLng([lat, lon]);
      map.setView([lat, lon]);
    }
  </script>
</body>
</html>
`;

export default function MapPage() {
  const webViewRef = useRef<WebView>(null);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return;

      Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, distanceInterval: 5 },
        ({ coords }) => {
          webViewRef.current?.injectJavaScript(
            `updateLocation(${coords.latitude}, ${coords.longitude}); true;`,
          );
        },
      );
    })();
  }, []);

  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        source={{
          html: getLeafletHTML(60.1699, 24.9384),
          baseUrl: "https://unpkg.com",
        }}
        style={styles.map}
        originWhitelist={["*"]}
        mixedContentMode="always"
      />
    </View>
  );
}