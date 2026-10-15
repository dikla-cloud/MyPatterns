/* MyPatterns – אפליקציית מעקב אחרי דוגמאות סריגה המסונכרנת לגוגל דרייב */
'use strict';

const SCOPES = 'https://www.googleapis.com/auth/drive';
const DRIVE = 'https://www.googleapis.com/drive/v3';
const UPLOAD = 'https://www.googleapis.com/upload/drive/v3';
const FOLDER = 'application/vnd.google-apps.folder';
const FIELDS = 'id,name,mimeType,modifiedTime,appProperties,size,parents';

const $ = (s) => document.querySelector(s);
const el = (tag, attrs = {}, ...kids) => {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'class') e.className = v;
    else if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
    else if (v !== undefined && v !== null) e.setAttribute(k, v);
  }
  for (const k of kids.flat()) if (k != null) e.append(k);
  return e;
};
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const debounce = (fn, ms) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };

/* ---------------- אחסון מקומי ---------------- */
const store = {
  get(k, d) { try { const v = localStorage.getItem('kp.' + k); return v == null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem('kp.' + k, JSON.stringify(v)); } catch { /* ignore */ } },
};

const idb = (() => {
  let dbp;
  const db = () => dbp || (dbp = new Promise((res, rej) => {
    const r = indexedDB.open('mypatterns', 1);
    r.onupgradeneeded = () => { r.result.createObjectStore('blobs'); r.result.createObjectStore('lists'); };
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  }));
  const tx = async (name, mode, fn) => {
    const d = await db();
    return new Promise((res, rej) => {
      const t = d.transaction(name, mode);
      const req = fn(t.objectStore(name));
      t.oncomplete = () => res(req && req.result);
      t.onerror = () => rej(t.error);
    });
  };
  return {
    get: (s, k) => tx(s, 'readonly', (o) => o.get(k)).catch(() => undefined),
    put: (s, k, v) => tx(s, 'readwrite', (o) => o.put(v, k)).catch(() => {}),
    del: (s, k) => tx(s, 'readwrite', (o) => o.delete(k)).catch(() => {}),
  };
})();

/* ---------------- הודעות ---------------- */
let toastTimer;
function toast(msg, ms = 2600) {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.remove('hidden');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.add('hidden'), ms);
}
async function busy(text, fn) {
  $('#busyText').textContent = text;
  $('#busy').classList.remove('hidden');
  try { return await fn(); } finally { $('#busy').classList.add('hidden'); }
}

/* ---------------- התחברות לגוגל ---------------- */
class AuthError extends Error {}

function clientId() {
  return (window.KNIT_CONFIG && window.KNIT_CONFIG.clientId) || store.get('clientId', '');
}

function waitForGis(timeout = 10000) {
  return new Promise((res, rej) => {
    const start = Date.now();
    (function poll() {
      if (window.google && google.accounts && google.accounts.oauth2) return res();
      if (Date.now() - start > timeout) return rej(new Error('GIS_LOAD'));
      setTimeout(poll, 100);
    })();
  });
}

const auth = {
  token: store.get('token', null),
  client: null,
  pending: null,
  async init() {
    if (this.client) return;
    await waitForGis();
    this.client = google.accounts.oauth2.initTokenClient({
      client_id: clientId(),
      scope: SCOPES,
      callback: (r) => this._done(r),
      error_callback: (e) => this._fail(e),
    });
  },
  valid() { return !!(this.token && this.token.exp > Date.now() + 60000); },
  async request(prompt = '') {
    await this.init();
    if (this.pending) return this.pending.p;
    let res, rej;
    const p = new Promise((a, b) => { res = a; rej = b; });
    this.pending = { p, res, rej };
    this.client.requestAccessToken({ prompt });
    return p;
  },
  _done(r) {
    const pd = this.pending; this.pending = null;
    if (r.error) { pd && pd.rej(new AuthError(r.error)); return; }
    this.token = { v: r.access_token, exp: Date.now() + (Number(r.expires_in) || 3600) * 1000 };
    store.set('token', this.token);
    store.set('signedIn', true);
    $('#authNote').classList.add('hidden');
    pd && pd.res(this.token.v);
  },
  _fail(e) {
    const pd = this.pending; this.pending = null;
    pd && pd.rej(new AuthError((e && e.type) || 'auth'));
  },
  async get() {
    if (this.valid()) return this.token.v;
    try { return await this.request(''); } catch (e) { throw new AuthError(e.message); }
  },
  signOut() {
    try { if (this.token && window.google) google.accounts.oauth2.revoke(this.token.v, () => {}); } catch { /* ignore */ }
    this.token = null;
    store.set('token', null);
    store.set('signedIn', false);
  },
};

