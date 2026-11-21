/* =========================================================
 * 교육생(스마트폰) 화면
 * - 본인 팀 데이터와 세션 상태만 구독 → 다른 팀 점수·정답은 볼 수 없음
 * ========================================================= */
const Player = (() => {
  const P = Sync.paths;
  const S = { code: null, teamId: null, meta: null, content: null, team: null, lastKey: '', tick: null, unsubs: [], wasOver: false };
  const st = () => (Sync.mode === 'demo' ? sessionStorage : localStorage);   // DEMO: 탭마다 다른 팀
  const app = () => U.$('#app');
  const save = () => Sync.set(P.team(S.code, S.teamId), S.team);

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
    app().innerHTML = `
      <section class="screen center join">
        <div class="join-brand">${U.ecgLine('sweep')}<h1 class="title sm">ECG <span>Re:Start</span></h1><p class="subtitle">THE ECG ESCAPE ROOM</p></div>
        <form class="card form" id="joinForm" autocomplete="off">
          <label class="field">세션 코드<input id="jCode" inputmode="numeric" maxlength="6" required placeholder="강사 화면의 4자리 코드" value="${U.esc(code)}"></label>
          <label class="field">팀명<input id="jName" maxlength="16" required placeholder="예: 3조 리듬헌터"></label>
          <button class="btn primary lg block" type="submit">입장하기</button>
        </form>
        ${Sync.mode === 'demo' ? '<p class="mode-note"><b>DEMO MODE</b> · 같은 브라우저에서 열린 강사 화면과만 연결됩니다.</p>' : ''}
      </section>`;
    U.$('#joinForm').onsubmit = async e => {
      e.preventDefault();
      const code = U.$('#jCode').value.trim(), name = U.$('#jName').value.trim();
      if (!code || !name) return;
      const btn = e.submitter || U.$('#joinForm button'); btn.disabled = true;
      try {
        const meta = await Sync.get(P.meta(code));
        if (!meta) { U.toast('세션을 찾을 수 없습니다. 코드를 확인하세요.', 'err'); btn.disabled = false; return; }
        if (meta.status === 'ended') { U.toast('이미 종료된 세션입니다.', 'err'); btn.disabled = false; return; }
        const id = await Sync.push(P.teams(code), Engine.newTeam(name, Sync.uid()));
        S.code = code; S.teamId = id;
        st().setItem('ecg_player', JSON.stringify({ code, teamId: id }));
        enter();
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
    U.$('#pauseOverlay').hidden = true;
    renderJoin('');
  }

  /* ---------- 화면 결정 ---------- */
  function view() {
    const m = S.meta, t = S.team;
    if (!m || !t || !S.content) return 'loading';
    if (t.stage === 'done') return 'done';
    if (m.status === 'ended' || (m.status === 'running' && Engine.remaining(m) <= 0)) return 'timeover';
    if (m.status === 'lobby') return 'lobby';
    return t.stage;
  }
  function render() {
    const v = view();
    const k = [v, S.team && S.team.roomIndex, S.team && S.team.qIndex].join('|');
    if (k === S.lastKey) { tickHud(); return; }
    S.lastKey = k;
    const views = { loading, lobby, start: startScreen, 'room-intro': roomIntro, question, lock, done, timeover };
    const body = (views[v] || loading)();
    const showHud = !['loading', 'lobby', 'start'].includes(v);
    app().innerHTML = (showHud ? hudHtml() : '') + body;
    bind(v);
    tickHud();
    window.scrollTo(0, 0);
  }
  function hudHtml() {
    const { room } = Engine.current(S.team, S.content);
    return `<header class="hud">
      <div class="hud-team">${U.esc(S.team.name)}</div>
      <div class="hud-room">${room && S.team.stage !== 'done' ? U.esc(room.code) : ''}</div>
      <div class="hud-score">SCORE <b id="hudScore">${S.team.score}</b></div>
      <div class="hud-timer" id="hudTimer">--:--</div>
    </header>`;
  }
  function tickHud() {
    if (!S.meta || !S.team) return;
    const rem = Engine.remaining(S.meta);
    const tEl = U.$('#hudTimer');
    if (tEl) { tEl.textContent = U.fmtTime(rem); tEl.classList.toggle('alert', rem <= 60 && S.meta.status !== 'lobby'); }
    const sEl = U.$('#hudScore'); if (sEl) sEl.textContent = S.team.score;
    U.$('#pauseOverlay').hidden = S.meta.status !== 'paused' || S.team.stage === 'done';
    const over = S.meta.status === 'running' && rem <= 0;
    if (over !== S.wasOver) { S.wasOver = over; render(); }
  }

  /* ---------- 각 화면 ---------- */
  const loading = () => `<section class="screen center"><p class="muted">세션에 연결 중…</p></section>`;

  const lobby = () => `<section class="screen center lobby">
      <div class="pulse-ring"><span></span></div>
      <h2>${U.esc(S.team.name)} 입장 완료</h2>
      <p class="muted">강사가 게임을 시작하면 미션이 열립니다.</p>
      <div class="chip-line">SESSION ${U.esc(S.code)}</div>
      <button class="btn ghost sm" data-act="leave">팀 나가기</button>
    </section>`;

  const startScreen = () => `<section class="screen center start">
      <div class="title-block">
        ${U.ecgLine('sweep big')}
        <h1 class="title">ECG <span>Re:Start</span></h1>
        <p class="subtitle">THE ECG ESCAPE ROOM</p>
        <div class="mission-tag"><i></i>MISSION · SAVE THE PATIENT</div>
      </div>
      <p class="brief">응급실에 이상 리듬 경보가 울렸습니다.<br>${Engine.rooms(S.content).length}개의 방에서 심전도 미션을 해결하고<br>암호를 찾아 환자를 살리세요.</p>
      <button class="btn primary xl" data-act="startMission">START MISSION</button>
      <p class="disclaimer">화면 장식용 파형은 실제 임상 심전도가 아닙니다.</p>
    </section>`;

  function roomIntro() {
    const r = Engine.current(S.team, S.content).room;
    return `<section class="screen center room-intro">
      <div class="door"><div class="door-lock">${U.icon.lock}</div></div>
      <div class="room-code">${U.esc(r.code)}</div>
      <h1 class="room-title">${U.esc(r.title)}</h1>
      <p class="room-sub">${U.esc(r.subtitle || '')}</p>
      <div class="card objective"><div class="label">MISSION OBJECTIVE</div><p>${U.esc(r.objective || '')}</p>
        <div class="topics">${r.topics.map(t => `<span>${U.esc(t)}</span>`).join('')}</div>
        <div class="muted small">${r.questions.length}개 미션 · 모두 해결하면 잠금장치 암호 조각이 모입니다</div></div>
      <button class="btn primary lg" data-act="enterRoom">ROOM 입장</button>
    </section>`;
  }

  function caseCard(ci, title = 'PATIENT CASE') {
    if (!ci) return '';
    return `<div class="case-card"><div class="label">${title}</div>
      ${ci.summary ? `<p class="case-sum">${U.esc(ci.summary)}</p>` : ''}
      ${ci.vitals ? `<div class="vitals">${U.esc(ci.vitals).split('·').map(v => `<span>${v.trim()}</span>`).join('')}</div>` : ''}
      ${ci.mental ? `<p class="case-line"><b>의식/상태</b> ${U.esc(ci.mental)}</p>` : ''}
      ${ci.ecg ? `<p class="case-line"><b>ECG</b> ${U.esc(ci.ecg)}</p>` : ''}
    </div>`;
  }
  function ecgFigure(q) {
    if (q.image) return `<figure class="ecg-fig"><img src="${U.esc(q.image)}" alt="ECG" data-zoom>${q.imageCaption || q.imageSource ? `<figcaption>${U.esc(q.imageCaption || '')}${q.imageSource ? ` · 출처: ${U.esc(q.imageSource)}` : ''}</figcaption>` : ''}<span class="zoom-hint">탭하여 확대</span></figure>`;
    return `<figure class="ecg-fig empty"><div class="ph"><b>ECG 이미지 미등록</b><span>아래 판독 소견으로 문제를 해결하세요</span></div></figure>`;
  }

  function question() {
    const { room, q } = Engine.current(S.team, S.content);
    const a = S.team.answers[q.id] || { wrong: [] };
    const d = Math.min(3, Math.max(1, q.difficulty));
    const pct = Math.round(Engine.scoring().hintRate * 100);
    return `<section class="screen q">
      <div class="q-meta"><span class="room-chip">${U.esc(room.code)}</span><span>MISSION ${S.team.qIndex + 1}/${room.questions.length}</span><span class="stars" title="난이도">${'★'.repeat(d)}${'☆'.repeat(3 - d)}</span><span class="pts">${q.points}점</span></div>
      <div class="q-progress">${room.questions.map((x, i) => `<i class="${i < S.team.qIndex ? 'done' : i === S.team.qIndex ? 'now' : ''}"></i>`).join('')}</div>
      <h2 class="q-title">${U.esc(q.title)}</h2>
      ${caseCard(room.caseInfo)}
      ${ecgFigure(q)}
      ${caseCard(q.patient, 'PATIENT')}
      <p class="q-stem">${U.nl(q.stem)}</p>
      <div class="options">${q.options.map((o, i) => {
        const wrong = a.wrong.includes(i), right = a.correct && i === q.answer;
        return `<button class="opt ${wrong ? 'is-wrong' : ''} ${right ? 'is-correct' : ''}" data-opt="${i}" ${a.correct || wrong ? 'disabled' : ''}><span class="opt-key">${'ABCDEFGH'[i]}</span><span class="opt-text">${U.esc(o.text)}</span></button>`;
      }).join('')}</div>
      <div class="q-tools" id="qTools">${hintHtml(q, a, pct)}</div>
      <div id="feedback">${a.correct ? correctCard(q, a) : ''}</div>
    </section>`;
  }
  function hintHtml(q, a, pct) {
    if (!q.hint) return '';
    if (a.hint) return `<div class="hint-box"><span class="label">HINT</span>${U.esc(q.hint)}</div>`;
    if (a.correct) return '';
    return `<button class="btn ghost sm" data-act="hint">힌트 보기 <small>(이 문항 −${pct}%)</small></button>`;
  }
  function correctCard(q, a) {
    const { room } = Engine.current(S.team, S.content);
    const last = S.team.qIndex >= room.questions.length - 1;
    return `<div class="fb ok">
      <div class="fb-head"><span>CORRECT</span><b>+${a.points}</b></div>
      <div class="fb-exp">${U.nl(q.explanation)}</div>
      ${q.reference ? `<div class="ref">참고: ${U.esc(q.reference)}</div>` : ''}
      ${q.codePiece ? `<div class="piece-got">암호 조각 획득 <span class="piece">${U.esc(q.codePiece)}</span></div>` : ''}
      <button class="btn primary lg block" data-act="next">${last ? '잠금장치로 이동' : '다음 미션'}</button>
    </div>`;
  }
  function wrongCard(res) {
    return `<div class="fb bad ${res.danger ? 'danger' : ''}">
      <div class="fb-head"><span>${res.danger ? '⚠ 위험한 선택' : '오답'}</span>${res.danger ? `<b>${res.points}</b>` : ''}</div>
      <p>${U.esc(res.opt.feedback || '다시 판단해 보세요.')}</p>
      ${res.danger ? '<p class="danger-note">이 선택은 실제 환자에게 위해를 줄 수 있습니다.</p>' : ''}
      <p class="muted small">다른 선택지를 골라 다시 도전하세요.</p>
    </div>`;
  }

  function lock() {
    const { room } = Engine.current(S.team, S.content);
    const pieces = U.seededShuffle(room.questions.map(q => q.codePiece).filter(Boolean), S.teamId + room.id);
    return `<section class="screen center lock">
      <div class="lock-icon" id="lockIcon">${U.icon.lock}</div>
      <div class="room-code">${U.esc(room.code)} · EXIT</div>
      <h2>잠금장치를 해제하세요</h2>
      <div class="pieces">${pieces.map(p => `<button class="piece big" data-piece="${U.esc(p)}">${U.esc(p)}</button>`).join('')}</div>
      <p class="clue">${U.esc(room.lockClue || '획득한 조각을 올바른 순서로 입력하세요.')}</p>
      <form id="lockForm" class="lock-form" autocomplete="off">
        <input id="pw" autocapitalize="characters" spellcheck="false" placeholder="암호 입력">
        <div class="row"><button type="button" class="btn ghost" data-act="clearPw">지우기</button><button class="btn primary lg" type="submit">UNLOCK</button></div>
      </form>
      <p class="muted small">조각을 탭하면 입력됩니다 · 오입력 시 −${Engine.scoring().passwordPenalty}점</p>
    </section>`;
  }

  function breakdown() {
    const t = S.team, c = S.content, Sc = Engine.scoring();
    const all = Engine.allQuestions(c);
    const qPts = all.reduce((s, x) => s + ((t.answers[x.q.id] || {}).points || 0), 0);
    return `<div class="card breakdown">
      <div class="bd-row"><span>미션 점수</span><b>${qPts}</b></div>
      <div class="bd-row"><span>시간 보너스</span><b>+${t.timeBonus}</b></div>
      <div class="bd-row neg"><span>위험 판단 ${t.danger}회</span><b>−${t.danger * Sc.dangerPenalty}</b></div>
      <div class="bd-row neg"><span>암호 오입력 ${t.lockFails}회</span><b>−${t.lockFails * Sc.passwordPenalty}</b></div>
      <div class="bd-row"><span>힌트 사용</span><b>${t.hintsUsed}회</b></div>
      <div class="bd-row"><span>1차 시도 정답</span><b>${Engine.firstTryCount(t, c)} / ${all.length}</b></div>
      <div class="bd-total"><span>FINAL SCORE</span><b>${t.score}</b></div>
    </div>`;
  }
  const done = () => `<section class="screen center done">
      <div class="saved-line">${U.ecgLine('sweep big ok')}</div>
      <div class="mission-tag ok"><i></i>PATIENT SAVED</div>
      <h1 class="title sm">MISSION COMPLETE</h1>
      <p class="muted">${U.esc(S.team.name)} · 모든 방을 탈출했습니다</p>
      ${breakdown()}
      <p class="muted small">전체 순위는 강사 화면에서 공개됩니다.</p>
    </section>`;
  const timeover = () => `<section class="screen center done">
      <div class="mission-tag bad"><i></i>TIME OVER</div>
      <h1 class="title sm">게임 종료</h1>
      <p class="muted">${U.esc(S.team.name)} · ${Engine.solved(S.team, S.content)} / ${Engine.allQuestions(S.content).length} 미션 해결</p>
      ${breakdown()}
      <p class="muted small">전체 순위는 강사 화면에서 공개됩니다.</p>
    </section>`;

  /* ---------- 이벤트 ---------- */
  function bind(v) {
    const on = (act, fn) => U.$$(`[data-act="${act}"]`).forEach(b => b.onclick = fn);
    on('leave', () => { if (confirm('팀에서 나가시겠습니까? 진행 기록은 강사 화면에 남습니다.')) leave(); });
    on('startMission', () => { S.team.stage = 'room-intro'; save(); });
    on('enterRoom', () => { S.team.stage = 'question'; save(); });
    if (v === 'question') bindQuestion();
    if (v === 'lock') bindLock();
    U.$$('[data-zoom]').forEach(img => img.onclick = () => zoom(img.src));
  }
  function bindQuestion() {
    const { q } = Engine.current(S.team, S.content);
    U.$$('.opt').forEach(btn => btn.onclick = () => {
      const i = Number(btn.dataset.opt);
      const res = Engine.pick(S.team, S.content, i);
      if (!res) return;
      save();
      const fb = U.$('#feedback');
      if (res.correct) {
        U.$$('.opt').forEach(b => b.disabled = true);
        btn.classList.add('is-correct', 'pop');
        fb.innerHTML = correctCard(q, S.team.answers[q.id]);
        U.$('#qTools').innerHTML = hintHtml(q, S.team.answers[q.id], 0);
        U.$('[data-act="next"]').onclick = next;
        if (navigator.vibrate) navigator.vibrate(40);
      } else {
        btn.classList.add('is-wrong', 'shake'); btn.disabled = true;
        fb.innerHTML = wrongCard(res);
        if (navigator.vibrate) navigator.vibrate([60, 40, 60]);
      }
      fb.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
    const h = U.$('[data-act="hint"]');
    if (h) h.onclick = () => {
      Engine.hint(S.team, S.content); save();
      U.$('#qTools').innerHTML = hintHtml(q, S.team.answers[q.id], 0);
    };
    const n = U.$('[data-act="next"]'); if (n) n.onclick = next;
  }
  function next() { Engine.afterCorrect(S.team, S.content); save(); }
  function bindLock() {
    const { room } = Engine.current(S.team, S.content);
    const pw = U.$('#pw');
    U.$$('[data-piece]').forEach(b => b.onclick = () => { pw.value += b.dataset.piece; });
    U.$('[data-act="clearPw"]').onclick = () => { pw.value = ''; pw.focus(); };
    let busy = false;
    U.$('#lockForm').onsubmit = e => {
      e.preventDefault(); if (busy) return;
      if (Engine.checkPassword(room, pw.value)) {
        busy = true;
        U.$('#lockIcon').classList.add('unlocked');
        U.$('.lock').classList.add('opening');
        if (navigator.vibrate) navigator.vibrate([30, 30, 80]);
        setTimeout(() => { Engine.unlock(S.team, S.content, S.meta); save(); }, 1300);
      } else {
        Engine.failPassword(S.team); save();
        const f = U.$('#lockForm'); f.classList.remove('shake'); void f.offsetWidth; f.classList.add('shake');
        U.toast('암호가 일치하지 않습니다', 'err'); pw.select();
      }
    };
  }
  function zoom(src) {
    const ov = document.createElement('div'); ov.className = 'zoom-ov';
    ov.innerHTML = `<img src="${U.esc(src)}" alt="ECG 확대"><button class="btn ghost sm">닫기</button>`;
    ov.onclick = () => ov.remove();
    document.body.appendChild(ov);
  }

  return { start };
})();
