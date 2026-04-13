import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useFonts } from 'expo-font';
import BottomBar from './components/navbar';
import { Appearance, View, Text } from 'react-native';
import { useEffect, useState } from 'react';
import { ThemeProvider, useTheme } from './lib/ThemeContext';
import { Login, pb, getUserID } from './lib/pocketbase';

const Stack = createNativeStackNavigator();

const MyTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: 'transparent',
  },
};

function RootStack() {
  const [loaded, error] = useFonts({
    'Capriola-Regular': require('./assets/fonts/Capriola-Regular.ttf'),
    'Jua-Regular': require('./assets/fonts/Jua-Regular.ttf'),
  });

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

function BlockedScreen() {
  const { theme } = useTheme();
  return (
    <LinearGradient colors={theme.gradient} style={{ flex: 1 }}>
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Text style={{ color: 'black', fontSize: 20, fontWeight: 'bold' }}>
          YOU HAVE BEEN BANNED
        </Text>
      </View>
    </LinearGradient>
  );
}

export default function App() {
  const [banned, setBanned] = useState<boolean | null>(null);

  useEffect(() => {
    Appearance.setColorScheme('dark');

    const init = async () => {
      await Login();
      const id = await getUserID();
      if (!id) {
        setBanned(false);
        return;
      }

      try {
        const user = await pb
          .collection('users')
          .getFirstListItem(`userid = "${id}"`);
        setBanned(user.blocked === true);
      } catch {
        setBanned(false);
      }
    };

    init();
  }, []);

  if (banned) return <BlockedScreen />;

  return (
    <ThemeProvider>
      <ThemedApp />
    </ThemeProvider>
  );
}
