import { StatusBar } from "expo-status-bar";
import { Text, View, TouchableOpacity } from "react-native";
import { styles } from "../global";
import { CameraView, CameraType, useCameraPermissions } from "expo-camera";
import { useState, useRef } from "react";
import { Ionicons } from '@expo/vector-icons';

export default function Camera() {
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<CameraType>("back");
  const ref = useRef<CameraView>(null);

  if (!permission) return null;

  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Text>Kameran käyttö vaatii luvan</Text>
        <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
          <Text style={styles.permissionButtonText}>Anna lupa</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const toggleFacing = () => {
    setFacing((prev) => (prev === "back" ? "front" : "back"));
  };

  return (
    <View style={styles.CameraContainer}>
      <CameraView
      ref={ref}
      style={styles.camera} 
      facing={facing}
      />
      <View style={styles.CameraButtons}>
        <TouchableOpacity onPress={toggleFacing}>
          <Ionicons name="camera-reverse" size={64} color="white"/>
        </TouchableOpacity>
        <TouchableOpacity style={styles.captureButton}/>
        <TouchableOpacity>
          <Ionicons name="image" size={64} color="white"/>
        </TouchableOpacity>
      </View>
      <StatusBar style="auto" />
    </View>
  );
}
