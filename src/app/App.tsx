import { useState } from 'react';
import { ChevronRight, LogOut, Shield } from 'lucide-react';

import { UserChatPage } from '../pages/user-chat/ui/UserChatPage';
import { TherapistChatPage } from '../pages/therapist-chat/ui/TherapistChatPage';
import type { User } from '../shared/types/chat';
import { Card, Container, IconButton, Pill, PrimaryButton } from '../shared/ui/Ui';

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
  <div className="h-12 w-12 rounded-full bg-slate-200 overflow-hidden ring-2 ring-white">
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
      <div className="min-h-screen">
        <Container className="py-10 sm:py-14">
          <div className="grid lg:grid-cols-[1.2fr_1fr] gap-10 items-center">
            {/* Left hero */}
            <div>
              <Pill>
                <Shield className="w-4 h-4 text-[color:var(--color-primary)]" />
                Secure · Private · Real-time
              </Pill>
              <h1 className="mt-4 text-4xl sm:text-5xl font-bold tracking-tight text-slate-900">
                Therapy Chat
              </h1>
              <p className="mt-3 text-slate-600 max-w-xl">
                A calm, modern messaging experience for patient–therapist conversations.
              </p>

              <div className="mt-7 grid sm:grid-cols-2 gap-4">
                <Card className="p-5 bg-[color:var(--color-surface-2)]">
                  <p className="text-sm font-semibold text-slate-900">Inbox view</p>
                  <p className="mt-1 text-sm text-slate-600">Conversation list, unread counts, and quick access.</p>
                </Card>
                <Card className="p-5 bg-[color:var(--color-surface-2)]">
                  <p className="text-sm font-semibold text-slate-900">Read receipts</p>
                  <p className="mt-1 text-sm text-slate-600">Timestamps + “Seen” indicator in chat.</p>
                </Card>
              </div>
            </div>

            {/* Right cards */}
            <div className="space-y-4">
              <Card className="p-5 sm:p-6">
                <p className="text-sm font-semibold text-slate-900">Continue as Patient</p>
                <p className="mt-1 text-sm text-slate-600">Pick a demo account</p>

                <div className="mt-4 space-y-3">
                  {[DEMO_USERS.patient1, DEMO_USERS.patient2].map((u) => (
                    <button
                      key={u.id}
                      onClick={() => handleLogin(u, 'user')}
                      className="w-full flex items-center gap-4 rounded-2xl border border-[color:var(--color-border)] bg-white px-4 py-3 hover:bg-[color:var(--color-surface-2)] transition"
                    >
                      <Avatar src={u.avatar} alt={u.name} />
                      <div className="min-w-0 flex-1 text-left">
                        <p className="text-sm font-semibold text-slate-900 truncate">{u.name}</p>
                        <p className="text-sm text-slate-500 truncate">{u.email}</p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-slate-400" />
                    </button>
                  ))}
                </div>
              </Card>

              <Card className="p-5 sm:p-6">
                <p className="text-sm font-semibold text-slate-900">Continue as Therapist</p>
                <p className="mt-1 text-sm text-slate-600">Inbox + multi-patient view</p>

                <div className="mt-4">
                  <button
                    onClick={() => handleLogin(DEMO_USERS.therapist, 'therapist')}
                    className="w-full flex items-center gap-4 rounded-2xl border border-[color:var(--color-border)] bg-white px-4 py-3 hover:bg-[color:var(--color-surface-2)] transition"
                  >
                    <Avatar src={DEMO_USERS.therapist.avatar} alt={DEMO_USERS.therapist.name} />
                    <div className="min-w-0 flex-1 text-left">
                      <p className="text-sm font-semibold text-slate-900 truncate">{DEMO_USERS.therapist.name}</p>
                      <p className="text-sm text-slate-500 truncate">{DEMO_USERS.therapist.email}</p>
                      <p className="text-xs text-slate-400 mt-1">Licensed Therapist</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-400" />
                  </button>
                </div>
              </Card>
            </div>
          </div>
        </Container>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top bar */}
      <header className="sticky top-0 z-50 bg-white/70 backdrop-blur border-b border-[color:var(--color-border)]">
        <Container className="h-14 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-9 w-9 rounded-2xl bg-[color:var(--color-primary)] text-white grid place-items-center text-sm font-bold shadow-sm">
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
            <PrimaryButton onClick={handleLogout} className="py-2 px-3 rounded-2xl">
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </PrimaryButton>
            <IconButton onClick={handleLogout} className="sm:hidden">
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
