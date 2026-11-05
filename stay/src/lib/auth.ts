import type { DefaultSession } from "next-auth";
import { cache } from "react";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { createHash } from "crypto";
import NextAuth from "next-auth";
import Nodemailer from "next-auth/providers/nodemailer";

import { prisma } from "@/lib/prisma";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      roles: string;
      trustStatus?: string;
      referral?: string | null;
      socialType?: string | null;
      socialHandle?: string | null;
      profileImageUrl: string;
    } & DefaultSession["user"];
  }
}

const nextAuth = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    Nodemailer({
      server: {
        host: process.env.MAILER_SMTP_HOST,
        port: process.env.MAILER_SMTP_PORT,
        secure: true,
        auth: {
          user: process.env.MAILER_SMTP_USERNAME,
          pass: process.env.MAILER_SMTP_PASSWORD,
        },
      },
      from: process.env.MAILER_FROM,
    }),
  ],
  pages: {
    signIn: "/signin",
  },
  callbacks: {
    async session({ session, user }) {
      const u = user as any;
      const email = (u.email || "").trim().toLowerCase();
      const profileHash = createHash("sha256").update(email).digest("hex");
      session.user.id = u.id;
      session.user.roles = u.roles || "general";
      session.user.trustStatus = u.trustStatus || "new";
      session.user.referral = u.referral ?? null;
      session.user.socialType = u.socialType ?? null;
      session.user.socialHandle = u.socialHandle ?? null;
      session.user.profileImageUrl = `https://gravatar.com/avatar/${profileHash}?s=200`;
      return session;
    },
  },
});

export const { handlers, signIn, signOut } = nextAuth;

// Memoize auth() per React server request so Layout, Navbar, AccountMenu, Page,
// and GraphQL resolvers share a single database lookup.
export const auth = cache(nextAuth.auth);
