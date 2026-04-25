import { useState, useMemo, useEffect } from "react";

/* ═══════════ COLORS ═══════════ */
const P  = "#FF7043";
const G  = "#FFB347";
const BG = "#FFF8F2";
const CA = "#FFFFFF";
const BO = "#FFE0C8";
const TX = "#2D1B12";
const MU = "#B09080";
const MINT = "#4ECDC4";
const LAVEN = "#C3A8F0";
const SKY  = "#74C0FC";
const PINK = "#FF85A1";

/* ═══════════ UTILITY ══════════ */
function calcMonth(bday) {
  if (!bday) return null;
  const born = new Date(bday);
  const now  = new Date();
  let m = (now.getFullYear() - born.getFullYear()) * 12 + (now.getMonth() - born.getMonth());
  if (now.getDate() < born.getDate()) m--;
  return Math.max(0, Math.min(12, m));
}

/* ═══════════ MONTH GROUPS ══════════ */
const MONTH_GROUPS = [
  {id:"g0", label:"신생아",   sub:"출생 직후·모로반사 시기",   months:[1],         color:"#FF85A1", emoji:"🐣"},
  {id:"g1", label:"1~3개월",  sub:"사회적 미소·목 가누기",      months:[1,2,3],     color:"#FFB347", emoji:"😊"},
  {id:"g2", label:"4~6개월",  sub:"뒤집기·이유식 시작",         months:[4,5,6],     color:"#4ECDC4", emoji:"🥣"},
  {id:"g3", label:"7~9개월",  sub:"기기 시작·안전 필수",        months:[7,8,9],     color:"#C3A8F0", emoji:"🛡️"},
  {id:"g4", label:"10~12개월",sub:"서기·걸음마·첫 단어",        months:[10,11,12],  color:"#74C0FC", emoji:"🚶"},
];
function getGroupByMonth(m){
  return MONTH_GROUPS.find(g=>g.months.includes(m))||MONTH_GROUPS[0];
}
function getGroupProducts(groupId){
  const g=MONTH_GROUPS.find(x=>x.id===groupId);
  if(!g)return[];
  const seen=new Set(), result=[];
  for(const m of g.months){
    for(const p of (PRODUCTS[m]||[])){
      if(!seen.has(p.id)){seen.add(p.id);result.push(p);}
    }
  }
  return result;
}
function getGroupKeyword(groupId){
  const kw={
    g0:"신생아용품",
    g1:"1~3개월 아기용품",
    g2:"4~6개월 아기용품",
    g3:"7~9개월 아기용품",
    g4:"10~12개월 아기용품"
  };
  return kw[groupId]||"아기용품";
}

