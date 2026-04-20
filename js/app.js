// ================================================================
// MedSmart — Smart Healthcare Supply & Secure Retail System
// ================================================================
'use strict';

const charts = {};

// ─── CONSTANTS ────────────────────────────────────────────────────
const AUTH_URL = 'http://localhost:3001';

// ─── AUTH ────────────────────────────────────────────────────────
// JWT stored in sessionStorage (cleared on tab close — more secure than localStorage)
const Auth = {
  _s:   null,  // decoded session payload
  _jwt: null,  // raw JWT token

  init() {
    try {
      const raw = sessionStorage.getItem('ms_jwt');
      if (raw) {
        this._jwt = raw;
        this._s   = _decodeJwt(raw);
        // Check expiry
        if (this._s.exp && Date.now() / 1000 > this._s.exp) {
          this.logout(); return;
        }
      }
    } catch (e) { this._s = null; this._jwt = null; }
  },

  login(jwt, userObj) {
    this._jwt = jwt;
    this._s   = { ...(_decodeJwt(jwt) || {}), ...userObj };
    sessionStorage.setItem('ms_jwt', jwt);
  },

  logout() {
    this._s = null; this._jwt = null;
    sessionStorage.removeItem('ms_jwt');
  },

  isLoggedIn()   { return !!this._s; },
  isStore()      { return this._s?.role === 'store'; },
  isUser()       { return this._s?.role === 'patient'; },
  session()      { return this._s; },
  phId()         { return this._s?.storeId || null; },
  token()        { return this._jwt; },
  authHeader()   { return { 'Authorization': `Bearer ${this._jwt}`, 'Content-Type': 'application/json' }; },
};

// Lightweight JWT decoder (no verification — server does that)
function _decodeJwt(token) {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(base64));
  } catch { return null; }
}

// ─── STORES LIST (embedded, mirrors server data) ──────────────────────────
const STORES_LIST = [
  // Apollo Pharmacy
  { id:'PH002',  name:'Apollo Pharmacy — HSR Layout, Bengaluru',         group:'Apollo Pharmacy',    type:'chain' },
  { id:'AP002',  name:'Apollo Pharmacy — Koramangala, Bengaluru',         group:'Apollo Pharmacy',    type:'chain' },
  { id:'AP003',  name:'Apollo Pharmacy — Connaught Place, Delhi',         group:'Apollo Pharmacy',    type:'chain' },
  { id:'AP004',  name:'Apollo Pharmacy — Anna Nagar, Chennai',            group:'Apollo Pharmacy',    type:'chain' },
  { id:'AP005',  name:'Apollo Pharmacy — Banjara Hills, Hyderabad',       group:'Apollo Pharmacy',    type:'chain' },
  // MedPlus
  { id:'PH001',  name:'MedPlus — Koramangala, Bengaluru',                 group:'MedPlus',            type:'chain' },
  { id:'MP002',  name:'MedPlus — Jubilee Hills, Hyderabad',               group:'MedPlus',            type:'chain' },
  { id:'MP003',  name:'MedPlus — Salt Lake, Kolkata',                     group:'MedPlus',            type:'chain' },
  { id:'MP004',  name:'MedPlus — Vadapalani, Chennai',                    group:'MedPlus',            type:'chain' },
  { id:'MP005',  name:'MedPlus — Viman Nagar, Pune',                      group:'MedPlus',            type:'chain' },
  // Jan Aushadhi
  { id:'PH003',  name:'Jan Aushadhi — Indiranagar, Bengaluru',            group:'Jan Aushadhi',       type:'chain' },
  { id:'JA002',  name:'Jan Aushadhi — Lajpat Nagar, Delhi',               group:'Jan Aushadhi',       type:'chain' },
  { id:'JA003',  name:'Jan Aushadhi — Andheri, Mumbai',                   group:'Jan Aushadhi',       type:'chain' },
  { id:'JA004',  name:'Jan Aushadhi — Alwarpet, Chennai',                 group:'Jan Aushadhi',       type:'chain' },
  { id:'JA005',  name:'Jan Aushadhi — Sector 22, Chandigarh',             group:'Jan Aushadhi',       type:'chain' },
  // Netmeds
  { id:'NM001',  name:'Netmeds Pharmacy — T. Nagar, Chennai',             group:'Netmeds',            type:'chain' },
  { id:'NM002',  name:'Netmeds Pharmacy — Whitefield, Bengaluru',         group:'Netmeds',            type:'chain' },
  // 1mg
  { id:'1MG001', name:'1mg Store — Sector 62, Noida',                     group:'1mg',                type:'chain' },
  { id:'1MG002', name:'1mg Store — Gurgaon Cyber Hub',                    group:'1mg',                type:'chain' },
  // PharmEasy
  { id:'PE001',  name:'PharmEasy Hub — Andheri, Mumbai',                  group:'PharmEasy',          type:'chain' },
  { id:'PE002',  name:'PharmEasy Hub — Electronic City, Bengaluru',       group:'PharmEasy',          type:'chain' },
  // Wellness Forever
  { id:'WF001',  name:'Wellness Forever — Bandra, Mumbai',                group:'Wellness Forever',   type:'chain' },
  { id:'WF002',  name:'Wellness Forever — Kothrud, Pune',                 group:'Wellness Forever',   type:'chain' },
  // Healthkart
  { id:'HK001',  name:'Healthkart — Rajouri Garden, Delhi',               group:'Healthkart',         type:'chain' },
  { id:'HK002',  name:'Healthkart — Indiranagar, Bengaluru',              group:'Healthkart',         type:'chain' },
  // Others
  { id:'NPM001', name:'Noble Plus Medical — Nungambakkam, Chennai',       group:'Noble Plus',         type:'chain' },
  { id:'FR001',  name:'Frank Ross Pharmacy — Park Street, Kolkata',       group:'Frank Ross',         type:'chain' },
  { id:'FP001',  name:'Fortis HealthSutra Pharmacy — Gurugram',           group:'Fortis HealthSutra', type:'chain' },
  { id:'MAN001', name:'Manipal Hospital Pharmacy — Old Airport Rd, Blr',  group:'Manipal',            type:'chain' },
  { id:'SD001',  name:'Sagar Drugs & Pharmaceuticals — Bengaluru',        group:'Sagar Drugs',        type:'chain' },
  { id:'SP001',  name:'Sparsh Pharmacy — Yeshwanthpur, Bengaluru',        group:'Sparsh',             type:'chain' },
  // Local
  { id:'LOCAL',  name:'+ Register My Local / Independent Pharmacy',       group:'',                   type:'local' },
];

// Demo PINs (only for pre-seeded stores)
const DEMO_PINS = {
  'PH002':'5678','PH001':'1234','PH003':'9012',
};

// ─── STORE SEARCH DROPDOWN ────────────────────────────────────────────────
let _selectedStore = null;

function filterStoreDropdown() {
  const q    = (document.getElementById('storeSearchInput')?.value || '').toLowerCase().trim();
  const dd   = document.getElementById('storeDropdown');
  if (!dd) return;

  const filtered = q
    ? STORES_LIST.filter(s => s.name.toLowerCase().includes(q) || s.group.toLowerCase().includes(q))
    : STORES_LIST;

  if (!filtered.length) { dd.innerHTML = '<div style="padding:12px 14px;color:var(--text-muted);font-size:13px;">No pharmacies found</div>'; dd.classList.add('open'); return; }

  // Group by chain name
  const groups = {};
  filtered.forEach(s => {
    const g = s.group || 'Other';
    if (!groups[g]) groups[g] = [];
    groups[g].push(s);
  });

  let html = '';
  Object.entries(groups).forEach(([grp, items]) => {
    if (grp) html += `<div class="store-dropdown-group">${grp}</div>`;
    items.forEach(s => {
      const isLocal = s.type === 'local';
      html += `<div class="store-dropdown-item${isLocal ? ' local-item' : ''}" onclick="selectStore('${s.id}','${s.type}','${s.name.replace(/'/g, "&apos;")}')"><span class="store-chain-dot${isLocal ? ' local' : ''}"></span>${s.name}</div>`;
    });
  });

  dd.innerHTML = html;
  dd.classList.add('open');
}

function selectStore(id, type, name) {
  _selectedStore = { id, type, name };
  document.getElementById('storeSearchInput').value = '';
  document.getElementById('storeDropdown').classList.remove('open');

  // Show selected pill
  const pill = document.getElementById('selectedStorePill');
  pill.innerHTML = `<span>${name}</span><button class="pill-clear" onclick="clearStoreSelection()">×</button>`;
  pill.style.display = 'flex';

  // Show correct section
  document.getElementById('storePinSection').style.display      = 'none';
  document.getElementById('storeEmailSection').style.display    = 'none';
  document.getElementById('storeRegisterSection').style.display = 'none';
  _clearAuthErrors();

  if (type === 'local') {
    document.getElementById('storeRegisterSection').style.display = 'block';
  } else {
    document.getElementById('storePinSection').style.display = 'block';
    document.getElementById('storePinInput').focus();
  }
}

