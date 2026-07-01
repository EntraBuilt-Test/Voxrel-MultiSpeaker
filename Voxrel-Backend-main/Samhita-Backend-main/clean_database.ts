import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

// Import models
import Task from './src/models/task.model.js';
import Project from './src/models/project.model.js';
import Review from './src/models/review.model.js';
import Transcription from './src/models/transcription.model.js';

async function cleanDatabase() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI as string);
    console.log('✅ Connected to MongoDB');

    console.log('\n🗑️  Starting database cleanup...\n');

    // Delete all tasks
    console.log('📋 Deleting all tasks...');
    const tasksDeleted = await Task.deleteMany({});
    console.log(`✅ Deleted ${tasksDeleted.deletedCount} tasks`);

    // Delete all projects
    console.log('📁 Deleting all projects...');
    const projectsDeleted = await Project.deleteMany({});
    console.log(`✅ Deleted ${projectsDeleted.deletedCount} projects`);

    // Delete all reviews
    console.log('⭐ Deleting all reviews...');
    const reviewsDeleted = await Review.deleteMany({});
    console.log(`✅ Deleted ${reviewsDeleted.deletedCount} reviews`);

    // Delete all transcriptions
    console.log('📝 Deleting all transcriptions...');
    const transcriptionsDeleted = await Transcription.deleteMany({});
    console.log(`✅ Deleted ${transcriptionsDeleted.deletedCount} transcriptions`);

    console.log('\n✨ Database cleanup completed successfully!\n');
    console.log('Summary:');
    console.log(`  - Tasks: ${tasksDeleted.deletedCount}`);
    console.log(`  - Projects: ${projectsDeleted.deletedCount}`);
    console.log(`  - Reviews: ${reviewsDeleted.deletedCount}`);
    console.log(`  - Transcriptions: ${transcriptionsDeleted.deletedCount}`);
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    // eslint-disable-next-line no-process-exit
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Disconnected from MongoDB');
    // eslint-disable-next-line no-process-exit
    process.exit(0);
  }
}

// Run the cleanup
cleanDatabase();
