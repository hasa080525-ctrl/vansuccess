/*
 * Generates static landing pages under /areas/:
 *  - 1 hub page listing all 16 regions
 *  - 80 region pages (region x product, 5 products)
 *  - ~1,145 district pages (region x district x product), one per real
 *    시/군/구, reusing the exact region/district data already shown in
 *    index.html's #areas accordion (see REGIONS below — kept in sync by
 *    hand since it's copied verbatim from there).
 *  읍/면/동 names that appear in parentheses in the source data (e.g.
 *  "기장군(기장읍 · 장안읍 · 정관읍 · 일광읍)") are shown in-page as text,
 *  not as separate pages — no verified nationwide 읍/면/동 dataset exists,
 *  and pages at that granularity would be too thin for search quality.
 *  Also writes sitemap-areas.xml with every URL from this run.
 * Re-run this script (`node scripts/generate-areas.js`) whenever region/
 * district/product copy needs to change — do not hand-edit generated files.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const AREAS_DIR = path.join(ROOT, 'areas');
const SITE = 'https://vansuccess.co.kr';

// Copied verbatim from index.html's #areas accordion (2026-08-02).
const REGIONS = [
  { name: '서울특별시', districts: ['종로구', '중구', '용산구', '성동구', '광진구', '동대문구', '중랑구', '성북구', '강북구', '도봉구', '노원구', '은평구', '서대문구', '마포구', '양천구', '강서구', '구로구', '금천구', '영등포구', '동작구', '관악구', '서초구', '강남구', '송파구', '강동구'] },
  { name: '부산광역시', districts: ['중구', '서구', '동구', '영도구', '부산진구', '동래구', '남구', '북구', '강서구', '해운대구', '사하구', '금정구', '연제구', '수영구', '사상구', '기장군(기장읍 · 장안읍 · 정관읍 · 일광읍)'] },
  { name: '대구광역시', districts: ['중구', '동구', '서구', '남구', '북구', '수성구', '달서구', '달성군(화원읍 · 논공읍 · 다사읍 · 유가읍 · 옥포읍 · 현풍읍)', '군위군(군위읍)'] },
  { name: '인천광역시', districts: ['미추홀구', '연수구', '남동구', '부평구', '계양구', '제물포구', '영종구', '서해구', '검단구', '강화군(강화읍)', '옹진군'] },
  { name: '대전광역시', districts: ['동구', '중구', '서구', '유성구', '대덕구'] },
  { name: '울산광역시', districts: ['중구', '남구', '동구', '북구', '울주군(언양읍 · 온산읍 · 온양읍 · 범서읍 · 청량읍 · 삼남읍)'] },
  { name: '세종특별자치시', districts: [] },
  { name: '전남광주통합특별시', districts: ['동구', '서구', '남구', '북구', '광산구', '목포시', '여수시', '순천시', '나주시', '광양시', '담양군(담양읍)', '곡성군(곡성읍)', '구례군(구례읍)', '고흥군(고흥읍 · 도양읍)', '보성군(보성읍 · 벌교읍)', '화순군(화순읍)', '장흥군(장흥읍 · 관산읍 · 대덕읍)', '강진군(강진읍)', '해남군(해남읍)', '영암군(영암읍 · 삼호읍)', '무안군(무안읍 · 일로읍 · 삼향읍)', '함평군(함평읍)', '영광군(영광읍 · 백수읍 · 홍농읍)', '장성군(장성읍)', '완도군(완도읍 · 금일읍 · 노화읍)', '진도군(진도읍)', '신안군(압해읍 · 지도읍)'] },
  { name: '경기도', districts: ['수원시', '성남시', '의정부시', '안양시', '부천시', '광명시', '평택시', '안산시', '고양시', '구리시', '남양주시', '오산시', '시흥시', '군포시', '과천시', '의왕시', '하남시', '용인시', '파주시', '이천시', '안성시', '김포시', '화성시', '광주시', '동두천시', '양주시', '포천시', '여주시', '양평군(양평읍)', '가평군(가평읍)', '연천군(연천읍 · 전곡읍)'] },
  { name: '강원특별자치도', districts: ['춘천시', '원주시', '강릉시', '동해시', '태백시', '속초시', '삼척시', '홍천군(홍천읍)', '횡성군(횡성읍)', '영월군(영월읍 · 상동읍)', '평창군(평창읍)', '정선군(정선읍 · 고한읍 · 사북읍 · 신동읍)', '철원군(철원읍 · 김화읍 · 갈말읍 · 동송읍)', '화천군(화천읍)', '양구군(양구읍)', '인제군(인제읍)', '고성군(간성읍 · 거진읍)', '양양군(양양읍)'] },
  { name: '충청북도', districts: ['청주시', '충주시', '제천시', '보은군(보은읍)', '옥천군(옥천읍)', '영동군(영동읍)', '증평군(증평읍)', '진천군(진천읍 · 덕산읍)', '괴산군(괴산읍)', '음성군(음성읍 · 금왕읍 · 대소읍)', '단양군(단양읍 · 매포읍)'] },
  { name: '충청남도', districts: ['천안시', '공주시', '보령시', '아산시', '서산시', '논산시', '계룡시', '당진시', '금산군(금산읍)', '부여군(부여읍)', '서천군(서천읍 · 장항읍)', '청양군(청양읍)', '홍성군(홍성읍 · 광천읍 · 홍북읍)', '예산군(예산읍 · 삽교읍)', '태안군(태안읍 · 안면읍)'] },
  { name: '전북특별자치도', districts: ['전주시', '익산시', '군산시', '정읍시', '남원시', '김제시', '완주군(봉동읍 · 삼례읍 · 용진읍)', '진안군(진안읍)', '무주군(무주읍)', '장수군(장수읍)', '임실군(임실읍)', '순창군(순창읍)', '고창군(고창읍)', '부안군(부안읍)'] },
  { name: '경상북도', districts: ['포항시', '경주시', '김천시', '안동시', '구미시', '영주시', '영천시', '상주시', '문경시', '경산시', '의성군(의성읍)', '청송군(청송읍)', '영양군(영양읍)', '영덕군(영덕읍)', '청도군(청도읍 · 화양읍)', '고령군(대가야읍)', '성주군(성주읍)', '칠곡군(왜관읍 · 북삼읍 · 석적읍)', '예천군(예천읍 · 호명읍)', '봉화군(봉화읍)', '울진군(울진읍 · 평해읍)', '울릉군(울릉읍)'] },
  { name: '경상남도', districts: ['창원시', '김해시', '양산시', '진주시', '거제시', '통영시', '사천시', '밀양시', '의령군(의령읍)', '함안군(가야읍 · 칠원읍)', '창녕군(창녕읍 · 남지읍)', '고성군(고성읍)', '남해군(남해읍)', '하동군(하동읍)', '산청군(산청읍)', '함양군(함양읍)', '거창군(거창읍)', '합천군(합천읍)'] },
  { name: '제주특별자치도', districts: ['제주시', '서귀포시'] },
];

const PRODUCTS = [
  { key: 'card', label: '카드단말기', title: '카드단말기', body: '매장 규모와 업종에 맞춰 카드단말기를 무료로 설치해드립니다. 2인치·3인치 등 원하시는 모델을 상담을 통해 선택하실 수 있으며, 설치비·관리비·위약금·신청비가 전혀 없습니다.', tags: ['무료설치', '위약금 없음', '당일 A/S'] },
  { key: 'wireless', label: '무선단말기', title: '무선 카드단말기 (KIS-8310)', body: '3G/4G(LTE)·와이파이를 지원하는 무선 카드단말기입니다. 배터리 완충 시 종일 사용이 가능해, 매장 안에서 자리를 옮겨가며 결제하거나 배달·포장 응대가 잦은 매장에 적합합니다.', tags: ['LTE·와이파이', '종일 사용', '이동 결제'] },
  { key: 'wired', label: '유선단말기', title: '유선 카드단말기 (KIS-1020)', body: '이더넷 연결을 기본 탑재한 유선 카드단말기입니다. 2인치 써멀 프린터를 사용하며, 카운터가 고정된 매장에서 안정적인 결제 환경을 원하실 때 적합한 모델입니다.', tags: ['이더넷 연결', '안정적 결제', '고정 카운터'] },
  { key: 'bluetooth', label: '블루투스단말기', title: '블루투스 카드단말기 (KIS-BTR 1100)', body: '스마트폰과 블루투스로 연결해 사용하는 카드단말기입니다. 별도 유심이나 인터넷 회선 없이도 결제가 가능해, 플리마켓·팝업스토어처럼 짧은 기간만 운영하는 매장에도 적합합니다.', tags: ['블루투스 연결', '유심 불필요', '팝업·플리마켓'] },
  { key: 'tosspay', label: '토스페이단말기', title: '토스페이먼츠 포스 (탁상형 터치스크린)', body: '탁상 스탠드형 터치스크린 결제 화면을 갖춘 토스페이먼츠 포스입니다. 컴팩트한 디자인으로 좁은 카운터에도 설치가 쉬워, 카페나 소형 매장에 적합합니다.', tags: ['터치스크린', '컴팩트 디자인', '좁은 카운터 OK'] },
];

function baseName(district) {
  return district.replace(/\(.*\)$/, '');
}

function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function topicParticle(name) {
  const code = name.charCodeAt(name.length - 1) - 0xac00;
  if (code < 0 || code > 11171) return '은';
  return code % 28 === 0 ? '는' : '은';
}

function regionSlug(region, product) {
  return `${region.name}-${product.label}`;
}
function districtSlug(region, district, product) {
  return `${region.name}-${baseName(district)}-${product.label}`;
}

function head(title, desc, canonical, keywords) {
  return `<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
<meta name="theme-color" content="#0f1729">
<link rel="icon" type="image/svg+xml" href="/favicon.svg">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large">
<meta name="keywords" content="${esc(keywords)}">
<link rel="canonical" href="${canonical}">
<link rel="stylesheet" href="/assets/area.css">
<link href="https://fonts.googleapis.com/css2?family=Pretendard:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<meta property="og:type" content="website">
<meta property="og:site_name" content="성공적인 창업">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:image" content="${SITE}/images/og-image-v4.jpg">
<meta property="og:url" content="${canonical}">`;
}

function header() {
  return `<header>
  <div class="nav">
    <a class="logo" href="/"><span class="logo-mark">성</span>성공적인 창업</a>
    <a class="nav-cta" href="tel:01039510535">010-3951-0535</a>
  </div>
</header>
<div class="mobile-cta-bar">
  <a class="mobile-cta-call" href="tel:01039510535">☎ 전화 문의</a>
  <a class="mobile-cta-apply" href="/#apply">온라인 신청</a>
</div>`;
}

function footer() {
  return `<footer>
  <div class="wrap">
    <p>© 2026 성공적인 창업. All rights reserved. · <a href="/" style="color:var(--blue);">홈으로</a></p>
  </div>
</footer>`;
}

function faqMini() {
  return `  <div class="area-section faq-mini">
    <h2>자주 묻는 질문</h2>
    <div class="q">설치비·관리비·위약금이 정말 없나요?</div>
    <div class="a">네, 설치비·관리비·위약금·신청비가 전혀 없습니다.</div>
    <div class="q">고장·오류 발생 시 얼마나 빨리 대응해주시나요?</div>
    <div class="a">당일 A/S를 원칙으로 하며, 문제 발생 시 빠르게 방문 대응해드립니다.</div>
  </div>`;
}

function regionPageTemplate(region, product) {
  const title = `${region.name} ${product.label} 설치 | 성공적인 창업`;
  const desc = `${region.name} 지역 ${product.label} 설치 안내. 설치비·관리비·위약금·신청비 없이 ${product.title}을(를) 설치해드립니다.`;
  const canonical = `${SITE}/areas/${encodeURIComponent(regionSlug(region, product))}.html`;
  const keywords = `${region.name}${product.label}, ${region.name} ${product.label} 설치, ${product.label}, ${region.name} 카드단말기`;
  const otherProducts = PRODUCTS.filter(p => p.key !== product.key)
    .map(p => `<a href="/areas/${encodeURIComponent(regionSlug(region, p))}.html">${region.name} ${p.label} 설치</a>`).join('\n        ');
  const districtLinks = region.districts.length
    ? region.districts.map(d => `<a href="/areas/${encodeURIComponent(districtSlug(region, d, product))}.html">${region.name} ${baseName(d)} ${product.label} 설치</a>`).join('\n          ')
    : '';

  return `<!DOCTYPE html>
<html lang="ko">
<head>
${head(title, desc, canonical, keywords)}
</head>
<body>
${header()}
<div class="wrap">
  <div class="breadcrumb"><a href="/">홈</a><span class="sep">/</span><a href="/areas/">서비스 지역</a><span class="sep">/</span><span>${esc(region.name)}</span></div>
  <div class="area-hero">
    <div class="eyebrow">${esc(region.name)} · ${esc(product.label)}</div>
    <h1>${esc(region.name)} ${esc(product.label)} 설치</h1>
    <p>설치비·관리비·위약금·신청비 없이 ${esc(region.name)} 전역에 ${esc(product.title)}을(를) 설치해드립니다.</p>
  </div>
  <div class="area-section">
    <h2>${esc(product.title)}</h2>
    <p>${esc(product.body)}</p>
    <ul class="tag-list">${product.tags.map(t => `<li>${esc(t)}</li>`).join('')}</ul>
  </div>
  <div class="cta-box">
    <p>${esc(region.name)} ${esc(product.label)} 설치, 지금 바로 문의해보세요.</p>
    <div class="btns">
      <a class="btn-blue" href="/#apply">온라인 신청</a>
      <a class="btn-outline" href="tel:01039510535">전화 상담</a>
    </div>
  </div>
${faqMini()}
  <div class="area-section">
    <h2>관련 페이지</h2>
    <div class="related-grid">
      <div class="related-group">
        <h3>${esc(region.name)}의 다른 단말기</h3>
        ${otherProducts}
      </div>
      ${districtLinks ? `<div class="related-group">
        <h3>${esc(region.name)} 시/군/구별 ${esc(product.label)} 설치</h3>
        ${districtLinks}
      </div>` : ''}
    </div>
    <p style="margin-top:16px;"><a href="/areas/" style="color:var(--blue); font-weight:700;">전국 서비스 지역 전체 보기 →</a></p>
  </div>
</div>
${footer()}
</body>
</html>
`;
}

function districtPageTemplate(region, district, product) {
  const district_ = baseName(district);
  const title = `${region.name} ${district_} ${product.label} 설치 | 성공적인 창업`;
  const desc = `${region.name} ${district_} 지역 ${product.label} 설치 안내. 설치비·관리비·위약금·신청비 없이 ${product.title}을(를) 설치해드립니다.`;
  const canonical = `${SITE}/areas/${encodeURIComponent(districtSlug(region, district, product))}.html`;
  const parentUrl = `/areas/${encodeURIComponent(regionSlug(region, product))}.html`;
  const keywords = `${district_}${product.label}, ${district_} ${product.label} 설치, ${region.name}${district_}${product.label}, ${product.label}, ${district_} 카드단말기`;
  const otherProducts = PRODUCTS.filter(p => p.key !== product.key)
    .map(p => `<a href="/areas/${encodeURIComponent(districtSlug(region, district, p))}.html">${district_} ${p.label} 설치</a>`).join('\n        ');
  const hasSub = /\(.*\)$/.test(district);
  const subNote = hasSub ? district.match(/\((.*)\)$/)[1] : '';

  return `<!DOCTYPE html>
<html lang="ko">
<head>
${head(title, desc, canonical, keywords)}
</head>
<body>
${header()}
<div class="wrap">
  <div class="breadcrumb"><a href="/">홈</a><span class="sep">/</span><a href="/areas/">서비스 지역</a><span class="sep">/</span><a href="${parentUrl}">${esc(region.name)}</a><span class="sep">/</span><span>${esc(district_)}</span></div>
  <div class="area-hero">
    <div class="eyebrow">${esc(region.name)} ${esc(district_)} · ${esc(product.label)}</div>
    <h1>${esc(district_)} ${esc(product.label)} 설치</h1>
    <p>설치비·관리비·위약금·신청비 없이 ${esc(district_)} 전역에 ${esc(product.title)}을(를) 설치해드립니다.</p>
  </div>
  <div class="area-section">
    <h2>${esc(product.title)}</h2>
    <p>${esc(product.body)}</p>
    <ul class="tag-list">${product.tags.map(t => `<li>${esc(t)}</li>`).join('')}</ul>
  </div>
  <div class="area-section">
    <h2>${esc(district_)} 설치 안내</h2>
    <p>${esc(district_)}${topicParticle(district_)} <a href="${parentUrl}">${esc(region.name)}</a> 소속 지역으로, 전국 어디서나 동일한 조건(설치비·관리비·위약금·신청비 없음)으로 설치해드립니다.${hasSub ? ` ${esc(district_)} 관내 ${esc(subNote)} 등 모든 읍 지역도 동일하게 설치 가능합니다.` : ''}</p>
  </div>
  <div class="cta-box">
    <p>${esc(district_)} ${esc(product.label)} 설치, 지금 바로 문의해보세요.</p>
    <div class="btns">
      <a class="btn-blue" href="/#apply">온라인 신청</a>
      <a class="btn-outline" href="tel:01039510535">전화 상담</a>
    </div>
  </div>
${faqMini()}
  <div class="area-section">
    <h2>관련 페이지</h2>
    <div class="related-grid">
      <div class="related-group">
        <h3>${esc(district_)}의 다른 단말기</h3>
        ${otherProducts}
      </div>
    </div>
    <p style="margin-top:16px;"><a href="${parentUrl}" style="color:var(--blue); font-weight:700;">${esc(region.name)} 전체 보기 →</a> · <a href="/areas/" style="color:var(--blue); font-weight:700;">전국 서비스 지역 전체 보기 →</a></p>
  </div>
</div>
${footer()}
</body>
</html>
`;
}

function hubTemplate() {
  const groups = REGIONS.map(region => {
    const links = PRODUCTS.map(p => `<a href="/areas/${encodeURIComponent(regionSlug(region, p))}.html">${region.name} ${p.label} 설치</a>`).join('\n          ');
    return `      <div class="related-group" id="${encodeURIComponent(region.name)}" style="margin-bottom:24px;">
        <h3>${esc(region.name)}</h3>
        ${links}
      </div>`;
  }).join('\n');

  return `<!DOCTYPE html>
<html lang="ko">
<head>
${head('전국 서비스 지역 전체 목록 | 성공적인 창업', '전국 16개 광역지자체 × 카드단말기·무선단말기·유선단말기·블루투스단말기·토스페이단말기 설치 안내 페이지 모음입니다.', `${SITE}/areas/`, '전국 카드단말기 설치, 지역별 카드단말기 설치, 무선단말기 설치, 유선단말기 설치, 블루투스단말기 설치, 토스페이단말기 설치')}
</head>
<body>
${header()}
<div class="wrap">
  <div class="breadcrumb"><a href="/">홈</a><span class="sep">/</span><span>서비스 지역</span></div>
  <div class="area-hero">
    <div class="eyebrow">전국 서비스 지역</div>
    <h1>전국 서비스 지역 전체 목록</h1>
    <p>전국 16개 광역지자체 × 카드단말기·무선단말기·유선단말기·블루투스단말기·토스페이단말기로 나눈 설치 안내 페이지입니다. 각 지역 페이지에서 시/군/구 단위 세부 페이지로도 이동할 수 있습니다.</p>
  </div>
  <div class="area-section">
${groups}
  </div>
</div>
${footer()}
</body>
</html>
`;
}

fs.mkdirSync(AREAS_DIR, { recursive: true });

let regionPageCount = 0;
let districtPageCount = 0;
const sitemapEntries = [];

for (const region of REGIONS) {
  for (const product of PRODUCTS) {
    const filename = `${regionSlug(region, product)}.html`;
    fs.writeFileSync(path.join(AREAS_DIR, filename), regionPageTemplate(region, product), 'utf8');
    sitemapEntries.push({ loc: `${SITE}/areas/${encodeURIComponent(filename)}`, priority: '0.5' });
    regionPageCount++;
  }
  for (const district of region.districts) {
    for (const product of PRODUCTS) {
      const filename = `${districtSlug(region, district, product)}.html`;
      fs.writeFileSync(path.join(AREAS_DIR, filename), districtPageTemplate(region, district, product), 'utf8');
      sitemapEntries.push({ loc: `${SITE}/areas/${encodeURIComponent(filename)}`, priority: '0.4' });
      districtPageCount++;
    }
  }
}
fs.writeFileSync(path.join(AREAS_DIR, 'index.html'), hubTemplate(), 'utf8');
sitemapEntries.unshift({ loc: `${SITE}/areas/`, priority: '0.7' });

const today = new Date().toISOString().slice(0, 10);
const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapEntries.map(e => `  <url>
    <loc>${e.loc}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>${e.priority}</priority>
  </url>`).join('\n')}
</urlset>
`;
fs.writeFileSync(path.join(ROOT, 'sitemap-areas.xml'), sitemapXml, 'utf8');

console.log(`Generated ${regionPageCount} region pages + ${districtPageCount} district pages + 1 hub page.`);
console.log(`Wrote sitemap-areas.xml with ${sitemapEntries.length} URLs.`);
