/* ==========================================================================
   K-EAS 통합 대시보드 - map.js (초경량 정적 데이터 연동 버전)
   ========================================================================== */

const FACTOR_CONFIG = [
  { key: 'heat',     label: '폭염',     icon: '🌡️', weight: 0.30 },
  { key: 'flood',    label: '홍수',     icon: '🌊', weight: 0.20 },
  { key: 'wildfire', label: '산불',     icon: '🔥', weight: 0.20 },
  { key: 'air',      label: '대기오염', icon: '💨', weight: 0.20 },
  { key: 'urban',    label: '도시화',   icon: '🏙️', weight: 0.10 },
];

const RISK_LEVELS = [
  { max: 30,  label: '낮음',     cls: 'low',     color: '#22C55E' },
  { max: 50,  label: '보통',     cls: 'medium',  color: '#F59E0B' },
  { max: 70,  label: '높음',     cls: 'high',    color: '#EF4444' },
  { max: 100, label: '매우 높음', cls: 'vhigh',   color: '#7C3AED' },
];

let envData          = null;
let tooltip          = null;
let selectedRegionId = null;

// 초기화 함수
async function init() {
  tooltip = document.getElementById('mapTooltip');

  try {
    const [, data] = await Promise.all([
      fetch('/static/map/korea.svg').then(r => r.text()).then(svgText => renderMap(svgText)),
      fetch('/api/environment').then(r => r.json()),
    ]);

    envData = data;
    renderRankList();
    showEmptyState(); 
  } catch (error) {
    console.error("데이터 로드 중 오류가 발생했습니다:", error);
  }
}

// 대한민국 지도 렌더링 세팅
function renderMap(svgText) {
  const container = document.getElementById('mapContainer');
  container.innerHTML = svgText;

  const svg = container.querySelector('svg');
  if (!svg) return;
  
  if (!svg.getAttribute('viewBox')) {
    const w = svg.getAttribute('width') ? svg.getAttribute('width').replace('px', '') : 550;
    const h = svg.getAttribute('height') ? svg.getAttribute('height').replace('px', '') : 700;
    svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
  }

  svg.removeAttribute('width');
  svg.removeAttribute('height');
  svg.style.cssText = 'width: 100%; height: 100%; display: block; margin: auto; object-fit: contain;';

  const pts = svg.querySelector('#points');
  if (pts) pts.style.display = 'none';

  svg.querySelectorAll('path[id^="KR"]').forEach(path => {
    const rid = path.id;
    path.addEventListener('click',      ()  => onMapClick(rid, path));
    path.addEventListener('mouseenter', (e) => showTooltip(e, rid));
    path.addEventListener('mousemove',  (e) => moveTooltip(e));
    path.addEventListener('mouseleave', ()  => hideTooltip());
  });
}

// 지도 및 리스트 클릭 핸들러 (네트워크 요청 제거 ➔ 0초 즉시 로딩)
function onMapClick(rid, pathEl) {
  const regionData = getRegionById(rid);
  if (!regionData) return;

  if (selectedRegionId === rid) {
    clearSelections();
    showEmptyState();
  } else {
    clearSelections();
    selectedRegionId = rid;
    if (pathEl) pathEl.classList.add('selected');
    
    // 로컬 메모리 데이터를 사용해 딜레이 없이 즉각 렌더링
    showResultPanel(regionData);
    highlightRankItem(regionData.name);
  }
}

// 안내 텍스트 영역 구조화
function showEmptyState() {
  document.getElementById('emptyState').classList.remove('hidden');
  document.getElementById('resultState').classList.add('hidden');
  
  const emptyCard = document.querySelector('#emptyState .empty-card');
  if (emptyCard) {
    emptyCard.innerHTML = `
      <div class="empty-msg-box">
        <h3 class="empty-title">지역을 선택하세요</h3>
        <p class="empty-desc">지도에서 원하는 시·도를 클릭하면 분석 결과를 확인합니다</p>
      </div>
    `;
  }
}

// 우측 결과 상세 패널 출력
function showResultPanel(data) {
  document.getElementById('emptyState').classList.add('hidden');
  document.getElementById('resultState').classList.remove('hidden');

  const avg     = calcAvg();
  const rank    = calcRank(data.name);
  const riskInfo = getRiskLevel(data.score);

  document.getElementById('regionName').textContent = data.name;
  document.getElementById('riskLevelBadge').textContent = riskInfo.label;
  document.getElementById('riskLevelBadge').className = `level-badge ${riskInfo.cls}`;
  document.getElementById('rankBadge').textContent  = `전국 ${rank}위 / 17`;

  const diff   = data.score - avg;
  const diffEl = document.getElementById('avgDiff');
  diffEl.textContent = `전국 평균 대비 ${diff >= 0 ? '+' : ''}${diff}점`;
  diffEl.style.color = diff > 0 ? '#EF4444' : '#22C55E';

  animateGauge(data.score, riskInfo.color);
  document.getElementById('gaugeAvg').textContent  = avg + "점";
  document.getElementById('gaugeRank').textContent = `${rank}위`;

  renderFactors(data);
}