/* ---------------- Google Drive API ---------------- */
async function gfetch(url, opts = {}, retry = true) {
  const t = await auth.get();
  const r = await fetch(url, { ...opts, headers: { ...(opts.headers || {}), Authorization: 'Bearer ' + t } });
  if (r.status === 401 && retry) {
    auth.token = null; store.set('token', null);
    return gfetch(url, opts, false);
  }
  if (r.status === 401) throw new AuthError('401');
  if (!r.ok) {
    let msg = 'שגיאה ' + r.status;
    try { const j = await r.json(); msg = (j.error && j.error.message) || msg; } catch { /* ignore */ }
    throw new Error(msg);
  }
  return r;
}
const jsonHeaders = { 'Content-Type': 'application/json; charset=UTF-8' };
const drive = {
  async list(folderId, foldersOnly = false) {
    const files = [];
    let pageToken = '';
    let q = `'${folderId}' in parents and trashed=false`;
    if (foldersOnly) q += ` and mimeType='${FOLDER}'`;
    do {
      const url = `${DRIVE}/files?q=${encodeURIComponent(q)}&fields=nextPageToken,files(${FIELDS})&pageSize=1000` +
        `&orderBy=folder,name_natural&supportsAllDrives=true&includeItemsFromAllDrives=true` +
        (pageToken ? '&pageToken=' + pageToken : '');
      const j = await (await gfetch(url)).json();
      files.push(...j.files);
      pageToken = j.nextPageToken;
    } while (pageToken);
    return files;
  },
  async get(id) { return (await gfetch(`${DRIVE}/files/${id}?fields=${FIELDS}&supportsAllDrives=true`)).json(); },
  async media(id) { return (await gfetch(`${DRIVE}/files/${id}?alt=media&supportsAllDrives=true`)).blob(); },
  async exportPdf(id) { return (await gfetch(`${DRIVE}/files/${id}/export?mimeType=application/pdf`)).blob(); },
  async copyAs(id, meta) {
    return (await gfetch(`${DRIVE}/files/${id}/copy?fields=id&supportsAllDrives=true`,
      { method: 'POST', headers: jsonHeaders, body: JSON.stringify(meta) })).json();
  },
  async remove(id) { await gfetch(`${DRIVE}/files/${id}?supportsAllDrives=true`, { method: 'DELETE' }); },
  async patch(id, meta) {
    return (await gfetch(`${DRIVE}/files/${id}?fields=${FIELDS}&supportsAllDrives=true`,
      { method: 'PATCH', headers: jsonHeaders, body: JSON.stringify(meta) })).json();
  },
  async upload(blob, meta) {
    const b = 'kp' + Math.random().toString(36).slice(2);
    const body = new Blob([
      `--${b}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(meta)}\r\n`,
      `--${b}\r\nContent-Type: ${meta.mimeType || blob.type || 'application/octet-stream'}\r\n\r\n`,
      blob, `\r\n--${b}--`,
    ]);
    return (await gfetch(`${UPLOAD}/files?uploadType=multipart&fields=${FIELDS}&supportsAllDrives=true`,
      { method: 'POST', headers: { 'Content-Type': 'multipart/related; boundary=' + b }, body })).json();
  },
  async mkdir(name, parent) {
    return (await gfetch(`${DRIVE}/files?fields=${FIELDS}&supportsAllDrives=true`,
      { method: 'POST', headers: jsonHeaders, body: JSON.stringify({ name, mimeType: FOLDER, parents: [parent] }) })).json();
  },
};

/* ---------------- סוגי קבצים ---------------- */
function kindOf(f) {
  const m = f.mimeType || '', n = (f.name || '').toLowerCase();
  if (m === FOLDER) return 'folder';
  if (m === 'application/pdf' || n.endsWith('.pdf')) return 'pdf';
  if (m === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || n.endsWith('.docx')) return 'docx';
  if (m === 'application/vnd.google-apps.document') return 'gdoc';
  if (m === 'application/msword' || m === 'application/rtf' || m === 'text/rtf' ||
      m === 'application/vnd.oasis.opendocument.text' || /\.(doc|rtf|odt)$/.test(n)) return 'doc';
  if (m.startsWith('image/')) return 'image';
  return null;
}
const KIND_LABEL = { pdf: 'PDF', docx: 'WORD', doc: 'WORD', gdoc: 'DOC', image: 'תמונה' };
const KIND_ICON = { folder: '🧶', pdf: '📄', docx: '📝', doc: '📝', gdoc: '📝', image: '🖼️' };
const isAppImage = (f) => f.appProperties && f.appProperties.kpRole === 'image';

/* ---------------- תמונות ---------------- */
const imgUrlCache = new Map();
async function imageUrl(id) {
  if (imgUrlCache.has(id)) return imgUrlCache.get(id);
  let blob = await idb.get('blobs', 'img:' + id);
  if (!blob) {
    blob = await drive.media(id);
    idb.put('blobs', 'img:' + id, blob);
  }
  const url = URL.createObjectURL(blob);
  imgUrlCache.set(id, url);
  return url;
}

// תור טעינת תמונות כדי לא להציף את הרשת
const imgQueue = [];
let imgActive = 0;
function queueImage(id, apply) {
  imgQueue.push({ id, apply });
  pumpImages();
}
function pumpImages() {
  while (imgActive < 4 && imgQueue.length) {
    const { id, apply } = imgQueue.shift();
    imgActive++;
    imageUrl(id).then(apply).catch(() => {}).finally(() => { imgActive--; pumpImages(); });
  }
}

async function resizeImage(file, max = 1200) {
  const bmp = await createImageBitmap(file).catch(() => null);
  let w, h, src = bmp;
  if (!bmp) {
    src = await new Promise((res, rej) => {
      const i = new Image();
      i.onload = () => res(i); i.onerror = rej;
      i.src = URL.createObjectURL(file);
    });
  }
  w = src.width; h = src.height;
  const s = Math.min(1, max / Math.max(w, h));
  const c = document.createElement('canvas');
  c.width = Math.round(w * s); c.height = Math.round(h * s);
  c.getContext('2d').drawImage(src, 0, 0, c.width, c.height);
  return new Promise((res) => c.toBlob(res, 'image/jpeg', 0.85));
}

function pickFile(input) {
  return new Promise((res) => {
    input.value = '';
    input.onchange = () => res(input.multiple ? [...input.files] : input.files[0]);
    input.click();
  });
}

async function setCover(target) {
  const file = await pickFile($('#imageInput'));
  if (!file) return;
  await busy('מעלה תמונה…', async () => {
    const blob = await resizeImage(file);
    const parent = target.mimeType === FOLDER ? target.id : ((target.parents && target.parents[0]) || nav.current().id);
    const img = await drive.upload(blob, {
      name: `_תמונה_${target.name}.jpg`, parents: [parent], mimeType: 'image/jpeg',
      appProperties: { kpRole: 'image', kpFor: target.id },
    });
    const old = target.appProperties && target.appProperties.kpCover;
    await drive.patch(target.id, { appProperties: { kpCover: img.id } });
    if (old) drive.patch(old, { trashed: true }).catch(() => {});
    await idb.put('blobs', 'img:' + img.id, blob);
  });
  toast('התמונה נשמרה');
  dash.load(true);
}

async function removeCover(target) {
  const old = target.appProperties && target.appProperties.kpCover;
  if (!old) return;
  await busy('מסיר תמונה…', async () => {
    await drive.patch(target.id, { appProperties: { kpCover: null } });
    drive.patch(old, { trashed: true }).catch(() => {});
  });
  dash.load(true);
}

