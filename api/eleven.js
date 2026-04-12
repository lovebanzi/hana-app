export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { query, sort = 'POPULAR', display = '20' } = req.query;
  // sort: POPULAR(인기순) | RECENT(최신순) | CHEAP(낮은가격) | EXPENSIVE(높은가격) | REVIEW(리뷰많은순) | RATING(별점높은순)
  if (!query) return res.status(400).json({ error: 'query required' });

  const KEY = '023d870b74927108dc29e45244b4d8cb';

  try {
    const url = `http://openapi.11st.co.kr/openapi/OpenApiService.tmall?key=${KEY}&apiCode=ProductSearch&keyword=${encodeURIComponent(query)}&count=${display}&sortCd=${sort}`;

    const response = await fetch(url, {
      headers: { 'Accept': '*/*' }
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: 'API error' });
    }

    const xml = await response.text();

    // XML 파싱 (정규식으로 간단히)
    const parseTag = (tag, str) => {
      const matches = [];
      const re = new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`, 'gi');
      let m;
      while ((m = re.exec(str)) !== null) matches.push(m[1].trim());
      return matches;
    };

    const products = parseTag('Product', xml);

    const items = products.slice(0, parseInt(display)).map(p => {
      const get = (tag) => {
        const m = p.match(new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`, 'i'));
        return m ? m[1].replace(/<[^>]*>/g, '').trim() : '';
      };
      return {
        title:       get('ProductName'),
        link:        get('ProductLink') || `https://www.11st.co.kr/search/Search.tmall?kwd=${encodeURIComponent(query)}`,
        image:       get('ProductImage'),
        lprice:      Number(get('ProductPrice').replace(/[^0-9]/g, '')) || 0,
        mallName:    '11번가',
        brand:       get('BrandName') || '',
        reviewCount: Number(get('ReviewCount')) || 0,
        rating:      parseFloat(get('ReviewScore')) || 0,
        seller:      get('SellerNick') || '',
      };
    });

    res.status(200).json({ items, total: items.length });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
