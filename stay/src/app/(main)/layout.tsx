import {SessionProvider} from 'next-auth/react';
import Link from 'next/link';

import {auth} from '@/lib/auth';
import {ApolloWrapper} from '@/app/ApolloWrapper';
import {AccountMenu} from '@/components/AccountMenu';

import '@/app/globals.css';

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();
  return (
    <html lang="en">
      <body>
        <SessionProvider>
          <ApolloWrapper>
            <header className="navbar">
              <div className="flex-1">
                <Link className="norma-case btn btn-ghost text-xl" href="/">
                  KT Villa
                </Link>
              </div>
              <nav className="flex-none">
                {session ? (
                  <AccountMenu />
                ) : (
                  <Link className="link" href="/api/auth/signin">
                    Login
                  </Link>
                )}
              </nav>
            </header>
            <main>{children}</main>
          </ApolloWrapper>
        </SessionProvider>
      </body>
    </html>
  );
}
