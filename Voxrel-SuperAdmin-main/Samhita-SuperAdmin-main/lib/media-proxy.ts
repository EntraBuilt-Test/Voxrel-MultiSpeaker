/**
 * Get proxied media URL to avoid CORS issues
 * @param originalUrl - The original R2 or external media URL
 * @returns Proxied URL through the backend
 */
export function getProxiedMediaUrl(originalUrl: string | undefined): string | undefined {
    if (!originalUrl) return undefined;

    // If it's already a local URL or blob, return as-is
    if (originalUrl.startsWith('blob:') || originalUrl.startsWith('/')) {
        return originalUrl;
    }

    // If it's already proxied, return as-is
    if (originalUrl.includes('/media/proxy')) {
        return originalUrl;
    }

    // Get the API base URL from environment variable
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;

    if (!apiBaseUrl) {
        console.error('NEXT_PUBLIC_API_URL is not set. Please configure it in your environment variables.');
        throw new Error('API URL is not configured');
    }

    // Encode the original URL as a query parameter
    const encodedUrl = encodeURIComponent(originalUrl);

    return `${apiBaseUrl}/api/v1/media/proxy?url=${encodedUrl}`;
}
