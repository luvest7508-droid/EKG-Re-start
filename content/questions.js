/* =========================================================
 * ECG Re:Start — 교육 콘텐츠 (화면 코드와 분리된 문제 데이터)
 * ---------------------------------------------------------
 * ⚠ 샘플 문항입니다. 실제 교육 전 담당 교육자/전문의 검토가 필요합니다.
 *   - 판독 소견은 교과서적 진단 기준을 '텍스트'로 기술했습니다(가상 환자 상황 포함).
 *   - ECG 이미지는 포함하지 않았습니다. image 항목에 출처·라이선스가 확인된 실제 ECG 이미지를 등록하세요.
 *   - 약물 용량·알고리즘은 AHA ACLS 가이드라인 기준이며, 기관 프로토콜을 우선합니다.
 *
 * 수정 방법: 강사 화면 [문제 관리]에서 편집 → [questions.js 내보내기] 파일로 이 파일을 교체.
 *
 * 구조
 *  story / ending : 오프닝·엔딩 스토리
 *  room  : id, code, title, place(장소명), scene(장면: monitoring|resus|reading|bay — js/scenes.js),
 *          story(입장 스토리), subtitle, objective, topics[], password(출입문 암호), lockClue(암호 단서),
 *          caseInfo{summary, vitals, mental, ecg}(선택), props[{object, text}](조사하면 단서가 나오는 사물)
 *  question : id, title, difficulty(1~3), points, object(이 문제가 숨겨진 사물 — 장면의 사물 키),
 *          item{name, icon(key|card|note|strip|chip)}(풀면 얻는 아이템 → 다음 사물을 엶),
 *          stem, patient{summary, vitals, mental}, image, imageCaption, imageSource,
 *          options[{text, feedback, danger}], answer(정답 index, 0부터), hint, explanation, codePiece(암호 조각), reference
 * ========================================================= */
