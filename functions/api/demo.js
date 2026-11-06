// Demo request form -> e-mail via Mandrill (Mailchimp Transactional).
//
// Cloudflare Pages > Settings > Variables and Secrets:
//   MANDRILL_KEY      (secret, required)  Mandrill API key
//   MAIL_FROM         (optional)          verified sender in Mandrill, default noreply@racih.com
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

  const when = new Intl.DateTimeFormat('tr-TR', { dateStyle: 'long', timeStyle: 'short', timeZone: 'Europe/Istanbul' }).format(new Date());
  const text = [
    'Vidco 17020 - Yeni demo talebi',
    '',
    `Ad Soyad: ${f.name}`,
    `Firma: ${f.company}`,
    `E-posta: ${f.email}`,
    `Telefon: ${f.phone}`,
    `Not: ${f.note || '-'}`,
    '',
    `KVKK onayı: Evet · ${when} · 17020muayene.vidco.com.tr`,
  ].join('\n');
  const html = emailHtml(f, when);

  const to = (env.MAIL_TO || 'info@vidco.com.tr')
    .split(',')
    .map((email) => email.trim())
    .filter(Boolean)
    .map((email) => ({ email, type: 'to' }));

  let result;
  try {
    const res = await fetch(MANDRILL_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        key: env.MANDRILL_KEY,
        message: {
          subject: `Demo talebi: ${f.company} (${f.name})`,
          from_email: env.MAIL_FROM || 'noreply@racih.com',
          from_name: 'Vidco 17020 Web',
          to,
          // One shared message instead of a private copy per recipient, so the team can reply-all.
          // Mandrill still counts every recipient toward the quota; a single group address avoids that.
          preserve_recipients: true,
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
  } catch (err) {
    return json({ ok: false, error: 'mail_failed', detail: 'fetch: ' + String(err).slice(0, 120) }, 502);
  }

  // Mandrill returns one entry per recipient, or an error object
  const sent = Array.isArray(result) && result.length && result.every((r) => ['sent', 'queued', 'scheduled'].includes(r.status));
  if (!sent) {
    console.log('mandrill error', JSON.stringify(result));
    // Mandrill's reason codes (e.g. unsigned, Invalid_Key) hold no secrets and make failures diagnosable
    const detail = Array.isArray(result)
      ? result.map((r) => `${r.status}${r.reject_reason ? ':' + r.reject_reason : ''}`).join(',')
      : `${result && result.name}: ${result && result.message}`.slice(0, 200);
    return json({ ok: false, error: 'mail_failed', detail }, 502);
  }
  return json({ ok: true });
}

// Table-based, inline-styled markup so it renders the same in Outlook, Gmail and mobile clients
function emailHtml(f, when) {
  const tel = f.phone.replace(/[^\d+]/g, '');
  const row = (label, value, last) =>
    `<tr><td style="padding:14px 0;${last ? '' : 'border-bottom:1px solid #eeeaee;'}width:120px;vertical-align:top;font-size:13px;color:#8a8f9c;">${label}</td>` +
    `<td style="padding:14px 0;${last ? '' : 'border-bottom:1px solid #eeeaee;'}vertical-align:top;font-size:15px;color:#161c2d;">${value}</td></tr>`;
  const link = (href, label) => `<a href="${href}" style="color:#7d427c;text-decoration:none;font-weight:600;">${label}</a>`;
  const button = (href, label, bg, color, border) =>
    `<a href="${href}" style="display:inline-block;padding:12px 22px;border-radius:999px;background:${bg};color:${color};border:1.5px solid ${border};font-size:14px;font-weight:600;text-decoration:none;">${label}</a>`;

  return `<!doctype html>
<html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Yeni demo talebi</title></head>
<body style="margin:0;padding:0;background:#f5f3f5;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${esc(f.company)} firmasından ${esc(f.name)} demo talep etti.</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f3f5;">
<tr><td align="center" style="padding:32px 16px;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;font-family:'Segoe UI',Helvetica,Arial,sans-serif;">
    <tr><td style="padding:0 4px 18px;font-size:22px;font-weight:700;letter-spacing:-0.5px;color:#7d427c;">
      <span style="color:#f4732a;">/</span>VIDCO <span style="font-size:12px;font-weight:600;color:#7d427c;border:1.5px solid #7d427c;border-radius:5px;padding:1px 6px;vertical-align:middle;">17020</span>
    </td></tr>
    <tr><td style="background:#ffffff;border-radius:16px;overflow:hidden;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        <tr><td style="background:#7d427c;padding:28px 32px;">
          <div style="font-size:12px;letter-spacing:1.5px;text-transform:uppercase;color:#e3cde2;">Yeni demo talebi</div>
          <div style="margin-top:8px;font-size:26px;line-height:1.25;font-weight:700;color:#ffffff;">${esc(f.company)}</div>
          <div style="margin-top:4px;font-size:15px;color:#f1e6f0;">${esc(f.name)}</div>
        </td></tr>
        <tr><td style="padding:8px 32px 4px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            ${row('Ad Soyad', esc(f.name))}
            ${row('Firma', esc(f.company))}
            ${row('E-posta', link('mailto:' + esc(f.email), esc(f.email)))}
            ${row('Telefon', link('tel:' + esc(tel), esc(f.phone)))}
            ${row('Not', f.note ? esc(f.note).replace(/\n/g, '<br>') : '<span style="color:#8a8f9c;">-</span>', true)}
          </table>
        </td></tr>
        <tr><td style="padding:20px 32px 30px;">
          ${button('mailto:' + esc(f.email) + '?subject=' + encodeURIComponent('Vidco 17020 demo talebiniz'), 'E-posta ile yanıtla', '#7d427c', '#ffffff', '#7d427c')}
          &nbsp;
          ${button('tel:' + esc(tel), 'Hemen ara', '#ffffff', '#7d427c', '#d9c3d8')}
        </td></tr>
      </table>
    </td></tr>
    <tr><td style="padding:18px 4px 0;font-size:12px;line-height:1.6;color:#8a8f9c;">
      ${when} · KVKK aydınlatma metni onaylandı<br>
      Bu e-posta 17020muayene.vidco.com.tr demo formundan otomatik gönderildi. Bu e-postayı yanıtladığınızda yanıtınız doğrudan talep sahibine gider.
    </td></tr>
  </table>
</td></tr>
</table>
</body></html>`;
}

export const onRequest = () => json({ ok: false, error: 'method_not_allowed' }, 405);
