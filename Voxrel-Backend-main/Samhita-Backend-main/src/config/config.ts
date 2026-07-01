import { config as dotenvconfig } from 'dotenv';

dotenvconfig();

export interface Databaseconfig {
  uri: string;
  options: {
    maxPoolSize: number;
    serverSelectionTimeoutMS: number;
    socketTimeoutMS: number;
    bufferMaxEntries: number;
  };
}

export interface Redisconfig {
  url: string;
  token: string;
  options: {
    retryDelayOnFailover: number;
    enableReadyCheck: boolean;
    maxRetriesPerRequest: number;
  };
}

export interface JWTconfig {
  secret: string;
  expiresIn: string;
  refreshExpiresIn: string;
}

export interface Cloudflareconfig {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucketName: string;
  publicUrl: string;
  region: string;
}

export interface Emailconfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

export interface Appconfig {
  port: number;
  nodeEnv: string;
  corsOrigins: string[];
  logLevel: string;
  maxFileSize: number;
  allowedFileTypes: string[];
}

class config {
  private static instance: config;

  private constructor() {
    this.validateRequiredEnvVars();
  }

  public static getInstance(): config {
    if (!config.instance) {
      config.instance = new config();
    }
    return config.instance;
  }

  private validateRequiredEnvVars(): void {
    const requiredVars = ['MONGO_URI', 'JWT_SECRET'];

    const missingVars = requiredVars.filter(varName => !process.env[varName]);

    if (missingVars.length > 0) {
      console.warn(
        `⚠️ Warning: Missing environment variables at startup: ${missingVars.join(
          ', '
        )}. Ensure they are available at runtime.`
      );
    }
  }

  public get database(): Databaseconfig {
    return {
      uri: process.env.MONGO_URI || 'mongodb://localhost:27017/kreactive',
      options: {
        maxPoolSize: parseInt(process.env.DB_MAX_POOL_SIZE || '10'),
        serverSelectionTimeoutMS: parseInt(process.env.DB_SERVER_SELECTION_TIMEOUT || '5000'),
        socketTimeoutMS: parseInt(process.env.DB_SOCKET_TIMEOUT || '45000'),
        bufferMaxEntries: parseInt(process.env.DB_BUFFER_MAX_ENTRIES || '0'),
      },
    };
  }

  public get redis(): Redisconfig {
    return {
      url: process.env.REDIS_URL || 'redis://localhost:6379',
      token: process.env.REDIS_TOKEN || '',
      options: {
        retryDelayOnFailover: parseInt(process.env.REDIS_RETRY_DELAY || '100'),
        enableReadyCheck: process.env.REDIS_ENABLE_READY_CHECK === 'true',
        maxRetriesPerRequest: parseInt(process.env.REDIS_MAX_RETRIES || '3'),
      },
    };
  }

  public get jwt(): JWTconfig {
    return {
      secret: process.env.JWT_SECRET || 'supersecretjwtkey',
      expiresIn: process.env.JWT_EXPIRES_IN || '24h',
      refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    };
  }

  public get cloudflare(): Cloudflareconfig {
    // Support both R2_* and CLOUDFLARE_* variable names for compatibility
    // Extract account ID from R2_ENDPOINT if CLOUDFLARE_ACCOUNT_ID is not set
    let accountId = process.env.CLOUDFLARE_ACCOUNT_ID || '';
    if (!accountId && process.env.R2_ENDPOINT) {
      const match = process.env.R2_ENDPOINT.match(/https?:\/\/([^.]+)\.r2\.cloudflarestorage\.com/);
      if (match) {
        accountId = match[1];
      }
    }
    
    // Trim all values to remove any whitespace that might cause authentication issues
    const accessKeyId = (process.env.CLOUDFLARE_ACCESS_KEY_ID || process.env.R2_ACCESS_KEY || '').trim();
    const secretAccessKey = (process.env.CLOUDFLARE_SECRET_ACCESS_KEY || process.env.R2_SECRET_KEY || '').trim();
    const bucketName = (process.env.CLOUDFLARE_R2_BUCKET_NAME || process.env.R2_BUCKET || '').trim();
    const publicUrl = (process.env.CLOUDFLARE_R2_PUBLIC_URL || process.env.R2_PUBLIC_URL || '').trim();
    const region = (process.env.CLOUDFLARE_REGION || process.env.R2_REGION || 'auto').trim();
    
    return {
      accountId: accountId.trim(),
      accessKeyId: accessKeyId,
      secretAccessKey: secretAccessKey,
      bucketName: bucketName,
      publicUrl: publicUrl,
      region: region,
    };
  }

  public get email(): Emailconfig {
    return {
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.EMAIL_PORT || '587'),
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER || '',
        pass: process.env.EMAIL_PASS || '',
      },
    };
  }

  public get app(): Appconfig {
    return {
      port: parseInt(process.env.PORT || '8080'),
      nodeEnv: process.env.NODE_ENV || 'development',
      corsOrigins: (process.env.CORS_ORIGINS || 'http://localhost:3000').split(','),
      logLevel: process.env.LOG_LEVEL || 'info',
      maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '104857600'), // 100MB
      allowedFileTypes: (process.env.ALLOWED_FILE_TYPES || 'audio/mpeg,audio/wav,audio/mp3').split(
        ','
      ),
    };
  }

  public get isDevelopment(): boolean {
    return this.app.nodeEnv === 'development';
  }

  public get isProduction(): boolean {
    return this.app.nodeEnv === 'production';
  }

  public get isTest(): boolean {
    return this.app.nodeEnv === 'test';
  }
}

export const appconfig = config.getInstance();