window.ECG_CONTENT = {
  "title": "ECG Re:Start 기본 샘플 세트",
  "version": "2026-11-mvp",
  "reviewNote": "샘플 문항 — 교육 전 검토 필요",
  "rooms": [
    {
      "id": "room1",
      "code": "ROOM 01",
      "title": "RHYTHM HUNTER",
      "subtitle": "기본 심전도 리듬 판독",
      "objective": "모니터 리듬의 핵심 특징(규칙성·P파·QRS 폭·심박수)으로 리듬을 판독한다.",
      "topics": [
        "Normal Sinus Rhythm",
        "Atrial Fibrillation",
        "Atrial Flutter",
        "SVT",
        "Ventricular Tachycardia",
        "Ventricular Fibrillation"
      ],
      "password": "BEAT",
      "lockClue": "획득한 4개의 조각으로 \"심장 박동\"을 뜻하는 영어 단어를 완성하세요.",
      "questions": [
        {
          "id": "r1q1",
          "title": "불규칙한 리듬의 정체",
          "difficulty": 1,
          "points": 100,
          "object": "monitor",
          "item": {
            "name": "출력기 카드키",
            "icon": "card"
          },
          "stem": "RR 간격이 \"불규칙하게 불규칙(irregularly irregular)\"하고, 뚜렷한 P파 없이 기저선이 미세하게 흔들린다(f파). QRS 폭은 좁다(<0.12초). 가장 적절한 판독은?",
          "image": "",
          "imageCaption": "",
          "imageSource": "",
          "options": [
            {
              "text": "Normal Sinus Rhythm",
              "feedback": "NSR은 모든 QRS 앞에 일정한 모양의 P파가 있고, RR 간격이 규칙적이며 심박수 60–100회/분입니다."
            },
            {
              "text": "Atrial Fibrillation",
              "feedback": ""
            },
            {
              "text": "Atrial Flutter",
              "feedback": "Flutter는 톱니 모양의 규칙적인 F파가 특징이며, 전도비가 일정하면 RR도 규칙적입니다."
            },
            {
              "text": "SVT",
              "feedback": "SVT는 RR이 규칙적인 좁은 QRS 빈맥입니다."
            }
          ],
          "answer": 1,
          "hint": "RR 간격을 재보세요. 일정한 패턴이 있나요? P파는 보이나요?",
          "explanation": "Atrial fibrillation: ① RR 간격 절대 불규칙 ② 뚜렷한 P파 소실, 미세한 f파 ③ 대개 좁은 QRS.\n간호 포인트: 심실 반응 속도(rate control 필요 여부), 혈역학적 안정성, 발생 시점(48시간 기준)과 항응고 여부 확인 — 혈전색전증 위험.",
          "codePiece": "B",
          "reference": "AHA ACLS Tachycardia Algorithm"
        },
        {
          "id": "r1q2",
          "title": "톱니 모양의 기저선",
          "difficulty": 1,
          "points": 100,
          "object": "printer",
          "item": {
            "name": "책상 서랍 열쇠",
            "icon": "key"
          },
          "stem": "리듬은 규칙적이다. II, III, aVF에서 톱니 모양(sawtooth)의 심방파가 보이고 심방파 속도는 약 300회/분, 심실 반응은 약 150회/분이다. QRS는 좁다. 가장 적절한 판독은?",
          "image": "",
          "imageCaption": "",
          "imageSource": "",
          "options": [
            {
              "text": "Atrial Fibrillation",
              "feedback": "AF는 RR이 불규칙하고 규칙적인 톱니파가 없습니다."
            },
            {
              "text": "Atrial Flutter (2:1 전도)",
              "feedback": ""
            },
            {
              "text": "Sinus Tachycardia",
              "feedback": "동빈맥은 각 QRS 앞에 정상 P파가 하나씩 있고 톱니파가 없습니다."
            },
            {
              "text": "Ventricular Tachycardia",
              "feedback": "QRS가 좁으므로 심실성 빈맥 가능성은 낮습니다."
            }
          ],
          "answer": 1,
          "hint": "심방파 300회/분, 심실 150회/분 — 비율을 계산해 보세요.",
          "explanation": "Atrial flutter: 하벽유도(II, III, aVF)에서 뚜렷한 톱니형 F파, 심방율 약 250–350회/분.\n2:1 전도 시 심실 반응이 약 150회/분 → 심박수 150 전후의 규칙적인 좁은 QRS 빈맥에서는 반드시 flutter를 의심합니다.",
          "codePiece": "E",
          "reference": "AHA ACLS Tachycardia Algorithm"
        },
        {
          "id": "r1q3",
          "title": "갑자기 시작된 두근거림",
          "difficulty": 2,
          "points": 150,
          "object": "desk",
          "item": {
            "name": "사물함 비밀번호 메모",
            "icon": "note"
          },
          "stem": "갑자기 시작된 두근거림으로 내원. 규칙적인 좁은 QRS 빈맥, 심박수 약 190회/분, P파는 QRS에 묻혀 보이지 않는다. 혈압 124/78 mmHg, 의식 명료. 가장 적절한 판독은?",
          "patient": {
            "summary": "갑작스런 두근거림",
            "vitals": "BP 124/78 · HR 190 · RR 18 · SpO₂ 98%",
            "mental": "의식 명료"
          },
          "image": "",
          "imageCaption": "",
          "imageSource": "",
          "options": [
            {
              "text": "Sinus Tachycardia",
              "feedback": "동빈맥은 대개 서서히 시작·종료되고 P파가 보이며 발열·통증·탈수 등 원인이 동반됩니다."
            },
            {
              "text": "SVT (PSVT)",
              "feedback": ""
            },
            {
              "text": "Atrial Fibrillation",
              "feedback": "리듬이 규칙적이므로 AF가 아닙니다."
            },
            {
              "text": "Ventricular Tachycardia",
              "feedback": "QRS가 좁으므로 VT 가능성은 낮습니다."
            }
          ],
          "answer": 1,
          "hint": "규칙성 + 좁은 QRS + 갑작스런 시작",
          "explanation": "PSVT(재진입성 SVT): 규칙적인 좁은 QRS 빈맥(대개 150–250회/분), 갑작스런 시작·종료, P파가 보이지 않거나 QRS 직후에 위치.\n안정 시: 미주신경자극 → 아데노신 6mg 급속 정주 후 생리식염수 flush(필요 시 12mg). 불안정 시: 동기화 심율동전환.",
          "codePiece": "A",
          "reference": "AHA ACLS Tachycardia Algorithm"
        },
        {
          "id": "r1q4",
          "title": "넓은 QRS 빈맥",
          "difficulty": 2,
          "points": 150,
          "object": "locker",
          "item": {
            "name": "출입문 해제 칩",
            "icon": "chip"
          },
          "stem": "넓은 QRS(≥0.12초)가 규칙적이고 모양이 일정한 빈맥, 심박수 약 170회/분. P파와 QRS의 관계는 확인되지 않는다. 가장 적절한 판독은?",
          "image": "",
          "imageCaption": "",
          "imageSource": "",
          "options": [
            {
              "text": "Ventricular Fibrillation",
              "feedback": "VF는 무질서하고 불규칙한 파형으로 식별 가능한 QRS가 없습니다."
            },
            {
              "text": "Monomorphic Ventricular Tachycardia",
              "feedback": ""
            },
            {
              "text": "Atrial Fibrillation",
              "feedback": "리듬이 규칙적이고 QRS가 넓습니다."
            },
            {
              "text": "Normal Sinus Rhythm",
              "feedback": "심박수가 170회/분이며 QRS가 넓습니다."
            }
          ],
          "answer": 1,
          "hint": "QRS 폭과 모양이 모두 일정합니다.",
          "explanation": "단형성 VT: 넓고 모양이 일정한 QRS의 규칙적 빈맥. 넓은 QRS 빈맥은 감별되기 전까지 VT로 간주합니다.\n다음 단계: 즉시 맥박·의식·혈압 확인 → 맥박 유무와 안정성에 따라 처치가 달라집니다(ROOM 02).",
          "codePiece": "T",
          "reference": "AHA ACLS Tachycardia Algorithm"
        }
      ],
      "scene": "monitoring",
      "place": "모니터링 센터",
      "story": "HEART-OS가 모니터링 센터 출입문을 잠갔다.\n화면에 뜬 리듬을 판독할 때마다 다음 장치가 열린다.\n단서를 모두 모아 출입문 다이얼 자물쇠를 풀어라!",
      "props": [
        {
          "object": "poster",
          "text": "포스터에 적힌 메모 — \"규칙적인 리듬의 심박수 빠르게 세기: 300 ÷ (R–R 사이 큰 칸 수)\""
        },
        {
          "object": "clock",
          "text": "초침이 멈추지 않고 돌아간다. 서두르자!"
        },
        {
          "object": "plant",
          "text": "잎이 싱싱한 화분이다. 화분 밑에는 아무것도 없다."
        }
      ]
    },
    {
      "id": "room2",
      "code": "ROOM 02",
      "title": "DANGER ZONE",
      "subtitle": "위험한 부정맥과 응급상황 구분",
      "objective": "심전도와 환자 상태(맥박·의식·활력징후)를 함께 보고 즉각적 처치를 결정한다.",
      "topics": [
        "VT with pulse / pulseless VT",
        "VF",
        "Asystole",
        "PEA",
        "AV block",
        "Unstable bradycardia"
      ],
      "password": "SHOCK",
      "lockClue": "5개의 조각을 배열해 \"쇼크\"를 뜻하는 영어 단어를 완성하세요.",
      "questions": [
        {
          "id": "r2q1",
          "title": "맥박이 있는 VT",
          "difficulty": 2,
          "points": 200,
          "object": "bed",
          "item": {
            "name": "제세동기 잠금 해제 키",
            "icon": "key"
          },
          "stem": "모니터: 넓은 QRS의 규칙적 빈맥(단형성 VT). 환자 상태를 보고 가장 우선적인 처치를 고르세요.",
          "patient": {
            "summary": "62세 남성, 흉통과 호흡곤란",
            "vitals": "BP 76/48 · HR 180 · RR 26 · SpO₂ 91%",
            "mental": "혼미(confused) · 경동맥 맥박 촉지됨"
          },
          "image": "",
          "imageCaption": "",
          "imageSource": "",
          "options": [
            {
              "text": "즉시 비동기 제세동(defibrillation)",
              "feedback": "맥박이 있는 단형성 VT에 비동기 충격을 주면 R-on-T로 VF가 유발될 수 있습니다. SYNC 모드가 필요합니다.",
              "danger": true
            },
            {
              "text": "동기화 심율동전환(synchronized cardioversion)",
              "feedback": ""
            },
            {
              "text": "아미오다론 정주 후 30분간 반응 관찰",
              "feedback": "항부정맥제는 \"안정적인\" 넓은 QRS 빈맥에서 고려합니다. 불안정 환자에서 처치 지연은 위험합니다."
            },
            {
              "text": "경과관찰하며 12유도 ECG 재검",
              "feedback": "저혈압·의식변화가 있는 불안정 VT에서 관찰은 심정지로 이어질 수 있습니다.",
              "danger": true
            }
          ],
          "answer": 1,
          "hint": "① 맥박이 있는가? ② 불안정 징후(저혈압·의식변화·쇼크·흉통·심부전)가 있는가?",
          "explanation": "맥박이 있는 VT + 불안정 징후(저혈압, 급성 의식변화, 쇼크 징후, 허혈성 흉통, 급성 심부전) → 즉시 동기화 심율동전환.\n간호: 제세동 패드 부착, SYNC 모드 확인(매 충격 전 재확인), 의식이 있으면 진정 고려하되 처치를 지연하지 않음, 기도·흡인 준비. 맥박 소실 시 즉시 CPR·제세동으로 전환.",
          "codePiece": "S",
          "reference": "AHA ACLS Tachycardia with a Pulse Algorithm"
        },
        {
          "id": "r2q2",
          "title": "갑작스러운 무반응",
          "difficulty": 2,
          "points": 200,
          "object": "defib",
          "item": {
            "name": "크래시 카트 봉인 태그",
            "icon": "note"
          },
          "stem": "모니터 관찰 중 환자가 갑자기 반응이 없다. 모니터는 불규칙하고 무질서한 파형으로 식별 가능한 P·QRS·T파가 없다. 판독과 처치로 옳은 것은?",
          "patient": {
            "summary": "모니터링 중 갑작스러운 무반응",
            "vitals": "맥박 촉지 안 됨 · 정상 호흡 없음(헐떡임)",
            "mental": "무반응"
          },
          "image": "",
          "imageCaption": "",
          "imageSource": "",
          "options": [
            {
              "text": "VF — 즉시 CPR 시작, 제세동기 준비되는 대로 비동기 제세동",
              "feedback": ""
            },
            {
              "text": "VF — 동기화 심율동전환",
              "feedback": "VF에는 동기화할 R파가 없어 충격이 지연되거나 전달되지 않습니다.",
              "danger": true
            },
            {
              "text": "Asystole — 에피네프린 투여, 제세동 금지",
              "feedback": "파형이 존재하는 무질서한 리듬은 무수축이 아닌 VF입니다. 제세동 적응 리듬을 놓치게 됩니다.",
              "danger": true
            },
            {
              "text": "Artifact — 리드 재부착 후 모니터 관찰",
              "feedback": "환자가 무반응·무맥이면 artifact 확인보다 CPR이 우선입니다.",
              "danger": true
            }
          ],
          "answer": 0,
          "hint": "환자부터 보세요. 무반응 + 무맥 = 심정지. 이 리듬은 제세동 적응 리듬일까요?",
          "explanation": "VF/무맥성 VT는 제세동 적응 리듬입니다. 고품질 CPR(분당 100–120회, 깊이 5–6cm, 완전 이완, 중단 최소화) + 가능한 빨리 제세동.\n충격 후 즉시 CPR 2분 재개. 에피네프린 1mg은 2번째 충격 이후, 아미오다론 300mg은 3번째 충격 이후 고려(ACLS 심정지 알고리즘).",
          "codePiece": "H",
          "reference": "AHA ACLS Adult Cardiac Arrest Algorithm"
        },
        {
          "id": "r2q3",
          "title": "리듬은 있는데 맥박이 없다",
          "difficulty": 3,
          "points": 200,
          "object": "crashcart",
          "item": {
            "name": "모니터 리셋 칩",
            "icon": "chip"
          },
          "stem": "모니터에는 좁은 QRS의 규칙적 리듬(약 60회/분)이 보인다. 그러나 경동맥 맥박이 촉지되지 않고 환자는 무반응이다. 옳은 판단은?",
          "patient": {
            "summary": "70세 여성, 병동 이송 대기 중 무반응",
            "vitals": "경동맥 맥박 촉지 안 됨",
            "mental": "무반응"
          },
          "image": "",
          "imageCaption": "",
          "imageSource": "",
          "options": [
            {
              "text": "PEA — CPR, 에피네프린 가능한 빨리, 가역적 원인(H’s & T’s) 탐색",
              "feedback": ""
            },
            {
              "text": "정상 리듬 — 의식저하 원인 검사 후 경과관찰",
              "feedback": "모니터 리듬이 정상처럼 보여도 맥박이 없으면 심정지입니다.",
              "danger": true
            },
            {
              "text": "PEA — 즉시 제세동",
              "feedback": "PEA는 제세동 비적응 리듬입니다.",
              "danger": true
            },
            {
              "text": "동서맥 — 아트로핀 1mg 투여",
              "feedback": "맥박이 없으므로 서맥 알고리즘이 아닌 심정지 알고리즘을 적용합니다. 아트로핀은 PEA에 권고되지 않습니다."
            }
          ],
          "answer": 0,
          "hint": "\"리듬\"이 아니라 \"맥박\"이 심정지를 결정합니다.",
          "explanation": "PEA: 모니터상 조직화된 전기 활동이 있으나 맥박이 없는 상태 → 제세동 비적응.\n고품질 CPR + 에피네프린 1mg 가능한 빨리(3–5분 간격). 가역적 원인 탐색 — H’s(저혈량, 저산소, 수소이온/산증, 고·저칼륨, 저체온) & T’s(긴장성 기흉, 심낭압전, 독성, 폐색전, 관상동맥 혈전).",
          "codePiece": "O",
          "reference": "AHA ACLS Adult Cardiac Arrest Algorithm"
        },
        {
          "id": "r2q4",
          "title": "Flat line",
          "difficulty": 2,
          "points": 150,
          "object": "monitor",
          "item": {
            "name": "약품장 열쇠",
            "icon": "key"
          },
          "stem": "무반응·무맥 환자의 모니터가 평탄선(flat line)을 보인다. 가장 적절한 대응은?",
          "patient": {
            "summary": "심정지 환자",
            "vitals": "맥박 촉지 안 됨 · 호흡 없음",
            "mental": "무반응"
          },
          "image": "",
          "imageCaption": "",
          "imageSource": "",
          "options": [
            {
              "text": "즉시 제세동",
              "feedback": "무수축은 제세동 비적응 리듬입니다. 불필요한 충격은 CPR을 중단시킵니다.",
              "danger": true
            },
            {
              "text": "CPR 지속, 에피네프린 1mg 가능한 빨리, 리드 연결·감도(gain)·다른 유도에서 평탄선 확인",
              "feedback": ""
            },
            {
              "text": "경피적 심박조율(TCP) 시작",
              "feedback": "무수축 심정지에서 TCP는 권고되지 않습니다."
            },
            {
              "text": "아트로핀 1mg 반복 투여",
              "feedback": "아트로핀은 무수축/PEA에 일상적으로 권고되지 않습니다."
            }
          ],
          "answer": 1,
          "hint": "평탄선이 진짜 무수축인지 확인하는 방법도 함께 생각해 보세요.",
          "explanation": "Asystole: 제세동 비적응 리듬. 고품질 CPR + 에피네프린 1mg 가능한 빨리(3–5분 간격), 가역적 원인 탐색.\n평탄선 확인: 리드 연결 상태, 감도(gain) 상향, 다른 유도에서 확인(미세 VF 감별).",
          "codePiece": "C",
          "reference": "AHA ACLS Adult Cardiac Arrest Algorithm"
        },
        {
          "id": "r2q5",
          "title": "느리고 위험한 리듬",
          "difficulty": 3,
          "points": 200,
          "object": "cabinet",
          "item": {
            "name": "소생실 출입 카드",
            "icon": "card"
          },
          "stem": "P파는 규칙적(약 80회/분)이고 QRS도 규칙적(약 36회/분)이지만 P파와 QRS가 서로 무관하게 나타난다. QRS는 넓다. 판독과 처치로 가장 적절한 것은?",
          "patient": {
            "summary": "78세 여성, 어지러움과 식은땀",
            "vitals": "BP 72/40 · HR 36 · RR 20 · SpO₂ 95%",
            "mental": "기면(drowsy)"
          },
          "image": "",
          "imageCaption": "",
          "imageSource": "",
          "options": [
            {
              "text": "2도 1형 방실차단 — 경과관찰",
              "feedback": "2도 1형(Wenckebach)은 PR이 점점 길어지다 QRS가 탈락하는 양상입니다. 또한 환자는 불안정합니다.",
              "danger": true
            },
            {
              "text": "3도(완전) 방실차단 + 불안정 서맥 — 아트로핀 1mg IV, 효과 없으면 경피적 심박조율 또는 도파민/에피네프린 지속주입",
              "feedback": ""
            },
            {
              "text": "3도 방실차단 — 아데노신 6mg 급속 정주",
              "feedback": "아데노신은 방실결절 전도를 차단합니다. 서맥·방실차단에서는 위험합니다.",
              "danger": true
            },
            {
              "text": "1도 방실차단 — 12유도 재검 후 외래 추적",
              "feedback": "1도 방실차단은 PR 연장만 있고 모든 P파가 전도됩니다. 불안정 징후를 놓치고 있습니다.",
              "danger": true
            }
          ],
          "answer": 1,
          "hint": "P파와 QRS가 각자 따로 뛰고 있습니다(AV dissociation).",
          "explanation": "완전방실차단: 심방과 심실이 독립적으로 박동. 저혈압·의식변화·쇼크 징후·흉통·심부전 동반 시 불안정 서맥.\n아트로핀 1mg IV(3–5분 간격, 최대 3mg). 넓은 QRS의 완전방실차단은 아트로핀 반응이 낮을 수 있으므로 TCP 패드 부착과 도파민 또는 에피네프린 지속주입을 지체 없이 준비. 전문가 상담(경정맥 조율).",
          "codePiece": "K",
          "reference": "AHA ACLS Adult Bradycardia Algorithm"
        }
      ],
      "scene": "resus",
      "place": "소생실",
      "story": "소생실에 경보음이 울린다. 환자들의 상태가 급변하고 있다.\n리듬만 보고 판단하면 함정에 빠진다.\n맥박과 의식, 활력징후를 먼저 확인하라!",
      "props": [
        {
          "object": "poster",
          "text": "\"고품질 CPR — 분당 100–120회 · 깊이 5–6cm · 완전 이완 · 중단 최소화\""
        },
        {
          "object": "board",
          "text": "근무 보드: \"오늘 나이트 근무 — 일백이 ☕ / 소생실 장비 점검 완료\""
        },
        {
          "object": "clock",
          "text": "시계를 보니 시간이 꽤 흘렀다. 망설일 시간이 없다."
        }
      ]
    },
    {
      "id": "room3",
      "code": "ROOM 03",
      "title": "12-LEAD ECG",
      "subtitle": "12유도 심전도 해석",
      "objective": "ST 분절 변화로 심근경색 위치와 관련 혈관을 추정하고, 위험 패턴을 인지한다.",
      "topics": [
        "STEMI",
        "심근경색 위치",
        "ST segment 변화",
        "Brugada pattern"
      ],
      "password": "LEAD",
      "lockClue": "4개의 조각으로 \"유도(誘導)\"를 뜻하는 영어 단어를 완성하세요.",
      "questions": [
        {
          "id": "r3q1",
          "title": "하벽 유도의 ST 상승",
          "difficulty": 2,
          "points": 150,
          "object": "lightbox",
          "item": {
            "name": "판독 소견지",
            "icon": "strip"
          },
          "stem": "12유도 ECG: II, III, aVF에서 ST 분절 상승, I·aVL에서 ST 분절 하강(reciprocal change). 가장 가능성 높은 경색 부위와 관련 혈관은?",
          "image": "",
          "imageCaption": "※ 실제 12유도 ECG 이미지 등록 필요",
          "imageSource": "",
          "options": [
            {
              "text": "전벽 — LAD",
              "feedback": "전벽은 V1–V4 변화로 나타납니다."
            },
            {
              "text": "하벽 — 주로 RCA",
              "feedback": ""
            },
            {
              "text": "측벽 — LCx",
              "feedback": "측벽은 I, aVL, V5–V6 변화로 나타납니다."
            },
            {
              "text": "정상 변이(조기재분극)",
              "feedback": "상호 하강(reciprocal change)은 정상 변이보다 급성 경색을 시사합니다."
            }
          ],
          "answer": 1,
          "hint": "II, III, aVF는 심장의 어느 면을 바라보는 유도일까요?",
          "explanation": "하벽 STEMI: II, III, aVF ST 상승 + I·aVL 상호 하강. 대부분 RCA(일부 LCx).\nRCA는 동결절·방실결절에 혈류를 공급하는 경우가 많아 서맥·방실차단이 동반될 수 있음 → 우측 흉부유도(V4R)로 우심실 침범 확인.\nSTEMI 기준: 인접한 2개 유도 이상의 새로운 ST 상승(V2–V3는 연령·성별 기준 별도).",
          "codePiece": "L",
          "reference": "ACC/AHA STEMI·ACS Guideline / 4th Universal Definition of MI"
        },
        {
          "id": "r3q2",
          "title": "흉부 유도의 ST 상승",
          "difficulty": 2,
          "points": 150,
          "object": "printer",
          "item": {
            "name": "전산 로그인 카드",
            "icon": "card"
          },
          "stem": "12유도 ECG: V1–V4에서 ST 분절 상승. 가장 가능성 높은 경색 부위와 관련 혈관은?",
          "image": "",
          "imageCaption": "※ 실제 12유도 ECG 이미지 등록 필요",
          "imageSource": "",
          "options": [
            {
              "text": "하벽 — RCA",
              "feedback": "하벽은 II, III, aVF입니다."
            },
            {
              "text": "후벽 — LCx",
              "feedback": "후벽 경색은 V1–V3의 ST \"하강\"과 큰 R파로 나타나며 V7–V9로 확인합니다."
            },
            {
              "text": "전벽(전중격) — LAD",
              "feedback": ""
            },
            {
              "text": "고측벽 — 대각지/LCx",
              "feedback": "고측벽은 I, aVL입니다."
            }
          ],
          "answer": 2,
          "hint": "V1–V2는 중격, V3–V4는 전벽입니다.",
          "explanation": "유도별 위치: V1–V2 중격, V3–V4 전벽, V5–V6·I·aVL 측벽(I·aVL 고측벽), II·III·aVF 하벽.\n전벽(LAD) 경색은 좌심실 기능 저하, 심인성 쇼크, 치명적 부정맥 위험이 크므로 지속 모니터링과 신속한 재관류 준비가 중요합니다.",
          "codePiece": "E",
          "reference": "ACC/AHA STEMI·ACS Guideline"
        },
        {
          "id": "r3q3",
          "title": "우측 흉부유도의 경고",
          "difficulty": 3,
          "points": 200,
          "object": "computer",
          "item": {
            "name": "서류함 열쇠",
            "icon": "key"
          },
          "stem": "하벽 STEMI 환자의 우측 흉부유도 V4R에서 ST 상승(≥1mm)이 확인되었다. 흉통이 지속된다. 간호 시 가장 주의해야 할 것은?",
          "patient": {
            "summary": "하벽 STEMI, 흉통 지속",
            "vitals": "BP 92/60 · HR 58 · SpO₂ 96%",
            "mental": "명료"
          },
          "image": "",
          "imageCaption": "※ 실제 12유도/우측유도 ECG 이미지 등록 필요",
          "imageSource": "",
          "options": [
            {
              "text": "통증 조절을 위해 니트로글리세린 설하 반복 투여",
              "feedback": "우심실 경색은 전부하 의존적입니다. 질산염은 심한 저혈압을 유발할 수 있습니다.",
              "danger": true
            },
            {
              "text": "우심실 경색 의심 — 질산염·이뇨제 등 전부하 감소 약물 주의, 저혈압 시 수액 처방 확인",
              "feedback": ""
            },
            {
              "text": "폐부종 예방을 위해 furosemide 우선 투여",
              "feedback": "이뇨제는 전부하를 감소시켜 우심실 경색 환자의 저혈압을 악화시킬 수 있습니다.",
              "danger": true
            },
            {
              "text": "베타차단제로 심박수 감소 우선",
              "feedback": "서맥·저혈압 경향이 있는 환자에서 베타차단제는 혈역학을 악화시킬 수 있습니다.",
              "danger": true
            }
          ],
          "answer": 1,
          "hint": "우심실은 무엇에 의존해 심박출량을 유지할까요?",
          "explanation": "우심실 경색: 하벽 STEMI 환자의 상당수에서 동반. 전부하 의존적이므로 질산염·모르핀·이뇨제는 심한 저혈압을 유발할 수 있어 주의(대개 회피 또는 신중 투여).\n하벽 STEMI 확인 시 우측 흉부유도(V4R) 추가 시행을 의사와 협의하고, 저혈압 시 수액 처방을 확인합니다.",
          "codePiece": "A",
          "reference": "ACC/AHA STEMI·ACS Guideline"
        },
        {
          "id": "r3q4",
          "title": "발열과 실신",
          "difficulty": 3,
          "points": 200,
          "object": "filecab",
          "item": {
            "name": "최종 구역 통행 칩",
            "icon": "chip"
          },
          "stem": "30대 남성이 발열 중 실신하여 내원했다. V1–V2에서 궁형(coved) ST 상승(≥2mm)에 이어 음성 T파가 보인다. 가장 적절한 해석은?",
          "patient": {
            "summary": "30대 남성, 발열 중 실신",
            "vitals": "BT 38.9℃ · BP 118/72 · HR 104",
            "mental": "명료"
          },
          "image": "",
          "imageCaption": "※ 실제 12유도 ECG 이미지 등록 필요",
          "imageSource": "",
          "options": [
            {
              "text": "급성 전벽 STEMI",
              "feedback": "STEMI는 해부학적 분포(인접 유도)를 따르는 ST 상승과 상호 변화를 보입니다. V1–V2에 국한된 coved형 + 음성 T파는 다른 패턴을 시사합니다."
            },
            {
              "text": "단순 우각차단(RBBB)",
              "feedback": "RBBB는 V1의 rSR′과 I·V6의 넓은 S파가 특징이며, coved형 ST 상승을 설명하지 못합니다."
            },
            {
              "text": "Brugada type 1 pattern",
              "feedback": ""
            },
            {
              "text": "양성 조기재분극",
              "feedback": "조기재분극은 주로 하측·측벽 유도의 J점 상승으로 나타납니다."
            }
          ],
          "answer": 2,
          "hint": "V1–V2, coved(궁형), 음성 T파, 발열 — 네 가지 단서.",
          "explanation": "Brugada type 1: V1–V2(필요 시 2·3번째 늑간으로 올린 유도)에서 coved형 ST 상승 ≥2mm + 음성 T파.\n실신·다형성 VT/VF·돌연사 위험. 발열이 패턴을 유발·악화시키므로 적극적 해열, 지속 심전도 모니터링, 제세동기 준비, 특정 약물(Na 채널 차단제 등) 주의 — 전문의 상담.",
          "codePiece": "D",
          "reference": "Brugada Syndrome Expert Consensus (HRS/EHRA/APHRS)"
        }
      ],
      "scene": "reading",
      "place": "판독실",
      "story": "판독실에 12유도 심전도 기록이 흩어져 있다.\n각 유도가 심장의 어느 벽을 바라보는지 떠올리면 길이 보인다.",
      "props": [
        {
          "object": "board",
          "text": "화이트보드 메모 — \"12유도 지도: I · aVL · V5–V6 = 측벽 … 나머지는 직접 찾아볼 것!\""
        },
        {
          "object": "plant",
          "text": "화분 옆에 \"STEMI: 인접한 2개 이상 유도의 새로운 ST 상승\"이라고 적힌 쪽지가 붙어 있다."
        }
      ]
    },
    {
      "id": "final",
      "code": "FINAL BOSS",
      "title": "EMERGENCY DECISION",
      "subtitle": "실제 응급실 상황 기반 임상 판단",
      "objective": "증상·활력징후·의식·심전도를 통합해 진단, 상태 평가, 우선순위, 응급간호를 결정한다.",
      "topics": [
        "심전도 진단",
        "환자 상태 평가",
        "우선순위",
        "응급간호 및 처치"
      ],
      "password": "LIFE",
      "lockClue": "마지막 4개의 조각으로 환자에게 되돌려줄 것을 완성하세요.",
      "caseInfo": {
        "summary": "58세 남성. 30분 전 시작된 쥐어짜는 듯한 흉골하 흉통, 식은땀, 오심. 고혈압·흡연력.",
        "vitals": "BP 84/52 · HR 40 · RR 22 · SpO₂ 95%(room air) · BT 36.4℃",
        "mental": "명료하나 어지러움 호소 · 피부 창백·차가움",
        "ecg": "12유도: II, III, aVF ST 상승, I·aVL ST 하강. 리듬: P파 규칙적, P–QRS 관계 없음, 심실 40회/분(좁은 QRS)."
      },
      "questions": [
        {
          "id": "f1",
          "title": "STEP 1 · 심전도 진단",
          "difficulty": 2,
          "points": 200,
          "object": "monitor",
          "item": {
            "name": "진단 확인 메모",
            "icon": "note"
          },
          "stem": "사례의 심전도 소견을 종합한 진단으로 가장 적절한 것은?",
          "image": "",
          "imageCaption": "※ 사례 ECG 이미지 등록 가능",
          "imageSource": "",
          "options": [
            {
              "text": "급성 하벽 STEMI + 완전방실차단",
              "feedback": ""
            },
            {
              "text": "급성 전벽 STEMI + 동서맥",
              "feedback": "전벽은 V1–V4 변화입니다. 또한 P–QRS 관계가 없으므로 동서맥이 아닙니다."
            },
            {
              "text": "NSTEMI + 1도 방실차단",
              "feedback": "인접 유도 ST 상승이 있으므로 STEMI입니다. 1도 방실차단은 모든 P파가 전도됩니다."
            },
            {
              "text": "급성 심낭염 + 동서맥",
              "feedback": "심낭염은 광범위한 오목한 ST 상승과 PR 하강이 특징이며 상호 하강은 드뭅니다."
            }
          ],
          "answer": 0,
          "hint": "ROOM 02와 ROOM 03에서 배운 내용을 합쳐 보세요.",
          "explanation": "II, III, aVF ST 상승 + I·aVL 상호 하강 = 하벽 STEMI. P파와 QRS가 독립적 = 완전방실차단.\n하벽 경색(주로 RCA)은 방실결절 허혈로 방실차단을 동반할 수 있습니다.",
          "codePiece": "L",
          "reference": "ACC/AHA STEMI·ACS Guideline"
        },
        {
          "id": "f2",
          "title": "STEP 2 · 환자 상태 평가",
          "difficulty": 2,
          "points": 200,
          "object": "bed",
          "item": {
            "name": "활력징후 기록지",
            "icon": "strip"
          },
          "stem": "이 환자의 현재 상태 평가로 가장 적절한 것은?",
          "options": [
            {
              "text": "불안정 — 저혈압·말초관류 저하·허혈성 흉통을 동반한 서맥으로 즉각적 처치 필요",
              "feedback": ""
            },
            {
              "text": "안정 — 의식이 명료하므로 외래 추적 가능",
              "feedback": "의식이 명료해도 저혈압·관류 저하·흉통이 있으면 불안정입니다.",
              "danger": true
            },
            {
              "text": "안정 — 흉통만 조절하면 됨",
              "feedback": "HR 40, BP 84/52, 차고 창백한 피부는 쇼크 징후입니다.",
              "danger": true
            },
            {
              "text": "판단 보류 — 심근효소 결과 확인 후 평가",
              "feedback": "STEMI 진단과 불안정 평가는 심근효소 결과를 기다리지 않습니다.",
              "danger": true
            }
          ],
          "answer": 0,
          "hint": "불안정 징후 5가지: 저혈압, 급성 의식변화, 쇼크 징후, 허혈성 흉통, 급성 심부전",
          "explanation": "불안정 서맥 판단 근거: 저혈압(BP 84/52), 말초관류 저하(창백·차가운 피부), 허혈성 흉통, 어지러움.\n\"의식 명료\"만으로 안정으로 판단하지 않습니다.",
          "codePiece": "I",
          "reference": "AHA ACLS Adult Bradycardia Algorithm"
        },
        {
          "id": "f3",
          "title": "STEP 3 · 우선순위",
          "difficulty": 3,
          "points": 250,
          "object": "phone",
          "item": {
            "name": "심도자실 호출 승인 카드",
            "icon": "card"
          },
          "stem": "응급실 간호사로서 가장 먼저 시행할 간호는?",
          "options": [
            {
              "text": "즉시 의사 보고 및 STEMI 프로토콜(심도자실) 활성화 요청, 모니터·제세동/조율 패드 부착, IV 확보",
              "feedback": ""
            },
            {
              "text": "흉통 완화를 위해 니트로글리세린 설하 투여",
              "feedback": "저혈압(SBP<90)·서맥·우심실 경색 가능성이 있는 하벽 STEMI에서 질산염은 위험합니다.",
              "danger": true
            },
            {
              "text": "SpO₂ 95%이므로 고유량 산소 15L 마스크 적용",
              "feedback": "SpO₂가 90% 이상이면 일상적인 산소 투여는 권고되지 않습니다. 우선순위도 아닙니다."
            },
            {
              "text": "30분 후 12유도 ECG를 재검하여 변화 확인",
              "feedback": "STEMI 재관류 지연은 심근 손상을 키웁니다. 재검을 위해 기다리지 않습니다.",
              "danger": true
            }
          ],
          "answer": 0,
          "hint": "Time is muscle.",
          "explanation": "STEMI + 불안정 서맥: 즉시 보고와 재관류 체계 활성화가 최우선. 동시에 지속 모니터링, 제세동/경피 조율 패드 부착, 정맥로 확보, 혈액검사.\n산소는 SpO₂ <90% 또는 호흡곤란 시 투여합니다.",
          "codePiece": "F",
          "reference": "ACC/AHA STEMI·ACS Guideline; AHA ACLS ACS Algorithm"
        },
        {
          "id": "f4",
          "title": "STEP 4 · 응급간호 및 처치",
          "difficulty": 3,
          "points": 250,
          "object": "crashcart",
          "item": {
            "name": "처치 완료 칩",
            "icon": "chip"
          },
          "stem": "이 환자에게 적절한 처치·간호 조합은?",
          "options": [
            {
              "text": "아트로핀 1mg IV, 반응 없으면 경피적 심박조율, V4R 확인, 아스피린 처방 확인, primary PCI 준비(최초 의료접촉–재관류 ≤90분 목표)",
              "feedback": ""
            },
            {
              "text": "모르핀·니트로글리세린으로 통증을 먼저 조절하고 안정되면 PCI 결정",
              "feedback": "저혈압 환자에서 혈관확장제는 쇼크를 악화시키며 재관류를 지연시킵니다.",
              "danger": true
            },
            {
              "text": "베타차단제 정주로 심근 산소요구량 감소",
              "feedback": "서맥·저혈압·방실차단 환자에서 베타차단제는 금기입니다.",
              "danger": true
            },
            {
              "text": "아데노신 6mg 급속 정주",
              "feedback": "아데노신은 방실결절 전도를 차단하여 방실차단을 악화시킵니다.",
              "danger": true
            }
          ],
          "answer": 0,
          "hint": "서맥 처치 + 재관류 준비를 동시에.",
          "explanation": "불안정 서맥: 아트로핀 1mg IV(최대 3mg) → 무반응 시 경피적 심박조율 또는 도파민/에피네프린 지속주입.\n하벽 STEMI: 우측유도(V4R)로 우심실 침범 확인, 금기 없으면 아스피린, primary PCI 준비(재관류 목표 시간 준수). 세부 약물·용량은 기관 프로토콜과 처방을 따릅니다.",
          "codePiece": "E",
          "reference": "AHA ACLS Bradycardia Algorithm; ACC/AHA STEMI·ACS Guideline"
        }
      ],
      "scene": "bay",
      "place": "7번 베드",
      "story": "드디어 7번 베드. 58세 남성 환자가 가슴을 움켜쥐고 식은땀을 흘리고 있다.\n지금까지 익힌 모든 판독과 판단을 사용할 시간이다.\n진단 → 상태 평가 → 우선순위 → 처치 순서로 환자를 구하라!",
      "props": [
        {
          "object": "poster",
          "text": "안내문 — \"흉통 환자 내원 10분 이내 12유도 심전도\""
        },
        {
          "object": "clock",
          "text": "Time is muscle. 1분 1초가 심근이다."
        }
      ]
    }
  ],
  "story": "2047년, 미래 스마트 응급센터.\n정전 직후 재가동된 AI 보안 시스템 HEART-OS가 오작동해 응급실의 모든 구역이 봉쇄되었다.\n7번 베드 환자의 상태가 급격히 나빠지고 있다.\n각 구역에 숨겨진 심전도 미션을 풀어 잠금을 해제하고, 환자에게 도달하라!",
  "ending": "심도자실로 이송된 환자의 막힌 혈관이 다시 열렸다.\nHEART-OS: \"환자 생존 확인. 모든 구역 봉쇄 해제.\""
};
