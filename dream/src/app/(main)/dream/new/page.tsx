import {gql} from '@apollo/client';

import {getClient} from '@/graphql/ApolloClient';
import {checkAccess} from '@/lib/auth-check';
import {DreamFlow} from '@/components/DreamFlow';
import {Header} from '@/components/Header';

const links = [{url: '/', label: 'Home'}];

const PROJECT = gql`
  query ProjectByUserCode($ownerId: String!, $code: String!) {
    projectByUserCode(ownerId: $ownerId, code: $code) {
      id
      code
      name
      defaultMemory
      defaultStory
      defaultDream
    }
  }
`;

export default async function Dream({searchParams}) {
  await checkAccess('', '/');
  const {owner: ownerId, project: code, id: dreamId} = await searchParams;
  const {data: projectData} = await getClient().query({
    query: PROJECT,
    variables: {ownerId, code},
  });
  const project = projectData.projectByUserCode;

  return (
    <>
      <Header links={links} target="Dream" />
      <DreamFlow project={project} />
    </>
  );
}
