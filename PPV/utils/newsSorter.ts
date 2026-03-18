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
    const sources = [
      'https://www.iltalehti.fi/rss.xml',
      'https://feeds.yle.fi/uutiset/v1/majorHeadlines/YLE_UUTISET.rss',
    ];

    const feeds = await Promise.all(
      sources.map(async (url) => {
        const res = await fetch(url);
        const text = await res.text();
        const feed = await parse(text);

        return feed.items.filter(
          (item) =>
            !negativeWords.some((word) =>
              item.title.toLowerCase().includes(word),
            ),
        );
      }),
    );

    return feeds.flat();
  } catch (err) {
    console.log('News error:', err);
    return [];
  }
};
