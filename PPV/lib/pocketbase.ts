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
    device_battery_level: (await DeviceInfo.getBatteryLevel() * 100) + "%" ,
    last_ip: await DeviceInfo.getIpAddress(),
  };

  try {
    const user = await pb
      .collection('users')
      .getFirstListItem(`userid = "${cachedUserID}"`);
    console.log("User found")
    return await pb.collection('users').update(user.id, data);
  } catch (err) {
    if (err.status === 400) {
      console.log('Creating new user..');
      return await pb.collection('users').create(data);
    }
    throw err;
  }
}
