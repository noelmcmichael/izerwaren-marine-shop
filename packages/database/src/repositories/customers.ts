import { prisma } from '../index';

export class CustomerRepository {
  static async findMany(options?: { skip?: number; take?: number; where?: any }) {
    return prisma.dealers.findMany(options);
  }

  static async findById(id: number) {
    return prisma.dealers.findUnique({
      where: { id },
      include: {
        dealer_pricing: true,
        rfq_requests: true,
      },
    });
  }

  static async findByEmail(email: string) {
    return prisma.dealers.findUnique({
      where: { email },
      include: {
        dealer_pricing: true,
      },
    });
  }

  static async findByFirebaseUid(firebaseUid: string) {
    return prisma.dealers.findUnique({
      where: { firebase_uid: firebaseUid },
      include: {
        dealer_pricing: true,
      },
    });
  }

  static async findByShopifyId(shopifyCustomerId: string) {
    return prisma.dealers.findFirst({
      where: { shopify_customer_id: shopifyCustomerId },
      include: {
        dealer_pricing: true,
      },
    });
  }

  static async create(data: any) {
    return prisma.dealers.create({ data });
  }

  static async update(id: number, data: any) {
    return prisma.dealers.update({
      where: { id },
      data,
    });
  }

  static async delete(id: number) {
    return prisma.dealers.delete({
      where: { id },
    });
  }

  static async getCustomerStats() {
    const stats = await prisma.dealers.aggregate({
      _count: { id: true },
    });

    const tierCounts = await prisma.dealers.groupBy({
      by: ['tier'],
      _count: { id: true },
    });

    return {
      totalCustomers: stats._count.id || 0,
      tierDistribution: tierCounts.reduce(
        (acc, tier) => {
          acc[tier.tier || 'unknown'] = tier._count.id;
          return acc;
        },
        {} as Record<string, number>
      ),
    };
  }
}
