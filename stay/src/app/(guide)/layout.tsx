import { SessionProvider } from "next-auth/react";
import type { Metadata } from "next";

import { auth } from "@/lib/auth";
import { ApolloWrapper } from "@/app/ApolloWrapper";
import { Navbar, Footer } from "@/components/Navbar";
import { GuideSidebar } from "@/components/GuideSidebar";

import "@/app/globals.css";

export const metadata: Metadata = {
  title: "House & Village Guide · KT Villa Hakuba",
  description:
    "Everything you need to know about finding KT Villa, warming up the house, using the car, and exploring Hakuba.",
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
            <main className="alpine-container flex-1 py-8 lg:py-12">
              <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
                <GuideSidebar />
                <article className="min-w-0 flex-1 rounded-2xl border border-border/80 bg-card p-6 shadow-sm sm:p-10">
                  <div className="prose prose-stone max-w-none prose-headings:font-bold prose-headings:tracking-tight prose-a:text-primary prose-a:no-underline hover:prose-a:underline prose-img:rounded-xl prose-img:border prose-img:border-border">
                    {children}
                  </div>
                </article>
              </div>
            </main>
            <Footer />
          </ApolloWrapper>
        </SessionProvider>
      </body>
    </html>
  );
}
