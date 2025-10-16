import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Modal, FlatList, Alert, ActivityIndicator, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { Ionicons } from '@expo/vector-icons';
import i18n from '../i18n';

// --- Responsive Sizing Utility ---
const { width } = Dimensions.get('window');
const BASE_WIDTH = 390; // A standard baseline for modern phones
const responsiveSize = (size: number) => Math.round((width / BASE_WIDTH) * size);


interface Language {
    code: string;
    name: string;
}

const languages: Language[] = [
    { code: 'en', name: 'English' },
    { code: 'kn', name: 'Kannada' },
];

export default function SettingsScreen() {
    const { user } = useAuth();
    const { theme, toggleTheme, isDarkMode } = useTheme();

    const [settings, setSettings] = useState({
        dailyVerseReminder: true,
        liveStreamAlerts: true,
        specialEvents: false,
        language: i18n.locale,
    });
    const [isLanguageModalVisible, setLanguageModalVisible] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSettings = async () => {
            if (user) {
                const userDocRef = doc(db, 'users', user.uid);
                const docSnap = await getDoc(userDocRef);
                if (docSnap.exists() && docSnap.data().settings) {
                    const fetchedSettings = docSnap.data().settings;
                    setSettings(prev => ({ ...prev, ...fetchedSettings }));
                    if (fetchedSettings.language && i18n.locale !== fetchedSettings.language) {
                        (i18n as any).locale = fetchedSettings.language;
                    }
                }
            }
            setLoading(false);
        };
        fetchSettings();
    }, [user]);

    const updateSetting = async (key: keyof typeof settings, value: any) => {
        if (!user) return;
        const oldSettings = { ...settings };
        const newSettings = { ...settings, [key]: value };
        setSettings(newSettings);

        try {
            const userDocRef = doc(db, 'users', user.uid);
            await setDoc(userDocRef, { settings: newSettings }, { merge: true });
        } catch (error) {
            Alert.alert("Error", "Could not save setting.");
            setSettings(oldSettings); // Revert on failure
        }
    };

    const handleLanguageSelect = (langCode: string) => {
        (i18n as any).locale = langCode;
        updateSetting('language', langCode);
        setLanguageModalVisible(false);
    };

    const styles = getStyles(theme);

    if (loading) {
        return <View style={styles.loadingContainer}><ActivityIndicator size="large" color={theme.primary} /></View>;
    }

    return (
        <View style={styles.container}>
            <SafeAreaView style={{ flex: 1 }}>
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    <View style={styles.card}>
                        <View style={styles.cardHeader}><Text style={styles.cardTitle}>Preferences</Text></View>
                        <View style={styles.cardContent}>
                            <TouchableOpacity style={styles.menuItem} onPress={() => setLanguageModalVisible(true)}>
                                <Ionicons name="language-outline" size={responsiveSize(22)} color={theme.primary} style={styles.menuIcon} />
                                <Text style={styles.menuItemText}>Language</Text>
                                <Text style={styles.menuItemValue}>{languages.find(l => l.code === settings.language)?.name}</Text>
                                <Ionicons name="chevron-forward" size={responsiveSize(20)} color={theme.textSecondary} />
                            </TouchableOpacity>
                            <View style={styles.menuDivider} />
                            <View style={styles.menuItem}>
                                <Ionicons name="moon-outline" size={responsiveSize(22)} color={theme.primary} style={styles.menuIcon} />
                                <Text style={styles.menuItemText}>Dark Mode</Text>
                                <Switch trackColor={{ false: "#767577", true: theme.primary }} thumbColor={isDarkMode ? "#000" : "#f4f3f4"} onValueChange={toggleTheme} value={isDarkMode} />
                            </View>
                        </View>
                    </View>
                    <View style={styles.card}>
                        <View style={styles.cardHeader}><Text style={styles.cardTitle}>Notifications</Text></View>
                        <View style={styles.cardContent}>
                            <View style={styles.menuItem}>
                                <Ionicons name="book-outline" size={responsiveSize(22)} color={theme.primary} style={styles.menuIcon} />
                                <Text style={styles.menuItemText}>Daily Verse Reminder</Text>
                                <Switch onValueChange={(v) => updateSetting('dailyVerseReminder', v)} value={settings.dailyVerseReminder} trackColor={{ false: "#767577", true: theme.primary }} thumbColor={settings.dailyVerseReminder ? "#000" : "#f4f3f4"} />
                            </View>
                            <View style={styles.menuDivider} />
                            <View style={styles.menuItem}>
                                <Ionicons name="videocam-outline" size={responsiveSize(22)} color={theme.primary} style={styles.menuIcon} />
                                <Text style={styles.menuItemText}>Live Stream Alerts</Text>
                                <Switch onValueChange={(v) => updateSetting('liveStreamAlerts', v)} value={settings.liveStreamAlerts} trackColor={{ false: "#767577", true: theme.primary }} thumbColor={settings.liveStreamAlerts ? "#000" : "#f4f3f4"} />
                            </View>
                            <View style={styles.menuDivider} />
                            <View style={styles.menuItem}>
                                <Ionicons name="calendar-outline" size={responsiveSize(22)} color={theme.primary} style={styles.menuIcon} />
                                <Text style={styles.menuItemText}>Special Events</Text>
                                <Switch onValueChange={(v) => updateSetting('specialEvents', v)} value={settings.specialEvents} trackColor={{ false: "#767577", true: theme.primary }} thumbColor={settings.specialEvents ? "#000" : "#f4f3f4"} />
                            </View>
                        </View>
                    </View>
                </ScrollView>
            </SafeAreaView>

            <Modal animationType="slide" transparent={true} visible={isLanguageModalVisible} onRequestClose={() => setLanguageModalVisible(false)}>
                <TouchableOpacity style={styles.modalBackdrop} onPress={() => setLanguageModalVisible(false)} activeOpacity={1}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Select Language</Text>
                        <FlatList
                            data={languages}
                            keyExtractor={(item) => item.code}
                            renderItem={({ item }) => (
                                <TouchableOpacity style={styles.languageOption} onPress={() => handleLanguageSelect(item.code)}>
                                    <Text style={styles.languageText}>{item.name}</Text>
                                    {settings.language === item.code && <Ionicons name="checkmark-circle" size={responsiveSize(24)} color={theme.primary} />}
                                </TouchableOpacity>
                            )}
                            ItemSeparatorComponent={() => <View style={styles.menuDivider} />}
                        />
                    </View>
                </TouchableOpacity>
            </Modal>
        </View>
    );
}

