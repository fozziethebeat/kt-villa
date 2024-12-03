import {gql} from '@apollo/client';
import {getClient} from '@/graphql/ApolloClient';

import {TestStyleForm} from '@/components/TestStyleForm';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

const QUERY = gql`
  query Style($id: String) {
    style(id: $id) {
      id
      pattern
    }
  }
`;

export default async function StylePage({params}) {
  const {id} = await params;
  const {data, error} = await getClient().query({
    query: QUERY,
    variables: {id},
  });
  return (
    <div className="flex flex-col gap-4 py-4 px-4">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">Root</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/admin">Home</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Style {id}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <TestStyleForm style={data.style} />
    </div>
  );
}
