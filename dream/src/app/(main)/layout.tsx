import {SessionProvider} from 'next-auth/react';

import {SidebarProvider, SidebarTrigger} from '@/components/ui/sidebar';
import {AppSidebar} from '@/components/AppSidebar';
import {ApolloWrapper} from '@/app/ApolloWrapper';
import '@/app/globals.css';

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <SessionProvider>
          <ApolloWrapper>
            <SidebarProvider>
              <AppSidebar />
              <main>{children}</main>
            </SidebarProvider>
          </ApolloWrapper>
        </SessionProvider>
      </body>
    </html>
  );
}
