-- Additive migration; existing core tables and records are preserved.
CREATE TYPE "InventoryMovementType" AS ENUM ('RECEIPT', 'ADJUSTMENT_IN', 'ADJUSTMENT_OUT', 'RESERVATION', 'RELEASE', 'SALE', 'RETURN', 'DAMAGE');
CREATE TYPE "InventoryReservationStatus" AS ENUM ('ACTIVE', 'CONSUMED', 'RELEASED', 'EXPIRED');
CREATE TYPE "RetailOrderStatus" AS ENUM ('PENDING_PAYMENT', 'PAID', 'PROCESSING', 'PARTIALLY_FULFILLED', 'FULFILLED', 'COMPLETED', 'CANCELLED', 'PAYMENT_EXPIRED', 'PARTIALLY_CANCELLED');
CREATE TYPE "RetailPaymentStatus" AS ENUM ('UNPAID', 'PENDING', 'PAID', 'PARTIALLY_REFUNDED', 'REFUNDED', 'FAILED');
CREATE TYPE "SellerOrderStatus" AS ENUM ('PENDING_ACCEPTANCE', 'ACCEPTED', 'REJECTED', 'PROCESSING', 'READY_TO_SHIP', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'RETURN_REQUESTED', 'PARTIALLY_RETURNED', 'RETURNED');
CREATE TYPE "PaymentAttemptStatus" AS ENUM ('CREATED', 'REDIRECTED', 'PENDING', 'SUCCEEDED', 'FAILED', 'EXPIRED', 'CANCELLED');
CREATE TYPE "PaymentTransactionType" AS ENUM ('AUTHORIZE', 'CAPTURE', 'VOID', 'REFUND', 'CHARGEBACK');
CREATE TYPE "PaymentTransactionStatus" AS ENUM ('PENDING', 'SUCCEEDED', 'FAILED', 'REVERSED');
CREATE TYPE "PaymentWebhookStatus" AS ENUM ('RECEIVED', 'VERIFIED', 'PROCESSED', 'REJECTED', 'FAILED');
CREATE TYPE "RefundStatus" AS ENUM ('REQUESTED', 'APPROVED', 'PROCESSING', 'SUCCEEDED', 'FAILED', 'REJECTED');
CREATE TYPE "ShipmentStatus" AS ENUM ('LABEL_CREATED', 'READY_FOR_PICKUP', 'IN_TRANSIT', 'DELIVERED', 'FAILED', 'RETURNED');
CREATE TYPE "ReturnStatus" AS ENUM ('REQUESTED', 'APPROVED', 'REJECTED', 'IN_TRANSIT', 'RECEIVED', 'INSPECTED', 'REFUNDED', 'CLOSED');
CREATE TYPE "ReturnItemDisposition" AS ENUM ('RESTOCK', 'DAMAGED', 'DISPOSED', 'REPAIR');
CREATE TABLE "InventoryBalance" (
  "id" SERIAL NOT NULL,
  "productId" INTEGER NOT NULL,
  "onHand" INTEGER NOT NULL DEFAULT 0,
  "reserved" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "InventoryBalance_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "InventoryBalance_productId_key" UNIQUE ("productId")
);

CREATE TABLE "InventoryMovement" (
  "id" BIGSERIAL NOT NULL,
  "productId" INTEGER NOT NULL,
  "actorUserId" INTEGER,
  "movementType" "InventoryMovementType" NOT NULL,
  "quantityDelta" INTEGER NOT NULL,
  "referenceType" VARCHAR(60),
  "referenceId" VARCHAR(100),
  "idempotencyKey" VARCHAR(160),
  "reason" VARCHAR(500),
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "InventoryMovement_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "InventoryMovement_idempotencyKey_key" UNIQUE ("idempotencyKey")
);

