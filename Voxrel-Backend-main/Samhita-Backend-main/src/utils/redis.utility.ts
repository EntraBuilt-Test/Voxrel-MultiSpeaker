import { Redis } from '@upstash/redis';
import 'dotenv/config';

let redisClientInstance: Redis | null = null;

const createRedis = (): Redis | null => {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    console.warn(
      '⚠️ Redis disabled: missing credentials (UPSTASH_REDIS_REST_URL and/or UPSTASH_REDIS_REST_TOKEN)'
    );
    return null;
  }

  if (!redisClientInstance) {
    redisClientInstance = new Redis({
      url,
      token,
    });
  }

  return redisClientInstance;
};

// Lazy getter for Redis client
export const getRedis = (): Redis | null => {
  return createRedis();
};

// Export getter function for backward compatibility (call it to get Redis instance)
export const redis = getRedis;

// Export getter function for backward compatibility
export const redisClient = getRedis;
