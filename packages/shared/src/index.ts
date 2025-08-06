// Types (with explicit exports to avoid conflicts)
export type { Product, ProductVariant, TechnicalSpecification } from './types/product';

export type { MediaAsset, ImageGallery, ProductPDF } from './types/media';

export type { Customer, CustomerSession } from './types/customer';

export type { CategoryMapping, OwnerCategory, OwnerCategoryName } from './types/Category';

export type {
  InventoryLocation,
  InventoryLevel,
  InventoryMovement,
} from './types/inventory';

// Schemas (with aliases to avoid conflicts)
export {
  ProductSchema,
  ProductVariantSchema,
  TechnicalSpecificationSchema,
} from './schemas/product';

export { MediaAssetSchema, ImageGallerySchema, ProductPDFSchema } from './schemas/media';

export {
  ApiResponseSchema,
  PaginationSchema,
  SearchParamsSchema,
  ProductSearchResponseSchema,
} from './schemas/api';

export type {
  ApiResponse,
  Pagination,
  SearchParams,
  ProductSearchResponse,
} from './schemas/api';

// Services
export {
  categoryMappingService,
  CategoryMappingService,
} from './services/categoryMappingService';

// Constants
export * from './constants/categoryMappings';

// Utilities
export * from './utils/validation';
export * from './utils/formatting';
