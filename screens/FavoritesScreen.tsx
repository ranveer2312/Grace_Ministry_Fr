import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    ActivityIndicator,
    Image,
    TouchableOpacity,
    Linking,
    Alert,
    Dimensions, // Added for responsiveness
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../context/AuthContext'; // Ensure this path is correct
import { db } from '../firebaseConfig'; // Ensure this path is correct
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';

// --- Responsive Sizing ---
const { width } = Dimensions.get('window');
const BASE_WIDTH = 390; // Using a standard phone width as a baseline
const scale = width / BASE_WIDTH;
const responsiveSize = (size: number) => Math.round(scale * size);

interface FavoriteSermon {
    id: string;
    title: string;
    thumbnailUrl: string;
    videoId: string;
}

export default function FavoritesScreen({ navigation }: any) {
    const { user } = useAuth();
    const [favorites, setFavorites] = useState<FavoriteSermon[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchFavorites = async () => {
            if (!user) {
                setFavorites([]); // Clear favorites if user logs out
                setLoading(false);
                // Alert.alert("Not Signed In", "Please sign in to view your favorites."); // Optional: alert if not signed in
                return;
            }
            try {
                const favoritesCollectionRef = collection(db, "users", user.uid, "favorites");
                const q = query(favoritesCollectionRef, orderBy('savedAt', 'desc'));
                const querySnapshot = await getDocs(q);
                const favsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as FavoriteSermon[];
                setFavorites(favsData);
            } catch (error) {
                console.error("Error fetching favorites:", error);
                Alert.alert("Error", "Could not load your favorites. Please check your connection or try again.");
            } finally {
                setLoading(false);
            }
        };

        fetchFavorites();
    }, [user]); // Re-fetch favorites when user state changes

    const openVideo = async (videoId: string) => {
        const youtubeUrl = `https://www.youtube.com/watch?v=${videoId}`;
        try {
            const supported = await Linking.canOpenURL(youtubeUrl);
            if (supported) {
                await Linking.openURL(youtubeUrl);
            } else {
                Alert.alert('Error', `Cannot open this URL: ${youtubeUrl}`);
            }
        } catch (error) {
            Alert.alert('Error', 'An error occurred while trying to open the video.');
            console.error('Failed to open URL:', error);
        }
    };

    const renderFavoriteItem = ({ item }: { item: FavoriteSermon }) => (
        <TouchableOpacity
            style={styles.videoCard}
            onPress={() => openVideo(item.videoId)}
            activeOpacity={0.9}
        >
            <View style={styles.thumbnailContainer}>
                <Image source={{ uri: item.thumbnailUrl }} style={styles.thumbnail as import('react-native').ImageStyle} />
                <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.7)']}
                    style={styles.thumbnailOverlay}
                />
                <View style={styles.playIconContainer}>
                    <LinearGradient
                        colors={['#FFD700', '#FFA500']}
                        style={styles.playIconGradient}
                    >
                        <Ionicons name="play" size={responsiveSize(28)} color="#000" />
                    </LinearGradient>
                </View>
                <View style={styles.durationBadge}>
                    <Ionicons name="videocam" size={responsiveSize(14)} color="#fff" />
                    <Text style={styles.durationText}>Watch</Text>
                </View>
            </View>

            <View style={styles.contentContainer}>
                <Text style={styles.videoTitle} numberOfLines={2}>{item.title}</Text>
            </View>
        </TouchableOpacity>
    );

    return (
        <LinearGradient colors={['#000000', '#000000']} style={styles.gradient}>
            <SafeAreaView style={styles.safeArea}>
                {loading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#FFD700" />
                        <Text style={styles.loadingText}>Loading your favorites...</Text>
                    </View>
                ) : favorites.length > 0 ? (
                    <FlatList
                        data={favorites}
                        renderItem={renderFavoriteItem}
                        keyExtractor={(item) => item.id}
                        contentContainerStyle={styles.listContainer}
                        showsVerticalScrollIndicator={false}
                    />
                ) : (
                    <View style={styles.emptyContainer}>
                        <Ionicons name="heart-dislike-outline" size={responsiveSize(60)} color="#999" />
                        <Text style={styles.emptyText}>You haven't saved any favorites yet.</Text>
                        <Text style={styles.emptySubText}>Browse sermons and tap the heart to save them!</Text>
                    </View>
                )}
            </SafeAreaView>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    gradient: {
        flex: 1,
        backgroundColor: '#000000', // Ensure solid black background if gradient is subtle
    },
    safeArea: {
        flex: 1,
    },
    listContainer: {
        paddingHorizontal: responsiveSize(20),
        paddingTop: responsiveSize(20),
        paddingBottom: responsiveSize(20),
    },

    // --- Favorite Video Card (Reused from SermonsScreen concept) ---
    videoCard: {
        backgroundColor: '#1a1a1a',
        borderRadius: responsiveSize(16),
        overflow: 'hidden',
        marginBottom: responsiveSize(20),
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: responsiveSize(4) },
        shadowOpacity: 0.3,
        shadowRadius: responsiveSize(8),
    },
    thumbnailContainer: {
        width: '100%',
        height: responsiveSize(200),
        position: 'relative',
    },
    thumbnail: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    thumbnailOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: '50%',
    },
    playIconContainer: {
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: [{ translateX: responsiveSize(-32) }, { translateY: responsiveSize(-32) }],
    },
    playIconGradient: {
        width: responsiveSize(64),
        height: responsiveSize(64),
        borderRadius: responsiveSize(32),
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 8,
        shadowColor: '#FFD700',
        shadowOffset: { width: 0, height: responsiveSize(4) },
        shadowOpacity: 0.5,
        shadowRadius: responsiveSize(8),
    },
    durationBadge: {
        position: 'absolute',
        top: responsiveSize(12),
        right: responsiveSize(12),
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        paddingHorizontal: responsiveSize(10),
        paddingVertical: responsiveSize(6),
        borderRadius: responsiveSize(8),
        flexDirection: 'row',
        alignItems: 'center',
        gap: responsiveSize(4),
    },
    durationText: {
        fontSize: responsiveSize(12),
        color: '#fff',
        fontWeight: '600',
    },
    contentContainer: {
        padding: responsiveSize(16),
    },
    videoTitle: {
        fontSize: responsiveSize(17),
        fontWeight: '700',
        color: '#ffffff',
        marginBottom: 0, // No bottom margin needed here
        lineHeight: responsiveSize(24),
    },

    // --- Loading and Empty States ---
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: responsiveSize(16),
    },
    loadingText: {
        fontSize: responsiveSize(16),
        color: '#999',
        fontWeight: '500',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: responsiveSize(20),
        gap: responsiveSize(10),
    },
    emptyText: {
        color: '#FFD700',
        textAlign: 'center',
        fontSize: responsiveSize(20),
        fontWeight: '600',
        marginTop: responsiveSize(20),
    },
    emptySubText: {
        color: '#999',
        textAlign: 'center',
        fontSize: responsiveSize(14),
        marginTop: responsiveSize(5),
    },
});