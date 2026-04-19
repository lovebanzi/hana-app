import iconv from 'iconv-lite';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }

  const { query, sort = 'POPULAR', display = 15 } = req.query;
  
  try {
    const url = `http://openapi.11st.co.kr/openapi/OpenApiService.tmall?key=${process.env.ELEVEN_API_KEY}&apiCode=ProductSearch&keyword=${encodeURIComponent(query)}&sortCd=${sort}&pageSize=${display}`;
    
    const response = await fetch(url);
    const buffer = Buffer.from(await response.arrayBuffer());
    // EUC-KR → UTF-8 변환
    const xml = iconv.decode(buffer, 'euc-kr');

    const items = [];
    const productRegex = /<Product>([\s\S]*?)<\/Product>/g;
    let match;

    while ((match = productRegex.exec(xml)) !== null) {
      const block = match[1];
      
      const get = (tag) => {
        const re = new RegExp(`<${tag}>(?:<!\\[CDATA\\[([\\s\\S]*?)\\]\\]>|([^<]*))<\\/${tag}>`, 'i');
        const m = block.match(re);
        return (m ? (m[1] || m[2] || '') : '').trim();
      };

      const imgMatch = block.match(/<ProductImage100>(?:<!\[CDATA\[([\s\S]*?)\]\]>|([^<]*))<\/ProductImage100>/i);
      const image = imgMatch ? (imgMatch[1] || imgMatch[2] || '').trim() : '';

      const name   = get('ProductName');
      const price  = get('ProductPrice');
      const link   = get('ProductDetailUrl') || get('ProductUrl');
      const review = get('ReviewCount');
      const score  = get('ReviewScore');

      if (name && price) {
        items.push({
          productName:  name,
          price:        price,
          salePrice:    price,
          productImage: image,
          reviewCount:  review || '0',
          reviewScore:  score  || '0',
          productUrl:   link || `https://search.11st.co.kr/Search.tmall?kwd=${encodeURIComponent(query)}`,
          benefitLabel: '11번가',
        });
      }
    }

    res.status(200).json({ items, total: items.length });
  } catch(e) {
    res.status(500).json({ error: e.message, items: [] });
  }
}
