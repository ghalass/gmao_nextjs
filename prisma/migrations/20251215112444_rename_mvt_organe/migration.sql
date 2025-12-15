/*
  Warnings:

  - You are about to drop the `historique_mouvement_organe` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `historique_revision_organe` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `historique_statut_anomalie` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "historique_mouvement_organe" DROP CONSTRAINT "historique_mouvement_organe_enginId_fkey";

-- DropForeignKey
ALTER TABLE "historique_mouvement_organe" DROP CONSTRAINT "historique_mouvement_organe_organeId_fkey";

-- DropForeignKey
ALTER TABLE "historique_revision_organe" DROP CONSTRAINT "historique_revision_organe_organeId_fkey";

-- DropForeignKey
ALTER TABLE "historique_statut_anomalie" DROP CONSTRAINT "historique_statut_anomalie_anomalieId_fkey";

-- DropTable
DROP TABLE "historique_mouvement_organe";

-- DropTable
DROP TABLE "historique_revision_organe";

-- DropTable
DROP TABLE "historique_statut_anomalie";

-- CreateTable
CREATE TABLE "statut_anomalie" (
    "id" TEXT NOT NULL,
    "anomalieId" TEXT NOT NULL,
    "ancienStatut" "StatutAnomalie" NOT NULL,
    "nouveauStatut" "StatutAnomalie" NOT NULL,
    "dateChangement" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "commentaire" TEXT,

    CONSTRAINT "statut_anomalie_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mouvement_organe" (
    "id" TEXT NOT NULL,
    "organeId" TEXT NOT NULL,
    "enginId" TEXT NOT NULL,
    "date_mvt" TIMESTAMP(3) NOT NULL,
    "type_mvt" "TypeMouvementOrgane" NOT NULL,
    "cause" TEXT NOT NULL,
    "type_cause" "TypeCauseMouvementOrgane",
    "obs" TEXT,
    "test" TEXT,

    CONSTRAINT "mouvement_organe_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "revision_organe" (
    "id" TEXT NOT NULL,
    "organeId" TEXT NOT NULL,
    "date_mvt" TIMESTAMP(3) NOT NULL,
    "type_rg" "TypeRevisionOrgane" NOT NULL,
    "obs" TEXT,

    CONSTRAINT "revision_organe_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "mouvement_organe_organeId_enginId_date_mvt_type_mvt_key" ON "mouvement_organe"("organeId", "enginId", "date_mvt", "type_mvt");

-- CreateIndex
CREATE UNIQUE INDEX "revision_organe_organeId_date_mvt_type_rg_key" ON "revision_organe"("organeId", "date_mvt", "type_rg");

-- AddForeignKey
ALTER TABLE "statut_anomalie" ADD CONSTRAINT "statut_anomalie_anomalieId_fkey" FOREIGN KEY ("anomalieId") REFERENCES "anomalie"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mouvement_organe" ADD CONSTRAINT "mouvement_organe_organeId_fkey" FOREIGN KEY ("organeId") REFERENCES "organe"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mouvement_organe" ADD CONSTRAINT "mouvement_organe_enginId_fkey" FOREIGN KEY ("enginId") REFERENCES "engin"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "revision_organe" ADD CONSTRAINT "revision_organe_organeId_fkey" FOREIGN KEY ("organeId") REFERENCES "organe"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
