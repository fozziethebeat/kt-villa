import { cookies } from 'next/headers';
import { createHttpLink, from } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { onError } from '@apollo/client/link/error';
import {
  registerApolloClient,
  ApolloClient,
  InMemoryCache,
} from '@apollo/client-integration-nextjs';

const httpLink = createHttpLink({
  uri: process.env.GRAPHQL_SERVER_URL,
  credentials: 'include',
  fetchOptions: {
    cache: 'no-store',
  },
});

const errorLink = onError(({ graphQLErrors, networkError }: any) => {
  if (graphQLErrors) {
    console.log(graphQLErrors);
  }

  if (networkError) {
    console.log(networkError);
  }
});

const authLink = setContext(async (_, { headers }) => {
  const cookieStore = await cookies();
  const [secureToken, regularToken] = await Promise.all([
    cookieStore.get('__Secure-authjs.session-token'),
    cookieStore.get('authjs.session-token'),
  ]);
  const token = secureToken ?? regularToken;
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token.value}` : '',
    },
  };
});

const appLink = from([errorLink, httpLink]);

export const { getClient, query, PreloadQuery } = registerApolloClient(() => {
  return new ApolloClient({
    cache: new InMemoryCache(),
    link: authLink.concat(appLink),
  });
});
