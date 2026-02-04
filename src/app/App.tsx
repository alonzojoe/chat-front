import { useState } from 'react';
import { ChevronRight, Info, LogOut } from 'lucide-react';

import { UserChatPage } from '../pages/user-chat/ui/UserChatPage';
import { TherapistChatPage } from '../pages/therapist-chat/ui/TherapistChatPage';
import type { User } from '../shared/types/chat';

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

function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [viewMode, setViewMode] = useState<'user' | 'therapist'>('user');

  const handleLogin = (user: User, mode: 'user' | 'therapist') => {
    setCurrentUser(user);
    setViewMode(mode);
  };

  const handleLogout = () => setCurrentUser(null);

  // LOGIN
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-neutral-50">
        <div className="max-w-6xl mx-auto px-4 py-10 sm:py-14">
          {/* Header */}
          <div className="max-w-2xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-4 py-2 shadow-sm">
              <span className="h-2 w-2 rounded-full bg-neutral-900" />
              <span className="text-sm font-medium text-neutral-700">Secure therapy messaging</span>
            </div>
            <h1 className="mt-5 text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-neutral-900">
              Therapy Chat Platform
            </h1>
            <p className="mt-3 text-base md:text-lg text-neutral-600">
              A calm, private space for patient–therapist conversations.
            </p>
          </div>

          {/* Cards */}
          <div className="mt-10 max-w-5xl mx-auto grid gap-5 lg:grid-cols-2">
            <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
              <div className="px-6 py-5 border-b border-neutral-200">
                <p className="text-sm font-semibold text-neutral-900">Patient</p>
                <p className="mt-1 text-sm text-neutral-600">Message your therapist in real time</p>
              </div>

              <div className="p-5 sm:p-6">
                <div className="space-y-3">
                  <button
                    onClick={() => handleLogin(DEMO_USERS.patient1, 'user')}
                    className="w-full flex items-center gap-4 p-4 rounded-2xl border border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50 transition"
                  >
                    <img src={DEMO_USERS.patient1.avatar} alt={DEMO_USERS.patient1.name} className="w-12 h-12 rounded-full" />
                    <div className="flex-1 min-w-0 text-left">
                      <p className="text-sm font-semibold text-neutral-900 truncate">{DEMO_USERS.patient1.name}</p>
                      <p className="text-sm text-neutral-500 truncate">{DEMO_USERS.patient1.email}</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-neutral-400" />
                  </button>

                  <button
                    onClick={() => handleLogin(DEMO_USERS.patient2, 'user')}
                    className="w-full flex items-center gap-4 p-4 rounded-2xl border border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50 transition"
                  >
                    <img src={DEMO_USERS.patient2.avatar} alt={DEMO_USERS.patient2.name} className="w-12 h-12 rounded-full" />
                    <div className="flex-1 min-w-0 text-left">
                      <p className="text-sm font-semibold text-neutral-900 truncate">{DEMO_USERS.patient2.name}</p>
                      <p className="text-sm text-neutral-500 truncate">{DEMO_USERS.patient2.email}</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-neutral-400" />
                  </button>
                </div>

                <div className="mt-5 rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
                  <div className="flex gap-3">
                    <Info className="w-5 h-5 text-neutral-900 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-neutral-900">Patient features</p>
                      <ul className="mt-2 text-sm text-neutral-600 space-y-1">
                        <li>• Private chat with your therapist</li>
                        <li>• Read receipts and timestamps</li>
                        <li>• Real-time delivery</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
              <div className="px-6 py-5 border-b border-neutral-200">
                <p className="text-sm font-semibold text-neutral-900">Therapist</p>
                <p className="mt-1 text-sm text-neutral-600">View and reply to multiple conversations</p>
              </div>

              <div className="p-5 sm:p-6">
                <div className="space-y-3">
                  <button
                    onClick={() => handleLogin(DEMO_USERS.therapist, 'therapist')}
                    className="w-full flex items-center gap-4 p-4 rounded-2xl border border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50 transition"
                  >
                    <img src={DEMO_USERS.therapist.avatar} alt={DEMO_USERS.therapist.name} className="w-12 h-12 rounded-full" />
                    <div className="flex-1 min-w-0 text-left">
                      <p className="text-sm font-semibold text-neutral-900 truncate">{DEMO_USERS.therapist.name}</p>
                      <p className="text-sm text-neutral-500 truncate">{DEMO_USERS.therapist.email}</p>
                      <p className="text-xs text-neutral-500 mt-1">Licensed Therapist</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-neutral-400" />
                  </button>
                </div>

                <div className="mt-5 rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
                  <div className="flex gap-3">
                    <Info className="w-5 h-5 text-neutral-900 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-neutral-900">Therapist features</p>
                      <ul className="mt-2 text-sm text-neutral-600 space-y-1">
                        <li>• Inbox-style conversation list</li>
                        <li>• Unread counts</li>
                        <li>• Quick replies</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer features */}
          <div className="mt-8 max-w-5xl mx-auto grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
              <p className="text-sm font-semibold text-neutral-900">Private by design</p>
              <p className="mt-1 text-sm text-neutral-600">Member-only channels and server-side tokens.</p>
            </div>
            <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
              <p className="text-sm font-semibold text-neutral-900">Messenger-style UI</p>
              <p className="mt-1 text-sm text-neutral-600">Avatars, timestamps, read receipts.</p>
            </div>
            <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
              <p className="text-sm font-semibold text-neutral-900">Mobile first</p>
              <p className="mt-1 text-sm text-neutral-600">Optimized for phones, scales up to desktop.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // APP
  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col">
      <header className="sticky top-0 z-50 h-14 bg-white/95 backdrop-blur border-b border-neutral-200">
        <div className="h-full max-w-6xl mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-9 w-9 rounded-full bg-neutral-900 text-white grid place-items-center text-sm font-semibold">
              TC
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-neutral-900 truncate">Therapy Chat</p>
              <p className="text-xs text-neutral-500 truncate">
                {currentUser.name} · {viewMode === 'user' ? 'Patient' : 'Therapist'}
              </p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-2 rounded-full bg-neutral-900 px-4 py-2 text-white shadow-sm hover:bg-neutral-800 transition"
          >
            <LogOut className="w-4 h-4" />
            <span className="text-sm font-semibold">Logout</span>
          </button>
        </div>
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