function animateGauge(score, color) {
  const arc     = document.getElementById('gaugeArc');
  const scoreEl = document.getElementById('gaugeScore');
  const total   = 204;
  const target  = total - (score / 100) * total;

  arc.style.stroke = color || '#5C657A';
  arc.style.strokeDashoffset = total;

  requestAnimationFrame(() => setTimeout(() => { arc.style.strokeDashoffset = target; }, 40));

  let cur = 0;
  const step = score / 20;
  const t = setInterval(() => {
    cur = Math.min(cur + step, score);
    scoreEl.textContent = Math.round(cur);
    if (cur >= score) clearInterval(t);
  }, 25);
}

function renderFactors(data) {
  const list = document.getElementById('factorList');
  list.innerHTML = '';

  FACTOR_CONFIG.forEach(({ key, label, icon }) => {
    const fd    = data[key] ?? {};
    const score = fd.score ?? 0;
    const src   = fd.source ?? '';
    const risk  = getRiskLevel(score);

    const item = document.createElement('div');
    item.className = 'factor-item';
    item.innerHTML = `
      <div class="factor-header">
        <span class="factor-name"><span class="factor-icon">${icon}</span><strong>${label}</strong><span class="factor-source">${src}</span></span>
        <span class="factor-score"><strong>${score}</strong> <span class="score-max">/100</span></span>
      </div>
      <div class="factor-bar-bg"><div class="factor-bar-fill" data-target="${score}" style="background:${risk.color}"></div></div>`;
    list.appendChild(item);
  });

  setTimeout(() => {
    list.querySelectorAll('.factor-bar-fill').forEach(b => { b.style.width = b.dataset.target + '%'; });
  }, 70);
}

function renderRankList() {
  const sorted = Object.values(envData).sort((a, b) => b.score - a.score);
  const maxScore = sorted[0].score;
  const list = document.getElementById('rankList');
  list.innerHTML = '';

  sorted.forEach((d, i) => {
    const risk = getRiskLevel(d.score);
    const li   = document.createElement('li');
    li.className    = 'rank-item';
    li.dataset.name = d.name;
    li.dataset.id   = d.id;

    li.innerHTML = `
      <span class="rank-num ${i < 3 ? 'top3' : ''}">${i + 1}</span>
      <span class="rank-name-full">${d.name}</span>
      <div class="rank-bar-wrap">
        <div class="rank-bar-bg"><div class="rank-bar-fill" data-target="${Math.round(d.score / maxScore * 100)}" style="background:${risk.color}"></div></div>
        <span class="rank-score">${d.score}</span>
      </div>`;

    li.addEventListener('click', () => {
      const pathEl = document.querySelector(`#mapContainer path#${d.id}`);
      onMapClick(d.id, pathEl);
    });

    list.appendChild(li);
  });

  setTimeout(() => {
    list.querySelectorAll('.rank-bar-fill').forEach(b => { b.style.width = b.dataset.target + '%'; });
  }, 300);
}

function highlightRankItem(name) {
  document.querySelectorAll('.rank-item').forEach(el => {
    el.classList.toggle('active', el.dataset.name === name);
  });
}

// 툴팁 관련 함수
function showTooltip(e, rid) {
  const d = getRegionById(rid);
  if (!d) return;
  const risk = getRiskLevel(d.score);
  tooltip.innerHTML = `<strong>${d.name}</strong>: ${d.score}점 (<span style="color:${risk.color};font-weight:bold;">${risk.label}</span>)`;
  tooltip.style.opacity = '1';
  moveTooltip(e);
}
function moveTooltip(e) {
  tooltip.style.left = (e.clientX + 15) + 'px';
  tooltip.style.top  = (e.clientY - 10)  + 'px';
}
function hideTooltip() { tooltip.style.opacity = '0'; }

function clearSelections() {
  selectedRegionId = null;
  document.querySelectorAll('#mapContainer path').forEach(p => { p.classList.remove('selected'); });
  document.querySelectorAll('.rank-item').forEach(el => { el.classList.remove('active'); });
}

function getRegionById(id) {
  return Object.values(envData).find(d => d.id === id) ?? null;
}

// 메타 데이터 연산 관련 함수
function calcAvg() {
  const vals = Object.values(envData).map(d => 'score' in d ? d.score : 0);
  return vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : 0;
}

function calcRank(name) {
  return Object.values(envData).sort((a, b) => b.score - a.score).findIndex(d => d.name === name) + 1;
}

function getRiskLevel(score) {
  return RISK_LEVELS.find(l => score <= l.max) ?? RISK_LEVELS.at(-1);
}

document.addEventListener('DOMContentLoaded', init);