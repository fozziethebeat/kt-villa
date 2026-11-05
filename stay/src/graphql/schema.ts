import { render } from "@react-email/render";
import { DateTimeResolver } from "graphql-scalars";
import { gql } from "graphql-tag";
import ShortUniqueId from "short-unique-id";

import {
  imageGenerator,
  imagePromptGenerator,
  itemGenerator,
} from "@/lib/generate";
import { mailer } from "@/lib/mailer";
import { prisma } from "@/lib/prisma";
import { CreateBookingMail } from "@/components/mail/CreateBookingMail";
import { JoinApproved } from "@/components/mail/JoinApproved";
import { BookingApprovedMail } from "@/components/mail/BookingApprovedMail";

export const typeDefs = gql`
  scalar DateTime

  type User {
    id: String!
    email: String!

    name: String
    referral: String
    socialType: String
    socialHandle: String

    roles: String!
    StableItem: [BookingItem]!
    booking: [Booking]!
    trustStatus: String!
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
    hostName: String!
    isOwner: Boolean!
    item: BookingItem
    StableItem: BookingItem
    member: [MemberBooking!]
    MemberBooking: [MemberBooking!]
  }

  type AdminBooking {
    id: Int!
    startDate: DateTime
    endDate: DateTime
    numGuests: Int
    maxGuests: Int
    withCat: Boolean!
    withDog: Boolean!
    status: String!
    bookingCode: String
    user: User
    userId: String
    item: BookingItem
    member: [MemberBooking!]
  }

  type BookingItem {
    id: String!
    image: String!
    text: String
    style: String
    season: String
    subject: String
    claimCode: String
    claimStatus: String!
    claimVisible: Boolean!
    ownerId: String
    ownerUsername: String
    bookingCode: String
  }

  type MemberBooking {
    id: Int!
    status: String!
    user: User!
    memberName: String!
    booking: Booking!
    item: BookingItem
  }

  input ImageAdapterInput {
    id: Int
    startDate: DateTime
    adapter: String!
    promptTemplate: String!
    negativePrompt: String
    steps: Int!
    variants: [String!]!
  }

  input CreateImageAdapterInput {
    startDate: DateTime!
    adapter: String!
    promptTemplate: String!
    negativePrompt: String
    steps: Int!
    variants: [String!]!
  }

  type TestImage {
    url: String!
    prompt: String
  }

  input UpdateUserInput {
    name: String
    email: String
    roles: String
    trustStatus: String
  }

  input UpdateUserDetailsInput {
    name: String
    referral: String
    socialType: String
    socialHandle: String
  }

  input UpdateBookingInput {
    startDate: DateTime
    endDate: DateTime
    numGuests: Int
    maxGuests: Int
    userId: String
    withCat: Boolean
    withDog: Boolean
    status: String
  }

  input CreateBookingInput {
    startDate: DateTime!
    endDate: DateTime!
    maxGuests: Int!
    numGuests: Int!
    withCat: Boolean
    withDog: Boolean
  }

  type Query {
    adminBooking(id: Int!): AdminBooking
    adminBookings: [AdminBooking!]!
    bookingItems: [BookingItem!]!
    bookingItem(id: String!): BookingItem
    futureBookings: [Booking!]!
    publicBookings: [Booking!]!
    publicBooking(bookingCode: String!): Booking
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
    requestJoinBooking(bookingId: Int, bookingCode: String): MemberBooking!
    createBooking(input: CreateBookingInput!): Booking!
    testImageAdapter(input: ImageAdapterInput!): TestImage!
    createImageAdapter(input: ImageAdapterInput!): ImageAdapterSetting!
    updateMemberBookingStatus(id: Int!, status: String!): MemberBooking!
    updateBooking(id: Int!, input: UpdateBookingInput!): Booking!
    regenerateBookingImage(
      bookingId: Int!
      adapterId: Int
      customPrompt: String
    ): BookingItem!
    updateImageAdapter(
      id: Int!
      input: ImageAdapterInput!
    ): ImageAdapterSetting!
    updateUser(id: String!, input: UpdateUserInput!): User!
    updateUsername(name: String!): User!
    updateUserDetails(input: UpdateUserDetailsInput!): User!
  }
`;

const bookingCodeGenerator = new ShortUniqueId({ length: 6 });