/* ---------------- ניווט ---------------- */
const nav = {
  path: store.get('path', []), // [{id,name}]
  root() { return store.get('root', null); },
  current() { return this.path[this.path.length - 1] || this.root(); },
  reset() { this.path = []; store.set('path', []); },
  push(f) { this.path.push({ id: f.id, name: f.name }); store.set('path', this.path); },
  to(i) { this.path = this.path.slice(0, i); store.set('path', this.path); },
};

function show(view) {
  for (const v of ['#setupView', '#loginView', '#dashView', '#viewerView']) $(v).classList.toggle('hidden', v !== view);
}

/* ---------------- מודאל ותפריט ---------------- */
function openModal(title, body, buttons = []) {
  $('#modalTitle').textContent = title;
  const b = $('#modalBody'); b.innerHTML = ''; b.append(body);
  const f = $('#modalFoot'); f.innerHTML = '';
  for (const btn of buttons) f.append(btn);
  $('#modal').classList.remove('hidden');
}
function closeModal() { $('#modal').classList.add('hidden'); }
$('#modalClose').onclick = closeModal;
$('#modal').addEventListener('click', (e) => { if (e.target.id === 'modal') closeModal(); });

function openMenu(anchor, items) {
  const m = $('#menu');
  m.innerHTML = '';
  for (const it of items) m.append(el('button', { onclick: () => { closeMenu(); it.fn(); } }, it.label));
  m.classList.remove('hidden');
  const r = anchor.getBoundingClientRect();
  const mw = m.offsetWidth, mh = m.offsetHeight;
  m.style.top = clamp(r.bottom + 4, 8, innerHeight - mh - 8) + 'px';
  m.style.left = clamp(r.left, 8, innerWidth - mw - 8) + 'px';
}
function closeMenu() { $('#menu').classList.add('hidden'); }
document.addEventListener('pointerdown', (e) => { if (!e.target.closest('#menu') && !e.target.closest('.more')) closeMenu(); });

/* ---------------- בחירת תיקיית שורש ---------------- */
async function pickRootFolder() {
  const trail = [{ id: 'root', name: 'האחסון שלי' }];
  const body = el('div');
  const render = async () => {
    const cur = trail[trail.length - 1];
    body.innerHTML = '';
    const crumbs = el('div', { class: 'crumbs' });
    trail.forEach((t, i) => {
      if (i) crumbs.append(el('span', { class: 'sep' }, '›'));
      crumbs.append(i === trail.length - 1 ? el('span', { class: 'cur' }, t.name)
        : el('button', { onclick: () => { trail.length = i + 1; render(); } }, t.name));
    });
    body.append(crumbs, el('p', { class: 'muted' }, 'טוען תיקיות…'));
    let folders;
    try { folders = await drive.list(cur.id, true); } catch (e) { body.lastChild.textContent = 'שגיאה: ' + e.message; return; }
    body.lastChild.remove();
    const ul = el('ul', { class: 'folder-list' });
    if (!folders.length) ul.append(el('li', { class: 'muted' }, 'אין תת-תיקיות'));
    for (const f of folders) {
      ul.append(el('li', {}, el('button', { onclick: () => { trail.push({ id: f.id, name: f.name }); render(); } }, '📁', f.name)));
    }
    body.append(ul);
  };
  return new Promise((resolve) => {
    openModal('בחירת תיקיית הדוגמאות בדרייב', body, [
      el('button', { class: 'btn primary', onclick: () => {
        const cur = trail[trail.length - 1];
        store.set('root', { id: cur.id, name: cur.id === 'root' ? 'האחסון שלי' : cur.name });
        nav.reset(); closeModal(); resolve(true);
      } }, 'בחירת התיקייה הנוכחית'),
      el('button', { class: 'btn', onclick: async () => {
        const name = prompt('שם התיקייה החדשה:', 'דוגמאות סריגה');
        if (!name) return;
        const cur = trail[trail.length - 1];
        const f = await busy('יוצר תיקייה…', () => drive.mkdir(name, cur.id));
        trail.push({ id: f.id, name: f.name }); render();
      } }, '+ תיקייה חדשה כאן'),
    ]);
    render();
  });
}

