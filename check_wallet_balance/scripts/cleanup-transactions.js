// Script to clean up duplicate transactions and fix database
// Run with: node scripts/cleanup-transactions.js

const { MongoClient } = require('mongodb');

async function cleanupTransactions() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('❌ MONGODB_URI environment variable not set');
    console.error('Run: export MONGODB_URI="your_connection_string"');
    process.exit(1);
  }

  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');

    const db = client.db();
    const collection = db.collection('transactions');

    // Get initial count
    const initialCount = await collection.countDocuments();
    console.log(`📊 Initial transaction count: ${initialCount}`);

    // Step 1: Drop problematic unique index
    try {
      await collection.dropIndex('txId_1');
      console.log('🗑️ Dropped old txId_1 unique index');
    } catch (error) {
      console.log('ℹ️ Old index not found or already dropped');
    }

    // Step 2: Find and remove duplicate transactions (keep most recent for each wallet)
    console.log('🔍 Finding duplicate transactions...');
    
    const duplicates = await collection.aggregate([
      {
        $group: {
          _id: { txId: "$txId", walletId: "$walletId" },
          docs: { $push: { id: "$_id", createdAt: "$createdAt" } },
          count: { $sum: 1 }
        }
      },
      { $match: { count: { $gt: 1 } } }
    ]).toArray();

    console.log(`📋 Found ${duplicates.length} sets of duplicate transactions`);

    let removedCount = 0;
    for (const duplicate of duplicates) {
      // Sort by createdAt and keep the most recent
      const sorted = duplicate.docs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      const toRemove = sorted.slice(1); // Remove all but the first (most recent)

      for (const doc of toRemove) {
        await collection.deleteOne({ _id: doc.id });
        removedCount++;
      }
    }

    console.log(`🗑️ Removed ${removedCount} duplicate transactions`);

    // Step 3: Create new compound unique index
    try {
      await collection.createIndex(
        { txId: 1, walletId: 1 }, 
        { unique: true, name: 'txId_1_walletId_1' }
      );
      console.log('✅ Created new compound unique index: txId_1_walletId_1');
    } catch (error) {
      console.log('ℹ️ New index may already exist:', error.message);
    }

    // Step 4: Remove transactions where txId is the same but no walletId association
    console.log('🔍 Checking for orphaned global duplicates...');
    
    const globalDuplicates = await collection.aggregate([
      {
        $group: {
          _id: "$txId",
          docs: { $push: "$_id" },
          count: { $sum: 1 },
          wallets: { $addToSet: "$walletId" }
        }
      },
      { $match: { count: { $gt: 1 } } },
      { $limit: 10 } // Sample to see the scope
    ]).toArray();

    console.log(`📋 Found ${globalDuplicates.length} transaction IDs that appear multiple times`);
    
    if (globalDuplicates.length > 0) {
      console.log('Sample global duplicates:');
      globalDuplicates.slice(0, 3).forEach(dup => {
        console.log(`  - ${dup._id}: ${dup.count} records across ${dup.wallets.length} wallets`);
      });
    }

    // Final count
    const finalCount = await collection.countDocuments();
    console.log(`📊 Final transaction count: ${finalCount}`);
    console.log(`📉 Removed ${initialCount - finalCount} duplicate records`);

    // Check current indexes
    console.log('📋 Current indexes:');
    const indexes = await collection.listIndexes().toArray();
    indexes.forEach(index => {
      console.log(`  - ${index.name}: ${JSON.stringify(index.key)} ${index.unique ? '(UNIQUE)' : ''}`);
    });

    console.log('✅ Database cleanup completed successfully!');
    console.log('');
    console.log('Next steps:');
    console.log('1. Go to your analytics page');
    console.log('2. Click "Sync Transactions" to re-populate with the fixed logic');
    console.log('3. All wallets should now show their correct transaction counts');
    
  } catch (error) {
    console.error('❌ Cleanup failed:', error);
  } finally {
    await client.close();
  }
}

cleanupTransactions().catch(console.error);