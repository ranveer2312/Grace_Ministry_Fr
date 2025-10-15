import { initializeApp } from 'firebase/app';
import { Platform } from 'react-native';

// --- Firestore Imports ---
import { getFirestore } from 'firebase/firestore';

// --- Auth Imports ---
import { 
  initializeAuth, 
  indexedDBLocalPersistence 
} from 'firebase/auth';

// Your Firebase config object
const firebaseConfig = {
  apiKey: "AIzaSyDp0NKhGuZgGFxJdH4GPHJQ6qeefe3LySI",
  authDomain: "graceministryapp-2e3fc.firebaseapp.com",
  projectId: "graceministryapp-2e3fc",
  storageBucket: "graceministryapp-2e3fc.appspot.com",
  messagingSenderId: "863352480606",
  appId: "1:863352480606:web:2a28e74fcdf38d6cd325cf",
  measurementId: "G-C5D2FH2GTS"
};

// Initialize the Firebase App
const app = initializeApp(firebaseConfig);

// Initialize Firestore simply. Offline persistence is ON by default for mobile.
const db = getFirestore(app);

// Initialize Auth with Platform-Specific Persistence
let auth;

if (Platform.OS === 'web') {
  auth = initializeAuth(app, {
    persistence: indexedDBLocalPersistence,
  });
} else {
  // --- THIS LINE IS NOW CORRECTED ---
  const AsyncStorage = require('@react-native-async-storage/async-storage').default;
  const { getReactNativePersistence: getAuthPersistence } = require('firebase/auth');
  
  auth = initializeAuth(app, {
    persistence: getAuthPersistence(AsyncStorage),
  });
}

// --- Single, Clean Export ---
export { db, auth };