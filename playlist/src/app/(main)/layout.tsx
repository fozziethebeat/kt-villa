import type { Metadata } from 'next';

import { ApolloWrapper } from '@/app/ApolloWrapper';
import '@/app/globals.css';

import { AppSidebar } from '@/components/AppSidebar';
import { SidebarProvider } from '@/components/ui/sidebar';

export const metadata: Metadata = {
  title: 'Our Playlist Journey',
  description: 'A musical journey through our memories together',
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
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      </head>
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