/* ---------------- דשבורד ---------------- */
const dash = {
  items: [],
  async load(force = false) {
    const cur = nav.current();
    if (!cur) return;
    this.renderCrumbs();
    const key = 'list:' + cur.id;
    const cached = await idb.get('lists', key);
    if (cached && !force) { this.items = cached; this.render(); }
    try {
      const files = await drive.list(cur.id);
      this.items = files.filter((f) => !isAppImage(f) && kindOf(f));
      idb.put('lists', key, this.items);
      $('#offlineNote').classList.add('hidden');
      $('#authNote').classList.add('hidden');
      this.render();
    } catch (e) {
      if (e instanceof AuthError) $('#authNote').classList.remove('hidden');
      else if (!navigator.onLine) $('#offlineNote').classList.remove('hidden');
      else toast('שגיאה בטעינה: ' + e.message, 4000);
      if (!cached) this.render();
    }
  },
  renderCrumbs() {
    const c = $('#crumbs'); c.innerHTML = '';
    const root = nav.root();
    const atRoot = nav.path.length === 0;
    $('#backBtn').classList.toggle('hidden', atRoot);
    $('#dashTitle').textContent = atRoot ? 'MyPatterns' : nav.current().name;
    $('#recentSection').classList.toggle('hidden', !atRoot || !store.get('recent', []).length);
    if (atRoot) { c.classList.add('hidden'); this.renderRecent(); return; }
    c.classList.remove('hidden');
    c.append(el('button', { onclick: () => { nav.to(0); this.load(); } }, '🏠 ' + (root.name || 'ראשי')));
    nav.path.forEach((p, i) => {
      c.append(el('span', { class: 'sep' }, '›'));
      c.append(i === nav.path.length - 1 ? el('span', { class: 'cur' }, p.name)
        : el('button', { onclick: () => { nav.to(i + 1); this.load(); } }, p.name));
    });
  },
  renderRecent() {
    const row = $('#recentRow'); row.innerHTML = '';
    for (const r of store.get('recent', [])) {
      const th = el('div', { class: 'thumb' }, r.cover ? '' : KIND_ICON[r.kind] || '📄');
      if (r.cover) queueImage(r.cover, (u) => { th.style.backgroundImage = `url("${u}")`; });
      row.append(el('button', { class: 'recent-item', onclick: () => openFileById(r.id, r) }, th, el('span', {}, r.name)));
    }
  },
  render() {
    const grid = $('#grid'); grid.innerHTML = '';
    const q = $('#searchInput').value.trim().toLowerCase();
    const items = this.items.filter((f) => !q || f.name.toLowerCase().includes(q));
    $('#emptyNote').classList.toggle('hidden', items.length > 0);
    for (const f of items) grid.append(this.card(f));
  },
  card(f) {
    const kind = kindOf(f);
    const isFolder = kind === 'folder';
    const cover = el('div', { class: 'cover' }, KIND_ICON[kind] || '📄');
    const coverId = f.appProperties && f.appProperties.kpCover;
    if (coverId) queueImage(coverId, (u) => { cover.style.backgroundImage = `url("${u}")`; cover.classList.add('has-img'); });
    else if (kind === 'image') queueImage(f.id, (u) => { cover.style.backgroundImage = `url("${u}")`; cover.classList.add('has-img'); });
    const displayName = isFolder ? f.name : f.name.replace(/\.(pdf|docx?|rtf|odt|jpe?g|png|gif|webp|heic)$/i, '');
    const meta = el('div', { class: 'meta' }, el('div', { class: 'name' }, displayName),
      isFolder ? null : el('span', { class: 'badge ' + kind }, KIND_LABEL[kind]));
    const card = el('div', { class: 'card ' + (isFolder ? 'folder' : 'file'), title: f.name }, cover, meta);
    const st = !isFolder && loadLocalState(f.id);
    if (st && st.c) card.append(el('span', { class: 'progress-dot' }, 'שורה ' + st.c));
    const more = el('button', { class: 'more', 'aria-label': 'אפשרויות', onclick: (e) => {
      e.stopPropagation();
      const items = [{ label: coverId ? '🖼️ החלפת תמונה' : '🖼️ הוספת תמונה', fn: () => setCover(f).catch(err) }];
      if (coverId) items.push({ label: '🗑️ הסרת התמונה', fn: () => removeCover(f).catch(err) });
      items.push({ label: '↗ פתיחה בגוגל דרייב', fn: () => window.open(`https://drive.google.com/${isFolder ? 'drive/folders/' : 'file/d/'}${f.id}`, '_blank') });
      openMenu(e.currentTarget, items);
    } }, '⋯');
    card.append(more);
    card.addEventListener('click', () => {
      if (isFolder) { nav.push(f); $('#searchInput').value = ''; this.load(); scrollTo(0, 0); }
      else openFile(f);
    });
    return card;
  },
};

function err(e) {
  console.error(e);
  if (e instanceof AuthError) { $('#authNote').classList.remove('hidden'); toast('צריך להתחבר מחדש לגוגל'); }
  else toast('שגיאה: ' + (e.message || e), 4000);
}

/* ---------------- מצב לכל קובץ (סרגלים, מונה, זום) ---------------- */
const DEFAULT_STYLE = { hColor: '#ffd400', vColor: '#2ec4ff', opacity: 0.35, dim: false };
const style = Object.assign({}, DEFAULT_STYLE, store.get('style', {}));

function defaultState() {
  return { t: 0, z: 1, sx: 0, sy: 0, h: { on: 1, p: 0.35, th: 30 }, v: { on: 0, p: 0.5, th: 30 }, c: 0, lock: 0 };
}
function loadLocalState(id) { return store.get('st.' + id, null); }
function parseRemoteState(ap) {
  if (!ap || !ap.kpT) return null;
  try {
    const [z, sx, sy] = (ap.kpV || '1,0,0').split(',').map(Number);
    const [hOn, hp, hth, vOn, vp, vth] = (ap.kpR || '').split(',').map(Number);
    const s = defaultState();
    Object.assign(s, { t: Number(ap.kpT), z: z || 1, sx: sx || 0, sy: sy || 0, c: Number(ap.kpC) || 0 });
    if (!isNaN(hp)) s.h = { on: hOn, p: hp, th: hth || 30 };
    if (!isNaN(vp)) s.v = { on: vOn, p: vp, th: vth || 30 };
    return s;
  } catch { return null; }
}
const r4 = (n) => Math.round(n * 10000) / 10000;
function remoteProps(s) {
  return {
    kpT: String(s.t),
    kpV: [r4(s.z), r4(s.sx), r4(s.sy)].join(','),
    kpR: [s.h.on ? 1 : 0, r4(s.h.p), Math.round(s.h.th), s.v.on ? 1 : 0, r4(s.v.p), Math.round(s.v.th)].join(','),
    kpC: String(s.c),
  };
}

/* ---------------- מציג ---------------- */
const V = {
  file: null, kind: null, pdf: null, pages: [], st: null, fitW: 0, natW: 0,
  observer: null, renderGen: 0, docxHtml: null, img: null, local: false,
};
const scroller = $('#scroller');
const content = $('#content');
const stage = $('#stage');

function setSync(text) { $('#syncBadge').textContent = text; }

const pushRemote = debounce(async () => {
  if (V.local || !V.file || !navigator.onLine) { if (!V.local) setSync('⏸ לא מסונכרן'); return; }
  const file = V.file, st = V.st;
  try {
    setSync('⟳ שומר…');
    const updated = await drive.patch(file.id, { appProperties: remoteProps(st) });
    file.appProperties = updated.appProperties;
    if (V.file === file) setSync('✓ נשמר בדרייב');
  } catch (e) {
    if (V.file === file) setSync('⚠ לא נשמר');
    if (e instanceof AuthError) $('#authNote').classList.remove('hidden');
  }
}, 2500);

function saveState() {
  if (!V.file || !V.ready) return;
  const s = V.st;
  s.t = Date.now();
  const sw = scroller.scrollWidth - scroller.clientWidth, sh = scroller.scrollHeight - scroller.clientHeight;
  s.sx = sw > 0 ? scroller.scrollLeft / sw : 0;
  s.sy = sh > 0 ? scroller.scrollTop / sh : 0;
  store.set('st.' + V.file.id, s);
  pushRemote();
}
const saveStateSoon = debounce(saveState, 600);

