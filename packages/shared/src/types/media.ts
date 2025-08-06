export interface MediaAsset {
  id: number;
  shopify_product_id?: string;
  local_product_id: number;
  asset_type: 'primary' | 'gallery' | 'pdf';
  storage_tier: 'shopify' | 'external_cdn' | 'secure_docs';
  file_url: string;
  cdn_url?: string;
  file_path?: string;
  file_size?: number;
  mime_type: string;
  image_order?: number;
  created_at: Date;
  updated_at: Date;
}

export interface ImageGallery {
  product_id: number;
  primary_image?: MediaAsset;
  gallery_images: MediaAsset[];
  total_images: number;
}

export interface ProductPDF {
  id: number;
  product_id: number;
  title: string;
  file_url: string;
  signed_url?: string;
  file_size: number;
  download_count: number;
  access_level: 'public' | 'customer' | 'premium';
  created_at: Date;
}
