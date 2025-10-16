import React, { useState, useEffect, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ActivityIndicator,
    Dimensions,
    SectionList,
    TouchableOpacity,
    Alert,
} from 'react-native';
import {
    collection,
    query,
    where,
    onSnapshot,
    orderBy,
    deleteDoc,
    doc,
    Timestamp,
} from 'firebase/firestore';
import { db } from '../firebaseConfig'; // Ensure this path is correct
import { useAuth } from '../context/AuthContext'; // Ensure this path is correct
import { PrayerRequest } from '../navigation/types'; // Ensure this path is correct
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

// --- Responsive Sizing ---
const { width } = Dimensions.get('window');
const BASE_WIDTH = 390; // Using a standard phone width as a baseline
const responsiveSize = (size: number) => Math.round((width / BASE_WIDTH) * size);

// Helper: time-ago formatter
function getTimeAgo(date?: Date): string {
    if (!date) return 'Just now';
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 30) return `${diffDays}d ago`;
    return date.toLocaleDateString();
}

// Prayer Card
const PrayerCard: React.FC<{
    item: PrayerRequest;
    index: number;
    onDelete: () => void;
}> = ({ item, index, onDelete }) => {
    const dateStr =
        item.submittedAt instanceof Timestamp
            ? item.submittedAt.toDate().toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
            })
            : 'Just now';
    const timeAgo = getTimeAgo(
        item.submittedAt instanceof Timestamp ? item.submittedAt.toDate() : undefined
    );

    return (
        <View style={styles.card}>
            <LinearGradient
                colors={['rgba(26,26,26,0.95)', 'rgba(20,20,20,0.95)']}
                style={styles.cardGradient}
            >
                <View style={styles.cardContent}>
                    <Text style={styles.cardText}>{item.request}</Text>
                    <View style={styles.cardDivider} />
                    <View style={styles.cardFooter}>
                        <View style={styles.cardFooterLeft}>
                            <Ionicons name="calendar-outline" size={responsiveSize(14)} color="#FFD700" />
                            <Text style={styles.cardDate}>{dateStr}</Text>
                        </View>
                        <View style={styles.cardFooterRight}>
                            <Ionicons name="time-outline" size={responsiveSize(12)} color="#DAA520" />
                            <Text style={styles.timeAgo}>{timeAgo}</Text>
                            {item.isPublic && (
                                <>
                                    <Ionicons name="eye" size={responsiveSize(10)} color="#FFD700" />
                                    <Text style={styles.publicText}>Public</Text>
                                </>
                            )}
                        </View>
                    </View>
                    {item.amenCount > 0 && (
                        <View style={styles.amenContainer}>
                            <Ionicons name="heart" size={responsiveSize(14)} color="#FFD700" />
                            <Text style={styles.amenText}>{item.amenCount} Amen</Text>
                        </View>
                    )}
                </View>
                <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() =>
                        Alert.alert('Delete Prayer', 'Are you sure?', [
                            { text: 'Cancel', style: 'cancel' },
                            { text: 'Delete', style: 'destructive', onPress: onDelete },
                        ])
                    }
                >
                    <Ionicons name="trash-outline" size={responsiveSize(24)} color="#DC2626" />
                </TouchableOpacity>
            </LinearGradient>
        </View>
    );
};

// Section Header
const SectionHeader: React.FC<{ title: string; count: number }> = ({ title, count }) => (
    <View style={styles.sectionHeaderContainer}>
        <LinearGradient
            colors={['rgba(255,215,0,0.15)', 'rgba(184,134,11,0.05)']}
            style={styles.sectionHeaderGradient}
        >
            <View style={styles.sectionHeaderContent}>
                <Ionicons name="calendar" size={responsiveSize(20)} color="#FFD700" />
                <Text style={styles.sectionHeaderText}>{title}</Text>
                <Text style={styles.countText}>{count}</Text>
            </View>
        </LinearGradient>
    </View>
);

// Empty State
const EmptyState: React.FC = () => (
    <View style={styles.emptyContainer}>
        <Ionicons name="book-outline" size={responsiveSize(80)} color="#FFD700" />
        <Text style={styles.emptyText}>Your Prayer Journal</Text>
        <Text style={styles.emptySubText}>
            Your personal prayers will appear here.{'\n'}Start by adding your first prayer.
        </Text>
    </View>
);

