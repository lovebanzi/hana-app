export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { query, sort = 'sim', display = '20' } = req.query;
  if (!query) return res.status(400).json({ error: 'query required' });

  try {
    // 1. 네이버 쇼핑 검색
    const searchRes = await fetch(
      `https://openapi.naver.com/v1/search/shop.json?query=${encodeURIComponent(query)}&display=${display}&sort=${sort}`,
      { headers: { 'X-Naver-Client-Id': 'N23KX4bD_JBYsIZ3iuqJ', 'X-Naver-Client-Secret': 'UafocpeeyH' } }
    );
    if (!searchRes.ok) return res.status(searchRes.status).json({ error: await searchRes.text() });
    const data = await searchRes.json();

    // 2. 상위 10개 상품 별점/리뷰 가져오기
    const items = await Promise.all((data.items || []).slice(0, 20).map(async (item, idx) => {
      let rating = null;
      let reviewCount = null;
      let purchaseCount = null;

      // 상위 8개만 스크래핑 시도
      if (idx < 8 && item.link) {
        try {
          const pageRes = await fetch(item.link, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1',
              'Accept': 'text/html,application/xhtml+xml',
              'Accept-Language': 'ko-KR,ko;q=0.9',
              'Referer': 'https://shopping.naver.com',
            },
            signal: AbortSignal.timeout(4000)
          });

          if (pageRes.ok) {
            const html = await pageRes.text();

            // 별점 파싱 (여러 패턴 시도)
            const ratingPatterns = [
              /"averageRating"\s*:\s*"?([\d.]+)"?/,
              /"starScore"\s*:\s*"?([\d.]+)"?/,
              /class="[^"]*rating[^"]*"[^>]*>\s*([\d.]+)/,
              /"grade"\s*:\s*"?([\d.]+)"?/,
              /별점\s*:\s*([\d.]+)/,
              /"score"\s*:\s*"?([\d.]+)"?.*?"review"/,
            ];
            for (const pattern of ratingPatterns) {
              const m = html.match(pattern);
              if (m && parseFloat(m[1]) > 0 && parseFloat(m[1]) <= 5) {
                rating = parseFloat(m[1]);
                break;
              }
            }

            // 리뷰수 파싱
            const reviewPatterns = [
              /"reviewCount"\s*:\s*(\d+)/,
              /"totalReviewCount"\s*:\s*(\d+)/,
              /"reviewAmount"\s*:\s*(\d+)/,
              /리뷰\s*(\d[\d,]+)/,
            ];
            for (const pattern of reviewPatterns) {
              const m = html.match(pattern);
              if (m) { reviewCount = parseInt(m[1].replace(/,/g,'')); break; }
            }

            // 구매수 파싱
            const purchasePatterns = [
              /"purchaseCount"\s*:\s*(\d+)/,
              /"buyCount"\s*:\s*(\d+)/,
              /"soldCount"\s*:\s*(\d+)/,
              /구매\s*(\d[\d,]+)/,
            ];
            for (const pattern of purchasePatterns) {
              const m = html.match(pattern);
              if (m) { purchaseCount = parseInt(m[1].replace(/,/g,'')); break; }
            }
          }
        } catch (e) { /* 타임아웃 무시 */ }
      }

      return {
        title:         item.title.replace(/<[^>]*>/g, ''),
        link:          item.link,
        image:         item.image,
        lprice:        Number(item.lprice) || 0,
        mallName:      item.mallName || '',
        brand:         item.brand || '',
        reviewCount:   reviewCount || Number(item.reviewCount) || null,
        score:         Number(item.score) || 0,
        rating:        rating,
        purchaseCount: purchaseCount,
      };
    }));

    res.status(200).json({ items, total: data.total });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
