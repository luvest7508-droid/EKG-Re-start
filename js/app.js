/* 진입점 · 라우팅
 *   ?role=host               → 강사용 대시보드
 *   ?role=player&s=1234      → 교육생 화면 (QR 코드가 이 주소를 담습니다)
 *   (파라미터 없음)            → 시작 화면 */
(async () => {
  await Sync.init();
  const role = U.params.get('role');
  if (role === 'host') return Host.start();
  if (role === 'player' || U.params.get('s')) return Player.start();

  document.body.className = 'player';
  U.$('#app').innerHTML = `<section class="screen center landing city-bg">
    <div class="title-block">
      <div class="hero-row">${['nurse', 'doctor', 'hero'].map((c, i) => Pix.img(Pix.character(c, i === 1 ? 'happy' : 'normal'), i === 1 ? 5 : 4, 'bob')).join('')}</div>
      <h1 class="title">ECG <span>Re:Start</span></h1>
      <p class="subtitle">THE ECG ESCAPE ROOM</p>
      <div class="mission-tag"><i></i>MISSION · SAVE THE PATIENT</div>
    </div>
    <div class="landing-cards">
      <a class="glass land-card" href="?role=player"><div class="label">PARTICIPANT</div><h3>교육생 참여</h3><p class="muted">스마트폰으로 팀명을 입력하고 미션에 참여합니다.</p></a>
      <a class="glass land-card" href="?role=host"><div class="label">INSTRUCTOR</div><h3>강사용 화면</h3><p class="muted">PC·프로젝터에서 세션을 만들고 진행을 관리합니다.</p></a>
    </div>
    <p class="mode-note">${Sync.mode === 'demo' ? '<b>DEMO MODE</b> · 백엔드 미연결 — 같은 브라우저의 탭끼리만 연결됩니다' : '<b>LIVE</b> · Firebase 실시간 연결'}</p>
    </section>`;
})();
