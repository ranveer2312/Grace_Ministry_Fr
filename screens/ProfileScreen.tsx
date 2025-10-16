import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Alert, ActivityIndicator, TextInput, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { getCountFromServer, collection, query, where } from 'firebase/firestore';
import { db, auth } from '../firebaseConfig';
import { updateProfile, sendPasswordResetEmail } from 'firebase/auth';
import * as ImagePicker from 'expo-image-picker';

// --- Responsive Sizing ---
const { width } = Dimensions.get('window');
const BASE_WIDTH = 390; // A standard baseline for modern phones
const responsiveSize = (size: number) => Math.round((width / BASE_WIDTH) * size);


export default function ProfileScreen({ navigation }: any) {
    const { user, logout } = useAuth();
    const { theme } = useTheme();

    const [displayName, setDisplayName] = useState(user?.displayName || '');
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [activityStats, setActivityStats] = useState({
        favoritesCount: 0,
        prayersCount: 0,
    });

    useEffect(() => {
        const fetchActivityData = async () => {
            if (!user) {
                setLoading(false);
                return;
            }
            try {
                const favoritesRef = collection(db, 'users', user.uid, 'favorites');
                const favoritesSnapshot = await getCountFromServer(favoritesRef);
                const favCount = favoritesSnapshot.data().count;

                const prayersRef = collection(db, 'prayerRequests');
                const q = query(prayersRef, where("userId", "==", user.uid));
                const prayersSnapshot = await getCountFromServer(q);
                const prayerCount = prayersSnapshot.data().count;

                setActivityStats({
                    favoritesCount: favCount,
                    prayersCount: prayerCount,
                });

            } catch (error) {
                console.error("Failed to fetch activity stats:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchActivityData();
    }, [user]);

    const handleUpdateProfile = async () => {
        if (user && user.displayName !== displayName) {
            try {
                await updateProfile(user, { displayName });
                Alert.alert('Success', 'Profile updated.');
                setIsEditing(false);
            } catch (error: any) { Alert.alert('Error', error.message); }
        } else {
            setIsEditing(false);
        }
    };

    const handleUpdatePhoto = async () => {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) { Alert.alert("Permission Required", "We need access to your photos."); return; }
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true, aspect: [1, 1], quality: 0.8,
        });
        if (!result.canceled && user) {
            try {
                await updateProfile(user, { photoURL: result.assets[0].uri });
                Alert.alert('Success', 'Profile photo updated!');
            } catch (error: any) { Alert.alert('Error', error.message); }
        }
    };

    const handlePasswordReset = () => {
        if (user?.email) {
            sendPasswordResetEmail(auth, user.email)
                .then(() => Alert.alert('Check Email', 'A password reset link has been sent.'))
                .catch((error) => Alert.alert('Error', error.message));
        }
    };

    const handleSignOut = () => {
        Alert.alert('Sign Out', 'Are you sure?',
            [{ text: 'Cancel', style: 'cancel' }, { text: 'Sign Out', style: 'destructive', onPress: logout }]
        );
    };

    const memberSince = user?.metadata.creationTime
        ? new Date(user.metadata.creationTime).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })
        : 'N/A';

    const styles = getStyles(theme);

    if (loading) {
        return <View style={styles.loadingContainer}><ActivityIndicator size="large" color={theme.primary} /></View>;
    }


    return (
        <View style={styles.container}>
            <SafeAreaView style={{ flex: 1 }}>
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    <View style={styles.headerSection}>
                        <LinearGradient colors={['rgba(255, 215, 0, 0.15)', 'rgba(255, 215, 0, 0.05)']} style={styles.headerGradient}>
                            <TouchableOpacity style={styles.settingsButton} onPress={() => navigation.navigate('Settings')}>
                                <Ionicons name="settings-outline" size={responsiveSize(24)} color="#fff" />
                            </TouchableOpacity>
                            <TouchableOpacity onPress={handleUpdatePhoto} activeOpacity={0.8}>
                                <Image source={{ uri: user?.photoURL || 'https://placehold.co/120x120/1a1a1a/FFD700?text=GM' }} style={styles.profileImage} />
                                <View style={styles.cameraIconContainer}><LinearGradient colors={['#FFD700', '#FFA500']} style={styles.cameraIcon}><Ionicons name="camera" size={responsiveSize(16)} color="#000" /></LinearGradient></View>
                            </TouchableOpacity>
                            <Text style={styles.userName}>{displayName || 'User Name'}</Text>
                            <View style={styles.emailContainer}><Ionicons name="mail-outline" size={responsiveSize(16)} color="#999" /><Text style={styles.userEmail}>{user?.email}</Text></View>
                        </LinearGradient>
                    </View>

                    <View style={styles.contentSection}>
                        <View style={styles.card}>
                            <View style={styles.cardHeader}><Text style={styles.cardTitle}>My Activity</Text></View>
                            <View style={styles.activityContent}>
                                <View style={styles.activityItem}>
                                    <Ionicons name="heart-circle-outline" size={responsiveSize(32)} color={theme.primary} />
                                    <Text style={styles.activityLabel}>Saved Sermons</Text>
                                    <Text style={styles.activityValue}>{activityStats.favoritesCount}</Text>
                                </View>
                                <View style={styles.activityItem}>
                                    <Ionicons name="hand-left-outline" size={responsiveSize(32)} color={theme.primary} />
                                    <Text style={styles.activityLabel}>Prayers Submitted</Text>
                                    <Text style={styles.activityValue}>{activityStats.prayersCount}</Text>
                                </View>
                                <View style={styles.activityItem}>
                                    <Ionicons name="calendar-clear-outline" size={responsiveSize(32)} color={theme.primary} />
                                    <Text style={styles.activityLabel}>Member Since</Text>
                                    <Text style={[styles.activityValue, { fontSize: responsiveSize(16) }]}>{memberSince}</Text>
                                </View>
                            </View>
                        </View>

                        <View style={styles.card}>
                            <View style={styles.cardHeaderWithAction}>
                                <Text style={styles.cardTitle}>Profile Information</Text>
                                <TouchableOpacity onPress={() => setIsEditing(!isEditing)}><Ionicons name={isEditing ? "close-circle" : "create-outline"} size={responsiveSize(22)} color={theme.primary} /></TouchableOpacity>
                            </View>
                            <View style={styles.cardContent}>
                                <TextInput style={[styles.input, !isEditing && { backgroundColor: theme.card }]} value={displayName} onChangeText={setDisplayName} editable={isEditing} />
                                {isEditing && (
                                    <TouchableOpacity onPress={handleUpdateProfile} activeOpacity={0.8}>
                                        <LinearGradient colors={[theme.primary, '#FFA500']} style={styles.saveButton}><Ionicons name="checkmark-circle" size={responsiveSize(20)} color="#000" /><Text style={styles.saveButtonText}>Save Changes</Text></LinearGradient>
                                    </TouchableOpacity>
                                )}
                            </View>
                        </View>

                        <View style={styles.card}>
                            <View style={styles.cardHeader}><Text style={styles.cardTitle}>Account</Text></View>
                            <View style={styles.cardContent}>
                                <TouchableOpacity style={styles.menuItem} onPress={handlePasswordReset}><Ionicons name="key-outline" size={responsiveSize(22)} color={theme.primary} style={styles.menuIcon} /><Text style={styles.menuItemText}>Reset Password</Text><Ionicons name="chevron-forward" size={responsiveSize(20)} color={theme.textSecondary} /></TouchableOpacity>
                                <View style={styles.menuDivider} />
                                <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('Favorites')}><Ionicons name="heart-outline" size={responsiveSize(22)} color={theme.primary} style={styles.menuIcon} /><Text style={styles.menuItemText}>My Favorites</Text><Ionicons name="chevron-forward" size={responsiveSize(20)} color={theme.textSecondary} /></TouchableOpacity>
                            </View>
                        </View>

                        <TouchableOpacity onPress={handleSignOut} activeOpacity={0.8}>
                            <LinearGradient colors={['#ff6b6b', '#ee5a52']} style={styles.signOutButton}><Ionicons name="log-out-outline" size={responsiveSize(22)} color="#fff" /><Text style={styles.signOutButtonText}>Sign Out</Text></LinearGradient>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </SafeAreaView>
        </View>
    );
}

