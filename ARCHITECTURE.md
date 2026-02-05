# Frontend Architecture

This frontend is a self-hosted clinic chat UI. It does **not** include a Node backend inside this repo.

## High-level flow

```
React UI
  ├─ Axios REST (appointments/messages/send/upload)
  └─ Socket.IO realtime (message:new)

Backend (separate repo/folder)
  ├─ Express routes
  ├─ MySQL
  └─ Socket.IO rooms per appointmentId
```

## Key decisions

- **1:1 scope**: chat is bound to an `appointmentId` (one appointment = one thread)
- **Source of truth**: REST endpoints via React Query
- **Realtime**: socket events trigger `refetch()` (simple and reliable)

## Main modules

- `src/shared/api/http.ts`
  - axios instance with `baseURL = VITE_CHAT_API_URL`

- `src/shared/api/chatApi.ts`
  - typed API functions

- `src/shared/api/chatQueries.ts`
  - React Query hooks

- `src/shared/api/chatSocket.ts`
  - Socket.IO client + join appointment room

## Routes

- `/patient` → `UserChatPage`
- `/therapist` → `TherapistChatPage`

## Theming

Tailwind v4 theme tokens live in `src/index.css` via `@theme {}` and are referenced via utilities like `bg-primary`, `border-border`, etc.
