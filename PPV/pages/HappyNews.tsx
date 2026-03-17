import { StatusBar } from "expo-status-bar";
import { Text, View, Image, Animated } from "react-native";
import { styles } from "../global";
import { useEffect, useState } from "react";
import * as RSSParser from "react-native-rss-parser";
import ScrollView = Animated.ScrollView;

export default function HappyNews() {
  const [news, setNews] = useState([]);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const sources = [
          "https://www.iltalehti.fi/rss.xml",
          "https://feeds.yle.fi/uutiset/v1/majorHeadlines/YLE_UUTISET.rss",
        ];

        const responses = await Promise.all(sources.map((url) => fetch(url)));

        const texts = await Promise.all(responses.map((res) => res.text()));

        const feeds = await Promise.all(
          texts.map((text) => RSSParser.parse(text)),
        );

        const allNews = feeds.flatMap((feed) => feed.items);

        console.log(allNews);
        setNews(allNews);
      } catch (err) {
        console.log("News error:", err);
      }
    };

    fetchNews();
  }, []);
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
  ];

  return (
    <ScrollView>
      {news
        .filter(
          (singlenews) =>
            !negativeWords.some((word) =>
              singlenews.title.toLowerCase().includes(word),
            ),
        )
        .map((singlenews) => (
          <Text key={singlenews.title} style={styles.TextContainer}>
            {singlenews.title}
          </Text>
        ))}
    </ScrollView>
  );
}
