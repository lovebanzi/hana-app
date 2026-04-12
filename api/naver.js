export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { query, sort = 'sim', display = '20' } = req.query;
  if (!query) return res.status(400).json({ error: 'query required' });

  try {
    // 1. 네이버 쇼핑 검색
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

    // 2. 상품별 별점 가져오기 (카탈로그 상품만 가능)
    const items = await Promise.all((data.items || []).map(async (item) => {
      let rating = null;
      let ratingCount = null;
      let directLink = item.link;

      // 스마트스토어 or 카탈로그 링크 생성
      if (item.productId && item.productType === '2') {
        directLink = `https://smartstore.naver.com/main/products/${item.productId}`;
      } else if (item.productId && item.productType === '1') {
        directLink = `https://search.shopping.naver.com/catalog/${item.productId}`;
        // 카탈로그 상품은 별점 API로 조회 가능
        try {
          const catRes = await fetch(
            `https://shopping.naver.com/v1/catalog/${item.productId}/reviews/summary`,
            { headers: { 'User-Agent': 'Mozilla/5.0' } }
          );
          if (catRes.ok) {
            const catData = await catRes.json();
            rating = catData.averageRating || null;
            ratingCount = catData.totalCount || null;
          }
        } catch (e) {}
      }

      return {
        title:       item.title.replace(/<[^>]*>/g, ''),
        link:        directLink,
        image:       item.image,
        lprice:      Number(item.lprice) || 0,
        hprice:      Number(item.hprice) || 0,
        mallName:    item.mallName || '',
        brand:       item.brand || '',
        category:    item.category2 || item.category1 || '',
        reviewCount: Number(item.reviewCount) || 0,
        score:       Number(item.score) || 0,
        rating:      rating,
        ratingCount: ratingCount,
        productId:   item.productId || '',
        productType: item.productType || '',
      };
    }));

    res.status(200).json({ items, total: data.total });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
