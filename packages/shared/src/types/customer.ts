export interface Customer {
  id: number;
  shopify_customer_id?: string;
  email: string;
  first_name: string;
  last_name: string;
  company?: string;
  customer_type: 'retail' | 'wholesale' | 'premium';
  pricing_tier: 'standard' | 'discounted' | 'premium';
  credit_limit?: number;
  payment_terms?: string;
  created_at: Date;
  updated_at: Date;
}

export interface CustomerSession {
  customer_id: number;
  session_token: string;
  expires_at: Date;
  permissions: string[];
}
