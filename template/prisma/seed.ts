import {PrismaClient, Prisma} from '../src/lib/generated/prisma';

const prisma = new PrismaClient();

const users: Prisma.UserCreateInput[] = [
  {
    name: 'Admin McAdminFace',
    email: process.env.ADMIN_EMAIL,
    roles: 'admin',
  },
  {
    name: 'Testy MctestFace',
    email: process.env.TEST_USER_EMAIL,
  },
];

const entityData: Prisma.EntityCreateInput[] = [
  {
    name: 'Chiver Me Tbimars',
    content: 'I got timbers, do you?',
  },
  {
    name: 'Char Char JInks',
    content: 'I am not Jar Jar I am Char Char',
  },
];

const magicCodes: Prisma.MagicCodeCreateInput[] = [
  {
    id: 'testcode',
  },
  {
    id: 'testcode2',
  },
];

export async function main() {
  for (const data of users) {
    await prisma.user.create({data});
  }

  for (const data of entityData) {
    await prisma.entity.create({data});
  }

  for (const data of magicCodes) {
    await prisma.magicCode.create({data});
  }
}

main();
