# 🏗️ Application Architecture

## Component Hierarchy

```
App.tsx (Main Container)
│
├─ Login Screen (when not authenticated)
│  ├─ Patient Login Cards
│  └─ Therapist Login Card
│
├─ UserChat.tsx (Patient View)
│  ├─ Header (Therapist info, online status)
│  ├─ Stream Chat Components
│  │  ├─ ChannelHeader
│  │  ├─ MessageList
│  │  ├─ MessageInput
│  │  └─ Thread (for replies)
│  └─ Custom Security Notice
│
└─ TherapistChat.tsx (Therapist View)
   ├─ Header (Dashboard title, stats)
   ├─ Sidebar
   │  ├─ Search Bar
   │  └─ ChannelPreviewItem (for each patient)
   │     ├─ Patient Avatar
   │     ├─ Last Message
   │     └─ Unread Badge
   └─ Chat Area
      ├─ ChannelHeader
      ├─ MessageList
      ├─ MessageInput
      └─ Thread
```

## Data Flow

```
User Login
    ↓
useStreamChat Hook
    ↓
Initialize Stream Client
    ↓
Connect User with Token
    ↓
Create/Get Channel
    ↓
Real-time Messaging
```

## Channel Structure

```
Channel ID Format: user_{userId}_therapist_{therapistId}

Channel Properties:
├─ type: "messaging"
├─ private: true (only members can see)
├─ members: [userId, therapistId]
└─ metadata:
   ├─ name: "Chat with Therapist"
   ├─ created_by_user: userId
   └─ therapist_id: therapistId
```

## Security Layers

```
1. Authentication
   └─ User must be logged in to access chat

2. Channel Privacy
   └─ private: true (only members can access)

3. Token-based Access
   └─ Each user gets unique token for Stream connection

4. End-to-End Encryption
   └─ All messages encrypted by Stream Chat

5. Member Verification
   └─ Only specified members can join channel
```

## File Organization

```
therapy-chat-app/
├─ src/
│  ├─ components/          # React components
│  │  ├─ UserChat.tsx     # Patient interface
│  │  └─ TherapistChat.tsx # Therapist dashboard
│  ├─ hooks/              # Custom React hooks
│  │  └─ useStreamChat.ts # Stream connection logic
│  ├─ types/              # TypeScript definitions
│  │  └─ chat.types.ts    # Type interfaces
│  ├─ index.css           # Tailwind v4 + custom styles
│  └─ main.tsx            # React entry point
├─ App.tsx                # Main app component
├─ index.html             # HTML template
├─ package.json           # Dependencies
├─ tsconfig.json          # TypeScript config
└─ vite.config.ts         # Build config
```

## Technology Stack Details

### Frontend
- **React 18**: Component-based UI
- **TypeScript**: Type safety
- **Tailwind CSS v4**: Utility-first styling
- **Vite**: Fast build tool

### Chat Infrastructure
- **Stream Chat**: Real-time messaging backend
- **stream-chat-react**: Pre-built React components

### Key Libraries
```json
{
  "stream-chat": "Real-time chat SDK",
  "stream-chat-react": "React UI components",
  "react": "UI framework",
  "typescript": "Type safety",
  "tailwindcss": "Styling",
  "vite": "Build tool"
}
```

## Message Flow Example

```
Patient sends message
        ↓
MessageInput component
        ↓
Stream Chat SDK
        ↓
Stream Chat Server (encrypted)
        ↓
Real-time WebSocket
        ↓
Therapist's Stream Client
        ↓
MessageList component
        ↓
Message appears instantly
```

## Customization Points

### 1. Styling
- `src/index.css` - Global styles & Tailwind config
- Component className props - Tailwind utilities

### 2. Authentication
- `App.tsx` - Replace demo login with real auth
- `useStreamChat.ts` - Update token fetching

### 3. Features
- `UserChat.tsx` - Add patient-specific features
- `TherapistChat.tsx` - Add therapist tools

### 4. Chat Behavior
- Stream Chat props - Message actions, reactions, etc.
- Channel settings - Permissions, features

## Production Considerations

```
Development (Current):
├─ Dev tokens (client.devToken)
├─ Demo users
└─ Local storage

Production (Recommended):
├─ Backend token generation
├─ Database user management
├─ Real authentication
├─ Secure API endpoints
├─ HTTPS only
└─ Environment variables
```
