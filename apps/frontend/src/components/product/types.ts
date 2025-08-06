// Product component types

export interface Product {
  id: string;
  sku: string;
  title: string;
  description?: string;
  price: number;
  retailPrice?: number;
  handle: string;
  productType: 'SIMPLE' | 'VARIABLE';
  hasVariants: boolean;
  variantCount: number;
  tags: string[];
  status: string;
  variantGroups?: VariantGroup[];
  productVariants?: ProductVariant[];
  technicalSpecs?: TechnicalSpecification[];
}

export interface VariantGroup {
  id: string;
  name: string;
  label: string;
  inputType: 'radio' | 'dropdown';
  required: boolean;
  sortOrder?: number;
  options: VariantOption[];
}

export interface VariantOption {
  id: string;
  value: string;
  displayText: string;
  priceModifier?: number;
  sortOrder?: number;
}

export interface ProductVariant {
  id: string;
  sku: string;
  title: string;
  price?: number;
  isActive: boolean;
  selections: VariantSelection[];
}

export interface VariantSelection {
  id: string;
  variantId: string;
  optionId: string;
  option: VariantOption & {
    variantGroup: VariantGroup;
  };
}

export interface TechnicalSpecification {
  id: string;
  category: string;
  name: string;
  value: string;
  unit?: string;
  isSearchable: boolean;
}

export interface VariantConfigurationState {
  productId: string;
  selectedOptions: Record<string, string>; // groupName -> optionValue
  isValid: boolean;
  selectedVariant?: ProductVariant;
  totalPrice: number;
  priceModifiers: number;
}

export interface ProductDisplayProps {
  product: Product;
  account?: {
    id: string;
    tier: 'STANDARD' | 'PREMIUM' | 'ENTERPRISE';
  };
  onAddToCart?: (variant?: ProductVariant) => void;
  onRequestQuote?: (variant?: ProductVariant) => void;
}
