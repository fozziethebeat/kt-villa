import {render} from '@react-email/render';
import {DateTimeResolver} from 'graphql-scalars';
import {gql} from 'graphql-tag';
import ShortUniqueId from 'short-unique-id';

import {imageGenerator} from '@/lib/generate';
import {mailer} from '@/lib/mailer';
import {prisma} from '@/lib/prisma';
import {CreateBookingMail} from '@/components/mail/CreateBookingMail';
import {JoinApproved} from '@/components/mail/JoinApproved';

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
    item: BookingItem
    member: [MemberBooking!]
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

  input ImageAdapterInput {
    id: Int!
    adapter: String!
    promptTemplate: String!
    steps: Int!
    variants: [String!]!
  }

  type TestImage {
    url: String!
  }

  input UpdateUserInput {
    name: String
    email: String!
    roles: String!
    trustStatus: String!
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
  }

  type Query {
    adminBooking(id: Int!): AdminBooking
    adminBookings: [AdminBooking!]!
    bookingItems: [BookingItem!]!
    bookingItem(id: String!): BookingItem
    futureBookings: [Booking!]!
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
    createBooking(input: CreateBookingInput!): Booking!
    testImageAdapter(input: ImageAdapterInput!): TestImage!
    updateMemberBookingStatus(id: Int!, status: String!): MemberBooking!
    updateBooking(id: Int!, input: UpdateBookingInput!): Booking!
    updateImageAdapter(
      id: Int!
      input: ImageAdapterInput!
    ): ImageAdapterSetting!
    updateUser(id: String!, input: UpdateUserInput!): User!
    updateUsername(name: String!): User!
  }
