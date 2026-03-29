const CREDENTIALS = { username: 'alpha', password: 'tester' };
const SESSION_KEY = 'bnb_session';
const ATTEMPTS_KEY = 'bnb_attempts';
const LOCKOUT_KEY = 'bnb_lockout';
const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 5 * 60 * 1000;

export function isAuthenticated(): boolean {
  return sessionStorage.getItem(SESSION_KEY) === 'true';
}

export function login(username: string, password: string): { success: boolean; error?: string; lockout?: number } {
  // Check lockout
  const lockoutUntil = Number(localStorage.getItem(LOCKOUT_KEY) ?? '0');
  if (lockoutUntil && Date.now() < lockoutUntil) {
    return { success: false, lockout: lockoutUntil };
  }

  if (username === CREDENTIALS.username && password === CREDENTIALS.password) {
    sessionStorage.setItem(SESSION_KEY, 'true');
    localStorage.removeItem(ATTEMPTS_KEY);
    localStorage.removeItem(LOCKOUT_KEY);
    return { success: true };
  }

  const attempts = Number(localStorage.getItem(ATTEMPTS_KEY) ?? '0') + 1;
  localStorage.setItem(ATTEMPTS_KEY, String(attempts));

  if (attempts >= MAX_ATTEMPTS) {
    const until = Date.now() + LOCKOUT_MS;
    localStorage.setItem(LOCKOUT_KEY, String(until));
    localStorage.setItem(ATTEMPTS_KEY, '0');
    return { success: false, lockout: until };
  }

  return { success: false, error: `Invalid credentials. ${MAX_ATTEMPTS - attempts} attempts remaining.` };
}

export function logout() {
  sessionStorage.removeItem(SESSION_KEY);
}

export function getLockoutRemaining(): number {
  const until = Number(localStorage.getItem(LOCKOUT_KEY) ?? '0');
  if (!until) return 0;
  const remaining = until - Date.now();
  return remaining > 0 ? remaining : 0;
}
