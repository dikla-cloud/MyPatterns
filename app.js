/* MyPatterns – אפליקציית מעקב אחרי דוגמאות סריגה המסונכרנת לגוגל דרייב */
'use strict';
const APP_V = 56;

// גישה מצומצמת: רק לקבצים שהאפליקציה יצרה או שנבחרו בבורר הקבצים של גוגל
const SCOPES = 'https://www.googleapis.com/auth/drive.file';
const SCOPE_VERSION = 2;
const DRIVE = 'https://www.googleapis.com/drive/v3';
const UPLOAD = 'https://www.googleapis.com/upload/drive/v3';
const FOLDER = 'application/vnd.google-apps.folder';
const FIELDS = 'id,name,mimeType,modifiedTime,appProperties,size,parents,description,shortcutDetails';
const SHORTCUT = 'application/vnd.google-apps.shortcut';
const LINK_MIME = 'application/x-mswinurl';

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
function apiKey() {
  return (window.KNIT_CONFIG && window.KNIT_CONFIG.apiKey) || store.get('apiKey', '');
}
// מספר הפרויקט (App ID) הוא הספרות שבתחילת ה-Client ID
function appId() { return (clientId().match(/^(\d+)-/) || [])[1] || ''; }

// מעבר מהגרסה הקודמת (גישה מלאה לדרייב) – צריך להתחבר ולבחור תיקייה מחדש
if (store.get('scopeV', 0) !== SCOPE_VERSION) {
  store.set('token', null);
  store.set('signedIn', false);
  store.set('root', null);
  store.set('path', []);
  store.set('scopeV', SCOPE_VERSION);
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

// שרת ההתחברות ב-Cloudflare (אם הוגדר ב-config.js) – שומר על החיבור לגוגל לאורך שבועות
// אם ההתחברות דרך השרת נכשלה – בפעם הזו חוזרים להתחברות הרגילה של גוגל
const authServer = () => (sessionStorage.getItem('kp.noAuthServer') ? '' : ((window.KNIT_CONFIG && window.KNIT_CONFIG.authServer) || '').replace(/\/+$/, ''));
const auth = {
  token: store.get('token', null),
  rt: store.get('rt', null),
  refreshing: null,
  canSilent() { return !!(authServer() && this.rt); },
  // חידוש שקט דרך השרת – בלי חלונות ובלי נגיעה
  refresh() {
    if (this.refreshing) return this.refreshing;
    this.refreshing = (async () => {
      const r = await fetch(authServer() + '/refresh', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ rt: this.rt }) });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || !j.at) {
        if (r.status === 401) { this.rt = null; store.set('rt', null); }
        throw new AuthError(j.error || 'refresh');
      }
      this._done({ access_token: j.at, expires_in: j.exp });
      return this.token.v;
    })().finally(() => { this.refreshing = null; });
    return this.refreshing;
  },
  // התחברות מלאה: עם שרת – מעבר לדף של גוגל וחזרה; בלי שרת – חלון גוגל
  login(prompt = '') {
    if (authServer()) {
      const acc = store.get('account', null);
      const hint = acc && acc.emailAddress && prompt !== 'select_account' ? '&hint=' + encodeURIComponent(acc.emailAddress) : '';
      location.href = authServer() + '/login?ret=' + encodeURIComponent(location.origin + location.pathname) + hint;
      return new Promise(() => {});
    }
    return this.request(prompt);
  },
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
    // רמז לחשבון המחובר – כך גוגל מחדשת את ההרשאה בלי לבקש לבחור חשבון שוב
    const acc = store.get('account', null);
    this.client.requestAccessToken(acc && acc.emailAddress && !prompt ? { prompt, login_hint: acc.emailAddress } : { prompt });
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
    if (this.canSilent()) return this.refresh();
    if (authServer()) throw new AuthError('login');
    try { return await this.request(''); } catch (e) { throw new AuthError(e.message); }
  },
  signOut() {
    if (this.canSilent()) fetch(authServer() + '/revoke', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ rt: this.rt }) }).catch(() => {});
    this.rt = null; store.set('rt', null);
    try { if (this.token && window.google) google.accounts.oauth2.revoke(this.token.v, () => {}); } catch { /* ignore */ }
    this.token = null;
    store.set('token', null);
    store.set('signedIn', false);
  },
};

// ההרשאה של גוגל תקפה לשעה. דפדפנים מאפשרים לחדש אותה רק בעקבות נגיעה של המשתמשת,
// ולכן בנגיעה הראשונה אחרי שפג תוקפה (או כמה דקות לפני) מחדשים אותה ברקע – בלי לחזור למסך ההתחברות.
function renewOnGesture() {
  if (auth.canSilent() || !store.get('signedIn', false) || auth.pending || !auth.client) return;
  if (auth.token && auth.token.exp > Date.now() + 5 * 60000) return;
  auth.request('').then(() => {
    $('#authNote').classList.add('hidden');
    if (!$('#dashView').classList.contains('hidden')) dash.load(true);
    if (V.file && !V.local) pushRemote();
  }).catch(() => {});
}
document.addEventListener('pointerdown', renewOnGesture, true);
document.addEventListener('keydown', renewOnGesture, true);

