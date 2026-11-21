/* =========================================================
 * 게임 규칙 엔진 — 화면과 무관한 순수 로직 (점수, 진행, 순위)
 * 팀 진행 단계(stage): start → room-intro → question → lock → (다음 room-intro …) → done
 * ========================================================= */
const Engine = (() => {
  const DEF = { firstTry: 1, secondTry: 0.5, laterTry: 0.2, hintRate: 0.3, dangerPenalty: 50, passwordPenalty: 10, timeBonusMax: 300 };
  const scoring = () => Object.assign({}, DEF, (window.APP_CONFIG || {}).SCORING || {});
  /** Firebase가 배열을 객체로 돌려주거나 빈 배열을 지우는 경우 보정 */
  const arr = v => Array.isArray(v) ? v.filter(x => x != null) : (v && typeof v === 'object' ? Object.keys(v).sort((a, b) => a - b).map(k => v[k]) : []);

  function normalizeContent(c) {
    c = c || {};
    c.rooms = arr(c.rooms).map(r => {
      r.topics = arr(r.topics); r.props = arr(r.props);
      r.questions = arr(r.questions).map(q => {
        q.options = arr(q.options).map(o => ({ text: o.text || '', feedback: o.feedback || '', danger: !!o.danger }));
        q.answer = Number(q.answer) || 0;
        q.points = Number(q.points) || 100;
        q.difficulty = Number(q.difficulty) || 1;
        return q;
      });
      return r;
    });
    return c;
  }
  function normalizeTeam(t) {
    t = t || {};
    t.answers = t.answers || {};
    Object.values(t.answers).forEach(a => { a.wrong = arr(a.wrong).map(Number); a.attempts = Number(a.attempts) || 0; a.points = Number(a.points) || 0; });
    ['score', 'hintsUsed', 'wrong', 'danger', 'lockFails', 'timeBonus', 'roomIndex', 'qIndex', 'finishedAt', 'joinedAt'].forEach(k => { t[k] = Number(t[k]) || 0; });
    t.stage = t.stage || 'start';
    return t;
  }
  const rooms = c => (c && c.rooms) || [];
  function allQuestions(c) {
    const out = [];
    rooms(c).forEach((r, ri) => r.questions.forEach((q, qi) => out.push({ room: r, ri, q, qi })));
    return out;
  }
  function newTeam(name, uid, character) {
    return { name, uid, character: character || 'doctor', joinedAt: Sync.now(), stage: 'start', roomIndex: 0, qIndex: 0, score: 0, hintsUsed: 0, wrong: 0, danger: 0, lockFails: 0, timeBonus: 0, finishedAt: 0, answers: {} };
  }
  function current(t, c) { const room = rooms(c)[t.roomIndex]; return { room, q: room && room.questions[t.qIndex] }; }
  function ans(t, qid) {
    t.answers = t.answers || {};
    if (!t.answers[qid]) t.answers[qid] = { attempts: 0, wrong: [], hint: false, correct: false, firstTry: false, points: 0, danger: 0 };
    return t.answers[qid];
  }

  /** 선택지 선택 → 결과 반환 (팀 객체를 직접 수정) */
  function pick(t, c, idx) {
    const { q } = current(t, c); if (!q) return null;
    const a = ans(t, q.id); if (a.correct || a.wrong.includes(idx)) return null;
    const S = scoring(); const opt = q.options[idx] || {};
    a.attempts++;
    if (idx === q.answer) {
      let m = a.attempts === 1 ? S.firstTry : a.attempts === 2 ? S.secondTry : S.laterTry;
      if (a.hint) m = Math.max(0, m - S.hintRate);
      a.points = Math.round(q.points * m);
      a.correct = true; a.firstTry = a.attempts === 1;
      t.score += a.points;
      return { correct: true, points: a.points, opt };
    }
    a.wrong.push(idx); t.wrong++;
    if (opt.danger) { a.danger++; t.danger++; t.score -= S.dangerPenalty; return { correct: false, danger: true, points: -S.dangerPenalty, opt }; }
    return { correct: false, danger: false, points: 0, opt };
  }
  function hint(t, c) { const { q } = current(t, c); const a = ans(t, q.id); if (!a.hint && !a.correct) { a.hint = true; t.hintsUsed++; } }
  function afterCorrect(t, c) {
    const { room } = current(t, c);
    if (t.qIndex < room.questions.length - 1) { t.qIndex++; t.stage = 'question'; } else { t.stage = 'lock'; }
  }
  const norm = s => String(s || '').replace(/\s+/g, '').toUpperCase();
  function checkPassword(room, input) { return !!room && norm(input) === norm(room.password); }
  function failPassword(t) { t.lockFails++; t.score -= scoring().passwordPenalty; }
  function unlock(t, c, meta) {
    if (t.roomIndex < rooms(c).length - 1) { t.roomIndex++; t.qIndex = 0; t.stage = 'room-intro'; return; }
    t.stage = 'done'; t.finishedAt = Sync.now();
    const rem = remaining(meta);
    if (meta && meta.durationSec && rem > 0) { t.timeBonus = Math.round(scoring().timeBonusMax * rem / meta.durationSec); t.score += t.timeBonus; }
  }
  /** 남은 시간(초) — 일시정지 누적시간 반영 */
  function remaining(m) {
    if (!m) return 0;
    if (!m.startedAt) return m.durationSec || 0;
    const end = m.status === 'paused' ? (m.pausedAt || Sync.now()) : m.status === 'ended' && m.endedAt ? m.endedAt : Sync.now();
    const el = (end - m.startedAt - (m.pausedTotalMs || 0)) / 1000;
    return Math.max(0, (m.durationSec || 0) - el);
  }
  const solved = (t, c) => allQuestions(c).filter(x => t.answers[x.q.id] && t.answers[x.q.id].correct).length;
  const firstTryCount = (t, c) => allQuestions(c).filter(x => t.answers[x.q.id] && t.answers[x.q.id].firstTry).length;
  function location(t, c) {
    if (t.stage === 'done') return 'MISSION COMPLETE';
    if (t.stage === 'start') return '대기 · START';
    const r = rooms(c)[t.roomIndex]; if (!r) return '-';
    if (t.stage === 'room-intro') return `${r.code} 입장`;
    if (t.stage === 'lock') return `${r.code} 잠금장치`;
    return `${r.code} · Q${t.qIndex + 1}`;
  }
  function ranking(teams) {
    return Object.entries(teams || {}).map(([id, t]) => Object.assign({ id }, normalizeTeam(t)))
      .sort((a, b) => b.score - a.score || (a.finishedAt || 9e15) - (b.finishedAt || 9e15) || a.joinedAt - b.joinedAt);
  }
  return { scoring, normalizeContent, normalizeTeam, rooms, allQuestions, newTeam, current, ans, pick, hint, afterCorrect, checkPassword, failPassword, unlock, remaining, solved, firstTryCount, location, ranking };
})();
