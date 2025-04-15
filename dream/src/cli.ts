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

program.parse();
