import { Request, Response } from 'express';
import { catchAsync } from '@/utils/catch-async.utility.js';
import ApiError from '@/utils/api-error.utility.js';

/**
 * Proxy media files to avoid CORS issues
 * This endpoint fetches media from external sources (like R2) and streams it back
 * with proper CORS headers
 */
export const proxyMedia = catchAsync(async (req: Request, res: Response) => {
  const { url } = req.query;

  if (!url || typeof url !== 'string') {
    throw new ApiError(400, 'URL parameter is required');
  }

  // Validate URL format
  try {
    new URL(url);
  } catch {
    throw new ApiError(400, 'Invalid URL format');
  }

  // Fetch the media file
  console.log(`[MediaProxy] Fetching media from: ${url}`);
  let fetchUrl = url; // Use a mutable variable for URL
  let response = await fetch(fetchUrl, {
    headers: {
      'User-Agent': 'Samhita-Media-Proxy/1.0',
    },
  });

  // If 404 and URL ends with .m4a, try with .m4a.mp4 extension (LiveKit sometimes saves with double extension)
  if (!response.ok && response.status === 404 && fetchUrl.endsWith('.m4a')) {
    const urlWithMp4 = fetchUrl + '.mp4';
    console.log(`[MediaProxy] 404 for .m4a, trying with .m4a.mp4 extension: ${urlWithMp4}`);
    response = await fetch(urlWithMp4, {
      headers: {
        'User-Agent': 'Samhita-Media-Proxy/1.0',
      },
    });
    
    if (response.ok) {
      console.log(`[MediaProxy] Successfully fetched with .m4a.mp4 extension`);
      // Update the URL for range requests
      fetchUrl = urlWithMp4;
    }
  }

  if (!response.ok) {
    console.error(`[MediaProxy] Failed to fetch media: ${response.status} ${response.statusText}`);
    console.error(`[MediaProxy] URL: ${fetchUrl}`);
    throw new ApiError(response.status, `Failed to fetch media: ${response.statusText}`);
  }
  
  console.log(`[MediaProxy] Successfully fetched media: ${response.status} ${response.statusText}`);

  // Get content type from the original response
  const contentType = response.headers.get('content-type') || 'application/octet-stream';
  const contentLength = response.headers.get('content-length');

  // Set response headers
  res.setHeader('Content-Type', contentType);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Range, Content-Type');
  res.setHeader('Access-Control-Expose-Headers', 'Content-Length, Content-Range, Accept-Ranges');
  res.setHeader('Accept-Ranges', 'bytes');

  if (contentLength) {
    res.setHeader('Content-Length', contentLength);
  }

  // Handle range requests for audio/video seeking
  const range = req.headers.range;
  if (range && response.headers.get('accept-ranges') === 'bytes') {
    // Re-fetch with range header (use the potentially updated URL)
    const rangeResponse = await fetch(fetchUrl, {
      headers: { Range: range },
    });

    if (rangeResponse.status === 206) {
      const contentRange = rangeResponse.headers.get('content-range');
      res.status(206);
      if (contentRange) {
        res.setHeader('Content-Range', contentRange);
      }

      // Stream the ranged response
      if (rangeResponse.body) {
        const reader = rangeResponse.body.getReader();
        const pump = async () => {
          const { done, value } = await reader.read();
          if (done) {
            res.end();
            return;
          }
          res.write(Buffer.from(value));
          pump();
        };
        await pump();
      }
      return;
    }
  }

  // Stream the full response
  if (response.body) {
    const reader = response.body.getReader();
    const pump = async () => {
      const { done, value } = await reader.read();
      if (done) {
        res.end();
        return;
      }
      res.write(Buffer.from(value));
      pump();
    };
    await pump();
  } else {
    res.end();
  }
});
