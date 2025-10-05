This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## CLI Tools

This project includes a command-line interface (CLI) to help with common tasks. You can run the CLI using `ts-node`.

### Setup

The CLI requires environment variables for tasks like uploading files. Make sure you have a `.env.local` file in the project root.

### Commands

#### Generate Image

Generates an image from a text prompt using an AI model and saves it.

**Usage:**
```bash
npx ts-node src/cli.ts generate-image --prompt "Your text prompt" --name "image-name"
```

**Arguments:**
- `-p, --prompt <str>`: The text prompt to generate the image from.
- `-n, --name <str>`: The name to use for the generated image file.

---

#### Upload Image

Uploads a local image file to the configured storage provider.

**Usage:**
```bash
npx ts-node src/cli.ts upload-image --image /path/to/your/image.png --name "image-name"
```

**Arguments:**
- `-i, --image <path>`: The local path to the image file you want to upload.
- `-n, --name <string>`: The desired name for the file in the storage provider.

---

#### Create Sticker Sheet

Generates a printable 8.5" x 11" PDF sticker sheet from a JSON file defining the images. The sheet is designed for Avery 22807 2" circular labels (4x3 grid).

**Usage:**
```bash
npx ts-node src/cli.ts create-sticker-sheet --path /path/to/images.json --output /path/to/sticker-sheet.pdf
```

**Arguments:**
- `-p, --path <string>`: The path to the input JSON file. The JSON file should be an array of objects, where each object has an `"image"` key with a path to the image file (e.g., `[{"image": "/path/to/sticker1.png"}, ...]`).
- `-o, --output <string>`: The path where the final PDF sticker sheet will be saved.

