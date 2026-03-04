export type ChatUser = {
  id: string;
  name: string;
  role: 'therapist' | 'patient';
};

export const users: ChatUser[] = [
  { id: 'therapist_10', name: 'Dr. Reyes', role: 'therapist' },
  { id: 'patient_1', name: 'John Cruz', role: 'patient' },
  { id: 'patient_2', name: 'Ana Santos', role: 'patient' },
];

const userMap = new Map(users.map((u) => [u.id, u]));

export const getUserById = (id?: string | null) => {
  if (!id) return null;
  return userMap.get(id) || null;
};

export const getUserName = (id?: string | null, fallback = 'Unknown') => {
  return getUserById(id)?.name || fallback;
};
