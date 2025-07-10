import jwt from 'jsonwebtoken';
import fetch from 'node-fetch';

// Test configuration
const JWT_SECRET = 'youdonotknow'; // Should match your backend
const BASE_URL = 'http://localhost:4000/graphql';

// Test user data
const testUsers = {
  admin: {
    id: 1,
    email: 'admin@test.com',
    fullName: 'Admin User',
    role: 'admin',
    balance: 1000
  },
  user: {
    id: 2,
    email: 'user@test.com',
    fullName: 'Regular User',
    role: 'user',
    balance: 500
  },
  media1: {
    id: 3,
    email: 'media1@test.com',
    fullName: 'Media User 1',
    role: 'media',
    balance: 200
  },
  media2: {
    id: 4,
    email: 'media2@test.com',
    fullName: 'Media User 2',
    role: 'media',
    balance: 150
  }
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

// GraphQL test queries and mutations
const testQueries = {
  // 1. Create an ad (as user)
  createAd: `
    mutation CreateAd {
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

  // 2. Mark ad as paid (as user or admin)
  markAdPaid: `
    mutation MarkAdPaid {
      markAdPaid(adId: 1) {
        id
        paymentStatus
        status
      }
    }
  `,

  // 3. Set cost per post (as admin only)
  setCostPerPost: `
    mutation SetCostPerPost {
      setCostPerPost(adId: 1, costPerPost: 10) {
        id
        costPerPost
        totalPosts
        budget
      }
    }
  `,

  // 4. Assign jobs to media (as admin only)
  assignJobsToMedia: `
    mutation AssignJobs {
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
        mediaUser {
          fullName
        }
      }
    }
  `,

  // 5. Media claims a job
  mediaClaimJob: `
    mutation MediaClaimJob {
      mediaClaimJob(assignmentId: 1) {
        id
        status
        claimedAt
        mediaUser {
          fullName
        }
      }
    }
  `,

  // 6. Media submits URLs
  mediaSubmitUrls: `
    mutation MediaSubmitUrls {
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

  // 7. Admin pays out to media
  adminPayoutMedia: `
    mutation AdminPayout {
      adminPayoutMedia(assignmentId: 1) {
        id
        paymentStatus
        paidAt
        mediaUser {
          id
          fullName
          balance
        }
      }
    }
  `,

  // 8. Query assignments (admin view)
  queryAssignmentsByAd: `
    query GetAssignmentsByAd {
      mediaAssignmentsByAd(adId: 1) {
        id
        mediaUser {
          id
          fullName
          balance
        }
        assignedPosts
        status
        urls
        paymentStatus
        ad {
          brandName
          costPerPost
        }
      }
    }
  `,

  // 9. Query assignments (media view)
  queryAssignmentsByMedia: `
    query GetAssignmentsByMedia {
      mediaAssignmentsByMediaUser(mediaUserId: 3) {
        id
        ad {
          id
          brandName
          budget
        }
        assignedPosts
        status
        urls
        paymentStatus
      }
    }
  `
};

// Test scenarios with expected results
const testScenarios = [
  {
    name: "1. Create Ad (User)",
    token: tokens.user,
    query: testQueries.createAd,
    expected: "Should create ad with status 'preparing' and paymentStatus 'pending'"
  },
  {
    name: "2. Mark Ad as Paid (User)",
    token: tokens.user,
    query: testQueries.markAdPaid,
    expected: "Should update paymentStatus to 'paid' and status to 'paid'",
    dynamicAdId: true // This will be updated with the actual ad ID from step 1
  },
  {
    name: "3. Set Cost Per Post (Admin)",
    token: tokens.admin,
    query: testQueries.setCostPerPost,
    expected: "Should set costPerPost to 10 and totalPosts to 10 (100/10)",
    dynamicAdId: true
  },
  {
    name: "4. Assign Jobs to Media (Admin)",
    token: tokens.admin,
    query: testQueries.assignJobsToMedia,
    expected: "Should create 2 assignments and mark ad as 'approved'",
    dynamicAdId: true
  },
  {
    name: "5. Media Claims Job (Media1)",
    token: tokens.media1,
    query: testQueries.mediaClaimJob,
    expected: "Should update status to 'claimed' and set claimedAt",
    dynamicAssignmentId: true // This will be updated with the actual assignment ID
  },
  {
    name: "6. Media Submits URLs (Media1)",
    token: tokens.media1,
    query: testQueries.mediaSubmitUrls,
    expected: "Should store URLs and mark as 'completed' if all posts submitted",
    dynamicAssignmentId: true
  },
  {
    name: "7. Admin Payout (Admin)",
    token: tokens.admin,
    query: testQueries.adminPayoutMedia,
    expected: "Should mark as paid and increase media user's balance by 60 (6 posts * 10)",
    dynamicAssignmentId: true
  },
  {
    name: "8. Query Assignments by Ad (Admin)",
    token: tokens.admin,
    query: testQueries.queryAssignmentsByAd,
    expected: "Should return all assignments for ad 1",
    dynamicAdId: true
  },
  {
    name: "9. Query Assignments by Media (Media1)",
    token: tokens.media1,
    query: testQueries.queryAssignmentsByMedia,
    expected: "Should return only assignments for media user 3"
  }
];

// Function to make GraphQL request
async function makeGraphQLRequest(token, query, operationName = null) {
  try {
    const response = await fetch(BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        query,
        operationName
      })
    });

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Run all tests
async function runAllTests() {
  console.log('=== Running JWT Business Logic Tests ===\n');
  
  let currentAdId = null;
  let currentAssignmentId = null;
  
  for (const scenario of testScenarios) {
    console.log(`🧪 ${scenario.name}`);
    console.log(`Expected: ${scenario.expected}`);
    
    let query = scenario.query;
    
    // Replace dynamic IDs if needed
    if (scenario.dynamicAdId && currentAdId) {
      query = query.replace(/adId: \d+/g, `adId: ${currentAdId}`);
    }
    if (scenario.dynamicAssignmentId && currentAssignmentId) {
      query = query.replace(/assignmentId: \d+/g, `assignmentId: ${currentAssignmentId}`);
    }
    
    const result = await makeGraphQLRequest(scenario.token, query);
    
    if (result.success) {
      if (result.data.errors) {
        console.log('❌ GraphQL Errors:', JSON.stringify(result.data.errors, null, 2));
      } else {
        console.log('✅ Success:', JSON.stringify(result.data.data, null, 2));
        
        // Store IDs for next steps
        if (scenario.name.includes('Create Ad') && result.data.data.createAd) {
          currentAdId = result.data.data.createAd.id;
          console.log(`📝 Stored Ad ID: ${currentAdId}`);
        }
        if (scenario.name.includes('Assign Jobs') && result.data.data.assignJobsToMedia) {
          // Get the first assignment ID for media1 (user ID 3)
          const media1Assignment = result.data.data.assignJobsToMedia.find(
            (assignment) => assignment.mediaUserId === 3
          );
          if (media1Assignment) {
            currentAssignmentId = media1Assignment.id;
            console.log(`📝 Stored Assignment ID: ${currentAssignmentId}`);
          }
        }
      }
    } else {
      console.log('❌ Request Failed:', result.error);
    }
    
    console.log('---\n');
    
    // Add delay between requests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}

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
  },
  {
    name: "❌ Media2 tries to claim Media1's job (should fail)",
    token: tokens.media2,
    query: testQueries.mediaClaimJob,
    expected: "Should return 'Access denied' error"
  }
];

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

// Export for use in other files
export {
  tokens,
  testUsers,
  testQueries,
  makeGraphQLRequest,
  runAllTests,
  runErrorTests
};

// Run tests if this file is executed directly
console.log('Starting JWT Business Logic Tests...\n');

// First run the main tests
runAllTests().then(() => {
  // Then run error tests
  return runErrorTests();
}).then(() => {
  console.log('🎉 All tests completed!');
}).catch(error => {
  console.error('Test execution failed:', error);
}); 