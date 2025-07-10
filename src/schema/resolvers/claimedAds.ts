import { Context } from './types';

export const claimedAdResolvers = {
  // Queries
  claimedAds: async (_: any, { adId, mediaUserId, status }: { adId?: number; mediaUserId?: number; status?: string }, context: Context) => {
    if (!context.user) {
      throw new Error('Not authenticated');
    }

    const where: any = {};
    if (adId) where.adId = adId;
    if (mediaUserId) where.mediaUserId = mediaUserId;
    if (status) where.status = status;

    return await context.prisma.claimedAd.findMany({
      where,
      include: {
        ad: {
          include: {
            user: true,
          },
        },
        mediaUser: true,
      },
      orderBy: {
        claimedAt: 'desc',
      },
    });
  },

  claimedAd: async (_: any, { id }: { id: number }, context: Context) => {
    if (!context.user) {
      throw new Error('Not authenticated');
    }

    return await context.prisma.claimedAd.findUnique({
      where: { id },
      include: {
        ad: {
          include: {
            user: true,
          },
        },
        mediaUser: true,
      },
    });
  },

  // Mutations
  claimAd: async (_: any, { adId, claimedNumber, urls }: { adId: number; claimedNumber: number; urls: string[] }, context: Context) => {
    if (!context.user || context.user.role !== 'media') {
      throw new Error('Media user access required');
    }

    const ad = await context.prisma.ad.findUnique({
      where: { id: adId },
      include: { user: true },
    });

    if (!ad) {
      throw new Error('Ad not found');
    }

    if (ad.status !== 'approved') {
      throw new Error('Ad is not available for claiming');
    }

    if (urls.length !== claimedNumber) {
      throw new Error(`Expected ${claimedNumber} URLs, got ${urls.length}`);
    }

    const claimedAd = await context.prisma.claimedAd.create({
      data: {
        adId,
        mediaUserId: context.user.id,
        claimedNumber,
        urls: urls.join(','),
        claimedAt: new Date(),
        status: 'claimed',
        paymentStatus: 'pending',
      },
      include: {
        ad: {
          include: {
            user: true,
          },
        },
        mediaUser: true,
      },
    });

    return {
      ...claimedAd,
      claimedAt: claimedAd.claimedAt.toISOString(),
      completedAt: claimedAd.completedAt?.toISOString(),
    };
  },

  updateClaimedAd: async (_: any, { id, input }: { id: number; input: any }, context: Context) => {
    if (!context.user) {
      throw new Error('Not authenticated');
    }

    const claimedAd = await context.prisma.claimedAd.findUnique({
      where: { id },
      include: {
        ad: { include: { user: true } },
        mediaUser: true,
      },
    });

    if (!claimedAd) {
      throw new Error('Claimed ad not found');
    }

    // Only admin or the media user who claimed it can update
    if (context.user.role !== 'admin' && claimedAd.mediaUserId !== context.user.id) {
      throw new Error('Not authorized');
    }

    const updatedClaimedAd = await context.prisma.claimedAd.update({
      where: { id },
      data: input,
      include: {
        ad: {
          include: {
            user: true,
          },
        },
        mediaUser: true,
      },
    });

    return {
      ...updatedClaimedAd,
      claimedAt: updatedClaimedAd.claimedAt.toISOString(),
      completedAt: updatedClaimedAd.completedAt?.toISOString(),
    };
  },
}; 