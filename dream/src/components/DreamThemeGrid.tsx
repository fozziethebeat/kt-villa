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
  query UserDreams {
    userDreams {
      id
      memory
      story
      dreamImage
      project {
        code
        name
        owner {
          username
        }
      }
    }
  }
`;

export async function DreamThemeGrid() {
  const {data, error} = await getClient().query({query: QUERY});
  return (
    <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
      {data.userDreams.map(dream => (
        <DreamCard key={dream.id} dream={dream} isUserDream={true} />
      ))}
    </div>
  );
}
