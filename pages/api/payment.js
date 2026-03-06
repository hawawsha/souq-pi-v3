default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { action, paymentId, txid } = req.body;
  const PI_API_KEY = process.env.PI_API_KEY;

  console.log('=== Payment Request ===');
  console.log('action:', action);
  console.log('paymentId:', paymentId);
  console.log('PI_API_KEY exists:', !!PI_API_KEY);

  if (!PI_API_KEY) return res.status(500).json({ error: 'PI_API_KEY missing' });
  if (!paymentId) return res.status(400).json({ error: 'paymentId missing' });

  try {
    if (action === 'approve') {
      const url = `https://api.minepi.com/v2/payments/${paymentId}/approve`;
      console.log('Calling:', url);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${PI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      });
      
      const text = await response.text();
      console.log('Pi response status:', response.status);
      console.log('Pi response body:', text);
      
      return res.status(200).json({ status: response.status, body: text });
    }

    if (action === 'complete') {
      const url = `https://api.minepi.com/v2/payments/${paymentId}/complete`;
      console.log('Calling:', url);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${PI_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ txid })
      });
      
      const text = await response.text();
      console.log('Pi response status:', response.status);
      console.log('Pi response body:', text);
      
      return res.status(200).json({ status: response.status, body: text });
    }

    res.status(400).json({ error: 'Invalid action' });
  } catch(e) {
    console.error('Error:', e.message);
    res.status(500).json({ error: e.message });
  }
}
