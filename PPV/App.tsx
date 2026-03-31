import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { DefaultTheme, NavigationContainer } from '@react-navigation/native';
import BottomBar from './components/navbar';
import { LinearGradient } from 'expo-linear-gradient';
import { Appearance } from 'react-native';
import { useEffect } from 'react';
import { ThemeProvider, useTheme } from './lib/ThemeContext';
import { Login } from './lib/pocketbase';

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

function ThemedApp() {
  const { theme } = useTheme();
  return (
    <NavigationContainer theme={MyTheme}>
      <LinearGradient colors={theme.gradient} style={{ flex: 1 }}>
        <RootStack />
      </LinearGradient>
    </NavigationContainer>
  );
}

export default function App() {
  useEffect(() => {
    Appearance.setColorScheme('dark');
    Login();
  }, []);

  return (
    <ThemeProvider>
      <ThemedApp />
    </ThemeProvider>
  );
}
