# Bongolipi (বঙ্গলিপি)

Bongolipi is a full-stack web platform for working with **Banglish** (Bengali
written in the Latin alphabet) and **Bangla** (Bengali script). At its core is a
fine-tuned neural translation model that converts Banglish to Bangla; around it
sit a document workspace, a PDF-grounded chatbot, real-time collaborative editing,
voice transcription, PDF export, a community content feed, analytics dashboards,
and a human-in-the-loop pipeline that continuously improves the translation model
from user-submitted corrections.

This README is written to be read end-to-end: it explains what the product does,
how each feature is built, and how the pieces are wired together across four
independently deployable services.

---

## ▶ Watch the demo (5-minute walkthrough)

**[▶ Full feature walkthrough — Loom video](https://www.loom.com/share/94e112b650224756b6ca433631b4af24)**

A guided tour of every feature: the fine-tuned Banglish→Bangla translation model,
the human-in-the-loop annotation loop that retrains it, the RAG document chatbot,
real-time collaborative editing, and the analytics dashboards — with the
architecture and engineering decisions behind each.

> New here? Start with the video above, then read on for how it's all built.

---

## Table of contents

1. [System architecture](#system-architecture)
2. [Technology stack](#technology-stack)
3. [Repository layout](#repository-layout)
4. [The four services](#the-four-services)
5. [Features and how they are built](#features-and-how-they-are-built)
6. [The translation model and continuous-learning loop](#the-translation-model-and-continuous-learning-loop)
7. [Data model](#data-model)
8. [Authentication and authorization](#authentication-and-authorization)
9. [API reference](#api-reference)
10. [Environment variables](#environment-variables)
11. [Running locally](#running-locally)
12. [Deployment](#deployment)
13. [Design decisions worth knowing](#design-decisions-worth-knowing)

---

## System architecture

Bongolipi is split into **four services** that can run and scale independently.
The browser talks to three of them directly (over HTTPS/WSS); the Next.js server
also brokers privileged operations against MongoDB and third-party APIs.

```text
                        +-----------------------------+
                        |          Browser            |
                        |   (React 19 / Next.js UI)   |
                        +--+---------+---------+-------+
                           |         |         |
        REST (/api/*)      |         |         |  WebSocket (Yjs)
        + server actions   |         |         |
                           v         v         v
     +---------------------+--+   +--+---------+--+   +-------------------+
     |  Next.js app (client) |   |  RAG server    |   |  Collab server    |
     |  App Router + API     |   |  FastAPI       |   |  Node/Hocuspocus  |
     |  Clerk auth, Mongoose |   |  LangChain+Groq|   |  Yjs + JWT auth   |
     +----+-------------+----+   +--------+-------+   +---------+---------+
          |             |                 |                     |
          | Mongoose    | HTTP            | Groq API            | Mongoose driver
          v             v                 v                     v
   +--------------+  +------------------+                +----------------+
   | MongoDB Atlas|  | mBART model svc  |                | MongoDB Atlas  |
   | (app data)   |  | FastAPI+Transformers            | (Yjs doc state)|
   +--------------+  | serves HF model  |                +----------------+
                     +------------------+

   External: Clerk (identity), Groq (LLM + translation fallback),
             OpenAI Whisper (speech-to-text), Resend (email),
             Hugging Face Hub (model registry).
```

- **client** — the Next.js 15 application: all UI, plus a set of `/api` route
  handlers that own authentication, MongoDB access, LLM prompts, and collab-token
  minting.
- **model** — a FastAPI microservice that loads the fine-tuned mBART model and
  exposes a single `/banglish` translation endpoint.
- **server** — a FastAPI RAG microservice that answers questions grounded in an
  uploaded PDF using LangChain, Groq, and a Chroma vector store.
- **collab** — a Node.js Hocuspocus (Yjs) WebSocket server for real-time
  multi-user editing, with JWT-gated access and MongoDB persistence.

Keeping the Python ML workloads (translation, RAG) and the stateful WebSocket
server out of the Next.js process means each can be sized, restarted, and scaled
on its own, and the heavy model containers never block the web tier.

---

## Technology stack

| Layer | Technology |
|---|---|
| Frontend framework | Next.js 15 (App Router, Turbopack), React 19, TypeScript |
| Styling | Tailwind CSS, `next-themes` (dark mode), Framer Motion, lucide-react |
| Rich text / collaboration | TipTap (ProseMirror), Yjs, `@hocuspocus/provider` |
| Authentication | Clerk (`@clerk/nextjs`) with middleware route protection |
| App database | MongoDB (Atlas) via Mongoose |
| LLM / inference | Groq (`llama-3.3-70b-versatile`) for chat, translation fallback, title/caption |
| Translation model | Fine-tuned `facebook/mbart-large-50`, served with Transformers + PyTorch |
| RAG | LangChain, Chroma vector store, HuggingFace `all-MiniLM-L6-v2` embeddings |
| Speech-to-text | OpenAI Whisper (`whisper-1`) |
| Collaboration server | Node.js, `@hocuspocus/server`, `jsonwebtoken`, MongoDB driver |
| Email | Resend |
| PDF export | jsPDF + html2canvas (client-side) |
| Charts | Chart.js via `react-chartjs-2` |
| Containerization | Docker, Docker Compose |

---

## Repository layout

```text
.
├── client/                 # Next.js 15 app (UI + API routes)
│   ├── app/                # App Router pages and /api route handlers
│   ├── components/         # UI, editors, dashboard, common widgets
│   ├── db/                 # Mongoose connection + models
│   ├── lib/                # auth, translate, collab, email, utils, const
│   └── middleware.ts       # Clerk route protection
├── model/                  # FastAPI service serving the fine-tuned mBART model
│   ├── main.py             # /banglish translation endpoint
│   └── Dockerfile          # CPU-only Torch image
├── server/                 # FastAPI RAG service
│   ├── main.py             # /rag-query and /rag-multi-query endpoints
│   ├── train_banglish_mbart.ipynb   # model fine-tuning pipeline
│   └── banglish_to_bangla_server.ipynb
├── collab/                 # Hocuspocus (Yjs) realtime server
│   └── index.js
└── docker-compose.yaml     # Full local stack (app + RAG + collab + MongoDB)
```

---

## The four services

### 1. client — Next.js application

The web tier. It renders every page and also hosts backend logic in App Router
**route handlers** under `client/app/api/*`. These handlers are where the app
authenticates the caller (Clerk), reads/writes MongoDB (Mongoose), calls Groq for
LLM tasks, and mints short-lived JWTs for the collab server. Route protection is
enforced centrally in [client/middleware.ts](client/middleware.ts): a matcher
guards `/contents`, `/contribute`, `/chatbot`, `/dashboard`, `/collab`, `/admin`,
and related paths, redirecting unauthenticated users to sign-in.

MongoDB access goes through a small cached connection helper
([client/db/mongod.ts](client/db/mongod.ts)) so serverless invocations reuse a
single Mongoose connection instead of reconnecting per request.

### 2. model — mBART translation microservice

[model/main.py](model/main.py) is a minimal FastAPI app that, on startup, loads
the fine-tuned `kashshaf-labib/banglish-bangla-mbart` model and its
`MBart50TokenizerFast` from the Hugging Face Hub. It fixes the source language to
`en_XX` (Latin script) and forces the target BOS token to `bn_IN` (Bangla), then
exposes:

- `GET /` — health check.
- `POST /banglish` — `{ "text": "..." }` in, `{ "generated_text": "..." }` out,
  using beam search (`num_beams=5`, `max_length=128`).

It runs CPU-only Torch (see [model/Dockerfile](model/Dockerfile)) so it builds
small and runs on commodity hardware; it automatically uses CUDA if present. The
same folder doubles as a Hugging Face Space (Docker SDK) via its `README.md`
front-matter.

### 3. server — RAG chatbot microservice

[server/main.py](server/main.py) is a FastAPI service that answers questions about
a user-uploaded PDF, entirely in Bangla. Pipeline per request:

1. Save the uploaded PDF to a temp file and load it with `PyPDFLoader`.
2. Split into overlapping chunks (`RecursiveCharacterTextSplitter`,
   1000/200).
3. Embed chunks with HuggingFace `all-MiniLM-L6-v2` and index them in an
   in-memory **Chroma** vector store.
4. Retrieve relevant chunks and answer with **Groq** (`llama-3.3-70b-versatile`)
   through a LangChain LCEL chain, with Bangla-language prompt templates.

Two endpoints:
- `POST /rag-query` — single-query retrieval.
- `POST /rag-multi-query` — generates five paraphrased queries, retrieves for
  each, takes the unique union of documents, then answers. This "multi-query"
  strategy improves recall when the user's phrasing doesn't match the source text.

### 4. collab — realtime collaboration server

[collab/index.js](collab/index.js) is a Node.js **Hocuspocus** server (the Yjs
backend). It does not trust the browser directly: every WebSocket connection must
present a JWT that the Next.js app issued after checking the user's permission on
that specific document. On `onAuthenticate` it verifies the token with the shared
`COLLAB_SECRET` and confirms the token's `docId` matches the document being
opened. Document state (a Yjs CRDT update blob) is persisted to a
`collab_states` MongoDB collection via the Hocuspocus Database extension, so edits
survive restarts and late joiners sync the full history.

---

## Features and how they are built

### Banglish-to-Bangla conversion

The primary feature. The converter page and the collaborative editor both call
[client/lib/translate.ts](client/lib/translate.ts), which implements a
**model-first, LLM-fallback** strategy:

- If `NEXT_PUBLIC_BANGLISH_API` is set, it POSTs to the mBART **model** service
  (`/banglish`) and returns the neural translation.
- If that URL is unset or the request fails, it falls back to the Groq-backed
  `/api/translate` route, which prompts `llama-3.3-70b-versatile` to translate and
  return code-fenced JSON that the handler parses.

This gives production-quality output from the fine-tuned model while guaranteeing
the feature still works (via Groq) even if the model service is down or not
configured.

### AI chatbot with PDF question-answering

Two complementary capabilities:

- **Conversational chat** (`/api/chat/generate`) — replays up to the last 20
  messages of the session from MongoDB so the assistant has memory, calls Groq,
  and persists both the user turn and the assistant reply to the `Chat`
  collection. Sessions are grouped and listed by `/api/chat` using a MongoDB
  aggregation that labels each session with its first message.
- **PDF Q&A** — the browser uploads a PDF and question directly to the **RAG
  server** (`NEXT_PUBLIC_PDF_QUERY_URL`), which returns a Bangla answer grounded
  in the document (see the RAG service above).

### Real-time collaborative editing

Built on TipTap + Yjs + Hocuspocus
([client/components/contents/CollaborativeEditor.tsx](client/components/contents/CollaborativeEditor.tsx)):

1. On mount, the editor calls `POST /api/collab/token` with the document id.
2. That handler ([client/app/api/collab/token/route.ts](client/app/api/collab/token/route.ts))
   verifies via `canEditContent` that the signed-in user is the owner or an
   invited collaborator, then signs a 2-hour JWT containing the user id, doc id,
   display name, and a deterministic cursor color.
3. The editor opens a `HocuspocusProvider` to the **collab** server using that
   token. Yjs merges concurrent edits conflict-free (CRDT); presence and live
   cursors come from Yjs "awareness".
4. Content auto-saves to MongoDB every 5 seconds when dirty, and inline
   Banglish→Bangla translation is available on the current selection.

Owners invite collaborators by email
([client/app/api/collab/[id]/collaborators/route.ts](client/app/api/collab/[id]/collaborators/route.ts)):
the invitee is resolved through Clerk, added to the document's `collaborators`
array, and sent a Resend email (best-effort — inviting still succeeds if email is
not configured).

### Voice transcription

The transcribe page records audio in the browser and POSTs it to
[client/app/api/upload-audio/route.ts](client/app/api/upload-audio/route.ts),
which forwards it to **OpenAI Whisper** (`whisper-1`) and returns the transcript,
ready to be converted or edited.

### Content management and community feed

Users create, edit, publish, and delete documents (`Content` model). Published
documents appear in a public feed (`/contents`), can be **upvoted**
([client/app/api/upvote/route.ts](client/app/api/upvote/route.ts) toggles the
user id in an `upvotes` array), and are surfaced through profiles. Titles and
captions can be **AI-generated** from the body via `/api/generate` (Groq).

### Search

[client/app/api/search/route.ts](client/app/api/search/route.ts) runs a
case-insensitive regex search across users (by name/email) and **published**
content (by title/caption) in parallel, with user input escaped to prevent regex
injection and email never returned in results.

### PDF export

Documents are exported to PDF entirely client-side using jsPDF and html2canvas,
with bundled Noto Sans Bengali fonts to render Bangla script correctly.

### Dashboards and analytics

- **User dashboard** (`/api/analytics`) — per-user totals: contents created,
  upvotes received, chatbot interactions, and contributions, visualized with
  Chart.js.
- **Admin panel** (`/api/admin/analytics`) — platform totals (users via Clerk,
  contents, pending/approved contributions), plus the contribution review queue.
  Admin status is checked server-side from the user's Clerk `publicMetadata.role`
  ([client/lib/auth.ts](client/lib/auth.ts)).

### Continuous learning (crowd-sourced corrections)

Users submit `(banglish_text, bangla_text)` pairs on `/contribute`; each is stored
as a `Contribution` with `isApproved: false`. Admins approve them from the admin
panel. Approved pairs then feed the next model fine-tune — see below.

---

## The translation model and continuous-learning loop

The model is a fine-tuned **`facebook/mbart-large-50`**, trained by
[server/train_banglish_mbart.ipynb](server/train_banglish_mbart.ipynb):

- **Base data:** the `SKNahin/bengali-transliteration-data` dataset
  (romanized `rm` → Bangla `bn`).
- **Human-in-the-loop data:** the notebook connects to the app's MongoDB and pulls
  **approved contributions**, converting them into `(banglish, bangla)` training
  pairs and concatenating them with the base dataset. This closes the loop: real
  user corrections become training signal.
- **Training:** source language `en_XX`, target `bn_IN`, max length 128, 3 epochs,
  learning rate 3e-5, batch size 8, fp16 when a GPU is available, evaluated with
  beam search (`num_beams=5`).
- **Publishing:** the trained model and tokenizer are pushed to the Hugging Face
  Hub, from where the **model** service loads them at runtime.

End-to-end lifecycle:

```text
User submits correction  ->  Admin approves  ->  Contribution (isApproved=true)
        in MongoDB                                     |
                                                       v
   Fine-tune notebook: base dataset + approved pairs -> mBART -> push to HF Hub
                                                       |
                                                       v
        model service loads the updated model  ->  /banglish serves better output
```

---

## Data model

MongoDB collections (Mongoose schemas in `client/db/models/`):

| Model | Purpose | Key fields |
|---|---|---|
| `User` | App mirror of a Clerk user (synced on sign-up) | `userId` (Clerk id), `firstName`, `lastName`, `email` |
| `Content` | A document/post | `userId` (owner), `title`, `caption`, `content`, `isPublished`, `upvotes[]`, `collaborators[]` |
| `Contribution` | A crowd-sourced translation pair | `userId`, `banglish_text`, `bangla_text`, `isApproved` |
| `Chat` | One chatbot message | `userId`, `sessionId`, `role` (`user`/`assistant`), `content`, `createdAt` |
| `Embeddings` | Stored embedding vectors | `userId`, `embedding[]` |
| `collab_states` | Yjs document state (written by the collab server) | `name` (doc id), `state` (binary), `updatedAt` |

---

## Authentication and authorization

- **Identity** is handled by **Clerk**. New sign-ups are routed through
  `/after-sign-up`, which syncs the Clerk user into the `User` collection.
- **Route protection** is enforced by [client/middleware.ts](client/middleware.ts)
  for all app sections that require a session.
- **Authorization** is checked per action:
  - Document access uses `canEditContent` (owner or listed collaborator) in
    [client/lib/collab.ts](client/lib/collab.ts).
  - Admin actions verify `publicMetadata.role === "admin"` server-side.
  - The **collab server** independently verifies a signed JWT and that its
    `docId` matches — so even a valid session cannot open a document the user was
    not authorized for.

---

## API reference

Selected route handlers under `client/app/api/`:

| Method | Route | Description |
|---|---|---|
| POST | `/api/translate` | Groq-backed Banglish→Bangla (fallback path) |
| POST | `/api/generate` | Generate title + caption for text (Groq) |
| GET/POST | `/api/chat` | List chat sessions / append a message |
| GET | `/api/chat/[sessionId]` | Fetch a session's messages |
| POST | `/api/chat/generate` | Chatbot reply with 20-message memory (Groq) |
| POST | `/api/collab/token` | Mint a JWT for the collab server (authz-checked) |
| GET/PATCH | `/api/collab/[id]` | Load / save a document's HTML |
| POST/DELETE | `/api/collab/[id]/collaborators` | Invite / remove a collaborator (owner only) |
| GET | `/api/collab/shared` | Documents shared with the current user |
| GET/POST | `/api/contents`, `/api/publiccontents` | CRUD and public feed |
| POST/GET/PATCH | `/api/contribution(s)` | Submit / list / approve contributions |
| PATCH | `/api/upvote` | Toggle an upvote on a content |
| GET | `/api/search` | Search users and published content |
| POST | `/api/upload-audio` | Transcribe audio via OpenAI Whisper |
| GET | `/api/analytics` | Per-user analytics |
| GET | `/api/admin/analytics` | Platform analytics (admin only) |

External service endpoints:

| Service | Method | Endpoint |
|---|---|---|
| model | POST | `/banglish` |
| server (RAG) | POST | `/rag-query`, `/rag-multi-query` |
| collab | WS | Hocuspocus WebSocket (token-authenticated) |

---

## Environment variables

**client** (`client/.env.example`):

| Variable | Purpose |
|---|---|
| `MONGODB_URI`, `DBNAME` | MongoDB connection |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY` | Clerk auth |
| `GROQ_API_KEY` | Groq LLM (chat, translation fallback, title/caption) |
| `OPENAI_API_KEY` | OpenAI Whisper transcription |
| `NEXT_PUBLIC_BANGLISH_API` | mBART model service URL (optional; enables neural translation) |
| `NEXT_PUBLIC_PDF_QUERY_URL` | RAG server URL |
| `NEXT_PUBLIC_COLLAB_URL` | Collab WebSocket URL |
| `COLLAB_SECRET` | Shared secret for signing/verifying collab JWTs |
| `RESEND_API_KEY`, `EMAIL_FROM` | Invite emails (optional) |
| `NEXT_PUBLIC_APP_URL` | Base URL for links in emails |

**model:** `MODEL_ID`, `ALLOWED_ORIGINS`.
**server:** `GROQ_API_KEY`, `ALLOWED_ORIGINS`.
**collab:** `PORT`, `COLLAB_SECRET` (must match the client), `MONGODB_URI`, `DBNAME`.

`COLLAB_SECRET` must be identical in the client and the collab server, or tokens
will not verify.

---

## Running locally

### Full stack with Docker Compose

The root [docker-compose.yaml](docker-compose.yaml) runs the Next.js app, the RAG
server, the collab server, and a local MongoDB together:

```bash
# Provide GROQ_API_KEY, OPENAI_API_KEY, Clerk keys, COLLAB_SECRET, etc.
docker compose up --build
# App on http://localhost:3000, RAG on :8000, collab on ws://localhost:1234
```

(The mBART **model** service is optional locally; without
`NEXT_PUBLIC_BANGLISH_API` the converter uses the Groq fallback.)

### Running services individually

```bash
# client
cd client && npm install && cp .env.example .env.local  # fill in, then:
npm run dev

# model service
cd model && pip install -r requirements.txt && uvicorn main:app --port 7860

# RAG server
cd server && pip install -r requirements.txt && uvicorn main:app --port 8000

# collab server
cd collab && npm install && cp .env.example .env  # fill in, then:
npm run dev
```

---

## Deployment

Every service ships with a Dockerfile and is host-agnostic, so deployment is
flexible:

- **client** — deploy to any Next.js host (e.g. Vercel). Set the `NEXT_PUBLIC_*`
  service URLs and `COLLAB_SECRET` in its environment.
- **model / server / collab** — containerized Python/Node services that run on any
  Docker host (a VM, a container platform, or a managed service). Point the
  client's `NEXT_PUBLIC_BANGLISH_API`, `NEXT_PUBLIC_PDF_QUERY_URL`, and
  `NEXT_PUBLIC_COLLAB_URL` at their public URLs.
- **model** can alternatively run as a Hugging Face Space (its folder is already
  Space-ready).
- **MongoDB** — MongoDB Atlas (shared by the client and the collab server).

Because the browser calls the model, RAG, and collab services directly, those
services need CORS/origins configured (`ALLOWED_ORIGINS`) and public HTTPS/WSS
endpoints in production.

---

## Design decisions worth knowing

For a quick mental model of why the system is shaped this way:

- **Four services, not one.** ML inference (translation, RAG) and the stateful
  WebSocket server are isolated from the web tier so each can be sized, restarted,
  and scaled independently, and heavy model memory never affects the app.
- **Model-first with an LLM fallback.** Translation prefers the fine-tuned mBART
  model but degrades gracefully to Groq, so the feature is always available.
- **Defense in depth for collaboration.** The Next.js app authorizes the user and
  mints a scoped, short-lived JWT; the collab server independently re-verifies it
  and checks the document id. A valid login alone cannot open an unauthorized
  document.
- **CRDT-based editing.** Yjs merges concurrent edits without locking or a central
  authority, and persisting the CRDT state to MongoDB makes documents durable and
  late-join friendly.
- **Human-in-the-loop model improvement.** User corrections, once approved, are
  folded directly into the next fine-tuning run and republished to the Hugging
  Face Hub — a closed feedback loop from product usage back into model quality.
- **Grounded answers.** The chatbot's PDF Q&A retrieves from a per-document vector
  index (with an optional multi-query expansion for recall) so answers are
  grounded in the source rather than hallucinated.
- **Stateless-friendly data access.** A cached Mongoose connection keeps
  serverless/API-route invocations cheap, and Clerk keeps identity out of the
  app's own credential storage.
