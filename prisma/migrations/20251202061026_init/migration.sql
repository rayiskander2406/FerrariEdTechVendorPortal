/*
  Warnings:

  - You are about to drop the `AcademicSession` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `AuditLog` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Class` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `CommunicationMessage` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ContactPreference` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ContactPreferenceCategory` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Course` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Demographics` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `District` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Enrollment` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ExternalServiceHealth` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `IntegrationConfig` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `LtiDeployment` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `LtiGrade` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `LtiLaunch` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `LtiLineItem` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `LtiPlatform` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `LtiResourceLink` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `MessageBatch` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `MessageBatchTarget` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `MessageTemplate` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `PodsApplication` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `SandboxCredentials` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `SchemaMetadata` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `School` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `SsoLaunchContext` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `SsoSession` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `SsoUserMapping` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `SyncError` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `SyncJob` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `User` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `UserHistory` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `UserRelationship` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `UserSchoolHistory` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Vendor` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `VendorDataGrant` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `VendorEntityPermission` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `VendorSchoolGrant` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "AcademicSession" DROP CONSTRAINT "AcademicSession_districtId_fkey";

-- DropForeignKey
ALTER TABLE "AcademicSession" DROP CONSTRAINT "AcademicSession_parentId_fkey";

-- DropForeignKey
ALTER TABLE "Class" DROP CONSTRAINT "Class_academicSessionId_fkey";

-- DropForeignKey
ALTER TABLE "Class" DROP CONSTRAINT "Class_courseId_fkey";

-- DropForeignKey
ALTER TABLE "Class" DROP CONSTRAINT "Class_schoolId_fkey";

-- DropForeignKey
ALTER TABLE "CommunicationMessage" DROP CONSTRAINT "CommunicationMessage_batchId_fkey";

-- DropForeignKey
ALTER TABLE "CommunicationMessage" DROP CONSTRAINT "CommunicationMessage_userId_fkey";

-- DropForeignKey
ALTER TABLE "ContactPreference" DROP CONSTRAINT "ContactPreference_studentId_fkey";

-- DropForeignKey
ALTER TABLE "ContactPreference" DROP CONSTRAINT "ContactPreference_userId_fkey";

-- DropForeignKey
ALTER TABLE "ContactPreferenceCategory" DROP CONSTRAINT "ContactPreferenceCategory_contactPreferenceId_fkey";

-- DropForeignKey
ALTER TABLE "Course" DROP CONSTRAINT "Course_districtId_fkey";

-- DropForeignKey
ALTER TABLE "Demographics" DROP CONSTRAINT "Demographics_userId_fkey";

-- DropForeignKey
ALTER TABLE "Enrollment" DROP CONSTRAINT "Enrollment_classId_fkey";

-- DropForeignKey
ALTER TABLE "Enrollment" DROP CONSTRAINT "Enrollment_userId_fkey";

-- DropForeignKey
ALTER TABLE "IntegrationConfig" DROP CONSTRAINT "IntegrationConfig_vendorId_fkey";

-- DropForeignKey
ALTER TABLE "LtiDeployment" DROP CONSTRAINT "LtiDeployment_platformId_fkey";

-- DropForeignKey
ALTER TABLE "LtiDeployment" DROP CONSTRAINT "LtiDeployment_vendorId_fkey";

-- DropForeignKey
ALTER TABLE "LtiGrade" DROP CONSTRAINT "LtiGrade_lineItemId_fkey";

-- DropForeignKey
ALTER TABLE "LtiGrade" DROP CONSTRAINT "LtiGrade_userId_fkey";

-- DropForeignKey
ALTER TABLE "LtiLaunch" DROP CONSTRAINT "LtiLaunch_deploymentId_fkey";

-- DropForeignKey
ALTER TABLE "LtiLaunch" DROP CONSTRAINT "LtiLaunch_userId_fkey";

-- DropForeignKey
ALTER TABLE "LtiLineItem" DROP CONSTRAINT "LtiLineItem_classId_fkey";

-- DropForeignKey
ALTER TABLE "LtiLineItem" DROP CONSTRAINT "LtiLineItem_deploymentId_fkey";

-- DropForeignKey
ALTER TABLE "LtiPlatform" DROP CONSTRAINT "LtiPlatform_districtId_fkey";

-- DropForeignKey
ALTER TABLE "LtiResourceLink" DROP CONSTRAINT "LtiResourceLink_classId_fkey";

-- DropForeignKey
ALTER TABLE "LtiResourceLink" DROP CONSTRAINT "LtiResourceLink_deploymentId_fkey";

-- DropForeignKey
ALTER TABLE "MessageBatch" DROP CONSTRAINT "MessageBatch_templateId_fkey";

-- DropForeignKey
ALTER TABLE "MessageBatch" DROP CONSTRAINT "MessageBatch_vendorId_fkey";

-- DropForeignKey
ALTER TABLE "MessageBatchTarget" DROP CONSTRAINT "MessageBatchTarget_batchId_fkey";

-- DropForeignKey
ALTER TABLE "MessageTemplate" DROP CONSTRAINT "MessageTemplate_vendorId_fkey";

-- DropForeignKey
ALTER TABLE "School" DROP CONSTRAINT "School_districtId_fkey";

-- DropForeignKey
ALTER TABLE "SsoSession" DROP CONSTRAINT "SsoSession_launchContextId_fkey";

-- DropForeignKey
ALTER TABLE "SsoSession" DROP CONSTRAINT "SsoSession_userId_fkey";

-- DropForeignKey
ALTER TABLE "SsoSession" DROP CONSTRAINT "SsoSession_vendorId_fkey";

-- DropForeignKey
ALTER TABLE "SsoUserMapping" DROP CONSTRAINT "SsoUserMapping_userId_fkey";

-- DropForeignKey
ALTER TABLE "SyncError" DROP CONSTRAINT "SyncError_syncJobId_fkey";

-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_primarySchoolId_fkey";

-- DropForeignKey
ALTER TABLE "UserRelationship" DROP CONSTRAINT "UserRelationship_childUserId_fkey";

-- DropForeignKey
ALTER TABLE "UserRelationship" DROP CONSTRAINT "UserRelationship_parentUserId_fkey";

-- DropForeignKey
ALTER TABLE "VendorDataGrant" DROP CONSTRAINT "VendorDataGrant_districtId_fkey";

-- DropForeignKey
ALTER TABLE "VendorDataGrant" DROP CONSTRAINT "VendorDataGrant_vendorId_fkey";

-- DropForeignKey
ALTER TABLE "VendorEntityPermission" DROP CONSTRAINT "VendorEntityPermission_vendorGrantId_fkey";

-- DropForeignKey
ALTER TABLE "VendorSchoolGrant" DROP CONSTRAINT "VendorSchoolGrant_schoolId_fkey";

-- DropForeignKey
ALTER TABLE "VendorSchoolGrant" DROP CONSTRAINT "VendorSchoolGrant_vendorGrantId_fkey";

-- DropTable
DROP TABLE "AcademicSession";

-- DropTable
DROP TABLE "AuditLog";

-- DropTable
DROP TABLE "Class";

-- DropTable
DROP TABLE "CommunicationMessage";

-- DropTable
DROP TABLE "ContactPreference";

-- DropTable
DROP TABLE "ContactPreferenceCategory";

-- DropTable
DROP TABLE "Course";

-- DropTable
DROP TABLE "Demographics";

-- DropTable
DROP TABLE "District";

-- DropTable
DROP TABLE "Enrollment";

-- DropTable
DROP TABLE "ExternalServiceHealth";

-- DropTable
DROP TABLE "IntegrationConfig";

-- DropTable
DROP TABLE "LtiDeployment";

-- DropTable
DROP TABLE "LtiGrade";

-- DropTable
DROP TABLE "LtiLaunch";

-- DropTable
DROP TABLE "LtiLineItem";

-- DropTable
DROP TABLE "LtiPlatform";

-- DropTable
DROP TABLE "LtiResourceLink";

-- DropTable
DROP TABLE "MessageBatch";

-- DropTable
DROP TABLE "MessageBatchTarget";

-- DropTable
DROP TABLE "MessageTemplate";

-- DropTable
DROP TABLE "PodsApplication";

-- DropTable
DROP TABLE "SandboxCredentials";

-- DropTable
DROP TABLE "SchemaMetadata";

-- DropTable
DROP TABLE "School";

-- DropTable
DROP TABLE "SsoLaunchContext";

-- DropTable
DROP TABLE "SsoSession";

-- DropTable
DROP TABLE "SsoUserMapping";

-- DropTable
DROP TABLE "SyncError";

-- DropTable
DROP TABLE "SyncJob";

-- DropTable
DROP TABLE "User";

-- DropTable
DROP TABLE "UserHistory";

-- DropTable
DROP TABLE "UserRelationship";

-- DropTable
DROP TABLE "UserSchoolHistory";

-- DropTable
DROP TABLE "Vendor";

-- DropTable
DROP TABLE "VendorDataGrant";

-- DropTable
DROP TABLE "VendorEntityPermission";

-- DropTable
DROP TABLE "VendorSchoolGrant";

-- CreateTable
CREATE TABLE "TokenMapping" (
    "token" TEXT NOT NULL,
    "realIdentifier" TEXT NOT NULL,
    "identifierType" TEXT NOT NULL,
    "userRole" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT,
    "lastAccessedAt" TIMESTAMP(3),
    "accessCount" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "TokenMapping_pkey" PRIMARY KEY ("token")
);

-- CreateTable
CREATE TABLE "TokenAccessLog" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "accessType" TEXT NOT NULL,
    "requestorId" TEXT NOT NULL,
    "requestorType" TEXT NOT NULL,
    "requestorIp" TEXT NOT NULL,
    "reason" TEXT,
    "vendorId" TEXT,
    "resourceContext" TEXT,
    "success" BOOLEAN NOT NULL,
    "errorCode" TEXT,
    "errorMessage" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "durationMs" INTEGER,

    CONSTRAINT "TokenAccessLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VaultRateLimit" (
    "id" TEXT NOT NULL,
    "requestorId" TEXT NOT NULL,
    "windowStart" TIMESTAMP(3) NOT NULL,
    "windowEnd" TIMESTAMP(3) NOT NULL,
    "tokenizeCount" INTEGER NOT NULL DEFAULT 0,
    "detokenizeCount" INTEGER NOT NULL DEFAULT 0,
    "alertTriggered" BOOLEAN NOT NULL DEFAULT false,
    "alertTriggeredAt" TIMESTAMP(3),
    "alertType" TEXT,

    CONSTRAINT "VaultRateLimit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VaultRateLimitConfig" (
    "id" TEXT NOT NULL,
    "tokenizePerMinute" INTEGER NOT NULL DEFAULT 100,
    "detokenizePerMinute" INTEGER NOT NULL DEFAULT 10,
    "tokenizeAlertThreshold" INTEGER NOT NULL DEFAULT 500,
    "detokenizeAlertThreshold" INTEGER NOT NULL DEFAULT 50,
    "tokenizePerHour" INTEGER NOT NULL DEFAULT 1000,
    "detokenizePerHour" INTEGER NOT NULL DEFAULT 100,
    "tokenizePerDay" INTEGER NOT NULL DEFAULT 10000,
    "detokenizePerDay" INTEGER NOT NULL DEFAULT 1000,
    "bulkDetokenizeRequiresApproval" BOOLEAN NOT NULL DEFAULT true,
    "bulkDetokenizeApprovalThreshold" INTEGER NOT NULL DEFAULT 100,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VaultRateLimitConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DetokenizationApproval" (
    "id" TEXT NOT NULL,
    "requestorId" TEXT NOT NULL,
    "requestedCount" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "justification" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "rejectedBy" TEXT,
    "rejectedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "usedCount" INTEGER NOT NULL DEFAULT 0,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DetokenizationApproval_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SecurityAlert" (
    "id" TEXT NOT NULL,
    "alertType" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "requestorId" TEXT NOT NULL,
    "requestorType" TEXT NOT NULL,
    "requestorIp" TEXT,
    "description" TEXT NOT NULL,
    "metadata" TEXT,
    "triggerEvent" TEXT,
    "triggerCount" INTEGER,
    "triggerThreshold" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'open',
    "acknowledgedBy" TEXT,
    "acknowledgedAt" TIMESTAMP(3),
    "resolvedBy" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "resolution" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SecurityAlert_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TokenMapping_realIdentifier_key" ON "TokenMapping"("realIdentifier");

-- CreateIndex
CREATE INDEX "TokenMapping_realIdentifier_idx" ON "TokenMapping"("realIdentifier");

-- CreateIndex
CREATE INDEX "TokenMapping_identifierType_idx" ON "TokenMapping"("identifierType");

-- CreateIndex
CREATE INDEX "TokenMapping_userRole_idx" ON "TokenMapping"("userRole");

-- CreateIndex
CREATE INDEX "TokenAccessLog_token_idx" ON "TokenAccessLog"("token");

-- CreateIndex
CREATE INDEX "TokenAccessLog_requestorId_idx" ON "TokenAccessLog"("requestorId");

-- CreateIndex
CREATE INDEX "TokenAccessLog_timestamp_idx" ON "TokenAccessLog"("timestamp");

-- CreateIndex
CREATE INDEX "TokenAccessLog_accessType_idx" ON "TokenAccessLog"("accessType");

-- CreateIndex
CREATE INDEX "TokenAccessLog_success_idx" ON "TokenAccessLog"("success");

-- CreateIndex
CREATE INDEX "TokenAccessLog_vendorId_idx" ON "TokenAccessLog"("vendorId");

-- CreateIndex
CREATE INDEX "VaultRateLimit_requestorId_windowStart_idx" ON "VaultRateLimit"("requestorId", "windowStart");

-- CreateIndex
CREATE INDEX "VaultRateLimit_alertTriggered_idx" ON "VaultRateLimit"("alertTriggered");

-- CreateIndex
CREATE INDEX "DetokenizationApproval_requestorId_idx" ON "DetokenizationApproval"("requestorId");

-- CreateIndex
CREATE INDEX "DetokenizationApproval_status_idx" ON "DetokenizationApproval"("status");

-- CreateIndex
CREATE INDEX "DetokenizationApproval_expiresAt_idx" ON "DetokenizationApproval"("expiresAt");

-- CreateIndex
CREATE INDEX "SecurityAlert_alertType_idx" ON "SecurityAlert"("alertType");

-- CreateIndex
CREATE INDEX "SecurityAlert_severity_idx" ON "SecurityAlert"("severity");

-- CreateIndex
CREATE INDEX "SecurityAlert_status_idx" ON "SecurityAlert"("status");

-- CreateIndex
CREATE INDEX "SecurityAlert_requestorId_idx" ON "SecurityAlert"("requestorId");

-- CreateIndex
CREATE INDEX "SecurityAlert_createdAt_idx" ON "SecurityAlert"("createdAt");
