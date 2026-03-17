import { StatusBar } from 'expo-status-bar';
import { Text, View, Image, ImageBackground, ScrollView } from 'react-native';
import { styles } from "../global";
import PocketBase from 'pocketbase';
import { useEffect, useState } from "react";

import {useCallback, useEffect, useState} from "react";
import {useFocusEffect} from "@react-navigation/native";

const pb = new PocketBase("https://pocketbase.misteri.fi")

export default function Home() {

    const image = require("../assets/sovelluksenTausta.jpg")
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
        login();
    }, []);
    
        useFocusEffect(
        useCallback(() => {
            fetchMessage();
        }, [])
    );

    return (

        <ImageBackground source={image} style={styles.imageBackground}>
            <ScrollView>
                <View style={styles.container}>
                    <View style={styles.TextContainer}>
                        <Text style={styles.textStyle}>
                            {pb.authStore.token.toString()}
                        </Text>
                    </View>

                    <View style={styles.imageContainer}>
                        <Image
                            source={require('../assets/cat.png')}
                            style={styles.imageStyle}
                        />
                    </View>
                    <View style={styles.imageContainer}>
                        <Image
                            source={require('../assets/icon.png')}
                            style={styles.imageStyle}
                        />
                    </View>
                    <StatusBar style="auto" />
                </View>
            </ScrollView>
        </ImageBackground>
    );
}
