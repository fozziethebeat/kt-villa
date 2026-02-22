import { GoogleGenAI } from "@google/genai";

import { imageSaver, ImageSaver } from "@/lib/storage";

abstract class ImageGenerationService {
  saver: ImageSaver;

  constructor(saver: ImageSaver) {
    this.saver = saver;
  }

  abstract generateImage(itemId: string, prompt: string): Promise<string>;

  async editImage(
    itemId: string,
    base64Image: string,
    prompt: string
  ): Promise<string> {
    throw new Error("unsupported");
  }
}

const MODEL_CONFIGS: Record<string, any> = {
  "gemini-3-flash-image-preview": {
    responseModalities: ["IMAGE", "TEXT"],
    imageConfig: {
      aspectRatio: "1:1",
      imageSize: "1K",
    },
  },
  "gemini-3-pro-image-preview": {
    responseModalities: ["IMAGE", "TEXT"],
    imageConfig: {
      aspectRatio: "1:1",
      imageSize: "1K",
    },
  },
  "gemini-2.5-flash-image": {
    responseModalities: ["IMAGE", "TEXT"],
  },
};

class GeminiImageGenerator extends ImageGenerationService {
  protected modelID: string;
  protected client: GoogleGenAI;

  constructor(saver: ImageSaver, apiKey: string, model: string) {
    super(saver);

    this.modelID = model;
    this.client = new GoogleGenAI({ apiKey });
  }

  async generateImage(itemId: string, prompt: string): Promise<string> {
    const contents = [
      {
        role: "user",
        parts: [
          {
            text: prompt,
          },
        ],
      },
    ];

    const modelConfig = MODEL_CONFIGS[this.modelID] || MODEL_CONFIGS["gemini-2.0-flash-exp"];

    const response = await this.client.models.generateContentStream({
      model: this.modelID,
      contents,
      config: modelConfig,
    });
    for await (const chunk of response) {
      if (
        !chunk.candidates ||
        !chunk.candidates[0].content ||
        !chunk.candidates[0].content.parts
      ) {
        continue;
      }
      if (chunk.candidates?.[0]?.content?.parts?.[0]?.inlineData) {
        const inlineData = chunk.candidates[0].content.parts[0].inlineData;
        const imageBuffer = Buffer.from(inlineData.data || "", "base64");
        const targetKey = `results/${itemId}.png`;
        return await this.saver.uploadImage(
          // Save the image to AWS S3
          imageBuffer,
          targetKey,
          "image/png"
        );
      }
    }
    throw new Error("No image generated");
  }
}

class ImagenGenerator extends ImageGenerationService {
  protected modelID: string;
  protected client: GoogleGenAI;

  constructor(saver: ImageSaver, apiKey: string, model: string) {
    super(saver);

    this.modelID = model;
    this.client = new GoogleGenAI({ apiKey });
  }

  async generateImage(itemId: string, prompt: string): Promise<string> {
    const response = await this.client.models.generateImages({
      model: this.modelID,
      prompt: prompt,
      config: {
        numberOfImages: 1,
      },
    });
    if (
      !response ||
      !response.generatedImages ||
      response.generatedImages.length != 1
    ) {
      throw new Error("Gemini Don't work");
    }
    const imageBytes = response.generatedImages[0].image?.imageBytes;
    if (!imageBytes) {
      throw new Error("Gemini Don't work");
    }
    const imageBuffer = Buffer.from(imageBytes, "base64");
    const targetKey = `results/${itemId}.png`;
    return await this.saver.uploadImage(imageBuffer, targetKey, "image/png");
  }

  async editImage(
    itemId: string,
    base64Image: string,
    prompt: string
  ): Promise<string> {
    const contents = [
      { text: prompt },
      {
        inlineData: {
          mimeType: "image/png",
          data: base64Image,
        },
      },
    ];
    const response = await this.client.models.generateContent({
      contents,
      model: this.modelID,
      config: {
        responseModalities: ["Text", "Image"],
      },
    });
    const candidates = response.candidates || [];
    if (candidates.length === 0 || !candidates[0].content?.parts) {
      throw new Error("Gemini Don't work");
    }
    for (const part of candidates[0].content.parts) {
      if (part.text) {
        console.log(part.text);
      } else if (part.inlineData?.data) {
        const imageData = part.inlineData.data;
        const buffer = Buffer.from(imageData, "base64");
        const targetKey = `results/${itemId}.png`;
        return await this.saver.uploadImage(buffer, targetKey, "image/png");
      }
    }
    throw new Error("Gemini Don't work");
  }
}

function imageGeneratorFactory() {
  const apiKey = process.env.GEMINI_API_KEY;
  const geminiModel = process.env.GEMINI_MODEL || process.env.GEMINI_IMAGE_MODEL;
  const imagenModel = process.env.IMAGEN_MODEL;

  if (apiKey && geminiModel) {
    return new GeminiImageGenerator(
      imageSaver,
      apiKey,
      geminiModel
    );
  }
  if (apiKey && imagenModel) {
    return new ImagenGenerator(
      imageSaver,
      apiKey,
      imagenModel
    );
  }

  // Return a proxy or a dummy if in build time, or throw if used at runtime
  return {
    generateImage: async () => {
      throw new Error("No imageGenerator configured. Check GEMINI_API_KEY and GEMINI_MODEL/IMAGEN_MODEL.");
    },
    editImage: async () => {
      throw new Error("No imageGenerator configured.");
    }
  } as any as ImageGenerationService;
}

export const imageGenerator = imageGeneratorFactory();
