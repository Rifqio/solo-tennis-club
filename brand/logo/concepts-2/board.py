# Brandkit board (3x3) for the Club Crest direction
from gen import crest2 as crest, ball3, shield2, BLUE, LIME, INK, WHITE

CHALK = "#F2F3F3"
FONT = "E:/Code/TApp/node_modules/@fontsource-variable/outfit/files/outfit-latin-wght-normal.woff2"
PHOTO = "E:/Code/TApp/public/photos/court-net.webp"


def sym(body, size):
    return f'<svg viewBox="0 0 256 256" width="{size}" height="{size}">{body}</svg>'


c_main = crest()
c_white = crest(base=WHITE, line=BLUE)
c_ink = crest(base=INK, line=WHITE)

construction = f'''<svg viewBox="-20 -20 296 296" width="330" height="330">
<g stroke="{BLUE}" stroke-width="1" fill="none" opacity=".55">
<path d="M128 -20V276M-20 34H276M-20 120H276M-20 244H276M34 -20V276M222 -20V276"/>
<circle cx="128" cy="34" r="35" stroke-dasharray="4 4"/><path d="{shield2(10)}" stroke-dasharray="3 4"/>
</g>
<path d="{shield2()}" fill="none" stroke="{INK}" stroke-width="2.5"/>
<circle cx="128" cy="34" r="28" fill="none" stroke="{INK}" stroke-width="2.5"/>
{ball3(128, 34, 28, fill="none", seam=INK, w=2.5)}
<g font-family="Outfit" font-size="11" fill="{BLUE}"><text x="226" y="30">0</text><text x="226" y="116">86</text><text x="226" y="240">210</text><text x="150" y="-4">ball 56 · notch 70</text></g>
</svg>'''

days = "".join(
    f'<div style="flex:1;border-radius:14px;padding:10px 0;text-align:center;background:{LIME if sel else CHALK}">'
    f'<div style="font-size:13px;opacity:.7">{d}</div><div style="font-size:24px;font-weight:700">{n}</div></div>'
    for d, n, sel in [("Sen", "12", 0), ("Sel", "13", 1), ("Rab", "14", 0), ("Kam", "15", 0)]
)

swatches = "".join(
    f'<div style="flex:1;border-radius:14px;background:{c};color:{t};padding:16px;display:flex;flex-direction:column;justify-content:flex-end;{extra}">'
    f'<div style="font-weight:700;font-size:17px">{name}</div><div style="font-size:13px;opacity:.8">{c}</div></div>'
    for c, t, name, extra in [
        (BLUE, "#fff", "Court Blue", ""),
        (LIME, INK, "Ball Lime", ""),
        (INK, "#fff", "Ink", ""),
        (CHALK, INK, "Chalk", "border:1px solid #D3D7D8"),
    ]
)

