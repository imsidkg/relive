## Relive

Relive is a collaborative AI coding workspace that lets you **generate, preview, and relive full-stack UI fragments**. Users chat with an AI agent to spin up production-quality Next.js experiences inside an isolated sandbox, then browse, re-open, and iterate on those generated “fragments” through a rich frontend.

Relive combines a React/Vite frontend, an Express/Inngest backend, a Prisma-powered database, and an on-demand E2B sandbox so you can go from idea to running UI in minutes while keeping every iteration accessible.

### Core Capabilities

- **AI-driven fragment creation**: Chat with an agent that writes and wires up full Next.js fragments (pages, components, layouts, flows).
- **Live sandbox execution**: Every fragment is built and run inside an E2B sandbox with a real Next.js runtime.
- **Fragment history & replay**: Each AI-produced result is stored as a “fragment” you can reopen, inspect, and preview later.
- **Typed API & routing**: TRPC-based backend APIs, strongly typed end-to-end, serving the frontend.
- **Authentication & multi-projects**: Clerk-backed auth and per-project conversation/fragment history.

---

## Architecture

The high-level architecture of Relive is intentionally modular and slightly over-engineered to support experimentation, traceability, and safe execution of untrusted code.

```mermaid
flowchart TD
  subgraph FE[Frontend - Vite React]
    FE_UI[UI: Home and Project Views]
    FE_TRPC[TRPC Client]
    FE_AUTH[Clerk SDK]
    FE_ROUTER[React Router]
  end

  subgraph BE[Backend - Express]
    BE_APP[Express App]
    BE_TRPC[TRPC Router (/trpc)]
    BE_INNGEST_EP[Inngest HTTP Endpoint (/api/inngest)]
  end

  subgraph AG[Async Orchestration - Inngest]
    AG_FN[codeAgentFunction]
    subgraph AG_NET[Agent Network]
      AG_NET_STATE[Shared Agent State]
      AG_NET_CODE[codeAgent (Gemini)]
      AG_NET_ANTH[anthropicCodeAgent]
      AG_NET_OPENAI[openAiCodeAgent]
      AG_TERMINAL[Tool: terminal]
      AG_FILES[Tool: create_or_update_files]
      AG_READ[Tool: read_files]
    end
  end

  subgraph SB[E2B Sandbox - Next.js Runtime]
    SB_CTL[Sandbox Controller - e2b code interpreter]
    SB_FS[Ephemeral File System]
    SB_DEV[Running Next.js Dev Server]
  end

  subgraph DB[Database Layer - Prisma]
    DB_PRISMA[Prisma Client]
    DB_MSG[Messages - history]
    DB_FRAG[Fragments - files and sandboxUrl and title]
    DB_PROJ[Projects]
  end

  subgraph EXT[AI and Infra Providers]
    EXT_GEMINI[Gemini API]
    EXT_ANTH[Anthropic API]
    EXT_OPENAI[OpenAI API]
    EXT_CLERK[Clerk Auth]
  end

  FE_UI --> FE_ROUTER
  FE_UI --> FE_TRPC
  FE_UI --> FE_AUTH

  FE_TRPC --> BE_TRPC
  FE_AUTH --> EXT_CLERK

  BE_APP --> BE_TRPC
  BE_APP --> BE_INNGEST_EP

  BE_TRPC --> DB_PRISMA
  DB_PRISMA --> DB_MSG
  DB_PRISMA --> DB_FRAG
  DB_PRISMA --> DB_PROJ

  BE_TRPC --> AG_FN
  BE_INNGEST_EP --> AG_FN

  AG_FN --> AG_NET
  AG_NET_STATE --> AG_NET_CODE
  AG_NET_STATE --> AG_NET_ANTH
  AG_NET_STATE --> AG_NET_OPENAI

  AG_NET_CODE --> AG_TERMINAL
  AG_NET_CODE --> AG_FILES
  AG_NET_CODE --> AG_READ

  AG_TERMINAL --> SB_CTL
  AG_FILES --> SB_FS
  AG_READ --> SB_FS
  SB_CTL --> SB_DEV

  AG_NET_CODE --> EXT_GEMINI
  AG_NET_ANTH --> EXT_ANTH
  AG_NET_OPENAI --> EXT_OPENAI

  AG_FN --> DB_FRAG
  DB_FRAG --> BE_TRPC
  BE_TRPC --> FE_UI
```

### Request Flow (Simplified)

1. **User interacts in Relive UI**  
   - A user creates or opens a project and chats with the AI from the `ProjectView`.

2. **Backend & Inngest orchestration**  
   - The frontend calls TRPC procedures which, in turn, enqueue an Inngest event to run `codeAgentFunction` for the project.

3. **Agent network + sandbox**  
   - `codeAgentFunction` spins up an E2B sandbox, bootstraps a Next.js template, and then runs the primary `codeAgent` (Gemini-based) inside an agent network.  
   - The agent uses tools (`terminal`, `create_or_update_files`, `read_files`) to iteratively modify files and run commands inside the sandbox until the requested UI/feature is implemented.

4. **Persistence & fragment creation**  
   - Once the agent emits a `<task_summary>` and associated files, the function persists those into Prisma as a `Fragment`, tied to the conversation `Message` and project.

5. **Replay & preview**  
   - The frontend fetches fragments and messages via TRPC and lets the user toggle between **Demo** (remote sandbox URL) and **Code** (read-only file explorer) views, effectively letting them “relive” what the AI built.

---

## Local Development (High Level)

> These steps are intentionally brief; see the `frontend` and `backend` READMEs for detailed commands and environment variables.

- **Frontend (`frontend/`)**
  - Vite + React 19 + TypeScript.
  - Tailwind CSS and Shadcn UI components.
  - Auth via Clerk, data via TRPC client.

- **Backend (`backend/`)**
  - Express server exposing TRPC and Inngest HTTP endpoints.
  - Prisma for DB access (configured via `prisma.config.*`).
  - Inngest + `@inngest/agent-kit` + `@e2b/code-interpreter` to orchestrate sandboxes and AI calls.


