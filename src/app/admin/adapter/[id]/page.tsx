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

import {EditAdapterForm} from '@/components/EditAdapterForm';

const QUERY = gql`
  query ImageAdapterSetting($id: Int!) {
    imageAdapterSetting(id: $id) {
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

export default async function EditAdapterPage({params}) {
  await checkAccess('admin', '/');
  try {
    const {data, error} = await getClient().query({
      query: QUERY,
      variables: {id: parseInt(params.id)},
    });
    const imageAdapter = data.imageAdapterSetting;
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
        <EditAdapterForm imageAdapter={imageAdapter} />
      </div>
    );
  } catch (e) {
    console.log(e);
    return <div>whoops</div>;
  }
}
