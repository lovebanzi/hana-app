export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  
  const { query } = req.query;
  if (!query) return res.status(400).json({ error: 'query required' });

  try {
    const response = await fetch(
      `https://openapi.naver.com/v1/search/shop.json?query=${encodeURIComponent(query)}&display=10&sort=sim`,
      {
        headers: {
          'X-Naver-Client-Id': 'N23KX4bD_JBYsIZ3iuqJ',
          'X-Naver-Client-Secret': 'UafocpeeyH'
        }
      }
    );
    const data = await response.json();
    res.status(200).json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
