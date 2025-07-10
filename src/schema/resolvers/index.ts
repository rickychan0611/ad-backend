import { authResolvers } from './auth.js';
import { adResolvers } from './ads.js';
import { userResolvers } from './users.js';
import { assignmentResolvers } from './assignments.js';
import { claimedAdResolvers } from './claimedAds.js';

export const resolvers = {
  Query: {
    // User queries
    me: userResolvers.me,
    allUsers: userResolvers.allUsers,
    allMediaUsers: userResolvers.allMediaUsers,

    // Ad queries
    userAds: adResolvers.userAds,
    allAds: adResolvers.allAds,
    ad: adResolvers.ad,
    adWithAssignments: adResolvers.adWithAssignments,

    // Assignment queries
    allAssignments: assignmentResolvers.allAssignments,
    mediaAssignmentsByAd: assignmentResolvers.mediaAssignmentsByAd,
    mediaAssignmentsByMediaUser: assignmentResolvers.mediaAssignmentsByMediaUser,

    // Claimed ad queries
    claimedAds: claimedAdResolvers.claimedAds,
    claimedAd: claimedAdResolvers.claimedAd,
  },

  Mutation: {
    // Auth mutations
    register: authResolvers.register,
    login: authResolvers.login,

    // Ad mutations
    createAd: adResolvers.createAd,
    updateAd: adResolvers.updateAd,
    deleteAd: adResolvers.deleteAd,
    markAdPaid: adResolvers.markAdPaid,
    setCostPerPost: adResolvers.setCostPerPost,

    // Assignment mutations
    assignJobsToMedia: assignmentResolvers.assignJobsToMedia,
    mediaClaimJob: assignmentResolvers.mediaClaimJob,
    mediaDenyJob: assignmentResolvers.mediaDenyJob,
    mediaSubmitUrls: assignmentResolvers.mediaSubmitUrls,
    updateMediaAssignment: assignmentResolvers.updateMediaAssignment,
    adminPayoutMedia: assignmentResolvers.adminPayoutMedia,

    // Claimed ad mutations
    claimAd: claimedAdResolvers.claimAd,
    updateClaimedAd: claimedAdResolvers.updateClaimedAd,
  },
}; 