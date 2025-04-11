import {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} from '@google/generative-ai';
import {GoogleGenAI, MediaResolution, PersonGeneration} from '@google/genai';
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

class GeminiImageGenerator extends ImageGenerationService {
  protected modelID: string;
  protected client: GoogleGenAI;

  constructor(bucketName: string, apiKey: string, model: string) {
    super(bucketName);

    this.modelID = model;
    this.client = new GoogleGenAI({apiKey});
  }

  async generateImage(itemId: string, prompt: string): Promise<string> {
    const response = await this.client.models.generateContent({
      model: this.modelID,
      contents: prompt,
      config: {
        responseModalities: ['Text', 'Image'],
      },
    });
    const candidates = response.candidates;
    for (let c = 0; c < candidates.length; c++) {
      for (let p = 0; p < candidates[c].content.parts.length; p++) {
        const part = candidates[c].content.parts[p];
        if (part.inlineData) {
          try {
            const imageBuffer = Buffer.from(part.inlineData.data, 'base64');
            const targetKey = `results/${itemId}.png`;
            return await this.uploadImageToS3(imageBuffer, targetKey);
          } catch (err) {
            console.error(err);
          }
        }
      }
    }

    // Save the image to AWS S3
    throw new Error("Gemini Don't work");
  }
}

class ImagenGenerator extends ImageGenerationService {
  protected modelID: string;
  protected client: GoogleGenAI;

  constructor(bucketName: string, apiKey: string, model: string) {
    super(bucketName);

    this.modelID = model;
    this.client = new GoogleGenAI({apiKey});
  }

  async generateImage(itemId: string, prompt: string): Promise<string> {
    const response = await this.client.models.generateImages({
      model: this.modelID,
      prompt: prompt,
      config: {
        numberOfImages: 1,
      },
    });
    if (!response || response.generatedImages.length != 1) {
      throw new Error("Gemini Don't work");
    }
    const imageBuffer = Buffer.from(
      response.generatedImages[0].image.imageBytes,
      'base64',
    );
    const targetKey = `results/${itemId}.png`;
    return await this.uploadImageToS3(imageBuffer, targetKey);
  }
}

function textGeneratorFactory() {
  if (process.env.ANTHROPIC_API_KEY) {
    return new AnthropicTextGenerationService(process.env.ANTHROPIC_API_KEY);
  }
  return undefined;
}

function imageGeneratorFactory() {
  if (process.env.GEMINI_API_KEY && process.env.GEMINI_MODEL) {
    return new GeminiImageGenerator(
      process.env.AWS_BUCKET,
      process.env.GEMINI_API_KEY,
      process.env.GEMINI_MODEL,
    );
  }
  if (process.env.GEMINI_API_KEY && process.env.IMAGEN_MODEL) {
    return new ImagenGenerator(
      process.env.AWS_BUCKET,
      process.env.GEMINI_API_KEY,
      process.env.IMAGEN_MODEL,
    );
  }

  if (process.env.TOGETHER_API_KEY && process.env.TOGETHER_API_MODEL) {
    return new TogetherFluxGenerator(
      process.env.AWS_BUCKET,
      process.env.TOGETHER_API_KEY,
      process.env.TOGETHER_API_MODEL,
    );
  }
  return undefined;
}

export const imageGenerator = imageGeneratorFactory();
export const textGenerator = textGeneratorFactory();