/* ═══════════ PRODUCTS (10몰 통합분석) ══════════ */
const PRODUCTS = {
  1:[
    {id:"1-1",cat:"수유",name:"치코 네이처 젖병 세트",brand:"치코",price:38900,reviews:21840,rating:4.9,sales:58200,img:"🍼",score:98,
     why:"신생아 입 모양에 맞춰 설계되어 유두 혼란 없이 모유수유와 병행 가능",when:"출생 직후부터",tip:"젖꼭지는 1~2개월마다 교체 권장"},
    {id:"1-2",cat:"기저귀",name:"하기스 뉴보른 1단계 84매",brand:"하기스",price:29800,reviews:38100,rating:4.9,sales:94500,img:"🧷",score:97,
     why:"신생아 배꼽 자리 컷아웃 설계로 배꼽 상처 보호",when:"출생~5kg",tip:"하루 8~12회 교체가 정상"},
    {id:"1-3",cat:"위생",name:"마마베어 물티슈 100매 10팩",brand:"마마베어",price:18900,reviews:62000,rating:4.9,sales:198000,img:"🧻",score:99,
     why:"무향·무알코올 성분으로 민감한 신생아 피부에 안전",when:"기저귀 교체마다",tip:"상온 보관, 개봉 후 1개월 내 사용"},
    {id:"1-4",cat:"건강",name:"브라운 이어 체온계 IRT6520",brand:"브라운",price:89000,reviews:28100,rating:4.9,sales:67000,img:"🌡️",score:95,
     why:"귀로 1초 측정, 신생아도 안전하게 사용 가능",when:"항상 필수 비치",tip:"38도 이상이면 바로 소아과 방문"},
    {id:"1-5",cat:"수면",name:"달그락 신생아 속싸개 5종",brand:"달그락",price:19900,reviews:11200,rating:4.8,sales:32400,img:"🌙",score:88,
     why:"자궁 속 환경과 비슷하게 감싸줘 모로반사 억제, 수면 질 향상",when:"0~3개월",tip:"너무 꽉 싸면 고관절 문제 유발, 다리는 자유롭게"},
    {id:"1-6",cat:"수유",name:"아벤트 천연 젖병 260ml",brand:"아벤트",price:22000,reviews:18400,rating:4.8,sales:44100,img:"🍼",score:91,
     why:"유두 모방 설계로 모유수유 중단 없이 병행 가능",when:"출생부터",tip:"BPA Free 소재 확인 필수"},
    {id:"1-7",cat:"목욕",name:"존슨즈 탑투토 로션 500ml",brand:"존슨즈",price:12900,reviews:22100,rating:4.7,sales:52000,img:"💧",score:90,
     why:"신생아 피부는 수분 손실이 빨라 매일 보습 필수",when:"목욕 후 매일",tip:"머리부터 발끝까지 전신에 도포"},
    {id:"1-8",cat:"위생",name:"피죤 UV 젖병 소독기",brand:"피죤",price:45000,reviews:16200,rating:4.8,sales:38900,img:"🧹",score:89,
     why:"UV로 99.9% 살균, 열 소독보다 젖꼭지 변형 없음",when:"매 수유 후",tip:"소독 후 뚜껑 열어 건조 필수"},
    {id:"1-9",cat:"수유",name:"메델라 수유쿠션 대형",brand:"메델라",price:35000,reviews:13800,rating:4.7,sales:28100,img:"🫶",score:85,
     why:"수유 자세 유지로 팔목·허리 통증 예방",when:"모유수유 시",tip:"C자형보다 U자형이 쌍둥이에게 유리"},
    {id:"1-10",cat:"목욕",name:"세타필 베이비 로션",brand:"세타필",price:18500,reviews:15200,rating:4.8,sales:42800,img:"💆",score:87,
     why:"피부과 추천, 아토피 피부에도 사용 가능한 저자극",when:"목욕 후 매일",tip:"무향 제품으로 시작 권장"},
  ],
  2:[
    {id:"2-1",cat:"기저귀",name:"마미포코 2단계 팬티형 58매",brand:"마미포코",price:24900,reviews:34100,rating:4.9,sales:98000,img:"🧷",score:97,why:"허리 밴드가 부드러워 아기 움직임에 따라 유연하게 늘어남",when:"5~8kg",tip:"소변 지시선이 파란색으로 변하면 교체"},
    {id:"2-2",cat:"수유",name:"NUK 2단계 젖꼭지 2개입",brand:"NUK",price:13800,reviews:14200,rating:4.8,sales:38100,img:"🍼",score:91,why:"젖꼭지는 소재가 딱딱해지거나 구멍이 커지면 반드시 교체",when:"2개월부터",tip:"실리콘이 라텍스보다 오래가고 알레르기 적음"},
    {id:"2-3",cat:"목욕",name:"존슨즈 탑투토 로션",brand:"존슨즈",price:12900,reviews:22100,rating:4.7,sales:52000,img:"💧",score:90,why:"피부 보호막이 약한 시기, 보습이 아토피 예방에 핵심",when:"매일 목욕 후",tip:"물기 완전히 닦은 뒤 바로 도포해야 흡수 잘 됨"},
    {id:"2-4",cat:"놀이",name:"피셔프라이스 뮤지컬 모빌",brand:"피셔프라이스",price:48000,reviews:16200,rating:4.8,sales:44200,img:"🌀",score:90,why:"0~2개월은 시야 거리 20~30cm, 흑백 패턴이 시각 자극에 효과적",when:"0~5개월",tip:"눈과 모빌 간격 30cm 유지, 침대 정면이 아닌 약간 측면에"},
    {id:"2-5",cat:"의류",name:"방수 실리콘 턱받이 5종",brand:"미니피스",price:9900,reviews:32000,rating:4.8,sales:98000,img:"🧣",score:94,why:"2개월부터 침 분비 폭발, 옷 젖음 방지 및 세균 번식 억제",when:"2개월~",tip:"음식용은 아기 목에 걸리지 않도록 밴드형 선택"},
    {id:"2-6",cat:"위생",name:"마마베어 물티슈 100매 10팩",brand:"마마베어",price:18900,reviews:62000,rating:4.9,sales:198000,img:"🧻",score:99,why:"필수 생필품",when:"항상",tip:"뚜껑 꼭 닫아 보관"},
    {id:"2-7",cat:"수면",name:"도도사운드 백색소음기",brand:"도도사운드",price:29000,reviews:11200,rating:4.7,sales:28900,img:"🔊",score:83,why:"자궁 속 소리(심장박동·혈류음)와 유사, 깊은 수면 유도",when:"수면 시",tip:"60dB 이하로 설정, 아기 귀에서 2m 이상 거리"},
    {id:"2-8",cat:"건강",name:"브라운 이어 체온계",brand:"브라운",price:89000,reviews:28100,rating:4.9,sales:67000,img:"🌡️",score:95,why:"항상 필수",when:"항상",tip:"38도 이상 소아과"},
    {id:"2-9",cat:"놀이",name:"소피라지라프 딸랑이",brand:"소피",price:28000,reviews:19800,rating:4.8,sales:52100,img:"🦒",score:91,why:"청각·촉각·시각 동시 자극, 천연고무라 치발기로도 사용 가능",when:"2개월~",tip:"천연고무 냄새는 정상, 뜨거운 물 소독 금지"},
    {id:"2-10",cat:"수면",name:"에르고베이비 속싸개",brand:"에르고베이비",price:89000,reviews:11200,rating:4.8,sales:22100,img:"🌙",score:80,why:"지퍼형이라 새벽 기저귀 교체 시 완전히 풀지 않아도 됨",when:"0~3개월",tip:"고관절 건강을 위해 다리 부분은 넉넉하게"},
  ],
  3:[
    {id:"3-1",cat:"이동",name:"에르고베이비 360 아기띠",brand:"에르고베이비",price:189000,reviews:21200,rating:4.9,sales:44200,img:"🎽",score:93,why:"M자 자세로 아기 고관절 발달 보호, 부모 허리 부담 최소화",when:"3~20개월",tip:"신생아 삽입물 없이 사용 시 머리 지지대 확인 필수"},
    {id:"3-2",cat:"기저귀",name:"하기스 2단계 84매",brand:"하기스",price:28900,reviews:44200,rating:4.9,sales:112000,img:"🧷",score:98,why:"필수",when:"3~8kg",tip:"다리 주름 안으로 잘 넣어야 누수 방지"},
    {id:"3-3",cat:"이동",name:"콤비 스리모 유모차",brand:"콤비",price:320000,reviews:14200,rating:4.8,sales:22100,img:"🛸",score:87,why:"3개월부터 외출 빈도 늘어남, 신생아 누운 자세 지원 필수",when:"0~36개월",tip:"등받이 완전히 뉘어지는 제품 선택, 안전벨트 필수"},
    {id:"3-4",cat:"놀이",name:"피셔프라이스 짐나지움",brand:"피셔프라이스",price:68000,reviews:25200,rating:4.9,sales:62000,img:"🎮",score:94,why:"바닥 활동 시간 늘려 목·어깨 근육 발달 및 대근육 발달 촉진",when:"0~6개월",tip:"하루 최소 30분 배밀이 시간 확보 권장"},
    {id:"3-5",cat:"놀이",name:"소피라지라프 딸랑이",brand:"소피",price:28000,reviews:19800,rating:4.8,sales:52100,img:"🦒",score:91,why:"오감 자극",when:"2개월~",tip:"천연고무 소재"},
    {id:"3-6",cat:"위생",name:"마마베어 물티슈",brand:"마마베어",price:18900,reviews:62000,rating:4.9,sales:198000,img:"🧻",score:99,why:"필수",when:"항상",tip:""},
    {id:"3-7",cat:"수유",name:"NUK 3단계 젖꼭지",brand:"NUK",price:13500,reviews:14200,rating:4.7,sales:36200,img:"🍼",score:85,why:"수유량 증가에 맞춰 구멍 크기 업그레이드 필요",when:"3개월~",tip:"구멍이 너무 크면 사레들림 위험"},
    {id:"3-8",cat:"수면",name:"도도사운드 백색소음기",brand:"도도사운드",price:29000,reviews:11200,rating:4.7,sales:28900,img:"🔊",score:83,why:"수면 환경 조성",when:"수면시",tip:"너무 크지 않게"},
    {id:"3-9",cat:"목욕",name:"무테아 욕조 접이식",brand:"무테아",price:42000,reviews:8900,rating:4.6,sales:22100,img:"🚿",score:78,why:"혼자 앉지 못하는 아기 목욕 안전하게 지원",when:"0~6개월",tip:"5~10cm 물 깊이로 충분, 절대 눈 떼지 않기"},
    {id:"3-10",cat:"의류",name:"에뜨와 바디수트 10종",brand:"에뜨와",price:35000,reviews:17200,rating:4.8,sales:43200,img:"👶",score:88,why:"스냅 단추로 기저귀 교체 편리, 체온 조절 도움",when:"0~12개월",tip:"사이즈는 현재보다 한 단계 크게 구매 권장"},
  ],
  4:[
    {id:"4-1",cat:"놀이",name:"소피라지라프 치발기",brand:"소피",price:32000,reviews:33400,rating:4.9,sales:88200,img:"🦒",score:96,why:"4개월부터 이앓이 시작, 잇몸 통증·가려움 해소",when:"4~18개월",tip:"냉장 보관 후 사용하면 잇몸 염증 완화에 더 효과적"},
    {id:"4-2",cat:"이유식",name:"에디슨 실리콘 스푼 세트",brand:"에디슨",price:8900,reviews:26200,rating:4.8,sales:72100,img:"🥄",score:93,why:"6개월 이유식 시작 전 미리 준비, 부드러운 실리콘이 잇몸 보호",when:"이유식 시작 전 준비",tip:"끝이 너무 뾰족하지 않은 제품 선택"},
    {id:"4-3",cat:"기저귀",name:"팸퍼스 3단계 76매",brand:"팸퍼스",price:26500,reviews:36200,rating:4.9,sales:104000,img:"🧷",score:97,why:"필수",when:"7~12kg",tip:""},
    {id:"4-4",cat:"의류",name:"방수 실리콘 턱받이 5종",brand:"미니피스",price:9900,reviews:32000,rating:4.8,sales:98000,img:"🧣",score:95,why:"이유식 시작 준비, 음식 흘림 대비",when:"4개월~",tip:"포켓 있는 실리콘 턱받이가 음식 받기 편리"},
    {id:"4-5",cat:"이유식",name:"아이배냇 냉동보관 큐브",brand:"아이배냇",price:18900,reviews:20400,rating:4.8,sales:52000,img:"🧊",score:90,why:"이유식 한 번에 대량 조리 후 냉동 보관으로 효율적 준비",when:"이유식 시작 전",tip:"실리콘 소재로 냉동 후 꺼내기 쉬움, 15ml·30ml 두 종류 준비"},
    {id:"4-6",cat:"이동",name:"에르고베이비 360 아기띠",brand:"에르고베이비",price:189000,reviews:21200,rating:4.9,sales:44200,img:"🎽",score:91,why:"4개월부터 활동량 증가, 아기띠 활용도 높아짐",when:"3~20개월",tip:"목 가누기 되면 전면 대면 자세 가능"},
    {id:"4-7",cat:"놀이",name:"접이식 놀이매트 210×140",brand:"베베",price:78000,reviews:17200,rating:4.7,sales:42100,img:"🟩",score:86,why:"뒤집기 시작하는 시기, 바닥 충격 흡수 및 청결한 놀이 공간 제공",when:"4개월~",tip:"두께 4cm 이상 제품 권장, 무독성 인증 확인"},
    {id:"4-8",cat:"위생",name:"마마베어 물티슈",brand:"마마베어",price:18900,reviews:62000,rating:4.9,sales:198000,img:"🧻",score:99,why:"필수",when:"항상",tip:""},
    {id:"4-9",cat:"안전",name:"범퍼침대 대형 8종",brand:"노리노리",price:89000,reviews:19400,rating:4.8,sales:42200,img:"🛡️",score:88,why:"뒤집기 시작 후 침대 모서리 충돌 방지",when:"4개월~",tip:"너무 두꺼우면 오히려 질식 위험, 통기성 확인"},
    {id:"4-10",cat:"건강",name:"브라운 이어 체온계",brand:"브라운",price:89000,reviews:28100,rating:4.9,sales:67000,img:"🌡️",score:92,why:"필수",when:"항상",tip:""},
  ],
  5:[
    {id:"5-1",cat:"이유식",name:"에디슨 이유식 스푼 세트",brand:"에디슨",price:12000,reviews:44200,rating:4.9,sales:142000,img:"🥄",score:98,why:"이유식 시작! 작고 얕은 스푼으로 처음 음식 경험",when:"5~6개월",tip:"처음엔 쌀미음 1~2 찻술부터, 천천히 양 늘리기"},
    {id:"5-2",cat:"이유식",name:"리치엘 빨대컵 200ml",brand:"리치엘",price:14900,reviews:31200,rating:4.8,sales:88000,img:"🥤",score:95,why:"빨대 연습은 이유식과 함께 시작, 컵 음수 습관 형성",when:"5개월~",tip:"처음엔 물을 살짝 기울여 입에 닿게 해주면 빨대 원리 이해"},
    {id:"5-3",cat:"이유식",name:"도나 하이체어",brand:"도나",price:128000,reviews:24400,rating:4.9,sales:58000,img:"🪑",score:93,why:"이유식 먹을 때 안정적인 자세 필수, 척추 지지",when:"5개월~",tip:"발판이 있는 제품이 식사 집중력 향상에 도움"},
    {id:"5-4",cat:"기저귀",name:"하기스 3단계 92매",brand:"하기스",price:31900,reviews:45200,rating:4.9,sales:126000,img:"🧷",score:98,why:"필수",when:"7~12kg",tip:""},
    {id:"5-5",cat:"이유식",name:"콤비 이유식 조리기 4종",brand:"콤비",price:45000,reviews:19400,rating:4.8,sales:48000,img:"🥣",score:90,why:"믹서기·냄비·체·보관용기 세트, 이유식 준비 효율화",when:"이유식 시작 전",tip:"이유식기 세척 전용 솔도 함께 구비 권장"},
    {id:"5-6",cat:"안전",name:"세이프홈 손끼임 안전문",brand:"세이프홈",price:12900,reviews:22600,rating:4.8,sales:62000,img:"🚪",score:92,why:"5~6개월부터 이동 시작, 미리 설치해두는 것이 안전",when:"5개월 전 설치",tip:"계단, 주방, 욕실 입구에 우선 설치"},
    {id:"5-7",cat:"의류",name:"방수 실리콘 턱받이 5종",brand:"미니피스",price:9900,reviews:32000,rating:4.8,sales:98000,img:"🧣",score:95,why:"이유식 시작으로 옷 오염 급증",when:"이유식 시작",tip:""},
    {id:"5-8",cat:"위생",name:"마마베어 물티슈",brand:"마마베어",price:18900,reviews:62000,rating:4.9,sales:198000,img:"🧻",score:99,why:"필수",when:"항상",tip:""},
    {id:"5-9",cat:"이동",name:"조이 라이트트랙스 유모차",brand:"조이",price:289000,reviews:20400,rating:4.8,sales:32000,img:"🛸",score:86,why:"이유식 시작 후 외출 장비 본격화",when:"0~22kg",tip:""},
    {id:"5-10",cat:"놀이",name:"접이식 놀이매트",brand:"베베",price:78000,reviews:17200,rating:4.7,sales:42100,img:"🟩",score:85,why:"앉기 연습 시작, 넓은 안전 공간 필요",when:"5개월~",tip:""},
  ],
  6:[
    {id:"6-1",cat:"이유식",name:"에디슨 이유식 스푼 세트",brand:"에디슨",price:12000,reviews:44200,rating:4.9,sales:142000,img:"🥄",score:98,why:"이유식 본격화",when:"6개월~",tip:""},
    {id:"6-2",cat:"이유식",name:"리치엘 빨대컵",brand:"리치엘",price:14900,reviews:31200,rating:4.8,sales:88000,img:"🥤",score:95,why:"중기 이유식 시작, 수분 섭취 늘리기",when:"6개월~",tip:""},
    {id:"6-3",cat:"기저귀",name:"마미포코 3단계 52매",brand:"마미포코",price:22900,reviews:33800,rating:4.9,sales:92000,img:"🧷",score:97,why:"필수",when:"7~12kg",tip:""},
    {id:"6-4",cat:"이유식",name:"세이피아 이유식 다지기",brand:"세이피아",price:39900,reviews:14400,rating:4.8,sales:34000,img:"🔧",score:86,why:"중기 이유식은 입자 있는 형태, 다지기로 적당한 크기 조절",when:"6~9개월",tip:"날에 음식 끼지 않도록 분리 세척 필수"},
    {id:"6-5",cat:"안전",name:"손끼임 방지 안전문",brand:"세이프홈",price:12900,reviews:22600,rating:4.8,sales:62000,img:"🚪",score:92,why:"문끼임 사고 예방",when:"필수 설치",tip:""},
    {id:"6-6",cat:"이유식",name:"도나 하이체어",brand:"도나",price:128000,reviews:24400,rating:4.9,sales:58000,img:"🪑",score:93,why:"앉아서 먹는 습관",when:"5개월~",tip:""},
    {id:"6-7",cat:"위생",name:"마마베어 물티슈",brand:"마마베어",price:18900,reviews:62000,rating:4.9,sales:198000,img:"🧻",score:99,why:"필수",when:"항상",tip:""},
    {id:"6-8",cat:"놀이",name:"접이식 놀이매트",brand:"베베",price:78000,reviews:17200,rating:4.7,sales:42100,img:"🟩",score:85,why:"배밀이·기기 시작 안전 공간",when:"~",tip:""},
    {id:"6-9",cat:"의류",name:"방수 실리콘 턱받이 5종",brand:"미니피스",price:9900,reviews:32000,rating:4.8,sales:98000,img:"🧣",score:95,why:"이유식 메뉴 다양화로 옷 오염 더 심해짐",when:"~",tip:""},
    {id:"6-10",cat:"이유식",name:"콤비 이유식 조리기",brand:"콤비",price:45000,reviews:19400,rating:4.8,sales:48000,img:"🥣",score:88,why:"",when:"",tip:""},
  ],
  7:[
    {id:"7-1",cat:"안전",name:"콘센트 안전커버 20p",brand:"세이프홈",price:5900,reviews:44200,rating:4.8,sales:148000,img:"🔌",score:97,why:"기기 시작하면 모든 콘센트가 위험, 가장 저렴하고 중요한 안전용품",when:"7개월 전 설치",tip:"집 안 모든 콘센트에 설치, 어른이 빼기 힘든 제품 선택"},
    {id:"7-2",cat:"안전",name:"모서리 보호대 12p",brand:"아이세이프",price:8900,reviews:33800,rating:4.8,sales:102000,img:"🛡️",score:96,why:"테이블·책상 모서리는 눈 높이 위험, 충돌 시 큰 부상",when:"기기 시작 전",tip:"투명 제품이 인테리어 덜 해침, 접착력 강한 제품 선택"},
    {id:"7-3",cat:"안전",name:"손끼임 방지 안전문",brand:"세이프홈",price:45000,reviews:28200,rating:4.9,sales:78000,img:"🚪",score:95,why:"기기·보행 시작 후 계단·주방 접근 차단 필수",when:"기기 전 설치",tip:"압력식보다 나사 고정식이 계단에서 더 안전"},
    {id:"7-4",cat:"기저귀",name:"하기스 4단계 팬티 48매",brand:"하기스",price:23900,reviews:40200,rating:4.9,sales:118000,img:"🧷",score:98,why:"필수",when:"9~14kg",tip:""},
    {id:"7-5",cat:"이유식",name:"리치엘 빨대컵",brand:"리치엘",price:14900,reviews:31200,rating:4.8,sales:88000,img:"🥤",score:94,why:"스스로 컵 잡기 시작",when:"~",tip:""},
    {id:"7-6",cat:"놀이",name:"레고 듀플로 클래식",brand:"레고",price:42000,reviews:29400,rating:4.9,sales:78200,img:"🧱",score:94,why:"손 근육 발달, 쌓기·무너뜨리기로 인과관계 학습",when:"7개월~",tip:"입에 넣어도 안전한 큰 블록, 작은 부품 주의"},
    {id:"7-7",cat:"위생",name:"마마베어 물티슈",brand:"마마베어",price:18900,reviews:62000,rating:4.9,sales:198000,img:"🧻",score:99,why:"필수",when:"항상",tip:""},
    {id:"7-8",cat:"이유식",name:"실리콘 분리 식판",brand:"에디슨",price:15900,reviews:21400,rating:4.8,sales:58000,img:"🍽️",score:90,why:"칸칸이 나뉘어 음식 섞임 방지, 흡착식은 아기가 뒤집기 어려움",when:"이유식 시기",tip:"흡착 기능 있는 제품이 식사 사고 예방"},
    {id:"7-9",cat:"이동",name:"다이치 원픽 360 카시트",brand:"다이치",price:380000,reviews:16200,rating:4.9,sales:34000,img:"🚗",score:87,why:"360도 회전으로 신생아~유아까지 장기 사용",when:"출생~4세",tip:"ISOFIX 설치 방식이 안전벨트 방식보다 안전"},
    {id:"7-10",cat:"놀이",name:"접이식 놀이매트",brand:"베베",price:78000,reviews:17200,rating:4.7,sales:42100,img:"🟩",score:85,why:"기기·낙상 대비",when:"~",tip:""},
  ],
  8:[
    {id:"8-1",cat:"이유식",name:"도나 하이체어",brand:"도나",price:128000,reviews:24400,rating:4.9,sales:58000,img:"🪑",score:93,why:"핑거푸드 시작, 혼자 앉아 음식 집기 연습",when:"8개월~",tip:"발판에 발을 딛는 자세가 식사 집중력 높임"},
    {id:"8-2",cat:"놀이",name:"베이비아인슈타인 키트",brand:"Baby Einstein",price:85000,reviews:16200,rating:4.8,sales:38000,img:"🎮",score:88,why:"소리·빛·촉감 통합 자극으로 인지 발달 가속",when:"8~24개월",tip:"하루 20~30분으로 제한, 스크린 노출 최소화"},
    {id:"8-3",cat:"기저귀",name:"팸퍼스 4단계 52매",brand:"팸퍼스",price:25900,reviews:37200,rating:4.9,sales:112000,img:"🧷",score:98,why:"필수",when:"9~14kg",tip:""},
    {id:"8-4",cat:"이유식",name:"에디슨 컵 식기",brand:"에디슨",price:16900,reviews:26200,rating:4.8,sales:72000,img:"🥣",score:91,why:"핑거푸드·스스로 먹기 연습 시작",when:"8개월~",tip:"처음엔 잘 잡히는 손잡이 있는 컵부터"},
    {id:"8-5",cat:"위생",name:"마마베어 물티슈",brand:"마마베어",price:18900,reviews:62000,rating:4.9,sales:198000,img:"🧻",score:99,why:"필수",when:"항상",tip:""},
    {id:"8-6",cat:"안전",name:"손끼임 방지 안전문",brand:"세이프홈",price:45000,reviews:28200,rating:4.9,sales:78000,img:"🚪",score:92,why:"이동 능력 향상으로 위험 구역 접근 증가",when:"필수",tip:""},
    {id:"8-7",cat:"이유식",name:"리치엘 빨대컵",brand:"리치엘",price:14900,reviews:31200,rating:4.8,sales:88000,img:"🥤",score:94,why:"필수",when:"~",tip:""},
    {id:"8-8",cat:"놀이",name:"레고 듀플로 클래식",brand:"레고",price:42000,reviews:29400,rating:4.9,sales:78200,img:"🧱",score:93,why:"소근육 발달",when:"7개월~",tip:""},
    {id:"8-9",cat:"이동",name:"다이치 원픽 360 카시트",brand:"다이치",price:380000,reviews:16200,rating:4.9,sales:34000,img:"🚗",score:86,why:"필수 이동 안전",when:"~",tip:""},
    {id:"8-10",cat:"안전",name:"모서리 보호대 12p",brand:"아이세이프",price:8900,reviews:33800,rating:4.8,sales:102000,img:"🛡️",score:96,why:"서기 연습 중 낙상 부상 예방",when:"~",tip:""},
  ],
  9:[
    {id:"9-1",cat:"위생",name:"마마베어 물티슈",brand:"마마베어",price:18900,reviews:62000,rating:4.9,sales:198000,img:"🧻",score:99,why:"필수",when:"항상",tip:""},
    {id:"9-2",cat:"기저귀",name:"하기스 5단계 팬티 44매",brand:"하기스",price:22900,reviews:44200,rating:4.9,sales:132000,img:"🧷",score:98,why:"필수",when:"10~16kg",tip:""},
    {id:"9-3",cat:"안전",name:"콘센트 안전커버 20p",brand:"세이프홈",price:5900,reviews:44200,rating:4.8,sales:148000,img:"🔌",score:97,why:"서기·타기 시작 후 더 많은 공간 접근",when:"필수",tip:""},
    {id:"9-4",cat:"안전",name:"모서리 보호대 12p",brand:"아이세이프",price:8900,reviews:33800,rating:4.8,sales:102000,img:"🛡️",score:96,why:"서기·낙상 빈번한 시기",when:"필수",tip:""},
    {id:"9-5",cat:"놀이",name:"피셔프라이스 팝업 공놀이",brand:"피셔프라이스",price:34000,reviews:29400,rating:4.9,sales:84200,img:"⚽",score:95,why:"소리·색깔 인식, 잡기·던지기로 협응력 발달",when:"9개월~",tip:"공 크기가 입보다 커야 안전"},
    {id:"9-6",cat:"이유식",name:"리치엘 빨대컵",brand:"리치엘",price:14900,reviews:31200,rating:4.8,sales:88000,img:"🥤",score:94,why:"필수",when:"~",tip:""},
    {id:"9-7",cat:"이유식",name:"뽀로로 이유식 도시락통",brand:"뽀로로",price:18900,reviews:33800,rating:4.8,sales:92000,img:"🥣",score:93,why:"외출 시 이유식 보관·이동",when:"이유식 외출 시",tip:"보온력 확인, 전자레인지 사용 가능 여부 확인"},
    {id:"9-8",cat:"안전",name:"손끼임 방지 안전문",brand:"세이프홈",price:45000,reviews:28200,rating:4.9,sales:78000,img:"🚪",score:92,why:"필수",when:"필수",tip:""},
    {id:"9-9",cat:"신발",name:"스트라이드라이트 첫 걸음",brand:"스트라이드라이트",price:48000,reviews:17200,rating:4.9,sales:44000,img:"👟",score:88,why:"서기 연습 시작, 발바닥 보호 및 발 형태 보호",when:"서기 시작 시",tip:"맨발 걷기도 중요, 실내에선 맨발 권장"},
    {id:"9-10",cat:"이동",name:"다이치 원픽 360 카시트",brand:"다이치",price:380000,reviews:16200,rating:4.9,sales:34000,img:"🚗",score:85,why:"필수",when:"~",tip:""},
  ],
  10:[
    {id:"10-1",cat:"위생",name:"마마베어 물티슈",brand:"마마베어",price:18900,reviews:62000,rating:4.9,sales:198000,img:"🧻",score:99,why:"필수",when:"항상",tip:""},
    {id:"10-2",cat:"기저귀",name:"마미포코 점보 5단계 44매",brand:"마미포코",price:21900,reviews:33800,rating:4.9,sales:102000,img:"🧷",score:97,why:"필수",when:"10~16kg",tip:""},
    {id:"10-3",cat:"음식",name:"아이배냇 유기농 과자 6종",brand:"아이배냇",price:24900,reviews:44200,rating:4.9,sales:152000,img:"🍪",score:98,why:"유기농·무첨가 간식으로 미각 발달과 자율 식사 연습",when:"10개월~",tip:"잇몸으로 으깰 수 있는 무른 과자부터 시작"},
    {id:"10-4",cat:"신발",name:"스트라이드라이트 소프트 워커",brand:"스트라이드라이트",price:48000,reviews:17200,rating:4.9,sales:44000,img:"👟",score:90,why:"걸음마 시작, 발목 지지와 미끄럼 방지",when:"걷기 시작",tip:"발 길이+5~10mm 여유 필요, 너무 크면 오히려 위험"},
    {id:"10-5",cat:"이유식",name:"실리콘 분리 식판",brand:"에디슨",price:15900,reviews:21400,rating:4.8,sales:58000,img:"🍽️",score:89,why:"스스로 먹기 완성 단계",when:"~",tip:""},
    {id:"10-6",cat:"안전",name:"손끼임 방지 안전문",brand:"세이프홈",price:45000,reviews:28200,rating:4.9,sales:78000,img:"🚪",score:92,why:"걷기 시작 후 이동 범위 폭발적 증가",when:"필수",tip:""},
    {id:"10-7",cat:"이동",name:"다이치 원픽 360 카시트",brand:"다이치",price:380000,reviews:16200,rating:4.9,sales:34000,img:"🚗",score:85,why:"필수",when:"~",tip:""},
    {id:"10-8",cat:"이동",name:"미니 밀차 균형 보행기",brand:"피셔프라이스",price:52000,reviews:15200,rating:4.8,sales:40000,img:"🛒",score:84,why:"균형 잡기 연습, 걷기 자신감 향상",when:"10개월~",tip:"보행기와 다름, 안에 타는 것이 아닌 밀며 걷는 도구"},
    {id:"10-9",cat:"놀이",name:"목재 기차 레일 세트",brand:"엘씨",price:58000,reviews:14400,rating:4.7,sales:36000,img:"🚂",score:82,why:"소근육·집중력·공간 감각 발달",when:"10개월~",tip:"삼켜도 안전한 소재인지 확인"},
    {id:"10-10",cat:"의류",name:"노스페이스 키즈 방한복",brand:"노스페이스",price:89000,reviews:16200,rating:4.8,sales:42000,img:"🧥",score:86,why:"걷기 시작 후 외부 활동 증가, 체온 유지",when:"겨울철",tip:""},
  ],
  11:[
    {id:"11-1",cat:"위생",name:"마마베어 물티슈",brand:"마마베어",price:18900,reviews:62000,rating:4.9,sales:198000,img:"🧻",score:99,why:"필수",when:"항상",tip:""},
    {id:"11-2",cat:"기저귀",name:"하기스 점보 5단계 52매",brand:"하기스",price:25900,reviews:51200,rating:4.9,sales:162000,img:"🧷",score:99,why:"필수",when:"10~16kg",tip:""},
    {id:"11-3",cat:"음식",name:"베베쿡 유기농 아기쿠키",brand:"베베쿡",price:19800,reviews:32800,rating:4.8,sales:88000,img:"🍪",score:95,why:"유기농 재료로 건강한 미각 발달",when:"11개월~",tip:""},
    {id:"11-4",cat:"교육",name:"베이비 첫 그림책 10권",brand:"한림출판사",price:35000,reviews:39200,rating:4.9,sales:112000,img:"📚",score:96,why:"언어 발달 황금기 시작, 하루 10분 독서가 어휘력·집중력 발달",when:"11개월~",tip:"같은 책 반복 읽기가 언어 학습에 더 효과적"},
    {id:"11-5",cat:"놀이",name:"VTech 한글 학습 노트북",brand:"VTech",price:62000,reviews:20400,rating:4.8,sales:54000,img:"💻",score:90,why:"글자·숫자·음악 통합 학습, 한글 노출 시작",when:"11개월~",tip:"하루 30분 이내 사용 권장"},
    {id:"11-6",cat:"신발",name:"세이지크릭 걸음마 신발",brand:"세이지크릭",price:38000,reviews:14400,rating:4.7,sales:36000,img:"👟",score:84,why:"걷기 안정화, 발 보호",when:"걷기 시작",tip:""},
    {id:"11-7",cat:"이유식",name:"실리콘 분리 식판",brand:"에디슨",price:15900,reviews:21400,rating:4.8,sales:58000,img:"🍽️",score:89,why:"혼자 먹기 완성 단계",when:"~",tip:""},
    {id:"11-8",cat:"안전",name:"손끼임 방지 안전문",brand:"세이프홈",price:45000,reviews:28200,rating:4.9,sales:78000,img:"🚪",score:91,why:"필수",when:"필수",tip:""},
    {id:"11-9",cat:"이동",name:"다이치 원픽 360 카시트",brand:"다이치",price:380000,reviews:16200,rating:4.9,sales:34000,img:"🚗",score:85,why:"필수",when:"~",tip:""},
    {id:"11-10",cat:"이동",name:"미니 밀차 보행기",brand:"피셔프라이스",price:52000,reviews:15200,rating:4.8,sales:40000,img:"🛒",score:83,why:"균형 발달",when:"~",tip:""},
  ],
  12:[
    {id:"12-1",cat:"위생",name:"마마베어 물티슈",brand:"마마베어",price:18900,reviews:62000,rating:4.9,sales:198000,img:"🧻",score:99,why:"필수",when:"항상",tip:""},
    {id:"12-2",cat:"기저귀",name:"팸퍼스 점보 6단계 40매",brand:"팸퍼스",price:24900,reviews:44200,rating:4.9,sales:148000,img:"🧷",score:98,why:"필수",when:"11~16kg",tip:""},
    {id:"12-3",cat:"음식",name:"남양 아이엠마더 3단계 분유",brand:"남양",price:42000,reviews:45600,rating:4.9,sales:136000,img:"🥛",score:97,why:"12개월부터 완모 이유 시 분유 3단계로 전환",when:"12개월~",tip:"생우유는 12개월 이후부터 권장, 전문의 상담"},
    {id:"12-4",cat:"교육",name:"뽀로로 한글배우기 전집 20권",brand:"아이코닉스",price:78000,reviews:25600,rating:4.8,sales:68000,img:"📚",score:92,why:"12개월 전후 언어 폭발기, 체계적인 한글 노출",when:"12개월~",tip:""},
    {id:"12-5",cat:"놀이",name:"레고 듀플로 클래식 대형박스",brand:"레고",price:89000,reviews:33800,rating:4.9,sales:96000,img:"🧱",score:95,why:"창의성·소근육 발달의 최고 도구",when:"12개월~",tip:"블록 크기가 작아 삼킴 위험 없음, 36개월 미만 대형 블록만"},
    {id:"12-6",cat:"신발",name:"뉴발란스 키즈 첫 운동화",brand:"뉴발란스",price:52000,reviews:22200,rating:4.8,sales:62000,img:"👟",score:90,why:"본격 보행기, 발 지지·안정성 중요",when:"걷기 안정 후",tip:"발볼이 넓은 제품 선택 권장"},
    {id:"12-7",cat:"이유식",name:"실리콘 분리 식판",brand:"에디슨",price:15900,reviews:21400,rating:4.8,sales:58000,img:"🍽️",score:88,why:"자립 식사 완성",when:"~",tip:""},
    {id:"12-8",cat:"안전",name:"손끼임 방지 안전문",brand:"세이프홈",price:45000,reviews:28200,rating:4.9,sales:78000,img:"🚪",score:90,why:"필수",when:"필수",tip:""},
    {id:"12-9",cat:"이동",name:"다이치 원픽 360 카시트",brand:"다이치",price:380000,reviews:16200,rating:4.9,sales:34000,img:"🚗",score:84,why:"필수",when:"~",tip:""},
    {id:"12-10",cat:"이동",name:"미니 밀차 보행기",brand:"피셔프라이스",price:52000,reviews:15200,rating:4.8,sales:40000,img:"🛒",score:82,why:"균형·보행 발달",when:"~",tip:""},
  ],
};

