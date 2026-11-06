// Demo request form -> e-mail via Mandrill (Mailchimp Transactional).
//
// Cloudflare Pages > Settings > Variables and Secrets:
//   MANDRILL_KEY      (secret, required)  Mandrill API key
//   MAIL_FROM         (optional)          verified sender in Mandrill, default noreply@vidco.com.tr
//   MAIL_TO           (optional)          recipients, comma separated, default info@vidco.com.tr
//   TURNSTILE_SECRET  (secret, optional)  enables Cloudflare Turnstile verification

const MANDRILL_URL = 'https://mandrillapp.com/api/1.0/messages/send';
const TURNSTILE_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
const MIN_FILL_MS = 3000;
const LIMITS = { name: 120, company: 160, email: 160, phone: 40, note: 2000 };

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
  });

const esc = (s) =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

async function readBody(request) {
  const type = request.headers.get('Content-Type') || '';
  if (type.includes('application/json')) return request.json();
  return Object.fromEntries(await request.formData());
}

export async function onRequestPost({ request, env }) {
  let data;
  try {
    data = await readBody(request);
  } catch {
    return json({ ok: false, error: 'bad_request' }, 400);
  }

  // Bots fill the hidden field or submit instantly; answer "ok" so they don't retry
  if (data.website || (Number(data.t) && Date.now() - Number(data.t) < MIN_FILL_MS)) {
    return json({ ok: true });
  }

  const f = {};
  for (const [key, max] of Object.entries(LIMITS)) f[key] = String(data[key] || '').trim().slice(0, max);

  if (!f.name || !f.company || !f.phone || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email) || !data.kvkk) {
    return json({ ok: false, error: 'validation' }, 422);
  }

  if (env.TURNSTILE_SECRET) {
    const form = new FormData();
    form.append('secret', env.TURNSTILE_SECRET);
    form.append('response', String(data['cf-turnstile-response'] || ''));
    form.append('remoteip', request.headers.get('CF-Connecting-IP') || '');
    const check = await fetch(TURNSTILE_URL, { method: 'POST', body: form }).then((r) => r.json()).catch(() => ({}));
    if (!check.success) return json({ ok: false, error: 'captcha' }, 403);
  }

  if (!env.MANDRILL_KEY) return json({ ok: false, error: 'not_configured' }, 500);

  const rows = [
    ['Ad Soyad', f.name],
    ['Firma', f.company],
    ['E-posta', f.email],
    ['Telefon', f.phone],
    ['Not', f.note || '-'],
    ['KVKK onayı', 'Evet'],
    ['Kaynak', '17020muayene.vidco.com.tr'],
  ];
  const text = rows.map(([k, v]) => `${k}: ${v}`).join('\n');
  const html =
    '<h2 style="font-family:Arial,sans-serif">Vidco 17020 Demo Talebi</h2><table style="font-family:Arial,sans-serif;font-size:14px;border-collapse:collapse">' +
    rows
      .map(([k, v]) => `<tr><td style="padding:6px 16px 6px 0;color:#666;vertical-align:top">${k}</td><td style="padding:6px 0">${esc(v).replace(/\n/g, '<br>')}</td></tr>`)
      .join('') +
    '</table>';

  const to = (env.MAIL_TO || 'info@vidco.com.tr').split(',').map((email) => ({ email: email.trim(), type: 'to' }));

  let result;
  try {
    const res = await fetch(MANDRILL_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        key: env.MANDRILL_KEY,
        message: {
          subject: `Vidco 17020 Demo Talebi - ${f.company}`,
          from_email: env.MAIL_FROM || 'noreply@vidco.com.tr',
          from_name: 'Vidco 17020 Web',
          to,
          headers: { 'Reply-To': f.email },
          text,
          html,
          tags: ['17020-demo'],
          track_opens: false,
          track_clicks: false,
        },
      }),
    });
    result = await res.json();
  } catch {
    return json({ ok: false, error: 'mail_failed' }, 502);
  }

  // Mandrill returns one entry per recipient, or an error object
  const sent = Array.isArray(result) && result.length && result.every((r) => ['sent', 'queued', 'scheduled'].includes(r.status));
  if (!sent) {
    console.log('mandrill error', JSON.stringify(result));
    return json({ ok: false, error: 'mail_failed' }, 502);
  }
  return json({ ok: true });
}

export const onRequest = () => json({ ok: false, error: 'method_not_allowed' }, 405);
