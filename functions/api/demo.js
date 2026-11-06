// Demo request form -> e-mail via Mandrill (Mailchimp Transactional).
//
// Cloudflare Pages > Settings > Variables and Secrets:
//   MANDRILL_KEY      (secret, required)  Mandrill API key
//   MAIL_FROM         (optional)          verified sender in Mandrill, default noreply@racih.com
//   MAIL_TO           (optional)          recipients, comma separated, default info@vidco.com.tr
//   TURNSTILE_SECRET  (secret, optional)  enables Cloudflare Turnstile verification
//   REPLY_TO          (optional)          reply address on the visitor confirmation, default info@vidco.com.tr

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

export async function onRequestPost({ request, env, waitUntil }) {
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
          subject: `Vidco 17020 Demo Talebi : ${f.company} - ${f.name}`,
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

  // Confirmation to the visitor; the team already has the request, so a failure here is only logged
  const confirm = fetch(MANDRILL_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      key: env.MANDRILL_KEY,
      message: {
        subject: 'Vidco 17020 demo talebiniz bize ulaştı',
        from_email: env.MAIL_FROM || 'noreply@racih.com',
        from_name: 'Vidco Yazılım',
        to: [{ email: f.email, name: f.name, type: 'to' }],
        headers: { 'Reply-To': env.REPLY_TO || 'info@vidco.com.tr' },
        text: confirmText(f),
        html: confirmHtml(f),
        tags: ['17020-demo-confirm'],
        track_opens: false,
        track_clicks: false,
      },
    }),
  })
    .then((r) => r.json())
    .then((r) => { if (!Array.isArray(r) || !['sent', 'queued', 'scheduled'].includes(r[0] && r[0].status)) console.log('confirm mail', JSON.stringify(r)); })
    .catch((err) => console.log('confirm mail', String(err)));
  if (waitUntil) waitUntil(confirm);
  else await confirm;

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

const SITE = 'https://17020muayene.vidco.com.tr';
const WHATSAPP = 'https://wa.me/905325661114?text=' + encodeURIComponent('Merhaba, Vidco 17020 demo talebim hakkında yazıyorum.');

function confirmText(f) {
  return [
    `Merhaba ${f.name},`,
    '',
    'Vidco 17020 demo talebiniz bize ulaştı, teşekkür ederiz.',
    `Ekibimiz en kısa sürede ${f.phone} numarasından ya da bu e-posta adresinden sizinle iletişime geçecek.`,
    '',
    `Beklemek istemezseniz WhatsApp'tan yazabilirsiniz: ${WHATSAPP}`,
    'ya da bizi arayabilirsiniz: +90 (216) 345 67 45',
    '',
    `Bu arada diğer müşterilerimizin Vidco deneyimlerini dinleyin: ${SITE}/#deneyimler`,
    '',
    'Vidco Yazılım Araştırma Geliştirme T.A.Ş.',
    'Suadiye Mah. Bağdat Cad. No:399/B Blok Kat:1 Kadıköy, İstanbul',
  ].join('\n');
}

function confirmHtml(f) {
  const button = (href, label, bg, color, border) =>
    `<a href="${href}" style="display:inline-block;padding:13px 24px;border-radius:999px;background:${bg};color:${color};border:1.5px solid ${border};font-size:15px;font-weight:600;text-decoration:none;">${label}</a>`;
  const summary = (label, value) =>
    `<tr><td style="padding:6px 0;width:90px;font-size:13px;color:#8a8f9c;">${label}</td><td style="padding:6px 0;font-size:14px;color:#161c2d;">${value}</td></tr>`;

  return `<!doctype html>
<html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Demo talebiniz bize ulaştı</title></head>
<body style="margin:0;padding:0;background:#f5f3f5;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">Ekibimiz en kısa sürede sizinle iletişime geçecek.</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f3f5;">
<tr><td align="center" style="padding:32px 16px;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;font-family:'Segoe UI',Helvetica,Arial,sans-serif;">
    <tr><td style="padding:0 4px 18px;font-size:22px;font-weight:700;letter-spacing:-0.5px;color:#7d427c;">
      <span style="color:#f4732a;">/</span>VIDCO <span style="font-size:12px;font-weight:600;color:#7d427c;border:1.5px solid #7d427c;border-radius:5px;padding:1px 6px;vertical-align:middle;">17020</span>
    </td></tr>
    <tr><td style="background:#ffffff;border-radius:16px;padding:36px 32px 32px;">
      <div style="font-size:12px;letter-spacing:1.5px;text-transform:uppercase;color:#7d427c;"><span style="color:#f4732a;">/</span> Demo talebi</div>
      <div style="margin-top:10px;font-size:26px;line-height:1.25;font-weight:700;color:#161c2d;">Talebiniz bize ulaştı.</div>
      <p style="margin:18px 0 0;font-size:16px;line-height:1.6;color:#5d6270;">Merhaba ${esc(f.name)},</p>
      <p style="margin:10px 0 0;font-size:16px;line-height:1.6;color:#5d6270;">Vidco 17020 demo talebiniz için teşekkür ederiz. Ekibimiz en kısa sürede <strong style="color:#161c2d;">${esc(f.phone)}</strong> numarasından ya da bu e-posta adresinden sizinle iletişime geçecek ve Vidco 17020'yi firmanızın süreçlerine göre gösterecek.</p>

      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:24px;background:#f7f5f7;border-radius:12px;">
        <tr><td style="padding:16px 20px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            ${summary('Firma', esc(f.company))}
            ${summary('Telefon', esc(f.phone))}
            ${f.note ? summary('Notunuz', esc(f.note).replace(/\n/g, '<br>')) : ''}
          </table>
        </td></tr>
      </table>

      <p style="margin:26px 0 14px;font-size:15px;color:#5d6270;">Beklemek istemezseniz hemen ulaşabilirsiniz:</p>
      ${button(WHATSAPP, "WhatsApp'tan yazın", '#7d427c', '#ffffff', '#7d427c')}
      &nbsp;
      ${button('tel:+902163456745', '+90 (216) 345 67 45', '#ffffff', '#7d427c', '#d9c3d8')}

      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:30px;border-top:1px solid #eeeaee;">
        <tr><td style="padding-top:22px;font-size:15px;line-height:1.6;color:#5d6270;">
          Bu arada diğer müşterilerimizin Vidco deneyimlerini kendi sözleriyle dinleyin:<br>
          <a href="${SITE}/#deneyimler" style="color:#7d427c;font-weight:600;text-decoration:none;">Müşteri videolarını izleyin →</a>
        </td></tr>
      </table>
    </td></tr>
    <tr><td style="padding:18px 4px 0;font-size:12px;line-height:1.6;color:#8a8f9c;">
      Vidco Yazılım Araştırma Geliştirme T.A.Ş. · Suadiye Mah. Bağdat Cad. No:399/B Blok Kat:1 Kadıköy, İstanbul<br>
      Bu e-postayı 17020muayene.vidco.com.tr üzerinden demo talebi oluşturduğunuz için aldınız. Bu e-postayı yanıtlayarak bize ulaşabilirsiniz.
    </td></tr>
  </table>
</td></tr>
</table>
</body></html>`;
}

export const onRequest = () => json({ ok: false, error: 'method_not_allowed' }, 405);
