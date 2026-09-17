// EasyDev proposal API helper — same Vercel deployment serves client + /api,
// so a relative path works everywhere. I consolidated this after the backend
// migration (standalone Express -> single serverless fn) to kill CORS/base-URL bugs.
export const API_BASE = '/api';

// Gotcha: fetch only throws on network failure, not on 500s. I got burned by
// silently rendering an error payload as a stack pick, so this treats non-2xx
// as errors and surfaces the server's message when there is one.
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
    // DELETEs come back with a tiny JSON body, but just in case — leave null.
  }

  if (!res.ok) {
    throw new Error((data && data.error) || `Request failed (${res.status})`);
  }

  return data;
}
