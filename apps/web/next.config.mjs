/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Telegram Mini App requires iframe embedding from telegram origins
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          // ❌ X-Frame-Options supprimé — il bloquait l'iframe Telegram
          // ✅ CSP frame-ancestors à la place : autorise uniquement les origines Telegram
          {
            key: 'Content-Security-Policy',
            value: [
              "frame-ancestors 'self' https://web.telegram.org https://*.telegram.org https://telegram.org",
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://telegram.org https://*.telegram.org",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: blob: https://*.telegram.org https://t.me",
              "connect-src 'self' https://*.telegram.org " + (process.env.NEXT_PUBLIC_API_URL || ''),
            ].join('; '),
          },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
    ];
  },
};

export default nextConfig;
