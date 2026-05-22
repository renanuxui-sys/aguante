import type { NextConfig } from 'next'

// Next 16.2.4 does not pass projectDir to Vercel's preview-comments adapter yet.
// Avoid the adapter trying to write its toolbar script with an undefined path.
if (process.env.VERCEL && process.env.VERCEL_PREVIEW_COMMENTS_ENABLED === '1') {
  process.env.VERCEL_PREVIEW_COMMENTS_ENABLED = '0'
}

const nextConfig: NextConfig = {
  htmlLimitedBots: /.*/,
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
      {
        source: '/admin/:path*',
        headers: [
          {
            key: 'X-Robots-Tag',
            value: 'noindex, nofollow, noarchive',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
        ],
      },
      {
        source: '/api/admin/:path*',
        headers: [
          {
            key: 'X-Robots-Tag',
            value: 'noindex, nofollow, noarchive',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
        ],
      },
    ]
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
    ],
  },
}

export default nextConfig
