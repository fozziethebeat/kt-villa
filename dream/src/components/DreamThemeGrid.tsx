import Link from 'next/link';

import {gql} from '@apollo/client';
import {getClient} from '@/graphql/ApolloClient';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

const QUERY = gql`
  query DreamThemes {
    dreamThemes {
      id
      theme
      description
    }
  }
`;

export async function DreamThemeGrid() {
  const {data, error} = await getClient().query({query: QUERY});
  return (
    <div className="grid gap-4 grid-cols-3">
      {data.dreamThemes.map(theme => (
        <Card key={theme.id} className="flex w-64 h-32">
          <CardContent className="flex flex-col text-left text-sm py-2">
            <div className="font-semibold">{theme.theme} </div>
            <div className="flex-1 text-xs">{theme.description}</div>
            <Link href="#">Imagine</Link>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
