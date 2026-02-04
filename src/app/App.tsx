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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="container mx-auto px-4 py-16">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold text-gray-800 mb-4">
              Therapy Chat Platform
            </h1>
            <p className="text-xl text-gray-600">
              Secure, private messaging between patients and therapists
            </p>
          </div>

          {/* Demo Login Cards */}
          <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-8">
            {/* Patient Login Card */}
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-8 py-6">
                <h2 className="text-2xl font-bold text-white">Patient Login</h2>
                <p className="text-blue-100 mt-2">Connect with your therapist</p>
              </div>
              
              <div className="p-8">
                <div className="space-y-4">
                  {/* Patient 1 */}
                  <button
                    onClick={() => handleLogin(DEMO_USERS.patient1, 'user')}
                    className="w-full flex items-center gap-4 p-4 rounded-lg border-2 border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-all group"
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
                    className="w-full flex items-center gap-4 p-4 rounded-lg border-2 border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-all group"
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

                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
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
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
              <div className="bg-gradient-to-r from-purple-500 to-purple-600 px-8 py-6">
                <h2 className="text-2xl font-bold text-white">Therapist Login</h2>
                <p className="text-purple-100 mt-2">Manage your patient conversations</p>
              </div>
              
              <div className="p-8">
                <div className="space-y-4">
                  {/* Therapist */}
                  <button
                    onClick={() => handleLogin(DEMO_USERS.therapist, 'therapist')}
                    className="w-full flex items-center gap-4 p-4 rounded-lg border-2 border-gray-200 hover:border-purple-500 hover:bg-purple-50 transition-all group"
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

                <div className="mt-6 p-4 bg-purple-50 rounded-lg">
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

          {/* Features Section */}
          <div className="max-w-4xl mx-auto mt-16">
            <h3 className="text-2xl font-bold text-center text-gray-800 mb-8">
              Platform Features
            </h3>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center p-6 bg-white rounded-xl shadow-lg">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h4 className="font-semibold text-gray-800 mb-2">End-to-End Encrypted</h4>
                <p className="text-sm text-gray-600">Your conversations are secure and private</p>
              </div>
              
              <div className="text-center p-6 bg-white rounded-xl shadow-lg">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h4 className="font-semibold text-gray-800 mb-2">Real-Time Messaging</h4>
                <p className="text-sm text-gray-600">Instant message delivery and notifications</p>
              </div>
              
              <div className="text-center p-6 bg-white rounded-xl shadow-lg">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <h4 className="font-semibold text-gray-800 mb-2">HIPAA Compliant</h4>
                <p className="text-sm text-gray-600">Meets healthcare privacy standards</p>
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
        className="absolute top-4 right-4 z-50 bg-white hover:bg-gray-100 text-gray-700 px-4 py-2 rounded-lg shadow-md flex items-center gap-2 transition-colors"
      >
        <LogOut className="w-5 h-5" />
        Logout
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
