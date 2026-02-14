import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function MobileCallbackPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
    const resolvedSearchParams = await searchParams;
    const callbackScheme = resolvedSearchParams.callback_scheme;

    if (!callbackScheme || typeof callbackScheme !== 'string') {
        return <div>Error: Invalid callback scheme</div>;
    }

    const cookieStore = await cookies();
    const token = cookieStore.get("better-auth.session_token");

    if (!token) {
        return <div>Error: Not authenticated</div>;
    }

    // Construct the deep link
    // Note: we might need to handle the original query params of the scheme if it had any.
    // Usually expo scheme is like exp://IP:PORT OR scheme://
    // We append ?token=...
    const separator = callbackScheme.includes("?") ? "&" : "?";
    const deepLink = `${callbackScheme}${separator}token=${token.value}`;

    // Redirect to the custom scheme
    redirect(deepLink);

    return (
        <div>Redirecting...</div>
    );
}