function clearStoreSelection() {
  _selectedStore = null;
  document.getElementById('selectedStorePill').style.display    = 'none';
  document.getElementById('storePinSection').style.display      = 'none';
  document.getElementById('storeEmailSection').style.display    = 'none';
  document.getElementById('storeRegisterSection').style.display = 'none';
  document.getElementById('storeSearchInput').value = '';
  _clearAuthErrors();
}

// Close dropdown on outside click
document.addEventListener('click', e => {
  const dd = document.getElementById('storeDropdown');
  const inp = document.getElementById('storeSearchInput');
  if (dd && inp && !dd.contains(e.target) && e.target !== inp) {
    dd.classList.remove('open');
  }
});

// ─── ROLE SELECTOR ────────────────────────────────────────────────────────
let _role = null;

function selectRole(role) {
  _role = role;
  const id = role === 'store' ? 'storeLoginForm' : 'userLoginForm';
  document.getElementById('roleSelector').style.display = 'none';
  const f = document.getElementById(id);
  f.style.display = 'block';
  f.classList.remove('slide-in');
  void f.offsetWidth;
  f.classList.add('slide-in');

  // Populate store dropdown on open
  if (role === 'store') filterStoreDropdown();
}

function resetRole() {
  _role = null;
  document.getElementById('roleSelector').style.display = 'flex';
  document.getElementById('storeLoginForm').style.display = 'none';
  document.getElementById('userLoginForm').style.display  = 'none';
  clearStoreSelection();
}

// ─── AUTH-TAB SWITCHER (Login / Sign Up) ──────────────────────────────────
function switchAuthTab(tab) {
  const isLogin = tab === 'login';
  document.getElementById('tabLogin').classList.toggle('active', isLogin);
  document.getElementById('tabSignup').classList.toggle('active', !isLogin);
  document.getElementById('panelLogin').style.display  = isLogin ? 'block' : 'none';
  document.getElementById('panelSignup').style.display = isLogin ? 'none'  : 'block';
  _clearAuthErrors();
}

// ─── PASSWORD SHOW/HIDE ───────────────────────────────────────────────────
function togglePinVisibility(inputId, iconId) {
  const inp = document.getElementById(inputId);
  if (!inp) return;
  inp.type = inp.type === 'password' ? 'text' : 'password';
}

// ─── PASSWORD STRENGTH ─────────────────────────────────────────────────────
function checkPasswordStrength(pw) {
  const bar   = document.getElementById('pwStrengthFill');
  const label = document.getElementById('pwStrengthLabel');
  if (!bar || !label) return;

  let score = 0;
  if (pw.length >= 8)            score++;
  if (/[A-Z]/.test(pw))         score++;
  if (/[0-9]/.test(pw))         score++;
  if (/[^A-Za-z0-9]/.test(pw))  score++;
  if (pw.length >= 12)           score++;

  const levels = [
    { pct: '0%',   color: 'var(--accent-red)',    text: '' },
    { pct: '25%',  color: 'var(--accent-red)',    text: 'Weak' },
    { pct: '50%',  color: 'var(--accent-amber)',  text: 'Fair' },
    { pct: '75%',  color: 'var(--accent-amber)',  text: 'Good' },
    { pct: '90%',  color: 'var(--accent-teal)',   text: 'Strong' },
    { pct: '100%', color: 'var(--accent-green)',  text: 'Very Strong' },
  ];
  const lvl = levels[Math.min(score, 5)];
  bar.style.width      = lvl.pct;
  bar.style.background = lvl.color;
  label.textContent    = lvl.text;
  label.style.color    = score > 3 ? 'var(--accent-teal)' : score > 1 ? 'var(--accent-amber)' : 'var(--accent-red)';
}

// ─── SOCIAL OAUTH ───────────────────────────────────────────────────────────
function socialLogin(provider) {
  if (!['google', 'microsoft'].includes(provider)) return;
  // Redirect browser to the auth server OAuth endpoint
  // After success, the server redirects back with ?oauth_token=<jwt>&provider=<name>
  window.location.href = `${AUTH_URL}/auth/${provider}`;
}

// Called on page load — check if we just came back from an OAuth redirect
function _handleOAuthCallback() {
  const params = new URLSearchParams(window.location.search);
  const token  = params.get('oauth_token');
  const providerName = params.get('provider');
  const oauthError   = params.get('oauth_error');
  const reason       = params.get('reason');

  // Clean the URL regardless
  if (token || oauthError) {
    window.history.replaceState({}, document.title, window.location.pathname);
  }

  if (oauthError) {
    let msg = oauthError === 'google_failed'
      ? 'Google sign-in failed. Please try again.'
      : 'Microsoft sign-in failed. Please try again.';
    if (reason) {
      msg += ` (Reason: ${reason})`;
      console.error('[OAuth Error]', oauthError, reason);
    }
    showToast(msg, 'error', 5000);
    return;
  }

  if (token) {
    try {
      const payload = _decodeJwt(token);
      if (!payload) { showToast('Invalid session token. Please log in again.', 'error'); return; }
      if (payload.exp && Date.now() / 1000 > payload.exp) { showToast('Session expired. Please log in again.', 'error'); return; }

      Auth.login(token, payload);
      const name = payload.name || payload.email?.split('@')[0] || 'User';
      const prov = providerName ? providerName.charAt(0).toUpperCase() + providerName.slice(1) : 'OAuth';
      showToast(`Welcome, ${name}! Signed in with ${prov}.`, 'success', 4000);
      launchApp();
    } catch (e) {
      showToast('Sign-in error. Please try again.', 'error');
    }
  }
}

// ─── ERROR HELPERS ─────────────────────────────────────────────────────────
function _showError(elId, msg) {
  const el = document.getElementById(elId);
  if (!el) return;
  el.textContent = msg;
  el.style.display = 'block';
}
function _hideError(elId) {
  const el = document.getElementById(elId);
  if (el) el.style.display = 'none';
}
function _clearAuthErrors() {
  ['loginError','signupError','storeLoginError','storeEmailLoginError','storeRegError','profileSaveError']
    .forEach(_hideError);
}

// ─── PATIENT LOGIN ──────────────────────────────────────────────────────────
async function loginUser() {
  const email    = (document.getElementById('loginEmail')?.value    || '').trim();
  const password = (document.getElementById('loginPassword')?.value || '').trim();
  _hideError('loginError');

  if (!email)    { _shake('loginEmail');    _showError('loginError', 'Email is required.'); return; }
  if (!password) { _shake('loginPassword'); _showError('loginError', 'Password is required.'); return; }

  const btn = document.getElementById('userLoginBtn');
  _setBtnLoading(btn, 'Signing in…');

  try {
    const res  = await fetch(`${AUTH_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();

    if (!res.ok) {
      _showError('loginError', data.error || 'Login failed.');
      _shake('loginPassword');
      document.getElementById('loginPassword').value = '';
      return;
    }

    Auth.login(data.token, { ...data.user, role: 'patient' });
    launchApp();
  } catch (err) {
    // Auth server offline — allow demo login
    _showError('loginError', 'Auth server offline. Using demo mode.');
    setTimeout(() => {
      _hideError('loginError');
      Auth.login('demo_patient_token', { role: 'patient', email, name: email.split('@')[0], profile: { name: email.split('@')[0] } });
      launchApp();
    }, 1500);
  } finally {
    _resetBtn(btn, 'Log In');
  }
}

// ─── PATIENT SIGNUP ──────────────────────────────────────────────────────────
async function signupUser() {
  const name     = (document.getElementById('signupName')?.value     || '').trim();
  const email    = (document.getElementById('signupEmail')?.value    || '').trim();
  const password = (document.getElementById('signupPassword')?.value || '').trim();
  _hideError('signupError');

  if (!name)     { _shake('signupName');     _showError('signupError', 'Full name is required.'); return; }
  if (!email)    { _shake('signupEmail');     _showError('signupError', 'Email is required.'); return; }
  if (!password) { _shake('signupPassword'); _showError('signupError', 'Password is required.'); return; }

  const btn = document.getElementById('signupBtn');
  _setBtnLoading(btn, 'Creating account…');

  try {
    const res  = await fetch(`${AUTH_URL}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name }),
    });
    const data = await res.json();

    if (!res.ok) {
      const msg = data.errors ? data.errors.map(e => e.msg).join(' · ') : (data.error || 'Sign up failed.');
      _showError('signupError', msg);
      return;
    }

    Auth.login(data.token, { ...data.user, role: 'patient' });
    showToast(`Welcome to MedSmart, ${name}!`, 'success', 4000);
    launchApp();
  } catch (err) {
    // Demo fallback
    _showError('signupError', 'Auth server offline. Using demo mode.');
    setTimeout(() => {
      _hideError('signupError');
      Auth.login('demo_patient_token', { role: 'patient', email, name, profile: { name } });
      showToast(`Welcome, ${name}! (demo mode)`, 'success', 4000);
      launchApp();
    }, 1500);
  } finally {
    _resetBtn(btn, 'Create Account');
  }
}

