# KT Soaps

This is a premium template for building robust, user-facing applications with a modern tech stack. It features role-based authentication, a GraphQL API, AI integration, and a polished UI.

## 🚀 Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (App Router, Turbopack)
- **Styling**: [TailwindCSS](https://tailwindcss.com/) & [DaisyUI](https://daisyui.com/)
- **UI Components**: [Shadcn UI](https://ui.shadcn.com/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Database**: [Prisma](https://www.prisma.io/) with PostgreSQL
- **API**: GraphQL ([Apollo Server](https://www.apollographql.com/docs/apollo-server/) & [@apollo/client](https://www.apollographql.com/docs/react/))
- **Auth**: [Auth.js](https://authjs.dev/) (NextAuth v5 beta)
- **AI**: [Google Gemini/Imagen](https://ai.google.dev/) integration
- **Email**: [Nodemailer](https://nodemailer.com/) with [React Email](https://react.email/)

## ⚙️ Environment Variables

Copy `.env.example` to `.env` and fill in the following:

### Core
- `DATABASE_URL`: PostgreSQL connection string.
- `NEXTAUTH_SECRET`: Secret for session encryption.
- `NODE_ENV`: `development` or `production`.

### GraphQL
- `NEXT_PUBLIC_GRAPHQL_CLIENT_URL`: Browser-accessible GraphQL endpoint.
- `GRAPHQL_SERVER_URL`: Server-side GraphQL endpoint (usually the same as above or internal).

### Email (SMTP)
- `MAILER_SMTP_HOST`
- `MAILER_SMTP_PORT`
- `MAILER_SMTP_USERNAME`
- `MAILER_SMTP_PASSWORD`
- `MAILER_FROM`: Sender address.

### AI (Google GenAI)
- `GEMINI_API_KEY`: Google AI Studio API key.
- `GEMINI_MODEL`: Model name (e.g., `gemini-1.5-flash`).
- `IMAGEN_MODEL`: Image generation model name.

## 🗄️ Database Management

The project uses Prisma for ORM.

- **Sync Schema**: `npx prisma db push`
- **Reset & Seed**: `npm run dbreset` (Wipes database and runs `prisma/seed.ts`)
- **Studio**: `npx prisma studio`

## 🔐 Authentication & Roles

Role-based access control (RBAC) is implemented via Auth.js. Roles are stored in the `User` model (`roles` field).

- **Default Roles**: `admin`, `general`.
- **Helpers**: Use `hasRole` and `checkAccess` from `@/lib/auth-check` for simplified RBAC in Server Components and middleware.

## ✉️ Magic Code Signup Flow

This template implements an invitation-based signup system to prevent unauthorized access.

1. **Invitation**: An admin or automated process creates a unique ID in the `MagicCode` table.
2. **Signup**: When a new user (email not in `User` table) attempts to sign in, they **must** provide this magic code via the signup form.
3. **Validation**: The `sendVerificationRequest` callback in `src/lib/auth.ts` validates the code against the database. If the user is new and the code is missing or invalid, signup is blocked.
4. **Verification**: Once validated, a standard Auth.js magic link is emailed to the user.

This flow is designed to be easily swappable if migrating to different auth providers like **BetterAuth**.

## 📊 GraphQL Usage

### Server Components
Use the `query` helper from `@/graphql/ApolloClient`:
```tsx
import { query } from '@/graphql/ApolloClient';
const { data } = await query({ query: YOUR_GQL_QUERY });
```

### Client Components
Use the Suspense-ready hooks:
```tsx
import { useSuspenseQuery } from "@apollo/client/react";
const { data } = useSuspenseQuery(YOUR_GQL_QUERY);
```

## 🤖 AI Integration

The `imageGenerator` service in `@/lib/generate.ts` provides a unified interface for text-to-image and image editing using Gemini or Imagen models.

## 🛠️ Utilities

- **CLI Tool**: `npm run cli` runs the script in `src/cli.ts`. Useful for maintenance tasks or backend processing.

## 🛠️ Development

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the result.

## New things to work on

[] Ensure someone can see what style are currently being requested so they don't have to (or can't) double-request something already being scheduled
[] When a request is made, ensure an email is sent to the admin to check.
[] Associate a magic code with each batch such that When a user joins, they automatically get the matching soap in their collection.
[] Create per-user collections of what soaps they've gotten, allow existing users to add a new soap to their collection
[] More little generative tweaks
  [] When creating a batch, tailor the image to the style and base 
  [] when creating a recipie, suggest a name based on the ingredients and a prompt
