import { DateTimeResolver, GraphQLJSON } from 'graphql-scalars';
import { gql } from 'graphql-tag';

import prisma from '@/lib/prisma';

export const typeDefs = gql`
  scalar DateTime
  scalar JSON

  type Song {
    id: String!
    title: String!
    artist: String!
    albumArt: String
    spotifyUrl: String
    sortOrder: Int!
    createdAt: DateTime!
    journeyEntry: JourneyEntry
  }

  type JourneyEntry {
    id: String!
    songId: String!
    memory: String!
    mood: String
    createdAt: DateTime!
  }

  type Query {
    songs: [Song!]!
    adminSongs: [Song!]!
    song(id: String!): Song
  }

  type Mutation {
    placeholder: String
  }
`;

export const resolvers = {
  Query: {
    songs: () => {
      return prisma.song.findMany({
        orderBy: { sortOrder: 'asc' },
        include: { journeyEntry: true },
      });
    },

    adminSongs: async (_parent: any, _args: any, { user }: any) => {
      if (user?.roles !== 'admin') {
        return [];
      }
      return prisma.song.findMany({
        orderBy: { sortOrder: 'asc' },
        include: { journeyEntry: true },
      });
    },

    song: async (_parent: any, { id }: { id: string }) => {
      return prisma.song.findUnique({
        where: { id },
        include: { journeyEntry: true },
      });
    },
  },

  Mutation: {
    placeholder: () => 'ok',
  },

  DateTime: DateTimeResolver,
  JSON: GraphQLJSON,
};
