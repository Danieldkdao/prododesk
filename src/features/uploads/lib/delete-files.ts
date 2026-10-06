import "server-only";

import {
  DeleteObjectCommand,
  ListObjectsV2Command,
  S3Client,
} from "@aws-sdk/client-s3";
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

export async function deleteUserFilesFromStorage(userId: string) {
  if (!userId || userId.includes("/")) return false;

  try {
    const prefix = `${userId}/`;
    let continuationToken: string | undefined;

    do {
      const page = await client.send(
        new ListObjectsV2Command({
          Bucket: envServer.TIGRIS_STORAGE_BUCKET,
          Prefix: prefix,
          ContinuationToken: continuationToken,
        }),
      );
      const keys = (page.Contents ?? []).flatMap(({ Key }) =>
        Key?.startsWith(prefix) ? [Key] : [],
      );
      if (!(await deleteFilesFromStorage(keys))) return false;
      continuationToken = page.IsTruncated
        ? page.NextContinuationToken
        : undefined;
    } while (continuationToken);

    return true;
  } catch (error) {
    console.error("Failed to clean up deleted account files:", error);
    return false;
  }
}
