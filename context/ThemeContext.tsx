import React, { createContext, useState, useEffect, useContext } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { useAuth } from './AuthContext';

// Define the structure of our theme object
export interface Theme {
  mode: 'light' | 'dark';
  primary: string;
  background: string;
  card: string;
  text: string;
  textSecondary: string;
  border: string;
}

// Define your specific themes
export const lightTheme: Theme = {
  mode: 'light',
  primary: '#FFD700',
  background: '#F2F2F7',
  card: '#FFFFFF',
  text: '#000000',
  textSecondary: '#6E6E73',
  border: '#E5E5EA',
};

export const darkTheme: Theme = {
  mode: 'dark',
  primary: '#FFD700',
  background: '#000000',
  card: '#1C1C1E',
  text: '#FFFFFF',
  textSecondary: '#8E8E93',
  border: '#2C2C2E',
};


interface ThemeContextType {
  theme: Theme;
  isDarkMode: boolean;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [isDarkMode, setIsDarkMode] = useState(true); // Default to dark mode

  useEffect(() => {
    const fetchThemePreference = async () => {
      if (!user) return;
      try {
        const userDocRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(userDocRef);
        const darkMode = docSnap.data()?.settings?.darkMode;
        if (typeof darkMode === 'boolean') {
          setIsDarkMode(darkMode);
        }
      } catch (error) {
        console.error('Error fetching theme preference:', error);
      }
    };
    fetchThemePreference();
  }, [user]);

  const toggleTheme = async () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    if (user) {
      try {
        const userDocRef = doc(db, 'users', user.uid);
        // Persist the user's theme preference to Firestore
        await setDoc(userDocRef, { settings: { darkMode: newTheme } }, { merge: true });
      } catch (error) {
        console.error('Failed to update theme preference:', error);
      }
    }
  };

  const theme: Theme = isDarkMode ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider value={{ theme, isDarkMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
