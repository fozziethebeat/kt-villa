import {GoogleGenAI} from '@google/genai';

import {imageSaver, ImageSaver} from '@/lib/storage';

abstract class ImageGenerationService {
  saver: ImageSaver;

  constructor(saver: ImageSaver) {
    this.saver = saver;
  }

  abstract generateImage(itemId: string, prompt: string): Promise<string>;

  async editImage(
    itemId: string,
    base64Image: string,
    prompt: string,
  ): Promise<string> {
    throw new Error('unsupported');
  }
}

class GeminiImageGenerator extends ImageGenerationService {
  protected modelID: string;
  protected client: GoogleGenAI;

  constructor(saver: ImageSaver, apiKey: string, model: string) {
    super(saver);

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
            return await this.saver.uploadImage(
              imageBuffer,
              targetKey,
              'image/png',
            );
          } catch (err) {
            console.error(err);
          }
        }
      }
    }

    throw new Error("Gemini Don't work");
  }
}

class ImagenGenerator extends ImageGenerationService {
  protected modelID: string;
  protected client: GoogleGenAI;

  constructor(saver: ImageSaver, apiKey: string, model: string) {
    super(saver);

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
    return await this.saver.uploadImage(imageBuffer, targetKey, 'image/png');
  }

  async editImage(
    itemId: string,
    base64Image: string,
    prompt: string,
  ): Promise<string> {
    const contents = [
      {text: prompt},
      {
        inlineData: {
          mimeType: 'image/png',
          data: base64Image,
        },
      },
    ];
    const response = await this.client.models.generateContent({
      contents,
      model: this.modelID,
      config: {
        responseModalities: ['Text', 'Image'],
      },
    });
    for (const part of response.candidates[0].content.parts) {
      if (part.text) {
        console.log(part.text);
      } else if (part.inlineData) {
        const imageData = part.inlineData.data;
        const buffer = Buffer.from(imageData, 'base64');
        const targetKey = `results/${itemId}.png`;
        return await this.saver.uploadImage(buffer, targetKey, 'image/png');
      }
    }
  }
}

function imageGeneratorFactory() {
  if (process.env.GEMINI_API_KEY && process.env.GEMINI_MODEL) {
    return new GeminiImageGenerator(
      imageSaver,
      process.env.GEMINI_API_KEY,
      process.env.GEMINI_MODEL,
    );
  }
  if (process.env.GEMINI_API_KEY && process.env.IMAGEN_MODEL) {
    return new ImagenGenerator(
      imageSaver,
      process.env.GEMINI_API_KEY,
      process.env.IMAGEN_MODEL,
    );
  }

  throw new Error('No imageGenerator');
}

export const imageGenerator = imageGeneratorFactory();
