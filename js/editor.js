/* =========================================================
 * 문제 관리 (콘텐츠 편집기)
 * - 기본 콘텐츠: content/questions.js (window.ECG_CONTENT)
 * - 수정본: 이 브라우저 localStorage에 저장 → 새 세션 생성 시 사용
 * - 영구 반영: [questions.js 내보내기] 파일로 content/questions.js 교체 후 재배포
 * ========================================================= */
const Editor = (() => {
  const KEY = 'ecg_content_override_v1';
  let C = null, sel = { r: 0, q: -1 }, el = null, opts = {};

  function getContent() {
    try { const s = localStorage.getItem(KEY); if (s) return Engine.normalizeContent(JSON.parse(s)); } catch (e) {}
    return Engine.normalizeContent(U.clone(window.ECG_CONTENT));
  }
  const isCustom = () => !!localStorage.getItem(KEY);
  function persist() {
    try { localStorage.setItem(KEY, JSON.stringify(C)); flash('저장됨'); }
    catch (e) { U.toast('저장 실패: 브라우저 저장공간 초과 (이미지 용량을 줄이거나 URL을 사용하세요)', 'err'); }
  }
  function flash(t) { const s = U.$('#edSaved'); if (s) { s.textContent = t; s.classList.add('on'); clearTimeout(flash.t); flash.t = setTimeout(() => s.classList.remove('on'), 1200); } }

  function mount(container, o = {}) { el = container; opts = o; C = getContent(); if (sel.r >= C.rooms.length) sel = { r: 0, q: -1 }; draw(); }

  function draw() {
    el.innerHTML = `<div class="editor card">
      <div class="ed-toolbar">
        <div><div class="label">CONTENT MANAGER</div><b>${U.esc(C.title || '문제 세트')}</b> <span class="muted small">${isCustom() ? '수정본' : '기본 샘플'} · 자동 저장</span> <span id="edSaved" class="saved-ind"></span></div>
        <span class="spacer"></span>
        ${opts.session ? '<button class="btn primary sm" data-ed="apply">현재 세션에 적용</button>' : ''}
        <button class="btn ghost sm" data-ed="exportJs">questions.js 내보내기</button>
        <button class="btn ghost sm" data-ed="exportJson">JSON 내보내기</button>
        <label class="btn ghost sm file-btn">가져오기<input type="file" accept=".json,.js" data-ed="import" hidden></label>
        <button class="btn ghost sm" data-ed="reset">기본값 복원</button>
      </div>
      <div class="ed-grid">
        <aside class="ed-tree">${tree()}</aside>
        <section class="ed-form">${sel.q < 0 ? roomForm() : questionForm()}</section>
      </div>
    </div>`;
    bind();
  }
  function tree() {
    return `<label class="field sm">문제 세트 이름<input data-root="title" value="${U.esc(C.title || '')}"></label>` +
      C.rooms.map((r, ri) => `<div class="ed-room">
        <button class="ed-node room ${sel.r === ri && sel.q < 0 ? 'on' : ''}" data-sel="${ri}:-1"><b>${U.esc(r.code)}</b> ${U.esc(r.title)}</button>
        ${r.questions.map((q, qi) => `<button class="ed-node ${sel.r === ri && sel.q === qi ? 'on' : ''}" data-sel="${ri}:${qi}">Q${qi + 1}. ${U.esc(q.title || '(제목 없음)')}${q.image ? ' <span class="tag teal">IMG</span>' : ''}</button>`).join('')}
        <button class="ed-add" data-addq="${ri}">+ 문제 추가</button></div>`).join('') +
      `<button class="ed-add" data-ed="addRoom">+ Room 추가</button>`;
  }
  const inp = (label, path, val, extra = '') => `<label class="field">${label}<input data-b="${path}" value="${U.esc(val ?? '')}" ${extra}></label>`;
  const ta = (label, path, val, rows = 3) => `<label class="field">${label}<textarea data-b="${path}" rows="${rows}">${U.esc(val ?? '')}</textarea></label>`;

  function roomForm() {
    const r = C.rooms[sel.r]; if (!r) return '';
    const pieces = r.questions.map(q => q.codePiece || '').join('');
    const sortS = s => String(s).toUpperCase().replace(/\s/g, '').split('').sort().join('');
    const ok = sortS(pieces) === sortS(r.password || '');
    const ci = r.caseInfo || {};
    return `<h3>Room 설정</h3>
      <div class="g2">${inp('Room 코드 (표시용)', 'code', r.code)}${inp('Room 제목', 'title', r.title)}</div>
      ${inp('부제', 'subtitle', r.subtitle)}
      ${ta('미션 목표', 'objective', r.objective, 2)}
      ${inp('교육 내용 (쉼표로 구분)', 'topics', (r.topics || []).join(', '), 'data-t="csv"')}
      <div class="g2">${inp('잠금장치 암호', 'password', r.password)}${inp('암호 단서', 'lockClue', r.lockClue)}</div>
      <p class="${ok ? 'ok-note' : 'warn-note'}">문항별 암호 조각: <b>${U.esc(pieces) || '(없음)'}</b> → ${ok ? '암호와 글자 구성이 일치합니다' : '⚠ 암호와 조각의 글자 구성이 다릅니다. 교육생이 암호를 풀 수 없을 수 있습니다.'}</p>
      <details ${r.caseInfo ? 'open' : ''}><summary>Room 공통 환자 사례 (선택 — FINAL BOSS처럼 모든 문항에 같은 사례를 보여줄 때)</summary>
        ${ta('사례 요약', 'caseInfo.summary', ci.summary, 2)}${inp('활력징후 (· 로 구분)', 'caseInfo.vitals', ci.vitals)}${inp('의식/상태', 'caseInfo.mental', ci.mental)}${ta('ECG 소견', 'caseInfo.ecg', ci.ecg, 2)}
      </details>
      <div class="ed-actions"><button class="btn ghost sm" data-ed="roomUp">위로</button><button class="btn ghost sm" data-ed="roomDown">아래로</button><span class="spacer"></span><button class="btn danger sm" data-ed="delRoom">Room 삭제</button></div>`;
  }
  function questionForm() {
    const q = C.rooms[sel.r].questions[sel.q]; if (!q) return '';
    const p = q.patient || {};
    return `<h3>${U.esc(C.rooms[sel.r].code)} · 문제 ${sel.q + 1}</h3>
      <div class="g3">${inp('문제 제목', 'title', q.title)}
        <label class="field">난이도<select data-b="difficulty" data-t="num">${[1, 2, 3].map(d => `<option value="${d}" ${q.difficulty === d ? 'selected' : ''}>${'★'.repeat(d)} (${d})</option>`).join('')}</select></label>
        ${inp('배점', 'points', q.points, 'type="number" min="0" step="10" data-t="num"')}</div>
      ${ta('문제 내용 (판독 소견·질문)', 'stem', q.stem, 4)}
      <div class="img-edit">
        <div class="img-prev">${q.image ? `<img src="${U.esc(q.image)}" alt="미리보기">` : '<span class="muted small">이미지 없음</span>'}</div>
        <div class="img-fields">
          ${inp('ECG 이미지 URL (예: images/stemi_inferior.png)', 'image', q.image && q.image.startsWith('data:') ? '(업로드된 이미지)' : q.image, q.image && q.image.startsWith('data:') ? 'readonly' : '')}
          <div class="row"><label class="btn ghost sm file-btn">이미지 파일 업로드<input type="file" accept="image/*" data-ed="img" hidden></label>${q.image ? '<button class="btn ghost sm" data-ed="imgDel">이미지 제거</button>' : ''}</div>
          <div class="g2">${inp('이미지 캡션', 'imageCaption', q.imageCaption)}${inp('이미지 출처·라이선스', 'imageSource', q.imageSource)}</div>
          <p class="muted small">출처가 확인된 실제 ECG만 등록하세요. 업로드 이미지는 자동으로 최대 1600px로 압축됩니다. 여러 이미지를 쓸 경우 images/ 폴더에 넣고 URL로 지정하는 방식을 권장합니다.</p>
        </div>
      </div>
      <details ${q.patient ? 'open' : ''}><summary>환자 정보 (선택)</summary>
        ${inp('상황 요약', 'patient.summary', p.summary)}${inp('활력징후 (· 로 구분)', 'patient.vitals', p.vitals)}${inp('의식/상태', 'patient.mental', p.mental)}
      </details>
      <h4>선택지 <span class="muted small">— 정답 1개 선택, '위험'은 환자에게 위해가 될 수 있는 선택(감점 대상)</span></h4>
      <div class="ed-opts">${q.options.map((o, i) => `<div class="ed-opt ${q.answer === i ? 'correct' : ''}">
          <label class="radio"><input type="radio" name="ans" value="${i}" ${q.answer === i ? 'checked' : ''} data-ans> 정답</label>
          <div class="ed-opt-body">${inp(`선택지 ${'ABCDEFGH'[i]}`, `options.${i}.text`, o.text)}${inp('오답 시 피드백', `options.${i}.feedback`, o.feedback)}</div>
          <label class="check"><input type="checkbox" data-b="options.${i}.danger" data-t="bool" ${o.danger ? 'checked' : ''}> 위험</label>
          <button class="btn ghost xs" data-delopt="${i}" title="삭제">✕</button></div>`).join('')}
        ${q.options.length < 6 ? '<button class="ed-add" data-ed="addOpt">+ 선택지 추가</button>' : ''}</div>
      ${ta('힌트', 'hint', q.hint, 2)}
      ${ta('해설 (정답 후 표시)', 'explanation', q.explanation, 5)}
      <div class="g2">${inp('암호 조각 (정답 시 획득)', 'codePiece', q.codePiece, 'maxlength="4"')}${inp('참고 문헌/근거', 'reference', q.reference)}</div>
      <div class="ed-actions"><button class="btn ghost sm" data-ed="qUp">위로</button><button class="btn ghost sm" data-ed="qDown">아래로</button><button class="btn ghost sm" data-ed="qDup">복제</button><span class="spacer"></span><button class="btn danger sm" data-ed="delQ">문제 삭제</button></div>`;
  }

  function target() { return sel.q < 0 ? C.rooms[sel.r] : C.rooms[sel.r].questions[sel.q]; }
  function setPath(o, path, v) { const ks = path.split('.'); ks.slice(0, -1).forEach(k => { if (o[k] == null) o[k] = {}; o = o[k]; }); o[ks[ks.length - 1]] = v; }
  function val(e) {
    const t = e.dataset.t;
    if (t === 'bool') return e.checked;
    if (t === 'num') return Number(e.value) || 0;
    if (t === 'csv') return e.value.split(',').map(s => s.trim()).filter(Boolean);
    return e.value;
  }

  function bind() {
    U.$$('[data-b]', el).forEach(e => {
      const evt = e.type === 'checkbox' || e.tagName === 'SELECT' ? 'change' : 'input';
      e.addEventListener(evt, () => { if (e.readOnly) return; setPath(target(), e.dataset.b, val(e)); persist(); });
      e.addEventListener('change', () => { U.$('.ed-tree', el).innerHTML = tree(); bindTree(); if (sel.q < 0 && /password|codePiece/.test(e.dataset.b)) draw(); });
    });
    U.$$('[data-root]', el).forEach(e => e.oninput = () => { C.title = e.value; persist(); });
    U.$$('[data-ans]', el).forEach(e => e.onchange = () => { target().answer = Number(e.value); persist(); draw(); });
    U.$$('[data-delopt]', el).forEach(b => b.onclick = () => {
      const q = target(); if (q.options.length <= 2) return U.toast('선택지는 최소 2개가 필요합니다', 'err');
      const i = Number(b.dataset.delopt); q.options.splice(i, 1);
      if (q.answer === i) q.answer = 0; else if (q.answer > i) q.answer--;
      persist(); draw();
    });
    bindTree();
    U.$$('[data-ed]', el).forEach(b => { const ev = b.tagName === 'INPUT' ? 'onchange' : 'onclick'; b[ev] = e => action(b.dataset.ed, e); });
  }
  function bindTree() {
    U.$$('[data-sel]', el).forEach(b => b.onclick = () => { const [r, q] = b.dataset.sel.split(':').map(Number); sel = { r, q }; draw(); });
    U.$$('[data-addq]', el).forEach(b => b.onclick = () => {
      const ri = Number(b.dataset.addq);
      C.rooms[ri].questions.push(blankQ(ri)); sel = { r: ri, q: C.rooms[ri].questions.length - 1 }; persist(); draw();
    });
    U.$$('[data-root]', el).forEach(e => e.oninput = () => { C.title = e.value; persist(); });
    const ar = U.$('[data-ed="addRoom"]', el); if (ar) ar.onclick = () => action('addRoom');
  }
  function blankQ(ri) {
    return { id: 'q' + Date.now().toString(36), title: '새 문제', difficulty: 1, points: 100, stem: '', image: '', imageCaption: '', imageSource: '',
      options: [{ text: '선택지 A', feedback: '', danger: false }, { text: '선택지 B', feedback: '', danger: false }, { text: '선택지 C', feedback: '', danger: false }, { text: '선택지 D', feedback: '', danger: false }],
      answer: 0, hint: '', explanation: '', codePiece: '', reference: '' };
  }
  const move = (a, i, d) => { const j = i + d; if (j < 0 || j >= a.length) return i; [a[i], a[j]] = [a[j], a[i]]; return j; };

  async function action(a, e) {
    const room = C.rooms[sel.r];
    switch (a) {
      case 'apply':
        if (confirm('현재 진행 중인 세션의 문제를 이 내용으로 교체합니다.\n진행 중에 문항 순서·개수를 바꾸면 팀 진행 위치가 어긋날 수 있습니다. 계속할까요?')) await opts.onApply(U.clean(C));
        break;
      case 'exportJs':
        U.download('questions.js', `/* ECG Re:Start 교육 콘텐츠 — 내보낸 날짜 ${new Date().toLocaleString('ko-KR')} */\nwindow.ECG_CONTENT = ${JSON.stringify(C, null, 2)};\n`, 'text/javascript'); break;
      case 'exportJson': U.download('ecg-content.json', JSON.stringify(C, null, 2)); break;
      case 'import': {
        const f = e.target.files[0]; if (!f) return;
        try {
          let txt = await f.text();
          if (!txt.trim().startsWith('{')) txt = txt.slice(txt.indexOf('{'), txt.lastIndexOf('}') + 1);
          const obj = JSON.parse(txt);
          if (!obj.rooms) throw new Error('rooms 항목이 없습니다');
          C = Engine.normalizeContent(obj); sel = { r: 0, q: -1 }; persist(); draw(); U.toast('가져오기 완료');
        } catch (err) { U.toast('가져오기 실패: ' + err.message, 'err'); }
        break;
      }
      case 'reset':
        if (confirm('수정 내용을 삭제하고 content/questions.js의 기본 문제로 되돌립니다.')) { localStorage.removeItem(KEY); C = getContent(); sel = { r: 0, q: -1 }; draw(); U.toast('기본값으로 복원'); }
        break;
      case 'addRoom':
        C.rooms.push({ id: 'room' + Date.now().toString(36), code: `ROOM 0${C.rooms.length + 1}`, title: 'NEW ROOM', subtitle: '', objective: '', topics: [], password: '', lockClue: '', questions: [] });
        sel = { r: C.rooms.length - 1, q: -1 }; persist(); draw(); break;
      case 'delRoom': if (C.rooms.length > 1 && confirm(`${room.code}와 포함된 문제를 모두 삭제합니다.`)) { C.rooms.splice(sel.r, 1); sel = { r: 0, q: -1 }; persist(); draw(); } break;
      case 'roomUp': sel.r = move(C.rooms, sel.r, -1); persist(); draw(); break;
      case 'roomDown': sel.r = move(C.rooms, sel.r, 1); persist(); draw(); break;
      case 'qUp': sel.q = move(room.questions, sel.q, -1); persist(); draw(); break;
      case 'qDown': sel.q = move(room.questions, sel.q, 1); persist(); draw(); break;
      case 'qDup': { const c = U.clone(room.questions[sel.q]); c.id = 'q' + Date.now().toString(36); c.title += ' (복제)'; room.questions.splice(sel.q + 1, 0, c); sel.q++; persist(); draw(); break; }
      case 'delQ': if (confirm('이 문제를 삭제합니다.')) { room.questions.splice(sel.q, 1); sel.q = -1; persist(); draw(); } break;
      case 'addOpt': target().options.push({ text: '', feedback: '', danger: false }); persist(); draw(); break;
      case 'imgDel': target().image = ''; persist(); draw(); break;
      case 'img': {
        const f = e.target.files[0]; if (!f) return;
        try { target().image = await compress(f); persist(); draw(); } catch (err) { U.toast('이미지 처리 실패', 'err'); }
        break;
      }
    }
  }
  function compress(file) {
    return new Promise((res, rej) => {
      const fr = new FileReader();
      fr.onload = () => {
        const img = new Image();
        img.onload = () => {
          const max = 1600, sc = Math.min(1, max / img.width);
          const cv = document.createElement('canvas'); cv.width = Math.round(img.width * sc); cv.height = Math.round(img.height * sc);
          const ctx = cv.getContext('2d'); ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, cv.width, cv.height); ctx.drawImage(img, 0, 0, cv.width, cv.height);
          const out = cv.toDataURL('image/jpeg', 0.85);
          if (out.length > 900000) U.toast('이미지가 큽니다. URL 방식 사용을 권장합니다.', 'err');
          res(out);
        };
        img.onerror = rej; img.src = fr.result;
      };
      fr.onerror = rej; fr.readAsDataURL(file);
    });
  }
  return { mount, getContent, isCustom };
})();
