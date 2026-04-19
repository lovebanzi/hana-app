export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }

  const { query, sort = 'POPULAR', display = 15 } = req.query;
  
  try {
    const url = `http://openapi.11st.co.kr/openapi/OpenApiService.tmall?key=${process.env.ELEVEN_API_KEY}&apiCode=ProductSearch&keyword=${encodeURIComponent(query)}&sortCd=${sort}&pageSize=${display}`;
    const response = await fetch(url);
    const xml = await response.text();

    // 디버그용 원본 XML 일부 반환 (개발 확인용)
    if (req.query.debug) {
      res.status(200).json({ raw: xml.slice(0, 2000) });
      return;
    }

    const items = [];
    // 11번가 XML 파싱 - 다양한 태그명 시도
    const productRegex = /<Product>([\s\S]*?)<\/Product>|<product>([\s\S]*?)<\/product>/g;
    let match;
    while ((match = productRegex.exec(xml)) !== null) {
      const block = match[1] || match[2];
      const get = (tags) => {
        for (const tag of tags) {
          const m = block.match(new RegExp(`<${tag}><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>|<${tag}>([^<]*)<\\/${tag}>`, 'i'));
          if (m) return (m[1] || m[2] || '').trim();
        }
        return '';
      };
      
      const name = get(['ProductName','productName','PRODUCTNAME','name']);
      const price = get(['price','Price','PRICE','salePrice','SalePrice']);
      const image = get(['ProductImage','productImage','imageUrl','ImageUrl','thumbImage']);
      const link = get(['ProductUrl','productUrl','DetailUrl','detailUrl']);
      const review = get(['ReviewCount','reviewCount','REVIEWCOUNT']);
      const score = get(['ReviewScore','reviewScore','grade','Grade']);

      if (name) {
        items.push({
          productName: name,
          price: price,
          salePrice: price,
          productImage: image,
          reviewCount: review,
          reviewScore: score,
          productUrl: link || `https://search.11st.co.kr/Search.tmall?kwd=${encodeURIComponent(query)}`,
          benefitLabel: '11번가',
        });
      }
    }

    res.status(200).json({ items, total: items.length });
  } catch(e) {
    res.status(500).json({ error: e.message, items: [] });
  }
}
