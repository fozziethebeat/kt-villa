import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

const { GET, POST: betterAuthPOST } = toNextJsHandler(auth);

export { GET };

// Store magic code per email for post-signup gift assignment
const pendingGiftCodes = new Map<string, string>();

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

                    // Store the magic code so we can assign the soap gift after user creation
                    pendingGiftCodes.set(email.toLowerCase(), magicCode);
                } else {
                    console.log("[AuthAPI] Existing user login:", email);
                }
            }
        } catch (e) {
            console.error("[AuthAPI] Error in interception:", e);
        }
    }

    const response = await betterAuthPOST(req);

    // After successful magic link send, check if we need to queue a gift assignment
    // The actual gift assignment happens when the user verifies and their account is created
    // We handle that in the verify callback below
    return response;
};

// Background task: Check for pending gift codes when a user is created
// This runs as a separate export that auth.ts hooks into
export async function assignPendingGift(email: string, userId: string) {
    const normalizedEmail = email.toLowerCase();
    const magicCode = pendingGiftCodes.get(normalizedEmail);

    if (!magicCode) return;

    try {
        // Find the batch associated with this magic code
        const batch = await prisma.batch.findFirst({
            where: { magicCodeId: magicCode }
        });

        if (batch) {
            // Check if gift already exists
            const existingGift = await prisma.soapGift.findFirst({
                where: { batchId: batch.id, userId }
            });

            if (!existingGift) {
                await prisma.soapGift.create({
                    data: {
                        batchId: batch.id,
                        userId,
                        note: `Auto-assigned via magic code: ${magicCode}`,
                    }
                });
                console.log(`[AuthAPI] Auto-assigned soap gift for batch "${batch.name}" to user ${email}`);
            }
        }
    } catch (error) {
        console.error("[AuthAPI] Failed to assign pending gift:", error);
    } finally {
        pendingGiftCodes.delete(normalizedEmail);
    }
}
