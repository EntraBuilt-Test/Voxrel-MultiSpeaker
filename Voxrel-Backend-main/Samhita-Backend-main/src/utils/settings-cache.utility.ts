import { redisClient } from './redis.utility.js';

const SETTINGS_CACHE_PREFIX = 'app_settings:';
const CACHE_EXPIRY = 3600; // 1 hour in seconds

export class SettingsCache {
  /**
   * Get setting value from cache
   */
  static async get(
    key: string
  ): Promise<string | number | boolean | Record<string, unknown> | null> {
    try {
      const redis = redisClient();
      if (!redis) {
        return null; // Redis not configured, skip cache
      }
      const cachedValue = await redis.get(`${SETTINGS_CACHE_PREFIX}${key}`);
      if (cachedValue) {
        return JSON.parse(cachedValue as string);
      }
      return null;
    } catch (error) {
      console.error('Error getting setting from cache:', error);
      return null;
    }
  }

  /**
   * Set setting value in cache
   */
  static async set(
    key: string,
    value: string | number | boolean | Record<string, unknown>
  ): Promise<void> {
    try {
      const redis = redisClient();
      if (!redis) {
        return; // Redis not configured, skip cache
      }
      await redis.setex(`${SETTINGS_CACHE_PREFIX}${key}`, CACHE_EXPIRY, JSON.stringify(value));
    } catch (error) {
      console.error('Error setting value in cache:', error);
    }
  }

  /**
   * Delete setting from cache
   */
  static async delete(key: string): Promise<void> {
    try {
      const redis = redisClient();
      if (!redis) {
        return; // Redis not configured, skip cache
      }
      await redis.del(`${SETTINGS_CACHE_PREFIX}${key}`);
    } catch (error) {
      console.error('Error deleting setting from cache:', error);
    }
  }

  /**
   * Get all settings from cache
   */
  static async getAll(): Promise<Record<
    string,
    string | number | boolean | Record<string, unknown>
  > | null> {
    try {
      const redis = redisClient();
      if (!redis) {
        return null; // Redis not configured, skip cache
      }
      const keys = await redis.keys(`${SETTINGS_CACHE_PREFIX}*`);
      if (keys.length === 0) {
        return null;
      }

      const values = await redis.mget(keys);
      const settings: Record<string, string | number | boolean | Record<string, unknown>> = {};

      keys.forEach((key, index) => {
        const settingKey = key.replace(SETTINGS_CACHE_PREFIX, '');
        if (values[index]) {
          settings[settingKey] = JSON.parse(values[index] as string);
        }
      });

      return settings;
    } catch (error) {
      console.error('Error getting all settings from cache:', error);
      return null;
    }
  }

  /**
   * Clear all settings from cache
   */
  static async clearAll(): Promise<void> {
    try {
      const redis = redisClient();
      if (!redis) {
        return; // Redis not configured, skip cache
      }
      const keys = await redis.keys(`${SETTINGS_CACHE_PREFIX}*`);
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    } catch (error) {
      console.error('Error clearing all settings from cache:', error);
    }
  }

  /**
   * Get maxTaskPerUser setting with fallback to database
   */
  static async getMaxTaskPerUser(): Promise<number> {
    try {
      // Try to get from cache first
      const cachedValue = await this.get('MAX_TASK_PER_USER');
      if (cachedValue !== null) {
        return cachedValue as number;
      }

      // If not in cache, get from database
      const { default: ApplicationSettings } = await import(
        '@/models/application-settings.model.js'
      );
      const setting = await ApplicationSettings.findOne({
        key: 'MAX_TASK_PER_USER',
        isActive: true,
      });

      if (setting) {
        const value = setting.value as number;
        // Cache the value for future use
        await this.set('MAX_TASK_PER_USER', value);
        return value;
      }

      // Default value if not found
      const defaultValue = 20;
      await this.set('MAX_TASK_PER_USER', defaultValue);
      return defaultValue;
    } catch (error) {
      console.error('Error getting maxTaskPerUser:', error);
      return 20; // Default fallback
    }
  }
}

export default SettingsCache;
