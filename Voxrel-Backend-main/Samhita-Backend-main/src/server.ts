import mongoose from 'mongoose';
import app from './app.js';
import { redis } from './utils/redis.utility.js';
import * as settingsService from './services/settings.service.js';

// PORT is used for server
const PORT = process.env.PORT || 10000;

// Test Redis connection (non-blocking)
const testRedisConnection = async () => {
  try {
    const redisInstance = redis();
    if (!redisInstance) {
      console.warn('⚠️ Redis is not configured. Skipping connection test.');
      return false;
    }
    await redisInstance.ping();
    console.log('✅ Successfully connected to Redis.');
    return true;
  } catch (error) {
    console.error('⚠️ Redis connection failed:', error);
    return false;
  }
};

// Connect to MongoDB Atlas
const connectMongo = async () => {
  const connectionUri = process.env.MONGO_URI;

  if (!connectionUri) {
    console.error(
      '❌ MONGO_URI is not defined. Server will not start without database connection.'
    );
    process.exit(1);
  }

  try {
    await mongoose.connect(connectionUri, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    console.log('✅ Successfully connected to MongoDB Atlas.');
  } catch (err: any) {
    console.error('❌ MongoDB connection error:', err?.message || err);
    console.error('❌ Server startup failed due to database connection error.');
    process.exit(1);
  }
};

// Initialize application settings on server start
async function initializeApplicationSettings() {
  try {
    console.log('⚙️ Initializing application settings...');

    // Get admin user ID
    const { default: User } = await import('./models/user.model.js');
    const adminUser = await User.findOne({ role: 'ADMIN' });

    if (!adminUser) {
      console.log('⚠️ No admin user found. Skipping settings initialization.');
      return;
    }

    console.log(`✅ Found admin user: ${adminUser.email}`);

    // Initialize default settings
    await settingsService.initializeDefaultSettings(adminUser._id.toString());
    console.log('✅ Application settings initialized successfully');
  } catch (error) {
    console.error('❌ Error initializing application settings:', error);
    // Don't throw error to prevent server startup failure
    console.log('⚠️ Continuing server startup without settings initialization...');
  }
}

// Start the server
(async () => {
  // Load environment variables for local development
  try {
    const dotenv = await import('dotenv');
    dotenv.config();
  } catch (e) {
    // dotenv is optional in production
    console.log('ℹ️ Dotenv not loaded (this is expected in production)');
  }

  // Connect to MongoDB
  await connectMongo();
  
  // Test Redis connection (non-blocking)
  await testRedisConnection();
  
  // Initialize application settings
  await initializeApplicationSettings();
  
  // Start Express server
  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`🚀 Server is running on 0.0.0.0:${PORT}`);
    console.log(`📡 Health check available at http://0.0.0.0:${PORT}/health`);
  });
})();
