# SNU International Tutoring

Landing Page SPEC v0.2 기준 정적 랜딩페이지입니다. (v0.1은 `archive/v0.1/`에 보관)

## 미리보기

`index.html`을 브라우저에서 열면 됩니다. 설치나 빌드가 필요 없습니다.

- `index.html`: Hero → Trust Bar → Why Us → Winter Intensive / Two-Instructor System → Curriculums → Instructors → Beyond Tutoring → Why Recent SNU Students → Waitlist
- `styles.css`: 모바일 우선 대응 스타일 (900px / 640px 분기)
- `script.js`: Waitlist 폼 검증·전송, Curriculum별 세부 과목 선택, 분석 이벤트

## Waitlist 폼

- SPEC 16의 필수 항목, Curriculum, 관심 과목, 세부 과목, 관심 프로그램, 자유 기재, 유입 경로, 개인정보 동의 체크를 받습니다.
- `script.js`의 `WAITLIST_ENDPOINT`가 비어 있으면 **실제로 전송되지 않고** 완료 화면에 검토용 안내가 표시됩니다.
- 공개 전 Google Apps Script 웹앱(→ Google Sheets)이나 Formspree 등 수신 주소를 넣으세요. form-urlencoded POST로 전송합니다.

## 분석 (Analytics)

`window.dataLayer`에 이벤트를 push합니다: `cta_click`(cta 위치), `waitlist_start`, `waitlist_invalid`, `waitlist_submit`(curriculum/subjects/interests), `waitlist_error`.
GA4 또는 GTM 스니펫을 `<head>`에 추가하면 그대로 수집됩니다.

## 공개 전 필요한 작업

- 강사 사진 교체 (`.portrait` 안에 `<img>` 추가). Instructor 01 출신 학교명 공개 여부 확인.
- 폼 수신 주소 연결 및 개인정보 동의 문구 최종 확인.
- `noindex, nofollow` 제거, 실제 도메인 canonical / Open Graph 추가.
- 서울대학교 재학 verification 표시 방식 결정 (SPEC 15).
- 운영 주체 및 서울대학교 비공식 프로그램 안내 문구 확인.

## 짧은 모집용 세트

- `short.html` / `short.css`: 짧은 소개 페이지 (`index.html#programs`로 연결)
- `output/pdf/snu-tutoring-onepage.pdf`, `scripts/create_onepage.py`: A4 한 장 소개서와 생성 스크립트
- `recruitment-message.txt`: 카카오톡 모집 문구
