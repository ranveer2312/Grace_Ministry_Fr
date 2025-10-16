import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    ActivityIndicator,
    SafeAreaView,
    Dimensions, // Added for responsiveness
} from 'react-native';
import { collection, getDocs, query, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '../firebaseConfig'; // Make sure this path is correct
import { Ionicons } from '@expo/vector-icons';

// --- Responsive Sizing ---
const { width } = Dimensions.get('window');
const BASE_WIDTH = 390; // Using a standard phone width as a baseline
const scale = width / BASE_WIDTH;
const responsiveSize = (size: number) => Math.round(scale * size);

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
                // The collection name must be an exact match to your Firestore collection
                const q = query(collection(db, 'events'), orderBy('date', 'asc'));
                const querySnapshot = await getDocs(q);
                const eventsData = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                })) as Event[];
                setEvents(eventsData);
            } catch (error) {
                console.error("Error fetching events: ", error);
                // Optionally, add an alert or a state for showing an error message to the user
            } finally {
                setLoading(false);
            }
        };

        fetchEvents();
    }, []);

    // Loader state
    if (loading) {
        return (
            <View style={styles.loaderContainer}>
                <ActivityIndicator size="large" color="#FFD700" />
            </View>
        );
    }

    // Render a message if there are no events after loading is complete
    const renderEmptyComponent = () => (
        <View style={styles.emptyContainer}>
            <Ionicons name="calendar-outline" size={responsiveSize(60)} color="#555" />
            <Text style={styles.emptyText}>No Upcoming Events</Text>
            <Text style={styles.emptySubText}>Check back later for new announcements.</Text>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <FlatList
                data={events}
                keyExtractor={(item) => item.id}
                ListHeaderComponent={<Text style={styles.header}>Upcoming Events</Text>}
                ListEmptyComponent={renderEmptyComponent}
                contentContainerStyle={events.length === 0 ? styles.emptyListContainer : styles.listContainer}
                renderItem={({ item }) => {
                    // Basic validation to prevent crashes if date is invalid
                    if (!item.date || typeof item.date.toDate !== 'function') {
                        return null; // Don't render item if date is malformed
                    }
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
                                    <Ionicons name="location-outline" size={responsiveSize(16)} color="#FFD700" />
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
    listContainer: {
        paddingBottom: responsiveSize(20),
    },
    emptyListContainer: {
        flexGrow: 1, // Make sure the container can grow to fill space
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        fontSize: responsiveSize(28),
        fontWeight: '800',
        color: '#FFFFFF',
        padding: responsiveSize(20),
    },
    eventItem: {
        backgroundColor: '#1a1a1a',
        padding: responsiveSize(16),
        marginVertical: responsiveSize(8),
        marginHorizontal: responsiveSize(16),
        borderRadius: responsiveSize(14),
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 215, 0, 0.15)',
    },
    dateBadge: {
        width: responsiveSize(60),
        height: responsiveSize(60),
        borderRadius: responsiveSize(12),
        backgroundColor: '#FFD700',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: responsiveSize(16),
    },
    dateDay: {
        fontSize: responsiveSize(24),
        fontWeight: '900',
        color: '#000',
    },
    dateMonth: {
        fontSize: responsiveSize(12),
        fontWeight: '600',
        color: '#000',
        marginTop: responsiveSize(-2),
    },
    eventContent: {
        flex: 1,
    },
    eventTitle: {
        fontSize: responsiveSize(18),
        fontWeight: '700',
        color: '#FFFFFF',
        marginBottom: responsiveSize(8),
    },
    eventDetailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: responsiveSize(8),
    },
    eventDetail: {
        fontSize: responsiveSize(14),
        color: '#a0a0a0',
        marginLeft: responsiveSize(6),
    },
    eventDescription: {
        fontSize: responsiveSize(14),
        color: '#888',
        fontWeight: '300',
        lineHeight: responsiveSize(20),
    },
    emptyContainer: {
        alignItems: 'center',
        padding: responsiveSize(20),
        gap: responsiveSize(12),
    },
    emptyText: {
        fontSize: responsiveSize(20),
        fontWeight: '700',
        color: '#FFFFFF',
    },
    emptySubText: {
        fontSize: responsiveSize(14),
        color: '#888',
        textAlign: 'center',
    },
});
