import { useState, useMemo, useEffect } from "react";

/* ═══════ COLORS ═══════ */
const P="tomato",G="#FFB347",BG="#FFF8F2",CA="#fff",BO="#FFE0C8",TX="#2D1B12",MU="#B09080";
const MINT="#4ECDC4",LAVEN="#C3A8F0",SKY="#74C0FC",PINK="#FF85A1";

/* ═══════ UTILITY ═══════ */
function calcMonth(b){
  if(!b)return null;
  const born=new Date(b),now=new Date();
  let m=(now.getFullYear()-born.getFullYear())*12+(now.getMonth()-born.getMonth());
  if(now.getDate()<born.getDate())m--;
  return Math.max(0,Math.min(12,m));
}

/* ═══════════════════════════════════════════════════════════
   5개 쇼핑몰 (무신사·이베이 제거)
   ─ 실제 서비스시 각 API 키를 서버에서 관리하세요
   ─ 쿠팡 파트너스: https://partners.coupang.com
   ─ 네이버 쇼핑: https://developers.naver.com/docs/serviceapi/search/shopping
   ─ 11번가: https://openapi.11st.co.kr
   ─ 지마켓/옥션: https://developers.auction.co.kr
   ─ 알리: https://portals.aliexpress.com/affiportals/web
   ─ 아마존: https://affiliate-program.amazon.com/home/productlinks
   ─ 올리브영: 자사몰 (별도 제휴 문의)
═══════════════════════════════════════════════════════════ */
const SHOPS = {
  쿠팡:     {url:"https://www.coupang.com/np/search?q=",            color:"#FF5733",flag:"🇰🇷"},
  네이버:   {url:"https://search.shopping.naver.com/search/all?query=",color:"#03C75A",flag:"🇰🇷"},
  "11번가": {url:"https://www.11st.co.kr/search/Search.tmall?kwd=", color:"#E60000",flag:"🇰🇷"},
  아마존:   {url:"https://www.amazon.com/s?k=",                     color:"#FF9900",flag:"🌎"},
  알리:     {url:"https://www.aliexpress.com/wholesale?SearchText=", color:"#FF4747",flag:"🌏"},
};
const SHOP_NAMES = Object.keys(SHOPS);

/* ── API 설정 ── */
const NAVER_CLIENT_ID = "N23KX4bD_JBYsIZ3iuqJ";
const NAVER_SECRET    = "UafocpeeyH";
const COUPANG_AF_ID   = "AF0796578";

/* ── 네이버 쇼핑 API 호출 (Vercel 서버리스 경유) ── */
async function fetchNaver(keyword, sort="sim", display=5){
  try{
    const res=await fetch(`/api/naver?query=${encodeURIComponent(keyword)}&sort=${sort}&display=${display}`);
    if(!res.ok)return null;
    const data=await res.json();
    return data.items||[];
  }catch(e){return null;}
}

/* 네이버 가격 캐시 (같은 키워드 중복 호출 방지) */
const naverCache={};
async function getNaverPrice(keyword){
  if(naverCache[keyword])return naverCache[keyword];
  const items=await fetchNaver(keyword,"sim",3);
  if(!items||!items.length)return null;
  const best=items[0]; // 첫번째 = 가장 관련도 높은 상품
  const result={
    lprice:      Math.min(...items.map(i=>i.lprice).filter(p=>p>0)),
    mallName:    best.mallName,
    link:        best.link,
    image:       best.image,
    reviewCount: best.reviewCount,
  };
  naverCache[keyword]=result;
  return result;
}

/* 네이버 실시간 가격 훅 */
function useNaverPrice(name){
  const [data,setData]=useState(null);
  const [loading,setLoading]=useState(false);
  useEffect(()=>{
    if(!name)return;
    setLoading(true);
    getNaverPrice(name).then(d=>{setData(d);setLoading(false);});
  },[name]);
  return {data,loading};
}

/* ── 11번가 API 호출 ── */
async function fetchEleven(keyword, sort="POPULAR", display=20){
  try{
    const res=await fetch(`/api/eleven?query=${encodeURIComponent(keyword)}&sort=${sort}&display=${display}`);
    if(!res.ok)return null;
    const data=await res.json();
    return data.items||[];
  }catch(e){return null;}
}

/* 11번가 sort 매핑 */
// POPULAR=인기순, REVIEW=리뷰순, RATING=별점순, CHEAP=낮은가격
function useNaverSort(keyword, sort){
  const [items,setItems]=useState([]);
  const [loading,setLoading]=useState(false);
  useEffect(()=>{
    if(!keyword)return;
    setLoading(true);
    // 네이버 sort: sim=관련순, asc=가격낮은순, dsc=가격높은순
    // 판매순/리뷰순은 score 필드로 정렬
    fetchNaver(keyword, sort==="price_asc"?"asc":sort==="price_desc"?"dsc":"sim", 10)
      .then(data=>{
        if(!data){setLoading(false);return;}
        let sorted=[...data];
        if(sort==="reviews") sorted.sort((a,b)=>b.reviewCount-a.reviewCount);
        if(sort==="sales")   sorted.sort((a,b)=>b.score-a.score);
        setItems(sorted);
        setLoading(false);
      });
  },[keyword,sort]);
  return {items,loading};
}

/* 검색 함수 (하위 호환) */
async function searchNaver(keyword){
  return fetchNaver(keyword,"sim",10);
}

function goShop(name,kw){
  const s=SHOPS[name]||SHOPS["쿠팡"];
  window.open(s.url+encodeURIComponent(kw),"_blank");
}

/* 검색 결과 컴포넌트 */
/* 네이버 실시간 가격 뱃지 컴포넌트 */
function NaverPriceTag({name}){
  const {data,loading}=useNaverPrice(name);
  if(loading)return <span style={{fontSize:9,color:"#aaa"}}>가격 조회중...</span>;
  if(!data||!data.lprice)return null;
  return(
    <span style={{display:"inline-flex",alignItems:"center",gap:3,background:"#E8F5E9",borderRadius:5,padding:"2px 6px"}}>
      <span style={{fontSize:9,color:"#2E7D32",fontWeight:800}}>N</span>
      <span style={{fontSize:10,fontWeight:900,color:"#2E7D32"}}>{data.lprice.toLocaleString()}원~</span>
      <span style={{fontSize:8,color:"#888"}}>{data.mallName}</span>
    </span>
  );
}