const getStyles = (theme: any) => StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.background },
    scrollContent: { flexGrow: 1, paddingBottom: responsiveSize(40) },
    headerSection: { marginBottom: responsiveSize(24) },
    headerGradient: { paddingTop: responsiveSize(40), paddingBottom: responsiveSize(40), alignItems: 'center', borderBottomLeftRadius: responsiveSize(32), borderBottomRightRadius: responsiveSize(32) },
    settingsButton: { position: 'absolute', top: responsiveSize(50), left: responsiveSize(20), zIndex: 10, padding: responsiveSize(10) },
    profileImage: { width: responsiveSize(120), height: responsiveSize(120), borderRadius: responsiveSize(60), borderWidth: responsiveSize(4), borderColor: theme.primary },
    cameraIconContainer: { position: 'absolute', bottom: 0, right: 0 },
    cameraIcon: { width: responsiveSize(36), height: responsiveSize(36), borderRadius: responsiveSize(18), justifyContent: 'center', alignItems: 'center', borderWidth: responsiveSize(3), borderColor: '#000' },
    userName: { fontSize: responsiveSize(28), fontWeight: '800', color: '#fff', marginBottom: responsiveSize(8) },
    userEmail: { fontSize: responsiveSize(14), color: theme.textSecondary, fontWeight: '500' },
    emailContainer: { flexDirection: 'row', alignItems: 'center', gap: responsiveSize(6), backgroundColor: 'rgba(0,0,0,0.3)', paddingHorizontal: responsiveSize(12), paddingVertical: responsiveSize(6), borderRadius: responsiveSize(12) },
    contentSection: { paddingHorizontal: responsiveSize(20), gap: responsiveSize(20) },
    card: { backgroundColor: theme.card, borderRadius: responsiveSize(16), borderWidth: 1, borderColor: theme.border },
    cardHeader: { padding: responsiveSize(20), borderBottomWidth: 1, borderBottomColor: theme.border },
    cardHeaderWithAction: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: responsiveSize(20), borderBottomWidth: 1, borderBottomColor: theme.border },
    cardTitle: { fontSize: responsiveSize(18), fontWeight: '700', color: theme.text },
    cardContent: { padding: responsiveSize(20), gap: responsiveSize(16) },
    activityContent: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: responsiveSize(20), paddingHorizontal: responsiveSize(10), alignItems: 'flex-start' },
    activityItem: { alignItems: 'center', gap: responsiveSize(8), flex: 1 },
    activityLabel: { color: theme.textSecondary, fontSize: responsiveSize(14), textAlign: 'center', fontWeight: '500', minHeight: responsiveSize(32) },
    activityValue: { color: theme.text, fontSize: responsiveSize(20), fontWeight: 'bold', textAlign: 'center' },
    input: { padding: responsiveSize(16), fontSize: responsiveSize(16), color: theme.text, backgroundColor: theme.background, borderRadius: responsiveSize(12), borderWidth: 1, borderColor: theme.border },
    saveButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: responsiveSize(14), borderRadius: responsiveSize(12), gap: responsiveSize(8), marginTop: responsiveSize(10) },
    saveButtonText: { fontSize: responsiveSize(16), fontWeight: '800', color: '#000' },
    menuItem: { flexDirection: 'row', alignItems: 'center' },
    menuIcon: { marginRight: responsiveSize(16) },
    menuItemText: { fontSize: responsiveSize(16), color: theme.text, fontWeight: '600', flex: 1 },
    menuDivider: { height: 1, backgroundColor: theme.border, marginVertical: responsiveSize(8) },
    signOutButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: responsiveSize(16), borderRadius: responsiveSize(12), gap: responsiveSize(8) },
    signOutButtonText: { fontSize: responsiveSize(16), fontWeight: '800', color: '#fff', letterSpacing: 0.5 },
});