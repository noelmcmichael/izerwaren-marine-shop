// Enhanced Specification Types for Task 10
// Technical Specifications Display System

export type SpecImportance = 'CRITICAL' | 'IMPORTANT' | 'STANDARD' | 'AUXILIARY';
export type SpecDataType = 'TEXT' | 'NUMERIC' | 'RANGE' | 'BOOLEAN' | 'ENUM' | 'URL' | 'FILE';

export interface SpecificationCategory {
  id: string;
  name: string;
  displayName: string;
  description?: string;
  parentId?: string;
  displayOrder: number;
  icon?: string;
  color?: string;
  isCollapsible: boolean;
  isActiveByDefault: boolean;
  importance: SpecImportance;
  unitSystem?: string;
  applicableTypes: string[];
  children?: SpecificationCategory[];
}

export interface EnhancedTechnicalSpecification {
  id: string;
  productId: string;
  categoryId?: string;
  category?: SpecificationCategory;
  
  // Legacy fields (for backward compatibility)
  legacyCategory?: string;
  
  // Core specification data
  name: string;
  value: string;
  unit?: string;
  description?: string;
  dataType: SpecDataType;
  
  // Enhanced metadata
  displayOrder: number;
  importance: SpecImportance;
  isHighlighted: boolean;
  isSearchable: boolean;
  isComparable: boolean;
  
  // Numeric support for ranges and calculations
  numericValue?: number;
  numericMin?: number;
  numericMax?: number;
  
  // Version control and change tracking
  version: number;
  lastModified: Date;
  changeReason?: string;
  
  // Source and validation
  sourceSystem?: string;
  isValidated: boolean;
  validatedBy?: string;
  validatedAt?: Date;
  
  // Relationships
  unitConversions?: UnitConversion[];
  changeHistory?: SpecificationChangeLog[];
}

export interface UnitConversion {
  id: string;
  specificationId: string;
  fromUnit: string;
  toUnit: string;
  conversionFactor: number;
  conversionOffset: number;
  displayFormat?: string;
}

export interface SpecificationChangeLog {
  id: string;
  specificationId: string;
  changeType: 'CREATED' | 'VALUE_UPDATED' | 'UNIT_CHANGED' | 'CATEGORY_MOVED' | 'METADATA_UPDATED' | 'DELETED' | 'VALIDATED';
  oldValue?: string;
  newValue: string;
  oldUnit?: string;
  newUnit?: string;
  reason?: string;
  changedBy: string;
  changedAt: Date;
}

export interface StandardUnit {
  id: string;
  unit: string;
  unitType: string;
  systemType: 'metric' | 'imperial';
  displayName: string;
  symbol: string;
  baseUnit?: string;
  isBase: boolean;
}

export interface SpecificationPreferences {
  unitSystem: 'metric' | 'imperial' | 'both';
  collapsedCategories: string[];
  defaultExpanded: boolean;
  showAuxiliarySpecs: boolean;
  highlightChanges: boolean;
  compactView: boolean;
}

// Component Props Interfaces

export interface SpecificationDisplayProps {
  productId: string;
  specifications: EnhancedTechnicalSpecification[];
  categories?: SpecificationCategory[];
  showSearch?: boolean;
  showActions?: boolean;
  compactView?: boolean;
  onSpecificationUpdate?: (specification: EnhancedTechnicalSpecification) => void;
  onExport?: (format: 'pdf' | 'csv') => void;
  className?: string;
}

export interface SpecificationCategoryProps {
  category: SpecificationCategory;
  specifications: EnhancedTechnicalSpecification[];
  isCollapsed: boolean;
  onToggleCollapsed: (categoryId: string) => void;
  onSpecificationUpdate?: (update: SpecificationUpdateRequest) => void;
  searchTerm?: string;
  compactView?: boolean;
  showImportanceBadges?: boolean;
  className?: string;
}

export interface SpecificationItemProps {
  specification: EnhancedTechnicalSpecification;
  onUpdate?: (update: SpecificationUpdateRequest) => void;
  searchTerm?: string;
  compactView?: boolean;
  showImportanceBadge?: boolean;
  showUnitToggle?: boolean;
  editable?: boolean;
  className?: string;
}

export interface SpecificationSearchProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  filters: SpecificationFilters;
  onFiltersChange: (filters: SpecificationFilters) => void;
  availableCategories?: SpecificationCategory[];
  totalSpecs: number;
  filteredSpecs: number;
  placeholder?: string;
  className?: string;
}

export interface SpecificationActionsProps {
  specifications: EnhancedTechnicalSpecification[];
  onExport: (format: 'pdf' | 'csv') => void;
  onPrint: () => void;
  onShare?: () => void;
  disabled?: boolean;
  className?: string;
}

export interface SpecificationFilters {
  categories: string[];
  importance: SpecImportance[];
  dataTypes: SpecDataType[];
  validated: boolean | null;
  hasNumericValue: boolean | null;
  unitTypes: string[];
}

// API and Service Types

export interface SpecificationQuery {
  productId: string;
  categoryIds?: string[];
  importance?: SpecImportance[];
  searchTerm?: string;
  includeAuxiliary?: boolean;
  unitSystem?: 'metric' | 'imperial';
}

export interface SpecificationResponse {
  specifications: EnhancedTechnicalSpecification[];
  categories: SpecificationCategory[];
  totalCount: number;
  filteredCount: number;
  unitConversions: UnitConversion[];
}

export interface SpecificationUpdateRequest {
  id: string;
  value?: string;
  unit?: string;
  importance?: SpecImportance;
  isHighlighted?: boolean;
  categoryId?: string;
  reason?: string;
}

// Utility Types

export type SpecificationGrouping = {
  [categoryId: string]: {
    category: SpecificationCategory;
    specifications: EnhancedTechnicalSpecification[];
    count: number;
  };
};

export type SpecificationSortOption = 
  | 'importance'
  | 'alphabetical'
  | 'category'
  | 'lastModified'
  | 'dataType';

export type SpecificationViewMode = 'detailed' | 'compact' | 'comparison';

// Error Types
export interface SpecificationError {
  code: string;
  message: string;
  field?: string;
  specificationId?: string;
}