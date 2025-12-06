/*
  Warnings:

  - You are about to drop the column `createddAt` on the `engin` table. All the data in the column will be lost.
  - You are about to drop the column `createddAt` on the `lubrifiant` table. All the data in the column will be lost.
  - You are about to drop the column `createddAt` on the `lubrifiant_parc` table. All the data in the column will be lost.
  - You are about to drop the column `createddAt` on the `objectif` table. All the data in the column will be lost.
  - You are about to drop the column `createddAt` on the `panne` table. All the data in the column will be lost.
  - You are about to drop the column `createddAt` on the `parc` table. All the data in the column will be lost.
  - You are about to drop the column `createddAt` on the `saisie_him` table. All the data in the column will be lost.
  - You are about to drop the column `createddAt` on the `saisie_hrm` table. All the data in the column will be lost.
  - You are about to drop the column `createddAt` on the `saisie_lubrifiant` table. All the data in the column will be lost.
  - You are about to drop the column `createddAt` on the `site` table. All the data in the column will be lost.
  - You are about to drop the column `createddAt` on the `type_lubrifiant` table. All the data in the column will be lost.
  - You are about to drop the column `createddAt` on the `typeconsommation_lub` table. All the data in the column will be lost.
  - You are about to drop the column `createddAt` on the `typeconsommation_lub_parc` table. All the data in the column will be lost.
  - You are about to drop the column `createddAt` on the `typepanne` table. All the data in the column will be lost.
  - You are about to drop the column `createddAt` on the `typepanne_parc` table. All the data in the column will be lost.
  - You are about to drop the column `createddAt` on the `typeparc` table. All the data in the column will be lost.
  - You are about to drop the column `createddAt` on the `user` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "engin" DROP COLUMN "createddAt",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "lubrifiant" DROP COLUMN "createddAt",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "lubrifiant_parc" DROP COLUMN "createddAt",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "objectif" DROP COLUMN "createddAt",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "panne" DROP COLUMN "createddAt",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "parc" DROP COLUMN "createddAt",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "saisie_him" DROP COLUMN "createddAt",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "saisie_hrm" DROP COLUMN "createddAt",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "saisie_lubrifiant" DROP COLUMN "createddAt",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "site" DROP COLUMN "createddAt",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "type_lubrifiant" DROP COLUMN "createddAt",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "typeconsommation_lub" DROP COLUMN "createddAt",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "typeconsommation_lub_parc" DROP COLUMN "createddAt",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "typepanne" DROP COLUMN "createddAt",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "typepanne_parc" DROP COLUMN "createddAt",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "typeparc" DROP COLUMN "createddAt",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "user" DROP COLUMN "createddAt",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
