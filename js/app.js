// ================================================================
// MedSmart — Smart Healthcare Supply & Secure Retail System
// ================================================================
'use strict';

const charts = {};
const API_BASE = 'http://localhost:5000/api';

// ─── AUTH ────────────────────────────────────────────────────────
const Auth = {
  _s: null,
  init() { try { const s = localStorage.getItem('ms_session'); if (s) this._s = JSON.parse(s); } catch(e) { this._s = null; } },
  login(s)    { this._s = s; localStorage.setItem('ms_session', JSON.stringify(s)); },
  logout()    { this._s = null; localStorage.removeItem('ms_session'); },
  isLoggedIn(){ return !!this._s; },
  isStore()   { return this._s?.role === 'store'; },
  isUser()    { return this._s?.role === 'user'; },
  session()   { return this._s; },
  phId()      { return this._s?.pharmacyId || null; },
};

// ─── THEME ───────────────────────────────────────────────────────
function _chartTheme(theme) {
  const dark = theme === 'dark';
  Chart.defaults.color       = dark ? '#8899aa' : '#4a5568';
  Chart.defaults.borderColor = dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.07)';
  Object.values(charts).forEach(c => {
    if (c.options.scales) {
      Object.values(c.options.scales).forEach(s => {
        if (s.grid) { s.grid.color = dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.07)'; }
      });
    }
    c.update('none');
  });
}

function toggleTheme() {
  const html = document.documentElement;
  const wasLight = html.getAttribute('data-theme') === 'light';
  const next = wasLight ? 'dark' : 'light';
  html.setAttribute('data-theme', next);
  localStorage.setItem('ms_theme', next);
  _setThemeIcons(next);
  _chartTheme(next);
}

function _setThemeIcons(theme) {
  const sunEl  = document.getElementById('iconSun');
  const moonEl = document.getElementById('iconMoon');
  if (!sunEl || !moonEl) return;
  if (theme === 'dark') {
    sunEl.style.display  = 'inline-flex'; // show sun (click → go light)
    moonEl.style.display = 'none';
  } else {
    sunEl.style.display  = 'none';
    moonEl.style.display = 'inline-flex'; // show moon (click → go dark)
  }
}

function initTheme() {
  const t = localStorage.getItem('ms_theme') || 'dark';
  document.documentElement.setAttribute('data-theme', t);
  _setThemeIcons(t);
  _chartTheme(t);
}

// ─── LOGIN ───────────────────────────────────────────────────────
let _role = null;

function selectRole(role) {
  _role = role;
  const id = role === 'store' ? 'storeLoginForm' : 'userLoginForm';
  document.getElementById('roleSelector').style.display  = 'none';
  const f = document.getElementById(id);
  f.style.display = 'block';
  f.classList.remove('slide-in');
  void f.offsetWidth;
  f.classList.add('slide-in');
}

function resetRole() {
  _role = null;
  document.getElementById('roleSelector').style.display    = 'flex';
  document.getElementById('storeLoginForm').style.display  = 'none';
  document.getElementById('userLoginForm').style.display   = 'none';
}

function loginStore() {
  const pid = document.getElementById('storeSelect').value;
  const pin = document.getElementById('storePinInput').value.trim();
  if (!pid) { _shake('storeSelect'); showToast('Please select your pharmacy.','error'); return; }
  if (!pin) { _shake('storePinInput'); showToast('Please enter your PIN.','error'); return; }
  const acc = MOCK_DATA.storeAccounts.find(a => a.id === pid && a.pin === pin);
  if (!acc)  { _shake('storePinInput'); document.getElementById('storePinInput').value = ''; showToast('Incorrect PIN. Please try again.','error'); return; }
  const btn = document.getElementById('storeLoginBtn');
  btn.textContent = 'Logging in...'; btn.disabled = true;
  setTimeout(() => { Auth.login({ role:'store', pharmacyId:acc.id, name:acc.name }); launchApp(); }, 700);
}

function loginUser() {
  const name  = document.getElementById('userNameInput').value.trim();
  const phone = document.getElementById('userPhoneInput').value.trim();
  if (!name)             { _shake('userNameInput');  showToast('Please enter your name.','error'); return; }
  if (phone.length < 10) { _shake('userPhoneInput'); showToast('Enter a valid 10-digit number.','error'); return; }
  const btn = document.getElementById('userLoginBtn');
  btn.textContent = 'Signing in...'; btn.disabled = true;
  setTimeout(() => { Auth.login({ role:'user', name, phone }); launchApp(); }, 700);
}

function logout() {
  Auth.logout();
  // Reset app visibility
  document.getElementById('appContainer').style.display = 'none';
  document.getElementById('loginPage').style.display    = 'flex';
  resetRole();
  // Reset store form
  const sb = document.getElementById('storeLoginBtn'); if (sb) { sb.textContent = 'Login'; sb.disabled = false; }
  const ub = document.getElementById('userLoginBtn');  if (ub) { ub.textContent = 'Continue'; ub.disabled = false; }
  const pi = document.getElementById('storePinInput'); if (pi) pi.value = '';
  // Hide nav panels
  closeAlertsPanel();
  showToast('Logged out successfully.','success');
}

function _shake(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.style.animation = 'none';
  void el.offsetHeight;
  el.style.animation = 'shake 0.4s ease';
}

function launchApp() {
  document.getElementById('loginPage').style.display    = 'none';
  document.getElementById('appContainer').style.display = 'flex';
  const s = Auth.session();

  // Profile strip
  const initials = s.name.split(' ').map(w => w[0]).join('').substring(0,2).toUpperCase();
  document.getElementById('profileAvatar').textContent = initials;
  document.getElementById('profileName').textContent   = s.name.split(' - ')[0];
  document.getElementById('profileRole').textContent   = Auth.isStore() ? 'Pharmacist' : 'Patient';

  if (Auth.isStore()) {
    document.getElementById('storeNav').style.display = 'block';
    document.getElementById('userNav').style.display  = 'none';
    document.querySelectorAll('.store-only-btn').forEach(b => b.style.display = 'flex');
    activateSection('dashboard');
    initDashboard();
  } else {
    document.getElementById('userNav').style.display  = 'block';
    document.getElementById('storeNav').style.display = 'none';
    document.querySelectorAll('.store-only-btn').forEach(b => b.style.display = 'none');
    _setActive('user-dashboard');
    activateSection('user-dashboard');
    initUserDashboard();
    renderGenericTable();
  }
  renderAlertsPanelContent();
  updateTransferBadge();
  updateAlertsBadge();
}

// ─── ALERTS PANEL ────────────────────────────────────────────────
function toggleAlertsPanel() {
  const panel = document.getElementById('alertsPanel');
  const isOpen = panel.classList.contains('show');
  if (isOpen) closeAlertsPanel();
  else { panel.classList.add('show'); renderAlertsPanelContent(); }
}

function closeAlertsPanel() {
  const panel = document.getElementById('alertsPanel');
  if (panel) panel.classList.remove('show');
}

function renderAlertsPanelContent() {
  const el = document.getElementById('alertsPanelList');
  if (!el) return;
  el.innerHTML = MOCK_DATA.alerts.map(a => `
    <div class="panel-alert-item ${a.type}">
      <div class="panel-alert-dot ${a.type}"></div>
      <div style="flex:1;min-width:0;">
        <div class="panel-alert-msg">${a.msg}</div>
        <div class="panel-alert-time">${a.time}</div>
      </div>
    </div>`).join('');
}

// Close panel when clicking outside
document.addEventListener('click', e => {
  const wrap = document.getElementById('alertsBtnWrap');
  if (wrap && !wrap.contains(e.target)) closeAlertsPanel();
});

// ─── NAVIGATION ──────────────────────────────────────────────────
const PAGE_META = {
  'dashboard':         ['Dashboard',           'Smart Healthcare Supply & Secure Retail System'],
  'user-dashboard':    ['My Dashboard',        'Your personal health portal'],
  'health-alerts':     ['Health Alerts',       'Disease outbreaks and advisories near you'],
  'purchase-history':  ['Purchase History',    'Your medicine purchases and savings'],
  'disease-monitor':   ['Disease Monitor',     'Real-time outbreak tracking from hospital & NGO data'],
  'demand-predict':    ['Demand Forecast',     'AI-powered medicine demand prediction'],
  'suggestions':       ['AI Suggestions',      'Smart inventory recommendations'],
  'inventory':         ['Inventory',           'Real-time stock for your pharmacy'],
  'transfer-requests': ['Stock Transfers',     'Send or request stock between pharmacies'],
  'redistribution':    ['Auto Redistribution', 'Optimize stock distribution across pharmacies'],
  'generic-finder':    ['Medicine Search',       'Compare brand and generic medicines with live pricing'],
  'analytics':         ['Analytics',           'Trends, metrics and actionable insights'],
};

const STORE_ONLY = ['dashboard','disease-monitor','demand-predict','suggestions','inventory','transfer-requests','redistribution','analytics'];

function activateSection(id) {
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  const el = document.getElementById('section-' + id);
  if (el) el.classList.add('active');
  const [title, sub] = PAGE_META[id] || [id, ''];
  document.getElementById('pageTitle').textContent    = title;
  document.getElementById('pageSubtitle').textContent = sub;
}

function _setActive(sectionId) {
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  const btn = document.querySelector(`[data-section="${sectionId}"]`);
  if (btn) btn.classList.add('active');
}

