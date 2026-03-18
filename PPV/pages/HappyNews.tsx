import { Text, View, Image, Animated, Linking } from 'react-native';
import { styles } from '../global';
import ScrollView = Animated.ScrollView;
import { getNews } from '../utils/newsSorter';
import React, { useEffect, useState } from 'react';
import { FeedItem } from 'react-native-rss-parser';
import { useHeaderHeight } from '@react-navigation/elements';

export default function HappyNews() {
  const [news, setNews] = useState([] as FeedItem[]);
  const headerHeight = useHeaderHeight();

  useEffect(() => {
    const load = async () => {
      const data = await getNews();
      setNews(data);
    };
    load();
  }, []);

  if (news)
    return (
      <ScrollView
        contentContainerStyle={{
          paddingBottom: headerHeight,
        }}
      >
        {news.map((singleArticle) => (
          <Text
            key={singleArticle.title}
            style={styles.TextContainer}
            onPress={() =>
              Linking.openURL(
                String(singleArticle.links.find((link) => link.url)?.url),
              )
            }
          >
            {singleArticle.title}
          </Text>
        ))}
      </ScrollView>
    );
}
