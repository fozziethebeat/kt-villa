import {GoogleGenerativeAI} from '@google/generative-ai';
import {Command} from 'commander';

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
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({model: process.env.GEMINI_MODEL});
    const result = await model.generateContent([options.prompt]);
    console.log(result.response.text());
  });

program.parse();
