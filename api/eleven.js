export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const { query, sort = 'POPULAR', display = 15 } = req.query;
  const response = await fetch(
    `http://openapi.11st.co.kr/openapi/OpenApiService.tmall?key=${process.env.ELEVEN_API_KEY}&apiCode=ProductSearch&keyword=${encodeURIComponent(query)}&sortCd=${sort}&pageSize=${display}`,
    { headers: { 'Accept': 'application/xml' } }
  );
  const xml = await response.text();
  const items = [];
  const matches = xml.matchAll(/<product>([\s\S]*?)<\/product>/g);
  for(const m of matches){
    const get = (tag) => m[1].match(new RegExp(`<${tag}>(.*?)<\/${tag}>`))?.[1]||'';
    items.push({
      productName: get('productName'),
      price: get('price'),
      salePrice: get('salePrice'),
      productImage: get('productImage'),
      reviewScore: get('reviewScore'),
      reviewCount: get('reviewCount'),
      productUrl: get('productUrl'),
      benefitLabel: get('benefitLabel'),
    });
  }
  res.status(200).json({ items });
}
