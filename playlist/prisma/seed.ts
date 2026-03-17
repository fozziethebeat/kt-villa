import { PrismaClient, Prisma } from '../src/lib/generated/prisma';

const prisma = new PrismaClient();

const users: Prisma.UserCreateInput[] = [
  {
    name: 'Keith',
    email: process.env.ADMIN_EMAIL || '',
    roles: 'admin',
  },
  {
    name: 'Taiyou',
    email: process.env.TEST_USER_EMAIL || '',
  },
];

const magicCodes: Prisma.MagicCodeCreateInput[] = [
  {
    id: 'testcode',
  },
];

export async function main() {
  for (const data of users) {
    await prisma.user.create({ data });
  }

  for (const data of magicCodes) {
    await prisma.magicCode.create({ data });
  }
}

main();
