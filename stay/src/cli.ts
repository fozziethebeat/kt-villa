import "./cli-init";
import { helpers, PredictionServiceClient } from "@google-cloud/aiplatform";
import { Command } from "commander";
import { readFileSync, writeFileSync } from "fs";
import path from "path";
import fs from "fs";
import { S3Client, ListObjectsV2Command, GetObjectCommand } from "@aws-sdk/client-s3";
import { Storage } from "@google-cloud/storage";

import { imageGenerator, imagePromptGenerator } from "@/lib/generate";
import { prisma } from "@/lib/prisma";
import { PrismaClient } from "@prisma/client";

const program = new Command();

// Configure the CLI
program
  .name("kt-villa-tools")
  .description("CLI tools for KT Villa Operations")
  .version("1.0.0");

program
  .command("test-prompt-generate")
  .description("Generate test prompt")
  .requiredOption("-a, --adapter <number>", "Test adapter ID to use", parseInt)
  .action(async (options) => {
    const adapter = await prisma.imageAdapterSetting.findUnique({
      where: { id: options.adapter },
    });
    const prompt = await imagePromptGenerator.generate(adapter);
    console.log(prompt);
  });

program
  .command("test-image-generate")
  .description("Generate Test Image")
  .requiredOption("-p, --prompt <str>", "Test prompt to use", parseInt)
  .action(async (options) => {
    const fakeID = "test";
    const imageURL = await imageGenerator.generateImage(fakeID, options.prompt);
    console.log(imageURL);
  });

program
  .command("test-full-generate")
  .description("Generate Test Image")
  .requiredOption("-a, --adapter <number>", "Test adapter ID to use", parseInt)
  .action(async (options) => {
    const adapter = await prisma.imageAdapterSetting.findUnique({
      where: { id: options.adapter },
    });
    const prompt = await imagePromptGenerator.generate(adapter);
    const fakeID = "test";
    const imageURL = await imageGenerator.generateImage(fakeID, prompt);
    console.log(imageURL);
  });

program
  .command("db-dump")
  .description("Dump all contents of the database into a JSON file")
  .option("-o, --output <path>")
  .action(async (options) => {
    const users = await prisma.user.findMany();
    const accounts = await prisma.account.findMany();
    const stableItems = await prisma.stableItem.findMany();
    const bookings = await prisma.booking.findMany();
    const memberBookings = await prisma.memberBooking.findMany();
    const signupCodes = await prisma.signupCode.findMany();
    const imageAdapterSettings = await prisma.imageAdapterSetting.findMany();
    const allData = {
      users,
      accounts,
      signupCodes,
      stableItems,
      bookings,
      memberBookings,
      imageAdapterSettings,
    };
    writeFileSync(options.output, JSON.stringify(allData, null, 2));
  });

program
  .command("db-restore")
  .description("Restore all contents of the database from a JSON file")
  .option("-i, --input <path>")
  .action(async (options) => {
    const allData = JSON.parse(readFileSync(options.input).toString());
    const {
      users,
      accounts,
      signupCodes,
      stableItems,
      bookings,
      memberBookings,
      imageAdapterSettings,
    } = allData;
    for (const data of users) {
      await prisma.user.create({ data });
    }
    for (const data of accounts) {
      await prisma.account.create({ data });
    }
    for (const data of signupCodes) {
      await prisma.signupCode.create({ data });
    }
    for (const data of bookings) {
      await prisma.booking.create({ data });
    }
    for (const data of memberBookings) {
      await prisma.memberBooking.create({ data });
    }
    for (const data of imageAdapterSettings) {
      await prisma.imageAdapterSetting.create({ data });
    }
    for (const data of stableItems) {
      await prisma.stableItem.create({ data });
    }
  });

