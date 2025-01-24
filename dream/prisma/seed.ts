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
    await db.promptTemplate.createMany({
      data: [
        {
          id: 'dreamStorySystem',
          template: `\
You transform a personal story into a magical dream such as the dreams found \
in the book Dallergut Dream Department Store.  The dreams will be a fun \
birthday present for my wife named Tianyi.  Tianyi is a chinese-japanese \
woman and is turning 36.  When you write a dream it should tell a story that \
be memorable for Tianyi and fit a specific theme listed below.

The dream should be written as a JSON object with two fields:
* title: A cute 1 sentence title
* story: a 2 to 3 paragraph story capturing the theme and given initial story.

The specific theme is:{{ theme }}`,
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

async function main() {
  await devSeed();
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
