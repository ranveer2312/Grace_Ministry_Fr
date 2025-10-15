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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Speech from 'expo-speech';

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
                                <Ionicons name="book-outline" size={48} color="#FFD700" />
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
                                        <Ionicons name="chevron-down" size={18} color="#FFD700" />
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
                                                size={22}
                                                color="#fff"
                                            />
                                            <Text style={styles.actionButtonText}>
                                                {isSpeaking ? 'Stop' : 'Listen'}
                                            </Text>
                                        </LinearGradient>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
                                        <LinearGradient colors={['#333', '#222']} style={styles.actionButtonGradient}>
                                            <Ionicons name="share-social-outline" size={22} color="#fff" />
                                            <Text style={styles.actionButtonText}>Share</Text>
                                        </LinearGradient>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={styles.actionButton} onPress={fetchNewVerse}>
                                        <LinearGradient colors={['#333', '#222']} style={styles.actionButtonGradient}>
                                            <Ionicons name="refresh-outline" size={22} color="#fff" />
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
                                <Ionicons name="close-circle" size={28} color="#666" />
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
                                        <Ionicons name="checkmark-circle" size={24} color="#FFD700" />
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
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 40,
    },
    headerSection: {
        alignItems: 'center',
        marginBottom: 32,
    },
    iconContainer: {
        marginBottom: 20,
    },
    iconGradient: {
        width: 96,
        height: 96,
        borderRadius: 48,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 215, 0, 0.3)',
    },
    header: {
        fontSize: 32,
        fontWeight: '800',
        color: '#ffffff',
        textAlign: 'center',
        marginBottom: 8,
    },
    subHeader: {
        fontSize: 16,
        color: '#b0b0b0',
        textAlign: 'center',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 100,
    },
    verseContainer: {
        gap: 24,
    },
    verseCard: {
        borderRadius: 24,
        padding: 32,
        paddingVertical: 48,
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
        top: 15,
        left: 20,
        fontSize: 80,
        color: 'rgba(255, 255, 255, 0.05)',
        fontFamily: 'Georgia',
    },
    quoteIconBottom: {
        position: 'absolute',
        bottom: 15,
        right: 20,
        fontSize: 80,
        color: 'rgba(255, 255, 255, 0.05)',
        fontFamily: 'Georgia',
        transform: [{rotate: '180deg'}],
    },
    verseText: {
        fontSize: 24,
        fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
        lineHeight: 40,
        color: '#ffffff',
        textAlign: 'center',
        fontStyle: 'italic',
    },
    verseFooter: {
        marginTop: 32,
        alignItems: 'center',
    },
    referenceContainer: {
        alignItems: 'center',
        gap: 8,
    },
    referenceDivider: {
        width: 40,
        height: 2,
        backgroundColor: '#FFD700',
        borderRadius: 1,
    },
    verseReference: {
        fontSize: 18,
        fontWeight: '700',
        color: '#FFD700',
    },
    translatingContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        gap: 12,
        minHeight: 150,
    },
    translatingText: {
        fontSize: 16,
        color: '#FFD700',
        fontWeight: '600',
    },
    actionContainer: {
        gap: 16,
    },
    languageButton: {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(255, 215, 0, 0.3)',
    },
    languageButtonContent: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        gap: 12,
    },
    languageFlag: {
        fontSize: 24,
    },
    languageButtonText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#ffffff',
        flex: 1,
    },
    buttonRow: {
        flexDirection: 'row',
        gap: 12,
    },
    actionButton: {
        flex: 1,
        borderRadius: 16,
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
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    actionButtonText: {
        fontSize: 15,
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
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: '70%',
        borderTopWidth: 1,
        borderColor: 'rgba(255, 215, 0, 0.2)',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.05)',
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: '800',
        color: '#ffffff',
    },
    languageList: {
        padding: 20,
    },
    languageItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#0a0a0a',
        borderRadius: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)',
        gap: 16,
    },
    languageItemSelected: {
        backgroundColor: 'rgba(255, 215, 0, 0.1)',
        borderColor: 'rgba(255, 215, 0, 0.3)',
    },
    languageItemFlag: {
        fontSize: 28,
    },
    languageItemText: {
        fontSize: 17,
        fontWeight: '600',
        color: '#ffffff',
        flex: 1,
    },
});