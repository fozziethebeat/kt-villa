import { withAuth } from "@/lib/withAuth";
import { gql } from "@apollo/client";
import { getClient } from "@/graphql/ApolloClient";
import { EditUserForm } from "@/components/EditUserForm";

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

async function EditUserPage({ params }) {
  try {
    const { data, error } = await getClient().query({
      query: QUERY,
      variables: { id: params.id },
    });
    return (
      <div className="min-h-screen w-full bg-base-200">
        <div className="hero-content flex-col items-start lg:flex-row">
          <EditUserForm user={data.user} />
        </div>
      </div>
    );
  } catch (e) {
    console.log(e);
    return <div>whoops</div>;
  }
}

export default withAuth(EditUserPage, "admin", "/");
