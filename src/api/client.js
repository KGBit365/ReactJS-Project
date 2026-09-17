const BASE_URL = "http://localhost:4000";

/**
 * Thin wrapper around fetch:
 * - prefixes the API base URL
 * - attaches the Bearer token when one is passed in
 * - throws a normal Error with the server's message on non-2xx responses
 *   so calling code can just try/catch instead of checking res.ok everywhere
 */
export async function request(path, { method = "GET", body, token } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  // 204 No Content has no body to parse
  if (res.status === 204) return null;

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    const message = (data && data.message) || `Request failed (${res.status})`;
    throw new Error(message);
  }

  return data;
}
