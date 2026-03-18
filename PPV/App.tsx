import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { DefaultTheme, NavigationContainer } from '@react-navigation/native';
import BottomBar from './components/navbar';
import { LinearGradient } from 'expo-linear-gradient';
import { Appearance } from 'react-native';
import { useEffect } from 'react';

const Stack = createNativeStackNavigator();

const MyTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: 'transparent',
  },
};

function RootStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        freezeOnBlur: true,
      }}
    >
      <Stack.Screen name="Tabs" component={BottomBar} />
    </Stack.Navigator>
  );
}

export default function App() {
  useEffect(() => {
    Appearance.setColorScheme('dark');
  }, []);

  return (
    <NavigationContainer theme={MyTheme}>
      <LinearGradient
        colors={['rgba(181, 218, 206, 1)', 'rgba(236, 192, 209, 1)']}
        style={{ flex: 1 }}
      >
        <RootStack />
      </LinearGradient>
    </NavigationContainer>
  );
}
