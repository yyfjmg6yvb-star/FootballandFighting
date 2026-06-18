import { hashPassword, createJWT, json, postRank } from '../../_shared/auth.js';

export async function onRequestPost({ request, env }) {
  try {
    const { username, email, password } = await request.json();
    if (!username || !email || !password) return json({ error: 'All fields required' }, 400);
    if (username.length < 3 || username.length > 20) return json({ error: 'Username must be 3-20 characters' }, 400);
    if (!/^[a-zA-Z0-9_]+$/.test(username)) return json({ error: 'Username: letters, numbers and underscores only' }, 400);
    if (password.length < 8) return json({ error: 'Password must be at least 8 characters' }, 400);
    const existing = await env.DB.prepare('SELECT id FROM users WHERE email = ? OR username = ?').bind(email.toLowerCase(), username).first();
    if (existing) return json({ error: 'Username or email already taken' }, 409);
    const passwordHash = await hashPassword(password);
    const colors = ['#e50000','#f5a623','#2ecc71','#3498db','#9b59b6','#e67e22'];
    const avatarColor = colors[Math.floor(Math.random() * colors.length)];
    const result = await env.DB.prepare('INSERT INTO users (username, email, password_hash, avatar_color) VALUES (?, ?, ?, ?) RETURNING id').bind(username, email.toLowerCase(), passwordHash, avatarColor).first();
    const token = await createJWT({ userId: result.id }, env.JWT_SECRET);
    const { rank, color } = postRank(0);
    return json({ token, user: { id: result.id, username, email: email.toLowerCase(), is_member: 0, post_count: 0, avatar_color: avatarColor, rank, rankColor: color } });
  } catch (e) {
    return json({ error: 'Registration failed', detail: e.message }, 500);
  }
}

export async function onRequestOptions() {
  return new Response(null, { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type, Authorization' } });
}
