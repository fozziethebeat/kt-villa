import {S3Client, PutObjectCommand} from '@aws-sdk/client-s3';
import {Storage, Bucket} from '@google-cloud/storage';
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
class GCPImageSaver extends ImageSaver {
  storage: Storage;
  bucketName: string;
  bucket: Bucket;

  constructor(projectId: string, bucketName: string, credentials: any) {
    super();

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

/**
 * Stores content on AWS S3.
 */
class S3ImageSaver extends ImageSaver {
  client: S3Client;
  bucketName: string;

  constructor(bucketName: string) {
    super();

    this.client = new S3Client({});
    this.bucketName = bucketName;
  }

  async uploadImage(imageBuffer: Buffer, path: string, contentType: string) {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucketName,
        Key: path,
        Body: imageBuffer,
        ContentType: contentType,
      }),
    );
    return `https://${this.bucketName}.s3.amazonaws.com/${path}`;
  }
}

function createImageSaver() {
  if (
    process.env.GOOGLE_CLOUD_KEY_FILE &&
    process.env.GOOGLE_CLOUD_PROJECT_ID &&
    process.env.GOOGLE_CLOUD_STORAGE_BUCKET
  ) {
    const absoluteKeyFilePath = path.resolve(process.env.GOOGLE_CLOUD_KEY_FILE);
    const keyFileContent = fs.readFileSync(absoluteKeyFilePath, 'utf8');
    const credentials = JSON.parse(keyFileContent);
    return new GCPImageSaver(
      process.env.GOOGLE_CLOUD_PROJECT_ID,
      process.env.GOOGLE_CLOUD_STORAGE_BUCKET,
      credentials,
    );
  }
  if (
    process.env.AWS_ACCESS_KEY_ID &&
    process.env.AWS_SECRET_ACCESS_KEY &&
    process.env.AWS_REGION &&
    process.env.AWS_BUCKET
  ) {
    return new S3ImageSaver(process.env.AWS_BUCKET);
  }

  throw new Error('No imageSaver');
}

const imageSaver = createImageSaver();

export {ImageSaver, GCPImageSaver, imageSaver};
