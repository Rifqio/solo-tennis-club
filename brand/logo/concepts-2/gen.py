# Round 2: tennis-club concepts (crest, roundel, crossed rackets)
import math
from outline import outline
BLUE="#0079ED"; LIME="#C0FC49"; INK="#0F1112"; WHITE="#FFFFFF"
def f(v): return f"{v:.2f}".rstrip('0').rstrip('.')

def text_centered(s, wght, size, track, cx, baseline, fill):
    d,b=outline(s,wght,size,track,0,0)
    w=b[2]-b[0]
    d,b=outline(s,wght,size,track,cx-w/2-b[0],baseline)
    return f'<path fill="{fill}" d="{d}"/>'

def ring_text(s, wght, size, track, cx, cy, r, center_deg, fill, outside=True):
    # glyphs on a circle; top arc reads clockwise, bottom arc reads counter-clockwise
    from fontTools.ttLib import TTFont
    out=[]; widths=[]
    for ch in s:
        d,b=outline(ch if ch!=" " else "i",wght,size,0,0,0)
        widths.append((b[2]-b[0]) if ch!=" " else size*0.28)
    total=sum(widths)+track*(len(s)-1)
    ang_total=total/r*180/math.pi
    a=center_deg-ang_total/2 if outside else center_deg+ang_total/2
    for ch,w in zip(s,widths):
        mid=a+(w/2)/r*180/math.pi*(1 if outside else -1)
        if ch!=" ":
            d,b=outline(ch,wght,size,0,0,0)
            gx=-(b[0]+b[2])/2
            if outside:   # baseline on circle radius r, glyph tops outward
                tr=f"rotate({f(mid)} {cx} {cy}) translate({f(cx+gx)} {f(cy-r)})"
            else:         # bottom arc: letters upright, read left->right
                capH=-b[1]
                tr=f"rotate({f(mid-180)} {cx} {cy}) translate({f(cx+gx)} {f(cy+r+capH)})"
            out.append(f'<path fill="{fill}" transform="{tr}" d="{d}"/>')
        a+= (w+track)/r*180/math.pi*(1 if outside else -1)
    return "".join(out)

def ball(cx,cy,r,fill=LIME,seam=INK,sw=None):
    sw=sw or max(r*0.13,2)
    k=r*0.62
    return (f'<circle cx="{f(cx)}" cy="{f(cy)}" r="{f(r)}" fill="{fill}"/>'
            f'<path fill="none" stroke="{seam}" stroke-width="{f(sw)}" stroke-linecap="round" '
            f'd="M{f(cx-r*0.72)} {f(cy-r*0.69)}Q{f(cx-r*0.05)} {f(cy)} {f(cx-r*0.72)} {f(cy+r*0.69)}'
            f'M{f(cx+r*0.72)} {f(cy-r*0.69)}Q{f(cx+r*0.05)} {f(cy)} {f(cx+r*0.72)} {f(cy+r*0.69)}"/>')

def racket(col, strings=None, xs=(-24,-12,0,12,24), ys=(-30,-15,0,15,30)):
    # local coords: head centre (0,-48), butt at y≈92
    rx,ry,hy=40,52,-48
    strings=strings or col
    g=[f'<ellipse cx="0" cy="{hy}" rx="{rx}" ry="{ry}" fill="none" stroke="{col}" stroke-width="10"/>']
    irx,iry=rx-5,ry-5
    lines=[]
    for x in xs:
        h=iry*math.sqrt(1-(x/irx)**2); lines.append(f"M{x} {f(hy-h)}V{f(hy+h)}")
    for y in ys:
        w=irx*math.sqrt(1-(y/iry)**2); lines.append(f"M{f(-w)} {f(hy+y)}H{f(w)}")
    g.append(f'<path fill="none" stroke="{strings}" stroke-width="3" d="{"".join(lines)}"/>')
    g.append(f'<path fill="none" stroke="{col}" stroke-width="8" stroke-linejoin="round" d="M-27 -10L-5 30M27 -10L5 30"/>')
    g.append(f'<rect x="-8" y="26" width="16" height="62" rx="5" fill="{col}"/>')
    g.append(f'<rect x="-10" y="84" width="20" height="9" rx="3" fill="{col}"/>')
    return "".join(g)

