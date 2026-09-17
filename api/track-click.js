// Vercel serverless function.
// Increments a click counter in Supabase using the SECRET service-role key
// (set as an env var in Vercel — never exposed to the browser).
//
// Requires these two Supabase objects to exist first — see the SQL at the
// bottom of this file, or supabase-setup.sql alongside it.

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars');
    return res.status(500).json({ error: 'Server not configured' });
  }

  // Accept a key from the request body, but only allow known counters —
  // stops anyone from using this endpoint to write arbitrary rows.
  const ALLOWED_KEYS = ['porosit_redirect'];
  let key = 'porosit_redirect';
  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    if (body.key && ALLOWED_KEYS.includes(body.key)) key = body.key;
  } catch (_) { /* fall back to default key */ }

  try {
    const resp = await fetch(`${SUPABASE_URL}/rest/v1/rpc/increment_click_counter`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify({ counter_key: key }),
    });

    if (!resp.ok) {
      const text = await resp.text();
      console.error('Supabase RPC error:', resp.status, text);
      return res.status(502).json({ error: 'Upstream error' });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('track-click error:', err);
    return res.status(500).json({ error: 'Internal error' });
  }
}