CREATE TABLE "RetailOrder" (
  "id" SERIAL NOT NULL,
  "orderNumber" VARCHAR(40) NOT NULL,
  "buyerUserId" INTEGER NOT NULL,
  "status" "RetailOrderStatus" NOT NULL DEFAULT 'PENDING_PAYMENT'::"RetailOrderStatus",
  "paymentStatus" "RetailPaymentStatus" NOT NULL DEFAULT 'UNPAID'::"RetailPaymentStatus",
  "currency" VARCHAR(3) NOT NULL,
  "subtotal" DECIMAL(20, 2) NOT NULL DEFAULT 0,
  "discountTotal" DECIMAL(20, 2) NOT NULL DEFAULT 0,
  "shippingTotal" DECIMAL(20, 2) NOT NULL DEFAULT 0,
  "taxTotal" DECIMAL(20, 2) NOT NULL DEFAULT 0,
  "grandTotal" DECIMAL(20, 2) NOT NULL DEFAULT 0,
  "addressId" INTEGER,
  "recipientName" VARCHAR(200) NOT NULL,
  "recipientPhone" VARCHAR(40) NOT NULL,
  "province" VARCHAR(120) NOT NULL,
  "city" VARCHAR(120) NOT NULL,
  "addressLine" VARCHAR(1000) NOT NULL,
  "postalCode" VARCHAR(30),
  "idempotencyKey" VARCHAR(160) NOT NULL,
  "placedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "paidAt" TIMESTAMP(3),
  "completedAt" TIMESTAMP(3),
  "cancelledAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "RetailOrder_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "RetailOrder_orderNumber_key" UNIQUE ("orderNumber"),
  CONSTRAINT "RetailOrder_idempotencyKey_key" UNIQUE ("idempotencyKey")
);

CREATE TABLE "SellerOrder" (
  "id" SERIAL NOT NULL,
  "orderId" INTEGER NOT NULL,
  "companyId" INTEGER NOT NULL,
  "sellerOrderNumber" VARCHAR(48) NOT NULL,
  "status" "SellerOrderStatus" NOT NULL DEFAULT 'PENDING_ACCEPTANCE'::"SellerOrderStatus",
  "currency" VARCHAR(3) NOT NULL,
  "subtotal" DECIMAL(20, 2) NOT NULL DEFAULT 0,
  "discountTotal" DECIMAL(20, 2) NOT NULL DEFAULT 0,
  "shippingTotal" DECIMAL(20, 2) NOT NULL DEFAULT 0,
  "taxTotal" DECIMAL(20, 2) NOT NULL DEFAULT 0,
  "sellerNetTotal" DECIMAL(20, 2) NOT NULL DEFAULT 0,
  "companyNameSnapshot" VARCHAR(240) NOT NULL,
  "companyIdSnapshot" VARCHAR(80),
  "acceptedAt" TIMESTAMP(3),
  "shippedAt" TIMESTAMP(3),
  "deliveredAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SellerOrder_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "SellerOrder_sellerOrderNumber_key" UNIQUE ("sellerOrderNumber")
);

