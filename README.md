# 🚀 Therapy Chat Platform - Complete Setup Guide

## 📋 Overview
A modern, secure therapy chat platform built with React, TypeScript, Tailwind CSS v4, and Stream Chat. Features private one-on-one messaging between patients and therapists.

## ✨ Features

### For Patients:
- ✅ Direct messaging with assigned therapist
- ✅ Real-time message delivery
- ✅ File and image sharing
- ✅ Read receipts and typing indicators
- ✅ Clean, intuitive interface

### For Therapists:
- ✅ Dashboard with all patient conversations
- ✅ Unread message badges
- ✅ Quick conversation switching
- ✅ Patient message history
- ✅ Search functionality

### Security:
- 🔒 End-to-end encrypted messages
- 🔒 Private channels (only members can see)
- 🔒 HIPAA-compliant infrastructure available
- 🔒 Secure authentication

## 🛠️ Tech Stack

- **Frontend Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS v4
- **Chat Infrastructure**: Stream Chat
- **Build Tool**: Vite
- **State Management**: React Hooks

## 📦 Installation

### Prerequisites
- Node.js 18+ and npm/yarn
- Stream Chat account (free tier available)

### Step 1: Clone or Download Files
All files are ready in the `/home/claude/` directory.

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Get Stream Chat API Key

1. Go to https://getstream.io/
2. Sign up for a free account
3. Create a new app
4. Copy your API Key from the dashboard

### Step 4: Configure Environment Variables

Create a `.env` file in the root directory:
```bash
cp .env.example .env
```

Edit `.env` and add your Stream API key:
```
VITE_STREAM_API_KEY=your_actual_api_key_here
```

### Step 5: Start Development Server
```bash
npm run dev
```

The app will open at `http://localhost:3000`

## 📁 Project Structure

```
therapy-chat-app/
├── src/
│   ├── components/
│   │   ├── UserChat.tsx          # Patient chat interface
│   │   └── TherapistChat.tsx     # Therapist dashboard
│   ├── hooks/
│   │   └── useStreamChat.ts      # Stream Chat connection hook
│   ├── types/
│   │   └── chat.types.ts         # TypeScript type definitions
│   ├── index.css                 # Tailwind v4 styles
│   └── main.tsx                  # App entry point
├── App.tsx                       # Main app component
├── index.html                    # HTML template
├── package.json                  # Dependencies
├── tsconfig.json                 # TypeScript config
├── vite.config.ts                # Vite config
└── .env                          # Environment variables
```

## 🎯 How to Use

### Demo Mode (Development)
The app includes 3 demo users:
- **Patient 1**: John Doe (user_001)
- **Patient 2**: Jane Smith (user_002)
- **Therapist**: Dr. Sarah Johnson (therapist_001)

1. Open the app
2. Click on any patient to login as a patient
3. Click on the therapist to login as a therapist
4. Send messages between accounts (open multiple browser windows to test)

### Production Integration

To integrate with your real application:

1. **Remove demo users** from `App.tsx`
2. **Add real authentication** - Replace demo login with your auth system
3. **Get tokens from backend** - Update `useStreamChat.ts` to fetch tokens from your API
4. **User management** - Create Stream Chat users when users sign up in your system

## 🔐 Security Best Practices

### ⚠️ IMPORTANT: Never Use Dev Tokens in Production!

The demo uses `client.devToken()` for simplicity. In production:

1. **Backend Token Generation**:
```javascript
// Backend (Node.js example)
const StreamChat = require('stream-chat').StreamChat;
const serverClient = StreamChat.getInstance(apiKey, apiSecret);

app.post('/api/chat/token', (req, res) => {
  const { userId } = req.body;
  // Verify user is authenticated
  const token = serverClient.createToken(userId);
  res.json({ token });
});
```

2. **Frontend Token Fetch**:
```typescript
// Replace in useStreamChat.ts
const response = await fetch('/api/chat/token', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ userId: currentUser.id })
});
const { token } = await response.json();
```

## 🎨 Customization

### Colors and Theme
Edit `src/index.css`:
```css
@theme {
  --color-primary: #3b82f6;        /* Blue */
  --color-secondary: #8b5cf6;      /* Purple */
}
```

