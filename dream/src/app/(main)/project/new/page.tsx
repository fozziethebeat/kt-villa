import { Header } from "@/components/Header";
import { auth } from "@/lib/auth";

import { CreationWizard } from "@/components/creation_flow/CreationWizard";
const links = [{ url: "/", label: "Home" }];

export default async function NewProjectPage({}) {
  const session = await auth();
  return (
    <>
      <Header target="New Project" links={links} />
      <div className="flex flex-col gap-4 py-4 px-4">
        <span>New Project Time</span>
        <CreationWizard />
      </div>
    </>
  );
}
