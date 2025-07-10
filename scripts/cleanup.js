const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function cleanupDatabase() {
  try {
    console.log('Starting database cleanup...');

    // 1. Delete old completed ads (older than 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const deletedAds = await prisma.ad.deleteMany({
      where: {
        status: 'completed',
        createdAt: {
          lt: thirtyDaysAgo
        }
      }
    });
    
    console.log(`Deleted ${deletedAds.count} old completed ads`);

    // 2. Delete users with no ads (older than 90 days)
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    
    const deletedUsers = await prisma.user.deleteMany({
      where: {
        ads: {
          none: {}
        },
        createdAt: {
          lt: ninetyDaysAgo
        }
      }
    });
    
    console.log(`Deleted ${deletedUsers.count} inactive users`);

    // 3. Update ads with zero balance to 'completed' status
    const updatedAds = await prisma.ad.updateMany({
      where: {
        budget: 0,
        status: {
          not: 'completed'
        }
      },
      data: {
        status: 'completed'
      }
    });
    
    console.log(`Updated ${updatedAds.count} ads with zero budget to completed`);

    console.log('Database cleanup completed successfully!');
  } catch (error) {
    console.error('Error during cleanup:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run cleanup if this script is executed directly
if (require.main === module) {
  cleanupDatabase();
}

module.exports = { cleanupDatabase }; 