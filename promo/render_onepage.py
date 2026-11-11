from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


OUT = Path(__file__).parent / 'waitlist-onepage.png'
REGULAR = 'C:/Windows/Fonts/malgun.ttf'
BOLD = 'C:/Windows/Fonts/malgunbd.ttf'
NAVY = '#0f2b52'
BLUE = '#93bff2'
WHITE = '#ffffff'


def text(draw, position, value, size, color=WHITE, bold=False):
    draw.text(position, value, font=ImageFont.truetype(BOLD if bold else REGULAR, size), fill=color)


image = Image.new('RGB', (1080, 1350), NAVY)
draw = ImageDraw.Draw(image)
draw.rounded_rectangle((66, 62, 355, 114), 26, fill='#294a75')
text(draw, (92, 73), 'SNU INTERNATIONAL TUTORING', 21, BLUE, True)
text(draw, (70, 190), 'IB · IGCSE · A-Level · AP', 43, BLUE, True)
text(draw, (70, 294), '수학·과학 수업,', 79, WHITE, True)
text(draw, (70, 400), '먼저 관심만', 79, WHITE, True)
text(draw, (70, 506), '남겨주세요.', 79, WHITE, True)
draw.line((70, 690, 1010, 690), fill='#45658c', width=2)
text(draw, (70, 744), '국제학교 출신 서울대생의', 40)
text(draw, (70, 805), '소수정예 온라인 수업', 40)
text(draw, (70, 907), '관심 등록 무료  ·  결제 없음', 36, BLUE, True)
draw.rounded_rectangle((70, 1042, 1010, 1149), 54, fill=BLUE)
text(draw, (260, 1068), 'Waitlist 관심 등록  →', 43, NAVY, True)
image.save(OUT)
