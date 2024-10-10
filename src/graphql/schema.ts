import { DateTimeResolver } from "graphql-scalars";
import { gql } from "graphql-tag";

import { prisma } from "@/lib/prisma";

export const typeDefs = gql`
  scalar DateTime

  type Query {
    hello: String
  }

  type User {
    id: String!
    name: String
    email: String!
    hashedPassword: String!
    salt: String!
    resetToken: String
    resetTokenExpiresAt: DateTime
    roles: String!
    StableItem: [BookingItem]!
    booking: [Booking]!
    trustStatus: String!
  }

  type Booking {
    id: Int!
    startDate: DateTime
    endDate: DateTime
    numGuests: Int
    withCat: Boolean!
    withDog: Boolean!
    status: String!
    bookingCode: String
    item: BookingItem
    member: [MemberBooking!]
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

  type MemberBooking {
    id: Int!
    status: String!
    user: User!
    booking: Booking!
    item: BookingItem
  }

  type AdminBooking {
    id: String!
    startDate: DateTime
    endDate: DateTime
    numGuests: Int
    withCat: Boolean!
    withDog: Boolean!
    status: String!
    bookingCode: String
    userId: String
    user: User
    item: BookingItem
    member: [MemberBooking!]
  }

  type Query {
    adminBookings: [AdminBooking!]!
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

    bookingItem: (_, { id }) => {
      return prisma.stableItem.findUnique({
        where: { id },
      });
    },

    adminBookings: (a, b, { user }) => {
      if (!user || !user?.roles === "admin") {
        throw new Error("Access not supported");
      }
      return prisma.booking.findMany();
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
  AdminBooking: {
    user: (booking) => {
      return prisma.booking.findUnique({ where: { id: booking?.id } }).user();
    },
    item: (booking) => {
      return prisma.booking
        .findUnique({ where: { id: booking?.id } })
        .userItem();
    },
  },

  DateTime: DateTimeResolver,
};
