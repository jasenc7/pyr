"""
generates og.png for pyrun.dev
Output: 1200x630px, drop in site/static/og.png
Requires: pillow (pip install pillow)
Run with: pyr run
"""

from PIL import Image, ImageDraw, ImageFont  # pip install pillow

W, H = 1200, 630

FONTS = "/Users/jasen/Library/Fonts"
mono = ImageFont.truetype(f"{FONTS}/BlexMonoNerdFont-Regular.ttf", 18)
mono_bold = ImageFont.truetype(f"{FONTS}/BlexMonoNerdFont-SemiBold.ttf", 18)
big = ImageFont.truetype(f"{FONTS}/BlexMonoNerdFont-Bold.ttf", 52)
sub = ImageFont.truetype(f"{FONTS}/BlexMonoNerdFont-Light.ttf", 22)

img = Image.new("RGB", (W, H), (15, 15, 20))
draw = ImageDraw.Draw(img)

# Subtle grid
for x in range(0, W, 60):
    draw.line([(x, 0), (x, H)], fill=(25, 25, 35), width=1)
for y in range(0, H, 60):
    draw.line([(0, y), (W, y)], fill=(25, 25, 35), width=1)

# Terminal window
tw, th = 820, 340
tx, ty = (W - tw) // 2, (H - th) // 2 + 20
draw.rounded_rectangle([tx, ty, tx + tw, ty + th], radius=12, fill=(28, 28, 38))
draw.rounded_rectangle([tx, ty, tx + tw, ty + 36], radius=12, fill=(40, 40, 52))
draw.rectangle([tx, ty + 20, tx + tw, ty + 36], fill=(40, 40, 52))
for i, c in enumerate([(255, 95, 87), (255, 189, 46), (40, 200, 64)]):
    draw.ellipse([tx + 14 + i * 22, ty + 11, tx + 26 + i * 22, ty + 23], fill=c)

# Terminal lines
lines = [
    ("curl -fsSL https://pyrun.dev/install.sh | sh", "prompt", None),
    ("installed to ~/.pyr/bin/pyr", "muted", (120, 120, 140)),
    ("", "gap", None),
    ("pyr init myapp && cd myapp", "prompt", None),
    ("downloading cpython 3.14.4...", "muted", (120, 120, 140)),
    ("myapp ready", "ok", (80, 200, 120)),
    ("", "gap", None),
    ("pyr run", "prompt", None),
    ("hello world", "normal", (220, 220, 220)),
]

lx, ly, line_h = tx + 20, ty + 50, 22

for text, style, color in lines:
    if style == "gap":
        ly += line_h // 2
        continue
    if style == "prompt":
        draw.text((lx, ly), "$ ", font=mono_bold, fill=(130, 180, 255))
        ox = lx + draw.textlength("$ ", font=mono_bold)
        draw.text((ox, ly), text, font=mono_bold, fill=(255, 255, 255))
    else:
        draw.text((lx, ly), text, font=mono, fill=color)
    ly += line_h

# "pyr" heading
bw = draw.textlength("pyr", font=big)
draw.text(((W - bw) // 2, 42), "pyr", font=big, fill=(255, 255, 255))

# Tagline
tag = "Python without the ceremony"
tw2 = draw.textlength(tag, font=sub)
draw.text(((W - tw2) // 2, H - 62), tag, font=sub, fill=(200, 200, 215))

img.save("../../site/static/og.png")
print("Saved og.png (1200x630)")
