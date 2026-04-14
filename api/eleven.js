export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { query, sort = 'POPULAR', display = '20' } = req.query;
  if (!query) return res.status(400).json({ error: 'query required' });

  const KEY = '023d870b74927108dc29e45244b4d8cb';

  try {
    // 11번가 API 호출 - UTF-8 인코딩 요청
    const url = `http://openapi.11st.co.kr/openapi/OpenApiService.tmall?key=${KEY}&apiCode=ProductSearch&keyword=${encodeURIComponent(query)}&count=${display}&charset=UTF-8`;

    const response = await fetch(url);
    if (!response.ok) {
      return res.status(response.status).json({ error: `11st API error: ${response.status}` });
    }

    // ArrayBuffer로 받아서 여러 인코딩 시도
    const buffer = await response.arrayBuffer();
    const bytes = new Uint8Array(buffer);

    // UTF-8 먼저 시도
    let xml = '';
    try {
      xml = new TextDecoder('utf-8').decode(bytes);
    } catch(e) {}

    // utf-8으로 파싱 안되면 latin1로 시도 후 한글 복원
    if (!xml.includes('ProductName') && !xml.includes('Product')) {
      try {
        xml = new TextDecoder('iso-8859-1').decode(bytes);
      } catch(e) {}
    }

    // CDATA + 일반 태그 모두 파싱
    function getVal(tag, str) {
      // CDATA 방식: <Tag><![CDATA[value]]></Tag>
      let m = str.match(new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>`, 'i'));
      if (m) return m[1].trim();
      // 일반 방식: <Tag>value</Tag>
      m = str.match(new RegExp(`<${tag}[^>]*>([^<]*)<\\/${tag}>`, 'i'));
      if (m) return m[1].trim();
      return '';
    }

    // Product 블록 추출
    const blocks = [];
    const re = /<Product>([\s\S]*?)<\/Product>/gi;
    let match;
    while ((match = re.exec(xml)) !== null) blocks.push(match[1]);

    if (blocks.length === 0) {
      // 디버깅용 — XML 앞부분 반환
      return res.status(200).json({ 
        items: [], 
        debug: xml.substring(0, 500),
        total: 0 
      });
    }

    const items = blocks.slice(0, parseInt(display)).map(p => {
      const name  = getVal('ProductName', p);
      const price = getVal('ProductPrice', p).replace(/[^0-9]/g, '');
      const img100 = getVal('ProductImage100', p);
      const img   = getVal('ProductImage', p);
      const link  = getVal('DetailPageUrl', p) || getVal('ProductLink', p);
      const brand = getVal('BrandName', p);
      const reviewCount = getVal('ReviewCount', p);
      const rating = getVal('ReviewScore', p);
      const code  = getVal('ProductCode', p);

      // 이미지 URL 정규화
      let imageUrl = img100 || img;
      if (imageUrl && !imageUrl.startsWith('http')) {
        imageUrl = 'https:' + imageUrl;
      }

      // 링크 정규화
      let linkUrl = link;
      if (!linkUrl && code) {
        linkUrl = `https://www.11st.co.kr/products/${code}`;
      }

      return {
        title:       name,
        link:        linkUrl,
        image:       imageUrl,
        lprice:      Number(price) || 0,
        mallName:    '11번가',
        brand:       brand,
        reviewCount: Number(reviewCount) || 0,
        rating:      parseFloat(rating) || 0,
      };
    }).filter(item => item.title); // 제목 없는 항목 제거

    res.status(200).json({ items, total: blocks.length });
  } catch (e) {
    res.status(500).json({ error: e.message, stack: e.stack });
  }
}
// 2026년  4월 14일 화요일 10시 30분 44초 KST
