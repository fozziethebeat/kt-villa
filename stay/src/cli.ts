import {helpers, PredictionServiceClient} from '@google-cloud/aiplatform';
import {Command} from 'commander';
import {writeFileSync} from 'fs';

import {GeminiImagenGenerator, TogetherFluxGenerator} from '@/lib/generate';

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

program.parse();
