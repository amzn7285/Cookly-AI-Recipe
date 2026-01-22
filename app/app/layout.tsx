import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { SupabaseProvider } from '../contexts/SupabaseContext';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Cookly AI - Smart Recipe Generator',
  description: 'Upload your pantry image and get personalized recipe suggestions powered by AI',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1',
  themeColor: '#10B981',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      </head>
      <body className={`${inter.className} min-h-screen bg-gradient-to-br from-green-50 to-blue-50`}>
        <SupabaseProvider>
          <main className="container-mobile min-h-screen">
            {children}
          </main>
        </SupabaseProvider>
      </body>
    </html>
  );
}
