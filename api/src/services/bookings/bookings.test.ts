import type { Booking } from '@prisma/client'

import {
  bookings,
  booking,
  createBooking,
  updateBooking,
  deleteBooking,
} from './bookings'
import type { StandardScenario } from './bookings.scenarios'

// Generated boilerplate tests do not account for all circumstances
// and can fail without adjustments, e.g. Float.
//           Please refer to the RedwoodJS Testing Docs:
//       https://redwoodjs.com/docs/testing#testing-services
// https://redwoodjs.com/docs/testing#jest-expect-type-considerations

describe('bookings', () => {
  scenario('returns all bookings', async (scenario: StandardScenario) => {
    const result = await bookings()

    expect(result.length).toEqual(Object.keys(scenario.booking).length)
  })

  scenario('returns a single booking', async (scenario: StandardScenario) => {
    const result = await booking({ id: scenario.booking.one.id })

    expect(result).toEqual(scenario.booking.one)
  })

  scenario('creates a booking', async (scenario: StandardScenario) => {
    const result = await createBooking({
      input: {
        startDate: '2023-10-10T07:38:28.988Z',
        endDate: '2023-10-10T07:38:28.988Z',
        numGuests: 7072498,
        userId: scenario.booking.two.userId,
      },
    })

    expect(result.startDate).toEqual(new Date('2023-10-10T07:38:28.988Z'))
    expect(result.endDate).toEqual(new Date('2023-10-10T07:38:28.988Z'))
    expect(result.numGuests).toEqual(7072498)
    expect(result.userId).toEqual(scenario.booking.two.userId)
  })

  scenario('updates a booking', async (scenario: StandardScenario) => {
    const original = (await booking({ id: scenario.booking.one.id })) as Booking
    const result = await updateBooking({
      id: original.id,
      input: { startDate: '2023-10-11T07:38:28.988Z' },
    })

    expect(result.startDate).toEqual(new Date('2023-10-11T07:38:28.988Z'))
  })

  scenario('deletes a booking', async (scenario: StandardScenario) => {
    const original = (await deleteBooking({
      id: scenario.booking.one.id,
    })) as Booking
    const result = await booking({ id: original.id })

    expect(result).toEqual(null)
  })
})