/* ---------------- Google Drive API ---------------- */
async function gfetch(url, opts = {}, retry = true) {
  const tok = await auth.get();
  const r = await fetch(url, { ...opts, headers: { ...(opts.headers || {}), Authorization: 'Bearer ' + tok } });
  if (r.status === 401 && retry) {
    auth.token = null; store.set('token', null);
    return gfetch(url, opts, false);
  }
  if (r.status === 401) throw new AuthError('401');
  if (!r.ok) {
    let msg = t('errorN', { n: r.status });
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
  // חיפוש לפי שאילתה (למשל לפי סימון שהאפליקציה שמה על קבצים)
  async query(q) {
    const r = await gfetch(`${DRIVE}/files?q=${encodeURIComponent(q + ' and trashed=false')}&fields=files(${FIELDS})&pageSize=200&supportsAllDrives=true&includeItemsFromAllDrives=true`);
    return (await r.json()).files || [];
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
  // העברה לתיקייה אחרת
  async move(id, from, to) {
    return (await gfetch(`${DRIVE}/files/${id}?addParents=${to}&removeParents=${from}&fields=${FIELDS}&supportsAllDrives=true`,
      { method: 'PATCH', headers: jsonHeaders, body: '{}' })).json();
  },
  async upload(blob, meta) {
    const b = 'kp' + Math.random().toString(36).slice(2);
    const body = new Blob([
      `--${b}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(meta)}\r\n`,
      `--${b}\r\nContent-Type: ${blob.type || meta.mimeType || 'application/octet-stream'}\r\n\r\n`,
      blob, `\r\n--${b}--`,
    ]);
    return (await gfetch(`${UPLOAD}/files?uploadType=multipart&fields=${FIELDS}&supportsAllDrives=true`,
      { method: 'POST', headers: { 'Content-Type': 'multipart/related; boundary=' + b }, body })).json();
  },
  // החלפת התוכן של קובץ קיים (למשל שמירה חוזרת של עיצוב)
  async updateMedia(id, blob) {
    return (await gfetch(`${UPLOAD}/files/${id}?uploadType=media&fields=${FIELDS}&supportsAllDrives=true`,
      { method: 'PATCH', headers: { 'Content-Type': blob.type || 'application/octet-stream' }, body: blob })).json();
  },
  async about() {
    return (await gfetch(`${DRIVE}/about?fields=user(displayName,emailAddress,photoLink)`)).json();
  },
  // קיצור דרך בתיקייה לקובץ שנמצא במקום אחר בדרייב (בלי להעתיק ובלי להזיז)
  async shortcut(target, parent) {
    return (await gfetch(`${DRIVE}/files?fields=${FIELDS}&supportsAllDrives=true`,
      { method: 'POST', headers: jsonHeaders, body: JSON.stringify({ name: target.name, mimeType: SHORTCUT, shortcutDetails: { targetId: target.id }, parents: [parent] }) })).json();
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
  if ((f.appProperties && f.appProperties.kpRole === 'link') || n.endsWith('.url')) return 'link';
  if (m === 'application/pdf' || n.endsWith('.pdf')) return 'pdf';
  if (m === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || n.endsWith('.docx')) return 'docx';
  if (m === 'application/vnd.google-apps.document') return 'gdoc';
  if (m === 'application/vnd.google-apps.spreadsheet') return 'gsheet';
  if (/spreadsheet|ms-excel|text\/csv/.test(m) || /\.(xlsx|xls|ods|csv)$/.test(n)) return 'sheet';
  if (m === 'application/msword' || m === 'application/rtf' || m === 'text/rtf' ||
      m === 'application/vnd.oasis.opendocument.text' || /\.(doc|rtf|odt)$/.test(n)) return 'doc';
  if (m.startsWith('image/')) return 'image';
  return null;
}
const KIND_LABEL = { link: '🔗', pdf: 'PDF', docx: 'WORD', doc: 'WORD', gdoc: 'DOC', sheet: 'EXCEL', gsheet: 'SHEET' };
const kindLabel = (k) => (k === 'image' ? t('kindImage') : k === 'link' ? t('kindLink') : KIND_LABEL[k]);
// סוגים שמוצגים אחרי המרה ל-PDF דרך גוגל
const CONVERTED = ['doc', 'gdoc', 'sheet', 'gsheet'];
const KIND_ICON = { folder: '', pdf: '📄', docx: '📝', doc: '📝', gdoc: '📝', sheet: '📊', gsheet: '📊', image: '🖼️', link: '🔗' };
// קבצי עזר של האפליקציה (תמונות שער, נתוני עיצוב) – לא מוצגים ברשימה
const isAppImage = (f) => f.appProperties && (f.appProperties.kpRole === 'image' || f.appProperties.kpRole === 'design');
// מזהה התמונה המייצגת ('none' = הוסרה בכוונה ולא מחפשים אוטומטית)
const coverOf = (f) => { const c = f && f.appProperties && f.appProperties.kpCover; return c && c !== 'none' ? c : null; };

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

// תמונה לדוגמה או לתיקייה: מהמכשיר (גלריה / מחשב) או מגוגל דרייב
function setCover(target) {
  const opt = (icon, title, hint, fn) => el('button', { class: 'sheet-opt', onclick: () => { closeModal(); fn().catch(err); } },
    el('span', { class: 'sheet-icon' }, icon), el('span', { class: 'sheet-text' }, el('b', {}, title), el('small', {}, hint)));
  openModal(t('coverFromTitle'), el('div', { class: 'add-sheet' },
    opt('📱', t('coverFromDevice'), t('coverFromDeviceHint'), () => setCoverFromDevice(target)),
    opt('☁️', t('coverFromDrive'), t('coverFromDriveHint'), () => setCoverFromDrive(target))));
  return Promise.resolve();
}
async function setCoverFromDevice(target) {
  const file = await pickFile($('#imageInput'));
  if (!file) return;
  await busy(t('uploadingImage'), async () => saveCover(target, await resizeImage(file), { kpAuto: 'manual' }));
  toast(t('imageSaved'));
  dash.load(true);
}
async function setCoverFromDrive(target) {
  const docs = await showPicker({
    title: t('coverFromDrive'),
    view: (P) => new P.DocsView(P.ViewId.DOCS_IMAGES).setIncludeFolders(true).setMode(P.DocsViewMode.GRID),
  });
  if (!docs || !docs.length) return;
  const d = docs[0];
  await busy(t('uploadingImage'), async () => {
    const blob = await drive.media(d.id);
    const file = new File([blob], d.name || 'image.jpg', { type: d.mimeType || blob.type || 'image/jpeg' });
    let small = null;
    try { small = await resizeImage(file); } catch { /* פורמט שהדפדפן לא מכיר */ }
    return saveCover(target, small || file, { kpAuto: 'manual' });
  });
  toast(t('imageSaved'));
  dash.load(true);
}

// מעלה תמונה לדרייב ומקשר אותה לקובץ/תיקייה
async function saveCover(target, blob, extraProps = {}) {
  const parent = target.mimeType === FOLDER ? target.id : ((target.parents && target.parents[0]) || nav.current().id);
  const img = await drive.upload(blob, {
    name: `_cover_${target.name}.jpg`, parents: [parent], mimeType: 'image/jpeg',
    appProperties: { kpRole: 'image', kpFor: target.id },
  });
  await idb.put('blobs', 'img:' + img.id, blob);
  const old = coverOf(target);
  const updated = await drive.patch(target.id, { appProperties: { kpCover: img.id, ...extraProps } });
  target.appProperties = updated.appProperties;
  if (old) drive.patch(old, { trashed: true }).catch(() => {});
  return img.id;
}

async function rescanCover(f) {
  const id = await busy(t('searchingImage'), async () => {
    const blob = await findCoverImage(f);
    if (!blob) return null;
    return saveCover(f, blob, { kpAuto: AUTO_V });
  });
  toast(id ? t('imageFound') : t('imageNotFound'));
  dash.load(true);
}

// שינוי שם – גם בדרייב. הסיומת (‎.pdf, ‎.docx…) נשמרת כדי שהקובץ ימשיך להיפתח
async function renameItem(f) {
  const isFolder = f.mimeType === FOLDER;
  const m = !isFolder && !String(f.mimeType).startsWith('application/vnd.google-apps') && f.name.match(/(\.[a-z0-9]{2,5})$/i);
  const ext = m ? m[1] : '';
  const base = ext ? f.name.slice(0, -ext.length) : f.name;
  const v = prompt(t('renamePrompt'), base);
  if (v == null) return;
  const name = v.trim().replace(/[\\/]/g, ' ');
  if (!name || name === base) return;
  const updated = await busy(t('saving'), () => drive.patch(f.id, { name: name + ext }));
  f.name = updated.name;
  store.set('recent', store.get('recent', []).map((r) => (r.id === f.id ? { ...r, name } : r)));
  if (isFolder) store.set('path', nav.path.map((x) => (x.id === f.id ? { ...x, name: updated.name } : x)));
  toast(t('renamed'));
  dash.load(true);
}

// העברה לתיקייה אחרת – בוחרים תיקייה מתוך התיקייה הראשית ותתי-התיקיות שלה
async function moveItem(f) {
  const root = nav.root();
  const from = f._shortcut ? (f._scParent || nav.current().id) : ((f.parents && f.parents[0]) || nav.current().id);
  const trail = [{ id: root.id, name: root.name }];
  const list = el('div', { class: 'move-list' });
  const crumbs = el('div', { class: 'move-crumbs' });
  const here = el('button', { class: 'btn primary', onclick: async () => {
    const to = trail[trail.length - 1];
    if (to.id === from) { closeModal(); return; }
    closeModal();
    try {
      await busy(t('moving'), async () => {
        if (f._shortcut) { await drive.move(f._shortcut, f._scParent || from, to.id); return; }
        await drive.move(f.id, from, to.id);
        const c = coverOf(f);
        if (c) drive.move(c, from, to.id).catch(() => {}); // תמונת השער עוברת יחד איתה
      });
      toast(t('movedTo', { name: to.name }), 4000);
      dash.load(true);
    } catch (e) { err(e); }
  } });
  const render = async () => {
    const cur = trail[trail.length - 1];
    here.textContent = t('moveHere', { name: cur.name });
    crumbs.innerHTML = '';
    trail.forEach((x, i) => {
      if (i) crumbs.append(el('span', { class: 'sep' }, '›'));
      crumbs.append(el('button', { class: 'btn link', onclick: () => { trail.length = i + 1; render(); } }, i ? x.name : '🏠 ' + x.name));
    });
    list.innerHTML = '';
    list.append(el('p', { class: 'muted small-note' }, t('loading')));
    let folders = [];
    try { folders = (await drive.list(cur.id, true)).filter((x) => x.id !== f.id); } catch (e) { err(e); }
    list.innerHTML = '';
    if (!folders.length) list.append(el('p', { class: 'muted small-note' }, t('noSubfolders')));
    for (const x of folders) list.append(el('button', { class: 'move-folder', onclick: () => { trail.push({ id: x.id, name: x.name }); render(); } }, '📁 ' + x.name));
  };
  openModal(t('moveTitle', { name: f.name }), el('div', {}, crumbs, list), [here]);
  render();
}

// מחיקת דוגמה (גם תמונה שהועלתה כדוגמה) – מעבר לאשפה של הדרייב, אפשר לשחזר משם
async function deletePattern(f) {
  if (f._shortcut) {
    // דוגמה שנוספה מתיקייה אחרת – מסירים רק אותה מכאן, המקור נשאר בדרייב
    if (!confirm(t('removeShortcutConfirm', { name: f.name }))) return;
    await busy(t('deleting'), () => drive.patch(f._shortcut, { trashed: true }));
    toast(t('deleted'), 3000); dash.load(true); return;
  }
  if (!confirm(t('deleteConfirm', { name: f.name }))) return;
  await busy(t('deleting'), async () => {
    await drive.patch(f.id, { trashed: true });
    const c = coverOf(f);
    if (c) drive.patch(c, { trashed: true }).catch(() => {});
  });
  store.set('recent', store.get('recent', []).filter((r) => r.id !== f.id));
  toast(t('deleted'), 4000);
  dash.load(true);
}

async function removeCover(target) {
  const old = coverOf(target);
  // גם כשהתמונה מגיעה מדוגמה שבתוך התיקייה – מסמנים שהכרטיס יישאר בלי תמונה
  await busy(t('removingImage'), async () => {
    await drive.patch(target.id, { appProperties: { kpCover: 'none' } });
    if (old) drive.patch(old, { trashed: true }).catch(() => {});
  });
  dash.load(true);
}

/* ---------------- תמונה אוטומטית מתוך הקובץ ---------------- */
const AUTO_V = '2';              // גרסת האלגוריתם – קובץ שנבדק לא נבדק שוב ('manual' = תמונה שנבחרה ידנית)
const MIN_FRAC = 0.2;            // תמונה צרה מ-20% מרוחב העמוד היא כנראה לוגו או אייקון
const MAX_RATIO = 3;             // פסים ארוכים וצרים (כותרות, באנרים) – לא תמונת שער
const autoQueue = [];
let autoBusy = false;
const autoPending = new Map();

function autoCover(f) {
  const kind = kindOf(f);
  if (!['pdf', 'docx', 'doc', 'gdoc'].includes(kind)) return Promise.resolve(null);
  const ap = f.appProperties || {};
  if (ap.kpCover === 'none' || ap.kpAuto === AUTO_V || ap.kpAuto === 'manual') return Promise.resolve(coverOf(f));
  if (autoPending.has(f.id)) return autoPending.get(f.id);
  const p = new Promise((resolve) => autoQueue.push({ f, resolve }));
  autoPending.set(f.id, p);
  pumpAuto();
  return p;
}

async function pumpAuto() {
  if (autoBusy) return;
  autoBusy = true;
  while (autoQueue.length) {
    const { f, resolve } = autoQueue.shift();
    let id = null;
    try {
      const blob = await findCoverImage(f);
      const extra = { kpAuto: AUTO_V };
      if (blob) id = await saveCover(f, blob, extra);
      else { const u = await drive.patch(f.id, { appProperties: extra }); f.appProperties = u.appProperties; }
      updateCachedItem(f);
    } catch (e) { console.warn('auto cover', f.name, e); }
    autoPending.delete(f.id);
    resolve(id);
  }
  autoBusy = false;
}

// שמירת המאפיינים המעודכנים ברשימה השמורה במכשיר
async function updateCachedItem(f) {
  const parent = f.parents && f.parents[0];
  if (!parent) return;
  const key = 'list:' + parent;
  const list = await idb.get('lists', key);
  if (!list) return;
  const it = list.find((x) => x.id === f.id);
  if (it) { it.appProperties = f.appProperties; idb.put('lists', key, list); }
}

// לתיקייה בלי תמונה: התמונה של אחת הדוגמאות שבתוכה
async function folderCover(folder) {
  const key = 'list:' + folder.id;
  let list = await idb.get('lists', key);
  if (!list) {
    list = (await drive.list(folder.id)).filter((x) => !isAppImage(x) && kindOf(x));
    idb.put('lists', key, list);
  }
  const withCover = list.find((x) => coverOf(x));
  if (withCover) return coverOf(withCover);
  const img = list.find((x) => kindOf(x) === 'image');
  if (img) return img.id;
  for (const x of list) {
    if (kindOf(x) === 'folder') continue;
    const id = await autoCover(x);
    if (id) return id;
  }
  return null;
}

async function findCoverImage(f) {
  const kind = kindOf(f);
  if (kind === 'docx') {
    const fromDocx = await docxImage(await fileBlob(f));
    if (fromDocx) return fromDocx;
    // אין תמונה מתאימה – תצוגה של העמוד הראשון (דרך המרה זמנית ל-PDF)
    return pdfImage(await convertedPdf(f));
  }
  const blob = kind === 'pdf' ? await fileBlob(f) : await convertedPdf(f);
  return pdfImage(blob);
}

async function blobToCanvasJpeg(source, sx, sy, sw, sh) {
  const s = Math.min(1, 1000 / Math.max(sw, sh));
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.round(sw * s)); c.height = Math.max(1, Math.round(sh * s));
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, c.width, c.height);
  ctx.drawImage(source, sx, sy, sw, sh, 0, 0, c.width, c.height);
  return new Promise((res) => c.toBlob(res, 'image/jpeg', 0.85));
}

// התמונה הראשונה בגודל סביר במסמך Word
async function docxImage(blob) {
  if (!window.mammoth) await new Promise((r) => window.addEventListener('load', r, { once: true }));
  const imgs = [];
  await mammoth.convertToHtml({ arrayBuffer: await blob.arrayBuffer() }, {
    convertImage: mammoth.images.imgElement(async (image) => {
      if (imgs.length < 8) imgs.push(new Blob([await image.read()], { type: image.contentType }));
      return { src: '' };
    }),
  });
  // התמונה הגדולה ביותר שאינה לוגו (קטנה) או פס צר
  let best = null;
  for (const b of imgs) {
    const bmp = await createImageBitmap(b).catch(() => null);
    if (!bmp) continue;
    const mn = Math.min(bmp.width, bmp.height), mx = Math.max(bmp.width, bmp.height);
    if (mn < 180 || mx / mn > MAX_RATIO) continue;
    if (!best || bmp.width * bmp.height > best.width * best.height) best = bmp;
  }
  return best ? blobToCanvasJpeg(best, 0, 0, best.width, best.height) : null;
}

// תמונת השער של PDF: התמונה הגדולה ביותר בשלושת העמודים הראשונים, בלי לוגואים, אייקונים ופסים צרים.
// אם אין תמונה כזו – תצוגה של החלק העליון של העמוד הראשון.
async function pdfImage(blob) {
  const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(await blob.arrayBuffer()) }).promise;
  try {
    const OPS = pdfjsLib.OPS, mul = pdfjsLib.Util.transform;
    const paintOps = new Set([OPS.paintImageXObject, OPS.paintInlineImageXObject, OPS.paintImageXObjectRepeat, OPS.paintJpegXObject].filter((x) => x != null));
    let best = null;
    for (let n = 1; n <= Math.min(3, pdf.numPages); n++) {
      const page = await pdf.getPage(n);
      const base = page.getViewport({ scale: 1 });
      const vp = page.getViewport({ scale: 900 / base.width });
      const ops = await page.getOperatorList();
      let ctm = [1, 0, 0, 1, 0, 0];
      const stack = [];
      for (let i = 0; i < ops.fnArray.length; i++) {
        const fn = ops.fnArray[i], args = ops.argsArray[i];
        if (fn === OPS.save) stack.push(ctm);
        else if (fn === OPS.restore) ctm = stack.pop() || [1, 0, 0, 1, 0, 0];
        else if (fn === OPS.transform) ctm = mul(ctm, args);
        else if (fn === OPS.paintFormXObjectBegin) { stack.push(ctm); if (args && args[0]) ctm = mul(ctm, args[0]); }
        else if (fn === OPS.paintFormXObjectEnd) ctm = stack.pop() || [1, 0, 0, 1, 0, 0];
        else if (paintOps.has(fn)) {
          const pts = [[0, 0], [1, 0], [0, 1], [1, 1]].map(([x, y]) =>
            vp.convertToViewportPoint(ctm[0] * x + ctm[2] * y + ctm[4], ctm[1] * x + ctm[3] * y + ctm[5]));
          const xs = pts.map((q) => q[0]), ys = pts.map((q) => q[1]);
          const x0 = Math.max(0, Math.min(...xs)), y0 = Math.max(0, Math.min(...ys));
          const x1 = Math.min(vp.width, Math.max(...xs)), y1 = Math.min(vp.height, Math.max(...ys));
          const w = x1 - x0, h = y1 - y0;
          if (w <= 0 || h <= 0) continue;
          const mn = Math.min(w, h), mx = Math.max(w, h);
          if (mn < MIN_FRAC * vp.width || mx / mn > MAX_RATIO) continue; // לוגו, אייקון או פס
          const score = w * h * (n === 1 ? 1.3 : 1); // עדיפות קלה לעמוד הראשון
          if (!best || score > best.score) best = { n, x: x0, y: y0, w, h, score };
        }
      }
    }
    const n = best ? best.n : 1;
    const page = await pdf.getPage(n);
    const base = page.getViewport({ scale: 1 });
    const vp = page.getViewport({ scale: 900 / base.width });
    const c = document.createElement('canvas');
    c.width = Math.ceil(vp.width); c.height = Math.ceil(vp.height);
    await page.render({ canvasContext: c.getContext('2d'), viewport: vp }).promise;
    if (best) return blobToCanvasJpeg(c, best.x, best.y, best.w, best.h);
    return blobToCanvasJpeg(c, 0, 0, c.width, Math.min(c.height, Math.round(c.width * 0.75)));
  } finally {
    pdf.destroy();
  }
}

