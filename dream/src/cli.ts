import {Command} from 'commander';

import {PrismaClient} from '@prisma/client';

const program = new Command();
const db = new PrismaClient();

// Configure the CLI
program
  .name('yumegai-tools')
  .description('CLI tools for Yumegai Operations')
  .version('1.0.0');

program.parse();
