import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import { VersionIndicator } from '@/components/VersionIndicator';

export const metadata: Metadata = {
  title: 'Tour Weaver | Immersive Virtual Tours',
  description: 'Create and share 360 virtual tours with AI-powered scene linking.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased selection:bg-primary selection:text-white">
        <FirebaseClientProvider>
          {children}
          <VersionIndicator />
          <Toaster />
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
