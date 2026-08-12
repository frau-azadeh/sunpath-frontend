import type { Metadata } from 'next';
import Script from 'next/script';
import Providers from './providers';

import '@fontsource/vazirmatn/index.css';
import './globals.css';

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
        <Script src="/config/config.js"  />
      </head>
      <body className="font-vazir antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
