/*
  Warnings:

  - The values [hair_stylist] on the enum `JobRole` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "JobRole_new" AS ENUM ('barber', 'cosmetologist', 'esthetician', 'nail_tech', 'lash_tech', 'tattoo_artist', 'piercer');
ALTER TABLE "TalentProfile" ALTER COLUMN "roles" TYPE "JobRole_new"[] USING ("roles"::text::"JobRole_new"[]);
ALTER TABLE "Job" ALTER COLUMN "role" TYPE "JobRole_new" USING ("role"::text::"JobRole_new");
ALTER TYPE "JobRole" RENAME TO "JobRole_old";
ALTER TYPE "JobRole_new" RENAME TO "JobRole";
DROP TYPE "JobRole_old";
COMMIT;

-- AlterTable
ALTER TABLE "Job" ADD COLUMN     "experienceText" TEXT;
