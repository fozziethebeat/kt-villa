import {DateTimeResolver, GraphQLJSON} from 'graphql-scalars';
import {gql} from 'graphql-tag';
import {Liquid} from 'liquidjs';

import {textGenerator, imageGenerator} from '@/lib/generate';
import {prisma} from '@/lib/prisma';

const engine = new Liquid();

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
    username: String
    email: String!
  }

  type Project {
    id: String!
    code: String!
    name: String!
    description: String
    owner: User!

    defaultDream: String!
    defaultMemory: String!
    defaultStory: String!
  }

  type Dream {
    id: String!
    memory: String!
    story: String!
    dreamImage: String!
    prompt: String!
    user: User!
    project: Project!
    isUserDream: Boolean
  }

  type Query {
    dreamThemes: [DreamTheme!]!
    style(id: String): Style
    styles: [Style!]!
    adminDreams: [Dream!]!
    dreamsByProject(projectId: String!): [Dream!]!
    projects: [Project!]!
    projectByUserCode(ownerId: String!, code: String!): Project
    joinedProjects: [Project!]!
    userDream(id: String!): Dream
    userDreams: [Dream!]!
  }

  type Mutation {
    testStyle(input: TestStyleInput!): Image
    dreamImage(projectId: String!, input: DreamImageGenerateInput!): Image
    dreamStory(projectId: String!, input: DreamStoryGenerateInput!): Story
    saveDream(input: DreamInput!): Dream
    updateDream(id: String!, input: DreamInput!): Dream
    updateUsername(input: String!): User
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

    projectByUserCode: (a, {ownerId, code}, {user}) => {
      return prisma.project.findFirst({
        where: {
          ownerId,
          code,
          OR: [
            {
              ownerId: user.username,
            },
            {
              members: {
                some: {
                  id: user.id,
                },
              },
            },
          ],
        },
      });
    },

    projects: (a, b, {user}) => {
      return prisma.project.findMany({
        where: {ownerId: user.username},
      });
    },

    joinedProjects: (a, b, {user}) => {
      return prisma.project.findMany({
        where: {
          members: {
            some: {
              id: user.id,
            },
          },
        },
      });
    },

    adminDreams: (a, b) => {
      return prisma.dream.findMany({
        orderBy: {
          id: 'asc',
        },
      });
    },

    dreamsByProject: async (a, {projectId}, {user}) => {
      // First, verify the user has access to this project.
      const project = await prisma.project.findUnique({
        where: {
          id: projectId,
          OR: [
            {
              ownerId: user.username,
            },
            {
              members: {
                some: {
                  id: user.id,
                },
              },
            },
          ],
        },
        select: {
          dreams: true,
        },
      });
      if (!project || project.dreams.length === 0) {
        return [];
      }
      // Now we have all the dreams, just sort them such that the user's dream is first.
      const dreams = [...project.dreams];
      dreams.sort((a, b) => {
        const aIsCurrentUserDream = a.userId === user.id;
        const bIsCurrentUserDream = b.userId === user.id;
        if (aIsCurrentUserDream && !bIsCurrentUserDream) {
          return -1;
        }
        if (!aIsCurrentUserDream && bIsCurrentUserDream) {
          return 1;
        }

        if (a.createdAt < b.createdAt) {
          return -1;
        }
        if (a.createdAt > b.createdAt) {
          return 1;
        }

        return 0;
      });
      if (dreams[0].userId === user.id) {
        dreams[0].isUserDream = true;
      }
      return dreams;
    },

    userDream: (a, {id}, {user}) => {
      if (!user?.id) {
        return undefined;
      }
      return prisma.dream.findUnique({
        where: {id, userId: user.id},
      });
    },

    userDreams: (a, b, {user}) => {
      if (!user?.id) {
        return undefined;
      }
      return prisma.dream.findMany({
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

    dreamStory: async (a, {projectId, input}) => {
      const project = await prisma.project.findUnique({
        where: {id: projectId},
      });
      const theme = await prisma.dreamTheme.findUnique({
        where: {id: input.themeId},
      });
      const story = await textGenerator.generateStory(
        project.systemTemplateStory,
        input.initialStory,
        theme.description,
      );
      return {story};
    },

    dreamImage: async (a, {projectId, input}) => {
      const project = await prisma.project.findUnique({
        where: {id: projectId},
      });
      const imagePrompt = await textGenerator.generateImagePrompt(
        project.systemTemplateDream,
        input.story,
        input.style,
      );
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

    updateDream: (a, {id, input}, {user}) => {
      return prisma.dream.update({
        where: {id},
        data: input,
      });
    },

    updateUsername: (a, {input}, {user}) => {
      return prisma.user.update({
        where: {id: user.id},
        data: {name: input},
      });
    },
  },

  DateTime: DateTimeResolver,
  JSON: GraphQLJSON,

  Dream: {
    user: dream => {
      return prisma.dream.findUnique({where: {id: dream.id}}).user();
    },

    project: dream => {
      return prisma.dream.findUnique({where: {id: dream.id}}).project();
    },
  },

  Project: {
    owner: project => {
      return prisma.project.findUnique({where: {id: project.id}}).owner();
    },
  },
};
