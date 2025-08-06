// Enhanced Technical Specifications Components
// Task 10: Technical Specifications Display System

export { SpecificationDisplay } from './SpecificationDisplay';
export { SpecificationCategory } from './SpecificationCategory';
export { SpecificationItem } from './SpecificationItem';
export { SpecificationSearch } from './SpecificationSearch';
export { SpecificationActions } from './SpecificationActions';

// Types
export type {
  EnhancedTechnicalSpecification,
  SpecificationCategory as SpecificationCategoryType,
  SpecificationDisplayProps,
  SpecificationCategoryProps,
  SpecificationItemProps,
  SpecificationSearchProps,
  SpecificationActionsProps,
  SpecImportance,
  SpecDataType,
  UnitConversion,
  SpecificationPreferences
} from './types';

// Hooks
export { useSpecifications } from './hooks/useSpecifications';
export { useSpecificationPreferences } from './hooks/useSpecificationPreferences';
export { useUnitConversion } from './hooks/useUnitConversion';