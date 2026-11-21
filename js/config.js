/* =========================================================
 * ECG Re:Start — 환경 설정
 * ---------------------------------------------------------
 * MODE
 *   'demo'     : 백엔드 없이 시연. 같은 브라우저의 여러 탭끼리만 데이터가 공유됩니다.
 *                (강사 탭 1개 + 교육생 탭 여러 개로 리허설)
 *   'firebase' : Firebase Realtime Database로 여러 스마트폰·PC 간 실시간 공유.
 *                아래 FIREBASE 값을 채워야 합니다. (README.md 참고)
 *
 * firebase로 설정했는데 값이 비어 있거나 연결에 실패하면 자동으로 DEMO MODE로 실행됩니다.
 * ========================================================= */
window.APP_CONFIG = {
  MODE: 'demo',

  FIREBASE: {
    apiKey: '',
    authDomain: '',
    databaseURL: '',      // 예: https://ecg-restart-default-rtdb.asia-southeast1.firebasedatabase.app
    projectId: '',
    storageBucket: '',
    messagingSenderId: '',
    appId: ''
  },

  DEFAULT_DURATION_MIN: 20,

  /* 점수 규칙 — 강의 성격에 맞게 조정하세요 */
  SCORING: {
    firstTry: 1.0,        // 1차 시도 정답: 배점의 100%
    secondTry: 0.5,       // 2차 시도 정답: 50%
    laterTry: 0.2,        // 3차 이후 정답: 20%
    hintRate: 0.3,        // 힌트 사용 시 해당 문항 배점의 30% 차감
    dangerPenalty: 50,    // 환자에게 위해가 될 수 있는 선택지(위험 판단) 선택 시 감점
    passwordPenalty: 10,  // 잠금장치 암호 오입력 시 감점
    timeBonusMax: 300     // 제한시간 내 전체 완료 시 최대 시간 보너스 (남은 시간 비율만큼)
  }
};
