import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Alert, ActivityIndicator, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { doc, getCountFromServer, collection, query, where } from 'firebase/firestore';
import { db, auth } from '../firebaseConfig';
import { updateProfile, sendPasswordResetEmail } from 'firebase/auth';
import * as ImagePicker from 'expo-image-picker';

export default function ProfileScreen({ navigation }: any) {
  const { user, logout } = useAuth();
  const { theme } = useTheme();

  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activityStats, setActivityStats] = useState({
    favoritesCount: 0,
    prayersCount: 0, // State to hold the prayer count
  });

  useEffect(() => {
    const fetchActivityData = async () => {
      if (!user) {
        setLoading(false);
        return;
      }
      try {
        // --- Get favorites count ---
        const favoritesRef = collection(db, 'users', user.uid, 'favorites');
        const favoritesSnapshot = await getCountFromServer(favoritesRef);
        const favCount = favoritesSnapshot.data().count;

        // --- Get prayer requests count ---
        const prayersRef = collection(db, 'prayerRequests');
        // Create a query to find prayers where userId matches the current user's uid
        const q = query(prayersRef, where("userId", "==", user.uid));
        const prayersSnapshot = await getCountFromServer(q);
        const prayerCount = prayersSnapshot.data().count;

        // Update state with both counts
        setActivityStats({
          favoritesCount: favCount,
          prayersCount: prayerCount,
        });

      } catch (error) {
        console.error("Failed to fetch activity stats:", error);
        // Don't show an alert for this, just log it. The UI will just show '0'.
      } finally {
        setLoading(false);
      }
    };
    fetchActivityData();
  }, [user]);

  // --- All other handler functions (handleUpdateProfile, handleSignOut, etc.) remain the same ---
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
                <Ionicons name="settings-outline" size={24} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleUpdatePhoto} activeOpacity={0.8}>
                <Image source={{ uri: user?.photoURL || 'https://placehold.co/120x120/1a1a1a/FFD700?text=GM' }} style={styles.profileImage} />
                <View style={styles.cameraIconContainer}><LinearGradient colors={['#FFD700', '#FFA500']} style={styles.cameraIcon}><Ionicons name="camera" size={16} color="#000" /></LinearGradient></View>
              </TouchableOpacity>
              <Text style={styles.userName}>{displayName || 'User Name'}</Text>
              <View style={styles.emailContainer}><Ionicons name="mail-outline" size={16} color="#999" /><Text style={styles.userEmail}>{user?.email}</Text></View>
            </LinearGradient>
          </View>

          <View style={styles.contentSection}>
            <View style={styles.card}>
              <View style={styles.cardHeader}><Text style={styles.cardTitle}>My Activity</Text></View>
              <View style={styles.activityContent}>
                <View style={styles.activityItem}>
                    <Ionicons name="heart-circle-outline" size={32} color={theme.primary} />
                    <Text style={styles.activityLabel}>Saved Sermons</Text>
                    <Text style={styles.activityValue}>{activityStats.favoritesCount}</Text>
                </View>
                {/* --- This is where the prayer count is displayed --- */}
                <View style={styles.activityItem}>
                    <Ionicons name="hand-left-outline" size={32} color={theme.primary} />
                    <Text style={styles.activityLabel}>Prayers Submitted</Text>
                    <Text style={styles.activityValue}>{activityStats.prayersCount}</Text>
                </View>
                <View style={styles.activityItem}>
                    <Ionicons name="calendar-clear-outline" size={32} color={theme.primary} />
                    <Text style={styles.activityLabel}>Member Since</Text>
                    <Text style={[styles.activityValue, { fontSize: 16 }]}>{memberSince}</Text>
                </View>
              </View>
            </View>

            <View style={styles.card}>
              <View style={styles.cardHeaderWithAction}>
                <Text style={styles.cardTitle}>Profile Information</Text>
                <TouchableOpacity onPress={() => setIsEditing(!isEditing)}><Ionicons name={isEditing ? "close-circle" : "create-outline"} size={22} color={theme.primary} /></TouchableOpacity>
              </View>
              <View style={styles.cardContent}>
                <TextInput style={[styles.input, !isEditing && { backgroundColor: theme.card }]} value={displayName} onChangeText={setDisplayName} editable={isEditing} />
                {isEditing && (
                  <TouchableOpacity onPress={handleUpdateProfile} activeOpacity={0.8}>
                    <LinearGradient colors={[theme.primary, '#FFA500']} style={styles.saveButton}><Ionicons name="checkmark-circle" size={20} color="#000" /><Text style={styles.saveButtonText}>Save Changes</Text></LinearGradient>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            <View style={styles.card}>
              <View style={styles.cardHeader}><Text style={styles.cardTitle}>Account</Text></View>
              <View style={styles.cardContent}>
                <TouchableOpacity style={styles.menuItem} onPress={handlePasswordReset}><Ionicons name="key-outline" size={22} color={theme.primary} style={styles.menuIcon} /><Text style={styles.menuItemText}>Reset Password</Text><Ionicons name="chevron-forward" size={20} color={theme.textSecondary} /></TouchableOpacity>
                <View style={styles.menuDivider} />
                <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('Favorites')}><Ionicons name="heart-outline" size={22} color={theme.primary} style={styles.menuIcon} /><Text style={styles.menuItemText}>My Favorites</Text><Ionicons name="chevron-forward" size={20} color={theme.textSecondary} /></TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity onPress={handleSignOut} activeOpacity={0.8}>
              <LinearGradient colors={['#ff6b6b', '#ee5a52']} style={styles.signOutButton}><Ionicons name="log-out-outline" size={22} color="#fff" /><Text style={styles.signOutButtonText}>Sign Out</Text></LinearGradient>
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
  scrollContent: { flexGrow: 1, paddingBottom: 40 },
  headerSection: { marginBottom: 24 },
  headerGradient: { paddingTop: 40, paddingBottom: 40, alignItems: 'center', borderBottomLeftRadius: 32, borderBottomRightRadius: 32 },
  settingsButton: { position: 'absolute', top: 50, left: 20, zIndex: 10, padding: 10 },
  profileImage: { width: 120, height: 120, borderRadius: 60, borderWidth: 4, borderColor: theme.primary },
  cameraIconContainer: { position: 'absolute', bottom: 0, right: 0 },
  cameraIcon: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: '#000' },
  userName: { fontSize: 28, fontWeight: '800', color: '#fff', marginBottom: 8 },
  userEmail: { fontSize: 14, color: theme.textSecondary, fontWeight: '500' },
  emailContainer: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(0,0,0,0.3)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  contentSection: { paddingHorizontal: 20, gap: 20 },
  card: { backgroundColor: theme.card, borderRadius: 16, borderWidth: 1, borderColor: theme.border },
  cardHeader: { padding: 20, borderBottomWidth: 1, borderBottomColor: theme.border },
  cardHeaderWithAction: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: theme.border },
  cardTitle: { fontSize: 18, fontWeight: '700', color: theme.text },
  cardContent: { padding: 20, gap: 16 },
  activityContent: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 20, paddingHorizontal: 10, alignItems: 'flex-start' },
  activityItem: { alignItems: 'center', gap: 8, flex: 1 },
  activityLabel: { color: theme.textSecondary, fontSize: 14, textAlign: 'center', fontWeight: '500', minHeight: 32 },
  activityValue: { color: theme.text, fontSize: 20, fontWeight: 'bold', textAlign: 'center' },
  input: { padding: 16, fontSize: 16, color: theme.text, backgroundColor: theme.background, borderRadius: 12, borderWidth: 1, borderColor: theme.border },
  saveButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 12, gap: 8, marginTop: 10 },
  saveButtonText: { fontSize: 16, fontWeight: '800', color: '#000' },
  menuItem: { flexDirection: 'row', alignItems: 'center' },
  menuIcon: { marginRight: 16 },
  menuItemText: { fontSize: 16, color: theme.text, fontWeight: '600', flex: 1 },
  menuDivider: { height: 1, backgroundColor: theme.border, marginVertical: 8 },
  signOutButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, borderRadius: 12, gap: 8 },
  signOutButtonText: { fontSize: 16, fontWeight: '800', color: '#fff', letterSpacing: 0.5 },
});
