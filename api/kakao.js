export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }
  const { query, display = 10 } = req.query;
  try {
    const url = `https://dapi.kakao.com/v2/search/shopping?query=${encodeURIComponent(query)}&size=${display}`;
    const r = await fetch(url, { headers: { 'Authorization': `KakaoAK ${process.env.KAKAO_API_KEY}` } });
    const data = await r.json();
    const items = (data.documents || []).map(d => ({
      title: (d.product_name||'').replace(/<[^>]+>/g,''),
      link: d.product_url||'',
      image: d.thumbnail||'',
      lprice: parseInt(d.price)||0,
      mallName: d.mall_name||'카카오',
      brand: d.brand||'',
      rating: 0, reviewCount: 0,
    }));
    res.status(200).json({ items, total: items.length, debug: data.meta });
  } catch(e) { res.status(500).json({ error: e.message, items: [] }); }
}