async function openFileById(id, hint) {
  if (String(id).startsWith('local:')) { toast('קובץ מקומי – יש לפתוח אותו מחדש מהמכשיר'); return; }
  let f;
  try { f = await busy('פותח…', () => drive.get(id)); } catch (e) {
    if (hint && !navigator.onLine) f = { id, name: hint.name, mimeType: hint.mime || '', appProperties: {} };
    else return err(e);
  }
  openFile(f);
}

function addRecent(f) {
  if (V.local) return;
  const rec = store.get('recent', []).filter((r) => r.id !== f.id);
  rec.unshift({ id: f.id, name: f.name.replace(/\.[a-z0-9]+$/i, ''), kind: kindOf(f), mime: f.mimeType, cover: f.appProperties && f.appProperties.kpCover });
  store.set('recent', rec.slice(0, 8));
}

async function openFile(f, localBlob) {
  closeMenu();
  V.file = f; V.kind = kindOf(f); V.local = !!localBlob; V.ready = false;
  V.pdf = null; V.docxHtml = null; V.img = null; V.pages = [];
  const local = loadLocalState(f.id);
  const remote = parseRemoteState(f.appProperties);
  V.st = Object.assign(defaultState(), (remote && (!local || remote.t > local.t)) ? remote : (local || {}));
  addRecent(f);
  $('#viewerTitle').textContent = f.name;
  $('#accurateBtn').classList.toggle('hidden', !(V.kind === 'docx' && !V.local));
  $('#accurateBtn').textContent = 'תצוגה מדויקת';
  setSync(V.local ? 'קובץ מקומי' : '');
  content.innerHTML = '';
  show('#viewerView');
  if (location.hash !== '#view') history.pushState({ view: 1 }, '', '#view');
  applyRulers();
  applyLock();
  updateCounter();
  $('#viewerLoading').classList.remove('hidden');
  try {
    let blob = localBlob;
    if (V.kind === 'doc' || V.kind === 'gdoc') {
      blob = await convertedPdf(f);
      V.kind = 'pdf';
    } else if (!blob) {
      blob = await fileBlob(f);
    }
    await loadDoc(blob, V.kind);
  } catch (e) {
    err(e);
    content.innerHTML = '';
    content.append(el('div', { class: 'docx-page', style: 'max-width:520px;margin-top:40px' }, 'לא ניתן לפתוח את הקובץ: ' + (e.message || e)));
  } finally {
    $('#viewerLoading').classList.add('hidden');
  }
}

async function fileBlob(f) {
  const key = 'file:' + f.id + ':' + (f.modifiedTime || '');
  let blob = await idb.get('blobs', key);
  if (!blob) {
    blob = await drive.media(f.id);
    idb.put('blobs', key, blob);
    const old = store.get('fk.' + f.id, null);
    if (old && old !== key) idb.del('blobs', old);
    store.set('fk.' + f.id, key);
  }
  return blob;
}

async function convertedPdf(f) {
  const key = 'pdf:' + f.id + ':' + (f.modifiedTime || '');
  let blob = await idb.get('blobs', key);
  if (blob) return blob;
  if (f.mimeType === 'application/vnd.google-apps.document') {
    blob = await drive.exportPdf(f.id);
  } else {
    // המרה זמנית למסמך גוגל, ייצוא ל-PDF ומחיקת העותק
    const copy = await drive.copyAs(f.id, { name: '_זמני_' + f.name, mimeType: 'application/vnd.google-apps.document', parents: f.parents });
    try { blob = await drive.exportPdf(copy.id); } finally { drive.remove(copy.id).catch(() => {}); }
  }
  idb.put('blobs', key, blob);
  return blob;
}

async function loadDoc(blob, kind) {
  if (kind === 'pdf') {
    const data = new Uint8Array(await blob.arrayBuffer());
    V.pdf = await pdfjsLib.getDocument({ data }).promise;
    V.pages = [];
    for (let i = 1; i <= V.pdf.numPages; i++) {
      const page = await V.pdf.getPage(i);
      const vp = page.getViewport({ scale: 1 });
      V.pages.push({ page, w: vp.width, h: vp.height });
    }
    V.natW = Math.max(...V.pages.map((p) => p.w));
  } else if (kind === 'docx') {
    if (!window.mammoth) await new Promise((r) => window.addEventListener('load', r, { once: true }));
    const res = await mammoth.convertToHtml({ arrayBuffer: await blob.arrayBuffer() });
    V.docxHtml = res.value;
    V.natW = 794; // רוחב A4 בפיקסלים
  } else if (kind === 'image') {
    const url = URL.createObjectURL(blob);
    V.img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => rej(new Error('תמונה לא תקינה')); i.src = url; });
    V.natW = V.img.naturalWidth;
  } else {
    throw new Error('סוג קובץ לא נתמך');
  }
  layout();
  restoreScroll();
}

function computeFit() {
  const avail = scroller.clientWidth - 16;
  if (V.kind === 'docx') V.fitW = Math.min(avail, 860);
  else V.fitW = avail;
  return V.fitW;
}

function layout() {
  computeFit();
  const z = V.st.z;
  const gen = ++V.renderGen;
  if (V.observer) V.observer.disconnect();
  content.innerHTML = '';
  if (V.pdf) {
    const scale = (V.fitW / V.natW) * z;
    V.observer = new IntersectionObserver((entries) => {
      for (const en of entries) {
        const idx = Number(en.target.dataset.i);
        if (en.isIntersecting) renderPage(idx, scale, gen);
        else unrenderPage(idx);
      }
    }, { root: scroller, rootMargin: '150% 50%' });
    V.pages.forEach((p, i) => {
      const div = el('div', { class: 'page', 'data-i': i });
      div.style.width = Math.floor(p.w * scale) + 'px';
      div.style.height = Math.floor(p.h * scale) + 'px';
      p.div = div; p.canvas = null; p.task = null;
      content.append(div);
      V.observer.observe(div);
    });
  } else if (V.docxHtml != null) {
    const page = el('div', { class: 'docx-page' });
    page.innerHTML = V.docxHtml;
    page.style.width = V.fitW + 'px';
    page.style.zoom = z;
    content.append(page);
  } else if (V.img) {
    const w = V.fitW * z;
    V.img.className = 'img-page';
    V.img.style.width = w + 'px';
    V.img.draggable = false;
    content.append(V.img);
  }
}

