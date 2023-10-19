import type {
  QueryResolvers,
  MutationResolvers,
  BookingRelationResolvers,
  MemberBookingRelationResolvers,
  AdminBookingRelationResolvers,
} from 'types/graphql'

import ShortUniqueId from 'short-unique-id'
import { validateWith } from '@redwoodjs/api'

import { db } from 'src/lib/db'
import { generateBookingItem } from 'src/lib/gen'

const bookingCodeGenerator = new ShortUniqueId({ length: 6 })

export const bookings: QueryResolvers['bookings'] = () => {
  return db.booking.findMany()
}

export const adminBookings: QueryResolvers['adminBookings'] = () => {
  return db.booking.findMany()
}

export const userBookings: QueryResolvers['userBookings'] = () => {
  return db.booking.findMany({
    where: {
      userId: context.currentUser.id,
    },
  })
}

export const userBooking: QueryResolvers['userBooking'] = ({ bookingCode }) => {
  return db.booking.findUnique({
    where: { bookingCode, userId: context.currentUser.id },
  })
}

export const publicBooking: QueryResolvers['publicBooking'] = ({
  bookingCode,
}) => {
  return db.booking.findUnique({
    where: { bookingCode },
  })
}

export const futureBookings: QueryResolvers['futureBookings'] = () => {
  return db.booking.findMany({
    where: {
      startDate: { gt: new Date() },
    },
    orderBy: {
      startDate: 'asc',
    },
  })
}

export const memberBookings: QueryResolvers['memberBookings'] = () => {
  return db.memberBooking.findMany({
    where: {
      userId: context.currentUser.id,
    },
  })
}

export const booking: QueryResolvers['booking'] = ({ id }) => {
  return db.booking.findUnique({
    where: { id },
  })
}

export const joinBooking: MutationResolvers['joinBooking'] = async ({
  bookingCode,
}) => {
  await validateWith(async () => {
    const booking = await db.booking.findUnique({
      where: {
        bookingCode,
      },
      select: {
        numGuests: true,
        member: true,
      },
    })
    if (!booking) {
      throw new Error('Invalid booking.')
    }
    if (booking.numGuests === booking.member.length + 1) {
      throw new Error('Booking not available for joining')
    }
  })
  return db.booking.update({
    where: { bookingCode },
    data: {
      member: {
        create: [
          {
            status: 'pending',
            userId: context.currentUser.id,
          },
        ],
      },
    },
  })
}

export const createBooking: MutationResolvers['createBooking'] = async ({
  input,
}) => {
  await validateWith(async () => {
    if (input.numGuests < 0 || input.numGuests > 4) {
      throw new Error('Pick between 1 and 4 guests')
    }
    const candidateConflicts = await db.booking.findMany({
      where: {
        startDate: { gt: new Date() },
      },
      orderBy: {
        startDate: 'asc',
      },
    })
    if (candidateConflicts.length === 0) {
      return
    }
    if (input.endDate < candidateConflicts[0].startDate) {
      return
    }
    if (
      input.startDate >
      candidateConflicts[candidateConflicts.length - 1].endDate
    ) {
      return
    }
    for (let i = 0; i < candidateConflicts.length - 1; ++i) {
      const curr = candidateConflicts[i]
      const next = candidateConflicts[i + 1]
      if (
        candidateConflicts.end < input.startDate &&
        input.endDate < next.startDate
      ) {
        return
      }
    }
    throw new Error('Invalid dates. Conflicts with existing booking')
  })
  const user = await db.user.findUnique({
    where: { id: context.currentUser.id },
  })
  const trustStatus = user.trustStatus
  const status = trustStatus === 'trusted' ? 'approved' : 'pending'
  const booking = await db.booking.create({
    data: {
      ...input,
      status,
      bookingCode: bookingCodeGenerator.rnd(),
      userId: context.currentUser.id,
    },
  })
  if (status === 'pending') {
    return booking
  }
  return generateBookingItem(booking.id)
}

export const createBookingItemAdmin: MutationResolvers['createBookingItemAdmin'] =
  async ({ id }) => {
    await validateWith(async () => {
      const booking = await db.booking.findUnique({
        where: { id },
      })
      if (!booking || !booking.status === 'approved') {
        throw new Error('Booking is not approved yet')
      }
    })
    return generateBookingItem(id)
  }

export const updateBookingStatus: MutationResolvers['updateBookingStatus'] = ({
  id,
  status,
}) => {
  return db.booking.update({
    data: {
      status,
    },
    where: { id },
  })
}

export const updateBooking: MutationResolvers['updateBooking'] = ({
  id,
  input,
}) => {
  return db.booking.update({
    data: input,
    where: { id },
  })
}

export const deleteBooking: MutationResolvers['deleteBooking'] = ({ id }) => {
  return db.booking.delete({
    where: { id },
  })
}

export const MemberBooking: MemberBookingRelationResolvers = {
  user: (_obj, { root }) => {
    return db.memberBooking.findUnique({ where: { id: root?.id } }).user()
  },
  booking: (_obj, { root }) => {
    return db.memberBooking.findUnique({ where: { id: root?.id } }).booking()
  },
  item: (_obj, { root }) => {
    return db.memberBooking.findUnique({ where: { id: root?.id } }).userItem()
  },
}

export const Booking: BookingRelationResolvers = {
  item: (_obj, { root }) => {
    return db.booking.findUnique({ where: { id: root?.id } }).userItem()
  },
  member: (_obj, { root }) => {
    return db.booking.findUnique({ where: { id: root?.id } }).member()
  },
}

export const AdminBooking: AdminBookingRelationResolvers = {
  user: (_obj, { root }) => {
    return db.booking.findUnique({ where: { id: root?.id } }).user()
  },
  item: (_obj, { root }) => {
    return db.booking.findUnique({ where: { id: root?.id } }).userItem()
  },
}
