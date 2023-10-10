import type { Prisma, Booking } from '@prisma/client'
import type { ScenarioData } from '@redwoodjs/testing/api'

export const standard = defineScenario<Prisma.BookingCreateArgs>({
  booking: {
    one: {
      data: {
        startDate: '2023-10-10T07:38:29.019Z',
        endDate: '2023-10-10T07:38:29.019Z',
        numGuests: 2986497,
        user: {
          create: {
            email: 'String4742389',
            hashedPassword: 'String',
            salt: 'String',
          },
        },
      },
    },
    two: {
      data: {
        startDate: '2023-10-10T07:38:29.019Z',
        endDate: '2023-10-10T07:38:29.019Z',
        numGuests: 1922159,
        user: {
          create: {
            email: 'String7812964',
            hashedPassword: 'String',
            salt: 'String',
          },
        },
      },
    },
  },
})

export type StandardScenario = ScenarioData<Booking, 'booking'>
