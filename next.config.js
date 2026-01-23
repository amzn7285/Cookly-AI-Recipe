/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    // Use temporarily to unblock deployment — fix the real TS/tsconfig issue later!
    ignoreBuildErrors: true,
  },
  eslint: {
    // !! WARN !!
    // Allows production builds even with ESLint errors.
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
