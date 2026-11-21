/* =========================================================
 * 강사용 PC 대시보드 (프로젝터 송출용)
 * ========================================================= */
const Host = (() => {
  const P = Sync.paths;
  const cfg = window.APP_CONFIG || {};
  const H = { code: null, meta: null, content: null, teams: {}, tab: 'progress', hide: false, unsubs: [], tick: null, bot: null, rv: { i: 0, show: false } };
  const app = () => U.$('#app');

  async function start() {
    document.body.className = 'host-body-bg';
    const c = localStorage.getItem('ecg_host_code');
    if (c) {
      const m = await Sync.get(P.meta(c)).catch(() => null);
      if (m && (Sync.mode === 'demo' || m.hostUid === Sync.uid())) { H.code = c; return attach(); }
    }
    renderSetup();
  }

  const brand = () => `<div class="brand"><span class="brand-logo">${U.ecgLine('sweep')}</span><div><div class="brand-name">ECG <em>Re:Start</em></div><div class="brand-sub">INSTRUCTOR CONSOLE</div></div></div>`;
  const badge = () => Sync.mode === 'demo' ? '<span class="badge demo" title="같은 브라우저의 탭끼리만 공유됩니다">DEMO MODE</span>' : '<span class="badge live">LIVE · Firebase</span>';

  /* ---------- 세션 생성 화면 ---------- */
  function renderSetup() {
    const c = Editor.getContent();
    const nq = Engine.allQuestions(c).length;
    app().innerHTML = `<div class="host">
      <header class="host-top">${brand()}${badge()}<div class="spacer"></div><a class="btn ghost sm" href="${U.baseUrl()}">처음 화면</a></header>
      <div class="setup-wrap">
        <div class="card setup-card">
          <div class="label">NEW SESSION</div><h2>새 교육 세션 만들기</h2>
          <label class="field">전체 제한시간 (분)<input type="number" id="dur" min="3" max="120" value="${cfg.DEFAULT_DURATION_MIN || 20}"></label>
          <div class="setup-info">문제 세트 <b>${U.esc(c.title || '')}</b><br>${c.rooms.length}개 Room · ${nq}문항
            ${Editor.isCustom() ? '<span class="tag teal">수정본 사용</span>' : '<span class="tag">기본 샘플</span>'}</div>
          <button class="btn primary lg block" id="createBtn">세션 생성</button>
          ${Sync.mode === 'demo' ? '<p class="muted small">DEMO MODE: 이 브라우저의 다른 탭에서 교육생 화면을 열어 시연합니다. 실제 수업에서 여러 스마트폰을 연결하려면 Firebase 설정이 필요합니다(README).</p><button class="btn ghost sm" id="resetDemo">데모 데이터 초기화</button>' : ''}
        </div>
        <div class="card setup-card">
          <div class="label">CONTENT</div><h2>문제 관리</h2>
          <p class="muted">문제 제목·내용, ECG 이미지, 선택지, 정답, 해설, 난이도, 배점, 암호를 수정합니다. 수정 내용은 이 브라우저에 저장되며 <b>다음 세션 생성 시</b> 반영됩니다.</p>
          <button class="btn ghost lg block" id="edBtn">문제 관리 열기</button>
        </div>
      </div>
      <div id="edMount" class="ed-mount"></div>
    </div>`;
    U.$('#createBtn').onclick = create;
    U.$('#edBtn').onclick = () => { Editor.mount(U.$('#edMount'), { onChange: () => {} }); U.$('#edMount').scrollIntoView({ behavior: 'smooth' }); };
    const r = U.$('#resetDemo'); if (r) r.onclick = () => { if (confirm('이 브라우저의 모든 데모 세션·팀 데이터를 삭제합니다.')) { Sync.resetDemo(); U.toast('초기화되었습니다'); } };
  }

  async function create() {
    const dur = Math.max(1, Math.min(180, Number(U.$('#dur').value) || 20));
    const btn = U.$('#createBtn'); btn.disabled = true;
    try {
      let code, tries = 0;
      do { code = U.code4(); tries++; } while (tries < 20 && await Sync.get(P.meta(code)));
      const content = Editor.getContent();
      const meta = { status: 'lobby', durationSec: dur * 60, createdAt: Sync.now(), hostUid: Sync.uid(), startedAt: 0, pausedAt: 0, pausedTotalMs: 0, endedAt: 0, contentTitle: content.title || '' };
      await Sync.set(P.meta(code), meta);          // meta 먼저 (보안 규칙: hostUid 확인)
      await Sync.set(P.content(code), content);
      localStorage.setItem('ecg_host_code', code);
      H.code = code; attach();
    } catch (e) { console.error(e); U.toast('세션 생성 실패: ' + (e.message || e), 'err'); btn.disabled = false; }
  }

  /* ---------- 세션 대시보드 ---------- */
  function attach() {
    renderMain();
    H.unsubs.push(Sync.watch(P.meta(H.code), m => {
      const prev = H.meta && H.meta.status; H.meta = m; if (!m) return;
      updateTop();
      if (prev && prev !== 'ended' && m.status === 'ended') { H.tab = 'results'; renderTabs(); }
      if (['progress', 'results'].includes(H.tab)) renderTab();
    }));
    H.unsubs.push(Sync.watch(P.content(H.code), c => { H.content = Engine.normalizeContent(c); if (H.tab !== 'editor') renderTab(); }));
    H.unsubs.push(Sync.watch(P.teams(H.code), t => { H.teams = t || {}; updateJoinCount(); if (['progress', 'stats', 'results'].includes(H.tab)) renderTab(); }));
    H.tick = setInterval(tick, 500);
    if (Sync.mode === 'demo') H.bot = setInterval(botLoop, 1800);
  }
  function detach() { H.unsubs.forEach(f => f()); H.unsubs = []; clearInterval(H.tick); clearInterval(H.bot); H.meta = null; H.teams = {}; }

  function joinUrl() { return `${U.baseUrl()}?role=player&s=${H.code}`; }
  function qrBlock(url) {
    const pb = U.urlProblem();
    if (pb === 'file' || pb === 'local') return `<div class="qr-warn"><b>QR 코드를 만들 수 없는 주소입니다</b>
      <p>${pb === 'file' ? 'index.html 파일을 PC에서 직접 연 상태(file://)' : '이 PC 안에서만 열리는 주소(localhost)'}입니다. 스마트폰은 이 주소를 열 수 없어 아이폰에서는 "사용 가능한 데이터가 없음"으로 표시됩니다.</p>
      <p>Netlify·GitHub Pages 등에 배포한 <b>https:// 주소</b>로 강사 화면을 열면 QR 코드가 표시됩니다. (README 3장)</p></div>`;
    const qr = U.qrImg(url) || '<div class="muted small">QR 라이브러리를 불러오지 못했습니다. 아래 주소로 접속하세요.</div>';
    const lan = pb === 'lan' ? '<p class="qr-note">사내 네트워크 주소입니다. 교육생 스마트폰이 같은 와이파이에 연결되어 있어야 열립니다.</p>' : '';
    const http = location.protocol === 'http:' && !pb ? '<p class="qr-note">https:// 주소 사용을 권장합니다.</p>' : '';
    return `<div class="qr-wrap">${qr}</div>${lan}${http}`;
  }
  function renderMain() {
    const url = joinUrl();
    app().innerHTML = `<div class="host">
      <header class="host-top">
        ${brand()}${badge()}
        <div class="session-code"><span>SESSION</span><b>${H.code}</b></div>
        <div class="status-badge" id="stBadge">-</div>
        <div class="spacer"></div>
        <div class="big-timer" id="bigTimer">--:--</div>
      </header>
      <div class="control-bar" id="controls"></div>
      <div class="host-grid">
        <aside class="join-panel card">
          <div class="label">JOIN</div>
          ${qrBlock(url)}
          <div class="join-code">코드 <b>${H.code}</b></div>
          <div class="join-url" title="${U.esc(url)}">${U.esc(url)}</div>
          <div class="join-count"><b id="teamCount">0</b> 팀 접속</div>
          ${Sync.mode === 'demo' ? `<div class="demo-box"><p>DEMO MODE · 실제 스마트폰과는 연결되지 않습니다. 이 브라우저의 새 탭으로 교육생 화면을 열어 시연하세요.</p>
            <a class="btn ghost sm block" href="${U.esc(url)}" target="_blank" rel="noopener">교육생 화면 새 탭으로 열기</a>
            <button class="btn ghost sm block" id="addBots">리허설용 가상 팀 3개 추가</button></div>` : ''}
        </aside>
        <main class="host-main">
          <nav class="tabs" id="tabs"></nav>
          <div id="tabBody" class="tab-body"></div>
        </main>
      </div>
    </div>`;
    const ab = U.$('#addBots'); if (ab) ab.onclick = addBots;
    renderTabs();
  }

  const TABS = [['progress', '진행 현황'], ['stats', '미션 정답률'], ['reveal', '정답·해설'], ['results', '최종 결과'], ['editor', '문제 관리']];
  function renderTabs() {
    U.$('#tabs').innerHTML = TABS.map(([k, l]) => `<button class="tab ${H.tab === k ? 'on' : ''}" data-tab="${k}">${l}</button>`).join('')
      + `<label class="hide-toggle"><input type="checkbox" id="hideSc" ${H.hide ? 'checked' : ''}> 프로젝터에서 점수 숨기기</label>`;
    U.$$('[data-tab]').forEach(b => b.onclick = () => { H.tab = b.dataset.tab; renderTabs(); });
    U.$('#hideSc').onchange = e => { H.hide = e.target.checked; renderTab(); };
    renderTab();
  }

  function updateTop() {
    const m = H.meta; if (!m) return;
    const map = { lobby: ['READY', 'ready'], running: ['IN PROGRESS', 'run'], paused: ['PAUSED', 'pause'], ended: ['ENDED', 'end'] };
    const [txt, cls] = map[m.status] || ['-', ''];
    const b = U.$('#stBadge'); if (b) { b.textContent = txt; b.className = 'status-badge ' + cls; }
    const c = U.$('#controls'); if (!c) return;
    const btn = (act, label, cls = 'ghost') => `<button class="btn ${cls}" data-ctl="${act}">${label}</button>`;
    let h = '';
    if (m.status === 'lobby') h += btn('start', '▶ 게임 시작', 'primary lg');
    if (m.status === 'running') h += btn('pause', 'Ⅱ 일시정지', 'warn lg');
    if (m.status === 'paused') h += btn('resume', '▶ 재개', 'primary lg');
    if (m.status !== 'ended') h += `<span class="time-adj">제한시간 <b>${Math.round(m.durationSec / 60)}분</b>${btn('minus', '−1분')}${btn('plus', '+1분')}</span>` + btn('end', '■ 게임 종료', 'danger');
    if (m.status === 'ended') h += btn('results', '🏆 결과 발표 (전체화면)', 'primary lg');
    h += `<span class="spacer"></span>` + btn('fullscreen', '⛶ 전체화면') + btn('newSession', '새 세션');
    c.innerHTML = h;
    U.$$('[data-ctl]').forEach(x => x.onclick = () => control(x.dataset.ctl));
  }
  async function control(a) {
    const m = H.meta, now = Sync.now(), up = patch => Sync.update(P.meta(H.code), patch);
    if (a === 'start') await up({ status: 'running', startedAt: now, pausedTotalMs: 0, pausedAt: 0 });
    if (a === 'pause') await up({ status: 'paused', pausedAt: now });
    if (a === 'resume') await up({ status: 'running', pausedTotalMs: (m.pausedTotalMs || 0) + (now - (m.pausedAt || now)), pausedAt: 0 });
    if (a === 'plus') await up({ durationSec: m.durationSec + 60 });
    if (a === 'minus') await up({ durationSec: Math.max(60, m.durationSec - 60) });
    if (a === 'end' && confirm('게임을 종료하시겠습니까? 교육생 화면이 잠깁니다.')) await up({ status: 'ended', endedAt: now });
    if (a === 'results') { H.tab = 'results'; renderTabs(); showResultsOverlay(); }
    if (a === 'fullscreen') { document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen && document.documentElement.requestFullscreen(); }
    if (a === 'newSession' && confirm('새 세션을 만드시겠습니까? 현재 세션 기록은 저장소에 남아 있습니다.')) { detach(); localStorage.removeItem('ecg_host_code'); H.code = null; renderSetup(); }
  }
  function tick() {
    const m = H.meta; if (!m) return;
    const rem = Engine.remaining(m);
    const el = U.$('#bigTimer');
    if (el) { el.textContent = U.fmtTime(rem); el.classList.toggle('alert', rem <= 60 && m.status === 'running'); el.classList.toggle('paused', m.status === 'paused'); }
    if (m.status === 'running' && rem <= 0 && !H._ending) { H._ending = true; Sync.update(P.meta(H.code), { status: 'ended', endedAt: Sync.now() }).finally(() => { H._ending = false; }); }
  }
  function updateJoinCount() { const el = U.$('#teamCount'); if (el) el.textContent = Object.keys(H.teams).length; }

  /* ---------- 탭 ---------- */
  function renderTab() {
    const body = U.$('#tabBody'); if (!body || !H.content) return;
    if (H.tab === 'progress') body.innerHTML = progressTab();
    if (H.tab === 'stats') body.innerHTML = statsTab();
    if (H.tab === 'reveal') body.innerHTML = revealTab();
    if (H.tab === 'results') body.innerHTML = resultsTab();
    if (H.tab === 'editor') {
      Editor.mount(body, { session: H.code, onApply: async c => { await Sync.set(P.content(H.code), c); U.toast('현재 세션에 적용했습니다'); } });
    }
    U.$$('[data-reveal]', body).forEach(b => b.onclick = () => openReveal(Number(b.dataset.reveal)));
    const ro = U.$('#openResults', body); if (ro) ro.onclick = showResultsOverlay;
  }

  function progressTab() {
    const c = H.content, rooms = Engine.rooms(c), total = Engine.allQuestions(c).length;
    const list = H.hide ? Engine.ranking(H.teams).sort((a, b) => a.joinedAt - b.joinedAt) : Engine.ranking(H.teams);
    if (!list.length) return `<div class="empty-state">${U.ecgLine('sweep big')}<h3>교육생 입장 대기 중</h3><p class="muted">QR 코드 또는 주소로 접속해 팀명을 입력하면 이곳에 표시됩니다.</p></div>`;
    const cols = rooms.map((r, i) => ({ label: r.code, title: r.title, teams: list.filter(t => t.stage !== 'done' && t.stage !== 'start' && t.roomIndex === i) }));
    cols.unshift({ label: 'START', title: '대기', teams: list.filter(t => t.stage === 'start') });
    cols.push({ label: 'ESCAPED', title: '완료', teams: list.filter(t => t.stage === 'done'), ok: true });
    return `<div class="room-flow">${cols.map(col => `<div class="room-col ${col.ok ? 'ok' : ''} ${col.teams.length ? 'has' : ''}">
        <div class="rc-head"><span>${U.esc(col.label)}</span><b>${col.teams.length}</b></div><div class="rc-title">${U.esc(col.title)}</div>
        <div class="rc-teams">${col.teams.map(t => `<span>${U.esc(t.name)}</span>`).join('')}</div></div>`).join('<div class="rc-arrow">›</div>')}</div>
      <table class="tbl"><thead><tr><th>${H.hide ? '' : '순위'}</th><th>팀</th><th>현재 위치</th><th>진행률</th><th class="num">점수</th><th class="num">힌트</th><th class="num">오답</th><th class="num">위험 판단</th></tr></thead><tbody>
      ${list.map((t, i) => { const s = Engine.solved(t, c), p = total ? s / total * 100 : 0; return `<tr>
        <td class="rank">${H.hide ? '' : i + 1}</td>
        <td class="tname">${U.esc(t.name)}${t.bot ? ' <span class="tag">BOT</span>' : ''}</td>
        <td>${U.esc(Engine.location(t, c))}</td>
        <td><div class="bar"><i style="width:${p}%"></i></div><small class="muted">${s}/${total}</small></td>
        <td class="num score">${H.hide ? '•••' : t.score}</td><td class="num">${t.hintsUsed}</td><td class="num">${t.wrong}</td>
        <td class="num ${t.danger ? 'warn' : ''}">${t.danger}</td></tr>`; }).join('')}
      </tbody></table>`;
  }

  function qStats(q) {
    const ts = Object.values(H.teams).map(Engine.normalizeTeam);
    let tried = 0, first = 0, solved = 0, hint = 0, danger = 0; const dist = q.options.map(() => 0);
    ts.forEach(t => {
      const a = t.answers[q.id]; if (!a || !a.attempts) return;
      tried++; if (a.firstTry) first++; if (a.correct) solved++; if (a.hint) hint++; danger += a.danger || 0;
      a.wrong.forEach(i => { if (dist[i] != null) dist[i]++; }); if (a.correct) dist[q.answer]++;
    });
    return { tried, first, solved, hint, danger, dist, rate: tried ? Math.round(first / tried * 100) : null };
  }
  function statsTab() {
    const all = Engine.allQuestions(H.content);
    const st = all.map(x => ({ ...x, s: qStats(x.q) }));
    const tried = st.filter(x => x.s.tried);
    const avg = tried.length ? Math.round(tried.reduce((a, x) => a + x.s.rate, 0) / tried.length) : null;
    const dsum = st.reduce((a, x) => a + x.s.danger, 0);
    const low = tried.filter(x => x.s.rate < 50).length;
    let html = `<div class="kpis">
      <div class="kpi"><span>평균 1차 정답률</span><b>${avg == null ? '-' : avg + '%'}</b></div>
      <div class="kpi"><span>해설 권장 문항 (1차 정답률 &lt;50%)</span><b>${low}</b></div>
      <div class="kpi ${dsum ? 'warn' : ''}"><span>위험 판단 선택 (전체)</span><b>${dsum}</b></div>
      <div class="kpi"><span>참여 팀</span><b>${Object.keys(H.teams).length}</b></div></div>`;
    let lastRoom = null;
    st.forEach((x, idx) => {
      if (x.room !== lastRoom) { html += `<h3 class="sec">${U.esc(x.room.code)} · ${U.esc(x.room.title)}</h3>`; lastRoom = x.room; }
      const r = x.s.rate;
      html += `<div class="stat-row">
        <div class="stat-q"><b>Q${x.qi + 1}</b> ${U.esc(x.q.title)}</div>
        <div class="bar big"><i class="${r != null && r < 50 ? 'low' : ''}" style="width:${r || 0}%"></i></div>
        <div class="stat-num">${r == null ? '-' : r + '%'}</div>
        <div class="stat-sub">시도 ${x.s.tried} · 해결 ${x.s.solved} · 힌트 ${x.s.hint} · <span class="${x.s.danger ? 'warn' : ''}">위험 ${x.s.danger}</span></div>
        <button class="btn ghost sm" data-reveal="${idx}">해설</button></div>`;
    });
    return html + `<p class="muted small">1차 정답률 = 첫 시도에 정답을 고른 팀 / 해당 문항을 시도한 팀</p>`;
  }

  function revealTab() {
    const all = Engine.allQuestions(H.content);
    let html = '<p class="muted">문항을 선택하면 프로젝터용 정답·해설 화면이 열립니다. (교육생 화면에는 표시되지 않습니다)</p><div class="reveal-list">';
    let last = null;
    all.forEach((x, i) => {
      if (x.room !== last) { if (last) html += '</div>'; html += `<h3 class="sec">${U.esc(x.room.code)} · ${U.esc(x.room.title)}</h3><div class="reveal-grid">`; last = x.room; }
      html += `<button class="reveal-card" data-reveal="${i}"><span class="muted small">Q${x.qi + 1}</span><b>${U.esc(x.q.title)}</b></button>`;
    });
    return html + '</div></div>';
  }

  function openReveal(i) { H.rv = { i, show: false }; drawReveal(); }
  function drawReveal() {
    const all = Engine.allQuestions(H.content);
    const x = all[H.rv.i]; if (!x) return;
    const { q, room } = x, s = qStats(q), max = Math.max(1, ...s.dist);
    const ci = room.caseInfo, pt = q.patient;
    const caseHtml = [ci, pt].filter(Boolean).map(c => `<div class="case-card"><p class="case-sum">${U.esc(c.summary || '')}</p>${c.vitals ? `<div class="vitals">${U.esc(c.vitals).split('·').map(v => `<span>${v.trim()}</span>`).join('')}</div>` : ''}${c.mental ? `<p class="case-line"><b>의식/상태</b> ${U.esc(c.mental)}</p>` : ''}${c.ecg ? `<p class="case-line"><b>ECG</b> ${U.esc(c.ecg)}</p>` : ''}</div>`).join('');
    const html = `<div class="ov-inner reveal">
      <div class="ov-head"><span class="room-chip">${U.esc(room.code)}</span><span>Q${x.qi + 1}</span><h2>${U.esc(q.title)}</h2><span class="spacer"></span>
        <span class="muted">1차 정답률 <b>${s.rate == null ? '-' : s.rate + '%'}</b></span></div>
      <div class="rv-grid">
        <div>${caseHtml}${q.image ? `<figure class="ecg-fig"><img src="${U.esc(q.image)}" alt="ECG">${q.imageSource ? `<figcaption>출처: ${U.esc(q.imageSource)}</figcaption>` : ''}</figure>` : ''}
          <p class="q-stem lg">${U.nl(q.stem)}</p></div>
        <div><div class="options">${q.options.map((o, k) => `<div class="opt static ${H.rv.show && k === q.answer ? 'is-correct' : ''} ${H.rv.show && o.danger ? 'is-danger' : ''}">
            <span class="opt-key">${'ABCDEFGH'[k]}</span><span class="opt-text">${U.esc(o.text)}${H.rv.show && o.danger ? ' <em class="danger-tag">위험</em>' : ''}</span>
            <span class="opt-dist"><i style="width:${s.dist[k] / max * 100}%"></i><small>${s.dist[k]}</small></span></div>`).join('')}</div>
          ${H.rv.show ? `<div class="fb ok"><div class="fb-head"><span>정답 · 해설</span></div><div class="fb-exp">${U.nl(q.explanation)}</div>${q.reference ? `<div class="ref">참고: ${U.esc(q.reference)}</div>` : ''}</div>` : '<p class="muted">막대: 각 선택지를 고른 팀 수(오답 시도 포함)</p>'}
        </div>
      </div>
      <div class="ov-foot"><button class="btn ghost" data-rv="prev">‹ 이전</button><button class="btn primary lg" data-rv="toggle">${H.rv.show ? '정답 숨기기' : '정답·해설 공개'}</button><button class="btn ghost" data-rv="next">다음 ›</button><span class="spacer"></span><button class="btn ghost" data-rv="close">닫기 (Esc)</button></div>
    </div>`;
    overlay(html, ov => {
      U.$$('[data-rv]', ov).forEach(b => b.onclick = () => {
        const a = b.dataset.rv;
        if (a === 'close') return closeOverlay();
        if (a === 'toggle') H.rv.show = !H.rv.show;
        if (a === 'prev') { H.rv.i = Math.max(0, H.rv.i - 1); H.rv.show = false; }
        if (a === 'next') { H.rv.i = Math.min(all.length - 1, H.rv.i + 1); H.rv.show = false; }
        drawReveal();
      });
    });
  }

  function resultsTab() {
    const c = H.content, list = Engine.ranking(H.teams), total = Engine.allQuestions(c).length;
    if (!list.length) return '<div class="empty-state"><h3>참여 팀이 없습니다</h3></div>';
    return `<div class="row-between"><p class="muted">순위: 총점 → 동점 시 먼저 완료한 팀</p><button class="btn primary" id="openResults">🏆 결과 발표 화면</button></div>
      <table class="tbl"><thead><tr><th>순위</th><th>팀</th><th class="num">총점</th><th class="num">1차 정답</th><th class="num">해결</th><th class="num">시간 보너스</th><th class="num">힌트</th><th class="num">위험 판단</th><th>완료 시간</th></tr></thead><tbody>
      ${list.map((t, i) => `<tr class="${i < 3 ? 'top' + (i + 1) : ''}"><td class="rank">${i + 1}</td><td class="tname">${U.esc(t.name)}</td><td class="num score">${t.score}</td>
        <td class="num">${Engine.firstTryCount(t, c)}/${total}</td><td class="num">${Engine.solved(t, c)}/${total}</td><td class="num">+${t.timeBonus}</td>
        <td class="num">${t.hintsUsed}</td><td class="num ${t.danger ? 'warn' : ''}">${t.danger}</td>
        <td>${t.finishedAt && H.meta && H.meta.startedAt ? U.fmtTime((t.finishedAt - H.meta.startedAt - (H.meta.pausedTotalMs || 0)) / 1000) : (t.stage === 'done' ? '완료' : '미완료')}</td></tr>`).join('')}
      </tbody></table>`;
  }
  function showResultsOverlay() {
    const list = Engine.ranking(H.teams);
    const pod = [list[1], list[0], list[2]];
    const html = `<div class="ov-inner results-ov">
      <div class="results-head">${U.ecgLine('sweep big ok')}<div class="label">FINAL RESULT</div><h1 class="title sm">ECG <span>Re:Start</span></h1></div>
      <div class="podium">${pod.map((t, k) => { const rank = [2, 1, 3][k]; return t ? `<div class="pod p${rank}" style="animation-delay:${[0.6, 1.2, 0.2][k]}s"><div class="pod-name">${U.esc(t.name)}</div><div class="pod-score">${t.score}</div><div class="pod-bar"><span>${rank}</span></div></div>` : '<div class="pod empty"></div>'; }).join('')}</div>
      <ol class="rest" start="4">${list.slice(3).map(t => `<li><span>${U.esc(t.name)}</span><b>${t.score}</b></li>`).join('')}</ol>
      <div class="ov-foot"><span class="spacer"></span><button class="btn ghost" data-close>닫기 (Esc)</button></div></div>`;
    overlay(html, ov => { U.$('[data-close]', ov).onclick = closeOverlay; });
  }

  function overlay(html, bindFn) {
    let ov = U.$('#hostOv');
    if (!ov) { ov = document.createElement('div'); ov.id = 'hostOv'; ov.className = 'overlay'; document.body.appendChild(ov); document.addEventListener('keydown', escClose); }
    ov.innerHTML = html; bindFn && bindFn(ov);
  }
  function escClose(e) {
    if (!U.$('#hostOv')) return;
    if (e.key === 'Escape') return closeOverlay();
    if (U.$('#hostOv .reveal')) {
      if (e.key === 'ArrowRight') U.$('[data-rv="next"]').click();
      if (e.key === 'ArrowLeft') U.$('[data-rv="prev"]').click();
      if (e.key === ' ') { e.preventDefault(); U.$('[data-rv="toggle"]').click(); }
    }
  }
  function closeOverlay() { const ov = U.$('#hostOv'); if (ov) ov.remove(); document.removeEventListener('keydown', escClose); }

  /* ---------- DEMO: 리허설용 가상 팀 ---------- */
  async function addBots() {
    const names = ['가상팀 Alpha', '가상팀 Bravo', '가상팀 Charlie'];
    for (const n of names) { const t = Engine.newTeam(n, 'bot'); t.bot = true; await Sync.push(P.teams(H.code), t); }
    U.toast('가상 팀 3개 추가 — 게임 시작 시 자동으로 진행합니다');
  }
  function botLoop() {
    if (!H.meta || H.meta.status !== 'running' || !H.content) return;
    Object.entries(H.teams).forEach(([id, raw]) => {
      if (!raw.bot || Math.random() < 0.4) return;
      const t = Engine.normalizeTeam(U.clone(raw)), c = H.content;
      if (t.stage === 'done') return;
      if (t.stage === 'start') t.stage = 'room-intro';
      else if (t.stage === 'room-intro') t.stage = 'question';
      else if (t.stage === 'question') {
        const { q } = Engine.current(t, c); const a = Engine.ans(t, q.id);
        if (a.correct) Engine.afterCorrect(t, c);
        else {
          if (!a.hint && Math.random() < 0.12) Engine.hint(t, c);
          const wrongs = q.options.map((_, i) => i).filter(i => i !== q.answer && !a.wrong.includes(i));
          Engine.pick(t, c, (!wrongs.length || Math.random() < 0.6) ? q.answer : U.pick(wrongs));
        }
      } else if (t.stage === 'lock') {
        if (Math.random() < 0.85) Engine.unlock(t, c, H.meta); else Engine.failPassword(t);
      }
      Sync.set(P.team(H.code, id), t);
    });
  }

  return { start };
})();
