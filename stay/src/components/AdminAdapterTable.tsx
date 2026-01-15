import { gql } from "@apollo/client";
import Link from "next/link";

import { getClient } from "@/graphql/ApolloClient";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const QUERY = gql`
  query ImageAdapterSettings {
    imageAdapterSettings {
      id
      startDate
      adapter
      promptTemplate
      negativePrompt
      steps
      variants
    }
  }
`;

export async function AdminAdapterTable() {
  try {
    const { data, error } = await getClient().query({ query: QUERY });
    return (
      <Card x-chunk="dashboard-05-chunk-3">
        <CardHeader className="px-7">
          <CardTitle>Adapters</CardTitle>
          <CardDescription>Image Generation Adapters.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead className="hidden sm:table-cell">
                  Start Date
                </TableHead>
                <TableHead className="hidden sm:table-cell">Adapter</TableHead>
                <TableHead className="hidden md:table-cell">
                  Prompt Template
                </TableHead>
                <TableHead className="hidden md:table-cell">
                  Negative Prompt
                </TableHead>
                <TableHead className="hidden md:table-cell">Steps</TableHead>
                <TableHead className="hidden md:table-cell">Variants</TableHead>
                <TableHead className="hidden md:table-cell">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(data as any).imageAdapterSettings.map((adapter) => (
                <TableRow key={adapter.id}>
                  <TableCell>
                    <div className="font-medium">{adapter.id}</div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    {new Date(adapter.startDate).toLocaleDateString("en-CA")}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    {adapter.adapter}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {adapter.promptTemplate}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {adapter.negativePrompt}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {adapter.steps}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {adapter.variants}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <Link href={`/admin/adapter/${adapter.id}`}>Edit</Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    );
  } catch (e) {
    console.log(e);
    return <div>No Data to fetch</div>;
  }
}