const getStyles = (theme: any) => StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background },
    scrollContent: { padding: responsiveSize(20), gap: responsiveSize(20) },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.background },
    card: { backgroundColor: theme.card, borderRadius: responsiveSize(16), borderWidth: 1, borderColor: theme.border },
    cardHeader: { padding: responsiveSize(20), borderBottomWidth: 1, borderBottomColor: theme.border },
    cardTitle: { fontSize: responsiveSize(18), fontWeight: '700', color: theme.text },
    cardContent: { padding: responsiveSize(20), gap: responsiveSize(16) },
    menuItem: { flexDirection: 'row', alignItems: 'center' },
    menuIcon: { marginRight: responsiveSize(16) },
    menuItemText: { fontSize: responsiveSize(16), color: theme.text, fontWeight: '600', flex: 1 },
    menuItemValue: { fontSize: responsiveSize(16), color: theme.textSecondary, fontWeight: '500', marginRight: responsiveSize(8) },
    menuDivider: { height: 1, backgroundColor: theme.border, marginVertical: responsiveSize(8) },
    modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: theme.card, borderTopLeftRadius: responsiveSize(20), borderTopRightRadius: responsiveSize(20), padding: responsiveSize(20), maxHeight: '50%' },
    modalTitle: { fontSize: responsiveSize(20), fontWeight: 'bold', color: theme.text, marginBottom: responsiveSize(20), textAlign: 'center' },
    languageOption: { flexDirection: 'row', alignItems: 'center', paddingVertical: responsiveSize(16) },
    languageText: { fontSize: responsiveSize(18), color: theme.text, flex: 1 },
});
