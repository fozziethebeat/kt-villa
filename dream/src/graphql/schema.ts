import {DateTimeResolver, GraphQLJSON} from 'graphql-scalars';
import {gql} from 'graphql-tag';
import {Liquid} from 'liquidjs';
import slug from 'slug';
import ShortUniqueId from 'short-unique-id';

import {imageGenerator} from '@/lib/generate';
import {prisma} from '@/lib/prisma';

const engine = new Liquid();

export const typeDefs = gql`
  scalar DateTime
  scalar JSON

  type Style {
    id: String!
    pattern: String!
  }

  type Image {
    url: String!
  }

  input TestStyleInput {
    id: String!
    prompt: String!
  }

  type Query {
    styles: [Style!]!
    style(id: String): Style
  }

  type Mutation {
    testStyle(input: TestStyleInput!): Image
  }
`;

export const resolvers = {
  Query: {
    style: (a, {id}) => {
      return prisma.style.findUnique({where: {id}});
    },

    styles: () => {
      return prisma.style.findMany();
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
  },

  DateTime: DateTimeResolver,
  JSON: GraphQLJSON,
};
