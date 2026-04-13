# JARVIS AI (Web) MVP

Full-stack Jarvis web assistant with wake word support, OpenAI's GPT conversation engine, ElevenLabs voice output, SearchAPI search summarization, weather lookup, and sci-fi UI.

## Stack

- Frontend: React (Vite), Tailwind CSS, Framer Motion (hologram-style core UI)
- Backend: Node.js, Express
- AI/Voice/Search: OpenAI, ElevenLabs, SearchAPI

## Setup

### 1) Backend

```bash
cd server
copy .env.example .env
```

Set:

- `OPENAI_API_KEY`
- `ELEVENLABS_API_KEY`
- `SEARCHAPI_API_KEY`
- Optional: `ELEVENLABS_VOICE_ID`

Run:

```bash
npm install
npm run dev
```

### 2) Frontend

```bash
cd client
copy .env.example .env
npm install
npm run dev
```

`VITE_API_BASE_URL` should be:

- `http://localhost:8080` locally
- Your Render backend URL in production

## Commands to try

- "Jarvis, search best AI tools"
- "Jarvis, open YouTube"
- "Jarvis weather in Lahore"

## Deploy

- Frontend to Vercel (`client`)
- Backend to Render (`server`)
- Set matching environment variables in both platforms.
