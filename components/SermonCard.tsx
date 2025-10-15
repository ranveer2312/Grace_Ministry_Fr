import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, Linking, Alert } from 'react-native';

type SermonCardProps = {
  imageUrl: string;
  title: string;
  pastor: string;
  videoId: string;
};

export default function SermonCard({ imageUrl, title, pastor, videoId }: SermonCardProps) {
  const handlePress = async () => {
    const youtubeUrl = `https://www.youtube.com/watch?v=${videoId}`;
    await Linking.openURL(youtubeUrl).catch(err => Alert.alert("Error", "Could not open video."));
  };

  return (
    <TouchableOpacity style={styles.cardContainer} onPress={handlePress}>
      <Image source={{ uri: imageUrl }} style={styles.thumbnail} />
      <View style={styles.textContainer}>
        {/* We use numberOfLines to prevent very long titles from breaking the layout */}
        <Text style={styles.title} numberOfLines={2}>{title}</Text>
        <Text style={styles.pastor}>{pastor}</Text>
      </View>
    </TouchableOpacity>
  );
}

// These styles are now consistent with the All Sermons screen
const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 20,
    marginHorizontal: 16, // Use margin for spacing
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  thumbnail: {
    width: '100%',
    height: 180,
  },
  textContainer: {
    padding: 15,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4, // Add a little space
  },
  pastor: {
    fontSize: 14,
    color: 'gray',
  },
});