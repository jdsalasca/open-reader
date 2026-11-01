"""Ko-fi cover (1280x480): same paper + oxide language as the reader."""

from PIL import Image, ImageDraw, ImageFont
import random
from pathlib import Path

W, H = 1280, 480
PAPER = (231, 224, 210)
SHEET = (247, 242, 230)
INK = (36, 31, 25)
SOFT = (92, 85, 72)
MUTE = (139, 129, 112)
RULE = (201, 191, 169)
ACCENT = (168, 73, 42)

OUT = Path(__file__).resolve().parent.parent / "docs" / "kofi" / "cover.png"
OUT.parent.mkdir(parents=True, exist_ok=True)

img = Image.new("RGB", (W, H), PAPER)
d = ImageDraw.Draw(img)

random.seed(11)
for _ in range(2400):
    d.point((random.randrange(W), random.randrange(H)), fill=(215, 207, 192))

# page block on the right
d.rectangle([1006, 72, 1214, 408], fill=SHEET, outline=RULE, width=2)
d.rectangle([1012, 78, 1208, 402], outline=(230, 222, 206), width=1)
for i, y in enumerate([128, 156, 184, 212, 240]):
    width = 150 if i % 3 else 96
    d.rectangle(
        [1036, y, 1036 + width, y + 7], fill=ACCENT if i in (1, 4) else (215, 207, 192)
    )

title = ImageFont.truetype("C:/Windows/Fonts/georgiab.ttf", 64)
italic = ImageFont.truetype("C:/Windows/Fonts/georgiai.ttf", 64)
mono = ImageFont.truetype("C:/Windows/Fonts/consola.ttf", 17)
mono_small = ImageFont.truetype("C:/Windows/Fonts/consola.ttf", 15)


def spaced(draw, xy, text, font, fill, extra=3):
    x, y = xy
    for ch in text:
        draw.text((x, y), ch, font=font, fill=fill)
        x += font.getlength(ch) + extra


d.rectangle([72, 62, 92, 82], fill=ACCENT)
spaced(d, (104, 63), "OPEN READER", mono, SOFT, extra=5)

d.text((70, 150), "Abre un libro.", font=title, fill=INK)
d.text((70, 222), "Hazlo tuyo.", font=italic, fill=ACCENT)

spaced(d, (72, 322), "OPEN-LIBRARY.ERIDU.TOP", mono_small, SOFT, extra=2)
d.text(
    (72, 350),
    "Herramientas libres, datos que se quedan contigo.",
    font=mono_small,
    fill=MUTE,
)

d.rectangle([72, 404, 118, 407], fill=ACCENT)
spaced(
    d, (72, 420), "HISTORIADOR · INGENIERÍA DE SISTEMAS", mono_small, MUTE, extra=1.5
)

img.save(OUT, optimize=True)
print("ok", OUT, img.size)
