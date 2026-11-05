# SNU International Tutoring

국제학교 학생 대상 소수정예 STEM 수업 Waitlist용 정적 랜딩페이지입니다.

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

## 공개 범위

- GitHub Pages에는 `index.html`, `styles.css`, `script.js`, 아이콘, `og.png`만 배포됩니다 (`.github/workflows/static.yml`).
- 사이트는 `noindex, nofollow`로 검색에서 제외하고, 링크를 공유하는 방식으로 운영합니다.
- 레포 자체는 공개입니다. 내부 금액 · 수익 계획 · 학생 정보는 레포에 넣지 마세요 (학생 정보는 Google Sheets에만 저장).

## 설정값 (`script.js` 상단)

- `WAITLIST_ENDPOINT`: Apps Script 웹앱 주소 (연결됨)
- `GA_MEASUREMENT_ID`: GA4 측정 ID. 비어 있으면 통계 수집 안 함
- `CONTACT_URL`: 카카오톡 오픈채팅 또는 `https://wa.me/번호`. 비어 있으면 문의하기 버튼이 숨겨짐

## 남은 작업

- 강사 '지금 하는 일' 채우기, 한마디 본인 확인 (`content.md`)
- 설명회 날짜 확정 후 첫 화면 카드와 FAQ에 반영
- 연락 문구: `recruitment-message.txt`