export default function PrayerJournalScreen() {
    const { user } = useAuth();
    const [prayers, setPrayers] = useState<PrayerRequest[]>([]);
    const [loading, setLoading] = useState(true);

    const sections = useMemo(() => {
        const grouped: Record<string, PrayerRequest[]> = {};
        prayers.forEach(prayer => {
            const month = prayer.submittedAt instanceof Timestamp
                ? prayer.submittedAt.toDate().toLocaleString('default', {
                    month: 'long',
                    year: 'numeric',
                })
                : 'Unknown';
            if (!grouped[month]) grouped[month] = [];
            grouped[month].push(prayer);
        });
        return Object.entries(grouped).map(([title, data]) => ({ title, data }));
    }, [prayers]);

    useEffect(() => {
        if (!user) {
            setLoading(false);
            setPrayers([]);
            return;
        }
        const q = query(
            collection(db, 'prayerRequests'),
            where('userId', '==', user.uid),
            orderBy('submittedAt', 'desc')
        );
        const unsub = onSnapshot(
            q,
            snap => {
                const fetched: PrayerRequest[] = [];
                snap.forEach(d => fetched.push({ id: d.id, ...d.data() } as PrayerRequest));
                setPrayers(fetched);
                setLoading(false);
            },
            (error) => {
                console.error("Error fetching prayers: ", error);
                setLoading(false);
            }
        );
        return () => unsub();
    }, [user]);

    const handleDelete = async (id: string) => {
        try {
            await deleteDoc(doc(db, 'prayerRequests', id));
        } catch {
            Alert.alert('Error', 'Failed to delete');
        }
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#FFD700" />
                <Text style={styles.loadingText}>Loading Your Prayers...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <SectionList
                sections={sections}
                keyExtractor={(item, i) => item.id + i}
                renderItem={({ item, index }) => (
                    <PrayerCard item={item} index={index} onDelete={() => handleDelete(item.id)} />
                )}
                renderSectionHeader={({ section: { title, data } }) => (
                    <SectionHeader title={title} count={data.length} />
                )}
                ListEmptyComponent={EmptyState}
                contentContainerStyle={sections.length === 0 ? { flex: 1 } : {}}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0A0A0A'
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#0A0A0A',
    },
    loadingText: {
        marginTop: responsiveSize(16),
        color: '#AAAAAA',
        fontSize: responsiveSize(14),
    },

    // Section Header
    sectionHeaderContainer: {
        padding: responsiveSize(8),
    },
    sectionHeaderGradient: {
        padding: responsiveSize(12),
        borderRadius: responsiveSize(8),
    },
    sectionHeaderContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: responsiveSize(8),
    },
    sectionHeaderText: {
        color: '#FFFFFF',
        fontWeight: '700',
        fontSize: responsiveSize(16),
        flex: 1,
    },
    countText: {
        color: '#FFD700',
        fontWeight: '700',
        fontSize: responsiveSize(14),
    },

    // Card
    card: {
        marginHorizontal: responsiveSize(8),
        marginVertical: responsiveSize(6),
        borderRadius: responsiveSize(12),
        overflow: 'hidden',
    },
    cardGradient: {
        padding: responsiveSize(16),
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    cardContent: {
        flex: 1,
    },
    cardText: {
        color: '#FFFFFF',
        marginBottom: responsiveSize(8),
        fontSize: responsiveSize(15),
        lineHeight: responsiveSize(22),
    },
    cardDivider: {
        height: 1,
        backgroundColor: 'rgba(255,215,0,0.15)',
        marginVertical: responsiveSize(8),
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    cardFooterLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: responsiveSize(4),
    },
    cardFooterRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: responsiveSize(4),
    },
    cardDate: {
        color: '#AAAAAA',
        fontSize: responsiveSize(12),
    },
    timeAgo: {
        color: '#DAA520',
        fontSize: responsiveSize(12),
    },
    publicText: {
        color: '#FFD700',
        fontSize: responsiveSize(10),
        fontWeight: 'bold',
    },
    amenContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: responsiveSize(4),
        marginTop: responsiveSize(8),
    },
    amenText: {
        color: '#FFD700',
        fontSize: responsiveSize(13),
        fontWeight: '600',
    },
    deleteButton: {
        padding: responsiveSize(8),
        marginLeft: responsiveSize(8),
    },

    // Empty State
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: responsiveSize(20),
    },
    emptyText: {
        color: '#FFD700',
        fontSize: responsiveSize(24),
        marginTop: responsiveSize(16),
        fontWeight: '700',
    },
    emptySubText: {
        color: '#AAAAAA',
        textAlign: 'center',
        marginTop: responsiveSize(8),
        fontSize: responsiveSize(14),
        lineHeight: responsiveSize(20),
    },
});