`;

const bookingCodeGenerator = new ShortUniqueId({length: 6});

export const resolvers = {
  Query: {
    bookingItems: () => {
      return prisma.stableItem.findMany({
        orderBy: {
          createdAt: 'desc',
        },
      });
    },

    bookingItem: (_, {id}) => {
      return prisma.stableItem.findUnique({
        where: {id},
      });
    },

    adminBookings: (a, b, {user}) => {
      if (user?.roles !== 'admin') {
        throw new Error('Access not supported');
      }
      return prisma.booking.findMany({
        orderBy: {
          startDate: 'desc',
        },
      });
    },

    adminBooking: (a, {id}, {user}) => {
      if (user?.roles !== 'admin') {
        throw new Error('Access not supported');
      }
      return prisma.booking.findUnique({
        where: {id},
      });
    },

    futureBookings: () => {
      return prisma.booking.findMany({
        where: {
          startDate: {gt: new Date()},
          status: {
            in: ['pending', 'approved'],
          },
        },
        orderBy: {
          startDate: 'asc',
        },
      });
    },

    imageAdapterSettings: () => {
      return prisma.imageAdapterSetting.findMany({
        orderBy: {
          startDate: 'asc',
        },
      });
    },

    imageAdapterSetting: (a, {id}) => {
      return prisma.imageAdapterSetting.findUnique({
        where: {id},
      });
    },

    memberBookings: (a, b, {user}) => {
      return prisma.memberBooking.findMany({
        where: {
          userId: user.id,
        },
        orderBy: {
          booking: {
            startDate: 'desc',
          },
        },
      });
    },

    user: (a, {id}, {user}) => {
      if (user?.roles !== 'admin') {
        throw new Error('Access not supported');
      }
      return prisma.user.findUnique({where: {id}});
    },

    users: (a, b, {user}) => {
      if (user?.roles !== 'admin') {
        throw new Error('Access not supported');
      }
      return prisma.user.findMany({
        orderBy: {
          email: 'asc',
        },
      });
    },

    userBookings: (a, b, {user}) => {
      if (!user) {
        throw new Error('Access not supported');
      }
      return prisma.booking.findMany({
        where: {
          userId: user.id,
          status: {
            in: ['pending', 'approved'],
          },
        },
        orderBy: {
          startDate: 'desc',
        },
      });
    },

    userBooking: (a, {bookingCode}, {user}) => {
      if (!user) {
        throw new Error('Access not supported');
      }
      return prisma.booking.findUnique({
        where: {bookingCode, userId: user.id},
      });
    },
  },

  Mutation: {
    addMemberBooking: async (a, {id, username}, {user}) => {
      if (!user) {
        throw new Error('not authorized');
      }
      const users = await prisma.user.findMany({
        where: {name: username},
        select: {id: true},
      });
      if (users.length !== 1) {
        throw new Error('No user found');
      }
      const booking = await prisma.booking.findUnique({
        where: {id},
      });
      if (!booking) {
        if (!booking) {
          throw new Error('No booking found');
        }
      }
      if (booking.userId !== user.id) {
        throw new Error('Not authorized');
      }
      const userId = users[0].id;
      const userItemId = await imageGenerator.generateItem(
        userId,
        booking.startDate,
      );
      return prisma.booking.update({
        where: {id},
        data: {
          member: {
            create: [
              {
                userId,
                userItemId,
                status: 'approved',
              },
            ],
          },
        },
      });
    },

    createBooking: async (a, {input}, {user}) => {
      const validator = async () => {
        if (!user) {
          throw new Error('Requires signed in');
        }
        if (input.numGuests < 0 || input.numGuests > 5) {
          throw new Error('Pick between 1 and 5 guests');
        }
        const candidateConflicts = await prisma.booking.findMany({
          where: {
            startDate: {gt: new Date()},
            status: {
              in: ['pending', 'approved'],
            },
          },
          orderBy: {
            startDate: 'asc',
          },
        });
        if (candidateConflicts.length === 0) {
          return;
        }
        if (input.endDate < candidateConflicts[0].startDate) {
          return;
        }
        if (
          input.startDate >
          candidateConflicts[candidateConflicts.length - 1].endDate
        ) {
          return;
        }
        for (let i = 0; i < candidateConflicts.length - 1; ++i) {
          const curr = candidateConflicts[i];
          const next = candidateConflicts[i + 1];
          if (
            curr.endDate < input.startDate &&
            input.endDate < next.startDate
          ) {
            return;
          }
        }
        throw new Error('Invalid dates. Conflicts with existing booking');
      };
      await validator();
      const trustStatus = user.trustStatus;
      const status = trustStatus === 'trusted' ? 'approved' : 'pending';
      const booking = await prisma.booking.create({
        data: {
          ...input,
          status,
          bookingCode: bookingCodeGenerator.rnd(),
          userId: user.id,
        },
      });
      await mailer.sendMail({
        from: process.env.MAILER_FROM,
        to: process.env.ADMIN_EMAIL,
        subject: 'New Booking Created',
        html: await render(
          CreateBookingMail({
            userEmail: user.email,
            startDate: input.startDate,
            endDate: input.endDate,
            link: `${process.env.AUTH_URL}/admin/booking/${booking.id}`,
          }),
        ),
      });

      if (status === 'pending') {
        return booking;
      }
      return imageGenerator.generateBookingItem(booking.id);
    },

    testImageAdapter: async (a, {input}, {user}) => {
      if (user?.roles !== 'admin') {
        throw new Error('Access not supported');
      }
      const image = await imageGenerator.generateImageFromAdapter(
        `test_${input.adapter}`,
        input,
      );
      return {url: image};
    },

    updateMemberBookingStatus: async (a, {id, status}, {user}) => {
      const memberBooking = await prisma.memberBooking.findUnique({
        where: {id},
        select: {
          booking: true,
          user: true,
        },
      });
      if (!user) {
        throw new Error('not authorized');
      }
      if (!memberBooking) {
        throw new Error('Invalid Member Booking');
      }
      if (!memberBooking.booking) {
        throw new Error('Invalid Booking');
      }
      if (memberBooking.booking.userId != user.id) {
        throw new Error('Permission Denied');
      }
      const {booking} = memberBooking;

      const statusSetBooking = await prisma.memberBooking.update({
        data: {
          status,
        },
        where: {id},
      });
      if (
        statusSetBooking.status !== 'approved' ||
        statusSetBooking.userItemId
      ) {
        return statusSetBooking;
      }
      const userItemId = await imageGenerator.generateItem(
        memberBooking.user.id,
        booking.startDate,
      );
      const updatedMemberBooking = await prisma.memberBooking.update({
        data: {
          userItem: {
            connect: {id: userItemId},
          },
          booking: {
            update: {
              numGuests: {increment: 1},
            },
          },
        },
        where: {id},
      });
      await mailer.sendMail({
        from: process.env.MAILER_FROM,
        to: memberBooking.user.email,
        subject: 'Your request to join is approved',
        html: await render(
          JoinApproved({
            code: booking.bookingCode,
            link: `https://www.kt-villa.com/public-booking/${booking.bookingCode}`,
            name: memberBooking.user.name,
          }),
        ),
      });

      return updatedMemberBooking;
    },

    updateBooking: async (a, {id, input}, {user}) => {
      if (!input.status) {
        return prisma.booking.update({
          data: input,
          where: {id},
        });
      }
      if (user?.roles !== 'admin') {
        throw new Error('Access not supported');
      }

      const booking = await prisma.booking.findUnique({
        where: {id},
      });
      if (!booking.userItemId && input.status === 'approved') {
        const userItemId = await imageGenerator.generateItem(
          booking.userId,
          booking.startDate,
        );
        return prisma.booking.update({
          data: {
            ...input,
            userItemId,
          },
          where: {id},
        });
      }
      return prisma.booking.update({
        data: input,
        where: {id},
      });
    },

    updateImageAdapter: (a, {id, input}, {user}) => {
      return prisma.imageAdapterSetting.update({
        data: input,
        where: {id},
      });
    },

    updateUser: (a, {id, input}, {user}) => {
      if (user?.roles !== 'admin' && id != user.id) {
        throw new Error('not authorized');
      }
      return prisma.user.update({
        data: input,
        where: {id},
      });
    },

    updateUsername: (a, {name}, {user}) => {
      return prisma.user.update({
        where: {id: user.id},
        data: {name},
      });
    },
  },

  Booking: {
    item: item => {
      return prisma.booking.findUnique({where: {id: item.id}}).userItem();
    },
    member: item => {
      return prisma.booking.findUnique({where: {id: item.id}}).member();
    },
  },

  BookingItem: {
    /**
     * Resolves {@code ownerUsername} according to the current user's access
     * rights.
     */
    ownerUsername: async (item, _, {user}) => {
      if (!user) {
        return 'anon';
      }
      if (!item.claimVisible) {
        return 'anon';
      }
      if (!item.ownerId) {
        return 'unknown';
      }
      if (item?.claimStatus !== 'claimed') {
        return 'none';
      }
      if (item.ownerId === user.id) {
        return 'you';
      }
      // The user has permission to look up who owns this, so do the real
      // lookup.
      const owner = await prisma.user.findUnique({
        where: {id: item.ownerId},
        select: {name: true},
      });
      return owner.name;
    },
  },
  AdminBooking: {
    user: booking => {
      return prisma.booking.findUnique({where: {id: booking?.id}}).user();
    },
    item: booking => {
      return prisma.booking.findUnique({where: {id: booking?.id}}).userItem();
    },
  },

  MemberBooking: {
    user: booking => {
      return prisma.memberBooking.findUnique({where: {id: booking.id}}).user();
    },
    booking: b => {
      return prisma.memberBooking.findUnique({where: {id: b.id}}).booking();
    },
    item: booking => {
      return prisma.memberBooking
        .findUnique({where: {id: booking.id}})
        .userItem();
    },
  },

  DateTime: DateTimeResolver,
};
