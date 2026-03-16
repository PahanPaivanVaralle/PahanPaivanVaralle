import PocketBase from "pocketbase";

export const PB_URL = "https://pocketbase.misteri.fi";

export const pb = new PocketBase(PB_URL);
pb.autoCancellation(false);
