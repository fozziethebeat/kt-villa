import {Command} from 'commander';
import fs from 'fs';

import {imageGenerator} from '@/lib/generate';
import {PrismaClient} from '@prisma/client';

const program = new Command();
const db = new PrismaClient();

// Configure the CLI
program
  .name('yumegai-tools')
  .description('CLI tools for Yumegai Operations')
  .version('1.0.0');

program
  .command('generate')
  .description('Generate Test Generative text response')
  .option('-p, --prompt <query>')
  .action(async options => {
    const url = await imageGenerator.generateImage('test', options.prompt);
    console.log(url);
  });

program
  .command('alter')
  .description('Modify a given image')
  .option('-p, --prompt <query>')
  .option('-s, --start <query>')
  .action(async options => {
    const url = await imageGenerator.editImage(
      'test',
      fs.readFileSync(options.start).toString('base64'),
      options.prompt,
    );
    console.log(url);
  });

program
  .command('db-dump')
  .description('Dump all contents of the database into a JSON file')
  .option('-o, --output <path>')
  .action(async options => {
    const dreamThemes = await db.dreamTheme.findMany();
    const promptTemplates = await db.promptTemplate.findMany();
    const styles = await db.style.findMany();
    const dreams = await db.dream.findMany();
    const magicCodes = await db.magicCode.findMany();
    const accounts = await db.account.findMany();
    const user = await db.user.findMany();
    const allData = {
      dreamThemes,
      promptTemplates,
      styles,
      dreams,
      magicCodes,
      accounts,
      user,
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
      dreamThemes,
      promptTemplates,
      styles,
      dreams,
      magicCodes,
      accounts,
      user,
    } = allData;
    for (const data of user) {
      await db.user.create({data});
    }
    for (const data of accounts) {
      await db.account.create({data});
    }
    for (const data of magicCodes) {
      await db.magicCode.create({data});
    }
    for (const data of dreams) {
      await db.dream.create({data});
    }
    for (const data of styles) {
      await db.style.create({data});
    }
    for (const data of promptTemplates) {
      await db.promptTemplate.create({data});
    }
    for (const data of dreamThemes) {
      await db.dreamTheme.create({data});
    }
  });

program.parse();
