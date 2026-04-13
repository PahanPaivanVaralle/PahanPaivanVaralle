import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { TouchableOpacity } from 'react-native';
import { useTheme } from '../lib/ThemeContext';
import Home from '../pages/home';
import MapPage from '../pages/map';
import Camera from '../pages/Camera';
import HappyNews from '../pages/HappyNews';
import WritePage from '../pages/WritePage';
import Settings from '../pages/Settings';

function SettingsButton() {
  const navigation = useNavigation<any>();
  return (
    <TouchableOpacity
      onPress={() => navigation.navigate('Settings')}
      style={{ marginRight: 8, padding: 10 }}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
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
        headerTitleStyle: { fontFamily: 'Capriola-Regular' },
        headerTintColor: 'black',
        tabBarStyle: {
          backgroundColor: theme.tabBar,
          position: 'absolute',
          elevation: 0,
        },
        tabBarLabelStyle: { fontFamily: 'Capriola-Regular'},
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
          title: 'Settings',
          tabBarItemStyle: { display: 'none' },
          headerRight: () => null,
          headerLeft: () => {
            const navigation = useNavigation<any>();
            return (
              <TouchableOpacity
                onPress={() => navigation.goBack()}
                style={{ marginLeft: 6, padding: 10 }}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
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
