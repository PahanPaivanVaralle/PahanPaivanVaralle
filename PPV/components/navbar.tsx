import Home from "../pages/home";
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import {styles} from "../global";
import Camera from "../pages/Camera";
import MapPage from "../pages/map";

const Tab = createBottomTabNavigator();

export default function NavBar() {
    return (
        <Tab.Navigator screenOptions={{
            tabBarActiveTintColor: "black",
            tabBarInactiveTintColor: "#E4ACEA",
        }}>
            <Tab.Screen
                name="Home"
                component={Home}
                options={{
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="home" size={size} color={color} />
                    ),
                }}
            />
            <Tab.Screen
                name="Map"
                component={MapPage}
                options={{
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="map" size={size} color={color} />
                    ),
                }}
            />
            <Tab.Screen
                name="Camera"
                component={Camera}
                options={{
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="camera" size={size} color={color} />
                    ),
                }}
            />
            <Tab.Screen
                name="Happy News"
                component={Home}
                options={{
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="happy" size={size} color={color} />
                    ),
                }}
            />
            <Tab.Screen
                name="Comments"
                component={Home}
                options={{
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="people" size={size} color={color} />
                    ),
                }}
            />
        </Tab.Navigator>
    );
}