'use client';

import { gql, TypedDocumentNode } from '@apollo/client';
import { useSuspenseQuery } from "@apollo/client/react";

interface Entity {
  id: string;
  name: string;
  content: string;
}

interface EntitiesData {
  entities: Entity[];
}

interface AdminEntitiesData {
  adminEntities: Entity[];
}

const QUERY: TypedDocumentNode<EntitiesData> = gql`
  query Entities {
    entities {
      id
      name
      content
    }
  }
`;

const ADMIN_QUERY: TypedDocumentNode<AdminEntitiesData> = gql`
  query AdminEntities {
    adminEntities {
      id
      name
      content
    }
  }
`;

export function EntityList() {
  const { data } = useSuspenseQuery(QUERY);
  const { data: adminData } = useSuspenseQuery(ADMIN_QUERY, {
    // We do this because the server components can pre-cache results and we
    // want to avoid that, we want to force credentials to be included.
    fetchPolicy: 'network-only',
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
