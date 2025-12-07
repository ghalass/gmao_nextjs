/*
  Warnings:

  - You are about to drop the column `createdAt` on the `engin` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `lubrifiant` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `lubrifiant_parc` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `objectif` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `panne` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `parc` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `saisie_him` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `saisie_hrm` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `saisie_lubrifiant` table. All the data in the column will be lost.
  - You are about to drop the column `active` on the `site` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `site` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `type_lubrifiant` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `typeconsommation_lub` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `typeconsommation_lub_parc` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `typepanne` table. All the data in the column will be lost.
  - You are about to drop the column `description` on the `typepanne` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `typepanne_parc` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `typeparc` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `user` table. All the data in the column will be lost.
  - You are about to drop the `role_permission` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `user_role` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "role_permission" DROP CONSTRAINT "role_permission_permissionId_fkey";

-- DropForeignKey
ALTER TABLE "role_permission" DROP CONSTRAINT "role_permission_roleId_fkey";

-- DropForeignKey
ALTER TABLE "user_role" DROP CONSTRAINT "user_role_roleId_fkey";

-- DropForeignKey
ALTER TABLE "user_role" DROP CONSTRAINT "user_role_userId_fkey";

-- AlterTable
ALTER TABLE "engin" DROP COLUMN "createdAt",
ADD COLUMN     "createddAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "lubrifiant" DROP COLUMN "createdAt",
ADD COLUMN     "createddAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "lubrifiant_parc" DROP COLUMN "createdAt",
ADD COLUMN     "createddAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "objectif" DROP COLUMN "createdAt",
ADD COLUMN     "createddAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "panne" DROP COLUMN "createdAt",
ADD COLUMN     "createddAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "parc" DROP COLUMN "createdAt",
ADD COLUMN     "createddAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "saisie_him" DROP COLUMN "createdAt",
ADD COLUMN     "createddAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "saisie_hrm" DROP COLUMN "createdAt",
ADD COLUMN     "createddAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "saisie_lubrifiant" DROP COLUMN "createdAt",
ADD COLUMN     "createddAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "site" DROP COLUMN "active",
DROP COLUMN "createdAt",
ADD COLUMN     "createddAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "type_lubrifiant" DROP COLUMN "createdAt",
ADD COLUMN     "createddAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "typeconsommation_lub" DROP COLUMN "createdAt",
ADD COLUMN     "createddAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "typeconsommation_lub_parc" DROP COLUMN "createdAt",
ADD COLUMN     "createddAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "typepanne" DROP COLUMN "createdAt",
DROP COLUMN "description",
ADD COLUMN     "createddAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "typepanne_parc" DROP COLUMN "createdAt",
ADD COLUMN     "createddAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "typeparc" DROP COLUMN "createdAt",
ADD COLUMN     "createddAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "user" DROP COLUMN "createdAt",
ADD COLUMN     "createddAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- DropTable
DROP TABLE "role_permission";

-- DropTable
DROP TABLE "user_role";

-- CreateTable
CREATE TABLE "_PermissionToRole" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_PermissionToRole_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_RoleToUser" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_RoleToUser_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_PermissionToRole_B_index" ON "_PermissionToRole"("B");

-- CreateIndex
CREATE INDEX "_RoleToUser_B_index" ON "_RoleToUser"("B");

-- AddForeignKey
ALTER TABLE "_PermissionToRole" ADD CONSTRAINT "_PermissionToRole_A_fkey" FOREIGN KEY ("A") REFERENCES "permission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PermissionToRole" ADD CONSTRAINT "_PermissionToRole_B_fkey" FOREIGN KEY ("B") REFERENCES "role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_RoleToUser" ADD CONSTRAINT "_RoleToUser_A_fkey" FOREIGN KEY ("A") REFERENCES "role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_RoleToUser" ADD CONSTRAINT "_RoleToUser_B_fkey" FOREIGN KEY ("B") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