// בחירה מחדש של כל התמונות האוטומטיות בתיקייה (תמונות שנבחרו ידנית לא משתנות)
async function rescanFolder(folder) {
  if (!confirm(t('rescanFolderConfirm', { name: folder.name }))) return;
  const list = (await drive.list(folder.id)).filter((x) => ['pdf', 'docx', 'doc', 'gdoc'].includes(kindOf(x)) && !isAppImage(x));
  let done = 0;
  await busy(t('searchingImage'), async () => {
    for (const [i, f] of list.entries()) {
      const ap = f.appProperties || {};
      if (ap.kpAuto === 'manual' || ap.kpCover === 'none') continue;
      $('#busyText').textContent = t('rescanProgress', { i: i + 1, n: list.length });
      try { const blob = await findCoverImage(f); if (blob) { await saveCover(f, blob, { kpAuto: AUTO_V }); done++; } } catch (e) { console.warn('rescan', f.name, e); }
    }
  });
  toast(t('rescanDone', { n: done }), 4000);
  dash.load(true);
}

/* ---------------- קישורים לדוגמאות מהאינטרנט ---------------- */
const linkUrl = (f) => { const first = ((f && f.description) || '').split('\n')[0].trim(); return /^https?:\/\//.test(first) ? first : ''; };
const hostOf = (u) => { try { return new URL(u).hostname; } catch { return ''; } };

async function linkUrlFromContent(f) {
  const txt = await (await fileBlob(f)).text();
  const m = txt.match(/^URL=(.+)$/m);
  return m ? m[1].trim() : '';
}

function normalizeUrl(u) {
  u = (u || '').trim();
  const m = u.match(/https?:\/\/\S+/); // גם כשמדביקים טקסט שמכיל קישור
  if (m) u = m[0];
  else if (/^[\w-]+(\.[\w-]+)+(\/\S*)?$/.test(u)) u = 'https://' + u;
  try { const x = new URL(u); return /^https?:$/.test(x.protocol) ? x.href : ''; } catch { return ''; }
}

// קישור לקובץ בגוגל דרייב של מישהו אחר – תצוגה מקדימה שאפשר להטמיע
// מזהה סרטון/רשימת השמעה של יוטיוב מתוך קישור
function youtubeInfo(u) {
  try {
    const x = new URL(u);
    const h = x.hostname.replace(/^(www|m|music)\./, '');
    let id = '';
    if (h === 'youtu.be') id = x.pathname.slice(1).split('/')[0];
    else if (h === 'youtube.com' || h === 'youtube-nocookie.com') {
      id = x.searchParams.get('v') || (x.pathname.match(/^\/(?:shorts|embed|live|v)\/([\w-]{6,})/) || [])[1] || '';
      if (!id && x.searchParams.get('list')) return { list: x.searchParams.get('list') };
    } else return null;
    return id ? { id, start: parseInt(x.searchParams.get('t') || x.searchParams.get('start') || '0', 10) || 0 } : null;
  } catch { return null; }
}

function frameUrlFor(u) {
  const yt = youtubeInfo(u);
  if (yt) {
    return yt.list ? `https://www.youtube.com/embed/videoseries?list=${encodeURIComponent(yt.list)}&rel=0`
      : `https://www.youtube.com/embed/${yt.id}?rel=0&playsinline=1${yt.start ? '&start=' + yt.start : ''}`;
  }
  const m = u.match(/drive\.google\.com\/(?:file\/d\/|open\?id=)([\w-]+)/);
  if (m) return `https://drive.google.com/file/d/${m[1]}/preview`;
  return u;
}

// קישורי שיתוף של Dropbox – כתובת הורדה ישירה של הקובץ
function directCloudUrl(u) {
  try {
    const x = new URL(u);
    if (/(^|\.)dropbox\.com$/.test(x.hostname)) {
      x.hostname = 'dl.dropboxusercontent.com';
      x.searchParams.delete('dl');
      return x.href;
    }
  } catch { /* ignore */ }
  return u;
}

// אם הקישור הוא קובץ PDF שאפשר להוריד – מציגים אותו עם הסרגלים כמו כל דוגמה
async function tryFetchPdf(url, f) {
  // רוב הקישורים הם דפי אינטרנט – מנסים להוריד רק כשזה נראה כמו קובץ PDF
  if (!url || !/\.pdf($|[?#])/i.test(new URL(url).pathname + new URL(url).search)) return null;
  url = directCloudUrl(url);
  const key = 'link:' + f.id + ':' + url;
  const cached = await idb.get('blobs', key);
  if (cached) return cached;
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 15000);
    const r = await fetch(url, { signal: ctrl.signal, credentials: 'omit' });
    clearTimeout(timer);
    if (!r.ok) return null;
    const blob = await r.blob();
    const head = String.fromCharCode(...new Uint8Array(await blob.slice(0, 5).arrayBuffer()));
    if (!head.startsWith('%PDF')) return null;
    idb.put('blobs', key, blob);
    return blob;
  } catch { return null; }
}

// טופס שמירת דוגמה מהרשת: כתובת, שם, תיקייה, ועותק PDF כשהקישור הוא קובץ PDF
function linkSaveForm(prefill = {}, onDone) {
  const urlIn = el('input', { type: 'url', dir: 'ltr', placeholder: 'https://…', value: prefill.url || '' });
  const nameIn = el('input', { type: 'text', placeholder: t('linkNamePh'), value: prefill.title || '' });
  const pasteBtn = el('button', { class: 'btn small', onclick: async () => {
    try { urlIn.value = (await navigator.clipboard.readText()).trim(); updPdf(); nameIn.focus(); } catch { urlIn.focus(); }
  } }, t('paste'));
  // תיקייה: הנוכחית או אחת מתתי-התיקיות שלה
  const cur = nav.current();
  const folderSel = el('select', {}, el('option', { value: cur.id }, '📁 ' + cur.name));
  for (const f of dash.items.filter((x) => x.mimeType === FOLDER)) folderSel.append(el('option', { value: f.id }, '📁 ' + cur.name + ' › ' + f.name));
  const pdfChk = el('input', { type: 'checkbox' }); pdfChk.checked = true;
  const pdfRow = el('label', { class: 'chk hidden' }, pdfChk, t('pdfCopy'));
  const isPdfUrl = (u) => { try { const x = new URL(u); return /\.pdf$/i.test(x.pathname) || /dropbox\.com/.test(x.hostname); } catch { return false; } };
  const updPdf = () => pdfRow.classList.toggle('hidden', !isPdfUrl(normalizeUrl(urlIn.value) || ''));
  urlIn.addEventListener('input', updPdf); updPdf();
  const body = el('div', { class: 'link-form' },
    el('label', { class: 'field' }, el('span', {}, t('linkUrl')), el('div', { class: 'url-row' }, urlIn, navigator.clipboard && navigator.clipboard.readText ? pasteBtn : null)),
    el('label', { class: 'field' }, el('span', {}, t('linkName')), nameIn),
    el('label', { class: 'field' }, el('span', {}, t('saveIn')), folderSel),
    pdfRow);
  const save = async () => {
    const url = normalizeUrl(urlIn.value);
    if (!url) { toast(t('linkInvalid')); urlIn.focus(); return; }
    const name = (nameIn.value.trim() || prefill.fallbackName || hostOf(url)).replace(/[\\/:*?"<>|]/g, ' ').slice(0, 120);
    const parent = folderSel.value;
    onDone && onDone();
    try {
      let savedPdf = false;
      if (!pdfRow.classList.contains('hidden') && pdfChk.checked) {
        // אתרים רבים חוסמים הורדה מאתר אחר – אז שומרים כקישור
        const blob = await busy(t('saving'), () => tryFetchPdf(url, { id: 'new' }));
        if (blob) {
          await busy(t('saving'), () => drive.upload(new Blob([blob], { type: 'application/pdf' }), { name: name.replace(/\.pdf$/i, '') + '.pdf', parents: [parent], mimeType: 'application/pdf', description: url }));
          savedPdf = true; toast(t('pdfCopied'));
        } else toast(t('pdfCopyFail'), 5000);
      }
      if (!savedPdf) {
        await busy(t('saving'), () => createLinkDoc(url, name, parent));
        if (!pdfChk.checked || pdfRow.classList.contains('hidden')) toast(t('linkSaved'));
      }
      dash.load(true);
    } catch (e) { err(e); }
  };
  return { body, save, urlIn, nameIn, pasteBtn };
}

// קישור נשמר בדרייב כמסמך Google קטן עם קישור לחיץ – כך גם מתוך דרייב מגיעים לדוגמה בלחיצה
const escHtml = (v) => String(v || '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
function linkDocHtml(url, name) {
  const yt = youtubeInfo(url);
  const thumb = yt && yt.id ? `<p><a href="${escHtml(url)}"><img src="https://img.youtube.com/vi/${yt.id}/hqdefault.jpg" width="420"></a></p>` : '';
  return `<!doctype html><html><head><meta charset="utf-8"></head><body dir="${LANGS[LANG].dir}" style="font-family:Arial,sans-serif">
<h1>${escHtml(name)}</h1>${thumb}
<p style="font-size:16pt"><a href="${escHtml(url)}">${escHtml(t('linkDocOpen'))}</a></p>
<p><a href="${escHtml(url)}">${escHtml(url)}</a></p>
<p style="color:#888;font-size:9pt">${escHtml(t('linkDocNote'))}</p></body></html>`;
}
function createLinkDoc(url, name, parent, appProps = {}, description = url) {
  return drive.upload(new Blob([linkDocHtml(url, name)], { type: 'text/html' }), {
    name, parents: [parent], mimeType: 'application/vnd.google-apps.document', description,
    appProperties: { ...appProps, kpRole: 'link' },
  });
}
// קישורים ישנים (קובץ ‎.url שבדרייב נראה כמו טקסט) – מומרים פעם אחת למסמך עם קישור לחיץ
async function migrateLinks(files) {
  let changed = false;
  for (const f of files) {
    if (f.mimeType !== LINK_MIME || kindOf(f) !== 'link' || !f.parents) continue;
    const url = linkUrl(f);
    if (!url) continue;
    try {
      const doc = await createLinkDoc(url, f.name.replace(/\.url$/i, ''), f.parents[0], f.appProperties || {}, f.description || url);
      await drive.patch(f.id, { trashed: true });
      store.set('recent', store.get('recent', []).map((r) => (r.id === f.id ? { ...r, id: doc.id, name: doc.name } : r)));
      changed = true;
    } catch (e) { console.warn('link migrate', e); }
  }
  return changed;
}

function openAddLink(prefill = {}) {
  if (!nav.current()) return;
  const form = linkSaveForm(prefill, closeModal);
  openModal(t('linkTitle'), form.body, [el('button', { class: 'btn primary', onclick: form.save }, t('save'))]);
  setTimeout(() => (prefill.url ? form.nameIn : form.urlIn).focus(), 50);
}

/* ---------------- חיפוש דוגמה לפי תמונה (Google Lens) ---------------- */
const isMobileDevice = () => matchMedia('(pointer: coarse)').matches || /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);

function openLensSearch() {
  let file = null;
  const preview = el('div', { class: 'search-preview' }, '📷');
  const pick = el('button', { class: 'btn', onclick: async () => {
    const f = await pickFile($('#imageInput'));
    if (!f) return;
    // מקטינים את התמונה; אם הפורמט לא נתמך בדפדפן (למשל HEIC) – משתמשים במקור
    try {
      const small = await resizeImage(f, 1600);
      file = small ? new File([small], 'pattern.jpg', { type: 'image/jpeg' }) : f;
    } catch { file = f; }
    preview.textContent = '';
    preview.style.backgroundImage = `url("${URL.createObjectURL(f)}")`;
    preview.classList.add('has-img');
    lensBtn.textContent = t('searchLensNow');
    lensBtn.classList.add('pulse');
    pick.textContent = t('replaceSearchImage');
    clearBtn.classList.remove('hidden');
  } }, t('chooseImage'));
  const clearBtn = el('button', { class: 'btn danger hidden', onclick: () => {
    file = null;
    preview.style.backgroundImage = '';
    preview.classList.remove('has-img');
    preview.textContent = '📷';
    pick.textContent = t('chooseImage');
    lensBtn.textContent = t('searchLens');
    lensBtn.classList.remove('pulse');
    clearBtn.classList.add('hidden');
  } }, t('removeSearchImage'));
  // בלי תמונה – הכפתור קודם פותח את בחירת התמונה
  const lensBtn = el('button', { class: 'btn primary wide', onclick: () => (file ? lensSearch(file).catch(err) : pick.click()) }, t('searchLens'));
  const body = el('div', { class: 'img-search' },
    el('p', { class: 'muted' }, t('lensHint')),
    el('div', { class: 'search-pick' }, preview, el('div', { class: 'search-pick-btns' }, pick, clearBtn)),
    lensBtn,
    el('p', { class: 'muted small-note' }, t('foundTip')));
  openModal(t('lensTitle'), body);
}

// חיפוש דוגמה ברשת ושמירה שלה – באותו חלון
function openWebSearch() {
  if (!nav.current()) return;
  const kw = el('input', { type: 'search', placeholder: t('keywordsPh'), enterkeyhint: 'search', value: store.get('lastSearch', '') });
  const pdfOnly = el('input', { type: 'checkbox' });
  const words = () => { store.set('lastSearch', kw.value.trim()); return kw.value.trim(); };
  const form = linkSaveForm({}, closeModal);
  let searched = false;
  const openSearch = (url) => {
    searched = true;
    if (!form.nameIn.value) form.nameIn.value = kw.value.trim();
    window.open(url, '_blank', 'noopener');
  };
  const q = () => encodeURIComponent((words() + ' ' + t('freePatternQuery') + (pdfOnly.checked ? ' filetype:pdf' : '')).trim());
  kw.addEventListener('keydown', (e) => { if (e.key === 'Enter') openSearch(`https://www.google.com/search?q=${q()}`); });
  // כשחוזרים מהדפדפן – מדגישים את שלב השמירה
  const step2 = el('div', { class: 'web-step' }, el('h3', {}, t('webStep2')), el('p', { class: 'muted small-note' }, t('webSaveHint')), form.body);
  const onBack = () => {
    if (document.visibilityState !== 'visible' || !searched || !document.body.contains(step2)) return;
    step2.classList.add('pulse-once'); step2.scrollIntoView({ block: 'nearest' }); form.pasteBtn.classList.add('pulse');
    setTimeout(() => step2.classList.remove('pulse-once'), 1600);
  };
  document.addEventListener('visibilitychange', onBack);
  window.addEventListener('focus', onBack);
  const body = el('div', { class: 'img-search' },
    el('div', { class: 'web-step' }, el('h3', {}, t('webStep1')),
      el('p', { class: 'muted small-note' }, t('webSearchHint')),
      kw,
      el('label', { class: 'chk' }, pdfOnly, t('pdfOnly')),
      el('div', { class: 'search-links' },
        el('button', { class: 'btn primary', onclick: () => openSearch(`https://www.google.com/search?q=${q()}`) }, 'Google'),
        el('button', { class: 'btn', onclick: () => openSearch(`https://www.ravelry.com/patterns/search#query=${encodeURIComponent(words())}`) }, t('searchRavelry')),
        el('button', { class: 'btn', onclick: () => openSearch(`https://www.pinterest.com/search/pins/?q=${q()}`) }, 'Pinterest'),
        el('button', { class: 'btn', onclick: () => openSearch(`https://www.etsy.com/search?q=${encodeURIComponent((words() + ' knitting pattern').trim())}`) }, 'Etsy'),
        el('button', { class: 'btn', onclick: () => openSearch(`https://www.youtube.com/results?search_query=${encodeURIComponent((words() + ' ' + t('freePatternQuery')).trim())}`) }, 'YouTube'))),
    step2);
  openModal(t('webSearchTitle'), body, [el('button', { class: 'btn primary', onclick: form.save }, t('save'))]);
  const obs = new MutationObserver(() => { if (!document.body.contains(step2)) { document.removeEventListener('visibilitychange', onBack); window.removeEventListener('focus', onBack); obs.disconnect(); } });
  obs.observe($('#modalBody'), { childList: true });
  setTimeout(() => kw.focus(), 50);
}

async function lensSearch(file) {
  if (!file) { toast(t('needImage')); return; }
  // בטלפון: שיתוף התמונה ישר ל-Google Lens (דרך אפליקציית Google) – בלי להעלות אותה שוב
  if (navigator.canShare && navigator.canShare({ files: [file] }) && isMobileDevice()) {
    toast(t('lensShareTip'), 7000);
    try { await navigator.share({ files: [file] }); return; } catch (e) { if (e.name === 'AbortError') return; }
  }
  // במחשב: העתקת התמונה ופתיחת Google Lens – מדביקים עם Ctrl+V
  let copied = false;
  try {
    const bmp = await createImageBitmap(file);
    const c = document.createElement('canvas'); c.width = bmp.width; c.height = bmp.height;
    c.getContext('2d').drawImage(bmp, 0, 0);
    const png = await new Promise((res) => c.toBlob(res, 'image/png'));
    await navigator.clipboard.write([new ClipboardItem({ 'image/png': png })]);
    copied = true;
  } catch { /* העתקה לא נתמכת */ }
  toast(copied ? t('imageCopied') : t('lensManual'), 8000);
  window.open('https://lens.google.com/', '_blank', 'noopener');
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
  ensureBackEntry();
}
function closeModal() { $('#modal').classList.add('hidden'); setTimeout(consumeBackEntry, 0); }
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

/* ---------------- בורר הקבצים של גוגל (Google Picker) ---------------- */
let pickerReady;
function loadPicker() {
  if (!pickerReady) {
    pickerReady = new Promise((res, rej) => {
      const go = () => gapi.load('picker', { callback: res, onerror: () => rej(new Error('PICKER_LOAD')) });
      if (window.gapi) return go();
      const sc = document.createElement('script');
      sc.src = 'https://apis.google.com/js/api.js';
      sc.onload = go;
      sc.onerror = () => { pickerReady = null; rej(new Error(t('pickerLoadFail'))); };
      document.head.append(sc);
    });
  }
  return pickerReady;
}

// פותח את הבורר ומחזיר את הפריטים שנבחרו (או null אם בוטל)
async function showPicker({ title, view, multi = false }) {
  if (!apiKey()) throw new Error(t('missingApiKey'));
  closeModal(); closeMenu();
  const token = await auth.get();
  await loadPicker();
  return new Promise((resolve) => {
    const P = google.picker;
    const b = new P.PickerBuilder()
      .setOAuthToken(token)
      .setDeveloperKey(apiKey())
      .setAppId(appId())
      .setLocale(LANGS[LANG].picker)
      .setTitle(title)
      .setOrigin(location.protocol + '//' + location.host)
      .addView(view(P))
      .setCallback((d) => {
        const a = d[P.Response.ACTION];
        if (a === P.Action.PICKED) resolve(d[P.Response.DOCUMENTS] || []);
        else if (a === P.Action.CANCEL) resolve(null);
      });
    if (multi) b.enableFeature(P.Feature.MULTISELECT_ENABLED);
    // בטלפון משאירים לגוגל לקבוע את גודל החלון
    if (innerWidth > 700) b.setSize(Math.min(innerWidth - 16, 1051), Math.min(innerHeight - 16, 650));
    b.build().setVisible(true);
  });
}

// חיפוש בתוך האפליקציה לפני פתיחת הבורר (בטלפון לא תמיד אפשר להקליד בחיפוש של גוגל)
function askSearch(title, hint) {
  return new Promise((resolve) => {
    const input = el('input', { type: 'text', placeholder: t('searchFieldPh'), enterkeyhint: 'search' });
    const done = (v) => { $('#modalClose').onclick = closeModal; closeModal(); resolve(v); };
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); done(input.value.trim()); } });
    openModal(title, el('div', {}, el('p', { class: 'muted' }, hint), input), [
      el('button', { class: 'btn primary', onclick: () => done(input.value.trim()) }, t('search')),
      el('button', { class: 'btn', onclick: () => done('') }, t('browse')),
    ]);
    $('#modalClose').onclick = () => done(null);
    setTimeout(() => input.focus(), 50);
  });
}
const withQuery = (view, q) => (q && typeof view.setQuery === 'function' ? view.setQuery(q) : view);

