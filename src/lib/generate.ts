import {S3Client, PutObjectCommand} from '@aws-sdk/client-s3';
import {helpers, PredictionServiceClient} from '@google-cloud/aiplatform';
import axios from 'axios';
import ShortUniqueId from 'short-unique-id';
import Together from 'together-ai';

import {prisma} from '@/lib/prisma';

abstract class ImageGenerationService {
  protected bucketName: string;
  protected itemIdGenerator = new ShortUniqueId({length: 6});
  protected itemCodeGenerator = new ShortUniqueId({
    dictionary: 'number',
    length: 6,
  });
  protected s3Client = new S3Client({});

  constructor(bucketName: string) {
    this.bucketName = bucketName;
  }

  async generateBookingItem(bookingId: string) {
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
      const userItemId = await this.generateItem(
        booking.userId,
        booking.startDate,
      );
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

  async generateItem(userId: string, startDate: Date): Promise<string> {
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

    const itemId = this.itemIdGenerator.rnd();
    const claimCode = this.itemCodeGenerator.rnd();
    const image = await this.generateImageFromAdapter(itemId, adapters[0]);
    await prisma.stableItem.create({
      data: {
        id: itemId,
        image,
        claimCode,
        claimStatus: 'claimed',
        claimVisible: true,
        ownerId: userId,
      },
    });
    return itemId;
  }

  abstract async generateImageFromAdapter(
    itemId,
    adapterSettings,
  ): Promise<string>;

  protected async uploadImageToS3(imageBuffer, targetKey: string) {
    await this.s3Client.send(
      new PutObjectCommand({
        Bucket: this.bucketName,
        Key: targetKey,
        Body: imageBuffer,
        ContentType: 'image/png',
      }),
    );
    const s3Url = `https://${this.bucketName}.s3.amazonaws.com/${targetKey}`;
    return s3Url;
  }

  protected getPrompt(adapterSettings) {
    const index = Math.floor(Math.random() * adapterSettings.variants.length);
    const fragment = adapterSettings.variants[index];
    return `${fragment} ${adapterSettings.promptTemplate} ${adapterSettings.adapter}`;
  }
}

class TogetherFluxGenerator extends ImageGenerationService {
  protected together: Together;
  protected modelId: string;

  constructor(bucketName: string, apiKey: string, modelId: string) {
    super(bucketName);
    this.together = new Together({apiKey});
    this.modelId = modelId;
  }

  async generateImageFromAdapter(itemId, adapterSettings): Promise<string> {
    const request = {
      model: this.modelId,
      prompt: this.getPrompt(adapterSettings),
      steps: Math.min(adapterSettings.steps, 10),
    };
    const response = await this.together.images.create(request);
    const urlResponse = await axios({
      method: 'GET',
      url: response.data[0].url,
      responseType: 'arraybuffer',
    });
    const imageBuffer = urlResponse.data;
    const targetKey = `results/${itemId}.png`;
    return await this.uploadImageToS3(imageBuffer, targetKey);
  }
}

class BentoFluxGenerator extends ImageGenerationService {
  protected apiURL: string;

  constructor(bucketName: string, apiURL: string) {
    super(bucketName);
    this.apiURL = apiURL;
  }

  async generateImageFromAdapter(itemId, adapterSettings): Promise<string> {
    const request = {
      prompt: this.getPrompt(adapterSettings),
      num_inference_steps: adapterSettings.steps,
    };
    const {data} = await axios.post(`${this.apiURL}/txt2img`, request, {
      responseType: 'arraybuffer',
    });
    const imageBuffer = Buffer.from(data, 'binary');
    // Save the image to AWS S3
    const targetKey = `results/${itemId}.png`;
    return await this.uploadImageToS3(imageBuffer, targetKey);
  }
}

class GeminiImagenGenerator extends ImageGenerationService {
  protected projectID: string;
  protected location: string;

  protected predictionServiceClient: PredictionServiceClient;
  constructor(bucketName: string, projectID: string, location: string) {
    super(bucketName);

    this.projectID = projectID;
    this.location = location;
    this.predictionServiceClient = new PredictionServiceClient({
      apiEndpoint: `${location}-aiplatform.googleapis.com`,
    });
  }

  async generateImageFromAdapter(itemId, adapterSettings): Promise<string> {
    const endpoint = `projects/${this.projectID}/locations/${this.location}/publishers/google/models/imagen-3.0-generate-001`;
    const parameters = helpers.toValue({
      sampleCount: 1,
      aspectRatio: '1:1',
      safetyFilterLevel: 'block_none',
      personGeneration: 'allow_adult',
    });
    const instances = [
      helpers.toValue({
        prompt: this.getPrompt(adapterSettings),
      }),
    ];
    const request = {
      endpoint,
      instances,
      parameters,
    };

    try {
      const [response] = await this.predictionServiceClient.predict(request);
      if (!response || response.predictions.length === 0) {
        throw new Error('No Gemini Response');
      }

      const prediction = response.predictions[0];
      const imageBuffer = Buffer.from(
        prediction.structValue.fields.bytesBase64Encoded.stringValue,
        'base64',
      );

      // Save the image to AWS S3
      const targetKey = `results/${itemId}.png`;
      return await this.uploadImageToS3(imageBuffer, targetKey);
    } catch (e) {
      console.log(e);
      throw new Error("Gemini Don't work");
    }
  }
}

function imageGeneratorFactory() {
  if (process.env.GEMINI_PROJECT_ID && process.env.GEMINI_LOCATION) {
    return new GeminiImagenGenerator(
      process.env.AWS_BUCKET,
      process.env.GEMINI_PROJECT_ID,
      process.env.GEMINI_LOCATION,
    );
  }
  if (process.env.TOGETHER_API_KEY && process.env.TOGETHER_API_MODEL) {
    return new TogetherFluxGenerator(
      process.env.AWS_BUCKET,
      process.env.TOGETHER_API_KEY,
      process.env.TOGETHER_API_MODEL,
    );
  }
  if (process.env.BENTO_API_URL) {
    return new BentoFluxGenerator(
      process.env.AWS_BUCKET,
      process.env.BENTO_API_URL,
    );
  }
  return undefined;
}

export const imageGenerator = imageGeneratorFactory();
