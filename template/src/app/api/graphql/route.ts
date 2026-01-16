import { cookies, headers } from 'next/headers';
import { ApolloServer } from '@apollo/server';
import { startServerAndCreateNextHandler } from '@as-integrations/next';

import { typeDefs, resolvers } from '@/graphql/schema';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';

// In seconds.
export const maxDuration = 120;



const server = new ApolloServer({ typeDefs, resolvers });
const handler = startServerAndCreateNextHandler(server, {
  context: async req => {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    return {
      req,
      user: session?.user ?? null,
    };
  },
});

export async function GET(request: Request) {
  return handler(request);
}

export async function POST(request: Request) {
  return handler(request);
}
