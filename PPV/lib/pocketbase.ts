import PocketBase from 'pocketbase';
import DeviceInfo from 'react-native-device-info';

const PB_URL = 'https://pocketbase.misteri.fi';
export const pb = new PocketBase(PB_URL);

pb.autoCancellation(false);

let cachedUserID = "";

export async function getUserID() {
  if (cachedUserID) return cachedUserID;

  cachedUserID = await DeviceInfo.getUniqueId();
  return cachedUserID;
}
