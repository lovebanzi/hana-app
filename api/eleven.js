export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { query, sort = 'POPULAR', display = '20' } = req.query;
  if (!query) return res.status(400).json({ error: 'query required' });

  const KEY = '023d870b74927108dc29e45244b4d8cb';

  try {
    const url = `http://openapi.11st.co.kr/openapi/OpenApiService.tmall?key=${KEY}&apiCode=ProductSearch&keyword=${encodeURIComponent(query)}&count=${display}&charset=UTF-8`;

    const response = await fetch(url, {
      headers: { 'Accept': '*/*' }
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: `11st error: ${response.status}` });
    }

    const buffer = await response.arrayBuffer();

    // EUC-KR 디코딩
    let xml = '';
    const encodings = ['utf-8', 'euc-kr', 'iso-8859-1'];
    for (const enc of encodings) {
      try {
        const decoded = new TextDecoder(enc).decode(new Uint8Array(buffer));
        if (decoded.includes('ProductName') || decoded.includes('Product')) {
          xml = decoded;
          break;
        }
      } catch(e) {}
    }

    if (!xml) {
      return res.status(500).json({ error: 'decode failed', items: [] });
    }

    // CDATA 포함 파싱
    function getVal(tag, str) {
      let m = str.match(new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>`, 'i'));
      if (m) return m[1].trim();
      m = str.match(new RegExp(`<${tag}[^>]*>([^<]*)<\\/${tag}>`, 'i'));
      if (m) return m[1].trim();
      return '';
    }

    // Product 블록 추출
    const blocks = [];
    const re = /<Product>([\s\S]*?)<\/Product>/gi;
    let match;
    while ((match = re.exec(xml)) !== null) blocks.push(match[1]);

    const items = blocks.slice(0, parseInt(display)).map(p => {
      const name = getVal('ProductName', p);
      if (!name) return null;

      const price = getVal('ProductPrice', p).replace(/[^0-9]/g, '');
      const img = getVal('ProductImage100', p) || getVal('ProductImage', p);
      const link = getVal('DetailPageUrl', p) || getVal('ProductLink', p);
      const code = getVal('ProductCode', p);

      return {
        title:       name,
        link:        link || `https://www.11st.co.kr/products/${code}`,
        image:       img ? (img.startsWith('http') ? img : 'https:' + img) : '',
        lprice:      Number(price) || 0,
        mallName:    '11번가',
        brand:       getVal('BrandName', p),
        reviewCount: Number(getVal('ReviewCount', p)) || 0,
        rating:      parseFloat(getVal('ReviewScore', p)) || 0,
      };
    }).filter(Boolean);

    res.status(200).json({ items, total: blocks.length });
  } catch (e) {
    res.status(500).json({ error: e.message, items: [] });
  }
}
