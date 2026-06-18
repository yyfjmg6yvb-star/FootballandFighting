import { getUserFromRequest, json } from '../../_shared/auth.js';

export async function onRequestPost({ params, request, env }) {
  try {
    const user = await getUserFromRequest(request, env);
    if (!user) return json({ error: 'Unauthorised' }, 401);
    if (!user.is_member) return json({ error: 'Membership required' }, 403);
    const { id } = params;
    const url = new URL(request.url);
    const type = url.searchParams.get('type') || 'thread';
    const table = type === 'reply' ? 'replies' : 'threads';
    const existing = await env.DB.prepare('SELECT id FROM upvotes WHERE user_id = ? AND target_id = ? AND target_type = ?').bind(user.id, id, type).first();
    if (existing) {
      await env.DB.prepare('DELETE FROM upvotes WHERE user_id = ? AND target_id = ? AND target_type = ?').bind(user.id, id, type).run();
      await env.DB.prepare('UPDATE ' + table + ' SET upvotes = MAX(0, upvotes - 1) WHERE id = ?').bind(id).run();
      return json({ upvoted: false });
    } else {
      await env.DB.prepare('INSERT INTO upvotes (user_id, target_id, target_type) VALUES (?, ?, ?)').bind(user.id, id, type).run();
      await env.DB.prepare('UPDATE ' + table + ' SET upvotes = upvotes + 1 WHERE id = ?').bind(id).run();
      return json({ upvoted: true });
    }
  } catch (e) {
    return json({ error: 'Upvote failed', detail: e.message }, 500);
  }
}

export async function onRequestOptions() {
  return new Response(null, { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type, Authorization' } });
}
