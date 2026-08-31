export async function onRequestPost(context) {
  try {
    const data = await context.request.json();
    const { name, email, phone, company, website, services, message } = data;

    if (!name || !email) {
      return new Response(JSON.stringify({ ok: false, error: 'Missing required fields' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
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
      from: { email: 'noreply@unvrs.co', name: 'UNVRS Website' },
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
      return new Response(JSON.stringify({ ok: false, error: errText }), {
        status: 502,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    return new Response(JSON.stringify({ ok: false, error: String(err) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
