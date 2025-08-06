import { z } from 'zod';

export const ProductSchema = z.object({
  id: z.number(),
  shopify_product_id: z.string().optional(),
  title: z.string(),
  description: z.string().optional(),
  price: z.number().positive(),
  category_name: z.string(),
  manufacturer: z.string().optional(),
  sku: z.string(),
  status: z.enum(['active', 'draft', 'archived']),
  created_at: z.date(),
  updated_at: z.date(),
});

export const ProductVariantSchema = z.object({
  id: z.number(),
  product_id: z.number(),
  shopify_variant_id: z.string().optional(),
  title: z.string(),
  price: z.number().positive(),
  sku: z.string(),
  inventory_quantity: z.number().min(0),
  variant_options: z.record(z.string()),
  created_at: z.date(),
  updated_at: z.date(),
});

export const TechnicalSpecificationSchema = z.object({
  id: z.number(),
  product_id: z.number(),
  specification: z.string(),
  value: z.string(),
  unit: z.string().optional(),
  category: z.string().optional(),
  created_at: z.date(),
});

export type Product = z.infer<typeof ProductSchema>;
export type ProductVariant = z.infer<typeof ProductVariantSchema>;
export type TechnicalSpecification = z.infer<typeof TechnicalSpecificationSchema>;
