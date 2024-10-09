import { gql } from "graphql-tag";

import { prisma } from "@/lib/prisma";

export const typeDefs = gql`
  type Query {
    hello: String
  }

  type BookingItem {
    id: String!
    image: String!
    text: String
    claimCode: String
    claimStatus: String!
    claimVisible: Boolean!
    ownerId: Int
    ownerUsername: String
  }

  type Query {
    bookingItems: [BookingItem!]!
    bookingItem(id: String!): BookingItem
  }
`;

export const resolvers = {
  Query: {
    hello: () => {
      return "Hello World!";
    },

    bookingItems: () => {
      return prisma.stableItem.findMany();
    },
  },
  BookingItem: {
    /**
     * Resolves {@code ownerUsername} according to the current user's access
     * rights.
     */
    ownerUsername: async (item, _, { user }) => {
      if (!user) {
        return "anon";
      }
      if (!item.claimVisible) {
        return "anon";
      }
      if (!item.ownerId) {
        return "unknown";
      }
      if (item?.claimStatus !== "claimed") {
        return "none";
      }
      if (item.ownerId === user.id) {
        return "you";
      }
      // The user has permission to look up who owns this, so do the real
      // lookup.
      const owner = await prisma.user.findUnique({
        where: { id: item.ownerId },
        select: { name: true },
      });
      return owner.name;
    },
  },
};
