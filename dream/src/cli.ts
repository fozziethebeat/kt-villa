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
  .command('db-dump')
  .description('Dump all contents of the database into a JSON file')
  .option('-o, --output <path>')
  .action(async options => {
    const dreamThemes = await db.dreamTheme.findMany();
    const promptTemplates = await db.promptTemplate.findMany();
    const projects = await db.project.findMany();
    const styles = await db.style.findMany();
    const dreams = await db.dream.findMany();
    const magicCodes = await db.magicCode.findMany();
    const accounts = await db.account.findMany();
    const user = await db.user.findMany();
    const userJoinedProjects = {};
    for (const u of user) {
      const {joinedProjects} = await db.user.findUnique({
        where: {
          id: u.id,
        },
        include: {
          joinedProjects: {
            select: {
              id: true,
            },
          },
        },
      });
      if (joinedProjects && joinedProjects.length > 0) {
        userJoinedProjects[u.id] = joinedProjects;
      }
    }
    const allData = {
      dreamThemes,
      promptTemplates,
      styles,
      dreams,
      magicCodes,
      projects,
      accounts,
      user,
      userJoinedProjects,
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
      projects,
      dreams,
      magicCodes,
      accounts,
      user,
      userJoinedProjects,
    } = allData;
    for (const data of user) {
      await db.user.create({data});
    }
    for (const data of accounts) {
      await db.account.create({data});
    }
    for (const data of projects) {
      await db.project.create({data});
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
    for (const userID of Object.keys(userJoinedProjects)) {
      const joinedProjects = userJoinedProjects[userID];
      for (const project of joinedProjects) {
        await db.user.update({
          where: {id: userID},
          data: {
            joinedProjects: {
              connect: {
                id: project.id,
              },
            },
          },
        });
      }
    }
  });

program.parse();
