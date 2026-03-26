import React, { useEffect, useState } from 'react';
import { View, TextInput, Button, ImageBackground } from 'react-native';
import PocketBase from 'pocketbase';
import { styles } from '../global';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';

export default function WritePage() {
  const [message, setMessage] = useState('');
  const pb = new PocketBase('https://pocketbase.misteri.fi');

  const handleSubmit = async () => {
    if (message.trim() === '') {
      return;
    }
    try {
      await pb.collection('messages').create({ msg: message });
      setMessage('');
    } catch (err) {
      console.error(err);
    }
  };

  const handleChange = (e: string) => {
    if (!e) return;
    e = e.replace(/[\r\n]+/g, '\n');

    const lines = e.split('\n');
    if (lines.length > 10) {
      return;
    }
    setMessage(e);
  };

  return (
    <KeyboardAwareScrollView>
      <View style={{ flex: 1, justifyContent: 'center', padding: 20 }}>
        <View style={styles.TextContainer}>
          <TextInput
            maxLength={256}
            multiline={true}
            numberOfLines={10}
            value={message}
            onChangeText={handleChange}
            placeholder="Write your positive message here..."
          />
        </View>
        <Button title="Send your letter" onPress={handleSubmit} />
      </View>
    </KeyboardAwareScrollView>
  );
}
