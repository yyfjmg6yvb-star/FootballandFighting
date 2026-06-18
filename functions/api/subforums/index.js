import { json } from '../../_shared/auth.js';

export async function onRequestGet({ env }) {
  try {
    const rows = await env.DB.prepare('SELECT * FROM subforums ORDER BY sort_order ASC').all();
    const grouped = {};
    for (const row of rows.results) {
      if (!grouped[row.category]) grouped[row.category] = [];
      grouped[row.category].push(row);
    }
    return json({ subforums: rows.results, grouped });
  } catch (e) {
    return json({ error: 'Failed to load subforums', detail: e.message }, 500);
  }
}

export async function onRequestOptions() {
  return new Response(null, { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type, Authorization' } });
}
