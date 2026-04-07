import { StatusBar } from 'expo-status-bar';
import {
  Text,
  View,
  Image,
  ImageBackground,
  ScrollView,
  TextInput,
  Button,
  Pressable,
} from 'react-native';
import { styles } from '../global';
import PocketBase, { RecordModel } from 'pocketbase';
import { useCallback, useEffect, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  pb,
  loadLikedFeedImageIds,
  toggleFeedImageLike,
} from '../lib/Pocketbase';
import { Ionicons } from '@expo/vector-icons';
import CommentModal from './comment';

export default function Home() {
  const [message, setMessage] = useState('');
  const [images, setImages] = useState<RecordModel[]>([]);
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const [likeCounts, setLikeCounts] = useState<Record<string, number>>({});
  const [commentCounts, setCommentCounts] = useState<Record<string, number>>(
    {},
  );

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
      const first = await pb
        .collection('feed_images')
        .getFullList({ sort: '-created' });
      setImages(first);
      const liked = await loadLikedFeedImageIds();
      setLikedIds(liked);
      const counts: Record<string, number> = {};
      const cCounts: Record<string, number> = {};
      await Promise.all(
        first.map(async (img) => {
          const [likesRes, commentsRes] = await Promise.all([
            pb
              .collection('likes')
              .getList(1, 1, { filter: `feed_image="${img.id}"` }),
            pb
              .collection('comments')
              .getList(1, 1, { filter: `image="${img.id}"` }),
          ]);
          counts[img.id] = likesRes.totalItems;
          cCounts[img.id] = commentsRes.totalItems;
        }),
      );
      setLikeCounts(counts);
      setCommentCounts(cCounts);
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
      <Text
        style={{
          fontSize: 16,
          color: '#555',
          paddingHorizontal: 20,
          marginTop: 20,
        }}
      >
        Heres a positive message for you made by one of our users to brighten up
        your day!
      </Text>
      <View style={styles.TextContainer}>
        <Text style={styles.textStyle}>{message}</Text>
      </View>
      <Text
        style={{
          fontSize: 16,
          color: '#555',
          marginBottom: 10,
          paddingHorizontal: 20,
        }}
      >
        Here you can see the latest images uploaded by our users. Feel free to
        use the camera to share your own positive moments!
      </Text>
      {images.map((image) => (
        <View style={styles.imageContainer} key={image.id}>
          <Image
            source={{ uri: pb.files.getURL(image, image.image) }}
            style={styles.imageStyle}
          />

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Pressable
              onPress={() => {
                const isLiked = likedIds.has(image.id);
                const newLiked = new Set(likedIds);
                if (isLiked) newLiked.delete(image.id);
                else newLiked.add(image.id);
                setLikedIds(newLiked);
                toggleFeedImageLike(image.id, !isLiked)
                  .then((n) =>
                    setLikeCounts((prev) => ({ ...prev, [image.id]: n })),
                  )
                  .catch(() => setLikedIds(likedIds));
              }}
            >
              <Ionicons
                name={likedIds.has(image.id) ? 'heart' : 'heart-outline'}
                size={40}
                color={likedIds.has(image.id) ? '#e53935' : 'black'}
              />
            </Pressable>
            <Text style={{ fontSize: 16, color: '#555' }}>
              {likeCounts[image.id] ?? 0}
            </Text>
            <Pressable onPress={() => setSelectedImageId(image.id)}>
              <Ionicons
                name="chatbubble-ellipses-outline"
                size={40}
                color="black"
              />
            </Pressable>
            <Text style={{ fontSize: 16, color: '#555' }}>
              {commentCounts[image.id] ?? 0}
            </Text>
          </View>

          <CommentModal
            visible={selectedImageId === image.id}
            onClose={() => setSelectedImageId(null)}
            imageId={image.id}
          />
        </View>
      ))}

      <StatusBar style="auto" />
    </ScrollView>
  );
}