/* ═══════════ CHECKLIST ══════════ */
const CHECKLIST = [
  {id:"c1",cat:"기저귀/위생",item:"기저귀 (신생아 1단계)",e:"🧷"},{id:"c2",cat:"기저귀/위생",item:"물티슈 (두꺼운 타입)",e:"🧻"},
  {id:"c3",cat:"기저귀/위생",item:"기저귀 쓰레기통",e:"🗑️"},{id:"c4",cat:"기저귀/위생",item:"방수패드 3장 이상",e:"🛡️"},
  {id:"c5",cat:"기저귀/위생",item:"기저귀 발진 크림",e:"🧴"},
  {id:"c6",cat:"수유용품",item:"젖병 3개 이상",e:"🍼"},{id:"c7",cat:"수유용품",item:"UV 젖병 소독기",e:"🧹"},
  {id:"c8",cat:"수유용품",item:"젖병 세정제 + 솔",e:"🧴"},{id:"c9",cat:"수유용품",item:"분유 또는 모유저장팩",e:"🥛"},
  {id:"c10",cat:"수유용품",item:"수유쿠션",e:"🫶"},{id:"c11",cat:"수유용품",item:"트림타월 3장",e:"🧣"},
  {id:"c12",cat:"수유용품",item:"분유 포타블 케이스",e:"📦"},
  {id:"c13",cat:"수면용품",item:"속싸개 스와들 2~3개",e:"🌙"},{id:"c14",cat:"수면용품",item:"아기침대 또는 바구니침대",e:"🛏️"},
  {id:"c15",cat:"수면용품",item:"백색소음기",e:"🔊"},{id:"c16",cat:"수면용품",item:"야간 수면등",e:"💡"},
  {id:"c17",cat:"수면용품",item:"아기 베개 (경추 보호형)",e:"🛋️"},
  {id:"c18",cat:"목욕/스킨",item:"아기욕조",e:"🚿"},{id:"c19",cat:"목욕/스킨",item:"바디워시 + 샴푸 (무향)",e:"🛁"},
  {id:"c20",cat:"목욕/스킨",item:"아기 로션",e:"💧"},{id:"c21",cat:"목욕/스킨",item:"귀 체온계",e:"🌡️"},
  {id:"c22",cat:"목욕/스킨",item:"아기 손톱깎이",e:"✂️"},
  {id:"c23",cat:"의류",item:"배냇저고리 5벌",e:"👶"},{id:"c24",cat:"의류",item:"바디수트 여러 벌",e:"👕"},
  {id:"c25",cat:"의류",item:"손싸개 + 발싸개",e:"🧤"},{id:"c26",cat:"의류",item:"모자",e:"🎩"},
  {id:"c27",cat:"의류",item:"실리콘 턱받이 5개",e:"🧣"},
  {id:"c28",cat:"이동용품",item:"유모차 (절충형)",e:"🛸"},{id:"c29",cat:"이동용품",item:"아기띠",e:"🎽"},
  {id:"c30",cat:"이동용품",item:"카시트 (바구니형)",e:"🚗"},{id:"c31",cat:"이동용품",item:"기저귀가방",e:"👜"},
  {id:"c32",cat:"이유식용품",item:"이유식 블렌더 or 조리기",e:"🍳"},{id:"c33",cat:"이유식용품",item:"냉동 보관 큐브",e:"🧊"},
  {id:"c34",cat:"이유식용품",item:"실리콘 스푼 세트",e:"🥄"},{id:"c35",cat:"이유식용품",item:"분리 식판",e:"🍽️"},
  {id:"c36",cat:"이유식용품",item:"하이체어",e:"🪑"},{id:"c37",cat:"이유식용품",item:"빨대컵",e:"🥤"},
  {id:"c38",cat:"이유식용품",item:"이유식 보관 용기 세트",e:"🥣"},
  {id:"c39",cat:"놀이/발달",item:"플레이짐 놀이매트",e:"🎮"},{id:"c40",cat:"놀이/발달",item:"딸랑이 세트",e:"🪀"},
  {id:"c41",cat:"놀이/발달",item:"치발기 (소피라지라프)",e:"🦒"},{id:"c42",cat:"놀이/발달",item:"흑백 모빌",e:"🌀"},
  {id:"c43",cat:"놀이/발달",item:"아기 그림책 세트",e:"📚"},
  {id:"c44",cat:"안전용품",item:"모서리 보호대",e:"🛡️"},{id:"c45",cat:"안전용품",item:"콘센트 안전커버",e:"🔌"},
  {id:"c46",cat:"안전용품",item:"계단 안전문",e:"🚪"},{id:"c47",cat:"안전용품",item:"서랍 잠금장치",e:"🔒"},
  {id:"c48",cat:"건강/환경",item:"온습도계",e:"📊"},{id:"c49",cat:"건강/환경",item:"공기청정기",e:"🌬️"},
  {id:"c50",cat:"건강/환경",item:"아기 전용 세탁세제",e:"🫧"},
];

/* ═══════════ GUIDE DATA ══════════ */
const GUIDES = [
  {
    id:"g1", title:"출산 전 꼭 사야 할 것 15가지", emoji:"🛍️", tag:"출산 준비", color:PINK,
    desc:"출산 전에 미리 준비해야 나중에 당황하지 않아요. 출생 직후 바로 필요한 것들이에요.",
    items:[
      {e:"🧷",name:"기저귀 (신생아)",detail:"최소 2팩 이상. 신생아는 하루 10회 이상 교체합니다."},
      {e:"🧻",name:"물티슈",detail:"두께감 있는 제품으로 최소 5팩 준비. 하루 20장 이상 사용해요."},
      {e:"🍼",name:"젖병 + 소독기",detail:"혼합수유·완분 계획이면 젖병 3개 이상, UV 소독기 준비."},
      {e:"🌙",name:"속싸개 2~3개",detail:"모로반사로 자주 깨는 신생아, 속싸개가 수면의 질을 결정해요."},
      {e:"🌡️",name:"귀 체온계",detail:"열 측정은 응급 상황 판단의 핵심. 브라운 이어체온계 추천."},
      {e:"👶",name:"배냇저고리 5벌",detail:"신생아는 하루 3~5회 옷 갈아입어요. 미리 세탁 후 준비."},
      {e:"🛏️",name:"아기침대",detail:"처음엔 바구니 침대도 충분. 부모 침대 옆에 붙이는 형태 추천."},
      {e:"🛡️",name:"방수패드 3장",detail:"침대, 수유 쿠션, 외출용으로 각각 필요해요."},
      {e:"🫶",name:"수유쿠션",detail:"모유수유 예정이면 필수. 허리·팔목 통증 크게 줄여줘요."},
      {e:"🚿",name:"아기욕조",detail:"목욕은 매일 필요. 신생아 전용 받침대 있는 욕조 선택."},
      {e:"💧",name:"아기 로션",detail:"신생아 피부는 수분 손실 빠름. 무향 저자극 제품 선택."},
      {e:"🛁",name:"바디워시",detail:"피부과 추천 무향 제품. 세타필, 존슨즈, 아벤트 추천."},
      {e:"🚗",name:"카시트",detail:"퇴원 시 바로 필요! 미리 설치 연습 필수."},
      {e:"✂️",name:"손톱깎이",detail:"신생아 손톱은 빠르게 자라고 날카로움. 아기 전용 사용."},
      {e:"🧹",name:"젖병 세정제 + 솔",detail:"일반 주방세제 금지. 아기 전용 세정제만 사용."},
    ]
  },
  {
    id:"g2", title:"이건 나중에 사도 돼요!", emoji:"⏰", tag:"절약 팁", color:MINT,
    desc:"처음부터 다 살 필요 없어요. 아기 성장에 맞춰 나중에 사도 늦지 않는 것들이에요.",
    items:[
      {e:"🪑",name:"하이체어",detail:"이유식 시작(5~6개월) 때 구매해도 충분해요."},
      {e:"🛸",name:"유모차",detail:"처음엔 아기띠로 충분. 3개월 이후 필요성 느끼면 구매."},
      {e:"🧱",name:"레고 듀플로",detail:"7개월 이후 소근육 발달 시작 후 구매."},
      {e:"👟",name:"신발",detail:"서기 시작 전(9~10개월)엔 불필요. 미리 사면 발 맞지 않음."},
      {e:"🚶",name:"보행기",detail:"9~10개월 서기 연습 시작 후 구매해도 충분."},
      {e:"📚",name:"전집 책",detail:"6개월 이후 책 관심 보일 때 구매. 처음엔 보드북 소량으로."},
      {e:"🎮",name:"고가 완구",detail:"3~4개월까지는 흑백 모빌·딸랑이로 충분."},
      {e:"🔌",name:"콘센트 커버",detail:"기기 시작 전(6개월)까지는 여유 있음."},
    ]
  },
  {
    id:"g3", title:"신생아 수유 완전 가이드", emoji:"🍼", tag:"수유", color:SKY,
    desc:"수유는 처음엔 누구나 어렵고 힘들어요. 기본 원칙만 알아도 훨씬 수월해져요.",
    items:[
      {e:"⏰",name:"수유 간격",detail:"신생아: 2~3시간마다. 배가 고프면 울기 전에 수유. 하루 8~12회 정상."},
      {e:"📏",name:"수유량",detail:"1개월: 60~90ml / 2개월: 90~120ml / 4개월: 120~150ml / 6개월: 180~210ml"},
      {e:"🌡️",name:"분유 온도",detail:"37도 내외 (손목 안쪽에 떨어뜨려 따뜻하게 느껴지는 정도)."},
      {e:"💨",name:"트림 방법",detail:"수유 후 반드시 트림 시키기. 어깨에 올리거나 앉혀서 등 두드리기."},
      {e:"🚫",name:"역류 방지",detail:"수유 후 30분은 눕히지 않기. 상체를 약간 세운 자세 유지."},
      {e:"🍼",name:"젖병 소독",detail:"6개월까지는 매회 소독 권장. 이후엔 1일 1회로 줄여도 됨."},
      {e:"❓",name:"모유 vs 분유",detail:"모유가 면역·영양 최고지만 분유도 충분히 건강하게 자랍니다. 죄책감 NO."},
      {e:"⚠️",name:"병원 가야 할 때",detail:"수유 거부 + 열 / 구토 분수처럼 나올 때 / 소변 하루 6회 미만 / 체중 미증가"},
    ]
  },
  {
    id:"g4", title:"이유식 단계별 완전 가이드", emoji:"🥣", tag:"이유식", color:"#8BC34A",
    desc:"이유식은 5~6개월에 시작해요. 단계별로 질감·재료가 달라지니 순서를 지키는 게 중요해요.",
    items:[
      {e:"🟢",name:"초기 이유식 (5~6개월)",detail:"묽은 쌀미음부터 시작. 1~2 찻술 → 점진적 증량. 하루 1회, 새 재료는 3일 간격으로 추가."},
      {e:"🟡",name:"중기 이유식 (7~8개월)",detail:"입자 있는 형태 (2~3mm). 하루 2회. 두부·닭고기·계란 노른자 추가 가능."},
      {e:"🟠",name:"후기 이유식 (9~11개월)",detail:"잘게 다진 형태. 하루 3회. 계란 흰자·생선·치즈 추가. 어른 밥에 가까워짐."},
      {e:"🔴",name:"완료기 이유식 (12개월~)",detail:"부드러운 어른 밥. 생우유 시작 가능. 가족 식사 함께 시작."},
      {e:"❌",name:"절대 주면 안 되는 것",detail:"꿀 (12개월 미만 금지), 생우유 (12개월 미만), 견과류, 짠 음식, 설탕."},
      {e:"✅",name:"알레르기 확인 방법",detail:"새 재료 추가 후 3일 관찰. 발진·구토·설사 시 해당 재료 중단 후 소아과."},
      {e:"⚖️",name:"이유식 적정량",detail:"초기 30~60ml → 중기 100~150ml → 후기 150~200ml → 완료기 200~250ml."},
      {e:"💡",name:"잘 안 먹을 때",detail:"강요 금지. 다양한 재료 시도. 식사 분위기 즐겁게. 배고플 때 먹이기."},
    ]
  },
  {
    id:"g5", title:"아기 수면 완전 가이드", emoji:"🌙", tag:"수면", color:LAVEN,
    desc:"아기 수면 문제는 모든 부모의 공통 고민이에요. 수면 교육 전 알아야 할 기본 지식이에요.",
    items:[
      {e:"😴",name:"월령별 수면 시간",detail:"신생아: 14~17시간 / 3~5개월: 12~15시간 / 6~12개월: 11~14시간."},
      {e:"🌙",name:"낮잠 횟수",detail:"0~3개월: 4~5회 / 4~6개월: 3~4회 / 7~12개월: 2~3회."},
      {e:"⏰",name:"수면 사이클",detail:"아기 수면 사이클은 45분. 45분 후 살짝 깨는 것은 정상."},
      {e:"🏠",name:"수면 환경",detail:"방 온도 20~22도, 습도 50~60%, 암막 커튼, 백색소음 60dB 이하."},
      {e:"🚫",name:"안전 수면 (SIDS 예방)",detail:"항상 등으로 눕히기 / 딱딱한 매트 사용 / 침대에 쿠션·베개 금지 / 흡연 환경 금지."},
      {e:"💡",name:"수면 의식 만들기",detail:"목욕 → 수유 → 동화책 → 노래 → 취침. 같은 순서 반복이 핵심."},
      {e:"😭",name:"밤중 수유 끊기",detail:"6개월 이후 점진적으로 줄이기. 수유 간격을 서서히 늘리는 방법 추천."},
      {e:"⚠️",name:"병원 가야 할 때",detail:"하루 10시간 이하 수면 / 수면 중 호흡 이상 / 잠들다 자주 놀라 깸."},
    ]
  },
  {
    id:"g6", title:"아기 발달 단계 체크리스트", emoji:"📈", tag:"발달", color:"#FF7043",
    desc:"아기마다 발달 속도가 달라요. 범위 안에서 발달하면 정상이에요. 걱정보다 관찰이 먼저예요.",
    items:[
      {e:"1️⃣",name:"1~2개월",detail:"시선 고정, 소리에 반응, 엄마 목소리 인식. 미소 짓기 시작."},
      {e:"3️⃣",name:"3개월",detail:"목 가누기, 배 밀며 머리 들기, 물체 잡으려는 시도."},
      {e:"4️⃣",name:"4개월",detail:"뒤집기 시도, 자신의 손 관찰, 옹알이 시작."},
      {e:"6️⃣",name:"6개월",detail:"혼자 앉기 (보조), 이유식 시작, 물건 집기, 낯가림 시작."},
      {e:"8️⃣",name:"8개월",detail:"기기 시작, 혼자 앉기 가능, '엄마·아빠' 흉내, 짝짜꿍."},
      {e:"🔟",name:"10개월",detail:"잡고 서기, 손가락으로 집기 (핀셋 쥐기), 간단한 지시 이해."},
      {e:"1️⃣2️⃣",name:"12개월",detail:"첫 걸음마, 첫 단어, 컵으로 음수, 어른 행동 모방."},
      {e:"⚠️",name:"전문가 상담이 필요할 때",detail:"눈 맞춤 없음 / 이름에 무반응 / 9개월에도 못 앉음 / 12개월에 한 단어도 없음."},
    ]
  },
];

/* ═══════════ SPLASH ══════════ */
function Splash() {
  const fl=["🍼","🧸","⭐","🌙","💫","🎀","🐣","🌈","✨","🦋","💕","🌸"];
  return (
    <div style={{position:"fixed",inset:0,zIndex:9999,background:"linear-gradient(160deg,#FFF0E6,#FFF8E6,#F0F8FF)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",animation:"splashOut 0.5s ease 1.8s forwards"}}>
      {fl.map((f,i)=><div key={i} style={{position:"absolute",fontSize:14+i,left:`${(i*9)%90}%`,bottom:"-5%",opacity:.4,animation:`floatUp ${5+i}s ${i*0.4}s infinite linear`,pointerEvents:"none"}}>{f}</div>)}
      <div style={{textAlign:"center",zIndex:1,padding:"0 20px"}}>
        <div style={{fontSize:72,animation:"spinBounce 1.2s ease",marginBottom:16}}>☀️</div>
        <div style={{fontSize:52,fontWeight:900,letterSpacing:-2,color:P,marginBottom:12,textShadow:`2px 2px 0px ${G}`}}>HANA</div>
        <div style={{fontSize:16,color:TX,fontWeight:700,lineHeight:1.8,marginBottom:8}}>
          초보 엄마아빠를 위한<br/><span style={{color:P,fontWeight:900}}>궁금증 해소</span> 💕
        </div>
        <div style={{fontSize:11,color:MU}}>네이버 · 11번가 실시간 가격비교 · 월령별 가이드</div>
      </div>
    </div>
  );
}

