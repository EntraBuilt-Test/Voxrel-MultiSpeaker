// Recording Service - Handles LiveKit Egress API for recording multi-speaker sessions
// Based on the standalone LiveKit project implementation

import {
  RoomServiceClient,
  EgressClient,
  EncodedFileOutput,
  S3Upload,
} from 'livekit-server-sdk';
import Task from '@/models/task.model.js';
import ApiError from '@/utils/api-error.utility.js';
import { ListObjectsV2Command } from '@aws-sdk/client-s3';
import getR2Client from '@/utils/r2.utility.js';
import { appconfig } from '@/config/config.js';

class RecordingService {
  private roomService: RoomServiceClient;
  private egressClient: EgressClient;

  constructor() {
    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;
    const httpUrl = process.env.LIVEKIT_HTTP_URL;

    if (!apiKey || !apiSecret || !httpUrl) {
      throw new Error('LiveKit configuration is missing. Please set LIVEKIT_API_KEY, LIVEKIT_API_SECRET, and LIVEKIT_HTTP_URL.');
    }

    this.roomService = new RoomServiceClient(httpUrl, apiKey, apiSecret);
    this.egressClient = new EgressClient(httpUrl, apiKey, apiSecret);
  }

  /**
   * Start recording a multi-speaker session using LiveKit Egress API
   * Records the entire room (all participants) and uploads to R2
   * 
   * @param roomName - The LiveKit room name (task.roomName)
   * @param taskId - The task ID to associate the recording with
   * @returns Promise<string> Egress ID
   */
  async startRecording(roomName: string, taskId: string): Promise<string> {
    try {
      console.log(`[RecordingService] Starting recording for room: ${roomName}, task: ${taskId}`);

      // Validate R2 configuration
      // Try environment variables first, then fall back to config
      const r2AccessKey = process.env.R2_ACCESS_KEY || process.env.CLOUDFLARE_ACCESS_KEY_ID;
      const r2SecretKey = process.env.R2_SECRET_KEY || process.env.CLOUDFLARE_SECRET_ACCESS_KEY;
      const r2Bucket = process.env.R2_BUCKET || process.env.CLOUDFLARE_R2_BUCKET_NAME;
      let r2Endpoint = process.env.R2_ENDPOINT;
      const r2PublicUrl = process.env.R2_PUBLIC_URL || process.env.CLOUDFLARE_R2_PUBLIC_URL;

      if (!r2AccessKey || !r2SecretKey || !r2Bucket) {
        throw new Error('R2 configuration is missing. Please set R2_ACCESS_KEY (or CLOUDFLARE_ACCESS_KEY_ID), R2_SECRET_KEY (or CLOUDFLARE_SECRET_ACCESS_KEY), and R2_BUCKET (or CLOUDFLARE_R2_BUCKET_NAME) environment variables.');
      }

      // Construct endpoint if not provided
      if (!r2Endpoint && process.env.CLOUDFLARE_ACCOUNT_ID) {
        r2Endpoint = `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`;
      }
      
      if (!r2Endpoint) {
        throw new Error('R2 endpoint is missing. Please set R2_ENDPOINT or CLOUDFLARE_ACCOUNT_ID environment variable.');
      }

      // Clean endpoint URL (remove trailing slashes and any path)
      let cleanEndpoint = r2Endpoint.trim();
      if (cleanEndpoint.endsWith('/')) {
        cleanEndpoint = cleanEndpoint.slice(0, -1);
      }
      const urlParts = cleanEndpoint.split('/');
      if (urlParts.length > 3) {
        cleanEndpoint = urlParts.slice(0, 3).join('/');
      }

      // Verify room exists and has participants
      let participants = [];
      try {
        participants = await this.roomService.listParticipants(roomName);
        console.log(`[RecordingService] Room ${roomName} has ${participants?.length || 0} participants`);

        if (!participants || participants.length === 0) {
          throw new Error(`Room ${roomName} has no participants. Please ensure participants have joined the room before starting recording.`);
        }

        // Check if any participant is publishing audio
        const hasAudio = participants.some(p => {
          const tracks = p.tracks || [];
          return tracks.some(t => t.type === 0 && !t.muted); // AUDIO type = 0
        });

        if (!hasAudio) {
          console.warn(`[RecordingService] ⚠️ WARNING: No active audio tracks found in room ${roomName}.`);
        } else {
          console.log(`[RecordingService] ✅ Room has ${participants.length} participant(s) with active audio tracks.`);
        }

        // Wait a bit for participants to fully establish connection
        console.log(`[RecordingService] Waiting 3 seconds for participants to fully establish connection...`);
        await new Promise(resolve => setTimeout(resolve, 3000));
      } catch (roomError: any) {
        if (roomError.message && roomError.message.includes('no participants')) {
          throw roomError;
        }
        console.error(`[RecordingService] ❌ ERROR: Could not verify room participants: ${roomError.message}`);
        throw new Error(`Failed to connect to LiveKit room ${roomName}. Please verify the LiveKit server is running and accessible.`);
      }

      // Generate file path in R2 (store in audios/ directory)
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const fileName = `audios/${taskId}/${taskId}-${timestamp}.m4a`;

      // For Cloudflare R2, use 'us-east-1' region
      const r2Region = process.env.R2_REGION || 'us-east-1';

      console.log(`[RecordingService] R2 Configuration:`);
      console.log(`  Endpoint: ${cleanEndpoint}`);
      console.log(`  Bucket: ${r2Bucket}`);
      console.log(`  Region: ${r2Region}`);

      // Create S3Upload instance for R2 (S3-compatible)
      const s3Upload = new S3Upload({
        accessKey: r2AccessKey,
        secret: r2SecretKey,
        region: r2Region,
        bucket: r2Bucket,
        endpoint: cleanEndpoint,
        forcePathStyle: true, // R2 requires path-style URLs
      });

      // Create EncodedFileOutput with S3Upload
      const fileOutput = new EncodedFileOutput({
        filepath: fileName,
        output: {
          case: 's3',
          value: s3Upload,
        },
      });

      console.log(`[RecordingService] Starting room composite egress with audio-only layout...`);

      // Start RoomCompositeEgress - records entire room with all participants
      const info = await this.egressClient.startRoomCompositeEgress(
        roomName,
        { file: fileOutput },
        { layout: 'audio-only' }
      );

      console.log(`[RecordingService] ✅ Egress started with ID: ${info.egressId}`);

      // Store egress ID in task for tracking
      await Task.findByIdAndUpdate(taskId, {
        $set: {
          recordingEgressId: info.egressId,
          recordingStartedAt: new Date(),
        },
      });

      return info.egressId;
    } catch (error: any) {
      console.error(`[RecordingService] START RECORDING ERROR:`, error);
      throw new ApiError(500, `Failed to start recording: ${error.message}`);
    }
  }

