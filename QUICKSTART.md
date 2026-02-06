# Quickstart (Frontend)

## 1) Install

```bash
npm install
```

## 2) Configure backend URL

```bash
cp .env.example .env
```

Set:

```bash
VITE_CHAT_API_URL=http://localhost:4000
```

## 3) Run

```bash
npm run dev
```

Open:
- Patient: http://localhost:3000/patient
- Therapist: http://localhost:3000/therapist

## Troubleshooting

- If messages don’t update in realtime:
  - confirm backend is running on `http://localhost:4000`
  - open DevTools console and check for `[chat-socket] connected ...`
- If appointments list is empty:
  - import `seed.sql` into your backend DB (patientId=1, therapistId=10)
