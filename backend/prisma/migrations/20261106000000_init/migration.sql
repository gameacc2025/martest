-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "RoleScope" AS ENUM ('STAFF', 'COMPANY', 'CUSTOMER');

-- CreateEnum
CREATE TYPE "InquirySubscriptionStatus" AS ENUM ('PENDING_PAYMENT', 'ACTIVE', 'EXPIRED', 'CANCELLED', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "InquiryUsageType" AS ENUM ('INQUIRY_CREATE', 'RESPONSE_SUBMIT', 'INTERNAL_MESSAGE', 'SMS');

-- CreateEnum
CREATE TYPE "NotificationFolderScope" AS ENUM ('ALL', 'WEBSITE', 'COMPANY', 'ADMIN');

-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('IN_APP', 'EMAIL', 'SMS');

-- CreateEnum
CREATE TYPE "NotificationDeliveryStatus" AS ENUM ('PENDING', 'SENT', 'FAILED', 'SKIPPED');

-- CreateEnum
CREATE TYPE "CompanyType" AS ENUM ('MANUFACTURER', 'IMPORTER', 'TELECOM_OPERATOR');

-- CreateEnum
CREATE TYPE "CompanyStatus" AS ENUM ('PENDING', 'ACTIVE', 'INACTIVE', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('PENDING', 'ACTIVE', 'REJECTED');

-- CreateEnum
CREATE TYPE "AccessProfileType" AS ENUM ('STAFF', 'COMPANY');

-- CreateEnum
CREATE TYPE "CategoryStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "SpecificationFieldType" AS ENUM ('TEXT', 'NUMBER', 'BOOLEAN', 'SELECT', 'MULTI_SELECT', 'DATE');

-- CreateEnum
CREATE TYPE "ProductStatus" AS ENUM ('DRAFT', 'PENDING_REVIEW', 'APPROVED', 'REJECTED', 'PUBLISHED', 'HIDDEN', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ProductActivityAction" AS ENUM ('CREATE', 'EDIT', 'PRICE_TIER_CREATE', 'PRICE_TIER_UPDATE', 'PRICE_TIER_DELETE', 'IMAGE_UPLOAD', 'IMAGE_DELETE', 'IMAGE_SET_PRIMARY', 'IMAGE_SORT', 'DOCUMENT_UPLOAD', 'DOCUMENT_DELETE', 'SUBMIT_REVIEW', 'APPROVE', 'REJECT', 'PUBLISH', 'HIDE', 'ARCHIVE', 'RESTORE_DRAFT');

-- CreateEnum
CREATE TYPE "ProductVisibility" AS ENUM ('PUBLIC', 'PRIVATE', 'COMPANY_ONLY');

-- CreateEnum
CREATE TYPE "ProductDocumentType" AS ENUM ('DATASHEET', 'CATALOG', 'MANUAL', 'CERTIFICATE');

-- CreateEnum
CREATE TYPE "InquiryStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'OPEN', 'CLOSED', 'EXPIRED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "InquiryResponseStatus" AS ENUM ('PENDING', 'SELECTED', 'REJECTED', 'EXPIRED', 'WITHDRAWN');

-- CreateEnum
CREATE TYPE "InquiryPriority" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "InquiryVisibilityMode" AS ENUM ('NORMAL', 'SEALED', 'ANONYMOUS_SEALED');

-- CreateEnum
CREATE TYPE "BannerStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateTable
CREATE TABLE "Role" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "scope" "RoleScope" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Permission" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "group" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Permission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RolePermission" (
    "roleId" INTEGER NOT NULL,
    "permissionId" INTEGER NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RolePermission_pkey" PRIMARY KEY ("roleId","permissionId")
);

-- CreateTable
CREATE TABLE "UserRole" (
    "userId" INTEGER NOT NULL,
    "roleId" INTEGER NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserRole_pkey" PRIMARY KEY ("userId","roleId")
);

-- CreateTable
CREATE TABLE "AccessProfile" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "type" "AccessProfileType" NOT NULL,
    "companyId" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AccessProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Profile" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "avatar" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Profile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Company" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "nameEn" TEXT,
    "nationalId" TEXT,
    "registrationNumber" TEXT,
    "type" "CompanyType",
    "description" TEXT,
    "logo" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "website" TEXT,
    "status" "CompanyStatus" NOT NULL DEFAULT 'PENDING',
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "email" TEXT,
    "phone" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Address" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "label" TEXT NOT NULL DEFAULT 'خانه',
    "recipientName" TEXT NOT NULL,
    "recipientPhone" TEXT NOT NULL,
    "province" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "addressLine" TEXT NOT NULL,
    "postalCode" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Address_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RefreshToken" (
    "id" SERIAL NOT NULL,
    "token" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RefreshToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HandoffCode" (
    "id" SERIAL NOT NULL,
    "codeHash" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "app" TEXT NOT NULL,
    "challenge" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HandoffCode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Category" (
    "id" SERIAL NOT NULL,
    "slug" TEXT NOT NULL,
    "nameFa" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "image" TEXT,
    "status" "CategoryStatus" NOT NULL DEFAULT 'ACTIVE',
    "showInMenu" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subcategory" (
    "id" SERIAL NOT NULL,
    "categoryId" INTEGER NOT NULL,
    "slug" TEXT NOT NULL,
    "nameFa" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "status" "CategoryStatus" NOT NULL DEFAULT 'ACTIVE',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subcategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SpecificationTemplate" (
    "id" SERIAL NOT NULL,
    "subcategoryId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SpecificationTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SpecificationField" (
    "id" SERIAL NOT NULL,
    "templateId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "type" "SpecificationFieldType" NOT NULL,
    "isRequired" BOOLEAN NOT NULL DEFAULT false,
    "unit" TEXT,
    "options" JSONB,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SpecificationField_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SpecificationLibraryField" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "type" "SpecificationFieldType" NOT NULL,
    "defaultUnit" TEXT,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SpecificationLibraryField_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "shortDescription" TEXT,
    "description" TEXT,
    "sku" TEXT,
    "catalogCode" TEXT,
    "brand" TEXT,
    "model" TEXT,
    "specifications" JSONB,
    "status" "ProductStatus" NOT NULL DEFAULT 'DRAFT',
    "visibility" "ProductVisibility" NOT NULL DEFAULT 'PUBLIC',
    "retailEnabled" BOOLEAN NOT NULL DEFAULT false,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "editsSinceApproval" INTEGER NOT NULL DEFAULT 0,
    "companyId" INTEGER NOT NULL,
    "categoryId" INTEGER NOT NULL,
    "subcategoryId" INTEGER NOT NULL,
    "createdByUserId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductStatusHistory" (
    "id" SERIAL NOT NULL,
    "productId" INTEGER NOT NULL,
    "previousStatus" "ProductStatus" NOT NULL,
    "newStatus" "ProductStatus" NOT NULL,
    "changedByUserId" INTEGER NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductStatusHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductActivityLog" (
    "id" SERIAL NOT NULL,
    "productId" INTEGER NOT NULL,
    "actorUserId" INTEGER NOT NULL,
    "action" "ProductActivityAction" NOT NULL,
    "detail" TEXT,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductActivityLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductImage" (
    "id" SERIAL NOT NULL,
    "productId" INTEGER NOT NULL,
    "url" TEXT NOT NULL,
    "thumbnailUrl" TEXT,
    "altText" TEXT,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductDocument" (
    "id" SERIAL NOT NULL,
    "productId" INTEGER NOT NULL,
    "type" "ProductDocumentType" NOT NULL,
    "title" TEXT,
    "url" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductPriceTier" (
    "id" SERIAL NOT NULL,
    "productId" INTEGER NOT NULL,
    "minQuantity" INTEGER NOT NULL,
    "maxQuantity" INTEGER,
    "price" DECIMAL(18,2) NOT NULL,
    "unit" TEXT,
    "validFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "validTo" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductPriceTier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductPriceSnapshot" (
    "id" SERIAL NOT NULL,
    "productId" INTEGER NOT NULL,
    "priceTierId" INTEGER,
    "minQuantity" INTEGER NOT NULL,
    "maxQuantity" INTEGER,
    "price" DECIMAL(18,2) NOT NULL,
    "unit" TEXT,
    "action" TEXT NOT NULL,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductPriceSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Inquiry" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "companyId" INTEGER,
    "buyerUserId" INTEGER,
    "status" "InquiryStatus" NOT NULL DEFAULT 'DRAFT',
    "priority" "InquiryPriority" NOT NULL DEFAULT 'NORMAL',
    "visibilityMode" "InquiryVisibilityMode" NOT NULL DEFAULT 'NORMAL',
    "confidential" BOOLEAN NOT NULL DEFAULT false,
    "publishDate" TIMESTAMP(3),
    "responseDeadline" TIMESTAMP(3),
    "autoClose" BOOLEAN NOT NULL DEFAULT true,
    "allowEarlyReveal" BOOLEAN NOT NULL DEFAULT false,
    "revealedAt" TIMESTAMP(3),
    "allowEditResponse" BOOLEAN NOT NULL DEFAULT true,
    "allowWithdrawResponse" BOOLEAN NOT NULL DEFAULT false,
    "closedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Inquiry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InquiryMessage" (
    "id" SERIAL NOT NULL,
    "inquiryId" INTEGER NOT NULL,
    "senderUserId" INTEGER,
    "senderCompanyId" INTEGER,
    "recipientUserId" INTEGER,
    "recipientCompanyId" INTEGER,
    "body" VARCHAR(5000) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "readAt" TIMESTAMP(3),

    CONSTRAINT "InquiryMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InquiryStatusHistory" (
    "id" SERIAL NOT NULL,
    "inquiryId" INTEGER NOT NULL,
    "previousStatus" "InquiryStatus" NOT NULL,
    "newStatus" "InquiryStatus" NOT NULL,
    "changedByUserId" INTEGER,
    "source" TEXT NOT NULL DEFAULT 'USER',
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InquiryStatusHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InquiryItem" (
    "id" SERIAL NOT NULL,
    "inquiryId" INTEGER NOT NULL,
    "productId" INTEGER NOT NULL,
    "description" TEXT,
    "quantity" INTEGER NOT NULL,
    "attachment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InquiryItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InquiryResponse" (
    "id" SERIAL NOT NULL,
    "inquiryId" INTEGER NOT NULL,
    "companyId" INTEGER NOT NULL,
    "status" "InquiryResponseStatus" NOT NULL DEFAULT 'PENDING',
    "withdrawnAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InquiryResponse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InquiryResponseAttachment" (
    "id" SERIAL NOT NULL,
    "responseId" INTEGER NOT NULL,
    "url" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "mimetype" TEXT,
    "size" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InquiryResponseAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InquiryResponseItem" (
    "id" SERIAL NOT NULL,
    "responseId" INTEGER NOT NULL,
    "inquiryItemId" INTEGER NOT NULL,
    "price" DECIMAL(18,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'IRR',
    "availableQuantity" INTEGER NOT NULL,
    "deliveryTime" TEXT,
    "description" TEXT,

    CONSTRAINT "InquiryResponseItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompanyInquiryLimit" (
    "id" SERIAL NOT NULL,
    "companyId" INTEGER NOT NULL,
    "maxOpenInquiries" INTEGER NOT NULL DEFAULT 5,
    "maxActiveResponses" INTEGER NOT NULL DEFAULT 20,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompanyInquiryLimit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompanyLimit" (
    "id" SERIAL NOT NULL,
    "companyId" INTEGER NOT NULL,
    "key" TEXT NOT NULL,
    "value" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompanyLimit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InquiryPlan" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "durationDays" INTEGER NOT NULL,
    "price" DECIMAL(18,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'IRR',
    "inquiriesPerPeriod" INTEGER NOT NULL DEFAULT 0,
    "responsesPerPeriod" INTEGER NOT NULL DEFAULT 0,
    "internalMessagesPerPeriod" INTEGER NOT NULL DEFAULT 0,
    "smsPerPeriod" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InquiryPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InquirySubscription" (
    "id" SERIAL NOT NULL,
    "planId" INTEGER NOT NULL,
    "companyId" INTEGER,
    "userId" INTEGER,
    "status" "InquirySubscriptionStatus" NOT NULL DEFAULT 'PENDING_PAYMENT',
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "activatedBy" INTEGER,
    "paymentReference" TEXT,
    "paymentProvider" TEXT,
    "paymentAuthority" TEXT,
    "paymentRefId" TEXT,
    "paymentAmount" INTEGER,
    "paymentVerifiedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InquirySubscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InquiryUsageEvent" (
    "id" BIGSERIAL NOT NULL,
    "subscriptionId" INTEGER NOT NULL,
    "usageType" "InquiryUsageType" NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "referenceType" TEXT,
    "referenceId" TEXT,
    "idempotencyKey" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InquiryUsageEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemSetting" (
    "id" SERIAL NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updatedByUserId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SystemSetting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "type" TEXT,
    "data" JSONB,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationFolder" (
    "id" SERIAL NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "scope" "NotificationFolderScope" NOT NULL DEFAULT 'ALL',
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotificationFolder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationFolderMembership" (
    "id" SERIAL NOT NULL,
    "notificationId" INTEGER NOT NULL,
    "folderId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NotificationFolderMembership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationPreference" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "eventType" TEXT NOT NULL,
    "channel" "NotificationChannel" NOT NULL,
    "enabled" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotificationPreference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationDelivery" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "notificationId" INTEGER,
    "eventType" TEXT NOT NULL,
    "channel" "NotificationChannel" NOT NULL,
    "status" "NotificationDeliveryStatus" NOT NULL DEFAULT 'PENDING',
    "recipient" TEXT,
    "subject" TEXT,
    "body" TEXT,
    "provider" TEXT,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 3,
    "nextAttemptAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastError" TEXT,
    "sentAt" TIMESTAMP(3),
    "dedupeKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotificationDelivery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Banner" (
    "id" SERIAL NOT NULL,
    "title" VARCHAR(120) NOT NULL,
    "description" VARCHAR(300),
    "imageUrl" TEXT NOT NULL,
    "targetUrl" TEXT,
    "ctaLabel" VARCHAR(40),
    "placement" VARCHAR(40) NOT NULL DEFAULT 'HOME_HERO',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "status" "BannerStatus" NOT NULL DEFAULT 'DRAFT',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Banner_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Role_name_key" ON "Role"("name");

-- CreateIndex
CREATE INDEX "Role_isSystem_idx" ON "Role"("isSystem");

-- CreateIndex
CREATE INDEX "Role_scope_idx" ON "Role"("scope");

-- CreateIndex
CREATE UNIQUE INDEX "Permission_name_key" ON "Permission"("name");

-- CreateIndex
CREATE INDEX "Permission_group_idx" ON "Permission"("group");

-- CreateIndex
CREATE INDEX "RolePermission_permissionId_idx" ON "RolePermission"("permissionId");

-- CreateIndex
CREATE INDEX "UserRole_roleId_idx" ON "UserRole"("roleId");

-- CreateIndex
CREATE UNIQUE INDEX "AccessProfile_userId_key" ON "AccessProfile"("userId");

-- CreateIndex
CREATE INDEX "AccessProfile_type_idx" ON "AccessProfile"("type");

-- CreateIndex
CREATE INDEX "AccessProfile_companyId_idx" ON "AccessProfile"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "Profile_userId_key" ON "Profile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Company_name_key" ON "Company"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Company_nationalId_key" ON "Company"("nationalId");

-- CreateIndex
CREATE INDEX "Company_status_idx" ON "Company"("status");

-- CreateIndex
CREATE INDEX "Company_deletedAt_idx" ON "Company"("deletedAt");

-- CreateIndex
CREATE INDEX "Company_isVerified_idx" ON "Company"("isVerified");

-- CreateIndex
CREATE INDEX "Company_nationalId_idx" ON "Company"("nationalId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_status_idx" ON "User"("status");

-- CreateIndex
CREATE INDEX "User_phone_idx" ON "User"("phone");

-- CreateIndex
CREATE INDEX "Address_userId_isDefault_idx" ON "Address"("userId", "isDefault");

-- CreateIndex
CREATE INDEX "Address_userId_createdAt_idx" ON "Address"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "RefreshToken_token_key" ON "RefreshToken"("token");

-- CreateIndex
CREATE INDEX "RefreshToken_userId_idx" ON "RefreshToken"("userId");

-- CreateIndex
CREATE INDEX "RefreshToken_token_idx" ON "RefreshToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "HandoffCode_codeHash_key" ON "HandoffCode"("codeHash");

-- CreateIndex
CREATE INDEX "HandoffCode_userId_idx" ON "HandoffCode"("userId");

-- CreateIndex
CREATE INDEX "HandoffCode_expiresAt_idx" ON "HandoffCode"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "Category_slug_key" ON "Category"("slug");

-- CreateIndex
CREATE INDEX "Category_status_idx" ON "Category"("status");

-- CreateIndex
CREATE INDEX "Category_showInMenu_idx" ON "Category"("showInMenu");

-- CreateIndex
CREATE INDEX "Category_sortOrder_idx" ON "Category"("sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "Subcategory_slug_key" ON "Subcategory"("slug");

-- CreateIndex
CREATE INDEX "Subcategory_categoryId_idx" ON "Subcategory"("categoryId");

-- CreateIndex
CREATE INDEX "Subcategory_status_idx" ON "Subcategory"("status");

-- CreateIndex
CREATE INDEX "Subcategory_sortOrder_idx" ON "Subcategory"("sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "SpecificationTemplate_subcategoryId_key" ON "SpecificationTemplate"("subcategoryId");

-- CreateIndex
CREATE INDEX "SpecificationTemplate_isActive_idx" ON "SpecificationTemplate"("isActive");

-- CreateIndex
CREATE INDEX "SpecificationField_templateId_idx" ON "SpecificationField"("templateId");

-- CreateIndex
CREATE INDEX "SpecificationField_sortOrder_idx" ON "SpecificationField"("sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "SpecificationField_templateId_key_key" ON "SpecificationField"("templateId", "key");

-- CreateIndex
CREATE UNIQUE INDEX "SpecificationLibraryField_slug_key" ON "SpecificationLibraryField"("slug");

-- CreateIndex
CREATE INDEX "SpecificationLibraryField_isActive_idx" ON "SpecificationLibraryField"("isActive");

-- CreateIndex
CREATE INDEX "SpecificationLibraryField_slug_idx" ON "SpecificationLibraryField"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Product_slug_key" ON "Product"("slug");

-- CreateIndex
CREATE INDEX "Product_companyId_idx" ON "Product"("companyId");

-- CreateIndex
CREATE INDEX "Product_categoryId_idx" ON "Product"("categoryId");

-- CreateIndex
CREATE INDEX "Product_createdByUserId_idx" ON "Product"("createdByUserId");

-- CreateIndex
CREATE INDEX "Product_status_idx" ON "Product"("status");

-- CreateIndex
CREATE INDEX "Product_visibility_idx" ON "Product"("visibility");

-- CreateIndex
CREATE INDEX "Product_isFeatured_idx" ON "Product"("isFeatured");

-- CreateIndex
CREATE INDEX "Product_deletedAt_idx" ON "Product"("deletedAt");

-- CreateIndex
CREATE INDEX "Product_sku_idx" ON "Product"("sku");

-- CreateIndex
CREATE INDEX "Product_catalogCode_idx" ON "Product"("catalogCode");

-- CreateIndex
CREATE INDEX "ProductStatusHistory_productId_idx" ON "ProductStatusHistory"("productId");

-- CreateIndex
CREATE INDEX "ProductStatusHistory_changedByUserId_idx" ON "ProductStatusHistory"("changedByUserId");

-- CreateIndex
CREATE INDEX "ProductStatusHistory_newStatus_idx" ON "ProductStatusHistory"("newStatus");

-- CreateIndex
CREATE INDEX "ProductStatusHistory_createdAt_idx" ON "ProductStatusHistory"("createdAt");

-- CreateIndex
CREATE INDEX "ProductActivityLog_productId_idx" ON "ProductActivityLog"("productId");

-- CreateIndex
CREATE INDEX "ProductActivityLog_actorUserId_idx" ON "ProductActivityLog"("actorUserId");

-- CreateIndex
CREATE INDEX "ProductActivityLog_action_idx" ON "ProductActivityLog"("action");

-- CreateIndex
CREATE INDEX "ProductActivityLog_createdAt_idx" ON "ProductActivityLog"("createdAt");

-- CreateIndex
CREATE INDEX "ProductImage_productId_idx" ON "ProductImage"("productId");

-- CreateIndex
CREATE INDEX "ProductImage_isPrimary_idx" ON "ProductImage"("isPrimary");

-- CreateIndex
CREATE INDEX "ProductImage_sortOrder_idx" ON "ProductImage"("sortOrder");

-- CreateIndex
CREATE INDEX "ProductDocument_productId_idx" ON "ProductDocument"("productId");

-- CreateIndex
CREATE INDEX "ProductDocument_type_idx" ON "ProductDocument"("type");

-- CreateIndex
CREATE INDEX "ProductDocument_sortOrder_idx" ON "ProductDocument"("sortOrder");

-- CreateIndex
CREATE INDEX "ProductPriceTier_productId_idx" ON "ProductPriceTier"("productId");

-- CreateIndex
CREATE INDEX "ProductPriceTier_minQuantity_idx" ON "ProductPriceTier"("minQuantity");

-- CreateIndex
CREATE INDEX "ProductPriceTier_validFrom_idx" ON "ProductPriceTier"("validFrom");

-- CreateIndex
CREATE INDEX "ProductPriceTier_validTo_idx" ON "ProductPriceTier"("validTo");

-- CreateIndex
CREATE INDEX "ProductPriceSnapshot_productId_recordedAt_idx" ON "ProductPriceSnapshot"("productId", "recordedAt");

-- CreateIndex
CREATE INDEX "ProductPriceSnapshot_priceTierId_idx" ON "ProductPriceSnapshot"("priceTierId");

-- CreateIndex
CREATE INDEX "Inquiry_companyId_idx" ON "Inquiry"("companyId");

-- CreateIndex
CREATE INDEX "Inquiry_buyerUserId_idx" ON "Inquiry"("buyerUserId");

-- CreateIndex
CREATE INDEX "Inquiry_status_idx" ON "Inquiry"("status");

-- CreateIndex
CREATE INDEX "Inquiry_priority_idx" ON "Inquiry"("priority");

-- CreateIndex
CREATE INDEX "Inquiry_visibilityMode_idx" ON "Inquiry"("visibilityMode");

-- CreateIndex
CREATE INDEX "Inquiry_confidential_idx" ON "Inquiry"("confidential");

-- CreateIndex
CREATE INDEX "Inquiry_publishDate_idx" ON "Inquiry"("publishDate");

-- CreateIndex
CREATE INDEX "Inquiry_responseDeadline_idx" ON "Inquiry"("responseDeadline");

-- CreateIndex
CREATE INDEX "Inquiry_revealedAt_idx" ON "Inquiry"("revealedAt");

-- CreateIndex
CREATE INDEX "Inquiry_closedAt_idx" ON "Inquiry"("closedAt");

-- CreateIndex
CREATE INDEX "InquiryMessage_inquiryId_createdAt_idx" ON "InquiryMessage"("inquiryId", "createdAt");

-- CreateIndex
CREATE INDEX "InquiryMessage_senderUserId_idx" ON "InquiryMessage"("senderUserId");

-- CreateIndex
CREATE INDEX "InquiryMessage_senderCompanyId_idx" ON "InquiryMessage"("senderCompanyId");

-- CreateIndex
CREATE INDEX "InquiryMessage_recipientUserId_idx" ON "InquiryMessage"("recipientUserId");

-- CreateIndex
CREATE INDEX "InquiryMessage_recipientCompanyId_idx" ON "InquiryMessage"("recipientCompanyId");

-- CreateIndex
CREATE INDEX "InquiryStatusHistory_inquiryId_idx" ON "InquiryStatusHistory"("inquiryId");

-- CreateIndex
CREATE INDEX "InquiryStatusHistory_changedByUserId_idx" ON "InquiryStatusHistory"("changedByUserId");

-- CreateIndex
CREATE INDEX "InquiryStatusHistory_newStatus_idx" ON "InquiryStatusHistory"("newStatus");

-- CreateIndex
CREATE INDEX "InquiryStatusHistory_createdAt_idx" ON "InquiryStatusHistory"("createdAt");

-- CreateIndex
CREATE INDEX "InquiryItem_inquiryId_idx" ON "InquiryItem"("inquiryId");

-- CreateIndex
CREATE INDEX "InquiryItem_productId_idx" ON "InquiryItem"("productId");

-- CreateIndex
CREATE INDEX "InquiryResponse_inquiryId_idx" ON "InquiryResponse"("inquiryId");

-- CreateIndex
CREATE INDEX "InquiryResponse_companyId_idx" ON "InquiryResponse"("companyId");

-- CreateIndex
CREATE INDEX "InquiryResponse_status_idx" ON "InquiryResponse"("status");

-- CreateIndex
CREATE UNIQUE INDEX "InquiryResponse_inquiryId_companyId_key" ON "InquiryResponse"("inquiryId", "companyId");

-- CreateIndex
CREATE INDEX "InquiryResponseAttachment_responseId_idx" ON "InquiryResponseAttachment"("responseId");

-- CreateIndex
CREATE INDEX "InquiryResponseItem_responseId_idx" ON "InquiryResponseItem"("responseId");

-- CreateIndex
CREATE INDEX "InquiryResponseItem_inquiryItemId_idx" ON "InquiryResponseItem"("inquiryItemId");

-- CreateIndex
CREATE INDEX "InquiryResponseItem_currency_idx" ON "InquiryResponseItem"("currency");

-- CreateIndex
CREATE UNIQUE INDEX "InquiryResponseItem_responseId_inquiryItemId_key" ON "InquiryResponseItem"("responseId", "inquiryItemId");

-- CreateIndex
CREATE UNIQUE INDEX "CompanyInquiryLimit_companyId_key" ON "CompanyInquiryLimit"("companyId");

-- CreateIndex
CREATE INDEX "CompanyLimit_companyId_idx" ON "CompanyLimit"("companyId");

-- CreateIndex
CREATE INDEX "CompanyLimit_key_idx" ON "CompanyLimit"("key");

-- CreateIndex
CREATE UNIQUE INDEX "CompanyLimit_companyId_key_key" ON "CompanyLimit"("companyId", "key");

-- CreateIndex
CREATE UNIQUE INDEX "InquiryPlan_code_key" ON "InquiryPlan"("code");

-- CreateIndex
CREATE INDEX "InquiryPlan_isActive_idx" ON "InquiryPlan"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "InquirySubscription_paymentReference_key" ON "InquirySubscription"("paymentReference");

-- CreateIndex
CREATE UNIQUE INDEX "InquirySubscription_paymentAuthority_key" ON "InquirySubscription"("paymentAuthority");

-- CreateIndex
CREATE INDEX "InquirySubscription_companyId_status_endsAt_idx" ON "InquirySubscription"("companyId", "status", "endsAt");

-- CreateIndex
CREATE INDEX "InquirySubscription_userId_status_endsAt_idx" ON "InquirySubscription"("userId", "status", "endsAt");

-- CreateIndex
CREATE INDEX "InquirySubscription_planId_idx" ON "InquirySubscription"("planId");

-- CreateIndex
CREATE UNIQUE INDEX "InquiryUsageEvent_idempotencyKey_key" ON "InquiryUsageEvent"("idempotencyKey");

-- CreateIndex
CREATE INDEX "InquiryUsageEvent_subscriptionId_usageType_createdAt_idx" ON "InquiryUsageEvent"("subscriptionId", "usageType", "createdAt");

-- CreateIndex
CREATE INDEX "InquiryUsageEvent_referenceType_referenceId_idx" ON "InquiryUsageEvent"("referenceType", "referenceId");

-- CreateIndex
CREATE UNIQUE INDEX "SystemSetting_key_key" ON "SystemSetting"("key");

-- CreateIndex
CREATE INDEX "SystemSetting_key_idx" ON "SystemSetting"("key");

-- CreateIndex
CREATE INDEX "Notification_userId_idx" ON "Notification"("userId");

-- CreateIndex
CREATE INDEX "Notification_isRead_idx" ON "Notification"("isRead");

-- CreateIndex
CREATE INDEX "Notification_createdAt_idx" ON "Notification"("createdAt");

-- CreateIndex
CREATE INDEX "Notification_type_idx" ON "Notification"("type");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationFolder_key_key" ON "NotificationFolder"("key");

-- CreateIndex
CREATE INDEX "NotificationFolder_scope_isActive_sortOrder_idx" ON "NotificationFolder"("scope", "isActive", "sortOrder");

-- CreateIndex
CREATE INDEX "NotificationFolderMembership_folderId_idx" ON "NotificationFolderMembership"("folderId");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationFolderMembership_notificationId_folderId_key" ON "NotificationFolderMembership"("notificationId", "folderId");

-- CreateIndex
CREATE INDEX "NotificationPreference_userId_idx" ON "NotificationPreference"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationPreference_userId_eventType_channel_key" ON "NotificationPreference"("userId", "eventType", "channel");

-- CreateIndex
CREATE INDEX "NotificationDelivery_userId_idx" ON "NotificationDelivery"("userId");

-- CreateIndex
CREATE INDEX "NotificationDelivery_eventType_idx" ON "NotificationDelivery"("eventType");

-- CreateIndex
CREATE INDEX "NotificationDelivery_channel_status_nextAttemptAt_idx" ON "NotificationDelivery"("channel", "status", "nextAttemptAt");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationDelivery_eventType_dedupeKey_channel_key" ON "NotificationDelivery"("eventType", "dedupeKey", "channel");

-- CreateIndex
CREATE INDEX "Banner_placement_status_isActive_sortOrder_idx" ON "Banner"("placement", "status", "isActive", "sortOrder");

-- CreateIndex
CREATE INDEX "Banner_startsAt_endsAt_idx" ON "Banner"("startsAt", "endsAt");

-- CreateIndex
CREATE INDEX "Banner_deletedAt_idx" ON "Banner"("deletedAt");

-- AddForeignKey
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "Permission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRole" ADD CONSTRAINT "UserRole_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRole" ADD CONSTRAINT "UserRole_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccessProfile" ADD CONSTRAINT "AccessProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccessProfile" ADD CONSTRAINT "AccessProfile_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Profile" ADD CONSTRAINT "Profile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Address" ADD CONSTRAINT "Address_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RefreshToken" ADD CONSTRAINT "RefreshToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HandoffCode" ADD CONSTRAINT "HandoffCode_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subcategory" ADD CONSTRAINT "Subcategory_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpecificationTemplate" ADD CONSTRAINT "SpecificationTemplate_subcategoryId_fkey" FOREIGN KEY ("subcategoryId") REFERENCES "Subcategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpecificationField" ADD CONSTRAINT "SpecificationField_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "SpecificationTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_subcategoryId_fkey" FOREIGN KEY ("subcategoryId") REFERENCES "Subcategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductStatusHistory" ADD CONSTRAINT "ProductStatusHistory_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductStatusHistory" ADD CONSTRAINT "ProductStatusHistory_changedByUserId_fkey" FOREIGN KEY ("changedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductActivityLog" ADD CONSTRAINT "ProductActivityLog_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductActivityLog" ADD CONSTRAINT "ProductActivityLog_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductImage" ADD CONSTRAINT "ProductImage_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductDocument" ADD CONSTRAINT "ProductDocument_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductPriceTier" ADD CONSTRAINT "ProductPriceTier_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductPriceSnapshot" ADD CONSTRAINT "ProductPriceSnapshot_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inquiry" ADD CONSTRAINT "Inquiry_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inquiry" ADD CONSTRAINT "Inquiry_buyerUserId_fkey" FOREIGN KEY ("buyerUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InquiryMessage" ADD CONSTRAINT "InquiryMessage_inquiryId_fkey" FOREIGN KEY ("inquiryId") REFERENCES "Inquiry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InquiryMessage" ADD CONSTRAINT "InquiryMessage_senderUserId_fkey" FOREIGN KEY ("senderUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InquiryMessage" ADD CONSTRAINT "InquiryMessage_senderCompanyId_fkey" FOREIGN KEY ("senderCompanyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InquiryMessage" ADD CONSTRAINT "InquiryMessage_recipientUserId_fkey" FOREIGN KEY ("recipientUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InquiryMessage" ADD CONSTRAINT "InquiryMessage_recipientCompanyId_fkey" FOREIGN KEY ("recipientCompanyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InquiryStatusHistory" ADD CONSTRAINT "InquiryStatusHistory_inquiryId_fkey" FOREIGN KEY ("inquiryId") REFERENCES "Inquiry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InquiryStatusHistory" ADD CONSTRAINT "InquiryStatusHistory_changedByUserId_fkey" FOREIGN KEY ("changedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InquiryItem" ADD CONSTRAINT "InquiryItem_inquiryId_fkey" FOREIGN KEY ("inquiryId") REFERENCES "Inquiry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InquiryItem" ADD CONSTRAINT "InquiryItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InquiryResponse" ADD CONSTRAINT "InquiryResponse_inquiryId_fkey" FOREIGN KEY ("inquiryId") REFERENCES "Inquiry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InquiryResponse" ADD CONSTRAINT "InquiryResponse_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InquiryResponseAttachment" ADD CONSTRAINT "InquiryResponseAttachment_responseId_fkey" FOREIGN KEY ("responseId") REFERENCES "InquiryResponse"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InquiryResponseItem" ADD CONSTRAINT "InquiryResponseItem_responseId_fkey" FOREIGN KEY ("responseId") REFERENCES "InquiryResponse"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InquiryResponseItem" ADD CONSTRAINT "InquiryResponseItem_inquiryItemId_fkey" FOREIGN KEY ("inquiryItemId") REFERENCES "InquiryItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanyInquiryLimit" ADD CONSTRAINT "CompanyInquiryLimit_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanyLimit" ADD CONSTRAINT "CompanyLimit_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InquirySubscription" ADD CONSTRAINT "InquirySubscription_planId_fkey" FOREIGN KEY ("planId") REFERENCES "InquiryPlan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InquirySubscription" ADD CONSTRAINT "InquirySubscription_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InquirySubscription" ADD CONSTRAINT "InquirySubscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InquiryUsageEvent" ADD CONSTRAINT "InquiryUsageEvent_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "InquirySubscription"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationFolderMembership" ADD CONSTRAINT "NotificationFolderMembership_notificationId_fkey" FOREIGN KEY ("notificationId") REFERENCES "Notification"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationFolderMembership" ADD CONSTRAINT "NotificationFolderMembership_folderId_fkey" FOREIGN KEY ("folderId") REFERENCES "NotificationFolder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationPreference" ADD CONSTRAINT "NotificationPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationDelivery" ADD CONSTRAINT "NotificationDelivery_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Domain invariants not expressible in Prisma Schema Language.
ALTER TABLE "Inquiry"
  ADD CONSTRAINT "Inquiry_exactly_one_buyer_check"
  CHECK (
    ("companyId" IS NOT NULL AND "buyerUserId" IS NULL)
    OR ("companyId" IS NULL AND "buyerUserId" IS NOT NULL)
  );

ALTER TABLE "InquirySubscription"
  ADD CONSTRAINT "InquirySubscription_exactly_one_owner_check"
  CHECK (
    ("companyId" IS NOT NULL AND "userId" IS NULL)
    OR ("companyId" IS NULL AND "userId" IS NOT NULL)
  );

ALTER TABLE "InquiryMessage"
  ADD CONSTRAINT "InquiryMessage_sender_identity_check"
  CHECK (("senderUserId" IS NOT NULL)::integer + ("senderCompanyId" IS NOT NULL)::integer = 1);

ALTER TABLE "InquiryMessage"
  ADD CONSTRAINT "InquiryMessage_recipient_identity_check"
  CHECK (("recipientUserId" IS NOT NULL)::integer + ("recipientCompanyId" IS NOT NULL)::integer = 1);

CREATE UNIQUE INDEX "Address_one_default_per_user_idx"
  ON "Address"("userId") WHERE "isDefault" = true;

INSERT INTO "NotificationFolder" ("key", "name", "scope", "isSystem", "isActive", "sortOrder", "updatedAt")
VALUES
  ('INBOX', 'دریافتی‌ها', 'ALL', true, true, 0, CURRENT_TIMESTAMP),
  ('SAVED', 'ذخیره‌شده‌ها', 'ALL', true, true, 1, CURRENT_TIMESTAMP);

CREATE OR REPLACE FUNCTION notification_folder_default_inbox() RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO "NotificationFolderMembership" ("notificationId", "folderId")
  SELECT NEW.id, id FROM "NotificationFolder" WHERE "key" = 'INBOX'
  ON CONFLICT ("notificationId", "folderId") DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "Notification_default_inbox_membership"
AFTER INSERT ON "Notification"
FOR EACH ROW EXECUTE FUNCTION notification_folder_default_inbox();