function navigate(sectionId, btn) {
  closeAlertsPanel();
  if (Auth.isUser() && STORE_ONLY.includes(sectionId)) {
    showToast('This section is available for pharmacy staff only.','error'); return;
  }
  _setActive(sectionId);
  activateSection(sectionId);

  if (sectionId === 'disease-monitor') {
    initDiseaseCharts();
    fetchExternalData();
  }
  if (sectionId === 'inventory')         renderInventory();
  if (sectionId === 'redistribution')    initRedistributionChart();
  if (sectionId === 'analytics')         initAnalyticsCharts();
  if (sectionId === 'generic-finder')    renderGenericTable();
  if (sectionId === 'transfer-requests') renderTransferRequests();
  if (sectionId === 'suggestions')       renderSuggestions();
  if (sectionId === 'user-dashboard')    initUserDashboard();
  if (sectionId === 'health-alerts')     renderHealthAlerts();
  if (sectionId === 'purchase-history')  renderPurchaseHistory();
}

// ─── TOAST ───────────────────────────────────────────────────────
function showToast(msg, type='success', dur=3500) {
  const c  = document.getElementById('toastContainer');
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.textContent = msg;
  c.appendChild(el);
  setTimeout(() => { el.style.opacity = '0'; setTimeout(() => el.remove(), 400); }, dur);
}

