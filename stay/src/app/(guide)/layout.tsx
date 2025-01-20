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
              <div className="flex-1">
                <Link
                  className="norma-case btn btn-ghost text-xl"
                  href="/guide/the-stay">
                  The Stay
                </Link>
              </div>
              <div className="flex-1">
                <Link
                  className="norma-case btn btn-ghost text-xl"
                  href="/guide/the-village">
                  The Village
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
            <main>
              <div className="prose prose-headings:mt-8 prose-headings:font-semibold prose-headings:text-black prose-h1:text-5xl prose-h2:text-4xl prose-h3:text-3xl prose-h4:text-2xl prose-h5:text-xl prose-h6:text-lg dark:prose-headings:text-white p-8">
                {children}
              </div>
            </main>
          </ApolloWrapper>
        </SessionProvider>
      </body>
    </html>
  );
}
