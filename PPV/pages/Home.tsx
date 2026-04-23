import { StatusBar } from 'expo-status-bar';
import {
  Text,
  View,
  Image,
  Pressable,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { styles } from '../global';
import { RecordModel } from 'pocketbase';
import { useHeaderHeight } from '@react-navigation/elements';
import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  pb,
  loadLikedFeedImageIds,
  toggleFeedImageLike,
  getUserID,
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
  const [enlargedImage, setEnlargedImage] = useState('');

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

  const handleReport = async () => {
      if (message.trim() === '') {
        return;
      }
      try {
        const userPbId = await resolveUserPbId();
        const messageId = await resolveMessageId();
        if (!userPbId) {
          throw new Error('Käyttäjätunnusta ei löytynyt');
        }
        await pb.collection('reported_messages').create({ msg: message, user: userPbId, reported_id: messageId });
        setMessage('');
      } catch (err) {
        console.error(err);
      }
    };

    const resolveMessageId = async (): Promise<string | null> => {
      try {
        const res = await pb.collection('messages').getList(1, 1, { filter: `msg="${message}"` });
        return res.items[0]?.id ?? null;
      } catch {
        return null;
      }
    };

    const resolveUserPbId = async (): Promise<string | null> => {
      const uid = await getUserID();
      if (!uid) return null;
      try {
        const res = await pb
          .collection('users')
          .getList(1, 1, { filter: `userid="${uid}"` });
        return res.items[0]?.id ?? null;
      } catch {
        return null;
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
      let isActive = true;

      const load = async () => {
        setLoading(true);
        await Promise.all([fetchMessage(), fetchImage()]);
        if (isActive) setLoading(false);
      };

      load();

      return () => {
        isActive = false;
      };
    }, []),
  );

  const renderItem = ({ item }) => (
    <View style={styles.imageContainer}>
      <Pressable
        onPress={() => setEnlargedImage(pb.files.getURL(item, item.image))}
      >
        <Image
          source={{ uri: pb.files.getURL(item, item.image) }}
          style={[styles.imageStyle, {}]}
        />
      </Pressable>

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
    <View style={{ flex: 1 }}>
      <FlatList
        keyboardShouldPersistTaps={"handled"}
        data={images}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: headerHeight }}
        ListHeaderComponent={
          <>
            <Text style={[styles.text, styles.header]}>
              Tässä toisen käyttäjän kirjoittama positiivinen viesti
              piristääksesi päivääsi!
            </Text>

            <View style={styles.textContainer}>
              {loading ? (
                //<ActivityIndicator animating={true} size="large" color={theme.spinner} />
                <Image
                  source={require('../assets/loading.gif')}
                  style={{alignSelf: "center"}}
                ></Image>
              ) : (
                <Text style={[styles.text, styles.letterText]}>{message}</Text>
              )}
            </View>

            <Text style={[styles.text, styles.header]}>
              Täältä löydät uusimmat käyttäjien lähettämät kuvat. Jaa omat
              positiiviset hetkesi käyttämällä kameraa!
            </Text>
          </>
        }
        ListFooterComponent={<StatusBar style="auto" />}
      />

      {enlargedImage ? (
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 999,
          }}
        >
          <Pressable
            onPress={() => setEnlargedImage('')}
            style={{
              flex: 1,
              backgroundColor: 'rgba(0,0,0,0.8)',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Image
              source={{ uri: enlargedImage }}
              style={{
                width: '90%',
                height: '70%',
                resizeMode: 'contain',
              }}
            />
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}
