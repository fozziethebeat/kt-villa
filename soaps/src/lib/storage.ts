import { Storage, Bucket } from '@google-cloud/storage';
import fs from 'fs';
import path from 'path';

/**
 * A generic interface for storing files on remote cloud systems.
 */
abstract class ImageSaver {
  abstract uploadImage(
    imageBuffer: Buffer,
    fileName: string,
    contentType: string,
  ): Promise<string>;
}

/**
 * Stores content on GCP.
 */
class GCPImageSaver {
  storage: Storage;
  bucketName: string;
  bucket: Bucket;

  constructor(projectId: string, bucketName: string, credentials: any) {
    this.storage = new Storage({
      projectId,
      credentials,
    });
    this.bucketName = bucketName;
    this.bucket = this.storage.bucket(bucketName);
  }

  async uploadImage(imageBuffer: Buffer, path: string, contentType: string) {
    const file = this.bucket.file(path);
    const writeStream = file.createWriteStream({
      metadata: {
        contentType,
      },
    });
    await new Promise((resolve, reject) => {
      writeStream.on('error', reject);
      writeStream.on('finish', resolve);
      writeStream.end(imageBuffer);
    });
    const url = `https://storage.googleapis.com/${this.bucketName}/${path}`;
    return url;
  }
}

function loadGCPCredentials(): any {
  // Option 1: Local file path (for development)
  if (process.env.GOOGLE_CLOUD_KEY_FILE) {
    const absoluteKeyFilePath = path.resolve(process.env.GOOGLE_CLOUD_KEY_FILE);
    const keyFileContent = fs.readFileSync(absoluteKeyFilePath, 'utf8');
    return JSON.parse(keyFileContent);
  }

  // Option 2: Base64-encoded JSON (for Vercel / production)
  if (process.env.GOOGLE_CLOUD_CREDENTIALS_BASE64) {
    const decoded = Buffer.from(process.env.GOOGLE_CLOUD_CREDENTIALS_BASE64, 'base64').toString('utf8');
    return JSON.parse(decoded);
  }

  return null;
}

function createImageSaver() {
  const credentials = loadGCPCredentials();
  if (
    credentials &&
    process.env.GOOGLE_CLOUD_PROJECT_ID &&
    process.env.GOOGLE_CLOUD_STORAGE_BUCKET
  ) {
    return new GCPImageSaver(
      process.env.GOOGLE_CLOUD_PROJECT_ID,
      process.env.GOOGLE_CLOUD_STORAGE_BUCKET,
      credentials,
    );
  }
  throw new Error('No imageSaver: missing GCP credentials (set GOOGLE_CLOUD_KEY_FILE or GOOGLE_CLOUD_CREDENTIALS_BASE64) and project/bucket env vars');
}

const imageSaver = createImageSaver();

export { ImageSaver, GCPImageSaver, imageSaver };
