import type { Prisma } from '@prisma/client'
import { hashPassword } from '@redwoodjs/auth-dbauth-api'

import { db } from 'api/src/lib/db'

async function devSeed() {
  try {
    const users = [
      {
        name: 'fozziethebeat',
        email: 'fozziethebeat+admin@gmail.com',
        password: 'passwordadmin',
        roles: 'admin',
        trustStatus: 'trusted',
      },
      {
        name: 'amysurfs',
        email: 'fozziethebeat+amy@gmail.com',
        password: 'passwordamy',
        roles: 'general',
        trustStatus: 'new',
      },
      {
        name: 'charliechair',
        email: 'fozziethebeat+charlie@gmail.com',
        password: 'passwordcharlie',
        roles: 'general',
        trustStatus: 'trusted',
      },
      {
        name: 'asakusakids',
        email: 'fozziethebeat+tianyi@gmail.com',
        password: 'passwordtianyi',
        roles: 'admin',
        trustStatus: 'trusted',
      },
    ]
    await db.user.createMany({
      data: users.map(({ name, email, password, roles, trustStatus }) => {
        const [hashedPassword, salt] = hashPassword(password)
        return {
          name,
          email,
          hashedPassword,
          salt,
          roles,
          trustStatus,
        }
      }),
    })

    const itemData: Prisma.StableItemCreateArgs['data'][] = [
      {
        id: 'uU1NqVR4iC',
        image:
          'https://flowerfruits.mtn.surfacedata.org/results/mandaloreo_picturestorybook_230923_00020_full.png',
        claimCode: '1111',
        claimStatus: 'claimed',
        claimVisible: true,
        ownerId: 1,
      },
      {
        id: 'WMapPW59wR',
        image:
          'https://flowerfruits.mtn.surfacedata.org/results/mandaloreo_picturestorybook_230819_00001_full.png',
        claimCode: '2222',
        claimStatus: 'claimed',
        claimVisible: true,
        ownerId: 4,
      },
      {
        id: 'znGNt5S7QN',
        image:
          'https://flowerfruits.mtn.surfacedata.org/results/mandaloreo_picturestorybook_230923_00017_full.png',
        claimCode: '3333',
        claimStatus: 'claimed',
        claimVisible: true,
        ownerId: 1,
      },
    ]
    await db.stableItem.createMany({ data: itemData })

    const bookingData = [
      {
        startDate: '2023-11-19T08:00:00.000+09:00',
        endDate: '2023-11-23T20:00:00.000+09:00',
        numGuests: 2,
        userId: 1,
        userItemId: 'uU1NqVR4iC',
        status: 'approved',
        bookingCode: 'xyz',
        member: {
          create: {
            userId: 4,
            userItemId: 'WMapPW59wR',
            status: 'approved',
          },
        },
      },
      {
        startDate: '2023-11-17T08:00:00.000+09:00',
        endDate: '2023-11-24T20:00:00.000+09:00',
        numGuests: 1,
        userId: 1,
        userItemId: 'znGNt5S7QN',
        status: 'approved',
        bookingCode: 'abc',
      },
    ]
    await Promise.all(
      bookingData.map(async (data) => db.booking.create({ data }))
    )

    await db.signupCode.create({ data: { id: 'keithiscool' } })
  } catch (error) {
    console.warn('Please define your seed data.')
    console.error(error)
  }
}

async function prodSeed() {
  try {
    const users = [
      {
        name: process.env.ADMIN_NAME,
        email: process.env.ADMIN_EMAIL,
        password: process.env.ADMIN_PASSWORD,
        roles: 'admin',
        trustStatus: 'trusted',
      },
    ]
    await db.user.createMany({
      data: users.map(({ name, email, password, roles, trustStatus }) => {
        const [hashedPassword, salt] = hashPassword(password)
        return {
          name,
          email,
          hashedPassword,
          salt,
          roles,
          trustStatus,
        }
      }),
    })

    await db.signupCode.create({ data: { id: 'keithiscool' } })
  } catch (error) {
    console.warn('Please define your seed data.')
    console.error(error)
  }
}

export default async (argv) => {
  const environment = argv.environment || process.env.NODE_ENV || 'dev'
  if (environment === 'prod') {
    await prodSeed()
  } else {
    await devSeed()
  }
}
