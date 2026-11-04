import Link from "next/link";
import { gql } from "@apollo/client";

import { getClient } from "@/graphql/ApolloClient";
import { checkAccess } from "@/lib/auth-check";
import { EditUserForm } from "@/components/EditUserForm";

const QUERY = gql`
  query User($id: String!) {
    user(id: $id) {
      id
      name
      email
      roles
      trustStatus
      referral
      socialType
      socialHandle
    }
  }
`;

export default async function EditUserPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await checkAccess("admin", "/");
  try {
    const { data } = await getClient().query({
      query: QUERY,
      variables: { id },
      fetchPolicy: "no-cache",
    });
    const user = (data as any)?.user;
    if (!user) {
      return (
        <div className="alpine-container py-12">
          <div className="rounded-2xl border border-border bg-card p-8 text-center">
            <h1 className="text-xl font-bold text-foreground">
              User Not Found
            </h1>
            <Link
              href="/admin?view=users"
              className="mt-4 inline-flex rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground"
            >
              Back to Admin Users
            </Link>
          </div>
        </div>
      );
    }

    return (
      <div className="alpine-container py-8 lg:py-12">
        <EditUserForm user={user} />
      </div>
    );
  } catch (e) {
    return (
      <div className="alpine-container py-12">
        <div className="rounded-2xl border border-border bg-card p-8 text-center">
          <h1 className="text-xl font-bold text-foreground">
            Unable to Load User
          </h1>
          <Link
            href="/admin?view=users"
            className="mt-4 inline-flex rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground"
          >
            Back to Admin Users
          </Link>
        </div>
      </div>
    );
  }
}
