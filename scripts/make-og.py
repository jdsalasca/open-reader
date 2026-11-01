"""OG image for the landing page: 1200x630, paper + one accent."""

from PIL import Image, ImageDraw, ImageFont
import random

W, H = 1200, 630
PAPER = (231, 224, 210)
SHEET = (247, 242, 230)
INK = (36, 31, 25)
SOFT = (92, 85, 72)
MUTE = (139, 129, 112)
RULE = (201, 191, 169)
ACCENT = (168, 73, 42)

img = Image.new("RGB", (W, H), PAPER)
d = ImageDraw.Draw(img)

random.seed(7)
for _ in range(2600):
    x, y = random.randrange(W), random.randrange(H)
    d.point((x, y), fill=(215, 207, 192))

# page block on the right
d.rectangle([812, 96, 1120, 534], fill=SHEET, outline=RULE, width=2)
d.rectangle([818, 102, 1114, 528], outline=(230, 222, 206), width=1)
for i, y in enumerate([170, 205, 240, 275, 310, 345]):
    width = 250 if i % 3 else 180
    d.rectangle(
        [852, y, 852 + width, y + 9], fill=ACCENT if i in (2, 5) else (215, 207, 192)
    )

georgia_bold = ImageFont.truetype("C:/Windows/Fonts/georgiab.ttf", 92)
georgia_italic = ImageFont.truetype("C:/Windows/Fonts/georgiai.ttf", 92)
mono = ImageFont.truetype("C:/Windows/Fonts/consola.ttf", 21)
mono_small = ImageFont.truetype("C:/Windows/Fonts/consola.ttf", 18)


def spaced(draw, xy, text, font, fill, extra=3):
    x, y = xy
    for ch in text:
        draw.text((x, y), ch, font=font, fill=fill)
        x += font.getlength(ch) + extra


# mark
d.rectangle([80, 74, 104, 98], fill=ACCENT)
spaced(d, (120, 76), "OPEN READER", mono, SOFT, extra=5)

d.text((78, 196), "Abre un libro.", font=georgia_bold, fill=INK)
d.text((78, 300), "Hazlo tuyo.", font=georgia_italic, fill=ACCENT)

spaced(d, (80, 468), "EPUB  MOBI  AZW3  FB2  CBZ  PDF", mono_small, SOFT, extra=2)
d.text((80, 500), "Notas, citas y marcadores. Sin cuentas.", font=mono_small, fill=MUTE)

d.rectangle([80, 552, 126, 555], fill=ACCENT)
spaced(d, (80, 570), "OPEN-LIBRARY.ERIDU.TOP", mono_small, MUTE, extra=2)

img.save("public/og.png", optimize=True)
print("ok", img.size)
