import React, {useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    ActivityIndicator,
    Switch,
    Dimensions,
    LayoutAnimation,
    UIManager,
    Animated,
    Easing
} from 'react-native';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebaseConfig'; // Ensure this path is correct
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext'; // Ensure this path is correct
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { PrayerStackParamList } from '../navigation/types'; // Ensure this path is correct
import { useTheme } from '../context/ThemeContext'; // Ensure this path is correct

// Enable LayoutAnimation for Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

// --- Responsive Sizing ---
const { width, height } = Dimensions.get('window');
const BASE_WIDTH = 390; // Using a more modern standard baseline
const responsiveSize = (size: number) => Math.round((width / BASE_WIDTH) * size);


export default function PrayerScreen() {
    const { user } = useAuth();
    const { theme } = useTheme();
    const navigation = useNavigation<NativeStackNavigationProp<PrayerStackParamList>>();

    const [request, setRequest] = useState('');
    const [isPublic, setIsPublic] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    // Animations
    const scaleAnim = useRef(new Animated.Value(0)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const floatAnim = useRef(new Animated.Value(0)).current;
    const pulseAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        // Floating animation
        Animated.loop(
            Animated.sequence([
                Animated.timing(floatAnim, {
                    toValue: 10,
                    duration: 3000,
                    easing: Easing.inOut(Easing.sin),
                    useNativeDriver: true,
                }),
                Animated.timing(floatAnim, {
                    toValue: 0,
                    duration: 3000,
                    easing: Easing.inOut(Easing.sin),
                    useNativeDriver: true,
                }),
            ])
        ).start();
    }, []);

    useEffect(() => {
        if (showSuccess) {
            Animated.parallel([
                Animated.timing(scaleAnim, {
                    toValue: 1,
                    duration: 500,
                    easing: Easing.out(Easing.back(1.2)),
                    useNativeDriver: true,
                }),
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 500,
                    useNativeDriver: true,
                }),
                Animated.loop(
                    Animated.sequence([
                        Animated.timing(pulseAnim, {
                            toValue: 1.1,
                            duration: 600,
                            useNativeDriver: true,
                        }),
                        Animated.timing(pulseAnim, {
                            toValue: 1,
                            duration: 600,
                            useNativeDriver: true,
                        }),
                    ])
                ),
            ]).start();

            const timer = setTimeout(() => {
                Animated.timing(fadeAnim, {
                    toValue: 0,
                    duration: 400,
                    useNativeDriver: true,
                }).start(() => {
                    setShowSuccess(false);
                    scaleAnim.setValue(0);
                    pulseAnim.setValue(1);
                });
            }, 3500);

            return () => clearTimeout(timer);
        }
    }, [showSuccess]);

    const handleSubmit = async () => {
        if (request.trim() === '' || isSubmitting) return;
        if (!user) return;

        setIsSubmitting(true);
        Keyboard.dismiss();

        try {
            await addDoc(collection(db, 'prayerRequests'), {
                request: request,
                submittedAt: serverTimestamp(),
                userId: user.uid,
                isPublic: isPublic,
                amenCount: 0,
            });
            setRequest('');
            setShowSuccess(true);
        } catch (error) {
            console.error("Error submitting prayer request: ", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const charCount = request.length;
    const maxChars = 500;
    const isNearMax = charCount > maxChars * 0.8;

    return (
        <View style={{ flex: 1 }}>
            <LinearGradient
                colors={['#0a0e27', '#1a1a2e', '#16213e']}
                style={styles.container}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            />

            {/* Animated background elements */}
            <View style={styles.backgroundElements}>
                <Animated.View
                    style={[
                        styles.floatingOrb,
                        { transform: [{ translateY: floatAnim }] }
                    ]}
                />
                <View style={[styles.floatingOrb, styles.orbSecondary]} />
            </View>

            <SafeAreaView style={styles.safeArea}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    style={{ flex: 1 }}
                >
                    <ScrollView
                        contentContainerStyle={styles.scrollContent}
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled"
                    >
                        {/* Header with animated icon */}
                        <Animated.View
                            style={[
                                styles.header,
                                { transform: [{ translateY: floatAnim }] }
                            ]}
                        >
                            <LinearGradient
                                colors={['#d4af37', '#f4d03f']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={styles.headerIconContainer}
                            >
                                <Ionicons name="sparkles" size={responsiveSize(36)} color="#0a0e27" />
                            </LinearGradient>

                            <Text style={styles.headerTitle}>Share Your Prayer</Text>
                            <Text style={styles.headerSubtitle}>
                                Let your heart speak. Our community is listening and praying with you.
                            </Text>
                        </Animated.View>

                        {/* Main form card with glassmorphism effect */}
                        <View style={styles.formCardWrapper}>
                            <LinearGradient
                                colors={['rgba(212, 175, 55, 0.15)', 'rgba(212, 175, 55, 0.05)']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={styles.formCard}
                            >
                                <View style={styles.formCardBorder} />

                                {showSuccess ? (
                                    <Animated.View
                                        style={[
                                            styles.successContainer,
                                            {
                                                opacity: fadeAnim,
                                                transform: [
                                                    { scale: scaleAnim },
                                                    { scale: pulseAnim }
                                                ]
                                            }
                                        ]}
                                    >
                                        <LinearGradient
                                            colors={['#d4af37', '#f4d03f']}
                                            start={{ x: 0, y: 0 }}
                                            end={{ x: 1, y: 1 }}
                                            style={styles.successIconContainer}
                                        >
                                            <Ionicons name="checkmark" size={responsiveSize(50)} color="#0a0e27" />
                                        </LinearGradient>
                                        <Text style={styles.successText}>Prayer Sent</Text>
                                        <Text style={styles.successSubtext}>
                                            Thank you for sharing. The community will lift this up.
                                        </Text>
                                    </Animated.View>
                                ) : (
                                    <>
                                        <TextInput
                                            style={styles.textArea}
                                            placeholder="What's on your heart today?"
                                            placeholderTextColor="#888888"
                                            value={request}
                                            onChangeText={setRequest}
                                            multiline
                                            maxLength={maxChars}
                                            textAlignVertical="top"
                                        />

                                        <View style={styles.formFooter}>
                                            <View style={styles.charCountContainer}>
                                                <Text
                                                    style={[
                                                        styles.charCount,
                                                        isNearMax && styles.charCountWarning
                                                    ]}
                                                >
                                                    {charCount}/{maxChars}
                                                </Text>
                                                <View
                                                    style={[
                                                        styles.charCountBar,
                                                        { width: `${(charCount / maxChars) * 100}%` }
                                                    ]}
                                                />
                                            </View>

                                            <View style={styles.toggleContainer}>
                                                <Ionicons
                                                    name={isPublic ? "globe" : "lock-closed"}
                                                    size={responsiveSize(16)}
                                                    color="#d4af37"
                                                />
                                                <Text style={styles.toggleLabel}>
                                                    {isPublic ? 'Shared' : 'Private'}
                                                </Text>
                                                <Switch
                                                    trackColor={{ false: '#444444', true: '#d4af3744' }}
                                                    thumbColor={isPublic ? '#d4af37' : '#666666'}
                                                    ios_backgroundColor="#444444"
                                                    onValueChange={setIsPublic}
                                                    value={isPublic}
                                                />
                                            </View>
                                        </View>
                                    </>
                                )}
                            </LinearGradient>
                        </View>

                        {/* Submit button */}
                        {!showSuccess && (
                            <TouchableOpacity
                                activeOpacity={0.7}
                                onPress={handleSubmit}
                                disabled={isSubmitting || request.trim() === ''}
                            >
                                <LinearGradient
                                    colors={
                                        request.trim() === '' || isSubmitting
                                            ? ['#444444', '#333333']
                                            : ['#d4af37', '#f4d03f']
                                    }
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                    style={[
                                        styles.submitButton,
                                        (isSubmitting || request.trim() === '') && styles.buttonDisabled
                                    ]}
                                >
                                    {isSubmitting ? (
                                        <ActivityIndicator color="#0a0e27" size={responsiveSize(20)} />
                                    ) : (
                                        <>
                                            <Ionicons name="send" size={responsiveSize(20)} color="#0a0e27" />
                                            <Text style={styles.submitButtonText}>Send Prayer</Text>
                                        </>
                                    )}
                                </LinearGradient>
                            </TouchableOpacity>
                        )}

                        {/* Navigation buttons with hover effect */}
                        <View style={styles.navContainer}>
                            <TouchableOpacity
                                style={styles.navButton}
                                onPress={() => navigation.navigate('PrayerJournal')}
                            >
                                <LinearGradient
                                    colors={['rgba(212, 175, 55, 0.2)', 'rgba(212, 175, 55, 0.05)']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                    style={styles.navButtonGradient}
                                >
                                    <Ionicons name="journal" size={responsiveSize(24)} color="#d4af37" />
                                    <Text style={styles.navButtonText}>My Journal</Text>
                                </LinearGradient>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.navButton}
                                onPress={() => navigation.navigate('PrayerWall')}
                            >
                                <LinearGradient
                                    colors={['rgba(212, 175, 55, 0.2)', 'rgba(212, 175, 55, 0.05)']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                    style={styles.navButtonGradient}
                                >
                                    <Ionicons name="people" size={responsiveSize(24)} color="#d4af37" />
                                    <Text style={styles.navButtonText}>Prayer Wall</Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>
                    </ScrollView>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    backgroundElements: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        overflow: 'hidden',
    },
    floatingOrb: {
        position: 'absolute',
        width: responsiveSize(200),
        height: responsiveSize(200),
        borderRadius: responsiveSize(100),
        backgroundColor: 'rgba(212, 175, 55, 0.08)',
        top: responsiveSize(-50),
        right: responsiveSize(-50),
    },
    orbSecondary: {
        width: responsiveSize(150),
        height: responsiveSize(150),
        bottom: responsiveSize(-30),
        left: responsiveSize(-30),
        backgroundColor: 'rgba(212, 175, 55, 0.05)',
    },
    safeArea: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: responsiveSize(20),
        paddingVertical: responsiveSize(16),
    },
    header: {
        alignItems: 'center',
        marginBottom: responsiveSize(32),
        marginTop: responsiveSize(12),
    },
    headerIconContainer: {
        width: responsiveSize(80),
        height: responsiveSize(80),
        borderRadius: responsiveSize(40),
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: responsiveSize(16),
        shadowColor: '#d4af37',
        shadowOffset: { width: 0, height: responsiveSize(8) },
        shadowOpacity: 0.3,
        shadowRadius: responsiveSize(16),
        elevation: 12,
    },
    headerTitle: {
        fontSize: responsiveSize(32),
        fontWeight: '800',
        color: '#ffffff',
        marginBottom: responsiveSize(8),
        letterSpacing: 0.5,
    },
    headerSubtitle: {
        fontSize: responsiveSize(14),
        color: '#aaaaaa',
        textAlign: 'center',
        lineHeight: responsiveSize(20),
        maxWidth: '85%',
    },
    formCardWrapper: {
        marginBottom: responsiveSize(24),
    },
    formCard: {
        borderRadius: responsiveSize(24),
        overflow: 'hidden',
        minHeight: responsiveSize(280),
        borderWidth: 1,
        borderColor: 'rgba(212, 175, 55, 0.3)',
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: responsiveSize(8) },
        shadowOpacity: 0.4,
        shadowRadius: responsiveSize(16),
        elevation: 12,
    },
    formCardBorder: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        borderRadius: responsiveSize(24),
        borderWidth: 1,
        borderColor: 'rgba(212, 175, 55, 0.2)',
        pointerEvents: 'none',
    },
    textArea: {
        flex: 1,
        paddingHorizontal: responsiveSize(18),
        paddingTop: responsiveSize(18),
        paddingBottom: responsiveSize(12),
        fontSize: responsiveSize(15),
        color: '#ffffff',
        lineHeight: responsiveSize(24),
    },
    formFooter: {
        paddingHorizontal: responsiveSize(18),
        paddingBottom: responsiveSize(16),
        borderTopWidth: 1,
        borderTopColor: 'rgba(212, 175, 55, 0.15)',
        gap: responsiveSize(12),
    },
    charCountContainer: {
        gap: responsiveSize(6),
    },
    charCount: {
        fontSize: responsiveSize(12),
        color: '#888888',
        fontWeight: '500',
    },
    charCountWarning: {
        color: '#d4af37',
        fontWeight: '600',
    },
    charCountBar: {
        height: responsiveSize(2),
        backgroundColor: '#d4af37',
        borderRadius: responsiveSize(1),
    },
    toggleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: responsiveSize(10),
        justifyContent: 'space-between',
    },
    toggleLabel: {
        fontSize: responsiveSize(13),
        color: '#d4af37',
        fontWeight: '600',
        flex: 1,
    },
    successContainer: {
        minHeight: responsiveSize(280),
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: responsiveSize(24),
    },
    successIconContainer: {
        width: responsiveSize(90),
        height: responsiveSize(90),
        borderRadius: responsiveSize(45),
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: responsiveSize(16),
        shadowColor: '#d4af37',
        shadowOffset: { width: 0, height: responsiveSize(8) },
        shadowOpacity: 0.3,
        shadowRadius: responsiveSize(16),
        elevation: 12,
    },
    successText: {
        fontSize: responsiveSize(24),
        fontWeight: '700',
        color: '#ffffff',
        marginBottom: responsiveSize(8),
    },
    successSubtext: {
        fontSize: responsiveSize(13),
        color: '#aaaaaa',
        textAlign: 'center',
        lineHeight: responsiveSize(18),
    },
    submitButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: responsiveSize(16),
        borderRadius: responsiveSize(20),
        gap: responsiveSize(10),
        shadowColor: '#d4af37',
        shadowOffset: { width: 0, height: responsiveSize(8) },
        shadowOpacity: 0.25,
        shadowRadius: responsiveSize(12),
        elevation: 10,
        marginBottom: responsiveSize(24),
    },
    buttonDisabled: {
        opacity: 0.5,
        shadowOpacity: 0.1,
    },
    submitButtonText: {
        fontSize: responsiveSize(16),
        fontWeight: '700',
        color: '#0a0e27',
        letterSpacing: 0.3,
    },
    navContainer: {
        flexDirection: 'row',
        gap: responsiveSize(16),
        marginBottom: responsiveSize(12),
    },
    navButton: {
        flex: 1,
    },
    navButtonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: responsiveSize(10),
        paddingVertical: responsiveSize(14),
        borderRadius: responsiveSize(16),
        borderWidth: 1,
        borderColor: 'rgba(212, 175, 55, 0.2)',
    },
    navButtonText: {
        fontSize: responsiveSize(14),
        fontWeight: '600',
        color: '#d4af37',
    },
});