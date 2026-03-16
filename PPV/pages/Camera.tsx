import { StatusBar } from "expo-status-bar";
import { Text, View, TouchableOpacity } from "react-native";
import {styles} from "../global";
import { CameraView, useCameraPermissions } from "expo-camera";

export default function Camera() {
  const [permission, requestPermission] = useCameraPermissions();

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

  return (
    <View style={styles.CameraContainer}>
      <CameraView style={styles.camera} />
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.captureButton}
        />
      </View>
      <StatusBar style="auto" />
    </View>
  );
}
