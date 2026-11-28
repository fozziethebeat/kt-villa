import type { Metadata } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';

import { ApolloWrapper } from '@/app/ApolloWrapper';
import { Toaster } from '@/components/ui/toaster';
import '@/app/globals.css';

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  weight: ['400', '500', '600', '700'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Our Morning Sunset',
  description: 'Small-batch cold-process botanical soaps, cured slow.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={plusJakarta.variable}>
      <body className="font-sans antialiased bg-background text-foreground">
        <ApolloWrapper>
          <div className="min-h-screen w-full">{children}</div>
        </ApolloWrapper>
        <Toaster />
      </body>
    </html>
  );
}
