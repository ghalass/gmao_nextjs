/*
  Warnings:

  - Made the column `enginId` on table `saisie_him` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "saisie_him" DROP CONSTRAINT "saisie_him_enginId_fkey";

-- AlterTable
ALTER TABLE "saisie_him" ALTER COLUMN "enginId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "saisie_him" ADD CONSTRAINT "saisie_him_enginId_fkey" FOREIGN KEY ("enginId") REFERENCES "engin"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
