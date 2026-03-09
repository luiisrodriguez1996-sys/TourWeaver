import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  poweredByHeader: false,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
    ],
  },
  async headers() {
    const isProd = process.env.NODE_ENV === 'production';

    const commonHeaders = [
      {
        key: 'X-Frame-Options',
        value: isProd ? 'DENY' : 'SAMEORIGIN',
      },
      {
        key: 'X-Content-Type-Options',
        value: 'nosniff',
      },
      {
        key: 'Referrer-Policy',
        value: 'strict-origin-when-cross-origin',
      },
      {
        key: 'Permissions-Policy',
        value: 'camera=(), microphone=(), geolocation=()',
      },
      {
        key: 'Strict-Transport-Security',
        value: 'max-age=63072000; includeSubDomains; preload',
      },
    ];

    const cspBase = [
      "default-src 'self'",
      ...(isProd ? ["frame-ancestors 'none'"] : []),
      "form-action 'self'",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "img-src 'self' data: blob: https://placehold.co https://images.unsplash.com https://picsum.photos https://*.googleapis.com https://*.gstatic.com https://firebasestorage.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "connect-src 'self' https://*.googleapis.com https://*.firebaseio.com https://firebasestorage.googleapis.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://www.google-analytics.com wss://*.firebaseio.com",
      "frame-src 'self' https://*.firebaseapp.com https://recaptchaenterprise.googleapis.com https://www.google.com",
      "worker-src 'self' blob:",
      "media-src 'self' data: blob: https://firebasestorage.googleapis.com",
      "object-src 'none'",
    ];

    const scriptSrcNoEval = "script-src 'self' 'unsafe-inline' https://*.googleapis.com https://*.firebaseapp.com https://www.gstatic.com https://www.googletagmanager.com https://recaptchaenterprise.googleapis.com https://www.google.com";
    const scriptSrcWithEval = "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.googleapis.com https://*.firebaseapp.com https://www.gstatic.com https://www.googletagmanager.com https://recaptchaenterprise.googleapis.com https://www.google.com";

    return [
      {
        source: '/tour/:path*',
        headers: [
          ...commonHeaders,
          {
            key: 'Content-Security-Policy',
            value: [...cspBase, scriptSrcWithEval].join('; '),
          },
        ],
      },
      {
        source: '/((?!tour).*)',
        headers: [
          ...commonHeaders,
          {
            key: 'Content-Security-Policy',
            value: [...cspBase, scriptSrcNoEval].join('; '),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
