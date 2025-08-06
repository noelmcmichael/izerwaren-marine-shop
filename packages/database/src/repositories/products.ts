import { prisma } from '../index';

export class ProductRepository {
  static async findMany(options?: {
    skip?: number;
    take?: number;
    where?: any;
    include?: any;
  }) {
    return prisma.products.findMany(options);
  }

  static async findById(id: number) {
    return prisma.products.findUnique({
      where: { id },
      include: {
        product_variants: true,
        technical_specifications: true,
        product_images: true,
        product_pdfs: true,
      },
    });
  }

  static async findByShopifyId(shopifyProductId: string) {
    return prisma.products.findFirst({
      where: { shopify_product_id: shopifyProductId },
      include: {
        product_variants: true,
        technical_specifications: true,
        product_images: true,
        product_pdfs: true,
      },
    });
  }

  static async create(data: any) {
    return prisma.products.create({ data });
  }

  static async update(id: number, data: any) {
    return prisma.products.update({
      where: { id },
      data,
    });
  }

  static async delete(id: number) {
    return prisma.products.delete({
      where: { id },
    });
  }

  static async getCategories() {
    const categories = await prisma.products.findMany({
      select: {
        category_name: true,
      },
      distinct: ['category_name'],
      where: {
        category_name: {
          not: null,
        },
      },
    });

    return categories.map(cat => cat.category_name).filter(Boolean);
  }

  static async getManufacturers() {
    const manufacturers = await prisma.products.findMany({
      select: {
        manufacturer: true,
      },
      distinct: ['manufacturer'],
      where: {
        manufacturer: {
          not: null,
        },
      },
    });

    return manufacturers.map(mfg => mfg.manufacturer).filter(Boolean);
  }
}
