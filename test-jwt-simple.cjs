const jwt = require('jsonwebtoken');

// Test configuration
const JWT_SECRET = 'youdonotknow';
const BASE_URL = 'http://localhost:4000/graphql';

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

console.log('=== JWT Test Tokens ===');
console.log('Admin Token:', tokens.admin);
console.log('User Token:', tokens.user);
console.log('Media1 Token:', tokens.media1);
console.log('Media2 Token:', tokens.media2);
console.log('\n');

// Test queries
const testQueries = {
  createAd: `
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
  `,

  markAdPaid: `
    mutation {
      markAdPaid(adId: 1) {
        id
        paymentStatus
        status
      }
    }
  `,

  setCostPerPost: `
    mutation {
      setCostPerPost(adId: 1, costPerPost: 10) {
        id
        costPerPost
        totalPosts
        budget
      }
    }
  `,

  assignJobsToMedia: `
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
  `,

  mediaClaimJob: `
    mutation {
      mediaClaimJob(assignmentId: 1) {
        id
        status
        claimedAt
      }
    }
  `,

  mediaSubmitUrls: `
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
  `,

  adminPayoutMedia: `
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
  `,

  queryAssignmentsByAd: `
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
  `
};

// Function to make GraphQL request
async function makeGraphQLRequest(token, query) {
  try {
    const response = await fetch(BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ query })
    });

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Test scenarios
const testScenarios = [
  {
    name: "1. Create Ad (User)",
    token: tokens.user,
    query: testQueries.createAd,
    expected: "Should create ad with status 'preparing'"
  },
  {
    name: "2. Mark Ad as Paid (User)",
    token: tokens.user,
    query: testQueries.markAdPaid,
    expected: "Should update paymentStatus to 'paid'"
  },
  {
    name: "3. Set Cost Per Post (Admin)",
    token: tokens.admin,
    query: testQueries.setCostPerPost,
    expected: "Should set costPerPost to 10 and totalPosts to 10"
  },
  {
    name: "4. Assign Jobs to Media (Admin)",
    token: tokens.admin,
    query: testQueries.assignJobsToMedia,
    expected: "Should create 2 assignments"
  },
  {
    name: "5. Media Claims Job (Media1)",
    token: tokens.media1,
    query: testQueries.mediaClaimJob,
    expected: "Should update status to 'claimed'"
  },
  {
    name: "6. Media Submits URLs (Media1)",
    token: tokens.media1,
    query: testQueries.mediaSubmitUrls,
    expected: "Should store URLs and mark as 'completed'"
  },
  {
    name: "7. Admin Payout (Admin)",
    token: tokens.admin,
    query: testQueries.adminPayoutMedia,
    expected: "Should mark as paid and increase balance"
  },
  {
    name: "8. Query Assignments (Admin)",
    token: tokens.admin,
    query: testQueries.queryAssignmentsByAd,
    expected: "Should return all assignments for ad 1"
  }
];

// Error test scenarios
const errorTestScenarios = [
  {
    name: "❌ User tries to set cost per post (should fail)",
    token: tokens.user,
    query: testQueries.setCostPerPost,
    expected: "Should return 'Access denied' error"
  },
  {
    name: "❌ Media tries to assign jobs (should fail)",
    token: tokens.media1,
    query: testQueries.assignJobsToMedia,
    expected: "Should return 'Access denied' error"
  },
  {
    name: "❌ User tries to payout (should fail)",
    token: tokens.user,
    query: testQueries.adminPayoutMedia,
    expected: "Should return 'Access denied' error"
  }
];

// Run all tests
async function runAllTests() {
  console.log('=== Running JWT Business Logic Tests ===\n');
  
  for (const scenario of testScenarios) {
    console.log(`🧪 ${scenario.name}`);
    console.log(`Expected: ${scenario.expected}`);
    
    const result = await makeGraphQLRequest(scenario.token, scenario.query);
    
    if (result.success) {
      if (result.data.errors) {
        console.log('❌ GraphQL Errors:', JSON.stringify(result.data.errors, null, 2));
      } else {
        console.log('✅ Success:', JSON.stringify(result.data.data, null, 2));
      }
    } else {
      console.log('❌ Request Failed:', result.error);
    }
    
    console.log('---\n');
    
    // Add delay between requests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}

// Run error tests
async function runErrorTests() {
  console.log('=== Running Error Tests ===\n');
  
  for (const scenario of errorTestScenarios) {
    console.log(`🧪 ${scenario.name}`);
    console.log(`Expected: ${scenario.expected}`);
    
    const result = await makeGraphQLRequest(scenario.token, scenario.query);
    
    if (result.success && result.data.errors) {
      console.log('✅ Correctly rejected:', result.data.errors[0].message);
    } else {
      console.log('❌ Should have failed but succeeded');
    }
    
    console.log('---\n');
    await new Promise(resolve => setTimeout(resolve, 500));
  }
}

// Manual test function
async function manualTest() {
  console.log('=== Manual Test Mode ===\n');
  console.log('Available tokens:');
  console.log('1. Admin:', tokens.admin.substring(0, 50) + '...');
  console.log('2. User:', tokens.user.substring(0, 50) + '...');
  console.log('3. Media1:', tokens.media1.substring(0, 50) + '...');
  console.log('4. Media2:', tokens.media2.substring(0, 50) + '...');
  console.log('\nCopy any token above and use it in your GraphQL client with:');
  console.log('Authorization: Bearer <token>');
  console.log('\nTest queries are available in the testQueries object.');
}

// Export for use
module.exports = {
  tokens,
  testQueries,
  makeGraphQLRequest,
  runAllTests,
  runErrorTests,
  manualTest
};

// Run if executed directly
if (require.main === module) {
  console.log('Starting JWT Business Logic Tests...\n');
  
  // Check if we should run manual test mode
  if (process.argv.includes('--manual')) {
    manualTest();
  } else {
    // Run automated tests
    runAllTests().then(() => {
      return runErrorTests();
    }).then(() => {
      console.log('🎉 All tests completed!');
    }).catch(error => {
      console.error('Test execution failed:', error);
    });
  }
} 