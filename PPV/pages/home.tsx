import { StatusBar } from 'expo-status-bar';
import { Text, View, Image, ImageBackground, ScrollView } from 'react-native';
import { styles } from '../global';
import PocketBase from 'pocketbase';

import { useCallback, useEffect, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';

const pb = new PocketBase('https://pocketbase.misteri.fi');

export default function Home() {
  const [message, setMessage] = useState('');
  const [image1, setImage1] = useState('');
  const [image2, setImage2] = useState('');

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
    const first = await pb.collection('feed_images').getList(1, 1);
    const total = first.totalItems;

    if (total === 0) return;

    const index1 = Math.floor(Math.random() * total);
    let index2 = Math.floor(Math.random() * total);

    while (index2 === index1) {
      index2 = Math.floor(Math.random() * total);
    }

    const res1 = await pb.collection('feed_images').getList(index1 + 1, 1);
    const res2 = await pb.collection('feed_images').getList(index2 + 1, 1);

    const img1 = res1.items[0];
    const img2 = res2.items[0];

    setImage1(pb.files.getURL(img1, img1.image));
    setImage2(pb.files.getURL(img2, img2.image));

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
      
        <View style={styles.TextContainer}>
          <Text style={styles.textStyle}>{message}</Text>
        </View>
        <View style={styles.imageContainer}>

          {image1 && <Image 
          source={{ uri: image1 }} 
          style={styles.imageStyle} />}

        </View>
        <View style={styles.imageContainer}>
         
          {image2 && <Image 
          source={{ uri: image2 }} 
          style={styles.imageStyle} />}
          
        </View>
        <StatusBar style="auto" />
     
    </ScrollView>
  );
}
