import Link from 'next/link';

import {gql} from '@apollo/client';
import {getClient} from '@/graphql/ApolloClient';

const PROJECTS = gql`
  query Projects {
    projects {
      id
      code
      name
      owner {
        username
      }
    }
  }
`;

const JOINED_PROJECTS = gql`
  query JoinedProjects {
    joinedProjects {
      id
      code
      name
      owner {
        username
      }
    }
  }
`;

export async function ProjectGrid() {
  const {data: projectsData} = await getClient().query({
    query: PROJECTS,
  });
  const {data: joinedData} = await getClient().query({
    query: JOINED_PROJECTS,
  });
  return (
    <div>
      <div className="divider">Your Projects</div>
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {projectsData.projects.map(project => (
          <div
            key={project.id}
            className="card bg-base-100 w-96 h-128 shadow-xl">
            <div className="card-body">
              <h2 className="card-title">{project.name}</h2>
              <div className="card-actions justify-end">
                <Link
                  href={`/project/${project.owner.username}/${project.code}`}>
                  <button className="btn btn-primary">See More</button>
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="divider">Your Joined Projects</div>
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {joinedData.joinedProjects.map(project => (
          <div
            key={project.id}
            className="card bg-base-100 w-96 h-128 shadow-xl">
            <div className="card-body">
              <h2 className="card-title">{project.name}</h2>
              <div className="card-actions justify-end">
                <Link
                  href={`/project/${project.owner.username}/${project.code}`}>
                  <button className="btn btn-primary">See More</button>
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
