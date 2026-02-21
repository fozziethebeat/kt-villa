import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { magicLink } from "better-auth/plugins";
import { createHash } from "crypto";

import prisma from "@/lib/prisma";
import { mailer } from "@/lib/mailer";
import { MagicLink } from "@/components/mail/MagicLink";
import { render } from "@react-email/render";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  plugins: [
    magicLink({
      sendMagicLink: async ({ email, token, url }, request) => {
        const now = new Date();
        const timestamp = now.toISOString();
        const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        // Send email using your mailer
        await mailer.sendMail({
          from: process.env.MAILER_FROM,
          to: email,
          subject: `Sign in to KT Soaps [${timeString}]`,
          html: await render(MagicLink({ url, timestamp })),
        });
      },
      expiresIn: 60 * 60 * 24 * 7, // 7 days (example)
    }),
  ],
  databaseHooks: {
    user: {
      create: {
        after: async (user: any) => {
          // When a new user is created, check if they signed up with a batch magic code
          // and auto-assign the corresponding soap gift
          try {
            const { assignPendingGift } = await import("@/app/api/auth/[...all]/route");
            await assignPendingGift(user.email, user.id);
          } catch (error) {
            console.error("[Auth] Failed to run post-signup gift assignment:", error);
          }
        },
      },
    },
  },
  user: {
    additionalFields: {
      roles: {
        type: "string",
        defaultValue: "general"
      }
    }
  },
  baseURL: process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000",
  callbacks: {
    session: {
      after: async (session: any) => {
        if (session.user.email) {
          const profileHash = createHash('md5')
            .update(session.user.email.trim().toLowerCase())
            .digest('hex');
          return {
            ...session,
            user: {
              ...session.user,
              profileImageUrl: session.user.image || `https://gravatar.com/avatar/${profileHash}?s=200`
            }
          }
        }
        return session;
      }
    }
  },
  trustedOrigins: [
    "template-mobile://",
    "exp://"
  ]
});