// ─── COUNTER ANIMATION ───────────────────────────────────────────
function animateCounter(el, target) {
  const dur = 1300, start = Date.now();
  const step = () => {
    const p = Math.min((Date.now()-start)/dur, 1);
    const e = 1 - Math.pow(1-p, 3);
    el.textContent = Math.floor(e*target).toLocaleString('en-IN');
    if (p < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}
function initCounters() {
  document.querySelectorAll('.section.active [data-count]').forEach(el => animateCounter(el, parseInt(el.dataset.count)));
}

// ─── CHART PALETTE ───────────────────────────────────────────────
const CC = {
  purple:'rgba(108,99,255,1)', purpleF:'rgba(108,99,255,0.12)',
  teal:  'rgba(0,212,170,1)',  tealF:  'rgba(0,212,170,0.12)',
  amber: 'rgba(245,166,35,1)', amberF: 'rgba(245,166,35,0.12)',
  red:   'rgba(255,82,82,1)',  redF:   'rgba(255,82,82,0.12)',
  blue:  'rgba(64,169,255,1)', blueF:  'rgba(64,169,255,0.12)',
  green: 'rgba(82,196,26,1)',  greenF: 'rgba(82,196,26,0.12)',
};
function _gc(id) {
  const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
  return isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.07)';
}
function destroyChart(id) { if (charts[id]) { charts[id].destroy(); delete charts[id]; } }

// ─── DASHBOARD ───────────────────────────────────────────────────
function initDashboard() {
  initCounters();
  renderDashAlerts();
  renderDashLowStock();
  initDashTrendChart();
  initDashDonut();
}

function renderDashAlerts() {
  const f = document.getElementById('dashAlertsFeed');
  if (!f) return;
  f.innerHTML = MOCK_DATA.alerts.map(a => `
    <div class="alert-item ${a.type}">
      <div class="alert-dot ${a.type}"></div>
      <span class="alert-msg">${a.msg}</span>
      <span class="alert-time">${a.time}</span>
    </div>`).join('');
}

async function renderDashLowStock() {
  const c = document.getElementById('dashLowStock');
  if (!c) return;
  const phId = Auth.phId();
  try {
    const res = await fetch(`${API_BASE}/inventory/${phId}`);
    const items = await res.json();
    if (!items || !items.length) { c.innerHTML = '<div style="color:var(--text-muted);font-size:13px;">No data. Seed inventory to see stock.</div>'; return; }
    
    const lowStock = items.map(i => ({ ...i, pct: (i.stock/i.threshold)*100 })).sort((a,b)=>a.pct-b.pct).slice(0,5);
    c.innerHTML = lowStock.map(it => {
      const pct = Math.min(it.pct,100).toFixed(0);
      const cls = it.pct < 30 ? 'red' : it.pct < 100 ? 'amber' : 'green';
      return `<div class="stock-row">
        <div class="stock-info">
          <span class="stock-name">${it.medicine}</span>
          <span class="stock-count ${cls === 'red' ? 'critical' : cls === 'amber' ? 'warning' : 'ok'}">${it.stock} / ${it.threshold}</span>
        </div>
        <div class="progress-bar"><div class="progress-fill ${cls}" style="width:${pct}%"></div></div>
      </div>`;
    }).join('');
  } catch (err) {
    c.innerHTML = '<div style="color:var(--text-muted);font-size:13px;">Failed to fetch dashboard stock.</div>';
  }
}

async function initDashTrendChart() {
  destroyChart('dashTrend');
  const ctx = document.getElementById('trendChartDash').getContext('2d');
  const fetchedTrend = await fetchChartTrends();
  const d = fetchedTrend || MOCK_DATA.diseaseTrend;
  charts.dashTrend = new Chart(ctx, {
    type: 'line',
    data: { labels: d.labels, datasets: [
      { label:'Dengue',  data:d.datasets['Dengue'],  borderColor:CC.red,   backgroundColor:CC.redF,   tension:0.4, fill:true,  pointRadius:4, borderWidth:2 },
      { label:'Flu',     data:d.datasets['Flu'],     borderColor:CC.amber, backgroundColor:CC.amberF, tension:0.4, fill:false, pointRadius:4, borderWidth:2 },
      { label:'Malaria', data:d.datasets['Malaria'], borderColor:CC.teal,  backgroundColor:CC.tealF,  tension:0.4, fill:false, pointRadius:4, borderWidth:2 },
    ]},
    options:{ responsive:true, maintainAspectRatio:false,
      plugins:{ legend:{ position:'bottom', labels:{ boxWidth:10, padding:14 } } },
      scales:{ x:{ grid:{ color:_gc() } }, y:{ beginAtZero:true, grid:{ color:_gc() } } }
    }
  });
}

async function initDashDonut() {
  destroyChart('dashDonut');
  const ctx = document.getElementById('demandDonutDash').getContext('2d');
  const phId = Auth.phId();
  
  let labels = ['Paracetamol','Azithromycin','ORS Sachets','Cetirizine','Omeprazole','Other'];
  let values = [35,18,22,12,8,5];

  try {
    const res = await fetch(`${API_BASE}/inventory/${phId}`);
    const items = await res.json();
    if (items && items.length > 0) {
      const sorted = [...items].sort((a,b) => b.stock - a.stock).slice(0, 5);
      labels = sorted.map(s => s.medicine);
      values = sorted.map(s => s.stock);
      const otherStock = items.slice(5).reduce((acc,curr) => acc + curr.stock, 0);
      if (otherStock > 0) {
        labels.push('Other');
        values.push(otherStock);
      }
    }
  } catch (err) { console.warn("Donut fetch failed, using fallback."); }

  charts.dashDonut = new Chart(ctx, {
    type:'doughnut',
    data:{ labels:labels,
      datasets:[{ data:values,
        backgroundColor:[CC.purple,CC.teal,CC.amber,CC.blue,CC.red,CC.green],
        borderWidth:2, borderColor:'transparent' }]
    },
    options:{ responsive:true, maintainAspectRatio:false, cutout:'65%',
      plugins:{ legend:{ position:'right', labels:{ boxWidth:10, padding:10, font:{ size:11 } } } }
    }
  });
}

// ─── USER DASHBOARD ──────────────────────────────────────────────
function initUserDashboard() {
  const s = Auth.session(); if (!s) return;
  document.getElementById('welcomeName').textContent = `Hello, ${s.name}`;
  initCounters();
  renderUserAlerts();
}

function renderUserAlerts() {
  const c = document.getElementById('userAlertsFeed'); if (!c) return;
  c.innerHTML = MOCK_DATA.userHealthAlerts.slice(0,3).map(a => `
    <div class="alert-item ${a.type}" style="margin-bottom:10px;">
      <div class="alert-dot ${a.type}"></div>
      <div style="flex:1;">
        <div style="font-weight:600;font-size:13px;">${a.title}</div>
        <div class="alert-msg" style="margin-top:2px;">${a.msg}</div>
      </div>
      <span class="alert-time">${a.time}</span>
    </div>`).join('');
}

// ─── HEALTH ALERTS (USER) ────────────────────────────────────────
function renderHealthAlerts() {
  const c = document.getElementById('healthAlertsContainer'); if (!c) return;
  c.innerHTML = MOCK_DATA.userHealthAlerts.map(a => `
    <div class="health-alert-card">
      <div class="ha-stripe ${a.type}"></div>
      <div class="ha-body">
        <div class="ha-title">${a.title}</div>
        <div class="ha-msg">${a.msg}</div>
        <div class="ha-time">${a.time}</div>
      </div>
    </div>`).join('');

  const outbreaks = [
    { disease:'Dengue',       cases:145, severity:'HIGH',   advice:'Use mosquito repellent, avoid stagnant water' },
    { disease:'Flu/Influenza',cases:102, severity:'MEDIUM', advice:'Wash hands frequently, consider vaccination' },
    { disease:'Malaria',      cases:28,  severity:'MEDIUM', advice:'Use mosquito nets at night' },
  ];
  const cls = { HIGH:'badge-red', MEDIUM:'badge-amber', LOW:'badge-blue' };
  document.getElementById('userOutbreakList').innerHTML = outbreaks.map(o => `
    <div class="outbreak-row">
      <div class="outbreak-indicator ${o.severity.toLowerCase()}"></div>
      <div style="flex:1;">
        <div style="font-weight:600;font-size:14px;display:flex;align-items:center;gap:8px;">${o.disease} <span class="badge ${cls[o.severity]}">${o.severity}</span></div>
        <div style="font-size:12px;color:var(--text-muted);margin-top:3px;">${o.cases} active cases — ${o.advice}</div>
      </div>
    </div>`).join('');
}

// ─── PURCHASE HISTORY ────────────────────────────────────────────
function renderPurchaseHistory() {
  const tb = document.getElementById('purchaseHistoryBody'); if (!tb) return;
  tb.innerHTML = MOCK_DATA.userPurchaseHistory.map(p => `
    <tr>
      <td style="color:var(--text-muted);">${p.date}</td>
      <td><strong>${p.medicine}</strong></td>
      <td>${p.brand}</td>
      <td><span class="badge ${p.generic ? 'badge-teal' : 'badge-purple'}">${p.generic ? 'Generic' : 'Brand'}</span></td>
      <td>₹${p.price}</td>
      <td style="color:var(--accent-teal);font-weight:600;">${p.saved > 0 ? '₹'+p.saved : '—'}</td>
      <td style="color:var(--text-muted);font-size:12px;">${p.pharmacy}</td>
    </tr>`).join('');
}

// ─── DISEASE MONITOR ─────────────────────────────────────────────
async function renderOutbreakCards() {
  let outbreaks = await fetchOutbreakAlerts();

  if (!outbreaks) {
    outbreaks = [
      { disease:'Dengue',        cases:145, prev:110, severity:'HIGH'   },
      { disease:'Flu/Influenza', cases:102, prev:88,  severity:'MEDIUM' },
      { disease:'Malaria',       cases:28,  prev:20,  severity:'MEDIUM' },
      { disease:'Typhoid',       cases:12,  prev:10,  severity:'LOW'    },
    ];
  } else {
    outbreaks = outbreaks.map(o => ({
      disease: o.disease + ` (${o.region})`,
      cases: o.cases,
      prev: Math.floor(o.cases * (o.trend === 'Rising' ? 0.8 : o.trend === 'Falling' ? 1.2 : 1)),
      severity: o.level
    })).sort((a,b) => b.cases - a.cases).slice(0, 6);
  }
  const clsMap = { HIGH:'badge-red', MEDIUM:'badge-amber', LOW:'badge-blue', CRITICAL:'badge-red' };
  document.getElementById('outbreakCards').innerHTML = outbreaks.map(o => {
    const g = (((o.cases-o.prev)/o.prev)*100).toFixed(0);
    const barCls = o.severity==='HIGH'?'red' : o.severity==='MEDIUM'?'amber':'green';
    return `<div class="outbreak-row">
      <div class="outbreak-indicator ${o.severity.toLowerCase()}"></div>
      <div style="flex:1;">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
          <span style="font-weight:600;font-size:14px;">${o.disease}</span>
          <span class="badge ${clsMap[o.severity]}">${o.severity}</span>
          <span style="font-size:12px;color:var(--accent-red);margin-left:auto;">+${g}%</span>
        </div>
        <div style="font-size:12px;color:var(--text-muted);margin-bottom:6px;">${o.cases} active cases today</div>
        <div class="progress-bar"><div class="progress-fill ${barCls}" style="width:${Math.min(o.cases/1.5,100)}%"></div></div>
      </div>
    </div>`;
  }).join('');
}

async function initDiseaseCharts() {
  await renderOutbreakCards();
  destroyChart('diseaseLine');
  const ctx = document.getElementById('diseaseLineChart').getContext('2d');
  const fetchedTrend = await fetchChartTrends();
  const d = fetchedTrend || MOCK_DATA.diseaseTrend;
  charts.diseaseLine = new Chart(ctx, {
    type:'line',
    data:{ labels:d.labels, datasets:[
      { label:'Dengue',  data:d.datasets['Dengue'],  borderColor:CC.red,   tension:0.4, fill:false, pointRadius:4, borderWidth:2 },
      { label:'Flu',     data:d.datasets['Flu'],     borderColor:CC.amber, tension:0.4, fill:false, pointRadius:4, borderWidth:2 },
      { label:'Malaria', data:d.datasets['Malaria'], borderColor:CC.teal,  tension:0.4, fill:false, pointRadius:4, borderWidth:2 },
      { label:'Typhoid', data:d.datasets['Typhoid'], borderColor:CC.blue,  tension:0.4, fill:false, pointRadius:4, borderWidth:2 },
    ]},
    options:{ responsive:true, maintainAspectRatio:false,
      plugins:{ legend:{ position:'bottom', labels:{ boxWidth:10, padding:14 } } },
      scales:{ x:{ grid:{ color:_gc() } }, y:{ beginAtZero:true, grid:{ color:_gc() } } }
    }
  });
}

function logDiseaseReport() {
  const disease = document.getElementById('diseaseSelect').value;
  const cases   = document.getElementById('casesInput').value;
  if (!disease || !cases) { showToast('Please fill disease and case count.','error'); return; }
  showToast(`Report logged: ${disease} — ${cases} cases.`,'success', 4000);
  setTimeout(() => showToast(`Alert dispatched to all pharmacies.`,'warning', 4000), 2000);
  setTimeout(() => { document.getElementById('forecastDiseaseSelect').value = disease; document.getElementById('forecastCases').value = cases; navigate('demand-predict', document.querySelector('[data-section="demand-predict"]')); runDemandForecast(); }, 3000);
}

function addDiseaseSample() {
  document.getElementById('diseaseSelect').value = 'Dengue';
  document.getElementById('casesInput').value    = 58;
  showToast('Sample data filled. Click Submit to process.','success');
}

// ─── DEMAND FORECAST ─────────────────────────────────────────────
function runDemandForecast() {
  const disease = document.getElementById('forecastDiseaseSelect').value;
  const cases   = parseInt(document.getElementById('forecastCases').value) || 100;
  const growth  = parseFloat(document.getElementById('forecastGrowth').value) || 32;
  const win     = parseInt(document.getElementById('forecastWindow').value) || 7;
  if (!disease) { showToast('Please select a disease.','error'); return; }
  const dd = MOCK_DATA.diseaseDemandMap[disease]; if (!dd) return;
  const predicted = Math.floor(cases * Math.pow(1 + growth/100, win));
  const labels = [], vals = [];
  for (let i=1; i<=win; i++) { labels.push(`Day ${i}`); vals.push(Math.floor(cases * Math.pow(1+growth/100, i))); }
  document.getElementById('forecastDiseaseTitle').textContent = `${disease} Outbreak`;
  document.getElementById('forecastSummary').textContent = `${predicted.toLocaleString('en-IN')} predicted cases over ${win} days`;
  const risk  = predicted > 300 ? 'HIGH' : predicted > 150 ? 'MEDIUM' : 'LOW';
  const badge = document.getElementById('crisisBadge');
  badge.textContent = risk+' RISK'; badge.className = `crisis-badge ${risk==='HIGH'?'high':'medium'}`;
  destroyChart('forecastBar');
  const ctx = document.getElementById('forecastBarChart').getContext('2d');
  charts.forecastBar = new Chart(ctx, {
    type:'bar',
    data:{ labels, datasets:[{ label:'Predicted Cases', data:vals, backgroundColor:vals.map(v=>v>300?CC.red:v>150?CC.amber:CC.teal), borderRadius:5, borderSkipped:false }] },
    options:{ responsive:true, maintainAspectRatio:false, plugins:{ legend:{ display:false } }, scales:{ x:{ grid:{ display:false } }, y:{ beginAtZero:true, grid:{ color:_gc() } } } }
  });
  const base = Math.ceil(predicted * dd.demandMultiplier);
  document.getElementById('predictionItems').innerHTML = dd.medicines.map((m,i) => {
    const u = Math.ceil(base*(1-i*0.15));
    return `<div class="prediction-item"><div class="prediction-info"><div class="prediction-name">${m}</div><div class="prediction-detail">Required across all pharmacies · ${win}-day window</div></div><div class="prediction-units"><div class="units">${u.toLocaleString('en-IN')}</div><div class="units-label">units</div></div></div>`;
  }).join('');
  document.getElementById('predictionOutput').classList.add('show');
  document.getElementById('forecastPlaceholder').style.display = 'none';
  showToast(`Forecast complete for ${disease}.`,'success');
}

// ─── INVENTORY ───────────────────────────────────────────────────
let _editingRow = null; // { phId, medicine }

async function renderInventory() {
  const phId = Auth.phId();
  if (!phId) return;

  let inventoryData = [];
  try {
    const res = await fetch(`${API_BASE}/inventory/${phId}`);
    inventoryData = await res.json();
  } catch (err) {
    console.error("Failed to fetch inventory", err);
  }

  const ph = MOCK_DATA.pharmacies.find(p => p.id === phId) || { name: 'Your Pharmacy', location: '' };

  if (!inventoryData || inventoryData.length === 0) { 
    document.getElementById('inventoryTables').innerHTML = '<div class="card flex-center" style="height:200px;color:var(--text-muted);">No inventory data available. Try seeding the database first!</div>'; 
    return; 
  }

  const sub = document.getElementById('inventorySubtitle');
  if (sub) sub.textContent = `Stock levels for ${ph.name} · ${ph.location}`;

  let critical=0, low=0, total=0;
  inventoryData.forEach(it => { total += it.stock; const p = it.stock/it.threshold; if(p<0.5) critical++; else if(p<1) low++; });

  updateInventoryBadge(inventoryData);

  document.getElementById('invSummaryCards').innerHTML = `
    <div class="stat-card teal"><div class="stat-top"><span class="stat-sup">Total</span></div><div class="stat-value">${total.toLocaleString('en-IN')}</div><div class="stat-label">Units in Stock</div></div>
    <div class="stat-card red"><div class="stat-top"><span class="stat-sup">Urgent</span></div><div class="stat-value">${critical}</div><div class="stat-label">Critical Items</div></div>
    <div class="stat-card amber"><div class="stat-top"><span class="stat-sup">Warning</span></div><div class="stat-value">${low}</div><div class="stat-label">Low Stock</div></div>
    <div class="stat-card green"><div class="stat-top"><span class="stat-sup">Healthy</span></div><div class="stat-value">${inventoryData.length-critical-low}</div><div class="stat-label">Items OK</div></div>`;

  const rows = inventoryData.map(it => {
    const pct    = (it.stock/it.threshold*100).toFixed(0);
    const stCls  = pct < 30 ? 'badge-red' : pct < 100 ? 'badge-amber' : 'badge-green';
    const stLbl  = pct < 30 ? 'Critical'  : pct < 100 ? 'Low'         : 'OK';
    const barCls = pct < 30 ? 'red'       : pct < 100 ? 'amber'        : 'green';
    const safeName = it.medicine.replace(/[^a-z0-9]/gi, '_');
    return `<tr id="invRow_${safeName}">
      <td><strong>${it.medicine}</strong></td>
      <td id="invStockCell_${safeName}">${it.stock}</td>
      <td>${it.threshold}</td>
      <td>${it.sold || 0}</td>
      <td>${it.transferred || 0}</td>
      <td><span class="badge ${stCls}">${stLbl}</span></td>
      <td>
        <div style="display:flex;gap:6px;" id="invActions_${safeName}">
          <button class="btn btn-primary btn-sm" onclick="sellMedicine('${phId}','${it.medicine}')">Sell</button>
          <button class="btn btn-outline btn-sm" onclick="restockMedicine('${phId}','${it.medicine}')">Restock</button>
        </div>
      </td>
    </tr>`;
  }).join('');

  document.getElementById('inventoryTables').innerHTML = `
    <div class="card">
      <div class="table-wrap">
        <table>
          <thead><tr><th>Medicine</th><th>In Stock</th><th>Threshold</th><th>Sold</th><th>Transferred</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </div>`;
}

async function sellMedicine(phId, medicine) {
  // Find current stock from table UI or fetch (UI is faster)
  const row = document.getElementById(`invRow_${medicine.replace(/[^a-z0-9]/gi, '_')}`);
  const stockCell = row ? row.querySelector('[id^="invStockCell_"]') : null;
  const currentStock = stockCell ? parseInt(stockCell.textContent) : 0;

  const qty = prompt(`How many units of ${medicine} are you selling? (Available: ${currentStock})`);
  if (!qty || isNaN(qty) || parseInt(qty) <= 0) return;
  
  if (parseInt(qty) > currentStock) {
    showToast(`Insufficient stock. You only have ${currentStock} units.`, 'error');
    return;
  }
  
  try {
    const res = await fetch(`${API_BASE}/inventory/sell`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pharmacyId: phId, medicine: medicine, quantity: parseInt(qty) })
    });
    const data = await res.json();
    if (data.status === 'success') {
      showToast(data.message, 'success');
      renderInventory();      // Refresh Inventory Tab
      renderDashLowStock();   // Refresh Dashboard Low Stock Card
      initDashDonut();        // Refresh Dashboard Donut Chart
    } else {
      showToast(data.message, 'error');
    }
  } catch (err) {
    showToast('Failed to process sale.', 'error');
  }
}

