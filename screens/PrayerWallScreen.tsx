import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, Dimensions } from 'react-native';
import { collection, query, where, onSnapshot, orderBy, doc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { PrayerRequest } from '../navigation/types';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

// Responsive scaling utility
const { width } = Dimensions.get('window');
const scale = (size: number) => (width / 375) * size;

// --- PrayerWallCard Component ---
const PrayerWallCard = ({ item }: { item: PrayerRequest }) => {
  const { theme } = useTheme();
  const [isPressed, setIsPressed] = useState(false);

  const handleAmenPress = async () => {
    if (isPressed) return; // Prevent multiple presses
    setIsPressed(true);
    const prayerRef = doc(db, 'prayerRequests', item.id);
    try {
      await updateDoc(prayerRef, {
        amenCount: increment(1),
      });
    } catch (error) {
      console.error("Error updating amen count: ", error);
      setIsPressed(false); // Allow retry if update fails
    }
  };

  return (
    <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <Text style={[styles.cardText, { color: theme.text }]}>{item.request}</Text>
      <TouchableOpacity
        style={[
          styles.amenButton,
          { 
            backgroundColor: isPressed ? theme.primary : 'rgba(255, 215, 0, 0.1)',
            borderColor: isPressed ? theme.primary : 'rgba(255, 215, 0, 0.2)',
          }
        ]}
        onPress={handleAmenPress}
        activeOpacity={0.7}
        disabled={isPressed}
      >
        <Ionicons name="heart" size={scale(16)} color={isPressed ? (theme.mode === 'dark' ? '#000' : '#fff') : theme.primary} />
        <Text style={[styles.amenText, { color: isPressed ? (theme.mode === 'dark' ? '#000' : '#fff') : theme.primary }]}>
          Amen ({item.amenCount || 0})
        </Text>
      </TouchableOpacity>
    </View>
  );
};

// --- Main Screen Component ---
export default function PrayerWallScreen() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [prayers, setPrayers] = useState<PrayerRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, 'prayerRequests'),
      where('isPublic', '==', true),
      orderBy('submittedAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const fetchedPrayers: PrayerRequest[] = [];
      querySnapshot.forEach((doc) => {
        fetchedPrayers.push({ id: doc.id, ...doc.data() } as PrayerRequest);
      });
      setPrayers(fetchedPrayers);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching prayer wall: ", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }
  
  if (!user) {
      return (
          <View style={[styles.centered, { backgroundColor: theme.background }]}>
            <Ionicons name="lock-closed-outline" size={scale(60)} color={theme.textSecondary} />
            <Text style={[styles.emptyText, { color: theme.text }]}>Sign In Required</Text>
            <Text style={[styles.emptySubText, { color: theme.textSecondary }]}>
              You need to be signed in to view the prayer wall.
            </Text>
          </View>
      );
  }

  return (
    <LinearGradient colors={[theme.background, '#000000']} style={styles.container}>
      <FlatList
        data={prayers}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <PrayerWallCard item={item} />}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={() => (
          <View style={styles.centered}>
            <Ionicons name="people-outline" size={scale(60)} color={theme.textSecondary} />
            <Text style={[styles.emptyText, { color: theme.text }]}>The prayer wall is quiet.</Text>
            <Text style={[styles.emptySubText, { color: theme.textSecondary }]}>
              Be the first to share a public prayer.
            </Text>
          </View>
        )}
      />
    </LinearGradient>
  );
}

// --- Styles ---
const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: scale(20) },
  listContent: { padding: scale(16) },
  emptyText: { fontSize: scale(18), fontWeight: '600', marginTop: scale(16) },
  emptySubText: { fontSize: scale(14), textAlign: 'center', marginTop: scale(8) },
  card: {
    borderRadius: scale(12),
    padding: scale(16),
    marginBottom: scale(16),
    borderWidth: 1,
  },
  cardText: {
    fontSize: scale(15),
    lineHeight: scale(22),
    marginBottom: scale(16),
  },
  amenButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
    paddingVertical: scale(8),
    paddingHorizontal: scale(14),
    borderRadius: scale(20),
    gap: scale(8),
    borderWidth: 1,
  },
  amenText: {
    fontSize: scale(13),
    fontWeight: '700',
  },
});

