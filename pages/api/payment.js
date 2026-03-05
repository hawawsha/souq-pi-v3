export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { action, paymentId, txid } = req.body;
  const PI_API_KEY = process.env.PI_API_KEY;

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
      return res.status(200).json(data);
    }

    res.status(400).json({ error: 'Invalid action' });
  } catch(e) {
    res.status(500).json({ error: 'خطأ في الدفع' });
  }
}
