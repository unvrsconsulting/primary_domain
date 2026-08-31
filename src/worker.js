export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === '/api/contact' && request.method === 'POST') {
      return handleContact(request);
    }

    return env.ASSETS.fetch(request);
  }
};

async function handleContact(request) {
  try {
    const data = await request.json();
    const { name, email, phone, company, website, services, message } = data;

    if (!name || !email) {
      return json({ ok: false, error: 'Missing required fields' }, 400);
    }

    const servicesList = Array.isArray(services) ? services.join(', ') : (services || 'None selected');

    const bodyText = [
      `Name: ${name}`,
      `Email: ${email}`,
      `Phone: ${phone || 'Not provided'}`,
      `Company: ${company || 'Not provided'}`,
      `Website: ${website || 'Not provided'}`,
      `Interested Services: ${servicesList}`,
      `What they want to automate: ${message || 'Not provided'}`
    ].join('\n');

    const payload = {
      personalizations: [{ to: [{ email: 'connor@universeaiconsulting.com', name: 'Connor' }] }],
      from: { email: 'noreply@universeaiconsulting.com', name: 'UNVRS Website' },
      reply_to: { email, name },
      subject: `New contact form submission from ${name}`,
      content: [{ type: 'text/plain', value: bodyText }]
    };

    const res = await fetch('https://api.mailchannels.net/tx/v1/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const errText = await res.text();
      return json({ ok: false, error: errText }, 502);
    }

    return json({ ok: true }, 200);
  } catch (err) {
    return json({ ok: false, error: String(err) }, 500);
  }
}

function json(obj, status) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}
