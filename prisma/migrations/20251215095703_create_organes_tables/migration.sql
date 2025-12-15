-- CreateEnum
CREATE TYPE "OrigineOrgane" AS ENUM ('BRC', 'APPRO', 'AUTRE');

-- CreateEnum
CREATE TYPE "TypeMouvementOrgane" AS ENUM ('POSE', 'DEPOSE');

-- CreateEnum
CREATE TYPE "TypeCauseMouvementOrgane" AS ENUM ('PREVENTIF', 'INCIDENT');

-- CreateEnum
CREATE TYPE "TypeRevisionOrgane" AS ENUM ('VP', 'RG', 'INTERVENTION');

-- CreateTable
CREATE TABLE "organe" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "typeOrganeId" TEXT NOT NULL,
    "marque" TEXT,
    "sn" TEXT,
    "date_mes" TIMESTAMP(3) NOT NULL,
    "origine" "OrigineOrgane",
    "circuit" TEXT,
    "hrm_initial" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "obs" TEXT,

    CONSTRAINT "organe_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "type_organe" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "type_organe_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "historique_mouvement_organe" (
    "id" TEXT NOT NULL,
    "organeId" TEXT NOT NULL,
    "enginId" TEXT NOT NULL,
    "date_mvt" TIMESTAMP(3) NOT NULL,
    "type_mvt" "TypeMouvementOrgane" NOT NULL,
    "cause" TEXT NOT NULL,
    "type_cause" "TypeCauseMouvementOrgane",
    "obs" TEXT,

    CONSTRAINT "historique_mouvement_organe_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "historique_revision_organe" (
    "id" TEXT NOT NULL,
    "organeId" TEXT NOT NULL,
    "date_mvt" TIMESTAMP(3) NOT NULL,
    "type_rg" "TypeRevisionOrgane" NOT NULL,
    "obs" TEXT,

    CONSTRAINT "historique_revision_organe_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_ParcToTypeOrgane" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_ParcToTypeOrgane_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "organe_name_typeOrganeId_key" ON "organe"("name", "typeOrganeId");

-- CreateIndex
CREATE UNIQUE INDEX "type_organe_name_key" ON "type_organe"("name");

-- CreateIndex
CREATE UNIQUE INDEX "historique_mouvement_organe_organeId_enginId_date_mvt_type__key" ON "historique_mouvement_organe"("organeId", "enginId", "date_mvt", "type_mvt");

-- CreateIndex
CREATE UNIQUE INDEX "historique_revision_organe_organeId_date_mvt_type_rg_key" ON "historique_revision_organe"("organeId", "date_mvt", "type_rg");

-- CreateIndex
CREATE INDEX "_ParcToTypeOrgane_B_index" ON "_ParcToTypeOrgane"("B");

-- AddForeignKey
ALTER TABLE "organe" ADD CONSTRAINT "organe_typeOrganeId_fkey" FOREIGN KEY ("typeOrganeId") REFERENCES "type_organe"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "historique_mouvement_organe" ADD CONSTRAINT "historique_mouvement_organe_organeId_fkey" FOREIGN KEY ("organeId") REFERENCES "organe"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "historique_mouvement_organe" ADD CONSTRAINT "historique_mouvement_organe_enginId_fkey" FOREIGN KEY ("enginId") REFERENCES "engin"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "historique_revision_organe" ADD CONSTRAINT "historique_revision_organe_organeId_fkey" FOREIGN KEY ("organeId") REFERENCES "organe"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ParcToTypeOrgane" ADD CONSTRAINT "_ParcToTypeOrgane_A_fkey" FOREIGN KEY ("A") REFERENCES "parc"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ParcToTypeOrgane" ADD CONSTRAINT "_ParcToTypeOrgane_B_fkey" FOREIGN KEY ("B") REFERENCES "type_organe"("id") ON DELETE CASCADE ON UPDATE CASCADE;
