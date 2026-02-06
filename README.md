# Therapy Chat App (Frontend)

React + TypeScript + Tailwind v4 frontend for a **self-hosted** 1:1 appointment chat.

This app connects to your local backend (Node/Express + MySQL + Socket.IO) — no external chat provider.

## What this frontend does

- Patient view: `/patient`
- Therapist view (messenger-style inbox): `/therapist`
- Realtime updates via **Socket.IO**
- Data fetching + mutations via **Axios + @tanstack/react-query**
- Attachments + images supported (uploads served by backend)

## Prerequisites

- Node.js 18+
- Your chat backend running (default): `http://localhost:4000`
  - Endpoints used:
    - `GET /api/appointments`
    - `GET /api/chat/messages`
    - `POST /api/chat/message`
    - `POST /api/chat/upload`
  - Socket.IO server on the same origin

## Setup

```bash
npm install
cp .env.example .env
npm run dev
```

Open:
- Patient: http://localhost:3000/patient
- Therapist: http://localhost:3000/therapist

## Environment variables

`.env`:

```bash
VITE_CHAT_API_URL=http://localhost:4000
```

## Demo IDs (prototype)

The backend prototype identifies the actor using **role + actorId**.

This frontend is currently wired to match the backend seed data:
- Patient `actorId=1`
- Therapist `actorId=10`

Once you integrate real auth, we will remove these demo IDs and derive them from your logged-in user.

## Theming (Tailwind v4)

Theme tokens are defined in `src/index.css` using Tailwind v4 `@theme {}` and used via utilities like:
- `bg-primary`, `hover:bg-primary-dark`
- `border-border`, `bg-surface`, `bg-surface-2`, `bg-bg`

## Project structure (important files)

```
src/
  app/App.tsx                      # Routes: /patient + /therapist
  pages/
    user-chat/ui/UserChatPage.tsx
    therapist-chat/ui/TherapistChatPage.tsx
  shared/api/
    http.ts                         # axios base client
    chatApi.ts                      # API functions
    chatQueries.ts                  # react-query hooks
    chatSocket.ts                   # socket.io client helper
  shared/ui/Ui.tsx                  # shared UI components
  index.css                         # Tailwind v4 theme tokens
```

## Notes (prototype security)

This demo passes `role` + `actorId` to the backend for authorization checks.
For production/medical use, you should replace that with JWT/session auth and remove actor identity from client input.
