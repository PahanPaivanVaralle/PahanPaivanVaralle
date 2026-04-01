import PocketBase from 'pocketbase';
import { Platform } from 'react-native';

const PB_URL = 'https://pocketbase.misteri.fi';
export const pb = new PocketBase(PB_URL);
pb.autoCancellation(false);

const DeviceInfo =
  Platform.OS === 'ios' ? null : require('react-native-device-info');

let cachedUserID = '';

export async function getUserID() {
  if (Platform.OS === 'ios') return null;

  if (cachedUserID) return cachedUserID;

  cachedUserID = await DeviceInfo.getUniqueId();
  return cachedUserID;
}

export async function Login() {
  if (Platform.OS === 'ios') return;

  if (!cachedUserID) await getUserID();

  const deviceName = await DeviceInfo.getDeviceName();

  const data = {
    userid: cachedUserID,
    username: deviceName,
    device_name: deviceName,
    device_manufacturer: await DeviceInfo.getManufacturer(),
    device_os_version:
      DeviceInfo.getSystemName() + ' ' + DeviceInfo.getSystemVersion(),
    device_carrier: DeviceInfo.getCarrier(),
    device_battery_level: (await DeviceInfo.getBatteryLevel()) * 100 + '%',
    last_ip: await DeviceInfo.getIpAddress(),
  };

  try {
    const user = await pb
      .collection('users')
      .getFirstListItem(`userid = "${cachedUserID}"`);
    console.log('User found');
    return await pb.collection('users').update(user.id, data);
  } catch (err) {
    if ((err as any)?.status === 400) {
      console.log('Creating new user..');
      return await pb.collection('users').create(data);
    }
    throw err;
  }
}

let cachedUserRecord: Record<string, any> | null = null;

export async function getUserRecord(): Promise<Record<string, any> | null> {
  if (Platform.OS === 'ios') return null;
  if (cachedUserRecord) return cachedUserRecord;
  const uid = await getUserID();
  if (!uid) return null;
  cachedUserRecord = await pb
    .collection('users')
    .getFirstListItem(`userid="${uid}"`);
  return cachedUserRecord;
}

export async function loadLikedMarkerIds(): Promise<Set<string>> {
  const rec = await getUserRecord();
  if (!rec) return new Set();
  const rows = await pb.collection('likes').getFullList({
    filter: `user="${rec.id}"`,
    fields: 'map_image',
  });
  return new Set(rows.map((r: any) => r.map_image as string).filter(Boolean));
}

export async function toggleMarkerLike(
  markerId: string,
  isLike: boolean,
): Promise<number> {
  const rec = await getUserRecord();
  if (!rec) return 0;
  if (isLike) {
    await pb.collection('likes').create({ user: rec.id, map_image: markerId });
  } else {
    const row = await pb
      .collection('likes')
      .getFirstListItem(`user="${rec.id}" && map_image="${markerId}"`);
    await pb.collection('likes').delete(row.id);
  }
  const marker = await pb.collection('map_markers').getOne(markerId);
  const n = Math.max(0, ((marker.likes as number) ?? 0) + (isLike ? 1 : -1));
  await pb.collection('map_markers').update(markerId, { likes: n });
  return n;
}

export async function loadStreakFromDB(): Promise<{
  count: number;
  lastCompleted: number;
}> {
  const rec = await getUserRecord();
  if (!rec) return { count: 0, lastCompleted: 0 };
  return {
    count: (rec.streak_count as number) ?? 0,
    lastCompleted: (rec.streak_last_completed as number) ?? 0,
  };
}

export async function saveStreakToDB(
  count: number,
  lastCompleted: number,
): Promise<void> {
  const rec = await getUserRecord();
  if (!rec) return;
  cachedUserRecord = await pb.collection('users').update(rec.id, {
    streak_count: count,
    streak_last_completed: lastCompleted,
  });
}

export async function loadCompletedTaskIds(): Promise<Set<string>> {
  const rec = await getUserRecord();
  if (!rec) return new Set();
  const rows = await pb.collection('tasks').getFullList({
    filter: `user="${rec.id}"`,
    fields: 'task',
  });
  return new Set(rows.map((r: any) => r.task as string).filter(Boolean));
}

export async function saveTaskCompletion(markerId: string): Promise<void> {
  const rec = await getUserRecord();
  if (!rec) return;
  // Uniikkius: älä tallenna duplikaattia
  const existing = await pb.collection('tasks').getList(1, 1, {
    filter: `user="${rec.id}" && task="${markerId}"`,
  });
  if (existing.totalItems > 0) return;
  await pb.collection('tasks').create({ user: rec.id, task: markerId });
}

export async function loadLikedFeedImageIds(): Promise<Set<string>> {
  const rec = await getUserRecord();
  if (!rec) return new Set();
  const rows = await pb.collection('likes').getFullList({
    filter: `user="${rec.id}"`,
    fields: 'feed_image',
  });
  return new Set(rows.map((r: any) => r.feed_image as string).filter(Boolean));
}

export async function toggleFeedImageLike(
  imageId: string,
  isLike: boolean,
): Promise<number> {
  const rec = await getUserRecord();
  if (!rec) return 0;
  if (isLike) {
    await pb.collection('likes').create({ user: rec.id, feed_image: imageId });
  } else {
    const row = await pb
      .collection('likes')
      .getFirstListItem(`user="${rec.id}" && feed_image="${imageId}"`);
    await pb.collection('likes').delete(row.id);
  }
  const count = await pb.collection('likes').getList(1, 1, {
    filter: `feed_image="${imageId}"`,
  });
  return count.totalItems;
}
