-- CreateTable
CREATE TABLE "Vendor" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "contactEmail" TEXT NOT NULL,
    "contactName" TEXT NOT NULL,
    "website" TEXT,
    "description" TEXT,
    "accessTier" TEXT NOT NULL DEFAULT 'PRIVACY_SAFE',
    "podsStatus" TEXT NOT NULL DEFAULT 'NOT_STARTED',
    "podsApplicationId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "PodsApplication" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "vendorName" TEXT NOT NULL,
    "applicationName" TEXT NOT NULL,
    "contactEmail" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING_REVIEW',
    "accessTier" TEXT NOT NULL DEFAULT 'PRIVACY_SAFE',
    "submittedAt" DATETIME,
    "reviewedAt" DATETIME,
    "expiresAt" DATETIME
);

-- CreateTable
CREATE TABLE "SandboxCredentials" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "vendorId" TEXT NOT NULL,
    "apiKey" TEXT NOT NULL,
    "apiSecret" TEXT NOT NULL,
    "baseUrl" TEXT NOT NULL,
    "environment" TEXT NOT NULL DEFAULT 'sandbox',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "rateLimitPerMinute" INTEGER NOT NULL DEFAULT 60,
    "allowedEndpoints" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUsedAt" DATETIME,
    CONSTRAINT "SandboxCredentials_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "IntegrationConfig" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "vendorId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'NOT_CONFIGURED',
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
    "configuredAt" DATETIME,
    "lastTestedAt" DATETIME,
    "testResult" TEXT,
    "errorMessage" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "IntegrationConfig_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "vendorId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "resourceType" TEXT NOT NULL,
    "resourceId" TEXT,
    "details" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuditLog_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CommunicationMessage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "vendorId" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'QUEUED',
    "recipientToken" TEXT NOT NULL,
    "recipientType" TEXT NOT NULL,
    "subject" TEXT,
    "body" TEXT NOT NULL,
    "sentAt" DATETIME,
    "deliveredAt" DATETIME,
    "failureReason" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CommunicationMessage_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Vendor_contactEmail_key" ON "Vendor"("contactEmail");

-- CreateIndex
CREATE INDEX "Vendor_contactEmail_idx" ON "Vendor"("contactEmail");

-- CreateIndex
CREATE INDEX "Vendor_podsStatus_idx" ON "Vendor"("podsStatus");

-- CreateIndex
CREATE INDEX "Vendor_accessTier_idx" ON "Vendor"("accessTier");

-- CreateIndex
CREATE INDEX "PodsApplication_vendorName_idx" ON "PodsApplication"("vendorName");

-- CreateIndex
CREATE INDEX "PodsApplication_contactEmail_idx" ON "PodsApplication"("contactEmail");

-- CreateIndex
CREATE INDEX "PodsApplication_status_idx" ON "PodsApplication"("status");

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
CREATE INDEX "IntegrationConfig_vendorId_idx" ON "IntegrationConfig"("vendorId");

-- CreateIndex
CREATE INDEX "IntegrationConfig_type_idx" ON "IntegrationConfig"("type");

-- CreateIndex
CREATE INDEX "IntegrationConfig_status_idx" ON "IntegrationConfig"("status");

-- CreateIndex
CREATE INDEX "AuditLog_vendorId_idx" ON "AuditLog"("vendorId");

-- CreateIndex
CREATE INDEX "AuditLog_action_idx" ON "AuditLog"("action");

-- CreateIndex
CREATE INDEX "AuditLog_timestamp_idx" ON "AuditLog"("timestamp");

-- CreateIndex
CREATE INDEX "AuditLog_resourceType_idx" ON "AuditLog"("resourceType");

-- CreateIndex
CREATE INDEX "CommunicationMessage_vendorId_idx" ON "CommunicationMessage"("vendorId");

-- CreateIndex
CREATE INDEX "CommunicationMessage_status_idx" ON "CommunicationMessage"("status");

-- CreateIndex
CREATE INDEX "CommunicationMessage_channel_idx" ON "CommunicationMessage"("channel");