// ─── STORE LOGIN (PIN — chain stores) ─────────────────────────────────────
async function loginStore() {
  if (!_selectedStore) { showToast('Please select a pharmacy first.', 'error'); return; }
  const pin = (document.getElementById('storePinInput')?.value || '').trim();
  _hideError('storeLoginError');

  if (!pin) { _shake('storePinInput'); _showError('storeLoginError', 'Please enter your PIN.'); return; }

  const btn = document.getElementById('storeLoginBtn');
  _setBtnLoading(btn, 'Logging in…');

  try {
    const res  = await fetch(`${AUTH_URL}/auth/store-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ storeId: _selectedStore.id, pin }),
    });
    const data = await res.json();

    if (!res.ok) {
      _showError('storeLoginError', data.error || 'Login failed.');
      document.getElementById('storePinInput').value = '';
      _shake('storePinInput');
      return;
    }

    Auth.login(data.token, { ...data.user, role: 'store', storeName: _selectedStore.name });
    launchApp();
  } catch (err) {
    // Demo fallback — check demo PINs
    const correct = DEMO_PINS[_selectedStore.id] || '0000';
    if (pin !== correct) {
      _showError('storeLoginError', `Incorrect PIN. Demo PIN for this store: ${correct}`);
      document.getElementById('storePinInput').value = '';
      return;
    }
    Auth.login('demo_store_token', { role: 'store', storeId: _selectedStore.id, storeName: _selectedStore.name, name: _selectedStore.name, profile: { name: _selectedStore.name } });
    launchApp();
  } finally {
    _resetBtn(btn, 'Login to Dashboard');
  }
}

// ─── STORE LOGIN (email+password — registered local stores) ───────────────
async function loginStoreEmail() {
  const email    = (document.getElementById('storeEmailInput')?.value    || '').trim();
  const password = (document.getElementById('storePasswordInput')?.value || '').trim();
  _hideError('storeEmailLoginError');

  if (!email)    { _shake('storeEmailInput');    _showError('storeEmailLoginError', 'Email is required.'); return; }
  if (!password) { _shake('storePasswordInput'); _showError('storeEmailLoginError', 'Password is required.'); return; }

  const btn = document.getElementById('storeEmailLoginBtn');
  _setBtnLoading(btn, 'Logging in…');

  try {
    const res  = await fetch(`${AUTH_URL}/auth/store-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();

    if (!res.ok) {
      _showError('storeEmailLoginError', data.error || 'Login failed.');
      document.getElementById('storePasswordInput').value = '';
      return;
    }

    Auth.login(data.token, { ...data.user, role: 'store' });
    launchApp();
  } catch (err) {
    _showError('storeEmailLoginError', 'Auth server offline. Please start the auth server.');
  } finally {
    _resetBtn(btn, 'Login');
  }
}

// ─── LOCAL STORE REGISTRATION ─────────────────────────────────────────────
async function registerLocalStore() {
  const fields = {
    storeName: document.getElementById('regStoreName')?.value.trim(),
    ownerName: document.getElementById('regOwnerName')?.value.trim(),
    email:     document.getElementById('regEmail')?.value.trim(),
    password:  document.getElementById('regPassword')?.value.trim(),
    phone:     document.getElementById('regPhone')?.value.trim(),
    licenseNo: document.getElementById('regLicense')?.value.trim(),
    address:   document.getElementById('regAddress')?.value.trim(),
    city:      document.getElementById('regCity')?.value.trim(),
    pincode:   document.getElementById('regPincode')?.value.trim(),
  };
  _hideError('storeRegError');

  const required = ['storeName','ownerName','email','password','phone','licenseNo','address','city','pincode'];
  for (const f of required) {
    if (!fields[f]) { _shake('reg' + f.charAt(0).toUpperCase() + f.slice(1)); _showError('storeRegError', `${f.replace(/([A-Z])/g,' $1')} is required.`); return; }
  }
  if (!/\S+@\S+\.\S+/.test(fields.email)) { _showError('storeRegError', 'Enter a valid email address.'); return; }
  if (fields.password.length < 8 || !/[A-Z]/.test(fields.password) || !/[0-9]/.test(fields.password)) {
    _showError('storeRegError', 'Password must be 8+ chars with at least one uppercase letter and one number.'); return;
  }

  const btn = document.getElementById('storeRegBtn');
  _setBtnLoading(btn, 'Registering…');

  try {
    const res  = await fetch(`${AUTH_URL}/auth/store-register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fields),
    });
    const data = await res.json();

    if (!res.ok) {
      const msg = data.errors ? data.errors.map(e => e.msg).join(' · ') : (data.error || 'Registration failed.');
      _showError('storeRegError', msg);
      return;
    }

    Auth.login(data.token, { ...data.user, role: 'store' });
    showToast(`${fields.storeName} registered successfully!`, 'success', 4000);
    launchApp();
  } catch (err) {
    // Demo fallback
    _showError('storeRegError', 'Auth server offline — registering in demo mode.');
    setTimeout(() => {
      _hideError('storeRegError');
      Auth.login('demo_local_store_token', { role: 'store', storeId: 'LOCAL_DEMO', storeName: fields.storeName, name: fields.storeName, profile: { name: fields.ownerName } });
      showToast(`${fields.storeName} registered! (demo mode)`, 'success', 4000);
      launchApp();
    }, 1500);
  } finally {
    _resetBtn(btn, 'Register Pharmacy');
  }
}

// ─── BTN HELPERS ───────────────────────────────────────────────────────────
function _setBtnLoading(btn, text) {
  if (!btn) return;
  btn.dataset.origText = btn.textContent;
  btn.textContent = text;
  btn.disabled = true;
}
function _resetBtn(btn, fallbackText) {
  if (!btn) return;
  btn.textContent = btn.dataset.origText || fallbackText;
  btn.disabled = false;
}

// ─── LOGOUT ────────────────────────────────────────────────────────────────
function logout() {
  Auth.logout();
  document.getElementById('appContainer').style.display = 'none';
  document.getElementById('loginPage').style.display    = 'flex';
  closeProfilePopup();
  closeProfileModal();
  resetRole();
  switchAuthTab('login');
  // Reset form fields
  ['loginEmail','loginPassword','signupName','signupEmail','signupPassword','storePinInput','storeEmailInput','storePasswordInput'].forEach(id => {
    const el = document.getElementById(id); if (el) el.value = '';
  });
  ['userLoginBtn','signupBtn','storeLoginBtn','storeEmailLoginBtn','storeRegBtn'].forEach(id => {
    const btn = document.getElementById(id); if (btn) { btn.disabled = false; }
  });
  closeAlertsPanel();
  showToast('Logged out successfully.', 'success');
}

// ─── SHAKE ANIMATION ───────────────────────────────────────────────────────
function _shake(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.style.animation = 'none';
  void el.offsetHeight;
  el.style.animation = 'shake 0.4s ease';
}

// ─── LAUNCH APP ─────────────────────────────────────────────────────────────
function launchApp() {
  document.getElementById('loginPage').style.display   = 'none';
  document.getElementById('appContainer').style.display = 'flex';
  const s = Auth.session();

  const displayName = s?.profile?.name || s?.storeName || s?.name || s?.email?.split('@')[0] || 'User';
  const initials = displayName.split(' ').map(w => w[0] || '').join('').substring(0, 2).toUpperCase() || 'U';
  document.getElementById('profileAvatar').textContent = initials;
  document.getElementById('profileName').textContent   = displayName.split(' - ')[0];
  document.getElementById('profileRole').textContent   = Auth.isStore() ? 'Pharmacist' : 'Patient';

  if (Auth.isStore()) {
    document.getElementById('storeNav').style.display = 'block';
    document.getElementById('userNav').style.display  = 'none';
    document.querySelectorAll('.store-only-btn').forEach(b => b.style.display = 'flex');
    activateSection('dashboard');
    // Map storeId to a known pharmacyId for inventory, or default to PH001
    if (!MOCK_DATA.pharmacies.find(p => p.id === Auth.phId())) {
      Auth._s.storeId = 'PH001';
    }
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
}

// ─── PROFILE POPUP (sidebar) ───────────────────────────────────────────────
function toggleProfilePopup() {
  const popup = document.getElementById('profilePopup');
  if (!popup) return;
  const isOpen = popup.style.display !== 'none';
  if (isOpen) closeProfilePopup();
  else { popup.style.display = 'block'; }
}
function closeProfilePopup() {
  const popup = document.getElementById('profilePopup');
  if (popup) popup.style.display = 'none';
}
// Close popup on outside click
document.addEventListener('click', e => {
  const footer = document.querySelector('.sidebar-footer');
  const popup  = document.getElementById('profilePopup');
  if (popup && footer && !footer.contains(e.target)) closeProfilePopup();
});

// ─── PROFILE MODAL ─────────────────────────────────────────────────────────
async function openProfileModal() {
  document.getElementById('profileModal').classList.add('show');

  // Populate from auth session (instant)
  const s = Auth.session();
  const p = s?.profile || {};
  const displayName = p.name || s?.name || s?.email?.split('@')[0] || '—';
  const email       = s?.email || '—';
  const role        = Auth.isStore() ? 'Pharmacist' : 'Patient';
  const initials    = displayName.split(' ').map(w => w[0] || '').join('').substring(0, 2).toUpperCase();

  document.getElementById('pmAvatar').textContent   = initials;
  document.getElementById('pmName').textContent     = displayName;
  document.getElementById('pmEmail').textContent    = email;
  document.getElementById('pmRolePill').textContent = role;
  document.getElementById('profileModalSub').textContent = `${role} account — ${email}`;

  _fillProfileFields(p, email);

  // Fetch latest from server if online
  if (Auth.token() && !Auth.token().startsWith('demo_')) {
    try {
      const res  = await fetch(`${AUTH_URL}/profile`, { headers: Auth.authHeader() });
      const data = await res.json();
      if (data.success && data.user?.profile) {
        // Merge into session
        Auth._s.profile = data.user.profile;
        Auth._s.email   = data.user.email;
        sessionStorage.setItem('ms_jwt', Auth._jwt); // keep token, update _s
        _fillProfileFields(data.user.profile, data.user.email);
        document.getElementById('pmName').textContent  = data.user.profile.name  || displayName;
        document.getElementById('pmEmail').textContent = data.user.email || email;
      }
    } catch { /* offline — use cached */ }
  }
}

function _fillProfileFields(p, email) {
  const set = (id, val) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = val || '—';
    el.className   = val ? 'pf-value' : 'pf-value empty';
  };
  set('pfName',      p.name);
  set('pfPhone',     p.phone);
  set('pfDob',       p.dob);
  set('pfBlood',     p.bloodGroup);
  set('pfGender',    p.gender);
  set('pfEmail',     email);
  set('pfAddress',   p.address);
  set('pfCity',      p.city);
  set('pfPincode',   p.pincode);
  set('pfEmergency', p.emergencyContact);
  set('pfAllergies', p.allergies);
}

function closeProfileModal() {
  document.getElementById('profileModal')?.classList.remove('show');
  cancelProfileEdit();
}
function handleProfileModalClick(e) {
  if (e.target === document.getElementById('profileModal')) closeProfileModal();
}

function enableProfileEdit() {
  const s = Auth.session();
  const p = s?.profile || {};
  document.getElementById('profileViewMode').style.display = 'none';
  document.getElementById('profileEditMode').style.display = 'block';
  // Pre-fill editable fields
  const setVal = (id, val) => { const el = document.getElementById(id); if (el) el.value = val || ''; };
  setVal('editName',      p.name);
  setVal('editPhone',     p.phone);
  setVal('editDob',       p.dob);
  setVal('editBlood',     p.bloodGroup);
  setVal('editGender',    p.gender);
  setVal('editEmergency', p.emergencyContact);
  setVal('editAddress',   p.address);
  setVal('editCity',      p.city);
  setVal('editPincode',   p.pincode);
  setVal('editAllergies', p.allergies);
}

function cancelProfileEdit() {
  document.getElementById('profileViewMode').style.display = 'block';
  document.getElementById('profileEditMode').style.display = 'none';
  _hideError('profileSaveError');
}

async function saveProfile() {
  const getVal = id => (document.getElementById(id)?.value || '').trim();
  const payload = {
    name:             getVal('editName'),
    phone:            getVal('editPhone'),
    dob:              getVal('editDob'),
    bloodGroup:       getVal('editBlood'),
    gender:           getVal('editGender'),
    emergencyContact: getVal('editEmergency'),
    address:          getVal('editAddress'),
    city:             getVal('editCity'),
    pincode:          getVal('editPincode'),
    allergies:        getVal('editAllergies'),
  };
  _hideError('profileSaveError');

  const btn = document.getElementById('profileSaveBtn');
  _setBtnLoading(btn, 'Saving…');

  try {
    let savedProfile = payload;
    if (Auth.token() && !Auth.token().startsWith('demo_')) {
      const res  = await fetch(`${AUTH_URL}/profile`, {
        method: 'PUT',
        headers: Auth.authHeader(),
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        const msg = data.errors ? data.errors.map(e => e.msg).join(' · ') : (data.error || 'Save failed.');
        _showError('profileSaveError', msg);
        return;
      }
      savedProfile = data.user.profile || payload;
    }

    // Update local session
    if (!Auth._s.profile) Auth._s.profile = {};
    Object.assign(Auth._s.profile, savedProfile);

    // Update sidebar name
    const newName = payload.name || Auth._s.email?.split('@')[0] || 'User';
    const initials = newName.split(' ').map(w => w[0] || '').join('').substring(0, 2).toUpperCase();
    document.getElementById('profileAvatar').textContent = initials;
    document.getElementById('profileName').textContent   = newName.split(' - ')[0];
    document.getElementById('pmName').textContent        = newName;

    _fillProfileFields(Auth._s.profile, Auth._s.email);
    cancelProfileEdit();
    showToast('Profile saved successfully.', 'success');
  } catch (err) {
    // Demo save
    if (!Auth._s.profile) Auth._s.profile = {};
    Object.assign(Auth._s.profile, payload);
    const newName = payload.name || 'User';
    document.getElementById('profileName').textContent = newName.split(' - ')[0];
    document.getElementById('pmName').textContent      = newName;
    document.getElementById('profileAvatar').textContent = newName.substring(0,2).toUpperCase();
    _fillProfileFields(Auth._s.profile, Auth._s.email);
    cancelProfileEdit();
    showToast('Profile saved (demo mode).', 'success');
  } finally {
    _resetBtn(btn, 'Save Changes');
  }
}

// ─── THEME ───────────────────────────────────────────────────────
function _chartTheme(theme) {
  const dark = theme === 'dark';
  Chart.defaults.color = dark ? '#8899aa' : '#4a5568';
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
  const sunEl = document.getElementById('iconSun');
  const moonEl = document.getElementById('iconMoon');
  if (!sunEl || !moonEl) return;
  if (theme === 'dark') {
    sunEl.style.display = 'inline-flex'; // show sun (click → go light)
    moonEl.style.display = 'none';
  } else {
    sunEl.style.display = 'none';
    moonEl.style.display = 'inline-flex'; // show moon (click → go dark)
  }
}

function initTheme() {
  const t = localStorage.getItem('ms_theme') || 'dark';
  document.documentElement.setAttribute('data-theme', t);
  _setThemeIcons(t);
  _chartTheme(t);
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
  'dashboard': ['Dashboard', 'Smart Healthcare Supply & Secure Retail System'],
  'user-dashboard': ['My Dashboard', 'Your personal health portal'],
  'health-alerts': ['Health Alerts', 'Disease outbreaks and advisories near you'],
  'purchase-history': ['Purchase History', 'Your medicine purchases and savings'],
  'disease-monitor': ['Disease Monitor', 'Real-time outbreak tracking from hospital & NGO data'],
  'demand-predict': ['Demand Forecast', 'AI-powered medicine demand prediction'],
  'suggestions': ['AI Suggestions', 'Smart inventory recommendations'],
  'inventory': ['Inventory', 'Real-time stock for your pharmacy'],
  'transfer-requests': ['Stock Transfers', 'Send or request stock between pharmacies'],
  'redistribution': ['Auto Redistribution', 'Optimize stock distribution across pharmacies'],
  'generic-finder': ['Medicine Search', 'Compare brand and generic medicines with live pricing'],
  'analytics': ['Analytics', 'Trends, metrics and actionable insights'],
};

const STORE_ONLY = ['dashboard', 'disease-monitor', 'demand-predict', 'suggestions', 'inventory', 'transfer-requests', 'redistribution', 'analytics'];

function activateSection(id) {
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  const el = document.getElementById('section-' + id);
  if (el) el.classList.add('active');
  const [title, sub] = PAGE_META[id] || [id, ''];
  document.getElementById('pageTitle').textContent = title;
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
    showToast('This section is available for pharmacy staff only.', 'error'); return;
  }
  _setActive(sectionId);
  activateSection(sectionId);

  if (sectionId === 'disease-monitor') initDiseaseCharts();
  if (sectionId === 'inventory') renderInventory();
  if (sectionId === 'redistribution') initRedistributionChart();
  if (sectionId === 'analytics') initAnalyticsCharts();
  if (sectionId === 'generic-finder') renderGenericTable();
  if (sectionId === 'transfer-requests') renderTransferRequests();
  if (sectionId === 'suggestions') renderSuggestions();
  if (sectionId === 'user-dashboard') initUserDashboard();
  if (sectionId === 'health-alerts') renderHealthAlerts();
  if (sectionId === 'purchase-history') renderPurchaseHistory();
}

// ─── TOAST ───────────────────────────────────────────────────────
function showToast(msg, type = 'success', dur = 3500) {
  const c = document.getElementById('toastContainer');
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
    const p = Math.min((Date.now() - start) / dur, 1);
    const e = 1 - Math.pow(1 - p, 3);
    el.textContent = Math.floor(e * target).toLocaleString('en-IN');
    if (p < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}
function initCounters() {
  document.querySelectorAll('.section.active [data-count]').forEach(el => animateCounter(el, parseInt(el.dataset.count)));
}

// ─── CHART PALETTE ───────────────────────────────────────────────
const CC = {
  purple: 'rgba(108,99,255,1)', purpleF: 'rgba(108,99,255,0.12)',
  teal: 'rgba(0,212,170,1)', tealF: 'rgba(0,212,170,0.12)',
  amber: 'rgba(245,166,35,1)', amberF: 'rgba(245,166,35,0.12)',
  red: 'rgba(255,82,82,1)', redF: 'rgba(255,82,82,0.12)',
  blue: 'rgba(64,169,255,1)', blueF: 'rgba(64,169,255,0.12)',
  green: 'rgba(82,196,26,1)', greenF: 'rgba(82,196,26,0.12)',
};
function _gc(id) {
  const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
  return isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.07)';
}
function destroyChart(id) { if (charts[id]) { charts[id].destroy(); delete charts[id]; } }

// ─── DASHBOARD ───────────────────────────────────────────────────
function initDashboard() {
  initCounters();
  renderDashLowStock();
  initDashTrendChart();
  initDashDonut();
}



function renderDashLowStock() {
  const c = document.getElementById('dashLowStock');
  if (!c) return;
  const ph = MOCK_DATA.pharmacies.find(p => p.id === Auth.phId());
  if (!ph) { c.innerHTML = '<div style="color:var(--text-muted);font-size:13px;">No data.</div>'; return; }
  const items = ph.inventory.map(i => ({ ...i, pct: (i.stock / i.threshold) * 100 })).sort((a, b) => a.pct - b.pct).slice(0, 5);
  c.innerHTML = items.map(it => {
    const pct = Math.min(it.pct, 100).toFixed(0);
    const cls = it.pct < 30 ? 'red' : it.pct < 100 ? 'amber' : 'green';
    return `<div class="stock-row">
      <div class="stock-info">
        <span class="stock-name">${it.medicine}</span>
        <span class="stock-count ${cls === 'red' ? 'critical' : cls === 'amber' ? 'warning' : 'ok'}">${it.stock} / ${it.threshold}</span>
      </div>
      <div class="progress-bar"><div class="progress-fill ${cls}" style="width:${pct}%"></div></div>
    </div>`;
  }).join('');
}

function initDashTrendChart() {
  destroyChart('dashTrend');
  const ctx = document.getElementById('trendChartDash').getContext('2d');
  const d = MOCK_DATA.diseaseTrend;
  charts.dashTrend = new Chart(ctx, {
    type: 'line',
    data: {
      labels: d.labels, datasets: [
        { label: 'Dengue', data: d.datasets['Dengue'], borderColor: CC.red, backgroundColor: CC.redF, tension: 0.4, fill: true, pointRadius: 4, borderWidth: 2 },
        { label: 'Flu', data: d.datasets['Flu'], borderColor: CC.amber, backgroundColor: CC.amberF, tension: 0.4, fill: false, pointRadius: 4, borderWidth: 2 },
        { label: 'Malaria', data: d.datasets['Malaria'], borderColor: CC.teal, backgroundColor: CC.tealF, tension: 0.4, fill: false, pointRadius: 4, borderWidth: 2 },
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, padding: 14 } } },
      scales: { x: { grid: { color: _gc() } }, y: { beginAtZero: true, grid: { color: _gc() } } }
    }
  });
}

function initDashDonut() {
  destroyChart('dashDonut');
  const ctx = document.getElementById('demandDonutDash').getContext('2d');
  charts.dashDonut = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Paracetamol', 'Azithromycin', 'ORS Sachets', 'Cetirizine', 'Omeprazole', 'Other'],
      datasets: [{
        data: [35, 18, 22, 12, 8, 5],
        backgroundColor: [CC.purple, CC.teal, CC.amber, CC.blue, CC.red, CC.green],
        borderWidth: 2, borderColor: 'transparent'
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false, cutout: '65%',
      plugins: { legend: { position: 'right', labels: { boxWidth: 10, padding: 10, font: { size: 11 } } } }
    }
  });
}

// ─── USER DASHBOARD ─────────────────────────────────────────────────────────
function initUserDashboard() {
  const s = Auth.session(); if (!s) return;
  const displayName = s.profile?.name || s.name || s.email?.split('@')[0] || 'there';
  const el = document.getElementById('welcomeName');
  if (el) el.textContent = `Hello, ${displayName}`;
  initCounters();
  renderUserAlerts();
}

function renderUserAlerts() {
  const c = document.getElementById('userAlertsFeed'); if (!c) return;
  c.innerHTML = MOCK_DATA.userHealthAlerts.slice(0, 3).map(a => `
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
    { disease: 'Dengue', cases: 145, severity: 'HIGH', advice: 'Use mosquito repellent, avoid stagnant water' },
    { disease: 'Flu/Influenza', cases: 102, severity: 'MEDIUM', advice: 'Wash hands frequently, consider vaccination' },
    { disease: 'Malaria', cases: 28, severity: 'MEDIUM', advice: 'Use mosquito nets at night' },
  ];
  const cls = { HIGH: 'badge-red', MEDIUM: 'badge-amber', LOW: 'badge-blue' };
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
      <td style="color:var(--accent-teal);font-weight:600;">${p.saved > 0 ? '₹' + p.saved : '—'}</td>
      <td style="color:var(--text-muted);font-size:12px;">${p.pharmacy}</td>
    </tr>`).join('');
}

// ─── DISEASE MONITOR ─────────────────────────────────────────────
function renderOutbreakCards() {
  const outbreaks = [
    { disease: 'Dengue', cases: 145, prev: 110, severity: 'HIGH' },
    { disease: 'Flu/Influenza', cases: 102, prev: 88, severity: 'MEDIUM' },
    { disease: 'Malaria', cases: 28, prev: 20, severity: 'MEDIUM' },
    { disease: 'Typhoid', cases: 12, prev: 10, severity: 'LOW' },
  ];
  const clsMap = { HIGH: 'badge-red', MEDIUM: 'badge-amber', LOW: 'badge-blue' };
  document.getElementById('outbreakCards').innerHTML = outbreaks.map(o => {
    const g = (((o.cases - o.prev) / o.prev) * 100).toFixed(0);
    const barCls = o.severity === 'HIGH' ? 'red' : o.severity === 'MEDIUM' ? 'amber' : 'green';
    return `<div class="outbreak-row">
      <div class="outbreak-indicator ${o.severity.toLowerCase()}"></div>
      <div style="flex:1;">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
          <span style="font-weight:600;font-size:14px;">${o.disease}</span>
          <span class="badge ${clsMap[o.severity]}">${o.severity}</span>
          <span style="font-size:12px;color:var(--accent-red);margin-left:auto;">+${g}%</span>
        </div>
        <div style="font-size:12px;color:var(--text-muted);margin-bottom:6px;">${o.cases} active cases today</div>
        <div class="progress-bar"><div class="progress-fill ${barCls}" style="width:${Math.min(o.cases / 1.5, 100)}%"></div></div>
      </div>
    </div>`;
  }).join('');
}

function initDiseaseCharts() {
  renderOutbreakCards();
  destroyChart('diseaseLine');
  const ctx = document.getElementById('diseaseLineChart').getContext('2d');
  const d = MOCK_DATA.diseaseTrend;
  charts.diseaseLine = new Chart(ctx, {
    type: 'line',
    data: {
      labels: d.labels, datasets: [
        { label: 'Dengue', data: d.datasets['Dengue'], borderColor: CC.red, tension: 0.4, fill: false, pointRadius: 4, borderWidth: 2 },
        { label: 'Flu', data: d.datasets['Flu'], borderColor: CC.amber, tension: 0.4, fill: false, pointRadius: 4, borderWidth: 2 },
        { label: 'Malaria', data: d.datasets['Malaria'], borderColor: CC.teal, tension: 0.4, fill: false, pointRadius: 4, borderWidth: 2 },
        { label: 'Typhoid', data: d.datasets['Typhoid'], borderColor: CC.blue, tension: 0.4, fill: false, pointRadius: 4, borderWidth: 2 },
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, padding: 14 } } },
      scales: { x: { grid: { color: _gc() } }, y: { beginAtZero: true, grid: { color: _gc() } } }
    }
  });
}

function logDiseaseReport() {
  const disease = document.getElementById('diseaseSelect').value;
  const cases = document.getElementById('casesInput').value;
  if (!disease || !cases) { showToast('Please fill disease and case count.', 'error'); return; }
  showToast(`Report logged: ${disease} — ${cases} cases.`, 'success', 4000);
  setTimeout(() => showToast(`Alert dispatched to all pharmacies.`, 'warning', 4000), 2000);
  setTimeout(() => { document.getElementById('forecastDiseaseSelect').value = disease; document.getElementById('forecastCases').value = cases; navigate('demand-predict', document.querySelector('[data-section="demand-predict"]')); runDemandForecast(); }, 3000);
}

// ─── DEMAND FORECAST ─────────────────────────────────────────────
function runDemandForecast() {
  const disease = document.getElementById('forecastDiseaseSelect').value;
  const cases = parseInt(document.getElementById('forecastCases').value) || 100;
  const growth = parseFloat(document.getElementById('forecastGrowth').value) || 32;
  const win = parseInt(document.getElementById('forecastWindow').value) || 7;
  if (!disease) { showToast('Please select a disease.', 'error'); return; }
  const dd = MOCK_DATA.diseaseDemandMap[disease]; if (!dd) return;
  const predicted = Math.floor(cases * Math.pow(1 + growth / 100, win));
  const labels = [], vals = [];
  for (let i = 1; i <= win; i++) { labels.push(`Day ${i}`); vals.push(Math.floor(cases * Math.pow(1 + growth / 100, i))); }
  document.getElementById('forecastDiseaseTitle').textContent = `${disease} Outbreak`;
  document.getElementById('forecastSummary').textContent = `${predicted.toLocaleString('en-IN')} predicted cases over ${win} days`;
  const risk = predicted > 300 ? 'HIGH' : predicted > 150 ? 'MEDIUM' : 'LOW';
  const badge = document.getElementById('crisisBadge');
  badge.textContent = risk + ' RISK'; badge.className = `crisis-badge ${risk === 'HIGH' ? 'high' : 'medium'}`;
  destroyChart('forecastBar');
  const ctx = document.getElementById('forecastBarChart').getContext('2d');
  charts.forecastBar = new Chart(ctx, {
    type: 'bar',
    data: { labels, datasets: [{ label: 'Predicted Cases', data: vals, backgroundColor: vals.map(v => v > 300 ? CC.red : v > 150 ? CC.amber : CC.teal), borderRadius: 5, borderSkipped: false }] },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { grid: { display: false } }, y: { beginAtZero: true, grid: { color: _gc() } } } }
  });
  const base = Math.ceil(predicted * dd.demandMultiplier);
  document.getElementById('predictionItems').innerHTML = dd.medicines.map((m, i) => {
    const u = Math.ceil(base * (1 - i * 0.15));
    return `<div class="prediction-item"><div class="prediction-info"><div class="prediction-name">${m}</div><div class="prediction-detail">Required across all pharmacies · ${win}-day window</div></div><div class="prediction-units"><div class="units">${u.toLocaleString('en-IN')}</div><div class="units-label">units</div></div></div>`;
  }).join('');
  document.getElementById('predictionOutput').classList.add('show');
  document.getElementById('forecastPlaceholder').style.display = 'none';
  showToast(`Forecast complete for ${disease}.`, 'success');
}

// ─── INVENTORY ───────────────────────────────────────────────────
let _editingRow = null; // { phId, medicine }

function renderInventory() {
  const phId = Auth.phId();
  const ph = MOCK_DATA.pharmacies.find(p => p.id === phId);
  if (!ph) { document.getElementById('inventoryTables').innerHTML = '<div class="card flex-center" style="height:200px;color:var(--text-muted);">No inventory data available.</div>'; return; }

  const sub = document.getElementById('inventorySubtitle');
  if (sub) sub.textContent = `Stock levels for ${ph.name} · ${ph.location}`;

  let critical = 0, low = 0, total = 0;
  ph.inventory.forEach(it => { total += it.stock; const p = it.stock / it.threshold; if (p < 0.5) critical++; else if (p < 1) low++; });

  document.getElementById('invSummaryCards').innerHTML = `
    <div class="stat-card teal"><div class="stat-top"><span class="stat-sup">Total</span></div><div class="stat-value">${total.toLocaleString('en-IN')}</div><div class="stat-label">Units in Stock</div></div>
    <div class="stat-card red"><div class="stat-top"><span class="stat-sup">Urgent</span></div><div class="stat-value">${critical}</div><div class="stat-label">Critical Items</div></div>
    <div class="stat-card amber"><div class="stat-top"><span class="stat-sup">Warning</span></div><div class="stat-value">${low}</div><div class="stat-label">Low Stock</div></div>
    <div class="stat-card green"><div class="stat-top"><span class="stat-sup">Healthy</span></div><div class="stat-value">${ph.inventory.length - critical - low}</div><div class="stat-label">Items OK</div></div>`;

  const rows = ph.inventory.map(it => {
    const pct = (it.stock / it.threshold * 100).toFixed(0);
    const stCls = pct < 30 ? 'badge-red' : pct < 100 ? 'badge-amber' : 'badge-green';
    const stLbl = pct < 30 ? 'Critical' : pct < 100 ? 'Low' : 'OK';
    const barCls = pct < 30 ? 'red' : pct < 100 ? 'amber' : 'green';
    const safeName = it.medicine.replace(/[^a-z0-9]/gi, '_');
    return `<tr id="invRow_${safeName}">
      <td><strong>${it.medicine}</strong></td>
      <td id="invStockCell_${safeName}">${it.stock}</td>
      <td>${it.threshold}</td>
      <td><span class="badge ${stCls}">${stLbl}</span></td>
      <td style="width:140px;">
        <div class="progress-bar"><div class="progress-fill ${barCls}" style="width:${Math.min(pct, 100)}%"></div></div>
        <span style="font-size:11px;color:var(--text-muted);">${pct}%</span>
      </td>
      <td>
        <div style="display:flex;gap:6px;" id="invActions_${safeName}">
          <button class="btn btn-outline btn-sm" onclick="editStockRow('${phId}','${it.medicine}')">Edit</button>
          <button class="btn btn-outline btn-sm" onclick="showToast('Order placed: ${it.medicine}','success')">Order</button>
        </div>
      </td>
    </tr>`;
  }).join('');

  document.getElementById('inventoryTables').innerHTML = `
    <div class="card">
      <div class="table-wrap">
        <table>
          <thead><tr><th>Medicine</th><th>In Stock</th><th>Threshold</th><th>Status</th><th>Health</th><th>Actions</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </div>`;
}

function editStockRow(phId, medicine) {
  // Cancel any previous edit
  if (_editingRow) cancelStockEdit(false);
  _editingRow = { phId, medicine };
  const safeName = medicine.replace(/[^a-z0-9]/gi, '_');
  const ph = MOCK_DATA.pharmacies.find(p => p.id === phId);
  const item = ph?.inventory.find(i => i.medicine === medicine);
  if (!item) return;

  // Replace stock cell with input
  document.getElementById('invStockCell_' + safeName).innerHTML =
    `<input class="form-input inv-edit-input" id="invEditInput_${safeName}" type="number" value="${item.stock}" min="0"/>`;

  // Replace action buttons
  document.getElementById('invActions_' + safeName).innerHTML = `
    <button class="btn btn-primary btn-sm" onclick="saveStockRow('${phId}','${medicine}')">Save</button>
    <button class="btn btn-outline btn-sm" onclick="cancelStockEdit(true)">Cancel</button>`;
}

function saveStockRow(phId, medicine) {
  const safeName = medicine.replace(/[^a-z0-9]/gi, '_');
  const input = document.getElementById('invEditInput_' + safeName);
  const newQty = parseInt(input?.value);
  if (isNaN(newQty) || newQty < 0) { showToast('Please enter a valid quantity.', 'error'); return; }

  const ph = MOCK_DATA.pharmacies.find(p => p.id === phId);
  const item = ph?.inventory.find(i => i.medicine === medicine);
  if (item) item.stock = newQty;

  _editingRow = null;
  renderInventory();
  renderDashLowStock();
  showToast(`Stock updated: ${medicine} → ${newQty} units.`, 'success');
}

function cancelStockEdit(reRender = true) {
  _editingRow = null;
  if (reRender) renderInventory();
}

function showRestockSuggestions() { showToast('Restock plan generated and sent to procurement.', 'success', 4000); }

// ─── AI SUGGESTIONS ──────────────────────────────────────────────
function generateSuggestions(phId) {
  const ph = MOCK_DATA.pharmacies.find(p => p.id === phId);
  if (!ph) return [];
  const trends = MOCK_DATA.purchaseTrends?.[phId];
  const outbreaks = [
    { disease: 'Dengue', growth: 32, medicines: MOCK_DATA.diseaseDemandMap['Dengue'].medicines },
    { disease: 'Flu/Influenza', growth: 16, medicines: MOCK_DATA.diseaseDemandMap['Flu/Influenza'].medicines },
    { disease: 'Malaria', growth: 9, medicines: MOCK_DATA.diseaseDemandMap['Malaria'].medicines },
  ];
  return ph.inventory.map(item => {
    const stockPct = (item.stock / item.threshold) * 100;
    let velocityScore = 0;
    if (trends?.weeklyData?.[item.medicine]) {
      const d = trends.weeklyData[item.medicine];
      const recent = (d[5] + d[6]) / 2;
      const base = (d[0] + d[1] + d[2] + d[3] + d[4]) / 5;
      velocityScore = base > 0 ? ((recent - base) / base) * 100 : 0;
    }
    let diseaseScore = 0, related = [];
    outbreaks.forEach(ob => { if (ob.medicines.includes(item.medicine)) { diseaseScore += ob.growth; related.push(`${ob.disease} (+${ob.growth}%)`); } });
    const stockUrgency = stockPct < 30 ? 60 : stockPct < 70 ? 30 : stockPct < 100 ? 15 : 0;
    const score = Math.min(Math.round(stockUrgency + Math.max(0, velocityScore) * 0.4 + diseaseScore * 0.3), 100);
    const recQty = Math.max(item.threshold * 2 - item.stock, Math.round(item.threshold * (1 + velocityScore / 100)));
    const reason = (() => {
      const p = [];
      if (stockPct < 30) p.push(`Stock critically low (${Math.round(stockPct)}%)`);
      else if (stockPct < 100) p.push(`Below threshold (${Math.round(stockPct)}%)`);
      if (velocityScore > 10) p.push(`Purchase rate up ${Math.round(velocityScore)}%`);
      if (related.length) p.push(`Linked: ${related.join(', ')}`);
      return p.join(' · ') || 'Routine restock recommended';
    })();
    return { medicine: item.medicine, stock: item.stock, threshold: item.threshold, stockPct: Math.round(stockPct), velocityChange: Math.round(velocityScore), related, urgencyScore: score, recommendedQty: Math.max(recQty, 0), reason };
  }).filter(s => s.urgencyScore > 5).sort((a, b) => b.urgencyScore - a.urgencyScore);
}

function renderSuggestions() {
  const phId = Auth.phId() || 'PH001';
  const sug = generateSuggestions(phId);
  const c = document.getElementById('suggestionsList');
  if (!sug.length) { c.innerHTML = '<div class="card flex-center" style="height:160px;color:var(--text-muted);">All stock levels healthy.</div>'; return; }
  c.innerHTML = sug.map((s, i) => {
    const cls = s.urgencyScore >= 70 ? 'critical' : s.urgencyScore >= 40 ? 'medium' : 'low';
    const label = s.urgencyScore >= 70 ? 'Critical' : s.urgencyScore >= 40 ? 'Medium' : 'Low';
    const barCls = s.stockPct < 30 ? 'red' : s.stockPct < 100 ? 'amber' : 'green';
    return `<div class="suggestion-card ${cls}">
      <div class="suggestion-header">
        <div class="suggestion-rank">${i + 1}</div>
        <div class="suggestion-title"><div class="suggestion-medicine">${s.medicine}</div><div class="suggestion-reason">${s.reason}</div></div>
        <div style="text-align:right;flex-shrink:0;"><span class="suggestion-urgency-badge ${cls}">${label}</span><div class="suggestion-score">Score: ${s.urgencyScore}/100</div></div>
      </div>
      <div class="suggestion-body">
        <div class="suggestion-metrics">
          <div class="metric-item"><div class="metric-label">Current</div><div class="metric-val">${s.stock}</div></div>
          <div class="metric-item"><div class="metric-label">Threshold</div><div class="metric-val">${s.threshold}</div></div>
          <div class="metric-item"><div class="metric-label">Velocity</div><div class="metric-val" style="color:${s.velocityChange > 0 ? 'var(--accent-red)' : 'var(--accent-teal)'}">${s.velocityChange > 0 ? '+' : ''}${s.velocityChange}%</div></div>
          <div class="metric-item"><div class="metric-label">Order Qty</div><div class="metric-val" style="color:var(--accent-amber);font-weight:700;">${s.recommendedQty}</div></div>
        </div>
        <div style="margin:12px 0 14px;">
          <div style="display:flex;justify-content:space-between;font-size:11px;color:var(--text-muted);margin-bottom:5px;"><span>Stock Health</span><span>${s.stockPct}%</span></div>
          <div class="progress-bar"><div class="progress-fill ${barCls}" style="width:${Math.min(s.stockPct, 100)}%"></div></div>
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
  showToast(`Order placed: ${qty} units of ${med}.`, 'success', 4000);
}
function refreshSuggestions() { showToast('Refreshing…', 'success'); setTimeout(() => { renderSuggestions(); showToast('Suggestions updated.', 'success'); }, 1200); }

function renderPurchaseTrendChart(phId) {
  destroyChart('purchaseTrend');
  const trends = MOCK_DATA.purchaseTrends?.[phId]; if (!trends) return;
  const ctx = document.getElementById('purchaseTrendChart').getContext('2d');
  const meds = ['Paracetamol', 'ORS Sachets', 'Cetirizine'];
  charts.purchaseTrend = new Chart(ctx, {
    type: 'line',
    data: {
      labels: trends.labels, datasets: meds.map((m, i) => ({
        label: m, data: trends.weeklyData[m] || [], borderColor: [CC.red, CC.teal, CC.amber][i], backgroundColor: [CC.redF, CC.tealF, CC.amberF][i], tension: 0.4, fill: i === 0, pointRadius: 3, borderWidth: 2
      }))
    },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, padding: 10, font: { size: 11 } } } }, scales: { x: { grid: { color: _gc() } }, y: { beginAtZero: true, grid: { color: _gc() } } } }
  });
}

