import {helpers, PredictionServiceClient} from '@google-cloud/aiplatform';
import {Command} from 'commander';
import {readFileSync, writeFileSync} from 'fs';

import {imageGenerator, imagePromptGenerator} from '@/lib/generate';
import {prisma} from '@/lib/prisma';

const program = new Command();

// Configure the CLI
program
  .name('kt-villa-tools')
  .description('CLI tools for KT Villa Operations')
  .version('1.0.0');

program
  .command('test-prompt-generate')
  .description('Generate test prompt')
  .requiredOption('-a, --adapter <number>', 'Test adapter ID to use', parseInt)
  .action(async options => {
    const adapter = await prisma.imageAdapterSetting.findUnique({
      where: {id: options.adapter},
    });
    const prompt = await imagePromptGenerator.generate(adapter);
    console.log(prompt);
  });

program
  .command('test-image-generate')
  .description('Generate Test Image')
  .requiredOption('-p, --prompt <str>', 'Test prompt to use', parseInt)
  .action(async options => {
    const fakeID = 'test';
    const imageURL = await imageGenerator.generateImage(fakeID, options.prompt);
    console.log(imageURL);
  });

program
  .command('test-full-generate')
  .description('Generate Test Image')
  .requiredOption('-a, --adapter <number>', 'Test adapter ID to use', parseInt)
  .action(async options => {
    const adapter = await prisma.imageAdapterSetting.findUnique({
      where: {id: options.adapter},
    });
    const prompt = await imagePromptGenerator.generate(adapter);
    const fakeID = 'test';
    const imageURL = await imageGenerator.generateImage(fakeID, prompt);
    console.log(imageURL);
  });

program
  .command('db-dump')
  .description('Dump all contents of the database into a JSON file')
  .option('-o, --output <path>')
  .action(async options => {
    const users = await prisma.user.findMany();
    const accounts = await prisma.account.findMany();
    const stableItems = await prisma.stableItem.findMany();
    const bookings = await prisma.booking.findMany();
    const memberBookings = await prisma.memberBooking.findMany();
    const signupCodes = await prisma.signupCode.findMany();
    const imageAdapterSettings = await prisma.imageAdapterSetting.findMany();
    const allData = {
      users,
      accounts,
      signupCodes,
      stableItems,
      memberBookings,
      imageAdapterSettings,
    };
    writeFileSync(options.output, JSON.stringify(allData, null, 2));
  });

program
  .command('db-restore')
  .description('Restore all contents of the database from a JSON file')
  .option('-i, --input <path>')
  .action(async options => {
    const allData = JSON.parse(readFileSync(options.input).toString());
    const {
      user,
      accounts,
      signupCodes,
      stableItems,
      bookings,
      memberBookings,
      imageAdapterSettings,
    } = allData;
    for (const data of user) {
      await prisma.user.create({data});
    }
    for (const data of accounts) {
      await prisma.account.create({data});
    }
    for (const data of signupCodes) {
      await prisma.signupCode.create({data});
    }
    for (const data of bookings) {
      await prisma.booking.create({data});
    }
    for (const data of memberBookings) {
      await prisma.memberBooking.create({data});
    }
    for (const data of imageAdapterSettings) {
      await prisma.imageAdapterSetting.create({data});
    }
    for (const data of stableItems) {
      await prisma.stableItem.create({data});
    }
  });

program.parse();