async function restockMedicine(phId, medicine) {
  const qty = prompt(`How many units of ${medicine} are you restocking?`);
  if (!qty || isNaN(qty) || parseInt(qty) <= 0) return;
  
  try {
    const res = await fetch(`${API_BASE}/inventory/restock`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pharmacyId: phId, medicine: medicine, quantity: parseInt(qty) })
    });
    const data = await res.json();
    if (data.status === 'success') {
      showToast(data.message, 'success');
      renderInventory();
      renderDashLowStock();
      initDashDonut();
    } else {
      showToast(data.message, 'error');
    }
  } catch (err) {
    showToast('Failed to process restock.', 'error');
  }
}

async function seedFullDB() {
  if (!confirm("This will seed master medicines and reset all pharmacy inventory. Continue?")) return;
  
  const originalOverlay = document.getElementById('scanningOverlay');
  if (originalOverlay) {
    originalOverlay.classList.add('show');
    document.getElementById('scanModalTitle').textContent = 'Initializing Database';
    document.getElementById('scanModalSub').textContent = 'Seeding master data & inventory...';
  }

  try {
    // 1. Seed Master Data
    const res1 = await fetch(`${API_BASE}/seed-master`, { method: 'POST' });
    const data1 = await res1.json();
    
    // 2. Seed Inventory
    const res2 = await fetch(`${API_BASE}/seed-inventory`, { method: 'POST' });
    const data2 = await res2.json();
    
    if (data1.status === 'success' && data2.status === 'success') {
      showToast('Database fully initialized!', 'success');
      renderInventory();
      renderDashLowStock();
      initDashDonut();
    } else {
      showToast('Partial failure during seeding: ' + (data1.message || data2.message), 'error');
    }
  } catch (err) {
    showToast('Failed to connect to backend for seeding.', 'error');
    console.error(err);
  } finally {
    if (originalOverlay) originalOverlay.classList.remove('show');
  }
}

function editStockRow(phId, medicine) {
  // Cancel any previous edit
  if (_editingRow) cancelStockEdit(false);
  _editingRow = { phId, medicine };
  const safeName = medicine.replace(/[^a-z0-9]/gi,'_');
  const ph  = MOCK_DATA.pharmacies.find(p => p.id === phId);
  const item = ph?.inventory.find(i => i.medicine === medicine);
  if (!item) return;

  // Replace stock cell with input
  document.getElementById('invStockCell_'+safeName).innerHTML =
    `<input class="form-input inv-edit-input" id="invEditInput_${safeName}" type="number" value="${item.stock}" min="0"/>`;

  // Replace action buttons
  document.getElementById('invActions_'+safeName).innerHTML = `
    <button class="btn btn-primary btn-sm" onclick="saveStockRow('${phId}','${medicine}')">Save</button>
    <button class="btn btn-outline btn-sm" onclick="cancelStockEdit(true)">Cancel</button>`;
}

function saveStockRow(phId, medicine) {
  const safeName = medicine.replace(/[^a-z0-9]/gi,'_');
  const input = document.getElementById('invEditInput_'+safeName);
  const newQty = parseInt(input?.value);
  if (isNaN(newQty) || newQty < 0) { showToast('Please enter a valid quantity.','error'); return; }

  const ph   = MOCK_DATA.pharmacies.find(p => p.id === phId);
  const item = ph?.inventory.find(i => i.medicine === medicine);
  if (item) item.stock = newQty;

  _editingRow = null;
  renderInventory();
  renderDashLowStock();
  showToast(`Stock updated: ${medicine} → ${newQty} units.`,'success');
}

function cancelStockEdit(reRender=true) {
  _editingRow = null;
  if (reRender) renderInventory();
}

function showRestockSuggestions() { showToast('Restock plan generated and sent to procurement.','success',4000); }

// ─── AI SUGGESTIONS ──────────────────────────────────────────────
function generateSuggestions(inventory, phId) {
  if (!inventory || !inventory.length) return [];
  const trends = MOCK_DATA.purchaseTrends?.[phId];
  const outbreaks = [
    { disease:'Dengue',        growth:32, medicines:MOCK_DATA.diseaseDemandMap['Dengue'].medicines },
    { disease:'Flu/Influenza', growth:16, medicines:MOCK_DATA.diseaseDemandMap['Flu/Influenza'].medicines },
    { disease:'Malaria',       growth:9,  medicines:MOCK_DATA.diseaseDemandMap['Malaria'].medicines },
  ];
  return inventory.map(item => {
    const stockPct = (item.stock/item.threshold)*100;
    let velocityScore = 0;
    if (trends?.weeklyData?.[item.medicine]) {
      const d = trends.weeklyData[item.medicine];
      const recent = (d[5]+d[6])/2;
      const base   = (d[0]+d[1]+d[2]+d[3]+d[4])/5;
      velocityScore = base > 0 ? ((recent-base)/base)*100 : 0;
    }
    let diseaseScore = 0, related = [];
    outbreaks.forEach(ob => { if (ob.medicines.includes(item.medicine)) { diseaseScore += ob.growth; related.push(`${ob.disease} (+${ob.growth}%)`); } });
    const stockUrgency = stockPct < 30 ? 60 : stockPct < 70 ? 30 : stockPct < 100 ? 15 : 0;
    const score = Math.min(Math.round(stockUrgency + Math.max(0,velocityScore)*0.4 + diseaseScore*0.3), 100);
    const recQty = Math.max(item.threshold*2-item.stock, Math.round(item.threshold*(1+velocityScore/100)));
    const reason = (() => {
      const p = [];
      if (stockPct < 30) p.push(`Stock critically low (${Math.round(stockPct)}%)`);
      else if (stockPct < 100) p.push(`Below threshold (${Math.round(stockPct)}%)`);
      if (velocityScore > 10) p.push(`Purchase rate up ${Math.round(velocityScore)}%`);
      if (related.length) p.push(`Linked: ${related.join(', ')}`);
      return p.join(' · ') || 'Routine restock recommended';
    })();
    return { medicine:item.medicine, stock:item.stock, threshold:item.threshold, stockPct:Math.round(stockPct), velocityChange:Math.round(velocityScore), related, urgencyScore:score, recommendedQty:Math.max(recQty,0), reason };
  }).filter(s => s.urgencyScore > 5).sort((a,b) => b.urgencyScore - a.urgencyScore);
}