### Component Styling
All components use Tailwind CSS utility classes. Customize by editing the className props.

### Chat UI Customization
Stream Chat components are fully customizable:
```tsx
<MessageList 
  messageActions={['react', 'reply', 'delete']}
  threadList
/>
```

## 🚢 Deployment

### Build for Production
```bash
npm run build
```

This creates optimized files in the `dist/` folder.

### Deploy Options

#### Vercel (Recommended)
```bash
npm install -g vercel
vercel
```

#### Netlify
```bash
npm install -g netlify-cli
netlify deploy --prod
```

#### Other Platforms
Upload the `dist/` folder to:
- AWS S3 + CloudFront
- Firebase Hosting
- GitHub Pages
- Cloudflare Pages

### Environment Variables in Production
Add `VITE_STREAM_API_KEY` to your deployment platform's environment variables.

## 🔧 Troubleshooting

### "Failed to connect to chat"
- Check your API key in `.env`
- Verify internet connection
- Check Stream Chat dashboard for API status

### Messages not appearing
- Ensure both users are in the same channel
- Check browser console for errors
- Verify channel.watch() was called

### TypeScript errors
```bash
npm run lint
```

### Build errors
```bash
rm -rf node_modules package-lock.json
npm install
```

## 📊 Stream Chat Dashboard

Monitor your app at https://dashboard.getstream.io/:
- View active users
- See message counts
- Check channel analytics
- Debug issues

## 💰 Pricing

### Stream Chat Pricing:
- **Free Tier**: Perfect for development and small apps
  - Unlimited MAUs (Monthly Active Users)
  - 3M chat messages/month
  - Basic features

- **Paid Plans**: Starting at $99/month
  - Higher message limits
  - Advanced features
  - HIPAA compliance
  - Priority support

## 🔄 Updating Dependencies

```bash
# Check for updates
npm outdated

# Update all packages
npm update

# Update Stream Chat specifically
npm install stream-chat@latest stream-chat-react@latest
```

## 📚 Additional Resources

- [Stream Chat Documentation](https://getstream.io/chat/docs/)
- [React SDK Guide](https://getstream.io/chat/docs/sdk/react/)
- [Tailwind CSS v4](https://tailwindcss.com/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

## 🐛 Common Issues

### Issue: "Module not found"
**Solution**: 
```bash
npm install
```

### Issue: Vite not starting
**Solution**: 
```bash
rm -rf node_modules/.vite
npm run dev
```

### Issue: Stream Chat styling conflicts
**Solution**: Import Stream CSS before your custom CSS in `main.tsx`

## 🧪 Testing

### Manual Testing Checklist:
- [ ] Patient can send message to therapist
- [ ] Therapist receives message in real-time
- [ ] Therapist can see all patient conversations
- [ ] Unread counts update correctly
- [ ] Files/images can be shared
- [ ] Typing indicators work
- [ ] Messages persist after refresh

### Multi-User Testing:
1. Open app in Chrome as Patient
2. Open app in Firefox/Incognito as Therapist
3. Send messages back and forth
4. Verify real-time updates

## 📝 Next Steps

### Recommended Enhancements:
1. **Authentication**: Integrate with your auth system (Auth0, Firebase, etc.)
2. **Backend API**: Create backend endpoints for token generation
3. **Notifications**: Add push notifications for new messages
4. **File Upload**: Implement secure file storage (AWS S3, Cloudinary)
5. **Video Calls**: Add video chat feature (Twilio, Agora)
6. **Analytics**: Track user engagement and message metrics
7. **Moderation**: Add content moderation tools
8. **Mobile App**: Build React Native version

## 🆘 Support

If you need help:
- Stream Chat Support: support@getstream.io
- Community Forum: https://github.com/GetStream/stream-chat-react/discussions
- Documentation: https://getstream.io/chat/docs/

## 📄 License

This is a demo/prototype application. Adjust licensing as needed for your project.

---

**Ready to get started?** Run `npm install` and `npm run dev` to see your therapy chat platform in action! 🚀
