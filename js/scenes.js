/* =========================================================
 * 방(장면) 배치 — 화면 디자인 계층
 * 콘텐츠(questions.js)는 room.scene 과 question.object 로 여기의 키만 참조합니다.
 * 좌표: x = 왼쪽 %, y = 바닥에서 %, w = 장면 너비 대비 %
 * ========================================================= */
const Scenes = {
  monitoring: {
    name: '모니터링 센터', wall: 'wall-a',
    slots: {
      monitor: { sprite: 'monitor', x: 3, y: 37, w: 24, label: '심전도 모니터' },
      locker: { sprite: 'locker', x: 29, y: 38, w: 15, label: '보안 사물함' },
      printer: { sprite: 'printer', x: 46, y: 30, w: 22, label: 'ECG 출력기' },
      desk: { sprite: 'desk', x: 6, y: 7, w: 42, label: '스테이션 책상' },
      poster: { sprite: 'poster', x: 58, y: 62, w: 12, label: '벽 포스터' },
      clock: { sprite: 'clock', x: 47, y: 80, w: 8, label: '벽시계' },
      plant: { sprite: 'plant', x: 56, y: 6, w: 13, label: '화분' }
    },
    door: { x: 73, y: 38, w: 24 }, start: 72
  },
  resus: {
    name: '소생실', wall: 'wall-b',
    slots: {
      bed: { sprite: 'bed', x: 22, y: 36, w: 42, label: '1번 소생 베드' },
      monitor: { sprite: 'monitor', x: 2, y: 40, w: 20, label: '환자 모니터' },
      defib: { sprite: 'defib', x: 52, y: 14, w: 19, label: '제세동기' },
      crashcart: { sprite: 'crashcart', x: 8, y: 6, w: 18, label: '크래시 카트' },
      cabinet: { sprite: 'cabinet', x: 32, y: 6, w: 17, label: '응급 약품장' },
      poster: { sprite: 'poster', x: 62, y: 64, w: 11, label: 'CPR 포스터' },
      board: { sprite: 'board', x: 6, y: 74, w: 24, label: '근무 보드' },
      clock: { sprite: 'clock', x: 40, y: 82, w: 8, label: '벽시계' }
    },
    door: { x: 74, y: 38, w: 23 }, start: 78
  },
  reading: {
    name: '판독실', wall: 'wall-c',
    slots: {
      lightbox: { sprite: 'lightbox', x: 4, y: 58, w: 34, label: '12유도 판독 스크린' },
      printer: { sprite: 'printer', x: 44, y: 34, w: 21, label: '12유도 기록기' },
      desk: { sprite: 'desk', x: 4, y: 8, w: 40, label: '판독 책상', deco: true },
      computer: { sprite: 'computer', x: 13, y: 26, w: 19, label: '판독 컴퓨터' },
      filecab: { sprite: 'filecab', x: 50, y: 6, w: 15, label: '서류함' },
      board: { sprite: 'board', x: 42, y: 66, w: 28, label: '화이트보드' },
      plant: { sprite: 'plant', x: 2, y: 34, w: 11, label: '화분' }
    },
    door: { x: 74, y: 38, w: 23 }, start: 72
  },
  bay: {
    name: '7번 베드', wall: 'wall-d',
    slots: {
      bed: { sprite: 'bed', x: 20, y: 34, w: 46, label: '7번 베드 환자' },
      monitor: { sprite: 'monitor', x: 1, y: 40, w: 20, label: '12유도 모니터' },
      phone: { sprite: 'phone', x: 54, y: 70, w: 11, label: '응급 호출 전화' },
      crashcart: { sprite: 'crashcart', x: 48, y: 6, w: 18, label: '크래시 카트' },
      defib: { sprite: 'defib', x: 8, y: 6, w: 20, label: '제세동기·조율기' },
      clock: { sprite: 'clock', x: 36, y: 82, w: 8, label: '벽시계' },
      poster: { sprite: 'poster', x: 22, y: 66, w: 11, label: '안내문' }
    },
    door: { x: 74, y: 38, w: 23, label: '심도자실 게이트' }, start: 76
  }
};
