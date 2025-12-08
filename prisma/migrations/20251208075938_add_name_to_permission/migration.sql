/*
  Warnings:

  - A unique constraint covering the columns `[name]` on the table `permission` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `name` to the `permission` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "permission" ADD COLUMN     "description" TEXT,
ADD COLUMN     "name" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "permission_name_key" ON "permission"("name");