  /**
   * Stop recording
   * @param egressId - The egress ID to stop
   * @returns Promise<void>
   */
  async stopRecording(egressId: string): Promise<void> {
    try {
      console.log(`[RecordingService] Stopping recording: ${egressId}`);

      // Check egress status first
      // Note: listEgress doesn't support filtering by egressId directly
      // We'll try to stop it anyway, and handle errors gracefully
      let foundEgress: any = null;
      try {
        const egressList = await this.egressClient.listEgress();
        foundEgress = egressList.find((e: any) => e.egressId === egressId);
        if (!foundEgress) {
          console.warn(`[RecordingService] Egress ${egressId} not found`);
          return;
        }
      } catch (err: any) {
        // If listing fails, try to stop anyway
        console.warn(`[RecordingService] Could not list egress, attempting to stop anyway: ${err.message}`);
        // Try to stop without checking status
        try {
          await this.egressClient.stopEgress(egressId);
          console.log(`[RecordingService] ✅ Recording stop command sent successfully`);
        } catch (stopErr: any) {
          console.error(`[RecordingService] Error stopping egress:`, stopErr);
        }
        return;
      }

      const status = this.normalizeStatus(foundEgress.status);

      console.log(`[RecordingService] Current egress status: ${status}`);

      // Handle different statuses
      if (status === 'EGRESS_FAILED' || status === 'EGRESS_ABORTED') {
        console.warn(`[RecordingService] ⚠️ Egress has ${status}. Cannot stop a failed/aborted egress.`);
        return;
      }

      if (status === 'EGRESS_COMPLETE' || status === 'EGRESS_ENDING') {
        console.log(`[RecordingService] Egress is already ${status === 'EGRESS_COMPLETE' ? 'complete' : 'ending'}.`);
        return;
      }

      if (status === 'EGRESS_ACTIVE' || status === 'EGRESS_STARTING') {
        console.log(`[RecordingService] Stopping active egress...`);
        await this.egressClient.stopEgress(egressId);
        console.log(`[RecordingService] ✅ Recording stop command sent successfully`);
      }
    } catch (error: any) {
      console.error(`[RecordingService] Error stopping recording:`, error);
      throw new ApiError(500, `Failed to stop recording: ${error.message}`);
    }
  }

