import { verifyPassword, createJWT, json, postRank } from '../../_shared/auth.js';

export async function onRequestPost({ request, env }) {
  try {
    const { email, password } = await request.json();
    if (!email || !password) return json({ error: 'Email and password required' }, 400);
    const user = await env.DB.prepare('SELECT * FROM users WHERE email = ?').bind(email.toLowerCase()).first();
    if (!user) return json({ error: 'Invalid email or password' }, 401);
    const valid = await verifyPassword(password, user.password_hash);
    if (!valid) return json({ error: 'Invalid email or password' }, 401);
    const token = await createJWT({ userId: user.id }, env.JWT_SECRET);
    const { rank, color } = postRank(user.post_count || 0);
    return json({ token, user: { id: user.id, username: user.username, email: user.email, is_member: user.is_member, post_count: user.post_count || 0, avatar_color: user.avatar_color, rank, rankColor: color } });
  } catch (e) {
    return json({ error: 'Login failed', detail: e.message }, 500);
  }
}

export async function onRequestOptions() {
  return new Response(null, { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type, Authorization' } });
}
