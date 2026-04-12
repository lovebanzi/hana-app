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

    // 2. 각 상품 별점/리뷰 스크래핑 (상위 5개만 - 속도 위해)
    const items = await Promise.all((data.items || []).slice(0, 20).map(async (item, idx) => {
      let rating = null;
      let reviewCount = Number(item.reviewCount) || 0;

      // 스마트스토어 상품만 스크래핑 시도 (상위 5개만)
      if (idx < 5 && item.link && item.link.includes('smartstore.naver.com')) {
        try {
          const pageRes = await fetch(item.link, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
              'Accept': 'text/html',
            },
            signal: AbortSignal.timeout(3000)
          });
          if (pageRes.ok) {
            const html = await pageRes.text();
            // 별점 파싱
            const ratingMatch = html.match(/"averageRating"\s*:\s*"?([\d.]+)"?/) ||
                               html.match(/별점\s*([\d.]+)/) ||
                               html.match(/"starScore"\s*:\s*([\d.]+)/);
            if (ratingMatch) rating = parseFloat(ratingMatch[1]);

            // 리뷰수 파싱
            const reviewMatch = html.match(/"reviewCount"\s*:\s*(\d+)/) ||
                               html.match(/"totalReviewCount"\s*:\s*(\d+)/);
            if (reviewMatch && !reviewCount) reviewCount = parseInt(reviewMatch[1]);
          }
        } catch (e) {
          // 타임아웃이나 에러시 그냥 넘어감
        }
      }

      return {
        title:       item.title.replace(/<[^>]*>/g, ''),
        link:        item.link,
        image:       item.image,
        lprice:      Number(item.lprice) || 0,
        mallName:    item.mallName || '',
        brand:       item.brand || '',
        reviewCount: reviewCount,
        score:       Number(item.score) || 0,
        rating:      rating,
      };
    }));

    res.status(200).json({ items, total: data.total });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
