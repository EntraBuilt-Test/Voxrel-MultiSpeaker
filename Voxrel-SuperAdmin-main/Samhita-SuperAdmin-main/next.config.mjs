/** @type {import('next').NextConfig} */
const nextConfig = {
    output: 'standalone',
    async redirects() {
        return [
            {
                source: '/',
                destination: '/task/manage',
                permanent: true,
            },
        ]
    },
};

export default nextConfig;
