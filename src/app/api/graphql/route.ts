import type {NextApiRequest} from 'next';

import {cookies, headers} from 'next/headers';
import {ApolloServer} from '@apollo/server';
import {NextResponse} from 'next/server';
import {startServerAndCreateNextHandler} from '@as-integrations/next';

import {typeDefs, resolvers} from '@/graphql/schema';
import {prisma} from '@/lib/prisma';

async function getToken() {
  const cookieStore = await cookies();
  const cookieToken =
    (await cookieStore.get('__Secure-authjs.session-token')) ??
    (await cookieStore.get('authjs.session-token'));
  if (cookieToken) {
    return cookieToken.value;
  }
  const headersList = await headers();
  const authHeader = headersList.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return undefined;
  }
  return authHeader.substring(7);
}

const server = new ApolloServer({typeDefs, resolvers});
const handler = startServerAndCreateNextHandler(server, {
  context: async req => {
    const token = await getToken();
    console.log(token);
    if (!token) {
      return {req, user: null};
    }
    // Extract the user token so we can fetch the session.  This ensures
    // graphql resolvers can validate against the current user.
    const session = await prisma.session.findUnique({
      where: {sessionToken: token},
      select: {user: true},
    });
    console.log(session?.user);

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
