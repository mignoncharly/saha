// No "use client" here: this module is imported by server components (via the API
// client) as well as client components. Marking it client-only turns these exports
// into client-reference proxies, so calling them during server rendering throws
// "o is not a function". The read path is already SSR-safe via the typeof window guards.
const TOKEN_KEY = "stl_admin_token";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function removeToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export function getAuthHeaders(): Record<string, string> {
  const token = getToken();
  return token ? { Authorization: `Token ${token}` } : {};
}