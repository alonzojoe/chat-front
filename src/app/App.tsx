// App.tsx
import { useState } from 'react';
import { ChevronRight, Info, LogOut } from 'lucide-react';
import { UserChatPage } from '../pages/user-chat/ui/UserChatPage';
import { TherapistChatPage } from '../pages/therapist-chat/ui/TherapistChatPage';
import type { User } from '../shared/types/chat';

// Demo users - In production, get these from your authentication system
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

  // Demo login function
  const handleLogin = (user: User, mode: 'user' | 'therapist') => {
    setCurrentUser(user);
    setViewMode(mode);
  };

  const handleLogout = () => {
    setCurrentUser(null);
  };

  // Login Screen
  if (!currentUser) {
    return (
      <div className="min-h-screen w-full bg-neutral-50">
        <div className="max-w-6xl mx-auto px-4 py-10 sm:py-14">
          {/* Header */}
          <div className="text-center mb-8 sm:mb-10">
            <div className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-4 py-2 shadow-sm">
              <span className="h-2 w-2 rounded-full bg-neutral-900" />
              <span className="text-sm font-medium text-neutral-700">Secure therapy messaging</span>
            </div>
            <h1 className="mt-5 text-4xl md:text-5xl font-bold tracking-tight text-neutral-900">
              Therapy Chat Platform
            </h1>
            <p className="mt-3 text-base md:text-lg text-neutral-600 max-w-2xl mx-auto">
              A calm, private space for patient–therapist conversations.
            </p>
          </div>

          {/* Demo Login Cards */}
          <div className="max-w-4xl mx-auto grid gap-5 lg:grid-cols-2">
            {/* Patient Login Card */}
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-neutral-200">
              <div className="px-7 py-6 border-b border-neutral-200 bg-white">
                <h2 className="text-xl font-semibold text-neutral-900">Patient</h2>
                <p className="text-neutral-600 mt-1 text-sm">Message your therapist in real time</p>
              </div>

              <div className="p-6 md:p-7">
                <div className="space-y-4">
                  {/* Patient 1 */}
                  <button
                    onClick={() => handleLogin(DEMO_USERS.patient1, 'user')}
                    className="w-full flex items-center gap-4 p-4 rounded-xl border border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50 transition-all group"
                  >
                    <img
                      src={DEMO_USERS.patient1.avatar}
                      alt={DEMO_USERS.patient1.name}
                      className="w-16 h-16 rounded-full"
                    />
                    <div className="text-left flex-1 min-w-0">
                      <h3 className="font-semibold text-neutral-900 truncate">{DEMO_USERS.patient1.name}</h3>
                      <p className="text-sm text-neutral-500 truncate">{DEMO_USERS.patient1.email}</p>
                    </div>
                    <ChevronRight className="w-6 h-6 text-neutral-400 group-hover:text-neutral-700" />
                  </button>

                  {/* Patient 2 */}
                  <button
                    onClick={() => handleLogin(DEMO_USERS.patient2, 'user')}
                    className="w-full flex items-center gap-4 p-4 rounded-xl border border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50 transition-all group"
                  >
                    <img
                      src={DEMO_USERS.patient2.avatar}
                      alt={DEMO_USERS.patient2.name}
                      className="w-16 h-16 rounded-full"
                    />
                    <div className="text-left flex-1 min-w-0">
                      <h3 className="font-semibold text-neutral-900 truncate">{DEMO_USERS.patient2.name}</h3>
                      <p className="text-sm text-neutral-500 truncate">{DEMO_USERS.patient2.email}</p>
                    </div>
                    <ChevronRight className="w-6 h-6 text-neutral-400 group-hover:text-neutral-700" />
                  </button>
                </div>

                <div className="mt-6 p-4 bg-neutral-50 rounded-xl border border-neutral-200">
                  <div className="flex gap-3">
                    <Info className="w-5 h-5 text-neutral-900 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-neutral-900">Patient Features</p>
                      <ul className="text-xs text-neutral-600 mt-1 space-y-1">
                        <li>• Chat directly with your assigned therapist</li>
                        <li>• Send secure, encrypted messages</li>
                        <li>• Share files and images</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Therapist Login Card */}
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-neutral-200">
              <div className="px-7 py-6 border-b border-neutral-200 bg-white">
                <h2 className="text-xl font-semibold text-neutral-900">Therapist</h2>
                <p className="text-neutral-600 mt-1 text-sm">Manage conversations, reply fast</p>
              </div>

              <div className="p-6 md:p-7">
                <div className="space-y-4">
                  {/* Therapist */}
                  <button
                    onClick={() => handleLogin(DEMO_USERS.therapist, 'therapist')}
                    className="w-full flex items-center gap-4 p-4 rounded-xl border border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50 transition-all group"
                  >
                    <img
                      src={DEMO_USERS.therapist.avatar}
                      alt={DEMO_USERS.therapist.name}
                      className="w-16 h-16 rounded-full"
                    />
                    <div className="text-left flex-1 min-w-0">
                      <h3 className="font-semibold text-neutral-900 truncate">{DEMO_USERS.therapist.name}</h3>
                      <p className="text-sm text-neutral-500 truncate">{DEMO_USERS.therapist.email}</p>
                      <p className="text-xs text-neutral-500 mt-1">Licensed Therapist</p>
                    </div>
                    <ChevronRight className="w-6 h-6 text-neutral-400 group-hover:text-neutral-700" />
                  </button>
                </div>

                <div className="mt-6 p-4 bg-neutral-50 rounded-xl border border-neutral-200">
                  <div className="flex gap-3">
                    <Info className="w-5 h-5 text-neutral-900 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-neutral-900">Therapist Features</p>
                      <ul className="text-xs text-neutral-600 mt-1 space-y-1">
                        <li>• View all patient conversations</li>
                        <li>• Respond to multiple patients</li>
                        <li>• See unread message counts</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Features */}
          <div className="max-w-5xl mx-auto mt-10">
            <div className="grid md:grid-cols-3 gap-4">
              <div className="p-5 bg-white rounded-2xl border border-neutral-200 shadow-sm">
                <p className="text-sm font-semibold text-neutral-900">Private by design</p>
                <p className="mt-1 text-sm text-neutral-600">Channels are member-only. Tokens are generated server-side.</p>
              </div>

              <div className="p-5 bg-white rounded-2xl border border-neutral-200 shadow-sm">
                <p className="text-sm font-semibold text-neutral-900">Real‑time chat</p>
                <p className="mt-1 text-sm text-neutral-600">Typing indicators, unread counts, and instant delivery.</p>
              </div>

              <div className="p-5 bg-white rounded-2xl border border-neutral-200 shadow-sm">
                <p className="text-sm font-semibold text-neutral-900">Clean UI</p>
                <p className="mt-1 text-sm text-neutral-600">Black/white styling, spacious layout, mobile friendly.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Render appropriate chat interface
  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Fixed top navbar */}
      <header className="fixed top-0 inset-x-0 z-50 h-14 bg-white/95 backdrop-blur border-b border-neutral-200">
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

      <main className="pt-14">
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
