# NEXT_STEPS (Frontend) — therapy-chat-app

## TODO** (tomorrow)

### TODO** 1) Hook up appointment creation (if needed for demo)
- [ ] Decide if frontend should call backend `POST /api/appointments` for demo appointment creation.
- [ ] If yes:
  - create react-query mutation `useCreateAppointment()`
  - add a small UI button/form (therapist side or home page) to create a demo appointment.

### TODO** 2) Seen / Unseen UI
- [ ] Add a "Seen" indicator for the last message you sent if the other side has read it.
- [ ] Add unread badge pill in therapist inbox list items (and later patient list if needed).
- [ ] Add socket listener for `read:updated` to refetch read status / update cache.

### TODO** 3) API cleanups
- [ ] Replace broad `invalidateQueries()` calls with targeted `queryClient.setQueryData` for messages.
- [ ] Add error toast UI for send/upload failures.

## Notes
- Current prototype uses:
  - Patient actorId=1
  - Therapist actorId=10
- Backend is `VITE_CHAT_API_URL` (default `http://localhost:4000`).
