-- CreateTable
CREATE TABLE "District" (
    "id" TEXT NOT NULL,
    "sourcedId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "shortCode" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'district',
    "ncesId" TEXT,
    "stateId" TEXT,
    "timezone" TEXT NOT NULL DEFAULT 'America/Los_Angeles',
    "locale" TEXT NOT NULL DEFAULT 'en-US',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "externalId" TEXT,
    "externalSource" TEXT,
    "lastSyncedAt" TIMESTAMP(3),
    "syncChecksum" TEXT,
    "syncStatus" TEXT NOT NULL DEFAULT 'synced',
    "syncError" TEXT,
    "syncVersion" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "District_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "School" (
    "id" TEXT NOT NULL,
    "sourcedId" TEXT NOT NULL,
    "districtId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "shortCode" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "ncesId" TEXT,
    "stateId" TEXT,
    "gradeMin" INTEGER NOT NULL,
    "gradeMax" INTEGER NOT NULL,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT DEFAULT 'CA',
    "zipCode" TEXT,
    "phone" TEXT,
    "website" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "externalId" TEXT,
    "externalSource" TEXT,
    "lastSyncedAt" TIMESTAMP(3),
    "syncChecksum" TEXT,
    "syncStatus" TEXT NOT NULL DEFAULT 'synced',
    "syncError" TEXT,
    "syncVersion" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "School_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AcademicSession" (
    "id" TEXT NOT NULL,
    "sourcedId" TEXT NOT NULL,
    "districtId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "parentId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "externalId" TEXT,
    "externalSource" TEXT,
    "lastSyncedAt" TIMESTAMP(3),
    "syncChecksum" TEXT,
    "syncStatus" TEXT NOT NULL DEFAULT 'synced',
    "syncError" TEXT,
    "syncVersion" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "AcademicSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Course" (
    "id" TEXT NOT NULL,
    "sourcedId" TEXT NOT NULL,
    "districtId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "courseCode" TEXT NOT NULL,
    "subject" TEXT,
    "gradeLevel" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "externalId" TEXT,
    "externalSource" TEXT,
    "lastSyncedAt" TIMESTAMP(3),
    "syncChecksum" TEXT,
    "syncStatus" TEXT NOT NULL DEFAULT 'synced',
    "syncError" TEXT,
    "syncVersion" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "Course_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Class" (
    "id" TEXT NOT NULL,
    "sourcedId" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "courseId" TEXT,
    "academicSessionId" TEXT,
    "title" TEXT NOT NULL,
    "classCode" TEXT,
    "period" TEXT,
    "location" TEXT,
    "gradeLevel" TEXT,
    "subject" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "externalId" TEXT,
    "externalSource" TEXT,
    "lastSyncedAt" TIMESTAMP(3),
    "syncChecksum" TEXT,
    "syncStatus" TEXT NOT NULL DEFAULT 'synced',
    "syncError" TEXT,
    "syncVersion" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "Class_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Enrollment" (
    "id" TEXT NOT NULL,
    "sourcedId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT true,
    "effectiveStart" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "effectiveEnd" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdBy" TEXT,
    "updatedBy" TEXT,
    "externalId" TEXT,
    "externalSource" TEXT,
    "lastSyncedAt" TIMESTAMP(3),
    "syncChecksum" TEXT,
    "syncStatus" TEXT NOT NULL DEFAULT 'synced',
    "syncError" TEXT,
    "syncVersion" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "Enrollment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "sourcedId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "givenName" TEXT NOT NULL,
    "familyName" TEXT NOT NULL,
    "middleName" TEXT,
    "role" TEXT NOT NULL,
    "primarySchoolId" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "gradeLevel" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "deletedBy" TEXT,
    "deletionReason" TEXT,
    "retainUntil" TIMESTAMP(3),
    "externalId" TEXT,
    "externalSource" TEXT,
    "lastSyncedAt" TIMESTAMP(3),
    "syncChecksum" TEXT,
    "syncStatus" TEXT NOT NULL DEFAULT 'synced',
    "syncError" TEXT,
    "syncVersion" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserRelationship" (
    "id" TEXT NOT NULL,
    "parentUserId" TEXT NOT NULL,
    "childUserId" TEXT NOT NULL,
    "relationshipType" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "canViewGrades" BOOLEAN NOT NULL DEFAULT true,
    "canViewAttendance" BOOLEAN NOT NULL DEFAULT true,
    "canReceiveAlerts" BOOLEAN NOT NULL DEFAULT true,
    "canPickup" BOOLEAN NOT NULL DEFAULT false,
    "hasCustody" BOOLEAN NOT NULL DEFAULT true,
    "legalRestrictions" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "verifiedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "UserRelationship_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserHistory" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "givenName" TEXT NOT NULL,
    "familyName" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "primarySchoolId" TEXT,
    "gradeLevel" TEXT,
    "status" TEXT NOT NULL,
    "validFrom" TIMESTAMP(3) NOT NULL,
    "validTo" TIMESTAMP(3),
    "isCurrent" BOOLEAN NOT NULL DEFAULT true,
    "changeReason" TEXT,
    "changedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserSchoolHistory" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "changeType" TEXT NOT NULL,
    "changeReason" TEXT,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "recordedBy" TEXT,

    CONSTRAINT "UserSchoolHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Demographics" (
    "id" TEXT NOT NULL,
    "sourcedId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "birthDate" TIMESTAMP(3),
    "sex" TEXT,
    "americanIndianOrAlaskaNative" BOOLEAN NOT NULL DEFAULT false,
    "asian" BOOLEAN NOT NULL DEFAULT false,
    "blackOrAfricanAmerican" BOOLEAN NOT NULL DEFAULT false,
    "hispanicOrLatinoEthnicity" BOOLEAN NOT NULL DEFAULT false,
    "nativeHawaiianOrOtherPacificIslander" BOOLEAN NOT NULL DEFAULT false,
    "white" BOOLEAN NOT NULL DEFAULT false,
    "demographicRaceTwoOrMoreRaces" BOOLEAN NOT NULL DEFAULT false,
    "freeLunchStatus" TEXT,
    "englishLanguageLearner" BOOLEAN NOT NULL DEFAULT false,
    "specialEducation" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "externalId" TEXT,
    "externalSource" TEXT,
    "lastSyncedAt" TIMESTAMP(3),
    "syncChecksum" TEXT,
    "syncStatus" TEXT NOT NULL DEFAULT 'synced',
    "syncError" TEXT,
    "syncVersion" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "Demographics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vendor" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "contactEmail" TEXT NOT NULL,
    "contactName" TEXT NOT NULL,
    "website" TEXT,
    "description" TEXT,
    "defaultAccessTier" TEXT NOT NULL DEFAULT 'PRIVACY_SAFE',
    "podsStatus" TEXT NOT NULL DEFAULT 'NOT_STARTED',
    "podsApplicationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Vendor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VendorDataGrant" (
    "id" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "districtId" TEXT NOT NULL,
    "accessTier" TEXT NOT NULL DEFAULT 'PRIVACY_SAFE',
    "accessTierApprovedBy" TEXT,
    "accessTierApprovedAt" TIMESTAMP(3),
    "accessTierJustification" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending_review',
    "grantedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "grantedBy" TEXT,
    "revokedBy" TEXT,
    "revokedAt" TIMESTAMP(3),
    "revokeReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "VendorDataGrant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VendorEntityPermission" (
    "id" TEXT NOT NULL,
    "vendorGrantId" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "canRead" BOOLEAN NOT NULL DEFAULT true,
    "canList" BOOLEAN NOT NULL DEFAULT true,
    "excludedFields" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VendorEntityPermission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VendorSchoolGrant" (
    "id" TEXT NOT NULL,
    "vendorGrantId" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "VendorSchoolGrant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SsoSession" (
    "id" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "idToken" TEXT,
    "ssoProvider" TEXT NOT NULL,
    "providerUserId" TEXT,
    "launchContextId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "lastActivityAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "SsoSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SsoLaunchContext" (
    "id" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "contextType" TEXT NOT NULL,
    "contextId" TEXT,
    "returnUrl" TEXT,
    "customParams" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SsoLaunchContext_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SsoUserMapping" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "ssoProvider" TEXT NOT NULL,
    "providerUserId" TEXT NOT NULL,
    "providerEmail" TEXT,
    "providerName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastLoginAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "SsoUserMapping_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LtiPlatform" (
    "id" TEXT NOT NULL,
    "districtId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "issuer" TEXT NOT NULL,
    "platformId" TEXT,
    "authorizationUrl" TEXT NOT NULL,
    "tokenUrl" TEXT NOT NULL,
    "jwksUrl" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "publicKey" TEXT NOT NULL,
    "privateKey" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "LtiPlatform_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LtiDeployment" (
    "id" TEXT NOT NULL,
    "platformId" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "deploymentId" TEXT NOT NULL,
    "toolName" TEXT NOT NULL,
    "toolDescription" TEXT,
    "launchUrl" TEXT NOT NULL,
    "deepLinkUrl" TEXT,
    "iconUrl" TEXT,
    "supportsDeepLinking" BOOLEAN NOT NULL DEFAULT true,
    "supportsGradeSync" BOOLEAN NOT NULL DEFAULT false,
    "supportsNrps" BOOLEAN NOT NULL DEFAULT true,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "LtiDeployment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LtiResourceLink" (
    "id" TEXT NOT NULL,
    "deploymentId" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "resourceLinkId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "customParams" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "LtiResourceLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LtiLineItem" (
    "id" TEXT NOT NULL,
    "deploymentId" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "lineItemId" TEXT,
    "resourceLinkId" TEXT,
    "label" TEXT NOT NULL,
    "scoreMaximum" DOUBLE PRECISION NOT NULL,
    "tag" TEXT,
    "startDateTime" TIMESTAMP(3),
    "endDateTime" TIMESTAMP(3),
    "syncStatus" TEXT NOT NULL DEFAULT 'pending',
    "lastSyncAt" TIMESTAMP(3),
    "syncError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "LtiLineItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LtiGrade" (
    "id" TEXT NOT NULL,
    "lineItemId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "scoreGiven" DOUBLE PRECISION,
    "scoreMaximum" DOUBLE PRECISION NOT NULL,
    "activityProgress" TEXT NOT NULL DEFAULT 'Completed',
    "gradingProgress" TEXT NOT NULL DEFAULT 'FullyGraded',
    "comment" TEXT,
    "syncStatus" TEXT NOT NULL DEFAULT 'pending',
    "lastSyncAt" TIMESTAMP(3),
    "syncError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "retainUntil" TIMESTAMP(3),

    CONSTRAINT "LtiGrade_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LtiLaunch" (
    "id" TEXT NOT NULL,
    "deploymentId" TEXT NOT NULL,
    "userId" TEXT,
    "messageType" TEXT NOT NULL,
    "targetLinkUri" TEXT NOT NULL,
    "resourceLinkId" TEXT,
    "contextId" TEXT,
    "roles" TEXT,
    "customClaims" TEXT,
    "status" TEXT NOT NULL DEFAULT 'success',
    "errorMessage" TEXT,
    "launchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LtiLaunch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MessageTemplate" (
    "id" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "districtId" TEXT,
    "name" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "subject" TEXT,
    "bodyTemplate" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "requiresApproval" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "MessageTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContactPreference" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "emailEnabled" BOOLEAN NOT NULL DEFAULT true,
    "smsEnabled" BOOLEAN NOT NULL DEFAULT false,
    "pushEnabled" BOOLEAN NOT NULL DEFAULT false,
    "inAppEnabled" BOOLEAN NOT NULL DEFAULT true,
    "emailAddress" TEXT,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "phoneNumber" TEXT,
    "phoneVerified" BOOLEAN NOT NULL DEFAULT false,
    "quietHoursStart" TEXT,
    "quietHoursEnd" TEXT,
    "timezone" TEXT NOT NULL DEFAULT 'America/Los_Angeles',
    "preferredLanguage" TEXT NOT NULL DEFAULT 'en',
    "consentGivenAt" TIMESTAMP(3),
    "consentMethod" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "ContactPreference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContactPreferenceCategory" (
    "id" TEXT NOT NULL,
    "contactPreferenceId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "ContactPreferenceCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MessageBatch" (
    "id" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "templateId" TEXT,
    "channel" TEXT NOT NULL,
    "recipientType" TEXT NOT NULL,
    "subject" TEXT,
    "body" TEXT NOT NULL,
    "scheduledAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'draft',
    "totalRecipients" INTEGER NOT NULL DEFAULT 0,
    "sentCount" INTEGER NOT NULL DEFAULT 0,
    "deliveredCount" INTEGER NOT NULL DEFAULT 0,
    "failedCount" INTEGER NOT NULL DEFAULT 0,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "MessageBatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MessageBatchTarget" (
    "id" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,

    CONSTRAINT "MessageBatchTarget_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommunicationMessage" (
    "id" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "batchId" TEXT,
    "userId" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'queued',
    "recipientToken" TEXT NOT NULL,
    "recipientType" TEXT NOT NULL,
    "subject" TEXT,
    "body" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "failureReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),
    "retainUntil" TIMESTAMP(3),

    CONSTRAINT "CommunicationMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PodsApplication" (
    "id" TEXT NOT NULL,
    "vendorName" TEXT NOT NULL,
    "applicationName" TEXT NOT NULL,
    "contactEmail" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending_review',
    "accessTier" TEXT NOT NULL DEFAULT 'PRIVACY_SAFE',
    "submittedAt" TIMESTAMP(3),
    "reviewedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "PodsApplication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IntegrationConfig" (
    "id" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'not_configured',
    "ssoProvider" TEXT,
    "ssoClientId" TEXT,
    "ssoClientSecret" TEXT,
    "ssoRedirectUri" TEXT,
    "oneRosterVersion" TEXT,
    "oneRosterBaseUrl" TEXT,
    "ltiVersion" TEXT,
    "ltiClientId" TEXT,
    "ltiDeploymentId" TEXT,
    "ltiJwksUrl" TEXT,
    "ltiAuthUrl" TEXT,
    "ltiTokenUrl" TEXT,
    "ltiLaunchUrl" TEXT,
    "configuredAt" TIMESTAMP(3),
    "lastTestedAt" TIMESTAMP(3),
    "testResult" TEXT,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "IntegrationConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SandboxCredentials" (
    "id" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "apiKey" TEXT NOT NULL,
    "apiSecret" TEXT NOT NULL,
    "baseUrl" TEXT NOT NULL,
    "environment" TEXT NOT NULL DEFAULT 'sandbox',
    "status" TEXT NOT NULL DEFAULT 'active',
    "rateLimitPerMinute" INTEGER NOT NULL DEFAULT 60,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "lastUsedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "SandboxCredentials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "vendorId" TEXT,
    "action" TEXT NOT NULL,
    "resourceType" TEXT NOT NULL,
    "resourceId" TEXT,
    "details" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "retainUntil" TIMESTAMP(3),

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SyncJob" (
    "id" TEXT NOT NULL,
    "districtId" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "entityTypes" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "totalRecords" INTEGER NOT NULL DEFAULT 0,
    "processedRecords" INTEGER NOT NULL DEFAULT 0,
    "createdRecords" INTEGER NOT NULL DEFAULT 0,
    "updatedRecords" INTEGER NOT NULL DEFAULT 0,
    "errorRecords" INTEGER NOT NULL DEFAULT 0,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SyncJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SyncError" (
    "id" TEXT NOT NULL,
    "syncJobId" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "errorType" TEXT NOT NULL,
    "errorMessage" TEXT NOT NULL,
    "rawData" TEXT,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "resolvedAt" TIMESTAMP(3),
    "resolvedBy" TEXT,
    "resolution" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SyncError_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExternalServiceHealth" (
    "id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'healthy',
    "lastHealthCheck" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "consecutiveFailures" INTEGER NOT NULL DEFAULT 0,
    "consecutiveSuccesses" INTEGER NOT NULL DEFAULT 0,
    "lastFailure" TIMESTAMP(3),
    "lastFailureReason" TEXT,
    "lastSuccess" TIMESTAMP(3),
    "circuitState" TEXT NOT NULL DEFAULT 'closed',
    "circuitOpenedAt" TIMESTAMP(3),
    "circuitHalfOpenAt" TIMESTAMP(3),
    "failureThreshold" INTEGER NOT NULL DEFAULT 5,
    "successThreshold" INTEGER NOT NULL DEFAULT 3,
    "openDurationMs" INTEGER NOT NULL DEFAULT 60000,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExternalServiceHealth_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SchemaMetadata" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "version" TEXT NOT NULL,
    "oneRosterVersion" TEXT NOT NULL,
    "migratedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "features" TEXT NOT NULL,

    CONSTRAINT "SchemaMetadata_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "District_sourcedId_key" ON "District"("sourcedId");

-- CreateIndex
CREATE UNIQUE INDEX "District_shortCode_key" ON "District"("shortCode");

-- CreateIndex
CREATE UNIQUE INDEX "District_ncesId_key" ON "District"("ncesId");

-- CreateIndex
CREATE INDEX "District_shortCode_idx" ON "District"("shortCode");

-- CreateIndex
CREATE INDEX "District_ncesId_idx" ON "District"("ncesId");

-- CreateIndex
CREATE INDEX "District_deletedAt_idx" ON "District"("deletedAt");

-- CreateIndex
CREATE INDEX "District_externalSource_externalId_idx" ON "District"("externalSource", "externalId");

-- CreateIndex
CREATE INDEX "District_syncStatus_idx" ON "District"("syncStatus");

-- CreateIndex
CREATE UNIQUE INDEX "School_sourcedId_key" ON "School"("sourcedId");

-- CreateIndex
CREATE UNIQUE INDEX "School_ncesId_key" ON "School"("ncesId");

-- CreateIndex
CREATE INDEX "School_districtId_idx" ON "School"("districtId");

-- CreateIndex
CREATE INDEX "School_ncesId_idx" ON "School"("ncesId");

-- CreateIndex
CREATE INDEX "School_type_idx" ON "School"("type");

-- CreateIndex
CREATE INDEX "School_status_idx" ON "School"("status");

-- CreateIndex
CREATE INDEX "School_deletedAt_idx" ON "School"("deletedAt");

-- CreateIndex
CREATE INDEX "School_externalSource_externalId_idx" ON "School"("externalSource", "externalId");

-- CreateIndex
CREATE UNIQUE INDEX "School_districtId_shortCode_key" ON "School"("districtId", "shortCode");

-- CreateIndex
CREATE UNIQUE INDEX "AcademicSession_sourcedId_key" ON "AcademicSession"("sourcedId");

-- CreateIndex
CREATE INDEX "AcademicSession_districtId_idx" ON "AcademicSession"("districtId");

-- CreateIndex
CREATE INDEX "AcademicSession_type_idx" ON "AcademicSession"("type");

-- CreateIndex
CREATE INDEX "AcademicSession_parentId_idx" ON "AcademicSession"("parentId");

-- CreateIndex
CREATE INDEX "AcademicSession_deletedAt_idx" ON "AcademicSession"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Course_sourcedId_key" ON "Course"("sourcedId");

-- CreateIndex
CREATE INDEX "Course_districtId_idx" ON "Course"("districtId");

-- CreateIndex
CREATE INDEX "Course_subject_idx" ON "Course"("subject");

-- CreateIndex
CREATE INDEX "Course_deletedAt_idx" ON "Course"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Course_districtId_courseCode_key" ON "Course"("districtId", "courseCode");

-- CreateIndex
CREATE UNIQUE INDEX "Class_sourcedId_key" ON "Class"("sourcedId");

-- CreateIndex
CREATE INDEX "Class_schoolId_idx" ON "Class"("schoolId");

-- CreateIndex
CREATE INDEX "Class_courseId_idx" ON "Class"("courseId");

-- CreateIndex
CREATE INDEX "Class_academicSessionId_idx" ON "Class"("academicSessionId");

-- CreateIndex
CREATE INDEX "Class_subject_idx" ON "Class"("subject");

-- CreateIndex
CREATE INDEX "Class_deletedAt_idx" ON "Class"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Enrollment_sourcedId_key" ON "Enrollment"("sourcedId");

-- CreateIndex
CREATE INDEX "Enrollment_userId_idx" ON "Enrollment"("userId");

-- CreateIndex
CREATE INDEX "Enrollment_classId_idx" ON "Enrollment"("classId");

-- CreateIndex
CREATE INDEX "Enrollment_role_idx" ON "Enrollment"("role");

-- CreateIndex
CREATE INDEX "Enrollment_status_idx" ON "Enrollment"("status");

-- CreateIndex
CREATE INDEX "Enrollment_userId_status_idx" ON "Enrollment"("userId", "status");

-- CreateIndex
CREATE INDEX "Enrollment_classId_status_idx" ON "Enrollment"("classId", "status");

-- CreateIndex
CREATE INDEX "Enrollment_classId_role_idx" ON "Enrollment"("classId", "role");

-- CreateIndex
CREATE INDEX "Enrollment_effectiveStart_idx" ON "Enrollment"("effectiveStart");

-- CreateIndex
CREATE INDEX "Enrollment_effectiveEnd_idx" ON "Enrollment"("effectiveEnd");

-- CreateIndex
CREATE INDEX "Enrollment_deletedAt_idx" ON "Enrollment"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Enrollment_userId_classId_role_effectiveStart_key" ON "Enrollment"("userId", "classId", "role", "effectiveStart");

-- CreateIndex
CREATE UNIQUE INDEX "User_sourcedId_key" ON "User"("sourcedId");

-- CreateIndex
CREATE UNIQUE INDEX "User_token_key" ON "User"("token");

-- CreateIndex
CREATE INDEX "User_primarySchoolId_idx" ON "User"("primarySchoolId");

-- CreateIndex
CREATE INDEX "User_token_idx" ON "User"("token");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE INDEX "User_status_idx" ON "User"("status");

-- CreateIndex
CREATE INDEX "User_gradeLevel_idx" ON "User"("gradeLevel");

-- CreateIndex
CREATE INDEX "User_primarySchoolId_role_idx" ON "User"("primarySchoolId", "role");

-- CreateIndex
CREATE INDEX "User_primarySchoolId_role_status_idx" ON "User"("primarySchoolId", "role", "status");

-- CreateIndex
CREATE INDEX "User_deletedAt_idx" ON "User"("deletedAt");

-- CreateIndex
CREATE INDEX "User_externalSource_externalId_idx" ON "User"("externalSource", "externalId");

-- CreateIndex
CREATE INDEX "User_syncStatus_idx" ON "User"("syncStatus");

-- CreateIndex
CREATE INDEX "User_lastSyncedAt_idx" ON "User"("lastSyncedAt");

-- CreateIndex
CREATE INDEX "UserRelationship_childUserId_idx" ON "UserRelationship"("childUserId");

-- CreateIndex
CREATE INDEX "UserRelationship_deletedAt_idx" ON "UserRelationship"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "UserRelationship_parentUserId_childUserId_key" ON "UserRelationship"("parentUserId", "childUserId");

-- CreateIndex
CREATE INDEX "UserHistory_userId_isCurrent_idx" ON "UserHistory"("userId", "isCurrent");

-- CreateIndex
CREATE INDEX "UserHistory_userId_validFrom_idx" ON "UserHistory"("userId", "validFrom");

-- CreateIndex
CREATE INDEX "UserHistory_validFrom_validTo_idx" ON "UserHistory"("validFrom", "validTo");

-- CreateIndex
CREATE INDEX "UserSchoolHistory_userId_idx" ON "UserSchoolHistory"("userId");

-- CreateIndex
CREATE INDEX "UserSchoolHistory_schoolId_idx" ON "UserSchoolHistory"("schoolId");

-- CreateIndex
CREATE INDEX "UserSchoolHistory_startDate_idx" ON "UserSchoolHistory"("startDate");

-- CreateIndex
CREATE UNIQUE INDEX "Demographics_sourcedId_key" ON "Demographics"("sourcedId");

-- CreateIndex
CREATE UNIQUE INDEX "Demographics_userId_key" ON "Demographics"("userId");

-- CreateIndex
CREATE INDEX "Demographics_userId_idx" ON "Demographics"("userId");

-- CreateIndex
CREATE INDEX "Demographics_deletedAt_idx" ON "Demographics"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Vendor_contactEmail_key" ON "Vendor"("contactEmail");

-- CreateIndex
CREATE INDEX "Vendor_contactEmail_idx" ON "Vendor"("contactEmail");

-- CreateIndex
CREATE INDEX "Vendor_podsStatus_idx" ON "Vendor"("podsStatus");

-- CreateIndex
CREATE INDEX "Vendor_defaultAccessTier_idx" ON "Vendor"("defaultAccessTier");

-- CreateIndex
CREATE INDEX "Vendor_deletedAt_idx" ON "Vendor"("deletedAt");

-- CreateIndex
CREATE INDEX "VendorDataGrant_vendorId_idx" ON "VendorDataGrant"("vendorId");

-- CreateIndex
CREATE INDEX "VendorDataGrant_districtId_idx" ON "VendorDataGrant"("districtId");

-- CreateIndex
CREATE INDEX "VendorDataGrant_status_idx" ON "VendorDataGrant"("status");

-- CreateIndex
CREATE INDEX "VendorDataGrant_expiresAt_idx" ON "VendorDataGrant"("expiresAt");

-- CreateIndex
CREATE INDEX "VendorDataGrant_deletedAt_idx" ON "VendorDataGrant"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "VendorDataGrant_vendorId_districtId_key" ON "VendorDataGrant"("vendorId", "districtId");

-- CreateIndex
CREATE INDEX "VendorEntityPermission_entityType_idx" ON "VendorEntityPermission"("entityType");

-- CreateIndex
CREATE UNIQUE INDEX "VendorEntityPermission_vendorGrantId_entityType_key" ON "VendorEntityPermission"("vendorGrantId", "entityType");

-- CreateIndex
CREATE INDEX "VendorSchoolGrant_vendorGrantId_idx" ON "VendorSchoolGrant"("vendorGrantId");

-- CreateIndex
CREATE INDEX "VendorSchoolGrant_schoolId_idx" ON "VendorSchoolGrant"("schoolId");

-- CreateIndex
CREATE INDEX "VendorSchoolGrant_schoolId_vendorGrantId_idx" ON "VendorSchoolGrant"("schoolId", "vendorGrantId");

-- CreateIndex
CREATE INDEX "VendorSchoolGrant_deletedAt_idx" ON "VendorSchoolGrant"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "VendorSchoolGrant_vendorGrantId_schoolId_key" ON "VendorSchoolGrant"("vendorGrantId", "schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "SsoSession_sessionToken_key" ON "SsoSession"("sessionToken");

-- CreateIndex
CREATE INDEX "SsoSession_vendorId_idx" ON "SsoSession"("vendorId");

-- CreateIndex
CREATE INDEX "SsoSession_userId_idx" ON "SsoSession"("userId");

-- CreateIndex
CREATE INDEX "SsoSession_sessionToken_idx" ON "SsoSession"("sessionToken");

-- CreateIndex
CREATE INDEX "SsoSession_status_idx" ON "SsoSession"("status");

-- CreateIndex
CREATE INDEX "SsoSession_expiresAt_idx" ON "SsoSession"("expiresAt");

-- CreateIndex
CREATE INDEX "SsoSession_deletedAt_idx" ON "SsoSession"("deletedAt");

-- CreateIndex
CREATE INDEX "SsoLaunchContext_vendorId_idx" ON "SsoLaunchContext"("vendorId");

-- CreateIndex
CREATE INDEX "SsoLaunchContext_contextType_contextId_idx" ON "SsoLaunchContext"("contextType", "contextId");

-- CreateIndex
CREATE INDEX "SsoUserMapping_userId_idx" ON "SsoUserMapping"("userId");

-- CreateIndex
CREATE INDEX "SsoUserMapping_deletedAt_idx" ON "SsoUserMapping"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "SsoUserMapping_ssoProvider_providerUserId_key" ON "SsoUserMapping"("ssoProvider", "providerUserId");

-- CreateIndex
CREATE UNIQUE INDEX "SsoUserMapping_userId_ssoProvider_key" ON "SsoUserMapping"("userId", "ssoProvider");

-- CreateIndex
CREATE UNIQUE INDEX "LtiPlatform_issuer_key" ON "LtiPlatform"("issuer");

-- CreateIndex
CREATE INDEX "LtiPlatform_districtId_idx" ON "LtiPlatform"("districtId");

-- CreateIndex
CREATE INDEX "LtiPlatform_issuer_idx" ON "LtiPlatform"("issuer");

-- CreateIndex
CREATE INDEX "LtiPlatform_deletedAt_idx" ON "LtiPlatform"("deletedAt");

-- CreateIndex
CREATE INDEX "LtiDeployment_vendorId_idx" ON "LtiDeployment"("vendorId");

-- CreateIndex
CREATE INDEX "LtiDeployment_status_idx" ON "LtiDeployment"("status");

-- CreateIndex
CREATE INDEX "LtiDeployment_deletedAt_idx" ON "LtiDeployment"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "LtiDeployment_platformId_deploymentId_key" ON "LtiDeployment"("platformId", "deploymentId");

-- CreateIndex
CREATE INDEX "LtiResourceLink_classId_idx" ON "LtiResourceLink"("classId");

-- CreateIndex
CREATE INDEX "LtiResourceLink_deletedAt_idx" ON "LtiResourceLink"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "LtiResourceLink_deploymentId_resourceLinkId_key" ON "LtiResourceLink"("deploymentId", "resourceLinkId");

-- CreateIndex
CREATE INDEX "LtiLineItem_deploymentId_idx" ON "LtiLineItem"("deploymentId");

-- CreateIndex
CREATE INDEX "LtiLineItem_classId_idx" ON "LtiLineItem"("classId");

-- CreateIndex
CREATE INDEX "LtiLineItem_syncStatus_idx" ON "LtiLineItem"("syncStatus");

-- CreateIndex
CREATE INDEX "LtiLineItem_deletedAt_idx" ON "LtiLineItem"("deletedAt");

-- CreateIndex
CREATE INDEX "LtiGrade_userId_idx" ON "LtiGrade"("userId");

-- CreateIndex
CREATE INDEX "LtiGrade_syncStatus_idx" ON "LtiGrade"("syncStatus");

-- CreateIndex
CREATE INDEX "LtiGrade_deletedAt_idx" ON "LtiGrade"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "LtiGrade_lineItemId_userId_key" ON "LtiGrade"("lineItemId", "userId");

-- CreateIndex
CREATE INDEX "LtiLaunch_deploymentId_idx" ON "LtiLaunch"("deploymentId");

-- CreateIndex
CREATE INDEX "LtiLaunch_userId_idx" ON "LtiLaunch"("userId");

-- CreateIndex
CREATE INDEX "LtiLaunch_launchedAt_idx" ON "LtiLaunch"("launchedAt");

-- CreateIndex
CREATE INDEX "MessageTemplate_vendorId_idx" ON "MessageTemplate"("vendorId");

-- CreateIndex
CREATE INDEX "MessageTemplate_districtId_idx" ON "MessageTemplate"("districtId");

-- CreateIndex
CREATE INDEX "MessageTemplate_channel_idx" ON "MessageTemplate"("channel");

-- CreateIndex
CREATE INDEX "MessageTemplate_category_idx" ON "MessageTemplate"("category");

-- CreateIndex
CREATE INDEX "MessageTemplate_deletedAt_idx" ON "MessageTemplate"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "MessageTemplate_vendorId_name_key" ON "MessageTemplate"("vendorId", "name");

-- CreateIndex
CREATE INDEX "ContactPreference_userId_idx" ON "ContactPreference"("userId");

-- CreateIndex
CREATE INDEX "ContactPreference_studentId_idx" ON "ContactPreference"("studentId");

-- CreateIndex
CREATE INDEX "ContactPreference_deletedAt_idx" ON "ContactPreference"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "ContactPreference_userId_studentId_key" ON "ContactPreference"("userId", "studentId");

-- CreateIndex
CREATE INDEX "ContactPreferenceCategory_category_idx" ON "ContactPreferenceCategory"("category");

-- CreateIndex
CREATE UNIQUE INDEX "ContactPreferenceCategory_contactPreferenceId_category_key" ON "ContactPreferenceCategory"("contactPreferenceId", "category");

-- CreateIndex
CREATE INDEX "MessageBatch_vendorId_idx" ON "MessageBatch"("vendorId");

-- CreateIndex
CREATE INDEX "MessageBatch_status_idx" ON "MessageBatch"("status");

-- CreateIndex
CREATE INDEX "MessageBatch_scheduledAt_idx" ON "MessageBatch"("scheduledAt");

-- CreateIndex
CREATE INDEX "MessageBatch_deletedAt_idx" ON "MessageBatch"("deletedAt");

-- CreateIndex
CREATE INDEX "MessageBatchTarget_targetType_targetId_idx" ON "MessageBatchTarget"("targetType", "targetId");

-- CreateIndex
CREATE UNIQUE INDEX "MessageBatchTarget_batchId_targetType_targetId_key" ON "MessageBatchTarget"("batchId", "targetType", "targetId");

-- CreateIndex
CREATE INDEX "CommunicationMessage_vendorId_idx" ON "CommunicationMessage"("vendorId");

-- CreateIndex
CREATE INDEX "CommunicationMessage_batchId_idx" ON "CommunicationMessage"("batchId");

-- CreateIndex
CREATE INDEX "CommunicationMessage_userId_idx" ON "CommunicationMessage"("userId");

-- CreateIndex
CREATE INDEX "CommunicationMessage_status_idx" ON "CommunicationMessage"("status");

-- CreateIndex
CREATE INDEX "CommunicationMessage_channel_idx" ON "CommunicationMessage"("channel");

-- CreateIndex
CREATE INDEX "CommunicationMessage_deletedAt_idx" ON "CommunicationMessage"("deletedAt");

-- CreateIndex
CREATE INDEX "PodsApplication_vendorName_idx" ON "PodsApplication"("vendorName");

-- CreateIndex
CREATE INDEX "PodsApplication_contactEmail_idx" ON "PodsApplication"("contactEmail");

-- CreateIndex
CREATE INDEX "PodsApplication_status_idx" ON "PodsApplication"("status");

-- CreateIndex
CREATE INDEX "PodsApplication_deletedAt_idx" ON "PodsApplication"("deletedAt");

-- CreateIndex
CREATE INDEX "IntegrationConfig_vendorId_idx" ON "IntegrationConfig"("vendorId");

-- CreateIndex
CREATE INDEX "IntegrationConfig_type_idx" ON "IntegrationConfig"("type");

-- CreateIndex
CREATE INDEX "IntegrationConfig_status_idx" ON "IntegrationConfig"("status");

-- CreateIndex
CREATE INDEX "IntegrationConfig_deletedAt_idx" ON "IntegrationConfig"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "SandboxCredentials_vendorId_key" ON "SandboxCredentials"("vendorId");

-- CreateIndex
CREATE UNIQUE INDEX "SandboxCredentials_apiKey_key" ON "SandboxCredentials"("apiKey");

-- CreateIndex
CREATE INDEX "SandboxCredentials_apiKey_idx" ON "SandboxCredentials"("apiKey");

-- CreateIndex
CREATE INDEX "SandboxCredentials_vendorId_idx" ON "SandboxCredentials"("vendorId");

-- CreateIndex
CREATE INDEX "SandboxCredentials_status_idx" ON "SandboxCredentials"("status");

-- CreateIndex
CREATE INDEX "SandboxCredentials_deletedAt_idx" ON "SandboxCredentials"("deletedAt");

-- CreateIndex
CREATE INDEX "AuditLog_vendorId_idx" ON "AuditLog"("vendorId");

-- CreateIndex
CREATE INDEX "AuditLog_action_idx" ON "AuditLog"("action");

-- CreateIndex
CREATE INDEX "AuditLog_timestamp_idx" ON "AuditLog"("timestamp");

-- CreateIndex
CREATE INDEX "AuditLog_resourceType_idx" ON "AuditLog"("resourceType");

-- CreateIndex
CREATE UNIQUE INDEX "SyncJob_idempotencyKey_key" ON "SyncJob"("idempotencyKey");

-- CreateIndex
CREATE INDEX "SyncJob_districtId_idx" ON "SyncJob"("districtId");

-- CreateIndex
CREATE INDEX "SyncJob_status_idx" ON "SyncJob"("status");

-- CreateIndex
CREATE INDEX "SyncJob_createdAt_idx" ON "SyncJob"("createdAt");

-- CreateIndex
CREATE INDEX "SyncJob_idempotencyKey_idx" ON "SyncJob"("idempotencyKey");

-- CreateIndex
CREATE INDEX "SyncError_syncJobId_idx" ON "SyncError"("syncJobId");

-- CreateIndex
CREATE INDEX "SyncError_resolved_idx" ON "SyncError"("resolved");

-- AddForeignKey
ALTER TABLE "School" ADD CONSTRAINT "School_districtId_fkey" FOREIGN KEY ("districtId") REFERENCES "District"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AcademicSession" ADD CONSTRAINT "AcademicSession_districtId_fkey" FOREIGN KEY ("districtId") REFERENCES "District"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AcademicSession" ADD CONSTRAINT "AcademicSession_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "AcademicSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Course" ADD CONSTRAINT "Course_districtId_fkey" FOREIGN KEY ("districtId") REFERENCES "District"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Class" ADD CONSTRAINT "Class_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Class" ADD CONSTRAINT "Class_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Class" ADD CONSTRAINT "Class_academicSessionId_fkey" FOREIGN KEY ("academicSessionId") REFERENCES "AcademicSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_primarySchoolId_fkey" FOREIGN KEY ("primarySchoolId") REFERENCES "School"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRelationship" ADD CONSTRAINT "UserRelationship_parentUserId_fkey" FOREIGN KEY ("parentUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRelationship" ADD CONSTRAINT "UserRelationship_childUserId_fkey" FOREIGN KEY ("childUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Demographics" ADD CONSTRAINT "Demographics_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorDataGrant" ADD CONSTRAINT "VendorDataGrant_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorDataGrant" ADD CONSTRAINT "VendorDataGrant_districtId_fkey" FOREIGN KEY ("districtId") REFERENCES "District"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorEntityPermission" ADD CONSTRAINT "VendorEntityPermission_vendorGrantId_fkey" FOREIGN KEY ("vendorGrantId") REFERENCES "VendorDataGrant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorSchoolGrant" ADD CONSTRAINT "VendorSchoolGrant_vendorGrantId_fkey" FOREIGN KEY ("vendorGrantId") REFERENCES "VendorDataGrant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorSchoolGrant" ADD CONSTRAINT "VendorSchoolGrant_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SsoSession" ADD CONSTRAINT "SsoSession_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SsoSession" ADD CONSTRAINT "SsoSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SsoSession" ADD CONSTRAINT "SsoSession_launchContextId_fkey" FOREIGN KEY ("launchContextId") REFERENCES "SsoLaunchContext"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SsoUserMapping" ADD CONSTRAINT "SsoUserMapping_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LtiPlatform" ADD CONSTRAINT "LtiPlatform_districtId_fkey" FOREIGN KEY ("districtId") REFERENCES "District"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LtiDeployment" ADD CONSTRAINT "LtiDeployment_platformId_fkey" FOREIGN KEY ("platformId") REFERENCES "LtiPlatform"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LtiDeployment" ADD CONSTRAINT "LtiDeployment_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LtiResourceLink" ADD CONSTRAINT "LtiResourceLink_deploymentId_fkey" FOREIGN KEY ("deploymentId") REFERENCES "LtiDeployment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LtiResourceLink" ADD CONSTRAINT "LtiResourceLink_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LtiLineItem" ADD CONSTRAINT "LtiLineItem_deploymentId_fkey" FOREIGN KEY ("deploymentId") REFERENCES "LtiDeployment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LtiLineItem" ADD CONSTRAINT "LtiLineItem_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LtiGrade" ADD CONSTRAINT "LtiGrade_lineItemId_fkey" FOREIGN KEY ("lineItemId") REFERENCES "LtiLineItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LtiGrade" ADD CONSTRAINT "LtiGrade_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LtiLaunch" ADD CONSTRAINT "LtiLaunch_deploymentId_fkey" FOREIGN KEY ("deploymentId") REFERENCES "LtiDeployment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LtiLaunch" ADD CONSTRAINT "LtiLaunch_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MessageTemplate" ADD CONSTRAINT "MessageTemplate_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContactPreference" ADD CONSTRAINT "ContactPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContactPreference" ADD CONSTRAINT "ContactPreference_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContactPreferenceCategory" ADD CONSTRAINT "ContactPreferenceCategory_contactPreferenceId_fkey" FOREIGN KEY ("contactPreferenceId") REFERENCES "ContactPreference"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MessageBatch" ADD CONSTRAINT "MessageBatch_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MessageBatch" ADD CONSTRAINT "MessageBatch_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "MessageTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MessageBatchTarget" ADD CONSTRAINT "MessageBatchTarget_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "MessageBatch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunicationMessage" ADD CONSTRAINT "CommunicationMessage_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "MessageBatch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunicationMessage" ADD CONSTRAINT "CommunicationMessage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IntegrationConfig" ADD CONSTRAINT "IntegrationConfig_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SyncError" ADD CONSTRAINT "SyncError_syncJobId_fkey" FOREIGN KEY ("syncJobId") REFERENCES "SyncJob"("id") ON DELETE CASCADE ON UPDATE CASCADE;
