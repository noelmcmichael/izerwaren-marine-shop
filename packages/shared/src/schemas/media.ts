import { z } from 'zod';

export const MediaAssetSchema = z.object({
  id: z.number(),
  shopify_product_id: z.string().optional(),
  local_product_id: z.number(),
  asset_type: z.enum(['primary', 'gallery', 'pdf']),
  storage_tier: z.enum(['shopify', 'external_cdn', 'secure_docs']),
  file_url: z.string().url(),
  cdn_url: z.string().url().optional(),
  file_path: z.string().optional(),
  file_size: z.number().positive().optional(),
  mime_type: z.string(),
  image_order: z.number().optional(),
  created_at: z.date(),
  updated_at: z.date(),
});

export const ImageGallerySchema = z.object({
  product_id: z.number(),
  primary_image: MediaAssetSchema.optional(),
  gallery_images: z.array(MediaAssetSchema),
  total_images: z.number().min(0),
});

export const ProductPDFSchema = z.object({
  id: z.number(),
  product_id: z.number(),
  title: z.string(),
  file_url: z.string().url(),
  signed_url: z.string().url().optional(),
  file_size: z.number().positive(),
  download_count: z.number().min(0),
  access_level: z.enum(['public', 'customer', 'premium']),
  created_at: z.date(),
});

export type MediaAsset = z.infer<typeof MediaAssetSchema>;
export type ImageGallery = z.infer<typeof ImageGallerySchema>;
export type ProductPDF = z.infer<typeof ProductPDFSchema>;