// ─── TRANSFER REQUESTS ───────────────────────────────────────────
let _transferFilter = 'all';
let _transferMode = 'send'; // 'send' | 'request'

function setTransferMode(mode, btn) {
  _transferMode = mode;
  document.querySelectorAll('.mode-tab').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  const phId = Auth.phId();
  const ph = MOCK_DATA.pharmacies.find(p => p.id === phId);
  const otherPhs = MOCK_DATA.pharmacies.filter(p => p.id !== phId);

  const hintEl = document.getElementById('transferModeHint');
  const fromSel = document.getElementById('transferFrom');
  const toSel = document.getElementById('transferTo');
  const lFrom = document.getElementById('labelFrom');
  const lTo = document.getElementById('labelTo');

  // Re-build the selects based on mode
  const allOpts = MOCK_DATA.pharmacies.map(p => `<option value="${p.id}">${p.name}</option>`).join('');

  if (mode === 'send') {
    hintEl.textContent = 'Sending surplus stock from your store to another pharmacy that needs it.';
    // From = my store (locked), To = others
    fromSel.innerHTML = `<option value="${phId}">${ph?.name || phId}</option>`;
    fromSel.disabled = true;
    toSel.innerHTML = `<option value="">Select destination...</option>${otherPhs.map(p => `<option value="${p.id}">${p.name}</option>`).join('')}`;
    toSel.disabled = false;
    lFrom.textContent = 'From (Your Store)';
    lTo.textContent = 'To Pharmacy (Receiving)';
    fromSel.value = phId;
  } else {
    hintEl.textContent = 'Requesting stock from another pharmacy that has surplus. They will need to approve.';
    // From = other pharmacies, To = my store (locked)
    fromSel.innerHTML = `<option value="">Select surplus store...</option>${otherPhs.map(p => `<option value="${p.id}">${p.name}</option>`).join('')}`;
    fromSel.disabled = false;
    toSel.innerHTML = `<option value="${phId}">${ph?.name || phId}</option>`;
    toSel.disabled = true;
    lFrom.textContent = 'Request From (Surplus Store)';
    lTo.textContent = 'Your Store (Recipient)';
    toSel.value = phId;
  }
}

