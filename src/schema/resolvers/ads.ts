import { Context } from './types';

export const adResolvers = {
  // Queries
  userAds: async (_: any, __: any, context: Context) => {
    if (!context.user) {
      throw new Error('Not authenticated');
    }

    if (context.user.role === 'admin') {
      // Admin can see all ads
      return await context.prisma.ad.findMany({
        include: {
          user: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
    } else {
      // Regular users see only their ads
      return await context.prisma.ad.findMany({
        where: {
          userId: context.user.id,
        },
        include: {
          user: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
    }
  },

  allAds: async (_: any, __: any, context: Context) => {
    if (!context.user || context.user.role !== 'admin') {
      throw new Error('Admin access required');
    }

    return await context.prisma.ad.findMany({
      include: {
        user: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  },

  ad: async (_: any, { id }: { id: number }, context: Context) => {
    if (!context.user) {
      throw new Error('Not authenticated');
    }

    const ad = await context.prisma.ad.findUnique({
      where: { id },
      include: {
        user: true,
      },
    });

    if (!ad) {
      throw new Error('Ad not found');
    }

    // Only admin or the ad owner can view
    if (context.user.role !== 'admin' && ad.userId !== context.user.id) {
      throw new Error('Not authorized');
    }

    return {
      ...ad,
      createdAt: ad.createdAt.toISOString(),
      updatedAt: ad.updatedAt.toISOString(),
    };
  },

  adWithAssignments: async (_: any, { adId }: { adId: number }, context: Context) => {
    if (!context.user || context.user.role !== 'admin') {
      throw new Error('Admin access required');
    }

    return await context.prisma.ad.findUnique({
      where: { id: adId },
      include: {
        user: true,
        mediaAssignments: {
          include: {
            mediaUser: true,
          },
          orderBy: {
            id: 'asc',
          },
        },
      },
    });
  },

  // Mutations
  createAd: async (_: any, { input }: { input: any }, context: Context) => {
    if (!context.user) {
      throw new Error('Not authenticated');
    }

    const ad = await context.prisma.ad.create({
      data: {
        ...input,
        userId: context.user.id,
        status: 'preparing',
        paymentStatus: 'pending',
        totalMembers: 0,
      },
      include: {
        user: true,
      },
    });

    return {
      ...ad,
      createdAt: ad.createdAt.toISOString(),
      updatedAt: ad.updatedAt.toISOString(),
    };
  },

  updateAd: async (_: any, { id, input }: { id: number; input: any }, context: Context) => {
    if (!context.user) {
      throw new Error('Not authenticated');
    }

    const ad = await context.prisma.ad.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!ad) {
      throw new Error('Ad not found');
    }

    // Only admin or the ad owner can update
    if (context.user.role !== 'admin' && ad.userId !== context.user.id) {
      throw new Error('Not authorized');
    }

    const updatedAd = await context.prisma.ad.update({
      where: { id },
      data: input,
      include: {
        user: true,
      },
    });

    return {
      ...updatedAd,
      createdAt: updatedAd.createdAt.toISOString(),
      updatedAt: updatedAd.updatedAt.toISOString(),
    };
  },

  deleteAd: async (_: any, { id }: { id: number }, context: Context) => {
    if (!context.user) {
      throw new Error('Not authenticated');
    }

    const ad = await context.prisma.ad.findUnique({
      where: { id },
    });

    if (!ad) {
      throw new Error('Ad not found');
    }

    // Only admin or the ad owner can delete
    if (context.user.role !== 'admin' && ad.userId !== context.user.id) {
      throw new Error('Not authorized');
    }

    await context.prisma.ad.delete({
      where: { id },
    });

    return true;
  },

  markAdPaid: async (_: any, { adId }: { adId: number }, context: Context) => {
    if (!context.user) {
      throw new Error('Not authenticated');
    }

    const ad = await context.prisma.ad.findUnique({
      where: { id: adId },
      include: { user: true },
    });

    if (!ad) {
      throw new Error('Ad not found');
    }

    // Only admin or the ad owner can mark as paid
    if (context.user.role !== 'admin' && ad.userId !== context.user.id) {
      throw new Error('Not authorized');
    }

    const updatedAd = await context.prisma.ad.update({
      where: { id: adId },
      data: {
        paymentStatus: 'paid',
        status: 'paid',
      },
      include: {
        user: true,
      },
    });

    return {
      ...updatedAd,
      createdAt: updatedAd.createdAt.toISOString(),
      updatedAt: updatedAd.updatedAt.toISOString(),
    };
  },

  setCostPerPost: async (_: any, { adId, costPerPost }: { adId: number; costPerPost: number }, context: Context) => {
    if (!context.user || context.user.role !== 'admin') {
      throw new Error('Admin access required');
    }

    const ad = await context.prisma.ad.findUnique({
      where: { id: adId },
      include: { user: true },
    });

    if (!ad) {
      throw new Error('Ad not found');
    }

    if (ad.paymentStatus !== 'paid') {
      throw new Error('Ad must be paid before setting cost per post');
    }

    const totalPosts = Math.floor(ad.budget / costPerPost);

    const updatedAd = await context.prisma.ad.update({
      where: { id: adId },
      data: {
        costPerPost,
        totalPosts,
        status: 'approved',
      },
      include: {
        user: true,
      },
    });

    return {
      ...updatedAd,
      createdAt: updatedAd.createdAt.toISOString(),
      updatedAt: updatedAd.updatedAt.toISOString(),
    };
  },
}; 