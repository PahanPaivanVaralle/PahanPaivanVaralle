import AsyncStorage from '@react-native-async-storage/async-storage';

const STREAK_KEY = 'ppv_streak';

export interface TaskMarker {
  id: string;
  la: number;
  lo: number;
  title: string;
}

export interface StreakData {
  count: number;
  lastCompleted: number; // Unix ms
}

export const loadStreak = async (): Promise<StreakData> => {
  const raw = await AsyncStorage.getItem(STREAK_KEY);
  if (!raw) return { count: 0, lastCompleted: 0 };
  return JSON.parse(raw) as StreakData;
};

/** Call after a task is completed. Returns the updated streak. */
export const recordTaskCompletion = async (): Promise<StreakData> => {
  const now = Date.now();
  const prev = await loadStreak();
  const hoursSinceLast = (now - prev.lastCompleted) / (1000 * 60 * 60);

  let next: StreakData;
  if (prev.lastCompleted === 0) {
    // First ever completion
    next = { count: 1, lastCompleted: now };
  } else if (hoursSinceLast < 24) {
    // Same 24h window — already counted, don't add again
    return prev;
  } else if (hoursSinceLast <= 48) {
    // New window opened and completed in time — streak grows
    next = { count: prev.count + 1, lastCompleted: now };
  } else {
    // Missed the window — reset
    next = { count: 1, lastCompleted: now };
  }

  await AsyncStorage.setItem(STREAK_KEY, JSON.stringify(next));
  return next;
};

/** Returns true if the streak is still alive (within the grace 48h window) */
export const isStreakAlive = (streak: StreakData): boolean => {
  if (streak.count === 0) return false;
  return Date.now() - streak.lastCompleted <= 48 * 60 * 60 * 1000;
};

/** Haversine distance in metres between two lat/lon points */
export const distanceMetres = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number => {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};
