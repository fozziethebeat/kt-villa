import {gql} from '@apollo/client';
import ReactMarkdown from 'react-markdown';

import {DreamCard} from '@/components/DreamCard';
import {Header} from '@/components/Header';
import {getClient} from '@/graphql/ApolloClient';
import {auth} from '@/lib/auth';

const PROJECT = gql`
  query ProjectByUserCode($ownerId: String!, $code: String!) {
    projectByUserCode(ownerId: $ownerId, code: $code) {
      id
      code
      name
      description
    }
  }
`;

const PROJECT_DREAMS = gql`
  query DreamsByProject($projectId: String!) {
    dreamsByProject(projectId: $projectId) {
      id
      memory
      story
      dreamImage
      isUserDream
      user {
        name
      }
      project {
        code
        name
        owner {
          username
        }
      }
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
  const {data: dreamData} = await getClient().query({
    query: PROJECT_DREAMS,
    variables: {projectId: project.id},
  });
  console.log(dreamData);
  const dreams = dreamData.dreamsByProject;

  return (
    <>
      <Header target={code} links={links} />
      <div className="flex flex-col gap-4 py-4 px-4">
        <span>{project.name}</span>
        <div>
          <ReactMarkdown>{project.description}</ReactMarkdown>
        </div>

        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {dreams.map(dream => (
            <DreamCard
              key={dream.id}
              dream={dream}
              isUserDream={dream.isUserDream}
            />
          ))}
        </div>
      </div>
    </>
  );
}
