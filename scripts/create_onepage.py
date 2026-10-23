"""Generate the one-page recruitment draft and its visual QA preview.

Requires reportlab, pypdf and pypdfium2 (available in the bundled runtime).
"""
from pathlib import Path
from reportlab.pdfgen import canvas
from reportlab.lib.colors import HexColor
from reportlab.lib.pagesizes import A4
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from pypdf import PdfReader
import pypdfium2 as pdfium

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "output" / "pdf"
PREVIEW = ROOT / "tmp" / "pdfs"
OUT.mkdir(parents=True, exist_ok=True)
PREVIEW.mkdir(parents=True, exist_ok=True)
pdfmetrics.registerFont(TTFont("Korean", "C:/Windows/Fonts/malgun.ttf"))
pdfmetrics.registerFont(TTFont("KoreanBold", "C:/Windows/Fonts/malgunbd.ttf"))
W, H = A4
PAPER, INK, MUTED, LINE, ACCENT = "#f7f5ef", "#233e35", "#656e65", "#c9cec3", "#a34d32"
path = OUT / "snu-tutoring-onepage.pdf"
c = canvas.Canvas(str(path), pagesize=A4)
c.setTitle("SNU International Tutoring | One-page introduction")
c.setAuthor("SNU International Tutoring")

def rect(x, top, w, h, color):
    c.setFillColor(HexColor(color))
    c.rect(x, H-top-h, w, h, fill=1, stroke=0)

def text(x, top, value, size=10, bold=False, color=INK):
    c.setFillColor(HexColor(color))
    c.setFont("KoreanBold" if bold else "Korean", size)
    c.drawString(x, H-top-size, value)

def rule(top, color=LINE, x=44, end=W-44):
    c.setStrokeColor(HexColor(color))
    c.setLineWidth(.6)
    c.line(x, H-top, end, H-top)

rect(0, 0, W, H, PAPER)
text(44, 32, "SNU.", 26, True)
text(118, 37, "INTERNATIONAL", 7, True)
text(118, 48, "TUTORING", 7, True)
text(397, 45, "방학 집중 프로그램 · 준비 중", 8, color=MUTED)
rule(77, INK)

text(44, 99, "국제학교 학생을 위한 MATH & PHYSICS", 9, True)
text(41, 124, "방학의 공부,", 43, True)
text(41, 181, "다음 단계로.", 43, True, ACCENT)
text(44, 255, "같은 길을 먼저 걸어본 서울대 선배와 함께.", 16, True)
text(44, 287, "서울대학교 재학생 및 최근 졸업생 강사진과", 10, color=MUTED)
text(44, 304, "개념을 이해하고, 문제에 적용하는 집중 수업을 준비합니다.", 10, color=MUTED)
text(44, 339, "실시간 온라인    /    4–6명 소수정예 예정    /    IB · AP · IGCSE · A-Level", 9, True)
rule(370, INK)

text(44, 389, "어떤 과목을 배우나요?", 11, True)
text(44, 415, "Math & Physics", 22, True)
text(273, 384, "IB", 9, True)
text(306, 384, "Math AA HL / SL · Physics HL / SL", 8.5)
text(273, 404, "AP", 9, True)
text(306, 404, "Calculus AB / BC · Physics", 8.5)
text(273, 424, "IGCSE / A-Level", 9, True)
text(382, 424, "Math · Physics", 8.5)
text(273, 443, "수요에 따라 개설 검토 · 시험기관·세부 과목 미정", 7.5, color=MUTED)
rule(463)

text(44, 481, "이해에서 적용까지, 두 강사의 관점으로.", 12, True)
for x, number, title, description in [
    (44, "01", "개념 이해", "핵심 원리와 사고방식"),
    (221, "02", "문제 적용", "기출·고난도 문제 연습"),
    (398, "03", "피드백", "취약 영역과 학습 방향"),
]:
    text(x, 511, number, 8, True, ACCENT)
    text(x, 528, title, 16, True)
    text(x, 553, description, 9, color=MUTED)
text(44, 584, "계획 중인 운영 방식입니다. 최종 과목·레벨·일정은 관심 수요에 따라 결정됩니다.", 8, color=MUTED)

rect(44, 616, W-88, 131, INK)
text(63, 632, "우리 아이에게 필요한 방학 수업을 알려주세요.", 17, True, PAPER)
text(63, 665, "관심 등록이 시작되면 확정된 일정과 모집 안내를 먼저 받아보실 수 있습니다.", 8.5, color="#d3d9ce")
text(63, 691, "관심 등록 준비 중", 11, True, PAPER)
text(63, 716, "결제 없이 관심 등록 · 현재는 신청이나 개인정보를 받지 않습니다.", 8, color="#d3d9ce")

text(44, 763, "서울대학교 재학생 및 최근 졸업생이 준비하는 독립 교육 프로그램입니다.", 7, color=MUTED)
text(44, 777, "서울대학교 공식 운영 프로그램이 아닙니다.", 7, color=MUTED)
text(397, 794, "검토용 초안 · 신청 링크 연결 전", 7, color=MUTED)
c.showPage()
c.save()

reader = PdfReader(str(path))
assert len(reader.pages) == 1, "Expected exactly one page"
extracted = reader.pages[0].extract_text()
for expected in ["방학의 공부", "관심 등록 준비 중", "Physics", "IGCSE / A-Level", "공식 운영 프로그램이 아닙니다"]:
    assert expected in extracted, expected
doc = pdfium.PdfDocument(str(path))
page = doc[0]
page.render(scale=1.6).to_pil().save(PREVIEW / "snu-tutoring-onepage.png")
print(f"PASS: one A4 page, Korean text extraction, PDF rendered for visual inspection.\nPDF: {path}")
