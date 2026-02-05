import { LogOut } from 'lucide-react';
import { Link, Route, Routes, useLocation, useNavigate } from 'react-router-dom';

import { UserChatPage } from '../pages/user-chat/ui/UserChatPage';
import { TherapistChatPage } from '../pages/therapist-chat/ui/TherapistChatPage';
import type { User } from '../shared/types/chat';
import { Card, Container, IconButton, Pill, PrimaryButton, cx } from '../shared/ui/Ui';

// Demo mapping (matches backend seed.sql)
const DEMO = {
  patient: { id: 'user_001', name: 'John Doe', email: 'john@example.com', role: 'user' as const },
  therapist: { id: 'therapist_001', name: 'Dr. Sarah Johnson', email: 'sarah@example.com', role: 'therapist' as const },
  patientActorId: 1,
  therapistActorId: 10,
};

const Header = ({ currentUser }: { currentUser: User }) => {
  const nav = useNavigate();
  const loc = useLocation();

  const mode = loc.pathname.startsWith('/therapist') ? 'Therapist' : 'Patient';

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-white">
      <Container className="h-14 flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-9 w-9 rounded-xl bg-primary text-white grid place-items-center text-sm font-bold shadow-sm">
            TC
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-900 truncate">Therapy Chat</p>
            <p className="text-xs text-slate-500 truncate">
              {currentUser.name} · {mode}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-2">
            <Link
              to="/patient"
              className={cx(
                'rounded-xl border px-3 py-2 text-sm font-semibold',
                loc.pathname.startsWith('/patient')
                  ? 'border-primary bg-surface-2'
                  : 'border-border bg-white'
              )}
            >
              Patient
            </Link>
            <Link
              to="/therapist"
              className={cx(
                'rounded-xl border px-3 py-2 text-sm font-semibold',
                loc.pathname.startsWith('/therapist')
                  ? 'border-primary bg-surface-2'
                  : 'border-border bg-white'
              )}
            >
              Therapist
            </Link>
          </div>

          <PrimaryButton onClick={() => nav('/')} className="px-3 py-2">
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Home</span>
          </PrimaryButton>
          <IconButton onClick={() => nav('/')} className="sm:hidden" aria-label="Home">
            <LogOut className="w-4 h-4" />
          </IconButton>
        </div>
      </Container>
    </header>
  );
};

function Home() {
  return (
    <div className="min-h-screen grid place-items-center">
      <Container className="py-10">
        <Card className="p-6 sm:p-8">
          <Pill>Prototype · API-connected</Pill>
          <h1 className="mt-4 text-2xl font-bold tracking-tight text-slate-900">Therapy Chat</h1>
          <p className="mt-2 text-sm text-slate-600">Open one of the two demo URLs:</p>

          <div className="mt-5 grid gap-3">
            <Link
              to="/patient"
              className="rounded-xl border border-border bg-white hover:bg-surface-2 px-4 py-3 text-sm font-semibold"
            >
              Patient view → /patient
            </Link>
            <Link
              to="/therapist"
              className="rounded-xl border border-border bg-white hover:bg-surface-2 px-4 py-3 text-sm font-semibold"
            >
              Therapist view → /therapist
            </Link>
          </div>

          <p className="mt-5 text-xs text-slate-500">
            Backend: <code>http://localhost:4000</code> (set <code>VITE_CHAT_API_URL</code> if different)
          </p>
        </Card>
      </Container>
    </div>
  );
}

function App() {
  const loc = useLocation();
  const currentUser = loc.pathname.startsWith('/therapist') ? (DEMO.therapist as User) : (DEMO.patient as User);

  return (
    <div className="min-h-screen flex flex-col">
      {loc.pathname === '/' ? null : <Header currentUser={currentUser} />}

      <main className="flex-1 min-h-0">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route
            path="/patient"
            element={<UserChatPage currentUser={currentUser} actorId={DEMO.patientActorId} />}
          />
          <Route
            path="/therapist"
            element={<TherapistChatPage currentUser={currentUser} actorId={DEMO.therapistActorId} />}
          />
        </Routes>
      </main>
    </div>
  );
}

export default App;
