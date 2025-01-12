import {DateTimeResolver, GraphQLJSON} from 'graphql-scalars';
import {GoogleGenerativeAI} from '@google/generative-ai';
import {gql} from 'graphql-tag';
import {Liquid} from 'liquidjs';
import slug from 'slug';
import ShortUniqueId from 'short-unique-id';

import {imageGenerator} from '@/lib/generate';
import {prisma} from '@/lib/prisma';

const engine = new Liquid();

const geminiAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export const typeDefs = gql`
  scalar DateTime
  scalar JSON

  type Style {
    id: String!
    pattern: String!
  }

  type DreamTheme {
    id: String!
    theme: String!
    description: String!
  }

  type Image {
    url: String!
    prompt: String!
  }

  type Story {
    story: String!
  }

  input TestStyleInput {
    id: String!
    prompt: String!
  }

  input DreamImageGenerateInput {
    story: String!
    style: String!
  }

  input DreamStoryGenerateInput {
    initialStory: String!
    themeId: String!
  }

  input DreamInput {
    memory: String!
    story: String!
    dreamImage: String!
    prompt: String!
  }

  type User {
    id: String!
    name: String
    email: String
  }

  type Dream {
    id: String!
    memory: String!
    story: String!
    dreamImage: String!
    prompt: String!
    user: User!
  }

  type Query {
    dreamThemes: [DreamTheme!]!
    styles: [Style!]!
    style(id: String): Style
    dreams: [Dream!]!
    userDream: Dream
  }

  type Mutation {
    testStyle(input: TestStyleInput!): Image
    dreamImage(input: DreamImageGenerateInput!): Image
    dreamStory(input: DreamStoryGenerateInput!): Story
    saveDream(input: DreamInput!): Dream
  }
`;

export const resolvers = {
  Query: {
    dreamThemes: () => {
      return prisma.dreamTheme.findMany();
    },

    style: (a, {id}) => {
      return prisma.style.findUnique({where: {id}});
    },

    styles: () => {
      return prisma.style.findMany();
    },

    dreams: (a, b, {user}) => {
      return prisma.dream.findMany({
        where: {userId: {not: user.id}},
      });
    },

    userDream: (a, b, {user}) => {
      return prisma.dream.findUnique({
        where: {userId: user.id},
      });
    },
  },

  Mutation: {
    testStyle: async (a, {input}) => {
      const style = await prisma.style.findUnique({where: {id: input.id}});
      if (!style) {
        return undefined;
      }
      const prompt = await engine.parseAndRender(style.pattern, {
        text: input.prompt,
      });
      const image = await imageGenerator.generateImage(
        `test-${style.id}`,
        prompt,
      );
      return {url: image};
    },

    dreamStory: async (a, {input}) => {
      return {
        story: `${input.initialStory} + MAGIC`,
      };
      const theme = await prisma.dreamTheme.findUnique({
        where: {id: input.themeId},
      });
      const promptTemplate = await prisma.promptTemplate.findUnique({
        where: {id: 'dreamStorySystem'},
      });
      if (!promptTemplate || !theme) {
        throw new Error('System not setup properly');
      }
      const systemInstruction = await engine.parseAndRender(
        promptTemplate.template,
        {
          theme: theme.description,
        },
      );

      const model = geminiAI.getGenerativeModel({
        model: process.env.GEMINI_MODEL,
        systemInstruction,
      });
      const generationConfig = {
        temperature: 1,
        topP: 0.95,
        topK: 10,
        maxOutputTokens: 2000,
        responseMimeType: 'application/json',
        responseSchema: {
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
        },
      };
      const chatSession = model.startChat({generationConfig});
      const result = await chatSession.sendMessage(input.initialStory);
      return JSON.parse(result.response.text())['dream']['story'];
    },

    dreamImage: async (a, {input}) => {
      // Hard coded during testing to save credits.
      return {
        url: 'https://stablesoaps-w1.s3.amazonaws.com/results/vfuX7I.png',
        prompt: input.story + 'PROMPT',
      };

      const promptTemplate = await prisma.promptTemplate.findUnique({
        where: {id: 'dreamImageSystem'},
      });
      if (!promptTemplate) {
        throw new Error('System not setup properly');
      }
      const systemInstruction = await engine.parseAndRender(
        promptTemplate.template,
        {
          style: input.style,
        },
      );

      const model = geminiAI.getGenerativeModel({
        model: process.env.GEMINI_MODEL,
        systemInstruction,
      });
      const generationConfig = {
        temperature: 1,
        topP: 0.95,
        topK: 10,
        maxOutputTokens: 2000,
        responseMimeType: 'application/json',
        responseSchema: {
          type: 'object',
          properties: {
            imagePrompt: {
              type: 'string',
            },
          },
        },
      };
      const chatSession = model.startChat({generationConfig});
      const result = await chatSession.sendMessage(input.story);
      const imagePrompt = JSON.parse(result.response.text())['imagePrompt'];
      const imageID = imageGenerator.itemIdGenerator.rnd();
      const image = await imageGenerator.generateImage(imageID, imagePrompt);
      return {url: image, prompt: imagePrompt};
    },

    saveDream: (a, {input}, {user}) => {
      return prisma.dream.create({
        data: {
          ...input,
          userId: user.id,
        },
      });
    },
  },

  DateTime: DateTimeResolver,
  JSON: GraphQLJSON,
};
