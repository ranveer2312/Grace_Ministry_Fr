import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { collection, getDocs, query, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { Ionicons } from '@expo/vector-icons';

// Interface for event data
interface Event {
  id: string;
  title: string;
  date: Timestamp;
  location: string;
  description: string;
}

export default function EventsScreen() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const q = query(collection(db, 'events'), orderBy('date', 'asc'));
        const querySnapshot = await getDocs(q);
        const eventsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Event[];
        setEvents(eventsData);
      } catch (error) {
        console.error("Error fetching events: ", error);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  if (loading) {
    return (
        <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color="#FFD700" />
        </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={events}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={<Text style={styles.header}>Upcoming Events</Text>}
        contentContainerStyle={{ paddingBottom: 20 }}
        renderItem={({ item }) => {
            const eventDate = item.date.toDate();
            const day = eventDate.getDate();
            const month = eventDate.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
            return (
                <View style={styles.eventItem}>
                    <View style={styles.dateBadge}>
                        <Text style={styles.dateDay}>{day}</Text>
                        <Text style={styles.dateMonth}>{month}</Text>
                    </View>
                    <View style={styles.eventContent}>
                        <Text style={styles.eventTitle}>{item.title}</Text>
                        <View style={styles.eventDetailRow}>
                            <Ionicons name="location-outline" size={16} color="#FFD700" />
                            <Text style={styles.eventDetail}>{item.location}</Text>
                        </View>
                        <Text style={styles.eventDescription}>{item.description}</Text>
                    </View>
                </View>
            );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
  },
  header: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    padding: 20,
    paddingTop: 10, // Adjusted padding
  },
  eventItem: {
    backgroundColor: '#1a1a1a',
    padding: 16,
    marginVertical: 8,
    marginHorizontal: 16,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.15)',
  },
  dateBadge: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: '#FFD700',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  dateDay: {
    fontSize: 24,
    fontWeight: '900',
    color: '#000',
  },
  dateMonth: {
    fontSize: 12,
    fontWeight: '600',
    color: '#000',
    marginTop: -2,
  },
  eventContent: {
    flex: 1,
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  eventDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  eventDetail: {
    fontSize: 14,
    color: '#a0a0a0',
    marginLeft: 6,
  },
  eventDescription: {
    fontSize: 14,
    color: '#888',
    fontWeight: '300',
    lineHeight: 20,
  },
});