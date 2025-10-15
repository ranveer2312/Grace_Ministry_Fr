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
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebaseConfig';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export default function SignUpScreen({ navigation }: any) {
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [mobNo, setMobNo] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPasswd, setConfirmPasswd] = useState('');
    
    // New state for better UX
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const [focusedField, setFocusedField] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleSignUp = () => {
        if (!firstName || !lastName || !mobNo || !email || !password || !confirmPasswd) {
            Alert.alert('Missing Information', 'Please fill out all fields.');
            return;
        }
        if (password !== confirmPasswd) {
            Alert.alert('Password Mismatch', 'The passwords you entered do not match.');
            return;
        }

        setLoading(true);
        createUserWithEmailAndPassword(auth, email, password)
            .then(async (userCredentials) => {
                const user = userCredentials.user;
                await updateProfile(user, { displayName: `${firstName} ${lastName}` });
                const userDocRef = doc(db, "users", user.uid);
                await setDoc(userDocRef, {
                    firstName: firstName,
                    lastName: lastName,
                    mobileNumber: mobNo,
                    email: user.email,
                    uid: user.uid
                });
                // No navigation needed, listener in AuthContext will handle it
            })
            .catch(error => Alert.alert('Sign Up Error', error.message))
            .finally(() => setLoading(false));
    };

    return (
        <LinearGradient colors={['#111111', '#000000']} style={styles.container}>
            <SafeAreaView style={{flex: 1}}>
                <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps='handled'>
                    
                    {/* Header Section */}
                    <View style={styles.headerSection}>
                        <View style={styles.iconContainer}>
                            <Ionicons name="person-add-outline" size={32} color="#FFD700" />
                        </View>
                        <Text style={styles.title}>Join Grace Ministry</Text>
                        <Text style={styles.subtitle}>Create your account to begin your journey.</Text>
                    </View>

                    {/* Input Fields */}
                    <View style={styles.inputGroup}>
                        <View style={[styles.inputContainer, focusedField === 'firstName' && styles.inputContainerFocused]}>
                            <Ionicons name="person-outline" size={20} color="#666" style={styles.inputIcon} />
                            <TextInput style={styles.input} placeholder="First Name" placeholderTextColor="#666" value={firstName} onChangeText={setFirstName} onFocus={() => setFocusedField('firstName')} onBlur={() => setFocusedField(null)} />
                        </View>
                        <View style={[styles.inputContainer, focusedField === 'lastName' && styles.inputContainerFocused]}>
                            <Ionicons name="person-outline" size={20} color="#666" style={styles.inputIcon} />
                            <TextInput style={styles.input} placeholder="Last Name" placeholderTextColor="#666" value={lastName} onChangeText={setLastName} onFocus={() => setFocusedField('lastName')} onBlur={() => setFocusedField(null)} />
                        </View>
                        <View style={[styles.inputContainer, focusedField === 'mobNo' && styles.inputContainerFocused]}>
                            <Ionicons name="call-outline" size={20} color="#666" style={styles.inputIcon} />
                            <TextInput style={styles.input} placeholder="Mobile Number" placeholderTextColor="#666" value={mobNo} onChangeText={setMobNo} keyboardType="phone-pad" onFocus={() => setFocusedField('mobNo')} onBlur={() => setFocusedField(null)} />
                        </View>
                        <View style={[styles.inputContainer, focusedField === 'email' && styles.inputContainerFocused]}>
                            <Ionicons name="mail-outline" size={20} color="#666" style={styles.inputIcon} />
                            <TextInput style={styles.input} placeholder="Email" placeholderTextColor="#666" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" onFocus={() => setFocusedField('email')} onBlur={() => setFocusedField(null)} />
                        </View>
                        <View style={[styles.inputContainer, focusedField === 'password' && styles.inputContainerFocused]}>
                            <Ionicons name="lock-closed-outline" size={20} color="#666" style={styles.inputIcon} />
                            <TextInput style={styles.input} placeholder="Password" placeholderTextColor="#666" value={password} onChangeText={setPassword} secureTextEntry={!isPasswordVisible} onFocus={() => setFocusedField('password')} onBlur={() => setFocusedField(null)} />
                            <TouchableOpacity onPress={() => setIsPasswordVisible(!isPasswordVisible)}>
                                <Ionicons name={isPasswordVisible ? "eye-off-outline" : "eye-outline"} size={22} color="#666" style={styles.eyeIcon} />
                            </TouchableOpacity>
                        </View>
                        <View style={[styles.inputContainer, focusedField === 'confirmPasswd' && styles.inputContainerFocused]}>
                            <Ionicons name="lock-closed-outline" size={20} color="#666" style={styles.inputIcon} />
                            <TextInput style={styles.input} placeholder="Confirm Password" placeholderTextColor="#666" value={confirmPasswd} onChangeText={setConfirmPasswd} secureTextEntry={!isPasswordVisible} onFocus={() => setFocusedField('confirmPasswd')} onBlur={() => setFocusedField(null)} />
                            {password === confirmPasswd && confirmPasswd.length > 0 && (
                                <Ionicons name="checkmark-circle" size={22} color="#2ecc71" style={styles.eyeIcon} />
                            )}
                        </View>
                    </View>

                    {/* Sign Up Button */}
                    <TouchableOpacity style={styles.buttonWrapper} onPress={handleSignUp} disabled={loading}>
                        <LinearGradient 
                            colors={['#FFD700', '#FFA500']} 
                            style={styles.button}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                        >
                            {loading ? (
                                <ActivityIndicator color="#000" />
                            ) : (
                                <Text style={styles.buttonText}>Create Account</Text>
                            )}
                        </LinearGradient>
                    </TouchableOpacity>

                    {/* Switch to Sign In */}
                    <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                        <Text style={styles.switchText}>
                            Already have an account? <Text style={styles.switchLink}>Sign In</Text>
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
        marginBottom: 24,
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