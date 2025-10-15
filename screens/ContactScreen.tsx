import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
  ScrollView,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export default function ContactScreen() {
  // State for the form inputs
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  // Function to handle opening links
  const handleLinkPress = (url: string) => {
    Linking.canOpenURL(url).then(supported => {
      if (supported) {
        Linking.openURL(url);
      } else {
        Alert.alert("Error", `Don't know how to open this URL: ${url}`);
      }
    });
  };

  // Function to handle the form submission
  const handleSendMessage = () => {
    if (!name.trim() || !email.trim() || !message.trim()) {
      Alert.alert("Incomplete Form", "Please fill out all fields before sending.");
      return;
    }
    // For now, this just shows an alert. Later, this can be connected to a backend service.
    Alert.alert("Message Sent!", "Thank you for contacting us. We will get back to you shortly.");
    setName('');
    setEmail('');
    setMessage('');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <Text style={styles.title}>Get in Touch</Text>
          <Text style={styles.subtitle}>We'd love to hear from you. Reach out to us through any of the channels below.</Text>
        </View>

        {/* --- Contact Information Section --- */}
        <View style={styles.section}>
          <TouchableOpacity 
            style={styles.contactItem} 
            onPress={() => handleLinkPress('https://maps.google.com/?q=Grace+Ministry,Mangalore')}
            activeOpacity={0.7}
          >
            <Ionicons name="location-sharp" size={24} color="#FFD700" />
            <View style={styles.contactTextContainer}>
              <Text style={styles.contactLabel}>Our Location</Text>
              <Text style={styles.contactValue}>Grace Ministry, Mangalore</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#888" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.contactItem} 
            onPress={() => handleLinkPress('tel:+919900611485')}
            activeOpacity={0.7}
          >
            <Ionicons name="call" size={24} color="#FFD700" />
            <View style={styles.contactTextContainer}>
              <Text style={styles.contactLabel}>Phone Number</Text>
              <Text style={styles.contactValue}>+91 99006 11485</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#888" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.contactItem} 
            onPress={() => handleLinkPress('mailto:info@graceministry.org')}
            activeOpacity={0.7}
          >
            <Ionicons name="mail" size={24} color="#FFD700" />
            <View style={styles.contactTextContainer}>
              <Text style={styles.contactLabel}>Email Address</Text>
              <Text style={styles.contactValue}>info@graceministry.org</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#888" />
          </TouchableOpacity>
        </View>

        {/* --- Send a Message Form Section --- */}
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>Send a Message</Text>
            <TextInput
                style={styles.input}
                placeholder="Your Name"
                placeholderTextColor="#666"
                value={name}
                onChangeText={setName}
            />
            <TextInput
                style={styles.input}
                placeholder="Your Email"
                placeholderTextColor="#666"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
            />
            <TextInput
                style={[styles.input, styles.messageInput]}
                placeholder="Your Message..."
                placeholderTextColor="#666"
                multiline
                numberOfLines={5}
                value={message}
                onChangeText={setMessage}
            />
            <TouchableOpacity onPress={handleSendMessage} activeOpacity={0.8}>
                <LinearGradient
                    colors={['#FFD700', '#FFA500']}
                    style={styles.sendButton}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                >
                    <Text style={styles.sendButtonText}>Send Message</Text>
                    <Ionicons name="send" size={20} color="#000" />
                </LinearGradient>
            </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  scrollContainer: {
    paddingBottom: 40,
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 215, 0, 0.2)',
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#a0a0a0',
    fontWeight: '300',
    lineHeight: 24,
  },
  section: {
    marginTop: 30,
    paddingHorizontal: 20,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 10,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    gap: 16,
  },
  contactTextContainer: {
    flex: 1,
  },
  contactLabel: {
    fontSize: 12,
    color: '#888',
    fontWeight: '500',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  contactValue: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  input: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  messageInput: {
    height: 120,
    textAlignVertical: 'top', // For Android
  },
  sendButton: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 8,
    elevation: 8,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  sendButtonText: {
    color: '#000000',
    fontSize: 18,
    fontWeight: '800',
  },
});