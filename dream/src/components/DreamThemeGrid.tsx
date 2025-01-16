import Link from 'next/link';

import {gql} from '@apollo/client';
import {getClient} from '@/graphql/ApolloClient';

import {DreamCard} from '@/components/DreamCard';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

const QUERY = gql`
  query UserDream {
    userDream {
      id
      memory
      story
      dreamImage
    }
  }
`;

const ALL_QUERY = gql`
  query Dreams {
    dreams {
      id
      memory
      story
      dreamImage
      user {
        name
      }
    }
  }
`;

export async function DreamThemeGrid() {
  const {data, error} = await getClient().query({query: QUERY});
  const {data: allDreams, error: allError} = await getClient().query({
    query: ALL_QUERY,
  });
  const dreams = [];
  dreams.push(
    <DreamCard key="primary" dream={data.userDream} isUserDream={true} />,
  );
  dreams.push(
    ...allDreams.dreams.map(d => (
      <DreamCard key={d.id} dream={d} isUserDream={false} />
    )),
  );

  return <div className="grid gap-4 grid-cols-3">{dreams}</div>;
}
