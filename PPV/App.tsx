import {createNativeStackNavigator} from "@react-navigation/native-stack";
import {DefaultTheme, NavigationContainer} from "@react-navigation/native";
import Home from "./pages/home";
import NavBar from "./components/navbar";
import {StyleSheet, View} from "react-native";

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
      <NavBar>
      <Stack.Navigator>
        <Stack.Screen name="Home" component={Home} />
      </Stack.Navigator>
      </NavBar>
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
