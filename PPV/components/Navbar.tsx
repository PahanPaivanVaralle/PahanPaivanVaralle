import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { TouchableOpacity, Text } from 'react-native';
import { useTheme } from '../lib/ThemeContext';
import Home from '../pages/Home';
import MapPage from '../pages/Map';
import Camera from '../pages/Camera';
import HappyNews from '../pages/HappyNews';
import WritePage from '../pages/WritePage';
import Settings from '../pages/Settings';

function SettingsButton() {
  const navigation = useNavigation<any>();
  return (
    <TouchableOpacity
      onPress={() => navigation.navigate('Asetukset')}
      style={{ marginRight: 8, padding: 10 }}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
    >
      <Ionicons name="settings-sharp" size={25} color="black" />
    </TouchableOpacity>
  );
}

const headerTitle = (children: string) => {
  return (
    <Text
      numberOfLines={1}
      style={{
        fontFamily: 'Capriola-Regular',
        fontSize: 18,
        textAlign: 'center',
      }}
    >
      {children}
    </Text>
  );
};

const BottomTab = createBottomTabNavigator();

export default function Navbar() {
  const { theme } = useTheme();
  return (
    <BottomTab.Navigator
      screenOptions={{
        tabBarLabel: ({ children }) => {
          return (
            <Text
              numberOfLines={2}
              style={{
                fontFamily: 'Capriola-Regular',
                fontSize: 12,
                textAlign: 'center',
              }}
            >
              {children}
            </Text>
          );
        },
        headerTitle: ({ children }) => {
          return headerTitle(children);
        },
        tabBarActiveTintColor: 'white',
        tabBarInactiveTintColor: 'black',
        headerTitleStyle: { fontFamily: 'Capriola-Regular' },
        headerTintColor: 'black',
        tabBarStyle: {
          backgroundColor: theme.tabBar,
          position: 'absolute',
          elevation: 0,
        },
        animation: 'fade',
        tabBarLabelStyle: { fontFamily: 'Capriola-Regular' },
        headerStyle: {
          backgroundColor: 'rgba(255, 255, 255, 0.2)',
          elevation: 0,
        },
        lazy: true,
        headerRight: () => <SettingsButton />,
      }}
    >
      <BottomTab.Screen
        name="Koti"
        component={Home}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-sharp" size={size} color={color} />
          ),
        }}
      />
      <BottomTab.Screen
        name="Kartta"
        component={MapPage}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="map" size={size} color={color} />
          ),
        }}
      />
      <BottomTab.Screen
        name="Kamera"
        component={Camera}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="camera" size={size} color={color} />
          ),
        }}
      />
      <BottomTab.Screen
        name="Uutiset"
        component={HappyNews}
        options={{
          headerTitle: 'Iloiset uutiset',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="happy" size={size} color={color} />
          ),
        }}
      />
      <BottomTab.Screen
        name="Kirje"
        component={WritePage}
        options={{
          headerTitle: 'Kirjoita kirje',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="reader" size={size} color={color} />
          ),
        }}
      />
      <BottomTab.Screen
        name="Asetukset"
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
