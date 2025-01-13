import type {DefaultSession} from 'next-auth';

import {PrismaAdapter} from '@auth/prisma-adapter';
import {render} from '@react-email/render';
import {createHash} from 'crypto';
import NextAuth from 'next-auth';
import Nodemailer from 'next-auth/providers/nodemailer';

import {mailer} from '@/lib/mailer';
import {prisma} from '@/lib/prisma';
import {SigninMail} from '@/components/mail/SigninMail';

declare module 'next-auth' {
  interface Session {
    user: {
      roles: string;
      profileImageUrl: string;
    } & DefaultSession['user'];
  }
}

export const {handlers, signIn, signOut, auth} = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    Nodemailer({
      async sendVerificationRequest(params) {
        const {identifier, url, provider, theme, request} = params;
        const {email, code} = await request.json();
        const user = await prisma.user.findUnique({
          where: {email},
        });
        if (!user) {
          if (!code) {
            throw new Error('New Users need a magic code');
          }
          const foundCode = await prisma.magicCode.findUnique({
            where: {id: code},
          });
          if (!foundCode) {
            throw new Error('Invalid magic code');
          }
        }
        const result = await mailer.sendMail({
          from: provider.from,
          to: identifier,
          subject: 'Sign in to Yumegai',
          html: await render(
            SigninMail({
              url,
            }),
          ),
        });

        const rejected = result.rejected || [];
        const pending = result.pending || [];
        const failed = rejected.concat(pending).filter(Boolean);
        if (failed.length) {
          throw new Error(`Email (${failed.join(', ')}) could not be sent`);
        }
      },

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
    signIn: '/signin',
    signOut: '/signout',
  },
  callbacks: {
    async session({session, user}) {
      const profileHash = createHash('sha256')
        .update(user.email.trim().toLowerCase())
        .digest('hex');
      session.user.profileImageUrl = `https://gravatar.com/avatar/${profileHash}?s=200`;
      return session;
    },
  },
});
