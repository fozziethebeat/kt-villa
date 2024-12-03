import {S3Client, PutObjectCommand} from '@aws-sdk/client-s3';
import {helpers, PredictionServiceClient} from '@google-cloud/aiplatform';
import axios from 'axios';
import ShortUniqueId from 'short-unique-id';
import Together from 'together-ai';

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

  abstract generateImageFromAdapter(
    itemId: string,
    prompt: string,
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
}

class TogetherFluxGenerator extends ImageGenerationService {
  protected together: Together;
  protected modelId: string;

  constructor(bucketName: string, apiKey: string, modelId: string) {
    super(bucketName);
    this.together = new Together({apiKey});
    this.modelId = modelId;
  }

  async generateImage(itemId: string, prompt: string): Promise<string> {
    const request = {
      prompt,
      model: this.modelId,
      steps: 10,
    };
    const response = await this.together.images.create(request);
    const urlResponse = await axios({
      method: 'GET',
      url: response.data[0]?.url || '',
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

  async generateImage(itemId: string, prompt: string): Promise<string> {
    const request = {
      prompt,
      num_inference_steps: 10,
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

  async generateImage(itemId: string, prompt: string): Promise<string> {
    const endpoint = `projects/${this.projectID}/locations/${this.location}/publishers/google/models/imagen-3.0-generate-001`;
    const parameters = helpers.toValue({
      sampleCount: 1,
      aspectRatio: '1:1',
      safetyFilterLevel: 'block_none',
      personGeneration: 'allow_adult',
    });
    const instances = [
      helpers.toValue({
        prompt,
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