function renderPage(i, scale, gen) {
  const p = V.pages[i];
  if (!p || p.canvas || gen !== V.renderGen) return;
  const dpr = window.devicePixelRatio || 1;
  let rs = scale * dpr;
  const maxPx = 16e6; // הגבלת זיכרון בטלפונים
  if (p.w * p.h * rs * rs > maxPx) rs = Math.sqrt(maxPx / (p.w * p.h));
  const vp = p.page.getViewport({ scale: rs });
  const canvas = document.createElement('canvas');
  canvas.width = Math.floor(vp.width);
  canvas.height = Math.floor(vp.height);
  p.canvas = canvas;
  p.task = p.page.render({ canvasContext: canvas.getContext('2d'), viewport: vp });
  p.task.promise.then(() => { if (p.canvas === canvas) p.div.append(canvas); }).catch(() => {});
}
function unrenderPage(i) {
  const p = V.pages[i];
  if (!p || !p.canvas) return;
  if (p.task) p.task.cancel();
  p.canvas.remove();
  p.canvas.width = p.canvas.height = 0;
  p.canvas = null;
}

function restoreScroll() {
  requestAnimationFrame(() => {
    const sw = scroller.scrollWidth - scroller.clientWidth, sh = scroller.scrollHeight - scroller.clientHeight;
    scroller.scrollLeft = V.st.sx * sw;
    scroller.scrollTop = V.st.sy * sh;
    V.ready = true;
  });
}

// זום שמשאיר נקודת מוקד במקום
function setZoom(z, fx, fy) {
  z = clamp(z, 0.3, 8);
  const old = V.st.z;
  if (Math.abs(z - old) < 0.001) return;
  if (fx == null) { fx = scroller.clientWidth / 2; fy = scroller.clientHeight / 2; }
  const cx = scroller.scrollLeft + fx, cy = scroller.scrollTop + fy;
  V.st.z = z;
  layout();
  const k = z / old;
  scroller.scrollLeft = cx * k - fx;
  scroller.scrollTop = cy * k - fy;
  saveStateSoon();
}

scroller.addEventListener('scroll', () => saveStateSoon(), { passive: true });
scroller.addEventListener('wheel', (e) => {
  if (!e.ctrlKey) return;
  e.preventDefault();
  const r = scroller.getBoundingClientRect();
  setZoom(V.st.z * (e.deltaY < 0 ? 1.12 : 1 / 1.12), e.clientX - r.left, e.clientY - r.top);
}, { passive: false });

// צביטה לזום במובייל
(() => {
  let pinch = null;
  const dist = (t) => Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY);
  scroller.addEventListener('touchstart', (e) => {
    if (e.touches.length === 2 && !V.st?.lock) {
      const r = scroller.getBoundingClientRect();
      const mx = (e.touches[0].clientX + e.touches[1].clientX) / 2 - r.left;
      const my = (e.touches[0].clientY + e.touches[1].clientY) / 2 - r.top;
      pinch = { d0: dist(e.touches), mx, my, k: 1 };
      content.style.transformOrigin = `${scroller.scrollLeft + mx}px ${scroller.scrollTop + my}px`;
    }
  }, { passive: true });
  scroller.addEventListener('touchmove', (e) => {
    if (!pinch || e.touches.length !== 2) return;
    e.preventDefault();
    pinch.k = clamp(dist(e.touches) / pinch.d0, 0.3 / V.st.z, 8 / V.st.z);
    content.style.transform = `scale(${pinch.k})`;
  }, { passive: false });
  const end = () => {
    if (!pinch) return;
    const p = pinch; pinch = null;
    content.style.transform = '';
    content.style.transformOrigin = '';
    setZoom(V.st.z * p.k, p.mx, p.my);
  };
  scroller.addEventListener('touchend', (e) => { if (e.touches.length < 2) end(); });
  scroller.addEventListener('touchcancel', end);
})();

window.addEventListener('resize', debounce(() => {
  if ($('#viewerView').classList.contains('hidden') || !V.file) return;
  const sx = V.st.sx, sy = V.st.sy;
  layout();
  V.st.sx = sx; V.st.sy = sy;
  restoreScroll();
  applyRulers();
}, 200));

/* ---------------- סרגלים ---------------- */
const hR = $('#hRuler'), vR = $('#vRuler'), dimLayer = $('#dimLayer');
const HIT_MIN = 44;

function applyRulers() {
  if (!V.st) return;
  const W = stage.clientWidth, H = stage.clientHeight;
  const h = V.st.h, v = V.st.v;
  h.th = clamp(h.th, 3, 250); v.th = clamp(v.th, 3, 250);
  const hHit = Math.max(h.th + 12, HIT_MIN), vHit = Math.max(v.th + 12, HIT_MIN);
  hR.style.height = hHit + 'px';
  hR.style.top = (h.p * H - hHit / 2) + 'px';
  hR.style.setProperty('--th', h.th + 'px');
  hR.style.setProperty('--rc', style.hColor);
  hR.style.setProperty('--ro', style.opacity);
  hR.classList.toggle('hidden', !h.on);
  vR.style.width = vHit + 'px';
  vR.style.left = (v.p * W - vHit / 2) + 'px';
  vR.style.setProperty('--th', v.th + 'px');
  vR.style.setProperty('--rc', style.vColor);
  vR.style.setProperty('--ro', style.opacity);
  vR.classList.toggle('hidden', !v.on);
  $('#hToggle').classList.toggle('on', !!h.on);
  $('#vToggle').classList.toggle('on', !!v.on);
  // האפלה של מה שמחוץ לסרגל האופקי
  const dimOn = style.dim && h.on;
  dimLayer.classList.toggle('hidden', !dimOn);
  if (dimOn) {
    const top = h.p * H - h.th / 2, bot = h.p * H + h.th / 2, c = 'rgba(0,0,0,.38)';
    dimLayer.style.background = `linear-gradient(to bottom, ${c} 0, ${c} ${top}px, transparent ${top}px, transparent ${bot}px, ${c} ${bot}px, ${c} 100%)`;
  }
  syncPanel();
}