CREATE TABLE "RetailOrderItem" (
  "id" SERIAL NOT NULL,
  "orderId" INTEGER NOT NULL,
  "sellerOrderId" INTEGER NOT NULL,
  "productId" INTEGER,
  "productTitleSnapshot" VARCHAR(240) NOT NULL,
  "skuSnapshot" VARCHAR(120),
  "brandSnapshot" VARCHAR(160),
  "modelSnapshot" VARCHAR(160),
  "imageUrlSnapshot" VARCHAR(1000),
  "companyNameSnapshot" VARCHAR(240) NOT NULL,
  "quantity" INTEGER NOT NULL,
  "unitPrice" DECIMAL(20, 2) NOT NULL,
  "discountAmount" DECIMAL(20, 2) NOT NULL DEFAULT 0,
  "taxAmount" DECIMAL(20, 2) NOT NULL DEFAULT 0,
  "lineTotal" DECIMAL(20, 2) NOT NULL,
  "currency" VARCHAR(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "RetailOrderItem_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "InventoryReservation" (
  "id" BIGSERIAL NOT NULL,
  "productId" INTEGER NOT NULL,
  "buyerUserId" INTEGER NOT NULL,
  "orderId" INTEGER,
  "quantity" INTEGER NOT NULL,
  "status" "InventoryReservationStatus" NOT NULL DEFAULT 'ACTIVE'::"InventoryReservationStatus",
  "checkoutKey" VARCHAR(160) NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "consumedAt" TIMESTAMP(3),
  "releasedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "InventoryReservation_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "InventoryReservation_checkoutKey_key" UNIQUE ("checkoutKey")
);

CREATE TABLE "PaymentAttempt" (
  "id" SERIAL NOT NULL,
  "orderId" INTEGER NOT NULL,
  "provider" VARCHAR(80) NOT NULL,
  "status" "PaymentAttemptStatus" NOT NULL DEFAULT 'CREATED'::"PaymentAttemptStatus",
  "amount" DECIMAL(20, 2) NOT NULL,
  "currency" VARCHAR(3) NOT NULL,
  "idempotencyKey" VARCHAR(160) NOT NULL,
  "authority" VARCHAR(200),
  "redirectUrl" VARCHAR(1000),
  "expiresAt" TIMESTAMP(3),
  "completedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PaymentAttempt_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "PaymentAttempt_idempotencyKey_key" UNIQUE ("idempotencyKey"),
  CONSTRAINT "PaymentAttempt_authority_key" UNIQUE ("authority")
);

CREATE TABLE "PaymentTransaction" (
  "id" SERIAL NOT NULL,
  "orderId" INTEGER NOT NULL,
  "attemptId" INTEGER,
  "provider" VARCHAR(80) NOT NULL,
  "providerTransactionId" VARCHAR(200),
  "transactionType" "PaymentTransactionType" NOT NULL,
  "status" "PaymentTransactionStatus" NOT NULL DEFAULT 'PENDING'::"PaymentTransactionStatus",
  "amount" DECIMAL(20, 2) NOT NULL,
  "currency" VARCHAR(3) NOT NULL,
  "verifiedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PaymentTransaction_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PaymentWebhookEvent" (
  "id" BIGSERIAL NOT NULL,
  "provider" VARCHAR(80) NOT NULL,
  "providerEventId" VARCHAR(240) NOT NULL,
  "attemptId" INTEGER,
  "status" "PaymentWebhookStatus" NOT NULL DEFAULT 'RECEIVED'::"PaymentWebhookStatus",
  "signatureValid" BOOLEAN NOT NULL DEFAULT false,
  "payload" JSONB NOT NULL,
  "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "processedAt" TIMESTAMP(3),
  "lastError" TEXT,
  CONSTRAINT "PaymentWebhookEvent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "RetailRefund" (
  "id" SERIAL NOT NULL,
  "orderId" INTEGER NOT NULL,
  "sellerOrderId" INTEGER,
  "paymentTransactionId" INTEGER,
  "requestedByUserId" INTEGER NOT NULL,
  "amount" DECIMAL(20, 2) NOT NULL,
  "currency" VARCHAR(3) NOT NULL,
  "status" "RefundStatus" NOT NULL DEFAULT 'REQUESTED'::"RefundStatus",
  "reason" VARCHAR(1000) NOT NULL,
  "idempotencyKey" VARCHAR(160) NOT NULL,
  "providerRefundId" VARCHAR(200),
  "processedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "RetailRefund_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "RetailRefund_idempotencyKey_key" UNIQUE ("idempotencyKey"),
  CONSTRAINT "RetailRefund_providerRefundId_key" UNIQUE ("providerRefundId")
);

CREATE TABLE "Shipment" (
  "id" SERIAL NOT NULL,
  "sellerOrderId" INTEGER NOT NULL,
  "carrier" VARCHAR(120),
  "trackingNumber" VARCHAR(160),
  "status" "ShipmentStatus" NOT NULL DEFAULT 'LABEL_CREATED'::"ShipmentStatus",
  "shippedAt" TIMESTAMP(3),
  "deliveredAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Shipment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TrackingEvent" (
  "id" BIGSERIAL NOT NULL,
  "shipmentId" INTEGER NOT NULL,
  "eventCode" VARCHAR(80),
  "description" VARCHAR(500) NOT NULL,
  "location" VARCHAR(240),
  "occurredAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "TrackingEvent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ReturnRequest" (
  "id" SERIAL NOT NULL,
  "orderId" INTEGER NOT NULL,
  "sellerOrderId" INTEGER NOT NULL,
  "buyerUserId" INTEGER NOT NULL,
  "returnNumber" VARCHAR(40) NOT NULL,
  "status" "ReturnStatus" NOT NULL DEFAULT 'REQUESTED'::"ReturnStatus",
  "reason" VARCHAR(1000) NOT NULL,
  "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "receivedAt" TIMESTAMP(3),
  "closedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ReturnRequest_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ReturnRequest_returnNumber_key" UNIQUE ("returnNumber")
);

CREATE TABLE "ReturnItem" (
  "id" SERIAL NOT NULL,
  "returnRequestId" INTEGER NOT NULL,
  "orderItemId" INTEGER NOT NULL,
  "quantity" INTEGER NOT NULL,
  "disposition" "ReturnItemDisposition",
  "inspectionNote" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ReturnItem_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "InventoryBalance" ADD CONSTRAINT "InventoryBalance_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "InventoryMovement" ADD CONSTRAINT "InventoryMovement_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "InventoryMovement" ADD CONSTRAINT "InventoryMovement_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "RetailOrder" ADD CONSTRAINT "RetailOrder_addressId_fkey" FOREIGN KEY ("addressId") REFERENCES "Address" ("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "RetailOrder" ADD CONSTRAINT "RetailOrder_buyerUserId_fkey" FOREIGN KEY ("buyerUserId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SellerOrder" ADD CONSTRAINT "SellerOrder_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "RetailOrder" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SellerOrder" ADD CONSTRAINT "SellerOrder_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "RetailOrderItem" ADD CONSTRAINT "RetailOrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "RetailOrder" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "RetailOrderItem" ADD CONSTRAINT "RetailOrderItem_sellerOrderId_orderId_fkey" FOREIGN KEY ("sellerOrderId", "orderId") REFERENCES "SellerOrder" ("id", "orderId") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "RetailOrderItem" ADD CONSTRAINT "RetailOrderItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "InventoryReservation" ADD CONSTRAINT "InventoryReservation_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "InventoryReservation" ADD CONSTRAINT "InventoryReservation_buyerUserId_fkey" FOREIGN KEY ("buyerUserId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "InventoryReservation" ADD CONSTRAINT "InventoryReservation_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "RetailOrder" ("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PaymentAttempt" ADD CONSTRAINT "PaymentAttempt_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "RetailOrder" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PaymentTransaction" ADD CONSTRAINT "PaymentTransaction_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "RetailOrder" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PaymentTransaction" ADD CONSTRAINT "PaymentTransaction_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "PaymentAttempt" ("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PaymentWebhookEvent" ADD CONSTRAINT "PaymentWebhookEvent_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "PaymentAttempt" ("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "RetailRefund" ADD CONSTRAINT "RetailRefund_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "RetailOrder" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "RetailRefund" ADD CONSTRAINT "RetailRefund_sellerOrderId_fkey" FOREIGN KEY ("sellerOrderId") REFERENCES "SellerOrder" ("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "RetailRefund" ADD CONSTRAINT "RetailRefund_paymentTransactionId_fkey" FOREIGN KEY ("paymentTransactionId") REFERENCES "PaymentTransaction" ("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "RetailRefund" ADD CONSTRAINT "RetailRefund_requestedByUserId_fkey" FOREIGN KEY ("requestedByUserId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Shipment" ADD CONSTRAINT "Shipment_sellerOrderId_fkey" FOREIGN KEY ("sellerOrderId") REFERENCES "SellerOrder" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "TrackingEvent" ADD CONSTRAINT "TrackingEvent_shipmentId_fkey" FOREIGN KEY ("shipmentId") REFERENCES "Shipment" ("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ReturnRequest" ADD CONSTRAINT "ReturnRequest_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "RetailOrder" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ReturnRequest" ADD CONSTRAINT "ReturnRequest_sellerOrderId_orderId_fkey" FOREIGN KEY ("sellerOrderId", "orderId") REFERENCES "SellerOrder" ("id", "orderId") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ReturnRequest" ADD CONSTRAINT "ReturnRequest_buyerUserId_fkey" FOREIGN KEY ("buyerUserId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ReturnItem" ADD CONSTRAINT "ReturnItem_returnRequestId_fkey" FOREIGN KEY ("returnRequestId") REFERENCES "ReturnRequest" ("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ReturnItem" ADD CONSTRAINT "ReturnItem_orderItemId_fkey" FOREIGN KEY ("orderItemId") REFERENCES "RetailOrderItem" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;
CREATE INDEX "InventoryMovement_productId_createdAt_idx" ON "InventoryMovement" ("productId", "createdAt");
CREATE INDEX "InventoryMovement_movementType_createdAt_idx" ON "InventoryMovement" ("movementType", "createdAt");
CREATE INDEX "InventoryMovement_referenceType_referenceId_idx" ON "InventoryMovement" ("referenceType", "referenceId");
CREATE INDEX "InventoryMovement_actorUserId_createdAt_idx" ON "InventoryMovement" ("actorUserId", "createdAt");
CREATE INDEX "RetailOrder_buyerUserId_createdAt_idx" ON "RetailOrder" ("buyerUserId", "createdAt");
CREATE INDEX "RetailOrder_status_createdAt_idx" ON "RetailOrder" ("status", "createdAt");
CREATE INDEX "RetailOrder_paymentStatus_createdAt_idx" ON "RetailOrder" ("paymentStatus", "createdAt");
CREATE UNIQUE INDEX "SellerOrder_orderId_companyId_key" ON "SellerOrder" ("orderId", "companyId");
CREATE UNIQUE INDEX "SellerOrder_id_orderId_key" ON "SellerOrder" ("id", "orderId");
CREATE INDEX "SellerOrder_companyId_status_createdAt_idx" ON "SellerOrder" ("companyId", "status", "createdAt");
CREATE INDEX "SellerOrder_orderId_status_idx" ON "SellerOrder" ("orderId", "status");
CREATE INDEX "RetailOrderItem_orderId_idx" ON "RetailOrderItem" ("orderId");
CREATE INDEX "RetailOrderItem_sellerOrderId_idx" ON "RetailOrderItem" ("sellerOrderId");
CREATE INDEX "RetailOrderItem_productId_idx" ON "RetailOrderItem" ("productId");
CREATE INDEX "InventoryReservation_productId_status_expiresAt_idx" ON "InventoryReservation" ("productId", "status", "expiresAt");
CREATE INDEX "InventoryReservation_buyerUserId_createdAt_idx" ON "InventoryReservation" ("buyerUserId", "createdAt");
CREATE INDEX "InventoryReservation_orderId_idx" ON "InventoryReservation" ("orderId");
CREATE INDEX "PaymentAttempt_orderId_createdAt_idx" ON "PaymentAttempt" ("orderId", "createdAt");
CREATE INDEX "PaymentAttempt_provider_status_createdAt_idx" ON "PaymentAttempt" ("provider", "status", "createdAt");
CREATE UNIQUE INDEX "PaymentTransaction_provider_providerTransactionId_key" ON "PaymentTransaction" ("provider", "providerTransactionId");
CREATE INDEX "PaymentTransaction_orderId_createdAt_idx" ON "PaymentTransaction" ("orderId", "createdAt");
CREATE INDEX "PaymentTransaction_attemptId_idx" ON "PaymentTransaction" ("attemptId");
CREATE INDEX "PaymentTransaction_status_createdAt_idx" ON "PaymentTransaction" ("status", "createdAt");
CREATE UNIQUE INDEX "PaymentWebhookEvent_provider_providerEventId_key" ON "PaymentWebhookEvent" ("provider", "providerEventId");
CREATE INDEX "PaymentWebhookEvent_status_receivedAt_idx" ON "PaymentWebhookEvent" ("status", "receivedAt");
CREATE INDEX "PaymentWebhookEvent_attemptId_idx" ON "PaymentWebhookEvent" ("attemptId");
CREATE INDEX "RetailRefund_orderId_createdAt_idx" ON "RetailRefund" ("orderId", "createdAt");
CREATE INDEX "RetailRefund_sellerOrderId_status_idx" ON "RetailRefund" ("sellerOrderId", "status");
CREATE INDEX "RetailRefund_status_createdAt_idx" ON "RetailRefund" ("status", "createdAt");
CREATE INDEX "Shipment_sellerOrderId_createdAt_idx" ON "Shipment" ("sellerOrderId", "createdAt");
CREATE INDEX "Shipment_trackingNumber_idx" ON "Shipment" ("trackingNumber");
CREATE INDEX "Shipment_status_updatedAt_idx" ON "Shipment" ("status", "updatedAt");
CREATE INDEX "TrackingEvent_shipmentId_occurredAt_idx" ON "TrackingEvent" ("shipmentId", "occurredAt");
CREATE INDEX "ReturnRequest_orderId_status_idx" ON "ReturnRequest" ("orderId", "status");
CREATE INDEX "ReturnRequest_sellerOrderId_status_idx" ON "ReturnRequest" ("sellerOrderId", "status");
CREATE INDEX "ReturnRequest_buyerUserId_createdAt_idx" ON "ReturnRequest" ("buyerUserId", "createdAt");
CREATE UNIQUE INDEX "ReturnItem_returnRequestId_orderItemId_key" ON "ReturnItem" ("returnRequestId", "orderItemId");
CREATE INDEX "ReturnItem_orderItemId_idx" ON "ReturnItem" ("orderItemId");
ALTER TABLE "InventoryBalance" ADD CONSTRAINT "InventoryBalance_nonnegative_check" CHECK ("onHand" >= 0 AND "reserved" >= 0 AND "reserved" <= "onHand");
ALTER TABLE "InventoryMovement" ADD CONSTRAINT "InventoryMovement_nonzero_delta_check" CHECK ("quantityDelta" <> 0);
ALTER TABLE "InventoryReservation" ADD CONSTRAINT "InventoryReservation_positive_quantity_check" CHECK ("quantity" > 0);
ALTER TABLE "RetailOrder" ADD CONSTRAINT "RetailOrder_amounts_nonnegative_check" CHECK ("subtotal" >= 0 AND "discountTotal" >= 0 AND "shippingTotal" >= 0 AND "taxTotal" >= 0 AND "grandTotal" >= 0 AND "discountTotal" <= "subtotal");
ALTER TABLE "RetailOrder" ADD CONSTRAINT "RetailOrder_total_consistency_check" CHECK ("grandTotal" = "subtotal" - "discountTotal" + "shippingTotal" + "taxTotal");
ALTER TABLE "RetailOrderItem" ADD CONSTRAINT "RetailOrderItem_amount_quantity_check" CHECK ("quantity" > 0 AND "unitPrice" >= 0 AND "discountAmount" >= 0 AND "taxAmount" >= 0 AND "discountAmount" <= ("unitPrice" * "quantity") AND "lineTotal" = ("unitPrice" * "quantity") - "discountAmount" + "taxAmount");
ALTER TABLE "PaymentAttempt" ADD CONSTRAINT "PaymentAttempt_positive_amount_check" CHECK ("amount" > 0);
ALTER TABLE "PaymentTransaction" ADD CONSTRAINT "PaymentTransaction_positive_amount_check" CHECK ("amount" > 0);
ALTER TABLE "RetailRefund" ADD CONSTRAINT "RetailRefund_positive_amount_check" CHECK ("amount" > 0);
ALTER TABLE "ReturnItem" ADD CONSTRAINT "ReturnItem_positive_quantity_check" CHECK ("quantity" > 0);
CREATE OR REPLACE FUNCTION prevent_inventory_movement_mutation() RETURNS trigger AS $$
BEGIN RAISE EXCEPTION '% records are append-only', TG_TABLE_NAME; END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER "InventoryMovement_immutable" BEFORE UPDATE OR DELETE ON "InventoryMovement" FOR EACH ROW EXECUTE FUNCTION prevent_inventory_movement_mutation();
CREATE TRIGGER "TrackingEvent_immutable" BEFORE UPDATE OR DELETE ON "TrackingEvent" FOR EACH ROW EXECUTE FUNCTION prevent_inventory_movement_mutation();
