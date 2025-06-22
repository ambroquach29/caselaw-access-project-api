import {
  ApolloClient,
  InMemoryCache,
  HttpLink,
  DefaultOptions,
  gql,
} from '@apollo/client/core';
import dotenv from 'dotenv';
dotenv.config();

const fetch = require('node-fetch');
const { HASURA_URL, HASURA_ADMIN_SECRET } = process.env;

enum ACTION {
  QUERY,
  MUTATE,
  SUBSCRIBE,
}

const httpLink = new HttpLink({
  uri: HASURA_URL || '',
  fetch,
  headers: {
    'x-hasura-admin-secret': HASURA_ADMIN_SECRET || '',
  },
});

const defaultOptions: DefaultOptions = {
  watchQuery: {
    fetchPolicy: 'no-cache',
    errorPolicy: 'ignore',
  },
  query: {
    fetchPolicy: 'no-cache',
    errorPolicy: 'all',
  },
};

const CLIENT = new ApolloClient({
  link: httpLink,
  cache: new InMemoryCache(),
  defaultOptions: defaultOptions,
});

const action =
  (_: ACTION) =>
  async (params: string, variables: any = undefined) => {
    const { query, mutate, subscribe } = CLIENT;
    let result: any;
    switch (_) {
      case ACTION.QUERY:
        result = await query({
          query: gql`
            ${params}
          `,
          variables,
        });
        break;
      case ACTION.MUTATE:
        result = await mutate({
          mutation: gql`
            ${params}
          `,
          variables,
        });
        break;
      case ACTION.SUBSCRIBE:
        result = await subscribe({
          query: gql`subscription {${params}}`,
          variables,
        });
        break;
    }
    return result;
  };

export const query = action(ACTION.QUERY);
export const mutate = action(ACTION.MUTATE);
