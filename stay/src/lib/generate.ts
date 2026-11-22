import {
  GoogleGenAI,
  FunctionCallingConfigMode,
  FunctionDeclaration,
  Type,
} from "@google/genai";
import { Liquid } from "liquidjs";
import ShortUniqueId from "short-unique-id";

import { prisma } from "@/lib/prisma";
import { getJstDateParts } from "@/lib/jst-date";
import { imageSaver, ImageSaver } from "@/lib/storage";

export interface SeasonProfile {
  id: "winter" | "spring" | "summer" | "autumn";
  name: string;
  badge: string;
  landscape: string;
  castVariants: string[];
  settings: string[];
  moods: string[];
}

const HAKUBA_SEASONS: Record<SeasonProfile["id"], SeasonProfile> = {
  winter: {
    id: "winter",
    name: "Deep Powder Winter",
    badge: "❄️ Powder Season",
    landscape:
      "deep Hakuba powder snow, snow-laden cedar forests, towering Japanese Northern Alps peaks, crisp winter atmosphere",
    castVariants: [
      "snowboarding Japanese macaque monkeys in retro ski goggles",
      "powder-skiing Shiba Inus carving fresh tracks",
      "telemark-skiing red foxes in knitted scarves",
      "capybaras relaxing in a steaming outdoor snow onsen",
      "backcountry-splitboarding tanuki raccoons",
      "snow-biking sea turtles on a groomed alpine trail",
      "cats sipping hot espresso by a glowing wood-burning stove after skiing",
    ],
    settings: [
      "outside the cozy A-frame KT Villa chalet in Kamishiro",
      "under the Hakuba 47 red gondola with steep powder bowls behind",
      "along the dramatic Happo-One alpine ridge",
      "by the warm hearth and wood stove looking out at falling snow",
      "in the snowy cedar forest lane of Hakuba village",
    ],
    moods: [
      "golden-hour alpenglow lighting up the snowy peaks",
      "crisp bluebird morning with sparkling diamond-dust snow",
      "cozy twilight with warm amber cabin windows glowing against blue snow",
      "dramatic swirling powder clouds under a vibrant winter sky",
    ],
  },
  spring: {
    id: "spring",
    name: "Bluebird Spring Melt",
    badge: "🌸 Spring Ski & Blossom",
    landscape:
      "sunny spring ski slopes in Hakuba, snow-capped Northern Alps towering above melting crystal streams and blooming pink cherry blossoms",
    castVariants: [
      "spring-skiing rabbits wearing vintage neon sunglasses",
      "paragliding flying squirrels soaring over the valley",
      "picnicking bears sharing onigiri on a sunny wooden chalet deck",
      "slush-cup snowboarding cats splashing across a meltwater pond",
      "cycling ferrets cruising past blooming sakura and snowbanks",
      "barista badgers pulling espresso shots on an outdoor mountain terrace",
    ],
    settings: [
      "on the sun-drenched wooden deck of KT Villa in Hakuba",
      "where the snowy upper slopes meet the blossoming green valley floor",
      "beside a clear snowmelt river winding through Hakuba village",
      "at a vibrant mountain-top cafe overlooking the Northern Alps",
    ],
    moods: [
      "radiant midday sunshine with deep cobalt skies",
      "soft pastel spring sunrise mist rising from the valley",
      "warm afternoon light with crisp mountain shadows",
    ],
  },
  summer: {
    id: "summer",
    name: "Emerald Green Season",
    badge: "🌿 Alpine Green Season",
    landscape:
      "lush emerald green Hakuba mountain slopes, crystal-clear Lake Aoki mirroring the Japanese Alps, vibrant alpine wildflowers",
    castVariants: [
      "stand-up paddleboarding otters gliding across glassy Lake Aoki",
      "mountain-biking monkeys riding flowy forest trails",
      "kayaking chickens and ducks on a turquoise alpine lake",
      "glamping red pandas roasting marshmallows by a summer campfire",
      "trail-running Shiba Inus crossing a high alpine suspension bridge",
      "critters gathering fresh vegetables at a Hakuba village farmers market",
    ],
    settings: [
      "on the emerald shores of Lake Aoki in Hakuba",
      "high on the Happo-ike alpine tarn reflecting summer clouds",
      "in the shady cedar garden of KT Villa surrounded by ferns",
      "along a scenic mountain bike trail winding down Hakuba 47",
    ],
    moods: [
      "bright summer sky with towering Miyazaki-style cumulus clouds",
      "dappled golden sunlight filtering through ancient cedar trees",
      "serenesunset reflections on still turquoise mountain water",
    ],
  },
  autumn: {
    id: "autumn",
    name: "Sandan-Goyo Autumn",
    badge: "🍁 Autumn Foliage",
    landscape:
      "famous Hakuba Sandan-goyo three-tiered autumn: fresh white snow on the high alpine peaks, fiery crimson maple and golden larch mid-mountain, deep green valley below",
    castVariants: [
      "mushroom-foraging hedgehogs carrying woven baskets in the forest",
      "wood-stacking bears preparing the chalet fireplace for winter",
      "cycling foxes riding through a tunnel of golden ginkgo and red maple leaves",
      "tanuki roasting sweet potatoes over glowing embers outside the lodge",
      "stargazing owls perched on the chalet balcony with telescopes",
    ],
    settings: [
      "surrounded by golden larch and crimson maple trees in Kamishiro",
      "on the porch of KT Villa with stacked firewood and a warm stove",
      "overlooking the three-tiered autumn colors of the Hakuba ridge",
      "along a leaf-strewn mountain footpath with misty peaks beyond",
    ],
    moods: [
      "rich amber and copper late-afternoon autumn glow",
      "crisp misty morning with sunbeams piercing the colorful canopy",
      "clear dusk sky transitioning from warm terracotta to deep indigo",
    ],
  },
};

