import * as dotenv from "dotenv";
dotenv.config();

import {
  createCanvas,
  loadImage,
  registerFont,
  CanvasRenderingContext2D,
} from "canvas";
import { Command } from "commander";
import { existsSync, readFileSync, writeFileSync } from "fs";
import path from "path";
import { PDFDocument } from "pdf-lib";

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
    const img = await loadImage(options.image);

    const canvas = createCanvas(img.width, img.height);
    const ctx = canvas.getContext("2d");

    ctx.drawImage(img, 0, 0);

    const buffer = canvas.toBuffer("image/png");
    const url = await imageSaver.uploadImage(buffer, options.name, "image/png");
    console.log(url);
  });

interface LabelImage {
  image: string;
}

const DPI = 300; // Dots Per Inch for printing resolution
const SHEET_WIDTH_IN = 8.5; // US Letter width
const SHEET_HEIGHT_IN = 11; // US Letter height
const LABEL_DIAMETER_IN = 2; // Diameter of a single circular label
const COLS = 3; // Number of columns on the sheet
const ROWS = 4; // Number of rows on the sheet
const SHEET_WIDTH_PX = Math.round(SHEET_WIDTH_IN * DPI);
const SHEET_HEIGHT_PX = Math.round(SHEET_HEIGHT_IN * DPI);
const LABEL_DIAMETER_PX = Math.round(LABEL_DIAMETER_IN * DPI);
const HORIZONTAL_SPACING_PX =
  (SHEET_WIDTH_PX - COLS * LABEL_DIAMETER_PX) / (COLS + 1);
const VERTICAL_SPACING_PX =
  (SHEET_HEIGHT_PX - ROWS * LABEL_DIAMETER_PX) / (ROWS + 1);
const LEFT_MARGIN_PX = HORIZONTAL_SPACING_PX;
const TOP_MARGIN_PX = VERTICAL_SPACING_PX;

async function createCircularImage(
  imageInput: string | Buffer,
  outputSize: number
) {
  const img = await loadImage(imageInput);

  const originalWidth = img.width;
  const originalHeight = img.height;

  if (!originalWidth || !originalHeight) {
    throw new Error("Could not determine image dimensions");
  }

  const minDim = Math.min(originalWidth, originalHeight);
  const scale = outputSize / minDim;
  const newWidth = Math.round(originalWidth * scale);
  const newHeight = Math.round(originalHeight * scale);

  // Resize and center-crop to outputSize
  const tempCanvas = createCanvas(outputSize, outputSize);
  const ctx = tempCanvas.getContext("2d");

  // White background fill
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, outputSize, outputSize);

  // Create circular clipping path
  ctx.beginPath();
  ctx.arc(outputSize / 2, outputSize / 2, outputSize / 2, 0, Math.PI * 2);
  ctx.clip();

  // Draw resized image, centered
  const dx = (outputSize - newWidth) / 2;
  const dy = (outputSize - newHeight) / 2;
  ctx.drawImage(img, dx, dy, newWidth, newHeight);

  // Return PNG buffer
  return tempCanvas.toBuffer("image/png");
}

function wrapLines(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] {
  const rawLines = text.split("\n");
  const out: string[] = [];

  for (const raw of rawLines) {
    const words = raw.split(/\s+/);
    let line = "";

    for (const w of words) {
      const test = line ? `${line} ${w}` : w;
      const { width } = ctx.measureText(test);

      if (width > maxWidth && line) {
        out.push(line);
        line = w;
      } else {
        line = test;
      }
    }
    if (line) out.push(line);
  }
  return out;
}

export function createDetailsLabelCircle(
  labelText: string,
  sizePx: number,
  fontFile: string,
  fontSize: number,
  backgroundColor: string,
  wrapFactor = 1.5
): Buffer {
  // ── 1. Canvas setup ──────────────────────────────────────────
  const canvas = createCanvas(sizePx, sizePx); // RGBA, transparent by default
  const ctx = canvas.getContext("2d");

  // Optional custom font
  const fontFamily = path.basename(fontFile, path.extname(fontFile));
  if (existsSync(fontFile)) {
    registerFont(fontFile, { family: fontFamily });
  }

  ctx.font = `${fontSize}px "${fontFamily}"`;
  ctx.textBaseline = "top";
  ctx.imageSmoothingEnabled = true;

  // ── 2. Draw circle ───────────────────────────────────────────
  const center = sizePx / 2;
  const radius = center - 10; // 10 px margin
  ctx.beginPath();
  ctx.arc(center, center, radius, 0, Math.PI * 2);
  ctx.fillStyle = backgroundColor;
  ctx.fill();

  // ── 3. Wrap text so it fits inside the circle ────────────────
  const maxTextWidth = Math.floor(Math.SQRT2 * radius); // ≈ inscribed square
  // A rough adjustment similar to Python’s wrap_factor
  const approxMaxChars =
    Math.floor(maxTextWidth / (fontSize / wrapFactor)) || 1;
  const wrappedLines = wrapLines(
    ctx,
    labelText,
    maxTextWidth || approxMaxChars * (fontSize / wrapFactor)
  );

  // ── 4. Vertical centering ────────────────────────────────────
  const metrics = ctx.measureText("Mg"); // sample to estimate line height
  const lineHeight =
    (metrics.actualBoundingBoxAscent ?? fontSize) +
    (metrics.actualBoundingBoxDescent ?? fontSize * 0.2);

  const totalHeight = lineHeight * wrappedLines.length;
  let y = center - totalHeight / 2;

  // ── 5. Render each line ──────────────────────────────────────
  ctx.fillStyle = "black";
  for (const line of wrappedLines) {
    const { width } = ctx.measureText(line);
    const x = center - width / 2;
    ctx.fillText(line, x, y);
    y += lineHeight;
  }

  // ── 6. Return PNG buffer ─────────────────────────────────────
  return canvas.toBuffer("image/png");
}

