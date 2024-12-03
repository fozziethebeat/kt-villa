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
  query Styles {
    styles {
      id
      pattern
    }
  }
`;

export async function StyleGrid() {
  const {data, error} = await getClient().query({query: QUERY});
  return (
    <div className="grid gap-1 grid-cols-4">
      {data.styles.map(style => (
        <Card key={style.id} className="w-64">
          <Link key={style.id} href={`/style/${style.id}`}>
            <CardContent className="text-left text-sm py-2">
              <div className="font-semibold">{style.id} </div>
              <div className="text-xs">{style.pattern}</div>
            </CardContent>
          </Link>
        </Card>
      ))}
    </div>
  );
}
