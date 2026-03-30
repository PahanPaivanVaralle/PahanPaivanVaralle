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

export async function Login() {
  if (!cachedUserID) await getUserID();

  const data = {
    userid: cachedUserID,
    username: await DeviceInfo.getDeviceName(),
    device_name: await DeviceInfo.getDeviceName(),
    device_manufacturer: await DeviceInfo.getManufacturer(),
    device_os_version: DeviceInfo.getSystemName() + " " + DeviceInfo.getSystemVersion(),
    last_ip: await DeviceInfo.getIpAddress(),
  };

  try {
    return await pb.collection('users').create(data);
  } catch (err) {
    if (err.status === 400) {
      return await pb
        .collection('users')
        .getFirstListItem(`userid="${cachedUserID}"`);
    }
    throw err;
  }
}