function openNewTransferModal() {
  const form = document.getElementById('newTransferForm');
  form.style.display = 'block';
  form.scrollIntoView({ behavior: 'smooth' });
  setTransferMode('send', document.getElementById('modeSend'));
}

function closeNewTransferModal() {
  document.getElementById('newTransferForm').style.display = 'none';
}

function submitTransferRequest() {
  const from = document.getElementById('transferFrom').value;
  const to = document.getElementById('transferTo').value;
  const medicine = document.getElementById('transferMedicine').value;
  const qty = parseInt(document.getElementById('transferQty').value);
  const urgency = document.getElementById('transferUrgency').value;
  const reason = document.getElementById('transferReason').value;

  if (!from || !to) { showToast('Please select both pharmacies.', 'error'); return; }
  if (from === to) { showToast('Source and destination cannot be the same.', 'error'); return; }
  if (!medicine) { showToast('Please select a medicine.', 'error'); return; }
  if (!qty || qty <= 0) { showToast('Please enter a valid quantity.', 'error'); return; }

  const fromPh = MOCK_DATA.pharmacies.find(p => p.id === from);
  const toPh = MOCK_DATA.pharmacies.find(p => p.id === to);
  const typeLabel = _transferMode === 'request' ? 'Stock Request' : 'Transfer';

  MOCK_DATA.transferRequests.unshift({
    id: 'TR' + String(MOCK_DATA.transferRequests.length + 1).padStart(3, '0'),
    type: _transferMode,
    fromPharmacy: from, fromName: fromPh?.name || from,
    toPharmacy: to, toName: toPh?.name || to,
    medicine, quantity: qty, urgency,
    status: 'pending',
    reason: reason || `${typeLabel} by ${Auth.session()?.profile?.name || Auth.session()?.name || 'Unknown'}`,
    requestedBy: Auth.session()?.profile?.name || Auth.session()?.name || 'Unknown',
    requestedAt: new Date().toISOString(),
  });

  closeNewTransferModal();
  _transferFilter = 'pending';
  renderTransferRequests();
  updateTransferBadge();
  const msg = _transferMode === 'request'
    ? `Stock request sent: ${qty} units of ${medicine} from ${fromPh?.name}.`
    : `Transfer submitted: ${qty} units of ${medicine} to ${toPh?.name}.`;
  showToast(msg, 'success', 4000);
}

