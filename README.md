# SNU International Tutoring

Landing Page SPEC v0.2 기준 정적 랜딩페이지입니다. (v0.1은 `archive/v0.1/`에 보관)

## 미리보기

`index.html`을 브라우저에서 열면 됩니다. 설치나 빌드가 필요 없습니다.

- `index.html`: 첫 화면 → 신뢰 숫자 → 강사진 → 수업 방식 → 자주 묻는 질문 → Waitlist
- `content.md`: 페이지 문구 원본 (강사진 · 수업 구조 · 가격 · 폼 항목). 문구는 여기서 먼저 고친 뒤 HTML에 반영
- `styles.css`: 모바일 우선 대응 스타일 (900px / 640px 분기)
- `script.js`: Waitlist 폼 검증·전송, Curriculum별 세부 과목 선택, 스크롤 등장 · 숫자 카운트 애니메이션, 분석 이벤트

## Waitlist 폼

- 필수: 학생 이름, WhatsApp 또는 Email(하나 이상), Curriculum, 관심 과목, 개인정보 동의. 나머지(학부모 · 학교 · 국가 · 학년 · 방학 일정 · 선호 시간대 · 관심 프로그램 · 유입 경로)는 선택입니다.
- `script.js`의 `WAITLIST_ENDPOINT`가 비어 있으면 **실제로 전송되지 않고** 완료 화면에 검토용 안내가 표시됩니다.
- 수신: `scripts/waitlist-apps-script.gs`를 Google Sheets의 Apps Script에 붙여넣고 웹앱으로 배포한 뒤, `/exec` 주소를 `WAITLIST_ENDPOINT`에 넣습니다. 파일 상단에 단계가 적혀 있습니다.
- 시트에는 `Waitlist`(신청 + 상태 · 담당 · 메모 열)와 `Summary`(커리큘럼 × 과목 신청 수, 5명 이상 초록색)가 생깁니다.
- 링크에 `?ref=채널명`을 붙이면 유입 채널이 `ref` 열에 기록됩니다.

## 분석 (Analytics)

`window.dataLayer`에 이벤트를 push합니다: `cta_click`(cta 위치), `waitlist_start`, `waitlist_invalid`, `waitlist_submit`(curriculum/subjects/interests), `waitlist_error`.
GA4 또는 GTM 스니펫을 `<head>`에 추가하면 그대로 수집됩니다.

## 공개 전 필요한 작업

- 강사 프로필 `[TBD]` 항목(content.md) 채우기. 가격은 페이지에 공개하지 않음(FAQ에 개별 안내).
- `content.md`는 GitHub Pages에 함께 배포되므로 공개 전 비공개 처리 여부 결정.
- PDF 재생성: `scripts/create_onepage.py` 문구는 갱신됨, reportlab 설치 후 실행 필요.
- 폼 수신 주소 연결 및 개인정보 동의 문구 최종 확인.
- `noindex, nofollow` 제거, 실제 도메인 canonical / Open Graph 추가.
- 서울대학교 재학 verification 표시 방식 결정 (SPEC 15).
- 운영 주체 및 서울대학교 비공식 프로그램 안내 문구 확인.

## 짧은 모집용 세트

- `short.html` / `short.css`: 짧은 소개 페이지 (`index.html#programs`로 연결)
- `output/pdf/snu-tutoring-onepage.pdf`, `scripts/create_onepage.py`: A4 한 장 소개서와 생성 스크립트
- `recruitment-message.txt`: 카카오톡 모집 문구
