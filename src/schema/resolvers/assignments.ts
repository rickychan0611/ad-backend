import { Context } from './types.js';

export const assignmentResolvers = {
  // Queries
  allAssignments: async (_: any, __: any, context: Context) => {
    if (!context.user || context.user.role !== 'admin') {
      throw new Error('Admin access required');
    }

    return await context.prisma.mediaAssignment.findMany({
      include: {
        ad: {
          include: {
            user: true,
          },
        },
        mediaUser: true,
      },
      orderBy: {
        id: 'desc',
      },
    });
  },

  mediaAssignmentsByAd: async (_: any, { adId }: { adId: number }, context: Context) => {
    if (!context.user) {
      throw new Error('Not authenticated');
    }

    return await context.prisma.mediaAssignment.findMany({
      where: {
        adId,
      },
      include: {
        mediaUser: true,
        ad: true,
      },
      orderBy: {
        id: 'desc',
      },
    });
  },

  mediaAssignmentsByMediaUser: async (_: any, { mediaUserId }: { mediaUserId: number }, context: Context) => {
    if (!context.user) {
      throw new Error('Not authenticated');
    }

    // Users can only see their own assignments, admins can see all
    if (context.user.role !== 'admin' && context.user.id !== mediaUserId) {
      throw new Error('Not authorized');
    }

    return await context.prisma.mediaAssignment.findMany({
      where: {
        mediaUserId,
      },
      include: {
        ad: true,
      },
      orderBy: {
        id: 'desc',
      },
    });
  },

  // Mutations
  assignJobsToMedia: async (_: any, { input }: { input: { adId: number; assignments: Array<{ mediaUserId: number; assignedPosts: number }> } }, context: Context) => {
    if (!context.user || context.user.role !== 'admin') {
      throw new Error('Admin access required');
    }

    const ad = await context.prisma.ad.findUnique({
      where: { id: input.adId },
      include: {
        mediaAssignments: {
          include: {
            mediaUser: true,
          },
        },
      },
    });

    if (!ad) {
      throw new Error('Ad not found');
    }

    if (ad.status !== 'approved') {
      throw new Error('Ad must be approved before assigning jobs');
    }

    const existingAssignments = ad.mediaAssignments || [];
    const assignments = [];

    // Process each assignment request
    for (const assignment of input.assignments) {
      const mediaUser = await context.prisma.user.findUnique({
        where: { id: assignment.mediaUserId },
      });

      if (!mediaUser || mediaUser.role !== 'media') {
        throw new Error(`Media user ${assignment.mediaUserId} not found or not a media user`);
      }

      const existingAssignment = existingAssignments.find((a: any) => a.mediaUserId === assignment.mediaUserId);

      if (existingAssignment) {
        // Update existing assignment if media user hasn't claimed/denied yet
        if (existingAssignment.status === 'assigned') {
          if (assignment.assignedPosts === 0) {
            // Remove assignment if posts set to 0
            await context.prisma.mediaAssignment.delete({
              where: { id: existingAssignment.id },
            });
          } else {
            // Update existing assignment
            const updatedAssignment = await context.prisma.mediaAssignment.update({
              where: { id: existingAssignment.id },
              data: {
                assignedPosts: assignment.assignedPosts,
              },
              include: {
                mediaUser: true,
                ad: {
                  select: {
                    id: true,
                    brandName: true,
                    costPerPost: true,
                  },
                },
              },
            });
            assignments.push(updatedAssignment);
          }
        } else {
          // Assignment is claimed/denied, cannot modify
          throw new Error(`Cannot modify assignment for ${mediaUser.fullName} - status is ${existingAssignment.status}`);
        }
      } else {
        // Create new assignment
        if (assignment.assignedPosts > 0) {
          const newAssignment = await context.prisma.mediaAssignment.create({
            data: {
              adId: input.adId,
              mediaUserId: assignment.mediaUserId,
              assignedPosts: assignment.assignedPosts,
              status: 'assigned',
              paymentStatus: 'pending',
            },
            include: {
              mediaUser: true,
              ad: {
                select: {
                  id: true,
                  brandName: true,
                  costPerPost: true,
                },
              },
            },
          });
          assignments.push(newAssignment);
        }
      }
    }

    // Validate total assignments don't exceed available posts
    const totalAssigned = assignments.reduce((sum: number, assignment: any) => sum + assignment.assignedPosts, 0);
    const totalAvailablePosts = ad.totalPosts || 0;
    
    if (totalAssigned > totalAvailablePosts) {
      throw new Error(`Cannot assign ${totalAssigned} posts. Only ${totalAvailablePosts} posts are available.`);
    }

    return assignments;
  },

  mediaClaimJob: async (_: any, { assignmentId }: { assignmentId: number }, context: Context) => {
    if (!context.user || context.user.role !== 'media') {
      throw new Error('Media user access required');
    }

    const assignment = await context.prisma.mediaAssignment.findUnique({
      where: { id: assignmentId },
      include: { mediaUser: true },
    });

    if (!assignment) {
      throw new Error('Assignment not found');
    }

    if (assignment.mediaUserId !== context.user.id) {
      throw new Error('Not authorized to claim this job');
    }

    if (assignment.status !== 'assigned') {
      throw new Error('Assignment is not available for claiming');
    }

    const updatedAssignment = await context.prisma.mediaAssignment.update({
      where: { id: assignmentId },
      data: {
        status: 'claimed',
        claimedAt: new Date(),
      },
      include: {
        mediaUser: true,
      },
    });

    return {
      ...updatedAssignment,
      claimedAt: updatedAssignment.claimedAt?.toISOString(),
      completedAt: updatedAssignment.completedAt?.toISOString(),
      paidAt: updatedAssignment.paidAt?.toISOString(),
    };
  },

  mediaDenyJob: async (_: any, { assignmentId }: { assignmentId: number }, context: Context) => {
    if (!context.user || context.user.role !== 'media') {
      throw new Error('Media user access required');
    }

    const assignment = await context.prisma.mediaAssignment.findUnique({
      where: { id: assignmentId },
      include: { mediaUser: true },
    });

    if (!assignment) {
      throw new Error('Assignment not found');
    }

    if (assignment.mediaUserId !== context.user.id) {
      throw new Error('Not authorized to deny this job');
    }

    if (assignment.status !== 'assigned') {
      throw new Error('Assignment is not available for denying');
    }

    const updatedAssignment = await context.prisma.mediaAssignment.update({
      where: { id: assignmentId },
      data: {
        status: 'denied',
      },
      include: {
        mediaUser: true,
      },
    });

    return {
      ...updatedAssignment,
      claimedAt: updatedAssignment.claimedAt?.toISOString(),
      completedAt: updatedAssignment.completedAt?.toISOString(),
      paidAt: updatedAssignment.paidAt?.toISOString(),
    };
  },

  mediaSubmitUrls: async (_: any, { input }: { input: { assignmentId: number; urls: string[] } }, context: Context) => {
    if (!context.user || context.user.role !== 'media') {
      throw new Error('Media user access required');
    }

    const assignment = await context.prisma.mediaAssignment.findUnique({
      where: { id: input.assignmentId },
    });

    if (!assignment) {
      throw new Error('Assignment not found');
    }

    if (assignment.mediaUserId !== context.user.id) {
      throw new Error('Not authorized to submit URLs for this job');
    }

    if (assignment.status !== 'claimed') {
      throw new Error('Assignment must be claimed before submitting URLs');
    }

    if (input.urls.length !== assignment.assignedPosts) {
      throw new Error(`Expected ${assignment.assignedPosts} URLs, got ${input.urls.length}`);
    }

    const updatedAssignment = await context.prisma.mediaAssignment.update({
      where: { id: input.assignmentId },
      data: {
        status: 'completed',
        urls: input.urls,
        completedAt: new Date(),
      },
    });

    return {
      ...updatedAssignment,
      claimedAt: updatedAssignment.claimedAt?.toISOString(),
      completedAt: updatedAssignment.completedAt?.toISOString(),
      paidAt: updatedAssignment.paidAt?.toISOString(),
    };
  },

  updateMediaAssignment: async (_: any, { input }: { input: { assignmentId: number; status?: string; completedPosts?: number; urls?: string[] } }, context: Context) => {
    if (!context.user || context.user.role !== 'media') {
      throw new Error('Media user access required');
    }

    const assignment = await context.prisma.mediaAssignment.findUnique({
      where: { id: input.assignmentId },
      include: {
        ad: true,
      },
    });

    if (!assignment) {
      throw new Error('Assignment not found');
    }

    if (assignment.mediaUserId !== context.user.id) {
      throw new Error('Not authorized to update this assignment');
    }

    // Validate status transitions
    const validStatuses = ['assigned', 'claimed', 'in_progress', 'completed', 'denied'];
    if (input.status && !validStatuses.includes(input.status)) {
      throw new Error(`Invalid status: ${input.status}`);
    }

    // Validate completed posts
    if (input.completedPosts !== undefined) {
      if (input.completedPosts < 0 || input.completedPosts > assignment.assignedPosts) {
        throw new Error(`Completed posts must be between 0 and ${assignment.assignedPosts}`);
      }
    }

    // Validate URLs if provided
    if (input.urls) {
      if (input.urls.length > assignment.assignedPosts) {
        throw new Error(`Cannot submit more than ${assignment.assignedPosts} URLs`);
      }
      
      // Prevent URL updates if assignment has been paid
      if (assignment.paymentStatus === 'paid') {
        throw new Error('Cannot update URLs after assignment has been paid');
      }
    }

    // Prepare update data
    const updateData: any = {};
    
    if (input.status) {
      updateData.status = input.status;
      
      // Set timestamps based on status
      if (input.status === 'claimed' && assignment.status === 'assigned') {
        updateData.claimedAt = new Date();
      } else if (input.status === 'completed' && assignment.status !== 'completed') {
        updateData.completedAt = new Date();
      } else if (input.status === 'claimed' && assignment.status === 'completed') {
        // Reverting from completed to claimed - clear completedAt
        updateData.completedAt = null;
      }
    }

    if (input.completedPosts !== undefined) {
      updateData.completedPosts = input.completedPosts;
    }

    if (input.urls) {
      updateData.urls = input.urls;
    }

    const updatedAssignment = await context.prisma.mediaAssignment.update({
      where: { id: input.assignmentId },
      data: updateData,
      include: {
        mediaUser: true,
        ad: {
          select: {
            id: true,
            brandName: true,
            costPerPost: true,
          },
        },
      },
    });

    return {
      ...updatedAssignment,
      claimedAt: updatedAssignment.claimedAt?.toISOString(),
      completedAt: updatedAssignment.completedAt?.toISOString(),
      paidAt: updatedAssignment.paidAt?.toISOString(),
    };
  },

  adminPayoutMedia: async (_: any, { assignmentId }: { assignmentId: number }, context: Context) => {
    if (!context.user || context.user.role !== 'admin') {
      throw new Error('Admin access required');
    }

    const assignment = await context.prisma.mediaAssignment.findUnique({
      where: { id: assignmentId },
      include: {
        mediaUser: true,
        ad: true,
      },
    });

    if (!assignment) {
      throw new Error('Assignment not found');
    }

    if (assignment.status !== 'completed') {
      throw new Error('Assignment must be completed before payout');
    }

    if (assignment.paymentStatus === 'paid') {
      throw new Error('Assignment has already been paid');
    }

    const payoutAmount = (assignment.ad.costPerPost || 0) * assignment.assignedPosts;

    // Update media user balance
    await context.prisma.user.update({
      where: { id: assignment.mediaUserId },
      data: {
        balance: {
          increment: payoutAmount,
        },
      },
    });

    const updatedAssignment = await context.prisma.mediaAssignment.update({
      where: { id: assignmentId },
      data: {
        paymentStatus: 'paid',
        paidAt: new Date(),
      },
      include: {
        mediaUser: true,
      },
    });

    return {
      ...updatedAssignment,
      claimedAt: updatedAssignment.claimedAt?.toISOString(),
      completedAt: updatedAssignment.completedAt?.toISOString(),
      paidAt: updatedAssignment.paidAt?.toISOString(),
    };
  },
}; 