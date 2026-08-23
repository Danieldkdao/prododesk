import { envServer } from "@/data/env/server";
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const getTigrisS3Client = () =>
  new S3Client({
    region: "auto",
    endpoint: envServer.TIGRIS_STORAGE_ENDPOINT,
    forcePathStyle: true,
    requestChecksumCalculation: "WHEN_REQUIRED",
    credentials: {
      accessKeyId: envServer.TIGRIS_STORAGE_ACCESS_KEY_ID,
      secretAccessKey: envServer.TIGRIS_STORAGE_SECRET_ACCESS_KEY,
    },
  });

export const getUploadPresignedUrl = async (key: string) => {
  try {
    const presignedUrl = await getSignedUrl(
      getTigrisS3Client(),
      new PutObjectCommand({
        Bucket: envServer.TIGRIS_STORAGE_BUCKET,
        Key: key,
      }),
      { expiresIn: 3600 },
    );

    return presignedUrl;
  } catch (error) {
    console.error(error);
    return null;
  }
};

export const getDeletePresignedUrl = async (key: string) => {
  try {
    const presignedUrl = await getSignedUrl(
      getTigrisS3Client(),
      new DeleteObjectCommand({
        Bucket: envServer.TIGRIS_STORAGE_BUCKET,
        Key: key,
      }),
      { expiresIn: 3600 },
    );

    return presignedUrl;
  } catch (error) {
    console.error(error);
    return null;
  }
};
