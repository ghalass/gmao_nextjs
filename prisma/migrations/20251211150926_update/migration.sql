/*
  Warnings:

  - You are about to drop the `typepanne_parc` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "typepanne_parc" DROP CONSTRAINT "typepanne_parc_parc_id_fkey";

-- DropForeignKey
ALTER TABLE "typepanne_parc" DROP CONSTRAINT "typepanne_parc_typepanne_id_fkey";

-- DropTable
DROP TABLE "typepanne_parc";

-- CreateTable
CREATE TABLE "panne_parc" (
    "parc_id" TEXT NOT NULL,
    "panne_id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "panne_parc_pkey" PRIMARY KEY ("parc_id","panne_id")
);

-- AddForeignKey
ALTER TABLE "panne_parc" ADD CONSTRAINT "panne_parc_parc_id_fkey" FOREIGN KEY ("parc_id") REFERENCES "parc"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "panne_parc" ADD CONSTRAINT "panne_parc_panne_id_fkey" FOREIGN KEY ("panne_id") REFERENCES "panne"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
