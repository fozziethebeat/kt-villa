import {gql} from '@apollo/client';

import {Header} from '@/components/Header';
import {getClient} from '@/graphql/ApolloClient';
import {auth} from '@/lib/auth';

const PROJECT = gql`
  query ProjectByUserCode($ownerId: String!, $code: String!) {
    projectByUserCode(ownerId: $ownerId, code: $code) {
      id
      code
      name
    }
  }
`;

const links = [{url: '/', label: 'Home'}];

export default async function ProjectPage({params}) {
  const session = await auth();
  const {user, code} = await params;
  const {data: projectData} = await getClient().query({
    query: PROJECT,
    variables: {ownerId: user, code},
  });
  const project = projectData.projectByUserCode;
  if (!project) {
    return (
      <>
        <Header target={code} links={links} />
        <div className="flex flex-col gap-4 py-4 px-4">Not yo project</div>
      </>
    );
  }

  return (
    <>
      <Header target={code} links={links} />
      <div className="flex flex-col gap-4 py-4 px-4">
        <span>{project.name}</span>
      </div>
    </>
  );
}
