import {createNativeStackNavigator} from "@react-navigation/native-stack";
import {DefaultTheme, NavigationContainer} from "@react-navigation/native";
import Home from "./pages/home";
import NavBar from "./components/navbar";
import {StyleSheet, View} from "react-native";
import Camera from "./pages/Camera";

const Stack = createNativeStackNavigator();

const MyTheme = {
    ...DefaultTheme,
    colors: {
        ...DefaultTheme.colors,
        background: "#E4ACEA",
    },
};
function RootStack() {
  return (
      <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Tabs" component={NavBar} />
      </Stack.Navigator>
  );
}

export default function App() {
  return (
      <NavigationContainer theme={MyTheme}>
        <RootStack />
      </NavigationContainer>
  );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: "#E4ACEA",
    }
});
