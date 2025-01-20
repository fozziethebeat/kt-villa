import {gql} from '@apollo/client';

import {getClient} from '@/graphql/ApolloClient';
import {checkAccess} from '@/lib/auth-check';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import {EditUserForm} from '@/components/EditUserForm';

const QUERY = gql`
  query User($id: String!) {
    user(id: $id) {
      id
      name
      email
      roles
      trustStatus
    }
  }
`;

export default async function EditUserPage({params}) {
  const {id} = await params;
  await checkAccess('admin', '/');
  try {
    const {data, error} = await getClient().query({
      query: QUERY,
      variables: {id},
    });
    return (
      <div className="flex flex-col sm:gap-4 sm:py-4 sm:pl-4">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">Home</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/admin">Admin</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Edit User</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <EditUserForm user={data.user} />
      </div>
    );
  } catch (e) {
    console.log(e);
    return <div>whoops</div>;
  }
}