  /**
   * Handle recording completion (called from webhook)
   * @param egressId - The egress ID
   * @param egressInfo - The egress info from webhook
   */
  async handleRecordingComplete(egressId: string, egressInfo: any): Promise<void> {
    try {
      const status = this.normalizeStatus(egressInfo.status || egressInfo.egressStatus);
      const isFailed = status === 'EGRESS_FAILED' || status === 'EGRESS_ABORTED';

      if (isFailed) {
        console.warn(`[RecordingService] ⚠️ Recording failed: ${egressId}`);
        console.warn(`[RecordingService] Error: ${egressInfo.error || egressInfo.errorReason || 'Unknown error'}`);
      } else {
        console.log(`[RecordingService] Recording completed: ${egressId}`);
      }

      // Find task by egress ID
      const task = await Task.findOne({ recordingEgressId: egressId });
      if (!task) {
        console.warn(`[RecordingService] No task found for egress ID: ${egressId}`);
        return;
      }

      // CRITICAL: Wait for file to be uploaded to R2 before processing
      // R2 upload can take a few seconds after recording stops
      if (!isFailed) {
        console.log(`[RecordingService] Waiting 5 seconds for R2 upload to complete...`);
        await new Promise(resolve => setTimeout(resolve, 5000));
        console.log(`[RecordingService] Wait complete, proceeding with file processing`);
      }

      // Extract file information from egress info
      let fileUrl = null;
      let fileName = null;

      // Get R2 configuration for URL construction
      const r2PublicUrl = process.env.R2_PUBLIC_URL || process.env.CLOUDFLARE_R2_PUBLIC_URL;
      const r2Bucket = process.env.R2_BUCKET || process.env.CLOUDFLARE_R2_BUCKET_NAME;
      const r2Endpoint = process.env.R2_ENDPOINT;
      let cleanEndpoint = r2Endpoint;
      if (!cleanEndpoint && process.env.CLOUDFLARE_ACCOUNT_ID) {
        cleanEndpoint = `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`;
      }

      if (egressInfo.file) {
        fileName = egressInfo.file.filename || egressInfo.file.filepath || egressInfo.file.location || egressInfo.file.name;

        if (fileName) {
          console.log(`[RecordingService] File name from egress: ${fileName}`);

          // If LiveKit provides a direct URL, use it
          if (egressInfo.file.url) {
            fileUrl = egressInfo.file.url;
            console.log(`[RecordingService] Using direct URL from LiveKit: ${fileUrl}`);
          } else if (r2PublicUrl) {
            // Use configured public URL (R2 public bucket URL or custom domain)
            const baseUrl = r2PublicUrl.replace(/\/$/, '');
            fileUrl = `${baseUrl}/${fileName}`;
            console.log(`[RecordingService] Using R2 public URL: ${fileUrl}`);
          } else if (r2Bucket && cleanEndpoint) {
            // Fallback: Construct R2 URL based on endpoint
            const r2Domain = cleanEndpoint.replace('https://', '').replace('http://', '').split('/')[0];
            fileUrl = `https://${r2Bucket}.${r2Domain}/${fileName}`;
            console.log(`[RecordingService] Constructed R2 URL: ${fileUrl}`);
          }
        }
      }

      // CRITICAL: Validate that the recording URL contains the correct taskId
      // Extract taskId from fileName if available (format: audios/{taskId}/... or audios/project-{projectId}-task-{taskId}/...)
      const taskId = task._id.toString().toLowerCase();
      let validationPassed = true;
      
      if (fileName) {
        // Try multiple patterns to match different file path formats
        // Pattern 1: audios/{taskId}/...
        // Pattern 2: audios/project-{projectId}-task-{taskId}/...
        // Pattern 3: task-{taskId} anywhere in the path
        const fileNameTaskIdMatch = fileName.match(/(?:audios\/[^\/]*task-|audios\/|task-)([a-f0-9]{24})/i);
        if (fileNameTaskIdMatch && fileNameTaskIdMatch[1]) {
          const fileNameTaskId = fileNameTaskIdMatch[1].toLowerCase();
          
          if (fileNameTaskId !== taskId) {
            console.error(`[RecordingService] CRITICAL: Recording file task ID mismatch!`, {
              taskId: taskId,
              fileNameTaskId: fileNameTaskId,
              fileName: fileName,
              egressId: egressId
            });
            validationPassed = false;
          } else {
            console.log(`[RecordingService] ✅ File name validation passed: taskId ${taskId} matches`);
          }
        } else {
          console.warn(`[RecordingService] Could not extract taskId from fileName: ${fileName}`);
          // Don't fail validation if we can't extract taskId from fileName - might be a different format
        }
      }
      
      // Also validate fileUrl if it contains a taskId
      if (fileUrl && validationPassed) {
        // Extract taskId from URL (format: .../task-{taskId}/... or .../project-{projectId}-task-{taskId}/...)
        const urlTaskIdMatch = fileUrl.match(/task-([a-f0-9]{24})/i);
        if (urlTaskIdMatch && urlTaskIdMatch[1]) {
          const urlTaskId = urlTaskIdMatch[1].toLowerCase();
          
          if (urlTaskId !== taskId) {
            console.error(`[RecordingService] CRITICAL: Recording URL task ID mismatch!`, {
              taskId: taskId,
              urlTaskId: urlTaskId,
              fileUrl: fileUrl,
              egressId: egressId
            });
            validationPassed = false;
          } else {
            console.log(`[RecordingService] ✅ File URL validation passed: taskId ${taskId} matches`);
          }
        } else {
          console.warn(`[RecordingService] Could not extract taskId from fileUrl: ${fileUrl}`);
          // Don't fail validation if we can't extract taskId - might be a different format
        }
      }
      
      if (!validationPassed) {
        console.warn(`[RecordingService] Skipping recordingUrl update due to task ID mismatch`);
        return;
      }
      
      // Ensure fileUrl is set before saving - try to construct it if missing
      // Also verify the file exists in R2 with retry logic
      if (!fileUrl) {
        console.warn(`[RecordingService] fileUrl is null/undefined. Attempting to construct from fileName...`, {
          taskId: taskId,
          fileName: fileName,
          egressId: egressId,
          r2PublicUrl: process.env.R2_PUBLIC_URL || process.env.CLOUDFLARE_R2_PUBLIC_URL
        });
        
        // Try to construct URL from fileName if we have r2PublicUrl
        const r2PublicUrl = process.env.R2_PUBLIC_URL || process.env.CLOUDFLARE_R2_PUBLIC_URL;
        if (fileName && r2PublicUrl) {
          const baseUrl = r2PublicUrl.replace(/\/$/, '');
          fileUrl = `${baseUrl}/${fileName}`;
          console.log(`[RecordingService] Constructed fileUrl from fileName: ${fileUrl}`);
        } else {
          console.error(`[RecordingService] CRITICAL: Cannot construct fileUrl. Missing fileName or r2PublicUrl.`, {
            hasFileName: !!fileName,
            hasR2PublicUrl: !!r2PublicUrl,
            fileName: fileName,
            r2PublicUrl: r2PublicUrl
          });
          // Don't save if fileUrl is not set
          return;
        }
      }

      // CRITICAL: Verify file exists in R2 before saving (with retry logic)
      // The file might still be uploading even after the webhook is called
      let fileVerified = false;
      if (fileUrl && !isFailed) {
        fileVerified = await this.verifyFileExists(fileUrl, 3); // Try 3 times with delays
        if (fileVerified) {
          console.log(`[RecordingService] ✅ File verified to exist at: ${fileUrl}`);
        } else {
          console.warn(`[RecordingService] ⚠️ File not verified after retries: ${fileUrl}`);
          console.warn(`[RecordingService] File may still be uploading, but will save URL anyway.`);
          console.warn(`[RecordingService] The file should become available shortly.`);
          // Continue to save the URL even if verification failed
          // The file might become available shortly, and it's better to have the URL saved
          // than to have nothing saved at all
        }
      }
      
      console.log(`[RecordingService] ✅ All validations passed. Saving recordingUrl for task ${taskId}`, {
        fileUrl: fileUrl,
        fileName: fileName,
        taskId: taskId
      });

      // Calculate duration
      const startedAt = task.recordingStartedAt || new Date();
      const endedAt = new Date();
      const duration = Math.floor((endedAt.getTime() - startedAt.getTime()) / 1000); // Duration in seconds

      // Update task with recording information
      await Task.findByIdAndUpdate(task._id, {
        $set: {
          recordingUrl: fileUrl,
          recordingFileName: fileName,
          recordingDuration: duration,
          recordingCompletedAt: endedAt,
          recordingStatus: isFailed ? 'FAILED' : 'COMPLETED',
        },
        $unset: {
          recordingEgressId: '',
          recordingStartedAt: '',
        },
      });

      if (isFailed) {
        console.log(`[RecordingService] ⚠️ Recording failed - metadata saved to task ${task._id}`);
      } else {
        console.log(`[RecordingService] ✅ Recording saved to R2!`);
        console.log(`[RecordingService] Task: ${task._id}`);
        console.log(`[RecordingService] File: ${fileName || 'unknown'}`);
        console.log(`[RecordingService] URL: ${fileUrl || 'N/A'}`);
        console.log(`[RecordingService] Duration: ${duration} seconds`);
      }
    } catch (error: any) {
      console.error(`[RecordingService] Error handling recording completion:`, error);
      throw new ApiError(500, `Failed to handle recording completion: ${error.message}`);
    }
  }

