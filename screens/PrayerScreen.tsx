import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Switch,
  Dimensions
} from 'react-native';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { PrayerStackParamList } from '../navigation/types';
import { useTheme } from '../context/ThemeContext';

// Responsive scaling utility
const { width } = Dimensions.get('window');
const scale = (size: number) => (width / 375) * size;

export default function PrayerScreen() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<PrayerStackParamList>>();
  const [request, setRequest] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (request.trim() === '') {
      Alert.alert('Empty Request', 'Please write your prayer request before submitting.');
      return;
    }
    if (!user) {
      Alert.alert('Authentication Required', 'You must be signed in to submit a prayer request.');
      return;
    }

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

      Alert.alert('Request Sent', 'Your prayer request has been received.');
      setRequest('');
    } catch (error) {
      console.error("Error submitting prayer request: ", error);
      Alert.alert('Error', 'There was an issue sending your request.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          <ScrollView 
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.headerSection}>
                <TouchableOpacity style={styles.navButton} onPress={() => navigation.navigate('PrayerJournal')}>
                    <Ionicons name="journal-outline" size={scale(22)} color={theme.primary} />
                    <Text style={[styles.navButtonText, { color: theme.text }]}>My Journal</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.navButton} onPress={() => navigation.navigate('PrayerWall')}>
                    <Ionicons name="people-outline" size={scale(22)} color={theme.primary} />
                    <Text style={[styles.navButtonText, { color: theme.text }]}>Prayer Wall</Text>
                </TouchableOpacity>
            </View>
            
            <View style={[styles.formCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <View style={styles.formContent}>
                <View style={styles.inputWrapper}>
                  <Text style={[styles.inputLabel, { color: theme.text }]}>Prayer Request</Text>
                  <View style={[styles.textAreaContainer, { backgroundColor: theme.background, borderColor: theme.border }, focusedField === 'request' && { borderColor: theme.primary }]}>
                    <TextInput
                      style={[styles.textArea, { color: theme.text }]}
                      placeholder="Share your heart with us..."
                      placeholderTextColor={theme.textSecondary}
                      value={request}
                      onChangeText={setRequest}
                      multiline
                      onFocus={() => setFocusedField('request')}
                      onBlur={() => setFocusedField(null)}
                    />
                  </View>
                </View>

                <View style={styles.toggleContainer}>
                  <Text style={[styles.toggleLabel, { color: theme.text }]}>Make this prayer public?</Text>
                  <Switch
                    trackColor={{ false: '#767577', true: theme.primary }}
                    thumbColor={isPublic ? theme.card : '#f4f3f4'}
                    ios_backgroundColor="#3e3e3e"
                    onValueChange={setIsPublic}
                    value={isPublic}
                  />
                </View>
                <Text style={[styles.privacyText, { color: theme.textSecondary }]}>
                  Public prayers are shared anonymously on the Prayer Wall for others to pray with you.
                </Text>

                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={handleSubmit}
                  disabled={isSubmitting}
                >
                  <LinearGradient
                    colors={isSubmitting ? ['#333', '#222'] : [theme.primary, '#FFA500']}
                    style={[styles.submitButton, isSubmitting && styles.buttonDisabled]}
                  >
                    {isSubmitting ? (
                      <ActivityIndicator color="#000" />
                    ) : (
                      <>
                        <Text style={styles.submitButtonText}>Submit Prayer</Text>
                        <Ionicons name="send" size={scale(18)} color="#000" />
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingHorizontal: scale(20), paddingTop: scale(10) },
  headerSection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: scale(10),
    marginBottom: scale(15),
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: scale(16),
    paddingVertical: scale(10),
    borderRadius: scale(20),
    gap: scale(8),
  },
  navButtonText: { fontSize: scale(14), fontWeight: '600' },
  formCard: {
    borderRadius: scale(20),
    borderWidth: 1,
  },
  formContent: { padding: scale(20) },
  inputWrapper: { marginBottom: scale(20) },
  inputLabel: {
    fontSize: scale(16),
    fontWeight: '700',
    marginBottom: scale(12),
  },
  textAreaContainer: {
    borderRadius: scale(12),
    borderWidth: 1,
  },
  textArea: {
    padding: scale(15),
    fontSize: scale(15),
    minHeight: scale(120),
    textAlignVertical: 'top',
  },
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: scale(8),
  },
  toggleLabel: {
    fontSize: scale(15),
    fontWeight: '500',
  },
  privacyText: {
    fontSize: scale(12),
    lineHeight: scale(18),
    marginBottom: scale(24),
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: scale(16),
    borderRadius: scale(12),
    gap: scale(10),
  },
  buttonDisabled: { opacity: 0.6 },
  submitButtonText: {
    fontSize: scale(16),
    fontWeight: '800',
    color: '#000000',
  },
});

