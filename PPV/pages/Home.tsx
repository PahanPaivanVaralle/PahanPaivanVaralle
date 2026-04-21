import { StatusBar } from 'expo-status-bar';
import { Text, View, Image, Pressable, FlatList, ActivityIndicator } from 'react-native';
import { styles } from '../global';
import PocketBase, { RecordModel } from 'pocketbase';
import { useHeaderHeight } from '@react-navigation/elements';
import { useCallback, useEffect, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  pb,
  loadLikedFeedImageIds,
  toggleFeedImageLike,
} from '../lib/pocketbase';
import { Ionicons } from '@expo/vector-icons';
import CommentModal from './Comment';
import { useTheme } from '../lib/ThemeContext';

export default function Home() {
  const [loading, setLoading] = useState(true);
  const { theme } = useTheme();
  const headerHeight = useHeaderHeight();
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
            pb.collection('likes').getList(1, 1, {
              filter: `feed_image="${img.id}"`,
            }),
            pb.collection('comments').getList(1, 1, {
              filter: `image="${img.id}"`,
            }),
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
      setLoading(true);
      fetchMessage();
      fetchImage();
      setLoading(false);
    }, []),
  );

  const renderItem = ({ item }) => (
    <View style={styles.imageContainer}>
      <Image
        source={{ uri: pb.files.getURL(item, item.image) }}
        style={styles.imageStyle}
      />

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <Pressable
          onPress={() => {
            const isLiked = likedIds.has(item.id);
            const newLiked = new Set(likedIds);

            if (isLiked) newLiked.delete(item.id);
            else newLiked.add(item.id);

            setLikedIds(newLiked);

            toggleFeedImageLike(item.id, !isLiked)
              .then((n) => setLikeCounts((prev) => ({ ...prev, [item.id]: n })))
              .catch(() => setLikedIds(likedIds));
          }}
        >
          <Ionicons
            name={likedIds.has(item.id) ? 'heart' : 'heart-outline'}
            size={40}
            color={likedIds.has(item.id) ? '#e53935' : 'black'}
          />
        </Pressable>

        <Text style={[styles.text, styles.postInteractionText]}>
          {likeCounts[item.id] ?? 0}
        </Text>

        <Pressable onPress={() => setSelectedImageId(item.id)}>
          <Ionicons
            name="chatbubble-ellipses-outline"
            size={40}
            color="black"
          />
        </Pressable>

        <Text style={[styles.text, styles.postInteractionText]}>
          {commentCounts[item.id] ?? 0}
        </Text>
      </View>

      <CommentModal
        visible={selectedImageId === item.id}
        onClose={() => setSelectedImageId(null)}
        imageId={item.id}
      />
    </View>
  );

  return (
    <FlatList
      data={images}
      keyExtractor={(item) => item.id}
      renderItem={renderItem}
      contentContainerStyle={{ paddingBottom: headerHeight }}
      ListHeaderComponent={
        <>
          <Text style={[styles.text, styles.header]}>
            Tässä toisen käyttäjän kirjoittama positiivinen viesti piristääksesi
            päivääsi!
          </Text>

          {loading && (
            <View style={{ alignItems: 'center', marginTop: 80 }}>
              <ActivityIndicator size="large" color={theme.spinner} />
            </View>
          )}

          <View style={styles.textContainer}>
            <Text style={[styles.text, styles.letterText]}>{message}</Text>
          </View>

          <Text style={[styles.text, styles.header]}>
            Täältä löydät uusimmat käyttäjien lähettämät kuvat. Jaa omat
            positiiviset hetkesi käyttämällä kameraa!
          </Text>
        </>
      }
      ListFooterComponent={<StatusBar style="auto" />}
    />
  );
}
