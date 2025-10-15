import React, { useState, useEffect, useRef } from 'react';
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
  Share,
  Animated, // Import Animated
  Easing // Import Easing for smoother animations
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { YOUTUBE_API_KEY, UPLOADS_PLAYLIST_ID } from '../apiKeys';
import { Ionicons } from '@expo/vector-icons';
import { doc, setDoc, deleteDoc, getDoc } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebaseConfig';

interface VideoItem { 
  id: string; 
  title: string; 
  thumbnailUrl: string; 
}

export default function SermonsScreen() {
  const { user } = useAuth();
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [nextPageToken, setNextPageToken] = useState<string | null>(null);
  const [fetchingMore, setFetchingMore] = useState(false);

  // Animation for the golden glow on favorite button
  const favoriteGlowAnim = useRef(new Animated.Value(0)).current;

  // Function to start the glow animation
  const startGlowAnimation = () => {
    favoriteGlowAnim.setValue(0); // Reset animation
    Animated.timing(favoriteGlowAnim, {
      toValue: 1,
      duration: 300, // Quick glow
      easing: Easing.ease,
      useNativeDriver: true,
    }).start(() => {
      // Optional: you can make it pulsate indefinitely if desired, or just fade out
      // Animated.timing(favoriteGlowAnim, {
      //   toValue: 0,
      //   duration: 500,
      //   easing: Easing.ease,
      //   useNativeDriver: true,
      // }).start();
    });
  };

  useEffect(() => {
    fetchVideos();
    loadFavorites();
  }, []);

  const fetchVideos = async (pageToken: string | null = null) => {
    if (fetchingMore && pageToken) return; // Prevent multiple fetches for infinite scroll
    if (pageToken) setFetchingMore(true);
    else setLoading(true);

    try {
      let apiUrl = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${UPLOADS_PLAYLIST_ID}&maxResults=25&key=${YOUTUBE_API_KEY}`;
      if (pageToken) {
        apiUrl += `&pageToken=${pageToken}`;
      }

      const response = await fetch(apiUrl);
      const data = await response.json();

      if (data.items) {
        const videoData = data.items.map((item: any) => ({
          id: item.snippet.resourceId.videoId,
          title: item.snippet.title,
          thumbnailUrl: item.snippet.thumbnails.high.url,
        }));
        setVideos(prevVideos => pageToken ? [...prevVideos, ...videoData] : videoData);
        setNextPageToken(data.nextPageToken || null);
      } else if (data.error) {
        console.error("YouTube API Error:", data.error.message);
        Alert.alert("Error", `Failed to load videos: ${data.error.message}`);
      }
    } catch (error) {
      console.error("Error fetching videos: ", error);
      Alert.alert("Error", "An error occurred while fetching videos.");
    } finally {
      setLoading(false);
      setFetchingMore(false);
    }
  };

  const loadFavorites = async () => {
    if (!user) {
      console.log("User not logged in, cannot load favorites.");
      return;
    }
    try {
      // Fetch all favorite video IDs for the current user
      const favoritesCollectionRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(favoritesCollectionRef);

      if (userDoc.exists()) {
        const userData = userDoc.data();
        if (userData && userData.favorites) {
          // Assuming 'favorites' field stores an array of video IDs directly
          setFavorites(new Set(userData.favorites));
        }
      }
    } catch (error) {
      console.error("Error loading favorites:", error);
      // Don't alert the user for this, just log it. UX is smoother if we fail silently.
    }
  };

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

  const handleShare = async (title: string, videoId: string) => {
    try {
      const youtubeUrl = `https://www.youtube.com/watch?v=${videoId}`;
      await Share.share({
        message: `Check out this sermon from Grace Ministry:\n\n${title}\n\n${youtubeUrl}`,
      });
    } catch (error) {
      Alert.alert('Error', 'Could not share the sermon.');
    }
  };

  const handleFavorite = async (sermon: VideoItem) => {
    if (!user) {
      Alert.alert("Please Sign In", "You need to be signed in to save favorites.");
      return;
    }

    const favoriteDocRef = doc(db, "users", user.uid, "favorites", sermon.id);
    
    try {
      const docSnap = await getDoc(favoriteDocRef);
      
      if (docSnap.exists()) {
        await deleteDoc(favoriteDocRef);
        setFavorites(prev => {
          const newSet = new Set(prev);
          newSet.delete(sermon.id);
          return newSet;
        });
        Alert.alert("Removed", "Sermon removed from favorites.");
      } else {
        await setDoc(favoriteDocRef, {
          title: sermon.title,
          thumbnailUrl: sermon.thumbnailUrl,
          videoId: sermon.id,
          savedAt: new Date(),
        });
        setFavorites(prev => new Set(prev).add(sermon.id));
        Alert.alert("Favorited!", "Sermon saved to your favorites.");
        startGlowAnimation(); // Start glow animation when favorited
      }
    } catch (error) {
      console.error("Error toggling favorite:", error);
      Alert.alert("Error", "Could not update favorites.");
    }
  };

  const handleLoadMore = () => {
    if (nextPageToken && !fetchingMore) {
      fetchVideos(nextPageToken);
    }
  };

  const renderFooter = () => {
    if (!fetchingMore) return null;
    return (
      <View style={styles.loadingMoreContainer}>
        <ActivityIndicator size="small" color="#FFD700" />
        <Text style={styles.loadingMoreText}>Loading more sermons...</Text>
      </View>
    );
  };

  const renderVideoItem = ({ item }: { item: VideoItem }) => {
    const isFavorited = favorites.has(item.id);
    
    // Interpolate animated values for the glow effect
    const glowScale = favoriteGlowAnim.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: [1, 1.2, 1], // Pulsate effect
    });
    const glowOpacity = favoriteGlowAnim.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: [0, 0.8, 0], // Fade in and out
    });

    return (
      <View style={styles.videoCard}>
        <TouchableOpacity 
          onPress={() => openVideo(item.id)} 
          style={styles.thumbnailContainer}
          activeOpacity={0.9}
        >
          <Image source={{ uri: item.thumbnailUrl }} style={styles.thumbnail as import('react-native').ImageStyle} resizeMode="cover" />
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
        </TouchableOpacity>
        
        <View style={styles.contentContainer}>
          <Text style={styles.videoTitle} numberOfLines={2}>{item.title}</Text>
          
          <View style={styles.actionsRow}>
            <TouchableOpacity 
              style={[styles.actionButton, isFavorited && styles.actionButtonActive]} 
              onPress={() => handleFavorite(item)}
              activeOpacity={0.7}
            >
              {isFavorited && (
                <Animated.View style={[
                  styles.favoriteGlow,
                  { 
                    opacity: favoriteGlowAnim.interpolate({
                        inputRange: [0, 0.5, 1],
                        outputRange: [0, 0.8, 0],
                    }),
                    transform: [{ 
                        scale: favoriteGlowAnim.interpolate({
                            inputRange: [0, 0.5, 1],
                            outputRange: [1, 1.2, 1],
                        })
                    }],
                  }
                ]} />
              )}
              <Ionicons 
                name={isFavorited ? "heart" : "heart-outline"} 
                size={20} 
                color={isFavorited ? "#FFD700" : "#999"} 
                style={isFavorited && styles.favoritedHeartIcon} // Apply shadow to the icon itself when favorited
              />
              <Text style={[styles.actionText, isFavorited && styles.actionTextActive]}>
                {isFavorited ? 'Saved' : 'Save'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionButton} 
              onPress={() => handleShare(item.title, item.id)}
              activeOpacity={0.7}
            >
              <Ionicons name="share-social-outline" size={20} color="#999" />
              <Text style={styles.actionText}>Share</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionButton} 
              onPress={() => openVideo(item.id)}
              activeOpacity={0.7}
            >
              <Ionicons name="open-outline" size={20} color="#999" />
              <Text style={styles.actionText}>Open</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* Header Section */}
        <View style={styles.headerSection}>
          <View style={styles.headerContent}>
            <View style={styles.iconContainer}>
              <LinearGradient
                colors={['rgba(255, 215, 0, 0.2)', 'rgba(255, 215, 0, 0.05)']}
                style={styles.iconGradient}
              >
                <Ionicons name="play-circle-outline" size={40} color="#FFD700" />
              </LinearGradient>
            </View>
            <View style={styles.headerTextContainer}>
              <Text style={styles.header}>Sermons</Text>
              <Text style={styles.subHeader}>{videos.length} messages available</Text>
            </View>
          </View>
        </View>

        {/* Content */}
        <View style={styles.content}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#FFD700" />
              <Text style={styles.loadingText}>Loading sermons...</Text>
            </View>
          ) : (
            <FlatList
              data={videos}
              renderItem={renderVideoItem}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContainer}
              showsVerticalScrollIndicator={false}
              onEndReached={handleLoadMore}
              onEndReachedThreshold={0.5} // Load more when user is 50% from the end
              ListFooterComponent={renderFooter}
            />
          )}
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  safeArea: {
    flex: 1,
  },

  // Header Section
  headerSection: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  iconContainer: {
    width: 64,
    height: 64,
  },
  iconGradient: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  headerTextContainer: {
    flex: 1,
  },
  header: {
    fontSize: 28,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  subHeader: {
    fontSize: 14,
    color: '#999',
    fontWeight: '500',
  },

  // Content
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
  },
  loadingMoreContainer: {
    paddingVertical: 20,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  loadingMoreText: {
    color: '#999',
    fontSize: 14,
  },

  // Video Card
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

  // Content Container
  contentContainer: {
    padding: 16,
  },
  videoTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 16,
    lineHeight: 24,
  },

  // Actions Row
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
    paddingTop: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0a0a0a',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    position: 'relative', // Needed for absolute positioning of glow
  },
  actionButtonActive: {
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  actionText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#999',
  },
  actionTextActive: {
    color: '#FFD700',
  },
  favoriteGlow: {
    position: 'absolute',
    top: -5,
    left: -5,
    right: -5,
    bottom: -5,
    backgroundColor: 'rgba(255, 215, 0, 0.3)', // Golden color
    borderRadius: 15, // Slightly larger than button border radius
    zIndex: -1, // Behind the icon and text
    // The opacity and transform will be animated
  },
  favoritedHeartIcon: {
    shadowColor: '#FFD700', // Golden shadow
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 10, // For Android
  },
});
