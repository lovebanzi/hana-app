export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }
  const { query, sort = 'accuracy', display = 10 } = req.query;
  if (!query) { res.status(400).json({ error: 'query required', items: [] }); return; }
  try {
    const url = `https://dapi.kakao.com/v2/search/shopping?query=${encodeURIComponent(query)}&sort=${sort}&size=${display}`;
    const response = await fetch(url, {
      headers: { 'Authorization': `KakaoAK ${process.env.KAKAO_API_KEY}` }
    });
    const data = await response.json();
    const items = (data.documents || []).map(item => ({
      title: (item.product_name || '').replace(/<[^>]+>/g, ''),
      link: item.product_url || '',
      image: item.thumbnail || '',
      lprice: parseInt(item.price) || 0,
      mallName: item.mall_name || '카카오',
      brand: item.brand || '',
      rating: 0,
      reviewCount: 0,
    }));
    res.status(200).json({ items, total: items.length });
  } catch (e) {
    res.status(500).json({ error: e.message, items: [] });
  }
}
