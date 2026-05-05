# Project Idea: AI DJ

## The Vision

A conversational AI DJ that takes plain English commands and responds with live, evolving music — in real time, in the browser. You say "a techno track", and the DJ starts playing one. You say "make it darker", and it does.

## How It Works

The user types a command into a chat interface. Under the hood, two AI passes happen:

1. **Orchestrator** — interprets the command and produces a DJ plan (genre, BPM, energy level, mix note)
2. **Code Generator** — takes the plan and writes Strudel code that implements it

The generated Strudel code is injected live into a browser-based editor and starts playing immediately. No clicking around, no DAW, no setup — just a command and music.

## Auto-Evolve

The DJ doesn't just play a track and stop. Every ~25 seconds it automatically evolves the set — subtly shifting the music to keep it alive and interesting, the way a real DJ would blend and transition. The user can always steer it with a new command at any time.

## The Stack

- **Next.js** — app framework
- **Vercel AI SDK** (`useChat`) — streaming chat interface and AI integration
- **Strudel** — live coding music environment running in the browser
- **Two-pass AI architecture**:
  - `/api/orchestrate` — planning pass (fast, decides what to do)
  - `/api/generate` — code generation pass (streams Strudel code into the editor)

## The Experience

The UI is minimal and dark: a Strudel code editor on the left, a terminal-style chat panel on the right. The user speaks to the DJ like a collaborator. The code is always visible — you can see exactly what the AI is playing.

## The Core Idea

Most music apps hide the music-making behind a UI. This one exposes it — you can see the code, understand what's happening, and learn from it. It's an AI DJ you can talk to, watch, and learn from at the same time.