async function pickRootFolder() {
  const q = await askSearch(t('pickRootTitle'), t('pickRootHint'));
  if (q == null) return false;
  const docs = await showPicker({
    title: t('pickRootTitle'),
    view: (P) => {
      const v = new P.DocsView(P.ViewId.FOLDERS)
        .setIncludeFolders(true).setSelectFolderEnabled(true).setMimeTypes(FOLDER);
      return q ? withQuery(v, q) : v.setParent('root');
    },
  });
  if (!docs || !docs.length) return false;
  setRoot({ id: docs[0].id, name: docs[0].name });
  return true;
}

async function createRootFolder() {
  const f = await busy(t('creatingFolder'), () => drive.mkdir('MyPatterns', 'root'));
  setRoot({ id: f.id, name: f.name });
  toast(t('rootCreated'));
}

function setRoot(r) {
  store.set('root', r);
  nav.reset();
  show('#dashView');
  dash.load(true);
}

// מתן גישה לקבצים ולתיקיות שכבר קיימים בתיקייה הנוכחית בדרייב
async function grantAccess() {
  const cur = nav.current();
  if (!cur) return;
  const q = await askSearch(t('grantTitle'), t('grantHint'));
  if (q == null) return;
  const docs = await showPicker({
    title: t('grantPickerTitle'),
    multi: true,
    view: (P) => {
      const v = new P.DocsView(P.ViewId.DOCS)
        .setIncludeFolders(true).setSelectFolderEnabled(true).setMode(P.DocsViewMode.LIST);
      return q && typeof v.setQuery === 'function' ? v.setQuery(q) : v.setParent(cur.id);
    },
  });
  if (!docs || !docs.length) return;
  // קבצים שנמצאים מחוץ לתיקייה הנוכחית – מוסיפים לכאן קיצור דרך (המקור לא זז ולא מועתק)
  let added = 0;
  await busy(t('saving'), async () => {
    for (const d of docs) {
      try {
        const meta = await drive.get(d.id);
        if ((meta.parents || []).includes(cur.id)) continue;
        await drive.shortcut(meta, cur.id); added++;
      } catch (e) { console.warn('shortcut', e); }
    }
  }).catch(err);
  toast(added ? t('addedHere', { n: added, name: cur.name }) : t('accessAdded', { n: docs.length }), 4000);
  await dash.load(true);
  if (docs.length === 1 && docs[0].mimeType !== FOLDER) openFileById(docs[0].id, { name: docs[0].name });
}

