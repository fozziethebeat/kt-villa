import type {Prisma} from '@prisma/client';
import {PrismaClient} from '@prisma/client';
import imageAdapters from '../image_adapters.json';

const db = new PrismaClient();

function createTestDate(now: Date, daysToAdvance: number): string {
  const d = new Date(now);
  d.setDate(now.getDate() + daysToAdvance);

  // Set the time components
  d.setHours(8);
  d.setMinutes(0);
  d.setSeconds(0);
  d.setMilliseconds(0);

  const datePart = d.toISOString().split('T')[0];
  const timePart = `08:00:00.000`;
  return `${datePart}T${timePart}+09:00`;
}

async function devSeed() {
  try {
    const users = [
      {
        name: 'fozziethebeat',
        email: 'fozziethebeat+admin@gmail.com',
        roles: 'admin',
        trustStatus: 'trusted',
      },
      {
        name: 'amysurfs',
        email: 'fozziethebeat+amy@gmail.com',
        roles: 'general',
        trustStatus: 'new',
      },
      {
        name: 'charliechair',
        email: 'fozziethebeat+charlie@gmail.com',
        roles: 'general',
        trustStatus: 'trusted',
      },
      {
        name: 'asakusakids',
        email: 'fozziethebeat+tianyi@gmail.com',
        roles: 'admin',
        trustStatus: 'trusted',
      },
    ];
    const createdUsers = await db.user.createManyAndReturn({
      data: users,
    });

    const itemData: Prisma.StableItemCreateArgs['data'][] = [
      {
        id: 'uU1NqVR4iC',
        image:
          'https://ktvilla-images.s3.ap-northeast-1.amazonaws.com/results/DJ4LxL_full.png',
        claimCode: '1111',
        claimStatus: 'claimed',
        claimVisible: true,
        ownerId: createdUsers[0].id,
      },
      {
        id: 'WMapPW59wR',
        image:
          'https://ktvilla-images.s3.ap-northeast-1.amazonaws.com/results/08QpKS_full.png',
        claimCode: '2222',
        claimStatus: 'claimed',
        claimVisible: true,
        ownerId: createdUsers[3].id,
      },
      {
        id: 'znGNt5S7QN',
        image:
          'https://ktvilla-images.s3.ap-northeast-1.amazonaws.com/results/MW2Qm5.png',
        claimCode: '3333',
        claimStatus: 'claimed',
        claimVisible: true,
        ownerId: createdUsers[0].id,
      },
    ];
    await db.stableItem.createMany({data: itemData});

    const now = new Date();
    const bookingData = [
      {
        startDate: createTestDate(now, 2),
        endDate: createTestDate(now, 4),
        numGuests: 2,
        userId: createdUsers[0].id,
        userItemId: 'uU1NqVR4iC',
        status: 'approved',
        bookingCode: 'xyz',
        member: {
          create: {
            userId: createdUsers[3].id,
            userItemId: 'WMapPW59wR',
            status: 'approved',
          },
        },
      },
      {
        startDate: createTestDate(now, 12),
        endDate: createTestDate(now, 18),
        numGuests: 1,
        userId: createdUsers[0].id,
        userItemId: 'znGNt5S7QN',
        status: 'approved',
        bookingCode: 'abc',
      },
    ];
    await Promise.all(bookingData.map(async data => db.booking.create({data})));

    await db.signupCode.create({data: {id: 'keithiscool'}});
    await db.imageAdapterSetting.create({
      data: {
        startDate: '2023-11-09T16:00:00.000Z',
        adapter: 'hasuikawase',
        promptTemplate:
          'in Hakuba Village mountains during the spring time in the style of a miniature diorama',
        negativePrompt: '',
        steps: 30,
        variants: [
          'mountain biking monkeys',
          'jogging rabbits',
          'kayaking giraffes',
          'golfing cats',
          'doings doing stand up paddle',
          'ferrets Parasailing',
          'turtles white water rafting',
        ],
      },
    });
  } catch (error) {
    console.warn('Please define your seed data.');
    console.error(error);
  }
}

async function prodSeed() {
  try {
    const users = [
      {
        name: process.env.ADMIN_NAME,
        email: process.env.ADMIN_EMAIL,
        roles: 'admin',
        trustStatus: 'trusted',
      },
    ];
    await db.user.createMany({
      data: users.map(({name, email, roles, trustStatus}) => {
        return {
          name,
          email,
          roles,
          trustStatus,
        };
      }),
    });
    const now = new Date();
    const adapterData = imageAdapters.map((adapter, i) => ({
      ...adapter,
      startDate: createTestDate(now, i * 14),
    }));
    await db.imageAdapterSetting.createMany({
      data: adapterData,
    });
  } catch (error) {
    console.warn('Please define your seed data.');
    console.error(error);
  }
}

async function main() {
  const environment = process.env.NODE_ENV || 'dev';
  if (environment === 'prod') {
    await prodSeed();
  } else {
    await devSeed();
  }
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