async function renderSuggestions() {
  const phId = Auth.phId() || 'PH001';
  let inventory = [];
  try {
    const res = await fetch(`${API_BASE}/inventory/${phId}`);
    inventory = await res.json();
  } catch (err) {
    console.error("Failed to fetch inventory for suggestions", err);
  }

  const sug = generateSuggestions(inventory, phId);
  const c    = document.getElementById('suggestionsList');
  if (!sug.length) { c.innerHTML = `<div class="card flex-center" style="height:160px;color:var(--text-muted);">${inventory.length ? 'All stock levels healthy.' : 'No inventory data available. Seed DB first.'}</div>`; return; }
  c.innerHTML = sug.map((s,i) => {
    const cls   = s.urgencyScore>=70?'critical':s.urgencyScore>=40?'medium':'low';
    const label = s.urgencyScore>=70?'Critical':s.urgencyScore>=40?'Medium':'Low';
    const barCls = s.stockPct<30?'red':s.stockPct<100?'amber':'green';
    return `<div class="suggestion-card ${cls}">
      <div class="suggestion-header">
        <div class="suggestion-rank">${i+1}</div>
        <div class="suggestion-title"><div class="suggestion-medicine">${s.medicine}</div><div class="suggestion-reason">${s.reason}</div></div>
        <div style="text-align:right;flex-shrink:0;"><span class="suggestion-urgency-badge ${cls}">${label}</span><div class="suggestion-score">Score: ${s.urgencyScore}/100</div></div>
      </div>
      <div class="suggestion-body">
        <div class="suggestion-metrics">
          <div class="metric-item"><div class="metric-label">Current</div><div class="metric-val">${s.stock}</div></div>
          <div class="metric-item"><div class="metric-label">Threshold</div><div class="metric-val">${s.threshold}</div></div>
          <div class="metric-item"><div class="metric-label">Velocity</div><div class="metric-val" style="color:${s.velocityChange>0?'var(--accent-red)':'var(--accent-teal)'}">${s.velocityChange>0?'+':''}${s.velocityChange}%</div></div>
          <div class="metric-item"><div class="metric-label">Order Qty</div><div class="metric-val" style="color:var(--accent-amber);font-weight:700;">${s.recommendedQty}</div></div>
        </div>
        <div style="margin:12px 0 14px;">
          <div style="display:flex;justify-content:space-between;font-size:11px;color:var(--text-muted);margin-bottom:5px;"><span>Stock Health</span><span>${s.stockPct}%</span></div>
          <div class="progress-bar"><div class="progress-fill ${barCls}" style="width:${Math.min(s.stockPct,100)}%"></div></div>
        </div>
        <div style="display:flex;gap:10px;">
          <button class="btn btn-primary btn-sm" onclick="orderNow(this,'${s.medicine}',${s.recommendedQty})">Order ${s.recommendedQty} Units</button>
          <button class="btn btn-outline btn-sm" onclick="this.closest('.suggestion-card').style.opacity='0.4'">Dismiss</button>
        </div>
      </div>
    </div>`;
  }).join('');
  renderPurchaseTrendChart(phId);
}

function orderNow(btn, med, qty) {
  btn.textContent = 'Ordered'; btn.disabled = true;
  showToast(`Order placed: ${qty} units of ${med}.`,'success',4000);
}
function refreshSuggestions() { showToast('Refreshing…','success'); setTimeout(() => { renderSuggestions(); showToast('Suggestions updated.','success'); }, 1200); }

function renderPurchaseTrendChart(phId) {
  destroyChart('purchaseTrend');
  const trends = MOCK_DATA.purchaseTrends?.[phId]; if (!trends) return;
  const ctx = document.getElementById('purchaseTrendChart').getContext('2d');
  const meds = ['Paracetamol','ORS Sachets','Cetirizine'];
  charts.purchaseTrend = new Chart(ctx, {
    type:'line',
    data:{ labels:trends.labels, datasets:meds.map((m,i)=>({
      label:m, data:trends.weeklyData[m]||[], borderColor:[CC.red,CC.teal,CC.amber][i], backgroundColor:[CC.redF,CC.tealF,CC.amberF][i], tension:0.4, fill:i===0, pointRadius:3, borderWidth:2
    })) },
    options:{ responsive:true, maintainAspectRatio:false, plugins:{ legend:{ position:'bottom', labels:{ boxWidth:10, padding:10, font:{ size:11 } } } }, scales:{ x:{ grid:{ color:_gc() } }, y:{ beginAtZero:true, grid:{ color:_gc() } } } }
  });
}

// ─── TRANSFER REQUESTS ───────────────────────────────────────────
let _transferFilter = 'all';
let _transferMode   = 'send'; // 'send' | 'request'

function setTransferMode(mode, btn) {
  _transferMode = mode;
  document.querySelectorAll('.mode-tab').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  const phId = Auth.phId();
  const ph   = MOCK_DATA.pharmacies.find(p => p.id === phId);
  const otherPhs = MOCK_DATA.pharmacies.filter(p => p.id !== phId);

  const hintEl = document.getElementById('transferModeHint');
  const fromSel = document.getElementById('transferFrom');
  const toSel   = document.getElementById('transferTo');
  const lFrom = document.getElementById('labelFrom');
  const lTo   = document.getElementById('labelTo');

  // Re-build the selects based on mode
  const allOpts = MOCK_DATA.pharmacies.map(p => `<option value="${p.id}">${p.name}</option>`).join('');

  if (mode === 'send') {
    hintEl.textContent = 'Sending surplus stock from your store to another pharmacy that needs it.';
    // From = my store (locked), To = others
    fromSel.innerHTML = `<option value="${phId}">${ph?.name || phId}</option>`;
    fromSel.disabled  = true;
    toSel.innerHTML   = `<option value="">Select destination...</option>${otherPhs.map(p=>`<option value="${p.id}">${p.name}</option>`).join('')}`;
    toSel.disabled    = false;
    lFrom.textContent = 'From (Your Store)';
    lTo.textContent   = 'To Pharmacy (Receiving)';
    fromSel.value = phId;
  } else {
    hintEl.textContent = 'Requesting stock from another pharmacy that has surplus. They will need to approve.';
    // From = other pharmacies, To = my store (locked)
    fromSel.innerHTML = `<option value="">Select surplus store...</option>${otherPhs.map(p=>`<option value="${p.id}">${p.name}</option>`).join('')}`;
    fromSel.disabled  = false;
    toSel.innerHTML   = `<option value="${phId}">${ph?.name || phId}</option>`;
    toSel.disabled    = true;
    lFrom.textContent = 'Request From (Surplus Store)';
    lTo.textContent   = 'Your Store (Recipient)';
    toSel.value = phId;
  }
}

function openNewTransferModal() {
  const form = document.getElementById('newTransferForm');
  form.style.display = 'block';
  form.scrollIntoView({ behavior:'smooth' });
  setTransferMode('send', document.getElementById('modeSend'));
}

function closeNewTransferModal() {
  document.getElementById('newTransferForm').style.display = 'none';
}

function submitTransferRequest() {
  const from     = document.getElementById('transferFrom').value;
  const to       = document.getElementById('transferTo').value;
  const medicine = document.getElementById('transferMedicine').value;
  const qty      = parseInt(document.getElementById('transferQty').value);
  const urgency  = document.getElementById('transferUrgency').value;
  const reason   = document.getElementById('transferReason').value;

  if (!from || !to)      { showToast('Please select both pharmacies.','error'); return; }
  if (from === to)       { showToast('Source and destination cannot be the same.','error'); return; }
  if (!medicine)         { showToast('Please select a medicine.','error'); return; }
  if (!qty || qty <= 0)  { showToast('Please enter a valid quantity.','error'); return; }

  const fromPh = MOCK_DATA.pharmacies.find(p=>p.id===from);
  const toPh   = MOCK_DATA.pharmacies.find(p=>p.id===to);
  const typeLabel = _transferMode === 'request' ? 'Stock Request' : 'Transfer';

  MOCK_DATA.transferRequests.unshift({
    id: 'TR'+String(MOCK_DATA.transferRequests.length+1).padStart(3,'0'),
    type: _transferMode,
    fromPharmacy:from, fromName:fromPh?.name||from,
    toPharmacy:to,     toName:toPh?.name||to,
    medicine, quantity:qty, urgency,
    status:'pending',
    reason: reason || `${typeLabel} by ${Auth.session()?.name}`,
    requestedBy: Auth.session()?.name||'Unknown',
    requestedAt: new Date().toISOString(),
  });

  closeNewTransferModal();
  _transferFilter = 'pending';
  renderTransferRequests();
  updateTransferBadge();
  const msg = _transferMode === 'request'
    ? `Stock request sent: ${qty} units of ${medicine} from ${fromPh?.name}.`
    : `Transfer submitted: ${qty} units of ${medicine} to ${toPh?.name}.`;
  showToast(msg,'success',4000);
}

function filterTransfers(f, btn) {
  _transferFilter = f;
  document.querySelectorAll('#transferTabs .tab-btn').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  renderTransferRequests();
}

