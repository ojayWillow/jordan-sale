// ============================================================================
// Supabase connection — fill these in after creating your project.
//   Supabase dashboard → Settings → API
//     • Project URL      → url
//     • anon public key  → anonKey
//
// The anon key is PUBLIC by design (it ships in the browser). Security is
// enforced by Row Level Security in supabase.sql, not by hiding this key.
// NEVER put the `service_role` key here — that one is secret.
//
// Until both values are filled in, the reservation form falls back to a
// "coming soon" message instead of erroring.
// ============================================================================
window.SUPA = {
  url: "",       // e.g. "https://abcdefgh.supabase.co"
  anonKey: ""    // e.g. "eyJhbGciOiJIUzI1NiIsInR5cCI6..."
};

window.SUPA.ready = !!(window.SUPA.url && window.SUPA.anonKey);

// Lazily create a shared Supabase client (needs the supabase-js UMD script).
window.getSupabase = function () {
  if (!window.SUPA.ready || typeof supabase === "undefined") return null;
  if (!window.__supaClient) {
    window.__supaClient = supabase.createClient(window.SUPA.url, window.SUPA.anonKey);
  }
  return window.__supaClient;
};
