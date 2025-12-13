/*
  Warnings:

  - You are about to drop the `panne_parc` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "panne_parc" DROP CONSTRAINT "panne_parc_panne_id_fkey";

-- DropForeignKey
ALTER TABLE "panne_parc" DROP CONSTRAINT "panne_parc_parc_id_fkey";

-- DropTable
DROP TABLE "panne_parc";
