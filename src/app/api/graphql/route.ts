import { ApolloServer } from "@apollo/server";
import { startServerAndCreateNextHandler } from "@as-integrations/next";

import { typeDefs, resolvers } from "@/graphql/schema";

const server = new ApolloServer({ typeDefs, resolvers });
const handler = startServerAndCreateNextHandler(server);

export async function GET(request: Request) {
  return handler(request);
}

export async function POST(request: Request) {
  return handler(request);
}