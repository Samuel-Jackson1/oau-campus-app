"""Printable "You are here" QR stickers, one per place, 6 to an A4 page.

Scanning a sticker opens the app at  <base>/?at=<place id>  so it knows exactly where the person stands
(no GPS needed) and only asks where they want to go. Stick each one at the entrance of its place.

    python tools/make_qr_stickers.py https://your-app.vercel.app stickers.pdf
"""
import json, os, sys
import qrcode
from PIL import Image, ImageDraw, ImageFont

base, out = sys.argv[1].rstrip("/"), sys.argv[2]
here = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
places = json.load(open(os.path.join(here, "data", "places.json"), encoding="utf-8"))
places = [p for p in places if p.get("verified") and not p.get("hidden") and not p.get("waypoint")]

FONTS = r"C:\Windows\Fonts"
def font(bold, size):
    for name in (("segoeuib.ttf", "arialbd.ttf") if bold else ("segoeui.ttf", "arial.ttf")):
        try: return ImageFont.truetype(os.path.join(FONTS, name), size)
        except OSError: pass
    return ImageFont.load_default()

NAVY, GOLD, INK = (13, 27, 142), (248, 200, 67), (22, 24, 43)
W, H = 1240, 1754                      # A4 at 150 dpi
SW, SH, M = 560, 540, 40               # sticker size and margin

def wrap(d, text, f, width):
    lines, line = [], ""
    for w in text.split():
        t = (line + " " + w).strip()
        if d.textlength(t, font=f) <= width: line = t
        else: lines.append(line); line = w
    return lines + [line]

def sticker(p):
    im = Image.new("RGB", (SW, SH), "white"); d = ImageDraw.Draw(im)
    d.rounded_rectangle([3, 3, SW - 4, SH - 4], 28, outline=NAVY, width=6)
    d.rounded_rectangle([3, 3, SW - 4, 88], 28, fill=NAVY); d.rectangle([3, 60, SW - 4, 88], fill=NAVY)
    d.text((SW / 2, 46), "YOU ARE HERE", font=font(True, 40), fill=GOLD, anchor="mm")
    y = 104
    for ln in wrap(d, p["name"], font(True, 30), SW - 60)[:2]:
        d.text((SW / 2, y + 18), ln, font=font(True, 30), fill=INK, anchor="mm"); y += 38
    q = qrcode.QRCode(border=1, box_size=10, error_correction=qrcode.constants.ERROR_CORRECT_M)
    q.add_data(base + "/?at=" + p["id"]); q.make(fit=True)
    qi = q.make_image(fill_color="black", back_color="white").convert("RGB").resize((300, 300), Image.NEAREST)
    im.paste(qi, ((SW - 300) // 2, y + 8))
    d.text((SW / 2, y + 336), "Scan with your phone camera", font=font(False, 24), fill=INK, anchor="mm")
    d.text((SW / 2, y + 366), "to find your way around OAU", font=font(False, 24), fill=INK, anchor="mm")
    return im

pages = []
for i in range(0, len(places), 6):
    pg = Image.new("RGB", (W, H), "white")
    for j, p in enumerate(places[i:i + 6]):
        x = M + (j % 2) * (SW + M); y = M + (j // 2) * (SH + M)
        pg.paste(sticker(p), (x, y))
    pages.append(pg)
pages[0].save(out, save_all=True, append_images=pages[1:], resolution=150)
print(len(places), "stickers on", len(pages), "pages ->", out)
