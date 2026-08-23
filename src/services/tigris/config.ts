import { envServer } from "@/data/env/server";

type TigrisStorageConfig = {
  bucket?: string;
  accessKeyId?: string;
  secretAccessKey?: string;
  endpoint?: string;
}

export const tigrisStorageConfig: TigrisStorageConfig = {
  accessKeyId: envServer.TIGRIS_STORAGE_ACCESS_KEY_ID,
  bucket: envServer.TIGRIS_STORAGE_BUCKET,
  endpoint: envServer.TIGRIS_STORAGE_ENDPOINT,
  secretAccessKey: envServer.TIGRIS_STORAGE_SECRET_ACCESS_KEY,
}
