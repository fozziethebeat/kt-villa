'use client';

import {
  gql,
  useSuspenseQuery,
  useMutation,
  TypedDocumentNode,
} from '@apollo/client';
import {ColumnDef} from '@tanstack/react-table';
import Link from 'next/link';
import {MoreHorizontal} from 'lucide-react';

import {getClient} from '@/graphql/ApolloClient';

import {CopyToClipboardText} from '@/components/CopyToClipboardText';
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

interface User {
  id: string;
  name: string;
}

interface Dreams {
  adminDreams: {
    id: string;
    memory: string;
    story: string;
    dreamImage: string;
    user: User;
  }[];
}

const QUERY: TypedDocumentNode<Dreams> = gql`
  query AdminDreams {
    adminDreams {
      id
      memory
      story
      dreamImage
      user {
        id
        name
      }
    }
  }
`;

export const columns: ColumnDef<any>[] = [
  {
    accessorKey: 'id',
    header: 'ID',
  },
  {
    id: 'memory',
    header: 'Memory',
    cell: ({row}) => {
      const memory = row.original.memory;
      return <CopyToClipboardText text={memory} />;
    },
  },
  {
    id: 'story',
    header: 'Story',
    cell: ({row}) => {
      const story = row.original.story;
      return <CopyToClipboardText text={story} />;
    },
  },
  {
    id: 'dreamImage',
    header: 'Dream Image',
    cell: ({row}) => {
      const dreamImage = row.original.dreamImage;
      return <CopyToClipboardText text={dreamImage} />;
    },
  },
  {
    id: 'user',
    header: 'User',
    cell: ({row}) => {
      const name = row.original.user.name;
      return <CopyToClipboardText text={name} />;
    },
  },
];

export function AdminDreamsTable() {
  const {data} = useSuspenseQuery(QUERY);
  return (
    <Card x-chunk="dashboard-05-chunk-3">
      <CardHeader className="px-7">
        <CardTitle>Dreams</CardTitle>
        <CardDescription className="flex justify-between"></CardDescription>
      </CardHeader>
      <CardContent>
        <DataTable columns={columns} data={data.adminDreams} />
      </CardContent>
    </Card>
  );
}
