export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { action, paymentId, txid } = req.body;
  const PI_API_KEY = process.env.PI_API_KEY;

  if (!PI_API_KEY) return res.status(500).json({ error: 'PI_API_KEY missing' });

  try {
    if (action === 'approve') {
      const response = await fetch(
        `https://api.minepi.com/v2/payments/${paymentId}/approve`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Key ${PI_API_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );
      const data = await response.json();
      console.log('Approve:', JSON.stringify(data));
      return res.status(200).json(data);
    }

    if (action === 'complete') {
      const response = await fetch(
        `https://api.minepi.com/v2/payments/${paymentId}/complete`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Key ${PI_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ txid })
        }
      );
      const data = await response.json();
      console.log('Complete:', JSON.stringify(data));
      return res.status(200).json(data);
    }

  } catch(e) {
    console.error('Error:', e.message);
    res.status(500).json({ error: e.message });
  }
}
