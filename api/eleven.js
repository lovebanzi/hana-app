export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { query, sort = 'POPULAR', display = '20' } = req.query;
  if (!query) return res.status(400).json({ error: 'query required' });

  const KEY = '023d870b74927108dc29e45244b4d8cb';

  try {
    const url = `http://openapi.11st.co.kr/openapi/OpenApiService.tmall?key=${KEY}&apiCode=ProductSearch&keyword=${encodeURIComponent(query)}&count=${display}`;

    const response = await fetch(url);
    if (!response.ok) return res.status(response.status).json({ error: 'API error' });

    // 11번가 API는 EUC-KR로 응답 → ArrayBuffer로 받아서 변환
    const buffer = await response.arrayBuffer();
    const decoder = new TextDecoder('euc-kr');
    const xml = decoder.decode(buffer);

    // CDATA 포함 태그 파싱
    const getTag = (tag, str) => {
      const m = str.match(new RegExp(`<${tag}[^>]*>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?<\\/${tag}>`, 'i'));
      return m ? m[1].trim() : '';
    };

    // Product 블록 분리
    const productBlocks = [];
    const re = /<Product>([\s\S]*?)<\/Product>/gi;
    let match;
    while ((match = re.exec(xml)) !== null) {
      productBlocks.push(match[1]);
    }

    const items = productBlocks.slice(0, parseInt(display)).map(p => {
      const name = getTag('ProductName', p);
      const price = getTag('ProductPrice', p).replace(/[^0-9]/g, '');
      const image = getTag('ProductImage100', p) || getTag('ProductImage', p);
      const link = getTag('DetailPageUrl', p) || getTag('ProductLink', p);
      const brand = getTag('BrandName', p);
      const reviewCount = getTag('ReviewCount', p);
      const rating = getTag('ReviewScore', p);
      const productCode = getTag('ProductCode', p);

      return {
        title:       name,
        link:        link || `https://www.11st.co.kr/products/${productCode}`,
        image:       image.startsWith('http') ? image : `https:${image}`,
        lprice:      Number(price) || 0,
        mallName:    '11번가',
        brand:       brand,
        reviewCount: Number(reviewCount) || 0,
        rating:      parseFloat(rating) || 0,
        productCode: productCode,
      };
    });

    res.status(200).json({ items, total: productBlocks.length });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
