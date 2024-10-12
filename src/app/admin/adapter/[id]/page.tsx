import { withAuth } from "@/lib/withAuth";
import { gql } from "@apollo/client";
import { getClient } from "@/graphql/ApolloClient";
import { EditAdapterForm } from "@/components/EditAdapterForm";

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

async function EditAdapterPage({ params }) {
  try {
    const { data, error } = await getClient().query({
      query: QUERY,
      variables: { id: parseInt(params.id) },
    });
    const imageAdapter = data.imageAdapterSetting;
    return (
      <div className="min-h-screen w-full bg-base-200">
        <div className="hero-content flex-col items-start lg:flex-row">
          <EditAdapterForm imageAdapter={imageAdapter} />
        </div>
      </div>
    );
  } catch (e) {
    console.log(e);
    return <div>whoops</div>;
  }
}

export default withAuth(EditAdapterPage, "admin", "/");
