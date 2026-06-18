import { getUserFromRequest, json, postRank } from '../../_shared/auth.js';

export async function onRequestGet({ request, env }) {
  try {
    const user = await getUserFromRequest(request, env);
    if (!user) return json({ error: 'Unauthorised' }, 401);
    const { rank, color } = postRank(user.post_count || 0);
    return json({ user: { id: user.id, username: user.username, email: user.email, is_member: user.is_member, post_count: user.post_count || 0, avatar_color: user.avatar_color, rank, rankColor: color } });
  } catch (e) {
    return json({ error: 'Failed to get user', detail: e.message }, 500);
  }
}

export async function onRequestOptions() {
  return new Response(null, { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type, Authorization' } });
}
