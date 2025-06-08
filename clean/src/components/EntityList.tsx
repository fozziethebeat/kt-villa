'use client';

import {gql, useQuery, useSuspenseQuery} from '@apollo/client';

interface Entities {
  entities: {
    id: string;
    name: string;
    content: string;
  }[];
}

const QUERY: TypedDocumentNode<Entities> = gql`
  query Entities {
    entities {
      id
      name
      content
    }
  }
`;

const ADMIN_QUERY: TypedDocumentNode<Entities> = gql`
  query AdminEntities {
    adminEntities {
      id
      name
      content
    }
  }
`;

export function EntityList() {
  const {data} = useSuspenseQuery(QUERY);
  const {data: adminData} = useSuspenseQuery(ADMIN_QUERY, {
    // We do this because the server components can pre-cache results and we
    // want to avoid that, we want to force credentials to be included.
    fetchPolicy: 'network-only',
    // Following queries can re-use the cache.
    nextFetchPolicy: 'cache-first',
  });
  return (
    <div>
      <div>Client Component</div>
      {data.entities.map(entity => (
        <li key={entity.id} className="mb-2">
          {entity.name}
        </li>
      ))}

      <div>Admin Client Query</div>
      {adminData?.adminEntities?.map(entity => (
        <li key={entity.id} className="mb-2">
          {entity.name}
        </li>
      ))}
    </div>
  );
}
