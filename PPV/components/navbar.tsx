import Home from '../pages/home';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import Camera from '../pages/Camera';
import MapPage from '../pages/map';
import HappyNews from '../pages/HappyNews';
import WritePage from '../pages/WritePage';
import Settings from '../pages/Settings';
import { TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../lib/ThemeContext';

function SettingsButton() {
  const navigation = useNavigation<any>();
  return (
    <TouchableOpacity
      onPress={() => navigation.navigate('Settings')}
      style={{ marginRight: 15 }}
    >
      <Ionicons name="settings-sharp" size={25} color="black" />
    </TouchableOpacity>
  );
}

const BottomTab = createBottomTabNavigator();

export default function NavBar() {
  const { theme } = useTheme();
  return (
    <BottomTab.Navigator
      screenOptions={{
        tabBarActiveTintColor: 'white',
        tabBarInactiveTintColor: 'black',
        headerTintColor: 'black',
        tabBarStyle: {
          backgroundColor: theme.tabBar,
          position: 'absolute',
          elevation: 0,
        },
        headerStyle: {
          backgroundColor: 'rgba(255, 255, 255, 0.2)',
          elevation: 0,
        },
        lazy: true,
        headerRight: () => <SettingsButton />,
      }}
    >
      <BottomTab.Screen
        name="Home"
        component={Home}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-sharp" size={size} color={color} />
          ),
        }}
      />
      <BottomTab.Screen
        name="Map"
        component={MapPage}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="map" size={size} color={color} />
          ),
        }}
      />
      <BottomTab.Screen
        name="Camera"
        component={Camera}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="camera" size={size} color={color} />
          ),
        }}
      />
      <BottomTab.Screen
        name="Happy News"
        component={HappyNews}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="happy" size={size} color={color} />
          ),
        }}
      />
      <BottomTab.Screen
        name="Write a letter"
        component={WritePage}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="reader" size={size} color={color} />
          ),
        }}
      />
      <BottomTab.Screen
        name="Settings"
        component={Settings}
        options={{
          title: 'Asetukset',
          tabBarItemStyle: { display: 'none' },
          headerRight: () => null,
          headerLeft: () => {
            const navigation = useNavigation<any>();
            return (
              <TouchableOpacity
                onPress={() => navigation.goBack()}
                style={{ marginLeft: 12 }}
              >
                <Ionicons name="chevron-back" size={26} color="black" />
              </TouchableOpacity>
            );
          },
        }}
      />
    </BottomTab.Navigator>
  );
}
