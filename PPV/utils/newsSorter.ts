import { FeedItem, parse } from 'react-native-rss-parser';

export const getNews = async (): Promise<FeedItem[]> => {
  try {
    const res = await fetch(
      'https://www.goodnewsnetwork.org/category/news/feed/',
    );

    const text = await res.text();
    const feed = await parse(text);

    return feed.items;
  } catch (err) {
    console.log('News error:', err);
    return [];
  }
};
