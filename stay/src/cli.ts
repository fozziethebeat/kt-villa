import {helpers, PredictionServiceClient} from '@google-cloud/aiplatform';
import {Command} from 'commander';
import {writeFileSync} from 'fs';

import {GeminiImagenGenerator, TogetherFluxGenerator} from '@/lib/generate';
import {prisma} from '@/lib/prisma';

const program = new Command();

// Configure the CLI
program
  .name('kt-villa-tools')
  .description('CLI tools for KT Villa Operations')
  .version('1.0.0');

interface GenerateOptions {
  generator: string;
  variants: string;
  prompt: string;
  style: string;
}

program
  .command('generate')
  .description('Generate Test Image')
  .requiredOption('-g, --generator <gemini|together>', 'Image geneator type')
  .requiredOption('-v, --variants <focus variants>', 'Character variants')
  .requiredOption('-s, --style <style>', 'Style keywords')
  .requiredOption('-p, --prompt <template>', 'LiquidJS prompt template')
  .action(async (options: GenerateOptions) => {
    let generator = null;
    if (options.generator === 'gemini') {
      generator = new GeminiImagenGenerator(
        process.env.AWS_BUCKET,
        process.env.GEMINI_PROJECT_ID,
        process.env.GEMINI_LOCATION,
      );
    } else if (options.generator === 'together') {
      generator = new TogetherFluxGenerator(
        process.env.AWS_BUCKET,
        process.env.TOGETHER_API_KEY,
        process.env.TOGETHER_API_MODEL,
      );
    } else {
      throw new Error('Invalid generator');
    }
    const settings = {
      variants: options.variants.split(','),
      promptTemplate: options.prompt,
      adapter: options.style,
      steps: 10,
    };
    const start = Date.now();
    const image = await generator.generateImageFromAdapter('test', settings);
    const end = Date.now();
    const elapsedTime = end - start;
    console.log(elapsedTime);
    console.log(image);
  });

program
  .command('db-dump')
  .description('Dump all contents of the database into a JSON file')
  .option('-o, --output <path>')
  .action(async options => {
    const users = await prisma.user.findMany();
    const accounts = await prisma.account.findMany();
    const stableItems = await prisma.stableItem.findMany();
    const bookings = await prisma.bookings.findMany();
    const memberBookings = await prisma.memberBooking.findMany();
    const signupCodes = await prisma.signupCode.findMany();
    const imageAdapterSettings = await prisma.imageAdapterSetting.findMany();
    const allData = {
      user,
      accounts,
      signupCodes,
      stableItems,
      memberBookings,
      imageAdapterSettings,
    };
    fs.writeFileSync(options.output, JSON.stringify(allData, null, 2));
  });

program
  .command('db-restore')
  .description('Restore all contents of the database from a JSON file')
  .option('-i, --input <path>')
  .action(async options => {
    const allData = JSON.parse(fs.readFileSync(options.input).toString());
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
      await db.user.create({data});
    }
    for (const data of accounts) {
      await db.account.create({data});
    }
    for (const data of signupCodes) {
      await db.signupCode.create({data});
    }
    for (const data of bookings) {
      await db.booking.create({data});
    }
    for (const data of memberBookings) {
      await db.memberBooking.create({data});
    }
    for (const data of imageAdapterSettings) {
      await db.imageAdapterSetting.create({data});
    }
    for (const data of stableItems) {
      await db.stableItem.create({data});
    }
  });

program.parse();