def svg(body,w=256,h=256,title="Solo Tennis Club"):
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}"><title>{title}</title>{body}</svg>'

SHIELD="M36 30H220V118C220 178 182 214 128 242C74 214 36 178 36 118Z"
def crest(base=BLUE, line=WHITE):
    b=[f'<path fill="{base}" d="{SHIELD}"/>',
       f'<path fill="none" stroke="{line}" stroke-width="3.5" transform="translate(128 136) scale(.88) translate(-128 -136)" d="{SHIELD}"/>',
       f'<path fill="none" stroke="{line}" stroke-width="3.5" d="M56 198H200" opacity="0"/>',
       ball(128,34,30,sw=4.5),
       text_centered("STC",800,68,1,128,162,line),
       text_centered("SOLO",600,18,6,128,198,line)]
    return "".join(b)

def roundel(base=BLUE, line=WHITE):
    b=[f'<circle cx="128" cy="128" r="122" fill="{base}"/>',
       f'<circle cx="128" cy="128" r="90" fill="none" stroke="{line}" stroke-width="3"/>',
       ring_text("SOLO TENNIS CLUB",700,21,2.2,128,128,98,0,line,True),
       ring_text("SURAKARTA",700,21,2.2,128,128,98,180,line,False),
       f'<circle cx="34" cy="128" r="4" fill="{LIME}"/><circle cx="222" cy="128" r="4" fill="{LIME}"/>',
       f'<g transform="translate(138 140) rotate(32) scale(.62)">{racket(line)}</g>',
       ball(96,92,17,sw=3)]
    return "".join(b)

def crossed(col=INK):
    b=[f'<g transform="translate(128 156) rotate(-42) translate(0 -2) scale(.86)">{racket(col,xs=(-18,0,18),ys=(-24,0,24))}</g>',
       f'<g transform="translate(128 156) rotate(42) translate(0 -2) scale(.86)">{racket(col,xs=(-18,0,18),ys=(-24,0,24))}</g>',
       ball(128,40,24,sw=4)]
    return "".join(b)

def lockup(sym_body, name):
    x=256+40
    t1=outline("SOLO TENNIS",700,62,1,0,0)[1]
    d1,b1=outline("SOLO TENNIS",700,62,1,x-t1[0],122)
    d2,b2=outline("CLUB",700,62,1,x-t1[0],196)
    W=max(b1[2],b2[2])+10
    return svg(sym_body+f'<path fill="{INK}" d="{d1}"/><path fill="{INK}" d="{d2}"/>',w=round(W))

for n,body in [("a",crest()),("b",roundel()),("c",crossed())]:
    open(f"{n}-symbol.svg","w",encoding="utf-8").write(svg(body))
    open(f"{n}-lockup.svg","w",encoding="utf-8").write(lockup(body,n))
print("ok")

# ---- Crest v2: ball seated in a notch, true inset border, real seams
def ball2(cx, cy, r, fill=LIME, seam=WHITE, sw=None):
    sw = sw or r * 0.12
    c, s = 0.574, 0.819
    R = 1.288 * r
    return (f'<circle cx="{f(cx)}" cy="{f(cy)}" r="{f(r)}" fill="{fill}"/>'
            f'<path fill="none" stroke="{seam}" stroke-width="{f(sw)}" stroke-linecap="round" d="'
            f'M{f(cx-c*r)} {f(cy-s*r)}A{f(R)} {f(R)} 0 0 1 {f(cx-c*r)} {f(cy+s*r)}'
            f'M{f(cx+c*r)} {f(cy-s*r)}A{f(R)} {f(R)} 0 0 0 {f(cx+c*r)} {f(cy+s*r)}"/>')

