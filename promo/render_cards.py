from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


OUTPUT = Path(__file__).parent
FONT = Path('C:/Windows/Fonts/malgun.ttf')
BOLD = Path('C:/Windows/Fonts/malgunbd.ttf')
NAVY = '#0f2b52'
INK = '#14213a'
BLUE = '#8fbcf0'
PAPER = '#fbfaf7'


def font(size, bold=False):
    return ImageFont.truetype(str(BOLD if bold else FONT), size)


def write(draw, x, y, value, size, color, bold=False):
    draw.text((x, y), value, font=font(size, bold), fill=color)


def base(number, dark=False):
    image = Image.new('RGB', (1080, 1080), NAVY if dark else PAPER)
    draw = ImageDraw.Draw(image)
    color = 'white' if dark else INK
    write(draw, 80, 70, 'SNU. INTERNATIONAL TUTORING', 34, color, True)
    write(draw, 80, 170, f'{number:02d} / 03', 30, BLUE if dark else '#2f63ad', True)
    return image, draw


image, draw = base(1, True)
for y, line in [(310, 'IB · IGCSE'), (410, 'A-Level · AP'), (565, '먼저 해본'), (665, '서울대 선배에게.')]:
    write(draw, 80, y, line, 75, 'white', True)
write(draw, 80, 865, '국제학교 출신 서울대생의 소수정예 온라인 수업', 35, BLUE)
image.save(OUTPUT / 'card-news-01.png')

image, draw = base(2)
write(draw, 80, 300, '내 과목도', 76, INK, True)
write(draw, 80, 402, '가능할까요?', 76, INK, True)
draw.rounded_rectangle((80, 535, 1000, 875), 20, fill='#edf3fa')
write(draw, 125, 585, 'IB  ·  IGCSE', 49, INK, True)
write(draw, 125, 665, 'A-Level  ·  AP', 49, INK, True)
draw.line((125, 753, 955, 753), fill='#b7c9dd', width=2)
write(draw, 125, 785, '수학  ·  물리  ·  화학  ·  생물', 41, INK)
write(draw, 80, 945, '과목별 수요를 확인해 반 편성을 안내합니다.', 31, '#5c6676')
image.save(OUTPUT / 'card-news-02.png')

image, draw = base(3, True)
write(draw, 80, 305, '먼저 관심만', 76, 'white', True)
write(draw, 80, 407, '남겨주세요.', 76, 'white', True)
write(draw, 80, 575, '관심 등록 무료 · 결제 없음', 42, 'white')
write(draw, 80, 650, '무료 온라인 설명회 일정 안내', 42, 'white')
draw.rounded_rectangle((80, 765, 1000, 865), 50, fill=BLUE)
write(draw, 165, 785, '프로필 링크에서 Waitlist 등록 →', 39, NAVY, True)
image.save(OUTPUT / 'card-news-03.png')
