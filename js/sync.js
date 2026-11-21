/* =========================================================
 * 데이터 동기화 계층 (Backend Adapter)
 * ---------------------------------------------------------
 * 게임 화면 코드는 이 인터페이스만 사용합니다.
 *   init(), uid(), now(), get(path), set(path, v), update(path, patch),
 *   push(path, v) -> id, watch(path, cb) -> unsubscribe, remove(path)
 *
 * - DemoAdapter    : localStorage + BroadcastChannel. "같은 브라우저 안의 탭끼리만" 공유.
 *                    (다른 사람 스마트폰과는 절대 공유되지 않음 — 시연·리허설 전용)
 * - FirebaseAdapter: Firebase Realtime Database + 익명 인증. 실제 다기기 실시간 공유.
 *
 * 데이터 구조
 *   sessions/{code}/meta              게임 상태(시작·일시정지·제한시간·hostUid)
 *   sessions/{code}/content           해당 세션에 사용되는 문제 세트(생성 시점 스냅샷)
 *   sessions/{code}/teams/{teamId}    팀별 진행 상태·점수 (본인 팀 + 강사만 읽기 가능)
 * ========================================================= */
const Sync = (() => {
  const cfg = window.APP_CONFIG || {};
  const fb = cfg.FIREBASE || {};
  let mode = cfg.MODE === 'firebase' && fb.apiKey && fb.databaseURL ? 'firebase' : 'demo';
  let impl = null;

  function DemoAdapter() {
    /* 저장 단위(bucket)를 나눠 탭끼리 서로의 기록을 덮어쓰지 않게 함
       sessions/{c}/meta · sessions/{c}/content · sessions/{c}/teams/{id} 각각 별도 키 */
    const PFX = 'ecgdemo|';
    const listeners = new Set();
    let ch = null;
    try { ch = new BroadcastChannel('ecg_restart_demo'); ch.onmessage = () => notify(); } catch (e) { /* 미지원 브라우저 */ }
    window.addEventListener('storage', e => { if (!e.key || e.key.startsWith(PFX)) notify(); });
    function notify() { listeners.forEach(fn => { try { fn(); } catch (e) { console.error(e); } }); }
    const segs = p => p.split('/').filter(Boolean);
    const bucketLen = sg => (sg[2] === 'teams' ? 4 : 3);
    const readKey = k => { try { const v = localStorage.getItem(PFX + k); return v == null ? undefined : JSON.parse(v); } catch (e) { return undefined; } };
    const keysUnder = prefix => Object.keys(localStorage).filter(k => k.startsWith(PFX) && (k.slice(PFX.length) === prefix || k.slice(PFX.length).startsWith(prefix + '/'))).map(k => k.slice(PFX.length));
    function getPath(path) {
      const sg = segs(path), bl = bucketLen(sg);
      if (sg.length >= bl) {
        let o = readKey(sg.slice(0, bl).join('/'));
        for (const k of sg.slice(bl)) { if (o == null) return undefined; o = o[k]; }
        return o;
      }
      const out = {}; let any = false;
      for (const k of keysUnder(sg.join('/'))) {
        const rest = segs(k).slice(sg.length); let o = out;
        rest.slice(0, -1).forEach(x => { o[x] = o[x] || {}; o = o[x]; });
        o[rest[rest.length - 1]] = readKey(k); any = true;
      }
      return any ? out : undefined;
    }
    function setPath(path, val) {
      const sg = segs(path), bl = bucketLen(sg);
      try {
        if (sg.length >= bl) {
          const key = sg.slice(0, bl).join('/'), sub = sg.slice(bl);
          if (!sub.length) { val === null ? localStorage.removeItem(PFX + key) : localStorage.setItem(PFX + key, JSON.stringify(U.clean(val))); }
          else {
            const root = readKey(key) || {}; let o = root;
            sub.slice(0, -1).forEach(x => { if (o[x] == null || typeof o[x] !== 'object') o[x] = {}; o = o[x]; });
            if (val === null) delete o[sub[sub.length - 1]]; else o[sub[sub.length - 1]] = U.clean(val);
            localStorage.setItem(PFX + key, JSON.stringify(root));
          }
        } else {
          keysUnder(sg.join('/')).forEach(k => localStorage.removeItem(PFX + k));
          if (val !== null && typeof val === 'object') Object.entries(val).forEach(([k, v]) => setPath(path + '/' + k, v));
        }
      } catch (e) { U.toast('브라우저 저장공간이 부족합니다 (이미지 용량 확인)', 'err'); throw e; }
      notify(); ch && ch.postMessage('changed');
    }
    return {
      async init() {},
      uid: () => 'demo-' + (sessionStorage.getItem('ecg_demo_uid') || (() => { const v = Math.random().toString(36).slice(2, 10); sessionStorage.setItem('ecg_demo_uid', v); return v; })()),
      now: () => Date.now(),
      async get(p) { return U.clone(getPath(p) ?? null); },
      async set(p, v) { setPath(p, v); },
      async update(p, patch) { const cur = getPath(p) || {}; setPath(p, Object.assign({}, cur, patch)); },
      async push(p, v) { const id = 't' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); setPath(p + '/' + id, v); return id; },
      async remove(p) { setPath(p, null); },
      watch(p, cb) {
        let last;
        const fn = () => { const v = JSON.stringify(getPath(p) ?? null); if (v !== last) { last = v; cb(JSON.parse(v)); } };
        listeners.add(fn); fn();
        return () => listeners.delete(fn);
      },
      resetAll() { Object.keys(localStorage).filter(k => k.startsWith(PFX)).forEach(k => localStorage.removeItem(k)); notify(); ch && ch.postMessage('changed'); }
    };
  }

  function FirebaseAdapter() {
    let db, uid, offset = 0;
    const load = src => new Promise((res, rej) => { const s = document.createElement('script'); s.src = src; s.onload = res; s.onerror = rej; document.head.appendChild(s); });
    return {
      async init() {
        const base = 'https://www.gstatic.com/firebasejs/10.12.2/';
        await load(base + 'firebase-app-compat.js');
        await load(base + 'firebase-auth-compat.js');
        await load(base + 'firebase-database-compat.js');
        if (!firebase.apps.length) firebase.initializeApp(fb);
        const cred = await firebase.auth().signInAnonymously();   // 콘솔에서 '익명' 로그인 활성화 필요
        uid = cred.user.uid;
        db = firebase.database();
        db.ref('.info/serverTimeOffset').on('value', s => { offset = s.val() || 0; });  // 기기 간 시계 차이 보정
      },
      uid: () => uid,
      now: () => Date.now() + offset,
      async get(p) { return (await db.ref(p).get()).val(); },
      set: (p, v) => db.ref(p).set(U.clean(v)),
      update: (p, v) => db.ref(p).update(U.clean(v)),
      async push(p, v) { const r = db.ref(p).push(); await r.set(U.clean(v)); return r.key; },
      remove: p => db.ref(p).remove(),
      watch(p, cb) {
        const r = db.ref(p);
        const fn = s => cb(s.val());
        r.on('value', fn, err => { console.error(err); U.toast('데이터 접근 권한 오류: ' + p.split('/').pop(), 'err'); });
        return () => r.off('value', fn);
      }
    };
  }

  return {
    get mode() { return mode; },
    async init() {
      impl = mode === 'firebase' ? FirebaseAdapter() : DemoAdapter();
      try { await impl.init(); }
      catch (e) {
        console.error(e);
        mode = 'demo'; impl = DemoAdapter(); await impl.init();
        setTimeout(() => U.toast('Firebase 연결 실패 → DEMO MODE로 실행합니다', 'err'), 300);
      }
    },
    uid: () => impl.uid(),
    now: () => impl.now(),
    get: p => impl.get(p),
    set: (p, v) => impl.set(p, v),
    update: (p, v) => impl.update(p, v),
    push: (p, v) => impl.push(p, v),
    remove: p => impl.remove(p),
    watch: (p, cb) => impl.watch(p, cb),
    resetDemo: () => impl.resetAll && impl.resetAll(),
    paths: {
      meta: c => `sessions/${c}/meta`,
      content: c => `sessions/${c}/content`,
      teams: c => `sessions/${c}/teams`,
      team: (c, t) => `sessions/${c}/teams/${t}`
    }
  };
})();
