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
  Alert 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebaseConfig';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';

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
            <Ionicons name="play" size={28} color="#000" />
          </LinearGradient>
        </View>
        <View style={styles.durationBadge}>
          <Ionicons name="videocam" size={14} color="#fff" />
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
            <Ionicons name="heart-dislike-outline" size={60} color="#999" />
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
    paddingHorizontal: 20, 
    paddingTop: 20,
    paddingBottom: 20,
  },
  
  // --- Favorite Video Card (Reused from SermonsScreen concept) ---
  videoCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  thumbnailContainer: {
    width: '100%',
    height: 200,
    position: 'relative',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
    // Only ImageStyle properties here
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
    transform: [{ translateX: -32 }, { translateY: -32 }],
  },
  playIconGradient: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
  },
  durationBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  durationText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
  },
  contentContainer: {
    padding: 16,
  },
  videoTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 0, // No bottom margin needed here
    lineHeight: 24,
  },

  // --- Loading and Empty States ---
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#999',
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    gap: 10,
  },
  emptyText: { 
    color: '#FFD700', 
    textAlign: 'center', 
    fontSize: 20, 
    fontWeight: '600',
    marginTop: 20,
  },
  emptySubText: {
    color: '#999',
    textAlign: 'center',
    fontSize: 14,
    marginTop: 5,
  },
});