program
  .command("migrate-s3-to-gcs")
  .description("Migrate all images from AWS S3 bucket to GCP Cloud Storage bucket")
  .action(async () => {
    const s3Bucket = process.env.AWS_BUCKET;
    const gcsBucketName = process.env.GOOGLE_CLOUD_STORAGE_BUCKET;
    const gcsProjectId = process.env.GOOGLE_CLOUD_PROJECT_ID;
    const gcsKeyFile = process.env.GOOGLE_CLOUD_KEY_FILE || "gcp-key.json";

    if (!s3Bucket) {
      throw new Error("AWS_BUCKET environment variable is not defined");
    }
    if (!gcsBucketName) {
      throw new Error("GOOGLE_CLOUD_STORAGE_BUCKET environment variable is not defined");
    }

    console.log("Initializing AWS S3 and Google Cloud Storage clients...");

    const s3 = new S3Client({
      region: process.env.AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    });

    const absoluteKeyFilePath = path.resolve(gcsKeyFile);
    if (!fs.existsSync(absoluteKeyFilePath)) {
      throw new Error(`Google Cloud key file not found at: ${absoluteKeyFilePath}`);
    }
    const credentials = JSON.parse(fs.readFileSync(absoluteKeyFilePath, "utf8"));
    const gcs = new Storage({
      projectId: gcsProjectId,
      credentials,
    });
    const gcsBucket = gcs.bucket(gcsBucketName);

    console.log(`Copying all files from S3 bucket "${s3Bucket}" to GCS bucket "${gcsBucketName}"...`);

    let isTruncated = true;
    let continuationToken: string | undefined = undefined;
    let totalCount = 0;

    while (isTruncated) {
      const listResponse = await s3.send(
        new ListObjectsV2Command({
          Bucket: s3Bucket,
          ContinuationToken: continuationToken,
        })
      );

      if (listResponse.Contents && listResponse.Contents.length > 0) {
        for (const object of listResponse.Contents) {
          const key = object.Key;
          if (!key) continue;

          console.log(`Copying "${key}" (${object.Size || 0} bytes)...`);

          try {
            const getResponse = await s3.send(
              new GetObjectCommand({
                Bucket: s3Bucket,
                Key: key,
              })
            );

            if (!getResponse.Body) {
              console.error(`  Error: No body content for "${key}"`);
              continue;
            }

            const byteArray = await getResponse.Body.transformToByteArray();
            const buffer = Buffer.from(byteArray);
            const contentType = getResponse.ContentType || "image/png";

            const gcsFile = gcsBucket.file(key);
            const writeStream = gcsFile.createWriteStream({
              metadata: {
                contentType,
              },
            });

            await new Promise<void>((resolve, reject) => {
              writeStream.on("error", reject);
              writeStream.on("finish", resolve);
              writeStream.end(buffer);
            });

            totalCount++;
            console.log(`  Successfully copied "${key}" to GCS.`);
          } catch (err) {
            console.error(`  Failed to copy "${key}":`, err);
          }
        }
      }

      isTruncated = listResponse.IsTruncated ?? false;
      continuationToken = listResponse.NextContinuationToken;
    }

    console.log(`Migration complete! Copied ${totalCount} files.`);
  });

