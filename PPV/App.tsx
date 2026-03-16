import {createNativeStackNavigator} from "@react-navigation/native-stack";
import {DefaultTheme, NavigationContainer} from "@react-navigation/native";
import {styles} from "./global";
import NavBar from "./components/navbar";

const Stack = createNativeStackNavigator();

const MyTheme = {
    ...DefaultTheme,
    colors: {
        ...DefaultTheme.colors,
        background: styles.background.backgroundColor,
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