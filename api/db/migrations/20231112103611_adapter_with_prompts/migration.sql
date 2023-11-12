/*
  Warnings:

  - Added the required column `negativePrompt` to the `ImageAdapterSetting` table without a default value. This is not possible if the table is not empty.
  - Added the required column `promptTemplate` to the `ImageAdapterSetting` table without a default value. This is not possible if the table is not empty.
  - Added the required column `steps` to the `ImageAdapterSetting` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ImageAdapterSetting" ADD COLUMN     "negativePrompt" TEXT NOT NULL,
ADD COLUMN     "promptTemplate" TEXT NOT NULL,
ADD COLUMN     "steps" INTEGER NOT NULL,
ADD COLUMN     "variants" TEXT[];
