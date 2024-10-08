import { auth } from "@/auth";
import { redirect } from "next/navigation";

export async function checkAccess(targetRole: string, failedPath: string) {
  const session = await auth();
  if (session?.user?.roles !== targetRole) {
    redirect(failedPath);
  }
}

export async function getSession() {
  return await auth();
}