async function renderTransferRequests() {
  const myPhId = Auth.phId();
  // FILTER: Only show requests where I am sender or receiver
  const all = MOCK_DATA.transferRequests.filter(r => r.fromPharmacy === myPhId || r.toPharmacy === myPhId);
  
  const pending  = all.filter(r=>r.status==='pending').length;
  const approved = all.filter(r=>r.status==='approved').length;
  const rejected = all.filter(r=>r.status==='rejected').length;

  updateTransferBadge();

  document.getElementById('transferStats').innerHTML = `
    <div class="stat-card amber"><div class="stat-top"><span class="stat-sup">Pending</span></div><div class="stat-value">${pending}</div><div class="stat-label">Awaiting Action</div></div>
    <div class="stat-card green"><div class="stat-top"><span class="stat-sup">Done</span></div><div class="stat-value">${approved}</div><div class="stat-label">Approved</div></div>
    <div class="stat-card red"><div class="stat-top"><span class="stat-sup">Declined</span></div><div class="stat-value">${rejected}</div><div class="stat-label">Rejected</div></div>
    <div class="stat-card blue"><div class="stat-top"><span class="stat-sup">All</span></div><div class="stat-value">${all.length}</div><div class="stat-label">Total Transactions</div></div>`;

  // Update Tab Counts
  const tabs = document.querySelectorAll('#transferTabs .tab-btn');
  if (tabs.length >= 2) {
    const pendingSpan = tabs[1].querySelector('.tab-count');
    if (pendingSpan) pendingSpan.textContent = pending;
  }

  const filtered = _transferFilter==='all' ? all : all.filter(r=>r.status===_transferFilter);
  const c = document.getElementById('transferRequestsList');
  if (!filtered.length) { c.innerHTML = `<div class="card flex-center" style="height:160px;color:var(--text-muted);">No ${_transferFilter} requests involving your store.</div>`; return; }

  let myInv = [];
  try {
    const res = await fetch(`${API_BASE}/inventory/${myPhId}`);
    myInv = await res.json();
  } catch (err) { console.error("Failed to fetch inventory for validation"); }

  c.innerHTML = filtered.map(r => {
    const urgCls = r.urgency==='critical'?'badge-red':r.urgency==='medium'?'badge-amber':'badge-teal';
    const stCls  = r.status==='approved'?'badge-green':r.status==='rejected'?'badge-red':'badge-amber';
    const typeCls = r.type==='request'?'badge-purple':'badge-blue';
    const typeLabel = r.type==='request'?'Request IN':'Transfer OUT';
    const date = new Date(r.requestedAt).toLocaleString('en-IN',{dateStyle:'medium',timeStyle:'short'});
    
    // MUTUAL APPROVAL LOGIC
    let actions = "";
    if (r.status === 'pending') {
      const isSender = r.fromPharmacy === myPhId;
      const isReceiver = r.toPharmacy === myPhId;
      
      // If I am the one who needs to approve:
      // Case A: Someone requested from me (I am Sender, it is a 'request')
      // Case B: Someone is sending to me (I am Receiver, it is a 'send')
      const needsMyApproval = (r.type === 'request' && isSender) || (r.type === 'send' && isReceiver);

      if (needsMyApproval) {
        // Validation: Only if I am the sender, I need to check my stock
        const myStock = isSender ? (myInv.find(i => i.medicine === r.medicine)?.stock || 0) : 9999;
        
        if (isSender && myStock < r.quantity) {
          actions = `<div class="tr-actions"><span style="font-size:12px;color:var(--accent-red);font-weight:600;">⚠️ Insufficient Stock (${myStock})</span></div>`;
        } else {
          actions = `
            <div class="tr-actions">
              <button class="btn btn-primary btn-sm" onclick="approveRequest('${r.id}')">${isReceiver ? 'Accept Stock' : 'Approve & Send'}</button>
              <button class="btn btn-danger btn-sm" onclick="rejectRequest('${r.id}')">Reject</button>
            </div>`;
        }
      } else {
        const otherParty = isSender ? r.toPharmacy : r.fromPharmacy;
        actions = `<div class="tr-actions"><span style="font-size:12px;color:var(--text-muted);">Awaiting ${isSender ? 'receiver' : 'sender'} approval</span></div>`;
      }
    }

    return `<div class="transfer-request-card" id="trCard-${r.id}">
      <div class="tr-header">
        <span class="tr-id-badge">${r.id}</span>
        <span class="badge ${typeCls}" style="font-size:10px;">${typeLabel}</span>
        <div class="tr-medicine">${r.medicine} — <strong>${r.quantity} units</strong></div>
        <div style="display:flex;gap:8px;margin-left:auto;">
          <span class="badge ${urgCls}">${r.urgency.charAt(0).toUpperCase()+r.urgency.slice(1)}</span>
          <span class="badge ${stCls}">${r.status.charAt(0).toUpperCase()+r.status.slice(1)}</span>
        </div>
      </div>
      <div class="tr-flow">
        <div class="tr-pharmacy tr-from"><div class="tr-ph-label">FROM</div><div class="tr-ph-name">${r.fromName}</div></div>
        <div class="tr-flow-arrow">→</div>
        <div class="tr-pharmacy tr-to"><div class="tr-ph-label">TO</div><div class="tr-ph-name">${r.toName}</div></div>
      </div>
      <div class="tr-meta"><div class="tr-reason">${r.reason}</div><div class="tr-date">${date} · ${r.requestedBy}</div></div>
      ${actions}
    </div>`;
  }).join('');
}

async function approveRequest(id) {
  const r = MOCK_DATA.transferRequests.find(r=>r.id===id); if(!r) return;
  
  try {
    const res = await fetch(`${API_BASE}/inventory/transfer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fromPharmacy: r.fromPharmacy,
        toPharmacy: r.toPharmacy,
        medicine: r.medicine,
        quantity: r.quantity
      })
    });
    const data = await res.json();
    
    if (data.status === 'success') {
      r.status='approved'; 
      renderTransferRequests(); 
      updateTransferBadge();
      
      // Also update inventory UI if we are looking at it
      if (document.getElementById('section-inventory').classList.contains('active')) {
        renderInventory();
      }
      
      showToast(`${id} approved — ${r.quantity} units of ${r.medicine} confirmed.`,'success',4000);
    } else {
      showToast(`Transfer failed: ${data.message}`, 'error');
    }
  } catch (err) {
    showToast('Failed to connect to backend server for transfer.', 'error');
  }
}
function rejectRequest(id) {
  const r = MOCK_DATA.transferRequests.find(r=>r.id===id); if(!r) return;
  r.status='rejected'; renderTransferRequests(); updateTransferBadge();
  showToast(`${id} rejected.`,'warning');
}
function updateTransferBadge() {
  const phId = Auth.phId();
  const n = MOCK_DATA.transferRequests.filter(r => r.status === 'pending' && (r.fromPharmacy === phId || r.toPharmacy === phId)).length;
  const b = document.getElementById('pendingTransferBadge'); 
  if (b) {
    b.textContent = n;
    b.style.display = n > 0 ? 'inline-flex' : 'none';
  }
}

function updateInventoryBadge(inventory) {
  if (!inventory) return;
  const critical = inventory.filter(it => (it.stock / it.threshold) < 0.5).length;
  const b = document.getElementById('invAlertBadge');
  if (b) {
    b.textContent = critical;
    b.style.display = critical > 0 ? 'inline-flex' : 'none';
  }
}

function updateAlertsBadge() {
  const n = MOCK_DATA.alerts.length;
  const b = document.getElementById('alertsCount');
  if (b) b.textContent = n;
}

// ─── REDISTRIBUTION ──────────────────────────────────────────────
async function initRedistributionChart() {
  destroyChart('redist');
  const ctx = document.getElementById('redistributionChart').getContext('2d');
  const meds = ['Paracetamol','Azithromycin','ORS Sachets','Cetirizine','Omeprazole'];
  
  try {
    // We need all pharmacies to show comparison. 
    // For now, let's fetch individual inventories for the 3 main ones
    const ids = ['PH001', 'PH002', 'PH003'];
    const names = ['MedPlus', 'Apollo', 'Jan Aushadhi'];
    const datasets = [];
    const colors = [CC.purple, CC.teal, CC.amber];
    
    for (let i=0; i<ids.length; i++) {
       const res = await fetch(`${API_BASE}/inventory/${ids[i]}`);
       const inv = await res.json();
       datasets.push({
         label: names[i],
         data: meds.map(m => inv.find(it => it.medicine === m)?.stock || 0),
         backgroundColor: colors[i],
         borderRadius: 4
       });
    }

    charts.redist = new Chart(ctx, {
      type:'bar',
      data:{ labels:meds, datasets: datasets },
      options:{ responsive:true, maintainAspectRatio:false, plugins:{ legend:{ position:'bottom', labels:{ boxWidth:10, padding:12 } } }, scales:{ x:{ grid:{ display:false } }, y:{ beginAtZero:true, grid:{ color:_gc() } } } }
    });
    
    renderRedistributionSuggestions();
  } catch (err) { console.error("Redist Chart Error:", err); }
}

async function renderRedistributionSuggestions() {
  const c = document.getElementById('redistributionList');
  if (!c) return;
  const myPhId = Auth.phId();
  
  try {
    const res = await fetch(`${API_BASE}/redistribution`);
    const data = await res.json();
    const allSug = data.suggestions || [];
    
    // FILTER: Only see suggestions where I am the sender or receiver
    const filtered = allSug.filter(s => s.fromId === myPhId || s.toId === myPhId);
    
    if (!filtered.length) {
      c.innerHTML = `<div class="card flex-center" style="height:120px;color:var(--text-muted);font-size:13px;">No suggestions involving your store at this time.</div>`;
      return;
    }
    
    // Fetch my inventory first for validation
    const invRes = await fetch(`${API_BASE}/inventory/${myPhId}`);
    const myInv = await invRes.json();

    c.innerHTML = filtered.map(s => {
      const isSender = s.fromId === myPhId;
      const urgCls = s.urgency === 'URGENT' ? 'badge-red' : 'badge-amber';
      
      // AUTHORITY & VALIDATION
      let action = "";
      if (isSender) {
        const myStock = myInv.find(i => i.medicine === s.medicine)?.stock || 0;
        if (myStock < s.quantity) {
          action = `<span style="font-size:12px;color:var(--accent-red);font-weight:600;">⚠️ Insufficient Stock (${myStock})</span>`;
        } else {
          action = `<button class="btn btn-primary btn-sm" onclick="executeRedistribution(this, '${s.fromId}', '${s.toId}', '${s.medicine}', ${s.quantity})">Dispatch Now</button>`;
        }
      } else {
        action = `<span style="font-size:12px;color:var(--text-muted);">Awaiting dispatch from ${s.fromName}</span>`;
      }

      return `<div class="transfer-card">
        <div class="transfer-flow">
          <div class="transfer-from">
            <div class="transfer-medicine">${s.medicine}</div>
            <div class="transfer-qty">${s.surplus} units surplus</div>
            <div class="transfer-pharmacy">${s.fromName}</div>
          </div>
          <div class="transfer-arrow">→</div>
          <div class="transfer-to">
            <div class="transfer-medicine">${s.toName}</div>
            <div class="transfer-qty">${s.quantity} units needed</div>
            <div class="transfer-pharmacy">Stock: ${s.current} / Threshold: ${s.threshold}</div>
          </div>
        </div>
        <div style="display:flex;gap:10px;align-items:center;margin-top:12px;">
          ${action}
          <span class="badge ${urgCls}" style="margin-left:auto;">${s.urgency}</span>
        </div>
      </div>`;
    }).join('');
  } catch (err) {
    c.innerHTML = `<div style="color:var(--accent-red);padding:20px;">Failed to load suggestions.</div>`;
  }
}

async function executeRedistribution(btn, from, to, med, qty) {
  try {
    const res = await fetch(`${API_BASE}/inventory/transfer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fromPharmacy: from, toPharmacy: to, medicine: med, quantity: qty })
    });
    const data = await res.json();
    if (data.status === 'success') {
       showToast(`Dispatched ${qty} units of ${med}!`, 'success');
       btn.closest('.transfer-card').style.opacity = '0.4';
       btn.textContent = 'Dispatched';
       btn.disabled = true;
       
       // Real-time refresh across all tabs
       renderInventory();
       renderDashLowStock();
       initDashDonut();
       setTimeout(initRedistributionChart, 1500);
    } else {
       showToast(data.message, 'error');
    }
  } catch (err) {
    showToast('Redistribution failed.', 'error');
  }
}

