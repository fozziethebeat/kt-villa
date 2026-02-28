import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

/**
 * DEV-ONLY: Instantly sign in as a seeded user without going through the
 * email magic-link flow. Completely disabled outside of development.
 *
 * POST /api/auth/dev-login
 * Body: { "role": "admin" }   — signs in as ADMIN_EMAIL
 * Body: { "role": "user" }    — signs in as TEST_USER_EMAIL
 *
 * How it works:
 *   1. Creates a magic-link verification token directly in the DB
 *   2. Calls better-auth's magicLinkVerify endpoint internally
 *   3. Returns the response with a properly signed session cookie
 *
 * This produces a real, properly-signed session — identical to what
 * you'd get by clicking a magic link in an email.
 */
export async function POST(req: NextRequest) {
    // ── Hard gate: dev only ────────────────────────────────────────
    if (process.env.NODE_ENV !== "development") {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const body = await req.json().catch(() => ({}));

    // Resolve the target email
    let email: string = body.email || "";
    if (!email && body.role === "admin") {
        email = process.env.ADMIN_EMAIL || "";
    } else if (!email && body.role === "user") {
        email = process.env.TEST_USER_EMAIL || "";
    } else if (!email) {
        email = process.env.ADMIN_EMAIL || "";
    }

    if (!email) {
        return NextResponse.json(
            { error: "No email resolved. Set ADMIN_EMAIL in .env and run 'npm run dbreset'." },
            { status: 400 }
        );
    }

    // Verify the user exists before proceeding
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
        return NextResponse.json(
            { error: `User not found: ${email}. Run "npm run dbreset" to seed.` },
            { status: 404 }
        );
    }

    try {
        // Step 1: Generate a random token and create a verification record
        //         directly in the DB, mimicking what signInMagicLink does
        //         (but without sending an email)
        const token = generateRandomString(32);

        await prisma.verification.create({
            data: {
                identifier: token,
                value: JSON.stringify({ email }),
                expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5min
            },
        });

        // Step 2: Call better-auth's magic link verify endpoint internally.
        //         This creates a real session and returns a properly signed cookie.
        const baseURL = process.env.BETTER_AUTH_URL || process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
        const verifyURL = `${baseURL}/api/auth/magic-link/verify?token=${encodeURIComponent(token)}&callbackURL=%2F`;

        const verifyRes = await fetch(verifyURL, {
            method: "GET",
            redirect: "manual",  // Don't follow the 302 — we want the Set-Cookie header
            headers: {
                // Pass through a minimal origin/referer so CSRF checks pass
                "Origin": baseURL,
                "Referer": `${baseURL}/signin`,
            },
        });

        // Step 3: Extract the session cookie from better-auth's response
        //         and forward it to the client
        const setCookieHeaders = verifyRes.headers.getSetCookie?.() || [];

        if (setCookieHeaders.length === 0) {
            throw new Error("better-auth did not return a session cookie");
        }

        const response = NextResponse.json({
            ok: true,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                roles: (user as any).roles,
            },
        });

        // Forward all Set-Cookie headers from better-auth
        for (const cookie of setCookieHeaders) {
            response.headers.append("Set-Cookie", cookie);
        }

        console.log(`[DevLogin] ✓ Session created for ${email} (${(user as any).roles})`);
        return response;
    } catch (error: any) {
        console.error("[DevLogin] Failed:", error);
        return NextResponse.json(
            { error: `Dev login failed: ${error.message}` },
            { status: 500 }
        );
    }
}

/** Generate a random alphanumeric string */
function generateRandomString(length: number): string {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let result = "";
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    for (let i = 0; i < length; i++) {
        result += chars[array[i] % chars.length];
    }
    return result;
}
