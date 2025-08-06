import { prisma } from '../index';

export class MediaRepository {
  static async findImagesByProductId(productId: number) {
    return prisma.product_images.findMany({
      where: { product_id: productId },
      orderBy: { image_order: 'asc' },
    });
  }

  static async findPDFsByProductId(productId: number) {
    return prisma.product_pdfs.findMany({
      where: { product_id: productId },
      orderBy: { created_at: 'desc' },
    });
  }

  static async createImage(data: any) {
    return prisma.product_images.create({ data });
  }

  static async createPDF(data: any) {
    return prisma.product_pdfs.create({ data });
  }

  static async updateImage(id: number, data: any) {
    return prisma.product_images.update({
      where: { id },
      data,
    });
  }

  static async updatePDF(id: number, data: any) {
    return prisma.product_pdfs.update({
      where: { id },
      data,
    });
  }

  static async deleteImage(id: number) {
    return prisma.product_images.delete({
      where: { id },
    });
  }

  static async deletePDF(id: number) {
    return prisma.product_pdfs.delete({
      where: { id },
    });
  }

  static async getImageStats() {
    const stats = await prisma.product_images.aggregate({
      _count: { id: true },
      _sum: { file_size: true },
    });

    const productCounts = await prisma.product_images.groupBy({
      by: ['product_id'],
      _count: { id: true },
    });

    return {
      totalImages: stats._count.id || 0,
      totalSize: stats._sum.file_size || 0,
      productsWithImages: productCounts.length,
      averageImagesPerProduct:
        productCounts.length > 0 ? (stats._count.id || 0) / productCounts.length : 0,
    };
  }

  static async getPDFStats() {
    const stats = await prisma.product_pdfs.aggregate({
      _count: { id: true },
      _sum: { file_size: true },
    });

    return {
      totalPDFs: stats._count.id || 0,
      totalSize: stats._sum.file_size || 0,
    };
  }
}
