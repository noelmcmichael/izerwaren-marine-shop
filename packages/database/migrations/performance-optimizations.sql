-- Performance Optimization SQL Scripts for B2B Supplements Database
-- To be applied after Prisma schema migration
-- Author: Memex AI
-- Date: 2025-01-30

-- =============================================================================
-- FULL-TEXT SEARCH INDEXES
-- =============================================================================

-- Product search optimization with full-text search
CREATE INDEX IF NOT EXISTS idx_products_fulltext_search 
ON products USING GIN(
    to_tsvector('english', 
        COALESCE(title, '') || ' ' || 
        COALESCE(description, '') || ' ' || 
        COALESCE(vendor, '') || ' ' ||
        COALESCE(category_name, '')
    )
);

-- Technical specifications search optimization
CREATE INDEX IF NOT EXISTS idx_tech_specs_fulltext 
ON technical_specifications USING GIN(
    to_tsvector('english', 
        COALESCE(name, '') || ' ' || 
        COALESCE(value, '') || ' ' ||
        COALESCE(unit, '')
    )
);

-- =============================================================================
-- COMPOSITE INDEXES FOR HIGH-FREQUENCY QUERIES
-- =============================================================================

-- Account pricing lookup optimization (most critical for performance)
CREATE INDEX IF NOT EXISTS idx_account_pricing_active_lookup 
ON account_pricing (account_id, shopify_product_id, is_active, effective_from DESC) 
WHERE is_active = true;

-- Account pricing date range queries
CREATE INDEX IF NOT EXISTS idx_account_pricing_date_range 
ON account_pricing (effective_from, effective_until, is_active)
WHERE is_active = true;

-- RFQ management dashboard optimization
CREATE INDEX IF NOT EXISTS idx_rfq_status_priority_created 
ON rfq_requests (status, priority, created_at DESC);

-- RFQ assignment optimization for account reps
CREATE INDEX IF NOT EXISTS idx_rfq_assigned_rep_status 
ON rfq_requests (assigned_rep_id, status, created_at DESC)
WHERE assigned_rep_id IS NOT NULL;

-- Technical specifications filtering optimization
CREATE INDEX IF NOT EXISTS idx_tech_specs_category_searchable 
ON technical_specifications (category, is_searchable, value, product_id) 
WHERE is_searchable = true;

-- Product catalog browsing optimization
CREATE INDEX IF NOT EXISTS idx_products_catalog_browsing 
ON products (status, product_type, category_name, created_at DESC)
WHERE status = 'active';

-- Product variant availability optimization
CREATE INDEX IF NOT EXISTS idx_catalog_variants_available 
ON catalog_product_variants (product_id, is_active, inventory_qty)
WHERE is_active = true AND inventory_qty > 0;

-- Volume discount lookup optimization
CREATE INDEX IF NOT EXISTS idx_volume_discounts_lookup 
ON volume_discounts (shopify_product_id, min_quantity ASC);

-- =============================================================================
-- SPECIALIZED INDEXES FOR B2B OPERATIONS
-- =============================================================================

-- Account territory optimization for account reps
CREATE INDEX IF NOT EXISTS idx_accounts_territory_gin 
ON accounts USING GIN(territory_regions)
WHERE account_type = 'ACCOUNT_REP';

-- Shopping cart performance optimization
CREATE INDEX IF NOT EXISTS idx_cart_items_customer_updated 
ON cart_items (customer_id, updated_at DESC);

-- Saved cart browsing optimization
CREATE INDEX IF NOT EXISTS idx_saved_carts_customer_updated 
ON saved_carts (customer_id, updated_at DESC);

-- Product sync monitoring optimization
CREATE INDEX IF NOT EXISTS idx_product_sync_monitoring 
ON product_sync_log (operation, status, synced_at DESC);

-- Product image loading optimization
CREATE INDEX IF NOT EXISTS idx_product_images_loading 
ON product_images (product_id, is_primary DESC, image_order ASC)
WHERE file_exists = true;

-- =============================================================================
-- AUDIT AND COMPLIANCE INDEXES
-- =============================================================================

-- Audit log analysis optimization
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_time 
ON audit_logs (user_id, created_at DESC);

-- Audit log table analysis optimization
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_record 
ON audit_logs (table_name, record_id, created_at DESC);

-- =============================================================================
-- PARTITIONING STRATEGY (Future Implementation)
-- =============================================================================

-- Note: For future implementation when data volume grows
-- Consider partitioning audit_logs by month:
-- PARTITION BY RANGE (created_at)

-- Consider partitioning product_sync_log by month:
-- PARTITION BY RANGE (synced_at)

-- =============================================================================
-- INDEX MAINTENANCE COMMANDS
-- =============================================================================

-- Analyze tables to update statistics after index creation
ANALYZE accounts;
ANALYZE products;
ANALYZE account_pricing;
ANALYZE rfq_requests;
ANALYZE technical_specifications;
ANALYZE catalog_product_variants;
ANALYZE audit_logs;

-- =============================================================================
-- PERFORMANCE MONITORING VIEWS
-- =============================================================================

-- Create view for monitoring slow queries
CREATE OR REPLACE VIEW v_performance_monitoring AS
SELECT 
    schemaname,
    tablename,
    attname,
    n_distinct,
    correlation,
    most_common_vals,
    most_common_freqs
FROM pg_stats 
WHERE tablename IN (
    'accounts', 'products', 'account_pricing', 'rfq_requests', 
    'technical_specifications', 'catalog_product_variants'
)
ORDER BY tablename, attname;

-- Create view for index usage monitoring
CREATE OR REPLACE VIEW v_index_usage AS
SELECT 
    t.tablename,
    indexname,
    c.reltuples AS num_rows,
    pg_size_pretty(pg_relation_size(c.oid)) AS table_size,
    pg_size_pretty(pg_relation_size(i.indexrelid)) AS index_size,
    ROUND(s.idx_scan::numeric / GREATEST(s.seq_scan + s.idx_scan, 1) * 100, 2) AS index_usage_pct
FROM pg_tables t
LEFT JOIN pg_class c ON c.relname = t.tablename
LEFT JOIN pg_index ix ON c.oid = ix.indrelid
LEFT JOIN pg_class i ON i.oid = ix.indexrelid
LEFT JOIN pg_stat_user_indexes s ON s.indexrelid = i.oid
WHERE t.schemaname = 'public'
    AND t.tablename IN (
        'accounts', 'products', 'account_pricing', 'rfq_requests'
    )
ORDER BY t.tablename, indexname;