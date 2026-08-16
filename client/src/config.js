// Client and API are always served from the same Vercel deployment — both
// in production and under `vercel dev` locally — so a relative path works
// in every environment. No env var needed.
export const API_BASE = '/api';

// Fetch wrapper that treats non-2xx responses as errors instead of silently
// parsing the error body as if it were a success payload. Surfaces the
// server's error message when available, falls back to a friendly default
// for network failures or unexpected response shapes.
export async function apiFetch(path, options, base = API_BASE) {
  let res;
  try {
    res = await fetch(`${base}${path}`, options);
  } catch (err) {
    throw new Error('Could not reach the server. Check your connection and try again.', { cause: err });
  }

  let data = null;
  try {
    data = await res.json();
  } catch {
    // No body or invalid JSON — fall through, data stays null.
  }

  if (!res.ok) {
    throw new Error((data && data.error) || `Request failed (${res.status})`);
  }

  return data;
}
