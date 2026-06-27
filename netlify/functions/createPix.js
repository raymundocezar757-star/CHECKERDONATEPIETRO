exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const data = JSON.parse(event.body);
    const { amount, customer, item, utm } = data;

    // Use environment variable for security
    const DUTTYFY_URL = process.env.DUTTYFY_PIX_URL_ENCRYPTED;

    // Se não tiver URL real da Duttyfy no Netlify, retornar um MOCK (Teste)
    if (!DUTTYFY_URL) {
      console.log('Modo Teste: Retornando PIX simulado porque a chave da Duttyfy não está configurada.');
      return {
        statusCode: 200,
        body: JSON.stringify({
          transactionId: 'txn_teste_' + Date.now(),
          pixCode: '00020126580014br.gov.bcb.pix013665377971000109520400005303986540510.005802BR5925Ajuda Solidaria6009Sao Paulo62070503***63041A2B', // Exemplo de payload pix copia e cola
          qrCodeImage: 'base64...'
        })
      };
    }

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
