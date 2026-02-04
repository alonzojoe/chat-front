import { useState } from 'react';
import { ChevronRight, LogOut, Shield, Sparkles } from 'lucide-react';

import { UserChatPage } from '../pages/user-chat/ui/UserChatPage';
import { TherapistChatPage } from '../pages/therapist-chat/ui/TherapistChatPage';
import type { User } from '../shared/types/chat';
import { Card, Container, IconButton, Pill, PrimaryButton, cx } from '../shared/ui/Ui';

const DEMO_USERS = {
  patient1: {
    id: 'user_001',
    name: 'John Doe',
    email: 'john@example.com',
    role: 'user' as const,
    avatar: 'https://i.pravatar.cc/150?img=1',
  },
  patient2: {
    id: 'user_002',
    name: 'Jane Smith',
    email: 'jane@example.com',
    role: 'user' as const,
    avatar: 'https://i.pravatar.cc/150?img=5',
  },
  therapist: {
    id: 'therapist_001',
    name: 'Dr. Sarah Johnson',
    email: 'sarah@example.com',
    role: 'therapist' as const,
    avatar: 'https://i.pravatar.cc/150?img=9',
  },
};

const Avatar = ({ src, alt }: { src?: string; alt: string }) => (
  <div className="h-11 w-11 rounded-full bg-slate-200 overflow-hidden ring-1 ring-slate-200">
    {src ? <img className="h-full w-full object-cover" src={src} alt={alt} /> : null}
  </div>
);

function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [viewMode, setViewMode] = useState<'user' | 'therapist'>('user');

  const handleLogin = (user: User, mode: 'user' | 'therapist') => {
    setCurrentUser(user);
    setViewMode(mode);
  };

  const handleLogout = () => setCurrentUser(null);

  if (!currentUser) {
    return (
      <div className="min-h-screen grid place-items-center">
        <Container className="py-10">
          <div className="grid lg:grid-cols-[1.05fr_0.95fr] gap-6 lg:gap-8 items-stretch">
            {/* Left: brand */}
            <Card className="p-6 sm:p-8 flex flex-col justify-between">
              <div>
                <Pill>
                  <Shield className="w-4 h-4 text-[color:var(--color-primary)]" />
                  Private · Secure · Real-time
                </Pill>

                <div className="mt-5">
                  <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">
                    Therapy Chat
                  </h1>
                  <p className="mt-2 text-sm sm:text-base text-slate-600 max-w-xl">
                    Light, calm messaging for patient–therapist conversations.
                  </p>
                </div>

                <div className="mt-6 grid sm:grid-cols-2 gap-3">
                  <div className="rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] p-4">
                    <p className="text-sm font-semibold text-slate-900">Inbox</p>
                    <p className="mt-1 text-sm text-slate-600">Unread counts, last message, timestamps.</p>
                  </div>
                  <div className="rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] p-4">
                    <p className="text-sm font-semibold text-slate-900">Chat</p>
                    <p className="mt-1 text-sm text-slate-600">Typing indicator + seen status.</p>
                  </div>
                </div>
              </div>

              <div className="mt-8 flex items-center gap-3 text-xs text-slate-500">
                <div className="grid h-9 w-9 place-items-center rounded-xl bg-[color:var(--color-primary)] text-white">
                  <Sparkles className="w-5 h-5" />
                </div>
                <p>
                  Demo mode • choose an account to preview the UI.
                </p>
              </div>
            </Card>

            {/* Right: login choices */}
            <Card className="p-6 sm:p-8">
              <p className="text-sm font-semibold text-slate-900">Continue</p>
              <p className="mt-1 text-sm text-slate-600">Pick a demo account</p>

              <div className="mt-5">
                <p className="text-xs font-semibold text-slate-500">PATIENTS</p>
                <div className="mt-2 space-y-2">
                  {[DEMO_USERS.patient1, DEMO_USERS.patient2].map((u) => (
                    <button
                      key={u.id}
                      onClick={() => handleLogin(u, 'user')}
                      className={cx(
                        'w-full flex items-center gap-3 rounded-xl border px-3.5 py-3 text-left transition',
                        'border-[color:var(--color-border)] bg-white hover:bg-[color:var(--color-surface-2)]'
                      )}
                    >
                      <Avatar src={u.avatar} alt={u.name} />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-slate-900 truncate">{u.name}</p>
                        <p className="text-sm text-slate-500 truncate">{u.email}</p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-slate-400" />
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-6">
                <p className="text-xs font-semibold text-slate-500">THERAPIST</p>
                <div className="mt-2">
                  <button
                    onClick={() => handleLogin(DEMO_USERS.therapist, 'therapist')}
                    className={cx(
                      'w-full flex items-center gap-3 rounded-xl border px-3.5 py-3 text-left transition',
                      'border-[color:var(--color-border)] bg-white hover:bg-[color:var(--color-surface-2)]'
                    )}
                  >
                    <Avatar src={DEMO_USERS.therapist.avatar} alt={DEMO_USERS.therapist.name} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-slate-900 truncate">{DEMO_USERS.therapist.name}</p>
                      <p className="text-sm text-slate-500 truncate">{DEMO_USERS.therapist.email}</p>
                      <p className="mt-1 text-xs text-slate-500">Licensed Therapist</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-400" />
                  </button>
                </div>
              </div>
            </Card>
          </div>
        </Container>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-50 border-b border-[color:var(--color-border)] bg-white">
        <Container className="h-14 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-9 w-9 rounded-xl bg-[color:var(--color-primary)] text-white grid place-items-center text-sm font-bold shadow-sm">
              TC
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-900 truncate">Therapy Chat</p>
              <p className="text-xs text-slate-500 truncate">
                {currentUser.name} · {viewMode === 'user' ? 'Patient' : 'Therapist'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <PrimaryButton onClick={handleLogout} className="px-3 py-2">
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </PrimaryButton>
            <IconButton onClick={handleLogout} className="sm:hidden" aria-label="Logout">
              <LogOut className="w-4 h-4" />
            </IconButton>
          </div>
        </Container>
      </header>

      <main className="flex-1 min-h-0">
        {viewMode === 'user' ? (
          <UserChatPage
            currentUser={currentUser}
            therapistId={DEMO_USERS.therapist.id}
            therapistName={DEMO_USERS.therapist.name}
          />
        ) : (
          <TherapistChatPage currentUser={currentUser} />
        )}
      </main>
    </div>
  );
}

export default App;
