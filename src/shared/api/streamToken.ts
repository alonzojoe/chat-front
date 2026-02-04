export const fetchStreamToken = async (userId: string): Promise<string> => {
  const res = await fetch('/api/stream/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Token request failed (${res.status}): ${text}`);
  }

  const data = (await res.json()) as { token: string };
  if (!data?.token) throw new Error('Token response missing token');
  return data.token;
};
