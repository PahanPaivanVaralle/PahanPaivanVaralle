import { StatusBar } from 'expo-status-bar';
import { Text, View, Image, ImageBackground, ScrollView } from 'react-native';
import { styles } from '../global';
import { RecordModel } from 'pocketbase';

import { useCallback, useEffect, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { pb } from "../lib/pocketbase"

export default function Home() {
  const [message, setMessage] = useState('');
  const [images, setImages] = useState<RecordModel[]>([]);
  

  const fetchMessage = async () => {
    try {
      const first = await pb.collection('messages').getList(1, 1);
      const total = first.totalItems;

      const randomIndex = Math.floor(Math.random() * total);

      const page = randomIndex + 1;
      const result = await pb.collection('messages').getList(page, 1);

      const randomMessage = result.items[0];
      setMessage(randomMessage.msg);
    } catch (err) {
      console.log('Error fetching positive message:', err);
    }
  };

  const fetchImage = async () => {
    try {
      const first = await pb.collection('feed_images').getFullList({ sort: '-created' });
      setImages(first);
    } catch (err) {
      console.log('Error fetching image:', err);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchMessage();
      fetchImage();
    }, []),
  );

  return (
    <ScrollView>
      <Text style={{ fontSize: 16, color: '#555', paddingHorizontal: 20, marginTop: 20 }}>
        Heres a positive message for you made by one of our users to brighten up your day!
      </Text>
      <View style={styles.TextContainer}>
        <Text style={styles.textStyle}>{message}</Text>
      </View>
      <Text style={{ fontSize: 16, color: '#555', marginBottom: 10, paddingHorizontal: 20 }}>
        Here you can see the latest images uploaded by our users. Feel free to use the camera to share your own positive moments!
      </Text>
      {images.map((image) => (
        <View style={styles.imageContainer} key={image.id}>
          <Image
            key={image.id}
            source={{ uri: pb.files.getURL(image, image.image) }}
            style={styles.imageStyle} />
        </View>
      ))}
      <StatusBar style="auto" />
    </ScrollView>
  );
}
