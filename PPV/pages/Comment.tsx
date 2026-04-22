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
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { pb, getUserID } from '../lib/pocketbase';
import { Ionicons } from '@expo/vector-icons';
import { styles } from '../global';
import { useTheme } from '../lib/ThemeContext';
import { useHeaderHeight } from '@react-navigation/elements';

type Props = {
  visible: boolean;
  onClose: () => void;
  imageId: string;
};

export default function CommentModal({ visible, onClose, imageId }: Props) {
  const [text, setText] = useState('');
  const [comments, setComments] = useState<any[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [status, setStatus] = useState({ text: '', color: '' });
  const headerHeight = useHeaderHeight();

  
  const { theme } = useTheme();
  const accentColor = theme.tabBar;
  const bgColor = theme.gradient[0];

  const fetchComments = async () => {
    try {
      const result = await pb.collection('comments').getList(1, 50, {
        filter: `image="${imageId}"`,
      });

      setComments(result.items);
    } catch (err) {
      console.log('Error fetching comments:', err);
      setStatus({ text: 'Virhe: ' + err, color: 'red' });
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
    if (item.user !== currentUserId) {setStatus({text: "Virhe: Tämä ei ole sinun kommentisi", color: "red"}); return;}
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
              setStatus({ text: '', color: 'red' });

            } catch (err) {
              console.error('Error deleting comment:', err);
              setStatus({ text: 'Virhe: ' + err, color: 'red' });
            }
          },
        },
      ],
    );
    Keyboard.dismiss();
  };

  const handleCommentSubmit = async () => {
    if (!text.trim()) { setStatus({text: "Virhe: Tekstikenttä on tyhjä", color: "red"}); return; }

    try {
      const userPbId = await resolveUserPbId();
      await pb.collection('comments').create({
        comment: text,
        image: imageId,
        user: userPbId,
      });

      setText('');
      fetchComments();
      Keyboard.dismiss();
      setStatus({ text: 'Kommentti lähetetty!', color: 'green' });
    } catch (err) {
      console.error('Error posting comment:', err);
      setStatus({ text: 'Virhe: ' + err, color: 'red' });
    }
  };
  useEffect(() => {
    if (visible) {
      fetchComments();
      resolveUserPbId().then((id) => setCurrentUserId(id));
    }
  }, [visible, imageId]);

  const handleChange = (e: string) => {
    setStatus({ text: '', color: 'red' });
    setText(e);
  };

  return (
    <Modal transparent visible={visible} animationType="slide">
      <View style={[{ paddingBottom: headerHeight }, modalStyles.commentView]}>
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={StyleSheet.absoluteFillObject} />
        </TouchableWithoutFeedback>
        <View style={[modalStyles.modalView, { backgroundColor: bgColor }]}>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              marginBottom: 10,
            }}
          >
            <Text style={[styles.text, modalStyles.title]}>Kommentit</Text>
            <Pressable hitSlop={50} onPress={onClose}>
              <Ionicons name="close-circle" size={30} color={'black'} />
            </Pressable>
          </View>

          <View
            style={{ flexDirection: 'row', alignItems: 'stretch', gap: 10 }}
          >
            <TextInput
              maxLength={256}
              multiline
              style={[
                styles.text,
                styles.commentInput,
                {
                  flex: 1,
                  borderColor: '#000',
                  borderWidth: 2,
                },
              ]}
              value={text}
              onChangeText={handleChange}
              placeholder="Kirjoita kommentti..."
              placeholderTextColor="#000"
            />

            <Pressable
              style={[modalStyles.button, { backgroundColor: accentColor }]}
              onPress={handleCommentSubmit}
            >
              <Text style={[styles.text, modalStyles.buttonText]}>Lähetä</Text>
            </Pressable>
          </View>

          <Text
            style={[styles.text, { textAlign: 'center', color: status.color }]}
          >
            {status.text}
          </Text>

          <FlatList
            keyboardShouldPersistTaps={'handled'}
            showsVerticalScrollIndicator={false}
            data={comments}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View
                style={[
                  modalStyles.commentText,
                  {
                    minHeight: 60,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  },
                ]}
              >
                <Text style={styles.text}>{item.comment}</Text>
                {item.user == currentUserId && (
                  <Ionicons
                    onPress={() => handleDeleteComment(item)}
                    name="trash"
                    size={28}
                  />
                )}
              </View>
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
    marginTop: 0,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#000',
    paddingHorizontal: 30,
    height: 45,
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
  },
});