program
  .command("migrate-db-to-neon")
  .description("Migrate all data from Supabase to Neon and update image URLs")
  .action(async () => {
    const sourceUrl = process.env.POSTGRES_DB_URL;
    const destUrl = process.env.NEON_DB_URL;

    if (!sourceUrl) {
      throw new Error("POSTGRES_DB_URL environment variable is not defined");
    }
    if (!destUrl) {
      throw new Error("NEON_DB_URL environment variable is not defined");
    }

    console.log("Connecting to Source Database...");
    const sourcePrisma = new PrismaClient({
      datasources: {
        db: {
          url: sourceUrl,
        },
      },
    });

    console.log("Connecting to Destination Database (Neon)...");
    const destPrisma = new PrismaClient({
      datasources: {
        db: {
          url: destUrl,
        },
      },
    });

    try {
      console.log("Fetching all data from source database...");
      
      const users = await sourcePrisma.user.findMany();
      console.log(`- Retrieved ${users.length} Users`);

      const accounts = await sourcePrisma.account.findMany();
      console.log(`- Retrieved ${accounts.length} Accounts`);

      const sessions = await sourcePrisma.session.findMany();
      console.log(`- Retrieved ${sessions.length} Sessions`);

      const verificationTokens = await sourcePrisma.verificationToken.findMany();
      console.log(`- Retrieved ${verificationTokens.length} VerificationTokens`);

      const signupCodes = await sourcePrisma.signupCode.findMany();
      console.log(`- Retrieved ${signupCodes.length} SignupCodes`);

      const imageAdapterSettings = await sourcePrisma.imageAdapterSetting.findMany();
      console.log(`- Retrieved ${imageAdapterSettings.length} ImageAdapterSettings`);

      const stableItems = await sourcePrisma.stableItem.findMany();
      console.log(`- Retrieved ${stableItems.length} StableItems`);

      const bookings = await sourcePrisma.booking.findMany();
      console.log(`- Retrieved ${bookings.length} Bookings`);

      const memberBookings = await sourcePrisma.memberBooking.findMany();
      console.log(`- Retrieved ${memberBookings.length} MemberBookings`);

      // 2) Update the StableItem table's image field to use the new GCP URL for the images.
      const s3UrlRegex = /https:\/\/ktvilla-images\.s3[.-]?[a-z0-9-]*\.amazonaws\.com\//g;
      const newGcsPrefix = "https://storage.googleapis.com/monogen/";

      let updatedUrlCount = 0;
      const updatedStableItems = stableItems.map((item) => {
        let updatedImage = item.image;
        if (s3UrlRegex.test(item.image)) {
          updatedImage = item.image.replace(s3UrlRegex, newGcsPrefix);
          updatedUrlCount++;
        }
        return {
          ...item,
          image: updatedImage,
        };
      });
      console.log(`Updated image URLs for ${updatedUrlCount} StableItems.`);

      console.log("Clearing target database in reverse topological order...");
      
      await destPrisma.memberBooking.deleteMany();
      await destPrisma.booking.deleteMany();
      await destPrisma.stableItem.deleteMany();
      await destPrisma.session.deleteMany();
      await destPrisma.account.deleteMany();
      await destPrisma.user.deleteMany();
      await destPrisma.verificationToken.deleteMany();
      await destPrisma.signupCode.deleteMany();
      await destPrisma.imageAdapterSetting.deleteMany();
      console.log("Target database cleared.");

      console.log("Writing data to destination database in topological order...");

      // 1. Users
      console.log(`Inserting ${users.length} Users...`);
      for (const data of users) {
        await destPrisma.user.create({ data });
      }

      // 2. Accounts
      console.log(`Inserting ${accounts.length} Accounts...`);
      for (const data of accounts) {
        await destPrisma.account.create({ data });
      }

      // 3. Sessions
      console.log(`Inserting ${sessions.length} Sessions...`);
      for (const data of sessions) {
        await destPrisma.session.create({ data });
      }

      // 4. VerificationTokens
      console.log(`Inserting ${verificationTokens.length} VerificationTokens...`);
      for (const data of verificationTokens) {
        await destPrisma.verificationToken.create({ data });
      }

      // 5. SignupCodes
      console.log(`Inserting ${signupCodes.length} SignupCodes...`);
      for (const data of signupCodes) {
        await destPrisma.signupCode.create({ data });
      }

      // 6. ImageAdapterSettings
      console.log(`Inserting ${imageAdapterSettings.length} ImageAdapterSettings...`);
      for (const data of imageAdapterSettings) {
        await destPrisma.imageAdapterSetting.create({ data });
      }

      // 7. StableItems
      console.log(`Inserting ${updatedStableItems.length} StableItems...`);
      for (const data of updatedStableItems) {
        await destPrisma.stableItem.create({ data });
      }

      // 8. Bookings
      console.log(`Inserting ${bookings.length} Bookings...`);
      for (const data of bookings) {
        await destPrisma.booking.create({ data });
      }

      // 9. MemberBookings
      console.log(`Inserting ${memberBookings.length} MemberBookings...`);
      for (const data of memberBookings) {
        await destPrisma.memberBooking.create({ data });
      }

      console.log("Database migration and image URL updates completed successfully!");

    } catch (error) {
      console.error("Migration failed:", error);
      throw error;
    } finally {
      await sourcePrisma.$disconnect();
      await destPrisma.$disconnect();
    }
  });

program.parse();
