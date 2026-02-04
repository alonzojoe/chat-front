# ⚡ Quick Start Guide

## Get Running in 5 Minutes!

### 1️⃣ Install Dependencies
```bash
npm install
```

### 2️⃣ Get Stream API Key
1. Go to https://getstream.io/
2. Sign up (free)
3. Create new app
4. Copy API Key

### 3️⃣ Configure Environment
```bash
# Create .env file
cp .env.example .env

# Edit .env and add your API key:
VITE_STREAM_API_KEY=paste_your_key_here
```

### 4️⃣ Start Development Server
```bash
npm run dev
```

### 5️⃣ Test the App
1. App opens at http://localhost:3000
2. Click "John Doe" (patient login)
3. Open another browser window/incognito
4. Login as "Dr. Sarah Johnson" (therapist)
5. Send messages between the two!

## 🎯 What You'll See

**Patient View:**
- Clean chat interface
- Direct messaging with therapist
- File sharing capability

**Therapist View:**
- Dashboard with all patient conversations
- Unread message counts
- Quick switching between patients

## 🔒 Privacy Features

- ✅ Messages are encrypted
- ✅ Only channel members can see messages
- ✅ Private 1-on-1 conversations
- ✅ No message history visible to others

## 📱 Demo Users

The app includes 3 pre-configured demo users:

| User | ID | Role |
|------|-------|------|
| John Doe | user_001 | Patient |
| Jane Smith | user_002 | Patient |
| Dr. Sarah Johnson | therapist_001 | Therapist |

## 🚀 Next Steps

Once you've tested the demo:

1. **Remove demo users** - Replace with your real auth system
2. **Backend tokens** - Generate tokens from your server (see README.md)
3. **Customize styling** - Edit Tailwind classes to match your brand
4. **Add features** - Video calls, notifications, file storage, etc.

## ❓ Troubleshooting

**Error: "Failed to connect"**
→ Check your API key in .env file

**Messages not syncing**
→ Make sure both browser windows are logged in

**Build errors**
→ Delete node_modules and run `npm install` again

## 📚 Full Documentation

See README.md for complete setup, deployment, and customization guide.

---

**Need Help?** Check the README.md or visit https://getstream.io/chat/docs/
