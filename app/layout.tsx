import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Lightweight Web Analytics',
  description: 'A privacy-focused, self-hostable web analytics platform',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <script 
          async 
          src="/analytics.js"
          data-host="https://ystfiam"
          defer
        ></script>
      </head>
      <body className={inter.className}>{children}</body>
    </html>
  );
}
