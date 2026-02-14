import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

const { GET, POST: betterAuthPOST } = toNextJsHandler(auth);

export { GET };

export const POST = async (req: NextRequest) => {
    // Intercept magic link sign-in to enforce invitation code
    if (req.nextUrl.pathname.endsWith("/sign-in/magic-link")) {
        try {
            // Clone request to read body without consuming it for betterAuth
            const bodyClone = await req.clone().json();
            const email = bodyClone.email;

            if (email) {
                // Check if user exists
                const user = await prisma.user.findUnique({
                    where: { email },
                });

                if (!user) {
                    // New user: Require Magic Code
                    const magicCode = req.headers.get("x-magic-code");

                    if (!magicCode) {
                        console.log("[AuthAPI] New user signup blocked: Missing magic code");
                        return NextResponse.json(
                            { message: "Magic code required for signup", error: "Magic code required" },
                            { status: 403 }
                        );
                    }

                    const foundCode = await prisma.magicCode.findUnique({
                        where: { id: magicCode },
                    });

                    if (!foundCode) {
                        console.log("[AuthAPI] New user signup blocked: Invalid magic code");
                        return NextResponse.json(
                            { message: "Invalid magic code", error: "Invalid magic code" },
                            { status: 403 }
                        );
                    }
                    console.log("[AuthAPI] Magic code validated for new user:", email);
                } else {
                    console.log("[AuthAPI] Existing user login:", email);
                    // Existing user: Allow (Better Auth handles magic link)
                    // Ensure we don't accidentally allow signup if logic changes? 
                    // Logic: If user exists, we trust they verified before.
                }
            }
        } catch (e) {
            console.error("[AuthAPI] Error in interception:", e);
            // Fallthrough to let betterAuth handle/fail if body is malformed?
            // Or return error?
        }
    }

    return betterAuthPOST(req);
};
