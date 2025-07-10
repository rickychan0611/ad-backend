import { Context } from './types.js';

export const userResolvers = {
  me: async (_: any, __: any, context: Context) => {
    if (!context.user) {
      throw new Error('Not authenticated');
    }

    const user = await context.prisma.user.findUnique({
      where: { id: context.user.id },
    });

    if (!user) {
      throw new Error('User not found');
    }

    return {
      ...user,
      createdAt: user.createdAt.toISOString(),
    };
  },

  allUsers: async (_: any, __: any, context: Context) => {
    if (!context.user || context.user.role !== 'admin') {
      throw new Error('Admin access required');
    }

    return await context.prisma.user.findMany({
      include: {
        ads: {
          select: {
            id: true,
            brandName: true,
            budget: true,
            status: true,
            paymentStatus: true,
            createdAt: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  },

  allMediaUsers: async (_: any, __: any, context: Context) => {
    if (!context.user || context.user.role !== 'admin') {
      throw new Error('Admin access required');
    }

    const mediaUsers = await context.prisma.user.findMany({
      where: {
        role: 'media',
      },
      include: {
        mediaAssignments: {
          include: {
            ad: {
              select: {
                id: true,
                brandName: true,
                costPerPost: true,
                budget: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Calculate additional fields for each media user
    return mediaUsers.map((user: any) => {
      const completedJobs = user.mediaAssignments.filter((assignment: any) => assignment.status === 'completed').length;
      const pendingJobs = user.mediaAssignments.filter((assignment: any) => 
        assignment.status === 'assigned' || assignment.status === 'claimed'
      ).length;
      
      const totalEarnings = user.mediaAssignments
        .filter((assignment: any) => assignment.paymentStatus === 'paid')
        .reduce((sum: number, assignment: any) => {
          const assignmentEarnings = (assignment.ad.costPerPost || 0) * assignment.assignedPosts;
          return sum + assignmentEarnings;
        }, 0);

      return {
        ...user,
        completedJobs,
        pendingJobs,
        totalEarnings,
        createdAt: user.createdAt.toISOString(),
      };
    });
  },
}; 