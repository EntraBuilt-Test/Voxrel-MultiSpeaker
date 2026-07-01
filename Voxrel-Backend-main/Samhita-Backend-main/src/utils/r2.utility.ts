import {
  DeleteObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import 'dotenv/config';
import { v4 as uuidv4 } from 'uuid';
import { appconfig } from '@/config/config.js';
import ApiError from '@/utils/api-error.utility.js';

let r2Client: S3Client | null = null;

// Function to reset the R2 client (useful for testing or when config changes)
export const resetR2Client = (): void => {
  r2Client = null;
  console.log('[resetR2Client] R2 client cache cleared');
};

const validateR2Credentials = (): void => {
  const cloudflareConfig = appconfig.cloudflare;

  const missingVars: string[] = [];
  if (!cloudflareConfig.accountId || cloudflareConfig.accountId.trim() === '') {
    missingVars.push('CLOUDFLARE_ACCOUNT_ID');
  }
  if (!cloudflareConfig.accessKeyId || cloudflareConfig.accessKeyId.trim() === '') {
    missingVars.push('CLOUDFLARE_ACCESS_KEY_ID');
  }
  if (!cloudflareConfig.secretAccessKey || cloudflareConfig.secretAccessKey.trim() === '') {
    missingVars.push('CLOUDFLARE_SECRET_ACCESS_KEY');
  }
  if (!cloudflareConfig.bucketName || cloudflareConfig.bucketName.trim() === '') {
    missingVars.push('CLOUDFLARE_R2_BUCKET_NAME');
  }
  if (!cloudflareConfig.publicUrl || cloudflareConfig.publicUrl.trim() === '') {
    missingVars.push('CLOUDFLARE_R2_PUBLIC_URL');
  }

  if (missingVars.length > 0) {
    console.error('[validateR2Credentials] Missing R2 credentials:', missingVars);
    throw new ApiError(
      500,
      `Cloudflare R2 credentials are missing or empty. Missing variables: ${missingVars.join(', ')}. Please configure these environment variables.`
    );
  }
};

const getR2Client = (): S3Client => {
  if (!r2Client) {
    validateR2Credentials();
    const cloudflareConfig = appconfig.cloudflare;
    // Use 'us-east-1' as default region for R2 (R2 doesn't use regions but SDK requires one)
    const region = cloudflareConfig.region === 'auto' ? 'us-east-1' : cloudflareConfig.region;
    const endpoint = `https://${cloudflareConfig.accountId}.r2.cloudflarestorage.com`;
    
    console.log('[getR2Client] Creating new R2 client with configuration:', {
      endpoint: endpoint,
      bucket: cloudflareConfig.bucketName || 'MISSING',
      region: region,
      forcePathStyle: true,
      hasAccountId: !!cloudflareConfig.accountId,
      hasAccessKey: !!cloudflareConfig.accessKeyId,
      hasSecretKey: !!cloudflareConfig.secretAccessKey,
    });
    
    r2Client = new S3Client({
      region: region,
      endpoint: endpoint,
      credentials: {
        accessKeyId: cloudflareConfig.accessKeyId,
        secretAccessKey: cloudflareConfig.secretAccessKey,
      },
      forcePathStyle: true, // R2 requires path-style URLs (not virtual-hosted-style)
    });
    
    console.log('[getR2Client] R2 client created successfully');
  }
  return r2Client;
};

const getCloudflareConfig = () => {
  validateR2Credentials();
  return appconfig.cloudflare;
};

export const uploadFileToR2 = async (
  file: Express.Multer.File,
  folder: string = 'audio'
): Promise<string> => {
  try {
    console.log('[uploadFileToR2] Starting upload:', {
      folder,
      fileName: file.originalname,
      fileSize: file.size,
      mimeType: file.mimetype,
      hasBuffer: !!file.buffer,
      bufferSize: file.buffer?.length,
    });

    // Validate file buffer exists
    if (!file.buffer || file.buffer.length === 0) {
      console.error('[uploadFileToR2] File buffer is empty or missing');
      throw new ApiError(400, 'File buffer is empty or missing');
    }

    const r2 = getR2Client();
    const cloudflareConfig = getCloudflareConfig();

    console.log('[uploadFileToR2] R2 configuration:', {
      accountId: cloudflareConfig.accountId ? '***' : 'MISSING',
      bucketName: cloudflareConfig.bucketName || 'MISSING',
      publicUrl: cloudflareConfig.publicUrl || 'MISSING',
      region: cloudflareConfig.region,
      hasAccessKey: !!cloudflareConfig.accessKeyId,
      hasSecretKey: !!cloudflareConfig.secretAccessKey,
    });

    // Generate unique filename
    const fileExtension = file.originalname.split('.').pop() || 'bin';
    const fileName = `${folder}/${uuidv4()}.${fileExtension}`;

    console.log('[uploadFileToR2] Generated file name:', fileName);

    // Upload file to R2
    const uploadCommand = new PutObjectCommand({
      Bucket: cloudflareConfig.bucketName,
      Key: fileName,
      Body: file.buffer,
      ContentType: file.mimetype || 'application/octet-stream',
      ContentDisposition: 'inline',
    });

    console.log('[uploadFileToR2] Sending upload command to R2...');
    await r2.send(uploadCommand);
    console.log('[uploadFileToR2] Upload command completed successfully');

    // Return the public URL
    const publicUrl = `${cloudflareConfig.publicUrl}/${fileName}`;
    console.log('[uploadFileToR2] Upload successful, public URL:', publicUrl);
    return publicUrl;
  } catch (error: any) {
    const cloudflareConfig = getCloudflareConfig();
    console.error('[uploadFileToR2] Error uploading file to R2:', {
      error: error.message,
      errorName: error.name,
      errorCode: error.code,
      stack: error.stack,
      folder,
      fileName: file?.originalname,
      // Log configuration (masked) for debugging
      config: {
        endpoint: `https://${cloudflareConfig.accountId ? '***' : 'MISSING'}.r2.cloudflarestorage.com`,
        bucket: cloudflareConfig.bucketName || 'MISSING',
        region: cloudflareConfig.region,
        hasAccountId: !!cloudflareConfig.accountId,
        hasAccessKey: !!cloudflareConfig.accessKeyId,
        hasSecretKey: !!cloudflareConfig.secretAccessKey,
        hasBucket: !!cloudflareConfig.bucketName,
      },
    });

    // If it's already an ApiError, re-throw it
    if (error instanceof ApiError) {
      throw error;
    }

    // Handle AWS SDK errors
    if (error.name === 'NoSuchBucket' || error.code === 'NoSuchBucket') {
      throw new ApiError(500, `R2 bucket not found: ${error.message}`);
    }
    if (error.name === 'InvalidAccessKeyId' || error.code === 'InvalidAccessKeyId') {
      throw new ApiError(500, 'Invalid R2 access key. Please check your credentials.');
    }
    if (error.name === 'SignatureDoesNotMatch' || error.code === 'SignatureDoesNotMatch') {
      console.error('[uploadFileToR2] SignatureDoesNotMatch - This usually means:');
      console.error('  1. Credentials are incorrect');
      console.error('  2. forcePathStyle is missing (should be true for R2)');
      console.error('  3. Endpoint URL is incorrect');
      console.error('  4. Region mismatch');
      throw new ApiError(500, 'R2 authentication failed. Please check your credentials and ensure forcePathStyle is enabled.');
    }
    if (error.name === 'AccessDenied' || error.code === 'AccessDenied') {
      throw new ApiError(500, 'Access denied to R2 bucket. Please check permissions.');
    }
    if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      throw new ApiError(503, `Cannot connect to R2 storage: ${error.message}`);
    }

    // Generic error
    throw new ApiError(500, `Failed to upload file to R2: ${error.message || 'Unknown error'}`);
  }
};