/**
 * Arranges 12 PNG images into a 4x3 grid for an Avery 22807 sticker sheet.
 * Each input image is first converted to a circular sticker.
 *
 * @param {string[]} imagePaths Array of 12 paths to the input PNG images.
 * @param {string} outputFilePath Path to save the final sticker sheet image
 *     (e.g., 'avery_sheet.png').
 * @param {string} [stickerBackgroundColor='white'] Background color for the
 *     circular stickers.
 * @param {string} [sheetBackgroundColor='white'] Background color for the
 *     sticker sheet itself (outside the labels).
 */
async function generateAveryStickerSheet(
  labelImages: LabelImage[],
  outputFilePath: string,
  stickerBackgroundColor: string = "white",
  sheetBackgroundColor: string = "white"
): Promise<void> {
  const canvas = createCanvas(SHEET_WIDTH_PX, SHEET_HEIGHT_PX);
  const ctx = canvas.getContext("2d");

  // Fill background
  ctx.fillStyle = sheetBackgroundColor;
  ctx.fillRect(0, 0, SHEET_WIDTH_PX, SHEET_HEIGHT_PX);

  let i = 0;
  for (; i < labelImages.length; i++) {
    const { image } = labelImages[i];
    const col = i % COLS;
    const row = Math.floor(i / COLS);

    const circularBuffer = await createCircularImage(image, LABEL_DIAMETER_PX);
    const labelImg = await loadImage(circularBuffer);

    const xPos =
      LEFT_MARGIN_PX + col * (LABEL_DIAMETER_PX + HORIZONTAL_SPACING_PX);
    const yPos =
      TOP_MARGIN_PX + row * (LABEL_DIAMETER_PX + VERTICAL_SPACING_PX);

    ctx.drawImage(labelImg, xPos, yPos);
  }
  for (; i < 12; i++) {
    const col = i % COLS;
    const row = Math.floor(i / COLS);

    const circularBuffer = await createDetailsLabelCircle(
      `Ingredients:
Olive Oil, Palm Oil, Coconut Oil, Castor Oil, Water, Lye, Rose, Juniper Leaf, Hinoki


Magic Code: XaBc1aF


Story:
  A vast and wild monkey king took to the skies to eat a kit-kat.  Much wildness was had
`,
      LABEL_DIAMETER_PX,
      "",
      32,
      "lightblue"
    );
    const labelImg = await loadImage(circularBuffer);

    const xPos =
      LEFT_MARGIN_PX + col * (LABEL_DIAMETER_PX + HORIZONTAL_SPACING_PX);
    const yPos =
      TOP_MARGIN_PX + row * (LABEL_DIAMETER_PX + VERTICAL_SPACING_PX);

    ctx.drawImage(labelImg, xPos, yPos);
  }

  // Export canvas to PNG buffer
  const finalSheetBuffer = canvas.toBuffer("image/png");

  // Create PDF from PNG
  const pdfDoc = await PDFDocument.create();
  const pngImage = await pdfDoc.embedPng(finalSheetBuffer);

  const pdfPageWidth = SHEET_WIDTH_IN * 72;
  const pdfPageHeight = SHEET_HEIGHT_IN * 72;

  const page = pdfDoc.addPage([pdfPageWidth, pdfPageHeight]);

  page.drawImage(pngImage, {
    x: 0,
    y: 0,
    width: page.getWidth(),
    height: page.getHeight(),
  });

  const pdfBytes = await pdfDoc.save();
  writeFileSync(outputFilePath, pdfBytes);
  console.log(`✅ Generated sticker sheet at: ${outputFilePath}`);
}

program
  .command("create-sticker-sheet")
  .description("Create a sticker sheet")
  .option("-p, --path <string>", "The path to the sticker image files")
  .option("-o, --output <string>", "The name of output image sticker sheet")
  .action(async (options) => {
    // Read in the json metadata.
    const labelImages: LabelImage[] = JSON.parse(
      readFileSync(options.path, "utf-8")
    );
    await generateAveryStickerSheet(labelImages, options.output);
  });

program.parse();
