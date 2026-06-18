import { getUserFromRequest, json, postRank } from '../../_shared/auth.js';

export async function onRequestPost({ request, env }) {
  try {
    const user = await getUserFromRequest(request, env);
    if (!user) return json({ error: 'Unauthorised' }, 401);
    if (!user.is_member) return json({ error: 'Membership required' }, 403);
    const { thread_id, body } = await request.json();
    if (!thread_id || !body) return json({ error: 'thread_id and body required' }, 400);
    if (body.length < 2) return json({ error: 'Reply too short' }, 400);
    const thread = await env.DB.prepare('SELECT id, subforum_id FROM threads WHERE id = ?').bind(thread_id).first();
    if (!thread) return json({ error: 'Thread not found' }, 404);
    const result = await env.DB.prepare('INSERT INTO replies (thread_id, user_id, body) VALUES (?, ?, ?) RETURNING id').bind(thread_id, user.id, body).first();
    await env.DB.prepare('UPDATE threads SET reply_count = reply_count + 1, last_reply_at = CURRENT_TIMESTAMP WHERE id = ?').bind(thread_id).run();
    await env.DB.prepare('UPDATE subforums SET post_count = post_count + 1 WHERE id = ?').bind(thread.subforum_id).run();
    await env.DB.prepare('UPDATE users SET post_count = post_count + 1 WHERE id = ?').bind(user.id).run();
    const newPostCount = (user.post_count || 0) + 1;
    const { rank, color } = postRank(newPostCount);
    return json({ reply: { id: result.id, thread_id, user_id: user.id, body, username: user.username, avatar_color: user.avatar_color, rank, rankColor: color } }, 201);
  } catch (e) {
    return json({ error: 'Failed to post reply', detail: e.message }, 500);
  }
}

export async function onRequestOptions() {
  return new Response(null, { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type, Authorization' } });
}
