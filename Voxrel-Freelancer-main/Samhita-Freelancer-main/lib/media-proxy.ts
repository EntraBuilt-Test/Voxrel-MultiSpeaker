/**
 * Get proxied media URL to avoid CORS issues
 * @param originalUrl - The original R2 or external media URL
 * @returns Proxied URL through the backend, or direct URL if it's a public R2 URL
 */
export function getProxiedMediaUrl(originalUrl: string | undefined | null): string | undefined {
    if (!originalUrl) return undefined;

    // If it's already a local URL or blob, return as-is
    if (originalUrl.startsWith('blob:') || originalUrl.startsWith('/')) {
        return originalUrl;
    }

    // If it's already proxied, return as-is
    if (originalUrl.includes('/media/proxy') || originalUrl.includes('/audio-proxy')) {
        return originalUrl;
    }

    // Get the API base URL from environment variable
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;

    if (!apiBaseUrl) {
        console.error('NEXT_PUBLIC_API_URL is not set. Please configure it in your environment variables.');
        // If API URL is not set, try using the URL directly (might work for some cases)
        console.warn('⚠️ Falling back to direct URL (may have CORS issues):', originalUrl);
        return originalUrl;
    }

    // Encode the original URL as a query parameter
    const encodedUrl = encodeURIComponent(originalUrl);

    return `${apiBaseUrl}/api/v1/media/proxy?url=${encodedUrl}`;
}
