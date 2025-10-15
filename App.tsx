import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import AppNavigator from './navigation/AppNavigator'; 

// This line initializes the connection to your Firebase backend.
import './firebaseConfig';

export default function App() {
  return (
    // AuthProvider must be on the outside, as ThemeProvider depends on it.
    <AuthProvider>
      {/* ThemeProvider wraps everything that needs access to theme information. */}
      <ThemeProvider>
        <NavigationContainer>
          <AppNavigator />
        </NavigationContainer>
      </ThemeProvider>
    </AuthProvider>
  );
}