export const resolvers = {
  Query: {
    bookingItems: () => {
      return prisma.stableItem.findMany({
        include: {
          owner: {
            select: { id: true, name: true, email: true },
          },
          booking: {
            select: { bookingCode: true },
          },
          memberBooking: {
            select: { booking: { select: { bookingCode: true } } },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });
    },

    bookingItem: (_, { id }) => {
      return prisma.stableItem.findUnique({
        where: { id },
        include: {
          owner: {
            select: { id: true, name: true, email: true },
          },
          booking: {
            select: { bookingCode: true },
          },
          memberBooking: {
            select: { booking: { select: { bookingCode: true } } },
          },
        },
      });
    },

    adminBookings: (a, b, { user }) => {
      if (user?.roles !== "admin") {
        throw new Error("Access not supported");
      }
      return prisma.booking.findMany({
        include: {
          userItem: true,
          user: {
            select: { id: true, name: true, email: true },
          },
        },
        orderBy: {
          startDate: "desc",
        },
      });
    },

    adminBooking: (a, { id }, { user }) => {
      if (user?.roles !== "admin") {
        throw new Error("Access not supported");
      }
      return prisma.booking.findUnique({
        where: { id },
        include: {
          userItem: true,
          user: true,
          member: {
            include: {
              user: true,
              userItem: true,
            },
          },
        },
      });
    },

    futureBookings: () => {
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);
      return prisma.booking.findMany({
        where: {
          endDate: { gte: startOfToday },
          status: {
            in: ["pending", "approved"],
          },
        },
        orderBy: {
          startDate: "asc",
        },
      });
    },

    publicBookings: () => {
      return prisma.booking.findMany({
        where: {
          status: {
            in: ["pending", "approved"],
          },
        },
        include: {
          userItem: true,
          user: {
            select: { id: true, name: true, email: true },
          },
        },
        orderBy: {
          startDate: "desc",
        },
      });
    },

    publicBooking: async (_, { bookingCode }, { user }) => {
      const booking = await prisma.booking.findUnique({
        where: { bookingCode },
        include: {
          userItem: true,
          user: {
            select: { id: true, name: true, email: true },
          },
          member: {
            include: {
              user: {
                select: { id: true, name: true, email: true },
              },
              userItem: true,
            },
          },
        },
      });
      if (!booking) {
        return null;
      }
      const isPublicStatus =
        booking.status === "approved" || booking.status === "pending";
      const isOwnerOrAdmin =
        Boolean(user) &&
        (booking.userId === user.id || user.roles === "admin");
      if (!isPublicStatus && !isOwnerOrAdmin) {
        return null;
      }
      return booking;
    },

    imageAdapterSettings: () => {
      return prisma.imageAdapterSetting.findMany({
        orderBy: {
          startDate: "desc",
        },
      });
    },

    imageAdapterSetting: (a, { id }) => {
      return prisma.imageAdapterSetting.findUnique({
        where: { id },
      });
    },

    memberBookings: (a, b, { user }) => {
      if (!user) {
        throw new Error("Access not supported");
      }
      return prisma.memberBooking.findMany({
        where: {
          userId: user.id,
        },
        include: {
          booking: true,
          userItem: true,
          user: {
            select: { id: true, name: true, email: true },
          },
        },
        orderBy: {
          booking: {
            startDate: "desc",
          },
        },
      });
    },

    user: (a, { id }, { user }) => {
      if (user?.roles !== "admin") {
        throw new Error("Access not supported");
      }
      return prisma.user.findUnique({ where: { id } });
    },

    users: (a, b, { user }) => {
      if (user?.roles !== "admin") {
        throw new Error("Access not supported");
      }
      return prisma.user.findMany({
        orderBy: {
          email: "asc",
        },
      });
    },

    userBookings: (a, b, { user }) => {
      if (!user) {
        throw new Error("Access not supported");
      }
      return prisma.booking.findMany({
        where: {
          userId: user.id,
          status: {
            in: ["pending", "approved"],
          },
        },
        include: {
          userItem: true,
          user: {
            select: { id: true, name: true, email: true },
          },
        },
        orderBy: {
          startDate: "desc",
        },
      });
    },

    userBooking: async (a, { bookingCode }, { user }) => {
      if (!user) {
        throw new Error("Access not supported");
      }
      const booking = await prisma.booking.findUnique({
        where: { bookingCode },
        include: {
          userItem: true,
          user: {
            select: { id: true, name: true, email: true },
          },
          member: {
            include: {
              user: {
                select: { id: true, name: true, email: true },
              },
              userItem: true,
            },
          },
        },
      });
      if (!booking) {
        return null;
      }
      if (booking.userId !== user.id && user.roles !== "admin") {
        return null;
      }
      return booking;
    },
  },

  Mutation: {
    addMemberBooking: async (a, { id, username }, { user }) => {
      if (!user) {
        throw new Error("Not authorized");
      }
      const trimmed = username.trim();
      const targetUser = await prisma.user.findFirst({
        where: {
          OR: [
            { name: { equals: trimmed, mode: "insensitive" } },
            { email: { equals: trimmed, mode: "insensitive" } },
          ],
        },
        select: { id: true },
      });
      if (!targetUser) {
        throw new Error(`No user found matching "${trimmed}"`);
      }
      const booking = await prisma.booking.findUnique({
        where: { id },
        include: { member: true },
      });
      if (!booking) {
        throw new Error("No booking found");
      }
      if (booking.userId !== user.id && user.roles !== "admin") {
        throw new Error("Not authorized");
      }
      const alreadyMember = booking.member.some(
        (m) => m.userId === targetUser.id
      );
      if (alreadyMember) {
        return booking;
      }

      let userItemId: string | undefined;
      try {
        userItemId = await itemGenerator.generateItem(
          targetUser.id,
          booking.startDate
        );
      } catch (err) {
        console.warn("Could not generate member item image:", err);
      }

      return prisma.booking.update({
        where: { id },
        data: {
          member: {
            create: [
              {
                userId: targetUser.id,
                ...(userItemId ? { userItemId } : {}),
                status: "approved",
              },
            ],
          },
        },
      });
    },

    requestJoinBooking: async (_, { bookingId, bookingCode }, { user }) => {
      if (!user) {
        throw new Error("Please sign in to request to join a trip");
      }
      const booking = await prisma.booking.findUnique({
        where: bookingId ? { id: bookingId } : { bookingCode },
        include: { member: true },
      });
      if (!booking) {
        throw new Error("Booking not found");
      }
      if (booking.userId === user.id) {
        throw new Error("You are already the host of this trip");
      }
      const existing = booking.member.find((m) => m.userId === user.id);
      if (existing) {
        return existing;
      }
      if (booking.numGuests >= booking.maxGuests) {
        throw new Error("This trip is already at maximum guest capacity");
      }
      return prisma.memberBooking.create({
        data: {
          bookingId: booking.id,
          userId: user.id,
          status: "pending",
        },
      });
    },

    createBooking: async (a, { input }, { user }) => {
      if (!user) {
        throw new Error("Requires signed in");
      }
      const startDate = new Date(input.startDate);
      const endDate = new Date(input.endDate);
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime()) || startDate >= endDate) {
        throw new Error("End date must be after start date");
      }
      if (input.numGuests < 1 || input.numGuests > 5) {
        throw new Error("Pick between 1 and 5 guests");
      }
      const maxGuests = Math.max(input.numGuests, Math.min(5, input.maxGuests || 4));

      // Check for overlapping approved or pending bookings
      const overlapping = await prisma.booking.findFirst({
        where: {
          status: { in: ["pending", "approved"] },
          startDate: { lt: endDate },
          endDate: { gt: startDate },
        },
      });
      if (overlapping) {
        throw new Error("Selected dates conflict with an existing booking");
      }

      const trustStatus = user.trustStatus;
      const status = trustStatus === "trusted" ? "approved" : "pending";
      const booking = await prisma.booking.create({
        data: {
          startDate,
          endDate,
          numGuests: input.numGuests,
          maxGuests,
          withCat: Boolean(input.withCat),
          withDog: Boolean(input.withDog),
          status,
          bookingCode: bookingCodeGenerator.rnd(),
          userId: user.id,
        },
      });

      try {
        await mailer.sendMail({
          from: process.env.MAILER_FROM,
          to: process.env.ADMIN_EMAIL,
          subject: "New Booking Created",
          html: await render(
            CreateBookingMail({
              userEmail: user.email,
              startDate,
              endDate,
              link: `${process.env.AUTH_URL}/admin/booking/${booking.id}`,
            })
          ),
        });
      } catch (mailErr) {
        console.warn("Failed to send booking creation email:", mailErr);
      }

      if (status === "pending") {
        return booking;
      }
      try {
        const updated = await itemGenerator.generateBookingItem(booking.id);
        return updated || booking;
      } catch (genErr) {
        console.warn("Failed to generate booking item on creation:", genErr);
        return booking;
      }
    },

    testImageAdapter: async (a, { input }, { user }) => {
      if (user?.roles !== "admin") {
        throw new Error("Access not supported");
      }
      const details = await imagePromptGenerator.generateDetailed(input);
      const image = await imageGenerator.generateImage(
        `test_${input.id || "preview"}`,
        details.prompt
      );
      return { url: image, prompt: details.prompt };
    },

    createImageAdapter: async (a, { input }, { user }) => {
      if (user?.roles !== "admin") {
        throw new Error("Access not supported");
      }
      return prisma.imageAdapterSetting.create({
        data: {
          startDate: new Date(input.startDate),
          adapter: input.adapter,
          promptTemplate: input.promptTemplate,
          negativePrompt: input.negativePrompt || "",
          steps: input.steps || 20,
          variants: input.variants,
        },
      });
    },

    regenerateBookingImage: async (
      _,
      { bookingId, adapterId, customPrompt },
      { user }
    ) => {
      if (user?.roles !== "admin") {
        throw new Error("Access not supported");
      }
      const updated = await itemGenerator.generateBookingItem(bookingId, {
        forceRegenerate: true,
        adapterId,
        customPrompt,
      });
      if (!updated) {
        throw new Error("Failed to regenerate booking image");
      }
      const item = await prisma.booking
        .findUnique({ where: { id: bookingId } })
        .userItem();
      if (!item) {
        throw new Error("Generated item not found");
      }
      return item;
    },

    updateMemberBookingStatus: async (a, { id, status }, { user }) => {
      const memberBooking = await prisma.memberBooking.findUnique({
        where: { id },
        select: {
          booking: true,
          user: true,
        },
      });
      if (!user) {
        throw new Error("not authorized");
      }
      if (!memberBooking || !memberBooking.booking) {
        throw new Error("Invalid Member Booking");
      }
      if (memberBooking.booking.userId !== user.id && user.roles !== "admin") {
        throw new Error("Permission Denied");
      }
      const { booking } = memberBooking;

      const statusSetBooking = await prisma.memberBooking.update({
        data: {
          status,
        },
        where: { id },
      });
      if (
        statusSetBooking.status !== "approved" ||
        statusSetBooking.userItemId
      ) {
        return statusSetBooking;
      }

      let userItemId: string | undefined;
      try {
        userItemId = await itemGenerator.generateItem(
          memberBooking.user.id,
          booking.startDate
        );
      } catch (err) {
        console.warn("Could not generate member booking image:", err);
      }

      const updatedMemberBooking = await prisma.memberBooking.update({
        data: {
          ...(userItemId
            ? {
                userItem: {
                  connect: { id: userItemId },
                },
              }
            : {}),
          booking: {
            update: {
              numGuests: { increment: 1 },
            },
          },
        },
        where: { id },
      });

      try {
        await mailer.sendMail({
          from: process.env.MAILER_FROM,
          to: memberBooking.user.email,
          subject: "Your request to join is approved",
          html: await render(
            JoinApproved({
              code: booking.bookingCode,
              link: `${process.env.AUTH_URL || "https://www.kt-villa.com"}/public-booking/${booking.bookingCode}`,
              name: memberBooking.user.name,
            })
          ),
        });
      } catch (mailErr) {
        console.warn("Failed to send join approval email:", mailErr);
      }

      return updatedMemberBooking;
    },

    updateBooking: async (a, { id, input }, { user }) => {
      if (!user) {
        throw new Error("Not authorized");
      }
      const booking = await prisma.booking.findUnique({
        where: { id },
      });
      if (!booking) {
        throw new Error("Booking not found");
      }

      const isAdmin = user.roles === "admin";
      const isOwner = booking.userId === user.id;
      if (!isAdmin && !isOwner) {
        throw new Error("Access not supported");
      }

      // Non-admin owners can update guest counts, pets, dates, or cancel their own trip
      if (!isAdmin) {
        if (input.status && input.status !== "cancelled") {
          throw new Error("Only admins can approve or reject bookings");
        }
        const safeData: any = {};
        if (typeof input.numGuests === "number") safeData.numGuests = input.numGuests;
        if (typeof input.maxGuests === "number") safeData.maxGuests = input.maxGuests;
        if (typeof input.withCat === "boolean") safeData.withCat = input.withCat;
        if (typeof input.withDog === "boolean") safeData.withDog = input.withDog;
        if (input.startDate) safeData.startDate = new Date(input.startDate);
        if (input.endDate) safeData.endDate = new Date(input.endDate);
        if (input.status === "cancelled") safeData.status = "cancelled";

        return prisma.booking.update({
          data: safeData,
          where: { id },
        });
      }

      // Admin update path
      if (!booking.userItemId && input.status === "approved") {
        try {
          const userItemId = await itemGenerator.generateItem(
            input.userId || booking.userId,
            input.startDate ? new Date(input.startDate) : booking.startDate
          );
          if (userItemId) {
            await prisma.booking.update({
              data: { userItemId },
              where: { id },
            });
          }
        } catch (genErr) {
          console.warn("Failed to generate item during approval:", genErr);
        }
      }

      if (input.status === "approved" && booking.status !== "approved") {
        const bookingUser = await prisma.user.findUnique({
          where: { id: input.userId || booking.userId },
        });

        if (bookingUser) {
          try {
            await mailer.sendMail({
              from: process.env.MAILER_FROM,
              to: bookingUser.email,
              subject: "Your booking is approved",
              html: await render(
                BookingApprovedMail({
                  userEmail: bookingUser.email,
                  name: bookingUser.name || undefined,
                  startDate: input.startDate
                    ? new Date(input.startDate)
                    : booking.startDate!,
                  endDate: input.endDate
                    ? new Date(input.endDate)
                    : booking.endDate!,
                  link: `${process.env.AUTH_URL}/booking/${booking.bookingCode}`,
                })
              ),
            });
          } catch (mailErr) {
            console.warn("Failed to send approval email:", mailErr);
          }
        }
      }

      const updateData: any = { ...input };
      if (input.startDate) updateData.startDate = new Date(input.startDate);
      if (input.endDate) updateData.endDate = new Date(input.endDate);

      return prisma.booking.update({
        data: updateData,
        where: { id },
      });
    },

    updateImageAdapter: (a, { id, input }, { user }) => {
      if (user?.roles !== "admin") {
        throw new Error("Access not supported");
      }
      const { id: _unusedId, ...rest } = input;
      const data: any = { ...rest };
      if (input.startDate) {
        data.startDate = new Date(input.startDate);
      }
      return prisma.imageAdapterSetting.update({
        data,
        where: { id },
      });
    },

    updateUser: (a, { id, input }, { user }) => {
      if (user?.roles !== "admin" && id !== user?.id) {
        throw new Error("not authorized");
      }
      return prisma.user.update({
        data: input,
        where: { id },
      });
    },

    updateUsername: (a, { name }, { user }) => {
      if (!user) {
        throw new Error("not authorized");
      }
      return prisma.user.update({
        where: { id: user.id },
        data: { name },
      });
    },

    updateUserDetails: (a, { input }, { user }) => {
      if (!user) {
        throw new Error("not authorized");
      }
      return prisma.user.update({
        where: { id: user.id },
        data: input,
      });
    },
  },

  Booking: {
    item: (booking) => {
      if (booking.userItem !== undefined) {
        return booking.userItem;
      }
      return prisma.booking.findUnique({ where: { id: booking.id } }).userItem();
    },
    StableItem: (booking) => {
      if (booking.userItem !== undefined) {
        return booking.userItem;
      }
      return prisma.booking.findUnique({ where: { id: booking.id } }).userItem();
    },
    member: (booking) => {
      if (booking.member !== undefined) {
        return booking.member;
      }
      return prisma.booking.findUnique({ where: { id: booking.id } }).member();
    },
    MemberBooking: (booking) => {
      if (booking.member !== undefined) {
        return booking.member;
      }
      return prisma.booking.findUnique({ where: { id: booking.id } }).member();
    },
    isOwner: (booking, _, { user }) => {
      return Boolean(user && booking.userId === user.id);
    },
    hostName: async (booking, _, { user }) => {
      // Only display real names to logged-in users; signed-out visitors see an anonymous label
      if (!user) {
        return "Mountain Guest";
      }
      if (booking.userId === user.id) {
        return user.name ? `${user.name} (You)` : "You";
      }
      const owner =
        booking.user !== undefined
          ? booking.user
          : await prisma.user.findUnique({
              where: { id: booking.userId },
              select: { name: true, email: true },
            });
      if (!owner) {
        return "KT Villa Guest";
      }
      return owner.name || owner.email.split("@")[0] || "KT Villa Guest";
    },
  },

  BookingItem: {
    style: (item) => {
      const char = item?.character as any;
      return char?.style || null;
    },
    season: (item) => {
      const char = item?.character as any;
      return char?.season || null;
    },
    subject: (item) => {
      const char = item?.character as any;
      return char?.fragment || null;
    },
    bookingCode: async (item) => {
      if (item.booking?.bookingCode) {
        return item.booking.bookingCode;
      }
      if (item.memberBooking?.booking?.bookingCode) {
        return item.memberBooking.booking.bookingCode;
      }
      if (item.booking !== undefined && item.memberBooking !== undefined) {
        return null;
      }
      const b = await prisma.booking.findFirst({
        where: { userItemId: item.id },
        select: { bookingCode: true },
      });
      if (b?.bookingCode) return b.bookingCode;
      const mb = await prisma.memberBooking.findFirst({
        where: { userItemId: item.id },
        select: { booking: { select: { bookingCode: true } } },
      });
      return mb?.booking?.bookingCode || null;
    },
    /**
     * Resolves {@code ownerUsername} according to the current user's access
     * rights. Signed-out users see "Mountain Guest".
     */
    ownerUsername: async (item, _, { user }) => {
      if (!user) {
        return "Mountain Guest";
      }
      if (!item.claimVisible) {
        return "Mountain Guest";
      }
      if (!item.ownerId) {
        return "Unknown";
      }
      if (item?.claimStatus !== "claimed") {
        return "Unclaimed";
      }
      if (item.ownerId === user.id) {
        return user.name ? `${user.name} (You)` : "You";
      }
      const owner =
        item.owner !== undefined
          ? item.owner
          : await prisma.user.findUnique({
              where: { id: item.ownerId },
              select: { name: true, email: true },
            });
      return owner?.name || owner?.email?.split("@")[0] || "KT Villa Guest";
    },
  },

  AdminBooking: {
    user: (booking) => {
      if (booking.user !== undefined) {
        return booking.user;
      }
      return prisma.booking.findUnique({ where: { id: booking?.id } }).user();
    },
    item: (booking) => {
      if (booking.userItem !== undefined) {
        return booking.userItem;
      }
      return prisma.booking
        .findUnique({ where: { id: booking?.id } })
        .userItem();
    },
    member: (booking) => {
      if (booking.member !== undefined) {
        return booking.member;
      }
      return prisma.booking.findUnique({ where: { id: booking?.id } }).member();
    },
  },

  MemberBooking: {
    user: async (booking, _, { user }) => {
      const memberUser =
        booking.user !== undefined
          ? booking.user
          : await prisma.memberBooking
              .findUnique({ where: { id: booking.id } })
              .user();
      if (!user && memberUser) {
        return {
          ...memberUser,
          name: "Travel Companion",
          email: "",
        };
      }
      return memberUser;
    },
    memberName: async (booking, _, { user }) => {
      if (!user) {
        return "Travel Companion";
      }
      const memberUser =
        booking.user !== undefined
          ? booking.user
          : await prisma.memberBooking
              .findUnique({ where: { id: booking.id } })
              .user();
      if (!memberUser) return "Guest";
      if (memberUser.id === user.id) {
        return memberUser.name ? `${memberUser.name} (You)` : "You";
      }
      return memberUser.name || memberUser.email.split("@")[0] || "Guest";
    },
    booking: (b) => {
      if (b.booking !== undefined) {
        return b.booking;
      }
      return prisma.memberBooking.findUnique({ where: { id: b.id } }).booking();
    },
    item: (booking) => {
      if (booking.userItem !== undefined) {
        return booking.userItem;
      }
      return prisma.memberBooking
        .findUnique({ where: { id: booking.id } })
        .userItem();
    },
  },

  DateTime: DateTimeResolver,
};