function runAutoRedistribution() {
  showToast('Recalculating optimization path...', 'success');
  initRedistributionChart();
}

// ─── MEDICINE SEARCH ─────────────────────────────────────────────
let _pendingPurchase = null;

function renderGenericTable() {
  // Quick search pills
  const pills = document.getElementById('quickMedBtns');
  if (pills) {
    pills.innerHTML = MOCK_DATA.genericMap.slice(0, 8).map(m =>
      `<button class="btn btn-outline btn-sm" onclick="selectMed('${m.brand}')">${m.brand}</button>`
    ).join('');
  }
  // Database table
  const tb = document.getElementById('genericTableBody'); if (!tb) return;
  tb.innerHTML = MOCK_DATA.genericMap.map(m => {
    const save = m.brandPrice - m.genericPrice;
    const pct  = ((save / m.brandPrice) * 100).toFixed(0);
    return `<tr>
      <td><strong>${m.brand}</strong></td>
      <td>${m.generic}</td>
      <td style="color:var(--text-muted);font-size:12px;">${m.salt}</td>
      <td style="color:var(--accent-red);">₹${m.brandPrice}</td>
      <td style="color:var(--accent-teal);font-weight:600;">₹${m.genericPrice}</td>
      <td><span class="badge badge-green">Save ₹${save} (${pct}%)</span></td>
      <td><button class="btn btn-outline btn-sm" onclick="selectMed('${m.brand}')">Compare</button></td>
    </tr>`;
  }).join('');
}

function liveSearchMed() {
  const q    = document.getElementById('medSearchInput').value.toLowerCase();
  const sugg = document.getElementById('medSearchSuggestions');
  if (q.length < 1) { sugg.style.display = 'none'; return; }
  const hits = MOCK_DATA.genericMap.filter(m =>
    m.brand.toLowerCase().startsWith(q) ||
    m.generic.toLowerCase().startsWith(q) ||
    m.salt.toLowerCase().includes(q)
  );
  if (!hits.length) { sugg.style.display = 'none'; return; }
  sugg.innerHTML = hits.slice(0, 5).map(m =>
    `<button onclick="selectMed('${m.brand}')" class="med-sugg-btn">
      <strong>${m.brand}</strong> <span style="color:var(--text-muted);">— ${m.salt}</span>
    </button>`
  ).join('');
  sugg.style.display = 'block';
}

function selectMed(brand) {
  const inp = document.getElementById('medSearchInput');
  if (inp) inp.value = brand;
  document.getElementById('medSearchSuggestions').style.display = 'none';
  searchMedicine();
}

function searchMedicine() {
  const q = document.getElementById('medSearchInput').value.trim().toLowerCase();
  if (!q) { showToast('Please enter a medicine name to search.', 'error'); return; }
  document.getElementById('medSearchSuggestions').style.display = 'none';

  const hits = MOCK_DATA.genericMap.filter(m =>
    m.brand.toLowerCase().includes(q) ||
    m.generic.toLowerCase().includes(q) ||
    m.salt.toLowerCase().includes(q)
  );

  const resultsEl     = document.getElementById('medSearchResults');
  const placeholderEl = document.getElementById('medSearchPlaceholder');

  if (!hits.length) {
    placeholderEl.style.display = 'none';
    resultsEl.innerHTML = `
      <div class="card flex-center" style="height:140px;flex-direction:column;">
        <div style="color:var(--text-muted);font-size:14px;">No medicines found for "${q}". Try another name.</div>
      </div>`;
    return;
  }

  placeholderEl.style.display = 'none';
  resultsEl.innerHTML = hits.map(m => {
    const save = m.brandPrice - m.genericPrice;
    const pct  = ((save / m.brandPrice) * 100).toFixed(0);
    return `
      <div class="med-result-card">
        <div class="med-result-header">
          <div>
            <div class="med-result-name">${m.brand} <span class="med-slash">/</span> <span class="med-generic-name">${m.generic}</span></div>
            <div class="med-result-salt">${m.salt}</div>
          </div>
          <span class="badge badge-green">Save ${pct}%</span>
        </div>
        <div class="med-options">
          <div class="med-option brand-opt">
            <div class="med-opt-label">Brand Name</div>
            <div class="med-opt-name">${m.brand}</div>
            <div class="med-opt-mfr">by ${m.brandMfr}</div>
            <div class="med-opt-price brand-price">₹${m.brandPrice} <span class="med-opt-unit">/ strip</span></div>
            <button class="btn btn-outline btn-sm" style="margin-top:auto;" onclick="initiatePurchase('${m.brand}',${m.brandPrice},'brand','${m.generic}','${m.salt}')">
              Buy Brand
            </button>
          </div>
          <div class="med-vs"><span class="vs-chip">VS</span></div>
          <div class="med-option generic-opt">
            <div class="med-opt-label">Generic — Same Formula</div>
            <div class="med-opt-name">${m.generic}</div>
            <div class="med-opt-mfr">by ${m.genericMfr}</div>
            <div class="med-opt-price generic-price">₹${m.genericPrice} <span class="save-inline-chip">Save ₹${save}</span></div>
            <button class="btn btn-primary btn-sm" style="margin-top:auto;" onclick="initiatePurchase('${m.generic}',${m.genericPrice},'generic','${m.brand}','${m.salt}')">
              Buy Generic — Save ${pct}%
            </button>
          </div>
        </div>
      </div>`;
  }).join('');
}

function initiatePurchase(medicine, price, type, altName, salt) {
  _pendingPurchase = { medicine, price, type, altName, salt };
  const typeLbl   = type === 'generic' ? 'Generic Medicine' : 'Brand Medicine';
  const typeColor = type === 'generic' ? 'var(--accent-teal)' : 'var(--accent-red)';
  document.getElementById('modalMedInfo').innerHTML = `
    <div class="modal-med-detail">
      <div style="font-size:17px;font-weight:700;">${medicine}</div>
      <div style="font-size:12px;color:${typeColor};font-weight:600;margin:4px 0;">${typeLbl}</div>
      <div style="font-size:12px;color:var(--text-muted);">${salt}</div>
      <div style="font-size:22px;font-weight:800;color:var(--accent-purple);margin-top:8px;">₹${price}
        <span style="font-size:13px;font-weight:400;color:var(--text-muted);">per strip</span>
      </div>
    </div>`;
  document.getElementById('confirmPurchaseBtn').textContent =
    type === 'generic' ? `Confirm — Buy Generic (₹${price})` : `Confirm — Buy Brand (₹${price})`;
  document.getElementById('disclaimerModal').style.display = 'flex';
}

