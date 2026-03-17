import { StatusBar } from "expo-status-bar";
import {Text, View, Image, Animated, Linking} from "react-native";
import { styles } from "../global";
import { useEffect, useState } from "react";
import {parse, FeedItem, Feed} from "react-native-rss-parser";
import ScrollView = Animated.ScrollView;

export default function HappyNews() {
  const [news, setNews] = useState([] as FeedItem[]);

  const negativeWords = [
    "trump",
    "sota",
    "venäjä",
    "putin",
    "moka",
    "varoittaa",
    "kaatui",
    "epäilty",
    "rikos",
    "hinnat",
    "pilaa",
    "ostaa",
    "petti",
    "tekoäly",
    "AI",
    "ongelmia",
    "vankila",
    "nato",
    "ahdistuneita",
    "epidemia",
    "verilöyly",
    "onnettomuus",
    "uhri",
    "loukkaantui",
    "hukkui",
    "nordea",
    "Iran",
    "korruptio",
    "Israel",
    "räjähti",
    "räjähdys",
    "uhkaus",
    "kuollut",
    "oikeuteen",
    "hengenvaara",
  ];

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const sources = [
          //"https://www.iltalehti.fi/rss.xml",
          "https://feeds.yle.fi/uutiset/v1/majorHeadlines/YLE_UUTISET.rss",
        ];

        const feeds = await Promise.all(
            sources.map(async (url) => {
              const res = await fetch(url);
              const text = await res.text();
              const feed = await parse(text);

              // 🔥 FILTER IMMEDIATELY HERE
              return feed.items
                  //.slice(1, 4)
                  .filter(item => {
                    return !negativeWords.some(word => item.title.toLowerCase().includes(word));
                  })
            }));
                setNews(feeds.flat());
        console.log(String(news.some(url => url.links.some(url => url.url))));
      } catch (err) {
        console.log("News error:", err);
      }
    };

    fetchNews();
  }, []);

  return (
    <ScrollView>
      {news
        .map((singleArticle) => (
          <Text key={singleArticle.title} style={styles.TextContainer}
                onPress={() => Linking.openURL(String(singleArticle.links.some(url => url.url)))}>
            {singleArticle.title}
          </Text>
        ))}
    </ScrollView>
  );
}
