-- Migration: Create cart tables for B2B bulk ordering
-- Version: 005
-- Description: Add cart_items, saved_carts, and saved_cart_items tables

-- Create cart_items table for active customer carts
CREATE TABLE IF NOT EXISTS cart_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL,
    shopify_product_id VARCHAR(255) NOT NULL,
    shopify_variant_id VARCHAR(255) NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Foreign key constraints
    CONSTRAINT fk_cart_items_customer 
        FOREIGN KEY (customer_id) REFERENCES dealers(id) ON DELETE CASCADE,
    CONSTRAINT fk_cart_items_product 
        FOREIGN KEY (shopify_product_id) REFERENCES products(shopify_product_id) ON DELETE CASCADE,
    
    -- Unique constraint to prevent duplicate variants per customer
    UNIQUE(customer_id, shopify_variant_id)
);

-- Create saved_carts table for customer saved cart collections
CREATE TABLE IF NOT EXISTS saved_carts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL,
    name VARCHAR(100) NOT NULL,
    item_count INTEGER NOT NULL DEFAULT 0,
    total_value DECIMAL(10,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Foreign key constraints
    CONSTRAINT fk_saved_carts_customer 
        FOREIGN KEY (customer_id) REFERENCES dealers(id) ON DELETE CASCADE
);

-- Create saved_cart_items table for items within saved carts
CREATE TABLE IF NOT EXISTS saved_cart_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    saved_cart_id UUID NOT NULL,
    shopify_product_id VARCHAR(255) NOT NULL,
    shopify_variant_id VARCHAR(255) NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Foreign key constraints
    CONSTRAINT fk_saved_cart_items_cart 
        FOREIGN KEY (saved_cart_id) REFERENCES saved_carts(id) ON DELETE CASCADE,
    CONSTRAINT fk_saved_cart_items_product 
        FOREIGN KEY (shopify_product_id) REFERENCES products(shopify_product_id) ON DELETE CASCADE
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_cart_items_customer_id ON cart_items(customer_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_product_id ON cart_items(shopify_product_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_variant_id ON cart_items(shopify_variant_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_created_at ON cart_items(created_at);

CREATE INDEX IF NOT EXISTS idx_saved_carts_customer_id ON saved_carts(customer_id);
CREATE INDEX IF NOT EXISTS idx_saved_carts_created_at ON saved_carts(created_at);

CREATE INDEX IF NOT EXISTS idx_saved_cart_items_cart_id ON saved_cart_items(saved_cart_id);
CREATE INDEX IF NOT EXISTS idx_saved_cart_items_product_id ON saved_cart_items(shopify_product_id);

-- Add trigger to update cart_items.updated_at on changes
CREATE OR REPLACE FUNCTION update_cart_items_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER cart_items_updated_at
    BEFORE UPDATE ON cart_items
    FOR EACH ROW
    EXECUTE FUNCTION update_cart_items_updated_at();

-- Add trigger to update saved_carts.updated_at on changes
CREATE OR REPLACE FUNCTION update_saved_carts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER saved_carts_updated_at
    BEFORE UPDATE ON saved_carts
    FOR EACH ROW
    EXECUTE FUNCTION update_saved_carts_updated_at();

-- Comments for documentation
COMMENT ON TABLE cart_items IS 'Active cart items for B2B customers';
COMMENT ON TABLE saved_carts IS 'Saved cart collections for customer reuse';
COMMENT ON TABLE saved_cart_items IS 'Items within saved cart collections';

COMMENT ON COLUMN cart_items.customer_id IS 'Reference to dealers table';
COMMENT ON COLUMN cart_items.shopify_product_id IS 'Shopify product identifier';
COMMENT ON COLUMN cart_items.shopify_variant_id IS 'Shopify variant identifier';
COMMENT ON COLUMN cart_items.quantity IS 'Ordered quantity';
COMMENT ON COLUMN cart_items.unit_price IS 'Price per unit at time of adding to cart';
COMMENT ON COLUMN cart_items.total_price IS 'Total price (quantity * unit_price)';

COMMENT ON COLUMN saved_carts.name IS 'User-defined name for the saved cart';
COMMENT ON COLUMN saved_carts.item_count IS 'Number of items in the saved cart';
COMMENT ON COLUMN saved_carts.total_value IS 'Total value of all items in the saved cart';