html = f'''<!doctype html><html><head><meta charset="utf-8"><style>
@font-face{{font-family:Outfit;src:url("file:///{FONT}") format("woff2");font-weight:100 900}}
*{{box-sizing:border-box;margin:0}}
body{{width:1920px;height:1440px;background:#1A1B1C;font-family:Outfit,sans-serif;padding:28px;display:grid;
 grid-template-columns:repeat(3,1fr);grid-template-rows:repeat(3,1fr);gap:20px}}
.p{{position:relative;border-radius:18px;overflow:hidden;display:flex;align-items:center;justify-content:center}}
.n{{position:absolute;left:24px;bottom:18px;font-size:13px;letter-spacing:.14em;text-transform:uppercase;opacity:.6}}
.n b{{font-weight:600;margin-right:10px}}
</style></head><body>

<div class="p" style="background:{INK};color:#fff;gap:34px">{sym(c_main, 190)}
 <div style="font-weight:700;font-size:46px;line-height:1.02;letter-spacing:.01em">SOLO<br>TENNIS<br>CLUB</div>
 <div class="n"><b>01</b>Logo</div></div>

<div class="p" style="background:{CHALK};color:{INK}">{construction}<div class="n"><b>02</b>Construction</div></div>

<div class="p" style="background:{BLUE};align-items:flex-end">
 <div style="width:380px;height:390px;background:#fff;border-radius:44px 44px 0 0;padding:34px 26px 0;color:{INK}">
  <div style="display:flex;align-items:center;gap:12px">{sym(c_main, 46)}<div style="font-weight:700;font-size:21px">Solo Tennis Club</div></div>
  <div style="display:flex;gap:10px;margin-top:26px">{days}</div>
  <div style="margin-top:22px;border-radius:16px;background:{CHALK};padding:16px 18px;display:flex;justify-content:space-between;align-items:center">
   <div><div style="font-size:28px;font-weight:700">07.00</div><div style="font-size:15px;opacity:.75">Kelas Pemula · Coach Dimas</div></div>
   <div style="background:{INK};color:#fff;border-radius:999px;padding:8px 14px;font-size:14px;font-weight:600;white-space:nowrap">3 tempat lagi</div></div>
 </div><div class="n" style="color:#fff;opacity:.85"><b>03</b>App</div></div>

<div class="p" style="background:{LIME};color:{INK};flex-direction:column;align-items:flex-start;padding:0 52px">
 <div style="font-weight:700;font-size:68px;line-height:1">See you<br>on court.</div>
 <div style="font-size:24px;margin-top:18px;opacity:.75">Sampai ketemu di lapangan.</div><div class="n"><b>04</b>Voice</div></div>

<div class="p" style="background:#fff;align-items:stretch;padding:40px 30px 56px;gap:12px">{swatches}
 <div class="n" style="color:{INK}"><b>05</b>Colour</div></div>

<div class="p" style="background:{INK};color:#fff;gap:40px">
 <div style="font-size:190px;font-weight:700;line-height:1">Aa</div>
 <div><div style="font-size:30px;font-weight:700">Outfit</div><div style="font-size:18px;opacity:.7;margin-top:6px">Bold · SemiBold · Regular</div>
 <div style="font-size:22px;margin-top:22px;letter-spacing:.06em">ABCDEFGHIJKLM<br>0123456789</div></div>
 <div class="n"><b>06</b>Type</div></div>

<div class="p" style="background:#E7E9E9">
 <div style="position:absolute;width:330px;height:208px;border-radius:18px;background:#fff;transform:rotate(-8deg) translate(-40px,-18px);box-shadow:0 18px 40px rgba(0,0,0,.14)"></div>
 <div style="position:relative;width:330px;height:208px;border-radius:18px;background:{BLUE};color:#fff;padding:22px;transform:translate(30px,20px);box-shadow:0 20px 44px rgba(0,0,0,.22);display:flex;flex-direction:column;justify-content:space-between">
  <div style="display:flex;justify-content:space-between;align-items:flex-start"><div style="font-weight:700;font-size:15px;letter-spacing:.16em">MEMBER</div>{sym(c_white, 62)}</div>
  <div><div style="font-size:21px;font-weight:600">Nama Anggota</div><div style="font-size:13px;opacity:.8;letter-spacing:.12em">SOLO TENNIS CLUB · 0042</div></div></div>
 <div class="n" style="color:{INK}"><b>07</b>Member card</div></div>

<div class="p" style="background:{INK}">
 <div style="position:absolute;inset:0;background:url('file:///{PHOTO}') center/cover;filter:grayscale(1) contrast(1.15)"></div>
 <div style="position:absolute;inset:0;background:{BLUE};mix-blend-mode:multiply;opacity:.9"></div>
 <div style="position:absolute;left:26px;top:24px">{sym(c_white, 64)}</div>
 <div style="position:absolute;right:26px;bottom:20px;color:#fff;font-weight:700;font-size:30px">Solo · Surakarta</div>
 <div class="n" style="color:#fff"><b>08</b>Image</div></div>

<div class="p" style="background:#fff;flex-direction:column;gap:30px;color:{INK}">
 <div style="display:flex;gap:18px;align-items:flex-end">
  <div style="width:104px;height:104px;border-radius:24px;background:{BLUE};display:flex;align-items:center;justify-content:center">{sym(c_white, 80)}</div>
  <div style="width:104px;height:104px;border-radius:24px;background:{INK};display:flex;align-items:center;justify-content:center">{sym(c_main, 80)}</div>
  <div style="width:56px;height:56px;border-radius:13px;background:{LIME};display:flex;align-items:center;justify-content:center">{sym(c_ink, 44)}</div>
  {sym(c_main, 32)}{sym(c_main, 16)}</div>
 <div style="display:flex;gap:10px;font-size:16px;font-weight:600">
  <span style="padding:8px 14px;border-radius:999px;background:#E3F5E9;color:#1B6B3A">Tersedia</span>
  <span style="padding:8px 14px;border-radius:999px;background:#FFF4D6;color:#805000">Hampir penuh</span>
  <span style="padding:8px 14px;border-radius:999px;background:{CHALK};color:#5B6166">Penuh</span></div>
 <div class="n"><b>09</b>Icons &amp; states</div></div>
</body></html>'''

open("board.html", "w", encoding="utf-8").write(html)
