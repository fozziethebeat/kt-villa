import { DateTimeResolver } from "graphql-scalars";
import { gql } from "graphql-tag";

import { generateItem, generateImageFromAdapter } from "@/lib/generate";
import { prisma } from "@/lib/prisma";

export const typeDefs = gql`
  scalar DateTime

  type User {
    id: String!
    name: String
    email: String!
    roles: String!
    StableItem: [BookingItem]!
    booking: [Booking]!
    trustStatus: String!
  }

  type Query {
    hello: String
  }

  type ImageAdapterSetting {
    id: Int!
    startDate: DateTime!
    adapter: String!
    promptTemplate: String!
    negativePrompt: String!
    steps: Int!
    variants: [String!]!
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
    maxGuests: Int
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
    ownerId: String
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

  input ImageAdapterInput {
    id: Int!
    adapter: String!
    promptTemplate: String!
    negativePrompt: String!
    steps: Int!
    variants: [String!]!
  }

  type TestImage {
    url: String!
  }

  input UpdateBookingInput {
    startDate: DateTime
    endDate: DateTime
    numGuests: Int
    maxGuests: Int
    userId: String
    withCat: Boolean
    withDog: Boolean
  }

  type Query {
    adminBookings: [AdminBooking!]!
    bookingItems: [BookingItem!]!
    bookingItem(id: String!): BookingItem
    imageAdapterSettings: [ImageAdapterSetting!]!
    imageAdapterSetting(id: Int!): ImageAdapterSetting
    memberBookings: [MemberBooking!]!

    users: [User!]!
    user(id: String!): User

    userBookings: [Booking!]!
    userBooking(bookingCode: String!): Booking
  }

  type Mutation {
    addMemberBooking(id: Int!, username: String!): Booking!
    testImageAdapter(input: ImageAdapterInput!): TestImage!
    updateBooking(id: Int!, input: UpdateBookingInput!): Booking!
    updateImageAdapter(
      id: Int!
      input: ImageAdapterInput!
    ): ImageAdapterSetting!
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

    imageAdapterSettings: () => {
      return prisma.imageAdapterSetting.findMany();
    },

    imageAdapterSetting: (a, { id }) => {
      return prisma.imageAdapterSetting.findUnique({
        where: { id },
      });
    },

    memberBookings: (a, b, { user }) => {
      return prisma.memberBooking.findMany({
        where: {
          userId: user.id,
        },
        orderBy: {
          booking: {
            startDate: "asc",
          },
        },
      });
    },

    users: (a, b, { user }) => {
      if (user?.roles !== "admin") {
        throw new Error("Access not supported");
      }
      return prisma.user.findMany();
    },

    userBookings: (a, b, { user }) => {
      if (!user) {
        throw new Error("Access not supported");
      }
      return prisma.booking.findMany({
        where: {
          userId: user.id,
        },
        orderBy: {
          startDate: "asc",
        },
      });
    },

    userBooking: (a, { bookingCode }, { user }) => {
      if (!user) {
        throw new Error("Access not supported");
      }
      return prisma.booking.findUnique({
        where: { bookingCode, userId: user.id },
      });
    },
  },

  Mutation: {
    addMemberBooking: async (a, { id, username }, { user }) => {
      if (!user) {
        throw new Error("not authorized");
      }
      const users = await prisma.user.findMany({
        where: { name: username },
        select: { id: true },
      });
      if (users.length !== 1) {
        throw new Error("No user found");
      }
      const booking = await prisma.booking.findUnique({
        where: { id },
      });
      if (!booking) {
        if (!booking) {
          throw new Error("No booking found");
        }
      }
      if (booking.userId !== user.id) {
        throw new Error("Not authorized");
      }
      const userId = users[0].id;
      const userItemId = await generateItem(userId, booking.startDate);
      return prisma.booking.update({
        where: { id },
        data: {
          member: {
            create: [
              {
                userId,
                userItemId,
                status: "approved",
              },
            ],
          },
        },
      });
    },

    testImageAdapter: async (a, { input }, { user }) => {
      if (user.roles !== "admin") {
        throw new Error("not authorized");
      }
      const { image } = await generateImageFromAdapter(
        `test_${input.adapter}`,
        input
      );
      return { url: image };
    },

    updateBooking: (a, { id, input }) => {
      return prisma.booking.update({
        data: input,
        where: { id },
      });
    },

    updateImageAdapter: (a, { id, input }, { user }) => {
      if (user.roles !== "admin") {
        throw new Error("not authorized");
      }
      return prisma.imageAdapterSetting.update({
        data: input,
        where: { id },
      });
    },
  },

  Booking: {
    item: (item) => {
      return prisma.booking.findUnique({ where: { id: item.id } }).userItem();
    },
    member: (item) => {
      return prisma.booking.findUnique({ where: { id: item.id } }).member();
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

  MemberBooking: {
    user: (booking) => {
      return prisma.memberBooking
        .findUnique({ where: { id: booking.id } })
        .user();
    },
    booking: (b) => {
      return prisma.memberBooking.findUnique({ where: { id: b.id } }).booking();
    },
    item: (booking) => {
      return prisma.memberBooking
        .findUnique({ where: { id: bookin.id } })
        .userItem();
    },
  },

  DateTime: DateTimeResolver,
};