function dragRuler(elm, axis) {
  elm.addEventListener('pointerdown', (e) => {
    if (e.button > 0) return;
    e.preventDefault(); e.stopPropagation();
    elm.setPointerCapture(e.pointerId);
    elm.classList.add('dragging');
    const r = V.st[axis];
    const size = axis === 'h' ? stage.clientHeight : stage.clientWidth;
    const start = axis === 'h' ? e.clientY : e.clientX;
    const p0 = r.p;
    const move = (ev) => {
      const d = (axis === 'h' ? ev.clientY : ev.clientX) - start;
      r.p = clamp(p0 + d / size, 0, 1);
      applyRulers();
    };
    const up = () => {
      elm.classList.remove('dragging');
      elm.removeEventListener('pointermove', move);
      elm.removeEventListener('pointerup', up);
      elm.removeEventListener('pointercancel', up);
      saveState();
    };
    elm.addEventListener('pointermove', move);
    elm.addEventListener('pointerup', up);
    elm.addEventListener('pointercancel', up);
  });
}
dragRuler(hR, 'h');
dragRuler(vR, 'v');

// הזזה בצעדים בגודל עובי הסרגל (שורה אחת)
function stepRuler(axis, dir) {
  const r = V.st[axis];
  if (!r.on) { r.on = 1; }
  const size = axis === 'h' ? stage.clientHeight : stage.clientWidth;
  r.p = clamp(r.p + (dir * r.th) / size, 0, 1);
  applyRulers();
  saveStateSoon();
}
$('#hUp').onclick = () => stepRuler('h', -1);
$('#hDown').onclick = () => stepRuler('h', 1);
$('#vRight').onclick = () => stepRuler('v', 1);
$('#vLeft').onclick = () => stepRuler('v', -1);
$('#hToggle').onclick = () => { V.st.h.on = V.st.h.on ? 0 : 1; applyRulers(); saveStateSoon(); };
$('#vToggle').onclick = () => { V.st.v.on = V.st.v.on ? 0 : 1; applyRulers(); saveStateSoon(); };

// מונה שורות
function updateCounter() { $('#cValue').textContent = V.st ? V.st.c : 0; }
$('#cPlus').onclick = () => { V.st.c++; updateCounter(); saveStateSoon(); };
$('#cMinus').onclick = () => { V.st.c = Math.max(0, V.st.c - 1); updateCounter(); saveStateSoon(); };
$('#cValue').onclick = () => {
  const v = prompt('מספר השורה (0 לאיפוס):', V.st.c);
  if (v == null) return;
  const n = parseInt(v, 10);
  if (!isNaN(n) && n >= 0) { V.st.c = n; updateCounter(); saveStateSoon(); }
};

// זום
$('#zoomIn').onclick = () => setZoom(V.st.z * 1.2);
$('#zoomOut').onclick = () => setZoom(V.st.z / 1.2);
$('#zoomFit').onclick = () => setZoom(1);

// נעילה
function applyLock() {
  scroller.classList.toggle('locked', !!V.st.lock);
  $('#lockToggle').checked = !!V.st.lock;
}

// פאנל הגדרות סרגלים
$('#panelToggle').onclick = () => {
  const p = $('#rulerPanel');
  p.classList.toggle('hidden');
  $('#panelToggle').classList.toggle('on', !p.classList.contains('hidden'));
  requestAnimationFrame(applyRulers);
};
function syncPanel() {
  if (!V.st) return;
  $('#hThick').value = V.st.h.th; $('#hThickOut').textContent = V.st.h.th;
  $('#vThick').value = V.st.v.th; $('#vThickOut').textContent = V.st.v.th;
  $('#hColor').value = style.hColor; $('#vColor').value = style.vColor;
  $('#opacity').value = style.opacity; $('#opacityOut').textContent = Math.round(style.opacity * 100) + '%';
  $('#dimToggle').checked = !!style.dim;
}
const saveStyle = () => store.set('style', style);
$('#hThick').oninput = (e) => { V.st.h.th = Number(e.target.value); V.st.h.on = 1; applyRulers(); saveStateSoon(); };
$('#vThick').oninput = (e) => { V.st.v.th = Number(e.target.value); V.st.v.on = 1; applyRulers(); saveStateSoon(); };
$('#hColor').oninput = (e) => { style.hColor = e.target.value; applyRulers(); saveStyle(); };
$('#vColor').oninput = (e) => { style.vColor = e.target.value; applyRulers(); saveStyle(); };
$('#opacity').oninput = (e) => { style.opacity = Number(e.target.value); applyRulers(); saveStyle(); };
$('#dimToggle').onchange = (e) => { style.dim = e.target.checked; applyRulers(); saveStyle(); };
$('#lockToggle').onchange = (e) => { V.st.lock = e.target.checked ? 1 : 0; applyLock(); saveStateSoon(); };

// מקלדת במחשב
document.addEventListener('keydown', (e) => {
  if ($('#viewerView').classList.contains('hidden') || !V.st) return;
  if (e.target.matches('input')) return;
  const map = { ArrowUp: ['h', -1], ArrowDown: ['h', 1], ArrowLeft: ['v', -1], ArrowRight: ['v', 1] };
  if (map[e.key]) { e.preventDefault(); stepRuler(...map[e.key]); }
  else if (e.key === '+' || e.key === '=') { V.st.c++; updateCounter(); saveStateSoon(); }
  else if (e.key === '-') { V.st.c = Math.max(0, V.st.c - 1); updateCounter(); saveStateSoon(); }
  else if (e.key === 'Escape') closeViewer();
});

$('#accurateBtn').onclick = async () => {
  if (V.kind !== 'docx' || !V.file) return;
  $('#viewerLoading').classList.remove('hidden');
  try {
    const blob = await convertedPdf(V.file);
    V.kind = 'pdf'; V.docxHtml = null;
    await loadDoc(blob, 'pdf');
    $('#accurateBtn').classList.add('hidden');
  } catch (e) { err(e); } finally { $('#viewerLoading').classList.add('hidden'); }
};

