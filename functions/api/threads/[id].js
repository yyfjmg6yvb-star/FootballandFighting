import { getUserFromRequest, json, postRank } from '../../_shared/auth.js';

export async function onRequestGet({ params, env }) {
  try {
    const { id } = params;
    const thread = await env.DB.prepare('SELECT t.*, u.username, u.avatar_color, u.post_count as author_post_count, s.name as subforum_name, s.slug as subforum_slug FROM threads t JOIN users u ON t.user_id = u.id JOIN subforums s ON t.subforum_id = s.id WHERE t.id = ?').bind(id).first();
    if (!thread) return json({ error: 'Thread not found' }, 404);
    await env.DB.prepare('UPDATE threads SET views = views + 1 WHERE id = ?').bind(id).run();
    const replies = await env.DB.prepare('SELECT r.*, u.username, u.avatar_color, u.post_count as author_post_count FROM replies r JOIN users u ON r.user_id = u.id WHERE r.thread_id = ? ORDER BY r.created_at ASC').bind(id).all();
    const threadWithRank = { ...thread, authorRank: postRank(thread.author_post_count || 0) };
    const repliesWithRank = replies.results.map(r => ({ ...r, authorRank: postRank(r.author_post_count || 0) }));
    return json({ thread: threadWithRank, replies: repliesWithRank });
  } catch (e) {
    return json({ error: 'Failed to load thread', detail: e.message }, 500);
  }
}

export async function onRequestOptions() {
  return new Response(null, { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type, Authorization' } });
}
