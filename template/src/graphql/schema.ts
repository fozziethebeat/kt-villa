import { DateTimeResolver, GraphQLJSON } from 'graphql-scalars';
import { gql } from 'graphql-tag';
import { Liquid } from 'liquidjs';
import { randomUUID } from 'crypto';

import prisma from '@/lib/prisma';
import { imageGenerator } from '@/lib/generate';

const engine = new Liquid();

export const typeDefs = gql`
  scalar DateTime
  scalar JSON

  type Entity {
    id: String!
    name: String!
    content: String!
  }

  type Query {
    entities: [Entity!]!
    adminEntities: [Entity!]!
  }

  type Mutation {
    testGenerateImage(prompt: String!): String!
  }
`;

export const resolvers = {
  Query: {
    entities: () => {
      return prisma.entity.findMany();
    },

    adminEntities: async (_parent: any, _args: any, { user }: any) => {
      if (user?.roles !== 'admin') {
        return [];
      }
      return prisma.entity.findMany();
    },
  },

  Mutation: {
    testGenerateImage: async (_parent: any, { prompt }: { prompt: string }, { user }: any) => {
      if (user?.roles !== 'admin') {
        throw new Error('Not authorized');
      }
      const itemId = randomUUID();
      try {
        // generateImage returns the URL of the saved image
        return await imageGenerator.generateImage(itemId, prompt);
      } catch (e: any) {
        console.error("Image generation failed:", e);
        throw new Error(`Image generation failed: ${e.message}`);
      }
    },
  },

  DateTime: DateTimeResolver,
  JSON: GraphQLJSON,
};
