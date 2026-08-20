import Script from 'next/script';

import '@fontsource/vazirmatn/index.css';
import type { Metadata } from 'next';

import './globals.css';
import Providers from './providers';

export const metadata: Metadata = {
  title: 'SunPath',
  description: 'سیستم مدیریت ناوگان SunPath',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fa" dir="rtl" suppressHydrationWarning>
      <head>
        <Script src="/config/config.js" strategy="beforeInteractive" />
      </head>
      <body className="font-vazir antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
