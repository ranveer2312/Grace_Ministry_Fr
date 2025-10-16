import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ActivityIndicator,
    ScrollView,
    Alert,
    Platform,
    TouchableOpacity,
    Share,
    Modal,
    Animated,
    Dimensions, // Added for responsiveness
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Speech from 'expo-speech';

// --- Responsive Sizing ---
const { width } = Dimensions.get('window');
const BASE_WIDTH = 390; // Using a standard phone width as a baseline
const scale = width / BASE_WIDTH;
const responsiveSize = (size: number) => Math.round(scale * size);


// --- Interfaces and Constants ---
interface Verse {
    reference: string;
    text: string;
}
interface Language {
    code: string;
    name: string;
    flag: string;
}
const LANGUAGES: Language[] = [
    { code: 'en', name: 'English', flag: '🇬🇧' },
    { code: 'es', name: 'Spanish', flag: '🇪🇸' },
    { code: 'fr', name: 'French', flag: '🇫🇷' },
    { code: 'de', name: 'German', flag: '🇩🇪' },
    { code: 'it', name: 'Italian', flag: '🇮🇹' },
    { code: 'pt', name: 'Portuguese', flag: '🇵🇹' },
    { code: 'hi', name: 'Hindi', flag: '🇮🇳' },
    { code: 'kn', name: 'Kannada', flag: '🇮🇳' },
    { code: 'ta', name: 'Tamil', flag: '🇮🇳' },
    { code: 'te', name: 'Telugu', flag: '🇮🇳' },
    { code: 'zh', name: 'Chinese', flag: '🇨🇳' },
    { code: 'ar', name: 'Arabic', flag: '🇸🇦' },
    { code: 'ru', name: 'Russian', flag: '🇷🇺' },
    { code: 'ja', name: 'Japanese', flag: '🇯🇵' },
    { code: 'ko', name: 'Korean', flag: '🇰🇷' },
];

