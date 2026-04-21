# Lume

**An embeddable AI assistant bubble for any web app.**  
Self-hostable with Ollama or cloud-ready via a relay server. Open-source, no tracking, no data leaves your infrastructure.

```tsx
<AssistantWidget
  systemPrompt="You are a support assistant for Acme App."
  context={{ currentPage: 'Dashboard', userPlan: 'Pro' }}
  knowledgeBase={docs}
/>
```

A floating bubble appears in the corner of your app. Click it — a chat panel slides up. The assistant already knows what page the user is on and can answer questions about your documentation.

---

## Features

- **Floating bubble UI** — fixed-position overlay, zero impact on your app's layout
- **Self-hostable** — runs entirely on your machine via [Ollama](https://ollama.com), no cloud required
- **Context injection** — pass `{ page, plan, userId }` and the assistant knows where the user is
- **Knowledge base (RAG)** — provide your docs as plain text, the assistant retrieves relevant chunks per query
- **Streaming responses** — token-by-token output with a stop button
- **Ref API** — control the widget programmatically: `open()`, `close()`, `pushContext()`, `clearHistory()`
- **Fully typed** — complete TypeScript support with prop autocomplete
- **Style isolated** — inline styles only, no CSS leakage into or from the host app
- **Zero dependencies** — only React and Ollama required

---

## Table of Contents

- [How it works](#how-it-works)
- [Requirements](#requirements)
- [Installation](#installation)
- [Quick start](#quick-start)
  - [React](#react)
  - [Vanilla JS](#vanilla-js)
- [Configuration](#configuration)
  - [Props](#props)
  - [Context](#context)
  - [Knowledge base](#knowledge-base)
  - [Ref methods](#ref-methods)
- [Self-hosting](#self-hosting)
  - [Ollama setup](#ollama-setup)
  - [Model recommendations](#model-recommendations)
- [How the AI adapts to your app](#how-the-ai-adapts-to-your-app)
- [useAssistant hook](#useassistant-hook)
- [Contributing](#contributing)
- [License](#license)

---

## How it works

Lume doesn't train or fine-tune any model. Instead, before every message it assembles a prompt from four layers:

```
Layer 1 — Persona        your systemPrompt prop
Layer 2 — Page context   your context prop (current page, user state, etc.)
Layer 3 — RAG chunks     the most relevant docs from your knowledgeBase
Layer 4 — Rules          conciseness and formatting instructions
```

This is sent to Ollama (running locally) or a cloud relay on every request. The model reads fresh context every time — so it always knows where the user is, even as they navigate.

---

## Requirements

- Node.js 18+
- React 17+ (peer dependency)
- [Ollama](https://ollama.com) running locally (for self-hosted mode)

---

## Installation

```bash
npm install @ovt2/lume
```

---

## Quick start

### React

Minimal setup — Ollama running locally, no configuration needed:

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

Full setup with context and knowledge base:

```tsx
import { AssistantWidget } from '@ovt2/lume'

const docs = [
  {
    title: 'How billing works',
    content: 'Your subscription renews monthly on the date you signed up...',
  },
  {
    title: 'Resetting your password',
    content: 'Click Forgot Password on the login screen...',
  },
]

function App() {
  const [currentPage, setCurrentPage] = useState('Dashboard')

  return (
    <>
      {/* your app */}
      <AssistantWidget
        model="gemma3"
        systemPrompt="You are a support assistant for Acme App."
        context={{
          currentPage,
          userPlan: user.plan,
          isTrialing: user.isTrialing,
        }}
        knowledgeBase={docs}
        accentColor="#6366f1"
        position="bottom-right"
        title="Support"
      />
    </>
  )
}
```

### Vanilla JS

If you are not using React, control the widget through the ref API after mounting:

```html
<!-- in your HTML -->
<div id="lume-root"></div>

<script type="module">
  import { createRoot } from 'react-dom/client'
  import { createElement, createRef } from 'react'
  import { AssistantWidget } from '@ovt2/lume'

  const ref = createRef()
  const root = createRoot(document.getElementById('lume-root'))

  root.render(
    createElement(AssistantWidget, {
      ref,
      systemPrompt: 'You are a helpful assistant.',
      model: 'gemma3',
    })
  )

  // control the widget from anywhere in your app
  window.assistant = {
    open:        () => ref.current?.open(),
    close:       () => ref.current?.close(),
    pushContext: (note) => ref.current?.pushContext(note),
  }
</script>
```

Then from anywhere in your app:

```js
// open it from a help button
document.getElementById('help-btn').addEventListener('click', () => {
  window.assistant.open()
})

// push live context when something happens
window.assistant.pushContext('User hit export limit')
window.assistant.pushContext(`Payment failed: ${error.code}`)
```

---

## Configuration

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `model` | `string` | `'gemma3'` | Ollama model to use |
| `systemPrompt` | `string` | `'You are a helpful assistant.'` | Persona and instructions for this app |
| `context` | `object` | — | Current page/state — injected into every prompt |
| `knowledgeBase` | `KnowledgeChunk[]` | `[]` | Docs for RAG retrieval |
| `accentColor` | `string` | `'#6366f1'` | Bubble and send button color |
| `position` | `'bottom-right' \| 'bottom-left' \| 'top-right' \| 'top-left'` | `'bottom-right'` | Corner to anchor to |
| `title` | `string` | `'Assistant'` | Label shown in the panel header |

### Context

Pass any key/value object. It gets serialized into the system prompt before every request:

```tsx
<AssistantWidget
  context={{
    currentPage: 'Invoice #1042',
    userPlan: 'Pro',
    userRole: 'admin',
    lastError: 'export_failed',   // ← very useful for support flows
  }}
/>
```

The assistant receives this as readable text:

```
Current app context:
- current page: Invoice #1042
- user plan: Pro
- user role: admin
- last error: export_failed
```

Context updates reactively as the user navigates — the assistant always sees the latest values because the prompt is rebuilt on every message.

### Knowledge base

Provide your app's documentation as an array of `{ title, content }` chunks. On every user message, the top 3 most relevant chunks are automatically injected into the prompt using keyword-frequency scoring — no embeddings, no vector database.

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

You can load chunks from markdown files, a CMS, or a static array:

```ts
// from markdown files (Vite)
import billingDocs from './docs/billing.md?raw'

const knowledgeBase = [
  { title: 'Billing', content: billingDocs },
]
```

### Ref methods

Access programmatic control by attaching a ref:

```tsx
import { useRef } from 'react'
import { AssistantWidget, AssistantHandle } from '@ovt2/lume'

const ref = useRef<AssistantHandle>(null)

<AssistantWidget ref={ref} ... />
```

| Method | Description |
|--------|-------------|
| `ref.current.open()` | Open the chat panel |
| `ref.current.close()` | Close the chat panel |
| `ref.current.toggle()` | Toggle open/closed |
| `ref.current.pushContext(note: string)` | Inject a hidden context note into the conversation |
| `ref.current.clearHistory()` | Clear all messages and stop any active stream |

`pushContext` is the most powerful method — use it to silently inform the assistant about things that happen in your app:

```ts
// in an error handler
try {
  await processPayment()
} catch (err) {
  ref.current?.pushContext(`Payment failed: ${err.code}`)
}

// on navigation
router.afterEach((to) => {
  ref.current?.pushContext(`User navigated to: ${to.name}`)
})
```

The note is never shown to the user — it lives as a hidden system message in the conversation history.

---

## Self-hosting

Lume is designed to run entirely on your own infrastructure. No data leaves your machine.

### Ollama setup

**1. Install Ollama:**

```bash
# macOS / Linux
curl -fsSL https://ollama.com/install.sh | sh

# Windows: download from https://ollama.com/download
```

**2. Pull a model:**

```bash
ollama pull gemma3
```

**3. Start Ollama:**

```bash
ollama serve
# Listening on http://localhost:11434
```

**4. Configure Lume:**

```tsx
<AssistantWidget
  model="gemma3"
  systemPrompt="You are a helpful assistant."
/>
```

Lume connects to `http://localhost:11434` by default.

### CORS

If your app is served from a different origin than `localhost`, you need to allow it:

```bash
OLLAMA_ORIGINS="*" ollama serve

# or for a specific domain:
OLLAMA_ORIGINS="https://myapp.com" ollama serve
```

### Model recommendations

| Model | RAM | Notes |
|-------|-----|-------|
| `gemma3` (2B) | 4 GB | Fast, good quality — recommended default |
| `llama3.2` (3B) | 6 GB | Balanced |
| `mistral` (7B) | 8 GB | Better reasoning |
| `llama3.1` (8B) | 10 GB | Best quality in this range |

All models run on CPU. A GPU significantly speeds up inference but is not required.

---

## How the AI adapts to your app

The AI has no prior knowledge of your app. It adapts entirely through what you pass as props — no training, no fine-tuning. Here is what each layer contributes:

```
systemPrompt   →  who the assistant is and how it should behave
context        →  what is happening right now in your app
knowledgeBase  →  how your app works (documentation)
pushContext    →  live events as they happen (errors, state changes)
```

A user asking "why was I charged?" on the billing page gets a response informed by:
- Your system prompt (it knows it's a support assistant)
- Your context (it knows the user is on the billing page and their current plan)
- Your knowledge base (it retrieved your billing documentation)

Without any of those, it would give a generic answer. With all three, it answers as if it knows your product.

---

## `useAssistant` hook

For building completely custom UIs — gives you full control over rendering while keeping the core logic:

```tsx
import { useAssistant } from '@ovt2/lume'

function MyCustomChat() {
  const {
    messages,
    isStreaming,
    error,
    send,
    stop,
    clearHistory,
    pushContext,
  } = useAssistant({
    model: 'gemma3',
    systemPrompt: 'You are a helpful assistant.',
    context: { page: 'Dashboard' },
    knowledgeBase: docs,
  })

  return (
    // your own UI here
  )
}
```

### Returns

| Field | Type | Description |
|-------|------|-------------|
| `messages` | `Message[]` | Full conversation history |
| `isStreaming` | `boolean` | True while a response is streaming |
| `error` | `string \| null` | Last error message, if any |
| `send(text)` | `function` | Send a user message |
| `stop()` | `function` | Abort the current stream |
| `clearHistory()` | `function` | Reset the conversation |
| `pushContext(note)` | `function` | Inject a hidden system note |

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