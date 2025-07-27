exports.handler = async (event) => {
  // Only allow POST requests.
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' }),
      headers: { 'Content-Type': 'application/json' },
    };
  }

  const { WHATSAPP_JOIN_LINK } = process.env;

  if (!WHATSAPP_JOIN_LINK) {
    console.error('WHATSAPP_JOIN_LINK environment variable is not set.');
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Server configuration error: WhatsApp link not available.' }),
      headers: { 'Content-Type': 'application/json' },
    };
  }

  const params = new URLSearchParams(event.body);
  const accepted = params.get('test-accept');

  if (accepted !== '1') {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'You must agree to the Code of Conduct to join.' }),
      headers: { 'Content-Type': 'application/json' },
    };
  }

  // The request is valid, return the join link.
  return {
    statusCode: 200,
    body: JSON.stringify({ link: WHATSAPP_JOIN_LINK }),
    headers: { 'Content-Type': 'application/json' },
  };
};
