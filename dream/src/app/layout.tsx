import {SessionProvider} from 'next-auth/react';

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
            <main>{children}</main>
          </ApolloWrapper>
        </SessionProvider>
      </body>
    </html>
  );
}
