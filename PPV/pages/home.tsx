import { StatusBar } from 'expo-status-bar';
import { Text, View, Image } from 'react-native';
import {styles} from "../global";
import PocketBase from 'pocketbase';
import {useCallback, useEffect, useState} from "react";
import {useFocusEffect} from "@react-navigation/native";

const pb = new PocketBase("https://pocketbase.misteri.fi")

export default function Home() {

    const [message, setMessage] = useState("");

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
                console.log("Error fetching positive message:", err);
            }
        };

    useFocusEffect(
        useCallback(() => {
            fetchMessage();
        }, [])
    );

    return (
        
        <View style={styles.container}>
            <View style={styles.TextContainer}>
                <Text style={styles.textStyle}>
                    {message}
                </Text>
            </View>
            <View style={styles.imageContainer}>
                <Image
                    source={require('../assets/cat.png')}
                    style={styles.imageStyle}
                />
                <Image
                    source={require('../assets/icon.png')}
                    style={styles.imageStyle}
                />
            </View>
            <StatusBar style="auto" />
        </View>
    );
}
