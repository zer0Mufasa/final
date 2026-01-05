/** @type {import('next').NextConfig} */
const nextConfig = {
  // Vercel build is currently crashing during "Collecting build traces" with a micromatch stack overflow.
  // Disabling output file tracing avoids that step and unblocks deployment.
  outputFileTracing: false,
  images: {
    domains: ['localhost', 'fixologyai.com'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
    ],
  },
}

module.exports = nextConfig

