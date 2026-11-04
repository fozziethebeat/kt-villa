import { SessionProvider } from "next-auth/react";
import type { Metadata } from "next";

import { ApolloWrapper } from "@/app/ApolloWrapper";
import { Navbar, Footer } from "@/components/Navbar";

import "@/app/globals.css";

export const metadata: Metadata = {
  title: "Sign In · KT Villa Hakuba",
  description: "Sign in to book your stay at KT Villa in Hakuba, Japan.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col bg-background text-foreground antialiased">
        <SessionProvider>
          <ApolloWrapper>
            <Navbar />
            <main className="flex flex-1 items-center justify-center py-12">
              {children}
            </main>
            <Footer />
          </ApolloWrapper>
        </SessionProvider>
      </body>
    </html>
  );
}
