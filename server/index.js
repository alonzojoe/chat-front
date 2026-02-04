import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { StreamChat } from 'stream-chat';

const app = express();
app.use(cors());
app.use(express.json());

const apiKey = process.env.STREAM_API_KEY;
const apiSecret = process.env.STREAM_API_SECRET;

if (!apiKey || !apiSecret) {
  // Fail fast in dev
  console.error('Missing STREAM_API_KEY / STREAM_API_SECRET in environment');
}

// Minimal token endpoint for development
app.post('/api/stream/token', (req, res) => {
  try {
    const { userId } = req.body ?? {};
    if (!userId || typeof userId !== 'string') {
      return res.status(400).json({ error: 'userId is required' });
    }
    if (!apiKey || !apiSecret) {
      return res.status(500).json({ error: 'Server misconfigured: missing STREAM_API_KEY/STREAM_API_SECRET' });
    }

    const serverClient = StreamChat.getInstance(apiKey, apiSecret);
    const token = serverClient.createToken(userId);
    return res.json({ token });
  } catch (err) {
    console.error('Token error', err);
    return res.status(500).json({ error: 'Failed to create token' });
  }
});

const port = Number(process.env.PORT || 8787);
app.listen(port, () => {
  console.log(`API server listening on http://localhost:${port}`);
});
