/*
  Warnings:

  - The values [daily] on the enum `CompModel` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `applicantUserId` on the `Application` table. All the data in the column will be lost.
  - You are about to drop the column `profileSnapshot` on the `Application` table. All the data in the column will be lost.
  - You are about to drop the column `talentProfileId` on the `Application` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Application` table. All the data in the column will be lost.
  - The `status` column on the `Application` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `actorUserId` on the `AuditLog` table. All the data in the column will be lost.
  - You are about to drop the column `data` on the `AuditLog` table. All the data in the column will be lost.
  - You are about to drop the column `targetId` on the `AuditLog` table. All the data in the column will be lost.
  - You are about to drop the column `targetType` on the `AuditLog` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `Boost` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `Boost` table. All the data in the column will be lost.
  - You are about to drop the column `about` on the `EmployerProfile` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `EmployerProfile` table. All the data in the column will be lost.
  - You are about to drop the column `apprenticeFriendly` on the `Job` table. All the data in the column will be lost.
  - You are about to drop the column `experience` on the `Job` table. All the data in the column will be lost.
  - You are about to drop the column `imagesCount` on the `Job` table. All the data in the column will be lost.
  - You are about to drop the column `licenses` on the `Job` table. All the data in the column will be lost.
  - You are about to drop the column `perks` on the `Job` table. All the data in the column will be lost.
  - You are about to drop the column `shiftDays` on the `Job` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `Job` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Job` table. All the data in the column will be lost.
  - You are about to alter the column `payMin` on the `Job` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Integer`.
  - You are about to alter the column `payMax` on the `Job` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Integer`.
  - You are about to drop the column `applicationId` on the `Message` table. All the data in the column will be lost.
  - You are about to drop the column `readAt` on the `Message` table. All the data in the column will be lost.
  - You are about to drop the column `relayMessageId` on the `Message` table. All the data in the column will be lost.
  - You are about to drop the column `senderUserId` on the `Message` table. All the data in the column will be lost.
  - You are about to drop the column `via` on the `Message` table. All the data in the column will be lost.
  - You are about to drop the column `reporterUserId` on the `Report` table. All the data in the column will be lost.
  - You are about to drop the column `resolvedAt` on the `Report` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `Report` table. All the data in the column will be lost.
  - You are about to drop the column `targetId` on the `Report` table. All the data in the column will be lost.
  - You are about to drop the column `targetType` on the `Report` table. All the data in the column will be lost.
  - You are about to drop the column `availabilityDays` on the `TalentProfile` table. All the data in the column will be lost.
  - You are about to drop the column `igHandle` on the `TalentProfile` table. All the data in the column will be lost.
  - You are about to drop the column `licenses` on the `TalentProfile` table. All the data in the column will be lost.
  - You are about to drop the column `portfolioCount` on the `TalentProfile` table. All the data in the column will be lost.
  - You are about to drop the column `preferredComp` on the `TalentProfile` table. All the data in the column will be lost.
  - You are about to drop the column `travelRadiusMiles` on the `TalentProfile` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `TalentProfile` table. All the data in the column will be lost.
  - You are about to drop the column `zipCode` on the `TalentProfile` table. All the data in the column will be lost.
  - You are about to drop the column `roles` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `User` table. All the data in the column will be lost.
  - You are about to drop the `Account` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Session` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `VerificationToken` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[username]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `applicantId` to the `Application` table without a default value. This is not possible if the table is not empty.
  - Added the required column `kind` to the `Boost` table without a default value. This is not possible if the table is not empty.
  - Added the required column `businessName` to the `Job` table without a default value. This is not possible if the table is not empty.
  - Added the required column `ownerId` to the `Job` table without a default value. This is not possible if the table is not empty.
  - Made the column `lat` on table `Location` required. This step will fail if there are existing NULL values in that column.
  - Made the column `lng` on table `Location` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `recipientId` to the `Message` table without a default value. This is not possible if the table is not empty.
  - Added the required column `senderId` to the `Message` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "CompModel_new" AS ENUM ('booth_rent', 'commission', 'hourly', 'hybrid');
ALTER TABLE "Job" ALTER COLUMN "compModel" TYPE "CompModel_new" USING ("compModel"::text::"CompModel_new");
ALTER TYPE "CompModel" RENAME TO "CompModel_old";
ALTER TYPE "CompModel_new" RENAME TO "CompModel";
ALTER TABLE "TalentProfile" ALTER COLUMN "preferredComp" TYPE "CompModel"[] USING ("preferredComp"::text[]::"CompModel")
DROP TYPE "CompModel_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "Account" DROP CONSTRAINT "Account_userId_fkey";

-- DropForeignKey
ALTER TABLE "Application" DROP CONSTRAINT "Application_applicantUserId_fkey";

-- DropForeignKey
ALTER TABLE "Application" DROP CONSTRAINT "Application_talentProfileId_fkey";

-- DropForeignKey
ALTER TABLE "AuditLog" DROP CONSTRAINT "AuditLog_actorUserId_fkey";

-- DropForeignKey
ALTER TABLE "Job" DROP CONSTRAINT "Job_employerProfileId_fkey";

-- DropForeignKey
ALTER TABLE "Message" DROP CONSTRAINT "Message_applicationId_fkey";

-- DropForeignKey
ALTER TABLE "Message" DROP CONSTRAINT "Message_senderUserId_fkey";

-- DropForeignKey
ALTER TABLE "Report" DROP CONSTRAINT "Report_reporterUserId_fkey";

-- DropForeignKey
ALTER TABLE "Session" DROP CONSTRAINT "Session_userId_fkey";

-- DropIndex
DROP INDEX "Application_jobId_talentProfileId_key";

-- DropIndex
DROP INDEX "Boost_status_startsAt_endsAt_idx";

-- DropIndex
DROP INDEX "EmployerProfile_userId_shopName_key";

-- DropIndex
DROP INDEX "Job_role_idx";

-- DropIndex
DROP INDEX "Job_status_idx";

-- DropIndex
DROP INDEX "Message_applicationId_createdAt_idx";

-- DropIndex
DROP INDEX "Report_targetType_targetId_idx";

-- DropIndex
DROP INDEX "TalentProfile_userId_key";

-- AlterTable
ALTER TABLE "Application" DROP COLUMN "applicantUserId",
DROP COLUMN "profileSnapshot",
DROP COLUMN "talentProfileId",
DROP COLUMN "updatedAt",
ADD COLUMN     "applicantId" TEXT NOT NULL,
DROP COLUMN "status",
ADD COLUMN     "status" TEXT;

-- AlterTable
ALTER TABLE "AuditLog" DROP COLUMN "actorUserId",
DROP COLUMN "data",
DROP COLUMN "targetId",
DROP COLUMN "targetType",
ADD COLUMN     "actorId" TEXT,
ADD COLUMN     "entity" TEXT,
ADD COLUMN     "meta" JSONB;

-- AlterTable
ALTER TABLE "Boost" DROP COLUMN "status",
DROP COLUMN "type",
ADD COLUMN     "kind" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "EmployerProfile" DROP COLUMN "about",
DROP COLUMN "updatedAt",
ADD COLUMN     "description" TEXT,
ADD COLUMN     "instagram" TEXT,
ADD COLUMN     "photosJson" JSONB,
ADD COLUMN     "website" TEXT;

-- AlterTable
ALTER TABLE "Job" DROP COLUMN "apprenticeFriendly",
DROP COLUMN "experience",
DROP COLUMN "imagesCount",
DROP COLUMN "licenses",
DROP COLUMN "perks",
DROP COLUMN "shiftDays",
DROP COLUMN "status",
DROP COLUMN "updatedAt",
ADD COLUMN     "businessName" TEXT NOT NULL,
ADD COLUMN     "ownerId" TEXT NOT NULL,
ADD COLUMN     "shiftDaysJson" JSONB,
ALTER COLUMN "employerProfileId" DROP NOT NULL,
ALTER COLUMN "payMin" SET DATA TYPE INTEGER,
ALTER COLUMN "payMax" SET DATA TYPE INTEGER;

-- AlterTable
ALTER TABLE "Location" ADD COLUMN     "county" TEXT,
ALTER COLUMN "country" DROP DEFAULT,
ALTER COLUMN "lat" SET NOT NULL,
ALTER COLUMN "lng" SET NOT NULL;

-- AlterTable
ALTER TABLE "Message" DROP COLUMN "applicationId",
DROP COLUMN "readAt",
DROP COLUMN "relayMessageId",
DROP COLUMN "senderUserId",
DROP COLUMN "via",
ADD COLUMN     "jobId" TEXT,
ADD COLUMN     "recipientId" TEXT NOT NULL,
ADD COLUMN     "senderId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Report" DROP COLUMN "reporterUserId",
DROP COLUMN "resolvedAt",
DROP COLUMN "status",
DROP COLUMN "targetId",
DROP COLUMN "targetType",
ADD COLUMN     "details" TEXT,
ADD COLUMN     "jobId" TEXT,
ADD COLUMN     "reporterId" TEXT,
ADD COLUMN     "resolved" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "TalentProfile" DROP COLUMN "availabilityDays",
DROP COLUMN "igHandle",
DROP COLUMN "licenses",
DROP COLUMN "portfolioCount",
DROP COLUMN "preferredComp",
DROP COLUMN "travelRadiusMiles",
DROP COLUMN "updatedAt",
DROP COLUMN "zipCode",
ADD COLUMN     "bio" TEXT,
ADD COLUMN     "instagram" TEXT,
ADD COLUMN     "locationId" TEXT,
ADD COLUMN     "portfolioJson" JSONB,
ADD COLUMN     "willingRadiusMiles" INTEGER;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "roles",
DROP COLUMN "updatedAt",
ADD COLUMN     "passwordHash" TEXT,
ADD COLUMN     "role" "UserRole" NOT NULL DEFAULT 'talent',
ADD COLUMN     "username" TEXT,
ALTER COLUMN "email" DROP NOT NULL;

-- DropTable
DROP TABLE "Account";

-- DropTable
DROP TABLE "Session";

-- DropTable
DROP TABLE "VerificationToken";

-- DropEnum
DROP TYPE "AppStatus";

-- DropEnum
DROP TYPE "ExperienceLevel";

-- DropEnum
DROP TYPE "LicenseType";

-- DropEnum
DROP TYPE "MessageVia";

-- CreateTable
CREATE TABLE "Inquiry" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "senderId" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "name" VARCHAR(25) NOT NULL,
    "phone" VARCHAR(10) NOT NULL,
    "note" TEXT,

    CONSTRAINT "Inquiry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Inquiry_ownerId_idx" ON "Inquiry"("ownerId");

-- CreateIndex
CREATE INDEX "Inquiry_jobId_idx" ON "Inquiry"("jobId");

-- CreateIndex
CREATE INDEX "Inquiry_senderId_idx" ON "Inquiry"("senderId");

-- CreateIndex
CREATE UNIQUE INDEX "Inquiry_senderId_jobId_key" ON "Inquiry"("senderId", "jobId");

-- CreateIndex
CREATE INDEX "Application_jobId_idx" ON "Application"("jobId");

-- CreateIndex
CREATE INDEX "Application_applicantId_idx" ON "Application"("applicantId");

-- CreateIndex
CREATE INDEX "Boost_jobId_startsAt_endsAt_idx" ON "Boost"("jobId", "startsAt", "endsAt");

-- CreateIndex
CREATE INDEX "EmployerProfile_userId_idx" ON "EmployerProfile"("userId");

-- CreateIndex
CREATE INDEX "EmployerProfile_locationId_idx" ON "EmployerProfile"("locationId");

-- CreateIndex
CREATE INDEX "Favorite_userId_idx" ON "Favorite"("userId");

-- CreateIndex
CREATE INDEX "Favorite_jobId_idx" ON "Favorite"("jobId");

-- CreateIndex
CREATE INDEX "Job_role_compModel_schedule_payVisible_idx" ON "Job"("role", "compModel", "schedule", "payVisible");

-- CreateIndex
CREATE INDEX "Job_createdAt_idx" ON "Job"("createdAt");

-- CreateIndex
CREATE INDEX "Job_locationId_idx" ON "Job"("locationId");

-- CreateIndex
CREATE INDEX "Location_city_state_idx" ON "Location"("city", "state");

-- CreateIndex
CREATE INDEX "Location_lat_lng_idx" ON "Location"("lat", "lng");

-- CreateIndex
CREATE INDEX "Message_jobId_idx" ON "Message"("jobId");

-- CreateIndex
CREATE INDEX "Message_senderId_idx" ON "Message"("senderId");

-- CreateIndex
CREATE INDEX "Message_recipientId_idx" ON "Message"("recipientId");

-- CreateIndex
CREATE INDEX "TalentProfile_userId_idx" ON "TalentProfile"("userId");

-- CreateIndex
CREATE INDEX "TalentProfile_locationId_idx" ON "TalentProfile"("locationId");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- AddForeignKey
ALTER TABLE "TalentProfile" ADD CONSTRAINT "TalentProfile_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Job" ADD CONSTRAINT "Job_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Job" ADD CONSTRAINT "Job_employerProfileId_fkey" FOREIGN KEY ("employerProfileId") REFERENCES "EmployerProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_applicantId_fkey" FOREIGN KEY ("applicantId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inquiry" ADD CONSTRAINT "Inquiry_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inquiry" ADD CONSTRAINT "Inquiry_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inquiry" ADD CONSTRAINT "Inquiry_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