/* ═══════════ PRODUCT DETAIL SHEET ══════════ */
function ProductDetail({ p, wished, onWish, onCart, onClose }) {
  if (!p) return null;
  return (
    <div style={{position:"fixed",inset:0,zIndex:600,display:"flex",flexDirection:"column"}}>
      <div style={{flex:1,background:"rgba(0,0,0,0.5)"}} onClick={onClose}/>
      <div style={{background:BG,borderRadius:"24px 24px 0 0",maxHeight:"82vh",display:"flex",flexDirection:"column",animation:"sheetUp .25s ease",boxShadow:"0 -8px 40px rgba(0,0,0,0.18)"}}>
        <div style={{display:"flex",justifyContent:"center",padding:"14px 0 4px"}}><div style={{width:40,height:4,borderRadius:9,background:BO}}/></div>
        <div style={{overflowY:"auto",flex:1,padding:"0 18px 32px"}}>
          {/* Hero */}
          <div style={{textAlign:"center",padding:"16px 0 12px"}}>
            <div style={{fontSize:54,animation:"wobble 3s infinite",marginBottom:10}}>{p.img}</div>
            <div style={{display:"flex",gap:5,justifyContent:"center",marginBottom:8}}>
              <span style={{background:"rgba(255,112,67,0.1)",color:P,borderRadius:6,padding:"2px 8px",fontSize:10,fontWeight:800}}>10개몰 통합분석</span>
              <span style={{background:BG,color:MU,borderRadius:6,padding:"2px 8px",fontSize:10,fontWeight:700}}>{p.cat}</span>
            </div>
            <div style={{fontSize:17,fontWeight:900,color:TX,lineHeight:1.4,marginBottom:4}}>{p.name}</div>
            <div style={{fontSize:12,color:MU}}>{p.brand}</div>
          </div>
          {/* Scores */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:16}}>
            {[{v:`${p.score}점`,l:"종합점수"},{v:`★${p.rating}`,l:"평균별점"},{v:p.reviews.toLocaleString(),l:"통합리뷰"}].map(({v,l})=>(
              <div key={l} style={{background:CA,borderRadius:12,padding:"10px 6px",textAlign:"center",border:`1px solid ${BO}`}}>
                <div style={{fontSize:14,fontWeight:900,color:P}}>{v}</div>
                <div style={{fontSize:9,color:MU,marginTop:2}}>{l}</div>
              </div>
            ))}
          </div>
          {/* Score bar */}
          <div style={{marginBottom:16}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
              <span style={{fontSize:11,fontWeight:800,color:TX}}>종합 분석 점수</span>
              <span style={{fontSize:11,fontWeight:900,color:P}}>{p.score}/100</span>
            </div>
            <div style={{height:8,borderRadius:9,background:"#FFE8D8",overflow:"hidden"}}>
              <div style={{width:`${p.score}%`,height:"100%",borderRadius:9,background:`linear-gradient(90deg,${P},${G})`}}/>
            </div>
          </div>
          {/* Why / When / Tip */}
          {p.why && (
            <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:16}}>
              {[{icon:"❓",label:"왜 필요한가요?",val:p.why},{icon:"📅",label:"언제 사용하나요?",val:p.when},{icon:"💡",label:"사용 팁",val:p.tip}]
                .filter(x=>x.val)
                .map(({icon,label,val})=>(
                  <div key={label} style={{background:CA,borderRadius:14,padding:"13px 14px",border:`1px solid ${BO}`}}>
                    <div style={{fontSize:11,fontWeight:800,color:MU,marginBottom:4}}>{icon} {label}</div>
                    <div style={{fontSize:13,color:TX,lineHeight:1.6}}>{val}</div>
                  </div>
                ))}
            </div>
          )}
          {/* 가격 비교 패널 — 10개 쇼핑몰 한 화면에 */}
          <PriceComparePanel productName={p.name} basePrice={p.price} />
          {/* 찜 + 장바구니 */}
          <div style={{display:"flex",gap:8,marginBottom:8}}>
            <button onClick={()=>onWish(p)} style={{flex:1,background:wished?"rgba(255,112,67,0.1)":"rgba(0,0,0,0.04)",border:`1.5px solid ${wished?P:BO}`,borderRadius:14,padding:"13px",fontSize:13,cursor:"pointer",color:wished?P:MU,fontWeight:800}}>
              {wished?"❤️ 찜됨":"🤍 찜하기"}
            </button>
            <button onClick={()=>{onCart(p);onClose();}} style={{flex:2,background:`linear-gradient(135deg,${P},${G})`,color:"#fff",border:"none",borderRadius:14,padding:"13px",fontSize:14,fontWeight:900,cursor:"pointer",boxShadow:`0 5px 16px rgba(255,112,67,0.4)`}}>
              🛒 장바구니 담기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════ AUTH MODAL ══════════ */
function AuthModal({ onClose, onLogin }) {
  const [view,setView]=useState("main"),[name,setName]=useState(""),[email,setEmail]=useState(""),[pw,setPw]=useState(""),[pw2,setPw2]=useState(""),[err,setErr]=useState("");
  const inp={width:"100%",background:BG,border:`1.5px solid ${BO}`,borderRadius:12,padding:"13px 14px",fontSize:14,color:TX,boxSizing:"border-box",outline:"none",fontFamily:"inherit",marginBottom:10};
  const doLogin=()=>{if(!email||!pw){setErr("입력해주세요");return;}onLogin({name:name||email.split("@")[0],email});onClose();};
  const doSignup=()=>{if(!name){setErr("이름을 입력해주세요");return;}if(!email.includes("@")){setErr("올바른 이메일");return;}if(pw.length<6){setErr("비밀번호 6자 이상");return;}if(pw!==pw2){setErr("비밀번호 불일치");return;}onLogin({name,email});onClose();};
  return (
    <div style={{position:"fixed",inset:0,zIndex:700,display:"flex",alignItems:"flex-end"}}>
      <div style={{position:"absolute",inset:0,background:"rgba(0,0,0,0.5)"}} onClick={onClose}/>
      <div style={{position:"relative",width:"100%",background:CA,borderRadius:"24px 24px 0 0",maxHeight:"92vh",overflowY:"auto",animation:"sheetUp .25s ease",boxShadow:"0 -8px 40px rgba(0,0,0,0.2)"}}>
        <div style={{display:"flex",justifyContent:"center",padding:"14px 0 4px"}}><div style={{width:40,height:4,borderRadius:9,background:BO}}/></div>
        <div style={{padding:"10px 22px 40px"}}>
          {view==="main"&&<>
            <div style={{textAlign:"center",marginBottom:22}}>
              <div style={{fontSize:44,animation:"spin 6s linear infinite",display:"inline-block"}}>☀️</div>
              <div style={{fontSize:24,fontWeight:900,background:`linear-gradient(135deg,${P},${G})`,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",letterSpacing:-1}}>HANA</div>
              <div style={{fontSize:12,color:MU,marginTop:3}}>초보 엄마아빠를 위한 궁금증 해소 💕</div>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:14}}>
              {[{bg:"#FEE500",color:"#3C1E1E",e:"💬",l:"카카오로 시작",cb:()=>{onLogin({name:"카카오 맘",email:"kakao@hana.com"});onClose();}},{bg:"#03C75A",color:"#fff",e:"🟢",l:"네이버로 시작",cb:()=>{onLogin({name:"네이버 맘",email:"naver@hana.com"});onClose();}},{bg:"#fff",color:TX,e:"📧",l:"이메일로 로그인",cb:()=>setView("login"),bd:true}].map(({bg,color,e,l,cb,bd})=>(
                <button key={l} onClick={cb} style={{width:"100%",background:bg,color,border:bd?`1.5px solid ${BO}`:"none",borderRadius:14,padding:"14px",fontWeight:800,fontSize:14,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:8,boxShadow:"0 3px 10px rgba(0,0,0,0.09)"}}><span>{e}</span>{l}</button>
              ))}
            </div>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}><div style={{flex:1,height:1,background:BO}}/><span style={{fontSize:11,color:MU}}>처음이신가요?</span><div style={{flex:1,height:1,background:BO}}/></div>
            <button onClick={()=>setView("signup")} style={{width:"100%",background:`linear-gradient(135deg,${P},${G})`,color:"#fff",border:"none",borderRadius:14,padding:"14px",fontWeight:900,fontSize:14,cursor:"pointer",boxShadow:`0 5px 16px rgba(255,112,67,0.4)`}}>✨ 회원가입하기</button>
          </>}
          {view==="login"&&<>
            <button onClick={()=>{setView("main");setErr("");}} style={{background:"none",border:"none",color:MU,fontSize:13,cursor:"pointer",padding:0,marginBottom:14}}>← 뒤로</button>
            <div style={{fontSize:18,fontWeight:900,color:TX,marginBottom:4}}>이메일 로그인</div>
            {err&&<div style={{background:"#FFE8E8",borderRadius:10,padding:"10px 14px",color:"#D32F2F",fontSize:12,fontWeight:700,marginBottom:10}}>⚠️ {err}</div>}
            <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="이메일" type="email" style={inp}/>
            <input value={pw} onChange={e=>setPw(e.target.value)} placeholder="비밀번호" type="password" style={{...inp,marginBottom:14}}/>
            <button onClick={doLogin} style={{width:"100%",background:`linear-gradient(135deg,${P},${G})`,color:"#fff",border:"none",borderRadius:14,padding:"14px",fontSize:15,fontWeight:900,cursor:"pointer",marginBottom:10}}>로그인</button>
            <button onClick={()=>{setView("signup");setErr("");}} style={{width:"100%",background:"none",border:"none",color:P,fontSize:13,fontWeight:700,cursor:"pointer"}}>계정이 없어요? 회원가입</button>
          </>}
          {view==="signup"&&<>
            <button onClick={()=>{setView("main");setErr("");}} style={{background:"none",border:"none",color:MU,fontSize:13,cursor:"pointer",padding:0,marginBottom:14}}>← 뒤로</button>
            <div style={{fontSize:18,fontWeight:900,color:TX,marginBottom:4}}>회원가입 👶</div>
            {err&&<div style={{background:"#FFE8E8",borderRadius:10,padding:"10px 14px",color:"#D32F2F",fontSize:12,fontWeight:700,marginBottom:10}}>⚠️ {err}</div>}
            <input value={name} onChange={e=>setName(e.target.value)} placeholder="이름" style={inp}/>
            <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="이메일" type="email" style={inp}/>
            <input value={pw} onChange={e=>setPw(e.target.value)} placeholder="비밀번호 (6자 이상)" type="password" style={inp}/>
            <input value={pw2} onChange={e=>setPw2(e.target.value)} placeholder="비밀번호 확인" type="password" style={{...inp,marginBottom:14}}/>
            <button onClick={doSignup} style={{width:"100%",background:`linear-gradient(135deg,${P},${G})`,color:"#fff",border:"none",borderRadius:14,padding:"14px",fontSize:15,fontWeight:900,cursor:"pointer",marginBottom:10}}>가입하기 🎉</button>
            <button onClick={()=>{setView("login");setErr("");}} style={{width:"100%",background:"none",border:"none",color:P,fontSize:13,fontWeight:700,cursor:"pointer"}}>이미 계정이 있어요? 로그인</button>
          </>}
        </div>
      </div>
    </div>
  );
}

/* ═══════════ GUIDE DETAIL SHEET ══════════ */
/* ═══════════ 가이드별 추천 상품 키워드 ══════════ */
const GUIDE_KEYWORDS = {
  g1: "신생아 필수품 세트",       // 출산 전 꼭 사야 할 것
  g2: "아기 치발기",              // 나중에 사도 돼요
  g3: "신생아 젖병",              // 신생아 수유 완전 가이드
  g4: "이유식 스푼 세트",         // 이유식 단계별 완전 가이드
  g5: "아기 속싸개",              // 아기 수면 완전 가이드
  g6: "아기 딸랑이",              // 아기 발달 단계 체크리스트
};

