import { getUserFromRequest, json } from '../../_shared/auth.js';

export async function onRequestPost({ request, env }) {
  try {
    const user = await getUserFromRequest(request, env);
    if (!user) return json({ error: 'Unauthorised' }, 401);
    if (user.is_member) return json({ error: 'Already a member' }, 400);
    const siteUrl = env.SITE_URL || 'https://footballandfighting.com';
    const body = JSON.stringify({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [{
        price: env.STRIPE_PRICE_ID,
        quantity: 1
      }],
      success_url: siteUrl + '/community.html?payment=success',
      cancel_url: siteUrl + '/membership.html?payment=cancelled',
      metadata: { user_id: String(user.id) },
      customer_email: user.email
    });
    const resp = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + env.STRIPE_SECRET_KEY,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        mode: 'payment',
        'payment_method_types[0]': 'card',
        'line_items[0][price]': env.STRIPE_PRICE_ID,
        'line_items[0][quantity]': '1',
        success_url: siteUrl + '/community.html?payment=success',
        cancel_url: siteUrl + '/membership.html?payment=cancelled',
        'metadata[user_id]': String(user.id),
        customer_email: user.email
      })
    });
    const session = await resp.json();
    if (!resp.ok) return json({ error: session.error?.message || 'Stripe error' }, 502);
    return json({ url: session.url });
  } catch (e) {
    return json({ error: 'Checkout failed', detail: e.message }, 500);
  }
}

export async function onRequestOptions() {
  return new Response(null, { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type, Authorization' } });
}
