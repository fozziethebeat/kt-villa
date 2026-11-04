import { gql } from "@apollo/client";

import { getClient } from "@/graphql/ApolloClient";
import { AdminUsersTableClient } from "@/components/AdminUsersTableClient";

const QUERY = gql`
  query Users {
    users {
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

export async function AdminUsersTable() {
  try {
    const { data } = await getClient().query({
      query: QUERY,
      fetchPolicy: "no-cache",
    });
    const users = (data as any)?.users ?? [];
    return <AdminUsersTableClient users={users} />;
  } catch (e) {
    return (
      <div className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">
        Unable to load users.
      </div>
    );
  }
}
