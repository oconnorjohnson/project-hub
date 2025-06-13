# Next.js Project Hub – Routing & Layout Blueprint

## 1. Core Mental Model

| **Concept**    | **Purpose**                                                             | **1-sentence rule of thumb**                               |
| -------------- | ----------------------------------------------------------------------- | ---------------------------------------------------------- |
| **Workspace**  | Your personal “org” (you alone or you + collaborators).                 | One workspace per real-world company or persona.           |
| **Project**    | A discrete initiative (film, robotics build, screenplay, SaaS feature). | Never nest projects—use tags for “sub-projects.”           |
| **Workstream** | A lens on the same data (Tasks, Docs, Assets, Timeline).                | Every project exposes the same set of workstreams.         |
| **Artifact**   | Smallest CRUD thing (task, doc, asset, calendar event).                 | Belongs to exactly one project, referenced globally by ID. |

Everything in routing and RBAC flows from these four nouns.

---

## 2. Recommended App Router Layout (Next 14)

<details>
<summary>Directory tree</summary>

```text
app/
  (marketing)/
    page.tsx
    pricing/page.tsx
  (app)/
    layout.tsx               ← Global nav + Zustand providers
    page.tsx                 ← Personal dashboard
    projects/
      layout.tsx             ← Project sidebar + breadcrumbs
      page.tsx               ← “All projects” list
      [projectId]/
        loading.tsx
        page.tsx             ← Project overview
        actions/             ← Stored server actions
        @modal/              ← Parallel route for slide-overs
        tasks/
          page.tsx
          [taskId]/page.tsx
        docs/
          page.tsx
          [docId]/page.tsx
        assets/
          page.tsx
        timeline/
          page.tsx
    settings/
    api/                      ← Route handlers / tRPC
lib/
components/
  ui/
  layout/
  modals/
  widgets/
```

</details>

### Why this structure?

1. Route groups `(marketing)` vs `(app)` keep public pages out of the auth bundle.
2. Single `[projectid]` segment nests all workstreams, simplifying deep-links and state.
3. Parallel route `@modal` gives URL-addressable slide-overs/command-K without hacks.
4. Project layout streams meta once; children lazy load.

## 3. Navigation & UX Patterns

| Pattern                      | Implementation hint                                                       |
| ---------------------------- | ------------------------------------------------------------------------- |
| **Command Bar (⌘-K)**        | Parallel route + Radix Dialog; preload recent Projects & Actions via RSC. |
| **Left Sidebar**             | Pinned or recent projects; filter by tag (film, code, hardware).          |
| **Right Drawer (Inspector)** | Another parallel route for quick-edit of any Artifact.                    |
| **Breadcrumbs**              | Derive from router segments for deep paths.                               |
| **Theme**                    | next-themes + shadcn/ui CSS variables for seamless dark/light switching.  |

## 4. UI Components & Theming

- **Component Library (shadcn/ui)**

  - All base components (Button, Dialog, Input, etc.) use shadcn/ui for consistency
  - Components installed via CLI and live in `components/ui/`
  - Built on Radix UI primitives with full accessibility and keyboard navigation
  - Tailwind CSS utility classes provide styling foundation

- **Dark/Light Theme (next-themes + shadcn)**

  - `next-themes` handles theme switching and persistence
  - CSS variables in `globals.css` define light/dark color tokens
  - shadcn components automatically adapt to theme via CSS custom properties
  - Theme toggle component available in layout for user preference

## 5. Data & API Layer

- **Database (Supabase Postgres + Drizzle ORM)**

  - Tables: `workspace`, `user_workspace_role`
  - `project` → FK to `workspace`
  - `artifact` → FK to `project`, `type` enum (`TASK | DOC | ASSET | EVENT`)
  - Junction tables for labels ↔ artifacts and participants ↔ artifacts
  - Drizzle migrations tracked in `drizzle/` and applied via the Supabase CLI

- **Auth (Clerk)**

  - `ClerkProvider` wraps the client shell; components use `useUser` / `useAuth`
  - API route handlers read `getAuth(req)` to inject `userId` & workspace claims

- **API Layer**

  - REST-ish route handlers in `app/api/**/route.ts` (no Server Actions)
  - JSON schemas validated with Zod; uniform error envelope

- **Data Fetching & Caching (TanStack React Query)**

  - `QueryClientProvider` mounted at the root
  - Fetch helpers in `lib/api.ts` attach Clerk JWT for auth
  - React Query handles stale-while-revalidate, cache invalidation, and optimistic mutations

- **State Management**
  - **Zustand** reserved for ephemeral UI state (drag order, modal visibility)
  - All persistent data lives exclusively in React Query’s cache—no double sources
