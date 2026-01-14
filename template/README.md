This is a template NextJS app for building simple user facing applications.   

## Core Components

This uses
* NextJS
* TailwindCSS
* Shadcn UI
* TypeScript
* React
* Prisma with Postgres
* Nodemailer
* AuthJS
* GraphQL

## Structure

This uses role based authentication to ensure there's at least three classes of users
* Regular general users
* Admin users
* Partially trusted regular users

Each can have their own set of pages accessible and actions they can perform.

## Running

First, run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.