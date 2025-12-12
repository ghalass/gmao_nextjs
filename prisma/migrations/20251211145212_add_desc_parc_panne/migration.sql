-- AlterTable
ALTER TABLE "panne" ADD COLUMN     "description" TEXT,
ADD COLUMN     "parcId" TEXT;

-- AddForeignKey
ALTER TABLE "panne" ADD CONSTRAINT "panne_parcId_fkey" FOREIGN KEY ("parcId") REFERENCES "parc"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
