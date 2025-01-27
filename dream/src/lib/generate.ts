import {GoogleGenerativeAI} from '@google/generative-ai';
import Anthropic from '@anthropic-ai/sdk';
import {S3Client, PutObjectCommand} from '@aws-sdk/client-s3';
import {helpers, PredictionServiceClient} from '@google-cloud/aiplatform';
import axios from 'axios';
import ShortUniqueId from 'short-unique-id';
import {Liquid} from 'liquidjs';
import Together from 'together-ai';

import {prisma} from '@/lib/prisma';

const engine = new Liquid();

abstract class TextGenerationService {
  abstract generateStory(memory: string, theme: string): Promise<string>;
  abstract generateImagePrompt(story: string, style: string): Promise<string>;
}

class AnthropicTextGenerationService extends TextGenerationService {
  client: Anthropic;
  story_schema: Anthropic.Tool = {
    name: 'dream_story',
    description: 'A magical dream story with a title and story',
    input_schema: {
      type: 'object',
      properties: {
        title: {
          type: 'string',
          description: 'A brief 1 sentence story title',
        },
        story: {
          type: 'string',
          description: 'The magical dream in 2 to 3 paragraphs',
        },
      },
      required: ['title', 'story'],
    },
  };
  image_schema: Anthropic.Tool = {
    name: 'image_prompt',
    description: 'A 2 to 3 sentence prompt for an image generation model',
    input_schema: {
      type: 'object',
      properties: {
        imagePrompt: {
          type: 'string',
          description:
            'A concise but detailed and rich prompt for an image generation model',
        },
      },
      required: ['imagePrompt'],
    },
  };

  constructor(apiKey: string) {
    super();
    this.client = new Anthropic({
      apiKey,
    });
  }

  async generateStory(memory: string, theme: string): Promise<string> {
    const promptTemplate = await prisma.promptTemplate.findUnique({
      where: {id: 'dreamStorySystem'},
    });
    if (!promptTemplate || !theme) {
      throw new Error('System not setup properly');
    }
    const systemInstruction = await engine.parseAndRender(
      promptTemplate.template,
      {
        theme,
      },
    );
    const message = await this.client.messages.create({
      model: 'claude-3-5-sonnet-latest',
      max_tokens: 1024,
      tools: [this.story_schema],
      tool_choice: {type: 'tool', name: this.story_schema['name']},
      system: systemInstruction,
      messages: [{role: 'user', content: memory}],
    });
    const tool = message.content.find(
      (content): content is Anthropic.ToolUseBlock =>
        content.type === 'tool_use',
    );
    return tool.input['story'];
  }

  async generateImagePrompt(story: string, style: string): Promise<string> {
    const promptTemplate = await prisma.promptTemplate.findUnique({
      where: {id: 'dreamImageSystem'},
    });
    if (!promptTemplate) {
      throw new Error('System not setup properly');
    }
    const systemInstruction = await engine.parseAndRender(
      promptTemplate.template,
      {
        style,
      },
    );
    const message = await this.client.messages.create({
      model: 'claude-3-5-sonnet-latest',
      max_tokens: 1024,
      tools: [this.image_schema],
      tool_choice: {type: 'tool', name: this.image_schema['name']},
      system: systemInstruction,
      messages: [{role: 'user', content: story}],
    });
    const tool = message.content.find(
      (content): content is Anthropic.ToolUseBlock =>
        content.type === 'tool_use',
    );
    return tool.input['imagePrompt'];
  }
}

class GeminiTextGenerationService extends TextGenerationService {
  client: GoogleGenerativeAI;
  story_schema = {
    type: 'object',
    properties: {
      dream: {
        type: 'object',
        properties: {
          title: {
            type: 'string',
          },
          story: {
            type: 'string',
          },
        },
      },
    },
  };

  image_schema = {
    type: 'object',
    properties: {
      imagePrompt: {
        type: 'string',
      },
    },
  };

  constructor(apiKey: string) {
    super();
    this.client = new GoogleGenerativeAI(apiKey);
  }

  async generateStory(memory: string, theme: string): Promise<string> {
    const promptTemplate = await prisma.promptTemplate.findUnique({
      where: {id: 'dreamStorySystem'},
    });
    if (!promptTemplate || !theme) {
      throw new Error('System not setup properly');
    }
    const systemInstruction = await engine.parseAndRender(
      promptTemplate.template,
      {
        theme,
      },
    );
    const model = this.client.getGenerativeModel({
      model: process.env.GEMINI_MODEL,
      systemInstruction,
    });
    const generationConfig = {
      temperature: 1,
      topP: 0.95,
      topK: 10,
      maxOutputTokens: 2000,
      responseMimeType: 'application/json',
      responseSchema: this.story_schema,
    };
    // @ts-expect-error
    const chatSession = model.startChat({generationConfig});
    const result = await chatSession.sendMessage(memory);
    const resultRaw = result.response.text();
    const resultObj = JSON.parse(resultRaw);
    return resultObj['dream']['story'];
  }

  async generateImagePrompt(story: string, style: string): Promise<string> {
    const promptTemplate = await prisma.promptTemplate.findUnique({
      where: {id: 'dreamImageSystem'},
    });
    if (!promptTemplate) {
      throw new Error('System not setup properly');
    }
    const systemInstruction = await engine.parseAndRender(
      promptTemplate.template,
      {
        style,
      },
    );
    const model = this.client.getGenerativeModel({
      model: process.env.GEMINI_MODEL,
      systemInstruction,
    });
    const generationConfig = {
      temperature: 1,
      topP: 0.95,
      topK: 10,
      maxOutputTokens: 2000,
      responseMimeType: 'application/json',
      responseSchema: this.image_schema,
    };
    // @ts-expect-error
    const chatSession = model.startChat({generationConfig});
    const result = await chatSession.sendMessage(story);
    return JSON.parse(result.response.text())['imagePrompt'];
  }
}

abstract class ImageGenerationService {
  protected bucketName: string;
  public itemIdGenerator = new ShortUniqueId({length: 6});
  public itemCodeGenerator = new ShortUniqueId({
    dictionary: 'number',
    length: 6,
  });
  protected s3Client = new S3Client({});

  constructor(bucketName: string) {
    this.bucketName = bucketName;
  }

  abstract generateImage(itemId: string, prompt: string): Promise<string>;

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
      height: 1792,
      width: 1792,
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

function textGeneratorFactory() {
  if (process.env.ANTHROPIC_API_KEY) {
    return new AnthropicTextGenerationService(process.env.ANTHROPIC_API_KEY);
  }
  return undefined;
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
export const textGenerator = textGeneratorFactory();
