/** @type {import('next').NextConfig} */
const nextConfig = {
  // Empty turbopack config to use Turbopack (Next.js 16 default)
  turbopack: {},

  async redirects() {
    const marketingUrl = process.env.NEXT_PUBLIC_MARKETING_URL || 'https://taxfolio.io';

    return [
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
    ];
  },
};

module.exports = nextConfig;
