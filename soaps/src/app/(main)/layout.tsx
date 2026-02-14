import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';

import { ApolloWrapper } from '@/app/ApolloWrapper';
import '@/app/globals.css';

import { AppSidebar } from '@/components/AppSidebar';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';

export const metadata: Metadata = {
  title: 'KT Soaps',
  description: 'Manage your soaps with ease.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <ApolloWrapper>
          <SidebarProvider defaultOpen={false}>
            <AppSidebar />
            <main className="w-full">{children}</main>
          </SidebarProvider>
        </ApolloWrapper>
      </body>
    </html>
  );
}
