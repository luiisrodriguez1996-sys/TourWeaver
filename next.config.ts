import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  // AUDITORÍA v1.5.0: Eliminado ignoreBuildErrors e ignoreDuringBuilds para garantizar integridad de tipos en producción
  
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
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
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
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' https://*.googleapis.com https://*.firebaseapp.com https://www.gstatic.com https://www.googletagmanager.com https://recaptchaenterprise.googleapis.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "img-src 'self' data: blob: https://placehold.co https://images.unsplash.com https://picsum.photos https://*.googleapis.com https://*.gstatic.com https://firebasestorage.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "connect-src 'self' https://*.googleapis.com https://*.firebaseio.com https://firebasestorage.googleapis.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://www.google-analytics.com wss://*.firebaseio.com",
              "frame-src 'self' https://*.firebaseapp.com https://recaptchaenterprise.googleapis.com",
              "worker-src 'self' blob:",
              "media-src 'self' data: blob: https://firebasestorage.googleapis.com",
              "object-src 'none'",
            ].join('; ')
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