function handleModalClick(e) {
  if (e.target.id === 'disclaimerModal') closeDisclaimer();
}

function closeDisclaimer() {
  document.getElementById('disclaimerModal').style.display = 'none';
  _pendingPurchase = null;
}

function confirmPurchase() {
  if (!_pendingPurchase) return;
  const p = _pendingPurchase;
  closeDisclaimer();
  const brandEntry = MOCK_DATA.genericMap.find(m => m.generic === p.medicine || m.brand === p.medicine);
  const saved = p.type === 'generic' && brandEntry ? ` You saved ₹${brandEntry.brandPrice - p.price} vs the brand.` : '';
  showToast(`Purchase confirmed: ${p.medicine} — ₹${p.price}.${saved}`, 'success', 5000);
}

// ─── ANALYTICS ───────────────────────────────────────────────────
function initAnalyticsCharts() {
  const d = MOCK_DATA.diseaseTrend;
  destroyChart('analyticsLine');
  charts.analyticsLine = new Chart(document.getElementById('analyticsLineChart').getContext('2d'), {
    type:'line',
    data:{ labels:d.labels, datasets:Object.entries(d.datasets).map(([k,v],i)=>({ label:k, data:v, borderColor:[CC.red,CC.amber,CC.teal,CC.blue][i], tension:0.4, fill:false, pointRadius:4, borderWidth:2 })) },
    options:{ responsive:true, maintainAspectRatio:false, plugins:{ legend:{ position:'bottom', labels:{ boxWidth:10, padding:12 } } }, scales:{ x:{ grid:{ color:_gc() } }, y:{ beginAtZero:true, grid:{ color:_gc() } } } }
  });
  destroyChart('invHealth');
  charts.invHealth = new Chart(document.getElementById('inventoryHealthChart').getContext('2d'), {
    type:'bar',
    data:{ labels:['Paracetamol','Azithromycin','Cetirizine','ORS Sachets','Omeprazole','Amoxicillin'],
      datasets:MOCK_DATA.pharmacies.map((ph,i)=>({ label:ph.name.split(' - ')[0], data:ph.inventory.map(it=>Math.round((it.stock/it.threshold)*100)), backgroundColor:[CC.purple,CC.teal,CC.amber][i], borderRadius:4 })) },
    options:{ responsive:true, maintainAspectRatio:false, plugins:{ legend:{ position:'bottom', labels:{ boxWidth:10, padding:10 } } }, scales:{ x:{ grid:{ display:false } }, y:{ beginAtZero:true, max:300, grid:{ color:_gc() }, ticks:{ callback:v=>v+'%' } } } }
  });
  destroyChart('topMed');
  charts.topMed = new Chart(document.getElementById('topMedChart').getContext('2d'), {
    type:'bar',
    data:{ labels:['Paracetamol','ORS','Azithromycin','Cetirizine','Omeprazole'], datasets:[{ label:'Units Sold', data:[2140,980,650,430,290], backgroundColor:CC.purple, borderRadius:5 }] },
    options:{ responsive:true, maintainAspectRatio:false, indexAxis:'y', plugins:{ legend:{ display:false } }, scales:{ x:{ grid:{ color:_gc() } }, y:{ grid:{ display:false } } } }
  });
  destroyChart('genericAdopt');
  charts.genericAdopt = new Chart(document.getElementById('genericAdoptionChart').getContext('2d'), {
    type:'doughnut',
    data:{ labels:['Generic','Brand'], datasets:[{ data:[62,38], backgroundColor:[CC.teal,CC.purple], borderWidth:2, borderColor:'transparent' }] },
    options:{ responsive:true, maintainAspectRatio:false, cutout:'65%', plugins:{ legend:{ position:'bottom', labels:{ boxWidth:10, padding:12 } } } }
  });
}

// ─── CRISIS SIMULATION ───────────────────────────────────────────
function runCrisisSimulation() {
  showToast('Crisis simulation: Dengue spike detected.','error',3000);
  setTimeout(()=>showToast('Analysing data from 5 hospitals…','warning',3000),1200);
  setTimeout(()=>showToast('Forecast: +350% Paracetamol demand in 7 days.','warning',3000),2800);
  setTimeout(()=>showToast('Alerts dispatched to all 3 pharmacies.','success',4000),4500);
  setTimeout(()=>showToast('Auto-redistribution: 400 units moved Jan Aushadhi → Apollo HSR.','success',4000),6200);
  setTimeout(()=>showToast('Crisis response complete.','success',5000),8000);
}

// ─── INIT ────────────────────────────────────────────────────────
async function checkBackend() {
  const badge = document.getElementById('backendStatus');
  const text  = document.getElementById('statusText');
  if (!badge || !text) return;

  try {
    const res = await fetch('http://localhost:5000/');
    const data = await res.json();
    if (data.status.includes('Running')) {
      badge.classList.add('online');
      text.textContent = 'Backend Online';
      return true;
    }
  } catch (err) {
    badge.classList.remove('online');
    text.textContent = 'Backend Offline';
  }
  return false;
}

document.addEventListener('DOMContentLoaded', () => {
  try {
    Auth.init();
    initTheme();
    checkBackend();
    setInterval(checkBackend, 5000); // Check every 5s
    
    const storePin = document.getElementById('storePinInput');
    if (storePin) storePin.addEventListener('keydown', e => { if(e.key==='Enter') loginStore(); });
    
    const userPhone = document.getElementById('userPhoneInput');
    if (userPhone) userPhone.addEventListener('keydown', e => { if(e.key==='Enter') loginUser(); });
    
    if (Auth.isLoggedIn()) launchApp();
  } catch (err) {
    console.error("App initialization failed:", err);
  }
});

// ─── EXTERNAL DATA (WHO & GOV) ───────────────────────────────────

async function syncExternalData() {
  const btn = document.getElementById('syncExternalBtn');
  const originalHtml = btn.innerHTML;
  btn.innerHTML = 'Syncing...';
  btn.disabled = true;

  try {
    const res = await fetch(`${API_BASE}/sync`, { method: 'POST' });
    const data = await res.json();
    if (data.status === 'success') {
      showToast(data.message, 'success');
      await fetchExternalData();
      if (document.getElementById('section-dashboard').classList.contains('active')) {
        initDashTrendChart();
      }
      if (document.getElementById('section-disease-monitor').classList.contains('active')) {
        initDiseaseCharts();
      }
    } else {
      showToast(data.message, 'error');
    }
  } catch (err) {
    showToast('Failed to connect to backend server.', 'error');
  } finally {
    btn.innerHTML = originalHtml;
    btn.disabled = false;
  }
}

async function fetchExternalData() {
  try {
    const res = await fetch(`${API_BASE}/external-data`);
    const data = await res.json();
    if (data && data.length > 0) {
      renderExternalHealthData(data);
    }
  } catch (err) {
    console.error('External data fetch failed', err);
  }
}

function renderExternalHealthData(sources) {
  const section = document.getElementById('externalHealthSection');
  const container = document.getElementById('externalHealthCards');
  if (!section || !container) return;

  section.style.display = 'block';
  container.innerHTML = sources.map(source => {
    let contentHtml = '';
    
    if (source.source === 'WHO') {
      contentHtml = `
        <div class="table-wrap" style="max-height:200px;overflow-y:auto;">
          <table style="font-size:12px;">
            <thead><tr><th>Country</th><th>Year</th><th>Value</th></tr></thead>
            <tbody>
              ${source.data.map(d => `<tr><td>${d.country}</td><td>${d.year}</td><td>${d.value}</td></tr>`).join('')}
            </tbody>
          </table>
        </div>`;
    } else {
      contentHtml = source.data.map(d => `
        <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid var(--border-color);">
          <div>
            <div style="font-weight:600;font-size:14px;">${d.region}: ${d.disease}</div>
            <div style="font-size:11px;color:var(--text-muted);">${d.cases} cases · ${d.trend}</div>
          </div>
          <span class="badge ${d.level === 'HIGH' ? 'badge-red' : 'badge-amber'}">${d.level}</span>
        </div>`).join('');
    }

    return `
      <div class="card" style="border-left:4px solid var(--accent-purple);">
        <div style="display:flex;justify-content:space-between;margin-bottom:12px;">
          <div style="font-weight:700;color:var(--accent-purple);">${source.source}</div>
          <div style="font-size:11px;color:var(--text-muted);">${source.title}</div>
        </div>
        ${contentHtml}
      </div>`;
  }).join('');
}

async function fetchChartTrends() {
  try {
    const res = await fetch(`${API_BASE}/external-data`);
    const data = await res.json();
    if (data && data.length > 0) {
      const trendDoc = data.find(d => d.type === 'chart_trends');
      if (trendDoc && trendDoc.data) {
        return trendDoc.data;
      }
    }
  } catch (err) {
    console.error('Trend data fetch failed', err);
  }
  return null;
}

async function fetchOutbreakAlerts() {
  try {
    const res = await fetch(`${API_BASE}/external-data`);
    const data = await res.json();
    if (data && data.length > 0) {
      const alertDoc = data.find(d => d.type === 'alerts');
      if (alertDoc && alertDoc.data) {
        return alertDoc.data;
      }
    }
  } catch (err) {
    console.error('Alert data fetch failed', err);
  }
  return null;
}
