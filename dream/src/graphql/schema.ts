import {DateTimeResolver, GraphQLJSON} from 'graphql-scalars';
import {GoogleGenerativeAI} from '@google/generative-ai';
import {gql} from 'graphql-tag';
import {Liquid} from 'liquidjs';

import {textGenerator, imageGenerator} from '@/lib/generate';
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
      if (!user?.id) {
        return undefined;
      }
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
      const theme = await prisma.dreamTheme.findUnique({
        where: {id: input.themeId},
      });
      if (textGenerator) {
        console.log('using text generator');
        const story = await textGenerator.generateStory(
          input.initialStory,
          theme.description,
        );
        return {story};
      }

      const promptTemplate = await prisma.promptTemplate.findUnique({
        where: {id: 'dreamStorySystem'},
      });
      if (!promptTemplate || !theme) {
        throw new Error('System not setup properly');
      }
      console.log(promptTemplate.template);
      const systemInstruction = await engine.parseAndRender(
        promptTemplate.template,
        {
          theme: theme.description,
        },
      );
      console.log(systemInstruction);

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
      // @ts-expect-error
      const chatSession = model.startChat({generationConfig});
      const result = await chatSession.sendMessage(input.initialStory);
      const resultRaw = result.response.text();
      console.log(resultRaw);
      const resultObj = JSON.parse(resultRaw);
      console.log(resultObj);
      return resultObj['dream']['story'];
    },

    dreamImage: async (a, {input}) => {
      let imagePrompt = '';
      if (textGenerator) {
        imagePrompt = await textGenerator.generateImagePrompt(
          input.story,
          input.style,
        );
      } else {
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
        // @ts-expect-error
        const chatSession = model.startChat({generationConfig});
        const result = await chatSession.sendMessage(input.story);
        imagePrompt = JSON.parse(result.response.text())['imagePrompt'];
      }
      console.log(imagePrompt);
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

  Dream: {
    user: dream => {
      return prisma.dream.findUnique({where: {id: dream.id}}).user();
    },
  },
};
