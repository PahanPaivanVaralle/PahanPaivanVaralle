import React, { useEffect, useState } from 'react';
import { Modal, StyleSheet, Text, Pressable, View, TextInput, FlatList } from 'react-native';
import PocketBase from 'pocketbase';
import { styles } from '../global';

const pb = new PocketBase('https://pocketbase.misteri.fi');

type Props = {
    visible: boolean;
    onClose: () => void;
    imageId: string;
};

export default function CommentModal({ visible, onClose, imageId }: Props) {
    const [text, setText] = useState("");
    const [comments, setComments] = useState<any[]>([]);

    const fetchComments = async () => {
        try {
            const result = await pb.collection('comments').getList(1, 50, {
                filter: `image="${imageId}"`
            });

            setComments(result.items);
        } catch (err) {
            console.log('Error fetching comments:', err);
        }
    };


    const handleCommentSubmit = async () => {
        if (!text.trim()) return;

        try {
            await pb.collection('comments').create({
                comment: text,
                image: imageId
            });

            setText("");
            fetchComments();
        } catch (err) {
            console.error('Error posting comment:', err);
        }
    };
    useEffect(() => {
        if (visible) {
            fetchComments();
        }
    }, [visible, imageId]);


    return (
        <Modal transparent visible={visible} animationType="slide">
            <View style={modalStyles.commentView}>
                <View style={modalStyles.modalView}>

                    <Text style={modalStyles.title}>Comments</Text>
                    <TextInput
                        maxLength={256}
                        multiline
                        style={styles.commentInput}
                        value={text}
                        onChangeText={setText}
                        placeholder="Write your comment..."
                    />

                    <Pressable style={modalStyles.button} onPress={handleCommentSubmit}>
                        <Text style={modalStyles.buttonText}>Send</Text>
                    </Pressable>

                    <Pressable style={modalStyles.button} onPress={onClose}>
                        <Text style={modalStyles.buttonText}>Close</Text>
                    </Pressable>
                    
                    <FlatList
                        data={comments}
                        keyExtractor={(item) => item.id}
                        renderItem={({ item }) => (
                            <View style={{ marginBottom: 10 }}>
                                <Text style={modalStyles.commentText}>
                                    {item.comment}
                                </Text>

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
        marginTop : 10,
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
