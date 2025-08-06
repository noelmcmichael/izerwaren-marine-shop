-- CreateEnum
CREATE TYPE "AccountType" AS ENUM ('DEALER', 'PRO', 'ACCOUNT_REP');

-- CreateEnum
CREATE TYPE "AccountTier" AS ENUM ('STANDARD', 'PREMIUM', 'ENTERPRISE');

-- CreateEnum
CREATE TYPE "DealerTier" AS ENUM ('STANDARD', 'PREMIUM', 'ENTERPRISE');

-- CreateEnum
CREATE TYPE "RfqStatus" AS ENUM ('PENDING', 'IN_REVIEW', 'QUOTED', 'ACCEPTED', 'DECLINED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "RfqPriority" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "SyncOperation" AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'SKIP');

-- CreateEnum
CREATE TYPE "SyncStatus" AS ENUM ('SUCCESS', 'FAILED', 'PARTIAL');

-- CreateEnum
CREATE TYPE "ProductTypeEnum" AS ENUM ('SIMPLE', 'VARIABLE');

-- CreateTable
CREATE TABLE "accounts" (
    "id" TEXT NOT NULL,
    "firebase_uid" TEXT NOT NULL,
    "account_type" "AccountType" NOT NULL,
    "company_name" TEXT,
    "contact_email" TEXT NOT NULL,
    "contact_phone" TEXT,
    "tier" "AccountTier",
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "territory_regions" TEXT[],
    "max_rfq_capacity" INTEGER,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dealers" (
    "id" TEXT NOT NULL,
    "firebase_uid" TEXT NOT NULL,
    "company_name" TEXT NOT NULL,
    "contact_email" TEXT NOT NULL,
    "contact_phone" TEXT,
    "tier" "DealerTier" NOT NULL DEFAULT 'STANDARD',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dealers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "account_shopify_customers" (
    "id" TEXT NOT NULL,
    "account_id" TEXT NOT NULL,
    "shopify_customer_id" TEXT NOT NULL,

    CONSTRAINT "account_shopify_customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dealer_shopify_customers" (
    "id" TEXT NOT NULL,
    "dealer_id" TEXT NOT NULL,
    "shopify_customer_id" TEXT NOT NULL,

    CONSTRAINT "dealer_shopify_customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "account_pricing" (
    "id" TEXT NOT NULL,
    "account_id" TEXT NOT NULL,
    "shopify_product_id" TEXT NOT NULL,
    "shopify_variant_id" TEXT,
    "markdown_percent" DECIMAL(5,2) NOT NULL,
    "fixed_price" DECIMAL(10,2),
    "min_quantity" INTEGER NOT NULL DEFAULT 1,
    "max_quantity" INTEGER,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "effective_from" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "effective_until" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "product_id" TEXT,

    CONSTRAINT "account_pricing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dealer_pricing" (
    "id" TEXT NOT NULL,
    "dealer_id" TEXT NOT NULL,
    "shopify_product_id" TEXT NOT NULL,
    "shopify_variant_id" TEXT,
    "markdown_percent" DECIMAL(5,2) NOT NULL,
    "fixed_price" DECIMAL(10,2),
    "min_quantity" INTEGER NOT NULL DEFAULT 1,
    "max_quantity" INTEGER,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "effective_from" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "effective_until" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dealer_pricing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rfq_requests" (
    "id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "assigned_rep_id" TEXT,
    "request_number" TEXT NOT NULL,
    "status" "RfqStatus" NOT NULL DEFAULT 'PENDING',
    "priority" "RfqPriority" NOT NULL DEFAULT 'NORMAL',
    "customer_message" TEXT NOT NULL,
    "admin_notes" TEXT,
    "quoted_total" DECIMAL(10,2),
    "valid_until" TIMESTAMP(3),
    "shopify_order_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "dealer_id" TEXT,

    CONSTRAINT "rfq_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rfq_items" (
    "id" TEXT NOT NULL,
    "rfq_request_id" TEXT NOT NULL,
    "shopify_product_id" TEXT NOT NULL,
    "shopify_variant_id" TEXT,
    "sku" TEXT NOT NULL,
    "product_title" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unit_price" DECIMAL(10,2),
    "total_price" DECIMAL(10,2),
    "notes" TEXT,
    "product_variant_id" TEXT,
    "variant_sku" TEXT,
    "variant_title" TEXT,
    "selected_options" JSONB,

    CONSTRAINT "rfq_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" TEXT NOT NULL,
    "shopify_product_id" TEXT,
    "title" TEXT NOT NULL,
    "handle" TEXT NOT NULL,
    "vendor" TEXT,
    "product_type" "ProductTypeEnum" NOT NULL DEFAULT 'SIMPLE',
    "tags" TEXT[],
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "sku" TEXT,
    "price" DECIMAL(10,2),
    "retail_price" DECIMAL(10,2),
    "part_number" TEXT,
    "category_name" TEXT,
    "availability" TEXT,
    "image_count" INTEGER,
    "primary_image_path" TEXT,
    "has_variants" BOOLEAN NOT NULL DEFAULT false,
    "variant_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_variants" (
    "id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "shopify_variant_id" TEXT NOT NULL,
    "sku" TEXT,
    "title" TEXT NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "compare_at_price" DECIMAL(10,2),
    "inventory_qty" INTEGER NOT NULL DEFAULT 0,
    "weight" DECIMAL(8,2),
    "weight_unit" TEXT,

    CONSTRAINT "product_variants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_sync_log" (
    "id" TEXT NOT NULL,
    "product_id" TEXT,
    "shopify_product_id" TEXT,
    "operation" "SyncOperation" NOT NULL,
    "status" "SyncStatus" NOT NULL,
    "error_message" TEXT,
    "source_data" JSONB,
    "synced_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_sync_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_variant_groups" (
    "id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "input_type" TEXT NOT NULL DEFAULT 'dropdown',
    "required" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER,

    CONSTRAINT "product_variant_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_variant_options" (
    "id" TEXT NOT NULL,
    "variant_group_id" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "display_text" TEXT NOT NULL,
    "price_modifier" DECIMAL(10,2) DEFAULT 0,
    "sort_order" INTEGER,

    CONSTRAINT "product_variant_options_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "catalog_product_variants" (
    "id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "price" DECIMAL(10,2),
    "inventory_qty" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "catalog_product_variants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_variant_selections" (
    "id" TEXT NOT NULL,
    "variant_id" TEXT NOT NULL,
    "option_id" TEXT NOT NULL,

    CONSTRAINT "product_variant_selections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "technical_specifications" (
    "id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "unit" TEXT,
    "is_searchable" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "technical_specifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_images" (
    "id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "image_url" TEXT,
    "local_path" TEXT NOT NULL,
    "image_order" INTEGER,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "file_exists" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "product_images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_catalogs" (
    "id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "pdf_url" TEXT NOT NULL,
    "local_pdf_path" TEXT,
    "file_size" INTEGER,
    "download_status" TEXT NOT NULL DEFAULT 'pending',

    CONSTRAINT "product_catalogs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cart_items" (
    "id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "shopify_product_id" TEXT NOT NULL,
    "shopify_variant_id" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unit_price" DECIMAL(10,2) NOT NULL,
    "total_price" DECIMAL(10,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cart_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "saved_carts" (
    "id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "item_count" INTEGER NOT NULL DEFAULT 0,
    "total_value" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "saved_carts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "saved_cart_items" (
    "id" TEXT NOT NULL,
    "saved_cart_id" TEXT NOT NULL,
    "shopify_product_id" TEXT NOT NULL,
    "shopify_variant_id" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unit_price" DECIMAL(10,2) NOT NULL,
    "total_price" DECIMAL(10,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "saved_cart_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "volume_discounts" (
    "id" TEXT NOT NULL,
    "shopify_product_id" TEXT NOT NULL,
    "min_quantity" INTEGER NOT NULL,
    "discount_percent" DECIMAL(5,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "volume_discounts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "accounts_firebase_uid_key" ON "accounts"("firebase_uid");

-- CreateIndex
CREATE UNIQUE INDEX "dealers_firebase_uid_key" ON "dealers"("firebase_uid");

-- CreateIndex
CREATE UNIQUE INDEX "account_shopify_customers_account_id_shopify_customer_id_key" ON "account_shopify_customers"("account_id", "shopify_customer_id");

-- CreateIndex
CREATE UNIQUE INDEX "dealer_shopify_customers_dealer_id_shopify_customer_id_key" ON "dealer_shopify_customers"("dealer_id", "shopify_customer_id");

-- CreateIndex
CREATE UNIQUE INDEX "account_pricing_account_id_shopify_product_id_shopify_varia_key" ON "account_pricing"("account_id", "shopify_product_id", "shopify_variant_id");

-- CreateIndex
CREATE UNIQUE INDEX "dealer_pricing_dealer_id_shopify_product_id_shopify_variant_key" ON "dealer_pricing"("dealer_id", "shopify_product_id", "shopify_variant_id");

-- CreateIndex
CREATE UNIQUE INDEX "rfq_requests_request_number_key" ON "rfq_requests"("request_number");

-- CreateIndex
CREATE UNIQUE INDEX "products_shopify_product_id_key" ON "products"("shopify_product_id");

-- CreateIndex
CREATE UNIQUE INDEX "products_handle_key" ON "products"("handle");

-- CreateIndex
CREATE UNIQUE INDEX "products_sku_key" ON "products"("sku");

-- CreateIndex
CREATE UNIQUE INDEX "product_variants_shopify_variant_id_key" ON "product_variants"("shopify_variant_id");

-- CreateIndex
CREATE UNIQUE INDEX "product_variants_sku_key" ON "product_variants"("sku");

-- CreateIndex
CREATE UNIQUE INDEX "product_variant_groups_product_id_name_key" ON "product_variant_groups"("product_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "product_variant_options_variant_group_id_value_key" ON "product_variant_options"("variant_group_id", "value");

-- CreateIndex
CREATE UNIQUE INDEX "catalog_product_variants_sku_key" ON "catalog_product_variants"("sku");

-- CreateIndex
CREATE UNIQUE INDEX "product_variant_selections_variant_id_option_id_key" ON "product_variant_selections"("variant_id", "option_id");

-- CreateIndex
CREATE UNIQUE INDEX "technical_specifications_product_id_category_value_key" ON "technical_specifications"("product_id", "category", "value");

-- CreateIndex
CREATE UNIQUE INDEX "product_images_product_id_local_path_key" ON "product_images"("product_id", "local_path");

-- CreateIndex
CREATE UNIQUE INDEX "product_catalogs_product_id_key" ON "product_catalogs"("product_id");

-- CreateIndex
CREATE UNIQUE INDEX "cart_items_customer_id_shopify_variant_id_key" ON "cart_items"("customer_id", "shopify_variant_id");

-- CreateIndex
CREATE UNIQUE INDEX "volume_discounts_shopify_product_id_min_quantity_key" ON "volume_discounts"("shopify_product_id", "min_quantity");

-- AddForeignKey
ALTER TABLE "account_shopify_customers" ADD CONSTRAINT "account_shopify_customers_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dealer_shopify_customers" ADD CONSTRAINT "dealer_shopify_customers_dealer_id_fkey" FOREIGN KEY ("dealer_id") REFERENCES "dealers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account_pricing" ADD CONSTRAINT "account_pricing_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account_pricing" ADD CONSTRAINT "account_pricing_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dealer_pricing" ADD CONSTRAINT "dealer_pricing_dealer_id_fkey" FOREIGN KEY ("dealer_id") REFERENCES "dealers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rfq_requests" ADD CONSTRAINT "rfq_requests_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rfq_requests" ADD CONSTRAINT "rfq_requests_assigned_rep_id_fkey" FOREIGN KEY ("assigned_rep_id") REFERENCES "accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rfq_requests" ADD CONSTRAINT "rfq_requests_dealer_id_fkey" FOREIGN KEY ("dealer_id") REFERENCES "dealers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rfq_items" ADD CONSTRAINT "rfq_items_rfq_request_id_fkey" FOREIGN KEY ("rfq_request_id") REFERENCES "rfq_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rfq_items" ADD CONSTRAINT "rfq_items_product_variant_id_fkey" FOREIGN KEY ("product_variant_id") REFERENCES "catalog_product_variants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_sync_log" ADD CONSTRAINT "product_sync_log_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_variant_groups" ADD CONSTRAINT "product_variant_groups_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_variant_options" ADD CONSTRAINT "product_variant_options_variant_group_id_fkey" FOREIGN KEY ("variant_group_id") REFERENCES "product_variant_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "catalog_product_variants" ADD CONSTRAINT "catalog_product_variants_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_variant_selections" ADD CONSTRAINT "product_variant_selections_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "catalog_product_variants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_variant_selections" ADD CONSTRAINT "product_variant_selections_option_id_fkey" FOREIGN KEY ("option_id") REFERENCES "product_variant_options"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "technical_specifications" ADD CONSTRAINT "technical_specifications_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_images" ADD CONSTRAINT "product_images_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_catalogs" ADD CONSTRAINT "product_catalogs_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "dealers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_shopify_product_id_fkey" FOREIGN KEY ("shopify_product_id") REFERENCES "products"("shopify_product_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saved_carts" ADD CONSTRAINT "saved_carts_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "dealers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saved_cart_items" ADD CONSTRAINT "saved_cart_items_saved_cart_id_fkey" FOREIGN KEY ("saved_cart_id") REFERENCES "saved_carts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saved_cart_items" ADD CONSTRAINT "saved_cart_items_shopify_product_id_fkey" FOREIGN KEY ("shopify_product_id") REFERENCES "products"("shopify_product_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "volume_discounts" ADD CONSTRAINT "volume_discounts_shopify_product_id_fkey" FOREIGN KEY ("shopify_product_id") REFERENCES "products"("shopify_product_id") ON DELETE CASCADE ON UPDATE CASCADE;