/* ---------------- הערות לדוגמה (נשמרות בתיאור הקובץ/התיקייה בדרייב) ---------------- */
function notesOf(f) {
  const d = (f && f.description) || '';
  if (kindOf(f) === 'link') return d.split('\n').slice(1).join('\n').trim();
  return d.trim();
}
async function saveNotes(f, text) {
  text = text.trim();
  const description = kindOf(f) === 'link' ? (linkUrl(f) + (text ? '\n' + text : '')) : text;
  await drive.patch(f.id, { description });
  f.description = description;
  updateCachedItem(f);
  folderMetaCache.delete(f.id);
}
function openNotes(f, onSaved) {
  const ta = el('textarea', { class: 'notes-input', rows: '9', placeholder: t('notesPh') });
  ta.value = notesOf(f);
  const name = f.name.replace(/\.(pdf|docx?|rtf|odt|xlsx?|ods|csv|url|jpe?g|png|gif|webp|heic)$/i, '');
  openModal(t('notesTitle', { name }), ta, [
    el('button', { class: 'btn primary', onclick: async () => {
      try {
        await busy(t('saving'), () => saveNotes(f, ta.value));
        closeModal();
        toast(t('notesSaved'));
        if (onSaved) onSaved(); else dash.render();
      } catch (e) { err(e); }
    } }, t('save')),
  ]);
  setTimeout(() => ta.focus(), 50);
}

// חלונית צפה עם ההערות (ריחוף במחשב, לחיצה על 📝 בטלפון)
const notesPop = el('div', { class: 'notes-pop hidden' });
document.body.append(notesPop);
function showNotesPop(anchor, f, interactive) {
  notesPop.innerHTML = '';
  notesPop.append(el('div', { class: 'notes-pop-title' }, t('notesHeading')), el('div', { class: 'notes-pop-text' }, notesOf(f)));
  if (interactive) notesPop.append(el('button', { class: 'btn small', onclick: () => { hideNotesPop(); openNotes(f); } }, t('notesEdit')));
  notesPop.classList.toggle('interactive', !!interactive);
  notesPop.classList.remove('hidden');
  const r = anchor.getBoundingClientRect();
  const w = Math.min(320, innerWidth - 16);
  notesPop.style.width = w + 'px';
  notesPop.style.left = clamp(r.left + r.width / 2 - w / 2, 8, innerWidth - w - 8) + 'px';
  const h = notesPop.offsetHeight;
  notesPop.style.top = (r.bottom + 6 + h < innerHeight ? r.bottom + 6 : Math.max(8, r.top - h - 6)) + 'px';
}
function hideNotesPop() { notesPop.classList.add('hidden'); }
document.addEventListener('pointerdown', (e) => { if (!e.target.closest('.notes-pop') && !e.target.closest('.notes-badge')) hideNotesPop(); });
addEventListener('scroll', hideNotesPop, { passive: true });

// הערות התיקייה הפתוחה – מוצגות בראש המסך
const folderMetaCache = new Map();
async function renderFolderNotes() {
  const box = $('#folderNotes');
  const cur = nav.path[nav.path.length - 1];
  if (!cur) { box.classList.add('hidden'); return; }
  let meta = folderMetaCache.get(cur.id);
  if (!meta) {
    try { meta = await drive.get(cur.id); folderMetaCache.set(cur.id, meta); } catch { box.classList.add('hidden'); return; }
  }
  if (nav.current().id !== cur.id) return;
  box.innerHTML = '';
  const text = notesOf(meta);
  const edit = () => openNotes(meta, renderFolderNotes);
  if (text) box.append(el('div', { class: 'folder-notes-head' }, el('b', {}, t('notesHeading')), el('button', { class: 'btn small', onclick: edit }, t('notesEdit'))), el('div', { class: 'folder-notes-text' }, text));
  else box.append(el('button', { class: 'btn link', onclick: edit }, t('notesAdd')));
  box.classList.toggle('has-notes', !!text);
  box.classList.remove('hidden');
}

// התיקייה "הדוגמאות שיצרתי" נקראת בשפה של האפליקציה – גם בדרייב.
// משנים רק אם השם הנוכחי הוא אחד מהשמות שהאפליקציה נתנה (שם שהמשתמשת בחרה בעצמה לא משתנה).
async function localizeDesignsFolder(files) {
  const known = Object.values(I18N).map((x) => x.myDesignsFolder);
  const want = t('myDesignsFolder');
  for (const f of files) {
    if (!(f.appProperties && f.appProperties.kpType === 'designsFolder') || f.name === want || !known.includes(f.name)) continue;
    try {
      const u = await drive.patch(f.id, { name: want });
      f.name = u.name || want;
      nav.path.forEach((x) => { if (x.id === f.id) x.name = f.name; }); store.set('path', nav.path);
    } catch (e) { console.warn('rename designs folder', e); }
  }
}

// קיצורי דרך מוצגים כמו הקובץ עצמו; מחיקה/העברה פועלות על הקיצור ולא על המקור
async function resolveShortcuts(files) {
  const out = [];
  for (const f of files) {
    if (f.mimeType !== SHORTCUT) { out.push(f); continue; }
    const tid = f.shortcutDetails && f.shortcutDetails.targetId;
    if (!tid) continue;
    try { const tg = await drive.get(tid); if (tg && tg.id && !tg.trashed) out.push({ ...tg, _shortcut: f.id, _scParent: (f.parents || [])[0] }); } catch { /* אין גישה למקור */ }
  }
  return out;
}

/* ---------------- דשבורד ---------------- */
const dash = {
  items: [],
  async load(force = false) {
    const cur = nav.current();
    $('#welcome').classList.toggle('hidden', !!cur);
    $('.search-row').classList.toggle('hidden', !cur);
    if (!cur) {
      $('#grid').innerHTML = ''; $('#emptyNote').classList.add('hidden');
      $('#crumbs').classList.add('hidden'); $('#recentSection').classList.add('hidden');
      $('#folderNotes').classList.add('hidden');
      return;
    }
    this.renderCrumbs();
    renderFolderNotes();
    const key = 'list:' + cur.id;
    const cached = await idb.get('lists', key);
    if (cached && !force) { this.items = cached; this.render(); }
    try {
      let files = await resolveShortcuts(await drive.list(cur.id));
      await localizeDesignsFolder(files);
      if (await migrateLinks(files)) files = await drive.list(cur.id);
      if (!nav.path.length) {
        if (!files.some((f) => f.appProperties && f.appProperties.kpType === 'designsFolder')) {
          try { files.unshift(...(await drive.query(`mimeType='${FOLDER}' and appProperties has { key='kpType' and value='designsFolder' }`)).slice(0, 1)); } catch { /* ignore */ }
          await localizeDesignsFolder(files);
        }
        // "הדוגמאות שיצרתי" תמיד ראשונה
        files.sort((a, b) => (b.appProperties?.kpType === 'designsFolder') - (a.appProperties?.kpType === 'designsFolder'));
        syncRecent();
      }
      this.items = files.filter((f) => !isAppImage(f) && kindOf(f));
      idb.put('lists', key, this.items);
      $('#offlineNote').classList.add('hidden');
      $('#authNote').classList.add('hidden');
      this.render();
    } catch (e) {
      if (e instanceof AuthError) $('#authNote').classList.remove('hidden');
      else if (!navigator.onLine) $('#offlineNote').classList.remove('hidden');
      else toast(t('loadError', { msg: e.message }), 4000);
      if (!cached) this.render();
    }
  },
  renderCrumbs() {
    const c = $('#crumbs'); c.innerHTML = '';
    const root = nav.root();
    const atRoot = nav.path.length === 0;
    $('#backBtn').classList.toggle('hidden', atRoot);
    $('#dashTitle').textContent = 'MyPatterns'; // שם התיקייה מופיע בשורת הניווט שמתחת
    $('#recentSection').classList.toggle('hidden', !atRoot || !store.get('recent', []).length);
    if (atRoot) { c.classList.add('hidden'); this.renderRecent(); return; }
    c.classList.remove('hidden');
    c.append(el('button', { onclick: () => { nav.to(0); this.load(); } }, '🏠 ' + (root.name || t('home'))));
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
      const item = el('div', { class: 'recent-item' },
        el('button', { class: 'recent-open', onclick: () => openFileById(r.id, r) }, th, el('span', {}, r.name)),
        el('button', { class: 'recent-x', title: t('removeRecent'), 'aria-label': t('removeRecent'), onclick: () => {
          removeRecent(r.id);
          item.remove();
          if (!store.get('recent', []).length) $('#recentSection').classList.add('hidden');
        } }, '✕'));
      row.append(item);
    }
  },
  render() {
    const grid = $('#grid'); grid.innerHTML = '';
    grid.classList.toggle('list-view', store.get('viewMode', 'grid') === 'list');
    const q = $('#searchInput').value.trim().toLowerCase();
    const items = this.items.filter((f) => !q || f.name.toLowerCase().includes(q));
    $('#emptyNote').classList.toggle('hidden', items.length > 0);
    for (const f of items) grid.append(this.card(f));
  },
  card(f) {
    const kind = kindOf(f);
    const isFolder = kind === 'folder';
    const cover = el('div', { class: 'cover' + (isFolder ? ' logo-ph' : '') }, isFolder ? '' : KIND_ICON[kind] || '📄');
    const coverId = coverOf(f);
    const paint = (u) => { cover.style.backgroundImage = `url("${u}")`; cover.classList.add('has-img'); };
    if (coverId) queueImage(coverId, paint);
    else if (kind === 'image') queueImage(f.id, paint);
    else if (kind === 'link' && youtubeInfo(linkUrl(f)) && youtubeInfo(linkUrl(f)).id) {
      paint(`https://img.youtube.com/vi/${youtubeInfo(linkUrl(f)).id}/hqdefault.jpg`);
    }
    else if (kind === 'link') {
      // צילום של דף הדוגמה (שירות mShots של WordPress); בפעם הראשונה הוא עוד מכין את הצילום – מנסים שוב אחרי רגע
      const url = linkUrl(f);
      if (/^https?:/.test(url)) {
        const shot = (n) => `https://s.wordpress.com/mshots/v1/${encodeURIComponent(url)}?w=600&h=450${n ? '&r=' + n : ''}`;
        const img = new Image();
        let tries = 0;
        img.onload = () => {
          if (img.naturalWidth === 400 && img.naturalHeight === 300 && tries < 3) { tries++; setTimeout(() => { img.src = shot(tries); }, 4000); return; }
          paint(img.src);
        };
        img.src = shot(0);
      }
    }
    else if (isFolder && !(f.appProperties && f.appProperties.kpCover === 'none')) folderCover(f).then((id) => id && queueImage(id, paint)).catch(() => {});
    else if (kind !== 'link') autoCover(f).then((id) => id && queueImage(id, paint)).catch(() => {});
    const displayName = isFolder ? f.name : f.name.replace(/\.(pdf|docx?|rtf|odt|xlsx?|ods|csv|url|jpe?g|png|gif|webp|heic)$/i, '');
    const meta = el('div', { class: 'meta' }, el('div', { class: 'name' }, displayName),
      isFolder ? null : el('span', { class: 'badge ' + kind }, kindLabel(kind)));
    const card = el('div', { class: 'card ' + (isFolder ? 'folder' : 'file'), title: f.name }, cover, meta);
    const st = !isFolder && loadLocalState(f.id);
    if (st && st.c) card.append(el('span', { class: 'progress-dot' }, t('rowN', { n: st.c })));
    const showMenu = (anchor) => {
      const shown = cover.classList.contains('has-img');
      const items = [{ label: coverId || shown ? t('replaceImage') : t('addImage'), fn: () => setCover(f).catch(err) }];
      if (coverId || (shown && kind !== 'image')) items.push({ label: t('removeImage'), fn: () => removeCover(f).catch(err) });
      if (kind === 'link') items.push({ label: t('openInBrowser'), fn: () => window.open(linkUrl(f), '_blank', 'noopener') });
      if (!isFolder && kind !== 'image' && kind !== 'link') items.push({ label: t('rescanImage'), fn: () => rescanCover(f).catch(err) });
      if (isFolder) items.push({ label: t('rescanFolder'), fn: () => rescanFolder(f).catch(err) });
      items.push({ label: t('notesMenu'), fn: () => openNotes(f) });
      if (f.appProperties && f.appProperties.kpDesign) items.push({ label: t('editInStudio'), fn: () => loadStudio().then(() => Studio.edit(f)).catch(err) });
      items.push({ label: t('renameItem'), fn: () => renameItem(f).catch(err) });
      if (!isFolder) items.push({ label: t('moveItem'), fn: () => moveItem(f).catch(err) });
      if (!isFolder) items.push({ label: t('deleteFile'), fn: () => deletePattern(f).catch(err) });
      items.push({ label: t('openInDrive'), fn: () => window.open(`https://drive.google.com/${isFolder ? 'drive/folders/' : 'file/d/'}${f.id}`, '_blank') });
      openMenu(anchor, items);
    };
    const more = el('button', { class: 'more', 'aria-label': t('options'), onclick: (e) => { e.stopPropagation(); showMenu(e.currentTarget); } }, '⋯');
    card.append(more);
    // דוגמה שנוצרה באפליקציה – כפתור עריכה ישיר
    if (f.appProperties && f.appProperties.kpDesign) {
      card.classList.add('my-design');
      card.append(el('button', { class: 'edit-pill', title: t('editInStudio'), onclick: (e) => { e.stopPropagation(); loadStudio().then(() => Studio.edit(f)).catch(err); } }, '✏️'));
    }
    if (notesOf(f)) {
      const badge = el('button', { class: 'notes-badge', title: t('notesHeading'), 'aria-label': t('notesHeading'), onclick: (e) => {
        e.stopPropagation();
        showNotesPop(card, f, true);
      } }, '📝');
      card.append(badge);
      // במחשב – ריחוף מעל הכרטיס מציג את ההערות
      card.addEventListener('mouseenter', (e) => { if (e.pointerType !== 'touch' && matchMedia('(hover: hover)').matches) showNotesPop(card, f, false); });
      card.addEventListener('mouseleave', () => { if (!notesPop.classList.contains('interactive')) hideNotesPop(); });
    }
    // לחיצה ארוכה (בטלפון) או קליק ימני (במחשב) פותחים את אותו תפריט
    card.addEventListener('contextmenu', (e) => { e.preventDefault(); showMenu(more); });
    card.addEventListener('click', () => {
      if (isFolder) { nav.push(f); $('#searchInput').value = ''; this.load(); scrollTo(0, 0); ensureBackEntry(); }
      else openFile(f);
    });
    return card;
  },
};

