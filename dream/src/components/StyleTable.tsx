'use client';

import {gql, useSuspenseQuery, useMutation} from '@apollo/client';
import {ColumnDef} from '@tanstack/react-table';
import Link from 'next/link';
import {MoreHorizontal} from 'lucide-react';

import {getClient} from '@/graphql/ApolloClient';

import {DataTable} from '@/components/DataTable';
import {Button} from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const QUERY = gql`
  query Styles {
    styles {
      id
      pattern
    }
  }
`;

export const columns: ColumnDef[] = [
  {
    accessorKey: 'id',
    header: 'ID',
  },
  {
    accessorKey: 'pattern',
    header: 'Pattern',
  },
  {
    id: 'actions',
    header: 'Actions',
    cell: ({row}) => {
      const style = row.original;
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>
              <Link href={`/style/${style.id}`}>View</Link>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Link href={`/style/${style.id}/edit`}>Edit</Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];

export function StyleTable() {
  const {data} = useSuspenseQuery(QUERY);
  return (
    <Card x-chunk="dashboard-05-chunk-3">
      <CardHeader className="px-7">
        <CardTitle>Styles</CardTitle>
        <CardDescription className="flex justify-between">
          <Link href="/style">
            <Button>New Style</Button>
          </Link>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <DataTable columns={columns} data={data.styles} />
      </CardContent>
    </Card>
  );
}
