import {
  GoogleGenAI,
  FunctionCallingConfigMode,
  FunctionDeclaration,
  Type,
} from '@google/genai';
import axios from 'axios';
import {Liquid} from 'liquidjs';
import ShortUniqueId from 'short-unique-id';
import Together from 'together-ai';

import {prisma} from '@/lib/prisma';
import {imageSaver, ImageSaver} from '@/lib/storage';

abstract class ImagePromptGenerator {
  abstract generate(adapterSettings): Promise<string>;
}

class TemplatedImagePromptGenerator extends ImagePromptGenerator {
  protected engine = new Liquid();

  async generate(adapterSettings) {
    const index = Math.floor(Math.random() * adapterSettings.variants.length);
    const fragment = adapterSettings.variants[index];
    const template = this.engine.parse(adapterSettings.promptTemplate);
    const prompt = await this.engine.render(template, {
      fragment,
      adapter: adapterSettings.adapter,
    });
    return prompt;
  }
}

class GeminiImagePromptGenerator extends ImagePromptGenerator {
  protected baseGenerator: ImagePromptGenerator;
  protected client: GoogleGenAI;
  protected modelID: string;

  protected imagePromptDeclaration: FunctionDeclaration = {
    name: 'imagePrompt',
    parameters: {
      type: Type.OBJECT,
      description: 'Specifies a text prompt to an image generation model.',
      properties: {
        prompt: {
          type: Type.STRING,
          description: 'The text prompt.',
        },
      },
      required: ['prompt'],
    },
  };

  constructor(apiKey: string, modelID: string) {
    super();
    this.baseGenerator = new TemplatedImagePromptGenerator();
    this.client = new GoogleGenAI({apiKey});
    this.modelID = modelID;
  }

  async generate(adapterSettings) {
    const prompt = await this.baseGenerator.generate(adapterSettings);
    const contents = `Create a more creative and descriptive prompt for an advanced image generation model.  Start with the base idea ${prompt}.  Output the results with the provided function call`;
    const response = await this.client.models.generateContent({
      contents,
      model: this.modelID,
      config: {
        toolConfig: {
          functionCallingConfig: {
            mode: FunctionCallingConfigMode.ANY,
            allowedFunctionNames: ['imagePrompt'],
          },
        },
        tools: [{functionDeclarations: [this.imagePromptDeclaration]}],
      },
    });
    // Fallback on the base templated prompt whenever needed.
    if (response.functionCalls.length != 1) {
      return prompt;
    }
    const functionCall = response.functionCalls[0];
    const finalPrompt = functionCall.args['prompt'];
    if (!finalPrompt) {
      return prompt;
    }
    return finalPrompt as string;
  }
}

function imagePromptGeneratorFactory() {
  if (process.env.GEMINI_API_KEY && process.env.GEMINI_TEXT_MODEL) {
    return new GeminiImagePromptGenerator(
      process.env.GEMINI_API_KEY,
      process.env.GEMINI_TEXT_MODEL,
    );
  }
  return new TemplatedImagePromptGenerator();
}

abstract class ImageGenerator {
  protected imageSaver: ImageSaver;

  constructor(imageSaver: ImageSaver) {
    this.imageSaver = imageSaver;
  }

  abstract generateImage(itemId: string, prompt: string): Promise<string>;
}

class TogetherFluxGenerator extends ImageGenerator {
  protected together: Together;
  protected modelId: string;

  constructor(imageSaver: ImageSaver, apiKey: string, modelId: string) {
    super(imageSaver);
    this.together = new Together({apiKey});
    this.modelId = modelId;
  }

  async generateImage(itemId, prompt): Promise<string> {
    const request = {
      model: this.modelId,
      prompt: prompt,
    };
    const response = await this.together.images.create(request);
    const urlResponse = await axios({
      method: 'GET',
      url: response.data[0]?.url || '',
      responseType: 'arraybuffer',
    });
    const imageBuffer = urlResponse.data;
    const targetKey = `results/${itemId}.png`;
    return await this.imageSaver.uploadImage(
      imageBuffer,
      targetKey,
      'image/png',
    );
  }
}

class ImagenGenerator extends ImageGenerator {
  protected modelID: string;
  protected client: GoogleGenAI;

  constructor(imageSaver: ImageSaver, apiKey: string, model: string) {
    super(imageSaver);

    this.modelID = model;
    this.client = new GoogleGenAI({apiKey});
  }

  async generateImage(itemId, prompt): Promise<string> {
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
    // Save the image to AWS S3
    const targetKey = `results/${itemId}.png`;
    return await this.imageSaver.uploadImage(
      imageBuffer,
      targetKey,
      'image/png',
    );
  }
}

function imageGeneratorFactory() {
  if (process.env.GEMINI_API_KEY && process.env.IMAGEN_MODEL) {
    return new ImagenGenerator(
      imageSaver,
      process.env.GEMINI_API_KEY,
      process.env.IMAGEN_MODEL,
    );
  }
  if (process.env.TOGETHER_API_KEY && process.env.TOGETHER_API_MODEL) {
    return new TogetherFluxGenerator(
      imageSaver,
      process.env.TOGETHER_API_KEY,
      process.env.TOGETHER_API_MODEL,
    );
  }
  return undefined;
}

class ItemGenerator {
  protected imagePromptGenerator: ImagePromptGenerator;
  protected imageGenerator: ImageGenerator;

  protected itemIdGenerator = new ShortUniqueId({length: 6});
  protected itemCodeGenerator = new ShortUniqueId({
    dictionary: 'number',
    length: 6,
  });
  protected engine = new Liquid();

  constructor(
    imagePromptGenerator: ImagePromptGenerator,
    imageGenerator: ImageGenerator,
  ) {
    this.imagePromptGenerator = imagePromptGenerator;
    this.imageGenerator = imageGenerator;
  }

  async generateBookingItem(bookingId: number) {
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
    const itemId = this.itemIdGenerator.rnd();
    const claimCode = this.itemCodeGenerator.rnd();

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
    const prompt = await this.imagePromptGenerator.generate(adapters[0]);
    const image = await this.imageGenerator.generateImage(itemId, prompt);

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
}

export const imageGenerator = imageGeneratorFactory();
export const imagePromptGenerator = imagePromptGeneratorFactory();
export const itemGenerator = new ItemGenerator(
  imagePromptGenerator,
  imageGenerator,
);

export {TogetherFluxGenerator, ImagenGenerator};
