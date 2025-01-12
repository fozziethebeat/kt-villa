import type {Prisma} from '@prisma/client';
import {PrismaClient} from '@prisma/client';

import styles from '../data/styles.json';
import dreamThemes from '../data/dream_themes.json';

const db = new PrismaClient();

async function devSeed() {
  try {
    const users = await db.user.createManyAndReturn({
      data: [
        {
          name: 'Keith',
          email: 'fozziethebeat@gmail.com',
          roles: 'admin',
        },
        {
          name: 'Friend 1',
          email: 'fozziethebeat+u1@gmail.com',
          roles: 'general',
        },
        {
          name: 'Friend 2',
          email: 'fozziethebeat+u2@gmail.com',
          roles: 'general',
        },
        {
          name: 'Friend 3',
          email: 'fozziethebeat+u3@gmail.com',
          roles: 'general',
        },
      ],
    });
    await db.magicCode.createMany({
      data: [{id: 'forTen10'}],
    });
    await db.style.createMany({
      data: styles,
    });
    await db.dreamTheme.createMany({
      data: dreamThemes,
    });
    await db.dream.createMany({
      data: [
        {
          memory: 'm1',
          story: 's1',
          dreamImage:
            'https://stablesoaps-w1.s3.amazonaws.com/results/vfuX7I.png',
          prompt: 'p1',
          userId: users[1].id,
        },
        {
          memory: 'm2',
          story: 's2',
          dreamImage:
            'https://stablesoaps-w1.s3.amazonaws.com/results/vfuX7I.png',
          prompt: 'p2',
          userId: users[2].id,
        },
        {
          memory: 'm3',
          story: 's3',
          dreamImage:
            'https://stablesoaps-w1.s3.amazonaws.com/results/vfuX7I.png',
          prompt: 'p3',
          userId: users[3].id,
        },
      ],
    });
    await db.promptTemplate.createMany({
      data: [
        {
          id: 'dreamStorySystem',
          template: `\
You transform a personal story into a magical dream such as the dreams found in \
the book Dallergut Dream Department Store.  The dreams will be a fun birthday \
present for my wife named Tianyi.  Tianyi is a chinese-japanese woman and is \
turning 36.  When you write a dream it should tell a story that be memorable \
for Tianyi and fit a specific theme listed below.

The dream should be written with:
* A title
* A 2 to 3 paragraph story

The specific theme is:
{{ theme }}`,
        },
        {
          id: 'dreamImageSystem',
          template: `\
You transform a dream story into a prompt for an image generation model.  \
The given dream story fits a particular dream theme matching one of the \
many dreams found in the book Dallergut Dream Department Store.
              
The created image prompt should be 2 to 3 sentences long and richly detailed.
  
Make sure the image prompt fits the following artistic style: {{ style }}`,
        },
      ],
    });
  } catch (error) {
    console.warn('Please define your seed data.');
    console.error(error);
  }
}

async function prodSeed() {
  try {
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