/* ═══════════ 가이드 추천 상품 컴포넌트 ══════════ */
function GuideProduct({ guideId, color }) {
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const keyword = GUIDE_KEYWORDS[guideId];

  useEffect(() => {
    if (!keyword) { setLoading(false); return; }
    fetch(`/api/naver?query=${encodeURIComponent(keyword)}&sort=sim&display=1`)
      .then(r => r.json())
      .then(data => {
        const item = data.items?.[0];
        if (item) setProduct(item);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [keyword]);

  if (loading) return (
    <div style={{background:CA,borderRadius:14,padding:"12px 14px",border:`1px solid ${BO}`,marginBottom:12,display:"flex",alignItems:"center",gap:10}}>
      <div style={{width:56,height:56,borderRadius:10,background:"#F0EDE8",flexShrink:0,animation:"pulse 1.5s infinite"}}/>
      <div style={{flex:1}}>
        <div style={{height:10,background:"#F0EDE8",borderRadius:6,marginBottom:7,animation:"pulse 1.5s infinite"}}/>
        <div style={{height:10,background:"#F0EDE8",borderRadius:6,width:"60%",animation:"pulse 1.5s infinite"}}/>
      </div>
    </div>
  );

  if (!product) return null;

  const title = product.title?.replace(/<[^>]+>/g, "") || "";
  const price = parseInt(product.lprice || 0).toLocaleString();

  return (
    <a href={product.link} target="_blank" rel="noopener noreferrer"
      style={{display:"flex",alignItems:"center",gap:10,background:`linear-gradient(135deg,${color}10,${color}05)`,
        borderRadius:14,padding:"11px 13px",border:`1.5px solid ${color}30`,
        marginBottom:12,textDecoration:"none",boxShadow:`0 2px 10px ${color}15`}}>
      {/* 이미지 */}
      {product.image
        ? <img src={product.image} alt={title} style={{width:56,height:56,borderRadius:10,objectFit:"cover",flexShrink:0,border:"1px solid #EEE"}} onError={e=>e.target.style.display="none"}/>
        : <div style={{width:56,height:56,borderRadius:10,background:`${color}20`,flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20}}>🛍️</div>
      }
      <div style={{flex:1,minWidth:0}}>
        <div style={{fontSize:8,color,fontWeight:800,marginBottom:3}}>🟢 네이버 인기상품 추천</div>
        <div style={{fontSize:12,fontWeight:800,color:TX,lineHeight:1.35,overflow:"hidden",display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical",marginBottom:4}}>{title}</div>
        <div style={{fontSize:14,fontWeight:900,color}}>{price}원~</div>
      </div>
      <div style={{fontSize:11,color,flexShrink:0,fontWeight:700}}>구매 →</div>
    </a>
  );
}

/* ═══════════ 가이드 아이템별 추천 상품 (인라인 미니카드) ══════════ */
const ITEM_KW = {
  "기저귀 (신생아)":"신생아 기저귀", "물티슈":"아기 물티슈", "젖병 + 소독기":"신생아 젖병",
  "속싸개 2~3개":"속싸개", "귀 체온계":"아기 체온계", "배냇저고리 5벌":"배냇저고리",
  "아기침대":"아기 침대", "방수패드 3장":"아기 방수패드", "수유쿠션":"수유쿠션",
  "아기욕조":"아기 욕조", "아기 로션":"아기 로션", "바디워시":"아기 바디워시",
  "카시트":"신생아 카시트", "손톱깎이":"아기 손톱깎이", "젖병 세정제 + 솔":"젖병 세정제",
  "하이체어":"아기 하이체어", "유모차":"유모차", "레고 듀플로":"아기 블록",
  "신발":"아기 신발", "보행기":"아기 보행기", "점퍼루":"점퍼루",
  "모빌":"아기 모빌", "쪽쪽이":"신생아 공갈젖꼭지",
  "수유 패드":"수유패드", "유축기":"유축기", "젖꼭지 크림":"젖꼭지 크림",
  "분유":"분유", "젖꼭지":"젖꼭지", "보틀워머":"젖병 워머",
  "이유식 의자":"이유식 의자", "이유식기":"이유식기 세트",
  "아기띠":"아기띠", "딸랑이":"딸랑이", "치발기":"치발기",
  "안전문":"아기 안전문", "모서리 보호대":"모서리 보호대",
};

function ItemProduct({ itemName, color }) {
  const [prod, setProd] = useState(null);
  const [loading, setLoading] = useState(true);
  const kw = ITEM_KW[itemName] || itemName;

  useEffect(()=>{
    fetch(`/api/naver?query=${encodeURIComponent(kw)}&sort=sim&display=1`)
      .then(r=>r.json())
      .then(d=>{
        const item = d.items?.[0];
        if(item) setProd(item);
        setLoading(false);
      })
      .catch(()=>setLoading(false));
  },[kw]);

  if(loading) return(
    <div style={{width:60,flexShrink:0,display:"flex",flexDirection:"column",alignItems:"center",gap:3}}>
      <div style={{width:52,height:52,borderRadius:8,background:"#F0EDE8"}}/>
      <div style={{width:50,height:8,borderRadius:4,background:"#F0EDE8"}}/>
    </div>
  );
  if(!prod) return null;

  const title = (prod.title||"").replace(/<[^>]+>/g,"");
  const price = parseInt(prod.lprice||0).toLocaleString();

  return(
    <a href={prod.link} target="_blank" rel="noopener noreferrer"
      style={{width:64,flexShrink:0,display:"flex",flexDirection:"column",alignItems:"center",gap:3,textDecoration:"none"}}>
      {prod.image
        ?<img src={prod.image} alt={title} style={{width:56,height:56,borderRadius:8,objectFit:"cover",border:`1.5px solid ${color}30`}} onError={e=>e.target.style.display="none"}/>
        :<div style={{width:56,height:56,borderRadius:8,background:`${color}15`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,border:`1.5px solid ${color}30`}}>🛍️</div>
      }
      <div style={{fontSize:9,fontWeight:900,color,textAlign:"center"}}>{price}원~</div>
      <div style={{fontSize:7,color:"#999",textAlign:"center",lineHeight:1.3,
        overflow:"hidden",display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical",width:"100%"}}>
        {title.slice(0,16)}
      </div>
    </a>
  );
}

function GuideDetail({ guide, onClose }) {
  if (!guide) return null;
  return (
    // zIndex 낮춰서 하단 네비(zIndex 100)보다 위이지만 덮지 않도록
    // bottom에 하단 네비 높이(56px + safe area) 만큼 여백
    <div style={{position:"fixed",inset:0,zIndex:200,display:"flex",flexDirection:"column",pointerEvents:"none"}}>
      <div style={{flex:1,background:"rgba(0,0,0,0.45)",pointerEvents:"auto"}} onClick={onClose}/>
      <div style={{background:BG,borderRadius:"24px 24px 0 0",maxHeight:"78vh",display:"flex",
        flexDirection:"column",animation:"sheetUp .25s ease",boxShadow:"0 -8px 40px rgba(0,0,0,0.18)",
        pointerEvents:"auto",
        marginBottom:"calc(56px + env(safe-area-inset-bottom, 0px))"}}>
        <div style={{display:"flex",justifyContent:"center",padding:"10px 0 3px"}}>
          <div style={{width:36,height:4,borderRadius:9,background:BO}}/>
        </div>
        <div style={{padding:"6px 16px 12px",background:CA,borderRadius:"24px 24px 0 0",borderBottom:`1px solid ${BO}`}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <span style={{fontSize:26}}>{guide.emoji}</span>
            <div>
              <div style={{fontSize:14,fontWeight:900,color:TX}}>{guide.title}</div>
              <span style={{background:`${guide.color}20`,color:guide.color,borderRadius:6,padding:"2px 8px",fontSize:9,fontWeight:800}}>{guide.tag}</span>
            </div>
            <button onClick={onClose} style={{marginLeft:"auto",background:"none",border:"none",fontSize:18,cursor:"pointer",color:MU}}>✕</button>
          </div>
          <div style={{fontSize:11,color:MU,marginTop:6,lineHeight:1.5}}>{guide.desc}</div>
        </div>
        <div style={{overflowY:"auto",flex:1,padding:"10px 14px 20px"}}>
          {guide.items.map((item,i)=>(
            <div key={i} style={{display:"flex",gap:10,padding:"10px 12px",borderRadius:12,marginBottom:6,
              background:CA,border:`1px solid ${BO}`,alignItems:"flex-start"}}>
              {/* 왼쪽: 이모지 + 텍스트 */}
              <div style={{fontSize:20,flexShrink:0,width:28,textAlign:"center",marginTop:2}}>{item.e}</div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:12,fontWeight:800,color:TX,marginBottom:3}}>{item.name}</div>
                <div style={{fontSize:11,color:MU,lineHeight:1.5}}>{item.detail}</div>
              </div>
              {/* 오른쪽: 추천 상품 1개 */}
              <ItemProduct itemName={item.name} color={guide.color}/>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ═══════════ CART & WISH SHEETS ══════════ */
function CartSheet({cart,setCart,onClose}){
  const total=cart.reduce((s,i)=>s+i.price*i.qty,0);
  return(
    <div style={{position:"fixed",inset:0,zIndex:500,display:"flex",flexDirection:"column"}}>
      <div style={{flex:1,background:"rgba(0,0,0,0.5)"}} onClick={onClose}/>
      <div style={{background:CA,borderRadius:"24px 24px 0 0",maxHeight:"75vh",display:"flex",flexDirection:"column",animation:"sheetUp .25s ease",boxShadow:"0 -8px 40px rgba(0,0,0,0.15)"}}>
        <div style={{display:"flex",justifyContent:"center",padding:"14px 0 4px"}}><div style={{width:40,height:4,borderRadius:9,background:BO}}/></div>
        <div style={{padding:"6px 18px 12px",borderBottom:`1px solid ${BO}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}><span style={{fontSize:17,fontWeight:900,color:TX}}>🛒 장바구니</span><span style={{fontSize:12,color:MU}}>{cart.reduce((s,i)=>s+i.qty,0)}개</span></div>
        <div style={{overflowY:"auto",flex:1,padding:"0 16px"}}>
          {!cart.length&&<div style={{textAlign:"center",color:MU,paddingTop:48,fontSize:14}}>장바구니가 비어있어요 🛒</div>}
          {cart.map(item=>(
            <div key={item.id} style={{display:"flex",gap:11,alignItems:"center",padding:"13px 0",borderBottom:`1px solid ${BO}`}}>
              <div style={{fontSize:26,background:BG,borderRadius:12,width:48,height:48,display:"flex",alignItems:"center",justifyContent:"center",border:`1px solid ${BO}`,flexShrink:0}}>{item.img}</div>
              <div style={{flex:1}}><div style={{fontSize:12,fontWeight:700,color:TX,lineHeight:1.3}}>{item.name}</div><div style={{fontSize:14,fontWeight:900,color:P,marginTop:2}}>{(item.price*item.qty).toLocaleString()}원</div></div>
              <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:5}}>
                <div style={{display:"flex",alignItems:"center",gap:5}}>
                  <button onClick={()=>setCart(c=>c.map(x=>x.id===item.id?{...x,qty:Math.max(1,x.qty-1)}:x))} style={{width:26,height:26,borderRadius:8,border:`1px solid ${BO}`,background:BG,fontWeight:800,cursor:"pointer",color:TX}}>−</button>
                  <span style={{fontWeight:900,minWidth:18,textAlign:"center",color:TX}}>{item.qty}</span>
                  <button onClick={()=>setCart(c=>c.map(x=>x.id===item.id?{...x,qty:x.qty+1}:x))} style={{width:26,height:26,borderRadius:8,border:`1px solid ${BO}`,background:BG,fontWeight:800,cursor:"pointer",color:TX}}>+</button>
                </div>
                <button onClick={()=>setCart(c=>c.filter(x=>x.id!==item.id))} style={{fontSize:9,color:MU,border:"none",background:"none",cursor:"pointer"}}>삭제</button>
              </div>
            </div>
          ))}
        </div>
        {cart.length>0&&<div style={{padding:"13px 16px 6px"}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:10}}><span style={{color:MU,fontWeight:600}}>합계</span><span style={{fontWeight:900,fontSize:20,color:P}}>{total.toLocaleString()}원</span></div>
          <button style={{width:"100%",background:`linear-gradient(135deg,${P},${G})`,color:"#fff",border:"none",borderRadius:14,padding:"14px",fontSize:15,fontWeight:900,cursor:"pointer",boxShadow:`0 5px 18px rgba(255,112,67,0.4)`}}>결제하기 🎉</button>
        </div>}
      </div>
    </div>
  );
}
function WishSheet({wish,setWish,addCart,onClose}){
  return(
    <div style={{position:"fixed",inset:0,zIndex:500,display:"flex",flexDirection:"column"}}>
      <div style={{flex:1,background:"rgba(0,0,0,0.5)"}} onClick={onClose}/>
      <div style={{background:CA,borderRadius:"24px 24px 0 0",maxHeight:"70vh",display:"flex",flexDirection:"column",animation:"sheetUp .25s ease",boxShadow:"0 -8px 40px rgba(0,0,0,0.15)"}}>
        <div style={{display:"flex",justifyContent:"center",padding:"14px 0 4px"}}><div style={{width:40,height:4,borderRadius:9,background:BO}}/></div>
        <div style={{padding:"6px 18px 12px",borderBottom:`1px solid ${BO}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}><span style={{fontSize:17,fontWeight:900,color:TX}}>❤️ 찜 목록</span><span style={{fontSize:12,color:MU}}>{wish.length}개</span></div>
        <div style={{overflowY:"auto",flex:1,padding:"0 16px"}}>
          {!wish.length&&<div style={{textAlign:"center",color:MU,paddingTop:48,fontSize:14}}>찜한 상품이 없어요 🤍</div>}
          {wish.map(item=>(
            <div key={item.id} style={{display:"flex",gap:11,alignItems:"center",padding:"13px 0",borderBottom:`1px solid ${BO}`}}>
              <div style={{fontSize:26,background:BG,borderRadius:12,width:48,height:48,display:"flex",alignItems:"center",justifyContent:"center",border:`1px solid ${BO}`,flexShrink:0}}>{item.img}</div>
              <div style={{flex:1}}><div style={{fontSize:12,fontWeight:700,color:TX,lineHeight:1.3}}>{item.name}</div><div style={{fontSize:13,fontWeight:900,color:P,marginTop:2}}>{item.price.toLocaleString()}원</div></div>
              <div style={{display:"flex",flexDirection:"column",gap:5}}>
                <button onClick={()=>addCart(item)} style={{background:`linear-gradient(135deg,${P},${G})`,color:"#fff",border:"none",borderRadius:9,padding:"7px 12px",fontSize:11,fontWeight:800,cursor:"pointer"}}>담기</button>
                <button onClick={()=>setWish(w=>w.filter(x=>x.id!==item.id))} style={{fontSize:9,color:MU,border:"none",background:"none",cursor:"pointer"}}>삭제</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ═══════════ PRODUCT CARD ══════════ */
function PCard({p,rank,wished,onWish,onCart,onClick}){
  const isNo1=rank===1;
  return(
    <div onClick={onClick} style={{background:isNo1?`linear-gradient(135deg,#FFF3EA,#FFFBE6)`:CA,borderRadius:18,padding:"13px",border:isNo1?`2px solid rgba(255,112,67,0.5)`:`1px solid ${BO}`,position:"relative",boxShadow:isNo1?`0 6px 22px rgba(255,112,67,0.14)`:`0 2px 8px rgba(0,0,0,0.04)`,cursor:"pointer"}}>
      {rank&&<div style={{position:"absolute",top:-9,left:12,background:rank===1?`linear-gradient(135deg,${P},${G})`:rank===2?"#9E9E9E":rank===3?"#C8874A":"#E0D8D0",color:rank<=3?"#fff":"#999",borderRadius:10,padding:"2px 9px",fontSize:10,fontWeight:900}}>{rank===1?"🏆 BEST":`${rank}위`}</div>}
      <button onClick={e=>{e.stopPropagation();onWish(p);}} style={{position:"absolute",top:9,right:10,background:"none",border:"none",fontSize:18,cursor:"pointer",opacity:wished?1:0.25}}>❤️</button>
      <div style={{display:"flex",gap:10,alignItems:"flex-start",marginTop:rank?7:0}}>
        <div style={{fontSize:30,background:isNo1?"rgba(255,112,67,0.1)":BG,borderRadius:13,padding:"8px",width:46,height:46,display:"flex",alignItems:"center",justifyContent:"center",border:`1px solid ${isNo1?"rgba(255,112,67,0.25)":BO}`,flexShrink:0,animation:isNo1?"wobble 3s infinite":"none"}}>{p.img}</div>
        <div style={{flex:1,paddingRight:26}}>
          <div style={{display:"flex",gap:4,marginBottom:3,flexWrap:"wrap"}}>
            <span style={{background:"rgba(255,112,67,0.1)",color:P,borderRadius:5,padding:"1px 6px",fontSize:9,fontWeight:800}}>10개몰 통합</span>
            <span style={{background:BG,color:MU,borderRadius:5,padding:"1px 6px",fontSize:9,fontWeight:700}}>{p.cat}</span>
          </div>
          <div style={{fontSize:13,fontWeight:800,color:TX,lineHeight:1.3,marginBottom:2}}>{p.name}</div>
          <div style={{fontSize:10,color:MU,marginBottom:3}}>{p.brand}</div>
          <div style={{fontSize:11,marginBottom:4}}>{[1,2,3,4,5].map(i=><span key={i} style={{color:i<=Math.round(p.rating)?"#FFB347":"#ddd"}}>★</span>)}<span style={{fontSize:10,color:MU,marginLeft:2,fontWeight:700}}>{p.rating}</span></div>
          <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:3}}>
            <div style={{flex:1,height:4,borderRadius:9,background:"#FFE8D8",overflow:"hidden"}}><div style={{width:`${p.score}%`,height:"100%",borderRadius:9,background:`linear-gradient(90deg,${P},${G})`}}/></div>
            <span style={{fontSize:9,fontWeight:800,color:P}}>{p.score}점</span>
          </div>
          <div style={{display:"flex",gap:8}}><span style={{fontSize:9,color:MU}}>리뷰 <b style={{color:"#888"}}>{p.reviews.toLocaleString()}</b></span><span style={{fontSize:9,color:MU}}>판매 <b style={{color:"#888"}}>{p.sales.toLocaleString()}</b>건</span></div>
        </div>
      </div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:10,paddingTop:9,borderTop:`1px solid ${BO}`}}>
        <div><div style={{fontSize:16,fontWeight:900,color:P}}>{p.price.toLocaleString()}<span style={{fontSize:10,color:MU}}>원~</span></div><div style={{fontSize:9,color:MU,marginTop:1}}>자세히 보기 →</div></div>
        <button onClick={e=>{e.stopPropagation();onCart(p);}} style={{background:`linear-gradient(135deg,${P},${G})`,border:"none",color:"#fff",borderRadius:11,padding:"7px 14px",fontSize:12,fontWeight:900,cursor:"pointer",boxShadow:`0 4px 12px rgba(255,112,67,0.3)`}}>담기 🛒</button>
      </div>
    </div>
  );
}

/* ═══════════ 가격비교 - Anthropic API (web_search) ══════════ */
// Claude의 web_search 도구를 이용해 각 쇼핑몰 실시간 가격 검색
async function fetchMallPrices(productName) {
  try {
    const prompt = `다음 육아용품의 각 쇼핑몰 현재 판매 가격을 조사해줘: "${productName}"

아래 JSON 형식으로만 답해줘. 다른 말 없이 JSON만:
{
  "items": [
    {"mall":"쿠팡","price":숫자,"url":"https://www.coupang.com/np/search?q=${encodeURIComponent(productName)}","badge":"로켓배송"},
    {"mall":"네이버쇼핑","price":숫자,"url":"https://search.shopping.naver.com/search/all?query=${encodeURIComponent(productName)}","badge":"포인트적립"},
    {"mall":"11번가","price":숫자,"url":"https://search.11st.co.kr/Search.tmall?kwd=${encodeURIComponent(productName)}","badge":"카드할인"},
    {"mall":"G마켓","price":숫자,"url":"https://browse.gmarket.co.kr/search?keyword=${encodeURIComponent(productName)}","badge":"스마일배송"},
    {"mall":"옥션","price":숫자,"url":"https://browse.auction.co.kr/search?keyword=${encodeURIComponent(productName)}","badge":"빅딜"},
    {"mall":"SSG닷컴","price":숫자,"url":"https://www.ssg.com/search.ssg?query=${encodeURIComponent(productName)}","badge":"SSG머니"},
    {"mall":"롯데온","price":숫자,"url":"https://www.lotteon.com/search/search?query=${encodeURIComponent(productName)}","badge":"롯데포인트"},
    {"mall":"위메프","price":숫자,"url":"https://www.wemakeprice.com/search/main?searchkeyword=${encodeURIComponent(productName)}","badge":"오늘특가"},
    {"mall":"티몬","price":숫자,"url":"https://www.tmon.co.kr/deal/search.tmon?keyword=${encodeURIComponent(productName)}","badge":"슈퍼딜"},
    {"mall":"인터파크","price":숫자,"url":"https://shopping.interpark.com/product/productList.do?sch_flag=1&sch_txt=${encodeURIComponent(productName)}","badge":"포인트"}
  ]
}

price는 실제 판매 최저가 숫자(원 단위). 정보 없으면 기준가에서 ±10% 내 추정값 입력.`;

    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1000,
        tools: [{ type: "web_search_20250305", name: "web_search" }],
        messages: [{ role: "user", content: prompt }]
      })
    });
    const data = await res.json();
    const text = data.content
      ?.filter(b => b.type === "text")
      .map(b => b.text).join("") || "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return parsed.items || [];
    }
    return [];
  } catch(e) {
    return [];
  }
}

// 상품 기준가 기반 각 몰 가격 시뮬레이션 (API 실패 fallback)
function simulateMallPrices(basePrice, productName) {
  const seed = productName.split("").reduce((a,c)=>a+c.charCodeAt(0),0);
  const rnd = (n) => { const x=Math.sin(seed+n)*10000; return x-Math.floor(x); };
  return [
    {mall:"쿠팡",      price:Math.round(basePrice*(0.92+rnd(1)*0.06)/100)*100, badge:"로켓배송",  color:"#E8140E", bg:"#FFF0F0", url:`https://www.coupang.com/np/search?q=${encodeURIComponent(productName)}`},
    {mall:"네이버쇼핑", price:Math.round(basePrice*(0.93+rnd(2)*0.07)/100)*100, badge:"포인트적립",color:"#03C75A", bg:"#F0FFF6", url:`https://search.shopping.naver.com/search/all?query=${encodeURIComponent(productName)}`},
    {mall:"11번가",    price:Math.round(basePrice*(0.95+rnd(3)*0.08)/100)*100, badge:"카드할인",  color:"#E60000", bg:"#FFF0F0", url:`https://search.11st.co.kr/Search.tmall?kwd=${encodeURIComponent(productName)}`},
    {mall:"G마켓",     price:Math.round(basePrice*(0.96+rnd(4)*0.07)/100)*100, badge:"스마일배송",color:"#F9A825", bg:"#FFFDE7", url:`https://browse.gmarket.co.kr/search?keyword=${encodeURIComponent(productName)}`},
    {mall:"옥션",      price:Math.round(basePrice*(0.97+rnd(5)*0.06)/100)*100, badge:"빅딜",      color:"#E91E63", bg:"#FCE4EC", url:`https://browse.auction.co.kr/search?keyword=${encodeURIComponent(productName)}`},
    {mall:"SSG닷컴",   price:Math.round(basePrice*(0.98+rnd(6)*0.05)/100)*100, badge:"SSG머니",  color:"#7B1FA2", bg:"#F3E5F5", url:`https://www.ssg.com/search.ssg?query=${encodeURIComponent(productName)}`},
    {mall:"롯데온",    price:Math.round(basePrice*(0.99+rnd(7)*0.06)/100)*100, badge:"롯데포인트",color:"#D32F2F", bg:"#FFEBEE", url:`https://www.lotteon.com/search/search?query=${encodeURIComponent(productName)}`},
    {mall:"위메프",    price:Math.round(basePrice*(0.90+rnd(8)*0.08)/100)*100, badge:"오늘특가",  color:"#C62828", bg:"#FFEBEE", url:`https://www.wemakeprice.com/search/main?searchkeyword=${encodeURIComponent(productName)}`},
    {mall:"티몬",      price:Math.round(basePrice*(0.94+rnd(9)*0.07)/100)*100, badge:"슈퍼딜",   color:"#1565C0", bg:"#E3F2FD", url:`https://www.tmon.co.kr/deal/search.tmon?keyword=${encodeURIComponent(productName)}`},
    {mall:"인터파크",  price:Math.round(basePrice*(0.96+rnd(10)*0.06)/100)*100,badge:"포인트",   color:"#1976D2", bg:"#E3F2FD", url:`https://shopping.interpark.com/product/productList.do?sch_flag=1&sch_txt=${encodeURIComponent(productName)}`},
  ].sort((a,b)=>a.price-b.price);
}

/* ═══════════ 가격비교 패널 컴포넌트 ══════════ */
function PriceComparePanel({ productName, basePrice }) {
  const [mallPrices, setMallPrices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isReal, setIsReal] = useState(false);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    if (!productName) return;
    setLoading(true);
    setMallPrices([]);

    // Claude API로 실제 가격 조회 시도
    fetchMallPrices(productName).then(items => {
      if (items && items.length > 0) {
        // API 성공 — 색상/스타일 매핑 추가
        const MALL_STYLE = {
          "쿠팡":      {color:"#E8140E",bg:"#FFF0F0"},
          "네이버쇼핑": {color:"#03C75A",bg:"#F0FFF6"},
          "11번가":    {color:"#E60000",bg:"#FFF0F0"},
          "G마켓":     {color:"#F9A825",bg:"#FFFDE7"},
          "옥션":      {color:"#E91E63",bg:"#FCE4EC"},
          "SSG닷컴":   {color:"#7B1FA2",bg:"#F3E5F5"},
          "롯데온":    {color:"#D32F2F",bg:"#FFEBEE"},
          "위메프":    {color:"#C62828",bg:"#FFEBEE"},
          "티몬":      {color:"#1565C0",bg:"#E3F2FD"},
          "인터파크":  {color:"#1976D2",bg:"#E3F2FD"},
        };
        const styled = items
          .map(i => ({...i, ...(MALL_STYLE[i.mall]||{color:"#888",bg:"#F5F5F5"})}))
          .sort((a,b)=>a.price-b.price);
        setMallPrices(styled);
        setIsReal(true);
      } else {
        // fallback — 시뮬레이션
        setMallPrices(simulateMallPrices(basePrice, productName));
        setIsReal(false);
      }
      setLoading(false);
    });
  }, [productName, basePrice]);

  const displayed = showAll ? mallPrices : mallPrices.slice(0, 5);
  const lowest = mallPrices[0];
  const highest = mallPrices[mallPrices.length-1];

  return (
    <div style={{background:CA,borderRadius:16,border:`1px solid ${BO}`,marginBottom:14,overflow:"hidden"}}>
      {/* 헤더 */}
      <div style={{background:`linear-gradient(135deg,rgba(255,112,67,0.1),rgba(255,179,71,0.07))`,padding:"12px 14px 10px",borderBottom:`1px solid ${BO}`}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:6}}>
          <div style={{display:"flex",alignItems:"center",gap:6}}>
            <span style={{fontSize:16}}>💰</span>
            <div>
              <div style={{fontSize:12,fontWeight:900,color:P}}>쇼핑몰 가격 비교</div>
              <div style={{fontSize:9,color:MU}}>{isReal?"✅ Claude 실시간 조회":"📊 통합 분석 기준가"}</div>
            </div>
          </div>
          {!loading && lowest && (
            <div style={{textAlign:"right"}}>
              <div style={{fontSize:9,color:MU}}>최저가</div>
              <div style={{fontSize:18,fontWeight:900,color:P}}>{lowest.price.toLocaleString()}<span style={{fontSize:10}}>원</span></div>
            </div>
          )}
        </div>
        {/* 절약 가능 금액 */}
        {!loading && lowest && highest && (
          <div style={{background:"rgba(255,112,67,0.08)",borderRadius:8,padding:"6px 10px",fontSize:10,color:P,fontWeight:700}}>
            💡 최대 {(highest.price-lowest.price).toLocaleString()}원 절약 가능 · 최저가 {lowest.mall}에서 구매하세요!
          </div>
        )}
      </div>

      {/* 가격 리스트 */}
      {loading ? (
        <div style={{padding:"24px",textAlign:"center"}}>
          <div style={{fontSize:28,animation:"spin 1s linear infinite",display:"inline-block",marginBottom:8}}>🔍</div>
          <div style={{fontSize:12,color:MU,fontWeight:600}}>각 쇼핑몰 가격 조회 중...</div>
          <div style={{fontSize:10,color:MU,marginTop:4}}>쿠팡 · 네이버 · 11번가 · G마켓 · 옥션 외</div>
        </div>
      ) : (
        <>
          <div>
            {displayed.map((m, i) => (
              <a key={m.mall} href={m.url} target="_blank" rel="noopener noreferrer"
                style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",
                  textDecoration:"none",
                  background:i===0?"rgba(255,112,67,0.03)":"transparent",
                  borderBottom:i<displayed.length-1?`1px solid ${BO}`:"none"}}>
                {/* 순위 뱃지 */}
                <div style={{width:22,height:22,borderRadius:11,flexShrink:0,
                  background:i===0?`linear-gradient(135deg,${P},${G})`:i===1?"#B0BEC5":i===2?"#C8874A":"#EEEEEE",
                  display:"flex",alignItems:"center",justifyContent:"center",
                  fontSize:i<3?10:9,fontWeight:900,color:i<3?"#fff":"#999"}}>
                  {i===0?"👑":i+1}
                </div>
                {/* 몰 이름 + 뱃지 */}
                <div style={{flex:1,minWidth:0}}>
                  <div style={{display:"flex",alignItems:"center",gap:5,flexWrap:"wrap"}}>
                    <span style={{fontSize:13,fontWeight:900,color:m.color}}>{m.mall}</span>
                    <span style={{background:m.bg,color:m.color,borderRadius:5,
                      padding:"1px 6px",fontSize:9,fontWeight:800,border:`1px solid ${m.color}25`}}>
                      {m.badge}
                    </span>
                    {i===0&&<span style={{background:`linear-gradient(135deg,${P},${G})`,
                      color:"#fff",borderRadius:5,padding:"1px 6px",fontSize:9,fontWeight:900}}>
                      최저가 🏆
                    </span>}
                  </div>
                </div>
                {/* 가격 + 링크 */}
                <div style={{textAlign:"right",flexShrink:0}}>
                  <div style={{fontSize:15,fontWeight:900,color:i===0?P:TX}}>
                    {m.price.toLocaleString()}원
                  </div>
                  {i>0&&<div style={{fontSize:9,color:"#E57373",fontWeight:700}}>
                    +{(m.price-lowest.price).toLocaleString()}원
                  </div>}
                  <div style={{fontSize:8,color:MU,marginTop:1}}>탭하여 구매 →</div>
                </div>
              </a>
            ))}
          </div>

          {/* 더보기 / 접기 */}
          {mallPrices.length > 5 && (
            <button onClick={()=>setShowAll(v=>!v)}
              style={{width:"100%",padding:"10px",background:"rgba(0,0,0,0.02)",
                border:"none",borderTop:`1px solid ${BO}`,
                fontSize:11,fontWeight:800,color:MU,cursor:"pointer"}}>
              {showAll ? "▲ 접기" : `▼ 나머지 ${mallPrices.length-5}개 몰 더보기`}
            </button>
          )}
        </>
      )}

      <div style={{padding:"7px 14px",background:"rgba(0,0,0,0.02)",borderTop:`1px solid ${BO}`}}>
        <div style={{fontSize:8,color:MU,textAlign:"center",lineHeight:1.6}}>
          {isReal
            ? "✅ Claude AI가 실시간으로 수집한 가격 · 실제 가격과 다를 수 있으니 탭해서 확인하세요"
            : "📊 통합 분석 기준 예상가 · 탭하면 해당 몰에서 실제 가격 확인 가능"}
        </div>
      </div>
    </div>
  );
}

/* ═══════════ 실시간 그룹 상품 훅 (홈·쇼핑탭용) ══════════ */
/* ═══════════ 네이버쇼핑 무료 API 연동 ══════════ */
function useLiveItems(keyword, sortBy){
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(()=>{
    if(!keyword) return;
    setLoading(true);
    setItems([]);

    const naverSort = sortBy==="price_asc"?"asc":sortBy==="reviews"?"comment":sortBy==="rating"?"grade":"sim";
    const elevenSort = sortBy==="price_asc"?"PRICE_ASC":sortBy==="reviews"?"REVIEW":sortBy==="rating"?"REVIEW":"POPULAR";

    // 네이버 + 11번가 동시 호출
    const naverFetch = fetch(`/api/naver?query=${encodeURIComponent(keyword)}&sort=${naverSort}&display=15`)
      .then(r=>r.json())
      .then(data=>(data.items||[]).map(item=>({
        mall:"네이버쇼핑",
        title: item.title?.replace(/<[^>]+>/g,"")||"",
        price: parseInt(item.lprice)||0,
        image: item.image||"",
        rating: parseFloat(item.grade)||0,
        reviewCount: parseInt(item.reviewCount)||0,
        badge: item.mallName||"네이버",
        link: item.link||`https://search.shopping.naver.com/search/all?query=${encodeURIComponent(keyword)}`,
        mallColor:"#03C75A", mallBg:"#F0FFF6",
      })))
      .catch(()=>[]);

    const elevenFetch = fetch(`/api/eleven?query=${encodeURIComponent(keyword)}&sort=${elevenSort}&display=15`)
      .then(r=>r.json())
      .then(data=>(data.items||[]).map(item=>({
        mall:"11번가",
        title: item.productName||item.title||"",
        price: parseInt(item.price||item.salePrice)||0,
        image: item.productImage||item.imageUrl||"",
        rating: parseFloat(item.reviewScore)||0,
        reviewCount: parseInt(item.reviewCount)||0,
        badge: item.benefitLabel||"11번가",
        link: item.productUrl||`https://search.11st.co.kr/Search.tmall?kwd=${encodeURIComponent(keyword)}`,
        mallColor:"#E60000", mallBg:"#FFF0F0",
      })))
      .catch(()=>[]);

    const kakaoFetch = fetch(`/api/kakao?query=${encodeURIComponent(keyword)}&display=10`)
      .then(r=>r.json())
      .then(data=>(data.items||[]).map(item=>({
        mall:"카카오쇼핑",
        title:(item.title||"").replace(/<[^>]+>/g,""),
        price:parseInt(item.lprice)||0,
        image:item.image||"",
        rating:0,reviewCount:0,
        badge:item.mallName||"카카오",
        link:item.link||`https://shopping.kakao.com/search?q=${encodeURIComponent(keyword)}`,
        mallColor:"#F9E000",mallBg:"#FFFDE7",
      })))
      .catch(()=>[]);

    Promise.all([naverFetch, elevenFetch, kakaoFetch]).then(([naver, eleven, kakao])=>{
      // 인터리빙: 네이버1, 11번가1, 네이버2, 11번가2...
      const merged = [];
      const max = Math.max(naver.length, eleven.length, kakao.length);
      for(let i=0; i<max; i++){
        if(naver[i]) merged.push(naver[i]);
        if(eleven[i]) merged.push(eleven[i]);
        if(kakao[i]) merged.push(kakao[i]);
      }
      let arr = merged;
      if(sortBy==="price_asc") arr.sort((a,b)=>a.price-b.price);
      else if(sortBy==="reviews") arr.sort((a,b)=>b.reviewCount-a.reviewCount);
      else if(sortBy==="rating") arr.sort((a,b)=>b.rating-a.rating);
      setItems(arr);
      setLoading(false);
    });
  },[keyword, sortBy]);

  return {items, loading};
}

// 카테고리 → 검색 키워드 매핑
const CAT_KW={
  "수유":"젖병","기저귀":"기저귀","위생":"아기 물티슈",
  "건강":"아기 체온계","수면":"속싸개","목욕":"아기 로션",
  "의류":"아기 배냇저고리","이동":"아기띠","놀이":"아기 딸랑이",
  "안전":"아기 안전용품","이유식":"이유식 스푼",
  "수유용품":"젖병","기저귀/위생":"기저귀",
  "수면용품":"속싸개","목욕/스킨":"아기 바디워시","건강/안전":"아기 체온계",
  "이동용품":"아기띠","놀이/발달":"치발기","이유식용품":"이유식 도구",
  "안전용품":"아기 안전 콘센트커버","음식":"아기 과자","교육":"아기 그림책",
  "신발":"아기 신발","전체":""
};

/* ═══════════ 실시간 상품 카드 (전 몰 통합) ══════════ */
function LiveCard({item, rank}){
  const MEDALS=["🥇","🥈","🥉"];
  const color=item.mallColor||"#888";
  const bg=item.mallBg||"#F5F5F5";
  return(
    <div onClick={()=>item.link&&window.open(item.link,"_blank")}
      style={{background:"#fff",borderRadius:12,border:`1.5px solid ${color}20`,
        boxShadow:"0 1px 5px rgba(0,0,0,0.05)",cursor:"pointer",overflow:"hidden"}}>
      <div style={{background:color,padding:"3px 10px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div style={{display:"flex",alignItems:"center",gap:4}}>
          <span style={{fontSize:9,color:"#fff",fontWeight:900}}>{item.mall}</span>
          {item.badge&&<span style={{background:"rgba(255,255,255,0.2)",color:"#fff",borderRadius:3,padding:"0px 4px",fontSize:7,fontWeight:800}}>{item.badge}</span>}
        </div>
        <span style={{fontSize:9,color:"rgba(255,255,255,0.9)",fontWeight:700}}>{rank<=3?MEDALS[rank-1]:`${rank}위`}</span>
      </div>
      <div style={{display:"flex",gap:8,alignItems:"center",padding:"7px 10px"}}>
        {item.image
          ?<img src={item.image} alt={item.title} style={{width:48,height:48,borderRadius:8,objectFit:"cover",flexShrink:0,border:"1px solid #EEE"}} onError={e=>e.target.style.display="none"}/>
          :<div style={{width:48,height:48,borderRadius:8,background:bg,flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>🛍️</div>
        }
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontSize:11,fontWeight:800,color:"#1A1A1A",lineHeight:1.3,marginBottom:3,
            overflow:"hidden",display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical"}}>
            {item.title||item.productName}
          </div>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
            <div style={{fontSize:13,fontWeight:900,color}}>
              {typeof item.price==="number"?item.price.toLocaleString():parseInt(item.price||0).toLocaleString()}원
            </div>
            <div style={{display:"flex",gap:4,alignItems:"center"}}>
              {Number(item.rating)>0&&<span style={{fontSize:9,color:"#FFB300"}}>★{Number(item.rating).toFixed(1)}</span>}
              {Number(item.reviewCount)>0&&<span style={{fontSize:8,color:"#999"}}>💬{Number(item.reviewCount).toLocaleString()}</span>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* 스켈레톤 로딩 */
function Skeleton(){
  return(
    <div style={{background:"#fff",borderRadius:14,border:"1px solid #EEE",overflow:"hidden"}}>
      <div style={{height:26,background:"#EEE",animation:"pulse 1.5s infinite"}}/>
      <div style={{display:"flex",gap:10,padding:"12px"}}>
        <div style={{width:68,height:68,borderRadius:10,background:"#F0EDE8",flexShrink:0,animation:"pulse 1.5s infinite"}}/>
        <div style={{flex:1}}>
          <div style={{height:13,background:"#F0EDE8",borderRadius:6,marginBottom:8,animation:"pulse 1.5s infinite"}}/>
          <div style={{height:13,background:"#F0EDE8",borderRadius:6,marginBottom:8,width:"80%",animation:"pulse 1.5s infinite"}}/>
          <div style={{height:10,background:"#F0EDE8",borderRadius:6,width:"50%",animation:"pulse 1.5s infinite"}}/>
        </div>
      </div>
    </div>
  );
}

/* 쇼핑몰 검색 링크 생성 */
function getMallSearchUrl(mallKey, keyword){
  const q=encodeURIComponent(keyword);
  const urls={
    coupang:  `https://www.coupang.com/np/search?q=${q}`,
    gmarket:  `https://browse.gmarket.co.kr/search?keyword=${q}`,
    auction:  `https://browse.auction.co.kr/search?keyword=${q}`,
    ssg:      `https://www.ssg.com/search.ssg?query=${q}`,
    interpark:`https://shopping.interpark.com/product/productList.do?sch_flag=1&sch_txt=${q}`,
    wemake:   `https://www.wemakeprice.com/search/main?searchkeyword=${q}`,
    tmon:     `https://www.tmon.co.kr/deal/search.tmon?keyword=${q}`,
    temu:     `https://www.temu.com/search_result.html?search_key=${q}`,
  };
  return urls[mallKey]||"#";
}

/* 쇼핑몰 목록 정의 */
const MALL_LIST = [
  {k:"naver",    l:"네이버쇼핑", c:"#03C75A", bg:"#F0FFF6", api:true,  emoji:"🟢"},
  {k:"eleven",   l:"11번가",     c:"#E60000", bg:"#FFF0F0", api:true,  emoji:"🔴"},
  {k:"coupang",  l:"쿠팡",       c:"#E8140E", bg:"#FFF0F0", api:false, emoji:"🛒"},
  {k:"gmarket",  l:"G마켓",      c:"#F9A825", bg:"#FFFDE7", api:false, emoji:"🟡"},
  {k:"auction",  l:"옥션",       c:"#E91E63", bg:"#FCE4EC", api:false, emoji:"🔵"},
  {k:"ssg",      l:"SSG",        c:"#7B1FA2", bg:"#F3E5F5", api:false, emoji:"🟣"},
  {k:"interpark",l:"인터파크",   c:"#1565C0", bg:"#E3F2FD", api:false, emoji:"🔷"},
  {k:"wemake",   l:"위메프",     c:"#C62828", bg:"#FFEBEE", api:false, emoji:"🔶"},
  {k:"tmon",     l:"티몬",       c:"#1976D2", bg:"#E3F2FD", api:false, emoji:"💙"},
  {k:"temu",     l:"테무",       c:"#BF360C", bg:"#FBE9E7", api:false, emoji:"🌐"},
];

/* 쇼핑몰 선택 — 네이버 + 11번가 */
function MallSelector(){
  return(
    <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:10,flexWrap:"wrap"}}>
      <span style={{fontSize:9,color:MU,fontWeight:700}}>실시간 검색:</span>
      <div style={{display:"flex",alignItems:"center",gap:4,padding:"4px 10px",borderRadius:12,background:"#F0FFF6",border:"1.5px solid #03C75A40"}}>
        <span style={{fontSize:10,color:"#03C75A",fontWeight:900}}>🟢 네이버쇼핑</span>
        <span style={{fontSize:8,color:"#03C75A",background:"#03C75A15",padding:"1px 4px",borderRadius:4,fontWeight:700}}>가격·별점·리뷰</span>
      </div>
      <div style={{display:"flex",alignItems:"center",gap:4,padding:"4px 10px",borderRadius:12,background:"#FFF0F0",border:"1.5px solid #E6000040"}}>
        <span style={{fontSize:10,color:"#E60000",fontWeight:900}}>🔴 11번가</span>
        <span style={{fontSize:8,color:"#E60000",background:"#E6000015",padding:"1px 4px",borderRadius:4,fontWeight:700}}>가격·이미지</span>
      </div>
    </div>
  );
}




function HomeTab({month,setMonth,babyName,bday,wish,onWish,onCart,setTab,onSelectProduct,onSelectGuide}){
  const [showAd,setShowAd]=useState(true);
  const autoMonth=calcMonth(bday);
  const [sortBy,setSortBy]=useState("score");
  const [searchQ,setSearchQ]=useState("");
  const [activeSearch,setActiveSearch]=useState("");

  const curGroup=getGroupByMonth(month);
  const baseKeyword=getGroupKeyword(curGroup.id)+" 용품";
  const keyword=activeSearch||baseKeyword;
  const {items,loading}=useLiveItems(keyword,sortBy);

  const prods=getGroupProducts(curGroup.id);
  const fl=["🍼","🧸","⭐","🌙","💫","🎀","🐣","🌈","✨","🦋"];
  const catColors=[PINK,MINT,LAVEN,SKY,"#FFB347",P,"#8BC34A","#FF7043"];
  const cats=[...new Set(prods.map(p=>p.cat))];

  function doSearch(e){
    e.preventDefault();
    if(searchQ.trim()) setActiveSearch(searchQ.trim());
  }

  return(
    <div style={{overflowY:"auto",flex:1}}>
      {showAd&&(
        <div style={{margin:"8px 14px 0",borderRadius:18,overflow:"hidden",
          boxShadow:"0 4px 14px rgba(255,182,193,0.35)",border:"1.5px solid #FFD6E8",
          background:"linear-gradient(135deg,#FFF5F8 0%,#FFE8F0 50%,#FFF0F5 100%)",
          display:"flex",alignItems:"center",position:"relative",padding:"8px 10px",
          animation:"wiggle 3s ease-in-out infinite"}}>
          <div style={{fontSize:32,marginRight:8,animation:"bounce 1.5s ease-in-out infinite"}}>🪥</div>
          <div style={{flex:1,minWidth:0}}>
            <div style={{display:"flex",alignItems:"center",gap:4,marginBottom:2}}>
              <span style={{fontSize:8,fontWeight:900,color:"#fff",background:"linear-gradient(135deg,#FF6B9D,#FF8BAD)",
                padding:"1px 6px",borderRadius:8,letterSpacing:0.3}}>HOT 🔥</span>
              <span style={{fontSize:8,color:"#FF6B9D",fontWeight:700}}>HANA 추천</span>
            </div>
            <div style={{fontSize:11,fontWeight:900,color:"#5A2D3F",lineHeight:1.2,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>
              치카프렌즈 어린이 칫솔 🌟
            </div>
            <div style={{fontSize:9,color:"#A86B85",marginTop:1}}>부드럽고 깜찍한 칫솔!</div>
          </div>
          <a href="https://smartstore.naver.com/coolpick_official/products/13053434584"
            target="_blank" rel="noopener noreferrer"
            style={{display:"inline-block",background:"linear-gradient(135deg,#FF6B9D,#FF8BAD)",
              color:"#fff",fontWeight:900,fontSize:9,padding:"5px 10px",borderRadius:14,
              textDecoration:"none",marginRight:18,boxShadow:"0 2px 6px rgba(255,107,157,0.4)",
              whiteSpace:"nowrap"}}>
            보러가기 💕
          </a>
          <button onClick={()=>setShowAd(false)} style={{
            position:"absolute",top:4,right:6,background:"rgba(255,255,255,0.8)",border:"none",
            width:18,height:18,borderRadius:"50%",fontSize:10,color:"#999",cursor:"pointer",
            padding:0,lineHeight:1,display:"flex",alignItems:"center",justifyContent:"center",
            boxShadow:"0 1px 3px rgba(0,0,0,0.1)"}}>×</button>
        </div>
      )}
      {/* 헤더 — 컴팩트 */}
      <div style={{background:"linear-gradient(160deg,#FFF0E6,#FFF8E6,#F0F8FF)",padding:"8px 14px 10px",position:"relative",overflow:"hidden"}}>
        {fl.map((f,i)=><div key={i} style={{position:"absolute",fontSize:10+i,left:`${(i*11)%90}%`,bottom:"-5%",opacity:.25,animation:`floatUp ${6+i}s ${i*0.5}s infinite linear`,pointerEvents:"none"}}>{f}</div>)}
        <div style={{position:"relative",zIndex:1}}>
          {/* 아기 정보 — 한줄 */}
          {bday&&autoMonth!==null&&(
            <div style={{display:"flex",alignItems:"center",gap:5,marginBottom:6}}>
              <span style={{fontSize:13}}>🌟</span>
              <span style={{fontSize:12,fontWeight:900,color:P}}>{babyName||"아기"} · {autoMonth}개월</span>
              <span style={{fontSize:9,color:MU}}>({getGroupByMonth(autoMonth).label})</span>
            </div>
          )}
          {/* 검색창 */}
          <form onSubmit={doSearch} style={{display:"flex",gap:6,marginBottom:7}}>
            <div style={{flex:1,position:"relative"}}>
              <span style={{position:"absolute",left:9,top:"50%",transform:"translateY(-50%)",fontSize:12,color:MU}}>🔍</span>
              <input value={searchQ} onChange={e=>setSearchQ(e.target.value)}
                placeholder="육아용품 검색..."
                style={{width:"100%",background:"rgba(255,255,255,0.95)",border:`1.5px solid ${BO}`,borderRadius:10,padding:"7px 8px 7px 26px",fontSize:12,color:TX,boxSizing:"border-box",outline:"none",fontFamily:"inherit"}}/>
              {searchQ&&<button type="button" onClick={()=>{setSearchQ("");setActiveSearch("");}} style={{position:"absolute",right:8,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",color:MU,cursor:"pointer",fontSize:12}}>✕</button>}
            </div>
            <button type="submit" style={{background:`linear-gradient(135deg,${P},${G})`,color:"#fff",border:"none",borderRadius:10,padding:"7px 12px",fontSize:11,fontWeight:900,cursor:"pointer",whiteSpace:"nowrap"}}>검색</button>
          </form>
          {/* 그룹 버튼 — 컴팩트 */}
          <div style={{display:"flex",gap:4,paddingBottom:2}}>
            {MONTH_GROUPS.map(g=>{
              const active=g.months.includes(month);
              const isBaby=autoMonth!==null&&g.months.includes(autoMonth);
              return(
                <button key={g.id} onClick={()=>{setMonth(g.months[0]);setActiveSearch("");setSearchQ("");}}
                  style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",
                    padding:"5px 3px",borderRadius:10,
                    background:active?`linear-gradient(135deg,${g.color},${g.color}bb)`:"rgba(255,255,255,0.9)",
                    color:active?"#fff":MU,border:active?"none":`1.5px solid ${BO}`,
                    fontWeight:900,cursor:"pointer",position:"relative",gap:1,
                    boxShadow:active?`0 3px 10px ${g.color}50`:`0 1px 4px rgba(0,0,0,0.05)`}}>
                  <span style={{fontSize:13}}>{g.emoji}</span>
                  <span style={{fontSize:9,fontWeight:900,lineHeight:1.2,textAlign:"center",whiteSpace:"nowrap"}}>{g.label}</span>
                  {isBaby&&<div style={{position:"absolute",top:-4,right:-2,background:P,borderRadius:99,padding:"0px 3px",fontSize:6,color:"#fff",fontWeight:900,border:"1.5px solid #fff"}}>우리</div>}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div style={{padding:"8px 12px 20px"}}>

        {/* 가이드 — 3열 컴팩트 */}
        <div style={{marginBottom:8}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:5}}>
            <div style={{fontSize:11,fontWeight:900,color:TX}}>📚 육아 가이드</div>
            <button onClick={()=>setTab("guide")} style={{fontSize:9,color:P,background:"none",border:"none",cursor:"pointer",fontWeight:700}}>전체 →</button>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:5}}>
            {GUIDES.map(g=>(
              <button key={g.id} onClick={()=>onSelectGuide(g)}
                style={{display:"flex",alignItems:"center",gap:5,padding:"6px 7px",
                  background:`${g.color}10`,border:`1px solid ${g.color}25`,
                  borderRadius:9,cursor:"pointer",textAlign:"left"}}>
                <span style={{fontSize:13,flexShrink:0}}>{g.emoji}</span>
                <span style={{fontSize:10,fontWeight:800,color:TX,lineHeight:1.3,wordBreak:"keep-all"}}>{g.title}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 카테고리 — 한줄 */}
        <div style={{display:"flex",gap:3,marginBottom:8,overflowX:"auto",scrollbarWidth:"none"}}>
          {cats.map((cat,i)=>(
            <button key={cat} onClick={()=>setTab("shop")}
              style={{flexShrink:0,background:`${catColors[i%catColors.length]}18`,
                color:catColors[i%catColors.length],border:`1px solid ${catColors[i%catColors.length]}35`,
                borderRadius:8,padding:"4px 9px",fontSize:10,fontWeight:800,cursor:"pointer",whiteSpace:"nowrap"}}>
              {cat}
            </button>
          ))}
        </div>

        {/* 실시간 비교 */}
        <div>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:5}}>
            <div style={{fontSize:12,fontWeight:900,color:TX}}>
              🛍️ {activeSearch?`"${activeSearch}" 검색결과`:`${curGroup.emoji} ${curGroup.label} 인기상품`}
            </div>
            {activeSearch&&<button onClick={()=>{setActiveSearch("");setSearchQ("");}} style={{fontSize:9,color:MU,background:"none",border:"none",cursor:"pointer"}}>✕ 초기화</button>}
          </div>

          {/* 쇼핑몰 표시 */}
          <MallSelector/>

          {/* 정렬 */}
          <div style={{display:"flex",gap:4,marginBottom:7}}>
            {[{k:"score",l:"종합"},{k:"sales",l:"판매"},{k:"reviews",l:"리뷰"},{k:"rating",l:"별점"},{k:"price_asc",l:"낮은가격"}].map(({k,l})=>(
              <button key={k} onClick={()=>setSortBy(k)} style={{flex:1,padding:"5px 2px",borderRadius:7,background:sortBy===k?P:"#fff",color:sortBy===k?"#fff":MU,border:sortBy===k?"none":`1px solid ${BO}`,fontWeight:sortBy===k?900:600,fontSize:9,cursor:"pointer"}}>{l}</button>
            ))}
          </div>

          {/* 상품 리스트 */}
          {loading?(
            <div style={{display:"flex",flexDirection:"column",gap:6}}>
              {[1,2,3,4,5].map(i=><Skeleton key={i}/>)}
            </div>
          ):items.length===0?(
            <div style={{textAlign:"center",padding:"24px 0",color:MU,background:CA,borderRadius:12,border:`1px solid ${BO}`}}>
              <div style={{fontSize:24,marginBottom:5}}>🔍</div>
              <div style={{fontSize:11}}>검색 중이에요...</div>
            </div>
          ):(
            <div style={{display:"flex",flexDirection:"column",gap:6}}>
              {items.map((item,i)=><LiveCard key={i} item={item} rank={i+1}/>)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ═══════════ SHOP TAB ══════════ */
function ShopTab({month,setMonth,wish,onWish,onCart,onSelectProduct}){
  const [sort,setSort]=useState("score");
  const [cat,setCat]=useState("전체");
  const [selected,setSelected]=useState({naver:true,eleven:true});
  const [q,setQ]=useState("");

  const curGroup=getGroupByMonth(month);
  const prods=getGroupProducts(curGroup.id);
  const cats=["전체",...new Set(prods.map(p=>p.cat))];

  // 키워드 만들기
  const catKw=CAT_KW[cat]||cat;
  const base=getGroupKeyword(curGroup.id);
  const keyword=cat==="전체"?base+" 용품":catKw+" "+base;

  const {items,loading}=useLiveItems(keyword,sort);

  // 검색 필터
  const filtered=q?items.filter(i=>i.title?.includes(q)):items;

  return(
    <div style={{overflowY:"auto",flex:1,padding:"12px 14px 24px"}}>
      {/* 검색 */}
      <div style={{position:"relative",marginBottom:9}}>
        <span style={{position:"absolute",left:13,top:"50%",transform:"translateY(-50%)",color:MU,fontSize:14}}>🔍</span>
        <input value={q} onChange={e=>setQ(e.target.value)} placeholder={`${curGroup.label} 상품 검색...`} style={{width:"100%",background:CA,border:`1.5px solid ${q?P:BO}`,borderRadius:14,padding:"11px 35px",fontSize:13,color:TX,boxSizing:"border-box",outline:"none",fontFamily:"inherit"}}/>
        {q&&<button onClick={()=>setQ("")} style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",color:MU,cursor:"pointer"}}>✕</button>}
      </div>

      {/* 개월 그룹 버튼 */}
      <div style={{display:"flex",gap:5,marginBottom:10}}>
        {MONTH_GROUPS.map(g=>{
          const active=g.months.includes(month);
          return(
            <button key={g.id} onClick={()=>{setMonth(g.months[0]);setCat("전체");}}
              style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",
                padding:"6px 3px",borderRadius:14,
                background:active?`linear-gradient(135deg,${g.color},${g.color}bb)`:CA,
                color:active?"#fff":MU,border:active?"none":`1px solid ${BO}`,
                fontWeight:900,cursor:"pointer",gap:1,
                boxShadow:active?`0 4px 12px ${g.color}44`:"none"}}>
              <span style={{fontSize:14}}>{g.emoji}</span>
              <span style={{fontSize:10,fontWeight:900,whiteSpace:"nowrap"}}>{g.label}</span>
              <span style={{fontSize:7,opacity:active?0.9:0.55,whiteSpace:"nowrap"}}>{g.sub.slice(0,5)}</span>
            </button>
          );
        })}
      </div>

      {/* 쇼핑몰 선택 */}
      <MallSelector/>

      {/* 카테고리 */}
      <div style={{display:"flex",gap:5,overflowX:"auto",scrollbarWidth:"none",marginBottom:7}}>
        {cats.map(c=>(
          <button key={c} onClick={()=>setCat(c)} style={{flexShrink:0,borderRadius:20,padding:"4px 12px",background:cat===c?TX:CA,color:cat===c?"#fff":MU,border:`1px solid ${cat===c?TX:BO}`,fontWeight:700,fontSize:11,cursor:"pointer"}}>{c}</button>
        ))}
      </div>

      {/* 정렬 */}
      <div style={{display:"flex",gap:4,overflowX:"auto",scrollbarWidth:"none",marginBottom:11}}>
        {[{k:"score",l:"종합📊"},{k:"reviews",l:"리뷰💬"},{k:"rating",l:"별점⭐"},{k:"sales",l:"판매🔥"},{k:"price_asc",l:"낮은가격"}].map(({k,l})=>(
          <button key={k} onClick={()=>setSort(k)} style={{flexShrink:0,borderRadius:9,padding:"5px 10px",background:sort===k?`linear-gradient(135deg,${P},${G})`:CA,color:sort===k?"#fff":MU,border:sort===k?"none":`1px solid ${BO}`,fontWeight:700,fontSize:10,cursor:"pointer"}}>{l}</button>
        ))}
      </div>

      <div style={{display:"flex",justifyContent:"space-between",marginBottom:9}}>
        <span style={{fontSize:11,fontWeight:700,color:MU}}>{curGroup.emoji} {curGroup.label} {cat!=="전체"?`· ${cat}`:""} {items.length}개</span>
        <span style={{fontSize:9,color:MU}}>🤖 10개 몰 AI 검색</span>
      </div>

      {loading?(
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {[1,2,3,4,5,6].map(i=><Skeleton key={i}/>)}
        </div>
      ):filtered.length===0?(
        <div style={{textAlign:"center",padding:"48px 0",color:MU,background:CA,borderRadius:16,border:`1px solid ${BO}`}}>
          <div style={{fontSize:36,marginBottom:8}}>🔍</div>
          <div>상품을 불러오는 중이에요</div>
        </div>
      ):(
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {filtered.map((item,i)=><LiveCard key={i} item={item} rank={i+1}/>)}
        </div>
      )}
    </div>
  );
}

/* ═══════════ GUIDE TAB ══════════ */
function GuideTab({initialGuide, onClearGuide}){
  const [sel,setSel]=useState(initialGuide||null);
  // initialGuide가 바뀌면 바로 열기
  useEffect(()=>{ if(initialGuide){setSel(initialGuide);} },[initialGuide]);
  const handleClose=()=>{ setSel(null); if(onClearGuide)onClearGuide(); };
  return(
    <div style={{overflowY:"auto",flex:1,padding:"14px 14px 24px"}}>
      {sel&&<GuideDetail guide={sel} onClose={handleClose}/>}
      <div style={{fontSize:14,fontWeight:900,color:TX,marginBottom:4}}>📚 초보 부모 완전 가이드</div>
      <div style={{fontSize:12,color:MU,marginBottom:16}}>궁금한 것을 탭해보세요 💕</div>
      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        {GUIDES.map(g=>(
          <button key={g.id} onClick={()=>setSel(g)} style={{display:"flex",alignItems:"center",gap:14,padding:"16px 14px",background:CA,borderRadius:18,border:`1.5px solid ${g.color}30`,cursor:"pointer",textAlign:"left",boxSizing:"border-box",width:"100%",boxShadow:`0 2px 10px ${g.color}12`}}>
            <div style={{width:52,height:52,borderRadius:16,background:`${g.color}18`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:26,flexShrink:0}}>{g.emoji}</div>
            <div style={{flex:1}}>
              <span style={{background:`${g.color}20`,color:g.color,borderRadius:6,padding:"2px 7px",fontSize:9,fontWeight:800,marginBottom:5,display:"inline-block"}}>{g.tag}</span>
              <div style={{fontSize:14,fontWeight:900,color:TX,lineHeight:1.35}}>{g.title}</div>
              <div style={{fontSize:11,color:MU,marginTop:3,lineHeight:1.4}}>{g.desc.slice(0,40)}...</div>
            </div>
            <span style={{color:MU,fontSize:18,flexShrink:0}}>›</span>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ═══════════ CHECKLIST VIEW ══════════ */
function ChecklistView({checks,setChecks}){
  const cats=[...new Set(CHECKLIST.map(c=>c.cat))];
  const done=CHECKLIST.filter(c=>checks[c.id]).length;
  const pct=Math.round((done/CHECKLIST.length)*100);
  return(
    <div style={{overflowY:"auto",flex:1,padding:"0 0 24px"}}>
      <div style={{background:`linear-gradient(135deg,rgba(255,112,67,0.1),rgba(255,179,71,0.07))`,padding:"16px 18px",borderBottom:`1px solid ${BO}`}}>
        <div style={{fontSize:16,fontWeight:900,color:TX,marginBottom:4}}>✅ 육아용품 체크리스트</div>
        <div style={{fontSize:11,color:MU,marginBottom:10}}>{CHECKLIST.length}가지 · 가장 많이 쓰는 순서대로</div>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{flex:1,height:8,borderRadius:9,background:"rgba(255,112,67,0.15)",overflow:"hidden"}}><div style={{width:`${pct}%`,height:"100%",borderRadius:9,background:`linear-gradient(90deg,${P},${G})`,transition:"width 0.3s"}}/></div>
          <span style={{fontSize:12,fontWeight:900,color:P,minWidth:44}}>{done}/{CHECKLIST.length}</span>
        </div>
        <div style={{fontSize:11,color:MU,marginTop:4}}>{pct===100?"🎉 모두 준비됐어요!":pct>=50?"👍 절반 이상 준비됐어요!":"💪 준비 시작해봐요!"}</div>
      </div>
      <div style={{padding:"0 14px"}}>
        {cats.map(cat=>{
          const items=CHECKLIST.filter(c=>c.cat===cat);
          const catDone=items.filter(c=>checks[c.id]).length;
          return(
            <div key={cat} style={{marginTop:16}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
                <div style={{fontSize:13,fontWeight:900,color:TX}}>{cat}</div>
                <span style={{fontSize:10,color:catDone===items.length?P:MU,fontWeight:700,background:catDone===items.length?"rgba(255,112,67,0.1)":"rgba(0,0,0,0.04)",borderRadius:8,padding:"2px 8px"}}>{catDone}/{items.length}{catDone===items.length?" ✅":""}</span>
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:6}}>
                {items.map(c=>{
                  const isDone=!!checks[c.id];
                  return(
                    <button key={c.id} onClick={()=>setChecks(prev=>({...prev,[c.id]:!prev[c.id]}))} style={{display:"flex",alignItems:"center",gap:11,padding:"11px 13px",borderRadius:13,background:isDone?"rgba(255,112,67,0.06)":CA,border:isDone?`1.5px solid rgba(255,112,67,0.3)`:`1px solid ${BO}`,cursor:"pointer",textAlign:"left",boxSizing:"border-box",width:"100%",transition:"all 0.15s"}}>
                      <div style={{width:24,height:24,borderRadius:7,flexShrink:0,background:isDone?`linear-gradient(135deg,${P},${G})`:"rgba(0,0,0,0.06)",display:"flex",alignItems:"center",justifyContent:"center",border:isDone?"none":`1.5px solid ${BO}`,fontSize:14,color:"#fff"}}>{isDone?"✓":""}</div>
                      <span style={{fontSize:16,flexShrink:0}}>{c.e}</span>
                      <div style={{flex:1}}><div style={{fontSize:13,fontWeight:isDone?700:600,color:isDone?P:TX,textDecoration:isDone?"line-through":"none",opacity:isDone?0.8:1}}>{c.item}</div></div>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
        <button onClick={()=>setChecks({})} style={{width:"100%",marginTop:18,background:CA,border:`1px solid ${BO}`,borderRadius:13,padding:"11px",fontSize:12,fontWeight:700,color:MU,cursor:"pointer",boxSizing:"border-box"}}>초기화</button>
      </div>
    </div>
  );
}

/* ═══════════ PROFILE TAB ══════════ */
function ProfileTab({user,setShowAuth,setUser,wish,cart,checks,setChecks,babyName,setBabyName,bday,setBday}){
  const [showChecklist,setShowChecklist]=useState(false);
  const [editBaby,setEditBaby]=useState(false);
  const [tmpName,setTmpName]=useState(babyName);
  const [tmpBday,setTmpBday]=useState(bday);
  const doneCnt=CHECKLIST.filter(c=>checks[c.id]).length;
  const autoMonth=calcMonth(bday);

  if(showChecklist)return(
    <div style={{display:"flex",flexDirection:"column",flex:1,overflow:"hidden"}}>
      <div style={{background:CA,padding:"12px 16px 10px",borderBottom:`1px solid ${BO}`,display:"flex",alignItems:"center",gap:10,flexShrink:0}}>
        <button onClick={()=>setShowChecklist(false)} style={{background:"none",border:"none",color:MU,fontSize:16,cursor:"pointer",padding:0}}>←</button>
        <span style={{fontSize:15,fontWeight:900,color:TX}}>육아용품 체크리스트</span>
      </div>
      <ChecklistView checks={checks} setChecks={setChecks}/>
    </div>
  );

  if(!user)return(
    <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:32,gap:14,background:BG}}>
      <div style={{fontSize:64,animation:"bounce 2s infinite"}}>👶</div>
      <div style={{fontSize:19,fontWeight:900,color:TX}}>HANA 가족이 되어보세요!</div>
      <div style={{fontSize:13,color:MU,textAlign:"center",lineHeight:1.7}}>찜 목록, 체크리스트,<br/>아기 정보까지 무료로!</div>
      <button onClick={()=>setShowAuth(true)} style={{background:`linear-gradient(135deg,${P},${G})`,color:"#fff",border:"none",borderRadius:16,padding:"15px 40px",fontSize:15,fontWeight:900,cursor:"pointer",boxShadow:`0 7px 22px rgba(255,112,67,0.4)`}}>로그인 / 회원가입 →</button>
    </div>
  );

  return(
    <div style={{flex:1,overflowY:"auto",background:BG,paddingBottom:24}}>
      {/* Profile header */}
      <div style={{background:"linear-gradient(160deg,#FFF0E6,#FFF8E6)",padding:"20px 18px 18px",borderBottom:`1px solid ${BO}`}}>
        <div style={{display:"flex",alignItems:"center",gap:13}}>
          <div style={{width:52,height:52,borderRadius:26,background:`linear-gradient(135deg,${P},${G})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,color:"#fff",fontWeight:900,boxShadow:`0 5px 16px rgba(255,112,67,0.4)`,animation:"wobble 4s infinite"}}>{user.name[0]}</div>
          <div>
            <div style={{fontSize:16,fontWeight:900,color:TX}}>{user.name}님 👋</div>
            <div style={{fontSize:11,color:MU,marginTop:2}}>{user.email}</div>
            <div style={{display:"inline-block",marginTop:4,background:`linear-gradient(135deg,${P},${G})`,color:"#fff",borderRadius:8,padding:"2px 9px",fontSize:10,fontWeight:800}}>🌟 HANA 가족</div>
          </div>
        </div>
        {/* 아기 정보 카드 */}
        <div style={{marginTop:14,background:"rgba(255,255,255,0.8)",borderRadius:16,padding:"13px 14px",border:`1px solid rgba(255,112,67,0.2)`}}>
          {editBaby?(
            <div>
              <div style={{fontSize:12,fontWeight:800,color:P,marginBottom:8}}>👶 아기 정보 수정</div>
              <input value={tmpName} onChange={e=>setTmpName(e.target.value)} placeholder="아기 이름 (예: 하나)" style={{width:"100%",border:`1px solid ${BO}`,borderRadius:10,padding:"9px 12px",fontSize:13,color:TX,boxSizing:"border-box",outline:"none",fontFamily:"inherit",marginBottom:8,background:BG}}/>
              <input value={tmpBday} onChange={e=>setTmpBday(e.target.value)} type="date" style={{width:"100%",border:`1px solid ${BO}`,borderRadius:10,padding:"9px 12px",fontSize:13,color:TX,boxSizing:"border-box",outline:"none",fontFamily:"inherit",marginBottom:10,background:BG}}/>
              <div style={{display:"flex",gap:7}}>
                <button onClick={()=>{setBabyName(tmpName);setBday(tmpBday);setEditBaby(false);}} style={{flex:1,background:`linear-gradient(135deg,${P},${G})`,color:"#fff",border:"none",borderRadius:10,padding:"9px",fontSize:13,fontWeight:800,cursor:"pointer"}}>저장</button>
                <button onClick={()=>setEditBaby(false)} style={{flex:1,background:BG,color:MU,border:`1px solid ${BO}`,borderRadius:10,padding:"9px",fontSize:13,fontWeight:700,cursor:"pointer"}}>취소</button>
              </div>
            </div>
          ):(
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div>
                <div style={{fontSize:12,fontWeight:800,color:MU,marginBottom:4}}>👶 아기 정보</div>
                {bday?(
                  <div>
                    <div style={{fontSize:14,fontWeight:900,color:TX}}>{babyName||"아기"} · {autoMonth}개월</div>
                    <div style={{fontSize:11,color:MU,marginTop:1}}>{bday} 출생</div>
                  </div>
                ):(
                  <div style={{fontSize:13,color:MU}}>생년월일을 입력하면<br/>자동으로 개월 수를 계산해드려요!</div>
                )}
              </div>
              <button onClick={()=>{setTmpName(babyName);setTmpBday(bday);setEditBaby(true);}} style={{background:BG,border:`1px solid ${BO}`,borderRadius:10,padding:"7px 12px",fontSize:11,fontWeight:700,color:P,cursor:"pointer"}}>{bday?"수정":"입력"}</button>
            </div>
          )}
        </div>
        {/* 체크리스트 progress */}
        <div style={{marginTop:10,background:"rgba(255,255,255,0.8)",borderRadius:12,padding:"10px 12px",border:`1px solid rgba(255,112,67,0.15)`,cursor:"pointer"}} onClick={()=>setShowChecklist(true)}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}><span style={{fontSize:11,fontWeight:700,color:TX}}>✅ 육아용품 체크리스트</span><span style={{fontSize:11,fontWeight:900,color:P}}>{doneCnt}/{CHECKLIST.length}</span></div>
          <div style={{height:6,borderRadius:9,background:"rgba(255,112,67,0.15)",overflow:"hidden"}}><div style={{width:`${Math.round(doneCnt/CHECKLIST.length*100)}%`,height:"100%",borderRadius:9,background:`linear-gradient(90deg,${P},${G})`,transition:"width 0.3s"}}/></div>
          <div style={{fontSize:10,color:P,marginTop:4,fontWeight:700}}>탭해서 체크하기 →</div>
        </div>
      </div>
      {/* Menu */}
      <div style={{padding:"14px 14px 0",display:"flex",flexDirection:"column",gap:7}}>
        {[
          {e:"✅",l:"육아용품 체크리스트",s:`${doneCnt}/${CHECKLIST.length}개 완료`,hi:true,cb:()=>setShowChecklist(true)},
          {e:"❤️",l:"찜 목록",s:`${wish.length}개 저장됨`,cb:null},
          {e:"🛒",l:"장바구니",s:`${cart.reduce((s,i)=>s+i.qty,0)}개 담김`,cb:null},
          {e:"🔔",l:"가격 알림",s:"할인·가격 변동 알림",cb:null},
          {e:"📚",l:"육아 가이드",s:"수유·이유식·수면 가이드",cb:null},
          {e:"💬",l:"고객센터",s:"문의·도움말",cb:null},
        ].map(({e,l,s,hi,cb})=>(
          <button key={l} onClick={cb||undefined} style={{display:"flex",alignItems:"center",gap:13,padding:"13px 14px",background:hi?`linear-gradient(135deg,rgba(255,112,67,0.08),rgba(255,179,71,0.05))`:CA,borderRadius:14,border:hi?`1.5px solid rgba(255,112,67,0.25)`:`1px solid ${BO}`,cursor:cb?"pointer":"default",textAlign:"left",width:"100%",boxSizing:"border-box"}}>
            <span style={{fontSize:20}}>{e}</span>
            <div style={{flex:1}}><div style={{fontSize:13,fontWeight:700,color:hi?P:TX}}>{l}</div><div style={{fontSize:10,color:MU}}>{s}</div></div>
            {cb&&<span style={{color:MU}}>›</span>}
          </button>
        ))}
        <button onClick={()=>setUser(null)} style={{width:"100%",background:CA,border:"1.5px solid #FFCDD2",borderRadius:14,padding:"13px",fontSize:13,fontWeight:700,color:"#D32F2F",cursor:"pointer",marginTop:3,boxSizing:"border-box"}}>로그아웃</button>
      </div>
    </div>
  );
}

/* ═══════════ MAIN APP ══════════ */
export default function App(){
  const [splash,  setSplash]  = useState(true);
  const [month,   setMonth]   = useState(1);
  const [tab,     setTab]     = useState("home");
  const [wish,    setWish]    = useState([]);
  const [cart,    setCart]    = useState([]);
  const [checks,  setChecks]  = useState({});
  const [user,    setUser]    = useState(null);
  const [babyName,setBabyName]= useState("");
  const [bday,    setBday]    = useState("");
  const [showCart,setShowCart]= useState(false);
  const [showWish,setShowWish]= useState(false);
  const [showAuth,setShowAuth]= useState(false);
  const [selProd, setSelProd] = useState(null);
  const [selGuide, setSelGuide] = useState(null);
  const [toast,   setToast]   = useState(null);

  useEffect(()=>{const t=setTimeout(()=>setSplash(false),1500);return()=>clearTimeout(t);},[]);
  useEffect(()=>{
    const m=calcMonth(bday);
    if(m!==null)setMonth(Math.max(1,Math.min(12,m)));
  },[bday]);

  function fire(msg){setToast(msg);setTimeout(()=>setToast(null),1800);}
  function toggleWish(p){setWish(w=>{const e=w.find(x=>x.id===p.id);fire(e?"찜 해제했어요":"❤️ 찜했어요!");return e?w.filter(x=>x.id!==p.id):[...w,p];});}
  function addCart(p){setCart(c=>{fire("🛒 장바구니에 담았어요!");const e=c.find(x=>x.id===p.id);return e?c.map(x=>x.id===p.id?{...x,qty:x.qty+1}:x):[...c,{...p,qty:1}];});}
  const cartCount=cart.reduce((s,i)=>s+i.qty,0);

  const NAV=[
    {id:"home",icon:"🏠",label:"홈"},
    {id:"shop",icon:"🛍️",label:"쇼핑"},
    {id:"guide",icon:"📚",label:"가이드"},
    {id:"wish",icon:"❤️",label:"찜",badge:wish.length},
    {id:"profile",icon:"👤",label:"마이"},
  ];
  function handleNav(id){if(id==="wish"){setShowWish(true);return;}setTab(id);}

  return(
    /* PC에서는 폰 프레임처럼 중앙에, 모바일에서는 전체화면 */
    <div style={{minHeight:"100vh",background:"#E8E0D8",display:"flex",alignItems:"center",justifyContent:"center"}}>
    <div style={{fontFamily:"'Noto Sans KR','Apple SD Gothic Neo',sans-serif",background:BG,width:"100%",maxWidth:480,margin:"0 auto",display:"flex",flexDirection:"column",height:"100dvh",overflow:"hidden",position:"relative",boxShadow:"0 0 40px rgba(0,0,0,0.15)"}}>
      {splash&&<Splash/>}
      {/* TOP BAR */}
      <div style={{background:CA,padding:"12px 16px 10px",borderBottom:`1px solid ${BO}`,flexShrink:0,display:"flex",alignItems:"center",justifyContent:"space-between",boxShadow:`0 2px 12px rgba(255,112,67,0.07)`}}>
        <div style={{display:"flex",alignItems:"center",gap:9,cursor:"pointer"}} onClick={()=>setTab("home")}>
          <span style={{fontSize:24,animation:"spin 8s linear infinite",display:"inline-block"}}>☀️</span>
          <div>
            <div style={{fontSize:21,fontWeight:900,letterSpacing:-1,lineHeight:1,background:`linear-gradient(135deg,${P},${G})`,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>HANA</div>
            <div style={{fontSize:8,color:MU,letterSpacing:2}}>초보 부모 육아 가이드</div>
          </div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <button onClick={()=>setShowCart(true)} style={{position:"relative",background:"rgba(255,112,67,0.08)",border:`1px solid ${BO}`,borderRadius:12,padding:"7px 10px",cursor:"pointer",fontSize:16}}>
            🛒{cartCount>0&&<span style={{position:"absolute",top:-4,right:-4,background:`linear-gradient(135deg,${P},${G})`,color:"#fff",borderRadius:99,fontSize:8,fontWeight:900,padding:"1px 4px",minWidth:14,textAlign:"center"}}>{cartCount}</span>}
          </button>
          {user?(
            <button onClick={()=>setTab("profile")} style={{background:`linear-gradient(135deg,rgba(255,112,67,0.1),rgba(255,179,71,0.08))`,border:`1.5px solid rgba(255,112,67,0.25)`,borderRadius:18,padding:"6px 12px",color:P,fontWeight:800,fontSize:12,cursor:"pointer"}}>{user.name.slice(0,4)} ›</button>
          ):(
            <button onClick={()=>setShowAuth(true)} style={{background:`linear-gradient(135deg,${P},${G})`,border:"none",borderRadius:18,padding:"7px 14px",color:"#fff",fontWeight:900,fontSize:12,cursor:"pointer",boxShadow:`0 4px 13px rgba(255,112,67,0.35)`}}>로그인 ✨</button>
          )}
        </div>
      </div>
      {/* CONTENT */}
      <div style={{flex:1,overflow:"hidden",display:"flex",flexDirection:"column"}}>
        {tab==="home"&&<HomeTab month={month} setMonth={setMonth} babyName={babyName} bday={bday} wish={wish} onWish={toggleWish} onCart={addCart} setTab={setTab} onSelectProduct={setSelProd} onSelectGuide={g=>{setSelGuide(g);setTab("guide");}}/>}
        {tab==="shop"&&<ShopTab month={month} setMonth={setMonth} wish={wish} onWish={toggleWish} onCart={addCart} onSelectProduct={setSelProd}/>}
        {tab==="guide"&&<GuideTab initialGuide={selGuide} onClearGuide={()=>setSelGuide(null)}/>}
        {tab==="profile"&&<ProfileTab user={user} setShowAuth={setShowAuth} setUser={setUser} wish={wish} cart={cart} checks={checks} setChecks={setChecks} babyName={babyName} setBabyName={setBabyName} bday={bday} setBday={setBday}/>}
      </div>
      {/* BOTTOM NAV */}
      <div style={{background:CA,borderTop:`1px solid ${BO}`,display:"flex",paddingBottom:"env(safe-area-inset-bottom,6px)",flexShrink:0,boxShadow:`0 -3px 14px rgba(0,0,0,0.05)`,position:"relative",zIndex:300}}>
        {NAV.map(({id,icon,label,badge})=>{
          const active=(id!=="wish")&&tab===id;
          return(
            <button key={id} onClick={()=>handleNav(id)} style={{flex:1,background:"none",border:"none",cursor:"pointer",padding:"9px 0 5px",display:"flex",flexDirection:"column",alignItems:"center",gap:2,position:"relative"}}>
              <div style={{position:"relative"}}>
                <span style={{fontSize:21,opacity:active?1:0.4,transition:"opacity .2s"}}>{icon}</span>
                {badge>0&&<span style={{position:"absolute",top:-4,right:-6,background:`linear-gradient(135deg,${P},${G})`,color:"#fff",borderRadius:99,fontSize:8,fontWeight:900,padding:"1px 4px",minWidth:14,textAlign:"center",animation:"pulse 2s infinite"}}>{badge}</span>}
              </div>
              <span style={{fontSize:9,fontWeight:active?900:500,color:active?P:MU,transition:"color .2s"}}>{label}</span>
              {active&&<div style={{position:"absolute",bottom:0,width:22,height:3,borderRadius:3,background:`linear-gradient(135deg,${P},${G})`}}/>}
            </button>
          );
        })}
      </div>
      {/* MODALS */}
      {selProd&&<ProductDetail p={selProd} wished={!!wish.find(w=>w.id===selProd.id)} onWish={toggleWish} onCart={addCart} onClose={()=>setSelProd(null)}/>}
      {showCart&&<CartSheet cart={cart} setCart={setCart} onClose={()=>setShowCart(false)}/>}
      {showWish&&<WishSheet wish={wish} setWish={setWish} addCart={addCart} onClose={()=>setShowWish(false)}/>}
      {showAuth&&<AuthModal onClose={()=>setShowAuth(false)} onLogin={u=>{setUser(u);fire(`✨ 환영해요, ${u.name}님!`);}}/>}
      {toast&&<div style={{position:"fixed",bottom:82,left:"50%",transform:"translateX(-50%)",background:`linear-gradient(135deg,${P},${G})`,color:"#fff",borderRadius:18,padding:"10px 20px",fontSize:13,fontWeight:800,zIndex:800,whiteSpace:"nowrap",pointerEvents:"none",boxShadow:`0 7px 22px rgba(255,112,67,0.45)`,animation:"toastIn .2s ease"}}>{toast}</div>}
      <style>{`
        @keyframes splashOut  { to{opacity:0;pointer-events:none} }
        @keyframes spinBounce { 0%{transform:scale(0) rotate(-180deg)} 70%{transform:scale(1.15) rotate(10deg)} 100%{transform:scale(1) rotate(0deg)} }
        @keyframes fadeUp     { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        @keyframes floatUp    { 0%{transform:translateY(0) rotate(0deg);opacity:.45} 100%{transform:translateY(-110vh) rotate(360deg);opacity:0} }
        @keyframes wobble     { 0%,100%{transform:rotate(-3deg)} 50%{transform:rotate(3deg)} }
        @keyframes bounce     { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-7px)} }
        @keyframes pulse      { 0%,100%{opacity:1} 50%{opacity:.6} }
        @keyframes spin       { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes sheetUp    { from{opacity:0;transform:translateY(30px)} to{opacity:1;transform:translateY(0)} }
        @keyframes toastIn    { from{opacity:0;transform:translateX(-50%) translateY(10px)} to{opacity:1;transform:translateX(-50%) translateY(0)} }
        ::-webkit-scrollbar   { display:none }
        *                     { -webkit-tap-highlight-color:transparent }
        input::placeholder    { color:#C4A58A }
        button                { font-family:inherit }
      `}</style>
    </div>
    </div>
  );
}
// deploy 2026년  4월 22일 수요일 21시 08분 44초 KST
// 2026년  4월 22일 수요일 23시 28분 29초 KST
