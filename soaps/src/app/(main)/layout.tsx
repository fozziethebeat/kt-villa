import type { Metadata } from 'next';
import { DM_Sans, Cormorant_Garamond } from 'next/font/google';

import { ApolloWrapper } from '@/app/ApolloWrapper';
import '@/app/globals.css';

import { AppSidebar } from '@/components/AppSidebar';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  variable: '--font-serif',
  weight: ['400', '500', '600', '700'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'KT Soaps',
  description: 'Handcrafted soaps, made with care.',
};

import { Toaster } from "@/components/ui/toaster"

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${dmSans.variable} ${cormorant.variable}`}>
      <body className="font-sans antialiased">
        <ApolloWrapper>
          <SidebarProvider defaultOpen={false}>
            <AppSidebar />
            <main className="w-full">{children}</main>
          </SidebarProvider>
        </ApolloWrapper>
        <Toaster />
      </body>
    </html>
  );
}
