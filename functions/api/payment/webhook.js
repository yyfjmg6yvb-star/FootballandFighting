import { json } from '../../_shared/auth.js';

async function verifyStripeSignature(payload, sigHeader, secret) {
  const parts = sigHeader.split(',');
  let timestamp = '';
  let signatures = [];
  for (const part of parts) {
    if (part.startsWith('t=')) timestamp = part.slice(2);
    if (part.startsWith('v1=')) signatures.push(part.slice(3));
  }
  if (!timestamp || signatures.length === 0) return false;
  const signedPayload = timestamp + '.' + payload;
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(signedPayload));
  const computed = Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('');
  return signatures.includes(computed);
}

export async function onRequestPost({ request, env }) {
  try {
    const payload = await request.text();
    const sig = request.headers.get('stripe-signature');
    const valid = await verifyStripeSignature(payload, sig, env.STRIPE_WEBHOOK_SECRET);
    if (!valid) return new Response('Invalid signature', { status: 400 });
    const event = JSON.parse(payload);
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const userId = session.metadata?.user_id;
      if (userId) {
        await env.DB.prepare('UPDATE users SET is_member = 1, stripe_customer_id = ? WHERE id = ?').bind(session.customer || null, parseInt(userId)).run();
      }
    }
    return json({ received: true });
  } catch (e) {
    return json({ error: 'Webhook error', detail: e.message }, 500);
  }
}

export async function onRequestOptions() {
  return new Response(null, { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type, stripe-signature' } });
}
