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
import { pb, getUserID } from '../lib/Pocketbase';
import { Ionicons } from '@expo/vector-icons';
import { styles } from '../global';

type Props = {
  visible: boolean;
  onClose: () => void;
  imageId: string;
};

export default function CommentModal({ visible, onClose, imageId }: Props) {
  const [text, setText] = useState('');
  const [comments, setComments] = useState<any[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

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
        <View style={modalStyles.modalView}>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 10,
            }}
          >
            <Text style={modalStyles.title}>Comments</Text>
            <Pressable onPress={onClose}>
              <Ionicons name="close-circle" size={30} color="#45ce9e" />
            </Pressable>
          </View>
          <TextInput
            maxLength={256}
            multiline
            style={styles.commentInput}
            value={text}
            onChangeText={setText}
            placeholder="Write your comment..."
          />

          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Pressable
              style={[modalStyles.button, { flex: 1 }]}
              onPress={handleCommentSubmit}
            >
              <Text style={modalStyles.buttonText}>Send</Text>
            </Pressable>

            <Pressable
              style={[modalStyles.button, { flex: 1 }]}
              onPress={onClose}
            >
              <Text style={modalStyles.buttonText}>Close</Text>
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
                <Text style={modalStyles.commentText}>{item.comment}</Text>
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
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    justifyContent: 'center',
  },
  commentText: {
    fontSize: 26,
    color: '#333',
    borderRadius: 10,
    borderWidth: 1,
    padding: 10,
    marginBottom: 10,
    marginTop: 10,
    borderColor: '#45ce9e',
  },
  button: {
    marginTop: 10,
    backgroundColor: '#45ce9e',
    padding: 15,
    borderRadius: 10,
    width: '50%',
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
  },
});
