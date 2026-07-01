import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });
// MongoDB connection strings
const OLD_MONGO_URI = 'mongodb+srv://Samhitaops:Samhitaops123@cluster0.foslkww.mongodb.net/?appName=Cluster0';
const NEW_MONGO_URI = process.env.MONGO_URI ||
    'mongodb+srv://Entraiot:entraiot2026@cluster0.aszqbzy.mongodb.net/?appName=Cluster0';
// Collection names to migrate
const COLLECTIONS = [
    'users',
    'tasks',
    'projects',
    'reviews',
    'transcriptions',
    'notifications',
    'profiles',
    'drafts',
    'applicationsettings',
];
async function migrateCollection(oldClient, newClient, collectionName, oldDbName, newDbName) {
    const stats = {
        collection: collectionName,
        total: 0,
        migrated: 0,
        errors: 0,
    };
    try {
        const oldDb = oldClient.db(oldDbName);
        const newDb = newClient.db(newDbName);
        const oldCollection = oldDb.collection(collectionName);
        const newCollection = newDb.collection(collectionName);
        // Get total count
        stats.total = await oldCollection.countDocuments();
        if (stats.total === 0) {
            console.log(`  ⚠️  Collection "${collectionName}" is empty, skipping...`);
            return stats;
        }
        console.log(`  📊 Found ${stats.total} documents in "${collectionName}"`);
        // Check if collection already has data in new DB
        const existingCount = await newCollection.countDocuments();
        if (existingCount > 0) {
            console.log(`  ⚠️  Collection "${collectionName}" already has ${existingCount} documents in new DB`);
            const overwrite = process.argv.includes('--overwrite');
            if (!overwrite) {
                console.log(`  ⏭️  Skipping "${collectionName}" (use --overwrite to replace existing data)`);
                return stats;
            }
            console.log(`  🗑️  Clearing existing data in "${collectionName}"...`);
            await newCollection.deleteMany({});
        }
        // Fetch all documents from old database
        const documents = await oldCollection.find({}).toArray();
        if (documents.length === 0) {
            return stats;
        }
        // Insert documents in batches for better performance
        const batchSize = 1000;
        for (let i = 0; i < documents.length; i += batchSize) {
            const batch = documents.slice(i, i + batchSize);
            try {
                // Remove _id to let MongoDB generate new ones, or keep them to preserve relationships
                // We'll keep _id to preserve relationships between documents
                const result = await newCollection.insertMany(batch, { ordered: false });
                stats.migrated += result.insertedCount;
                if (i + batchSize < documents.length) {
                    process.stdout.write(`    Progress: ${Math.min(i + batchSize, documents.length)}/${documents.length}\r`);
                }
            }
            catch (error) {
                // Handle duplicate key errors (if _id already exists)
                if (error.code === 11000) {
                    // Try inserting one by one to skip duplicates
                    for (const doc of batch) {
                        try {
                            await newCollection.insertOne(doc);
                            stats.migrated++;
                        }
                        catch (err) {
                            if (err.code !== 11000) {
                                stats.errors++;
                                console.error(`    ❌ Error inserting document in "${collectionName}":`, err.message);
                            }
                        }
                    }
                }
                else {
                    stats.errors += batch.length;
                    console.error(`    ❌ Error inserting batch in "${collectionName}":`, error.message);
                }
            }
        }
        console.log(`  ✅ Migrated ${stats.migrated}/${stats.total} documents from "${collectionName}"`);
        if (stats.errors > 0) {
            console.log(`  ⚠️  ${stats.errors} errors occurred during migration`);
        }
    }
    catch (error) {
        console.error(`  ❌ Error migrating collection "${collectionName}":`, error.message);
        stats.errors = stats.total;
    }
    return stats;
}
async function migrateDatabase() {
    let oldClient = null;
    let newClient = null;
    try {
        console.log('🚀 Starting MongoDB Migration...\n');
        console.log(`📡 Old Database: ${OLD_MONGO_URI.replace(/:[^:@]+@/, ':****@')}`);
        console.log(`📡 New Database: ${NEW_MONGO_URI.replace(/:[^:@]+@/, ':****@')}\n`);
        // Connect to old database
        console.log('🔌 Connecting to old MongoDB...');
        oldClient = new MongoClient(OLD_MONGO_URI);
        await oldClient.connect();
        console.log('✅ Connected to old MongoDB\n');
        // Connect to new database
        console.log('🔌 Connecting to new MongoDB...');
        newClient = new MongoClient(NEW_MONGO_URI);
        await newClient.connect();
        console.log('✅ Connected to new MongoDB\n');
        // Get database names (extract from URI or use default)
        const oldDbName = extractDatabaseName(OLD_MONGO_URI) || getDefaultDbName(OLD_MONGO_URI);
        const newDbName = extractDatabaseName(NEW_MONGO_URI) || getDefaultDbName(NEW_MONGO_URI);
        // List available databases to help identify the correct one
        console.log('🔍 Listing available databases in old MongoDB...');
        const oldAdminDb = oldClient.db().admin();
        const oldDatabases = await oldAdminDb.listDatabases();
        const oldDbNames = oldDatabases.databases
            .map((db) => db.name)
            .filter((name) => !['admin', 'local', 'config'].includes(name));
        console.log('  Available databases:', oldDbNames.join(', ') || 'none (using default)');
        // Try to find the database with users collection
        let actualOldDbName = oldDbName;
        if (oldDbNames.length > 0) {
            // Check which database has the users collection
            for (const dbName of oldDbNames) {
                const testDb = oldClient.db(dbName);
                const collections = await testDb.listCollections().toArray();
                const hasUsers = collections.some((col) => col.name === 'users');
                if (hasUsers) {
                    actualOldDbName = dbName;
                    console.log(`  ✅ Found database with users collection: ${dbName}`);
                    break;
                }
            }
            if (actualOldDbName === oldDbName && oldDbNames.length === 1) {
                actualOldDbName = oldDbNames[0];
                console.log(`  ✅ Using database: ${actualOldDbName}`);
            }
        }
        console.log('\n🔍 Listing available databases in new MongoDB...');
        const newAdminDb = newClient.db().admin();
        const newDatabases = await newAdminDb.listDatabases();
        const newDbNames = newDatabases.databases
            .map((db) => db.name)
            .filter((name) => !['admin', 'local', 'config'].includes(name));
        console.log('  Available databases:', newDbNames.join(', ') || 'none (using default)');
        // Use the same database name for new DB, or use the first available
        let actualNewDbName = newDbName;
        if (newDbNames.length > 0 && actualOldDbName !== 'test') {
            // Try to use the same database name as old DB
            if (newDbNames.includes(actualOldDbName)) {
                actualNewDbName = actualOldDbName;
            }
            else {
                actualNewDbName = newDbNames[0];
            }
            console.log(`  ✅ Using database: ${actualNewDbName}`);
        }
        else if (actualOldDbName !== 'test') {
            actualNewDbName = actualOldDbName;
            console.log(`  ✅ Will create/use database: ${actualNewDbName}`);
        }
        console.log(`\n📚 Using Old Database: ${actualOldDbName}`);
        console.log(`📚 Using New Database: ${actualNewDbName}\n`);
        // Migrate each collection
        const allStats = [];
        for (const collectionName of COLLECTIONS) {
            console.log(`\n📦 Migrating collection: "${collectionName}"`);
            const stats = await migrateCollection(oldClient, newClient, collectionName, actualOldDbName, actualNewDbName);
            allStats.push(stats);
        }
        // Print summary
        console.log('\n' + '='.repeat(60));
        console.log('📊 MIGRATION SUMMARY');
        console.log('='.repeat(60));
        let totalDocuments = 0;
        let totalMigrated = 0;
        let totalErrors = 0;
        allStats.forEach(stat => {
            totalDocuments += stat.total;
            totalMigrated += stat.migrated;
            totalErrors += stat.errors;
            console.log(`  ${stat.collection.padEnd(20)} | Total: ${String(stat.total).padStart(6)} | ` +
                `Migrated: ${String(stat.migrated).padStart(6)} | Errors: ${String(stat.errors).padStart(4)}`);
        });
        console.log('='.repeat(60));
        console.log(`  ${'TOTAL'.padEnd(20)} | Total: ${String(totalDocuments).padStart(6)} | ` +
            `Migrated: ${String(totalMigrated).padStart(6)} | Errors: ${String(totalErrors).padStart(4)}`);
        console.log('='.repeat(60));
        if (totalErrors === 0) {
            console.log('\n✨ Migration completed successfully!');
        }
        else {
            console.log(`\n⚠️  Migration completed with ${totalErrors} errors. Please review the logs above.`);
        }
    }
    catch (error) {
        console.error('\n❌ Migration failed:', error.message);
        console.error(error);
        process.exit(1);
    }
    finally {
        // Close connections
        if (oldClient) {
            await oldClient.close();
            console.log('\n🔌 Disconnected from old MongoDB');
        }
        if (newClient) {
            await newClient.close();
            console.log('🔌 Disconnected from new MongoDB');
        }
        process.exit(0);
    }
}
function extractDatabaseName(uri) {
    try {
        const url = new URL(uri);
        const path = url.pathname;
        if (path && path.length > 1) {
            const dbName = path.substring(1).split('?')[0];
            return dbName || null;
        }
        return null;
    }
    catch {
        return null;
    }
}
function getDefaultDbName(uri) {
    // If no database name is specified in URI, MongoDB Atlas typically uses the first database
    // Common database names: 'test', 'samhita', 'kreactive', or the cluster name
    // We'll try common names, but the user should verify
    try {
        const match = uri.match(/mongodb\+srv:\/\/([^:]+):[^@]+@([^/]+)\/([^?]+)/);
        if (match && match[3] && match[3].length > 0) {
            return match[3];
        }
    }
    catch {
        // Fall through to default
    }
    // Try common database names - user should verify which one is correct
    // The script will list all databases so user can see what's available
    return 'test'; // MongoDB default, but likely should be 'samhita' or similar
}
// Run migration
migrateDatabase().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});
//# sourceMappingURL=migrate_mongodb.js.map