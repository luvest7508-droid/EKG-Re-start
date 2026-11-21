/* =========================================================
 * 픽셀아트 스프라이트 엔진 + 일백이 캐릭터 + 방 사물
 * - 도형(원·사각형·다각형)을 저해상도 격자에 찍고, 부위마다 외곽선을 둘러 픽셀아트로 렌더링
 * - 결과는 PNG data URL로 캐시 → <img class="px"> 로 확대 표시(image-rendering: pixelated)
 * ========================================================= */
const Pix = (() => {
  const OUT = '#23293a';
  const cache = {};

  /* ---------- 도형 ---------- */
  const ell = (cx, cy, rx, ry) => (x, y) => ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1;
  const rect = (x0, y0, x1, y1) => (x, y) => x >= x0 && x <= x1 + 1 && y >= y0 && y <= y1 + 1;
  const rrect = (x0, y0, x1, y1, r = 1) => (x, y) => {
    if (!rect(x0, y0, x1, y1)(x, y)) return false;
    const cx = Math.min(Math.max(x, x0 + r), x1 + 1 - r), cy = Math.min(Math.max(y, y0 + r), y1 + 1 - r);
    return (x - cx) ** 2 + (y - cy) ** 2 <= r * r + .01;
  };
  const poly = pts => (x, y) => { let ins = false; for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) { const [xi, yi] = pts[i], [xj, yj] = pts[j]; if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) ins = !ins; } return ins; };
  const or = (...fs) => (x, y) => fs.some(f => f(x, y));
  const px = list => { const s = new Set(list.map(([a, b]) => a + ',' + b)); return (x, y) => s.has(Math.floor(x) + ',' + Math.floor(y)); };

  /** ops: [{s: shapeFn, c: color, o: outline?}] */
  function render(w, h, ops) {
    const g = new Array(w * h).fill(null);
    for (const op of ops) {
      if (!op) continue;
      const pts = [];
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (op.s(x + .5, y + .5)) pts.push(y * w + x);
      if (op.o) {
        const set = new Set(pts);
        for (const p of pts) {
          const x = p % w, y = (p / w) | 0;
          for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
            const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
            const n = ny * w + nx; if (!set.has(n)) g[n] = op.oc || OUT;
          }
        }
      }
      for (const p of pts) g[p] = op.c;
    }
    return g;
  }
  function toURL(w, h, g) {
    const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
    const ctx = cv.getContext('2d');
    g.forEach((c, i) => { if (c) { ctx.fillStyle = c; ctx.fillRect(i % w, (i / w) | 0, 1, 1); } });
    return cv.toDataURL();
  }
  function sprite(key, w, h, opsFn) {
    if (!cache[key]) cache[key] = { url: toURL(w, h, render(w, h, opsFn())), w, h };
    return cache[key];
  }
  function img(sp, scale, cls = '', alt = '') {
    return `<img class="px ${cls}" src="${sp.url}" width="${sp.w * scale}" height="${sp.h * scale}" alt="${alt}" draggable="false">`;
  }

  /* =========================================================
   * 일백이 (32 x 38)
   * ========================================================= */
  const C = {
    white: '#ffffff', shade: '#e3ecf3', ink: '#2a2f3d', muzzle: '#cfe7f2', scarf: '#f7931e', scarfD: '#d9770b',
    navy: '#203f8a', steth: '#2b93d6', metal: '#8d97a5', red: '#e5484d', cyan: '#3fd6e8', gold: '#ffcf3f', pink: '#ff9fb4'
  };
  const CHARACTERS = [
    { id: 'doctor', name: '닥터 일백이', desc: '청진기를 든 침착한 판독 리더', coat: C.white, inner: C.navy, pants: C.navy },
    { id: 'nurse', name: '널스 일백이', desc: '모니터 알람은 절대 놓치지 않아', coat: '#7fd3c9', inner: C.white, pants: '#4fb3a8', hat: 'nurse' },
    { id: 'rescue', name: '구급대원 일백이', desc: '현장 출동 1분 대기조', coat: '#d6f03c', inner: '#5b6577', pants: '#3b4558', hat: 'helmet', stripe: true },
    { id: 'hero', name: 'CPR 히어로 일백이', desc: '분당 100–120회, 깊이 5–6cm!', coat: C.white, inner: C.red, pants: C.navy, cape: true, mask: true },
    { id: 'night', name: '나이트 일백이', desc: '밤샘 근무도 커피 한 잔이면 OK', coat: '#3c5a9e', inner: '#9fb4e0', pants: '#2a3f74', hat: 'nightcap', cup: true },
    { id: 'future', name: '퓨처 일백이', desc: 'AI 심전도 판독 바이저 장착', coat: '#eef3f8', inner: C.cyan, pants: '#6a7d96', visor: true }
  ];

  function bearOps(ch, mood = 'normal') {
    const ops = [];
    if (ch.cape) ops.push({ s: poly([[9, 22], [23, 22], [27, 34], [5, 34]]), c: C.cyan, o: 1 });
    // 귀
    ops.push({ s: or(ell(8.5, 7.5, 3.9, 3.9), ell(23.5, 7.5, 3.9, 3.9)), c: C.white, o: 1 });
    ops.push({ s: or(ell(8.2, 7.2, 2.1, 2.1), ell(23.8, 7.2, 2.1, 2.1)), c: C.ink });
    // 다리·몸·팔
    ops.push({ s: or(rect(11, 31, 14, 33), rect(17, 31, 20, 33)), c: ch.pants, o: 1 });
    ops.push({ s: or(rect(10, 34, 14, 35), rect(17, 34, 21, 35)), c: C.white, o: 1 });
    ops.push({ s: or(ell(8.4, 27, 2.4, 3.6), ell(23.6, 27, 2.4, 3.6)), c: ch.coat, o: 1 });
    ops.push({ s: rrect(10, 22, 21, 32, 2), c: ch.coat, o: 1 });
    ops.push({ s: rect(14, 23, 17, 31), c: ch.inner });
    if (ch.stripe) ops.push({ s: or(rect(10, 29, 13, 29), rect(18, 29, 21, 29)), c: '#c9d3df' });
    if (ch.cape) ops.push({ s: px([[15, 26], [16, 26], [14, 25], [17, 25], [15, 27], [16, 27], [14, 24], [17, 24]]), c: C.white });
    // 머리
    ops.push({ s: ell(16, 14.2, 11.2, 8.6), c: C.white, o: 1 });
    // 스카프
    ops.push({ s: or(rrect(9, 21, 22, 22, 1), rect(6, 22, 9, 25)), c: C.scarf, o: 1 });
    ops.push({ s: px([[7, 25], [9, 24]]), c: C.scarfD });
    ops.push({ s: ell(9.6, 21.9, 1.2, 1.2), c: C.white });
    if (['doctor', 'nurse', 'night'].includes(ch.id)) {
      ops.push({ s: px([[19, 23], [20, 24], [20, 25], [20, 26], [19, 27]]), c: C.steth });
      ops.push({ s: rect(18, 27, 19, 28), c: C.metal, o: 1 });
    }
    // 얼굴
    ops.push({ s: ell(16, 17.4, 4, 2.7), c: C.muzzle, o: 1 });
    ops.push({ s: rect(15, 16, 16, 16), c: C.ink });
    if (mood === 'happy') {
      ops.push({ s: px([[10, 14], [11, 13], [12, 14], [19, 14], [20, 13], [21, 14]]), c: C.ink });
      ops.push({ s: px([[14, 18], [15, 19], [16, 19], [17, 18], [15, 18], [16, 18]]), c: C.ink });
      ops.push({ s: px([[9, 16], [10, 16], [21, 16], [22, 16]]), c: C.pink });
    } else if (mood === 'oops') {
      ops.push({ s: px([[10, 12], [12, 14], [11, 13], [10, 14], [12, 12], [19, 12], [21, 14], [20, 13], [19, 14], [21, 12]]), c: C.ink });
      ops.push({ s: rect(15, 18, 16, 19), c: C.ink });
      ops.push({ s: px([[25, 9], [25, 10], [24, 11], [25, 11], [26, 11], [25, 12]]), c: '#6cc6f0' });
    } else {
      ops.push({ s: or(rect(11, 13, 11, 14), rect(20, 13, 20, 14)), c: C.ink });
      ops.push({ s: px([[14, 18], [15, 19], [16, 19], [17, 18]]), c: C.ink });
    }
    if (ch.mask) {
      ops.push({ s: rrect(7, 12, 24, 15, 1), c: C.red, o: 1 });
      ops.push({ s: or(rect(10, 13, 12, 14), rect(19, 13, 21, 14)), c: C.white });
      if (mood === 'happy') ops.push({ s: px([[10, 14], [11, 13], [12, 14], [19, 14], [20, 13], [21, 14]]), c: C.ink });
      else ops.push({ s: or(rect(11, 13, 11, 14), rect(20, 13, 20, 14)), c: C.ink });
      ops.push({ s: poly([[24, 13], [29, 11], [28, 16]]), c: C.red, o: 1 });
    }
    if (ch.visor) {
      ops.push({ s: rrect(6, 11, 25, 15, 1), c: C.cyan, o: 1 });
      ops.push({ s: px([[8, 12], [9, 12], [10, 12], [11, 12], [16, 12], [17, 12]]), c: '#e9fdff' });
      ops.push({ s: rect(26, 3, 26, 6), c: C.metal, o: 1 });
      ops.push({ s: ell(26.5, 2.5, 1.6, 1.6), c: C.cyan, o: 1 });
    }
    if (ch.hat === 'nurse') {
      ops.push({ s: poly([[10, 8], [22, 8], [20.5, 2], [11.5, 2]]), c: C.white, o: 1 });
      ops.push({ s: or(rect(15, 3, 16, 6), rect(14, 4, 17, 5)), c: C.red });
    }
    if (ch.hat === 'helmet') {
      ops.push({ s: (x, y) => ell(16, 9, 10.5, 7.5)(x, y) && y < 9, c: C.red, o: 1 });
      ops.push({ s: rect(5, 8, 27, 9), c: '#b8323a', o: 1 });
      ops.push({ s: or(rect(15, 3, 16, 6), rect(14, 4, 17, 5)), c: C.white });
    }
    if (ch.hat === 'nightcap') {
      ops.push({ s: poly([[6, 8], [26, 8], [24, 4], [28, 1], [13, 1.5]]), c: '#2a3f74', o: 1 });
      ops.push({ s: rect(6, 7, 26, 8), c: C.white, o: 1 });
      ops.push({ s: ell(28.5, 1.5, 1.8, 1.8), c: C.white, o: 1 });
      ops.push({ s: px([[13, 4], [18, 3], [22, 5]]), c: C.gold });
    }
    if (ch.cup) {
      ops.push({ s: rect(24, 26, 27, 29), c: '#ffffff', o: 1 });
      ops.push({ s: rect(24, 26, 27, 26), c: '#7a4a2a' });
      ops.push({ s: px([[25, 24], [26, 23]]), c: '#c9d3df' });
    }
    return ops;
  }
  const character = (id, mood = 'normal') => { const ch = CHARACTERS.find(c => c.id === id) || CHARACTERS[0]; return sprite(`ch_${ch.id}_${mood}`, 32, 38, () => bearOps(ch, mood)); };

  /* =========================================================
   * 방 사물
   * ========================================================= */
  const P = { frame: '#dfe8f0', frameD: '#b9c8d6', screen: '#11294a', glow: '#3fe0a0', cyan: '#3fd6e8', wood: '#f2e3c9', woodD: '#d8c19a', red: '#e5484d', redD: '#b8323a', yellow: '#ffd23f', paper: '#fff8f0', grid: '#ffb3bd', blue: '#5aa9e6', blueD: '#3b7fc0', green: '#62c46a', greenD: '#3f9a4c', metal: '#9aa6b4', white: '#ffffff', teal: '#5cc8bd', navy: '#203f8a' };
  const OBJ = {
    monitor: () => sprite('monitor', 26, 30, () => [
      { s: rect(12, 18, 13, 27), c: P.metal, o: 1 }, { s: rrect(7, 27, 18, 28, 1), c: P.frameD, o: 1 },
      { s: rrect(1, 1, 24, 18, 2), c: P.frame, o: 1 }, { s: rect(3, 3, 22, 15), c: P.screen },
      { s: px([[3, 9], [4, 9], [5, 9], [6, 9], [7, 8], [8, 9], [9, 9], [10, 4], [11, 13], [12, 9], [13, 9], [14, 9], [15, 9], [16, 8], [17, 9], [18, 9], [19, 4], [20, 13], [21, 9], [22, 9]]), c: P.glow },
      { s: px([[19, 12], [20, 12], [21, 12]]), c: P.cyan }, { s: px([[4, 17], [6, 17], [8, 17]]), c: P.red }
    ]),
    printer: () => sprite('printer', 26, 22, () => [
      { s: rect(4, 17, 21, 20), c: P.frameD, o: 1 }, { s: or(ell(6, 20.5, 1.5, 1.5), ell(20, 20.5, 1.5, 1.5)), c: P.screen, o: 1 },
      { s: rrect(2, 8, 23, 16, 1), c: P.frame, o: 1 }, { s: rect(4, 10, 11, 14), c: P.screen }, { s: px([[5, 12], [6, 12], [7, 11], [8, 13], [9, 12], [10, 12]]), c: P.glow },
      { s: poly([[13, 9], [22, 9], [24, 1], [15, 1]]), c: P.paper, o: 1 },
      { s: px([[17, 5], [18, 5], [19, 3], [20, 6], [21, 5], [16, 5]]), c: P.red }, { s: rect(14, 15, 21, 15), c: P.frameD }
    ]),
    desk: () => sprite('desk', 36, 24, () => [
      { s: or(rect(3, 12, 4, 23), rect(31, 12, 32, 23)), c: P.woodD, o: 1 }, { s: rect(20, 13, 30, 22), c: P.wood, o: 1 },
      { s: or(rect(21, 15, 29, 15), rect(21, 19, 29, 19)), c: P.woodD }, { s: px([[25, 17], [25, 21]]), c: P.metal },
      { s: rect(1, 10, 34, 12), c: P.wood, o: 1 },
      { s: rrect(4, 1, 15, 8, 1), c: P.frame, o: 1 }, { s: rect(5, 2, 14, 7), c: '#cfe9ff' }, { s: rect(2, 9, 17, 9), c: P.frameD, o: 1 },
      { s: rect(21, 6, 28, 9), c: P.paper, o: 1 }, { s: rect(22, 4, 29, 7), c: '#fff2a8', o: 1 }, { s: or(rect(23, 5, 27, 5)), c: P.woodD }
    ]),
    locker: () => sprite('locker', 20, 34, () => [
      { s: rect(1, 1, 18, 32), c: '#cde3f1', o: 1 }, { s: rect(9, 2, 10, 31), c: P.frameD },
      { s: or(rect(3, 4, 7, 4), rect(3, 6, 7, 6), rect(12, 4, 16, 4), rect(12, 6, 16, 6)), c: P.frameD },
      { s: rrect(12, 14, 16, 19, 1), c: P.screen, o: 1 }, { s: px([[13, 15], [15, 15], [14, 17], [13, 18], [15, 18]]), c: P.cyan },
      { s: or(rect(7, 15, 7, 18)), c: P.metal }
    ]),
    bed: () => sprite('bed', 40, 24, () => [
      { s: or(rect(4, 17, 5, 21), rect(34, 17, 35, 21)), c: P.metal, o: 1 }, { s: or(ell(5, 22, 1.6, 1.6), ell(35, 22, 1.6, 1.6)), c: P.screen, o: 1 },
      { s: rect(2, 14, 37, 17), c: P.frame, o: 1 }, { s: rrect(1, 4, 4, 16, 1), c: P.frameD, o: 1 },
      { s: rrect(5, 9, 13, 13, 2), c: P.white, o: 1 }, { s: (x, y) => rrect(10, 8, 37, 14, 3)(x, y), c: P.blue, o: 1 },
      { s: or(rect(14, 10, 35, 10)), c: '#8cc6f2' }, { s: rrect(36, 6, 38, 16, 1), c: P.frameD, o: 1 }
    ]),
    defib: () => sprite('defib', 24, 20, () => [
      { s: rrect(1, 4, 22, 18, 2), c: P.yellow, o: 1 }, { s: rect(3, 6, 12, 13), c: P.screen },
      { s: px([[4, 10], [5, 10], [6, 8], [7, 12], [8, 9], [9, 10], [10, 10], [11, 10]]), c: P.glow },
      { s: or(rrect(14, 6, 17, 12, 1), rrect(18, 6, 21, 12, 1)), c: P.frame, o: 1 }, { s: ell(9, 16, 1.5, 1.2), c: P.red, o: 1 },
      { s: rrect(6, 1, 17, 3, 1), c: P.frameD, o: 1 }, { s: px([[3, 16], [4, 16], [5, 16]]), c: P.navy }
    ]),
    crashcart: () => sprite('crashcart', 24, 30, () => [
      { s: or(ell(4, 28, 1.6, 1.6), ell(20, 28, 1.6, 1.6)), c: P.screen, o: 1 },
      { s: rect(2, 5, 21, 26), c: P.red, o: 1 }, { s: or(rect(3, 10, 20, 10), rect(3, 15, 20, 15), rect(3, 20, 20, 20)), c: P.redD },
      { s: or(rect(9, 7, 14, 8), rect(9, 12, 14, 13), rect(9, 17, 14, 18), rect(9, 22, 14, 23)), c: P.frame, o: 1 },
      { s: rect(1, 2, 22, 4), c: P.frame, o: 1 }, { s: rrect(6, 0, 11, 1), c: P.yellow, o: 1 }
    ]),
    cabinet: () => sprite('cabinet', 22, 34, () => [
      { s: rect(1, 1, 20, 32), c: P.frame, o: 1 }, { s: rect(3, 3, 18, 20), c: '#d6f3ff' },
      { s: or(rect(3, 9, 18, 9), rect(3, 15, 18, 15)), c: P.frameD },
      { s: or(rect(4, 6, 6, 8), rect(8, 7, 9, 8), rect(12, 5, 14, 8), rect(5, 12, 7, 14), rect(11, 12, 13, 14), rect(15, 13, 17, 14), rect(6, 18, 9, 20), rect(13, 17, 16, 20)), c: '#9fd8c9', o: 1 },
      { s: rect(3, 23, 18, 30), c: P.frameD, o: 1 }, { s: rect(9, 26, 12, 26), c: P.metal }
    ]),
    lightbox: () => sprite('lightbox', 36, 22, () => [
      { s: rrect(1, 1, 34, 18, 2), c: P.frame, o: 1 }, { s: rect(3, 3, 32, 16), c: '#fff4f4' },
      { s: (x, y) => x >= 3 && x <= 33 && y >= 3 && y <= 17 && (Math.floor(x) % 4 === 0 || Math.floor(y) % 4 === 0), c: '#ffd0d6' },
      { s: px([[4, 7], [5, 7], [6, 7], [7, 5], [8, 8], [9, 7], [10, 7], [11, 7], [12, 7], [13, 7], [14, 5], [15, 8], [16, 7], [17, 7], [19, 13], [20, 13], [21, 13], [22, 11], [23, 14], [24, 13], [25, 13], [26, 13], [27, 13], [28, 11], [29, 14], [30, 13], [31, 13]]), c: P.screen },
      { s: rect(16, 19, 19, 20), c: P.frameD, o: 1 }
    ]),
    computer: () => sprite('computer', 26, 24, () => [
      { s: rect(11, 16, 14, 19), c: P.frameD, o: 1 }, { s: rrect(6, 20, 19, 21, 1), c: P.frameD, o: 1 },
      { s: rrect(1, 1, 24, 16, 2), c: P.frame, o: 1 }, { s: rect(3, 3, 22, 13), c: P.screen },
      { s: or(rect(5, 5, 12, 5), rect(5, 8, 16, 8), rect(5, 11, 10, 11)), c: P.cyan }, { s: rect(16, 5, 20, 7), c: P.glow }
    ]),
    filecab: () => sprite('filecab', 20, 30, () => [
      { s: rect(1, 1, 18, 28), c: '#c8d8ee', o: 1 }, { s: or(rect(2, 9, 17, 9), rect(2, 18, 17, 18)), c: P.frameD },
      { s: or(rect(7, 4, 12, 5), rect(7, 13, 12, 14), rect(7, 22, 12, 23)), c: P.white, o: 1 }, { s: or(rect(4, 3, 5, 3), rect(4, 12, 5, 12)), c: P.red }
    ]),
    phone: () => sprite('phone', 18, 20, () => [
      { s: rrect(2, 2, 15, 17, 2), c: P.frame, o: 1 }, { s: rrect(4, 4, 7, 15, 1), c: P.navy, o: 1 },
      { s: rect(9, 4, 13, 7), c: P.screen }, { s: px([[10, 5], [12, 5]]), c: P.glow },
      { s: px([[9, 9], [11, 9], [13, 9], [9, 11], [11, 11], [13, 11], [9, 13], [11, 13], [13, 13]]), c: P.frameD },
      { s: ell(14.5, 2.5, 1.6, 1.6), c: P.red, o: 1 }
    ]),
    door: (open = false) => sprite('door' + (open ? 'o' : ''), 30, 40, () => [
      { s: rect(0, 0, 29, 39), c: '#cfdce8', o: 1 }, { s: rect(2, 3, 27, 39), c: open ? '#fff8d6' : '#eaf3fa' },
      ...(open ? [{ s: rect(2, 3, 4, 39), c: '#b9e8f0', o: 1 }, { s: rect(25, 3, 27, 39), c: '#b9e8f0', o: 1 }] : [
        { s: rect(2, 3, 14, 39), c: '#b9e8f0', o: 1 }, { s: rect(15, 3, 27, 39), c: '#b9e8f0', o: 1 },
        { s: or(rect(5, 6, 6, 34), rect(18, 6, 19, 34)), c: '#e3f8fc' }]),
      { s: rect(4, 0, 25, 2), c: P.navy, o: 1 }, { s: px([[8, 1], [9, 1], [10, 1], [11, 1], [12, 1], [13, 1]]), c: open ? P.glow : P.red }
    ]),
    keypad: () => sprite('keypad', 10, 14, () => [
      { s: rrect(0, 0, 9, 13, 1), c: P.navy, o: 1 }, { s: rect(2, 2, 7, 4), c: P.cyan },
      { s: px([[2, 7], [4, 7], [6, 7], [2, 9], [4, 9], [6, 9], [4, 11]]), c: P.frame }
    ]),
    plant: () => sprite('plant', 16, 22, () => [
      { s: or(ell(8, 7, 5, 5.5), ell(4, 10, 3.5, 3.5), ell(12, 10, 3.5, 3.5)), c: P.green, o: 1 },
      { s: px([[6, 5], [9, 7], [4, 10], [12, 9], [8, 11]]), c: P.greenD }, { s: poly([[3, 13], [13, 13], [12, 21], [4, 21]]), c: P.white, o: 1 },
      { s: rect(4, 15, 12, 15), c: P.cyan }
    ]),
    poster: () => sprite('poster', 20, 24, () => [
      { s: rect(1, 1, 18, 22), c: P.white, o: 1 }, { s: rect(3, 3, 16, 7), c: P.teal },
      { s: or(rect(3, 10, 14, 10), rect(3, 13, 16, 13), rect(3, 16, 11, 16), rect(3, 19, 13, 19)), c: P.frameD }, { s: ell(9.5, 5, 2, 1.5), c: P.white }
    ]),
    board: () => sprite('board', 34, 22, () => [
      { s: rect(1, 1, 32, 18), c: P.white, o: 1 }, { s: rect(1, 19, 32, 20), c: P.frameD, o: 1 },
      { s: or(rect(4, 4, 15, 4), rect(4, 7, 20, 7), rect(4, 10, 12, 10)), c: P.blueD }, { s: or(rect(4, 13, 18, 13), rect(22, 5, 29, 5)), c: P.red },
      { s: or(rect(22, 9, 29, 15)), c: '#fff2a8', o: 1 }
    ]),
    clock: () => sprite('clock', 14, 14, () => [
      { s: ell(7, 7, 6, 6), c: P.white, o: 1 }, { s: or(rect(7, 3, 7, 7), rect(7, 7, 10, 7)), c: P.navy }
    ]),
    item: (kind) => sprite('item_' + kind, 12, 12, () => ({
      key: [{ s: ell(3.5, 6, 2.5, 2.5), c: P.yellow, o: 1 }, { s: ell(3.5, 6, 1, 1), c: '#fff7d6' }, { s: rect(6, 5, 11, 6), c: P.yellow, o: 1 }, { s: or(rect(9, 7, 9, 8), rect(11, 7, 11, 8)), c: P.yellow, o: 1 }],
      card: [{ s: rrect(1, 3, 10, 9, 1), c: P.cyan, o: 1 }, { s: rect(2, 5, 9, 5), c: P.navy }, { s: rect(6, 7, 8, 7), c: P.white }],
      note: [{ s: rect(2, 1, 9, 10), c: '#fff2a8', o: 1 }, { s: or(rect(3, 3, 8, 3), rect(3, 5, 8, 5), rect(3, 7, 6, 7)), c: P.woodD }],
      strip: [{ s: rect(0, 3, 11, 8), c: P.paper, o: 1 }, { s: px([[1, 6], [2, 6], [3, 4], [4, 7], [5, 6], [6, 6], [7, 6], [8, 4], [9, 7], [10, 6]]), c: P.red }],
      chip: [{ s: rect(2, 2, 9, 9), c: P.navy, o: 1 }, { s: rect(4, 4, 7, 7), c: P.glow }]
    })[kind] || [{ s: ell(6, 6, 4, 4), c: P.cyan, o: 1 }])
  };
  return { CHARACTERS, character, OBJ, img, sprite, render };
})();
