import * as dotenv from "dotenv";
dotenv.config();

import { Command } from "commander";
import sharp from "sharp";

import { imageSaver } from "@/lib/storage";
import { imageGenerator } from "@/lib/generate";

const program = new Command();

// Configure the CLI
program
  .name("nga-template")
  .description("Sample CLI tools for NextJS Graphql Template")
  .version("1.0.0");

program
  .command("generate-image")
  .description("Generate an image from prompt")
  .option("-p, --prompt <str>", "The text prompt")
  .option("-n, --name <str>", "The image name")
  .action(async (options) => {
    const url = await imageGenerator.generateImage(
      options.name,
      options.prompt
    );
    console.log(url);
  });

program
  .command("upload-image")
  .description("Upload an image to storage")
  .option("-i, --image <path>", "The path to a png image to upload")
  .option("-n, --name <string>", "The name of the image file")
  .action(async (options) => {
    const buffer = await sharp(options.image).toFormat("png").toBuffer();
    const url = await imageSaver.uploadImage(buffer, options.name, "image/png");
    console.log(url);
  });

program.parse();