export function getHakubaSeasonProfile(dateInput?: Date | string | null): SeasonProfile {
  const d = dateInput ? new Date(dateInput) : new Date();
  const month = getJstDateParts(d).month - 1; // 0 = Jan, 11 = Dec in JST
  if (month === 11 || month === 0 || month === 1) {
    return HAKUBA_SEASONS.winter;
  }
  if (month === 2 || month === 3) {
    return HAKUBA_SEASONS.spring;
  }
  if (month >= 4 && month <= 7) {
    return HAKUBA_SEASONS.summer;
  }
  return HAKUBA_SEASONS.autumn;
}

export interface GeneratedPromptDetails {
  prompt: string;
  basePrompt: string;
  fragment: string;
  adapter: string;
  season: string;
  setting: string;
  mood: string;
  adapterId?: number;
}

function pickRandom<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

abstract class ImagePromptGenerator {
  abstract generate(
    adapterSettings: any,
    startDate?: Date
  ): Promise<string>;

  abstract generateDetailed(
    adapterSettings: any,
    startDate?: Date,
    customPrompt?: string
  ): Promise<GeneratedPromptDetails>;
}

class TemplatedImagePromptGenerator extends ImagePromptGenerator {
  protected engine = new Liquid();

  async generateDetailed(
    adapterSettings: any,
    startDate?: Date,
    customPrompt?: string
  ): Promise<GeneratedPromptDetails> {
    const seasonProfile = getHakubaSeasonProfile(startDate);
    const rawVariants: string[] = Array.isArray(adapterSettings?.variants)
      ? adapterSettings.variants
          .map((v: string) => v.trim())
          .filter(Boolean)
      : [];

    // Combine admin-configured variants with seasonal cast so it stays fresh and seasonally coherent
    const combinedCast =
      rawVariants.length > 0
        ? [...rawVariants, ...seasonProfile.castVariants]
        : seasonProfile.castVariants;

    const fragment = customPrompt?.trim() || pickRandom(combinedCast);
    const setting = pickRandom(seasonProfile.settings);
    const mood = pickRandom(seasonProfile.moods);
    const adapterStyle = adapterSettings?.adapter || "in Studio Ghibli Style";

    let basePrompt = "";
    if (adapterSettings?.promptTemplate) {
      const template = this.engine.parse(adapterSettings.promptTemplate);
      const rendered = await this.engine.render(template, {
        fragment,
        adapter: adapterStyle,
        season: seasonProfile.landscape,
        setting,
        mood,
      });
      // Enrich the rendered template with the booking's true season, Hakuba setting, and lighting mood
      basePrompt = `${rendered}. Set ${setting}, featuring ${seasonProfile.landscape}, with ${mood}. Art style: ${adapterStyle}.`;
    } else {
      basePrompt = `${fragment}, ${setting}. ${seasonProfile.landscape}, ${mood}. ${adapterStyle}.`;
    }

    return {
      prompt: basePrompt,
      basePrompt,
      fragment,
      adapter: adapterStyle,
      season: seasonProfile.name,
      setting,
      mood,
      adapterId: adapterSettings?.id,
    };
  }

  async generate(adapterSettings: any, startDate?: Date): Promise<string> {
    const details = await this.generateDetailed(adapterSettings, startDate);
    return details.prompt;
  }
}

class GeminiImagePromptGenerator extends ImagePromptGenerator {
  protected baseGenerator = new TemplatedImagePromptGenerator();
  protected client: GoogleGenAI;
  protected modelID: string;

  protected imagePromptDeclaration: FunctionDeclaration = {
    name: "imagePrompt",
    parameters: {
      type: Type.OBJECT,
      description: "Specifies a rich, art-directed text prompt for an image generation model.",
      properties: {
        prompt: {
          type: Type.STRING,
          description: "The detailed visual text prompt.",
        },
      },
      required: ["prompt"],
    },
  };

