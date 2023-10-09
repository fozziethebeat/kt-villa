import type { Prisma } from '@prisma/client'
import { hashPassword } from '@redwoodjs/auth-dbauth-api'

import { db } from 'api/src/lib/db'

export default async () => {
  try {
    const itemData: Prisma.StableItemCreateArgs['data'][] = [
      {
        id: 'uU1NqVR4iC',
        image:
          'https://flowerfruits.mtn.surfacedata.org/results/mandaloreo_picturestorybook_230923_00020_full.png',
        text: 'Mandaloreo picture book smiles',
        claimCode: '1111',
        claimStatus: 'unclaimed',
        claimVisible: false,
      },
      {
        id: 'WMapPW59wR',
        image:
          'https://flowerfruits.mtn.surfacedata.org/results/mandaloreo_picturestorybook_230819_00001_full.png',
        text: 'Firey sunset with Mandaloreo staring down his baddest enemy, the plague of self doubt.',
        claimCode: '2222',
        claimStatus: 'unclaimed',
        claimVisible: false,
      },
      {
        id: 'znGNt5S7QN',
        image:
          'https://flowerfruits.mtn.surfacedata.org/results/mandaloreo_picturestorybook_230923_00017_full.png',
        text: 'Periloux Pixes attack Mandaloreo Cat',
        claimCode: '3333',
        claimStatus: 'unclaimed',
        claimVisible: false,
      },
    ]
    await db.stableItem.createMany({ data: itemData })

    const users = [
      {
        name: 'Keith',
        email: 'fozziethebeat@gmail.com',
        password: 'rootpassword',
        roles: 'admin',
      },
      {
        name: 'Steve',
        email: 'fozziethebeat+general@gmail.com',
        password: 'generalpassword',
        roles: 'general',
      },
    ]
    await db.user.createMany({
      data: users.map(({ name, email, password }) => {
        const [hashedPassword, salt] = hashPassword(password)
        return {
          name,
          email,
          hashedPassword,
          salt,
        }
      }),
    })
  } catch (error) {
    console.warn('Please define your seed data.')
    console.error(error)
  }
}
