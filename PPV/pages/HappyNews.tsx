import {
  Text,
  View,
  TouchableOpacity,
  Animated,
  Linking,
  Button,
} from 'react-native';
import { styles } from '../global';
import ScrollView = Animated.ScrollView;
import { getNews } from '../utils/newsSorter';
import React, { useEffect, useState } from 'react';
import { FeedItem } from 'react-native-rss-parser';
import { useHeaderHeight } from '@react-navigation/elements';

export default function HappyNews() {
  const [news, setNews] = useState<FeedItem[]>([]);
  const [translatedTitles, setTranslatedTitles] = useState<{
    [key: string]: string;
  }>({});
  const [translating, setTranslating] = useState(false);
  const headerHeight = useHeaderHeight();

  useEffect(() => {
    const load = async () => {
      const data = await getNews();
      setNews(data);
    };
    load();
  }, []);

  const translateItem = async (item: FeedItem) => {
    try {
      if (translatedTitles[item.id] || translating) return;
      setTranslating(true);
      const res = await fetch('https://ppv.misteri.fi/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          q: item.title,
        }),
      });

      const data = await res.json();
      console.log(data);

      const bestTranslation =
        data.alternatives?.reduce((longest: string, current: string) => {
          return current.length > longest.length ? current : longest;
        }, '') || data.translatedText;

      setTranslatedTitles((prev) => ({
        ...prev,
        [item.id]: bestTranslation || item.title,
      }));
      setTranslating(false);
    } catch (err) {
      console.log('Translate error:', err);
      setTranslating(false);
    }
  };

  return (
    <ScrollView
      contentContainerStyle={{
        paddingBottom: headerHeight,
      }}
    >
      {news.map((item) => {
        const titleToShow = translatedTitles[item.id] || item.title;

        return (
          <View key={item.id} style={styles.TextContainer}>
            <Text
              onPress={() =>
                Linking.openURL(
                  String(item.links.find((link) => link.url)?.url),
                )
              }
            >
              {titleToShow}
            </Text>
            <TouchableOpacity>
              <Button
                title={'Translate'}
                onPress={() => translateItem(item)}
              ></Button>
            </TouchableOpacity>
          </View>
        );
      })}
    </ScrollView>
  );
}
