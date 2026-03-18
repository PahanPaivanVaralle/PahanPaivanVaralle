import { useEffect, useState } from 'react';
import { FeedItem, parse } from 'react-native-rss-parser';

export const getNews = async (): Promise<FeedItem[]> => {
  const negativeWords = [
    'trump',
    'sota',
    'venäjä',
    'putin',
    'moka',
    'varoittaa',
    'kaatui',
    'epäilty',
    'rikos',
    'hinnat',
    'pilaa',
    'ostaa',
    'petti',
    'tekoäly',
    'ongelmia',
    'vankila',
    'nato',
    'ahdistuneita',
    'epidemia',
    'verilöyly',
    'onnettomuus',
    'uhri',
    'loukkaantui',
    'hukkui',
    'nordea',
    'korruptio',
    'israel',
    'räjähti',
    'räjähdys',
    'uhkaus',
    'kuollut',
    'oikeuteen',
    'hengenvaara',
    'itsetuhoisen',
    'iran',
    'porno',
    'murtauduttu',
    'pelkää',
    'kuoli',
    'epäillään',
    'uhattuna',
    'tappaa',
    'epstein',
    'sotilas',
    'murhasi',
    'sortui',
    'vallankaappaus',
    'poliisi pysäytti',
    'vallan',
    'tarjottu seksistä',
  ];

  try {
    const sources = ['https://www.goodnewsnetwork.org/category/news/feed/'];

    const feeds = await Promise.all(
      sources.map(async (url) => {
        const res = await fetch(url);
        const text = await res.text();
        const feed = await parse(text);

        return feed.items;
      }),
    );

    return feeds.flat();
  } catch (err) {
    console.log('News error:', err);
    return [];
  }
};
