/*
  Warnings:

  - You are about to drop the column `productId` on the `AltShop` table. All the data in the column will be lost.
  - The primary key for the `Product` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `Product` table. All the data in the column will be lost.
  - Added the required column `productAsin` to the `AltShop` table without a default value. This is not possible if the table is not empty.
  - Added the required column `asin` to the `Product` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "AltShop" DROP CONSTRAINT "AltShop_productId_fkey";

-- AlterTable
ALTER TABLE "AltShop" DROP COLUMN "productId",
ADD COLUMN     "productAsin" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Product" DROP CONSTRAINT "Product_pkey",
DROP COLUMN "id",
ADD COLUMN     "asin" TEXT NOT NULL,
ADD CONSTRAINT "Product_pkey" PRIMARY KEY ("asin");

-- AddForeignKey
ALTER TABLE "AltShop" ADD CONSTRAINT "AltShop_productAsin_fkey" FOREIGN KEY ("productAsin") REFERENCES "Product"("asin") ON DELETE RESTRICT ON UPDATE CASCADE;
