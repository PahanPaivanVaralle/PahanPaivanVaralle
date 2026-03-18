import { Text, View, Image, Animated, Linking } from 'react-native';
import { styles } from '../global';
import ScrollView = Animated.ScrollView;
import { getNews } from '../utils/newsSorter';
import { useEffect, useState } from 'react';
import { FeedItem } from 'react-native-rss-parser';

export default function HappyNews() {
  const [news, setNews] = useState([] as FeedItem[]);

  useEffect(() => {
    const load = async () => {
      const data = await getNews();
      setNews(data);
    };
    load();
  }, []);

  if (news)
    return (
      <ScrollView>
        {news.map((singleArticle) => (
          <Text
            key={singleArticle.title}
            style={styles.TextContainer}
            onPress={() =>
              Linking.openURL(
                String(singleArticle.links.some((url) => url.url)),
              )
            }
          >
            {singleArticle.title}
          </Text>
        ))}
      </ScrollView>
    );
}
