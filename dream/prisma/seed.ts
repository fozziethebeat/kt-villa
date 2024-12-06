import type {Prisma} from '@prisma/client';
import {PrismaClient} from '@prisma/client';

import styles from '../data/styles.json';

const db = new PrismaClient();

async function devSeed() {
  try {
    await db.style.createMany({
      data: styles,
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
