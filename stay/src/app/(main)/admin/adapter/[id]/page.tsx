import Link from "next/link";
import { gql } from "@apollo/client";

import { getClient } from "@/graphql/ApolloClient";
import { checkAccess } from "@/lib/auth-check";
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

export default async function EditAdapterPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await checkAccess("admin", "/");
  const { id } = await params;

  try {
    const { data } = await getClient().query({
      query: QUERY,
      variables: { id: parseInt(id, 10) },
      fetchPolicy: "no-cache",
    });
    const imageAdapter = (data as any)?.imageAdapterSetting;

    if (!imageAdapter) {
      return (
        <div className="alpine-container py-12">
          <div className="rounded-2xl border border-border bg-card p-8 text-center">
            <h1 className="text-xl font-bold text-foreground">
              Style Adapter #{id} Not Found
            </h1>
            <Link
              href="/admin?view=adapters"
              className="mt-4 inline-flex rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground"
            >
              Back to Admin Adapters
            </Link>
          </div>
        </div>
      );
    }

    return (
      <div className="alpine-container py-8 lg:py-12">
        <EditAdapterForm imageAdapter={imageAdapter} />
      </div>
    );
  } catch (e) {
    return (
      <div className="alpine-container py-12">
        <div className="rounded-2xl border border-border bg-card p-8 text-center">
          <h1 className="text-xl font-bold text-foreground">
            Unable to Load Style Adapter
          </h1>
          <Link
            href="/admin?view=adapters"
            className="mt-4 inline-flex rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground"
          >
            Back to Admin Adapters
          </Link>
        </div>
      </div>
    );
  }
}
