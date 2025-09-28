// Database migration script to fix transaction indexing
// Run this with: node scripts/fix-transaction-index.js

const { MongoClient } = require('mongodb');

async function fixTransactionIndex() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('❌ MONGODB_URI environment variable not set');
    process.exit(1);
  }

  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');

    const db = client.db();
    const collection = db.collection('transactions');

    // Check current indexes
    console.log('📋 Current indexes:');
    const indexes = await collection.listIndexes().toArray();
    indexes.forEach(index => {
      console.log(`  - ${index.name}: ${JSON.stringify(index.key)}`);
    });

    // Drop the old unique txId index if it exists
    try {
      await collection.dropIndex('txId_1');
      console.log('🗑️ Dropped old txId_1 index');
    } catch (error) {
      console.log('ℹ️ Old txId_1 index not found or already dropped');
    }

    // Create new compound unique index
    try {
      await collection.createIndex(
        { txId: 1, walletId: 1 }, 
        { unique: true, name: 'txId_1_walletId_1' }
      );
      console.log('✅ Created new compound unique index: txId_1_walletId_1');
    } catch (error) {
      console.log('ℹ️ Index may already exist:', error.message);
    }

    // Get transaction count
    const count = await collection.countDocuments();
    console.log(`📊 Total transactions in database: ${count}`);

    // Find duplicate txIds to understand the scope
    const duplicates = await collection.aggregate([
      { $group: { _id: "$txId", count: { $sum: 1 }, docs: { $push: "$_id" } } },
      { $match: { count: { $gt: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]).toArray();

    console.log(`🔍 Found ${duplicates.length} transaction IDs with duplicates`);
    duplicates.forEach(dup => {
      console.log(`  - ${dup._id}: ${dup.count} copies`);
    });

    console.log('✅ Index migration completed');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await client.close();
  }
}

fixTransactionIndex().catch(console.error);