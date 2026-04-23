import React, { useEffect, useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  Keyboard,
} from 'react-native';
import { pb } from '../lib/pocketbase';
import { styles } from '../global';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { useTheme } from '../lib/ThemeContext';

export default function WritePage() {
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState({ text: '', color: '' });
  const { theme } = useTheme();

  const handleSubmit = async () => {
    if (message.trim() === '') {
      return setStatus({text: "Virhe: Viestikenttä on tyhjä", color: "red"});
    }

    const e = message.replace(/[\r\n]+/g, '\n');

    try {
      await pb.collection('messages').create({ msg: e });
      setMessage('');
      setStatus({text: "Viesti lähetetty!", color: "green"});
      Keyboard.dismiss();
    } catch (err) {
      console.error(err);
      setStatus({text: "Virhe: " + err, color: "red"});
    }
  };

  const handleChange = (e: string) => {
    setStatus({text: "", color: "red"});
    setMessage(e);
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

  return (
    <KeyboardAwareScrollView keyboardShouldPersistTaps={"handled"}>
      <View style={{ flex: 1, justifyContent: 'center', padding: 20 }}>
        <View style={styles.textContainer}>
          <TextInput
            style={[styles.text, { textAlign: 'center' }]}
            maxLength={256}
            multiline={true}
            numberOfLines={10}
            value={message}
            onChangeText={handleChange}
            placeholderTextColor={'grey'}
            placeholder="Kirjoita positiivinen viesti tähän..."
          />
        </View>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: theme.button }]}
          onPress={handleSubmit}
        >
          <Text style={styles.text}>Lähetä kirje</Text>
        </TouchableOpacity>
        <Text
          style={[styles.text, { textAlign: 'center', color: status.color, top: 15 }]}
        >
          {status.text}
        </Text>
      </View>
    </KeyboardAwareScrollView>
  );
}
