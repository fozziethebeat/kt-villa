import { ApolloServer } from "@apollo/server";
import type { DocumentNode } from "graphql";

import { auth } from "@/lib/auth";
import { typeDefs, resolvers } from "@/graphql/schema";

const globalForApollo = globalThis as unknown as {
  apolloServer: ApolloServer<{ user: any }> | undefined;
};

export const apolloServer =
  globalForApollo.apolloServer ??
  new ApolloServer<{ user: any }>({
    typeDefs,
    resolvers,
  });

globalForApollo.apolloServer = apolloServer;

export function getClient() {
  return {
    async query<TData = any>({
      query,
      variables,
    }: {
      query: DocumentNode | string;
      variables?: Record<string, any>;
      fetchPolicy?: string;
    }): Promise<{ data: TData }> {
      const session = await auth();
      const response = await apolloServer.executeOperation(
        {
          query,
          variables,
        },
        {
          contextValue: {
            user: session?.user ?? null,
          },
        }
      );

      if (response.body.kind !== "single") {
        throw new Error("Incremental delivery not supported");
      }

      const { data, errors } = response.body.singleResult;
      if (errors?.length) {
        console.error("GraphQL SSR query errors:", errors);
        throw new Error(errors[0].message);
      }

      // Normalize null-prototype objects from graphql-js and Date instances
      // from DateTime scalars into plain JSON-serializable objects/ISO strings
      // expected by React Server -> Client Component serialization.
      const plainData = JSON.parse(JSON.stringify(data)) as TData;
      return { data: plainData };
    },
  };
}
