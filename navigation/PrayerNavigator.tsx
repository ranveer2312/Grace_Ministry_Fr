import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTheme } from '../context/ThemeContext';
import { PrayerStackParamList } from './types';

// Import the screens for this navigator
import PrayerScreen from '../screens/PrayerScreen';
import PrayerJournalScreen from '../screens/PrayerJournalScreen';
import PrayerWallScreen from '../screens/PrayerWallScreen';

const Stack = createNativeStackNavigator<PrayerStackParamList>();

export default function PrayerNavigator() {
  const { theme } = useTheme();

  return (
    <Stack.Navigator
      id="PrayerStackNavigator" // Explicitly add an ID to satisfy TypeScript
      initialRouteName="PrayerHub"
      screenOptions={{
        headerStyle: { backgroundColor: theme.card },
        headerTintColor: theme.text,
        headerTitleStyle: { fontWeight: 'bold' },
        headerBackTitleVisible: false,
      }}
    >
      <Stack.Screen
        name="PrayerHub"
        component={PrayerScreen}
        options={{ title: 'Prayer Hub' }}
      />
      <Stack.Screen
        name="PrayerJournal"
        component={PrayerJournalScreen}
        options={{ title: 'My Prayer Journal' }}
      />
      <Stack.Screen
        name="PrayerWall"
        component={PrayerWallScreen}
        options={{ title: 'Community Prayer Wall' }}
      />
    </Stack.Navigator>
  );
}

