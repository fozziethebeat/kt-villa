import * as dotenv from "dotenv";
dotenv.config();

import { PDFDocument } from "pdf-lib"; // Import PDFDocument for PDF generation
import { Command } from "commander";
import { readFileSync, writeFileSync } from "fs";
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

interface LabelImage {
  image: string;
}

function cm_to_pixels(cm: number, dpi = 300) {
  const inches = cm / 2.54;
  return Math.floor(inches * dpi);
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
const LABEL_RADIUS_PX = LABEL_DIAMETER_PX / 2;
const HORIZONTAL_SPACING_PX =
  (SHEET_WIDTH_PX - COLS * LABEL_DIAMETER_PX) / (COLS + 1);
const VERTICAL_SPACING_PX =
  (SHEET_HEIGHT_PX - ROWS * LABEL_DIAMETER_PX) / (ROWS + 1);
const LEFT_MARGIN_PX = HORIZONTAL_SPACING_PX;
const TOP_MARGIN_PX = VERTICAL_SPACING_PX;

// Avery 22807 specific template offsets (approximate based on common templates)
// These are the coordinates of the CENTER of the first label (top-left)
const FIRST_LABEL_CENTER_X_IN = 1.25;
const FIRST_LABEL_CENTER_Y_IN = 1.0;
const HORIZONTAL_PITCH_IN = 2.125; // Distance between centers of adjacent labels horizontally
const VERTICAL_PITCH_IN = 2.5; // Distance between centers of adjacent labels vertically
const FIRST_LABEL_CENTER_X_PX = Math.round(FIRST_LABEL_CENTER_X_IN * DPI);
const FIRST_LABEL_CENTER_Y_PX = Math.round(FIRST_LABEL_CENTER_Y_IN * DPI);
const HORIZONTAL_PITCH_PX = Math.round(HORIZONTAL_PITCH_IN * DPI);
const VERTICAL_PITCH_PX = Math.round(VERTICAL_PITCH_IN * DPI);

async function createCircularImage(
  imageInput: string | Buffer,
  outputSize: number
) {
  const inputImage = sharp(imageInput);
  const metadata = await inputImage.metadata();
  const { width, height } = metadata;

  if (!width || !height) {
    throw new Error(`Could not get dimensions`);
  }

  const ratio = outputSize / Math.min(width, height);
  const newWidth = Math.ceil(width * ratio);
  const newHeight = Math.ceil(height * ratio);

  const cropLeft = Math.floor((newWidth - outputSize) / 2);
  const cropTop = Math.floor((newHeight - outputSize) / 2);

  const squaredImageBuffer = await sharp(imageInput)
    .resize(newWidth, newHeight, {
      fit: "cover",
      kernel: sharp.kernel.lanczos3,
    })
    .extract({
      left: cropLeft,
      top: cropTop,
      width: outputSize,
      height: outputSize,
    })
    .toBuffer();

  const maskSvg = `<svg width="${outputSize}" height="${outputSize}">
            <circle cx="${outputSize / 2}" cy="${outputSize / 2}" r="${
    outputSize / 2
  }" fill="white" />
        </svg>`;
  const maskBuffer = await sharp(Buffer.from(maskSvg))
    .png() // Convert SVG to PNG buffer for use as a mask
    .toBuffer();

  const maskedSquaredImage = await sharp(squaredImageBuffer)
    .joinChannel(maskBuffer) //, { raw: false })
    .toBuffer();

  const parsedBgColor = [255, 255, 255, 1];
  const bgColorSharp = {
    r: parsedBgColor[0],
    g: parsedBgColor[1],
    b: parsedBgColor[2],
    alpha: parsedBgColor[3],
  };

  const solidBgColorSquareBuffer = await sharp({
    create: {
      width: outputSize,
      height: outputSize,
      channels: 3,
      background: { r: bgColorSharp.r, g: bgColorSharp.g, b: bgColorSharp.b },
    },
  })
    .joinChannel(maskBuffer)
    .png()
    .toBuffer();

  return await sharp(solidBgColorSquareBuffer)
    .composite([
      {
        input: maskedSquaredImage,
        top: 0,
        left: 0,
        blend: "over",
      },
    ])
    .png()
    .toBuffer();
}

/**
 * Arranges 12 PNG images into a 4x3 grid for an Avery 22807 sticker sheet.
 * Each input image is first converted to a circular sticker.
 *
 * @param {string[]} imagePaths Array of 12 paths to the input PNG images.
 * @param {string} outputFilePath Path to save the final sticker sheet image (e.g., 'avery_sheet.png').
 * @param {string} [stickerBackgroundColor='white'] Background color for the circular stickers.
 * @param {string} [sheetBackgroundColor='white'] Background color for the sticker sheet itself (outside the labels).
 */
async function generateAveryStickerSheet(
  labelImages: LabelImage[],
  outputFilePath: string,
  stickerBackgroundColor: string = "white",
  sheetBackgroundColor: string = "white"
): Promise<void> {
  // Create a blank sheet with the specified dimensions and background color
  const sheet = sharp({
    create: {
      width: SHEET_WIDTH_PX,
      height: SHEET_HEIGHT_PX,
      channels: 4,
      background: sheetBackgroundColor,
    },
  });

  const compositeOperations: sharp.OverlayOptions[] = [];

  for (let i = 0; i < labelImages.length; i++) {
    const imagePath = labelImages[i].image;
    const col = i % COLS;
    const row = Math.floor(i / COLS);

    // 1. Create the circular image for the current sticker
    const circularImageBuffer = await createCircularImage(
      imagePath,
      LABEL_DIAMETER_PX
    );

    // 2. Calculate the top-left position for placing this circular image on the sheet
    // The (left, top) for sharp.composite refers to the top-left of the image being composited.
    // We use the center coordinates from the template and adjust for the label's radius.
    const xPos = Math.round(
      LEFT_MARGIN_PX + col * (LABEL_DIAMETER_PX + HORIZONTAL_SPACING_PX)
    );
    const yPos = Math.round(
      TOP_MARGIN_PX + row * (LABEL_DIAMETER_PX + VERTICAL_SPACING_PX)
    );

    compositeOperations.push({
      input: circularImageBuffer,
      left: xPos,
      top: yPos,
      blend: "over", // Overlay the sticker onto the sheet
    });
  }

  // Composite all circular images onto the sheet
  const finalSheetBuffer = await sheet
    .composite(compositeOperations)
    .png()
    .toBuffer();

  // Convert the generated PNG image to a PDF
  const pdfDoc = await PDFDocument.create();

  // Embed the PNG image into the PDF document
  const pngImage = await pdfDoc.embedPng(finalSheetBuffer);

  // Get the page dimensions in points (1 point = 1/72 inch)
  const pdfPageWidth = SHEET_WIDTH_IN * 72;
  const pdfPageHeight = SHEET_HEIGHT_IN * 72;

  // Add a blank page to the PDF with the correct dimensions
  const page = pdfDoc.addPage([pdfPageWidth, pdfPageHeight]);

  // Draw the embedded image onto the page, scaling it to fit the entire page
  page.drawImage(pngImage, {
    x: 0,
    y: 0,
    width: page.getWidth(),
    height: page.getHeight(),
  });

  // Serialize the PDFDocument to bytes (a Uint8Array)
  const pdfBytes = await pdfDoc.save();

  writeFileSync(outputFilePath, pdfBytes);
  console.log(
    `Successfully generated Avery 22807 sticker sheet: ${outputFilePath}`
  );
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
