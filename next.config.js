/** @type {import('next').NextConfig} */
const nextConfig = {
    experimental: {
        allowedDevOrigins: ["http://192.168.0.7:3000"],
    },
};

module.exports = nextConfig;
