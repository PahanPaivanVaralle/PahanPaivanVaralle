import React, { useEffect, useState } from 'react';
import {
  Alert,
  Modal,
  StyleSheet,
  Text,
  Pressable,
  View,
  TextInput,
  FlatList,
} from 'react-native';
import { pb, getUserID } from '../lib/pocketbase';
import { Ionicons } from '@expo/vector-icons';
import { styles } from '../global';
import { useTheme } from '../lib/ThemeContext';

type Props = {
  visible: boolean;
  onClose: () => void;
  imageId: string;
};

export default function CommentModal({ visible, onClose, imageId }: Props) {
  const [text, setText] = useState('');
  const [comments, setComments] = useState<any[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const { theme } = useTheme();
  const isDark = theme.name === 'Tumma';
  const textColor = isDark ? '#fff' : '#333';
  const accentColor = theme.tabBar;
  const bgColor = theme.gradient[0];
  const inputBg = isDark ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.9)';

  const fetchComments = async () => {
    try {
      const result = await pb.collection('comments').getList(1, 50, {
        filter: `image="${imageId}"`,
      });

      setComments(result.items);
    } catch (err) {
      console.log('Error fetching comments:', err);
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

  const handleDeleteComment = (item: any) => {
    if (item.user !== currentUserId) return;
    Alert.alert(
      'Poista kommentti',
      'Haluatko varmasti poistaa tämän kommentin?',
      [
        { text: 'Peruuta', style: 'cancel' },
        {
          text: 'Poista',
          style: 'destructive',
          onPress: async () => {
            try {
              await pb.collection('comments').delete(item.id);
              fetchComments();
            } catch (err) {
              console.error('Error deleting comment:', err);
            }
          },
        },
      ],
    );
  };

  const handleCommentSubmit = async () => {
    if (!text.trim()) return;

    try {
      const userPbId = await resolveUserPbId();
      await pb.collection('comments').create({
        comment: text,
        image: imageId,
        user: userPbId,
      });

      setText('');
      fetchComments();
    } catch (err) {
      console.error('Error posting comment:', err);
    }
  };
  useEffect(() => {
    if (visible) {
      fetchComments();
      resolveUserPbId().then((id) => setCurrentUserId(id));
    }
  }, [visible, imageId]);

  return (
    <Modal transparent visible={visible} animationType="slide">
      <View style={modalStyles.commentView}>
        <View style={[modalStyles.modalView, { backgroundColor: bgColor }]}>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 10,
            }}
          >
            <Text style={[styles.text, modalStyles.title]}>Comments</Text>
            <Text style={[styles.text, modalStyles.title, { color: textColor }]}>
              Comments
            </Text>
            <Pressable onPress={onClose}>
              <Ionicons name="close-circle" size={30} color={accentColor} />
            </Pressable>
          </View>
          <TextInput
            maxLength={256}
            multiline
            style={[
              styles.text,
              styles.commentInput,
              {
                backgroundColor: inputBg,
                borderColor: '#000',
                borderWidth: 2,
                color: textColor,
              },
            ]}
            value={text}
            onChangeText={setText}
            placeholder="Write your comment..."
            placeholderTextColor={
              isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.4)'
            }
          />

          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Pressable
              style={[
                modalStyles.button,
                { flex: 1, backgroundColor: accentColor },
              ]}
              onPress={onClose}
            >
              <Text style={[styles.text, modalStyles.buttonText]}>Send</Text>
              <Text style={[styles.text, modalStyles.buttonText]}>Close</Text>
            </Pressable>

            <Pressable
              style={[
                modalStyles.button,
                { flex: 1, backgroundColor: accentColor },
              ]}
              onPress={handleCommentSubmit}
            >
              <Text style={[styles.text, modalStyles.buttonText]}>Close</Text>
              <Text style={[styles.text, modalStyles.buttonText]}>Send</Text>
            </Pressable>
          </View>

          <FlatList
            data={comments}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <Pressable
                onLongPress={() => handleDeleteComment(item)}
                delayLongPress={500}
              >
                <Text style={[styles.text, modalStyles.commentText]}>
                <Text style={[styles.text, modalStyles.commentText, { color: textColor }]}>
                  {item.comment}
                </Text>
              </Pressable>
            )}
          />
        </View>
      </View>
    </Modal>
  );
}

const modalStyles = StyleSheet.create({
  commentView: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalView: {
    width: '100%',
    height: '80%',
    borderRadius: 20,
    padding: 20,
    borderWidth: 2,
    borderColor: '#000',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    justifyContent: 'center',
  },
  commentText: {
    fontSize: 26,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#000',
    padding: 10,
    marginBottom: 10,
    marginTop: 10,
  },
  button: {
    marginTop: 10,
    padding: 15,
    borderRadius: 10,
    width: '50%',
    borderWidth: 2,
    borderColor: '#000',
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
  },
});
