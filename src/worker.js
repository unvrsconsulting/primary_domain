export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === '/api/contact' && request.method === 'POST') {
      return handleContact(request, env);
    }

    if (url.pathname === '/api/leadgen-notify' && request.method === 'POST') {
      return handleLeadgenNotify(request, env);
    }

    return env.ASSETS.fetch(request);
  }
};

async function handleContact(request, env) {
  try {
    const data = await request.json();
    const { name, email, phone, company, website, message } = data;

    if (!name || !email) {
      return json({ ok: false, error: 'Missing required fields' }, 400);
    }

    const bodyText = [
      `Name: ${name}`,
      `Email: ${email}`,
      `Phone: ${phone || 'Not provided'}`,
      `Company: ${company || 'Not provided'}`,
      `Website: ${website || 'Not provided'}`,
      `What they want to automate: ${message || 'Not provided'}`
    ].join('\n');

    const result = await sendViaMailChannels(env, {
      replyTo: { email, name },
      subject: `New contact form submission from ${name}`,
      body: bodyText
    });

    if (!result.ok) return json(result, 502);
    return json({ ok: true }, 200);
  } catch (err) {
    return json({ ok: false, error: String(err) }, 500);
  }
}

// Leadgen pipeline notification — see leadgen/scripts/notify.mjs. Fires one
// email to Connor per newly-published outreach report, with the compiled
// cold-email draft and the target business's contact info included, so
// review-and-send can happen straight from the inbox.
async function handleLeadgenNotify(request, env) {
  try {
    if (request.headers.get('X-Notify-Secret') !== env.LEADGEN_NOTIFY_SECRET) {
      return json({ ok: false, error: 'Unauthorized' }, 401);
    }

    const data = await request.json();
    const { business, keyword, location, rank, reportUrl, clientEmail, clientWebsite, emailSubject, emailBody } = data;

    if (!business || !reportUrl || !emailBody) {
      return json({ ok: false, error: 'Missing required fields' }, 400);
    }

    const bodyText = [
      `New outreach target published.`,
      ``,
      `Business: ${business}`,
      `Keyword / location: ${keyword} / ${location}`,
      `Current rank: #${rank}`,
      `Report page: ${reportUrl}`,
      `Client website: ${clientWebsite || 'unknown'}`,
      `Client email: ${clientEmail || 'NOT FOUND — fill in manually before sending'}`,
      ``,
      `--- Compiled email draft (subject: ${emailSubject}) ---`,
      ``,
      emailBody
    ].join('\n');

    const result = await sendViaMailChannels(env, {
      replyTo: clientEmail ? { email: clientEmail, name: business } : undefined,
      subject: `[Leadgen] ${business} — new target ready (#${rank} for "${keyword}")`,
      body: bodyText
    });

    if (!result.ok) return json(result, 502);
    return json({ ok: true }, 200);
  } catch (err) {
    return json({ ok: false, error: String(err) }, 500);
  }
}

async function sendViaMailChannels(env, { replyTo, subject, body }) {
  const payload = {
    personalizations: [{ to: [{ email: 'connor@universeaiconsulting.com', name: 'Connor' }] }],
    from: { email: 'noreply@universeaiconsulting.com', name: 'UNVRS Website' },
    ...(replyTo ? { reply_to: replyTo } : {}),
    subject,
    content: [{ type: 'text/plain', value: body }]
  };

  const res = await fetch('https://api.mailchannels.net/tx/v1/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Api-Key': env.MAILCHANNELS_API_KEY
    },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    return { ok: false, error: await res.text() };
  }

  const resBody = await res.json();
  const failed = (resBody.results || []).find(r => r.status !== 'sent');
  if (failed) {
    return { ok: false, error: failed.reason || 'Send failed' };
  }

  return { ok: true };
}

function json(obj, status) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}
