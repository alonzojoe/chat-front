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
      <div className="min-h-screen">
        <div className="container mx-auto px-4 py-14">
          {/* Header */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 rounded-full border border-purple-200 bg-white/70 px-4 py-2 shadow-sm backdrop-blur">
              <span className="h-2 w-2 rounded-full bg-purple-500" />
              <span className="text-sm font-medium text-purple-800">Secure therapy messaging</span>
            </div>
            <h1 className="mt-5 text-4xl md:text-5xl font-bold tracking-tight text-slate-900">
              Therapy Chat
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-fuchsia-500">
                {' '}Platform
              </span>
            </h1>
            <p className="mt-3 text-base md:text-lg text-slate-600 max-w-2xl mx-auto">
              A calm, private space for patient–therapist conversations.
            </p>
          </div>

          {/* Demo Login Cards */}
          <div className="max-w-5xl mx-auto grid lg:grid-cols-2 gap-6">
            {/* Patient Login Card */}
            <div className="bg-white/80 rounded-2xl shadow-xl overflow-hidden border border-purple-100 backdrop-blur">
              <div className="bg-gradient-to-r from-violet-600 to-fuchsia-500 px-7 py-6">
                <h2 className="text-xl font-semibold text-white">Patient</h2>
                <p className="text-purple-100 mt-1 text-sm">Message your therapist in real time</p>
              </div>

              <div className="p-6 md:p-7">
                <div className="space-y-4">
                  {/* Patient 1 */}
                  <button
                    onClick={() => handleLogin(DEMO_USERS.patient1, 'user')}
                    className="w-full flex items-center gap-4 p-4 rounded-xl border border-purple-100 hover:border-purple-200 hover:bg-purple-50/60 transition-all group"
                  >
                    <img
                      src={DEMO_USERS.patient1.avatar}
                      alt={DEMO_USERS.patient1.name}
                      className="w-16 h-16 rounded-full"
                    />
                    <div className="text-left flex-1">
                      <h3 className="font-semibold text-gray-800 group-hover:text-blue-600">
                        {DEMO_USERS.patient1.name}
                      </h3>
                      <p className="text-sm text-gray-500">{DEMO_USERS.patient1.email}</p>
                    </div>
                    <ChevronRight className="w-6 h-6 text-gray-400 group-hover:text-blue-600" />
                  </button>

                  {/* Patient 2 */}
                  <button
                    onClick={() => handleLogin(DEMO_USERS.patient2, 'user')}
                    className="w-full flex items-center gap-4 p-4 rounded-xl border border-purple-100 hover:border-purple-200 hover:bg-purple-50/60 transition-all group"
                  >
                    <img
                      src={DEMO_USERS.patient2.avatar}
                      alt={DEMO_USERS.patient2.name}
                      className="w-16 h-16 rounded-full"
                    />
                    <div className="text-left flex-1">
                      <h3 className="font-semibold text-gray-800 group-hover:text-blue-600">
                        {DEMO_USERS.patient2.name}
                      </h3>
                      <p className="text-sm text-gray-500">{DEMO_USERS.patient2.email}</p>
                    </div>
                    <ChevronRight className="w-6 h-6 text-gray-400 group-hover:text-blue-600" />
                  </button>
                </div>

                <div className="mt-6 p-4 bg-purple-50/70 rounded-xl border border-purple-100">
                  <div className="flex gap-3">
                    <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-blue-800">Patient Features</p>
                      <ul className="text-xs text-blue-700 mt-1 space-y-1">
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
            <div className="bg-white/80 rounded-2xl shadow-xl overflow-hidden border border-purple-100 backdrop-blur">
              <div className="bg-gradient-to-r from-purple-600 to-violet-700 px-7 py-6">
                <h2 className="text-xl font-semibold text-white">Therapist</h2>
                <p className="text-purple-100 mt-1 text-sm">Manage conversations, reply fast</p>
              </div>

              <div className="p-6 md:p-7">
                <div className="space-y-4">
                  {/* Therapist */}
                  <button
                    onClick={() => handleLogin(DEMO_USERS.therapist, 'therapist')}
                    className="w-full flex items-center gap-4 p-4 rounded-xl border border-purple-100 hover:border-purple-200 hover:bg-purple-50/60 transition-all group"
                  >
                    <img
                      src={DEMO_USERS.therapist.avatar}
                      alt={DEMO_USERS.therapist.name}
                      className="w-16 h-16 rounded-full"
                    />
                    <div className="text-left flex-1">
                      <h3 className="font-semibold text-gray-800 group-hover:text-purple-600">
                        {DEMO_USERS.therapist.name}
                      </h3>
                      <p className="text-sm text-gray-500">{DEMO_USERS.therapist.email}</p>
                      <p className="text-xs text-gray-400 mt-1">Licensed Therapist</p>
                    </div>
                    <ChevronRight className="w-6 h-6 text-gray-400 group-hover:text-purple-600" />
                  </button>
                </div>

                <div className="mt-6 p-4 bg-purple-50/70 rounded-xl border border-purple-100">
                  <div className="flex gap-3">
                    <Info className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-purple-800">Therapist Features</p>
                      <ul className="text-xs text-purple-700 mt-1 space-y-1">
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
              <div className="p-5 bg-white/70 rounded-2xl border border-purple-100 shadow-sm backdrop-blur">
                <p className="text-sm font-semibold text-slate-900">Private by design</p>
                <p className="mt-1 text-sm text-slate-600">Channels are member-only. Tokens are generated server-side.</p>
              </div>

              <div className="p-5 bg-white/70 rounded-2xl border border-purple-100 shadow-sm backdrop-blur">
                <p className="text-sm font-semibold text-slate-900">Real‑time chat</p>
                <p className="mt-1 text-sm text-slate-600">Typing indicators, unread counts, and instant delivery.</p>
              </div>

              <div className="p-5 bg-white/70 rounded-2xl border border-purple-100 shadow-sm backdrop-blur">
                <p className="text-sm font-semibold text-slate-900">Calm UI</p>
                <p className="mt-1 text-sm text-slate-600">Soft purple palette, spacious layout, mobile friendly.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Render appropriate chat interface
  return (
    <div className="relative">
      {/* Logout Button */}
      <button
        onClick={handleLogout}
        className="absolute top-4 right-4 z-50 inline-flex items-center gap-2 rounded-full bg-white/80 backdrop-blur px-4 py-2 text-slate-700 shadow-sm border border-purple-100 hover:bg-white transition"
      >
        <LogOut className="w-4 h-4" />
        <span className="text-sm font-medium">Logout</span>
      </button>

      {viewMode === 'user' ? (
        <UserChatPage
          currentUser={currentUser}
          therapistId={DEMO_USERS.therapist.id}
          therapistName={DEMO_USERS.therapist.name}
        />
      ) : (
        <TherapistChatPage currentUser={currentUser} />
      )}
    </div>
  );
}

export default App;
