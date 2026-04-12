export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { query, sort = 'sim', display = '20' } = req.query;
  if (!query) return res.status(400).json({ error: 'query required' });

  try {
    const url = `https://openapi.naver.com/v1/search/shop.json?query=${encodeURIComponent(query)}&display=${display}&sort=${sort}`;
    const response = await fetch(url, {
      headers: {
        'X-Naver-Client-Id': 'N23KX4bD_JBYsIZ3iuqJ',
        'X-Naver-Client-Secret': 'UafocpeeyH'
      }
    });

    if (!response.ok) {
      const err = await response.text();
      return res.status(response.status).json({ error: err });
    }

    const data = await response.json();

    const items = (data.items || []).map(item => {
      // 원본 link 그대로 사용 (스마트스토어/네이버페이 등 실제 상품 링크)
      return {
        title:       item.title.replace(/<[^>]*>/g, ''),
        link:        item.link,  // 원본 링크 그대로
        image:       item.image,
        lprice:      Number(item.lprice) || 0,
        mallName:    item.mallName || '',
        brand:       item.brand || '',
        reviewCount: Number(item.reviewCount) || 0,
        score:       Number(item.score) || 0,
      };
    });

    res.status(200).json({ items, total: data.total });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
