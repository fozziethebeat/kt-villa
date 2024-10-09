import { headers } from "next/headers";
import { ApolloServer } from "@apollo/server";
import { NextResponse } from "next/server";
import { startServerAndCreateNextHandler } from "@as-integrations/next";

import { typeDefs, resolvers } from "@/graphql/schema";
import { prisma } from "@/lib/prisma";

interface User {
  id: string;
  roles: string;
}

interface VillaContext {
  user: User;
}

const server = new ApolloServer({ typeDefs, resolvers });
const handler = startServerAndCreateNextHandler(server, {
  context: async (req) => {
    // Extract the user token so we can fetch the session.  This ensures
    // graphql resolvers can validate against the current user.
    const headersList = headers();
    const authHeader = headersList.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return { req };
    }
    const token = authHeader.substring(7);
    const session = await prisma.session.findUnique({
      where: { sessionToken: token },
      select: { user: true },
    });

    return {
      req,
      user: session?.user,
    };
  },
});

export async function GET(request: Request) {
  return handler(request);
}

export async function POST(request: Request) {
  return handler(request);
}
