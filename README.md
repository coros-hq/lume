# Lume

**An embeddable AI assistant bubble for any web app.**  
Self-hostable with Ollama. Open-source, no tracking, no data leaves your infrastructure.

```tsx
<LumeProvider
  model="qwen2.5"
  systemPrompt="You are a support assistant for Acme."
  knowledgeBase={docs}
  actions={actions}
  components={components}
>
  <App />
</LumeProvider>
```

Drop `<AssistantWidget />` anywhere inside. A floating bubble appears in the corner of your app. Click it — a chat panel slides up. The assistant already knows what page the user is on, can answer questions from your documentation, trigger real actions in your app, and render structured UI components inline in the conversation.

---

## Features

- **Floating bubble UI** — fixed-position overlay, zero impact on your app's layout
- **Self-hostable** — runs entirely on your machine via [Ollama](https://ollama.com), no cloud required
- **`LumeProvider`** — set up once at the root, control context from anywhere with `useLume()`
- **Two-step intent classification** — fast classifier routes each message before generating, dramatically more reliable than single-shot prompting
- **Context injection** — pass `{ page, plan, userId }` and the assistant always knows where the user is
- **Knowledge base (RAG)** — provide your docs as plain text, relevant chunks retrieved per query
- **Actions** — the assistant triggers real functions in your app, with a confirmation step before execution
- **Structured UI components** — the assistant renders your own React components inline instead of plain text
- **Connection status** — widget shows live Ollama connection status in the header
- **Debug mode** — shows intent classification badge on each message for fast debugging
- **Streaming responses** — token-by-token output with a stop button
- **Fully typed** — complete TypeScript support with prop autocomplete
- **Style isolated** — inline styles only, no CSS leakage into or from the host app
- **Zero dependencies** — only React and Ollama required

---

## Table of Contents

- [How it works](#how-it-works)
- [Requirements](#requirements)
- [Installation](#installation)
- [Quick start](#quick-start)
- [LumeProvider](#lumeprovider)
  - [Setup](#setup)
  - [useLume](#uselume)
- [Configuration](#configuration)
  - [Props](#props)
  - [Context](#context)
  - [Knowledge base](#knowledge-base)
  - [Actions](#actions)
  - [Structured UI components](#structured-ui-components)
  - [Ref methods](#ref-methods)
- [Debug mode](#debug-mode)
- [Self-hosting](#self-hosting)
  - [Ollama setup](#ollama-setup)
  - [Model recommendations](#model-recommendations)
- [How the AI adapts to your app](#how-the-ai-adapts-to-your-app)
- [useAssistant hook](#useassistant-hook)
- [Contributing](#contributing)
- [License](#license)

---

## How it works

Lume doesn't train or fine-tune any model. Every message goes through two steps:

**Step 1 — Intent classification (fast, ~200–400ms)**

A lightweight Ollama call classifies the message into one of three categories before generating any response:

```
"take me to billing"          →  action:redirectTo
"what is my billing status"   →  component:billing_summary
"how do I reset my password"  →  text
```

This makes Lume dramatically more reliable than single-shot prompting. The classifier handles paraphrasing naturally — "am I close to my limit", "how much quota is left", and "show my usage" all correctly route to the same component.

**Step 2 — Focused generation**

Based on the classified intent, Lume builds a small, purpose-built prompt with one job:

```
text intent      →  persona + context + RAG — no JSON pressure
action intent    →  only the matched action schema — extract parameters
component intent →  only the matched component schema — fill props from context
```

Each prompt is small and focused. The model never tries to be a classifier, JSON generator, and conversation partner at the same time.

**The full prompt has six layers:**

```
Layer 1 — Persona          your systemPrompt
Layer 2 — Page context     your context object
Layer 3 — RAG chunks       most relevant docs from knowledgeBase
Layer 4 — Rules            conciseness and formatting instructions
Layer 5 — Action schema    only injected when intent is an action
Layer 6 — Component schema only injected when intent is a component
```

---

## Requirements

- Node.js 18+
- React 17+ (peer dependency)
- [Ollama](https://ollama.com) running locally

---

## Installation

```bash
npm install @ovt2/lume
```

---

## Quick start

**Minimal — chat only:**

```tsx
import { AssistantWidget } from '@ovt2/lume'

function App() {
  return (
    <>
      {/* your app */}
      <AssistantWidget
        systemPrompt="You are a helpful assistant for this app."
      />
    </>
  )
}
```

**Recommended — with `LumeProvider`:**

```tsx
import { LumeProvider, useLume, AssistantWidget, defineAction, defineComponent } from '@ovt2/lume'

export default function App() {
  const [page, setPage] = useState('dashboard')

  const actions = [
    defineAction(
      'redirectTo',
      {
        description: 'Navigate to a page in the app',
        parameters: {
          page: { type: 'string', required: true, description: 'Page name' },
        },
      },
      async ({ page }) => setPage(page as string)
    ),
  ]

  const components = [
    defineComponent(
      'billing_summary',
      {
        description: 'Show billing info when the user asks about their plan or payments',
        props: {
          plan:   { type: 'string', required: true,  description: 'Plan name' },
          status: { type: 'string', required: true,  description: 'active or past_due' },
          amount: { type: 'string', required: false, description: 'Amount due' },
        },
      },
      (props) => <BillingCard plan={String(props.plan)} status={String(props.status)} />
    ),
  ]

  return (
    <LumeProvider
      model="qwen2.5"
      systemPrompt="You are a support assistant for Acme."
      knowledgeBase={docs}
      actions={actions}
      components={components}
      accentColor="#6366f1"
      title="Acme Support"
    >
      <InnerApp page={page} />
    </LumeProvider>
  )
}

function InnerApp({ page }: { page: string }) {
  const { setContext } = useLume()

  useEffect(() => {
    setContext({ currentPage: page, userPlan: 'Pro' })
  }, [page])

  return (
    <>
      {/* your app */}
      <AssistantWidget />
    </>
  )
}
```

---

## LumeProvider

`LumeProvider` is the recommended way to integrate Lume. Set up your config once at the root — then control context and the widget from anywhere in your component tree using `useLume()`.

### Setup

```tsx
import { LumeProvider } from '@ovt2/lume'

<LumeProvider
  model="qwen2.5"
  systemPrompt="You are a support assistant."
  knowledgeBase={docs}
  actions={actions}
  components={components}
  accentColor="#6366f1"
  title="Support"
>
  <App />
</LumeProvider>
```

`LumeProvider` accepts all the same props as `AssistantWidget`. Props passed directly to `AssistantWidget` always win over provider values.

### useLume

Access controls and context updates from anywhere inside the provider:

```tsx
import { useLume } from '@ovt2/lume'

function MyPage() {
  const { setContext, mergeContext, pushContext, open } = useLume()

  // replace entire context on navigation
  useEffect(() => {
    setContext({ currentPage: 'billing', userPlan: user.plan, teamSize: team.length })
  }, [page, user.plan, team.length])

  // update a single key without touching others
  const handleUpgrade = (newPlan: string) => {
    mergeContext({ userPlan: newPlan })
    pushContext(`User upgraded to ${newPlan}`)
  }

  // push live events — invisible to user, informs the assistant
  const handleError = (err: Error) => {
    pushContext(`Payment failed: ${err.message}`)
  }

  return <button onClick={() => open()}>Open assistant</button>
}
```

| Method | Description |
|--------|-------------|
| `setContext(ctx)` | Replace the entire context object |
| `mergeContext(partial)` | Update specific keys without replacing the whole context |
| `pushContext(note)` | Inject a hidden note into the conversation — never shown to the user |
| `open()` | Open the chat panel |
| `close()` | Close the chat panel |
| `toggle()` | Toggle open/closed |
| `clearHistory()` | Clear all messages |

---

## Configuration

### Props

All props are optional when using `LumeProvider`.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `model` | `string` | `'qwen2.5'` | Ollama model to use |
| `systemPrompt` | `string` | `'You are a helpful assistant.'` | Persona and instructions |
| `context` | `object` | — | Current page/state — injected into every prompt |
| `knowledgeBase` | `KnowledgeChunk[]` | `[]` | Docs for RAG retrieval |
| `actions` | `Action[]` | `[]` | App functions the assistant can trigger |
| `components` | `ComponentDefinition[]` | `[]` | React components the assistant can render |
| `accentColor` | `string` | `'#6366f1'` | Bubble and send button color |
| `position` | `'bottom-right' \| 'bottom-left' \| 'top-right' \| 'top-left'` | `'bottom-right'` | Corner to anchor to |
| `title` | `string` | `'Assistant'` | Label shown in the panel header |
| `debug` | `boolean` | `false` | Show intent classification badge on each message |

---

### Context

Pass any key/value object. It gets serialized into every prompt:

```tsx
<AssistantWidget
  context={{
    currentPage: 'Invoice #1042',
    userPlan: 'Pro',
    userRole: 'admin',
    lastError: 'export_failed',
  }}
/>
```

The assistant receives this as:

```
Current app context:
- current page: Invoice #1042
- user plan: Pro
- user role: admin
- last error: export_failed
```

With `LumeProvider`, use `setContext` or `mergeContext` from `useLume()` instead — no prop drilling needed.

---

### Knowledge base

Provide your app's documentation as an array of `{ title, content }` chunks. On every message, the top 3 most relevant chunks are injected using keyword-frequency scoring — no embeddings, no vector database.

```tsx
const docs = [
  {
    title: 'Exporting data',
    content: `
      You can export all your data as CSV from Settings → Export.
      Exports are processed in the background and emailed when ready.
      Large exports may take up to 10 minutes.
    `,
  },
]

<AssistantWidget knowledgeBase={docs} />
```

**Chunking tips:**
- One topic per chunk — don't put your entire docs in one string
- Ideal chunk size: 150–400 words
- The title is also scored — make it descriptive

---

### Actions

Actions let the assistant trigger real functions in your app. When the user's message matches an action, a confirmation card appears. The user confirms or cancels — then the handler fires.

Use `defineAction` to register an action:

```tsx
import { defineAction } from '@ovt2/lume'

const actions = [
  defineAction(
    'redirectTo',
    {
      description: 'Navigate to a page in the app',
      parameters: {
        page: {
          type: 'string',
          required: true,
          description: 'dashboard, billing, or settings',
        },
      },
    },
    async ({ page }) => router.push(page as string)
  ),

  defineAction(
    'inviteTeamMember',
    {
      description: 'Invite a new team member by email',
      parameters: {
        email: { type: 'string', required: true, description: 'Email address' },
        role:  { type: 'string', required: true, description: 'admin or viewer' },
      },
    },
    async ({ email, role }) => {
      await api.inviteUser({ email: email as string, role: role as string })
    }
  ),
]
```

**Optional — add `examples` to improve intent matching:**

```tsx
defineAction(
  'redirectTo',
  {
    description: 'Navigate to a page in the app',
    examples: [
      'take me to billing',
      'go to settings',
      'open the dashboard',
    ],
    parameters: { ... },
  },
  async ({ page }) => router.push(page as string)
)
```

Examples are injected into the intent classifier and help match non-obvious phrasings. They are optional — a clear `description` handles most cases on its own.

**How it works:**

1. User types `"invite alex@company.com as admin"`
2. Classifier routes to `action:inviteTeamMember` (~200ms)
3. Lume extracts parameters from the message
4. Confirmation card appears
5. User confirms → handler fires. User cancels → dismissed

**Rules:**
- Actions only trigger when the user explicitly asks — never on greetings or questions
- The confirmation step always happens — the model can never fire a handler silently

---

### Structured UI components

Instead of plain text, the assistant can render your own React components inline in the chat. Define the type, props schema, and a `render` function — Lume handles the routing and rendering.

Use `defineComponent` to register a component:

```tsx
import { defineComponent } from '@ovt2/lume'

const components = [
  defineComponent(
    'billing_summary',
    {
      description: 'Show billing info when the user asks about their plan, payments, or subscription',
      props: {
        plan:        { type: 'string', required: true,  description: 'Plan name e.g. Pro' },
        status:      { type: 'string', required: true,  description: 'active, cancelled, or past_due' },
        nextBilling: { type: 'string', required: false, description: 'Next billing date' },
        amount:      { type: 'string', required: false, description: 'Amount due e.g. $49.00' },
      },
    },
    (props) => (
      <BillingSummaryCard
        plan={String(props.plan)}
        status={String(props.status)}
        nextBilling={props.nextBilling ? String(props.nextBilling) : undefined}
      />
    )
  ),
]
```

**Optional — add `examples` to improve intent matching:**

```tsx
defineComponent(
  'billing_summary',
  {
    description: 'Show billing info when the user asks about their plan or payments',
    examples: [
      'what is my billing status',
      'how much do I owe',
      'when does my card get charged',
      'am I being charged correctly',
    ],
    props: { ... },
  },
  (props) => <BillingSummaryCard {...props} />
)
```

**How it works:**

1. User types `"what is my billing status?"`
2. Classifier routes to `component:billing_summary` (~200ms)
3. Lume fills props from app context
4. `render(props)` is called and the result appears as an assistant bubble
5. Component persists in conversation history — conversation continues normally

**Key principle:** Lume ships with zero built-in components. Every component is defined and rendered by your app. Lume routes the intent, fills the props, and calls `render()`. The visual output is 100% yours.

**When to use components vs plain text:**
- Components — user is asking to *see* data (profile, billing, order status, team list)
- Plain text — how-to questions, explanations, general help
- The model decides based on the `description` you provide — write it clearly

---

### Ref methods

When not using `LumeProvider`, attach a ref for programmatic control:

```tsx
import { useRef } from 'react'
import { AssistantWidget } from '@ovt2/lume'
import type { AssistantHandle } from '@ovt2/lume'

const ref = useRef<AssistantHandle>(null)

<AssistantWidget ref={ref} ... />
```

| Method | Description |
|--------|-------------|
| `ref.current.open()` | Open the chat panel |
| `ref.current.close()` | Close the chat panel |
| `ref.current.toggle()` | Toggle open/closed |
| `ref.current.pushContext(note)` | Inject a hidden context note into the conversation |
| `ref.current.clearHistory()` | Clear all messages and stop any active stream |

With `LumeProvider`, use `useLume()` instead — no ref needed.

---

## Debug mode

Enable debug mode to see intent classification on every message:

```tsx
<AssistantWidget debug />
// or at the provider level
<LumeProvider debug ...>
```

Each user message shows a small badge:

- Purple `action:redirectTo` — matched an action
- Teal `component:usage_bar` — matched a component
- Gray `text` — plain conversation

If something isn't triggering correctly, the badge tells you immediately whether the problem is in the classifier (wrong intent shown) or the generator (correct intent, wrong output). Remove `debug` before shipping to production.

---

## Self-hosting

Lume runs entirely on your own infrastructure. No data leaves your machine.

### Ollama setup

**1. Install Ollama:**

```bash
# macOS / Linux
curl -fsSL https://ollama.com/install.sh | sh

# Windows: download from https://ollama.com/download
```

**2. Pull a model:**

```bash
ollama pull qwen2.5
```

**3. Start Ollama:**

```bash
ollama serve
# Listening on http://localhost:11434
```

**4. Configure Lume:**

```tsx
<AssistantWidget model="qwen2.5" systemPrompt="You are a helpful assistant." />
```

Lume connects to `http://localhost:11434` by default. The widget header shows a live connection status dot — green when connected, yellow while checking, red when Ollama is unreachable with a tooltip showing `run: ollama serve`.

### CORS

If your app is served from a different origin than `localhost`:

```bash
OLLAMA_ORIGINS="*" ollama serve

# or for a specific domain:
OLLAMA_ORIGINS="https://myapp.com" ollama serve
```

### Model recommendations

| Model | Size | RAM | Best for |
|-------|------|-----|----------|
| `qwen2.5` | 7B | 6 GB | **Recommended** — best tool-calling reliability for actions and components |
| `llama3.1` | 8B | 8 GB | Strong reasoning, good alternative to qwen2.5 |
| `mistral` | 7B | 8 GB | Solid general-purpose option |
| `gemma3` | 4B | 4 GB | Lighter and faster — good for chat-only without actions or components |

> **Note:** If you are using actions or structured UI components, `qwen2.5` is strongly recommended. It has explicit tool-calling fine-tuning and produces reliable JSON output. Other models may work but are more prone to formatting errors.

**Apple Silicon (M1/M2/M3):** Ollama uses the GPU via Metal automatically. A MacBook Air M2 with 16GB runs `qwen2.5` (7B) comfortably at ~40–60 tokens/sec.

---

## How the AI adapts to your app

The AI has no prior knowledge of your app. It adapts entirely through what you pass — no training, no fine-tuning:

```
systemPrompt   →  who the assistant is and how it should behave
context        →  what is happening right now in your app
knowledgeBase  →  how your app works (documentation)
actions        →  what the assistant can do
components     →  how the assistant can respond visually
pushContext    →  live events as they happen (errors, state changes)
```

A user asking "why was I charged?" on the billing page gets a response informed by:
- Your system prompt (it knows it's a support assistant)
- Your context (it knows the user is on the billing page and their current plan)
- Your knowledge base (it retrieved your billing documentation)

Without those, it gives a generic answer. With all of them, it answers as if it knows your product.

---

## `useAssistant` hook

For building completely custom UIs — full control over rendering while keeping all core logic:

```tsx
import { useAssistant } from '@ovt2/lume'

function MyCustomChat() {
  const {
    messages,
    isStreaming,
    error,
    confirmation,
    send,
    stop,
    clearHistory,
    pushContext,
    confirmAction,
    cancelAction,
  } = useAssistant({
    model: 'qwen2.5',
    systemPrompt: 'You are a helpful assistant.',
    context: { page: 'Dashboard' },
    knowledgeBase: docs,
    actions: myActions,
    components: myComponents,
  })

  return (
    // your own UI here
  )
}
```

### Returns

| Field | Type | Description |
|-------|------|-------------|
| `messages` | `Message[]` | Full conversation history including component messages |
| `isStreaming` | `boolean` | True while a response is streaming |
| `error` | `string \| null` | Last error message, if any |
| `confirmation` | `ConfirmationState` | Current action confirmation state |
| `send(text)` | `function` | Send a user message |
| `stop()` | `function` | Abort the current stream |
| `clearHistory()` | `function` | Reset the conversation |
| `pushContext(note)` | `function` | Inject a hidden system note |
| `confirmAction()` | `function` | Execute the pending action |
| `cancelAction()` | `function` | Dismiss the pending action |

### Message shape

```ts
interface Message {
  role: 'user' | 'assistant' | 'system'
  content: string
  intent?: string       // debug only — e.g. "action:redirectTo", "component:usage_bar", "text"
  componentCall?: {
    component: string   // matches a type in your components array
    props: Record<string, unknown>
  }
}
```

### ConfirmationState shape

```ts
type ConfirmationState =
  | { status: 'idle' }
  | { status: 'pending';   call: ActionCall; action: Action }
  | { status: 'executing'; call: ActionCall; action: Action }
```

---

## Contributing

Contributions are welcome. To run the project locally:

```bash
git clone https://github.com/ovt2/lume
cd lume
npm install
npm run dev
```

To build the package:

```bash
npm run build
```

Please open an issue before submitting a large pull request.

---

## License

MIT — free to use, modify, and distribute.