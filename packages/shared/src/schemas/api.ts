import { z } from 'zod';

export const ApiResponseSchema = z.object({
  success: z.boolean(),
  data: z.any().optional(),
  error: z.string().optional(),
  timestamp: z.string(),
});

export const PaginationSchema = z.object({
  page: z.number().min(1),
  limit: z.number().min(1).max(100),
  total: z.number().min(0),
  totalPages: z.number().min(0),
});

export const SearchParamsSchema = z.object({
  query: z.string().optional(),
  category: z.string().optional(),
  minPrice: z.number().min(0).optional(),
  maxPrice: z.number().min(0).optional(),
  manufacturer: z.string().optional(),
  inStock: z.boolean().optional(),
});

export const ProductSearchResponseSchema = z.object({
  products: z.array(z.any()), // Will be typed properly with Product schema
  pagination: PaginationSchema,
  filters: z.object({
    categories: z.array(z.string()),
    manufacturers: z.array(z.string()),
    priceRange: z.object({
      min: z.number(),
      max: z.number(),
    }),
  }),
});

export type ApiResponse<T = any> = z.infer<typeof ApiResponseSchema> & {
  data?: T;
};
export type Pagination = z.infer<typeof PaginationSchema>;
export type SearchParams = z.infer<typeof SearchParamsSchema>;
export type ProductSearchResponse = z.infer<typeof ProductSearchResponseSchema>;
