import {gql} from '@apollo/client';
import Link from 'next/link';

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
    }
  }
`;

const DREAM = gql`
  query UserDream($id: String!) {
    userDream(id: $id) {
      id
      memory
      story
      dreamImage
      prompt
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

  const {data: dreamData} = await getClient().query({
    query: DREAM,
    variables: {id: dreamId},
  });
  const dream = dreamData.userDream;

  console.log(project);

  return (
    <>
      <Header links={links} target="Dream" />
      <DreamFlow dream={dream} project={project} />
    </>
  );
}
