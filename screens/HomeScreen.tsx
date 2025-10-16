import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    StyleSheet,
    Text,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    FlatList,
    Dimensions,
    Linking,
    Image,
    Animated,
    Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import Header from '../components/Header'; // Ensure this is responsive
import SermonCard from '../components/SermonCard'; // Ensure this is responsive
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { Ionicons } from '@expo/vector-icons';

// --- Responsive Sizing ---
const { width } = Dimensions.get('window');
const BASE_WIDTH = 390; // Using a standard phone width as a baseline
const scale = width / BASE_WIDTH;
const responsiveSize = (size: number) => Math.round(scale * size);

// --- INTERFACES ---
interface CarouselImage {
    id: string;
    uri: string;
    title?: string;
}

interface Announcement {
    id: string;
    title: string;
    details: string;
    date: { toDate: () => Date };
    isNew?: boolean;
}

interface Verse {
    reference: string;
    text: string;
}

interface Event {
    id: string;
    title: string;
    date: { toDate: () => Date };
}

interface FeaturedSermon {
    id: string;
    title: string;
    pastor: string;
    imageUrl: string;
    videoId: string;
}

// --- CAROUSEL COMPONENT ---
const ImageCarousel = ({ images }: { images: CarouselImage[] }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const scrollViewRef = useRef<ScrollView>(null);
    const fadeAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        if (images.length <= 1) return;

        const interval = setInterval(() => {
            setCurrentIndex((prevIndex) => {
                const nextIndex = (prevIndex + 1) % images.length;
                scrollToIndex(nextIndex);
                return nextIndex;
            });
        }, 4000);

        return () => clearInterval(interval);
    }, [images]);

    const scrollToIndex = (index: number) => {
        if (scrollViewRef.current) {
            Animated.timing(fadeAnim, {
                toValue: 0.7,
                duration: 200,
                useNativeDriver: true,
            }).start(() => {
                scrollViewRef.current?.scrollTo({
                    x: index * (width - responsiveSize(32)),
                    animated: true,
                });
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }).start();
            });
        }
    };

    const handleScroll = (event: any) => {
        const slideSize = width - responsiveSize(32);
        const index = Math.round(event.nativeEvent.contentOffset.x / slideSize);
        setCurrentIndex(index);
    };

    const handleDotPress = (index: number) => {
        setCurrentIndex(index);
        scrollToIndex(index);
    };

    if (!images || images.length === 0) {
        return (
            <View style={styles.carouselContainer}>
                <View style={[styles.carouselImageContainer, { justifyContent: 'center', alignItems: 'center' }]}>
                    <ActivityIndicator color="#FFD700" />
                    <Text style={{ color: 'white', marginTop: responsiveSize(8) }}>Loading Banners...</Text>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.carouselContainer}>
            <Animated.View style={{ opacity: fadeAnim }}>
                <ScrollView
                    ref={scrollViewRef}
                    horizontal
                    pagingEnabled
                    showsHorizontalScrollIndicator={false}
                    onMomentumScrollEnd={handleScroll}
                    scrollEventThrottle={16}
                    decelerationRate="fast"
                    snapToInterval={width - responsiveSize(32)}
                    snapToAlignment="center"
                    contentContainerStyle={styles.carouselScrollContent}
                >
                    {images.map((image) => (
                        <View key={image.id} style={styles.carouselSlide}>
                            <View style={styles.carouselImageContainer}>
                                <Image
                                    source={{ uri: image.uri }}
                                    style={styles.carouselImage}
                                    resizeMode="cover"
                                />
                                <LinearGradient
                                    colors={['transparent', 'rgba(0,0,0,0.8)']}
                                    style={styles.carouselGradient}
                                >
                                    {image.title && (
                                        <Text style={styles.carouselTitle}>{image.title}</Text>
                                    )}
                                </LinearGradient>
                            </View>
                        </View>
                    ))}
                </ScrollView>
            </Animated.View>

            <View style={styles.paginationContainer}>
                {images.map((_, index) => (
                    <TouchableOpacity
                        key={index}
                        onPress={() => handleDotPress(index)}
                        activeOpacity={0.7}
                    >
                        <View
                            style={[
                                styles.paginationDot,
                                currentIndex === index && styles.paginationDotActive,
                            ]}
                        />
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    );
};

// --- ANNOUNCEMENT CARD & EVENT CARD ---
const AnnouncementCard = ({ item }: { item: Announcement }) => {
    const [expanded, setExpanded] = useState(false);

    return (
        <View style={styles.announcementCard}>
            <View style={styles.announcementHeader}>
                <View style={styles.announcementIconContainer}>
                    <Ionicons name="megaphone-outline" size={responsiveSize(20)} color="#FFD700" />
                </View>
                <Text style={styles.announcementTitle} numberOfLines={1}>{item.title}</Text>
                {item.isNew && (
                    <View style={styles.newBadge}>
                        <Text style={styles.newBadgeText}>NEW</Text>
                    </View>
                )}
            </View>
            <Text
                style={styles.announcementDetails}
                numberOfLines={expanded ? undefined : 3}
                ellipsizeMode="tail"
            >
                {item.details}
            </Text>
            <View style={styles.announcementFooter}>
                <Text style={styles.announcementDate}>
                    {item.date.toDate().toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                    })}
                </Text>
                <TouchableOpacity onPress={() => setExpanded(!expanded)}>
                    <Text style={styles.readMoreText}>
                        {expanded ? 'Show Less' : 'Read More'}
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const EventCard = ({ item }: { item: Event }) => {
    const isValidDate = item.date && typeof item.date.toDate === 'function';
    const eventDate = isValidDate ? item.date.toDate() : null;

    const day = eventDate ? eventDate.getDate() : '??';
    const month = eventDate ? eventDate.toLocaleDateString('en-US', { month: 'short' }).toUpperCase() : 'N/A';

    return (
        <View style={styles.eventCard}>
            <View style={styles.eventDateBadge}>
                <Text style={styles.eventDay}>{day}</Text>
                <Text style={styles.eventMonth}>{month}</Text>
            </View>
            <View style={styles.eventContent}>
                <Text style={styles.eventTitle} numberOfLines={2}>{item.title}</Text>
            </View>
        </View>
    );
};

// --- MAIN HOME SCREEN COMPONENT ---
export default function HomeScreen({ navigation }: any) {
    const [sermons, setSermons] = useState<FeaturedSermon[]>([]);
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [verseOfTheDay, setVerseOfTheDay] = useState<Verse | null>(null);
    const [events, setEvents] = useState<Event[]>([]);
    const [carouselImages, setCarouselImages] = useState<CarouselImage[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                await Promise.all([
                    fetchCarouselImages(),
                    fetchAnnouncements(),
                    fetchEvents(),
                    fetchSermons(),
                    fetchRandomVerse()
                ]);
            } catch (error) {
                console.error("An error occurred during initial data fetch:", error);
                Alert.alert("Error", "Could not load all data. Please check your connection.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, []);

    const fetchCarouselImages = async () => {
        try {
            const collectionRef = collection(db, 'carouselImages');
            const q = query(collectionRef, orderBy('order', 'asc'));
            const snapshot = await getDocs(q);
            const images = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as CarouselImage[];
            setCarouselImages(images);
        } catch (error) {
            console.error("Error fetching carousel images:", error);
            setCarouselImages([]);
        }
    };

    const fetchAnnouncements = async () => {
        try {
            const collectionRef = collection(db, 'Announcements');
            const q = query(collectionRef, orderBy('date', 'desc'), limit(5));
            const snapshot = await getDocs(q);
            const data = snapshot.docs.map((doc, index) => ({
                id: doc.id,
                ...doc.data(),
                isNew: index === 0,
            })) as Announcement[];
            setAnnouncements(data);
        } catch (error) {
            console.error("Error fetching announcements:", error);
            setAnnouncements([]);
        }
    };

    const fetchEvents = async () => {
        try {
            const collectionRef = collection(db, 'events');
            const q = query(collectionRef, orderBy('date', 'asc'), limit(3));
            const snapshot = await getDocs(q);
            const data = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
            })) as Event[];
            setEvents(data);
        } catch (error) {
            console.error("Error fetching events:", error);
            setEvents([]);
        }
    };

    const fetchSermons = async () => {
        try {
            const collectionRef = collection(db, 'featuredSermons');
            const q = query(collectionRef, orderBy('order', 'asc'));
            const snapshot = await getDocs(q);
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as FeaturedSermon[];
            setSermons(data);
        } catch (error) {
            console.error("Error fetching sermons:", error);
            setSermons([]);
        }
    };

    const fetchRandomVerse = async () => {
        try {
            const vodResponse = await fetch('https://beta.ourmanna.com/api/v1/get?format=json&order=random');
            const vodData = await vodResponse.json();
            if (vodData.verse?.details) {
                setVerseOfTheDay({
                    reference: vodData.verse.details.reference,
                    text: vodData.verse.details.text.trim(),
                });
            }
        } catch (error) {
            console.error('Error fetching verse:', error);
        }
    };

    const handleGetInTouch = () => {
        navigation.navigate('Contact');
    };

    return (
        <View style={styles.container}>
            <SafeAreaView style={styles.safeArea} edges={['top']}>
                <Header />
                <ScrollView showsVerticalScrollIndicator={false}>
                    <View style={styles.contentContainer}>

                        <ImageCarousel images={carouselImages} />

                        {verseOfTheDay && (
                            <TouchableOpacity onPress={() => navigation.navigate('Bible')} activeOpacity={0.9}>
                                <LinearGradient colors={['#1a1a1a', '#0a0a0a']} style={styles.vodCard} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                                    <View style={styles.vodGlowEffect} />
                                    <View style={styles.vodHeader}>
                                        <Ionicons name="book-outline" size={responsiveSize(24)} color="#FFD700" />
                                        <Text style={styles.vodTitle}>VERSE OF THE DAY</Text>
                                    </View>
                                    <Text style={styles.vodText} numberOfLines={4}>"{verseOfTheDay.text}"</Text>
                                    <View style={styles.vodFooter}>
                                        <Text style={styles.vodReference}>{verseOfTheDay.reference}</Text>
                                        <Ionicons name="arrow-forward-circle" size={responsiveSize(24)} color="#FFD700" />
                                    </View>
                                </LinearGradient>
                            </TouchableOpacity>
                        )}

                        <View style={styles.sectionHeader}>
                            <View style={styles.sectionTitleContainer}><View style={styles.sectionIndicator} /><Text style={styles.sectionTitle}>Announcements</Text></View>
                        </View>
                        {isLoading ? (
                            <ActivityIndicator color="#FFD700" style={{ height: responsiveSize(120) }} />
                        ) : announcements.length > 0 ? (
                            <FlatList
                                data={announcements}
                                renderItem={({ item }) => <AnnouncementCard item={item} />}
                                keyExtractor={item => item.id}
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                style={styles.announcementSlider}
                                contentContainerStyle={styles.sliderContent}
                            />
                        ) : (
                            <Text style={styles.noItemsText}>No announcements at this time.</Text>
                        )}

                        <View style={[styles.sectionHeader, { marginTop: responsiveSize(40) }]}>
                            <View style={styles.sectionTitleContainer}><View style={styles.sectionIndicator} /><Text style={styles.sectionTitle}>Featured Sermons</Text></View>
                            <TouchableOpacity onPress={() => navigation.navigate('Sermons')}>
                                <View style={styles.viewAllButton}><Text style={styles.viewAllText}>View All</Text><Ionicons name="arrow-forward" size={responsiveSize(16)} color="#FFD700" /></View>
                            </TouchableOpacity>
                        </View>
                        {isLoading ? (
                            <ActivityIndicator color="#FFD700" style={{ height: responsiveSize(120) }} />
                        ) : sermons.length > 0 ? (
                            <View style={styles.sermonsContainer}>
                                {sermons.map(sermon => <SermonCard key={sermon.id} {...sermon} />)}
                            </View>
                        ) : (
                            <Text style={styles.noItemsText}>No featured sermons available.</Text>
                        )}

                        <View style={[styles.sectionHeader, { marginTop: responsiveSize(40) }]}>
                            <View style={styles.sectionTitleContainer}><View style={styles.sectionIndicator} /><Text style={styles.sectionTitle}>Upcoming Events</Text></View>
                            <TouchableOpacity onPress={() => navigation.navigate('Events')}>
                                <View style={styles.viewAllButton}><Text style={styles.viewAllText}>View All</Text><Ionicons name="arrow-forward" size={responsiveSize(16)} color="#FFD700" /></View>
                            </TouchableOpacity>
                        </View>
                        <View style={styles.eventsContainer}>
                            {isLoading ? (
                                <ActivityIndicator color="#FFD700" />
                            ) : events.length > 0 ? (
                                events.map(item => <EventCard key={item.id} item={item} />)
                            ) : (
                                <Text style={styles.noItemsText}>No upcoming events found.</Text>
                            )}
                        </View>

                        <View style={styles.socialSection}>
                            <View style={styles.socialHeader}>
                                <View style={styles.sectionTitleContainer}><View style={styles.sectionIndicator} /><Text style={styles.sectionTitle}>Connect With Us</Text></View>
                            </View>
                            <View style={styles.socialIcons}>
                                <TouchableOpacity onPress={() => Linking.openURL('https://www.youtube.com/@GraceMinistryMangalore')} style={styles.socialButton} activeOpacity={0.7}>
                                    <LinearGradient colors={['#FF0000', '#CC0000']} style={styles.socialGradient}><Ionicons name="logo-youtube" size={responsiveSize(28)} color="white" /></LinearGradient>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => Linking.openURL('https://www.instagram.com/graceministrymlr/')} style={styles.socialButton} activeOpacity={0.7}>
                                    <LinearGradient colors={['#E1306C', '#C13584', '#833AB4']} style={styles.socialGradient}><Ionicons name="logo-instagram" size={responsiveSize(28)} color="white" /></LinearGradient>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => Linking.openURL('https://www.facebook.com/graceministrymlr/')} style={styles.socialButton} activeOpacity={0.7}>
                                    <LinearGradient colors={['#1877F2', '#0C63D4']} style={styles.socialGradient}><Ionicons name="logo-facebook" size={responsiveSize(28)} color="white" /></LinearGradient>
                                </TouchableOpacity>
                            </View>
                        </View>

                        <TouchableOpacity onPress={handleGetInTouch} activeOpacity={0.8}>
                            <LinearGradient colors={['#FFD700', '#FFA500']} style={styles.ctaButton} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                                <Text style={styles.ctaButtonText}>Get in Touch</Text>
                                <Ionicons name="mail-outline" size={responsiveSize(22)} color="#000" />
                            </LinearGradient>
                        </TouchableOpacity>

                    </View>
                </ScrollView>
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
    contentContainer: {
        paddingBottom: responsiveSize(30),
    },
    carouselContainer: {
        marginTop: responsiveSize(8),
        marginBottom: responsiveSize(12),
    },
    carouselScrollContent: {
        paddingHorizontal: responsiveSize(16),
    },
    carouselSlide: {
        width: width - responsiveSize(32),
        paddingHorizontal: responsiveSize(4),
    },
    carouselImageContainer: {
        width: '100%',
        height: responsiveSize(200),
        borderRadius: responsiveSize(16),
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255, 215, 0, 0.2)',
        elevation: 8,
        shadowColor: '#FFD700',
        shadowOffset: { width: 0, height: responsiveSize(4) },
        shadowOpacity: 0.3,
        shadowRadius: responsiveSize(8),
        backgroundColor: '#1a1a1a',
    },
    carouselImage: {
        width: '100%',
        height: '100%',
    },
    carouselGradient: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: '50%',
        justifyContent: 'flex-end',
        padding: responsiveSize(16),
    },
    carouselTitle: {
        fontSize: responsiveSize(18),
        fontWeight: '800',
        color: '#ffffff',
        textShadowColor: 'rgba(0, 0, 0, 0.8)',
        textShadowOffset: { width: 0, height: responsiveSize(2) },
        textShadowRadius: responsiveSize(4),
    },
    paginationContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: responsiveSize(12),
        gap: responsiveSize(6),
    },
    paginationDot: {
        width: responsiveSize(6),
        height: responsiveSize(6),
        borderRadius: responsiveSize(3),
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
    },
    paginationDotActive: {
        width: responsiveSize(20),
        backgroundColor: '#FFD700',
    },
    vodCard: {
        marginHorizontal: responsiveSize(20),
        marginVertical: responsiveSize(16),
        padding: responsiveSize(20),
        borderRadius: responsiveSize(16),
        borderWidth: 1,
        borderColor: 'rgba(255, 215, 0, 0.2)',
        overflow: 'hidden',
        elevation: 8,
        shadowColor: '#FFD700',
        shadowOffset: { width: 0, height: responsiveSize(4) },
        shadowOpacity: 0.3,
        shadowRadius: responsiveSize(8),
    },
    vodGlowEffect: {
        position: 'absolute',
        top: responsiveSize(-50),
        right: responsiveSize(-50),
        width: responsiveSize(150),
        height: responsiveSize(150),
        borderRadius: responsiveSize(75),
        backgroundColor: '#FFD700',
        opacity: 0.05,
    },
    vodHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: responsiveSize(12),
        gap: responsiveSize(8),
    },
    vodTitle: {
        fontSize: responsiveSize(11),
        fontWeight: '800',
        color: '#FFD700',
        letterSpacing: 1.5,
    },
    vodText: {
        fontSize: responsiveSize(16),
        color: '#ffffff',
        fontStyle: 'italic',
        marginBottom: responsiveSize(12),
        lineHeight: responsiveSize(24),
        fontWeight: '300',
    },
    vodFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    vodReference: {
        fontSize: responsiveSize(14),
        fontWeight: '700',
        color: '#FFD700',
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginVertical: responsiveSize(12),
        paddingHorizontal: responsiveSize(20),
    },
    sectionTitleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: responsiveSize(10),
    },
    sectionIndicator: {
        width: responsiveSize(3),
        height: responsiveSize(20),
        backgroundColor: '#FFD700',
        borderRadius: responsiveSize(2),
    },
    sectionTitle: {
        fontSize: responsiveSize(22),
        fontWeight: '800',
        color: '#ffffff',
        letterSpacing: 0.3,
    },
    viewAllButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: responsiveSize(4),
        backgroundColor: 'rgba(255, 215, 0, 0.1)',
        paddingHorizontal: responsiveSize(12),
        paddingVertical: responsiveSize(6),
        borderRadius: responsiveSize(16),
        borderWidth: 1,
        borderColor: 'rgba(255, 215, 0, 0.3)',
    },
    viewAllText: {
        fontSize: responsiveSize(13),
        color: '#FFD700',
        fontWeight: '600',
    },
    announcementSlider: {
        paddingLeft: responsiveSize(20),
    },
    sliderContent: {
        paddingRight: responsiveSize(20),
    },
    announcementCard: {
        backgroundColor: '#1a1a1a',
        padding: responsiveSize(16),
        borderRadius: responsiveSize(14),
        marginRight: responsiveSize(12),
        width: width - responsiveSize(80),
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: responsiveSize(2) },
        shadowOpacity: 0.3,
        shadowRadius: responsiveSize(4),
    },
    announcementHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: responsiveSize(10),
        gap: responsiveSize(10),
    },
    announcementIconContainer: {
        width: responsiveSize(32),
        height: responsiveSize(32),
        borderRadius: responsiveSize(16),
        backgroundColor: 'rgba(255, 215, 0, 0.15)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    announcementTitle: {
        fontSize: responsiveSize(16),
        fontWeight: '700',
        color: '#ffffff',
        flex: 1,
    },
    newBadge: {
        backgroundColor: '#FF3B30',
        paddingHorizontal: responsiveSize(8),
        paddingVertical: responsiveSize(3),
        borderRadius: responsiveSize(8),
    },
    newBadgeText: {
        fontSize: responsiveSize(10),
        fontWeight: '800',
        color: '#FFFFFF',
        letterSpacing: 0.5,
    },
    announcementDetails: {
        fontSize: responsiveSize(14),
        color: '#b0b0b0',
        marginBottom: responsiveSize(10),
        lineHeight: responsiveSize(20),
    },
    announcementFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 'auto',
        paddingTop: responsiveSize(10),
        borderTopWidth: 1,
        borderTopColor: 'rgba(255, 255, 255, 0.05)',
    },
    readMoreText: {
        fontSize: responsiveSize(12),
        color: '#FFD700',
        fontWeight: '600',
    },
    announcementDate: {
        fontSize: responsiveSize(11),
        color: '#666666',
        fontWeight: '500',
    },
    eventsContainer: {
        paddingHorizontal: responsiveSize(20),
        gap: responsiveSize(10),
    },
    eventCard: {
        backgroundColor: '#1a1a1a',
        padding: responsiveSize(14),
        borderRadius: responsiveSize(14),
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        gap: responsiveSize(12),
    },
    eventDateBadge: {
        width: responsiveSize(52),
        height: responsiveSize(52),
        borderRadius: responsiveSize(10),
        backgroundColor: '#FFD700',
        justifyContent: 'center',
        alignItems: 'center',
    },
    eventDay: {
        fontSize: responsiveSize(20),
        fontWeight: '800',
        color: '#000000',
    },
    eventMonth: {
        fontSize: responsiveSize(10),
        color: '#000000',
        fontWeight: '600',
        textTransform: 'uppercase',
    },
    eventContent: {
        flex: 1,
        gap: responsiveSize(4),
    },
    eventTitle: {
        fontSize: responsiveSize(15),
        fontWeight: '700',
        color: '#ffffff',
    },
    noItemsText: {
        color: '#999',
        textAlign: 'center',
        marginVertical: responsiveSize(20),
        fontStyle: 'italic',
    },
    sermonsContainer: {
        paddingHorizontal: responsiveSize(16),
    },
    socialSection: {
        marginTop: responsiveSize(30),
        paddingHorizontal: responsiveSize(20),
    },
    socialHeader: {
        marginBottom: responsiveSize(16),
    },
    socialIcons: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: responsiveSize(16),
    },
    socialButton: {
        elevation: 6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: responsiveSize(3) },
        shadowOpacity: 0.3,
        shadowRadius: responsiveSize(4),
    },
    socialGradient: {
        width: responsiveSize(56),
        height: responsiveSize(56),
        borderRadius: responsiveSize(28),
        justifyContent: 'center',
        alignItems: 'center',
    },
    ctaButton: {
        marginHorizontal: responsiveSize(20),
        marginTop: responsiveSize(30),
        paddingVertical: responsiveSize(14),
        paddingHorizontal: responsiveSize(20),
        borderRadius: responsiveSize(14),
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: responsiveSize(8),
        elevation: 8,
        shadowColor: '#FFD700',
        shadowOffset: { width: 0, height: responsiveSize(4) },
        shadowOpacity: 0.4,
        shadowRadius: responsiveSize(8),
    },
    ctaButtonText: {
        color: '#000000',
        fontSize: responsiveSize(16),
        fontWeight: '800',
        letterSpacing: 0.3,
    },
});