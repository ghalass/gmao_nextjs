/*
  Warnings:

  - The values [CREATE,READ,UPDATE,DELETE] on the enum `Action` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "Action_new" AS ENUM ('create', 'read', 'update', 'delete');
ALTER TABLE "permission" ALTER COLUMN "action" TYPE "Action_new" USING ("action"::text::"Action_new");
ALTER TYPE "Action" RENAME TO "Action_old";
ALTER TYPE "Action_new" RENAME TO "Action";
DROP TYPE "public"."Action_old";
COMMIT;
