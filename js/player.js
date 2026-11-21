/* =========================================================
 * 교육생(스마트폰) 화면 — 방탈출 진행
 *  사물 조사 → 심전도 미션 → 아이템 획득(다음 사물 열림) → 출입문 다이얼 자물쇠 → 다음 방
 *  본인 팀 데이터와 세션 상태만 구독 → 다른 팀 점수·정답은 볼 수 없음
 * ========================================================= */
const Player = (() => {
  const P = Sync.paths;
  const S = { code: null, teamId: null, meta: null, content: null, team: null, lastKey: '', tick: null, unsubs: [], wasOver: false, newItem: null, busy: false };
  const st = () => (Sync.mode === 'demo' ? sessionStorage : localStorage);   // DEMO: 탭마다 다른 팀
  const app = () => U.$('#app');
  const save = () => Sync.set(P.team(S.code, S.teamId), S.team);
  const chImg = (mood = 'normal', scale = 4, cls = '') => Pix.img(Pix.character(S.team ? S.team.character : 'doctor', mood), scale, cls, '내 캐릭터');

  /* ---------- 입장 ---------- */
  async function start() {
    let saved = null; try { saved = JSON.parse(st().getItem('ecg_player') || 'null'); } catch (e) {}
    const urlCode = U.params.get('s');
    if (saved && saved.code && saved.teamId && (!urlCode || urlCode === saved.code)) {
      const t = await Sync.get(P.team(saved.code, saved.teamId)).catch(() => null);
      if (t) { S.code = saved.code; S.teamId = saved.teamId; return enter(); }
    }
    renderJoin(urlCode || '');
  }

  function renderJoin(code) {
    document.body.className = 'player';
    let pick = 'doctor';
    app().innerHTML = `
      <section class="screen join">
        <div class="join-brand"><h1 class="title sm">ECG <span>Re:Start</span></h1><p class="subtitle">THE ECG ESCAPE ROOM</p></div>
        <form class="glass form" id="joinForm" autocomplete="off">
          <div class="g2j">
            <label class="field">세션 코드<input id="jCode" inputmode="numeric" maxlength="6" required placeholder="4자리 코드" value="${U.esc(code)}"></label>
            <label class="field">팀명<input id="jName" maxlength="16" required placeholder="예: 3조 리듬헌터"></label>
          </div>
          <div class="field-label">캐릭터 선택</div>
          <div class="char-grid">${Pix.CHARACTERS.map(c => `
            <button type="button" class="char-card ${c.id === pick ? 'on' : ''}" data-ch="${c.id}">
              ${Pix.img(Pix.character(c.id), 3)}<b>${U.esc(c.name)}</b><small>${U.esc(c.desc)}</small></button>`).join('')}</div>
          <button class="btn primary lg block" type="submit">입장하기 ▶</button>
        </form>
        ${Sync.mode === 'demo' ? '<p class="mode-note"><b>DEMO MODE</b> · 같은 브라우저에서 열린 강사 화면과만 연결됩니다.</p>' : ''}
      </section>`;
    U.$$('[data-ch]').forEach(b => b.onclick = () => {
      pick = b.dataset.ch; Sfx.click();
      U.$$('[data-ch]').forEach(x => x.classList.toggle('on', x === b));
      U.$$('[data-ch] img').forEach(i => i.classList.remove('bounce')); b.querySelector('img').classList.add('bounce');
    });
    U.$('#joinForm').onsubmit = async e => {
      e.preventDefault();
      const code = U.$('#jCode').value.trim(), name = U.$('#jName').value.trim();
      if (!code || !name) return;
      const btn = U.$('#joinForm button[type=submit]'); btn.disabled = true;
      try {
        const meta = await Sync.get(P.meta(code));
        if (!meta) { U.toast('세션을 찾을 수 없습니다. 코드를 확인하세요.', 'err'); btn.disabled = false; return; }
        if (meta.status === 'ended') { U.toast('이미 종료된 세션입니다.', 'err'); btn.disabled = false; return; }
        const id = await Sync.push(P.teams(code), Engine.newTeam(name, Sync.uid(), pick));
        S.code = code; S.teamId = id;
        st().setItem('ecg_player', JSON.stringify({ code, teamId: id }));
        Sfx.ok(); enter();
      } catch (err) { console.error(err); U.toast('입장 실패: ' + (err.message || err), 'err'); btn.disabled = false; }
    };
  }

  async function enter() {
    S.unsubs.forEach(f => f()); S.unsubs = [];
    S.unsubs.push(Sync.watch(P.content(S.code), c => { if (c) { S.content = Engine.normalizeContent(c); S.lastKey = ''; render(); } }));
    S.unsubs.push(Sync.watch(P.meta(S.code), m => { S.meta = m; render(); }));
    S.unsubs.push(Sync.watch(P.team(S.code, S.teamId), t => {
      if (!t) { leave(); U.toast('팀 정보가 삭제되었습니다.', 'err'); return; }
      S.team = Engine.normalizeTeam(t); render();
    }));
    clearInterval(S.tick); S.tick = setInterval(tickHud, 500);
  }
  function leave() {
    S.unsubs.forEach(f => f()); S.unsubs = []; clearInterval(S.tick);
    st().removeItem('ecg_player'); S.lastKey = ''; S.team = null; S.meta = null;
    U.$('#pauseOverlay').hidden = true; renderJoin('');
  }

  /* ---------- 화면 결정 ---------- */
  function view() {
    const m = S.meta, t = S.team;
    if (!m || !t || !S.content) return 'loading';
    if (t.stage === 'done') return 'done';
    if (m.status === 'ended' || (m.status === 'running' && Engine.remaining(m) <= 0)) return 'timeover';
    if (m.status === 'lobby') return 'lobby';
    if (t.stage === 'question' || t.stage === 'lock') return 'scene';
    return t.stage;
  }
  function render() {
    if (S.busy) return;
    const v = view();
    const k = [v, S.team && S.team.roomIndex, S.team && S.team.qIndex, S.team && S.team.stage].join('|');
    if (k === S.lastKey) { tickHud(); return; }
    S.lastKey = k;
    const views = { loading, lobby, start: startScreen, 'room-intro': roomIntro, scene, done, timeover };
    const showHud = ['scene', 'room-intro', 'done', 'timeover'].includes(v);
    app().innerHTML = (showHud ? hudHtml() : '') + (views[v] || loading)();
    document.body.dataset.view = v;
    bind(v); tickHud(); window.scrollTo(0, 0);
  }
  function hudHtml() {
    const { room } = Engine.current(S.team, S.content);
    return `<header class="hud">
      <div class="hud-me">${chImg('normal', 1, 'hud-ava')}<span>${U.esc(S.team.name)}</span></div>
      <div class="hud-room">${room && S.team.stage !== 'done' ? U.esc(room.code) : ''}</div>
      <div class="hud-score"><small>SCORE</small><b id="hudScore">${S.team.score}</b></div>
      <div class="hud-timer" id="hudTimer">--:--</div>
      <button class="hud-sfx" id="sfxBtn" title="효과음">${Sfx.on ? '♪' : '×'}</button>
    </header>`;
  }
  function tickHud() {
    if (!S.meta || !S.team) return;
    const rem = Engine.remaining(S.meta);
    const tEl = U.$('#hudTimer');
    if (tEl) { tEl.textContent = U.fmtTime(rem); tEl.classList.toggle('alert', rem <= 60 && S.meta.status !== 'lobby'); }
    document.body.classList.toggle('red-alert', rem <= 60 && S.meta.status === 'running' && view() === 'scene');
    const sEl = U.$('#hudScore'); if (sEl) sEl.textContent = S.team.score;
    U.$('#pauseOverlay').hidden = S.meta.status !== 'paused' || S.team.stage === 'done';
    const over = S.meta.status === 'running' && rem <= 0;
    if (over !== S.wasOver) { S.wasOver = over; render(); }
  }

  /* ---------- 일반 화면 ---------- */
  const loading = () => `<section class="screen center"><p class="muted">세션에 연결 중…</p></section>`;
  const lobby = () => `<section class="screen center lobby">
      <div class="stage-ava">${chImg('normal', 5, 'bob')}</div>
      <h2 class="pxf">${U.esc(S.team.name)} 입장 완료!</h2>
      <p class="muted">강사가 게임을 시작하면 미션이 열립니다.</p>
      <div class="chip-line">SESSION ${U.esc(S.code)}</div>
      <button class="btn ghost sm" data-act="leave">팀 나가기</button>
    </section>`;
  const startScreen = () => `<section class="screen center start city-bg">
      <div class="title-block">
        <div class="hero-ava">${chImg('normal', 4, 'bob')}</div>
        <h1 class="title">ECG <span>Re:Start</span></h1>
        <p class="subtitle">THE ECG ESCAPE ROOM</p>
        <div class="mission-tag"><i></i>MISSION · SAVE THE PATIENT</div>
      </div>
      <div class="story-box glass"><div class="label">STORY</div><p id="story" class="story-text"></p></div>
      <button class="btn primary xl" data-act="startMission">START MISSION</button>
    </section>`;
  function roomIntro() {
    const r = Engine.current(S.team, S.content).room;
    return `<section class="screen center room-intro">
      <div class="room-code">${U.esc(r.code)}</div>
      <h1 class="room-title">${U.esc(r.title)}</h1>
      <p class="room-place">📍 ${U.esc(r.place || (Scenes[r.scene] || {}).name || '')}</p>
      <div class="intro-door">${Pix.img(Pix.OBJ.door(false), 3, 'door-img')}<div class="intro-ava">${chImg('normal', 3, 'bob')}</div></div>
      <div class="story-box glass"><p id="story" class="story-text"></p>
        <div class="topics">${r.topics.map(t => `<span>${U.esc(t)}</span>`).join('')}</div></div>
      <button class="btn primary lg" data-act="enterRoom">문 열고 들어가기 ▶</button>
    </section>`;
  }

  /* ---------- 방 장면 ---------- */
  function objState(room, key) {
    const qi = room.questions.findIndex(q => q.object === key);
    if (qi >= 0) {
      const q = room.questions[qi], a = S.team.answers[q.id];
      if (a && a.correct) return { kind: 'solved', qi, q };
      if (qi === S.team.qIndex && S.team.stage === 'question') return { kind: 'open', qi, q };
      return { kind: 'locked', qi, q };
    }
    const prop = (room.props || []).find(p => p.object === key);
    return prop ? { kind: 'prop', prop } : { kind: 'deco' };
  }
  function items(room) {
    return room.questions.filter(q => S.team.answers[q.id] && S.team.answers[q.id].correct).map(q => q);
  }
  function scene() {
    const { room } = Engine.current(S.team, S.content);
    const sc = Scenes[room.scene] || Scenes.monitoring;
    const solved = items(room).length, total = room.questions.length;
    const ready = S.team.stage === 'lock';
    const objs = Object.entries(sc.slots).map(([key, sl]) => {
      const s = objState(room, key);
      const sp = Pix.OBJ[sl.sprite]();
      return `<button class="obj st-${s.kind}" data-obj="${key}" style="left:${sl.x}%;bottom:${sl.y}%;width:${sl.w}%;z-index:${100 - Math.round(sl.y)}" aria-label="${U.esc(sl.label)}">
        <img class="px" src="${sp.url}" alt="" draggable="false">
        ${s.kind === 'open' ? '<span class="obj-badge">!</span>' : s.kind === 'solved' ? '<span class="obj-badge ok">✓</span>' : ''}
        <span class="obj-label">${U.esc(sl.label)}</span></button>`;
    }).join('');
    const d = sc.door;
    return `<section class="scene-wrap">
      <div class="scene-head"><span class="room-chip">${U.esc(room.code)}</span><b>${U.esc(room.place || sc.name)}</b><span class="spacer"></span>
        <span class="clue-count">단서 <b>${solved}</b>/${total}</span></div>
      <div class="scene ${sc.wall}" id="scene">
        <div class="window"><div class="sky"></div><div class="city"></div><div class="glare"></div></div>
        <div class="floor"></div>
        ${objs}
        <button class="obj door ${ready ? 'ready' : ''}" data-door style="left:${d.x}%;bottom:${d.y}%;width:${d.w}%;z-index:60" aria-label="출입문">
          <img class="px" id="doorImg" src="${Pix.OBJ.door(false).url}" alt="" draggable="false">
          <img class="px keypad" src="${Pix.OBJ.keypad().url}" alt="" draggable="false">
          <span class="obj-badge ${ready ? 'go' : 'lock'}">${ready ? '!' : '🔒'}</span>
          <span class="obj-label">${U.esc(d.label || '출입문')}</span></button>
        <div class="avatar" id="avatar" style="left:${sc.start || 60}%">${chImg('normal', 1, 'ava-img')}</div>
      </div>
      <div class="dialog glass" id="dlg"><div class="dlg-face" id="dlgFace">${chImg('normal', 2)}</div><p id="dlgText">${ready ? '모든 단서를 모았다! 출입문 다이얼 자물쇠를 열어 보자.' : solved === 0 ? '방을 둘러보자. 반짝이는 <b>!</b> 표시가 있는 물건부터 조사해 볼까?' : '좋아, 다음 <b>!</b> 표시가 있는 물건을 조사해 보자.'}</p></div>
      <div class="inventory glass"><div class="label">INVENTORY</div><div class="inv-items">${
        items(room).map(q => `<div class="inv ${S.newItem === q.id ? 'new' : ''}" title="${U.esc(q.item ? q.item.name : '')}">${Pix.img(Pix.OBJ.item((q.item || {}).icon || 'note'), 3)}<small>${U.esc(q.item ? q.item.name : '단서')}</small>${q.codePiece ? `<span class="inv-piece">${U.esc(q.codePiece)}</span>` : ''}</div>`).join('')
        + Array.from({ length: Math.max(0, total - solved) }, () => '<div class="inv empty"></div>').join('')}</div></div>
    </section>`;
  }
  function say(html, mood = 'normal') {
    const t = U.$('#dlgText'); if (!t) return;
    t.innerHTML = html; U.$('#dlgFace').innerHTML = chImg(mood, 2);
    const d = U.$('#dlg'); d.classList.remove('pop'); void d.offsetWidth; d.classList.add('pop');
  }
  function walkTo(el) {
    const av = U.$('#avatar'), sc = U.$('#scene'); if (!av || !el) return;
    const r = el.getBoundingClientRect(), s = sc.getBoundingClientRect();
    const x = ((r.left + r.width / 2) - s.left) / s.width * 100;
    av.classList.toggle('flip', x < parseFloat(av.style.left));
    av.style.left = Math.max(2, Math.min(86, x - 6)) + '%';
    av.classList.add('walk'); clearTimeout(walkTo.t); walkTo.t = setTimeout(() => av.classList.remove('walk'), 450);
  }

  /* ---------- 문제(사물 조사) 시트 ---------- */
  function caseCard(ci, title = 'PATIENT CASE') {
    if (!ci) return '';
    return `<div class="case-card"><div class="label">${title}</div>
      ${ci.summary ? `<p class="case-sum">${U.esc(ci.summary)}</p>` : ''}
      ${ci.vitals ? `<div class="vitals">${U.esc(ci.vitals).split('·').map(v => `<span>${v.trim()}</span>`).join('')}</div>` : ''}
      ${ci.mental ? `<p class="case-line"><b>의식/상태</b> ${U.esc(ci.mental)}</p>` : ''}
      ${ci.ecg ? `<p class="case-line"><b>ECG</b> ${U.esc(ci.ecg)}</p>` : ''}</div>`;
  }
  function ecgFigure(q) {
    if (q.image) return `<figure class="ecg-fig"><img src="${U.esc(q.image)}" alt="ECG" data-zoom>${q.imageCaption || q.imageSource ? `<figcaption>${U.esc(q.imageCaption || '')}${q.imageSource ? ` · 출처: ${U.esc(q.imageSource)}` : ''}</figcaption>` : ''}<span class="zoom-hint">탭하여 확대</span></figure>`;
    return `<figure class="ecg-fig empty"><div class="ph"><b>ECG 이미지 미등록</b><span>아래 판독 소견으로 미션을 해결하세요</span></div></figure>`;
  }
  function openSheet(html, cls = '') {
    closeSheet();
    const bg = document.createElement('div'); bg.className = 'sheet-bg'; bg.id = 'sheet';
    bg.innerHTML = `<div class="sheet ${cls}">${html}</div>`;
    document.body.appendChild(bg); document.body.classList.add('noscroll');
    U.$$('[data-close]', bg).forEach(b => b.onclick = () => { Sfx.click(); closeSheet(); });
    return bg;
  }
  function closeSheet() { const s = U.$('#sheet'); if (s) s.remove(); document.body.classList.remove('noscroll'); }

  function questionSheet(room, q, label, review = false) {
    const a = S.team.answers[q.id] || { wrong: [] };
    const d = Math.min(3, Math.max(1, q.difficulty)), pct = Math.round(Engine.scoring().hintRate * 100);
    const qi = room.questions.indexOf(q);
    const sl = (Scenes[room.scene] || Scenes.monitoring).slots[q.object];
    const html = `<div class="sheet-head">
        ${sl ? Pix.img(Pix.OBJ[sl.sprite](), 2, 'sheet-obj') : ''}
        <div class="sheet-title"><div class="label">조사 · ${U.esc(label)}</div><h2>${U.esc(q.title)}</h2>
        <div class="q-meta"><span>MISSION ${qi + 1}/${room.questions.length}</span><span class="stars">${'★'.repeat(d)}${'☆'.repeat(3 - d)}</span><span class="pts">${q.points}점</span></div></div>
        <button class="sheet-x" data-close aria-label="닫기">✕</button></div>
      <div class="sheet-body">
        ${caseCard(room.caseInfo)}${ecgFigure(q)}${caseCard(q.patient, 'PATIENT')}
        <p class="q-stem">${U.nl(q.stem)}</p>
        <div class="options">${q.options.map((o, i) => {
          const wrong = a.wrong.includes(i), right = a.correct && i === q.answer;
          return `<button class="opt ${wrong ? 'is-wrong' : ''} ${right ? 'is-correct' : ''}" data-opt="${i}" ${a.correct || wrong ? 'disabled' : ''}><span class="opt-key">${'ABCDEFGH'[i]}</span><span class="opt-text">${U.esc(o.text)}</span></button>`;
        }).join('')}</div>
        <div class="q-tools" id="qTools">${hintHtml(q, a, pct)}</div>
        <div id="feedback">${a.correct ? correctCard(q, a, review) : ''}</div>
      </div>`;
    const bg = openSheet(html);
    bindQuestion(bg, room, q);
  }
  function hintHtml(q, a, pct) {
    if (!q.hint) return '';
    if (a.hint) return `<div class="hint-box"><span class="label">HINT</span>${U.esc(q.hint)}</div>`;
    if (a.correct) return '';
    return `<button class="btn ghost sm" data-act="hint">💡 힌트 보기 <small>(이 미션 −${pct}%)</small></button>`;
  }
  function correctCard(q, a, review) {
    const it = q.item || { name: '단서', icon: 'note' };
    return `<div class="fb ok">
      <div class="fb-head"><span>CORRECT!</span><b>+${a.points}</b></div>
      <div class="fb-exp">${U.nl(q.explanation)}</div>
      ${q.reference ? `<div class="ref">참고: ${U.esc(q.reference)}</div>` : ''}
    </div>
    <div class="item-get ${review ? 'reviewed' : ''}">
      <div class="item-ic">${Pix.img(Pix.OBJ.item(it.icon), 5)}</div>
      <div><div class="label">${review ? '획득한 아이템' : 'ITEM GET!'}</div><b>${U.esc(it.name)}</b>
      ${q.codePiece ? `<div class="piece-line">암호 조각 <span class="piece">${U.esc(q.codePiece)}</span></div>` : ''}</div>
    </div>
    <button class="btn primary lg block" ${review ? 'data-close' : 'data-act="takeItem"'}>${review ? '닫기' : '가방에 넣기 ▶'}</button>`;
  }
  function wrongCard(res) {
    return `<div class="fb bad ${res.danger ? 'danger' : ''}">
      <div class="fb-head"><span>${res.danger ? '⚠ 위험한 선택' : '오답'}</span>${res.danger ? `<b>${res.points}</b>` : ''}</div>
      <p>${U.esc(res.opt.feedback || '다시 판단해 보세요.')}</p>
      ${res.danger ? '<p class="danger-note">이 선택은 실제 환자에게 위해를 줄 수 있습니다.</p>' : ''}
      <p class="muted small">다른 선택지를 골라 다시 도전하세요.</p></div>`;
  }
  function bindQuestion(bg, room, q) {
    const pct = Math.round(Engine.scoring().hintRate * 100);
    U.$$('.opt', bg).forEach(btn => btn.onclick = () => {
      const i = Number(btn.dataset.opt);
      const res = Engine.pick(S.team, S.content, i); if (!res) return;
      save();
      const fb = U.$('#feedback', bg);
      if (res.correct) {
        U.$$('.opt', bg).forEach(b => b.disabled = true);
        btn.classList.add('is-correct', 'pop');
        fb.innerHTML = correctCard(q, S.team.answers[q.id]);
        U.$('#qTools', bg).innerHTML = '';
        U.$('[data-act="takeItem"]', bg).onclick = takeItem;
        Sfx.ok(); setTimeout(() => Sfx.item(), 420);
        say(`해냈다! <b>${U.esc((q.item || {}).name || '단서')}</b>를 찾았다.`, 'happy');
        if (navigator.vibrate) navigator.vibrate(40);
      } else {
        btn.classList.add('is-wrong', 'shake'); btn.disabled = true;
        fb.innerHTML = wrongCard(res);
        Sfx.bad(); say(res.danger ? '앗… 환자에게 위험한 선택이었어!' : '음… 다시 생각해 보자.', 'oops');
        if (navigator.vibrate) navigator.vibrate([60, 40, 60]);
      }
      setTimeout(() => fb.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60);
    });
    const h = U.$('[data-act="hint"]', bg);
    if (h) h.onclick = () => { Engine.hint(S.team, S.content); save(); Sfx.click(); U.$('#qTools', bg).innerHTML = hintHtml(q, S.team.answers[q.id], pct); };
    U.$$('[data-zoom]', bg).forEach(img => img.onclick = () => zoom(img.src));
  }
  function takeItem() {
    const { q } = Engine.current(S.team, S.content);
    S.newItem = q.id; closeSheet(); Sfx.item();
    Engine.afterCorrect(S.team, S.content); save();
    if (S.team.stage === 'lock') setTimeout(() => { say('딸깍! 출입문 잠금장치가 반응한다. 다이얼 자물쇠를 열어 보자!', 'happy'); Sfx.beep && Sfx.dial(); }, 200);
  }

  /* ---------- 다이얼 자물쇠 ---------- */
  function lockSheet(room) {
    const pw = String(room.password || '').replace(/\s+/g, '').toUpperCase().split('');
    const pieces = room.questions.map(q => String(q.codePiece || '').toUpperCase()).filter(Boolean);
    const isNum = pw.every(c => /\d/.test(c));
    const pool = isNum ? '0123456789'.split('') : 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
    const set = new Set([...pieces.join('').split(''), ...pw]);
    U.seededShuffle(pool.filter(c => !set.has(c)), room.id).slice(0, 3).forEach(c => set.add(c));
    const letters = [...set].sort();
    const pos = pw.map((_, i) => U.hash(room.id + i + S.teamId) % letters.length);
    const shown = U.seededShuffle(pieces, S.teamId + room.id);
    const html = `<div class="sheet-head"><div class="sheet-title"><div class="label">EXIT LOCK · ${U.esc(room.code)}</div><h2>다이얼 자물쇠</h2></div><button class="sheet-x" data-close aria-label="닫기">✕</button></div>
      <div class="sheet-body lock-body">
        <p class="clue">${U.esc(room.lockClue || '모은 암호 조각을 올바른 순서로 맞추세요.')}</p>
        <div class="pieces">${shown.map(p => `<span class="piece big">${U.esc(p)}</span>`).join('')}</div>
        <div class="padlock" id="padlock">
          <div class="shackle"></div>
          <div class="lock-body-box"><div class="wheels">${pw.map((_, i) => `
            <div class="wheel" data-w="${i}"><button class="w-up" data-up="${i}" aria-label="위로">▲</button>
              <div class="w-win"><span class="w-prev">${letters[(pos[i] - 1 + letters.length) % letters.length]}</span><b class="w-cur">${letters[pos[i]]}</b><span class="w-next">${letters[(pos[i] + 1) % letters.length]}</span></div>
              <button class="w-dn" data-dn="${i}" aria-label="아래로">▼</button></div>`).join('')}</div></div>
        </div>
        <button class="btn primary lg block" id="tryLock">OPEN 🔓</button>
        <p class="muted small center-t">위·아래 화살표로 다이얼을 돌리세요 · 틀리면 −${Engine.scoring().passwordPenalty}점</p>
      </div>`;
    const bg = openSheet(html, 'lock-sheet');
    const draw = i => {
      const w = U.$(`[data-w="${i}"]`, bg), L = letters.length;
      w.querySelector('.w-prev').textContent = letters[(pos[i] - 1 + L) % L];
      w.querySelector('.w-cur').textContent = letters[pos[i]];
      w.querySelector('.w-next').textContent = letters[(pos[i] + 1) % L];
      const win = w.querySelector('.w-win'); win.classList.remove('spin'); void win.offsetWidth; win.classList.add('spin');
    };
    U.$$('[data-up]', bg).forEach(b => b.onclick = () => { const i = +b.dataset.up; pos[i] = (pos[i] - 1 + letters.length) % letters.length; draw(i); Sfx.dial(); });
    U.$$('[data-dn]', bg).forEach(b => b.onclick = () => { const i = +b.dataset.dn; pos[i] = (pos[i] + 1) % letters.length; draw(i); Sfx.dial(); });
    let busy = false;
    U.$('#tryLock', bg).onclick = () => {
      if (busy) return;
      const guess = pos.map(p => letters[p]).join('');
      if (Engine.checkPassword(room, guess)) {
        busy = true; S.busy = true;
        U.$('#padlock', bg).classList.add('open'); Sfx.unlock();
        if (navigator.vibrate) navigator.vibrate([30, 30, 80]);
        setTimeout(() => { closeSheet(); exitRoom(); }, 900);
      } else {
        Engine.failPassword(S.team); save(); Sfx.bad();
        const p = U.$('#padlock', bg); p.classList.remove('shake'); void p.offsetWidth; p.classList.add('shake');
        U.toast('철컥… 열리지 않는다', 'err');
      }
    };
  }
  function exitRoom() {
    const door = U.$('[data-door]'), av = U.$('#avatar');
    U.$('#doorImg').src = Pix.OBJ.door(true).url; door.classList.add('opened');
    say('문이 열렸다! 다음 구역으로 이동하자!', 'happy');
    walkTo(door);
    setTimeout(() => { av && av.classList.add('enter'); U.$('#scene').classList.add('flash'); }, 650);
    setTimeout(() => { S.busy = false; Engine.unlock(S.team, S.content, S.meta); S.lastKey = ''; save(); render(); if (S.team.stage === 'done') Sfx.win(); }, 1500);
  }

  /* ---------- 결과 화면 ---------- */
  function breakdown() {
    const t = S.team, c = S.content, Sc = Engine.scoring();
    const all = Engine.allQuestions(c);
    const qPts = all.reduce((s, x) => s + ((t.answers[x.q.id] || {}).points || 0), 0);
    return `<div class="glass breakdown">
      <div class="bd-row"><span>미션 점수</span><b>${qPts}</b></div>
      <div class="bd-row"><span>시간 보너스</span><b>+${t.timeBonus}</b></div>
      <div class="bd-row neg"><span>위험 판단 ${t.danger}회</span><b>−${t.danger * Sc.dangerPenalty}</b></div>
      <div class="bd-row neg"><span>자물쇠 오입력 ${t.lockFails}회</span><b>−${t.lockFails * Sc.passwordPenalty}</b></div>
      <div class="bd-row"><span>힌트 사용</span><b>${t.hintsUsed}회</b></div>
      <div class="bd-row"><span>1차 시도 정답</span><b>${Engine.firstTryCount(t, c)} / ${all.length}</b></div>
      <div class="bd-total"><span>FINAL SCORE</span><b>${t.score}</b></div></div>`;
  }
  const done = () => `<section class="screen center done city-bg">
      <div class="confetti">${Array.from({ length: 24 }, (_, i) => `<i style="left:${(i * 37) % 100}%;animation-delay:${(i % 8) * .25}s;background:${['#3fd6e8', '#ffcf3f', '#ff9fb4', '#62c46a', '#f7931e'][i % 5]}"></i>`).join('')}</div>
      <div class="mission-tag ok"><i></i>PATIENT SAVED</div>
      <div class="stage-ava">${chImg('happy', 5, 'jump')}</div>
      <h1 class="title sm">MISSION<br>COMPLETE!</h1>
      <div class="story-box glass"><p id="story" class="story-text"></p></div>
      ${breakdown()}
      <p class="muted small">전체 순위는 강사 화면에서 공개됩니다.</p>
    </section>`;
  const timeover = () => `<section class="screen center done">
      <div class="mission-tag bad"><i></i>TIME OVER</div>
      <div class="stage-ava">${chImg('oops', 5)}</div>
      <h1 class="title sm">게임 종료</h1>
      <p class="muted">${U.esc(S.team.name)} · ${Engine.solved(S.team, S.content)} / ${Engine.allQuestions(S.content).length} 미션 해결</p>
      ${breakdown()}
      <p class="muted small">전체 순위는 강사 화면에서 공개됩니다.</p>
    </section>`;

  /* ---------- 이벤트 ---------- */
  function bind(v) {
    const on = (act, fn) => U.$$(`[data-act="${act}"]`).forEach(b => b.onclick = fn);
    const sb = U.$('#sfxBtn'); if (sb) sb.onclick = () => { sb.textContent = Sfx.toggle() ? '♪' : '×'; };
    on('leave', () => { if (confirm('팀에서 나가시겠습니까? 진행 기록은 강사 화면에 남습니다.')) leave(); });
    on('startMission', () => { Sfx.ok(); S.team.stage = 'room-intro'; save(); });
    on('enterRoom', () => { Sfx.unlock(); S.team.stage = 'question'; save(); });
    if (v === 'start') U.typewrite(U.$('#story'), S.content.story || '응급실의 잠긴 방들을 탈출해 환자를 구하라!');
    if (v === 'room-intro') U.typewrite(U.$('#story'), Engine.current(S.team, S.content).room.story || Engine.current(S.team, S.content).room.objective || '');
    if (v === 'done') { U.typewrite(U.$('#story'), S.content.ending || '환자를 구했다!'); }
    if (v === 'scene') bindScene();
  }
  function bindScene() {
    const { room } = Engine.current(S.team, S.content);
    const sc = Scenes[room.scene] || Scenes.monitoring;
    setTimeout(() => { S.newItem = null; }, 1500);
    U.$$('[data-obj]').forEach(b => b.onclick = () => {
      if (S.busy) return;
      const key = b.dataset.obj, sl = sc.slots[key], s = objState(room, key);
      walkTo(b);
      if (s.kind === 'open') { Sfx.click(); say(`${U.esc(sl.label)}${U.josa(sl.label, '을', '를').slice(sl.label.length)} 조사한다…`); setTimeout(() => questionSheet(room, s.q, sl.label), 320); }
      else if (s.kind === 'solved') { Sfx.click(); setTimeout(() => questionSheet(room, s.q, sl.label, true), 250); }
      else if (s.kind === 'locked') {
        Sfx.deny(); b.classList.remove('shake'); void b.offsetWidth; b.classList.add('shake');
        const prev = room.questions[s.qi - 1];
        const need = prev && prev.item ? prev.item.name : '다른 단서';
        say(`잠겨 있다… <b>${U.esc(need)}</b>${U.josa(need, '이', '가').slice(need.length)} 필요해 보인다.`, 'oops');
      }
      else if (s.kind === 'prop') { Sfx.click(); say(U.esc(s.prop.text)); }
      else { Sfx.click(); say(`${U.esc(sl.label)}. 특별한 것은 없어 보인다.`); }
    });
    const door = U.$('[data-door]');
    door.onclick = () => {
      if (S.busy) return;
      walkTo(door);
      if (S.team.stage === 'lock') { Sfx.click(); setTimeout(() => lockSheet(room), 300); }
      else {
        Sfx.deny(); door.classList.remove('shake'); void door.offsetWidth; door.classList.add('shake');
        const left = room.questions.length - items(room).length;
        say(`출입문이 굳게 잠겨 있다. 다이얼 자물쇠를 열려면 단서가 <b>${left}개</b> 더 필요하다.`, 'oops');
      }
    };
  }
  function zoom(src) {
    const ov = document.createElement('div'); ov.className = 'zoom-ov';
    ov.innerHTML = `<img src="${U.esc(src)}" alt="ECG 확대"><button class="btn ghost sm">닫기</button>`;
    ov.onclick = () => ov.remove(); document.body.appendChild(ov);
  }
  return { start };
})();
