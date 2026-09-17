// API served from same Vercel deployment, relative path works everywhere
export const API_BASE = '/api';

// Fetch wrapper that treats non-2xx as errors, surfaces server error messages
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
