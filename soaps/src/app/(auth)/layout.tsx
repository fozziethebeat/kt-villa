import { ApolloWrapper } from '@/app/ApolloWrapper';
import '@/app/globals.css';
import { Plus_Jakarta_Sans } from 'next/font/google';
import { Metadata } from 'next';

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  weight: ['400', '500', '600', '700'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Our Morning Sunset — Sign In',
  description: 'Sign in to Our Morning Sunset',
};

export default async function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={plusJakarta.variable}>
      <body className="font-sans antialiased bg-background text-foreground">
        <ApolloWrapper>
          <main>{children}</main>
        </ApolloWrapper>
      </body>
    </html>
  );
}
