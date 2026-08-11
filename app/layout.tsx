import { Geist, Geist_Mono } from 'next/font/google';
import Script from 'next/script';
import type { Metadata } from 'next';

import 'leaflet/dist/leaflet.css';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'SunPath',
  description: 'سیستم مدیریت ناوگان SunPath',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fa"
      dir="rtl"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <Script
          src="/config/config.js"
          strategy="beforeInteractive"
        />
      </head>

      <body className="flex h-full flex-col">
        {children}
      </body>
    </html>
  );
}