export default function BibleVerseScreen() {
    const [verse, setVerse] = useState<Verse | null>(null);
    const [translatedVerse, setTranslatedVerse] = useState<Verse | null>(null);
    const [loading, setLoading] = useState(true);
    const [translating, setTranslating] = useState(false);
    const [selectedLanguage, setSelectedLanguage] = useState<Language>(LANGUAGES[0]);
    const [showLanguageModal, setShowLanguageModal] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const speechInitialized = useRef(false);

    // Setup Animated value
    const cardAnimation = useRef(new Animated.Value(0)).current;

    // --- Core Logic ---
    useEffect(() => {
        fetchNewVerse();
        // Pre-initialize speech engine
        initializeSpeech();
    }, []);

    // Pre-initialize the speech engine to reduce first-time delay
    const initializeSpeech = async () => {
        try {
            // Speak a silent/short phrase to warm up the engine
            await Speech.speak(' ', {
                language: 'en',
                rate: 1.0,
                volume: 0, // Silent
            });
            speechInitialized.current = true;
        } catch (error) {
            console.log('Speech initialization skipped');
        }
    };

    useEffect(() => {
        // Trigger animation when loading is complete
        if (!loading && translatedVerse) {
            Animated.timing(cardAnimation, {
                toValue: 1,
                duration: 800,
                useNativeDriver: true,
            }).start();
        }
    }, [loading, translatedVerse]);

    useEffect(() => {
        return () => {
            Speech.stop();
        };
    }, []);

    const fetchNewVerse = async () => {
        cardAnimation.setValue(0); // Reset animation
        Speech.stop();
        setLoading(true);
        try {
            const response = await fetch('https://beta.ourmanna.com/api/v1/get?format=json&order=random');
            const data = await response.json();

            if (data.verse?.details) {
                const newVerse = {
                    reference: data.verse.details.reference,
                    text: data.verse.details.text,
                };
                setVerse(newVerse);
                setTranslatedVerse(newVerse);
                setSelectedLanguage(LANGUAGES[0]);
            } else {
                throw new Error('Invalid data from API');
            }
        } catch (error) {
            Alert.alert("Error", "Could not load verse.");
        } finally {
            setLoading(false);
        }
    };

    const translateVerse = async (targetLanguage: Language) => {
        if (!verse || targetLanguage.code === 'en') {
            setTranslatedVerse(verse);
            setSelectedLanguage(targetLanguage);
            return;
        }
        setTranslating(true);
        try {
            const response = await fetch(
                `https://api.mymemory.translated.net/get?q=${encodeURIComponent(verse.text)}&langpair=en|${targetLanguage.code}`
            );
            const data = await response.json();
            if (data.responseData?.translatedText) {
                setTranslatedVerse({
                    reference: verse.reference,
                    text: data.responseData.translatedText,
                });
                setSelectedLanguage(targetLanguage);
            } else {
                throw new Error('Translation failed');
            }
        } catch (error) {
            Alert.alert('Translation Error', 'Could not translate the verse.');
        } finally {
            setTranslating(false);
        }
    };

    const handleShare = async () => {
        if (!translatedVerse) return;
        try {
            await Share.share({
                message: `Verse of the Day (${selectedLanguage.name}):\n\n"${translatedVerse.text}"\n- ${translatedVerse.reference}\n\nShared from the Grace Ministry App.`,
            });
        } catch (error) {
            Alert.alert('Error', 'Could not share the verse.');
        }
    };

    const handleLanguageSelect = (language: Language) => {
        Speech.stop();
        setIsSpeaking(false);
        setShowLanguageModal(false);
        translateVerse(language);
    };

    const handleSpeak = () => {
        if (isSpeaking) {
            Speech.stop();
            setIsSpeaking(false);
            return;
        }
        if (translatedVerse) {
            setIsSpeaking(true);

            // Immediately start speaking without await for faster response
            Speech.speak(translatedVerse.text, {
                language: selectedLanguage.code,
                rate: 1.0, // Optimal rate for faster start
                pitch: 1.0,
                onStart: () => {
                    // Confirm speaking started
                    setIsSpeaking(true);
                },
                onDone: () => setIsSpeaking(false),
                onStopped: () => setIsSpeaking(false),
                onError: (error) => {
                    Alert.alert("Audio Error", "Could not play audio for this language.");
                    setIsSpeaking(false);
                },
            });
        }
    };

    // Define animation styles
    const cardStyle = {
        opacity: cardAnimation,
        transform: [{
            translateY: cardAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: [50, 0], // Starts 50px down and moves up
            }),
        }],
    };

    return (
        <LinearGradient colors={['#111111', '#000000']} style={styles.container}>
            <SafeAreaView style={styles.safeArea}>
                <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                    {/* --- Header Section --- */}
                    <View style={styles.headerSection}>
                        <View style={styles.iconContainer}>
                            <LinearGradient
                                colors={['rgba(255, 215, 0, 0.2)', 'rgba(255, 215, 0, 0.05)']}
                                style={styles.iconGradient}>
                                <Ionicons name="book-outline" size={responsiveSize(48)} color="#FFD700" />
                            </LinearGradient>
                        </View>
                        <Text style={styles.header}>Daily Scripture</Text>
                        <Text style={styles.subHeader}>God's word for you today</Text>
                    </View>

                    {loading && (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color="#FFD700" />
                        </View>
                    )}

                    {!loading && translatedVerse && (
                        <Animated.View style={[styles.verseContainer, cardStyle]}>
                            {/* --- Verse Card --- */}
                            <LinearGradient
                                colors={['#2a2a2a', '#1a1a1a']}
                                style={styles.verseCard}>
                                <Text style={styles.quoteIconTop}>"</Text>
                                {translating ? (
                                    <View style={styles.translatingContainer}>
                                        <ActivityIndicator size="small" color="#FFD700" />
                                        <Text style={styles.translatingText}>Translating...</Text>
                                    </View>
                                ) : (
                                    <>
                                        <Text style={styles.verseText}>{translatedVerse.text}</Text>
                                        <View style={styles.verseFooter}>
                                            <View style={styles.referenceContainer}>
                                                <View style={styles.referenceDivider} />
                                                <Text style={styles.verseReference}>
                                                    {translatedVerse.reference}
                                                </Text>
                                            </View>
                                        </View>
                                    </>
                                )}
                                <Text style={styles.quoteIconBottom}>"</Text>
                            </LinearGradient>

                            {/* --- Action Buttons --- */}
                            <View style={styles.actionContainer}>
                                <TouchableOpacity
                                    style={styles.languageButton}
                                    onPress={() => setShowLanguageModal(true)}
                                    activeOpacity={0.7}>
                                    <View style={styles.languageButtonContent}>
                                        <Text style={styles.languageFlag}>{selectedLanguage.flag}</Text>
                                        <Text style={styles.languageButtonText}>{selectedLanguage.name}</Text>
                                        <Ionicons name="chevron-down" size={responsiveSize(18)} color="#FFD700" />
                                    </View>
                                </TouchableOpacity>

                                <View style={styles.buttonRow}>
                                    <TouchableOpacity
                                        style={styles.actionButton}
                                        onPress={handleSpeak}
                                        activeOpacity={0.7}>
                                        <LinearGradient
                                            colors={['#333', '#222']}
                                            style={styles.actionButtonGradient}>
                                            <Ionicons
                                                name={isSpeaking ? "stop-circle-outline" : "volume-medium-outline"}
                                                size={responsiveSize(22)}
                                                color="#fff"
                                            />
                                            <Text style={styles.actionButtonText}>
                                                {isSpeaking ? 'Stop' : 'Listen'}
                                            </Text>
                                        </LinearGradient>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
                                        <LinearGradient colors={['#333', '#222']} style={styles.actionButtonGradient}>
                                            <Ionicons name="share-social-outline" size={responsiveSize(22)} color="#fff" />
                                            <Text style={styles.actionButtonText}>Share</Text>
                                        </LinearGradient>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={styles.actionButton} onPress={fetchNewVerse}>
                                        <LinearGradient colors={['#333', '#222']} style={styles.actionButtonGradient}>
                                            <Ionicons name="refresh-outline" size={responsiveSize(22)} color="#fff" />
                                            <Text style={styles.actionButtonText}>New Verse</Text>
                                        </LinearGradient>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </Animated.View>
                    )}
                </ScrollView>
            </SafeAreaView>

            {/* --- Modal --- */}
            <Modal
                visible={showLanguageModal}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setShowLanguageModal(false)}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Select Language</Text>
                            <TouchableOpacity onPress={() => setShowLanguageModal(false)}>
                                <Ionicons name="close-circle" size={responsiveSize(28)} color="#666" />
                            </TouchableOpacity>
                        </View>
                        <ScrollView style={styles.languageList} showsVerticalScrollIndicator={false}>
                            {LANGUAGES.map((language) => (
                                <TouchableOpacity
                                    key={language.code}
                                    style={[
                                        styles.languageItem,
                                        selectedLanguage.code === language.code && styles.languageItemSelected,
                                    ]}
                                    onPress={() => handleLanguageSelect(language)}>
                                    <Text style={styles.languageItemFlag}>{language.flag}</Text>
                                    <Text style={styles.languageItemText}>{language.name}</Text>
                                    {selectedLanguage.code === language.code && (
                                        <Ionicons name="checkmark-circle" size={responsiveSize(24)} color="#FFD700" />
                                    )}
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </LinearGradient>
    );
}

// --- Stylesheet ---
const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    safeArea: {
        flex: 1,
    },
    content: {
        flexGrow: 1,
        paddingHorizontal: responsiveSize(20),
        paddingTop: responsiveSize(20),
        paddingBottom: responsiveSize(40),
    },
    headerSection: {
        alignItems: 'center',
        marginBottom: responsiveSize(32),
    },
    iconContainer: {
        marginBottom: responsiveSize(20),
    },
    iconGradient: {
        width: responsiveSize(96),
        height: responsiveSize(96),
        borderRadius: responsiveSize(48),
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 215, 0, 0.3)',
    },
    header: {
        fontSize: responsiveSize(32),
        fontWeight: '800',
        color: '#ffffff',
        textAlign: 'center',
        marginBottom: responsiveSize(8),
    },
    subHeader: {
        fontSize: responsiveSize(16),
        color: '#b0b0b0',
        textAlign: 'center',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: responsiveSize(100),
    },
    verseContainer: {
        gap: responsiveSize(24),
    },
    verseCard: {
        borderRadius: responsiveSize(24),
        padding: responsiveSize(32),
        paddingVertical: responsiveSize(48),
        borderWidth: 1,
        borderColor: 'rgba(255, 215, 0, 0.2)',
        shadowColor: '#FFD700',
        shadowOffset: {
            width: 0,
            height: 0,
        },
        shadowOpacity: 0.5,
        shadowRadius: 15,
        elevation: 10,
    },
    quoteIconTop: {
        position: 'absolute',
        top: responsiveSize(15),
        left: responsiveSize(20),
        fontSize: responsiveSize(80),
        color: 'rgba(255, 255, 255, 0.05)',
        fontFamily: 'Georgia',
    },
    quoteIconBottom: {
        position: 'absolute',
        bottom: responsiveSize(15),
        right: responsiveSize(20),
        fontSize: responsiveSize(80),
        color: 'rgba(255, 255, 255, 0.05)',
        fontFamily: 'Georgia',
        transform: [{ rotate: '180deg' }],
    },
    verseText: {
        fontSize: responsiveSize(24),
        fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
        lineHeight: responsiveSize(40),
        color: '#ffffff',
        textAlign: 'center',
        fontStyle: 'italic',
    },
    verseFooter: {
        marginTop: responsiveSize(32),
        alignItems: 'center',
    },
    referenceContainer: {
        alignItems: 'center',
        gap: responsiveSize(8),
    },
    referenceDivider: {
        width: responsiveSize(40),
        height: 2,
        backgroundColor: '#FFD700',
        borderRadius: 1,
    },
    verseReference: {
        fontSize: responsiveSize(18),
        fontWeight: '700',
        color: '#FFD700',
    },
    translatingContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        gap: responsiveSize(12),
        minHeight: responsiveSize(150),
    },
    translatingText: {
        fontSize: responsiveSize(16),
        color: '#FFD700',
        fontWeight: '600',
    },
    actionContainer: {
        gap: responsiveSize(16),
    },
    languageButton: {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: responsiveSize(16),
        borderWidth: 1,
        borderColor: 'rgba(255, 215, 0, 0.3)',
    },
    languageButtonContent: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: responsiveSize(16),
        gap: responsiveSize(12),
    },
    languageFlag: {
        fontSize: responsiveSize(24),
    },
    languageButtonText: {
        fontSize: responsiveSize(16),
        fontWeight: '700',
        color: '#ffffff',
        flex: 1,
    },
    buttonRow: {
        flexDirection: 'row',
        gap: responsiveSize(12),
        flexWrap: 'wrap', // Allows buttons to wrap to the next line on narrow screens
    },
    actionButton: {
        flex: 1,
        minWidth: '45%', // Ensures buttons don't get too small when wrapped
        borderRadius: responsiveSize(16),
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 4
        },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 8,
    },
    actionButtonGradient: {
        flex: 1,
        padding: responsiveSize(16),
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: responsiveSize(8),
        borderRadius: responsiveSize(16),
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    actionButtonText: {
        fontSize: responsiveSize(15),
        fontWeight: '600',
        color: '#ffffff',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#1a1a1a',
        borderTopLeftRadius: responsiveSize(24),
        borderTopRightRadius: responsiveSize(24),
        maxHeight: '70%',
        borderTopWidth: 1,
        borderColor: 'rgba(255, 215, 0, 0.2)',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: responsiveSize(20),
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.05)',
    },
    modalTitle: {
        fontSize: responsiveSize(22),
        fontWeight: '800',
        color: '#ffffff',
    },
    languageList: {
        padding: responsiveSize(20),
    },
    languageItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: responsiveSize(16),
        backgroundColor: '#0a0a0a',
        borderRadius: responsiveSize(12),
        marginBottom: responsiveSize(12),
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)',
        gap: responsiveSize(16),
    },
    languageItemSelected: {
        backgroundColor: 'rgba(255, 215, 0, 0.1)',
        borderColor: 'rgba(255, 215, 0, 0.3)',
    },
    languageItemFlag: {
        fontSize: responsiveSize(28),
    },
    languageItemText: {
        fontSize: responsiveSize(17),
        fontWeight: '600',
        color: '#ffffff',
        flex: 1,
    },
});