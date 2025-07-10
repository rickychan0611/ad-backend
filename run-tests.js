const jwt = require('jsonwebtoken');

// Test configuration
const JWT_SECRET = 'youdonotknow';

// Test user data
const testUsers = {
  admin: { id: 1, role: 'admin' },
  user: { id: 2, role: 'user' },
  media1: { id: 3, role: 'media' },
  media2: { id: 4, role: 'media' }
};

// Generate JWT tokens
function generateToken(user) {
  return jwt.sign(
    { id: user.id, role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

// Generate all test tokens
const tokens = {
  admin: generateToken(testUsers.admin),
  user: generateToken(testUsers.user),
  media1: generateToken(testUsers.media1),
  media2: generateToken(testUsers.media2)
};

console.log('🔐 JWT Test Tokens Generated');
console.log('=====================================\n');

console.log('👑 ADMIN TOKEN:');
console.log(tokens.admin);
console.log('\n');

console.log('👤 USER TOKEN:');
console.log(tokens.user);
console.log('\n');

console.log('📱 MEDIA1 TOKEN:');
console.log(tokens.media1);
console.log('\n');

console.log('📱 MEDIA2 TOKEN:');
console.log(tokens.media2);
console.log('\n');

console.log('🧪 TESTING INSTRUCTIONS');
console.log('=====================================\n');

console.log('1. Start your backend server: npm start');
console.log('2. Open GraphQL Playground: http://localhost:4000/graphql');
console.log('3. Add Authorization header: Bearer <token>');
console.log('4. Test the following workflow:\n');

console.log('📋 TEST WORKFLOW:');
console.log('1. Create Ad (User Token)');
console.log('2. Mark Ad as Paid (User Token)');
console.log('3. Set Cost Per Post (Admin Token)');
console.log('4. Assign Jobs to Media (Admin Token)');
console.log('5. Media Claims Job (Media1 Token)');
console.log('6. Media Submits URLs (Media1 Token)');
console.log('7. Admin Payout (Admin Token)');
console.log('8. Query Assignments (Admin Token)\n');

console.log('📝 SAMPLE QUERIES:');
console.log('=====================================\n');

console.log('1. CREATE AD:');
console.log(`
mutation {
  createAd(input: {
    groupLink: "https://t.me/testgroup"
    brandName: "Test Brand"
    keywords: "test, demo, sample"
    recommendedText: "This is a test advertisement"
    region: "Global"
    industry: "Technology"
    targetGender: "All"
    targetAgeRange: "18-65"
    budget: 100
  }) {
    id
    brandName
    budget
    status
    paymentStatus
  }
}
`);

console.log('2. MARK AD AS PAID:');
console.log(`
mutation {
  markAdPaid(adId: 1) {
    id
    paymentStatus
    status
  }
}
`);

console.log('3. SET COST PER POST:');
console.log(`
mutation {
  setCostPerPost(adId: 1, costPerPost: 10) {
    id
    costPerPost
    totalPosts
    budget
  }
}
`);

console.log('4. ASSIGN JOBS TO MEDIA:');
console.log(`
mutation {
  assignJobsToMedia(input: {
    adId: 1,
    assignments: [
      { mediaUserId: 3, assignedPosts: 6 },
      { mediaUserId: 4, assignedPosts: 4 }
    ]
  }) {
    id
    adId
    mediaUserId
    assignedPosts
    status
  }
}
`);

console.log('5. MEDIA CLAIMS JOB:');
console.log(`
mutation {
  mediaClaimJob(assignmentId: 1) {
    id
    status
    claimedAt
  }
}
`);

console.log('6. MEDIA SUBMITS URLS:');
console.log(`
mutation {
  mediaSubmitUrls(input: {
    assignmentId: 1,
    urls: [
      "https://facebook.com/post1",
      "https://instagram.com/post2",
      "https://twitter.com/post3"
    ]
  }) {
    id
    urls
    status
    completedAt
    assignedPosts
  }
}
`);

console.log('7. ADMIN PAYOUT:');
console.log(`
mutation {
  adminPayoutMedia(assignmentId: 1) {
    id
    paymentStatus
    paidAt
    mediaUser {
      id
      balance
    }
  }
}
`);

console.log('8. QUERY ASSIGNMENTS:');
console.log(`
query {
  mediaAssignmentsByAd(adId: 1) {
    id
    mediaUser {
      id
      fullName
    }
    assignedPosts
    status
    urls
    paymentStatus
  }
}
`);

console.log('🎯 ERROR TESTING:');
console.log('=====================================\n');
console.log('Test these scenarios to ensure proper access control:');
console.log('- User tries to set cost per post (should fail)');
console.log('- Media tries to assign jobs (should fail)');
console.log('- User tries to payout (should fail)');
console.log('- Media2 tries to claim Media1\'s job (should fail)\n');

console.log('✅ SUCCESS CRITERIA:');
console.log('=====================================\n');
console.log('1. All mutations execute without errors');
console.log('2. Access control works (wrong roles get denied)');
console.log('3. Data relationships are maintained');
console.log('4. Status updates work correctly');
console.log('5. Balance updates work for payouts');
console.log('6. URLs are stored and retrieved correctly\n');

console.log('🚀 Ready to test! Copy the tokens above and start testing.'); 