import Script from 'next/script';

import type { Metadata } from 'next';

import './globals.css';
import Providers from './providers';

export const metadata: Metadata = {
  title: 'SunPath',
  description: 'SunPath Fleet Tracking System',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fa" dir="rtl" suppressHydrationWarning>
      <body className="font-vazir antialiased">
        <Providers>{children}</Providers>

        <Script
          id="sunpath-runtime-config"
          src="/config/config.js"
          strategy="beforeInteractive"
        />
      </body>
    </html>
  );
}
