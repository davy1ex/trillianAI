# SimpleAgent Web — Onboarding

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | React 19 |
| Build | Vite 8 + TypeScript 6 |
| Routing | react-router-dom 7 |
| State | Zustand 5 + persist |
| Styling | CSS Modules |
| Lint | ESLint 10 + typescript-eslint |
| API | `fetch` (SSE for streaming) |

## Quick start

```bash
cd web
npm install
npm run dev        # → http://localhost:5173
```

Backend must be running on `:3001` — Vite proxies `/api/*` there.

| Script | Purpose |
|---|---|
| `npm run dev` | Dev server with HMR |
| `npm run build` | `tsc -b && vite build` |
| `npm run lint` | ESLint check |
| `npm run preview` | Serve production build |

## Project structure

```
src/
  app/              # Bootstrap, routing, global styles
  pages/            # Route-level pages
    chat/           #   ChatPage
      ui.tsx         #     Presentational component
      ui.module.css
      model/store.ts #     Page-level state (loading)
      api/init.ts    #     Initial data orchestration
    settings/       #   SettingsPage
      ui.tsx         #     Two-column: nav (Model, System) + form
      ui.module.css
      index.ts       #     Re-export
  widgets/          # Reusable composition units
    Chat/            # Main conversation area (messages + input)
    ChatPrompt/      # Input prompt + send/stop button
    Sidebar/         # Conversation list + new/rename + settings link
  entities/         # Domain models + state
    conversation/    # Conversation type + zustand store
    message/         # Message type + zustand store
    settings/        # Settings store (persisted to localStorage)
      model/store.ts #   zustand + persist: baseUrl, modelName, enableReasoning, systemPrompt
  shared/
    api/             # HTTP clients (chat SSE, conversations CRUD)
```

Following **Feature-Sliced Design**: `app → pages → widgets → entities → shared`. Dependencies flow strictly top-down.

## Data flow

```
ChatPage mounts
  └→ api/init.ts: fetchConversations()
      └→ conversation store: setConversations + setActiveConversation

Sidebar click
  └→ conversation store: setActiveConversation(id)
      └→ Chat: useEffect → fetchMessages(id)
          └→ message store: setMessages(id, msgs)

User types + sends
  └→ Chat.handleSend → addMessage(user) + addMessage(assistant)
      └→ sendChatMessageSSE(prompt, conversationId, handlers,
           enableReasoning, baseUrl, modelName, systemPrompt)
          └→ POST /api/chat { prompt, conversationId, enableReasoning,
               baseUrl, modelName, systemPrompt }
              └→ SSE stream: content / reasoning events
                  └→ appendChunk → message store (reactive re-render)

Settings changed
  └→ /settings page → zustand store updates → persisted to localStorage
  └→ next chat request picks up new values (enableReasoning, systemPrompt,
       baseUrl, modelName)
```

## Entity schemas

### Conversation

```typescript
interface Conversation {
  id: string
  title: string
  createdAt: string
  updatedAt: string
}
```

### Message

```typescript
type MessageRole = 'user' | 'assistant'

interface Message {
  id: string
  role: MessageRole
  content: string
  reasoning: string | null   // chain-of-thought from LLM
  createdAt: string
}
```

Messages are stored keyed by conversation ID:

```typescript
messagesByConversation: Record<string, Message[]>
```

### Settings (persisted to localStorage)

```typescript
interface SettingsState {
  baseUrl: string            // LM Studio server URL (default: http://localhost:1234)
  modelName: string          // Model identifier (default: qwen/qwen3-4b-2507)
  enableReasoning: boolean   // Toggle reasoning extraction (default: true)
  systemPrompt: string       // System prompt (default: "You are a helpful assistant.")
}
```

## API endpoints (backend at localhost:3001)

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/api/conversations` | List all conversations |
| `POST` | `/api/conversations` | Create `{ title }` |
| `PATCH` | `/api/conversations/:id` | Rename `{ title }` |
| `GET` | `/:conversationId/messages` | List messages |
| `POST` | `/api/chat` | SSE stream — see body schema below |

### POST /api/chat body schema

| Field | Type | Default | Description |
|---|---|---|---|
| `prompt` | `string` | — | User message (required) |
| `conversationId` | `string` (uuid) | — | Existing conversation; omitted → auto-create |
| `enableReasoning` | `boolean` | `true` | Enable reasoning extraction via `[REASONING]` markers |
| `baseUrl` | `string` | — | LM Studio server HTTP URL (overrides default) |
| `modelName` | `string` | — | Model identifier (overrides default/env) |
| `systemPrompt` | `string` | — | System prompt prepended to conversation |

### SSE event format (POST /api/chat)

```
event: reasoning
data: {"content":"thinking..."}

event: content
data: {"content":"answer fragment"}

event: done
data: {"conversationId":"...","messageId":"..."}
```

When `enableReasoning` is `true`, the backend injects a reasoning instruction into the system prompt. If the model follows it, its reasoning output (wrapped in `[REASONING]…[/REASONING]`) is emitted as `reasoning` events; the final answer as `content` events. The markers themselves are stripped.

## Settings page

Located at `/settings` (linked from Sidebar). Two-column layout:

- **Model** — Base URL, model name, reasoning toggle
- **System** — System prompt textarea

All values are stored in a zustand store with `persist` middleware (localStorage key `simpleagent-settings`). Changes take effect on the next chat request — no restart needed.

When reasoning is enabled on the backend:
- A "think step by step" instruction is appended to the system prompt
- The model is told to wrap reasoning in `[REASONING]` / `[/REASONING]` markers
- The LM Studio SDK's `reasoningParsing` extracts these and emits separate `reasoning` events
- Marker fragments (`reasoningStartTag` / `reasoningEndTag`) are discarded

## Key conventions

- **CSS Modules**: files `*.module.css`, imported as `import styles from './X.module.css'`
- **Zustand**: selectors used in components to minimise re-renders
- **Data fetching**: in `useEffect` at the page or widget level, populating entity stores
- **Streaming**: `appendChunk` appends to the last assistant message (content + reasoning)
- **Auto-title**: first user message sets conversation title as a slug of the prompt
- **Inline rename**: double-click conversation in sidebar to edit
