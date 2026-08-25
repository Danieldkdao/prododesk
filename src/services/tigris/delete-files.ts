import "server-only";

import { DeleteObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { envServer } from "@/data/env/server";

const client = new S3Client({
  region: "auto",
  endpoint: envServer.TIGRIS_STORAGE_ENDPOINT,
  forcePathStyle: true,
  credentials: {
    accessKeyId: envServer.TIGRIS_STORAGE_ACCESS_KEY_ID,
    secretAccessKey: envServer.TIGRIS_STORAGE_SECRET_ACCESS_KEY,
  },
});

export async function deleteFilesFromStorage(keys: string[]) {
  try {
    await Promise.all(
      keys.map((key) =>
        client.send(
          new DeleteObjectCommand({
            Bucket: envServer.TIGRIS_STORAGE_BUCKET,
            Key: key,
          }),
        ),
      ),
    );

    return true;
  } catch (error) {
    console.error("Failed to delete files from storage:", error);
    return false;
  }
}
