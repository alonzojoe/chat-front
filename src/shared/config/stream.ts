export const getStreamApiKey = (): string => {
  const key = import.meta.env.VITE_STREAM_API_KEY as string | undefined;
  if (!key) {
    throw new Error('Missing VITE_STREAM_API_KEY. Set it in .env (Vite env vars must start with VITE_).');
  }
  return key;
};
