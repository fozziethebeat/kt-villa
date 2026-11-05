import { SessionProvider } from "next-auth/react";
import type { Metadata } from "next";

import { auth } from "@/lib/auth";
import { ApolloWrapper } from "@/app/ApolloWrapper";
import { Navbar, Footer } from "@/components/Navbar";

import "@/app/globals.css";

export const metadata: Metadata = {
  title: "KT Villa · Hakuba Kamishiro Alpine Lodge",
  description:
    "Private mountain lodge in Hakuba Kamishiro, Nagano — between Hakuba 47 and Goryu.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();
  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col bg-background text-foreground antialiased">
        <SessionProvider session={session} refetchOnWindowFocus={false}>
          <ApolloWrapper>
            <Navbar />
            <main className="flex-1">{children}</main>
            <Footer />
          </ApolloWrapper>
        </SessionProvider>
      </body>
    </html>
  );
}
