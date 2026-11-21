/* 공통 유틸리티 */
const U = {
  esc(s) {
    return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  },
  /** 줄바꿈을 <br>로 (이스케이프 후) */
  nl(s) { return U.esc(s).replace(/\n/g, '<br>'); },
  $(sel, root = document) { return root.querySelector(sel); },
  $$(sel, root = document) { return [...root.querySelectorAll(sel)]; },
  clone(o) { return o == null ? o : JSON.parse(JSON.stringify(o)); },
  /** Firebase에 저장할 수 없는 undefined 제거 */
  clean(o) { return JSON.parse(JSON.stringify(o, (k, v) => (v === undefined ? null : v))); },
  params: new URLSearchParams(location.search),
  baseUrl() { return location.origin + location.pathname; },
  fmtTime(sec) {
    sec = Math.max(0, Math.ceil(sec || 0));
    const m = Math.floor(sec / 60), s = sec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  },
  code4() { return String(Math.floor(1000 + Math.random() * 9000)); },
  pick(a) { return a[Math.floor(Math.random() * a.length)]; },
  hash(str) { let h = 2166136261; for (const ch of String(str)) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; },
  /** 시드 기반 셔플(같은 팀에게는 항상 같은 순서) */
  seededShuffle(arr, seed) {
    const a = arr.slice(); let s = U.hash(seed) || 1;
    for (let i = a.length - 1; i > 0; i--) { s = (Math.imul(s, 1103515245) + 12345) >>> 0; const j = s % (i + 1); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  },
  toast(msg, type = '') {
    const t = U.$('#toast');
    const el = document.createElement('div');
    el.className = 'toast ' + type; el.textContent = msg;
    t.appendChild(el);
    setTimeout(() => el.classList.add('out'), 2600);
    setTimeout(() => el.remove(), 3100);
  },
  /** 화면 장식용 파형 (임상 파형 아님) */
  ecgLine(cls = '') {
    return `<svg class="ecg-deco ${cls}" viewBox="0 0 300 60" preserveAspectRatio="none" aria-hidden="true"><path d="M0 34 H60 L68 34 L74 30 L80 34 L92 34 L98 8 L106 52 L112 34 L130 34 L138 28 L148 34 H190 L198 34 L204 30 L210 34 L222 34 L228 8 L236 52 L242 34 L260 34 L268 28 L278 34 H300"/></svg>`;
  },
  icon: {
    lock: `<svg viewBox="0 0 64 64" class="ic-lock" aria-hidden="true"><path class="shackle" d="M20 28 V20 a12 12 0 0 1 24 0 V28" fill="none" stroke-width="5" stroke-linecap="round"/><rect x="12" y="28" width="40" height="28" rx="6"/><circle cx="32" cy="41" r="4" class="hole"/><rect x="30.5" y="42" width="3" height="7" rx="1.5" class="hole"/></svg>`
  },
  /** 받침에 따라 조사 선택: josa('열쇠','이','가') */
  josa(w, a, b) { const c = String(w).trim().slice(-1).charCodeAt(0); if (c < 0xAC00 || c > 0xD7A3) return w + a + '(' + b + ')'; return w + ((c - 0xAC00) % 28 ? a : b); },
  /** 타자기 효과 — 탭하면 즉시 완료 */
  typewrite(el, text, speed = 26) {
    if (!el) return; let i = 0; el.textContent = ''; el.classList.add('typing');
    const t = setInterval(() => { i++; el.textContent = text.slice(0, i); if (i % 3 === 0) Sfx.tick(); if (i >= text.length) done(); }, speed);
    function done() { clearInterval(t); el.textContent = text; el.classList.remove('typing'); }
    el.closest('section')?.addEventListener('click', done, { once: true });
  },
  download(name, text, type = 'application/json') {
    const blob = new Blob([text], { type });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = name; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  },
  /** 스마트폰에서 열 수 없는 주소인지 확인 (파일 직접 열기, localhost, 사내 IP) */
  urlProblem() {
    const h = location.hostname;
    if (location.protocol === 'file:') return 'file';
    if (h === 'localhost' || h === '127.0.0.1' || h === '::1' || h === '') return 'local';
    if (/^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(h)) return 'lan';
    return '';
  },
  qrImg(text) {
    try {
      if (typeof qrcode === 'undefined') return '';
      const q = qrcode(0, 'M'); q.addData(text); q.make();
      return `<img class="qr" alt="참여 QR 코드" src="${q.createDataURL(8, 4)}">`;
    } catch (e) { return ''; }
  }
};

/* 8비트 효과음 (WebAudio, 파일 없음) */
const Sfx = (() => {
  let ctx = null, on = localStorage.getItem('ecg_sfx') !== 'off';
  function ac() { if (!ctx) { try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {} } if (ctx && ctx.state === 'suspended') ctx.resume(); return ctx; }
  function tone(f, d = 0.12, type = 'square', vol = 0.045, when = 0) {
    if (!on) return; const c = ac(); if (!c) return;
    const o = c.createOscillator(), g = c.createGain(), t0 = c.currentTime + when;
    o.type = type; o.frequency.setValueAtTime(f, t0);
    g.gain.setValueAtTime(vol, t0); g.gain.exponentialRampToValueAtTime(0.0001, t0 + d);
    o.connect(g); g.connect(c.destination); o.start(t0); o.stop(t0 + d + 0.02);
  }
  const seq = (fs, step, d, type, vol) => fs.forEach((f, i) => tone(f, d, type, vol, i * step));
  document.addEventListener('pointerdown', () => ac(), { once: true });
  return {
    get on() { return on; },
    toggle() { on = !on; localStorage.setItem('ecg_sfx', on ? 'on' : 'off'); if (on) tone(880, .08); return on; },
    tick() { tone(1200, .02, 'square', .015); },
    click() { tone(700, .05, 'square', .03); },
    ok() { seq([523, 659, 784, 1047], .08, .12); },
    bad() { tone(196, .18, 'sawtooth', .05); tone(147, .25, 'sawtooth', .05, .15); },
    deny() { tone(260, .07); tone(220, .1, 'square', .045, .09); },
    item() { seq([784, 988, 1319, 1568], .07, .11, 'triangle', .07); },
    unlock() { seq([392, 523, 659, 784, 1047, 1319], .09, .15); },
    dial() { tone(1500, .03, 'square', .025); },
    win() { seq([523, 523, 784, 1047, 988, 1047, 1319], .12, .18, 'square', .05); }
  };
})();
