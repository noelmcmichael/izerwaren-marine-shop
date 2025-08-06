export interface InventoryLocation {
  id: number;
  shopify_location_id?: string;
  name: string;
  address: string;
  location_type: 'online' | 'retail' | 'warehouse';
  is_active: boolean;
}

export interface InventoryLevel {
  id: number;
  product_id: number;
  variant_id?: number;
  location_id: number;
  quantity: number;
  reserved_quantity: number;
  available_quantity: number;
  last_sync_at: Date;
  sync_status: 'synced' | 'pending' | 'error';
}

export interface InventoryMovement {
  id: number;
  product_id: number;
  location_id: number;
  movement_type: 'sale' | 'restock' | 'adjustment' | 'transfer';
  quantity_change: number;
  reason?: string;
  created_at: Date;
}
