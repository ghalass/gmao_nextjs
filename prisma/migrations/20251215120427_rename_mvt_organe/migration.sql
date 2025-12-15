/*
  Warnings:

  - You are about to drop the `mouvement_organe` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "mouvement_organe" DROP CONSTRAINT "mouvement_organe_enginId_fkey";

-- DropForeignKey
ALTER TABLE "mouvement_organe" DROP CONSTRAINT "mouvement_organe_organeId_fkey";

-- DropTable
DROP TABLE "mouvement_organe";

-- CreateTable
CREATE TABLE "mvt_organe" (
    "id" TEXT NOT NULL,
    "organeId" TEXT NOT NULL,
    "enginId" TEXT NOT NULL,
    "date_mvt" TIMESTAMP(3) NOT NULL,
    "type_mvt" "TypeMouvementOrgane" NOT NULL,
    "cause" TEXT NOT NULL,
    "type_cause" "TypeCauseMouvementOrgane",
    "obs" TEXT,
    "test" TEXT,

    CONSTRAINT "mvt_organe_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "mvt_organe_organeId_enginId_date_mvt_type_mvt_key" ON "mvt_organe"("organeId", "enginId", "date_mvt", "type_mvt");

-- AddForeignKey
ALTER TABLE "mvt_organe" ADD CONSTRAINT "mvt_organe_organeId_fkey" FOREIGN KEY ("organeId") REFERENCES "organe"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mvt_organe" ADD CONSTRAINT "mvt_organe_enginId_fkey" FOREIGN KEY ("enginId") REFERENCES "engin"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
