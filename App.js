import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';  // Import from expo-status-bar

export default function App() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Diagnostic Test</Text>
      <Text style={styles.subtext}>If you can see this, the environment is working.</Text>
      <StatusBar style="light" />  {/* This will work correctly now */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: '#fff',
    fontSize: 32,
    fontWeight: 'bold',
  },
  subtext: {
    color: '#999',
    fontSize: 16,
    marginTop: 8,
  }
});