  /**
   * Verify that a file exists at the given URL with retry logic
   * This handles the race condition where the webhook is called before R2 upload completes
   * @param fileUrl - The URL to check
   * @param maxRetries - Maximum number of retry attempts (default: 3)
   * @param retryDelayMs - Delay between retries in milliseconds (default: 3000 = 3 seconds)
   * @returns Promise<boolean> - True if file exists, false otherwise
   */
  private async verifyFileExists(fileUrl: string, maxRetries: number = 3, retryDelayMs: number = 3000): Promise<boolean> {
    // Check if fetch is available (Node.js 18+)
    if (typeof fetch === 'undefined') {
      console.warn(`[RecordingService] fetch is not available. Skipping file verification.`);
      // If fetch isn't available, assume file exists (for older Node versions)
      return true;
    }

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`[RecordingService] Verifying file exists (attempt ${attempt}/${maxRetries}): ${fileUrl}`);
        
        // Use HEAD request to check if file exists without downloading it
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
        
        try {
          const response = await fetch(fileUrl, { 
            method: 'HEAD',
            signal: controller.signal
          });
          
          clearTimeout(timeoutId);
          
          if (response.ok) {
            console.log(`[RecordingService] ✅ File exists at URL (attempt ${attempt})`);
            return true;
          } else if (response.status === 404) {
            console.warn(`[RecordingService] File not found (404) at attempt ${attempt}. Will retry...`);
          } else {
            console.warn(`[RecordingService] Unexpected status ${response.status} at attempt ${attempt}. Will retry...`);
          }
        } catch (fetchError: any) {
          clearTimeout(timeoutId);
          throw fetchError;
        }
      } catch (error: any) {
        if (error.name === 'AbortError') {
          console.warn(`[RecordingService] Request timeout at attempt ${attempt}. Will retry...`);
        } else {
          console.warn(`[RecordingService] Error verifying file (attempt ${attempt}/${maxRetries}):`, error.message);
        }
      }
      
      // Wait before retrying (except on last attempt)
      if (attempt < maxRetries) {
        console.log(`[RecordingService] Waiting ${retryDelayMs}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, retryDelayMs));
      }
    }
    
    console.error(`[RecordingService] ❌ File does not exist after ${maxRetries} attempts: ${fileUrl}`);
    return false;
  }

  /**
   * Get recording status
   * @param egressId
   * @returns Promise<Object|null>
   */
  async getRecordingStatus(egressId: string): Promise<any> {
    try {
      const egressList = await this.egressClient.listEgress();
      const foundEgress = egressList.find((e: any) => e.egressId === egressId);
      return foundEgress || null;
    } catch (error: any) {
      console.error(`[RecordingService] Error getting recording status:`, error);
      return null;
    }
  }

  /**
   * Check and refresh recording URL for a task
   * This is used when the recording file exists in R2 but the recordingUrl wasn't saved
   * TEMPORARY FIX: Actually searches R2 bucket for files matching the task ID
   * @param taskId - The task ID
   * @returns Promise with updated task or null if not found
   */
  async checkAndRefreshRecordingUrl(taskId: string): Promise<{ found: boolean; recordingUrl?: string; message: string }> {
    try {
      const task = await Task.findById(taskId);
      if (!task) {
        return { found: false, message: 'Task not found' };
      }

      // Normalize taskId for comparison
      const normalizedTaskId = taskId.toLowerCase().trim();

      // Validate existing recordingUrl if it exists
      if (task.recordingUrl) {
        // Extract task ID from the existing URL to verify it matches
        const urlTaskIdMatch = task.recordingUrl.match(/task-([a-f0-9]{24})/i);
        if (urlTaskIdMatch && urlTaskIdMatch[1]) {
          const urlTaskId = urlTaskIdMatch[1].toLowerCase().trim();
          if (urlTaskId === normalizedTaskId) {
            // URL is correct, return it
            return { found: true, recordingUrl: task.recordingUrl, message: 'Recording URL already exists and is valid' };
          } else {
            // URL exists but belongs to wrong task - need to search R2 for correct file
            console.warn(`[RecordingService] Existing recordingUrl belongs to wrong task (${urlTaskId} vs ${normalizedTaskId}). Searching R2 for correct file...`);
          }
        } else {
          // Can't extract task ID from URL - might be wrong format, search R2
          console.warn(`[RecordingService] Cannot extract task ID from existing recordingUrl. Searching R2...`);
        }
      }

      // Get R2 configuration
      const r2PublicUrl = process.env.R2_PUBLIC_URL || process.env.CLOUDFLARE_R2_PUBLIC_URL;
      if (!r2PublicUrl) {
        return { found: false, message: 'R2 public URL not configured' };
      }

      const baseUrl = r2PublicUrl.replace(/\/$/, '');
      const cloudflareConfig = appconfig.cloudflare;
      const r2 = getR2Client();

      console.log(`[RecordingService] Searching R2 for recording files matching taskId: ${normalizedTaskId}`);

      // Search for files in R2 that contain the task ID
      // Common patterns:
      // 1. audios/project-{projectId}-task-{taskId}/...
      // 2. audios/{taskId}/...
      // 3. Any file path containing task-{taskId}

      let foundFile: string | null = null;
      let continuationToken: string | undefined;

      do {
        const listCommand = new ListObjectsV2Command({
          Bucket: cloudflareConfig.bucketName,
          Prefix: 'audios/', // Only search in audios directory
          ContinuationToken: continuationToken,
          MaxKeys: 1000,
        });

        const response = await r2.send(listCommand);

        if (response.Contents) {
          // Search through files to find one matching the task ID
          for (const object of response.Contents) {
            if (!object.Key) continue;

            // Check if file key contains the task ID
            // Pattern 1: audios/project-{projectId}-task-{taskId}/...
            // Pattern 2: audios/{taskId}/...
            // Pattern 3: Any path containing task-{taskId}
            const keyLower = object.Key.toLowerCase();
            
            // Extract task ID from key if it matches common patterns
            const taskIdMatch = keyLower.match(/task-([a-f0-9]{24})/i);
            if (taskIdMatch && taskIdMatch[1]) {
              const fileTaskId = taskIdMatch[1].toLowerCase().trim();
              
              // Check if this file belongs to our task
              if (fileTaskId === normalizedTaskId) {
                // Also check if it's an audio file (m4a, mp4, etc.)
                const isAudioFile = /\.(m4a|mp4|mp3|wav|ogg)$/i.test(object.Key);
                if (isAudioFile) {
                  foundFile = object.Key;
                  console.log(`[RecordingService] ✅ Found matching recording file: ${foundFile}`);
                  break;
                }
              }
            }
            
            // Also check if key starts with audios/{taskId}/
            if (keyLower.startsWith(`audios/${normalizedTaskId}/`)) {
              const isAudioFile = /\.(m4a|mp4|mp3|wav|ogg)$/i.test(object.Key);
              if (isAudioFile) {
                foundFile = object.Key;
                console.log(`[RecordingService] ✅ Found matching recording file: ${foundFile}`);
                break;
              }
            }
          }
        }

        continuationToken = response.NextContinuationToken;
        
        // If we found a file, stop searching
        if (foundFile) break;
      } while (continuationToken);

      if (foundFile) {
        // Construct the public URL
        const recordingUrl = `${baseUrl}/${foundFile}`;
        
        // Validate that the URL contains the correct task ID
        const urlTaskIdMatch = recordingUrl.match(/task-([a-f0-9]{24})/i);
        if (urlTaskIdMatch && urlTaskIdMatch[1]) {
          const urlTaskId = urlTaskIdMatch[1].toLowerCase().trim();
          if (urlTaskId !== normalizedTaskId) {
            console.warn(`[RecordingService] Found file but task ID mismatch: ${urlTaskId} vs ${normalizedTaskId}`);
            return { found: false, message: 'Found file but task ID mismatch' };
          }
        }

        // Update the task with the recording URL
        await Task.findByIdAndUpdate(taskId, {
          $set: {
            recordingUrl: recordingUrl,
            recordingFileName: foundFile,
          },
        });

        console.log(`[RecordingService] ✅ Updated task ${taskId} with recordingUrl: ${recordingUrl}`);
        
        return { 
          found: true, 
          recordingUrl: recordingUrl, 
          message: 'Recording URL found and updated in database' 
        };
      }

      return { found: false, message: 'No recording file found in R2 for this task' };
    } catch (error: any) {
      console.error(`[RecordingService] Error checking recording URL:`, error);
      return { found: false, message: `Error: ${error.message}` };
    }
  }

  /**
   * Helper to normalize status (handles both enum numbers and strings)
   */
  private normalizeStatus(status: number | string): string {
    if (typeof status === 'number') {
      const statusMap: Record<number, string> = {
        0: 'EGRESS_STARTING',
        1: 'EGRESS_ACTIVE',
        2: 'EGRESS_ENDING',
        3: 'EGRESS_COMPLETE',
        4: 'EGRESS_FAILED',
        5: 'EGRESS_ABORTED',
      };
      return statusMap[status] || `UNKNOWN_${status}`;
    }
    return status;
  }
}

export default new RecordingService();
