import { useSyncExternalStore } from 'react';
import type { User } from '../../shared/types.ts';

// The login token lives in localStorage so the user stays signed in across app launches.
// The token itself is valid for 180 days (server-side SESSION_DAYS).
const KEY = 'qh.session';

interface State {
  token: string | null;
  user: User | null;
}

function read(): State {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as State;
  } catch {
    /* storage unavailable */
  }
  return { token: null, user: null };
}

let state = read();
const listeners = new Set<() => void>();

function set(next: State) {
  state = next;
  try {
    if (next.token) localStorage.setItem(KEY, JSON.stringify(next));
    else localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
  listeners.forEach((l) => l());
}

export const session = {
  get: () => state,
  login: (token: string, user: User) => set({ token, user }),
  setUser: (user: User) => set({ ...state, user }),
  logout: () => set({ token: null, user: null }),
  subscribe: (l: () => void) => {
    listeners.add(l);
    return () => listeners.delete(l);
  },
};

export const useSession = () => useSyncExternalStore(session.subscribe, session.get);
