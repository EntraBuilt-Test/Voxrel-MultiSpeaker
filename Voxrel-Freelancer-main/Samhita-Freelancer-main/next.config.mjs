/** @type {import('next').NextConfig} */
const nextConfig = {
    typescript: {
        // Warning: This allows production builds to successfully complete even if
        // your project has type errors.
        ignoreBuildErrors: false,
    },
    env: {
        NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'https://samhita-backend-tlpg.onrender.com',
    },
    output: 'standalone',
    async redirects() {
        return [
            {
                source: '/',
                destination: '/login',
                permanent: true,
            },
        ]
    },
};

export default nextConfig;
