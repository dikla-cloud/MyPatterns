// MyPatterns – שרת התחברות קטן (Cloudflare Worker, חינמי)
// מחזיק את ההתחברות לגוגל לאורך זמן: גוגל נותנת "מפתח רענון", השרת מצפין אותו
// ומחזיר לאפליקציה, ומשתמש בו כדי לקבל הרשאה חדשה בכל פעם שהקודמת פגה (כל שעה).
// השרת לא שומר שום דבר אצלו – אין מסד נתונים.
//
// משתנים שצריך להגדיר ב-Cloudflare (Settings → Variables and Secrets):
//   GOOGLE_CLIENT_ID      – מזהה הלקוח של MyPatterns ב-Google Cloud
//   GOOGLE_CLIENT_SECRET  – (Secret) הסוד של אותו לקוח
//   ENC_KEY               – (Secret) מחרוזת אקראית ארוכה להצפנה
//   APP_URL               – https://dikla-cloud.github.io/MyPatterns/

const SCOPE = 'https://www.googleapis.com/auth/drive.file';
const enc = new TextEncoder(), dec = new TextDecoder();

const b64u = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const unb64u = (s) => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0));

async function key(env) {
  const raw = await crypto.subtle.digest('SHA-256', enc.encode(env.ENC_KEY));
  return crypto.subtle.importKey('raw', raw, 'AES-GCM', false, ['encrypt', 'decrypt']);
}
async function seal(env, text) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, await key(env), enc.encode(text));
  const out = new Uint8Array(12 + ct.byteLength); out.set(iv); out.set(new Uint8Array(ct), 12);
  return b64u(out);
}
async function open(env, sealed) {
  const b = unb64u(sealed);
  return dec.decode(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: b.slice(0, 12) }, await key(env), b.slice(12)));
}

const appOrigin = (env) => new URL(env.APP_URL).origin;
const json = (env, obj, status = 200) => new Response(JSON.stringify(obj), {
  status,
  headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': appOrigin(env), 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type', Vary: 'Origin' },
});
// חזרה לאפליקציה עם התוצאה ב"#" (לא נשלח לשום שרת ולא נשמר בהיסטוריה של השרת)
const backToApp = (ret, payload) => Response.redirect(ret + '#mp_auth=' + b64u(enc.encode(JSON.stringify(payload))), 302);

async function googleToken(params) {
  const r = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams(params),
  });
  return { ok: r.ok, j: await r.json().catch(() => ({})) };
}

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    if (req.method === 'OPTIONS') return json(env, {});

    // 1) התחברות: מעבר לגוגל
    if (url.pathname === '/login') {
      let ret = url.searchParams.get('ret') || env.APP_URL;
      if (!ret.startsWith(env.APP_URL)) ret = env.APP_URL;
      const state = await seal(env, JSON.stringify({ ret, t: Date.now() }));
      const g = new URL('https://accounts.google.com/o/oauth2/v2/auth');
      g.search = new URLSearchParams({
        client_id: env.GOOGLE_CLIENT_ID, redirect_uri: url.origin + '/callback', response_type: 'code',
        scope: SCOPE, access_type: 'offline', prompt: 'consent', include_granted_scopes: 'true', state,
        ...(url.searchParams.get('hint') ? { login_hint: url.searchParams.get('hint') } : {}),
      }).toString();
      return Response.redirect(g.toString(), 302);
    }

    // 2) גוגל חוזרת לכאן עם קוד – מחליפים אותו בהרשאה ובמפתח רענון
    if (url.pathname === '/callback') {
      let st;
      try { st = JSON.parse(await open(env, url.searchParams.get('state') || '')); } catch { return new Response('Bad state', { status: 400 }); }
      if (Date.now() - st.t > 15 * 60000) return backToApp(st.ret, { error: 'expired' });
      if (url.searchParams.get('error')) return backToApp(st.ret, { error: url.searchParams.get('error') });
      const { ok, j } = await googleToken({
        code: url.searchParams.get('code'), client_id: env.GOOGLE_CLIENT_ID, client_secret: env.GOOGLE_CLIENT_SECRET,
        redirect_uri: url.origin + '/callback', grant_type: 'authorization_code',
      });
      if (!ok || !j.access_token) return backToApp(st.ret, { error: j.error || 'token' });
      return backToApp(st.ret, { at: j.access_token, exp: j.expires_in, rt: j.refresh_token ? await seal(env, j.refresh_token) : null });
    }

    // 3) חידוש שקט של ההרשאה (בלי חלונות ובלי נגיעה)
    if (url.pathname === '/refresh' && req.method === 'POST') {
      if (req.headers.get('Origin') !== appOrigin(env)) return json(env, { error: 'origin' }, 403);
      let rt;
      try { rt = await open(env, (await req.json()).rt); } catch { return json(env, { error: 'bad_rt' }, 401); }
      const { ok, j } = await googleToken({ refresh_token: rt, client_id: env.GOOGLE_CLIENT_ID, client_secret: env.GOOGLE_CLIENT_SECRET, grant_type: 'refresh_token' });
      if (!ok || !j.access_token) return json(env, { error: j.error || 'refresh' }, 401);
      return json(env, { at: j.access_token, exp: j.expires_in });
    }

    // 4) יציאה: ביטול מפתח הרענון אצל גוגל
    if (url.pathname === '/revoke' && req.method === 'POST') {
      if (req.headers.get('Origin') !== appOrigin(env)) return json(env, { error: 'origin' }, 403);
      try {
        const rt = await open(env, (await req.json()).rt);
        await fetch('https://oauth2.googleapis.com/revoke', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ token: rt }) });
      } catch { /* ignore */ }
      return json(env, { ok: true });
    }

    return new Response('MyPatterns sign-in server', { status: 200 });
  },
};
