import {DateTimeResolver, GraphQLJSON} from 'graphql-scalars';
import {gql} from 'graphql-tag';
import {Liquid} from 'liquidjs';

import prisma from '@/lib/prisma';

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
`;

export const resolvers = {
  Query: {
    entities: () => {
      return prisma.entity.findMany();
    },

    adminEntities: async (a, b, {user}) => {
      if (user?.roles !== 'admin') {
        return [];
      }
      return prisma.entity.findMany();
    },
  },

  DateTime: DateTimeResolver,
  JSON: GraphQLJSON,
};
