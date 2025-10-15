import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { onAuthStateChanged, User, signOut } from 'firebase/auth';
import { auth } from '../firebaseConfig'; // Make sure this path is correct

// 1. DEFINE THE TYPE FOR YOUR CONTEXT
// We are telling TypeScript that our context will provide a 'user' object
// and a 'logout' function.
interface AuthContextType {
  user: User | null;
  logout: () => Promise<void>; // This is the missing piece
  loading: boolean;
}

// Create the context with a default value
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Create a provider component
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  // 2. CREATE THE LOGOUT FUNCTION
  // This function will call Firebase's signOut method.
  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error signing out: ", error);
      // You might want to throw the error or handle it as needed
      throw error;
    }
  };

  // 3. PROVIDE THE LOGOUT FUNCTION IN THE CONTEXT VALUE
  const value = {
    user,
    logout, // Add the logout function here
    loading,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

// Create a custom hook to use the auth context easily
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
