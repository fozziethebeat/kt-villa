import type {UnsafeUnwrappedCookies} from 'next/headers';
import {cookies} from 'next/headers';
import {createHttpLink, from} from '@apollo/client';
import {setContext} from '@apollo/client/link/context';
import {onError} from '@apollo/client/link/error';
import {
  registerApolloClient,
  ApolloClient,
  InMemoryCache,
} from '@apollo/experimental-nextjs-app-support';

const httpLink = createHttpLink({
  uri: process.env.GRAPHQL_URL,
  credentials: 'include',
  fetchOptions: {cache: 'no-store'},
});

const errorLink = onError(({graphQLErrors, networkError}) => {
  if (graphQLErrors) {
    console.log(graphQLErrors);
  }

  if (networkError) {
    // handle network error
    console.log(networkError);
  }
});

const authLink = setContext((_, {headers}) => {
  const cookieStore = cookies() as unknown as UnsafeUnwrappedCookies;
  const token =
    cookieStore.get('__Secure-next-auth.session-token') ??
    cookieStore.get('authjs.session-token');
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token.value}` : '',
    },
  };
});

const appLink = from([errorLink, httpLink]);

export const {getClient, query, PreloadQuery} = registerApolloClient(() => {
  return new ApolloClient({
    cache: new InMemoryCache(),
    link: authLink.concat(appLink),
  });
});
