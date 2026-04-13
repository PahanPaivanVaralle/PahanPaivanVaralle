import { loadStreakFromDB, saveStreakToDB } from '../lib/pocketbase';

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

/** Returns true if the streak is still alive (within the grace 48h window) */
export const isStreakAlive = (streak: StreakData): boolean => {
  if (streak.count === 0) return false;
  return Date.now() - streak.lastCompleted <= 48 * 60 * 60 * 1000;
};

/** Loads streak from PocketBase users record */
export const loadStreakDB = loadStreakFromDB;

/** Records a task completion and saves streak to PocketBase */
export const recordTaskCompletionDB = async (): Promise<StreakData> => {
  const now = Date.now();
  const prev = await loadStreakFromDB();
  const hoursSinceLast = (now - prev.lastCompleted) / (1000 * 60 * 60);

  let next: StreakData;
  if (prev.lastCompleted === 0) {
    next = { count: 1, lastCompleted: now };
  } else if (hoursSinceLast < 24) {
    return prev;
  } else if (hoursSinceLast <= 48) {
    next = { count: prev.count + 1, lastCompleted: now };
  } else {
    next = { count: 1, lastCompleted: now };
  }

  await saveStreakToDB(next.count, next.lastCompleted);
  return next;
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
