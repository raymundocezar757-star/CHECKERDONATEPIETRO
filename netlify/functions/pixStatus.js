exports.handler = async (event, context) => {
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { transactionId } = event.queryStringParameters;
    if (!transactionId) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Missing transactionId' }) };
    }

    const DUTTYFY_URL = process.env.DUTTYFY_PIX_URL_ENCRYPTED || 'https://www.pagamentos-seguros.app/api-pix/0ysKKO3kjUE6Q7lL55NZp1C0cRveaRdfhhoS2Eksi3jNmp0tTSkDd_JAhJemmunV-4Fo14kc8MpEEOoITNK10w';

    const fetch = (await import('node-fetch')).default;
    
    // Call Duttyfy API Status
    const response = await fetch(`${DUTTYFY_URL}?transactionId=${encodeURIComponent(transactionId)}`);

    if (!response.ok) {
      const err = await response.text();
      console.error('Duttyfy Status Error:', err);
      return { statusCode: response.status, body: JSON.stringify({ error: 'Erro ao consultar status' }) };
    }

    const result = await response.json();
    
    return {
      statusCode: 200,
      body: JSON.stringify(result)
    };

  } catch (error) {
    console.error('Function Error:', error);
    return { statusCode: 500, body: JSON.stringify({ error: 'Internal Server Error' }) };
  }
};
