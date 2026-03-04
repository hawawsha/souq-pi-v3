export default async function handler(req, res) {
  const { table } = req.query;
  const TOKEN = process.env.AIRTABLE_TOKEN;
  const BASE_ID = process.env.AIRTABLE_BASE_ID;

  try {
    const response = await fetch(
      `https://api.airtable.com/v0/${BASE_ID}/${table}?maxRecords=100`,
      { headers: { Authorization: `Bearer ${TOKEN}` } }
    );
    const data = await response.json();
    res.status(200).json(data);
  } catch (e) {
    res.status(500).json({ error: 'خطأ في الاتصال' });
  }
}
