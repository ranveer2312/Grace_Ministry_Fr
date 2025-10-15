import React from 'react';
import { View, Text, Image, StyleSheet, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

// --- Responsive Scaling Utility ---
// We define a base width from a standard phone screen size.
const guidelineBaseWidth = 375;

/**
 * A function to scale sizes based on the screen width.
 * This makes fonts, images, and padding responsive.
 * @param size The original size in pixels for the base screen width.
 * @returns The scaled size for the current device screen width.
 */
const scale = (size: number) => (width / guidelineBaseWidth) * size;

// We can also create a function for fonts that might need a moderation factor,
// but for this component, direct scaling is sufficient.
const moderateScale = (size: number, factor = 0.5) => size + (scale(size) - size) * factor;


export default function Header() {
  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>
        <View style={styles.backgroundSlice} />
        <View style={styles.headerContent}>
          <View style={styles.leftContainer}>
            <Image
              source={require('../assets/globe1.png')}
              style={styles.globeImage}
            />
            <View>
              <Text style={styles.mainTitle}>Grace Ministry</Text>
              <Text style={styles.subtitle}>INTERNATIONAL</Text>
            </View>
          </View>
          <Image
            source={require('../assets/pastorphoto.jpg')}
            style={styles.pastorImage}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

// --- Styles are now using the scaling utility ---
const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: '#1C1C1E',
  },
  container: {
    backgroundColor: '#000',
    minHeight: scale(70), // Scaled
  },
  backgroundSlice: {
    backgroundColor: '#1C1C1E',
    position: 'absolute',
    height: scale(120), // Scaled
    width: width * 1.2,
    top: scale(-30), // Scaled
    left: scale(-20), // Scaled
    transform: [{ rotate: '-12deg' }],
    borderBottomWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.15)',
  },
  headerContent: {
    height: scale(60), // Scaled
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: scale(20), // Scaled
    paddingBottom: scale(5), // Scaled
  },
  leftContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  globeImage: {
    width: scale(32), // Scaled
    height: scale(32), // Scaled
    marginRight: scale(10), // Scaled
  },
  mainTitle: {
    fontSize: moderateScale(18), // Scaled for font
    fontWeight: '700',
    color: '#FFF',
    letterSpacing: 0.3,
  },
  subtitle: {
    fontSize: moderateScale(10), // Scaled for font
    color: '#FFD700',
    letterSpacing: 1.2,
    fontWeight: '500',
  },
  pastorImage: {
    width: scale(50), // Scaled
    height: scale(50), // Scaled
    borderRadius: scale(25), // Scaled
    borderWidth: scale(2.5), // Scaled
    borderColor: '#FFD700',
    resizeMode: 'cover',
  },
});

