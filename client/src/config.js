// Single source of truth for the API base URL.
//
// - Local dev: defaults to the local Express server.
// - Production: reads VITE_API_BASE (set at build time, e.g. in GitHub
//   Actions or your Pages build step) so the client can call an API hosted
//   on a different origin (e.g. Render). Falls back to '/api' for same-origin
//   deployments.
export const API_BASE =
  import.meta.env.VITE_API_BASE ||
  (import.meta.env.DEV ? 'http://localhost:5000/api' : '/api');
