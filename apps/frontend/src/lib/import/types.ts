// Import service types for Revival API integration

export interface RevivalProduct {
  sku: string;
  name: string;
  description?: string;
  price: number;
  retail_price?: number;
  part_number?: string;
  availability?: string;
  category_name?: string;
  category_type?: string;
  category_id?: string;
  source_url?: string;
  has_crawler_data: boolean;
  image_count: number;
  primary_image_path?: string;
  created_at: string;
  main_category?: string;
  main_category_id?: string;
  has_catalog: boolean;
  has_specifications: boolean;
}

export interface RevivalVariantData {
  product: {
    sku: string;
    name: string;
    description?: string;
    price: number;
  };
  has_variants: boolean;
  variant_count: number;
  variants: Record<string, VariantGroup>;
  product_type: 'simple' | 'variable';
  extraction_date: string;
}

export interface VariantGroup {
  label: string;
  options: VariantOption[];
  option_count: number;
}

export interface VariantOption {
  value: string;
  text: string;
}

export interface RevivalVariableProduct {
  sku: string;
  name: string;
  price: number;
  variant_count: number;
  variants_json: string;
  variant_groups: string[];
  total_combinations: number;
}

export interface RevivalTechnicalSpec {
  product: {
    sku: string;
    name: string;
  };
  technical_specifications: Record<string, TechnicalSpecEntry[]>;
}

export interface TechnicalSpecEntry {
  spec_category: string;
  spec_name: string;
  spec_value: string;
  spec_unit?: string;
  is_searchable: boolean;
}

export interface ImportProgress {
  phase: string;
  current: number;
  total: number;
  status: 'pending' | 'in_progress' | 'completed' | 'error';
  message?: string;
}

export interface ImportResult {
  success: boolean;
  message: string;
  stats?: {
    simpleProducts: number;
    variableProducts: number;
    variantGroups: number;
    variantOptions: number;
    productVariants: number;
    technicalSpecs: number;
    images: number;
    catalogs: number;
  };
  errors?: string[];
}
