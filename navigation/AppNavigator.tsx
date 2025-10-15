import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Dimensions } from 'react-native';

// Import all screens
import HomeScreen from '../screens/HomeScreen';
import SermonsScreen from '../screens/SermonsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import ContactScreen from '../screens/ContactScreen';
import EventsScreen from '../screens/EventsScreen';
import FavoritesScreen from '../screens/FavoritesScreen';
import SettingsScreen from '../screens/SettingsScreen';
import PrayerNavigator from './PrayerNavigator';
import BibleVerseScreen from '../screens/BibleVerseScreen';

// Type definitions for our navigators
export type MainTabParamList = {
  Home: undefined;
  Sermons: undefined;
  Prayer: undefined;
  Bible: undefined;
  Profile: undefined;
};

export type RootStackParamList = {
  MainTabs: { screen?: keyof MainTabParamList };
  Contact: undefined;
  Events: undefined;
  Favorites: undefined;
  Settings: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();
const Stack = createNativeStackNavigator<RootStackParamList>();

// --- COMPONENT 1: The Bottom Tab Navigator ---
function MainTabNavigator() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { width } = Dimensions.get('window');
  const scale = (size: number) => (width / 375) * size;

  return (
    <Tab.Navigator
      id="MainBottomTab" // Explicitly add an ID to satisfy TypeScript
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.textSecondary,
        tabBarStyle: {
          backgroundColor: theme.card,
          borderTopColor: theme.border,
          height: scale(50) + insets.bottom, // Dynamically adjust height
          paddingBottom: insets.bottom > 0 ? insets.bottom / 2 : scale(5),
        },
        tabBarLabelStyle: {
          fontSize: scale(11),
          fontWeight: '500',
          marginTop: -scale(5),
        },
        tabBarIconStyle: {
            marginBottom: -scale(2)
        }
      }}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ tabBarIcon: ({ color, size }) => <Ionicons name="home-outline" size={scale(size)} color={color} /> }} />
      <Tab.Screen name="Sermons" component={SermonsScreen} options={{ tabBarIcon: ({ color, size }) => <Ionicons name="videocam-outline" size={scale(size)} color={color} /> }} />
      <Tab.Screen name="Prayer" component={PrayerNavigator} options={{ tabBarIcon: ({ color, size }) => <Ionicons name="hand-left-outline" size={scale(size)} color={color} /> }} />
      <Tab.Screen name="Bible" component={BibleVerseScreen} options={{ tabBarIcon: ({ color, size }) => <Ionicons name="book-outline" size={scale(size)} color={color} /> }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ tabBarIcon: ({ color, size }) => <Ionicons name="person-outline" size={scale(size)} color={color} /> }} />
    </Tab.Navigator>
  );
}

// --- COMPONENT 2: The Main App Navigator ---
export default function AppNavigator() {
  const { theme } = useTheme();
  return (
    <Stack.Navigator
      id="RootAppStack" // Explicitly add an ID to satisfy TypeScript
      screenOptions={{
        headerStyle: { backgroundColor: theme.card },
        headerTintColor: theme.text,
        headerTitleStyle: { fontWeight: 'bold' },
        headerBackTitleVisible: false,
      }}
    >
      <Stack.Screen
        name="MainTabs"
        component={MainTabNavigator}
        options={{ headerShown: false }}
      />
      <Stack.Screen name="Contact" component={ContactScreen} options={{ title: 'Get in Touch' }} />
      <Stack.Screen name="Events" component={EventsScreen} options={{ title: 'Upcoming Events' }} />
      <Stack.Screen name="Favorites" component={FavoritesScreen} options={{ title: 'My Favorites' }} />
      <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: 'Settings' }} />
    </Stack.Navigator>
  );
}