export const uploadFilesToR2 = async (
  files: Express.Multer.File[],
  folder: string = 'audio',
  options?: { concurrency?: number }
): Promise<{ successes: string[]; failures: { index: number; error: string }[] }> => {
  const r2 = getR2Client();
  const cloudflareConfig = getCloudflareConfig();

  const concurrency = Math.max(
    1,
    Math.min(10, options?.concurrency || parseInt(process.env.R2_UPLOAD_CONCURRENCY || '4'))
  );

  const tasks = files.map((file, _index) => async () => {
    try {
      const fileExtension = file.originalname.split('.').pop();
      const fileName = `${folder}/${uuidv4()}.${fileExtension}`;

      // Use multipart-capable uploader for reliability on larger files
      const uploader = new Upload({
        client: r2,
        params: {
          Bucket: cloudflareConfig.bucketName,
          Key: fileName,
          Body: file.buffer,
          ContentType: file.mimetype,
          ContentDisposition: 'inline',
        },
        queueSize: concurrency,
        leavePartsOnError: false,
      });

      await uploader.done();
      return { url: `${cloudflareConfig.publicUrl}/${fileName}` };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      return { error: message };
    }
  });

  const results: { successes: string[]; failures: { index: number; error: string }[] } = {
    successes: [],
    failures: [],
  };

  // Simple concurrency control
  let i = 0;
  const workers = Array.from({ length: Math.min(concurrency, tasks.length) }).map(async () => {
    while (i < tasks.length) {
      const current = i++;
      const result = await tasks[current]();
      if ('url' in result && result.url) {
        results.successes.push(result.url);
      } else if ('error' in result && result.error) {
        results.failures.push({ index: current, error: result.error });
      }
    }
  });
  await Promise.all(workers);

  return results;
};

