/**
 * SNU International Tutoring — Waitlist receiver (Google Apps Script).
 *
 * Setup (once):
 *   1. sheets.new → name the spreadsheet (e.g. "SNU Waitlist").
 *   2. Extensions → Apps Script → paste this file → Save.
 *   3. Fill NOTIFY_EMAILS below, then run `setup` once and allow permissions.
 *   4. Deploy → New deployment → Web app
 *        Execute as: Me / Who has access: Anyone → Deploy.
 *   5. Copy the /exec URL into WAITLIST_ENDPOINT in script.js.
 * After editing this file: Deploy → Manage deployments → Edit → New version
 * (the /exec URL stays the same).
 */

const NOTIFY_EMAILS = []; // e.g. ["founder1@gmail.com", "founder2@gmail.com"]
const SEND_CONFIRMATION = true; // email the registrant when they leave an Email

const SHEET = "Waitlist";
const SUMMARY = "Summary";
const FIELDS = [
  "submitted_at", "student_name", "whatsapp", "email", "curriculum", "subjects", "courses",
  "course_other", "parent_name", "grade", "school", "country", "break_start", "break_end",
  "time_slots", "interests", "needs", "referral", "ref", "page", "consent",
];
// Filled in by hand while following up.
const MANUAL = ["status", "owner", "memo"];
const STATUSES = ["신규", "연락함", "설명회 초대", "설명회 참석", "반 배정", "등록", "보류"];

function doPost(e) {
  const p = (e && e.parameter) || {};
  if (p.website) return json_({ ok: true }); // honeypot: bots fill hidden fields
  if (!p.student_name || !(p.whatsapp || p.email) || p.consent !== "yes") {
    return json_({ ok: false, error: "missing required fields" });
  }

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const sheet = sheet_();
    sheet.appendRow(FIELDS.map((f) => clean_(p[f])).concat(["신규", "", ""]));
  } finally {
    lock.releaseLock();
  }

  notify_(p);
  return json_({ ok: true });
}

// Run once from the editor: creates headers, status dropdown and the Summary sheet.
function setup() {
  const sheet = sheet_();
  const statusCol = FIELDS.length + 1;
  sheet.getRange(2, statusCol, sheet.getMaxRows() - 1, 1).setDataValidation(
    SpreadsheetApp.newDataValidation().requireValueInList(STATUSES, true).build()
  );

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const summary = ss.getSheetByName(SUMMARY) || ss.insertSheet(SUMMARY);
  summary.clear();
  const curricula = ["IB", "IGCSE", "A-Level", "AP", "Other"];
  const subjects = ["Mathematics", "Physics", "Chemistry", "Biology", "Other"];
  const col = (name) => columnLetter_(FIELDS.indexOf(name) + 1);
  const [cur, sub] = [col("curriculum"), col("subjects")];

  summary.getRange(1, 1, 1, subjects.length + 2).setValues([["Curriculum"].concat(subjects, ["합계"])]);
  curricula.forEach((c, i) => {
    const r = i + 2;
    const row = [c].concat(subjects.map((s) =>
      `=COUNTIFS(${SHEET}!${cur}:${cur},"${c}",${SHEET}!${sub}:${sub},"*${s}*")`
    ), [`=COUNTIF(${SHEET}!${cur}:${cur},"${c}")`]);
    summary.getRange(r, 1, 1, row.length).setValues([row]);
  });
  const last = curricula.length + 1;
  summary.getRange(last + 2, 1).setValue("총 신청");
  summary.getRange(last + 2, 2).setFormula(`=COUNTA(${SHEET}!A:A)-1`);
  summary.getRange(last + 3, 1).setValue("5명 이상 칸 = 반 개설 후보 (초록색)");

  const grid = summary.getRange(2, 2, curricula.length, subjects.length);
  summary.setConditionalFormatRules([
    SpreadsheetApp.newConditionalFormatRule().whenNumberGreaterThanOrEqualTo(5)
      .setBackground("#c8ecd4").setRanges([grid]).build(),
  ]);
  summary.getRange(1, 1, 1, subjects.length + 2).setFontWeight("bold");
}

function sheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET);
  if (!sheet) sheet = ss.insertSheet(SHEET, 0);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(FIELDS.concat(MANUAL));
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, FIELDS.length + MANUAL.length).setFontWeight("bold");
  }
  return sheet;
}

// Trim, cap length, and stop values like "=HYPERLINK(...)" from running as formulas.
function clean_(value) {
  const s = String(value || "").trim().slice(0, 2000);
  return /^[=+\-@]/.test(s) ? "'" + s : s;
}

function notify_(p) {
  const who = `${p.student_name} (${p.curriculum || "-"} · ${p.subjects || "-"})`;
  if (NOTIFY_EMAILS.length) {
    MailApp.sendEmail({
      to: NOTIFY_EMAILS.join(","),
      subject: `[Waitlist] ${who}`,
      body: FIELDS.map((f) => `${f}: ${p[f] || ""}`).join("\n") +
        `\n\n시트: ${SpreadsheetApp.getActiveSpreadsheet().getUrl()}`,
    });
  }
  if (SEND_CONFIRMATION && p.email) {
    MailApp.sendEmail({
      to: p.email,
      subject: "SNU International Tutoring — Waitlist 등록 확인",
      body: `${p.student_name} 학생, Waitlist 등록 감사합니다.\n\n` +
        "무료 온라인 설명회 일정과 반 편성 소식을 가장 먼저 보내드리겠습니다.\n" +
        "궁금한 점은 이 메일에 답장 주세요.\n\n" +
        "Thank you for joining the waitlist. We'll send the info session date and class updates first.\n\n" +
        "SNU International Tutoring\n(서울대학교 재학생이 운영하는 독립 교육 프로그램입니다.)",
    });
  }
}

function columnLetter_(n) {
  let s = "";
  for (; n > 0; n = Math.floor((n - 1) / 26)) s = String.fromCharCode(65 + ((n - 1) % 26)) + s;
  return s;
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
