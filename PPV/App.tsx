import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useFonts } from 'expo-font';
import BottomBar from './components/Navbar';
import { Appearance, View, Text, Image, Animated } from 'react-native';
import { useEffect, useRef, useState } from 'react';
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
    KiwiMaruRegular: require('./assets/fonts/KiwiMaruRegular.ttf'),
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

  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: 'black',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <Animated.Text
        style={{
          color: 'white',
          textAlign: 'center',
          fontSize: 60,
          fontWeight: 'bold',
          opacity: fadeAnim,
          scaleX: fadeAnim,
          scaleY: fadeAnim,
          zIndex: 1,
        }}
      >
        YOU ARE BANNED
      </Animated.Text>

      <Animated.Image
        style={{
          position: 'absolute',
          opacity: fadeAnim,
          scaleX: fadeAnim,
          scaleY: fadeAnim,
        }}
        source={require('./assets/ari.png')}
      />
    </View>
  );
}

export default function App() {
  const [banned, setBanned] = useState<boolean | null>(null);

  useEffect(() => {
    Appearance.setColorScheme('dark');

    let interval: any;

    const init = async () => {
      await Login();

      const checkBan = async () => {
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
      checkBan();

      interval = setInterval(() => {
        checkBan();
      }, 5000);
    };

    init();

    return () => clearInterval(interval);
  }, []);

  if (banned != null && banned) return <BlockedScreen />;
  else if (banned != null) {
    return (
      <ThemeProvider>
        <ThemedApp />
      </ThemeProvider>
    );
  }
}