function filterTransfers(f, btn) {
  _transferFilter = f;
  document.querySelectorAll('#transferTabs .tab-btn').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  renderTransferRequests();
}

function renderTransferRequests() {
  const all = MOCK_DATA.transferRequests;
  const pending = all.filter(r => r.status === 'pending').length;
  const approved = all.filter(r => r.status === 'approved').length;
  const rejected = all.filter(r => r.status === 'rejected').length;

  document.getElementById('transferStats').innerHTML = `
    <div class="stat-card amber"><div class="stat-top"><span class="stat-sup">Pending</span></div><div class="stat-value">${pending}</div><div class="stat-label">Awaiting Action</div></div>
    <div class="stat-card green"><div class="stat-top"><span class="stat-sup">Done</span></div><div class="stat-value">${approved}</div><div class="stat-label">Approved</div></div>
    <div class="stat-card red"><div class="stat-top"><span class="stat-sup">Declined</span></div><div class="stat-value">${rejected}</div><div class="stat-label">Rejected</div></div>
    <div class="stat-card blue"><div class="stat-top"><span class="stat-sup">All</span></div><div class="stat-value">${all.length}</div><div class="stat-label">Total</div></div>`;

  const filtered = _transferFilter === 'all' ? all : all.filter(r => r.status === _transferFilter);
  const c = document.getElementById('transferRequestsList');
  if (!filtered.length) { c.innerHTML = `<div class="card flex-center" style="height:160px;color:var(--text-muted);">No ${_transferFilter} requests.</div>`; return; }

  c.innerHTML = filtered.map(r => {
    const urgCls = r.urgency === 'critical' ? 'badge-red' : r.urgency === 'medium' ? 'badge-amber' : 'badge-teal';
    const stCls = r.status === 'approved' ? 'badge-green' : r.status === 'rejected' ? 'badge-red' : 'badge-amber';
    const typeCls = r.type === 'request' ? 'badge-purple' : 'badge-blue';
    const typeLabel = r.type === 'request' ? 'Request IN' : 'Transfer OUT';
    const date = new Date(r.requestedAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
    const actions = r.status === 'pending' ? `
      <div class="tr-actions">
        <button class="btn btn-primary btn-sm" onclick="approveRequest('${r.id}')">Approve</button>
        <button class="btn btn-danger btn-sm" onclick="rejectRequest('${r.id}')">Reject</button>
      </div>` : '';
    return `<div class="transfer-request-card" id="trCard-${r.id}">
      <div class="tr-header">
        <span class="tr-id-badge">${r.id}</span>
        <span class="badge ${typeCls}" style="font-size:10px;">${typeLabel}</span>
        <div class="tr-medicine">${r.medicine} — <strong>${r.quantity} units</strong></div>
        <div style="display:flex;gap:8px;margin-left:auto;">
          <span class="badge ${urgCls}">${r.urgency.charAt(0).toUpperCase() + r.urgency.slice(1)}</span>
          <span class="badge ${stCls}">${r.status.charAt(0).toUpperCase() + r.status.slice(1)}</span>
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

function approveRequest(id) {
  const r = MOCK_DATA.transferRequests.find(r => r.id === id); if (!r) return;
  r.status = 'approved'; renderTransferRequests(); updateTransferBadge();
  showToast(`${id} approved — ${r.quantity} units of ${r.medicine} confirmed.`, 'success', 4000);
}
function rejectRequest(id) {
  const r = MOCK_DATA.transferRequests.find(r => r.id === id); if (!r) return;
  r.status = 'rejected'; renderTransferRequests(); updateTransferBadge();
  showToast(`${id} rejected.`, 'warning');
}
function updateTransferBadge() {
  const n = MOCK_DATA.transferRequests.filter(r => r.status === 'pending').length;
  const b = document.getElementById('pendingTransferBadge'); if (b) b.textContent = n;
}

// ─── REDISTRIBUTION ──────────────────────────────────────────────
function initRedistributionChart() {
  destroyChart('redist');
  const ctx = document.getElementById('redistributionChart').getContext('2d');
  const meds = ['Paracetamol', 'Azithromycin', 'ORS Sachets', 'Cetirizine', 'Omeprazole'];
  charts.redist = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: meds, datasets: MOCK_DATA.pharmacies.map((ph, i) => ({
        label: ph.name.split(' - ')[0],
        data: meds.map(m => ph.inventory.find(it => it.medicine === m)?.stock || 0),
        backgroundColor: [CC.purple, CC.teal, CC.amber][i], borderRadius: 4
      }))
    },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, padding: 12 } } }, scales: { x: { grid: { display: false } }, y: { beginAtZero: true, grid: { color: _gc() } } } }
  });
}
function approveTransfer(btn, med, qty) { btn.closest('.transfer-card').style.opacity = '0.4'; btn.textContent = 'Approved'; btn.disabled = true; showToast(`Transfer approved: ${qty} units of ${med}.`, 'success'); }
function runAutoRedistribution() { showToast('Auto-optimization complete. 3 redistribution orders created.', 'success', 4000); }

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
    const pct = ((save / m.brandPrice) * 100).toFixed(0);
    return `<tr>
      <td><strong>${m.brand}</strong></td>
      <td style="color:var(--text-muted);font-size:12px;">${m.salt}</td>
      <td style="color:var(--accent-red);">₹${m.brandPrice}</td>
      <td>${m.generic}</td>
      <td style="color:var(--accent-teal);font-weight:600;">₹${m.genericPrice}</td>
      <td><span class="badge badge-green">Save ₹${save} (${pct}%)</span></td>
      <td><button class="btn btn-primary btn-sm" onclick="selectMed('${m.brand}')">Buy</button></td>
    </tr>`;
  }).join('');
}

function liveSearchMed() {
  const q = document.getElementById('medSearchInput').value.toLowerCase();
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
  document.getElementById('medSearchResults').scrollIntoView({ behavior: 'smooth', block: 'start' });
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

  const resultsEl = document.getElementById('medSearchResults');
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
    const pct = ((save / m.brandPrice) * 100).toFixed(0);
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
  const typeLbl = type === 'generic' ? 'Generic Medicine' : 'Brand Medicine';
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
    type: 'line',
    data: { labels: d.labels, datasets: Object.entries(d.datasets).map(([k, v], i) => ({ label: k, data: v, borderColor: [CC.red, CC.amber, CC.teal, CC.blue][i], tension: 0.4, fill: false, pointRadius: 4, borderWidth: 2 })) },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, padding: 12 } } }, scales: { x: { grid: { color: _gc() } }, y: { beginAtZero: true, grid: { color: _gc() } } } }
  });
  destroyChart('invHealth');
  charts.invHealth = new Chart(document.getElementById('inventoryHealthChart').getContext('2d'), {
    type: 'bar',
    data: {
      labels: ['Paracetamol', 'Azithromycin', 'Cetirizine', 'ORS Sachets', 'Omeprazole', 'Amoxicillin'],
      datasets: MOCK_DATA.pharmacies.map((ph, i) => ({ label: ph.name.split(' - ')[0], data: ph.inventory.map(it => Math.round((it.stock / it.threshold) * 100)), backgroundColor: [CC.purple, CC.teal, CC.amber][i], borderRadius: 4 }))
    },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, padding: 10 } } }, scales: { x: { grid: { display: false } }, y: { beginAtZero: true, max: 300, grid: { color: _gc() }, ticks: { callback: v => v + '%' } } } }
  });
  destroyChart('topMed');
  charts.topMed = new Chart(document.getElementById('topMedChart').getContext('2d'), {
    type: 'bar',
    data: { labels: ['Paracetamol', 'ORS', 'Azithromycin', 'Cetirizine', 'Omeprazole'], datasets: [{ label: 'Units Sold', data: [2140, 980, 650, 430, 290], backgroundColor: CC.purple, borderRadius: 5 }] },
    options: { responsive: true, maintainAspectRatio: false, indexAxis: 'y', plugins: { legend: { display: false } }, scales: { x: { grid: { color: _gc() } }, y: { grid: { display: false } } } }
  });
  destroyChart('genericAdopt');
  charts.genericAdopt = new Chart(document.getElementById('genericAdoptionChart').getContext('2d'), {
    type: 'doughnut',
    data: { labels: ['Generic', 'Brand'], datasets: [{ data: [62, 38], backgroundColor: [CC.teal, CC.purple], borderWidth: 2, borderColor: 'transparent' }] },
    options: { responsive: true, maintainAspectRatio: false, cutout: '65%', plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, padding: 12 } } } }
  });
}


// ─── INIT ────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  Auth.init();
  initTheme();
  // Handle OAuth redirect-back (Google / Microsoft)
  _handleOAuthCallback();
  document.getElementById('storePinInput')?.addEventListener('keydown', e => { if (e.key === 'Enter') loginStore(); });
  document.getElementById('loginEmail')?.addEventListener('keydown', e => { if (e.key === 'Enter') loginUser(); });
  document.getElementById('loginPassword')?.addEventListener('keydown', e => { if (e.key === 'Enter') loginUser(); });
  if (Auth.isLoggedIn()) launchApp();
});
