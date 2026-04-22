import { Text, View, TouchableOpacity, Animated, Linking, ActivityIndicator, Image } from 'react-native';
import { styles } from '../global';
import ScrollView = Animated.ScrollView;
import { getNews } from '../utils/newsSorter';
import React, { useEffect, useState } from 'react';
import { FeedItem } from 'react-native-rss-parser';
import { useHeaderHeight } from '@react-navigation/elements';
import { useTheme } from '../lib/ThemeContext';

export default function HappyNews() {
  const [news, setNews] = useState<FeedItem[]>([]);
  const [translatedTitles, setTranslatedTitles] = useState<{
    [key: string]: {
      original: string;
      translated: string;
      isTranslated: boolean;
    };
  }>({});
  const [translating, setTranslating] = useState(false);
  const headerHeight = useHeaderHeight();
  const [loading, setLoading] = useState(true);
  const { theme } = useTheme();

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const data = await getNews();
      setNews(data);
      setLoading(false);
    };
    load();
  }, []);

  const translateItem = async (item: FeedItem) => {
    const existing = translatedTitles[item.id];

    if (existing) {
      setTranslatedTitles((prev) => ({
        ...prev,
        [item.id]: {
          ...existing,
          isTranslated: !existing.isTranslated,
        },
      }));
      return;
    }
    try {
      if (translating) return;
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
        [item.id]: {
          original: item.title,
          translated: bestTranslation || item.title,
          isTranslated: true,
        },
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
      <Text style={[styles.text, styles.header]}>
        Tässä iloisimmat uutiset ympäri maailmaa!
      </Text>

      {loading ? (
        <Image
          source={require('../assets/loading.gif')}
          style={{ alignSelf: 'center' }}
        ></Image>
      ) : (
        news.map((item) => {
            const translation = translatedTitles[item.id];
            const titleToShow = translation
              ? translation.isTranslated
                ? translation.translated
                : translation.original
              : item.title;

            return (
              <View key={item.id} style={styles.textContainer}>
                <Text style={[styles.text, styles.newsText]}>{titleToShow}</Text>
                <View style={styles.buttonRow}>
                  <TouchableOpacity
                    style={[styles.button, { backgroundColor: theme.button }]}
                    onPress={() =>
                      Linking.openURL(
                        String(item.links.find((link) => link.url)?.url),
                      )
                    }
                  >
                    <Text style={styles.text}>Lue juttu</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.button, { backgroundColor: theme.button }]}
                    onPress={() => translateItem(item)}
                  >
                    <Text style={styles.text}>Käännä</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
      )}
    </ScrollView>
  );
}
