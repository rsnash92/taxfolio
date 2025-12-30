import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    const marketingUrl = process.env.NEXT_PUBLIC_MARKETING_URL || 'https://taxfolio.io'

    return [
      // Redirect root to dashboard for authenticated users (handled in middleware)
      // or to login for unauthenticated users

      // Redirect marketing pages to the marketing site
      // These pages will be served from taxfolio.io instead of app.taxfolio.io
      {
        source: '/pricing',
        destination: `${marketingUrl}/pricing`,
        permanent: true,
      },
      {
        source: '/privacy',
        destination: `${marketingUrl}/privacy`,
        permanent: true,
      },
      {
        source: '/terms',
        destination: `${marketingUrl}/terms`,
        permanent: true,
      },
      {
        source: '/cookies',
        destination: `${marketingUrl}/cookies`,
        permanent: true,
      },
      {
        source: '/features',
        destination: `${marketingUrl}/features`,
        permanent: true,
      },
      {
        source: '/blog',
        destination: `${marketingUrl}/blog`,
        permanent: true,
      },
      {
        source: '/blog/:slug',
        destination: `${marketingUrl}/blog/:slug`,
        permanent: true,
      },
      {
        source: '/about',
        destination: `${marketingUrl}/about`,
        permanent: true,
      },
      {
        source: '/contact',
        destination: `${marketingUrl}/contact`,
        permanent: true,
      },
      {
        source: '/help',
        destination: `${marketingUrl}/help`,
        permanent: true,
      },
    ]
  },
};

export default nextConfig;
