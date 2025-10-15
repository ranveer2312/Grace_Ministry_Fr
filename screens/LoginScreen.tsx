import React, { useState } from 'react';
import { 
    View,
    Text, 
    TextInput, 
    TouchableOpacity, 
    StyleSheet, 
    Alert, 
    ScrollView,
    ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../firebaseConfig';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export default function LoginScreen({ navigation }: any) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    // New state for better UX
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const [focusedField, setFocusedField] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleLogin = () => {
        if (email.trim() === '' || password.trim() === '') {
            Alert.alert('Invalid Input', 'Please enter both email and password.');
            return;
        }
        setLoading(true);
        signInWithEmailAndPassword(auth, email, password)
            .catch(error => Alert.alert('Login Error', error.message))
            .finally(() => setLoading(false));
    };

    // New Feature: Forgot Password
    const handleForgotPassword = () => {
        if (email.trim() === '') {
            Alert.alert('Email Required', 'Please enter your email address to reset your password.');
            return;
        }
        sendPasswordResetEmail(auth, email)
            .then(() => {
                Alert.alert('Check Your Email', 'A password reset link has been sent to your email address.');
            })
            .catch(error => Alert.alert('Error', error.message));
    };

    return (
        <LinearGradient colors={['#111111', '#000000']} style={styles.container}>
            <SafeAreaView style={{ flex: 1 }}>
                <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps='handled'>

                    {/* Header Section */}
                    <View style={styles.headerSection}>
                        <View style={styles.iconContainer}>
                            <Ionicons name="key-outline" size={32} color="#FFD700" />
                        </View>
                        <Text style={styles.title}>Welcome Back</Text>
                        <Text style={styles.subtitle}>Sign in to continue your journey.</Text>
                    </View>

                    {/* Input Fields */}
                    <View style={styles.inputGroup}>
                        <View style={[styles.inputContainer, focusedField === 'email' && styles.inputContainerFocused]}>
                            <Ionicons name="mail-outline" size={20} color="#666" style={styles.inputIcon} />
                            <TextInput 
                                style={styles.input} 
                                placeholder="Email" 
                                placeholderTextColor="#666" 
                                value={email} 
                                onChangeText={setEmail} 
                                autoCapitalize="none" 
                                keyboardType="email-address" 
                                onFocus={() => setFocusedField('email')} 
                                onBlur={() => setFocusedField(null)} 
                            />
                        </View>
                        <View style={[styles.inputContainer, focusedField === 'password' && styles.inputContainerFocused]}>
                            <Ionicons name="lock-closed-outline" size={20} color="#666" style={styles.inputIcon} />
                            <TextInput 
                                style={styles.input} 
                                placeholder="Password" 
                                placeholderTextColor="#666" 
                                value={password} 
                                onChangeText={setPassword} 
                                secureTextEntry={!isPasswordVisible} 
                                onFocus={() => setFocusedField('password')} 
                                onBlur={() => setFocusedField(null)} 
                            />
                            <TouchableOpacity onPress={() => setIsPasswordVisible(!isPasswordVisible)}>
                                <Ionicons name={isPasswordVisible ? "eye-off-outline" : "eye-outline"} size={22} color="#666" style={styles.eyeIcon} />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Forgot Password Link */}
                    <TouchableOpacity onPress={handleForgotPassword}>
                        <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
                    </TouchableOpacity>

                    {/* Sign In Button */}
                    <TouchableOpacity style={styles.buttonWrapper} onPress={handleLogin} disabled={loading}>
                        <LinearGradient
                            colors={['#FFD700', '#FFA500']}
                            style={styles.button}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                        >
                            {loading ? (
                                <ActivityIndicator color="#000" />
                            ) : (
                                <Text style={styles.buttonText}>Sign In</Text>
                            )}
                        </LinearGradient>
                    </TouchableOpacity>

                    {/* Switch to Sign Up */}
                    <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
                        <Text style={styles.switchText}>
                            Don't have an account? <Text style={styles.switchLink}>Sign Up</Text>
                        </Text>
                    </TouchableOpacity>
                </ScrollView>
            </SafeAreaView>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        paddingHorizontal: 24,
        paddingVertical: 20,
    },
    headerSection: {
        alignItems: 'center',
        marginBottom: 32,
    },
    iconContainer: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: 'rgba(255, 215, 0, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
        borderWidth: 1,
        borderColor: 'rgba(255, 215, 0, 0.2)',
    },
    title: {
        fontSize: 28,
        fontWeight: '800',
        color: '#ffffff',
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 16,
        color: '#999',
        textAlign: 'center',
        marginTop: 8,
    },
    inputGroup: {
        gap: 16,
        marginBottom: 16,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1a1a1a',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    inputContainerFocused: {
        borderColor: '#FFD700',
    },
    inputIcon: {
        marginLeft: 16,
    },
    input: {
        flex: 1,
        padding: 16,
        fontSize: 16,
        color: '#ffffff',
    },
    eyeIcon: {
        marginRight: 16,
    },
    forgotPasswordText: {
        color: '#FFD700',
        fontSize: 14,
        textAlign: 'right',
        fontWeight: '600',
        marginBottom: 24,
    },
    buttonWrapper: {
        borderRadius: 12,
        elevation: 8,
        shadowColor: '#FFD700',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    button: {
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    buttonText: {
        color: '#000',
        fontSize: 18,
        fontWeight: 'bold',
    },
    switchText: {
        color: '#999',
        textAlign: 'center',
        marginTop: 24,
        fontSize: 16,
    },
    switchLink: {
        color: '#FFD700',
        fontWeight: 'bold',
    },
});