def shield2(d=0, notch=35, top=34, L=34, Rt=222, tip=244, cr=10):
    # inset by d: top edge, sides and tip move inward; notch radius grows by d
    t, l, r = top + d, L + d, Rt - d
    nr = notch + d
    nx = math.sqrt(max(nr * nr - d * d, 0))
    k = max(cr - d * 0.5, 2)
    tp = tip - 1.12 * d
    return (f"M{f(l)} {f(t+k)}A{f(k)} {f(k)} 0 0 1 {f(l+k)} {f(t)}H{f(128-nx)}"
            f"A{f(nr)} {f(nr)} 0 0 0 {f(128+nx)} {f(t)}H{f(r-k)}A{f(k)} {f(k)} 0 0 1 {f(r)} {f(t+k)}"
            f"V120C{f(r)} {f(182-d*0.4)} {f(184-d*0.75)} {f(220-d*0.9)} 128 {f(tp)}"
            f"C{f(256-184+d*0.75)} {f(220-d*0.9)} {f(l)} {f(182-d*0.4)} {f(l)} 120Z")


# ---- Ball v3: seams as filled bands cut exactly at the ball edge
def _cc(c0, r0, c1, r1):
    (x0, y0), (x1, y1) = c0, c1
    d = math.hypot(x1 - x0, y1 - y0)
    a = (r0 * r0 - r1 * r1 + d * d) / (2 * d)
    h = math.sqrt(max(r0 * r0 - a * a, 0))
    xm, ym = x0 + a * (x1 - x0) / d, y0 + a * (y1 - y0) / d
    p, q = (xm + h * (y1 - y0) / d, ym - h * (x1 - x0) / d), (xm - h * (y1 - y0) / d, ym + h * (x1 - x0) / d)
    return (p, q) if p[1] < q[1] else (q, p)   # (top, bottom)

def _arc(c, r, p, q):
    cr = (p[0] - c[0]) * (q[1] - c[1]) - (p[1] - c[1]) * (q[0] - c[0])
    return f"A{f(r)} {f(r)} 0 0 {1 if cr > 0 else 0} {f(q[0])} {f(q[1])}"

def ball3(cx, cy, r, fill=LIME, seam=WHITE, w=None, inner=0.44, Rs=1.1):
    w = w or r * 0.12
    O = (cx, cy)
    out = [f'<circle cx="{f(cx)}" cy="{f(cy)}" r="{f(r)}" fill="{fill}"/>'] if fill != "none" else []
    for side in (-1, 1):
        D = (inner + Rs) * r
        C = (cx + side * D, cy)
        ro, ri = Rs * r + w / 2, Rs * r - w / 2       # ro reaches toward the ball centre
        o_top, o_bot = _cc(O, r, C, ro)
        i_top, i_bot = _cc(O, r, C, ri)
        d = (f"M{f(o_top[0])} {f(o_top[1])}" + _arc(C, ro, o_top, o_bot) + _arc(O, r, o_bot, i_bot)
             + _arc(C, ri, i_bot, i_top) + _arc(O, r, i_top, o_top) + "Z")
        out.append(f'<path fill="{seam}" d="{d}"/>')
    return "".join(out)

def crest2(base=BLUE, line=WHITE, ballfill=LIME, seam=WHITE):
    d, b = outline("SOLO", 600, 16, 5, 0, 0)
    sw = b[2] - b[0] - 5
    rule_y = 178.5
    return "".join([
        f'<path fill="{base}" d="{shield2()}"/>',
        f'<path fill="none" stroke="{line}" stroke-width="3.5" d="{shield2(10)}"/>',
        ball3(128, 34, 28, fill=ballfill, seam=seam),
        text_centered("STC", 800, 66, 0, 128, 152, line),
        text_centered("SOLO", 600, 16, 5, 128 + 2.5, 185, line),
        f'<path stroke="{line}" stroke-width="2.5" stroke-linecap="round" d="M{f(128-sw/2-26)} {rule_y}H{f(128-sw/2-10)}M{f(128+sw/2+10)} {rule_y}H{f(128+sw/2+26)}"/>',
    ])

if __name__ == "__main__" or True:
    open("a-symbol.svg", "w", encoding="utf-8").write(svg(crest2()))
    open("a-lockup.svg", "w", encoding="utf-8").write(lockup(crest2(), "a"))
