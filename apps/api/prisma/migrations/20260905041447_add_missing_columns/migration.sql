-- AlterTable
ALTER TABLE "product_images" ADD COLUMN IF NOT EXISTS "color_hex" TEXT;
ALTER TABLE "product_images" ADD COLUMN IF NOT EXISTS "color_name" TEXT;
