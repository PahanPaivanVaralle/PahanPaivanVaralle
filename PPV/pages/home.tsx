import { StatusBar } from 'expo-status-bar';
import { Text, View, Image } from 'react-native';
import {styles} from "../global";
import PocketBase from 'pocketbase';
import {useEffect, useState} from "react";

const pb = new PocketBase('https://pocketbase.misteri.fi')

export default function Home() {

    const [token, setToken] = useState("");

    useEffect(() => {
        const login = async () => {
            try {
                const authData = await pb.collection("users")
                    .authWithPassword('xcodeyt@gmail.com', 'xzD%ZVn3mQKIEB');

                console.log(pb.authStore.isValid);
                console.log(pb.authStore.token);

                setToken(pb.authStore.token);
            } catch (err) {
                console.log("Login error:", err);
            }
        };

        login();
    }, []);

    return (
        
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
                <Image
                    source={require('../assets/icon.png')}
                    style={styles.imageStyle}
                />
            </View>
            <StatusBar style="auto" />
        </View>
    );
}
