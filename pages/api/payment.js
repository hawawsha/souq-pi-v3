export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { action, paymentId, txid } = req.body;
  const PI_API_KEY = process.env.PI_API_KEY;

  if (!PI_API_KEY) return res.status(500).json({ error: 'PI_API_KEY missing' });
  if (!paymentId) return res.status(400).json({ error: 'paymentId missing' });

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
      console.log('Approve response:', data);
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
      console.log('Complete response:', data);
      return res.status(200).json(data);
    }

    res.status(400).json({ error: 'Invalid action' });
  } catch(e) {
    console.error('Payment error:', e);
    res.status(500).json({ error: e.message });
  }
