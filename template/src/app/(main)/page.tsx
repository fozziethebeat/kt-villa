import { gql, TypedDocumentNode } from '@apollo/client';
import Image from 'next/image';

import { EntityList } from '@/components/EntityList';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';

import { query } from '@/graphql/ApolloClient';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';

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

export default async function Home() {
  const session = await auth();
  const { data } = await query({ query: QUERY });
  const { data: adminData } = await query({ query: ADMIN_QUERY });
  return (
    <>
      <Header />
      <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
        <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
          <Image
            className="dark:invert"
            src="/next.svg"
            alt="Next.js logo"
            width={180}
            height={38}
            priority
          />
          <button className="btn btn-primary">Button</button>
          <Button>Click me</Button>
          <div>{JSON.stringify(session)}</div>
          <div>
            <div>Server Fetch</div>
            {data?.entities.map(entity => (
              <li key={entity.id} className="mb-2">
                {entity.name}
              </li>
            ))}
          </div>
          <div>
            <div>Server Admin Fetch</div>
            {adminData?.adminEntities?.map(entity => (
              <li key={entity.id} className="mb-2">
                {entity.name}
              </li>
            ))}
          </div>

          <EntityList />
        </main>
      </div>
    </>
  );
}
