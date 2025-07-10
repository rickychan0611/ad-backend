import { gql } from 'apollo-server-express';

export const typeDefs = gql`
  type User {
    id: Int!
    email: String!
    fullName: String!
    role: String!
    balance: Float!
    createdAt: String!
    completedJobs: Int!
    pendingJobs: Int!
    totalEarnings: Float!
    ads: [Ad!]!
    mediaClaims: [ClaimedAd!]!
    mediaAssignments: [MediaAssignment!]!
  }

  type Ad {
    id: Int!
    groupLink: String!
    brandName: String!
    logoUrl: String
    keywords: String!
    recommendedText: String!
    region: String!
    industry: String!
    targetGender: String!
    targetAgeRange: String!
    budget: Float!
    costPerPost: Float
    totalPosts: Int
    status: String!
    paymentStatus: String!
    totalMembers: Int!
    lastJoinTime: String
    createdAt: String!
    updatedAt: String!
    user: User!
    claimedAds: [ClaimedAd!]!
    mediaAssignments: [MediaAssignment!]!
  }

  type MediaAssignment {
    id: Int!
    adId: Int!
    mediaUserId: Int!
    assignedPosts: Int!
    completedPosts: Int!
    status: String!
    claimedAt: String
    completedAt: String
    urls: [String!]
    paymentStatus: String!
    paidAt: String
    ad: Ad!
    mediaUser: User!
  }

  type ClaimedAd {
    id: Int!
    adId: Int!
    mediaUserId: Int!
    claimedNumber: Int!
    urls: String
    claimedAt: String!
    status: String!
    completedAt: String
    paymentStatus: String!
    ad: Ad!
    mediaUser: User!
  }

  input CreateAdInput {
    groupLink: String!
    brandName: String!
    logoUrl: String
    keywords: String!
    recommendedText: String!
    region: String!
    industry: String!
    targetGender: String!
    targetAgeRange: String!
    budget: Float!
  }

  input UpdateAdInput {
    groupLink: String
    brandName: String
    logoUrl: String
    keywords: String
    recommendedText: String
    region: String
    industry: String
    targetGender: String
    targetAgeRange: String
    budget: Float
    status: String
    costPerPost: Float
    totalPosts: Int
    paymentStatus: String
  }

  input AssignJobsInput {
    adId: Int!
    assignments: [MediaJobAssignmentInput!]!
  }

  input MediaJobAssignmentInput {
    mediaUserId: Int!
    assignedPosts: Int!
  }

  input MediaSubmitUrlsInput {
    assignmentId: Int!
    urls: [String!]!
  }

  input UpdateMediaAssignmentInput {
    assignmentId: Int!
    status: String
    completedPosts: Int
    urls: [String!]
  }

  type AuthPayload {
    token: String!
    user: User!
  }

  type Query {
    me: User
    userAds(userId: Int): [Ad!]!
    ad(id: Int!): Ad
    claimedAds(adId: Int, mediaUserId: Int, status: String): [ClaimedAd!]!
    claimedAd(id: Int!): ClaimedAd
    mediaAssignmentsByAd(adId: Int!): [MediaAssignment!]!
    mediaAssignmentsByMediaUser(mediaUserId: Int!): [MediaAssignment!]!
    allUsers: [User!]!
    allMediaUsers: [User!]!
    allAds: [Ad!]!
    allAssignments: [MediaAssignment!]!
    adWithAssignments(adId: Int!): Ad
  }

  type Mutation {
    register(email: String!, password: String!, fullName: String!, role: String!): AuthPayload
    login(email: String!, password: String!): AuthPayload
    createAd(input: CreateAdInput!): Ad!
    updateAd(id: Int!, input: UpdateAdInput!): Ad!
    deleteAd(id: Int!): Boolean!
    claimAd(adId: Int!, claimedNumber: Int!, urls: [String!]!): ClaimedAd!
    updateClaimedAd(id: Int!, input: UpdateClaimedAdInput!): ClaimedAd!
    markAdPaid(adId: Int!): Ad!
    setCostPerPost(adId: Int!, costPerPost: Float!): Ad!
    assignJobsToMedia(input: AssignJobsInput!): [MediaAssignment!]!
    mediaClaimJob(assignmentId: Int!): MediaAssignment!
    mediaDenyJob(assignmentId: Int!): MediaAssignment!
    mediaSubmitUrls(input: MediaSubmitUrlsInput!): MediaAssignment!
    updateMediaAssignment(input: UpdateMediaAssignmentInput!): MediaAssignment!
    adminPayoutMedia(assignmentId: Int!): MediaAssignment!
  }

  input UpdateClaimedAdInput {
    status: String
    completedAt: String
    paymentStatus: String
  }
`;
