/*
  Warnings:

  - You are about to drop the column `parcId` on the `panne` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "panne" DROP CONSTRAINT "panne_parcId_fkey";

-- AlterTable
ALTER TABLE "panne" DROP COLUMN "parcId";

-- CreateTable
CREATE TABLE "_PanneToParc" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_PanneToParc_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_PanneToParc_B_index" ON "_PanneToParc"("B");

-- AddForeignKey
ALTER TABLE "_PanneToParc" ADD CONSTRAINT "_PanneToParc_A_fkey" FOREIGN KEY ("A") REFERENCES "panne"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PanneToParc" ADD CONSTRAINT "_PanneToParc_B_fkey" FOREIGN KEY ("B") REFERENCES "parc"("id") ON DELETE CASCADE ON UPDATE CASCADE;