  constructor(apiKey: string, modelID: string) {
    super();
    this.client = new GoogleGenAI({ apiKey });
    this.modelID = modelID;
  }

  async generateDetailed(
    adapterSettings: any,
    startDate?: Date,
    customPrompt?: string
  ): Promise<GeneratedPromptDetails> {
    const details = await this.baseGenerator.generateDetailed(
      adapterSettings,
      startDate,
      customPrompt
    );
    try {
      const contents = [
        `You are the creative art director for KT Villa, an alpine lodge in Hakuba, Japan.`,
        `Compose a vivid, cohesive, and imaginative image generation prompt (2-4 sentences) that brings this scene to life:`,
        `- Subject / Cast: ${details.fragment}`,
        `- Location / Setting: ${details.setting}`,
        `- Season & Landscape: ${details.season} (${details.basePrompt})`,
        `- Lighting & Mood: ${details.mood}`,
        `- Required Visual Art Style: ${details.adapter}`,
        `Make the composition dynamic, charming, and unmistakably in "${details.adapter}" with no text or watermarks. Output the result via the imagePrompt function call.`,
      ].join("\n");

      const response = await this.client.models.generateContent({
        contents,
        model: this.modelID,
        config: {
          thinkingConfig: {
            thinkingBudget: 0,
          },
          toolConfig: {
            functionCallingConfig: {
              mode: FunctionCallingConfigMode.ANY,
              allowedFunctionNames: ["imagePrompt"],
            },
          },
          tools: [{ functionDeclarations: [this.imagePromptDeclaration] }],
        },
      });

      if (response.functionCalls && response.functionCalls.length === 1) {
        const finalPrompt = response.functionCalls[0].args?.["prompt"];
        if (typeof finalPrompt === "string" && finalPrompt.trim().length > 0) {
          return {
            ...details,
            prompt: finalPrompt.trim(),
          };
        }
      }
    } catch (err) {
      console.warn("Gemini prompt expansion fell back to template:", err);
    }
    return details;
  }

  async generate(adapterSettings: any, startDate?: Date): Promise<string> {
    const details = await this.generateDetailed(adapterSettings, startDate);
    return details.prompt;
  }
}

