import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Dimensions, SectionList } from 'react-native';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { useAuth } from '../context/AuthContext';
import { PrayerRequest } from '../navigation/types';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

// Responsive scaling utility
const { width } = Dimensions.get('window');
const scale = (size: number) => (width / 375) * size;

// --- PrayerCard Component ---
const PrayerCard = ({ item }: { item: PrayerRequest }) => {
  const { theme } = useTheme();
  const date = item.submittedAt?.toDate().toLocaleDateString() || 'Just now';
  return (
    <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <Text style={[styles.cardText, { color: theme.text }]}>{item.request}</Text>
      <View style={styles.cardFooter}>
        <Ionicons name="time-outline" size={scale(14)} color={theme.textSecondary} />
        <Text style={[styles.cardDate, { color: theme.textSecondary }]}>{date}</Text>
      </View>
    </View>
  );
};

// --- Main Screen Component ---
export default function PrayerJournalScreen() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [prayers, setPrayers] = useState<PrayerRequest[]>([]);
  const [loading, setLoading] = useState(true);

  // Group prayers by month
  const sections = useMemo(() => {
    const grouped = prayers.reduce((acc, prayer) => {
      const month = prayer.submittedAt.toDate().toLocaleString('default', { month: 'long', year: 'numeric' });
      if (!acc[month]) {
        acc[month] = [];
      }
      acc[month].push(prayer);
      return acc;
    }, {} as { [key: string]: PrayerRequest[] });

    return Object.keys(grouped).map(month => ({
      title: month,
      data: grouped[month],
    }));
  }, [prayers]);


  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'prayerRequests'),
      where('userId', '==', user.uid),
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
        console.error("Error fetching prayer journal: ", error);
        setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <LinearGradient colors={[theme.background, '#000000']} style={styles.container}>
      <SectionList
        sections={sections}
        keyExtractor={(item, index) => item.id + index}
        renderItem={({ item }) => <PrayerCard item={item} />}
        renderSectionHeader={({ section: { title } }) => (
          <Text style={[styles.sectionHeader, { color: theme.primary }]}>{title}</Text>
        )}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={() => (
          <View style={styles.centered}>
            <Ionicons name="document-text-outline" size={scale(60)} color={theme.textSecondary} />
            <Text style={[styles.emptyText, { color: theme.text }]}>Your journal is empty.</Text>
            <Text style={[styles.emptySubText, { color: theme.textSecondary }]}>
              Prayers you submit will appear here.
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
  listContent: { paddingHorizontal: scale(16), paddingBottom: scale(32) },
  sectionHeader: {
    fontSize: scale(16),
    fontWeight: '700',
    paddingVertical: scale(16),
    paddingHorizontal: scale(4),
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
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
    marginBottom: scale(12),
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(6),
  },
  cardDate: {
    fontSize: scale(12),
  },
});

