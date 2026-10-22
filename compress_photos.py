# Shrinks phone photos for the app. Usage:  python compress_photos.py PHOTO_FOLDER
# Writes images/places/<same name>.webp (16:9, 640 px wide, under about 60 KB). Needs:  pip install pillow
import io, os, sys
from PIL import Image, ImageOps
src = sys.argv[1]; out = os.path.join(os.path.dirname(os.path.abspath(__file__)), "images", "places"); os.makedirs(out, exist_ok=True)
for f in sorted(os.listdir(src)):
    if not f.lower().endswith((".jpg", ".jpeg", ".png", ".webp")): continue
    im = ImageOps.fit(ImageOps.exif_transpose(Image.open(os.path.join(src, f))).convert("RGB"), (640, 360))
    for q in (80, 70, 60, 50, 40, 30):
        b = io.BytesIO(); im.save(b, "WEBP", quality=q)
        if b.tell() <= 60000: break
    name = os.path.splitext(f)[0].lower().replace(" ", "_") + ".webp"
    open(os.path.join(out, name), "wb").write(b.getvalue()); print(name, round(b.tell() / 1024), "KB (quality", q, ")")
