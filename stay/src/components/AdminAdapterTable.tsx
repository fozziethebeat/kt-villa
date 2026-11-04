import { gql } from "@apollo/client";

import { getClient } from "@/graphql/ApolloClient";
import { AdminAdapterTableClient } from "@/components/AdminAdapterTableClient";

const QUERY = gql`
  query ImageAdapterSettings {
    imageAdapterSettings {
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

export async function AdminAdapterTable() {
  try {
    const { data } = await getClient().query({
      query: QUERY,
      fetchPolicy: "no-cache",
    });
    const adapters = (data as any)?.imageAdapterSettings ?? [];
    return <AdminAdapterTableClient adapters={adapters} />;
  } catch (e) {
    return (
      <div className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">
        Unable to load AI style adapters.
      </div>
    );
  }
}
