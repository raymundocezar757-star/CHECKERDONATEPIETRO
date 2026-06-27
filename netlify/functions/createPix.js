exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const data = JSON.parse(event.body);
    const { amount, customer, item, utm } = data;

    // Use environment variable for security, or fallback to a hardcoded test value during development
    // (In production, the user must set DUTTYFY_PIX_URL_ENCRYPTED in Netlify)
    const DUTTYFY_URL = process.env.DUTTYFY_PIX_URL_ENCRYPTED || 'https://www.pagamentos-seguros.app/api-pix/0ysKKO3kjUE6Q7lL55NZp1C0cRveaRdfhhoS2Eksi3jNmp0tTSkDd_JAhJemmunV-4Fo14kc8MpEEOoITNK10w';

    const payload = {
      amount: parseInt(amount, 10),
      customer: {
        name: customer.name || 'Doador Anônimo',
        document: (customer.document || '00000000000').replace(/\D/g, ''),
        email: customer.email || 'doador@exemplo.com',
        phone: (customer.phone || '11999999999').replace(/\D/g, '')
      },
      item: {
        title: item.title || 'Doação Pietro',
        price: parseInt(amount, 10),
        quantity: 1
      },
      paymentMethod: 'PIX',
      utm: utm || ''
    };

    const fetch = (await import('node-fetch')).default;
    
    // Call Duttyfy API
    const response = await fetch(DUTTYFY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('Duttyfy Error:', err);
      return { statusCode: response.status, body: JSON.stringify({ error: 'Erro no gateway de pagamento' }) };
    }

    const result = await response.json();
    
    // Here we should persist transactionId in Supabase if we have the Supabase keys in env vars
    // For now, we return it to the frontend.
    
    return {
      statusCode: 200,
      body: JSON.stringify(result)
    };

  } catch (error) {
    console.error('Function Error:', error);
    return { statusCode: 500, body: JSON.stringify({ error: 'Internal Server Error' }) };
  }
};
