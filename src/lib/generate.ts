import {
  S3Client,
  PutObjectCommand,
  CreateBucketCommand,
  DeleteObjectCommand,
  DeleteBucketCommand,
  paginateListObjectsV2,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import axios from 'axios';
import ShortUniqueId from 'short-unique-id';

import {prisma} from '@/lib/prisma';

const s3Client = new S3Client({});

async function uploadImageToS3(
  bucketName: string,
  imageBuffer,
  targetKey: string,
) {
  await s3Client.send(
    new PutObjectCommand({
      Bucket: bucketName,
      Key: targetKey,
      Body: imageBuffer,
      ContentType: 'image/png',
    }),
  );
  const s3Url = `https://${bucketName}.s3.amazonaws.com/${targetKey}`;
  return s3Url;
}

const itemIdGenerator = new ShortUniqueId({length: 6});
const itemCodeGenerator = new ShortUniqueId({
  dictionary: 'number',
  length: 6,
});

async function generateBookingItem(bookingId: string) {
  const booking = await prisma.booking.findUnique({where: {id: bookingId}});
  if (!booking) {
    console.error('No booking found');
    return undefined;
  }
  if (booking.userItemId) {
    console.error('Already has item');
    return undefined;
  }

  try {
    const userItemId = await generateItem(booking.userId, booking.startDate);
    return await prisma.booking.update({
      where: {id: bookingId},
      data: {
        userItemId,
      },
    });
  } catch (e) {
    console.error(e);
    throw e;
  }
}

async function generateItem(userId, startDate) {
  // Now get the dat we need to generate the image.
  // 1) The prompt given a template and a random fragment.
  // 2) The negative prompt (part of 1 sorta).
  // 3) The current adapter name.

  const adapters = await prisma.imageAdapterSetting.findMany({
    where: {startDate: {lt: startDate}},
    orderBy: [{startDate: 'desc'}],
    take: 1,
  });
  if (!adapters || adapters.length === 0) {
    return undefined;
  }

  const itemId = itemIdGenerator.rnd();
  const claimCode = itemCodeGenerator.rnd();
  const {image, request} = await generateImageFromAdapter(itemId, adapters[0]);
  await prisma.stableItem.create({
    data: {
      id: itemId,
      image,
      claimCode,
      claimStatus: 'claimed',
      claimVisible: true,
      ownerId: userId,
      imageRequest: request,
    },
  });
  return itemId;
}

async function generateImageFromAdapter(itemId, adapterSettings) {
  try {
    const request = {
      prompt: getPrompt(adapterSettings),
      num_inference_steps: adapterSettings.steps,
    };
    const {data} = await axios.post(
      `${process.env.IMAGE_API_URL}/txt2img`,
      request,
      {responseType: 'arraybuffer'},
    );
    const imageBuffer = Buffer.from(data, 'binary');
    // Save the image to AWS S3
    const bucketName = process.env.AWS_BUCKET;
    const targetKey = `results/${itemId}.png`;
    const image = await uploadImageToS3(bucketName, imageBuffer, targetKey);
    // Done
    return {image, request};
  } catch (e) {
    console.error(e);
    throw e;
  }
}

function getPrompt(adapterSettings) {
  const index = Math.floor(Math.random() * adapterSettings.variants.length);
  const fragment = adapterSettings.variants[index];
  return `${fragment} ${adapterSettings.promptTemplate} ${adapterSettings.adapter}`;
}

export {generateBookingItem, generateItem, generateImageFromAdapter};
