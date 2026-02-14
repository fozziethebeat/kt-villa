import { ApolloWrapper } from '@/app/ApolloWrapper';
import '@/app/globals.css';

import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'KT Soaps',
  description: 'Sign in to KT Soaps',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <ApolloWrapper>
          <main>{children}</main>
        </ApolloWrapper>
      </body>
    </html>
  );
}