export interface R2StorageInfo {
  totalSizeBytes: number;
  totalSizeGB: number;
  totalSizeMB: number;
  totalFiles: number;
  averageFileSizeMB: number;
}

export const getR2StorageInfo = async (): Promise<R2StorageInfo> => {
  try {
    const r2 = getR2Client();
    const cloudflareConfig = getCloudflareConfig();

    let totalSizeBytes = 0;
    let totalFiles = 0;

    let continuationToken: string | undefined;

    do {
      const listCommand = new ListObjectsV2Command({
        Bucket: cloudflareConfig.bucketName,
        ContinuationToken: continuationToken,
        MaxKeys: 1000, // Process in batches
      });

      const response = await r2.send(listCommand);

      if (response.Contents) {
        processObjects(response.Contents);
      }

      continuationToken = response.NextContinuationToken;
    } while (continuationToken);

    function processObjects(contents: { Key?: string; Size?: number }[]) {
      for (const object of contents) {
        if (object.Key && object.Size !== undefined) {
          totalSizeBytes += object.Size;
          totalFiles++;
        }
      }
    }

    const totalSizeGB = totalSizeBytes / (1024 * 1024 * 1024);
    const totalSizeMB = totalSizeBytes / (1024 * 1024);
    const averageFileSizeMB = totalFiles > 0 ? totalSizeMB / totalFiles : 0;

    return {
      totalSizeBytes,
      totalSizeGB: Math.round(totalSizeGB * 100) / 100, // Round to 2 decimal places
      totalSizeMB: Math.round(totalSizeMB * 100) / 100,
      totalFiles,
      averageFileSizeMB: Math.round(averageFileSizeMB * 100) / 100,
    };
  } catch (error) {
    console.error('Error getting R2 storage info:', error);
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(500, 'Failed to get R2 storage information');
  }
};

export const getR2FileCount = async (): Promise<number> => {
  try {
    const r2 = getR2Client();
    const cloudflareConfig = getCloudflareConfig();

    let totalFiles = 0;
    let continuationToken: string | undefined;

    do {
      const listCommand = new ListObjectsV2Command({
        Bucket: cloudflareConfig.bucketName,
        ContinuationToken: continuationToken,
        MaxKeys: 1000,
      });

      const response = await r2.send(listCommand);

      if (response.Contents) {
        totalFiles += response.Contents.length;
      }

      continuationToken = response.NextContinuationToken;
    } while (continuationToken);

    return totalFiles;
  } catch (error) {
    console.error('Error getting R2 file count:', error);
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(500, 'Failed to get R2 file count');
  }
};

export const deleteR2File = async (key: string): Promise<void> => {
  try {
    const r2 = getR2Client();
    const cloudflareConfig = getCloudflareConfig();

    const deleteCommand = new DeleteObjectCommand({
      Bucket: cloudflareConfig.bucketName,
      Key: key,
    });

    await r2.send(deleteCommand);
  } catch (error) {
    console.error('Error deleting R2 file:', error);
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(500, 'Failed to delete R2 file');
  }
};

export default getR2Client;