/* 네이버 정렬 검색 결과 컴포넌트 */
function NaverSortedList({keyword, sort}){
  const {items,loading}=useNaverSort(keyword, sort);
  if(loading)return <div style={{textAlign:"center",padding:"20px 0",color:"#aaa",fontSize:12}}>네이버에서 불러오는 중...</div>;
  if(!items.length)return null;
  return(
    <div>
      <div style={{fontSize:10,color:"#888",marginBottom:6,fontWeight:600}}>네이버 쇼핑 실시간</div>
      <div style={{display:"flex",flexDirection:"column",gap:6}}>
        {items.map((item,i)=>(
          <div key={i} style={{background:"#E8F5E9",borderRadius:10,padding:"9px 12px",display:"flex",alignItems:"center",gap:8,border:"1px solid #C8E6C9"}}>
            {item.image&&<img src={item.image} alt={item.title} style={{width:40,height:40,borderRadius:6,objectFit:"cover",flexShrink:0}} onError={e=>e.target.style.display="none"}/>}
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:11,fontWeight:700,color:"#1A1A1A",lineHeight:1.3,overflow:"hidden",whiteSpace:"nowrap",textOverflow:"ellipsis"}}>{item.title}</div>
              <div style={{fontSize:9,color:"#888"}}>{item.mallName} · 리뷰 {item.reviewCount?.toLocaleString()}</div>
            </div>
            <div style={{textAlign:"right",flexShrink:0}}>
              <div style={{fontSize:12,fontWeight:900,color:"#2E7D32"}}>{item.lprice?.toLocaleString()}원</div>
              <button onClick={()=>window.open(item.link,"_blank")} style={{background:"#03C75A",color:"#fff",border:"none",borderRadius:6,padding:"3px 8px",fontSize:9,fontWeight:800,cursor:"pointer",marginTop:2}}>네이버</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SearchResults({q,onClose}){
  const [results,setResults]=useState([]);
  const [loading,setLoading]=useState(true);
  const [tab,setTab]=useState("내부");

  // 내부 DB 검색
  const allProds=useMemo(()=>{
    const seen=new Set();
    return Object.values(PRODUCTS).flat().filter(p=>{
      if(seen.has(p.name))return false;
      seen.add(p.name);
      return true;
    });
  },[]);

  const internalResults=useMemo(()=>{
    if(!q)return[];
    const kw=q.toLowerCase();
    return allProds.filter(p=>
      p.name.toLowerCase().includes(kw)||
      p.brand?.toLowerCase().includes(kw)||
      p.cat?.toLowerCase().includes(kw)||
      p.why?.toLowerCase().includes(kw)
    ).sort((a,b)=>b.score-a.score);
  },[q,allProds]);

  useEffect(()=>{
    if(tab!=="네이버")return;
    setLoading(true);
    searchNaver(q).then(items=>{
      setResults(items||[]);
      setLoading(false);
    });
  },[q,tab]);

  return(
    <div style={{position:"fixed",inset:0,zIndex:800,background:"#fff",display:"flex",flexDirection:"column"}}>
      {/* 헤더 */}
      <div style={{padding:"12px 14px",borderBottom:"1px solid #EEE8E0",display:"flex",alignItems:"center",gap:10,background:"#fff"}}>
        <button onClick={onClose} style={{background:"none",border:"none",fontSize:20,cursor:"pointer",color:"#888",padding:0}}>←</button>
        <div style={{flex:1,fontSize:15,fontWeight:900,color:"#1A1A1A"}}>"{q}" 검색 결과</div>
      </div>

      {/* 탭 */}
      <div style={{display:"flex",borderBottom:"1px solid #EEE8E0",background:"#fff"}}>
        {["내부","네이버"].map(t=>(
          <button key={t} onClick={()=>setTab(t)} style={{flex:1,padding:"10px",background:"none",border:"none",borderBottom:tab===t?"2.5px solid #FF7043":"2.5px solid transparent",color:tab===t?"#FF7043":"#888",fontWeight:tab===t?900:600,fontSize:12,cursor:"pointer"}}>
            {t==="내부"?`HANA DB (${internalResults.length}건)`:"네이버 쇼핑"}
          </button>
        ))}
      </div>

      <div style={{overflowY:"auto",flex:1,padding:"10px 14px 24px",background:"#FAFAFA"}}>
        {/* 내부 DB 결과 */}
        {tab==="내부"&&(
          internalResults.length===0
          ?<div style={{textAlign:"center",padding:"48px 0",color:"#aaa"}}>검색 결과가 없어요<br/>네이버 쇼핑에서 찾아보세요</div>
          :<div style={{display:"flex",flexDirection:"column",gap:8}}>
            {internalResults.map(p=>{
              const mp=Math.min(...SHOP_NAMES.map(s=>(p.shopPrices||mkPrices(p.price))[s]||p.price));
              const cs=SHOP_NAMES.reduce((a,s)=>((p.shopPrices||mkPrices(p.price))[s]||p.price)<((p.shopPrices||mkPrices(p.price))[a]||p.price)?s:a,SHOP_NAMES[0]);
              return(
                <div key={p.id} style={{background:"#fff",borderRadius:12,padding:"12px 14px",border:"1px solid #EEE8E0"}}>
                  <div style={{display:"flex",alignItems:"center",gap:10}}>
                    <div style={{flex:1}}>
                      <div style={{fontSize:9,color:"#FF7043",fontWeight:800,marginBottom:2}}>{p.cat}</div>
                      <div style={{fontSize:14,fontWeight:900,color:"#1A1A1A",marginBottom:3}}>{p.name}</div>
                      <div style={{display:"flex",gap:6,alignItems:"center"}}>
                        <span style={{fontSize:13,fontWeight:900,color:"#FF7043"}}>{mp.toLocaleString()}원~</span>
                        <span style={{fontSize:10,color:"#888"}}>★{p.rating}</span>
                        <span style={{fontSize:9,background:"#F5F0EB",color:"#888",borderRadius:4,padding:"1px 5px"}}>{cs}</span>
                      </div>
                    </div>
                    <button onClick={()=>goShop(cs,p.name)} style={{background:"#FF7043",color:"#fff",border:"none",borderRadius:10,padding:"9px 13px",fontSize:12,fontWeight:900,cursor:"pointer",whiteSpace:"nowrap"}}>바로가기</button>
                  </div>
                  {p.why&&<div style={{marginTop:7,fontSize:10,color:"#666",background:"#FAFAFA",borderRadius:7,padding:"5px 8px"}}>{p.why}</div>}
                </div>
              );
            })}
          </div>
        )}

        {/* 네이버 쇼핑 결과 */}
        {tab==="네이버"&&(
          loading
          ?<div style={{textAlign:"center",padding:"48px 0",color:"#aaa"}}>검색 중...</div>
          :results.length===0
          ?<div style={{textAlign:"center",padding:"48px 0",color:"#aaa"}}>검색 결과가 없어요</div>
          :<div style={{display:"flex",flexDirection:"column",gap:8}}>
            {results.map((item,i)=>(
              <div key={i} style={{background:"#fff",borderRadius:12,padding:"12px 14px",border:"1px solid #EEE8E0",display:"flex",gap:10,alignItems:"center"}}>
                {item.image&&<img src={item.image} alt={item.title} style={{width:60,height:60,borderRadius:8,objectFit:"cover",flexShrink:0}} onError={e=>e.target.style.display="none"}/>}
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:13,fontWeight:800,color:"#1A1A1A",lineHeight:1.3,marginBottom:3}} dangerouslySetInnerHTML={{__html:item.title.replace(/<[^>]*>/g,"")}}/>
                  <div style={{fontSize:11,color:"#888",marginBottom:3}}>{item.mallName}</div>
                  <div style={{fontSize:13,fontWeight:900,color:"#FF7043"}}>{Number(item.lprice).toLocaleString()}원~</div>
                </div>
                <button onClick={()=>window.open(item.link,"_blank")} style={{flexShrink:0,background:"#03C75A",color:"#fff",border:"none",borderRadius:10,padding:"9px 12px",fontSize:11,fontWeight:900,cursor:"pointer",whiteSpace:"nowrap"}}>네이버<br/>바로가기</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─ 쇼핑몰별 가상 가격 생성 (실서비스시 API로 교체)
   각 쇼핑몰 API에서 실시간으로 받아와야 합니다 ─ */
function mkPrices(base){
  const r=(p)=>Math.round(base*(1+p)/100)*100;
  return {쿠팡:r(0),네이버:r(.03),"11번가":r(.04),아마존:r(.15),알리:r(-.18)};
}
/* ─ 쇼핑몰별 가상 리뷰/별점 (실서비스시 API로 교체) ─ */
function mkShopStats(baseReviews,baseRating){
  const v=(n,d)=>Math.max(100,Math.round(n*(1+d)));
  const vr=(r,d)=>Math.min(5,+(r+d).toFixed(1));
  return {
    쿠팡:     {reviews:v(baseReviews,.3), rating:vr(baseRating,0)},
    네이버:   {reviews:v(baseReviews,.2), rating:vr(baseRating,-.1)},
    "11번가": {reviews:v(baseReviews,.15),rating:vr(baseRating,0)},
    아마존:   {reviews:v(baseReviews,.5), rating:vr(baseRating,.1)},
    알리:     {reviews:v(baseReviews,.4), rating:vr(baseRating,-.3)},
  };
}

/* ═══════════════════════════════════════════════════════════
   1개월 — 카테고리 대폭 확장 (5개 → 10개)
═══════════════════════════════════════════════════════════ */

/* 개월 그룹 통합 */
const MONTH_GROUPS = [
  {label:"신생아 0~1개월", months:[1],        short:"0~1"},
  {label:"2~3개월",        months:[2,3],      short:"2~3"},
  {label:"4~6개월",        months:[4,5,6],    short:"4~6"},
  {label:"7~9개월",        months:[7,8,9],    short:"7~9"},
  {label:"10~12개월",      months:[10,11,12], short:"10~12"},
];
function getGroupProds(months){
  const seen=new Set();
  return months.flatMap(m=>PRODUCTS[m]||[]).filter(p=>{if(seen.has(p.name))return false;seen.add(p.name);return true;});
}
const PRODUCTS = {
  1:[
    /* 수유 */
    {id:"1-1",cat:"수유용품",name:"치코 네이처 젖병 세트",brand:"치코",price:38900,reviews:21840,rating:4.9,sales:58200,img:"🍼",score:98,shopPrices:mkPrices(38900),shopStats:mkShopStats(21840,4.9),why:"신생아 입 모양에 맞춰 설계, 유두혼란 없이 모유수유 병행 가능",when:"출생 직후부터",tip:"젖꼭지 1~2개월마다 교체 권장"},
    {id:"1-2",cat:"수유용품",name:"아벤트 천연 젖병 260ml",brand:"아벤트",price:22000,reviews:18400,rating:4.8,sales:44100,img:"🍼",score:91,shopPrices:mkPrices(22000),shopStats:mkShopStats(18400,4.8),why:"유두 모방 설계로 모유수유 중단 없이 병행",when:"출생부터",tip:"BPA Free 소재 확인 필수"},
    {id:"1-3",cat:"수유용품",name:"메델라 수유쿠션 대형",brand:"메델라",price:35000,reviews:13800,rating:4.7,sales:28100,img:"🫶",score:85,shopPrices:mkPrices(35000),shopStats:mkShopStats(13800,4.7),why:"수유 자세 유지로 팔목·허리 통증 예방",when:"모유수유 시",tip:"C자형보다 U자형이 쌍둥이에 유리"},
    {id:"1-4",cat:"수유용품",name:"피죤 UV 젖병 소독기",brand:"피죤",price:45000,reviews:16200,rating:4.8,sales:38900,img:"🧹",score:89,shopPrices:mkPrices(45000),shopStats:mkShopStats(16200,4.8),why:"UV 99.9% 살균, 열 소독보다 젖꼭지 변형 없음",when:"매 수유 후",tip:"소독 후 뚜껑 열어 건조 필수"},
    {id:"1-5",cat:"수유용품",name:"분유 포타블 케이스 3단",brand:"마더케이",price:9900,reviews:8200,rating:4.7,sales:24000,img:"🥛",score:82,shopPrices:mkPrices(9900),shopStats:mkShopStats(8200,4.7),why:"외출 시 분유 정량 보관, 편리한 수유 준비",when:"외출 시",tip:"열탕 소독 가능 제품 선택"},
    /* 기저귀/위생 */
    {id:"1-6",cat:"기저귀/위생",name:"하기스 뉴보른 1단계 84매",brand:"하기스",price:29800,reviews:38100,rating:4.9,sales:94500,img:"🧷",score:97,shopPrices:mkPrices(29800),shopStats:mkShopStats(38100,4.9),why:"배꼽 컷아웃 설계로 배꼽 상처 보호",when:"출생~5kg",tip:"하루 8~12회 교체 정상"},
    {id:"1-7",cat:"기저귀/위생",name:"팸퍼스 뉴보른 슬림 72매",brand:"팸퍼스",price:27500,reviews:24100,rating:4.8,sales:48200,img:"🧷",score:93,shopPrices:mkPrices(27500),shopStats:mkShopStats(24100,4.8),why:"초슬림 흡수층으로 신생아 피부 쾌적",when:"출생~4kg",tip:"소변 지시선 변색 확인"},
    {id:"1-8",cat:"기저귀/위생",name:"마마베어 물티슈 100매 10팩",brand:"마마베어",price:18900,reviews:62000,rating:4.9,sales:198000,img:"🧻",score:99,shopPrices:mkPrices(18900),shopStats:mkShopStats(62000,4.9),why:"무향·무알코올, 민감한 신생아 피부에 안전",when:"기저귀 교체마다",tip:"개봉 후 1개월 내 사용"},
    {id:"1-9",cat:"기저귀/위생",name:"하기스 물티슈 순수 82매",brand:"하기스",price:22900,reviews:29800,rating:4.8,sales:82000,img:"🧻",score:94,shopPrices:mkPrices(22900),shopStats:mkShopStats(29800,4.8),why:"두꺼운 원단으로 1장으로 충분",when:"항상",tip:"10팩 대량 구매가 경제적"},
    /* 수면 */
    {id:"1-10",cat:"수면용품",name:"달그락 신생아 속싸개 5종",brand:"달그락",price:19900,reviews:11200,rating:4.8,sales:32400,img:"🌙",score:88,shopPrices:mkPrices(19900),shopStats:mkShopStats(11200,4.8),why:"자궁 속 환경과 비슷하게 감싸줘 모로반사 억제",when:"0~3개월",tip:"너무 꽉 싸면 고관절 문제, 다리는 자유롭게"},
    {id:"1-11",cat:"수면용품",name:"에르고베이비 스와들업",brand:"에르고베이비",price:89000,reviews:11200,rating:4.8,sales:22100,img:"😴",score:86,shopPrices:mkPrices(89000),shopStats:mkShopStats(11200,4.8),why:"지퍼형으로 새벽 기저귀 교체 시 편리",when:"0~3개월",tip:"다리 부분 넉넉하게 유지"},
    {id:"1-12",cat:"수면용품",name:"도도사운드 백색소음기",brand:"도도사운드",price:29000,reviews:11200,rating:4.7,sales:28900,img:"🔊",score:83,shopPrices:mkPrices(29000),shopStats:mkShopStats(11200,4.7),why:"자궁 속 소리와 유사, 깊은 수면 유도",when:"수면 시",tip:"60dB 이하, 아기 귀에서 2m 이상"},
    /* 목욕/스킨 */
    {id:"1-13",cat:"목욕/스킨",name:"존슨즈 탑투토 로션 500ml",brand:"존슨즈",price:12900,reviews:22100,rating:4.7,sales:52000,img:"💧",score:90,shopPrices:mkPrices(12900),shopStats:mkShopStats(22100,4.7),why:"신생아 피부 수분 손실 빠름, 매일 보습 필수",when:"목욕 후 매일",tip:"머리부터 발끝 전신 도포"},
    {id:"1-14",cat:"목욕/스킨",name:"세타필 베이비 로션",brand:"세타필",price:18500,reviews:15200,rating:4.8,sales:42800,img:"💆",score:87,shopPrices:mkPrices(18500),shopStats:mkShopStats(15200,4.8),why:"피부과 추천, 아토피 피부에도 사용 가능",when:"목욕 후 매일",tip:"무향 제품으로 시작 권장"},
    {id:"1-15",cat:"목욕/스킨",name:"무테아 아기 욕조 접이식",brand:"무테아",price:42000,reviews:8900,rating:4.6,sales:22100,img:"🚿",score:78,shopPrices:mkPrices(42000),shopStats:mkShopStats(8900,4.6),why:"혼자 앉지 못하는 아기 목욕 안전하게 지원",when:"0~6개월",tip:"5~10cm 물 깊이로 충분"},
    /* 건강/안전 */
    {id:"1-16",cat:"건강/안전",name:"브라운 이어 체온계 IRT6520",brand:"브라운",price:89000,reviews:28100,rating:4.9,sales:67000,img:"🌡️",score:95,shopPrices:mkPrices(89000),shopStats:mkShopStats(28100,4.9),why:"귀로 1초 측정, 신생아도 안전",when:"항상 비치",tip:"38도 이상이면 바로 소아과"},
    {id:"1-17",cat:"건강/안전",name:"온습도계 디지털",brand:"샤오미",price:12000,reviews:18200,rating:4.7,sales:44000,img:"📊",score:82,shopPrices:mkPrices(12000),shopStats:mkShopStats(18200,4.7),why:"신생아 방 온도 22~24도, 습도 50~60% 유지",when:"항상",tip:"에어컨 직풍 피하기"},
    /* 의류 */
    {id:"1-18",cat:"의류",name:"배냇저고리 순면 5종 세트",brand:"아가방",price:28000,reviews:12400,rating:4.8,sales:36000,img:"👶",score:86,shopPrices:mkPrices(28000),shopStats:mkShopStats(12400,4.8),why:"신생아 기본 의류, 하루 3~5회 갈아입힘",when:"출생 직후",tip:"미리 세탁 후 준비, 사이즈 한 단계 크게"},
    {id:"1-19",cat:"의류",name:"손싸개+발싸개 세트",brand:"달그락",price:8900,reviews:9800,rating:4.7,sales:28000,img:"🧤",score:80,shopPrices:mkPrices(8900),shopStats:mkShopStats(9800,4.7),why:"체온 유지 및 얼굴 긁힘 방지",when:"0~2개월",tip:"너무 꽉 끼면 혈액순환 방해"},
    /* 이동 */
    {id:"1-20",cat:"이동용품",name:"다이치 원픽 360 카시트",brand:"다이치",price:380000,reviews:16200,rating:4.9,sales:34000,img:"🚗",score:87,shopPrices:mkPrices(380000),shopStats:mkShopStats(16200,4.9),why:"퇴원 시 바로 필요! 360도 회전으로 신생아~유아 장기 사용",when:"출생부터",tip:"ISOFIX 방식이 안전벨트보다 안전"},
    {id:"1-21",cat:"이동용품",name:"에르고베이비 360 아기띠",brand:"에르고베이비",price:189000,reviews:21200,rating:4.9,sales:44200,img:"🎽",score:91,shopPrices:mkPrices(189000),shopStats:mkShopStats(21200,4.9),why:"M자 자세로 고관절 발달 보호, 부모 허리 부담 최소화",when:"신생아~",tip:"신생아 삽입물 확인 필수"},
    {id:"1-22b",cat:"유모차",name:"콤비 스리모 신생아 유모차",brand:"콤비",price:320000,reviews:14200,rating:4.8,sales:22100,img:"🛸",score:90,shopPrices:mkPrices(320000),shopStats:mkShopStats(14200,4.8),why:"신생아부터 사용 가능, 등받이 완전히 눕혀짐",when:"출생~36개월",tip:"등받이 완전히 뉘어지는 제품 필수"},
    {id:"1-22c",cat:"유모차",name:"조이 라이트트랙스 유모차",brand:"조이",price:289000,reviews:20400,rating:4.8,sales:32000,img:"🛸",score:87,shopPrices:mkPrices(289000),shopStats:mkShopStats(20400,4.8),why:"가볍고 접기 편해 외출이 편리",when:"신생아~22kg",tip:"신생아 전용 시트 확인"},
    {id:"1-22d",cat:"유모차",name:"맥클라렌 뉴본 유모차",brand:"맥클라렌",price:450000,reviews:8200,rating:4.7,sales:12000,img:"🛸",score:84,shopPrices:mkPrices(450000),shopStats:mkShopStats(8200,4.7),why:"프리미엄 소재, 오래 사용 가능",when:"신생아~25kg",tip:"비싸지만 내구성 최고"},
    /* 방수/위생 */
    {id:"1-22",cat:"수면용품",name:"방수패드 3장 세트",brand:"노리노리",price:18000,reviews:14200,rating:4.7,sales:38000,img:"🛡️",score:84,shopPrices:mkPrices(18000),shopStats:mkShopStats(14200,4.7),why:"침대·수유쿠션 오염 방지 필수",when:"항상",tip:"3장 이상 준비해서 세탁 로테이션"},
    {id:"1-23",cat:"기저귀/위생",name:"피죤 젖병 세정제 500ml",brand:"피죤",price:7900,reviews:18200,rating:4.7,sales:48000,img:"🧴",score:81,shopPrices:mkPrices(7900),shopStats:mkShopStats(18200,4.7),why:"일반 주방세제 대신 아기 전용 세정제 사용",when:"매 수유 후",tip:"희석 배율 꼭 지키기"},
  ],
  2:[
    {id:"2-1",cat:"기저귀/위생",name:"마미포코 2단계 팬티형 58매",brand:"마미포코",price:24900,reviews:34100,rating:4.9,sales:98000,img:"🧷",score:97,shopPrices:mkPrices(24900),shopStats:mkShopStats(34100,4.9),why:"허리 밴드가 유연하게 늘어남",when:"5~8kg",tip:"소변 지시선 파란색으로 변하면 교체"},
    {id:"2-2",cat:"수유용품",name:"NUK 2단계 젖꼭지 2개입",brand:"NUK",price:13800,reviews:14200,rating:4.8,sales:38100,img:"🍼",score:91,shopPrices:mkPrices(13800),shopStats:mkShopStats(14200,4.8),why:"소재 딱딱해지면 반드시 교체",when:"2개월부터",tip:"실리콘이 라텍스보다 오래감"},
    {id:"2-3",cat:"목욕/스킨",name:"존슨즈 탑투토 로션",brand:"존슨즈",price:12900,reviews:22100,rating:4.7,sales:52000,img:"💧",score:90,shopPrices:mkPrices(12900),shopStats:mkShopStats(22100,4.7),why:"보습이 아토피 예방에 핵심",when:"매일 목욕 후",tip:"물기 완전히 닦은 뒤 도포"},
    {id:"2-4",cat:"놀이/발달",name:"피셔프라이스 뮤지컬 모빌",brand:"피셔프라이스",price:48000,reviews:16200,rating:4.8,sales:44200,img:"🌀",score:90,shopPrices:mkPrices(48000),shopStats:mkShopStats(16200,4.8),why:"흑백 패턴이 시각 자극에 효과적",when:"0~5개월",tip:"눈과 모빌 간격 30cm 유지"},
    {id:"2-5",cat:"의류",name:"방수 실리콘 턱받이 5종",brand:"미니피스",price:9900,reviews:32000,rating:4.8,sales:98000,img:"🧣",score:94,shopPrices:mkPrices(9900),shopStats:mkShopStats(32000,4.8),why:"2개월부터 침 분비 폭발",when:"2개월~",tip:"밴드형이 목에 안 걸림"},
    {id:"2-6",cat:"기저귀/위생",name:"마마베어 물티슈 100매 10팩",brand:"마마베어",price:18900,reviews:62000,rating:4.9,sales:198000,img:"🧻",score:99,shopPrices:mkPrices(18900),shopStats:mkShopStats(62000,4.9),why:"필수 생필품",when:"항상",tip:"뚜껑 꼭 닫아 보관"},
    {id:"2-7",cat:"수면용품",name:"도도사운드 백색소음기",brand:"도도사운드",price:29000,reviews:11200,rating:4.7,sales:28900,img:"🔊",score:83,shopPrices:mkPrices(29000),shopStats:mkShopStats(11200,4.7),why:"깊은 수면 유도",when:"수면 시",tip:"60dB 이하 설정"},
    {id:"2-8",cat:"건강/안전",name:"브라운 이어 체온계",brand:"브라운",price:89000,reviews:28100,rating:4.9,sales:67000,img:"🌡️",score:95,shopPrices:mkPrices(89000),shopStats:mkShopStats(28100,4.9),why:"항상 필수",when:"항상",tip:"38도 이상 소아과"},
    {id:"2-9",cat:"놀이/발달",name:"소피라지라프 딸랑이",brand:"소피",price:28000,reviews:19800,rating:4.8,sales:52100,img:"🦒",score:91,shopPrices:mkPrices(28000),shopStats:mkShopStats(19800,4.8),why:"청각·촉각·시각 동시 자극",when:"2개월~",tip:"천연고무 냄새는 정상"},
    {id:"2-10",cat:"수면용품",name:"에르고베이비 속싸개",brand:"에르고베이비",price:89000,reviews:11200,rating:4.8,sales:22100,img:"🌙",score:80,shopPrices:mkPrices(89000),shopStats:mkShopStats(11200,4.8),why:"지퍼형 새벽 교체 편리",when:"0~3개월",tip:"다리 부분 넉넉하게"},
  ],
  3:[
    {id:"3-1",cat:"놀이/발달",name:"피셔프라이스 짐나지움",brand:"피셔프라이스",price:68000,reviews:25200,rating:4.9,sales:62000,img:"🎮",score:94,shopPrices:mkPrices(68000),shopStats:mkShopStats(25200,4.9),why:"바닥 활동으로 목·어깨 근육 발달",when:"0~6개월",tip:"하루 최소 30분 배밀이 권장"},
    {id:"3-2",cat:"기저귀/위생",name:"하기스 2단계 84매",brand:"하기스",price:28900,reviews:44200,rating:4.9,sales:112000,img:"🧷",score:98,shopPrices:mkPrices(28900),shopStats:mkShopStats(44200,4.9),why:"필수",when:"3~8kg",tip:"다리 주름 안으로 넣기"},
    {id:"3-3",cat:"이동용품",name:"에르고베이비 360 아기띠",brand:"에르고베이비",price:189000,reviews:21200,rating:4.9,sales:44200,img:"🎽",score:93,shopPrices:mkPrices(189000),shopStats:mkShopStats(21200,4.9),why:"M자 자세로 고관절 발달 보호",when:"3~20개월",tip:"신생아 삽입물 머리 지지대 확인"},
    {id:"3-4",cat:"이동용품",name:"콤비 스리모 유모차",brand:"콤비",price:320000,reviews:14200,rating:4.8,sales:22100,img:"🛸",score:87,shopPrices:mkPrices(320000),shopStats:mkShopStats(14200,4.8),why:"3개월부터 외출 빈도 늘어남",when:"0~36개월",tip:"등받이 완전히 뉘어지는 제품"},
    {id:"3-5",cat:"놀이/발달",name:"소피라지라프 딸랑이",brand:"소피",price:28000,reviews:19800,rating:4.8,sales:52100,img:"🦒",score:91,shopPrices:mkPrices(28000),shopStats:mkShopStats(19800,4.8),why:"오감 자극",when:"2개월~",tip:"천연고무 소재"},
    {id:"3-6",cat:"기저귀/위생",name:"마마베어 물티슈",brand:"마마베어",price:18900,reviews:62000,rating:4.9,sales:198000,img:"🧻",score:99,shopPrices:mkPrices(18900),shopStats:mkShopStats(62000,4.9),why:"필수",when:"항상",tip:""},
    {id:"3-7",cat:"수유용품",name:"NUK 3단계 젖꼭지",brand:"NUK",price:13500,reviews:14200,rating:4.7,sales:36200,img:"🍼",score:85,shopPrices:mkPrices(13500),shopStats:mkShopStats(14200,4.7),why:"수유량 증가에 맞춰 업그레이드",when:"3개월~",tip:"구멍이 너무 크면 사레 위험"},
    {id:"3-8",cat:"수면용품",name:"도도사운드 백색소음기",brand:"도도사운드",price:29000,reviews:11200,rating:4.7,sales:28900,img:"🔊",score:83,shopPrices:mkPrices(29000),shopStats:mkShopStats(11200,4.7),why:"수면 환경 조성",when:"수면시",tip:"너무 크지 않게"},
    {id:"3-9",cat:"목욕/스킨",name:"무테아 욕조 접이식",brand:"무테아",price:42000,reviews:8900,rating:4.6,sales:22100,img:"🚿",score:78,shopPrices:mkPrices(42000),shopStats:mkShopStats(8900,4.6),why:"아기 목욕 안전하게 지원",when:"0~6개월",tip:"절대 눈 떼지 않기"},
    {id:"3-10",cat:"의류",name:"에뜨와 바디수트 10종",brand:"에뜨와",price:35000,reviews:17200,rating:4.8,sales:43200,img:"👶",score:88,shopPrices:mkPrices(35000),shopStats:mkShopStats(17200,4.8),why:"스냅 단추로 기저귀 교체 편리",when:"0~12개월",tip:"사이즈 한 단계 크게 구매"},
  ],
  4:[
    {id:"4-1",cat:"놀이/발달",name:"소피라지라프 치발기",brand:"소피",price:32000,reviews:33400,rating:4.9,sales:88200,img:"🦒",score:96,shopPrices:mkPrices(32000),shopStats:mkShopStats(33400,4.9),why:"이앓이 잇몸 통증·가려움 해소",when:"4~18개월",tip:"냉장 보관 후 사용하면 효과적"},
    {id:"4-2",cat:"이유식용품",name:"에디슨 실리콘 스푼 세트",brand:"에디슨",price:8900,reviews:26200,rating:4.8,sales:72100,img:"🥄",score:93,shopPrices:mkPrices(8900),shopStats:mkShopStats(26200,4.8),why:"이유식 시작 전 준비, 실리콘이 잇몸 보호",when:"이유식 시작 전",tip:"끝이 뾰족하지 않은 제품"},
    {id:"4-3",cat:"기저귀/위생",name:"팸퍼스 3단계 76매",brand:"팸퍼스",price:26500,reviews:36200,rating:4.9,sales:104000,img:"🧷",score:97,shopPrices:mkPrices(26500),shopStats:mkShopStats(36200,4.9),why:"필수",when:"7~12kg",tip:""},
    {id:"4-4",cat:"의류",name:"방수 실리콘 턱받이 5종",brand:"미니피스",price:9900,reviews:32000,rating:4.8,sales:98000,img:"🧣",score:95,shopPrices:mkPrices(9900),shopStats:mkShopStats(32000,4.8),why:"이유식 준비, 음식 흘림 대비",when:"4개월~",tip:"포켓 있는 제품이 편리"},
    {id:"4-5",cat:"이유식용품",name:"아이배냇 냉동보관 큐브",brand:"아이배냇",price:18900,reviews:20400,rating:4.8,sales:52000,img:"🧊",score:90,shopPrices:mkPrices(18900),shopStats:mkShopStats(20400,4.8),why:"이유식 대량 조리 후 냉동 보관",when:"이유식 시작 전",tip:"15ml·30ml 두 종류 준비"},
    {id:"4-6",cat:"이동용품",name:"에르고베이비 360 아기띠",brand:"에르고베이비",price:189000,reviews:21200,rating:4.9,sales:44200,img:"🎽",score:91,shopPrices:mkPrices(189000),shopStats:mkShopStats(21200,4.9),why:"4개월 활동량 증가",when:"3~20개월",tip:"목 가누기 되면 전면 자세 가능"},
    {id:"4-7",cat:"놀이/발달",name:"접이식 놀이매트 210×140",brand:"베베",price:78000,reviews:17200,rating:4.7,sales:42100,img:"🟩",score:86,shopPrices:mkPrices(78000),shopStats:mkShopStats(17200,4.7),why:"뒤집기 시작, 바닥 충격 흡수",when:"4개월~",tip:"두께 4cm 이상, 무독성 인증"},
    {id:"4-8",cat:"기저귀/위생",name:"마마베어 물티슈",brand:"마마베어",price:18900,reviews:62000,rating:4.9,sales:198000,img:"🧻",score:99,shopPrices:mkPrices(18900),shopStats:mkShopStats(62000,4.9),why:"필수",when:"항상",tip:""},
    {id:"4-9",cat:"건강/안전",name:"범퍼침대 대형 8종",brand:"노리노리",price:89000,reviews:19400,rating:4.8,sales:42200,img:"🛡️",score:88,shopPrices:mkPrices(89000),shopStats:mkShopStats(19400,4.8),why:"뒤집기 후 침대 모서리 충돌 방지",when:"4개월~",tip:"통기성 확인"},
    {id:"4-10",cat:"건강/안전",name:"브라운 이어 체온계",brand:"브라운",price:89000,reviews:28100,rating:4.9,sales:67000,img:"🌡️",score:92,shopPrices:mkPrices(89000),shopStats:mkShopStats(28100,4.9),why:"필수",when:"항상",tip:""},
  ],
  5:[
    {id:"5-1",cat:"이유식용품",name:"에디슨 이유식 스푼 세트",brand:"에디슨",price:12000,reviews:44200,rating:4.9,sales:142000,img:"🥄",score:98,shopPrices:mkPrices(12000),shopStats:mkShopStats(44200,4.9),why:"이유식 시작! 작고 얕은 스푼",when:"5~6개월",tip:"처음엔 쌀미음 1~2 찻술부터"},
    {id:"5-2",cat:"이유식용품",name:"리치엘 빨대컵 200ml",brand:"리치엘",price:14900,reviews:31200,rating:4.8,sales:88000,img:"🥤",score:95,shopPrices:mkPrices(14900),shopStats:mkShopStats(31200,4.8),why:"빨대 연습, 컵 음수 습관",when:"5개월~",tip:"살짝 기울여 입에 닿게 해주기"},
    {id:"5-3",cat:"이유식용품",name:"도나 하이체어 접이식",brand:"도나",price:128000,reviews:24400,rating:4.9,sales:58000,img:"🪑",score:93,shopPrices:mkPrices(128000),shopStats:mkShopStats(24400,4.9),why:"이유식 안정적인 자세 필수",when:"5개월~",tip:"발판 있는 제품이 집중력 높임"},
    {id:"5-4",cat:"기저귀/위생",name:"하기스 3단계 92매",brand:"하기스",price:31900,reviews:45200,rating:4.9,sales:126000,img:"🧷",score:98,shopPrices:mkPrices(31900),shopStats:mkShopStats(45200,4.9),why:"필수",when:"7~12kg",tip:""},
    {id:"5-5",cat:"이유식용품",name:"콤비 이유식 조리기 4종",brand:"콤비",price:45000,reviews:19400,rating:4.8,sales:48000,img:"🥣",score:90,shopPrices:mkPrices(45000),shopStats:mkShopStats(19400,4.8),why:"믹서기·냄비·체·보관용기 세트",when:"이유식 시작 전",tip:"전용 세척 솔 함께 구비"},
    {id:"5-6",cat:"건강/안전",name:"세이프홈 손끼임 안전문",brand:"세이프홈",price:12900,reviews:22600,rating:4.8,sales:62000,img:"🚪",score:92,shopPrices:mkPrices(12900),shopStats:mkShopStats(22600,4.8),why:"5~6개월 이동 시작, 미리 설치",when:"5개월 전 설치",tip:"계단·주방·욕실 우선"},
    {id:"5-7",cat:"의류",name:"방수 실리콘 턱받이 5종",brand:"미니피스",price:9900,reviews:32000,rating:4.8,sales:98000,img:"🧣",score:95,shopPrices:mkPrices(9900),shopStats:mkShopStats(32000,4.8),why:"이유식 시작으로 옷 오염 급증",when:"이유식 시작",tip:""},
    {id:"5-8",cat:"기저귀/위생",name:"마마베어 물티슈",brand:"마마베어",price:18900,reviews:62000,rating:4.9,sales:198000,img:"🧻",score:99,shopPrices:mkPrices(18900),shopStats:mkShopStats(62000,4.9),why:"필수",when:"항상",tip:""},
    {id:"5-9",cat:"이동용품",name:"조이 라이트트랙스 유모차",brand:"조이",price:289000,reviews:20400,rating:4.8,sales:32000,img:"🛸",score:86,shopPrices:mkPrices(289000),shopStats:mkShopStats(20400,4.8),why:"이유식 후 외출 장비 본격화",when:"0~22kg",tip:""},
    {id:"5-10",cat:"놀이/발달",name:"접이식 놀이매트",brand:"베베",price:78000,reviews:17200,rating:4.7,sales:42100,img:"🟩",score:85,shopPrices:mkPrices(78000),shopStats:mkShopStats(17200,4.7),why:"앉기 연습 안전 공간",when:"5개월~",tip:""},
  ],
  6:[{id:"6-1",cat:"이유식용품",name:"에디슨 이유식 스푼",brand:"에디슨",price:12000,reviews:44200,rating:4.9,sales:142000,img:"🥄",score:98,shopPrices:mkPrices(12000),shopStats:mkShopStats(44200,4.9),why:"이유식 본격화",when:"6개월~",tip:""},{id:"6-2",cat:"이유식용품",name:"리치엘 빨대컵",brand:"리치엘",price:14900,reviews:31200,rating:4.8,sales:88000,img:"🥤",score:95,shopPrices:mkPrices(14900),shopStats:mkShopStats(31200,4.8),why:"수분 섭취",when:"6개월~",tip:""},{id:"6-3",cat:"기저귀/위생",name:"마미포코 3단계 52매",brand:"마미포코",price:22900,reviews:33800,rating:4.9,sales:92000,img:"🧷",score:97,shopPrices:mkPrices(22900),shopStats:mkShopStats(33800,4.9),why:"필수",when:"7~12kg",tip:""},{id:"6-4",cat:"이유식용품",name:"세이피아 이유식 다지기",brand:"세이피아",price:39900,reviews:14400,rating:4.8,sales:34000,img:"🔧",score:86,shopPrices:mkPrices(39900),shopStats:mkShopStats(14400,4.8),why:"중기 이유식 입자 조절",when:"6~9개월",tip:"분리 세척 필수"},{id:"6-5",cat:"건강/안전",name:"손끼임 방지 안전문",brand:"세이프홈",price:12900,reviews:22600,rating:4.8,sales:62000,img:"🚪",score:92,shopPrices:mkPrices(12900),shopStats:mkShopStats(22600,4.8),why:"문끼임 사고 예방",when:"필수",tip:""},{id:"6-6",cat:"이유식용품",name:"도나 하이체어",brand:"도나",price:128000,reviews:24400,rating:4.9,sales:58000,img:"🪑",score:93,shopPrices:mkPrices(128000),shopStats:mkShopStats(24400,4.9),why:"앉아서 먹는 습관",when:"5개월~",tip:""},{id:"6-7",cat:"기저귀/위생",name:"마마베어 물티슈",brand:"마마베어",price:18900,reviews:62000,rating:4.9,sales:198000,img:"🧻",score:99,shopPrices:mkPrices(18900),shopStats:mkShopStats(62000,4.9),why:"필수",when:"항상",tip:""},{id:"6-8",cat:"놀이/발달",name:"접이식 놀이매트",brand:"베베",price:78000,reviews:17200,rating:4.7,sales:42100,img:"🟩",score:85,shopPrices:mkPrices(78000),shopStats:mkShopStats(17200,4.7),why:"기기 시작 안전",when:"~",tip:""},{id:"6-9",cat:"의류",name:"방수 실리콘 턱받이 5종",brand:"미니피스",price:9900,reviews:32000,rating:4.8,sales:98000,img:"🧣",score:95,shopPrices:mkPrices(9900),shopStats:mkShopStats(32000,4.8),why:"이유식 오염 방지",when:"~",tip:""},{id:"6-10",cat:"이유식용품",name:"콤비 이유식 조리기",brand:"콤비",price:45000,reviews:19400,rating:4.8,sales:48000,img:"🥣",score:88,shopPrices:mkPrices(45000),shopStats:mkShopStats(19400,4.8),why:"이유식 준비",when:"",tip:""}],
  7:[{id:"7-1",cat:"건강/안전",name:"콘센트 안전커버 20p",brand:"세이프홈",price:5900,reviews:44200,rating:4.8,sales:148000,img:"🔌",score:97,shopPrices:mkPrices(5900),shopStats:mkShopStats(44200,4.8),why:"기기 시작, 모든 콘센트 위험",when:"7개월 전 설치",tip:"집 안 모든 콘센트 설치"},{id:"7-2",cat:"건강/안전",name:"모서리 보호대 12p",brand:"아이세이프",price:8900,reviews:33800,rating:4.8,sales:102000,img:"🛡️",score:96,shopPrices:mkPrices(8900),shopStats:mkShopStats(33800,4.8),why:"눈 높이 모서리 충돌 방지",when:"기기 시작 전",tip:"투명 제품 추천"},{id:"7-3",cat:"건강/안전",name:"손끼임 방지 안전문",brand:"세이프홈",price:45000,reviews:28200,rating:4.9,sales:78000,img:"🚪",score:95,shopPrices:mkPrices(45000),shopStats:mkShopStats(28200,4.9),why:"계단·주방 접근 차단",when:"기기 전 설치",tip:"나사 고정식이 안전"},{id:"7-4",cat:"기저귀/위생",name:"하기스 4단계 팬티 48매",brand:"하기스",price:23900,reviews:40200,rating:4.9,sales:118000,img:"🧷",score:98,shopPrices:mkPrices(23900),shopStats:mkShopStats(40200,4.9),why:"필수",when:"9~14kg",tip:""},{id:"7-5",cat:"이유식용품",name:"리치엘 빨대컵",brand:"리치엘",price:14900,reviews:31200,rating:4.8,sales:88000,img:"🥤",score:94,shopPrices:mkPrices(14900),shopStats:mkShopStats(31200,4.8),why:"스스로 컵 잡기",when:"~",tip:""},{id:"7-6",cat:"놀이/발달",name:"레고 듀플로 클래식",brand:"레고",price:42000,reviews:29400,rating:4.9,sales:78200,img:"🧱",score:94,shopPrices:mkPrices(42000),shopStats:mkShopStats(29400,4.9),why:"손 근육 발달",when:"7개월~",tip:""},{id:"7-7",cat:"기저귀/위생",name:"마마베어 물티슈",brand:"마마베어",price:18900,reviews:62000,rating:4.9,sales:198000,img:"🧻",score:99,shopPrices:mkPrices(18900),shopStats:mkShopStats(62000,4.9),why:"필수",when:"항상",tip:""},{id:"7-8",cat:"이유식용품",name:"실리콘 분리 식판",brand:"에디슨",price:15900,reviews:21400,rating:4.8,sales:58000,img:"🍽️",score:90,shopPrices:mkPrices(15900),shopStats:mkShopStats(21400,4.8),why:"음식 섞임 방지",when:"이유식 시기",tip:""},{id:"7-9",cat:"이동용품",name:"다이치 원픽 360 카시트",brand:"다이치",price:380000,reviews:16200,rating:4.9,sales:34000,img:"🚗",score:87,shopPrices:mkPrices(380000),shopStats:mkShopStats(16200,4.9),why:"360도 회전 장기 사용",when:"출생~4세",tip:""},{id:"7-10",cat:"놀이/발달",name:"접이식 놀이매트",brand:"베베",price:78000,reviews:17200,rating:4.7,sales:42100,img:"🟩",score:85,shopPrices:mkPrices(78000),shopStats:mkShopStats(17200,4.7),why:"기기·낙상 대비",when:"~",tip:""}],
  8:[{id:"8-1",cat:"이유식용품",name:"도나 하이체어",brand:"도나",price:128000,reviews:24400,rating:4.9,sales:58000,img:"🪑",score:93,shopPrices:mkPrices(128000),shopStats:mkShopStats(24400,4.9),why:"핑거푸드 시작",when:"8개월~",tip:""},{id:"8-2",cat:"놀이/발달",name:"베이비아인슈타인 키트",brand:"Baby Einstein",price:85000,reviews:16200,rating:4.8,sales:38000,img:"🎮",score:88,shopPrices:mkPrices(85000),shopStats:mkShopStats(16200,4.8),why:"통합 감각 자극",when:"8~24개월",tip:""},{id:"8-3",cat:"기저귀/위생",name:"팸퍼스 4단계 52매",brand:"팸퍼스",price:25900,reviews:37200,rating:4.9,sales:112000,img:"🧷",score:98,shopPrices:mkPrices(25900),shopStats:mkShopStats(37200,4.9),why:"필수",when:"9~14kg",tip:""},{id:"8-4",cat:"이유식용품",name:"에디슨 컵 식기",brand:"에디슨",price:16900,reviews:26200,rating:4.8,sales:72000,img:"🥣",score:91,shopPrices:mkPrices(16900),shopStats:mkShopStats(26200,4.8),why:"스스로 먹기 연습",when:"8개월~",tip:""},{id:"8-5",cat:"기저귀/위생",name:"마마베어 물티슈",brand:"마마베어",price:18900,reviews:62000,rating:4.9,sales:198000,img:"🧻",score:99,shopPrices:mkPrices(18900),shopStats:mkShopStats(62000,4.9),why:"필수",when:"항상",tip:""},{id:"8-6",cat:"건강/안전",name:"손끼임 방지 안전문",brand:"세이프홈",price:45000,reviews:28200,rating:4.9,sales:78000,img:"🚪",score:92,shopPrices:mkPrices(45000),shopStats:mkShopStats(28200,4.9),why:"이동 범위 증가",when:"필수",tip:""},{id:"8-7",cat:"이유식용품",name:"리치엘 빨대컵",brand:"리치엘",price:14900,reviews:31200,rating:4.8,sales:88000,img:"🥤",score:94,shopPrices:mkPrices(14900),shopStats:mkShopStats(31200,4.8),why:"필수",when:"~",tip:""},{id:"8-8",cat:"놀이/발달",name:"레고 듀플로 클래식",brand:"레고",price:42000,reviews:29400,rating:4.9,sales:78200,img:"🧱",score:93,shopPrices:mkPrices(42000),shopStats:mkShopStats(29400,4.9),why:"소근육 발달",when:"7개월~",tip:""},{id:"8-9",cat:"이동용품",name:"다이치 원픽 360 카시트",brand:"다이치",price:380000,reviews:16200,rating:4.9,sales:34000,img:"🚗",score:86,shopPrices:mkPrices(380000),shopStats:mkShopStats(16200,4.9),why:"이동 안전",when:"~",tip:""},{id:"8-10",cat:"건강/안전",name:"모서리 보호대 12p",brand:"아이세이프",price:8900,reviews:33800,rating:4.8,sales:102000,img:"🛡️",score:96,shopPrices:mkPrices(8900),shopStats:mkShopStats(33800,4.8),why:"낙상 부상 예방",when:"~",tip:""}],
  9:[{id:"9-1",cat:"기저귀/위생",name:"마마베어 물티슈",brand:"마마베어",price:18900,reviews:62000,rating:4.9,sales:198000,img:"🧻",score:99,shopPrices:mkPrices(18900),shopStats:mkShopStats(62000,4.9),why:"필수",when:"항상",tip:""},{id:"9-2",cat:"기저귀/위생",name:"하기스 5단계 팬티 44매",brand:"하기스",price:22900,reviews:44200,rating:4.9,sales:132000,img:"🧷",score:98,shopPrices:mkPrices(22900),shopStats:mkShopStats(44200,4.9),why:"필수",when:"10~16kg",tip:""},{id:"9-3",cat:"건강/안전",name:"콘센트 안전커버 20p",brand:"세이프홈",price:5900,reviews:44200,rating:4.8,sales:148000,img:"🔌",score:97,shopPrices:mkPrices(5900),shopStats:mkShopStats(44200,4.8),why:"필수",when:"필수",tip:""},{id:"9-4",cat:"건강/안전",name:"모서리 보호대 12p",brand:"아이세이프",price:8900,reviews:33800,rating:4.8,sales:102000,img:"🛡️",score:96,shopPrices:mkPrices(8900),shopStats:mkShopStats(33800,4.8),why:"서기·낙상 빈번",when:"필수",tip:""},{id:"9-5",cat:"놀이/발달",name:"피셔프라이스 팝업 공놀이",brand:"피셔프라이스",price:34000,reviews:29400,rating:4.9,sales:84200,img:"⚽",score:95,shopPrices:mkPrices(34000),shopStats:mkShopStats(29400,4.9),why:"협응력 발달",when:"9개월~",tip:""},{id:"9-6",cat:"이유식용품",name:"리치엘 빨대컵",brand:"리치엘",price:14900,reviews:31200,rating:4.8,sales:88000,img:"🥤",score:94,shopPrices:mkPrices(14900),shopStats:mkShopStats(31200,4.8),why:"필수",when:"~",tip:""},{id:"9-7",cat:"이유식용품",name:"뽀로로 이유식 도시락통",brand:"뽀로로",price:18900,reviews:33800,rating:4.8,sales:92000,img:"🥣",score:93,shopPrices:mkPrices(18900),shopStats:mkShopStats(33800,4.8),why:"외출 시 이유식 보관",when:"이유식 외출",tip:""},{id:"9-8",cat:"건강/안전",name:"손끼임 방지 안전문",brand:"세이프홈",price:45000,reviews:28200,rating:4.9,sales:78000,img:"🚪",score:92,shopPrices:mkPrices(45000),shopStats:mkShopStats(28200,4.9),why:"필수",when:"필수",tip:""},{id:"9-9",cat:"신발",name:"스트라이드라이트 첫 걸음",brand:"스트라이드라이트",price:48000,reviews:17200,rating:4.9,sales:44000,img:"👟",score:88,shopPrices:mkPrices(48000),shopStats:mkShopStats(17200,4.9),why:"서기 연습 발 보호",when:"서기 시작",tip:""},{id:"9-10",cat:"이동용품",name:"다이치 원픽 360 카시트",brand:"다이치",price:380000,reviews:16200,rating:4.9,sales:34000,img:"🚗",score:85,shopPrices:mkPrices(380000),shopStats:mkShopStats(16200,4.9),why:"필수",when:"~",tip:""}],
  10:[{id:"10-1",cat:"기저귀/위생",name:"마마베어 물티슈",brand:"마마베어",price:18900,reviews:62000,rating:4.9,sales:198000,img:"🧻",score:99,shopPrices:mkPrices(18900),shopStats:mkShopStats(62000,4.9),why:"필수",when:"항상",tip:""},{id:"10-2",cat:"기저귀/위생",name:"마미포코 점보 5단계 44매",brand:"마미포코",price:21900,reviews:33800,rating:4.9,sales:102000,img:"🧷",score:97,shopPrices:mkPrices(21900),shopStats:mkShopStats(33800,4.9),why:"필수",when:"10~16kg",tip:""},{id:"10-3",cat:"음식/간식",name:"아이배냇 유기농 과자 6종",brand:"아이배냇",price:24900,reviews:44200,rating:4.9,sales:152000,img:"🍪",score:98,shopPrices:mkPrices(24900),shopStats:mkShopStats(44200,4.9),why:"유기농 미각 발달",when:"10개월~",tip:"잇몸으로 으깰 수 있는 무른 과자"},{id:"10-4",cat:"신발",name:"스트라이드라이트 소프트 워커",brand:"스트라이드라이트",price:48000,reviews:17200,rating:4.9,sales:44000,img:"👟",score:90,shopPrices:mkPrices(48000),shopStats:mkShopStats(17200,4.9),why:"걷기 발목 지지",when:"걷기 시작",tip:"발 길이+5~10mm 여유"},{id:"10-5",cat:"이유식용품",name:"실리콘 분리 식판",brand:"에디슨",price:15900,reviews:21400,rating:4.8,sales:58000,img:"🍽️",score:89,shopPrices:mkPrices(15900),shopStats:mkShopStats(21400,4.8),why:"스스로 먹기 완성",when:"~",tip:""},{id:"10-6",cat:"건강/안전",name:"손끼임 방지 안전문",brand:"세이프홈",price:45000,reviews:28200,rating:4.9,sales:78000,img:"🚪",score:92,shopPrices:mkPrices(45000),shopStats:mkShopStats(28200,4.9),why:"걷기 이동 범위 폭발",when:"필수",tip:""},{id:"10-7",cat:"이동용품",name:"다이치 원픽 360 카시트",brand:"다이치",price:380000,reviews:16200,rating:4.9,sales:34000,img:"🚗",score:85,shopPrices:mkPrices(380000),shopStats:mkShopStats(16200,4.9),why:"필수",when:"~",tip:""},{id:"10-8",cat:"이동용품",name:"미니 밀차 균형 보행기",brand:"피셔프라이스",price:52000,reviews:15200,rating:4.8,sales:40000,img:"🛒",score:84,shopPrices:mkPrices(52000),shopStats:mkShopStats(15200,4.8),why:"균형 발달",when:"10개월~",tip:""},{id:"10-9",cat:"놀이/발달",name:"목재 기차 레일 세트",brand:"엘씨",price:58000,reviews:14400,rating:4.7,sales:36000,img:"🚂",score:82,shopPrices:mkPrices(58000),shopStats:mkShopStats(14400,4.7),why:"소근육·공간 감각",when:"10개월~",tip:""},{id:"10-10",cat:"의류",name:"노스페이스 키즈 방한복",brand:"노스페이스",price:89000,reviews:16200,rating:4.8,sales:42000,img:"🧥",score:86,shopPrices:mkPrices(89000),shopStats:mkShopStats(16200,4.8),why:"외부 활동 체온 유지",when:"겨울철",tip:""}],
  11:[{id:"11-1",cat:"교육/책",name:"베이비 첫 그림책 10권",brand:"한림출판사",price:35000,reviews:39200,rating:4.9,sales:112000,img:"📚",score:96,shopPrices:mkPrices(35000),shopStats:mkShopStats(39200,4.9),why:"언어 발달 황금기",when:"11개월~",tip:"같은 책 반복이 효과적"},{id:"11-2",cat:"놀이/발달",name:"VTech 한글 학습 노트북",brand:"VTech",price:62000,reviews:20400,rating:4.8,sales:54000,img:"💻",score:90,shopPrices:mkPrices(62000),shopStats:mkShopStats(20400,4.8),why:"글자·숫자·음악 통합",when:"11개월~",tip:"하루 30분 이내"},{id:"11-3",cat:"기저귀/위생",name:"하기스 점보 5단계 52매",brand:"하기스",price:25900,reviews:51200,rating:4.9,sales:162000,img:"🧷",score:99,shopPrices:mkPrices(25900),shopStats:mkShopStats(51200,4.9),why:"필수",when:"10~16kg",tip:""},{id:"11-4",cat:"음식/간식",name:"베베쿡 유기농 아기쿠키",brand:"베베쿡",price:19800,reviews:32800,rating:4.8,sales:88000,img:"🍪",score:95,shopPrices:mkPrices(19800),shopStats:mkShopStats(32800,4.8),why:"건강한 미각 발달",when:"11개월~",tip:""},{id:"11-5",cat:"신발",name:"세이지크릭 걸음마 신발",brand:"세이지크릭",price:38000,reviews:14400,rating:4.7,sales:36000,img:"👟",score:84,shopPrices:mkPrices(38000),shopStats:mkShopStats(14400,4.7),why:"걷기 발 보호",when:"걷기 시작",tip:""},{id:"11-6",cat:"기저귀/위생",name:"마마베어 물티슈",brand:"마마베어",price:18900,reviews:62000,rating:4.9,sales:198000,img:"🧻",score:99,shopPrices:mkPrices(18900),shopStats:mkShopStats(62000,4.9),why:"필수",when:"항상",tip:""},{id:"11-7",cat:"이유식용품",name:"실리콘 분리 식판",brand:"에디슨",price:15900,reviews:21400,rating:4.8,sales:58000,img:"🍽️",score:89,shopPrices:mkPrices(15900),shopStats:mkShopStats(21400,4.8),why:"혼자 먹기 완성",when:"~",tip:""},{id:"11-8",cat:"건강/안전",name:"손끼임 방지 안전문",brand:"세이프홈",price:45000,reviews:28200,rating:4.9,sales:78000,img:"🚪",score:91,shopPrices:mkPrices(45000),shopStats:mkShopStats(28200,4.9),why:"필수",when:"필수",tip:""},{id:"11-9",cat:"이동용품",name:"다이치 원픽 360 카시트",brand:"다이치",price:380000,reviews:16200,rating:4.9,sales:34000,img:"🚗",score:85,shopPrices:mkPrices(380000),shopStats:mkShopStats(16200,4.9),why:"필수",when:"~",tip:""},{id:"11-10",cat:"이동용품",name:"미니 밀차 보행기",brand:"피셔프라이스",price:52000,reviews:15200,rating:4.8,sales:40000,img:"🛒",score:83,shopPrices:mkPrices(52000),shopStats:mkShopStats(15200,4.8),why:"균형 발달",when:"~",tip:""}],
  12:[{id:"12-1",cat:"놀이/발달",name:"레고 듀플로 대형박스",brand:"레고",price:89000,reviews:33800,rating:4.9,sales:96000,img:"🧱",score:95,shopPrices:mkPrices(89000),shopStats:mkShopStats(33800,4.9),why:"창의성·소근육 최고 도구",when:"12개월~",tip:""},{id:"12-2",cat:"교육/책",name:"뽀로로 한글배우기 전집 20권",brand:"아이코닉스",price:78000,reviews:25600,rating:4.8,sales:68000,img:"📚",score:92,shopPrices:mkPrices(78000),shopStats:mkShopStats(25600,4.8),why:"언어 폭발기 체계적 한글",when:"12개월~",tip:""},{id:"12-3",cat:"기저귀/위생",name:"팸퍼스 점보 6단계 40매",brand:"팸퍼스",price:24900,reviews:44200,rating:4.9,sales:148000,img:"🧷",score:98,shopPrices:mkPrices(24900),shopStats:mkShopStats(44200,4.9),why:"필수",when:"11~16kg",tip:""},{id:"12-4",cat:"음식/간식",name:"남양 아이엠마더 3단계 분유",brand:"남양",price:42000,reviews:45600,rating:4.9,sales:136000,img:"🥛",score:97,shopPrices:mkPrices(42000),shopStats:mkShopStats(45600,4.9),why:"완모 이유 시 분유 3단계",when:"12개월~",tip:"생우유는 12개월 이후"},{id:"12-5",cat:"신발",name:"뉴발란스 키즈 첫 운동화",brand:"뉴발란스",price:52000,reviews:22200,rating:4.8,sales:62000,img:"👟",score:90,shopPrices:mkPrices(52000),shopStats:mkShopStats(22200,4.8),why:"본격 보행기 발 지지",when:"걷기 안정 후",tip:"발볼 넓은 제품"},{id:"12-6",cat:"기저귀/위생",name:"마마베어 물티슈",brand:"마마베어",price:18900,reviews:62000,rating:4.9,sales:198000,img:"🧻",score:99,shopPrices:mkPrices(18900),shopStats:mkShopStats(62000,4.9),why:"필수",when:"항상",tip:""},{id:"12-7",cat:"이유식용품",name:"실리콘 분리 식판",brand:"에디슨",price:15900,reviews:21400,rating:4.8,sales:58000,img:"🍽️",score:88,shopPrices:mkPrices(15900),shopStats:mkShopStats(21400,4.8),why:"자립 식사 완성",when:"~",tip:""},{id:"12-8",cat:"건강/안전",name:"손끼임 방지 안전문",brand:"세이프홈",price:45000,reviews:28200,rating:4.9,sales:78000,img:"🚪",score:90,shopPrices:mkPrices(45000),shopStats:mkShopStats(28200,4.9),why:"필수",when:"필수",tip:""},{id:"12-9",cat:"이동용품",name:"다이치 원픽 360 카시트",brand:"다이치",price:380000,reviews:16200,rating:4.9,sales:34000,img:"🚗",score:84,shopPrices:mkPrices(380000),shopStats:mkShopStats(16200,4.9),why:"필수",when:"~",tip:""},{id:"12-10",cat:"이동용품",name:"미니 밀차 보행기",brand:"피셔프라이스",price:52000,reviews:15200,rating:4.8,sales:40000,img:"🛒",score:82,shopPrices:mkPrices(52000),shopStats:mkShopStats(15200,4.8),why:"균형·보행",when:"~",tip:""}],
};

/* ══════ 소독 정보 ══════ */
const STERILIZE={
  "젖병":        {need:true, cycle:"매 수유 후",  how:"UV소독기 또는 열탕 5분"},
  "젖꼭지":      {need:true, cycle:"매 수유 후",  how:"UV소독기 또는 열탕 5분"},
  "젖병소독기":  {need:true, cycle:"주 1회",      how:"내부 닦고 UV 자체 소독"},
  "젖병세정제":  {need:false,cycle:null,          how:null},
  "수유쿠션":    {need:true, cycle:"주 1~2회",    how:"커버 분리 세탁 60도"},
  "트림타월":    {need:true, cycle:"매 사용 후",  how:"60도 이상 세탁"},
  "속싸개":      {need:true, cycle:"주 2~3회",    how:"40~60도 세탁"},
  "아기침대":    {need:true, cycle:"월 1회",      how:"매트리스 커버 세탁, 프레임 닦기"},
  "방수패드":    {need:true, cycle:"오염 시 즉시",how:"60도 이상 세탁"},
  "아기욕조":    {need:true, cycle:"매 사용 후",  how:"중성세제로 닦고 건조"},
  "바디워시":    {need:false,cycle:null,          how:null},
  "손톱깎이":    {need:true, cycle:"주 1회",      how:"알코올 솜으로 닦기"},
  "체온계":      {need:true, cycle:"매 사용 후",  how:"알코올 솜으로 귀 삽입부 닦기"},
  "온습도계":    {need:false,cycle:null,          how:null},
  "치발기":      {need:true, cycle:"매 사용 후",  how:"흐르는 물로 세척, 주 1회 열탕"},
  "빨대컵":      {need:true, cycle:"매 사용 후",  how:"분리 세척, 빨대 솔 사용"},
  "이유식 용기": {need:true, cycle:"매 사용 후",  how:"열탕 소독 또는 식기세척기"},
  "실리콘 스푼": {need:true, cycle:"매 사용 후",  how:"열탕 소독"},
  "이유식 식판": {need:true, cycle:"매 사용 후",  how:"뜨거운 물 세척"},
  "하이체어":    {need:true, cycle:"매 식사 후",  how:"시트 분리 세탁, 트레이 세척"},
  "딸랑이":      {need:true, cycle:"주 1~2회",    how:"알코올 프리 세정제로 닦기"},
  "장난감":      {need:true, cycle:"주 1~2회",    how:"알코올 프리 세정제로 닦기"},
  "놀이매트":    {need:true, cycle:"주 1회",      how:"중성세제 닦고 자연 건조"},
  "카시트":      {need:true, cycle:"월 1회",      how:"커버 분리 세탁, 프레임 닦기"},
  "유모차":      {need:true, cycle:"월 1회",      how:"시트 커버 세탁, 프레임 닦기"},
  "아기띠":      {need:true, cycle:"월 1~2회",    how:"30~40도 세탁, 건조기 금지"},
  "식판":        {need:true, cycle:"매 사용 후",  how:"뜨거운 물 세척"},
  "턱받이":      {need:true, cycle:"매 사용 후",  how:"60도 이상 세탁"},
  "분유/모유저장팩":{need:true,cycle:"매 사용",   how:"개봉 후 24시간 내 사용"},
};

/* ══════ ESSENTIALS ══════ */
const ESSENTIALS={1:{top5:["젖병","기저귀","물티슈","속싸개","체온계"],items:[{n:"젖병",r:"수유 기본 필수템",e:"🍼"},{n:"기저귀",r:"하루 8~12회 교체",e:"🧷"},{n:"물티슈",r:"항상 필수",e:"🧻"},{n:"속싸개",r:"모로반사 억제 수면 안정",e:"🌙"},{n:"체온계",r:"38도 이상 소아과",e:"🌡️"},{n:"분유/모유저장팩",r:"수유 방식에 따라",e:"🥛"},{n:"젖병소독기",r:"UV 소독 권장",e:"🧹"},{n:"젖병세정제",r:"전용 세정제 필수",e:"🧴"},{n:"배냇저고리",r:"하루 3~5회 교체",e:"👶"},{n:"손싸개/발싸개",r:"체온 유지",e:"🧤"},{n:"아기침대",r:"안전한 수면 공간",e:"🛏️"},{n:"방수패드",r:"3장 이상 로테이션",e:"🛡️"},{n:"손톱깎이",r:"얼굴 긁힘 방지",e:"✂️"},{n:"바디워시",r:"무향 저자극",e:"🛁"},{n:"아기 로션",r:"매일 보습 필수",e:"💧"},{n:"수유쿠션",r:"허리·팔목 통증 예방",e:"🫶"},{n:"트림타월",r:"수유 후 토 방지",e:"🧣"},{n:"아기욕조",r:"신생아 전용 욕조",e:"🚿"},{n:"온습도계",r:"22~24도, 습도 50~60%",e:"📊"},{n:"수면등",r:"야간 수유 편의",e:"💡"}]},2:{top5:["기저귀","젖꼭지","로션","물티슈","체온계"],items:[{n:"기저귀",r:"필수",e:"🧷"},{n:"젖꼭지",r:"교체 필요",e:"🍼"},{n:"로션",r:"피부 보호",e:"💧"},{n:"물티슈",r:"필수",e:"🧻"},{n:"체온계",r:"건강 확인",e:"🌡️"},{n:"모빌",r:"시각 자극",e:"🌀"},{n:"백색소음기",r:"수면 유도",e:"🔊"},{n:"역류방지쿠션",r:"토 방지",e:"🛋️"},{n:"턱받이",r:"침 대비",e:"🧣"},{n:"딸랑이",r:"감각 자극",e:"🪀"},{n:"아기베개",r:"머리 형태",e:"🛏️"},{n:"바디워시",r:"청결",e:"🛁"},{n:"수면등",r:"야간",e:"💡"},{n:"온습도계",r:"환경",e:"📊"},{n:"트림타월",r:"토 방지",e:"🧣"},{n:"손싸개",r:"긁힘 방지",e:"🧤"},{n:"속싸개",r:"수면 안정",e:"🌙"},{n:"수유쿠션",r:"장시간 수유",e:"🫶"},{n:"아기욕조",r:"목욕",e:"🚿"},{n:"젖병",r:"수유",e:"🍼"}]},3:{top5:["유모차","아기띠","기저귀","물티슈","플레이짐"],items:[{n:"유모차",r:"이동 수단",e:"🛸"},{n:"아기띠",r:"외출 편의",e:"🎽"},{n:"기저귀",r:"필수",e:"🧷"},{n:"물티슈",r:"필수",e:"🧻"},{n:"플레이짐",r:"운동 발달",e:"🎮"},{n:"딸랑이",r:"청각 자극",e:"🪀"},{n:"바운서",r:"부모 휴식",e:"🪑"},{n:"백색소음기",r:"수면",e:"🔊"},{n:"로션",r:"피부",e:"💧"},{n:"체온계",r:"건강",e:"🌡️"},{n:"턱받이",r:"침",e:"🧣"},{n:"속싸개",r:"수면",e:"🌙"},{n:"방수패드",r:"위생",e:"🛡️"},{n:"장난감",r:"감각",e:"🧸"},{n:"온습도계",r:"환경",e:"📊"},{n:"수면등",r:"야간",e:"💡"},{n:"바디워시",r:"청결",e:"🛁"},{n:"트림쿠션",r:"소화",e:"🛋️"},{n:"아기침대",r:"수면",e:"🛏️"},{n:"젖병",r:"수유",e:"🍼"}]},4:{top5:["치발기","기저귀","물티슈","턱받이","이유식스푼"],items:[{n:"치발기",r:"이앓이",e:"🦒"},{n:"기저귀",r:"필수",e:"🧷"},{n:"물티슈",r:"필수",e:"🧻"},{n:"턱받이",r:"음식",e:"🧣"},{n:"이유식 스푼",r:"먹이기",e:"🥄"},{n:"이유식도구",r:"이유식 준비",e:"🥣"},{n:"간이 의자",r:"앉기",e:"🪑"},{n:"유모차",r:"외출",e:"🛸"},{n:"아기띠",r:"이동",e:"🎽"},{n:"놀이매트",r:"안전",e:"🟩"},{n:"장난감",r:"발달",e:"🧸"},{n:"바운서",r:"휴식",e:"🪑"},{n:"로션",r:"피부",e:"💧"},{n:"체온계",r:"건강",e:"🌡️"},{n:"방수패드",r:"위생",e:"🛡️"},{n:"수면등",r:"야간",e:"💡"},{n:"온습도계",r:"환경",e:"📊"},{n:"바디워시",r:"세정",e:"🛁"},{n:"젖병",r:"수유",e:"🍼"},{n:"촉감 장난감",r:"감각",e:"🎯"}]},5:{top5:["이유식식기","빨대컵","하이체어","기저귀","물티슈"],items:[{n:"이유식 용기",r:"보관",e:"🥣"},{n:"빨대컵",r:"물 섭취",e:"🥤"},{n:"하이체어",r:"식사 자세",e:"🪑"},{n:"실리콘 스푼",r:"안전",e:"🥄"},{n:"이유식 식판",r:"식사",e:"🍽️"},{n:"기저귀",r:"필수",e:"🧷"},{n:"물티슈",r:"필수",e:"🧻"},{n:"턱받이",r:"오염",e:"🧣"},{n:"치발기",r:"이앓이",e:"🦒"},{n:"놀이매트",r:"안전",e:"🟩"},{n:"책",r:"인지",e:"📚"},{n:"안전문",r:"낙상",e:"🚪"},{n:"모서리 보호대",r:"안전",e:"🛡️"},{n:"체온계",r:"건강",e:"🌡️"},{n:"간식통",r:"간식",e:"🍪"},{n:"로션",r:"피부",e:"💧"},{n:"유모차",r:"외출",e:"🛸"},{n:"아기띠",r:"이동",e:"🎽"},{n:"장난감",r:"발달",e:"🧸"},{n:"바디워시",r:"세정",e:"🛁"}]},6:{top5:["이유식식기","빨대컵","하이체어","기저귀","물티슈"],items:[{n:"이유식 용기",r:"보관",e:"🥣"},{n:"빨대컵",r:"물",e:"🥤"},{n:"하이체어",r:"식사",e:"🪑"},{n:"실리콘 스푼",r:"안전",e:"🥄"},{n:"기저귀",r:"필수",e:"🧷"},{n:"물티슈",r:"필수",e:"🧻"},{n:"턱받이",r:"오염",e:"🧣"},{n:"치발기",r:"이앓이",e:"🦒"},{n:"놀이매트",r:"안전",e:"🟩"},{n:"책",r:"인지",e:"📚"},{n:"안전문",r:"낙상",e:"🚪"},{n:"모서리 보호대",r:"안전",e:"🛡️"},{n:"체온계",r:"건강",e:"🌡️"},{n:"간식통",r:"간식",e:"🍪"},{n:"로션",r:"피부",e:"💧"},{n:"유모차",r:"외출",e:"🛸"},{n:"아기띠",r:"이동",e:"🎽"},{n:"장난감",r:"발달",e:"🧸"},{n:"이유식 다지기",r:"조리",e:"🔧"},{n:"이유식 식판",r:"식사",e:"🍽️"}]},7:{top5:["안전문","기저귀","물티슈","놀이매트","빨대컵"],items:[{n:"안전문",r:"이동 제한",e:"🚪"},{n:"기저귀",r:"필수",e:"🧷"},{n:"물티슈",r:"필수",e:"🧻"},{n:"놀이매트",r:"충격",e:"🟩"},{n:"빨대컵",r:"수분",e:"🥤"},{n:"쌓기 장난감",r:"발달",e:"🧱"},{n:"책",r:"인지",e:"📚"},{n:"간식컵",r:"자가섭취",e:"🍪"},{n:"모서리 보호대",r:"안전",e:"🛡️"},{n:"콘센트 커버",r:"감전",e:"🔌"},{n:"카시트",r:"이동",e:"🚗"},{n:"식판",r:"식사",e:"🍽️"},{n:"무릎보호대",r:"기기",e:"🛡️"},{n:"턱받이",r:"오염",e:"🧣"},{n:"로션",r:"피부",e:"💧"},{n:"체온계",r:"건강",e:"🌡️"},{n:"장난감",r:"발달",e:"🧸"},{n:"연습 신발",r:"걷기",e:"👟"},{n:"유모차",r:"외출",e:"🛸"},{n:"바디워시",r:"세정",e:"🛁"}]},8:{top5:["안전문","기저귀","물티슈","놀이매트","빨대컵"],items:[{n:"안전문",r:"이동",e:"🚪"},{n:"기저귀",r:"필수",e:"🧷"},{n:"물티슈",r:"필수",e:"🧻"},{n:"놀이매트",r:"충격",e:"🟩"},{n:"빨대컵",r:"수분",e:"🥤"},{n:"하이체어",r:"식사",e:"🪑"},{n:"쌓기 장난감",r:"발달",e:"🧱"},{n:"책",r:"인지",e:"📚"},{n:"모서리 보호대",r:"안전",e:"🛡️"},{n:"콘센트 커버",r:"감전",e:"🔌"},{n:"카시트",r:"이동",e:"🚗"},{n:"식판",r:"식사",e:"🍽️"},{n:"무릎보호대",r:"기기",e:"🛡️"},{n:"턱받이",r:"오염",e:"🧣"},{n:"로션",r:"피부",e:"💧"},{n:"체온계",r:"건강",e:"🌡️"},{n:"장난감",r:"발달",e:"🧸"},{n:"연습 신발",r:"걷기",e:"👟"},{n:"유모차",r:"외출",e:"🛸"},{n:"바디워시",r:"세정",e:"🛁"}]},9:{top5:["안전문","기저귀","물티슈","놀이매트","빨대컵"],items:[{n:"안전문",r:"이동",e:"🚪"},{n:"기저귀",r:"필수",e:"🧷"},{n:"물티슈",r:"필수",e:"🧻"},{n:"놀이매트",r:"충격",e:"🟩"},{n:"빨대컵",r:"수분",e:"🥤"},{n:"보행기",r:"걷기 연습",e:"🚶"},{n:"책",r:"인지",e:"📚"},{n:"연습 신발",r:"걷기",e:"👟"},{n:"카시트",r:"이동",e:"🚗"},{n:"모서리 보호대",r:"안전",e:"🛡️"},{n:"콘센트 커버",r:"감전",e:"🔌"},{n:"식판",r:"식사",e:"🍽️"},{n:"무릎보호대",r:"기기",e:"🛡️"},{n:"턱받이",r:"오염",e:"🧣"},{n:"로션",r:"피부",e:"💧"},{n:"체온계",r:"건강",e:"🌡️"},{n:"장난감",r:"발달",e:"🧸"},{n:"유모차",r:"외출",e:"🛸"},{n:"간식컵",r:"자가섭취",e:"🍪"},{n:"바디워시",r:"세정",e:"🛁"}]},10:{top5:["걸음마신발","기저귀","물티슈","식판","간식"],items:[{n:"걸음마 신발",r:"보행",e:"👟"},{n:"기저귀",r:"필수",e:"🧷"},{n:"물티슈",r:"필수",e:"🧻"},{n:"식판",r:"식사",e:"🍽️"},{n:"간식",r:"자율",e:"🍪"},{n:"밀차",r:"균형",e:"🛒"},{n:"컵",r:"음수",e:"🥤"},{n:"책",r:"학습",e:"📚"},{n:"카시트",r:"이동",e:"🚗"},{n:"안전문",r:"안전",e:"🚪"},{n:"유모차",r:"외출",e:"🛸"},{n:"장난감",r:"발달",e:"🧸"},{n:"로션",r:"피부",e:"💧"},{n:"체온계",r:"건강",e:"🌡️"},{n:"놀이매트",r:"안전",e:"🟩"},{n:"의자",r:"식사",e:"🪑"},{n:"활동 장난감",r:"활동",e:"🎯"},{n:"수납함",r:"정리",e:"📦"},{n:"방한복",r:"보온",e:"🧥"},{n:"바디워시",r:"세정",e:"🛁"}]},11:{top5:["걸음마신발","책","기저귀","물티슈","간식"],items:[{n:"걸음마 신발",r:"보행",e:"👟"},{n:"책",r:"학습",e:"📚"},{n:"기저귀",r:"필수",e:"🧷"},{n:"물티슈",r:"필수",e:"🧻"},{n:"간식",r:"자율",e:"🍪"},{n:"밀차",r:"균형",e:"🛒"},{n:"컵",r:"음수",e:"🥤"},{n:"장난감",r:"발달",e:"🧸"},{n:"카시트",r:"이동",e:"🚗"},{n:"안전문",r:"안전",e:"🚪"},{n:"유모차",r:"외출",e:"🛸"},{n:"식판",r:"식사",e:"🍽️"},{n:"로션",r:"피부",e:"💧"},{n:"체온계",r:"건강",e:"🌡️"},{n:"놀이매트",r:"안전",e:"🟩"},{n:"의자",r:"식사",e:"🪑"},{n:"활동 장난감",r:"활동",e:"🎯"},{n:"수납함",r:"정리",e:"📦"},{n:"방한복",r:"보온",e:"🧥"},{n:"바디워시",r:"세정",e:"🛁"}]},12:{top5:["걸음마신발","분유","기저귀","물티슈","책"],items:[{n:"걸음마 신발",r:"보행",e:"👟"},{n:"분유",r:"영양",e:"🥛"},{n:"기저귀",r:"필수",e:"🧷"},{n:"물티슈",r:"필수",e:"🧻"},{n:"책",r:"학습",e:"📚"},{n:"밀차",r:"균형",e:"🛒"},{n:"식판",r:"식사",e:"🍽️"},{n:"컵",r:"음수",e:"🥤"},{n:"장난감",r:"발달",e:"🧸"},{n:"카시트",r:"이동",e:"🚗"},{n:"안전문",r:"안전",e:"🚪"},{n:"유모차",r:"외출",e:"🛸"},{n:"로션",r:"피부",e:"💧"},{n:"체온계",r:"건강",e:"🌡️"},{n:"놀이매트",r:"안전",e:"🟩"},{n:"의자",r:"식사",e:"🪑"},{n:"활동 장난감",r:"활동",e:"🎯"},{n:"수납함",r:"정리",e:"📦"},{n:"방한복",r:"보온",e:"🧥"},{n:"바디워시",r:"세정",e:"🛁"}]}};

const CHECKLIST=[{id:"c1",cat:"기저귀/위생",item:"기저귀 (신생아 1단계)",e:"🧷"},{id:"c2",cat:"기저귀/위생",item:"물티슈 (두꺼운 타입)",e:"🧻"},{id:"c3",cat:"기저귀/위생",item:"기저귀 쓰레기통",e:"🗑️"},{id:"c4",cat:"기저귀/위생",item:"방수패드 3장 이상",e:"🛡️"},{id:"c5",cat:"기저귀/위생",item:"기저귀 발진 크림",e:"🧴"},{id:"c6",cat:"수유용품",item:"젖병 3개 이상",e:"🍼"},{id:"c7",cat:"수유용품",item:"UV 젖병 소독기",e:"🧹"},{id:"c8",cat:"수유용품",item:"젖병 세정제 + 솔",e:"🧴"},{id:"c9",cat:"수유용품",item:"분유 또는 모유저장팩",e:"🥛"},{id:"c10",cat:"수유용품",item:"수유쿠션",e:"🫶"},{id:"c11",cat:"수유용품",item:"트림타월 3장",e:"🧣"},{id:"c12",cat:"수유용품",item:"분유 포타블 케이스",e:"📦"},{id:"c13",cat:"수면용품",item:"속싸개 스와들 2~3개",e:"🌙"},{id:"c14",cat:"수면용품",item:"아기침대 또는 바구니침대",e:"🛏️"},{id:"c15",cat:"수면용품",item:"백색소음기",e:"🔊"},{id:"c16",cat:"수면용품",item:"야간 수면등",e:"💡"},{id:"c17",cat:"수면용품",item:"아기 베개 경추 보호형",e:"🛋️"},{id:"c18",cat:"목욕/스킨",item:"아기욕조",e:"🚿"},{id:"c19",cat:"목욕/스킨",item:"바디워시 + 샴푸 무향",e:"🛁"},{id:"c20",cat:"목욕/스킨",item:"아기 로션",e:"💧"},{id:"c21",cat:"목욕/스킨",item:"귀 체온계",e:"🌡️"},{id:"c22",cat:"목욕/스킨",item:"아기 손톱깎이",e:"✂️"},{id:"c23",cat:"의류",item:"배냇저고리 5벌",e:"👶"},{id:"c24",cat:"의류",item:"바디수트 여러 벌",e:"👕"},{id:"c25",cat:"의류",item:"손싸개 + 발싸개",e:"🧤"},{id:"c26",cat:"의류",item:"모자",e:"🎩"},{id:"c27",cat:"의류",item:"실리콘 턱받이 5개",e:"🧣"},{id:"c28",cat:"이동용품",item:"유모차 절충형",e:"🛸"},{id:"c29",cat:"이동용품",item:"아기띠",e:"🎽"},{id:"c30",cat:"이동용품",item:"카시트 바구니형",e:"🚗"},{id:"c31",cat:"이동용품",item:"기저귀가방",e:"👜"},{id:"c32",cat:"이유식용품",item:"이유식 블렌더 or 조리기",e:"🍳"},{id:"c33",cat:"이유식용품",item:"냉동 보관 큐브",e:"🧊"},{id:"c34",cat:"이유식용품",item:"실리콘 스푼 세트",e:"🥄"},{id:"c35",cat:"이유식용품",item:"분리 식판",e:"🍽️"},{id:"c36",cat:"이유식용품",item:"하이체어",e:"🪑"},{id:"c37",cat:"이유식용품",item:"빨대컵",e:"🥤"},{id:"c38",cat:"이유식용품",item:"이유식 보관 용기",e:"🥣"},{id:"c39",cat:"놀이/발달",item:"플레이짐 놀이매트",e:"🎮"},{id:"c40",cat:"놀이/발달",item:"딸랑이 세트",e:"🪀"},{id:"c41",cat:"놀이/발달",item:"치발기 소피라지라프",e:"🦒"},{id:"c42",cat:"놀이/발달",item:"흑백 모빌",e:"🌀"},{id:"c43",cat:"놀이/발달",item:"아기 그림책 세트",e:"📚"},{id:"c44",cat:"안전용품",item:"모서리 보호대",e:"🛡️"},{id:"c45",cat:"안전용품",item:"콘센트 안전커버",e:"🔌"},{id:"c46",cat:"안전용품",item:"계단 안전문",e:"🚪"},{id:"c47",cat:"안전용품",item:"서랍 잠금장치",e:"🔒"},{id:"c48",cat:"건강/환경",item:"온습도계",e:"📊"},{id:"c49",cat:"건강/환경",item:"공기청정기",e:"🌬️"},{id:"c50",cat:"건강/환경",item:"아기 전용 세탁세제",e:"🫧"}];

const GUIDES=[
  {id:"g1",title:"출산 전 꼭 사야 할 것 15가지",emoji:"🛍️",tag:"출산 준비",color:PINK,desc:"출산 전에 미리 준비해야 나중에 당황하지 않아요.",
   recs:[{e:"🧷",name:"하기스 뉴보른 1단계 84매",reviews:38100,sales:94500,price:29800,shop:"쿠팡"},{e:"🍼",name:"치코 네이처 젖병 세트",reviews:21840,sales:58200,price:38900,shop:"쿠팡"},{e:"🌡️",name:"브라운 이어 체온계 IRT6520",reviews:28100,sales:67000,price:89000,shop:"쿠팡"}],
   items:[{e:"🧷",name:"기저귀 (신생아)",detail:"최소 2팩 이상. 신생아는 하루 10회 이상 교체합니다. 하기스·팸퍼스가 인기. 배꼽 컷아웃 디자인 선택 권장."},{e:"🧻",name:"물티슈",detail:"두께감 있는 제품으로 최소 5팩 준비. 무향·무알코올 성분 확인. 마마베어, 하기스 순수 인기."},{e:"🍼",name:"젖병 + 소독기",detail:"혼합수유·완분이면 젖병 3개 이상, UV 소독기 준비. 치코·아벤트 인기. UV 소독기는 젖꼭지 변형 없음."},{e:"🌙",name:"속싸개 2~3개",detail:"모로반사로 자주 깨는 신생아에게 필수. 자궁 속 환경과 비슷하게 감싸줘 수면 질 향상. 달그락 인기."},{e:"🌡️",name:"귀 체온계",detail:"열 측정은 응급 상황 판단 핵심. 브라운 이어체온계 추천. 1초 측정, 신생아 안전 설계."},{e:"👶",name:"배냇저고리 5벌",detail:"신생아는 하루 3~5회 옷 갈아입어요. 미리 세탁 후 준비. 순면 소재 선택, 사이즈는 한 단계 크게."},{e:"🛏️",name:"아기침대",detail:"처음엔 바구니 침대도 충분. 부모 침대 옆에 붙이는 형태 추천. 딱딱한 매트리스 필수 (SIDS 예방)."},{e:"🛡️",name:"방수패드 3장",detail:"침대, 수유 쿠션, 외출용으로 각각 필요. 60도 세탁 가능 제품 선택. 방수 코팅 확인."},{e:"🫶",name:"수유쿠션",detail:"모유수유 예정이면 필수. 허리·팔목 통증 크게 줄여줘요. U자형이 쌍둥이에게도 유리."},{e:"🚿",name:"아기욕조",detail:"목욕은 매일 필요. 신생아 전용 받침대 있는 욕조 선택. 5~10cm 물로 충분."},{e:"💧",name:"아기 로션",detail:"신생아 피부는 수분 손실 빠름. 무향 저자극 제품 선택. 세타필·존슨즈·아벤트 추천."},{e:"🛁",name:"바디워시",detail:"피부과 추천 무향 제품. 세타필, 존슨즈, 아벤트 추천. 일반 비누 사용 금지."},{e:"🚗",name:"카시트",detail:"퇴원 시 바로 필요! 미리 설치 연습 필수. ISOFIX 방식이 안전. 다이치 원픽 360 인기."},{e:"✂️",name:"손톱깎이",detail:"신생아 손톱은 빠르게 자라고 날카로움. 아기 전용 사용. 자는 동안 자르는 게 편함."},{e:"🧹",name:"젖병 세정제",detail:"일반 주방세제 금지. 아기 전용 세정제만 사용. 피죤·락앤락 인기."}]},
  {id:"g2",title:"이건 나중에 사도 돼요!",emoji:"⏰",tag:"절약 팁",color:MINT,desc:"처음부터 다 살 필요 없어요. 아기 성장에 맞춰 나중에 사도 늦지 않아요.",
   recs:[{e:"🪑",name:"도나 하이체어",reviews:24400,sales:58000,price:128000,shop:"쿠팡"},{e:"🛸",name:"콤비 스리모 유모차",reviews:14200,sales:22100,price:320000,shop:"쿠팡"},{e:"🧱",name:"레고 듀플로 클래식",reviews:29400,sales:78200,price:42000,shop:"쿠팡"}],
   items:[{e:"🪑",name:"하이체어",detail:"이유식 시작(5~6개월) 때 구매해도 충분. 발판 있는 제품이 식사 집중력 향상. 도나 하이체어 인기."},{e:"🛸",name:"유모차",detail:"처음엔 아기띠로 충분. 3개월 이후 필요성 느끼면 구매. 등받이 완전히 눕혀지는 제품 선택."},{e:"🧱",name:"레고 듀플로",detail:"7개월 이후 소근육 발달 시작 후 구매. 창의성·집중력 발달."},{e:"👟",name:"신발",detail:"서기 시작 전(9~10개월)엔 불필요. 미리 사면 발 맞지 않음. 발볼 넓은 제품 선택."},{e:"🚶",name:"보행기",detail:"9~10개월 서기 연습 시작 후 구매해도 충분. 안에 타는 것 아닌 밀며 걷는 도구 추천."},{e:"📚",name:"전집 책",detail:"6개월 이후 책 관심 보일 때 구매. 처음엔 보드북 소량으로 시작."},{e:"🎮",name:"고가 완구",detail:"3~4개월까지는 흑백 모빌·딸랑이로 충분. 단계에 맞는 장난감 선택."},{e:"🔌",name:"콘센트 커버",detail:"기기 시작 전(6개월)까지는 여유 있음. 기기 시작 직전에 집 전체 설치."}]},
  {id:"g3",title:"신생아 수유 완전 가이드",emoji:"🍼",tag:"수유",color:SKY,desc:"수유는 처음엔 누구나 어렵고 힘들어요. 기본 원칙만 알아도 훨씬 수월해져요.",
   recs:[{e:"🍼",name:"치코 네이처 젖병 세트",reviews:21840,sales:58200,price:38900,shop:"쿠팡"},{e:"🧹",name:"피죤 UV 젖병 소독기",reviews:16200,sales:38900,price:45000,shop:"쿠팡"},{e:"🫶",name:"메델라 수유쿠션 대형",reviews:13800,sales:28100,price:35000,shop:"쿠팡"}],
   items:[{e:"⏰",name:"수유 간격",detail:"신생아: 2~3시간마다. 배가 고프면 울기 전에 수유. 하루 8~12회 정상. 배고픔 신호(손 빨기, 입 오물거리기) 보이면 바로."},{e:"📏",name:"수유량",detail:"1개월:60~90ml / 2개월:90~120ml / 4개월:120~150ml / 6개월:180~210ml. 아기마다 다르니 배부른 신호(고개 돌리기)에 맞추기."},{e:"🌡️",name:"분유 온도",detail:"37도 내외. 손목 안쪽에 떨어뜨려 따뜻하게 느껴지는 정도. 너무 뜨거우면 화상, 너무 차가우면 소화 불량."},{e:"💨",name:"트림 방법",detail:"수유 후 반드시 트림. 어깨에 올리거나 앉혀서 등 두드리기. 10~15분 해도 안 나오면 그냥 눕혀도 OK."},{e:"🚫",name:"역류 방지",detail:"수유 후 30분은 눕히지 않기. 상체를 약간 세운 자세 유지. 역류 잦으면 젖꼭지 구멍 크기 확인."},{e:"🍼",name:"젖병 소독",detail:"6개월까지는 매회 소독 권장. UV 소독기가 열 소독보다 젖꼭지 변형 없음. 이후엔 1일 1회로 줄여도 됨."},{e:"❓",name:"모유 vs 분유",detail:"모유가 면역·영양 최고지만 분유도 충분히 건강하게 자랍니다. 어떤 선택이든 죄책감 갖지 마세요."},{e:"⚠️",name:"병원 가야 할 때",detail:"수유 거부+열 동시 / 구토가 분수처럼 나올 때 / 소변 하루 6회 미만 / 체중이 늘지 않을 때"}]},
  {id:"g4",title:"이유식 단계별 완전 가이드",emoji:"🥣",tag:"이유식",color:"#8BC34A",desc:"5~6개월에 시작해요. 단계별로 질감·재료가 달라지니 순서를 지키는 게 중요해요.",
   recs:[{e:"🥄",name:"에디슨 이유식 스푼 세트",reviews:44200,sales:142000,price:12000,shop:"쿠팡"},{e:"🪑",name:"도나 하이체어",reviews:24400,sales:58000,price:128000,shop:"쿠팡"},{e:"🥣",name:"콤비 이유식 조리기 4종",reviews:19400,sales:48000,price:45000,shop:"쿠팡"}],
   items:[{e:"🟢",name:"초기 이유식 (5~6개월)",detail:"묽은 쌀미음부터 시작. 1~2 찻술 → 점진적 증량. 하루 1회. 새 재료는 3일 간격으로. 새 음식 후 3일간 알레르기 관찰 필수."},{e:"🟡",name:"중기 이유식 (7~8개월)",detail:"입자 있는 형태 (2~3mm). 하루 2회. 두부·닭고기·계란 노른자 추가 가능. 잘게 다지거나 으깬 형태."},{e:"🟠",name:"후기 이유식 (9~11개월)",detail:"잘게 다진 형태. 하루 3회. 계란 흰자·생선·치즈 추가. 어른 밥에 가까워짐."},{e:"🔴",name:"완료기 이유식 (12개월~)",detail:"부드러운 어른 밥. 생우유 시작 가능. 가족 식사 함께 시작. 짠 음식은 여전히 주의."},{e:"❌",name:"절대 주면 안 되는 것",detail:"꿀 (12개월 미만 금지), 생우유 (12개월 미만), 견과류 (통째로), 짠 음식, 설탕. 알레르기 유발 식품은 소량부터."},{e:"✅",name:"알레르기 확인 방법",detail:"새 재료 추가 후 3일 관찰. 발진·구토·설사 시 해당 재료 중단 후 소아과 방문."},{e:"⚖️",name:"이유식 적정량",detail:"초기 30~60ml → 중기 100~150ml → 후기 150~200ml → 완료기 200~250ml."},{e:"💡",name:"잘 안 먹을 때",detail:"강요 금지. 다양한 재료 시도. 식사 분위기 즐겁게. 배고플 때 먹이기. 먹는 척 같이 먹어주기."}]},
  {id:"g5",title:"아기 수면 완전 가이드",emoji:"🌙",tag:"수면",color:LAVEN,desc:"아기 수면 문제는 모든 부모의 공통 고민이에요. 수면 교육 전 알아야 할 기본 지식이에요.",
   recs:[{e:"🌙",name:"달그락 신생아 속싸개 5종",reviews:11200,sales:32400,price:19900,shop:"쿠팡"},{e:"🔊",name:"도도사운드 백색소음기",reviews:11200,sales:28900,price:29000,shop:"쿠팡"},{e:"😴",name:"에르고베이비 스와들업",reviews:11200,sales:22100,price:89000,shop:"쿠팡"}],
   items:[{e:"😴",name:"월령별 수면 시간",detail:"신생아: 14~17시간 / 3~5개월: 12~15시간 / 6~12개월: 11~14시간. 낮잠 포함 전체 수면 시간이에요."},{e:"🌙",name:"낮잠 횟수",detail:"0~3개월: 4~5회 / 4~6개월: 3~4회 / 7~12개월: 2~3회. 낮잠을 너무 재우면 밤 수면이 짧아질 수 있어요."},{e:"⏰",name:"수면 사이클",detail:"아기 수면 사이클은 45분. 45분 후 살짝 깨는 것은 정상이에요. 다시 재우는 연습이 수면 교육의 핵심."},{e:"🏠",name:"수면 환경",detail:"방 온도 20~22도, 습도 50~60%, 암막 커튼, 백색소음 60dB 이하. 환경이 일정해야 아기가 잘 자요."},{e:"🚫",name:"안전 수면 (SIDS 예방)",detail:"항상 등으로 눕히기 / 딱딱한 매트 사용 / 침대에 쿠션·베개 금지 / 흡연 환경 금지."},{e:"💡",name:"수면 의식 만들기",detail:"목욕 → 수유 → 동화책 → 노래 → 취침. 같은 순서 반복이 핵심. 3~4주 꾸준히 해야 효과."},{e:"😭",name:"밤중 수유 끊기",detail:"6개월 이후 점진적으로 줄이기. 수유 간격을 서서히 늘리는 방법 추천."},{e:"⚠️",name:"병원 가야 할 때",detail:"하루 10시간 이하 수면 / 수면 중 호흡 이상 / 잠들다 자주 놀라 깸."}]},
  {id:"g6",title:"아기 발달 단계 체크리스트",emoji:"📈",tag:"발달",color:"#FF7043",desc:"아기마다 발달 속도가 달라요. 범위 안에서 발달하면 정상이에요. 걱정보다 관찰이 먼저예요.",
   recs:[{e:"🎮",name:"피셔프라이스 짐나지움",reviews:25200,sales:62000,price:68000,shop:"쿠팡"},{e:"🦒",name:"소피라지라프 치발기",reviews:33400,sales:88200,price:32000,shop:"쿠팡"},{e:"🧱",name:"레고 듀플로 클래식",reviews:29400,sales:78200,price:42000,shop:"쿠팡"}],
   items:[{e:"1️⃣",name:"1~2개월",detail:"시선 고정, 소리에 반응, 엄마 목소리 인식. 미소 짓기 시작. 흑백 패턴에 관심. 눈과 20~30cm 거리에 물체 보여주기."},{e:"3️⃣",name:"3개월",detail:"목 가누기, 배 밀며 머리 들기, 물체 잡으려는 시도. 손발 뻗기 시작."},{e:"4️⃣",name:"4개월",detail:"뒤집기 시도, 자신의 손 관찰, 옹알이 시작. 소리나는 방향으로 고개 돌리기."},{e:"6️⃣",name:"6개월",detail:"혼자 앉기(보조), 이유식 시작, 물건 집기, 낯가림 시작. 이름에 반응."},{e:"8️⃣",name:"8개월",detail:"기기 시작, 혼자 앉기 가능, '엄마·아빠' 흉내, 짝짜꿍."},{e:"🔟",name:"10개월",detail:"잡고 서기, 손가락으로 집기(핀셋 쥐기), 간단한 지시 이해."},{e:"1️⃣2️⃣",name:"12개월",detail:"첫 걸음마, 첫 단어, 컵으로 음수, 어른 행동 모방."},{e:"⚠️",name:"전문가 상담 필요",detail:"눈 맞춤 없음 / 이름에 무반응 / 9개월에도 못 앉음 / 12개월에 한 단어도 없음."}]}
];

/* ═══════════════════════════════════════════════════
   SPLASH
════════════════════════════════════════════════════ */
function Splash(){
  const bubbles=["🍼","🧸","🌙","💫","🎀","🐣","✨","🦋","💕","🌸","👶","🐥","🌟","🍭","🦄","🐰","🌈","⭐","🎠","🌻"];
  return(
    <div style={{position:"fixed",inset:0,zIndex:9999,overflow:"hidden",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",animation:"splashOut 0.8s ease 3.8s forwards",background:"linear-gradient(145deg,#FFF0E8 0%,#FFF8F2 50%,#F2F0FF 100%)"}}>
      {bubbles.map((f,i)=>(
        <div key={i} style={{position:"absolute",fontSize:10+i%14,left:`${(i*13+7)%92}%`,bottom:"-8%",opacity:0.5,animation:`floatUp ${5+i*0.55}s ${i*0.2}s infinite linear`,pointerEvents:"none",filter:"drop-shadow(0 1px 3px rgba(255,112,67,0.15))"}}>{f}</div>
      ))}
      {[{x:7,y:14,d:0},{x:87,y:18,d:0.5},{x:10,y:72,d:1},{x:84,y:68,d:0.3},{x:48,y:7,d:0.7},{x:25,y:85,d:0.2},{x:70,y:88,d:0.9}].map((st,i)=>(
        <div key={i} style={{position:"absolute",left:`${st.x}%`,top:`${st.y}%`,fontSize:12+i*2,animation:`starTwinkle ${1.8+st.d}s ${st.d}s ease-in-out infinite`,opacity:0.65}}>✨</div>
      ))}
      <div style={{textAlign:"center",zIndex:1,padding:"0 28px",display:"flex",flexDirection:"column",alignItems:"center",gap:10}}>
        <div style={{position:"relative",marginBottom:2}}>
          <div style={{fontSize:68,animation:"spinBounce 1s ease, float 3s 1s ease-in-out infinite",display:"inline-block",filter:"drop-shadow(0 8px 20px rgba(255,179,71,0.55))"}}>☀️</div>
          {["💫","✨","⭐","🌟"].map((s,i)=>(
            <div key={i} style={{position:"absolute",fontSize:13+i*2,top:[-6,10,-2,14][i],left:[-22,54,58,-18][i],animation:`starTwinkle ${1.1+i*0.25}s ${i*0.25}s ease-in-out infinite`}}>{s}</div>
          ))}
        </div>
        <div style={{fontSize:50,fontWeight:900,letterSpacing:-2,lineHeight:1,background:`linear-gradient(135deg,${P} 0%,#FF8C42 35%,${G} 65%,${PINK} 100%)`,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",animation:"fadeUp 0.5s 0.2s both",filter:"drop-shadow(0 2px 6px rgba(255,112,67,0.25))"}}>HANA</div>
        <div style={{animation:"fadeUp 0.6s 0.55s both",opacity:0,lineHeight:2}}>
          <div style={{fontSize:12,fontWeight:600,color:"#A08878",letterSpacing:0.3}}>가장 저렴하고 믿을만한 리뷰를 통한</div>
          <div style={{fontSize:15,fontWeight:900,color:TX,letterSpacing:-0.2}}>
            내{" "}<span style={{color:P,fontSize:19,animation:"heartBeat 1.3s ease-in-out infinite",display:"inline-block"}}>❤️</span>{" "}
            <span style={{background:`linear-gradient(135deg,${P},${PINK})`,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>'하나'</span>뿐인 아이를 위한 앱
          </div>
        </div>
        <div style={{display:"flex",gap:14,animation:"fadeUp 0.5s 0.85s both",opacity:0}}>
          {["🍼","👶","🧸","💕","⭐"].map((e,i)=>(
            <span key={i} style={{fontSize:26,animation:`bounceSoft ${0.9+i*0.13}s ${i*0.09}s ease-in-out infinite`,display:"inline-block",filter:"drop-shadow(0 2px 4px rgba(0,0,0,0.08))"}}>{e}</span>
          ))}
        </div>
        <div style={{fontSize:9,color:MU,letterSpacing:1.2,animation:"fadeUp 0.5s 1.1s both",opacity:0}}>5개 쇼핑몰 통합 분석 · 월령별 맞춤 가이드</div>
      </div>
      <div style={{position:"absolute",bottom:0,left:0,right:0,height:90,background:"linear-gradient(0deg,rgba(255,220,196,0.35),transparent)",borderRadius:"55% 55% 0 0",animation:"float 4s ease-in-out infinite"}}/>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   AUTH MODAL
════════════════════════════════════════════════════ */
function AuthModal({onClose,onLogin}){
  const [view,setView]=useState("main"),[name,setName]=useState(""),[email,setEmail]=useState(""),[pw,setPw]=useState(""),[pw2,setPw2]=useState(""),[err,setErr]=useState("");
  const inp={width:"100%",background:BG,border:`1.5px solid ${BO}`,borderRadius:12,padding:"12px 14px",fontSize:14,color:TX,boxSizing:"border-box",outline:"none",fontFamily:"inherit",marginBottom:10};
  const doLogin=()=>{if(!email||!pw){setErr("입력해주세요");return;}onLogin({name:name||email.split("@")[0],email});onClose();};
  const doSignup=()=>{if(!name){setErr("이름 입력");return;}if(!email.includes("@")){setErr("올바른 이메일");return;}if(pw.length<6){setErr("비밀번호 6자 이상");return;}if(pw!==pw2){setErr("비밀번호 불일치");return;}onLogin({name,email});onClose();};
  return(
    <div style={{position:"fixed",inset:0,zIndex:700,display:"flex",alignItems:"flex-end"}}>
      <div style={{position:"absolute",inset:0,background:"rgba(0,0,0,0.5)"}} onClick={onClose}/>
      <div style={{position:"relative",width:"100%",background:CA,borderRadius:"24px 24px 0 0",maxHeight:"92vh",overflowY:"auto",animation:"sheetUp .25s ease",boxShadow:"0 -8px 40px rgba(0,0,0,0.2)"}}>
        <div style={{display:"flex",justifyContent:"center",padding:"14px 0 4px"}}><div style={{width:40,height:4,borderRadius:9,background:BO}}/></div>
        <div style={{padding:"10px 22px 40px"}}>
          {view==="main"&&<>
            <div style={{textAlign:"center",marginBottom:20}}>
              <div style={{fontSize:40,animation:"spin 6s linear infinite",display:"inline-block"}}>☀️</div>
              <div style={{fontSize:22,fontWeight:900,background:`linear-gradient(135deg,${P},${G})`,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",letterSpacing:-1}}>HANA</div>
              <div style={{fontSize:12,color:MU,marginTop:2}}>초보 엄마아빠를 위한 궁금증 해소 💕</div>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:14}}>
              {[{bg:"#FEE500",color:"#3C1E1E",e:"💬",l:"카카오로 시작",cb:()=>{onLogin({name:"카카오 맘",email:"kakao@hana.com"});onClose();}},{bg:"#03C75A",color:"#fff",e:"🟢",l:"네이버로 시작",cb:()=>{onLogin({name:"네이버 맘",email:"naver@hana.com"});onClose();}},{bg:"#fff",color:TX,e:"📧",l:"이메일로 로그인",cb:()=>setView("login"),bd:true}].map(({bg,color,e,l,cb,bd})=>(
                <button key={l} onClick={cb} style={{width:"100%",background:bg,color,border:bd?`1.5px solid ${BO}`:"none",borderRadius:14,padding:"14px",fontWeight:800,fontSize:14,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}><span>{e}</span>{l}</button>
              ))}
            </div>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}><div style={{flex:1,height:1,background:BO}}/><span style={{fontSize:11,color:MU}}>처음이신가요?</span><div style={{flex:1,height:1,background:BO}}/></div>
            <button onClick={()=>setView("signup")} style={{width:"100%",background:`linear-gradient(135deg,${P},${G})`,color:"#fff",border:"none",borderRadius:14,padding:"14px",fontWeight:900,fontSize:14,cursor:"pointer"}}>✨ 회원가입하기</button>
          </>}
          {view==="login"&&<>
            <button onClick={()=>{setView("main");setErr("");}} style={{background:"none",border:"none",color:MU,fontSize:13,cursor:"pointer",padding:0,marginBottom:12}}>← 뒤로</button>
            <div style={{fontSize:17,fontWeight:900,color:TX,marginBottom:4}}>이메일 로그인</div>
            {err&&<div style={{background:"#FFE8E8",borderRadius:10,padding:"9px 12px",color:"#D32F2F",fontSize:12,fontWeight:700,marginBottom:10}}>⚠️ {err}</div>}
            <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="이메일" type="email" style={inp}/>
            <input value={pw} onChange={e=>setPw(e.target.value)} placeholder="비밀번호" type="password" style={{...inp,marginBottom:14}}/>
            <button onClick={doLogin} style={{width:"100%",background:`linear-gradient(135deg,${P},${G})`,color:"#fff",border:"none",borderRadius:14,padding:"14px",fontSize:15,fontWeight:900,cursor:"pointer",marginBottom:10}}>로그인</button>
            <button onClick={()=>{setView("signup");setErr("");}} style={{width:"100%",background:"none",border:"none",color:P,fontSize:13,fontWeight:700,cursor:"pointer"}}>계정 없어요? 회원가입</button>
          </>}
          {view==="signup"&&<>
            <button onClick={()=>{setView("main");setErr("");}} style={{background:"none",border:"none",color:MU,fontSize:13,cursor:"pointer",padding:0,marginBottom:12}}>← 뒤로</button>
            <div style={{fontSize:17,fontWeight:900,color:TX,marginBottom:4}}>회원가입 👶</div>
            {err&&<div style={{background:"#FFE8E8",borderRadius:10,padding:"9px 12px",color:"#D32F2F",fontSize:12,fontWeight:700,marginBottom:10}}>⚠️ {err}</div>}
            <input value={name} onChange={e=>setName(e.target.value)} placeholder="이름" style={inp}/>
            <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="이메일" type="email" style={inp}/>
            <input value={pw} onChange={e=>setPw(e.target.value)} placeholder="비밀번호 (6자 이상)" type="password" style={inp}/>
            <input value={pw2} onChange={e=>setPw2(e.target.value)} placeholder="비밀번호 확인" type="password" style={{...inp,marginBottom:14}}/>
            <button onClick={doSignup} style={{width:"100%",background:`linear-gradient(135deg,${P},${G})`,color:"#fff",border:"none",borderRadius:14,padding:"14px",fontSize:15,fontWeight:900,cursor:"pointer",marginBottom:10}}>가입하기 🎉</button>
            <button onClick={()=>{setView("login");setErr("");}} style={{width:"100%",background:"none",border:"none",color:P,fontSize:13,fontWeight:700,cursor:"pointer"}}>이미 계정 있어요? 로그인</button>
          </>}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   PRODUCT DETAIL — 쇼핑몰별 가격+리뷰+별점 비교
════════════════════════════════════════════════════ */
function ProductDetail({p,wished,onWish,onClose,activeShops}){
  if(!p)return null;
  const sp=p.shopPrices||mkPrices(p.price);
  const ss=p.shopStats||mkShopStats(p.reviews,p.rating);
  // activeShops 필터 적용
  const shops=activeShops.length>0?activeShops:SHOP_NAMES;
  const entries=Object.entries(sp).filter(([s])=>shops.includes(s)).sort((a,b)=>a[1]-b[1]);
  const minP=entries[0]?.[1]||p.price;
  const maxP=entries[entries.length-1]?.[1]||p.price;

  return(
    <div style={{position:"fixed",inset:0,zIndex:600,display:"flex",flexDirection:"column"}}>
      <div style={{flex:1,background:"rgba(0,0,0,0.5)"}} onClick={onClose}/>
      <div style={{background:BG,borderRadius:"24px 24px 0 0",maxHeight:"88vh",display:"flex",flexDirection:"column",animation:"sheetUp .25s ease"}}>
        <div style={{display:"flex",justifyContent:"center",padding:"12px 0 4px"}}><div style={{width:36,height:4,borderRadius:9,background:BO}}/></div>
        <div style={{overflowY:"auto",flex:1,padding:"0 16px 28px"}}>
          {/* Hero */}
          <div style={{textAlign:"center",padding:"10px 0 8px"}}>
            <div style={{fontSize:44,animation:"wobble 3s infinite",marginBottom:6}}>{p.img}</div>
            <div style={{fontSize:15,fontWeight:900,color:TX,lineHeight:1.4,marginBottom:2}}>{p.name}</div>
            <div style={{fontSize:11,color:MU}}>{p.brand} · {p.cat}</div>
            <div style={{display:"flex",gap:10,justifyContent:"center",marginTop:8}}>
              {[{v:`${p.score}점`,l:"종합"},{v:`★${p.rating}`,l:"별점"},{v:p.reviews.toLocaleString(),l:"리뷰"}].map(({v,l})=>(
                <div key={l} style={{background:CA,borderRadius:10,padding:"7px 10px",textAlign:"center",border:`1px solid ${BO}`,minWidth:60}}>
                  <div style={{fontSize:13,fontWeight:900,color:P}}>{v}</div>
                  <div style={{fontSize:9,color:MU}}>{l}</div>
                </div>
              ))}
            </div>
          </div>

          {/* 가격 비교 */}
          <div style={{background:CA,borderRadius:16,padding:"13px",border:`1.5px solid rgba(255,112,67,0.2)`,marginBottom:12}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
              <div style={{fontSize:12,fontWeight:900,color:TX}}>🏪 쇼핑몰별 가격·리뷰 비교</div>
              <div style={{fontSize:11,color:MU}}>{shops.length}개 쇼핑몰</div>
            </div>
            {maxP>minP&&<div style={{background:`rgba(255,112,67,0.08)`,borderRadius:9,padding:"7px 10px",marginBottom:10,display:"flex",justifyContent:"space-between"}}>
              <span style={{fontSize:11,color:P,fontWeight:700}}>💡 최저 대비 최고</span>
              <span style={{fontSize:12,fontWeight:900,color:P}}>{(maxP-minP).toLocaleString()}원 차이!</span>
            </div>}
            {entries.map(([shop,price],i)=>{
              const stat=ss[shop]||{reviews:p.reviews,rating:p.rating};
              const isMin=i===0;
              const clr=SHOPS[shop]?.color||"#888";
              return(
                <div key={shop} style={{borderBottom:i<entries.length-1?`1px solid ${BO}`:"none",paddingBottom:i<entries.length-1?10:0,marginBottom:i<entries.length-1?10:0}}>
                  <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:6}}>
                    <div style={{width:20,height:20,borderRadius:6,flexShrink:0,background:isMin?`linear-gradient(135deg,${P},${G})`:"rgba(0,0,0,0.06)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:900,color:isMin?"#fff":MU}}>{i+1}</div>
                    <span style={{fontSize:12,fontWeight:800,color:clr,width:48,flexShrink:0}}>{shop}</span>
                    <div style={{flex:1}}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:3}}>
                        <span style={{fontSize:14,fontWeight:900,color:isMin?P:TX}}>{price.toLocaleString()}원</span>
                        {isMin&&<span style={{fontSize:9,background:`linear-gradient(135deg,${P},${G})`,color:"#fff",borderRadius:5,padding:"2px 5px",fontWeight:900}}>최저</span>}
                      </div>
                      <div style={{display:"flex",gap:6,fontSize:10,color:MU}}>
                        <span>★{stat.rating}</span>
                        <span>리뷰 {stat.reviews.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                  <button onClick={()=>goShop(shop,p.name)} style={{width:"100%",background:`${clr}10`,border:`1px solid ${clr}30`,color:clr,borderRadius:9,padding:"8px",fontSize:11,fontWeight:800,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:5}}>
                    <span>{shop}</span> 사러가기 →
                  </button>
                </div>
              );
            })}
          </div>

          {/* Why/When/Tip */}
          {p.why&&(
            <div style={{display:"flex",flexDirection:"column",gap:7,marginBottom:12}}>
              {[{icon:"❓",label:"왜 필요한가요?",val:p.why},{icon:"📅",label:"언제 사용하나요?",val:p.when},{icon:"💡",label:"사용 팁",val:p.tip}].filter(x=>x.val).map(({icon,label,val})=>(
                <div key={label} style={{background:CA,borderRadius:12,padding:"11px 12px",border:`1px solid ${BO}`}}>
                  <div style={{fontSize:10,fontWeight:800,color:MU,marginBottom:3}}>{icon} {label}</div>
                  <div style={{fontSize:12,color:TX,lineHeight:1.6}}>{val}</div>
                </div>
              ))}
            </div>
          )}

          {/* 찜 */}
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"11px 12px",background:CA,borderRadius:12,border:`1px solid ${BO}`}}>
            <div style={{fontSize:10,color:MU,lineHeight:1.5}}>HANA는 소개만 해드려요<br/>구매는 각 쇼핑몰에서 😊</div>
            <button onClick={()=>onWish(p)} style={{flexShrink:0,background:wished?"rgba(255,112,67,0.1)":"rgba(0,0,0,0.04)",border:`1.5px solid ${wished?P:BO}`,borderRadius:11,padding:"7px 13px",fontSize:13,cursor:"pointer",color:wished?P:MU,fontWeight:700}}>
              {wished?"❤️ 찜됨":"🤍 찜"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   COMPACT PRODUCT CARD — 작게, 많이 보여주기
════════════════════════════════════════════════════ */
function PCard({p,rank,wished,onWish,onClick,activeShops}){
  const isTop=rank===1;
  const {data:naver,loading}=useNaverPrice(p.name);

  // 사러가기 — 네이버 직접 상품 링크
  function goNaver(e){
    e.stopPropagation();
    if(naver?.link) window.open(naver.link,"_blank");
    else window.open(`https://search.shopping.naver.com/search/all?query=${encodeURIComponent(p.name)}&sort=rel`,"_blank");
  }

  return(
    <div onClick={goNaver} style={{background:isTop?`linear-gradient(135deg,#FFF3EA,#FFFBE6)`:CA,borderRadius:14,padding:"12px",border:isTop?`2px solid rgba(255,112,67,0.45)`:`1px solid ${BO}`,position:"relative",boxShadow:isTop?`0 4px 16px rgba(255,112,67,0.12)`:`0 1px 6px rgba(0,0,0,0.04)`,cursor:"pointer"}}>

      {/* 순위 뱃지 */}
      {rank&&<div style={{position:"absolute",top:-8,left:10,background:rank===1?`linear-gradient(135deg,${P},${G})`:rank===2?"#9E9E9E":rank===3?"#C8874A":rank<=5?"#8BC34A":"#E0D8D0",color:rank<=5?"#fff":"#999",borderRadius:9,padding:"1px 7px",fontSize:9,fontWeight:900}}>{rank===1?"🏆 1위":`${rank}위`}</div>}

      {/* 찜 버튼 */}
      <button onClick={e=>{e.stopPropagation();onWish(p);}} style={{position:"absolute",top:8,right:8,background:"none",border:"none",fontSize:16,cursor:"pointer",opacity:wished?1:0.25}}>❤️</button>

      <div style={{display:"flex",gap:10,alignItems:"flex-start",marginTop:rank?8:0}}>
        {/* 이미지 */}
        <div style={{flexShrink:0,width:70,height:70,borderRadius:10,overflow:"hidden",border:`1px solid ${BO}`,background:"#F5F0EB",display:"flex",alignItems:"center",justifyContent:"center"}}>
          {loading
            ?<div style={{width:"100%",height:"100%",background:"#F0EDE8",animation:"pulse 1.5s infinite"}}/>
            :naver?.image
              ?<img src={naver.image} alt={p.name} style={{width:"100%",height:"100%",objectFit:"cover"}} onError={e=>{e.target.style.display="none";e.target.parentNode.innerHTML=`<span style="font-size:28px">${p.img}</span>`;}}/>
              :<span style={{fontSize:28}}>{p.img}</span>
          }
        </div>

        {/* 상품 정보 */}
        <div style={{flex:1,minWidth:0,paddingRight:24}}>
          <div style={{fontSize:8,color:MU,marginBottom:3}}>{p.cat} · {p.brand}</div>
          <div style={{fontSize:13,fontWeight:800,color:TX,lineHeight:1.35,marginBottom:6,overflow:"hidden",display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical"}}>{p.name}</div>

          {/* 네이버 실시간 데이터만 표시 */}
          {loading
            ?<div style={{fontSize:10,color:"#aaa"}}>가격 조회중...</div>
            :naver
              ?<div>
                <div style={{fontSize:15,fontWeight:900,color:"#FF7043",marginBottom:4}}>{naver.lprice?.toLocaleString()}원~</div>
                <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
                  {naver.reviewCount>0&&<span style={{fontSize:9,background:"#F5F0EB",color:"#666",borderRadius:4,padding:"2px 6px"}}>💬 리뷰 {naver.reviewCount?.toLocaleString()}</span>}
                  <span style={{fontSize:9,background:"#E8F5E9",color:"#2E7D32",borderRadius:4,padding:"2px 6px",fontWeight:700}}>N 네이버</span>
                  {naver.mallName&&<span style={{fontSize:9,color:"#aaa"}}>{naver.mallName}</span>}
                </div>
              </div>
              :<div style={{fontSize:10,color:"#aaa"}}>네이버 정보 없음</div>
          }
        </div>
      </div>

      {/* 하단 버튼 */}
      <div style={{display:"flex",gap:6,marginTop:10,paddingTop:8,borderTop:`1px solid ${BO}`}}>
        <button onClick={goNaver} style={{flex:1,background:"#03C75A",color:"#fff",border:"none",borderRadius:9,padding:"9px",fontSize:12,fontWeight:900,cursor:"pointer"}}>
          네이버에서 바로 구매 →
        </button>
      </div>

      {/* 다른 쇼핑몰 — API 연동 후 표시 예정 */}
      <div style={{marginTop:6,fontSize:9,color:"#CCC",textAlign:"center"}}>
        쿠팡 · 11번가 · 아마존 · 알리 — API 연동 후 표시 예정
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   ESSENTIALS SHEET
════════════════════════════════════════════════════ */
function EssSheet({month,onClose,checks,setChecks,activeShops}){
  const d=ESSENTIALS[month]||ESSENTIALS[1];
  const monthLabel=month===1?"신생아":month+"개월";

  // 상품 데이터에서 해당 아이템 찾기
  const prods=PRODUCTS[month]||[];
  const shops=activeShops&&activeShops.length>0?activeShops:SHOP_NAMES;

  function findProd(name){
    // 상품 데이터에서 찾기
    const found=prods.find(p=>
      p.name.includes(name.replace(/\s/g,"").slice(0,4))||
      name.includes(p.name.slice(0,4))||
      name.replace(/\s/g,"")===p.name.replace(/\s/g,"").slice(0,name.replace(/\s/g,"").length)
    );
    // 못 찾으면 가격 없는 더미 객체 반환 (쿠팡 검색용)
    if(!found) return {name,price:null,shopPrices:null,notFound:true};
    return found;
  }

  const doneCnt=d.items.filter(item=>checks["ess_"+month+"_"+item.n]).length;

  return(
    <div style={{position:"fixed",inset:0,zIndex:500,display:"flex",flexDirection:"column"}}>
      <div style={{flex:1,background:"rgba(0,0,0,0.5)"}} onClick={onClose}/>
      <div style={{background:BG,borderRadius:"24px 24px 0 0",maxHeight:"90vh",display:"flex",flexDirection:"column",animation:"sheetUp .25s ease"}}>
        <div style={{display:"flex",justifyContent:"center",padding:"12px 0 4px"}}><div style={{width:36,height:4,borderRadius:9,background:BO}}/></div>

        {/* 헤더 */}
        <div style={{padding:"6px 16px 12px",background:CA,borderRadius:"24px 24px 0 0",borderBottom:`1px solid ${BO}`}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
            <div style={{fontSize:14,fontWeight:900,color:TX}}>📋 {monthLabel} 필수템 20가지</div>
            <span style={{fontSize:11,fontWeight:800,color:P}}>{doneCnt}/{d.items.length} ✅</span>
          </div>
          {/* 진행 바 */}
          <div style={{height:5,borderRadius:9,background:"rgba(255,112,67,0.15)",overflow:"hidden",marginBottom:8}}>
            <div style={{width:`${Math.round(doneCnt/d.items.length*100)}%`,height:"100%",borderRadius:9,background:`linear-gradient(90deg,${P},${G})`,transition:"width 0.3s"}}/>
          </div>
          {/* TOP5 순위 뱃지 */}
          <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
            {d.top5.map((item,i)=>(
              <span key={item} style={{background:i===0?`linear-gradient(135deg,${P},${G})`:`rgba(255,112,67,${0.12-i*0.02})`,color:i===0?"#fff":P,borderRadius:14,padding:"3px 9px",fontSize:10,fontWeight:800}}>
                {["🏆","🥈","🥉","4위","5위"][i]} {item}
              </span>
            ))}
          </div>
        </div>

        {/* 아이템 리스트 */}
        <div style={{overflowY:"auto",flex:1,padding:"8px 12px 28px"}}>
          {d.items.map((item,i)=>{
            const checkKey="ess_"+month+"_"+item.n;
            const isChecked=!!checks[checkKey];
            const prod=findProd(item.n);
            const hasPrice=prod&&!prod.notFound;
            const minP=hasPrice?Math.min(...shops.map(s=>(prod.shopPrices||mkPrices(prod.price))[s]||prod.price)):null;
            const cheapShop=hasPrice?shops.reduce((a,s)=>{
              const sp=(prod.shopPrices||mkPrices(prod.price))[s]||prod.price;
              return sp<((prod.shopPrices||mkPrices(prod.price))[a]||prod.price)?s:a;
            },shops[0]):"쿠팡";

            // 소독 정보
            const steri=Object.entries(STERILIZE).find(([k])=>item.n.includes(k)||k.includes(item.n.slice(0,3)))?.[1];

            // 순위 뱃지
            const rankBadge=i===0?{l:"🏆 리뷰1등",bg:"#FFF3E0",c:"#E65100"}:
                            i===1?{l:"🥈 판매1등",bg:"#F3E5F5",c:"#6A1B9A"}:
                            i===2?{l:"🥉 가격1등",bg:"#E8F5E9",c:"#2E7D32"}:null;

            return(
              <div key={item.n} style={{padding:"10px 11px",borderRadius:14,marginBottom:6,background:isChecked?"rgba(255,112,67,0.05)":i<5?"rgba(255,112,67,0.07)":CA,border:isChecked?`1.5px solid rgba(255,112,67,0.4)`:i<5?`1px solid rgba(255,112,67,0.2)`:`1px solid ${BO}`,transition:"all 0.2s",animation:"fadeIn .3s ease"}}>
                <div style={{display:"flex",alignItems:"center",gap:9}}>
                  {/* 체크박스 */}
                  <button onClick={()=>setChecks(prev=>({...prev,[checkKey]:!prev[checkKey]}))} style={{width:26,height:26,borderRadius:8,flexShrink:0,background:isChecked?`linear-gradient(135deg,${P},${G})`:"rgba(0,0,0,0.06)",display:"flex",alignItems:"center",justifyContent:"center",border:"none",cursor:"pointer",fontSize:13,color:"#fff",fontWeight:900,transition:"all 0.2s"}}>
                    {isChecked?"✓":""}
                  </button>

                  {/* 이모지 박스 */}
                  <div style={{fontSize:20,background:i<5?"rgba(255,112,67,0.1)":"rgba(0,0,0,0.04)",borderRadius:10,padding:"5px",width:38,height:38,display:"flex",alignItems:"center",justifyContent:"center",border:`1px solid ${i<5?"rgba(255,112,67,0.2)":BO}`,flexShrink:0,opacity:isChecked?0.5:1}}>{item.e}</div>

                  {/* 이름 + 설명 + 소독 */}
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{display:"flex",alignItems:"center",gap:3,marginBottom:2,flexWrap:"wrap"}}>
                      {i<5&&<span style={{fontSize:7,background:"rgba(255,112,67,0.15)",color:P,borderRadius:4,padding:"1px 5px",fontWeight:800}}>필수</span>}
                      <span style={{fontSize:11,fontWeight:800,color:isChecked?MU:i<5?P:TX,textDecoration:isChecked?"line-through":"none"}}>{item.n}</span>
                    </div>
                    <div style={{fontSize:9,color:MU,marginBottom:steri?.need?3:0}}>{item.r}</div>
                    {/* 소독 — 크게 옆에 */}
                    {steri?.need&&<div style={{display:"inline-flex",alignItems:"center",gap:3,background:"rgba(0,150,136,0.1)",borderRadius:6,padding:"2px 7px"}}>
                      <span style={{fontSize:10}}>🧹</span>
                      <span style={{fontSize:8,fontWeight:800,color:"#00897B"}}>{steri.cycle}</span>
                      <span style={{fontSize:7,color:MU}}>· {steri.how.slice(0,12)}..</span>
                    </div>}
                  </div>

                  {/* 오른쪽: 가격(크게) + 순위뱃지 + 사러가기 — 항상 표시 */}
                  <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:2,flexShrink:0}}>
                    {minP?<div style={{fontSize:13,fontWeight:900,color:P,lineHeight:1}}>{minP.toLocaleString()}<span style={{fontSize:8,color:MU,fontWeight:600}}>원</span></div>:<div style={{fontSize:9,color:MU}}>가격확인</div>}
                    <div style={{fontSize:7,color:MU,marginBottom:1}}>{cheapShop}</div>
                    <div style={{display:"flex",alignItems:"center",gap:3}}>
                      {rankBadge&&<span style={{fontSize:7,background:rankBadge.bg,color:rankBadge.c,borderRadius:4,padding:"1px 4px",fontWeight:800}}>{rankBadge.l}</span>}
                      <button onClick={e=>{e.stopPropagation();goShop(cheapShop||"쿠팡",hasPrice?prod.name:item.n);}} style={{background:`linear-gradient(135deg,${P},${G})`,color:"#fff",border:"none",borderRadius:8,padding:"5px 9px",fontSize:9,fontWeight:900,cursor:"pointer",whiteSpace:"nowrap",boxShadow:`0 2px 8px rgba(255,112,67,0.3)`}}>사러가기</button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   WISH SHEET
════════════════════════════════════════════════════ */
function WishSheet({wish,setWish,onClose,activeShops}){
  return(
    <div style={{position:"fixed",inset:0,zIndex:500,display:"flex",flexDirection:"column"}}>
      <div style={{flex:1,background:"rgba(0,0,0,0.5)"}} onClick={onClose}/>
      <div style={{background:CA,borderRadius:"24px 24px 0 0",maxHeight:"72vh",display:"flex",flexDirection:"column",animation:"sheetUp .25s ease"}}>
        <div style={{display:"flex",justifyContent:"center",padding:"12px 0 4px"}}><div style={{width:36,height:4,borderRadius:9,background:BO}}/></div>
        <div style={{padding:"5px 16px 11px",borderBottom:`1px solid ${BO}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}><span style={{fontSize:16,fontWeight:900,color:TX}}>❤️ 찜 목록</span><span style={{fontSize:12,color:MU}}>{wish.length}개</span></div>
        <div style={{overflowY:"auto",flex:1,padding:"0 14px"}}>
          {!wish.length&&<div style={{textAlign:"center",color:MU,paddingTop:40,fontSize:13}}>찜한 상품이 없어요 🤍</div>}
          {wish.map(item=>{
            const sp=item.shopPrices||mkPrices(item.price);
            const shops=activeShops.length>0?activeShops:SHOP_NAMES;
            const minP=Math.min(...shops.map(s=>sp[s]||item.price));
            const minShop=shops.find(s=>sp[s]===minP)||"쿠팡";
            return(
              <div key={item.id} style={{display:"flex",gap:10,alignItems:"center",padding:"11px 0",borderBottom:`1px solid ${BO}`}}>
                <div style={{fontSize:22,background:BG,borderRadius:10,width:42,height:42,display:"flex",alignItems:"center",justifyContent:"center",border:`1px solid ${BO}`,flexShrink:0}}>{item.img}</div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:11,fontWeight:700,color:TX,lineHeight:1.3,marginBottom:2,overflow:"hidden",whiteSpace:"nowrap",textOverflow:"ellipsis"}}>{item.name}</div>
                  <div style={{fontSize:12,fontWeight:900,color:P}}>{minP.toLocaleString()}원~</div>
                  <div style={{fontSize:9,color:MU}}>최저: {minShop}</div>
                </div>
                <div style={{display:"flex",flexDirection:"column",gap:4}}>
                  <button onClick={()=>goShop(minShop,item.name)} style={{background:`linear-gradient(135deg,${P},${G})`,color:"#fff",border:"none",borderRadius:8,padding:"6px 10px",fontSize:10,fontWeight:800,cursor:"pointer"}}>사러가기</button>
                  <button onClick={()=>setWish(w=>w.filter(x=>x.id!==item.id))} style={{fontSize:9,color:MU,border:"none",background:"none",cursor:"pointer"}}>삭제</button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   GUIDE DETAIL SHEET — 자세히 + 추천상품 + 사러가기
════════════════════════════════════════════════════ */
function GuideDetail({guide,onClose}){
  const [expanded,setExpanded]=useState(null);
  const [recSort,setRecSort]=useState("reviews"); // reviews | sales | price
  if(!guide)return null;

  const sortedRecs=guide.recs?[...guide.recs].sort((a,b)=>recSort==="price"?a.price-b.price:b[recSort]-a[recSort]):[];

  return(
    <div style={{position:"fixed",inset:0,zIndex:600,display:"flex",flexDirection:"column"}}>
      <div style={{flex:1,background:"rgba(0,0,0,0.5)"}} onClick={onClose}/>
      <div style={{background:BG,borderRadius:"24px 24px 0 0",maxHeight:"92vh",display:"flex",flexDirection:"column",animation:"sheetUp .3s cubic-bezier(0.34,1.56,0.64,1)"}}>
        <div style={{display:"flex",justifyContent:"center",padding:"12px 0 4px"}}><div style={{width:36,height:4,borderRadius:9,background:BO}}/></div>

        {/* 헤더 */}
        <div style={{padding:"7px 16px 12px",background:CA,borderRadius:"24px 24px 0 0",borderBottom:`1px solid ${BO}`}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <span style={{fontSize:28,animation:"wobble 3s infinite"}}>{guide.emoji}</span>
            <div>
              <div style={{fontSize:14,fontWeight:900,color:TX}}>{guide.title}</div>
              <span style={{background:`${guide.color}20`,color:guide.color,borderRadius:6,padding:"2px 8px",fontSize:9,fontWeight:800}}>{guide.tag}</span>
            </div>
          </div>
          <div style={{fontSize:11,color:MU,marginTop:7,lineHeight:1.6}}>{guide.desc}</div>
        </div>

        <div style={{overflowY:"auto",flex:1,padding:"10px 13px 28px"}}>

          {/* 추천 상품 TOP3 */}
          {guide.recs&&<div style={{marginBottom:14}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:7}}>
              <div style={{fontSize:12,fontWeight:900,color:TX}}>🛒 추천 상품 TOP 3</div>
              <div style={{display:"flex",gap:4}}>
                {[{k:"reviews",l:"리뷰순"},{k:"sales",l:"판매순"},{k:"price",l:"가격순"}].map(({k,l})=>(
                  <button key={k} onClick={()=>setRecSort(k)} style={{padding:"3px 8px",borderRadius:8,background:recSort===k?`linear-gradient(135deg,${guide.color},${guide.color}CC)`:`${guide.color}15`,color:recSort===k?"#fff":guide.color,border:"none",fontSize:8,fontWeight:800,cursor:"pointer"}}>{l}</button>
                ))}
              </div>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:6}}>
              {sortedRecs.map((rec,i)=>(
                <div key={rec.name} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 11px",background:i===0?"linear-gradient(135deg,#FFF0E6,#FFFBE6)":CA,borderRadius:12,border:i===0?`1.5px solid rgba(255,112,67,0.25)`:`1px solid ${BO}`,animation:`slideInLeft ${0.1+i*0.08}s ease`}}>
                  <div style={{fontSize:9,fontWeight:900,color:i===0?P:MU,minWidth:16,textAlign:"center"}}>{i===0?"🏆":i===1?"🥈":"🥉"}</div>
                  <div style={{fontSize:22,background:i===0?"rgba(255,112,67,0.1)":"rgba(0,0,0,0.04)",borderRadius:9,padding:"5px",width:36,height:36,display:"flex",alignItems:"center",justifyContent:"center",border:`1px solid ${i===0?"rgba(255,112,67,0.2)":BO}`,flexShrink:0}}>{rec.e}</div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:10,fontWeight:800,color:TX,lineHeight:1.3}}>{rec.name}</div>
                    <div style={{display:"flex",gap:5,marginTop:2}}>
                      <span style={{fontSize:7,background:"#E8EAF6",color:"#3949AB",borderRadius:4,padding:"1px 4px",fontWeight:800}}>💬 {rec.reviews.toLocaleString()}</span>
                      <span style={{fontSize:7,background:"#FFF3E0",color:"#E65100",borderRadius:4,padding:"1px 4px",fontWeight:800}}>🔥 {rec.sales.toLocaleString()}</span>
                    </div>
                  </div>
                  <div style={{textAlign:"right",flexShrink:0}}>
                    <div style={{fontSize:12,fontWeight:900,color:P}}>{rec.price.toLocaleString()}<span style={{fontSize:7,color:MU}}>원~</span></div>
                    <button onClick={()=>goShop(rec.shop||"쿠팡",rec.name)} style={{background:`linear-gradient(135deg,${P},${G})`,color:"#fff",border:"none",borderRadius:7,padding:"4px 8px",fontSize:9,fontWeight:900,cursor:"pointer",marginTop:3,display:"block",boxShadow:`0 2px 8px rgba(255,112,67,0.3)`}}>사러가기</button>
                  </div>
                </div>
              ))}
            </div>
          </div>}

          {/* 가이드 아이템 — 자세히 버튼 */}
          <div style={{fontSize:12,fontWeight:900,color:TX,marginBottom:8}}>📖 상세 가이드</div>
          {guide.items.map((item,i)=>(
            <div key={i} style={{borderRadius:13,marginBottom:6,background:CA,border:`1px solid ${BO}`,overflow:"hidden",animation:`fadeIn ${0.1+i*0.05}s ease`}}>
              {/* 아이템 헤더 */}
              <div style={{display:"flex",gap:10,padding:"10px 12px",alignItems:"center"}}>
                <div style={{fontSize:18,flexShrink:0,width:28,textAlign:"center",animation:expanded===i?"wobble 2s infinite":"none"}}>{item.e}</div>
                <div style={{flex:1}}>
                  <div style={{fontSize:12,fontWeight:800,color:TX}}>{item.name}</div>
                  {expanded!==i&&<div style={{fontSize:10,color:MU,lineHeight:1.4,marginTop:2,overflow:"hidden",whiteSpace:"nowrap",textOverflow:"ellipsis"}}>{item.detail.slice(0,30)}...</div>}
                </div>
                <button onClick={()=>setExpanded(expanded===i?null:i)} style={{background:expanded===i?`linear-gradient(135deg,${guide.color},${guide.color}CC)`:`${guide.color}15`,color:expanded===i?"#fff":guide.color,border:"none",borderRadius:8,padding:"4px 9px",fontSize:9,fontWeight:800,cursor:"pointer",flexShrink:0,transition:"all .2s"}}>
                  {expanded===i?"접기":"자세히"}
                </button>
              </div>
              {/* 펼쳐진 상세 내용 */}
              {expanded===i&&<div style={{padding:"0 12px 12px",animation:"fadeIn .2s ease"}}>
                <div style={{background:`${guide.color}10`,borderRadius:10,padding:"10px 12px",border:`1px solid ${guide.color}25`}}>
                  <div style={{fontSize:11,color:TX,lineHeight:1.8,fontWeight:500}}>{item.detail}</div>
                </div>
                {/* 관련 상품 바로가기 */}
                <button onClick={()=>goShop("쿠팡",item.name)} style={{marginTop:8,width:"100%",background:`linear-gradient(135deg,${guide.color},${guide.color}CC)`,color:"#fff",border:"none",borderRadius:9,padding:"9px",fontSize:10,fontWeight:900,cursor:"pointer",boxShadow:`0 3px 10px ${guide.color}40`}}>
                  🛒 "{item.name}" 쿠팡에서 보기
                </button>
              </div>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   CHECKLIST VIEW
════════════════════════════════════════════════════ */
function ChecklistView({checks,setChecks}){
  const cats=[...new Set(CHECKLIST.map(c=>c.cat))];
  const done=CHECKLIST.filter(c=>checks[c.id]).length;
  const pct=Math.round(done/CHECKLIST.length*100);
  return(
    <div style={{overflowY:"auto",flex:1,padding:"0 0 24px"}}>
      <div style={{background:`rgba(255,112,67,0.07)`,padding:"14px 16px",borderBottom:`1px solid ${BO}`}}>
        <div style={{fontSize:14,fontWeight:900,color:TX,marginBottom:4}}>✅ 육아용품 체크리스트</div>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
          <div style={{flex:1,height:7,borderRadius:9,background:"rgba(255,112,67,0.15)",overflow:"hidden"}}><div style={{width:`${pct}%`,height:"100%",borderRadius:9,background:`linear-gradient(90deg,${P},${G})`}}/></div>
          <span style={{fontSize:11,fontWeight:900,color:P,flexShrink:0}}>{done}/{CHECKLIST.length}</span>
        </div>
        <div style={{fontSize:10,color:MU}}>{pct===100?"🎉 모두 준비됐어요!":pct>=50?"👍 절반 이상 준비됐어요!":"💪 준비 시작해봐요!"}</div>
      </div>
      <div style={{padding:"0 12px"}}>
        {cats.map(cat=>{
          const items=CHECKLIST.filter(c=>c.cat===cat);
          const catDone=items.filter(c=>checks[c.id]).length;
          return(
            <div key={cat} style={{marginTop:14}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
                <div style={{fontSize:12,fontWeight:900,color:TX}}>{cat}</div>
                <span style={{fontSize:9,color:catDone===items.length?P:MU,fontWeight:700}}>{catDone}/{items.length}{catDone===items.length?" ✅":""}</span>
              </div>
              {items.map(c=>{
                const isDone=!!checks[c.id];
                return(
                  <button key={c.id} onClick={()=>setChecks(prev=>({...prev,[c.id]:!prev[c.id]}))}
                    style={{display:"flex",alignItems:"center",gap:9,padding:"9px 10px",borderRadius:11,marginBottom:5,background:isDone?"rgba(255,112,67,0.06)":CA,border:isDone?`1px solid rgba(255,112,67,0.25)`:`1px solid ${BO}`,cursor:"pointer",textAlign:"left",boxSizing:"border-box",width:"100%"}}>
                    <div style={{width:20,height:20,borderRadius:6,flexShrink:0,background:isDone?`linear-gradient(135deg,${P},${G})`:"rgba(0,0,0,0.06)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,color:"#fff"}}>{isDone?"✓":""}</div>
                    <span style={{fontSize:13,flexShrink:0}}>{c.e}</span>
                    <div style={{flex:1,fontSize:12,fontWeight:isDone?700:500,color:isDone?P:TX,textDecoration:isDone?"line-through":"none",opacity:isDone?0.8:1}}>{c.item}</div>
                  </button>
                );
              })}
            </div>
          );
        })}
        <button onClick={()=>setChecks({})} style={{width:"100%",marginTop:16,background:CA,border:`1px solid ${BO}`,borderRadius:11,padding:"10px",fontSize:11,fontWeight:700,color:MU,cursor:"pointer",boxSizing:"border-box"}}>초기화</button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   HOME TAB
════════════════════════════════════════════════════ */
/* ═══════════ CATEGORY TOP5 컴포넌트 ══════════ */
function CatTop5({prods,cats,catColors,activeShops,setSelProd,setTab}){
  // 판매량 기준 상위 5개 카테고리만 표시
  const catSales=cats.map((cat,ci)=>({
    cat,
    ci,
    totalSales:prods.filter(p=>p.cat===cat).reduce((s,p)=>s+p.sales,0)
  })).sort((a,b)=>b.totalSales-a.totalSales).slice(0,5);

  const [selCat,setSelCat]=useState(catSales[0]?.cat||cats[0]);

  const selCi=catSales.find(c=>c.cat===selCat)?.ci||0;
  const cc=catColors[selCi%catColors.length];
  const catProds=[...prods.filter(p=>p.cat===selCat)].sort((a,b)=>b.score-a.score).slice(0,5);

  return(
    <div style={{marginBottom:12}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:6}}>
        <div style={{fontSize:11,fontWeight:900,color:TX}}>🏷️ 카테고리별 TOP 5</div>
        <button onClick={()=>setTab("shop")} style={{fontSize:9,color:P,background:"none",border:"none",cursor:"pointer",fontWeight:700}}>전체 →</button>
      </div>

      {/* 카테고리 탭 — 이모지 + 짧은 이름 한 줄 */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:4,marginBottom:8}}>
        {catSales.map(({cat,ci})=>{
          const c=catColors[ci%catColors.length];
          const active=selCat===cat;
          const catEmojis={"수유용품":"🍼","기저귀/위생":"🧷","수면용품":"🌙","이동용품":"🚗","목욕/스킨":"💧","건강/안전":"🌡️","의류":"👶","놀이/발달":"🎮","이유식용품":"🥄","유모차":"🛸","안전용품":"🛡️","음식/간식":"🍪","신발":"👟","교육/책":"📚"};
          const emoji=catEmojis[cat]||"📦";
          const shortName=cat.replace("/위생","").replace("용품","").replace("/스킨","").replace("/발달","").replace("/안전","");
          return(
            <button key={cat} onClick={()=>setSelCat(cat)} style={{background:active?c:"rgba(0,0,0,0.04)",color:active?"#fff":MU,border:active?"none":`1px solid ${BO}`,borderRadius:8,padding:"5px 2px",fontSize:8,fontWeight:active?900:700,cursor:"pointer",textAlign:"center",lineHeight:1.4}}>
              <span style={{fontSize:13,display:"block"}}>{emoji}</span>
              {shortName.length>4?shortName.slice(0,4):shortName}
            </button>
          );
        })}
      </div>

      {/* 선택된 카테고리 TOP5 — 스타일3 세로 리스트 */}
      <div style={{display:"flex",flexDirection:"column",gap:5}}>
        {catProds.map((p,i)=>{
          const minP=Math.min(...(activeShops.length>0?activeShops:SHOP_NAMES).map(s=>(p.shopPrices||mkPrices(p.price))[s]||p.price));
          const tags=[];
          if(p.sales>50000)tags.push({l:"🔥 인기",bg:"#FFE8E8",c:"#E53935"});
          if(minP<p.price*0.85)tags.push({l:"💚 최저가",bg:"#E8F5E9",c:"#2E7D32"});
          if(p.reviews>20000)tags.push({l:"💬 리뷰많음",bg:"#E8EAF6",c:"#3949AB"});
          return(
            <div key={p.id} onClick={()=>setSelProd(p)} style={{display:"flex",gap:8,alignItems:"center",padding:"9px 10px",background:CA,borderRadius:11,border:`1px solid ${i===0?cc+"60":BO}`,cursor:"pointer",boxShadow:i===0?`0 2px 8px ${cc}15`:"none"}}>
              <div style={{fontSize:9,fontWeight:900,color:i===0?cc:MU,minWidth:18,textAlign:"center"}}>{i===0?"🏆":`${i+1}`}</div>
              {/* 이모지 크게 박스 */}
              <div style={{fontSize:20,background:i===0?`${cc}15`:"rgba(0,0,0,0.03)",borderRadius:8,padding:"5px",width:38,height:38,display:"flex",alignItems:"center",justifyContent:"center",border:`1px solid ${i===0?cc+"40":BO}`,flexShrink:0}}>{p.img}</div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:10,fontWeight:800,color:TX,lineHeight:1.3,marginBottom:2}}>{p.name}</div>
                {/* 태그 뱃지 */}
                {tags.length>0&&<div style={{display:"flex",gap:3,marginBottom:2}}>
                  {tags.slice(0,2).map(t=><span key={t.l} style={{background:t.bg,color:t.c,borderRadius:4,padding:"1px 4px",fontSize:7,fontWeight:800}}>{t.l}</span>)}
                </div>}
                {/* why 한줄 */}
                {p.why&&<div style={{fontSize:8,color:MU,lineHeight:1.4,marginBottom:2,overflow:"hidden",display:"-webkit-box",WebkitLineClamp:1,WebkitBoxOrient:"vertical"}}>💡 {p.why}</div>}
                {/* 별점 바 */}
                <div style={{display:"flex",alignItems:"center",gap:4}}>
                  <div style={{flex:1,height:3,borderRadius:9,background:"#F0F0F0",overflow:"hidden"}}>
                    <div style={{width:`${p.score}%`,height:"100%",borderRadius:9,background:`linear-gradient(90deg,${cc},${cc}99)`}}/>
                  </div>
                  <span style={{fontSize:7,fontWeight:800,color:cc}}>★{p.rating}</span>
                </div>
              </div>
              <div style={{textAlign:"right",flexShrink:0}}>
                <div style={{fontSize:11,fontWeight:900,color:P}}>{minP.toLocaleString()}<span style={{fontSize:7,color:MU}}>원</span></div>
                <div style={{fontSize:7,color:MU,marginBottom:1}}>
                  {(()=>{
                    const shops=activeShops.length>0?activeShops:SHOP_NAMES;
                    const cheapShop=shops.reduce((a,s)=>{
                      const sp=(p.shopPrices||mkPrices(p.price))[s]||p.price;
                      return sp<((p.shopPrices||mkPrices(p.price))[a]||p.price)?s:a;
                    },shops[0]);
                    return`📍 ${cheapShop}`;
                  })()}
                </div>
                <button onClick={e=>{e.stopPropagation();setSelProd(p);}} style={{background:`linear-gradient(135deg,${P},${G})`,color:"#fff",border:"none",borderRadius:6,padding:"2px 7px",fontSize:8,fontWeight:800,cursor:"pointer",display:"block"}}>바로가기</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ═══════════ 소독 가이드 시트 ══════════ */
const STERILIZE_GUIDE=[
  {cat:"수유용품",items:[
    {e:"🍼",name:"젖병",cycle:"매 수유 후",how:"UV소독기 또는 열탕 5분 끓이기",tip:"6개월 이후엔 하루 1회로 줄여도 OK",prod:"젖병 소독기"},
    {e:"🍼",name:"젖꼭지",cycle:"매 수유 후",how:"열탕 5분 또는 UV소독기",tip:"구멍 주변 꼼꼼히 헹구기, 1~2개월마다 교체",prod:"젖병 소독기"},
    {e:"🧹",name:"젖병소독기",cycle:"주 1회",how:"내부 닦고 UV 자체 소독",tip:"물 자국 생기면 식초물로 닦기",prod:null},
    {e:"🧣",name:"트림타월",cycle:"매 사용 후",how:"60도 이상 세탁",tip:"3장 이상 로테이션 권장",prod:"아기 세탁세제"},
    {e:"🫶",name:"수유쿠션",cycle:"주 1~2회",how:"커버 분리 세탁 60도",tip:"속 솜은 통풍 잘 되는 곳에 건조",prod:null},
  ]},
  {cat:"위생/기저귀",items:[
    {e:"🛡️",name:"방수패드",cycle:"오염 시 즉시",how:"60도 이상 세탁",tip:"3장 이상 준비해서 바로 교체",prod:"아기 세탁세제"},
    {e:"🧷",name:"기저귀",cycle:"2~3시간마다",how:"교체 후 바로 폐기",tip:"기저귀 발진 크림으로 피부 보호",prod:"기저귀 발진 크림"},
  ]},
  {cat:"목욕용품",items:[
    {e:"🚿",name:"아기욕조",cycle:"매 사용 후",how:"중성세제로 닦고 건조",tip:"물 고임 없이 세워서 보관",prod:"아기 세정제"},
    {e:"✂️",name:"손톱깎이",cycle:"매 사용 후",how:"알코올 솜으로 날 부분 닦기",tip:"사용 전후 소독 습관화",prod:"알코올 솜"},
    {e:"🌡️",name:"체온계",cycle:"매 사용 후",how:"알코올 솜으로 삽입 부분 닦기",tip:"케이스에 보관해 먼지 방지",prod:"알코올 솜"},
  ]},
  {cat:"이유식용품",items:[
    {e:"🥣",name:"이유식 용기",cycle:"매 사용 후",how:"열탕 소독 또는 식기세척기 고온",tip:"뚜껑과 패킹도 분리 세척",prod:"젖병 소독기"},
    {e:"🥄",name:"실리콘 스푼",cycle:"매 사용 후",how:"열탕 5분 소독",tip:"변색되면 교체",prod:"젖병 소독기"},
    {e:"🍽️",name:"이유식 식판",cycle:"매 사용 후",how:"뜨거운 물 + 세정제 세척",tip:"흡착부분 꼼꼼히 닦기",prod:"아기 세정제"},
    {e:"🪑",name:"하이체어",cycle:"매 식사 후",how:"시트 분리 세탁, 트레이 세척",tip:"틈새에 음식 끼지 않게 즉시 닦기",prod:"아기 세정제"},
    {e:"🥤",name:"빨대컵",cycle:"매 사용 후",how:"분리 후 빨대 솔로 세척",tip:"빨대 안쪽 곰팡이 주의",prod:"빨대 솔"},
  ]},
  {cat:"장난감/놀이",items:[
    {e:"🦒",name:"치발기",cycle:"매 사용 후",how:"흐르는 물 세척 + 주 1회 열탕",tip:"냉장 보관 시 위생백에 넣기",prod:"아기 세정제"},
    {e:"🧸",name:"장난감",cycle:"주 1~2회",how:"알코올 프리 세정제로 닦기",tip:"천 장난감은 세탁망에 넣어 세탁",prod:"아기 장난감 세정제"},
    {e:"🟩",name:"놀이매트",cycle:"주 1회",how:"중성세제 닦고 자연 건조",tip:"이음새 부분 꼼꼼히 닦기",prod:"아기 세정제"},
  ]},
  {cat:"이동용품",items:[
    {e:"🚗",name:"카시트",cycle:"월 1회",how:"커버 분리 세탁, 프레임 닦기",tip:"버클 부분 물 들어가지 않게 주의",prod:null},
    {e:"🛸",name:"유모차",cycle:"월 1회",how:"시트 커버 세탁, 프레임 닦기",tip:"바퀴 이물질 제거 매주",prod:null},
    {e:"🎽",name:"아기띠",cycle:"월 1~2회",how:"30~40도 세탁, 건조기 금지",tip:"버클과 버클 커버 분리 확인",prod:"아기 세탁세제"},
  ]},
];

function SterilizeSheet({onClose,activeShops}){
  const [selCat,setSelCat]=useState("수유용품");
  const [expanded,setExpanded]=useState(null);
  const selData=STERILIZE_GUIDE.find(g=>g.cat===selCat);
  const shops=activeShops&&activeShops.length>0?activeShops:SHOP_NAMES;

  function findSteriliProd(prodName){
    if(!prodName)return null;
    const allProds=Object.values(PRODUCTS).flat();
    return allProds.find(p=>p.name.includes(prodName.slice(0,3))||prodName.includes(p.name.slice(0,3)));
  }

  function getBestShop(prod,type){
    if(!prod)return"쿠팡";
    const sp=prod.shopPrices||mkPrices(prod.price);
    if(type==="price") return shops.reduce((a,s)=>((sp[s]||prod.price)<(sp[a]||prod.price)?s:a),shops[0]);
    if(type==="reviews"&&prod.shopStats) return Object.entries(prod.shopStats).sort((a,b)=>b[1].reviews-a[1].reviews)[0][0];
    return"쿠팡";
  }

  const WHY={
    "젖병":"아기 면역체계는 미성숙해요. 분유·모유 찌꺼기는 세균 온상이 되고, 6개월 미만 신생아는 감염에 특히 취약해요.",
    "젖꼭지":"작은 구멍 안쪽에 찌꺼기가 남아 장염 원인이 될 수 있어요. 라텍스 재질은 세균 번식이 더 빨라요.",
    "젖병소독기":"소독기 내부에도 물때·세균이 생겨 소독 효과가 떨어질 수 있어요.",
    "트림타월":"토한 내용물이 남으면 세균이 빠르게 번식해요. 아기 피부에 닿는 용품이라 청결이 중요해요.",
    "수유쿠션":"모유·분유가 스며들면 곰팡이가 생길 수 있어요. 커버 자주 세탁이 피부 트러블 예방의 핵심이에요.",
    "방수패드":"변·소변 오염 후 방치하면 세균과 곰팡이가 번식해 피부 발진을 일으켜요.",
    "기저귀":"오래 착용하면 암모니아가 발생해 기저귀 발진과 피부 자극의 원인이 돼요.",
    "아기욕조":"물때와 비누 찌꺼기에 세균이 번식해요. 매번 세척 후 건조 보관이 필수예요.",
    "손톱깎이":"아기 피부에 직접 닿는 도구예요. 사용 후 소독으로 세균 감염을 예방해요.",
    "체온계":"귀 삽입 부분 오염은 측정 오류와 감염 위험을 동시에 높여요.",
    "이유식 용기":"단백질·유제품 재료는 세균 번식이 빨라 식중독 위험이 있어요.",
    "실리콘 스푼":"직접 입에 들어가는 용품이라 잔류물이 장염 등 감염의 원인이 될 수 있어요.",
    "이유식 식판":"음식 잔류물이 틈새에 끼어 세균 온상이 되기 쉬워요.",
    "하이체어":"식사 중 흘린 음식이 틈새에 쌓여 세균이 번식해요. 매번 닦기가 건강의 핵심이에요.",
    "빨대컵":"빨대 내부는 보이지 않아 청소가 소홀해지기 쉽고 곰팡이가 빠르게 번식해요.",
    "치발기":"항상 입에 넣는 물건이라 바닥 오염이나 접촉만으로도 세균에 노출될 수 있어요.",
    "장난감":"아기가 입에 넣고 바닥을 구르는 장난감은 세균 오염 위험이 매우 높아요.",
    "놀이매트":"하루 종일 닿는 표면이라 이유식·기저귀 누수 등으로 오염되기 쉬워요.",
    "카시트":"장시간 착석으로 간식·이유식이 끼면 세균이 번식할 수 있어요.",
    "유모차":"야외 먼지·오염에 노출되고 음식이 묻으면 세균이 증식해요.",
    "아기띠":"땀·침·이유식이 흡수되면 세균과 냄새의 원인이 돼요.",
  };

  return(
    <div style={{position:"fixed",inset:0,zIndex:500,display:"flex",flexDirection:"column"}}>
      <div style={{flex:1,background:"rgba(0,0,0,0.5)"}} onClick={onClose}/>
      <div style={{background:BG,borderRadius:"24px 24px 0 0",maxHeight:"90vh",display:"flex",flexDirection:"column",animation:"sheetUp .3s cubic-bezier(0.34,1.56,0.64,1)"}}>
        <div style={{display:"flex",justifyContent:"center",padding:"12px 0 4px"}}><div style={{width:36,height:4,borderRadius:9,background:BO}}/></div>
        <div style={{padding:"6px 16px 12px",background:CA,borderRadius:"24px 24px 0 0",borderBottom:`1px solid ${BO}`}}>
          <div style={{fontSize:14,fontWeight:900,color:TX,marginBottom:2}}>🧹 아기용품 소독 가이드</div>
          <div style={{fontSize:9,color:MU}}>소독이 필요한 모든 아이템 · 주기 · 방법 · 이유 총정리</div>
        </div>
        <div style={{display:"flex",gap:5,overflowX:"auto",scrollbarWidth:"none",padding:"8px 12px",background:CA,borderBottom:`1px solid ${BO}`,WebkitOverflowScrolling:"touch"}}>
          {STERILIZE_GUIDE.map((g,gi)=>{
            const tabColors=[P,MINT,LAVEN,SKY,PINK,"#FFB347"];
            const tc=tabColors[gi%tabColors.length];
            const active=selCat===g.cat;
            return(
              <button key={g.cat} onClick={()=>{setSelCat(g.cat);setExpanded(null);}} style={{flexShrink:0,padding:"6px 12px",borderRadius:18,background:active?`linear-gradient(135deg,${tc},${tc}CC)`:`${tc}15`,color:active?"#fff":tc,border:active?"none":`1.5px solid ${tc}40`,fontSize:10,fontWeight:active?900:700,cursor:"pointer",transition:"all .2s",whiteSpace:"nowrap"}}>
                {g.cat}
              </button>
            );
          })}
        </div>
        <div style={{overflowY:"auto",flex:1,padding:"10px 12px 28px"}}>
          {selData?.items.map((item,i)=>{
            const prod=findSteriliProd(item.prod);
            const minP=prod?Math.min(...shops.map(s=>(prod.shopPrices||mkPrices(prod.price))[s]||prod.price)):null;
            const cheapShop=getBestShop(prod,"price");
            const reviewShop=getBestShop(prod,"reviews");
            const isExp=expanded===i;
            const why=WHY[item.name];
            return(
              <div key={item.name} style={{background:CA,borderRadius:16,marginBottom:10,border:`1.5px solid ${BO}`,boxShadow:"0 2px 12px rgba(0,0,0,0.05)",overflow:"hidden",animation:`fadeIn ${0.1+i*0.05}s ease`}}>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"11px 12px"}}>
                  <div style={{display:"flex",alignItems:"center",gap:8}}>
                    <div style={{fontSize:20,background:"rgba(255,112,67,0.1)",borderRadius:10,padding:"5px",width:36,height:36,display:"flex",alignItems:"center",justifyContent:"center",border:`1px solid rgba(255,112,67,0.2)`,animation:isExp?"wobble 2s infinite":"none"}}>{item.e}</div>
                    <div>
                      <div style={{fontSize:12,fontWeight:900,color:TX}}>{item.name}</div>
                      <span style={{background:`linear-gradient(135deg,${MINT},#2EC4B6)`,color:"#fff",borderRadius:8,padding:"2px 7px",fontSize:8,fontWeight:800}}>🧹 {item.cycle}</span>
                    </div>
                  </div>
                  <button onClick={()=>setExpanded(isExp?null:i)} style={{background:isExp?`linear-gradient(135deg,${MINT},#2EC4B6)`:"rgba(78,205,196,0.12)",color:isExp?"#fff":"#00897B",border:"none",borderRadius:8,padding:"5px 10px",fontSize:9,fontWeight:800,cursor:"pointer",transition:"all .2s"}}>
                    {isExp?"접기":"자세히"}
                  </button>
                </div>
                <div style={{margin:"0 12px 10px",background:"linear-gradient(135deg,rgba(78,205,196,0.1),rgba(46,196,182,0.05))",borderRadius:10,padding:"8px 10px",border:`1px solid rgba(78,205,196,0.2)`}}>
                  <div style={{fontSize:9,fontWeight:900,color:"#00897B",marginBottom:2}}>🫧 소독 방법</div>
                  <div style={{fontSize:10,color:TX,lineHeight:1.6,fontWeight:600}}>{item.how}</div>
                </div>
                {isExp&&<div style={{margin:"0 12px 10px",animation:"fadeIn .2s ease"}}>
                  {why&&<div style={{background:"linear-gradient(135deg,rgba(195,168,240,0.12),rgba(116,192,252,0.08))",borderRadius:10,padding:"9px 11px",marginBottom:7,border:`1px solid rgba(195,168,240,0.25)`}}>
                    <div style={{fontSize:9,fontWeight:900,color:LAVEN,marginBottom:3}}>💜 왜 소독이 필요한가요?</div>
                    <div style={{fontSize:10,color:TX,lineHeight:1.7}}>{why}</div>
                  </div>}
                  <div style={{background:"linear-gradient(135deg,rgba(255,179,71,0.1),rgba(255,112,67,0.06))",borderRadius:10,padding:"8px 10px",border:`1px solid rgba(255,179,71,0.25)`}}>
                    <div style={{fontSize:9,fontWeight:900,color:"#E65100",marginBottom:2}}>💡 꿀팁</div>
                    <div style={{fontSize:10,color:TX,lineHeight:1.6}}>{item.tip}</div>
                  </div>
                </div>}
                {item.prod&&<div style={{margin:"0 12px 12px",display:"flex",alignItems:"center",justifyContent:"space-between",background:"linear-gradient(135deg,rgba(255,112,67,0.08),rgba(255,179,71,0.05))",borderRadius:10,padding:"8px 10px",border:`1px solid rgba(255,112,67,0.2)`}}>
                  <div>
                    <div style={{fontSize:7,color:MU,marginBottom:1}}>🛒 필요 물품</div>
                    <div style={{fontSize:11,fontWeight:900,color:TX}}>{item.prod}</div>
                    {minP&&<div style={{fontSize:9,fontWeight:800,color:P}}>{minP.toLocaleString()}원</div>}
                  </div>
                  <div style={{display:"flex",flexDirection:"column",gap:4}}>
                    <button onClick={()=>goShop(cheapShop,item.prod)} style={{background:`linear-gradient(135deg,${P},${G})`,color:"#fff",border:"none",borderRadius:8,padding:"5px 9px",fontSize:8,fontWeight:900,cursor:"pointer"}}>💰 최저가</button>
                    <button onClick={()=>goShop(reviewShop,item.prod)} style={{background:`linear-gradient(135deg,${MINT},#2EC4B6)`,color:"#fff",border:"none",borderRadius:8,padding:"5px 9px",fontSize:8,fontWeight:900,cursor:"pointer"}}>💬 리뷰1등</button>
                  </div>
                </div>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function HomeTab({month,setMonth,bday,babyName,wish,onWish,setTab,setSelProd,activeShops}){
  const autoMonth=calcMonth(bday);
  const initGroup=Math.max(0,MONTH_GROUPS.findIndex(g=>g.months.includes(autoMonth??1)));
  const [grpIdx,setGrpIdx]=useState(initGroup);
  const grp=MONTH_GROUPS[grpIdx];

  // 정렬 기준
  const [sortBy,setSortBy]=useState("score");
  // 체크박스 방식 - 여러 쇼핑몰 동시 선택
  const [selectedShops,setSelectedShops]=useState({naver:true,eleven:true});

  // 모든 활성 쇼핑몰 데이터 통합
  const [naverItems,setNaverItems]=useState([]);
  const [elevenItems,setElevenItems]=useState([]);
  const [loading,setLoading]=useState(false);

  useEffect(()=>{
    const keyword=grp.short+"개월 아기용품";
    setLoading(true);
    setNaverItems([]);
    setElevenItems([]);

    const naverSort=sortBy==="price_asc"?"asc":"sim";
    const elevenSort=sortBy==="reviews"?"REVIEW":sortBy==="rating"?"RATING":"POPULAR";

    const fetchers=[];
    if(selectedShops.naver) fetchers.push(fetchNaver(keyword,naverSort,15).then(r=>({src:"naver",items:r||[]})));
    else fetchers.push(Promise.resolve({src:"naver",items:[]}));
    if(selectedShops.eleven) fetchers.push(fetchEleven(keyword,elevenSort,15).then(r=>({src:"eleven",items:r||[]})));
    else fetchers.push(Promise.resolve({src:"eleven",items:[]}));

    Promise.all(fetchers).then(([naverRes,elevenRes])=>{
      let nSorted=[...naverRes.items];
      if(sortBy==="reviews") nSorted.sort((a,b)=>b.reviewCount-a.reviewCount);
      if(sortBy==="sales")   nSorted.sort((a,b)=>b.score-a.score);
      if(sortBy==="score")   nSorted.sort((a,b)=>(b.reviewCount+b.score*10)-(a.reviewCount+a.score*10));
      setNaverItems(nSorted);
      setElevenItems(elevenRes.items);
      setLoading(false);
    });
  },[grp,sortBy,selectedShops]);

  // 통합 결과 — 쇼핑몰 태그 붙여서 합치기
  const mergedItems=useMemo(()=>{
    const naver=(selectedShops.naver?naverItems:[]).map(i=>({...i,_src:"naver"}));
    const eleven=(selectedShops.eleven?elevenItems:[]).map(i=>({...i,_src:"eleven"}));

    if(!selectedShops.naver) return eleven;
    if(!selectedShops.eleven) return naver;

    // 둘 다 선택 — 교대로 섞기 (네이버 1위, 11번가 1위, 네이버 2위, ...)
    const merged=[];
    const maxLen=Math.max(naver.length,eleven.length);
    for(let i=0;i<maxLen;i++){
      if(naver[i]) merged.push(naver[i]);
      if(eleven[i]) merged.push(eleven[i]);
    }
    return merged;
  },[naverItems,elevenItems,selectedShops]);

  const DRAG=()=>({
    onMouseDown:e=>{const el=e.currentTarget;el.dataset.down="1";el.dataset.startX=e.pageX-el.offsetLeft;el.dataset.sl=el.scrollLeft;el.style.cursor="grabbing";},
    onMouseLeave:e=>{e.currentTarget.dataset.down="0";e.currentTarget.style.cursor="grab";},
    onMouseUp:e=>{e.currentTarget.dataset.down="0";e.currentTarget.style.cursor="grab";},
    onMouseMove:e=>{if(e.currentTarget.dataset.down!=="1")return;e.preventDefault();const el=e.currentTarget;el.scrollLeft=Number(el.dataset.sl)-(e.pageX-el.offsetLeft-Number(el.dataset.startX))*1.5;},
  });

  return(
    <div style={{overflowY:"auto",flex:1,background:"#FAFAFA"}}>

      {/* 헤더 */}
      <div style={{background:"#fff",padding:"14px 16px 12px",borderBottom:"1px solid #F0E8E0"}}>
        {bday&&autoMonth!==null&&(
          <div style={{marginBottom:10}}>
            <div style={{fontSize:18,fontWeight:900,color:"#1A1A1A",letterSpacing:-0.5}}>{babyName||"아기"}의 추천 용품</div>
            <div style={{fontSize:12,color:"#888",marginTop:2}}>{autoMonth}개월 · {grp.label} 그룹</div>
          </div>
        )}
        {!bday&&<div style={{fontSize:18,fontWeight:900,color:"#1A1A1A",marginBottom:10,letterSpacing:-0.5}}>개월별 추천 용품</div>}
        {/* 개월 그룹 탭 */}
        <div style={{display:"flex",gap:6}}>
          {MONTH_GROUPS.map((g,i)=>{
            const active=grpIdx===i;
            return(
              <button key={g.short} onClick={()=>setGrpIdx(i)} style={{flex:1,padding:"7px 4px",borderRadius:10,background:active?"#FF7043":"#F5F0EB",color:active?"#fff":"#888",border:"none",fontWeight:active?900:600,fontSize:10,cursor:"pointer",transition:"all .15s",lineHeight:1.3}}>
                {g.short}<br/><span style={{fontSize:8,opacity:0.8}}>개월</span>
              </button>
            );
          })}
        </div>
      </div>

      <div style={{padding:"14px 14px 28px"}}>

        {/* CTA 배너 */}
        <div style={{display:"flex",gap:8,marginBottom:16}}>
          <button onClick={()=>setTab("home_ess")} style={{flex:1,background:"#FF7043",border:"none",borderRadius:12,padding:"12px 10px",cursor:"pointer",textAlign:"left",color:"#fff"}}>
            <div style={{fontSize:11,fontWeight:900,marginBottom:2}}>필수템 체크리스트</div>
            <div style={{fontSize:9,opacity:0.85}}>{grp.label} 추천 20가지 →</div>
          </button>
          <button onClick={()=>setTab("home_steri")} style={{flex:1,background:"#4ECDC4",border:"none",borderRadius:12,padding:"12px 10px",cursor:"pointer",textAlign:"left",color:"#fff"}}>
            <div style={{fontSize:11,fontWeight:900,marginBottom:2}}>소독 가이드</div>
            <div style={{fontSize:9,opacity:0.85}}>주기·방법 총정리 →</div>
          </button>
        </div>

        {/* 카테고리 */}
        <div style={{marginBottom:16}}>
          <div style={{fontSize:13,fontWeight:900,color:"#1A1A1A",marginBottom:8}}>카테고리</div>
          <div className="hscroll" style={{display:"flex",gap:6,overflowX:"scroll",scrollbarWidth:"none",cursor:"grab",userSelect:"none"}} {...DRAG()}>
            {["수유용품","기저귀/위생","수면용품","목욕/스킨","건강/안전","의류","이동용품","놀이/발달","이유식용품","안전용품"].map((cat,i)=>{
              const cc=[PINK,MINT,LAVEN,SKY,"#FFB347","#FF8A65","#8BC34A","#9C27B0","#00BCD4","#E91E63"][i%10];
              return(
                <button key={cat} onClick={()=>setTab("shop_cat_"+cat)} style={{flexShrink:0,background:cc,color:"#fff",border:"none",borderRadius:20,padding:"6px 14px",fontSize:10,fontWeight:800,cursor:"pointer",whiteSpace:"nowrap"}}>
                  {cat}
                </button>
              );
            })}
          </div>
        </div>

        {/* 전체 쇼핑몰 비교 헤더 */}
        <div style={{marginBottom:10}}>
          <div style={{fontSize:14,fontWeight:900,color:"#1A1A1A",marginBottom:2}}>🛍️ 전체 쇼핑몰 실시간 비교</div>
          <div style={{fontSize:10,color:"#888"}}>쇼핑몰을 선택하면 함께 비교해드려요</div>
        </div>

        {/* 쇼핑몰 체크박스 */}
        <div style={{display:"flex",gap:6,overflowX:"auto",scrollbarWidth:"none",marginBottom:10}}>
          {[
            {k:"naver", l:"네이버", c:"#03C75A", active:true},
            {k:"eleven",l:"11번가", c:"#E60000", active:true},
            {k:"coupang",l:"쿠팡",  c:"#FF5733", active:false},
            {k:"ali",   l:"알리",   c:"#FF4747", active:false},
            {k:"temu",  l:"Temu",  c:"#FF6900", active:false},
          ].map(({k,l,c,active})=>{
            const checked=selectedShops[k];
            return(
              <button key={k}
                onClick={()=>{
                  if(!active)return;
                  setSelectedShops(prev=>{
                    const next={...prev,[k]:!prev[k]};
                    // 최소 1개는 선택 유지
                    if(!Object.values(next).some(Boolean))return prev;
                    return next;
                  });
                }}
                style={{flexShrink:0,display:"flex",alignItems:"center",gap:5,padding:"7px 12px",borderRadius:20,
                  background:checked&&active?c:"#fff",
                  color:checked&&active?"#fff":active?"#555":"#CCC",
                  border:`2px solid ${checked&&active?c:active?"#DDD":"#EEE"}`,
                  fontWeight:800,fontSize:11,cursor:active?"pointer":"default",
                  transition:"all .2s",opacity:active?1:0.45,
                  boxShadow:checked&&active?`0 3px 10px ${c}40`:"none",
                }}>
                {/* 체크 아이콘 */}
                {active&&<span style={{fontSize:10}}>{checked?"✓":"○"}</span>}
                {l}
                {!active&&<span style={{fontSize:8,color:"#CCC",marginLeft:2}}>준비중</span>}
              </button>
            );
          })}
        </div>

        {/* 선택된 쇼핑몰 표시 */}
        {(selectedShops.naver&&selectedShops.eleven)&&(
          <div style={{background:"linear-gradient(135deg,#E8F5E9,#FFF0F0)",borderRadius:10,padding:"7px 12px",marginBottom:10,border:"1px solid #DDD",fontSize:10,color:"#555",fontWeight:700}}>
            🟢 네이버 + 🔴 11번가 통합 비교 중
          </div>
        )}

        {/* 정렬 */}
        <div style={{display:"flex",gap:6,marginBottom:14}}>
          {[{k:"score",l:"종합순"},{k:"sales",l:"판매순"},{k:"reviews",l:"리뷰순"},{k:"rating",l:"별점순"}].map(({k,l})=>(
            <button key={k} onClick={()=>setSortBy(k)} style={{flex:1,padding:"7px 0",borderRadius:8,background:sortBy===k?"#FF7043":"#fff",color:sortBy===k?"#fff":"#888",border:sortBy===k?"none":"1px solid #EEE8E0",fontWeight:sortBy===k?900:600,fontSize:10,cursor:"pointer",transition:"all .15s"}}>{l}</button>
          ))}
        </div>

        {/* 로딩 */}
        {loading&&(
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {[1,2,3,4,5,6].map(i=>(
              <div key={i} style={{background:"#fff",borderRadius:12,padding:"14px",border:"1px solid #EEE8E0",display:"flex",gap:12,alignItems:"center"}}>
                <div style={{width:72,height:72,borderRadius:10,background:"#F0EDE8",flexShrink:0,animation:"pulse 1.5s infinite"}}/>
                <div style={{flex:1}}>
                  <div style={{height:14,background:"#F0EDE8",borderRadius:6,marginBottom:8,animation:"pulse 1.5s infinite"}}/>
                  <div style={{height:10,background:"#F0EDE8",borderRadius:6,width:"60%",animation:"pulse 1.5s infinite"}}/>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 통합 상품 리스트 */}
        {!loading&&mergedItems.length===0&&(
          <div style={{textAlign:"center",padding:"40px 0",color:"#aaa"}}>
            <div style={{fontSize:32,marginBottom:8}}>🔍</div>
            <div>상품을 불러오는 중이에요</div>
          </div>
        )}

        {!loading&&mergedItems.length>0&&(
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            {mergedItems.map((item,i)=>{
              const isEleven=item._src==="eleven";
              const color=isEleven?"#E60000":"#03C75A";
              const bgColor=isEleven?"#FFF0F0":"#E8F5E9";
              const RANKS=["🥇","🥈","🥉"];
              return(
                <div key={i} onClick={()=>window.open(item.link,"_blank")}
                  style={{background:"#fff",borderRadius:14,border:`1.5px solid ${color}20`,boxShadow:"0 2px 8px rgba(0,0,0,0.05)",cursor:"pointer",overflow:"hidden",transition:"transform .1s"}}
                  onMouseDown={e=>e.currentTarget.style.transform="scale(0.98)"}
                  onMouseUp={e=>e.currentTarget.style.transform="scale(1)"}
                >
                  {/* 쇼핑몰 표시 바 */}
                  <div style={{background:color,padding:"4px 12px",display:"flex",alignItems:"center",gap:6}}>
                    <span style={{fontSize:9,color:"#fff",fontWeight:900}}>{isEleven?"🔴 11번가":"🟢 네이버쇼핑"}</span>
                    {i<6&&<span style={{fontSize:9,color:"rgba(255,255,255,0.8)",marginLeft:"auto"}}>{i<3?RANKS[i]:`${i+1}위`}</span>}
                  </div>

                  <div style={{display:"flex",gap:12,alignItems:"flex-start",padding:"12px 14px 10px"}}>
                    {/* 이미지 */}
                    {item.image
                      ?<img src={item.image} alt={item.title} style={{width:68,height:68,borderRadius:10,objectFit:"cover",flexShrink:0,border:"1px solid #EEE8E0"}} onError={e=>e.target.style.display="none"}/>
                      :<div style={{width:68,height:68,borderRadius:10,background:"#F5F0EB",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:26}}>🛍️</div>
                    }

                    {/* 상품 정보 */}
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:13,fontWeight:800,color:"#1A1A1A",lineHeight:1.4,marginBottom:5,overflow:"hidden",display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical"}}>{item.title}</div>
                      <div style={{fontSize:16,fontWeight:900,color,marginBottom:5}}>{item.lprice?.toLocaleString()}원~</div>
                      <div style={{display:"flex",gap:6,flexWrap:"wrap",alignItems:"center"}}>
                        {item.rating>0&&<span style={{fontSize:10,fontWeight:800,color:"#FFB300"}}>★{item.rating.toFixed(1)}</span>}
                        {item.reviewCount>0&&<span style={{fontSize:9,color:"#888"}}>💬 {item.reviewCount.toLocaleString()}</span>}
                        {item.score>0&&!isEleven&&<span style={{fontSize:9,color:"#888"}}>🔥 {item.score.toLocaleString()}</span>}
                        {item.brand&&<span style={{fontSize:9,color:"#aaa"}}>{item.brand}</span>}
                      </div>
                    </div>
                  </div>

                  <div style={{display:"flex",justifyContent:"flex-end",padding:"6px 14px 10px",borderTop:"1px solid #F5F0EB"}}>
                    <div style={{fontSize:9,background:color,color:"#fff",borderRadius:6,padding:"3px 10px",fontWeight:800}}>바로가기 →</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div style={{marginTop:16,padding:"10px 14px",background:"#fff",borderRadius:12,border:"1px solid #EEE8E0"}}>
          <div style={{fontSize:10,color:"#aaa",textAlign:"center"}}>
            ✅ 네이버 · 11번가 연동 완료 &nbsp;|&nbsp; ⏳ 쿠팡 · 알리 · Temu 준비중
          </div>
        </div>

      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   SHOP TAB — 쇼핑몰 체크박스 필터 포함
════════════════════════════════════════════════════ */
function ShopTab({month,setMonth,wish,onWish,setSelProd,activeShops,setActiveShops,initCat,setShopCat}){
  const initGrp=Math.max(0,MONTH_GROUPS.findIndex(g=>g.months.includes(month)));
  const [grpIdx,setGrpIdx]=useState(initGrp);
  const [sort,setSort]=useState("score"),[cat,setCat]=useState(initCat&&initCat!=="전체"?initCat:"전체"),[q,setQ]=useState(""),[showAll,setShowAll]=useState(false);
  const [selectedShops,setSelectedShops]=useState({naver:true,eleven:true});
  const [naverItems,setNaverItems]=useState([]);
  const [elevenItems,setElevenItems]=useState([]);
  const [shopLoading,setShopLoading]=useState(false);
  useEffect(()=>{if(initCat&&initCat!=="전체"){setCat(initCat);if(setShopCat)setShopCat("전체");}}, [initCat]);

  const grp=MONTH_GROUPS[grpIdx];
  const prods=getGroupProds(grp.months);
  const cats=["전체",...new Set(prods.map(p=>p.cat))];

  // 실시간 검색
  useEffect(()=>{
    const keyword=(cat!=="전체"?cat+" ":"")+grp.short+"개월 아기용품";
    setShopLoading(true);
    setNaverItems([]);
    setElevenItems([]);
    const elevenSort=sort==="reviews"?"REVIEW":sort==="rating"?"RATING":"POPULAR";
    const naverSort=sort==="price_asc"?"asc":"sim";
    const fetchers=[];
    if(selectedShops.naver) fetchers.push(fetchNaver(keyword,naverSort,15).then(r=>({src:"naver",items:r||[]})));
    else fetchers.push(Promise.resolve({src:"naver",items:[]}));
    if(selectedShops.eleven) fetchers.push(fetchEleven(keyword,elevenSort,15).then(r=>({src:"eleven",items:r||[]})));
    else fetchers.push(Promise.resolve({src:"eleven",items:[]}));
    Promise.all(fetchers).then(([nRes,eRes])=>{
      let ns=[...nRes.items];
      if(sort==="reviews") ns.sort((a,b)=>b.reviewCount-a.reviewCount);
      if(sort==="sales")   ns.sort((a,b)=>b.score-a.score);
      if(sort==="score")   ns.sort((a,b)=>(b.reviewCount+b.score*10)-(a.reviewCount+a.score*10));
      setNaverItems(ns);
      setElevenItems(eRes.items);
      setShopLoading(false);
    });
  },[grp,cat,sort,selectedShops]);

  // 통합 결과
  const mergedItems=useMemo(()=>{
    const naver=(selectedShops.naver?naverItems:[]).map(i=>({...i,_src:"naver"}));
    const eleven=(selectedShops.eleven?elevenItems:[]).map(i=>({...i,_src:"eleven"}));
    if(!selectedShops.naver) return eleven;
    if(!selectedShops.eleven) return naver;
    const merged=[];
    const maxLen=Math.max(naver.length,eleven.length);
    for(let i=0;i<maxLen;i++){
      if(naver[i]) merged.push(naver[i]);
      if(eleven[i]) merged.push(eleven[i]);
    }
    return merged;
  },[naverItems,elevenItems,selectedShops]);

  return(
    <div style={{overflowY:"auto",flex:1,padding:"10px 12px 20px",background:"#FAFAFA"}}>
      {/* 검색 */}
      <div style={{position:"relative",marginBottom:10}}>
        <span style={{position:"absolute",left:11,top:"50%",transform:"translateY(-50%)",color:MU,fontSize:13}}>🔍</span>
        <input value={q} onChange={e=>{setQ(e.target.value);setShowAll(false);}} placeholder="상품명 또는 카테고리 검색..."
          style={{width:"100%",background:"#fff",border:`1.5px solid ${q?"#FF7043":"#EEE8E0"}`,borderRadius:13,padding:"10px 32px",fontSize:13,color:TX,boxSizing:"border-box",outline:"none",fontFamily:"inherit"}}/>
        {q&&<button onClick={()=>setQ("")} style={{position:"absolute",right:11,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",color:MU,cursor:"pointer"}}>✕</button>}
      </div>

      {/* 개월 그룹 */}
      <div style={{display:"flex",gap:5,marginBottom:10}}>
        {MONTH_GROUPS.map((g,i)=>(
          <button key={g.short} onClick={()=>{setGrpIdx(i);setCat("전체");setQ("");setShowAll(false);}} style={{flex:1,padding:"7px 2px",borderRadius:10,background:grpIdx===i?"#FF7043":"#fff",color:grpIdx===i?"#fff":"#888",border:grpIdx===i?"none":"1px solid #EEE8E0",fontWeight:grpIdx===i?900:600,fontSize:9,cursor:"pointer",lineHeight:1.4}}>
            {g.short}<br/>개월
          </button>
        ))}
      </div>

      {/* 쇼핑몰 체크박스 */}
      <div style={{display:"flex",gap:6,overflowX:"auto",scrollbarWidth:"none",marginBottom:8}}>
        {[
          {k:"naver", l:"네이버", c:"#03C75A", active:true},
          {k:"eleven",l:"11번가", c:"#E60000", active:true},
          {k:"coupang",l:"쿠팡",  c:"#FF5733", active:false},
          {k:"ali",   l:"알리",   c:"#FF4747", active:false},
          {k:"temu",  l:"Temu",  c:"#FF6900", active:false},
        ].map(({k,l,c,active})=>{
          const checked=selectedShops[k];
          return(
            <button key={k}
              onClick={()=>{
                if(!active)return;
                setSelectedShops(prev=>{
                  const next={...prev,[k]:!prev[k]};
                  if(!Object.values(next).some(Boolean))return prev;
                  return next;
                });
              }}
              style={{flexShrink:0,display:"flex",alignItems:"center",gap:4,padding:"6px 11px",borderRadius:20,
                background:checked&&active?c:"#fff",
                color:checked&&active?"#fff":active?"#555":"#CCC",
                border:`2px solid ${checked&&active?c:active?"#DDD":"#EEE"}`,
                fontWeight:800,fontSize:11,cursor:active?"pointer":"default",
                transition:"all .2s",opacity:active?1:0.45,
                boxShadow:checked&&active?`0 3px 10px ${c}40`:"none",
              }}>
              {active&&<span style={{fontSize:10}}>{checked?"✓":"○"}</span>}
              {l}{!active&&<span style={{fontSize:8,color:"#CCC"}}> 준비중</span>}
            </button>
          );
        })}
      </div>

      {/* 카테고리 */}
      <div
        className="hscroll"
        style={{display:"flex",gap:4,overflowX:"scroll",scrollbarWidth:"none",marginBottom:6,WebkitOverflowScrolling:"touch",cursor:"grab",userSelect:"none"}}
        onMouseDown={e=>{const el=e.currentTarget;el.dataset.down="1";el.dataset.startX=e.pageX-el.offsetLeft;el.dataset.scrollLeft=el.scrollLeft;el.style.cursor="grabbing";}}
        onMouseLeave={e=>{e.currentTarget.dataset.down="0";e.currentTarget.style.cursor="grab";}}
        onMouseUp={e=>{e.currentTarget.dataset.down="0";e.currentTarget.style.cursor="grab";}}
        onMouseMove={e=>{if(e.currentTarget.dataset.down!=="1")return;e.preventDefault();const el=e.currentTarget;const x=e.pageX-el.offsetLeft;const walk=(x-Number(el.dataset.startX))*1.5;el.scrollLeft=Number(el.dataset.scrollLeft)-walk;}}
      >
        {cats.map(c=>(<button key={c} onClick={()=>{setCat(c);setShowAll(false);}} style={{flexShrink:0,borderRadius:16,padding:"4px 12px",background:cat===c?TX:CA,color:cat===c?"#fff":MU,border:`1px solid ${cat===c?TX:BO}`,fontWeight:700,fontSize:10,cursor:"pointer",whiteSpace:"nowrap"}}>{c}</button>))}
      </div>

      {/* 정렬 */}
      <div style={{display:"flex",gap:4,overflowX:"auto",scrollbarWidth:"none",marginBottom:9}}>
        {[{k:"score",l:"종합📊"},{k:"reviews",l:"리뷰💬"},{k:"rating",l:"별점⭐"},{k:"price_asc",l:"낮은가격"}].map(({k,l})=>(
          <button key={k} onClick={()=>setSort(k)} style={{flexShrink:0,borderRadius:8,padding:"5px 10px",background:sort===k?"#FF7043":CA,color:sort===k?"#fff":MU,border:sort===k?"none":`1px solid ${BO}`,fontWeight:700,fontSize:10,cursor:"pointer"}}>{l}</button>
        ))}
      </div>

      {/* 로딩 */}
      {shopLoading&&(
        <div style={{display:"flex",flexDirection:"column",gap:7}}>
          {[1,2,3,4,5].map(i=>(
            <div key={i} style={{background:"#fff",borderRadius:12,padding:"14px",border:"1px solid #EEE8E0",display:"flex",gap:10}}>
              <div style={{width:64,height:64,borderRadius:10,background:"#F0EDE8",flexShrink:0,animation:"pulse 1.5s infinite"}}/>
              <div style={{flex:1}}>
                <div style={{height:13,background:"#F0EDE8",borderRadius:6,marginBottom:8,animation:"pulse 1.5s infinite"}}/>
                <div style={{height:10,background:"#F0EDE8",borderRadius:6,width:"60%",animation:"pulse 1.5s infinite"}}/>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 통합 상품 리스트 */}
      {!shopLoading&&mergedItems.length>0&&(
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {mergedItems.map((item,i)=>{
            const isEleven=item._src==="eleven";
            const color=isEleven?"#E60000":"#03C75A";
            return(
              <div key={i} onClick={()=>window.open(item.link,"_blank")}
                style={{background:"#fff",borderRadius:14,border:`1.5px solid ${color}20`,cursor:"pointer",overflow:"hidden",boxShadow:"0 2px 6px rgba(0,0,0,0.04)"}}
                onMouseDown={e=>e.currentTarget.style.transform="scale(0.98)"}
                onMouseUp={e=>e.currentTarget.style.transform="scale(1)"}
              >
                <div style={{background:color,padding:"3px 12px"}}>
                  <span style={{fontSize:9,color:"#fff",fontWeight:900}}>{isEleven?"🔴 11번가":"🟢 네이버쇼핑"}</span>
                </div>
                <div style={{display:"flex",gap:10,alignItems:"flex-start",padding:"10px 12px 8px"}}>
                  {item.image
                    ?<img src={item.image} alt={item.title} style={{width:62,height:62,borderRadius:10,objectFit:"cover",flexShrink:0,border:"1px solid #EEE8E0"}} onError={e=>e.target.style.display="none"}/>
                    :<div style={{width:62,height:62,borderRadius:10,background:"#F5F0EB",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22}}>🛍️</div>
                  }
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:12,fontWeight:800,color:"#1A1A1A",lineHeight:1.35,marginBottom:4,overflow:"hidden",display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical"}}>{item.title}</div>
                    <div style={{fontSize:14,fontWeight:900,color,marginBottom:4}}>{item.lprice?.toLocaleString()}원~</div>
                    <div style={{display:"flex",gap:5,flexWrap:"wrap",alignItems:"center"}}>
                      {item.rating>0&&<span style={{fontSize:10,fontWeight:800,color:"#FFB300"}}>★{item.rating.toFixed(1)}</span>}
                      {item.reviewCount>0&&<span style={{fontSize:9,color:"#888"}}>💬 {item.reviewCount.toLocaleString()}</span>}
                      {item.brand&&<span style={{fontSize:9,color:"#aaa"}}>{item.brand}</span>}
                    </div>
                  </div>
                </div>
                <div style={{display:"flex",justifyContent:"flex-end",padding:"4px 12px 8px",borderTop:"1px solid #F5F0EB"}}>
                  <div style={{fontSize:9,background:color,color:"#fff",borderRadius:6,padding:"3px 10px",fontWeight:800}}>바로가기 →</div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!shopLoading&&mergedItems.length===0&&(
        <div style={{textAlign:"center",padding:"40px 0",color:"#aaa",background:"#fff",borderRadius:14,border:"1px solid #EEE8E0"}}>
          <div style={{fontSize:32,marginBottom:6}}>🔍</div>
          <div style={{fontSize:12}}>상품을 불러오는 중이에요</div>
        </div>
      )}

      <div style={{marginTop:12,padding:"8px 12px",background:"#fff",borderRadius:10,border:"1px solid #EEE8E0"}}>
        <div style={{fontSize:9,color:"#aaa",textAlign:"center"}}>✅ 네이버 · 11번가 연동 완료 &nbsp;|&nbsp; ⏳ 쿠팡 · 알리 · Temu 준비중</div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   GUIDE TAB — 클릭 즉시 내용 펼쳐짐
════════════════════════════════════════════════════ */
function GuideTab(){
  const [openId,setOpenId]=useState("g1"); // 첫번째 기본 오픈
  return(
    <div style={{overflowY:"auto",flex:1,background:"#FAFAFA",padding:"14px 14px 28px"}}>
      <div style={{marginBottom:14}}>
        <div style={{fontSize:20,fontWeight:900,color:"#1A1A1A",marginBottom:3,letterSpacing:-0.5}}>육아 가이드 📚</div>
        <div style={{fontSize:12,color:"#888"}}>초보 부모를 위한 완전 가이드 · 탭하면 바로 내용이 펼쳐져요</div>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        {GUIDES.map(g=>{
          const isOpen=openId===g.id;
          return(
            <div key={g.id} style={{background:"#fff",borderRadius:14,border:`1.5px solid ${isOpen?g.color+"60":"#EEE8E0"}`,overflow:"hidden",transition:"all .2s"}}>
              {/* 헤더 — 항상 표시 */}
              <button onClick={()=>setOpenId(isOpen?null:g.id)} style={{width:"100%",display:"flex",alignItems:"center",gap:12,padding:"14px",background:"none",border:"none",cursor:"pointer",textAlign:"left"}}>
                <div style={{width:40,height:40,borderRadius:12,background:g.color,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0}}>{g.emoji}</div>
                <div style={{flex:1}}>
                  <div style={{fontSize:14,fontWeight:900,color:"#1A1A1A",lineHeight:1.3}}>{g.title}</div>
                  <div style={{fontSize:11,color:"#888",marginTop:2}}>{g.desc.slice(0,30)}...</div>
                </div>
                <div style={{fontSize:18,color:isOpen?g.color:"#CCC",transition:"transform .2s",transform:isOpen?"rotate(90deg)":"rotate(0deg)",flexShrink:0}}>›</div>
              </button>

              {/* 펼쳐지면: 아이템 목록 바로 표시 */}
              {isOpen&&<div style={{borderTop:`1px solid ${g.color}20`}}>
                {/* 가이드 아이템들 */}
                <div style={{padding:"8px 14px"}}>
                  {g.items.map((item,i)=>(
                    <div key={i} style={{display:"flex",gap:10,padding:"10px 0",borderBottom:i<g.items.length-1?"1px solid #F5F0EB":"none"}}>
                      <div style={{fontSize:16,flexShrink:0,width:24,textAlign:"center",marginTop:1}}>{item.e}</div>
                      <div style={{flex:1}}>
                        <div style={{fontSize:12,fontWeight:800,color:"#1A1A1A",marginBottom:3}}>{item.name}</div>
                        <div style={{fontSize:11,color:"#555",lineHeight:1.6}}>{item.detail}</div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* 추천 상품 — 바로 구매 유도 */}
                {g.recs&&<div style={{padding:"12px 14px 14px",background:"#FAFAFA",borderTop:`1px solid ${g.color}20`}}>
                  <div style={{fontSize:12,fontWeight:900,color:"#1A1A1A",marginBottom:8}}>추천 상품</div>
                  <div style={{display:"flex",flexDirection:"column",gap:8}}>
                    {g.recs.map((rec,i)=>(
                      <div key={rec.name} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 12px",background:"#fff",borderRadius:10,border:"1px solid #EEE8E0"}}>
                        <div style={{fontSize:9,fontWeight:900,color:i===0?"#FF7043":"#888",minWidth:18}}>{i===0?"🏆":i===1?"🥈":"🥉"}</div>
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{fontSize:11,fontWeight:800,color:"#1A1A1A",lineHeight:1.3}}>{rec.name}</div>
                          <div style={{display:"flex",gap:5,marginTop:3}}>
                            <span style={{fontSize:8,color:"#888"}}>리뷰 {rec.reviews.toLocaleString()}</span>
                            <span style={{fontSize:8,color:"#888"}}>·</span>
                            <span style={{fontSize:8,color:"#888"}}>판매 {rec.sales.toLocaleString()}</span>
                          </div>
                        </div>
                        <div style={{textAlign:"right",flexShrink:0}}>
                          <div style={{fontSize:12,fontWeight:900,color:"#FF7043",marginBottom:4}}>{rec.price.toLocaleString()}원~</div>
                          <button onClick={()=>goShop(rec.shop||"쿠팡",rec.name)} style={{background:"#FF7043",color:"#fff",border:"none",borderRadius:8,padding:"6px 12px",fontSize:10,fontWeight:900,cursor:"pointer",boxShadow:"0 2px 8px rgba(255,112,67,0.3)"}}>바로가기</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>}
              </div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   PROFILE TAB
════════════════════════════════════════════════════ */
function ProfileTab({user,setShowAuth,setUser,wish,setWish,checks,setChecks,babyName,setBabyName,bday,setBday,setTab}){
  const [showCL,setShowCL]=useState(false);
  const [editBaby,setEditBaby]=useState(!bday); // 아기 정보 없으면 바로 입력 모드
  const [tmpName,setTmpName]=useState(babyName);
  const [tmpBday,setTmpBday]=useState(bday);
  const doneCnt=CHECKLIST.filter(c=>checks[c.id]).length;
  const pct=Math.round(doneCnt/CHECKLIST.length*100);
  const autoMonth=calcMonth(bday);

  if(showCL)return(
    <div style={{display:"flex",flexDirection:"column",flex:1,overflow:"hidden"}}>
      <div style={{background:"#fff",padding:"12px 16px 10px",borderBottom:"1px solid #EEE8E0",display:"flex",alignItems:"center",gap:10,flexShrink:0}}>
        <button onClick={()=>setShowCL(false)} style={{background:"none",border:"none",fontSize:18,cursor:"pointer",color:"#888",padding:0}}>←</button>
        <span style={{fontSize:15,fontWeight:900,color:"#1A1A1A"}}>육아용품 체크리스트</span>
        <span style={{marginLeft:"auto",fontSize:12,fontWeight:700,color:"#FF7043"}}>{doneCnt}/{CHECKLIST.length}</span>
      </div>
      <ChecklistView checks={checks} setChecks={setChecks}/>
    </div>
  );

  if(!user)return(
    <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:32,gap:16,background:"#FAFAFA"}}>
      <div style={{fontSize:72,animation:"bounce 2s infinite"}}>👶</div>
      <div style={{textAlign:"center"}}>
        <div style={{fontSize:20,fontWeight:900,color:"#1A1A1A",marginBottom:6}}>HANA 가족이 되어보세요!</div>
        <div style={{fontSize:13,color:"#888",lineHeight:1.7}}>아기 정보 저장, 찜 목록,<br/>체크리스트까지 무료로!</div>
      </div>
      <button onClick={()=>setShowAuth(true)} style={{background:"#FF7043",color:"#fff",border:"none",borderRadius:14,padding:"14px 40px",fontSize:15,fontWeight:900,cursor:"pointer",boxShadow:"0 6px 20px rgba(255,112,67,0.35)"}}>
        로그인 / 회원가입 →
      </button>
    </div>
  );

  return(
    <div style={{flex:1,overflowY:"auto",background:"#FAFAFA",paddingBottom:24}}>

      {/* 프로필 헤더 */}
      <div style={{background:"linear-gradient(135deg,#FF7043,#FFB347)",padding:"20px 16px 24px",color:"#fff"}}>
        <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:16}}>
          <div style={{width:52,height:52,borderRadius:26,background:"rgba(255,255,255,0.3)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,fontWeight:900,backdropFilter:"blur(10px)"}}>
            {user.name[0]}
          </div>
          <div>
            <div style={{fontSize:17,fontWeight:900}}>{user.name}님 안녕하세요! 👋</div>
            <div style={{fontSize:11,opacity:0.85,marginTop:2}}>{user.email}</div>
          </div>
        </div>

        {/* 체크리스트 진행바 */}
        <div style={{background:"rgba(255,255,255,0.2)",borderRadius:12,padding:"10px 12px",cursor:"pointer"}} onClick={()=>setShowCL(true)}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
            <span style={{fontSize:11,fontWeight:700}}>✅ 육아용품 체크리스트</span>
            <span style={{fontSize:11,fontWeight:900}}>{doneCnt}/{CHECKLIST.length}개</span>
          </div>
          <div style={{height:6,borderRadius:9,background:"rgba(255,255,255,0.3)",overflow:"hidden"}}>
            <div style={{width:`${pct}%`,height:"100%",borderRadius:9,background:"#fff",transition:"width 0.3s"}}/>
          </div>
          <div style={{fontSize:9,marginTop:4,opacity:0.85}}>
            {pct===100?"🎉 모두 준비됐어요!":pct>=50?"👍 절반 이상 완료!":"💪 탭해서 체크하기 →"}
          </div>
        </div>
      </div>

      <div style={{padding:"16px 14px",display:"flex",flexDirection:"column",gap:12}}>

        {/* 아기 정보 카드 */}
        <div style={{background:"#fff",borderRadius:16,padding:"16px",border:"1px solid #EEE8E0",boxShadow:"0 2px 8px rgba(0,0,0,0.04)"}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
            <div style={{fontSize:14,fontWeight:900,color:"#1A1A1A"}}>👶 아기 정보</div>
            {!editBaby&&bday&&<button onClick={()=>{setTmpName(babyName);setTmpBday(bday);setEditBaby(true);}} style={{fontSize:11,color:"#FF7043",background:"none",border:"1px solid #FF7043",borderRadius:8,padding:"3px 10px",cursor:"pointer",fontWeight:700}}>수정</button>}
          </div>

          {editBaby?(
            <div>
              <input value={tmpName} onChange={e=>setTmpName(e.target.value)} placeholder="아기 이름 (예: 하나)" style={{width:"100%",border:"1.5px solid #EEE8E0",borderRadius:10,padding:"10px 12px",fontSize:13,color:"#1A1A1A",boxSizing:"border-box",outline:"none",fontFamily:"inherit",marginBottom:8,background:"#FAFAFA"}}/>
              <div style={{fontSize:10,color:"#888",marginBottom:4}}>생년월일</div>
              <input value={tmpBday} onChange={e=>setTmpBday(e.target.value)} type="date" style={{width:"100%",border:"1.5px solid #EEE8E0",borderRadius:10,padding:"10px 12px",fontSize:13,color:"#1A1A1A",boxSizing:"border-box",outline:"none",fontFamily:"inherit",marginBottom:12,background:"#FAFAFA"}}/>
              <div style={{display:"flex",gap:8}}>
                <button onClick={()=>{setBabyName(tmpName);setBday(tmpBday);setEditBaby(false);}} style={{flex:1,background:"#FF7043",color:"#fff",border:"none",borderRadius:10,padding:"10px",fontSize:13,fontWeight:900,cursor:"pointer"}}>저장</button>
                {bday&&<button onClick={()=>setEditBaby(false)} style={{flex:1,background:"#F5F0EB",color:"#888",border:"none",borderRadius:10,padding:"10px",fontSize:13,fontWeight:700,cursor:"pointer"}}>취소</button>}
              </div>
            </div>
          ):(
            bday?(
              <div style={{display:"flex",alignItems:"center",gap:16}}>
                <div style={{width:56,height:56,borderRadius:28,background:"linear-gradient(135deg,#FFF0E8,#FFE4D0)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:28,border:"2px solid #FFD0B0"}}>👶</div>
                <div>
                  <div style={{fontSize:18,fontWeight:900,color:"#1A1A1A"}}>{babyName||"아기"}</div>
                  <div style={{fontSize:13,color:"#FF7043",fontWeight:700,marginTop:2}}>🌟 {autoMonth}개월</div>
                  <div style={{fontSize:10,color:"#888",marginTop:1}}>{new Date(bday).toLocaleDateString("ko-KR")} 출생</div>
                </div>
              </div>
            ):(
              <button onClick={()=>setEditBaby(true)} style={{width:"100%",background:"#FFF0E8",border:"1.5px dashed #FFB347",borderRadius:10,padding:"16px",cursor:"pointer",color:"#FF7043",fontWeight:700,fontSize:13}}>
                + 아기 정보 입력하기
              </button>
            )
          )}
        </div>

        {/* 찜 목록 */}
        <div style={{background:"#fff",borderRadius:16,padding:"14px 16px",border:"1px solid #EEE8E0",boxShadow:"0 2px 8px rgba(0,0,0,0.04)"}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
            <div>
              <div style={{fontSize:14,fontWeight:900,color:"#1A1A1A"}}>❤️ 찜 목록</div>
              <div style={{fontSize:11,color:"#888",marginTop:2}}>{wish.length}개 저장됨</div>
            </div>
            {wish.length>0&&<button onClick={()=>setTab("wish")} style={{fontSize:11,color:"#FF7043",background:"none",border:"1px solid #FF7043",borderRadius:8,padding:"3px 10px",cursor:"pointer",fontWeight:700}}>보기 →</button>}
          </div>
          {wish.length>0&&(
            <div style={{display:"flex",gap:6,marginTop:10,overflowX:"auto",scrollbarWidth:"none"}}>
              {wish.slice(0,4).map(p=>(
                <div key={p.id} style={{flexShrink:0,width:52,height:52,borderRadius:10,background:"#F5F0EB",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,border:"1px solid #EEE8E0"}}>
                  {p.img}
                </div>
              ))}
              {wish.length>4&&<div style={{flexShrink:0,width:52,height:52,borderRadius:10,background:"#F5F0EB",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,color:"#888",fontWeight:700,border:"1px solid #EEE8E0"}}>+{wish.length-4}</div>}
            </div>
          )}
        </div>

        {/* 메뉴 */}
        <div style={{background:"#fff",borderRadius:16,border:"1px solid #EEE8E0",overflow:"hidden",boxShadow:"0 2px 8px rgba(0,0,0,0.04)"}}>
          {[
            {e:"✅",l:"체크리스트",s:`${doneCnt}/${CHECKLIST.length}개 완료`,cb:()=>setShowCL(true)},
            {e:"📚",l:"육아 가이드",s:"수유·이유식·수면·발달",cb:()=>setTab("guide")},
            {e:"🛍️",l:"쇼핑하기",s:"개월별 추천 상품",cb:()=>setTab("shop")},
            {e:"🔔",l:"가격 알림",s:"쿠팡 API 연동 후 제공 예정",cb:null},
          ].map(({e,l,s,cb},i,arr)=>(
            <button key={l} onClick={cb||undefined} style={{display:"flex",alignItems:"center",gap:12,padding:"13px 16px",background:"none",border:"none",borderBottom:i<arr.length-1?"1px solid #F5F0EB":"none",cursor:cb?"pointer":"default",textAlign:"left",width:"100%",boxSizing:"border-box"}}>
              <span style={{fontSize:20}}>{e}</span>
              <div style={{flex:1}}>
                <div style={{fontSize:13,fontWeight:700,color:cb?"#1A1A1A":"#CCC"}}>{l}</div>
                <div style={{fontSize:10,color:"#aaa"}}>{s}</div>
              </div>
              {cb&&<span style={{color:"#CCC",fontSize:16}}>›</span>}
            </button>
          ))}
        </div>

        {/* 로그아웃 */}
        <button onClick={()=>setUser(null)} style={{width:"100%",background:"#fff",border:"1px solid #FFCDD2",borderRadius:14,padding:"12px",fontSize:13,fontWeight:700,color:"#E53935",cursor:"pointer",boxSizing:"border-box"}}>
          로그아웃
        </button>

        <div style={{textAlign:"center",fontSize:9,color:"#CCC"}}>HANA v1.0 · 쿠팡 API 연동 준비중</div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   MAIN APP
════════════════════════════════════════════════════ */
export default function App(){
  const [splash,    setSplash]    = useState(true);
  const [month,     setMonth]     = useState(1);
  const [tab,       setTab]       = useState("home");
  const [shopCat,   setShopCat]   = useState("전체");
  const [wish,      setWish]      = useState(()=>{try{return JSON.parse(localStorage.getItem("hana_wish")||"[]")}catch{return[]}});
  const [checks,    setChecks]    = useState(()=>{try{return JSON.parse(localStorage.getItem("hana_checks")||"{}")}catch{return{}}});
  const [user,      setUser]      = useState(()=>{try{return JSON.parse(localStorage.getItem("hana_user")||"null")}catch{return null}});
  const [babyName,  setBabyName]  = useState(()=>localStorage.getItem("hana_babyName")||"");
  const [bday,      setBday]      = useState(()=>localStorage.getItem("hana_bday")||"");
  const [activeShops,setActiveShops]=useState([]);
  const [showWish,  setShowWish]  = useState(false);
  const [showAuth,  setShowAuth]  = useState(false);
  const [showEss,   setShowEss]   = useState(false);
  const [showSteri, setShowSteri] = useState(false);
  const [selProd,   setSelProd]   = useState(null);
  const [toast,     setToast]     = useState(null);
  const [searchQ,   setSearchQ]   = useState("");
  const [showSearch,setShowSearch]= useState(false);

  // 로컬 저장
  useEffect(()=>{localStorage.setItem("hana_wish",JSON.stringify(wish));},[wish]);
  useEffect(()=>{localStorage.setItem("hana_checks",JSON.stringify(checks));},[checks]);
  useEffect(()=>{if(user)localStorage.setItem("hana_user",JSON.stringify(user));else localStorage.removeItem("hana_user");},[user]);
  useEffect(()=>{localStorage.setItem("hana_babyName",babyName);},[babyName]);
  useEffect(()=>{localStorage.setItem("hana_bday",bday);},[bday]);

  useEffect(()=>{const t=setTimeout(()=>setSplash(false),2500);return()=>clearTimeout(t);},[]);
  useEffect(()=>{const m=calcMonth(bday);if(m!==null)setMonth(Math.max(1,Math.min(12,m)));},[bday]);

  function fire(msg){setToast(msg);setTimeout(()=>setToast(null),1800);}
  function toggleWish(p){setWish(w=>{const e=w.find(x=>x.id===p.id);fire(e?"❌ 찜 해제":"❤️ 찜했어요!");return e?w.filter(x=>x.id!==p.id):[...w,p];});}

  function handleTabFromHome(t){
    if(t==="home_ess"){setShowEss(true);return;}
    if(t==="home_steri"){setShowSteri(true);return;}
    if(t.startsWith("shop_cat_")){
      const catName=t.replace("shop_cat_","");
      setShopCat(catName);
      setTimeout(()=>setTab("shop"),0);
      return;
    }
    setTab(t);
  }

  const autoMonth=calcMonth(bday);
  const NAV=[
    {id:"home",   icon:"🏠", label:"홈"},
    {id:"shop",   icon:"🛍️", label:"쇼핑"},
    {id:"guide",  icon:"📚", label:"가이드"},
    {id:"wish",   icon:"❤️", label:"찜", badge:wish.length},
    {id:"profile",icon:"👤", label:"마이"},
  ];
  function handleNav(id){if(id==="wish"){setShowWish(true);return;}setTab(id);}

  return(
    <div style={{fontFamily:"'Noto Sans KR','Apple SD Gothic Neo',sans-serif",background:"#FFF8F2",width:"100%",maxWidth:480,margin:"0 auto",display:"flex",flexDirection:"column",height:"100dvh",overflow:"hidden",position:"relative"}}>
      {splash&&<Splash/>}

      {/* TOP BAR */}
      <div style={{background:"#fff",padding:"10px 14px 9px",borderBottom:"1px solid #FFE0C8",flexShrink:0,boxShadow:"0 2px 12px rgba(255,112,67,0.08)"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
          <button onClick={()=>setTab("home")} style={{display:"flex",alignItems:"center",gap:8,background:"none",border:"none",cursor:"pointer",padding:0}}>
            <span style={{fontSize:22,display:"inline-block",animation:"float 3s ease-in-out infinite"}}>☀️</span>
            <div>
              <div style={{fontSize:20,fontWeight:900,letterSpacing:-1,lineHeight:1,background:"linear-gradient(135deg,#FF7043,#FFB347,#FF85A1)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>HANA</div>
              <div style={{fontSize:7,color:"#B09080",letterSpacing:0.5}}>초보 부모 육아 가이드</div>
            </div>
          </button>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            {bday&&autoMonth!==null&&(
              <div style={{background:"linear-gradient(135deg,#FFF0E8,#FFE4D0)",border:"1px solid #FFD0B0",borderRadius:12,padding:"4px 10px",textAlign:"center"}}>
                <div style={{fontSize:8,color:"#B09080"}}>우리 아기</div>
                <div style={{fontSize:11,fontWeight:900,color:"#FF7043"}}>{babyName||"아기"} {autoMonth}개월</div>
              </div>
            )}
            {user?(
              <button onClick={()=>setTab("profile")} style={{background:"rgba(255,112,67,0.1)",border:"1px solid rgba(255,112,67,0.25)",borderRadius:16,padding:"5px 11px",color:"#FF7043",fontWeight:800,fontSize:11,cursor:"pointer"}}>{user.name.slice(0,4)} ›</button>
            ):(
              <button onClick={()=>setShowAuth(true)} style={{background:"linear-gradient(135deg,#FF7043,#FFB347)",border:"none",borderRadius:16,padding:"6px 13px",color:"#fff",fontWeight:900,fontSize:11,cursor:"pointer"}}>로그인 ✨</button>
            )}
          </div>
        </div>
        {/* 검색창 */}
        <form onSubmit={e=>{e.preventDefault();if(searchQ.trim())setShowSearch(true);}} style={{display:"flex",gap:6}}>
          <div style={{flex:1,position:"relative"}}>
            <span style={{position:"absolute",left:10,top:"50%",transform:"translateY(-50%)",fontSize:13,color:"#B09080"}}>🔍</span>
            <input value={searchQ} onChange={e=>setSearchQ(e.target.value)} placeholder="어떤 육아용품이든 검색해보세요" style={{width:"100%",background:"#F5F0EB",border:"none",borderRadius:10,padding:"9px 10px 9px 30px",fontSize:12,color:"#2D1B12",boxSizing:"border-box",outline:"none",fontFamily:"inherit"}}/>
          </div>
          <button type="submit" style={{background:"linear-gradient(135deg,#FF7043,#FFB347)",color:"#fff",border:"none",borderRadius:10,padding:"9px 14px",fontSize:12,fontWeight:900,cursor:"pointer"}}>검색</button>
        </form>
      </div>

      {showSearch&&searchQ&&<SearchResults q={searchQ} onClose={()=>{setShowSearch(false);setSearchQ("");}}/>}

      {/* CONTENT */}
      <div style={{flex:1,overflow:"hidden",display:"flex",flexDirection:"column"}}>
        {tab==="home"    &&<HomeTab    month={month} setMonth={setMonth} bday={bday} babyName={babyName} wish={wish} onWish={toggleWish} setTab={handleTabFromHome} setSelProd={setSelProd} activeShops={activeShops}/>}
        {tab==="shop"    &&<ShopTab    month={month} setMonth={setMonth} wish={wish} onWish={toggleWish} setSelProd={setSelProd} activeShops={activeShops} setActiveShops={setActiveShops} initCat={shopCat} setShopCat={setShopCat}/>}
        {tab==="guide"   &&<GuideTab/>}
        {tab==="profile" &&<ProfileTab user={user} setShowAuth={setShowAuth} setUser={setUser} wish={wish} setWish={setWish} checks={checks} setChecks={setChecks} babyName={babyName} setBabyName={setBabyName} bday={bday} setBday={setBday} setTab={setTab}/>}
      </div>

      {/* BOTTOM NAV */}
      <div style={{background:"#fff",borderTop:"1px solid #F0E8E0",display:"flex",paddingBottom:"env(safe-area-inset-bottom,6px)",flexShrink:0,boxShadow:"0 -4px 20px rgba(0,0,0,0.07)"}}>
        {NAV.map(({id,icon,label,badge})=>{
          const active=(id!=="wish")&&tab===id;
          return(
            <button key={id} onClick={()=>handleNav(id)} style={{flex:1,background:"none",border:"none",cursor:"pointer",padding:"8px 0 4px",display:"flex",flexDirection:"column",alignItems:"center",gap:2,position:"relative"}}>
              <div style={{position:"relative",width:32,height:32,display:"flex",alignItems:"center",justifyContent:"center",borderRadius:12,background:active?"rgba(255,112,67,0.12)":"transparent",transition:"all .2s"}}>
                <span style={{fontSize:20,display:"inline-block",transition:"transform .2s",transform:active?"scale(1.2)":"scale(1)"}}>{icon}</span>
                {badge>0&&<span style={{position:"absolute",top:-2,right:-4,background:"#FF7043",color:"#fff",borderRadius:99,fontSize:7,fontWeight:900,padding:"1px 4px",minWidth:14,textAlign:"center"}}>{badge}</span>}
              </div>
              <span style={{fontSize:9,fontWeight:active?900:500,color:active?"#FF7043":"#BBB",transition:"all .2s"}}>{label}</span>
              {active&&<div style={{position:"absolute",top:0,left:"50%",transform:"translateX(-50%)",width:24,height:3,borderRadius:"0 0 3px 3px",background:"#FF7043"}}/>}
            </button>
          );
        })}
      </div>

      {/* SHEETS */}
      {selProd  &&<ProductDetail p={selProd} wished={!!wish.find(w=>w.id===selProd.id)} onWish={toggleWish} onClose={()=>setSelProd(null)} activeShops={activeShops}/>}
      {showEss  &&<EssSheet month={month} onClose={()=>setShowEss(false)} checks={checks} setChecks={setChecks} activeShops={activeShops}/>}
      {showSteri&&<SterilizeSheet onClose={()=>setShowSteri(false)} activeShops={activeShops}/>}
      {showWish &&<WishSheet wish={wish} setWish={setWish} onClose={()=>setShowWish(false)} activeShops={activeShops}/>}
      {showAuth &&<AuthModal onClose={()=>setShowAuth(false)} onLogin={u=>{setUser(u);fire(`✨ 환영해요, ${u.name}님!`);}}/>}

      {toast&&<div style={{position:"fixed",bottom:76,left:"50%",transform:"translateX(-50%)",background:"linear-gradient(135deg,#FF7043,#FFB347)",color:"#fff",borderRadius:20,padding:"10px 22px",fontSize:13,fontWeight:900,zIndex:800,whiteSpace:"nowrap",pointerEvents:"none",animation:"toastIn .3s cubic-bezier(0.34,1.56,0.64,1)",boxShadow:"0 8px 24px rgba(255,112,67,0.4)"}}>{toast}</div>}

      <style>{`
        @keyframes float      { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
        @keyframes bounce     { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
        @keyframes bounceSoft { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-4px)} }
        @keyframes pulse      { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.6;transform:scale(0.95)} }
        @keyframes spin       { from{transform:rotate(0)} to{transform:rotate(360deg)} }
        @keyframes sheetUp    { from{opacity:0;transform:translateY(40px)} to{opacity:1;transform:translateY(0)} }
        @keyframes fadeUp     { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
        @keyframes fadeIn     { from{opacity:0;transform:scale(0.96)} to{opacity:1;transform:scale(1)} }
        @keyframes toastIn    { from{opacity:0;transform:translateX(-50%)translateY(10px)scale(0.9)} to{opacity:1;transform:translateX(-50%)translateY(0)scale(1)} }
        @keyframes heartBeat  { 0%,100%{transform:scale(1)} 14%{transform:scale(1.2)} 28%{transform:scale(1)} }
        @keyframes popIn      { 0%{opacity:0;transform:scale(0.7)} 70%{transform:scale(1.08)} 100%{opacity:1;transform:scale(1)} }
        @keyframes splashOut  { to{opacity:0;pointer-events:none} }
        @keyframes floatUp    { 0%{transform:translateY(0)rotate(0);opacity:.4} 100%{transform:translateY(-110vh)rotate(360deg);opacity:0} }
        @keyframes spinBounce { 0%{transform:scale(0)rotate(-180deg)} 70%{transform:scale(1.1)rotate(8deg)} 100%{transform:scale(1)rotate(0)} }
        @keyframes starTwinkle{ 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(0.85)} }
        @keyframes wobble     { 0%,100%{transform:rotate(-4deg)} 50%{transform:rotate(4deg)} }
        @keyframes slideInLeft{ from{opacity:0;transform:translateX(-16px)} to{opacity:1;transform:translateX(0)} }
        ::-webkit-scrollbar{display:none}
        .hscroll::-webkit-scrollbar{display:none}
        .hscroll{-webkit-overflow-scrolling:touch;overflow-x:scroll!important}
        *{-webkit-tap-highlight-color:transparent;box-sizing:border-box}
        input::placeholder{color:#C4A58A}
        button{font-family:inherit}
      `}</style>
    </div>
  );
}
