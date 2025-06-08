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
        <ApolloWrapper>
          <main>{children}</main>
        </ApolloWrapper>
      </body>
    </html>
  );
}