function closeViewer(fromPop) {
  if (V.file) saveState();
  if (V.observer) V.observer.disconnect();
  if (V.pdf) V.pdf.destroy();
  V.pdf = null; V.file = null; V.pages = [];
  content.innerHTML = '';
  if (!fromPop && location.hash === '#view') history.back();
  start();
}
$('#closeViewerBtn').onclick = () => closeViewer();
window.addEventListener('popstate', () => {
  if (!$('#viewerView').classList.contains('hidden')) closeViewer(true);
});
document.addEventListener('visibilitychange', () => { if (document.hidden && V.file) saveState(); });

/* ---------------- פתיחת קובץ מקומי ---------------- */
document.querySelectorAll('.open-local-btn').forEach((b) => b.addEventListener('click', async () => {
  const f = await pickFile($('#localInput'));
  if (!f) return;
  const meta = { id: 'local:' + f.name + ':' + f.size, name: f.name, mimeType: f.type, appProperties: {} };
  if (!kindOf(meta) || kindOf(meta) === 'doc') { toast('אפשר לפתוח מהמכשיר PDF, DOCX או תמונה'); return; }
  openFile(meta, f);
}));

/* ---------------- הגדרות ---------------- */
function openSettings() {
  const root = nav.root();
  const body = el('div', { class: 'settings-list' },
    el('div', { class: 'row' },
      el('div', {}, el('b', {}, 'תיקיית הדוגמאות'), el('small', {}, root ? root.name : 'לא נבחרה')),
      el('button', { class: 'btn', onclick: async () => { closeModal(); if (await pickRootFolder()) { show('#dashView'); dash.load(true); } } }, 'שינוי')),
    el('div', { class: 'row' },
      el('div', {}, el('b', {}, 'פתיחת קובץ מהמכשיר'), el('small', {}, 'צפייה בקובץ שלא נמצא בדרייב')),
      el('button', { class: 'btn', onclick: () => { closeModal(); document.querySelector('.open-local-btn').click(); } }, 'פתיחה')),
    el('div', { class: 'row' },
      el('div', {}, el('b', {}, 'ניקוי זיכרון מטמון'), el('small', {}, 'מחיקת קבצים ששמורים לשימוש בלי אינטרנט')),
      el('button', { class: 'btn', onclick: async () => { indexedDB.deleteDatabase('mypatterns'); toast('המטמון נוקה'); setTimeout(() => location.reload(), 600); } }, 'ניקוי')),
    el('div', { class: 'row' },
      el('div', {}, el('b', {}, 'Client ID'), el('small', { dir: 'ltr' }, clientId() || '—')),
      el('button', { class: 'btn', onclick: () => { store.set('clientId', ''); auth.signOut(); location.reload(); } }, 'שינוי')),
    el('div', { class: 'row' },
      el('div', {}, el('b', {}, 'התנתקות מגוגל')),
      el('button', { class: 'btn danger', onclick: () => { auth.signOut(); closeModal(); start(); } }, 'התנתקות')),
  );
  openModal('הגדרות', body);
}

/* ---------------- הוספה (העלאה / תיקייה) ---------------- */
function openAddMenu(anchor) {
  openMenu(anchor, [
    { label: '⬆️ העלאת דוגמה (PDF / Word / תמונה)', fn: uploadPatterns },
    { label: '📁 תיקייה חדשה', fn: newFolder },
  ]);
}
async function uploadPatterns() {
  const files = await pickFile($('#uploadInput'));
  if (!files || !files.length) return;
  const cur = nav.current();
  await busy('מעלה…', async () => {
    for (const [i, f] of files.entries()) {
      $('#busyText').textContent = `מעלה ${i + 1}/${files.length}: ${f.name}`;
      await drive.upload(f, { name: f.name, parents: [cur.id], mimeType: f.type || undefined });
    }
  }).catch(err);
  toast('ההעלאה הסתיימה');
  dash.load(true);
}
async function newFolder() {
  const name = prompt('שם התיקייה (למשל: סוודר לחורף):');
  if (!name) return;
  try {
    const f = await busy('יוצר תיקייה…', () => drive.mkdir(name, nav.current().id));
    toast('התיקייה נוצרה – אפשר להוסיף לה תמונה');
    dash.load(true);
    return f;
  } catch (e) { err(e); }
}

/* ---------------- אירועי דשבורד ---------------- */
$('#refreshBtn').onclick = () => dash.load(true);
$('#settingsBtn').onclick = openSettings;
$('#addBtn').onclick = (e) => openAddMenu(e.currentTarget);
$('#backBtn').onclick = () => { nav.to(nav.path.length - 1); dash.load(); };
$('#searchInput').oninput = () => dash.render();
$('#reauthBtn').onclick = async () => {
  try { await auth.request(''); $('#authNote').classList.add('hidden'); dash.load(true); } catch (e) { err(e); }
};
$('#saveClientIdBtn').onclick = () => {
  const v = $('#clientIdInput').value.trim();
  if (!/\.apps\.googleusercontent\.com$/.test(v)) { toast('ה-Client ID צריך להסתיים ב-apps.googleusercontent.com'); return; }
  store.set('clientId', v);
  start();
};
$('#resetClientBtn').onclick = () => { store.set('clientId', ''); start(); };
$('#loginBtn').onclick = async () => {
  try {
    await auth.request('select_account');
    start();
  } catch (e) {
    toast('ההתחברות נכשלה: ' + e.message, 4000);
  }
};
window.addEventListener('online', () => { $('#offlineNote').classList.add('hidden'); if (V.file) pushRemote(); });

/* ---------------- הפעלה ---------------- */
async function start() {
  if (!clientId()) { show('#setupView'); return; }
  if (!auth.valid() && !store.get('signedIn', false)) { show('#loginView'); return; }
  if (!nav.root()) {
    show('#dashView');
    try {
      if (!auth.valid()) await auth.request('');
      if (!(await pickRootFolder())) return;
    } catch { show('#loginView'); return; }
  }
  show('#dashView');
  dash.load();
}

if (window.pdfjsLib) pdfjsLib.GlobalWorkerOptions.workerSrc = 'vendor/pdf.worker.min.js';
if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
if (location.hash === '#view') history.replaceState(null, '', location.pathname);
start();
