import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });
const OLD_MONGO_URI = 'mongodb+srv://Samhitaops:Samhitaops123@cluster0.foslkww.mongodb.net/?appName=Cluster0';
const NEW_MONGO_URI = process.env.MONGO_URI ||
    'mongodb+srv://Entraiot:entraiot2026@cluster0.aszqbzy.mongodb.net/?appName=Cluster0';
async function checkUsers() {
    let oldClient = null;
    let newClient = null;
    try {
        console.log('🔍 Checking users in both databases...\n');
        // Connect to old database
        console.log('🔌 Connecting to old MongoDB...');
        oldClient = new MongoClient(OLD_MONGO_URI);
        await oldClient.connect();
        const oldDb = oldClient.db();
        const oldUsers = oldDb.collection('users');
        const oldTotal = await oldUsers.countDocuments();
        const oldAdmins = await oldUsers.countDocuments({ role: 'ADMIN' });
        const oldSuperAdmins = await oldUsers.countDocuments({ role: 'SUPER_ADMIN' });
        const oldFreelancers = await oldUsers.countDocuments({ role: 'FREELANCER' });
        console.log('📊 OLD DATABASE:');
        console.log(`  Total users: ${oldTotal}`);
        console.log(`  ADMIN users: ${oldAdmins}`);
        console.log(`  SUPER_ADMIN users: ${oldSuperAdmins}`);
        console.log(`  FREELANCER users: ${oldFreelancers}`);
        if (oldAdmins > 0 || oldSuperAdmins > 0) {
            const adminUsers = await oldUsers.find({ role: { $in: ['ADMIN', 'SUPER_ADMIN'] } }).toArray();
            console.log('\n  Admin/Super Admin users:');
            adminUsers.forEach((user) => {
                console.log(`    - ${user.email} (${user.role})`);
            });
        }
        console.log(`  Database name: ${oldDb.databaseName}\n`);
        // Connect to new database
        console.log('🔌 Connecting to new MongoDB...');
        newClient = new MongoClient(NEW_MONGO_URI);
        await newClient.connect();
        const newDb = newClient.db();
        const newUsers = newDb.collection('users');
        const newTotal = await newUsers.countDocuments();
        const newAdmins = await newUsers.countDocuments({ role: 'ADMIN' });
        const newSuperAdmins = await newUsers.countDocuments({ role: 'SUPER_ADMIN' });
        const newFreelancers = await newUsers.countDocuments({ role: 'FREELANCER' });
        console.log('📊 NEW DATABASE:');
        console.log(`  Total users: ${newTotal}`);
        console.log(`  ADMIN users: ${newAdmins}`);
        console.log(`  SUPER_ADMIN users: ${newSuperAdmins}`);
        console.log(`  FREELANCER users: ${newFreelancers}`);
        if (newAdmins > 0 || newSuperAdmins > 0) {
            const adminUsers = await newUsers.find({ role: { $in: ['ADMIN', 'SUPER_ADMIN'] } }).toArray();
            console.log('\n  Admin/Super Admin users:');
            adminUsers.forEach((user) => {
                console.log(`    - ${user.email} (${user.role})`);
            });
        }
        else {
            console.log('\n  ⚠️  No ADMIN or SUPER_ADMIN users found in new database!');
        }
        console.log(`  Database name: ${newDb.databaseName}\n`);
        // Check all collections in both databases
        console.log('📚 Collections in OLD database:');
        const oldCollections = await oldDb.listCollections().toArray();
        oldCollections.forEach(col => {
            console.log(`  - ${col.name}`);
        });
        console.log('\n📚 Collections in NEW database:');
        const newCollections = await newDb.listCollections().toArray();
        newCollections.forEach(col => {
            console.log(`  - ${col.name}`);
        });
    }
    catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
    finally {
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
checkUsers();
//# sourceMappingURL=check_users.js.map