function imagePromptGeneratorFactory() {
  if (process.env.GEMINI_API_KEY && process.env.GEMINI_TEXT_MODEL) {
    return new GeminiImagePromptGenerator(
      process.env.GEMINI_API_KEY,
      process.env.GEMINI_TEXT_MODEL
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

class ImagenGenerator extends ImageGenerator {
  protected modelID: string;
  protected client: GoogleGenAI;

  constructor(imageSaver: ImageSaver, apiKey: string, model: string) {
    super(imageSaver);

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
    if (!response || response.generatedImages.length !== 1) {
      throw new Error("Imagen failed to generate an image");
    }
    const imageBuffer = Buffer.from(
      response.generatedImages[0].image.imageBytes,
      "base64"
    );
    const targetKey = `results/${itemId}.png`;
    return await this.imageSaver.uploadImage(
      imageBuffer,
      targetKey,
      "image/png"
    );
  }
}

class GeminiImageGenerator extends ImageGenerator {
  protected modelID: string;
  protected client: GoogleGenAI;

  constructor(imageSaver: ImageSaver, apiKey: string, model: string) {
    super(imageSaver);

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
    const response = await this.client.models.generateContentStream({
      model: this.modelID,
      contents,
      config: {
        responseModalities: ["IMAGE", "TEXT"],
        imageConfig: {
          aspectRatio: "1:1",
          imageSize: "1K",
        },
      },
    });
    for await (const chunk of response) {
      if (
        !chunk.candidates ||
        !chunk.candidates[0].content ||
        !chunk.candidates[0].content.parts
      ) {
        continue;
      }
      for (const part of chunk.candidates[0].content.parts) {
        if (part?.inlineData?.data) {
          const imageBuffer = Buffer.from(part.inlineData.data, "base64");
          const targetKey = `results/${itemId}.png`;
          return await this.imageSaver.uploadImage(
            imageBuffer,
            targetKey,
            "image/png"
          );
        }
      }
    }
    throw new Error("No image generated by Gemini");
  }
}

function imageGeneratorFactory() {
  if (process.env.GEMINI_API_KEY && process.env.GEMINI_IMAGE_MODEL) {
    return new GeminiImageGenerator(
      imageSaver,
      process.env.GEMINI_API_KEY,
      process.env.GEMINI_IMAGE_MODEL
    );
  }
  if (process.env.GEMINI_API_KEY && process.env.IMAGEN_MODEL) {
    return new ImagenGenerator(
      imageSaver,
      process.env.GEMINI_API_KEY,
      process.env.IMAGEN_MODEL
    );
  }
  return undefined;
}

class ItemGenerator {
  protected imagePromptGenerator: ImagePromptGenerator;
  protected imageGenerator: ImageGenerator;

  protected itemIdGenerator = new ShortUniqueId({ length: 6 });
  protected itemCodeGenerator = new ShortUniqueId({
    dictionary: "number",
    length: 6,
  });

  constructor(
    imagePromptGenerator: ImagePromptGenerator,
    imageGenerator: ImageGenerator
  ) {
    this.imagePromptGenerator = imagePromptGenerator;
    this.imageGenerator = imageGenerator;
  }

  /**
   * Selects an ImageAdapterSetting for a given trip date.
   * - If overrideAdapterId is provided (e.g. from Admin), uses that exact adapter.
   * - If startDate falls inside a scheduled 14-day adapter window, uses that window's adapter.
   * - Otherwise (e.g., future dates past the last scheduled startDate), cycles across all
   *   adapters while avoiding styles used in the most recent StableItems so art stays fresh!
   */
  async selectAdapter(startDate: Date, overrideAdapterId?: number) {
    if (overrideAdapterId) {
      const explicit = await prisma.imageAdapterSetting.findUnique({
        where: { id: overrideAdapterId },
      });
      if (explicit) return explicit;
    }

    const allAdapters = await prisma.imageAdapterSetting.findMany({
      orderBy: { startDate: "asc" },
    });
    if (!allAdapters || allAdapters.length === 0) {
      return undefined;
    }

    const targetMs = new Date(startDate).getTime();
    const FOURTEEN_DAYS_MS = 14 * 24 * 60 * 60 * 1000;

    // Check if startDate falls inside an explicit 14-day window
    for (let i = 0; i < allAdapters.length; i++) {
      const currStart = new Date(allAdapters[i].startDate).getTime();
      const nextStart =
        i + 1 < allAdapters.length
          ? new Date(allAdapters[i + 1].startDate).getTime()
          : currStart + FOURTEEN_DAYS_MS;
      if (targetMs >= currStart && targetMs < nextStart) {
        return allAdapters[i];
      }
    }

    // Dynamic fresh rotation when outside static windows:
    // Find recently used adapter IDs in the last 8 StableItems to avoid repeats
    const recentItems = await prisma.stableItem.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      select: { imageRequest: true },
    });
    const recentAdapterIds = new Set<number>();
    for (const item of recentItems) {
      const req = item.imageRequest as any;
      if (req && typeof req.adapterId === "number") {
        recentAdapterIds.add(req.adapterId);
      }
    }

    const freshCandidates = allAdapters.filter(
      (a) => !recentAdapterIds.has(a.id)
    );
    const pool = freshCandidates.length > 0 ? freshCandidates : allAdapters;
    return pickRandom(pool);
  }

  async generateBookingItem(
    bookingId: number,
    options?: {
      forceRegenerate?: boolean;
      adapterId?: number;
      customPrompt?: string;
    }
  ) {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
    });
    if (!booking) {
      console.error("No booking found");
      return undefined;
    }
    if (booking.userItemId && !options?.forceRegenerate) {
      console.error("Already has item");
      return booking;
    }

    try {
      const userItemId = await this.generateItem(
        booking.userId,
        booking.startDate,
        {
          adapterId: options?.adapterId,
          customPrompt: options?.customPrompt,
        }
      );
      if (!userItemId) {
        return booking;
      }
      return await prisma.booking.update({
        where: { id: bookingId },
        data: {
          userItemId,
        },
      });
    } catch (e) {
      console.error(e);
      throw e;
    }
  }

  async generateItem(
    userId: string,
    startDate: Date,
    options?: {
      adapterId?: number;
      customPrompt?: string;
    }
  ): Promise<string> {
    const itemId = this.itemIdGenerator.rnd();
    const claimCode = this.itemCodeGenerator.rnd();

    const adapter = await this.selectAdapter(startDate, options?.adapterId);
    if (!adapter) {
      return undefined;
    }

    const details = await this.imagePromptGenerator.generateDetailed(
      adapter,
      startDate,
      options?.customPrompt
    );
    const image = await this.imageGenerator.generateImage(
      itemId,
      details.prompt
    );

    await prisma.stableItem.create({
      data: {
        id: itemId,
        image,
        text: details.prompt,
        character: {
          fragment: details.fragment,
          style: details.adapter,
          season: details.season,
        },
        imageRequest: {
          adapterId: adapter.id,
          setting: details.setting,
          mood: details.mood,
          basePrompt: details.basePrompt,
          generatedAt: new Date().toISOString(),
        },
        claimCode,
        claimStatus: "claimed",
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
  imageGenerator
);

export { ImagenGenerator };