function err(e) {
  console.error(e);
  if (e instanceof AuthError) { $('#authNote').classList.remove('hidden'); toast(t('needRelogin')); }
  else toast(t('error', { msg: e.message || e }), 4000);
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
    Object.assign(s, { t: Number(ap.kpT), z: z || 1, sx: sx || 0, sy: sy || 0, c: Number(ap.kpC) || 0, lock: ap.kpL === '1' ? 1 : 0 });
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
    kpL: s.lock ? '1' : '0',
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
  if (V.local || !V.file || !navigator.onLine) { if (!V.local) setSync(t('notSynced')); return; }
  // שמירה ברקע לא פותחת חלון התחברות – נשמר במכשיר ויישלח לדרייב אחרי החידוש הבא
  if (!auth.valid() && !auth.canSilent()) { setSync(t('notSynced')); return; }
  const file = V.file, st = V.st;
  try {
    setSync(t('saving'));
    const updated = await drive.patch(file.id, { appProperties: remoteProps(st) });
    file.appProperties = updated.appProperties;
    if (V.file === file) setSync(t('savedToDrive'));
  } catch (e) {
    if (V.file === file) setSync(t('notSaved'));
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
  if (String(id).startsWith('local:')) { toast(t('localReopen')); return; }
  let f;
  try { f = await busy(t('opening'), () => drive.get(id)); } catch (e) {
    if (hint && !navigator.onLine) f = { id, name: hint.name, mimeType: hint.mime || '', appProperties: {} };
    else return err(e);
  }
  openFile(f);
}

// "נפתחו לאחרונה" משותף לכל המכשירים: כל קובץ שנפתח מסומן בדרייב (kpRec + זמן הפתיחה kpO)
const recentEntry = (f) => ({ id: f.id, name: f.name.replace(/\.[a-z0-9]+$/i, ''), kind: kindOf(f), mime: f.mimeType, cover: coverOf(f), at: Number((f.appProperties || {}).kpO) || 0 });
function addRecent(f) {
  if (V.local) return;
  const rec = store.get('recent', []).filter((r) => r.id !== f.id);
  rec.unshift({ ...recentEntry(f), at: Date.now() });
  store.set('recent', rec.slice(0, 8));
  drive.patch(f.id, { appProperties: { kpRec: '1', kpO: String(Date.now()) } }).then((u) => { f.appProperties = u.appProperties; }).catch(() => {});
}
function removeRecent(id) {
  store.set('recent', store.get('recent', []).filter((x) => x.id !== id));
  drive.patch(id, { appProperties: { kpRec: '0' } }).catch(() => {});
}
async function syncRecent() {
  try {
    // פעם ראשונה: הרשימה שהייתה שמורה רק במכשיר הזה עוברת לדרייב
    if (!store.get('recentMig', false)) {
      const old = store.get('recent', []);
      await Promise.all(old.map((r, i) => drive.patch(r.id, { appProperties: { kpRec: '1', kpO: String(r.at || Date.now() - (i + 1) * 60000) } }).catch(() => {})));
      store.set('recentMig', true);
    }
    const list = await drive.query("appProperties has { key='kpRec' and value='1' }");
    const remote = list.filter((f) => !isAppImage(f) && kindOf(f)).map(recentEntry).sort((a, b) => b.at - a.at);
    // מצטרפים גם פתיחות מהמכשיר הזה שעוד לא הגיעו לדרייב
    const local = store.get('recent', []).filter((r) => !remote.some((x) => x.id === r.id) && r.at && Date.now() - r.at < 60000);
    const merged = [...local, ...remote].sort((a, b) => (b.at || 0) - (a.at || 0)).slice(0, 8);
    store.set('recent', merged);
    // ישנים מעבר ל-30 מורדים מהרשימה בדרייב
    remote.slice(30).forEach((r) => drive.patch(r.id, { appProperties: { kpRec: '0' } }).catch(() => {}));
    if (!nav.path.length && !$('#dashView').classList.contains('hidden')) {
      $('#recentSection').classList.toggle('hidden', !merged.length);
      dash.renderRecent();
    }
  } catch (e) { console.warn('recent sync', e); }
}

async function openFile(f, localBlob) {
  closeMenu();
  V.file = f; V.kind = kindOf(f); V.local = !!localBlob; V.ready = false;
  V.pdf = null; V.docxHtml = null; V.img = null; V.pages = []; V.frameUrl = null;
  const local = loadLocalState(f.id);
  const remote = parseRemoteState(f.appProperties);
  V.st = Object.assign(defaultState(), (remote && (!local || remote.t > local.t)) ? remote : (local || {}));
  addRecent(f);
  $('#viewerTitle').textContent = f.name.replace(/\.url$/i, '');
  $('#accurateBtn').classList.toggle('hidden', !(V.kind === 'docx' && !V.local));
  $('#accurateBtn').textContent = t('accurate');
  $('#notesBtn').classList.toggle('hidden', !!localBlob);
  $('#notesBtn').classList.toggle('has-notes', !!notesOf(f));
  V.linkUrl = V.kind === 'link' ? linkUrl(f) : '';
  setSync(V.local ? t('localFile') : '');
  content.innerHTML = '';
  show('#viewerView');
  ensureBackEntry();
  applyRulers();
  applyLock();
  updateCounter();
  $('#viewerLoading').classList.remove('hidden');
  try {
    let blob = localBlob;
    if (V.kind === 'link') {
      const url = linkUrl(f) || await linkUrlFromContent(f);
      V.linkUrl = url;
      blob = await tryFetchPdf(url, f);
      if (!blob) {
        V.frameUrl = frameUrlFor(url);
        // בסרטון הסרגלים מסתירים את התמונה – מתחילים בלעדיהם (אפשר להדליק ב-▬)
        if (youtubeInfo(url) && !V.st.t) { V.st.h.on = 0; V.st.v.on = 0; applyRulers(); }
        layout(); V.ready = true; return;
      }
      V.kind = 'pdf';
    } else if (CONVERTED.includes(V.kind)) {
      blob = await convertedPdf(f);
      V.kind = 'pdf';
    } else if (!blob) {
      blob = await fileBlob(f);
    }
    await loadDoc(blob, V.kind);
  } catch (e) {
    err(e);
    content.innerHTML = '';
    content.append(el('div', { class: 'docx-page', style: 'max-width:520px;margin-top:40px' }, t('cannotOpen', { msg: e.message || e })));
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
  const kind = kindOf(f);
  if (kind === 'gdoc' || kind === 'gsheet') {
    blob = await drive.exportPdf(f.id);
  } else {
    // המרה זמנית למסמך/גיליון של גוגל, ייצוא ל-PDF ומחיקת העותק
    const target = kind === 'sheet' ? 'application/vnd.google-apps.spreadsheet' : 'application/vnd.google-apps.document';
    const copy = await drive.copyAs(f.id, { name: '_tmp_' + f.name, mimeType: target, parents: f.parents });
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
    V.img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => rej(new Error(t('invalidImage'))); i.src = url; });
    V.natW = V.img.naturalWidth;
  } else {
    throw new Error(t('unsupported'));
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
  content.classList.toggle('frame-mode', !!V.frameUrl);
  if (V.frameUrl && youtubeInfo(V.linkUrl)) {
    // סרטון יוטיוב – נגן בתוך האפליקציה, וכפתור ברור למעבר ליוטיוב
    const note = el('div', { class: 'frame-note' }, el('span', {}, t('ytHint')),
      el('button', { class: 'btn small primary', onclick: () => window.open(V.linkUrl, '_blank', 'noopener') }, t('openYoutube')));
    const frame = el('iframe', { src: V.frameUrl, class: 'web-frame video-frame', referrerpolicy: 'strict-origin-when-cross-origin',
      allow: 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen', allowfullscreen: '' });
    content.append(note, frame);
    return;
  }
  if (V.frameUrl) {
    const tip = el('div', { class: 'frame-tip hidden' }, t('pdfTip'));
    const note = el('div', { class: 'frame-note' }, el('span', {}, t('iframeHint')),
      el('button', { class: 'btn small', onclick: () => tip.classList.toggle('hidden') }, t('rulersOnWeb')),
      el('button', { class: 'btn small primary', onclick: () => window.open(V.linkUrl, '_blank', 'noopener') }, t('openInBrowser')), tip);
    const frame = el('iframe', { src: V.frameUrl, class: 'web-frame', referrerpolicy: 'no-referrer', allow: 'fullscreen' });
    content.append(note, frame);
    return;
  }
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
  if (V.frameUrl) return;
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
  if (V.st && V.st.lock) return;
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

let lastW = innerWidth;
window.addEventListener('resize', debounce(() => {
  if ($('#viewerView').classList.contains('hidden') || !V.file) return;
  // שינוי גובה בלבד (סרגל הכתובת או המקלדת בטלפון) – לא מסדרים מחדש, כדי שהדוגמה לא תזוז
  if (innerWidth === lastW) return;
  lastW = innerWidth;
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
  const v = prompt(t('rowPrompt'), V.st.c);
  if (v == null) return;
  const n = parseInt(v, 10);
  if (!isNaN(n) && n >= 0) { V.st.c = n; updateCounter(); saveStateSoon(); }
};

// זום
const zoomGuard = () => { if (V.st && V.st.lock) { toast(t('unlockFirst'), 2500); return false; } return true; };
$('#zoomIn').onclick = () => zoomGuard() && setZoom(V.st.z * 1.2);
$('#zoomOut').onclick = () => zoomGuard() && setZoom(V.st.z / 1.2);
$('#zoomFit').onclick = () => zoomGuard() && setZoom(1);

// נעילה
function applyLock() {
  scroller.classList.toggle('locked', !!V.st.lock);
  $('#lockToggle').checked = !!V.st.lock;
  const b = $('#lockBtn');
  b.textContent = V.st.lock ? '🔒' : '🔓';
  b.classList.toggle('on', !!V.st.lock);
  b.title = t(V.st.lock ? 'unlockPattern' : 'lockPattern');
}
$('#lockBtn').onclick = () => { V.st.lock = V.st.lock ? 0 : 1; applyLock(); saveStateSoon(); toast(t(V.st.lock ? 'lockedToast' : 'unlockedToast'), 2500); };

// פאנל הגדרות סרגלים
function setPanel(open) {
  $('#rulerPanel').classList.toggle('hidden', !open);
  $('#panelToggle').classList.toggle('on', open);
  requestAnimationFrame(applyRulers);
}
const panelOpen = () => !$('#rulerPanel').classList.contains('hidden');
$('#panelToggle').onclick = () => setPanel(!panelOpen());
$('#panelClose').onclick = () => setPanel(false);
// לחיצה על הדוגמה סוגרת את הפאנל
scroller.addEventListener('pointerdown', () => { if (panelOpen()) setPanel(false); });
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
  if (e.key === 'Escape') {
    e.preventDefault();
    if (panelOpen()) { setPanel(false); e.target.blur && e.target.blur(); } else closeViewer();
    return;
  }
  if (e.target.matches('input')) return;
  const map = { ArrowUp: ['h', -1], ArrowDown: ['h', 1], ArrowLeft: ['v', -1], ArrowRight: ['v', 1] };
  if (map[e.key]) { e.preventDefault(); stepRuler(...map[e.key]); }
  else if (e.key === '+' || e.key === '=') { V.st.c++; updateCounter(); saveStateSoon(); }
  else if (e.key === '-') { V.st.c = Math.max(0, V.st.c - 1); updateCounter(); saveStateSoon(); }
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
  setPanel(false);
  if (V.file) saveState();
  if (V.observer) V.observer.disconnect();
  if (V.pdf) V.pdf.destroy();
  V.pdf = null; V.file = null; V.pages = []; V.frameUrl = null;
  content.innerHTML = '';
  start();
  if (!fromPop) consumeBackEntry();
}
$('#closeViewerBtn').onclick = () => closeViewer();
$('#notesBtn').onclick = () => { if (V.file && !V.local) openNotes(V.file, () => {}); };
$('#extBtn').onclick = () => { if (V.linkUrl) window.open(V.linkUrl, '_blank', 'noopener'); };
/* ---------------- כפתור "חזרה" של הטלפון ---------------- */
// כל עוד יש לאן לחזור (חלון, עורך, דוגמה פתוחה, תת-תיקייה) שומרים רשומה בהיסטוריה,
// וכפתור החזרה סוגר את השכבה העליונה במקום לצאת מהאפליקציה.
const isOpen = (sel) => { const e = $(sel); return !!e && !e.classList.contains('hidden'); };
function backable() {
  return isOpen('#modal') || isOpen('#menu') || !!document.querySelector('.studio-editor') || isOpen('#viewerView') ||
    isOpen('#studioPane') || nav.path.length > 0;
}
let ignorePop = false;
function ensureBackEntry() {
  if (!(history.state && history.state.mp)) history.pushState({ mp: 1 }, '');
}
function consumeBackEntry() {
  if (!backable() && history.state && history.state.mp) { ignorePop = true; history.back(); }
}
function handleBack() {
  if (isOpen('#menu')) { closeMenu(); return; }
  if (isOpen('#modal')) { $('#modalClose').click(); return; }
  if (!notesPop.classList.contains('hidden')) { hideNotesPop(); return; }
  const eds = document.querySelectorAll('.studio-editor'), editor = eds[eds.length - 1];
  if (editor) { editor.querySelector('.studio-top .back-arrow').click(); return; }
  if (isOpen('#viewerView')) { closeViewer(true); return; }
  if (isOpen('#studioPane')) { setTab('patterns'); return; }
  if (nav.path.length) { nav.to(nav.path.length - 1); dash.load(); }
}
window.addEventListener('popstate', () => {
  if (ignorePop) { ignorePop = false; return; }
  handleBack();
  if (backable()) ensureBackEntry();
});
document.addEventListener('visibilitychange', () => { if (document.hidden && V.file) saveState(); });

/* ---------------- פתיחת קובץ מקומי ---------------- */
document.querySelectorAll('.open-local-btn').forEach((b) => b.addEventListener('click', async () => {
  const f = await pickFile($('#localInput'));
  if (!f) return;
  const meta = { id: 'local:' + f.name + ':' + f.size, name: f.name, mimeType: f.type, appProperties: {} };
  if (!kindOf(meta) || kindOf(meta) === 'doc') { toast(t('localTypes')); return; }
  openFile(meta, f);
}));

/* ---------------- התקנה כאפליקציה ---------------- */
let installPrompt = null;
const isInstalled = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
function updateInstallButtons() {
  document.querySelectorAll('.install-btn').forEach((b) => b.classList.toggle('hidden', isInstalled()));
}
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault(); // מציגים את הכפתור שלנו במקום ההודעה של הדפדפן
  installPrompt = e;
  updateInstallButtons();
});
window.addEventListener('appinstalled', () => {
  installPrompt = null;
  document.querySelectorAll('.install-btn').forEach((b) => b.classList.add('hidden'));
  toast(t('installed'), 4000);
});
async function installApp() {
  if (installPrompt) {
    installPrompt.prompt();
    try { await installPrompt.userChoice; } catch { /* ignore */ }
    installPrompt = null;
    return;
  }
  // הדפדפן לא מאפשר התקנה בלחיצה – מציגים הוראות לפי המכשיר
  const ua = navigator.userAgent;
  const ios = /iPhone|iPad|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const samsung = /SamsungBrowser/.test(ua);
  const inApp = /FBAN|FBAV|Instagram|WhatsApp|Line\/|wv\)/.test(ua);
  const text = ios ? t('installHelpIos') : samsung ? t('installHelpSamsung') : inApp ? t('installHelpInApp')
    : /Android/.test(ua) ? t('installHelpAndroid') : t('installHelpDesktop');
  openModal(t('installTitle'), el('div', {}, el('p', { style: 'line-height:1.7;white-space:pre-line' }, text)));
}
document.querySelectorAll('.install-btn').forEach((b) => b.addEventListener('click', installApp));
updateInstallButtons();

/* ---------------- החשבון המחובר ---------------- */
function accountText() {
  const a = store.get('account', null);
  return a ? (a.displayName ? `${a.displayName} · ${a.emailAddress}` : a.emailAddress) : '…';
}
async function refreshAccount() {
  try { const r = await drive.about(); if (r.user) store.set('account', r.user); } catch { /* ignore */ }
}

/* ---------------- לשוניות: דוגמאות קיימות / יצירת דוגמה ---------------- */
let studioLoading = null;
function loadStudio() {
  if (window.Studio) return Promise.resolve();
  if (!studioLoading) {
    studioLoading = new Promise((res, rej) => {
      const sc = document.createElement('script');
      sc.src = 'studio.js?v=' + APP_V;
      sc.onload = () => res();
      sc.onerror = () => { studioLoading = null; rej(new Error(t('studioLoadFail'))); };
      document.head.append(sc);
    });
  }
  return busy(t('loading'), () => studioLoading);
}
function setTab(tab) {
  const studio = tab === 'studio';
  $('#tabPatterns').classList.toggle('on', !studio);
  $('#tabStudio').classList.toggle('on', studio);
  $('#patternsPane').classList.toggle('hidden', studio);
  $('#studioPane').classList.toggle('hidden', !studio);
  $('#addBtn').classList.toggle('hidden', studio);
  if (studio) { ensureBackEntry(); loadStudio().then(() => Studio.home($('#studioPane'))).catch(err); } else setTimeout(consumeBackEntry, 0);
}
$('#tabPatterns').onclick = () => setTab('patterns');
$('#tabStudio').onclick = () => setTab('studio');

/* ---------------- הגדרות ---------------- */
function openSettings() {
  const root = nav.root();
  const sel = langSelect();
  sel.onchange = () => { setLang(sel.value); closeModal(); refreshLanguage(); openSettings(); };
  const row = (title, hint, btn) => el('div', { class: 'row' }, el('div', {}, el('b', {}, title), hint != null ? el('small', {}, hint) : null), btn);
  const body = el('div', { class: 'settings-list' },
    row('👤 ' + t('account') + ' · Google Drive', accountText(), el('button', { class: 'btn danger', onclick: () => { auth.signOut(); store.set('account', null); closeModal(); start(); } }, t('signOut'))),
    row('🌐 ' + t('language'), null, sel),
    row('©️ ' + t('defaultsRow'), t('defaultsRowHint'), el('button', { class: 'btn', onclick: () => { closeModal(); loadStudio().then(() => Studio.defaults()).catch(err); } }, t('change'))),
    isInstalled() ? null : row('📲 ' + t('installTitle'), t('installHint'),
      el('button', { class: 'btn primary', onclick: () => { closeModal(); installApp(); } }, t('install'))),
    row('📁 ' + t('rootFolder') + ': ' + (root ? root.name : t('notChosen')), t('rootFolderHint'),
      el('button', { class: 'btn', onclick: () => pickRootFolder().catch(err) }, t('change'))),
    row(t('clearCache'), t('clearCacheHint'),
      el('button', { class: 'btn', onclick: async () => { indexedDB.deleteDatabase('mypatterns'); toast(t('cacheCleared')); setTimeout(hardRefresh, 600); } }, t('clear'))),
    row(t('privacyLink'), t('privacyHint'), el('a', { class: 'btn', href: 'privacy.html', target: '_blank', rel: 'noopener' }, t('open'))),
    // מזהי Google Cloud של האפליקציה – מוצגים רק כשלא הוגדרו מראש בקובץ config.js
    window.KNIT_CONFIG && window.KNIT_CONFIG.clientId ? null : row(t('googleIds'), clientId() && apiKey() ? t('configured') : t('notConfigured'),
      el('button', { class: 'btn', onclick: () => { store.set('clientId', ''); store.set('apiKey', ''); auth.signOut(); location.reload(); } }, t('change'))),
  );
  openModal(t('settings'), body);
}

// רענון המסכים אחרי החלפת שפה
function refreshLanguage() {
  if (!$('#dashView').classList.contains('hidden')) { dash.renderCrumbs(); dash.render(); dash.load(true); }
  if (V.file) { $('#accurateBtn').textContent = t('accurate'); setSync(''); }
}

/* ---------------- הוספה (העלאה / תיקייה) ---------------- */
// כפתור אחד לכל דרכי ההוספה
function openAddSheet() {
  closeMenu();
  const opt = (icon, title, hint, fn) => el('button', { class: 'sheet-opt', onclick: () => { closeModal(); fn(); } },
    el('span', { class: 'sheet-icon' }, icon),
    el('span', { class: 'sheet-text' }, el('b', {}, title), el('small', {}, hint)));
  const body = el('div', { class: 'add-sheet' },
    opt('📄', t('addFromDevice'), t('addFromDeviceHint'), () => uploadPatterns($('#uploadInput'))),
    opt('☁️', t('addFromDrive'), t('addFromDriveHint'), () => grantAccess().catch(err)),
    opt('🗂️', t('addOtherCloud'), t('addOtherCloudHint'), () => { toast(t('otherCloudTip'), 6000); uploadPatterns($('#uploadInput')); }),
    opt('🔗', t('addLinkTitle'), t('addLinkHint'), () => openAddLink()),
    opt('📷', t('lensTitle'), t('lensOptHint'), openLensSearch),
    opt('🌐', t('webSearchTitle'), t('webSearchOptHint'), openWebSearch));
  openModal(t('addSheetTitle'), body);
}
async function uploadPatterns(input = $('#uploadInput')) {
  let files = await pickFile(input);
  if (!files || !files.length) return;
  const ok = files.filter((f) => { const k = kindOf({ name: f.name, mimeType: f.type }); return k && k !== 'folder'; });
  if (ok.length < files.length) toast(t('skippedFiles', { n: files.length - ok.length }), 4000);
  files = ok;
  if (!files.length) return;
  const cur = nav.current();
  await busy(t('uploading'), async () => {
    for (const [i, f] of files.entries()) {
      $('#busyText').textContent = t('uploadingN', { i: i + 1, n: files.length, name: f.name });
      await drive.upload(f, { name: f.name, parents: [cur.id], mimeType: f.type || undefined });
    }
  }).catch(err);
  toast(t('uploadDone'));
  dash.load(true);
}
async function newFolder() {
  const name = prompt(t('newFolderPrompt'));
  if (!name) return;
  try {
    const f = await busy(t('creatingFolder'), () => drive.mkdir(name, nav.current().id));
    toast(t('folderCreated'));
    dash.load(true);
    return f;
  } catch (e) { err(e); }
}

/* ---------------- אירועי דשבורד ---------------- */
$('#refreshBtn').onclick = () => dash.load(true);
$('#settingsBtn').onclick = openSettings;
// תפריט ☰: הגדרות, שפה, התקנה, רענון, אודות ומדיניות פרטיות
function openAbout() {
  const body = el('div', { class: 'about' },
    el('img', { src: 'icons/icon.svg?v=2', alt: '', width: '96', height: '96' }),
    el('h2', {}, 'MyPatterns'),
    el('p', { class: 'muted' }, t('version') + ' ' + APP_V),
    el('p', {}, t('aboutText')),
    el('p', {}, el('b', {}, t('contact') + ': '), el('a', { href: 'mailto:MyPatterns007@gmail.com' }, 'MyPatterns007@gmail.com')),
    el('p', {}, el('a', { href: 'privacy.html', target: '_blank', rel: 'noopener' }, t('privacyLink'))));
  openModal(t('about').replace(/^\S+\s/, ''), body);
}
$('#menuBtn').onclick = (e) => {
  const anchor = e.currentTarget;
  const items = [
    { label: '⚙️ ' + t('settings'), fn: openSettings },
    { label: '🌐 ' + t('language'), fn: () => $('#langBtn').onclick({ currentTarget: anchor }) },
  ];
  if (!$('#installBtn').classList.contains('hidden')) items.push({ label: t('install'), fn: () => $('#installBtn').click() });
  items.push({ label: '⟳ ' + t('refresh'), fn: () => $('#refreshBtn').click() },
    { label: t('about'), fn: openAbout },
    { label: t('privacyLink'), fn: () => window.open('privacy.html', '_blank', 'noopener') });
  openMenu(anchor, items);
};
// הלוגו והשם: חזרה לדף הבית (התיקייה הראשית)
$('#brandBtn').onclick = () => { setTab('patterns'); if (nav.path.length) { nav.reset(); dash.load(); } };
// בחירת שפה מהפס העליון
$('#langBtn').onclick = (e) => openMenu(e.currentTarget, Object.entries(LANGS).map(([code, info]) => ({
  label: (code === LANG ? '✓ ' : '') + info.name,
  fn: () => { setLang(code); refreshLanguage(); if (!$('#studioPane').classList.contains('hidden') && window.Studio) Studio.home($('#studioPane')); },
})));
$('#addBtn').onclick = openAddSheet;
$('#newFolderBtn').onclick = () => newFolder();
// סמלי התצוגה: רשימה = מלבנים מלאים אחד מתחת לשני, כרטיסים = ארבעה ריבועים (שונה מ-☰ של התפריט)
const VIEW_ICONS = {
  list: '<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden="true"><rect x="3" y="3" width="18" height="5" rx="1.5"/><rect x="3" y="9.5" width="18" height="5" rx="1.5"/><rect x="3" y="16" width="18" height="5" rx="1.5"/></svg>',
  grid: '<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden="true"><rect x="3" y="3" width="8" height="8" rx="1.5"/><rect x="13" y="3" width="8" height="8" rx="1.5"/><rect x="3" y="13" width="8" height="8" rx="1.5"/><rect x="13" y="13" width="8" height="8" rx="1.5"/></svg>',
};
function updViewBtn() { const list = store.get('viewMode', 'grid') === 'list'; $('#viewBtn').innerHTML = list ? VIEW_ICONS.grid : VIEW_ICONS.list; $('#viewBtn').title = list ? t('viewGrid') : t('viewList'); }
$('#viewBtn').onclick = () => { store.set('viewMode', store.get('viewMode', 'grid') === 'list' ? 'grid' : 'list'); updViewBtn(); dash.render(); };
updViewBtn();
$('#backBtn').onclick = () => { nav.to(nav.path.length - 1); dash.load(); setTimeout(consumeBackEntry, 0); };
$('#searchInput').oninput = () => dash.render();
$('#reauthBtn').onclick = async () => {
  try {
    if (auth.canSilent()) { try { await auth.refresh(); } catch { await auth.login(''); } } else await auth.login('');
    $('#authNote').classList.add('hidden'); dash.load(true);
  } catch (e) { err(e); }
};
$('#saveClientIdBtn').onclick = () => {
  const v = $('#clientIdInput').value.trim();
  const k = $('#apiKeyInput').value.trim();
  if (!/^\d+-.+\.apps\.googleusercontent\.com$/.test(v)) { toast(t('clientIdInvalid')); return; }
  if (!/^AIza/.test(k)) { toast(t('apiKeyInvalid')); return; }
  store.set('clientId', v);
  store.set('apiKey', k);
  start();
};
$('#resetClientBtn').onclick = () => { store.set('clientId', ''); store.set('apiKey', ''); start(); };
$('#pickExistingBtn').onclick = () => pickRootFolder().catch(err);
$('#createRootBtn').onclick = () => createRootFolder().catch(err);
document.querySelectorAll('.upload-btn').forEach((b) => { b.onclick = openAddSheet; });
$('#loginBtn').onclick = async () => {
  try {
    await auth.login('select_account');
    store.set('account', null);
    start();
  } catch (e) {
    toast(t('loginFailed', { msg: e.message }), 4000);
  }
};
window.addEventListener('online', () => { $('#offlineNote').classList.add('hidden'); if (V.file) pushRemote(); });

/* ---------------- הפעלה ---------------- */
// מסך פתיחה עם הלוגו – לפחות חצי שנייה, לכל היותר עד שהדוגמאות נטענו
// דף פתיחה עם שם האפליקציה – שנייה וחצי, ואז דף הבית
const SPLASH_MS = 1500, splashStart = Date.now();
function hideSplash() {
  const sp = $('#splash');
  if (!sp || sp.classList.contains('gone')) return;
  const wait = SPLASH_MS - (Date.now() - splashStart);
  if (wait > 0) { setTimeout(hideSplash, wait); return; }
  sp.classList.add('gone');
  setTimeout(() => sp.remove(), 400);
}
setTimeout(hideSplash, SPLASH_MS);

async function start() {
  if (!clientId() || !apiKey()) { show('#setupView'); hideSplash(); return; }
  if (!auth.valid() && !store.get('signedIn', false)) { show('#loginView'); hideSplash(); return; }
  show('#dashView');
  auth.init().catch(() => {});
  dash.load().finally(hideSplash);
  if (auth.valid() && !store.get('account', null)) refreshAccount();
  if (pendingShare && nav.current()) { openAddLink(pendingShare); pendingShare = null; }
}

// קישור ששותף לאפליקציה מתפריט "שיתוף" של הטלפון
function takeShared() {
  const p = new URLSearchParams(location.search);
  if (!p.has('share')) return null;
  history.replaceState(null, '', location.pathname);
  const url = normalizeUrl(p.get('url') || p.get('text') || '');
  if (!url) return null;
  let title = (p.get('title') || '').trim();
  if (!title) title = (p.get('text') || '').replace(url, '').trim();
  return { url, title: title.slice(0, 120) };
}

// בדיקת גרסה: אם באתר יש גרסה חדשה יותר מזו שרצה עכשיו – מציעים לעדכן בלחיצה
async function hardRefresh() {
  try { const keys = await caches.keys(); await Promise.all(keys.map((k) => caches.delete(k))); } catch { /* ignore */ }
  try { const regs = await navigator.serviceWorker.getRegistrations(); await Promise.all(regs.map((r) => r.unregister())); } catch { /* ignore */ }
  location.reload();
}
async function checkForUpdate() {
  try {
    const html = await (await fetch('index.html?check=' + Date.now(), { cache: 'no-store' })).text();
    const v = Number((html.match(/app\.js\?v=(\d+)/) || [])[1]);
    if (!v || v <= APP_V || document.querySelector('.update-bar')) return;
    document.body.append(el('div', { class: 'update-bar' }, el('span', {}, t('updateAvailable', { v })),
      el('button', { class: 'btn small', onclick: hardRefresh }, t('updateNow'))));
  } catch { /* offline */ }
}
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') checkForUpdate(); });

if (window.pdfjsLib) pdfjsLib.GlobalWorkerOptions.workerSrc = 'vendor/pdf.worker.min.js';
if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  navigator.serviceWorker.register('sw.js', { updateViaCache: 'none' }).then((reg) => reg.update()).catch(() => {});
  checkForUpdate();
}
// חזרה משרת ההתחברות: ההרשאה ומפתח הרענון מגיעים ב-"#"
(function takeAuthHash() {
  const m = location.hash.match(/^#mp_auth=([\w-]+)/);
  if (!m) return;
  try {
    const p = JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(m[1].replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0))));
    if (p.error) { try { sessionStorage.setItem('kp.noAuthServer', '1'); } catch { /* ignore */ } setTimeout(() => toast(t('loginFailed', { msg: p.error }), 6000), 800); return; }
    if (p.rt) { auth.rt = p.rt; store.set('rt', p.rt); }
    store.set('account', null);
    auth._done({ access_token: p.at, expires_in: p.exp });
  } catch (e) { console.warn('auth hash', e); }
})();
if (location.hash) history.replaceState(null, '', location.pathname);
let pendingShare = takeShared();
applyI18n();
document.querySelectorAll('.lang-slot').forEach((slot) => {
  const sel = langSelect();
  sel.onchange = () => setLang(sel.value);
  slot.append(sel);
});
start();
