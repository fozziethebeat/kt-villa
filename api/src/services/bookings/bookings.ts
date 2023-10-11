import type {
  QueryResolvers,
  MutationResolvers,
  AdminBookingRelationResolvers,
} from 'types/graphql'

import { validateWith } from '@redwoodjs/api'

import { db } from 'src/lib/db'

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

export const booking: QueryResolvers['booking'] = ({ id }) => {
  return db.booking.findUnique({
    where: { id },
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
  return db.booking.create({
    data: {
      ...input,
      status: 'pending',
      userId: context.currentUser.id,
    },
  })
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

export const AdminBooking: AdminBookingRelationResolvers = {
  user: (_obj, { root }) => {
    return db.booking.findUnique({ where: { id: root?.id } }).user()
  },
}
