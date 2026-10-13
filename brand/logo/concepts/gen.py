import math
from outline import outline
C=128
def f(v): return f"{v:.2f}".rstrip('0').rstrip('.')
def cc_int(c0,r0,c1,r1):
    (x0,y0),(x1,y1)=c0,c1; d=math.hypot(x1-x0,y1-y0)
    a=(r0*r0-r1*r1+d*d)/(2*d); h=math.sqrt(max(r0*r0-a*a,0))
    xm=x0+a*(x1-x0)/d; ym=y0+a*(y1-y0)/d
    return [(xm+h*(y1-y0)/d, ym-h*(x1-x0)/d),(xm-h*(y1-y0)/d, ym+h*(x1-x0)/d)]

# ---- A: Seam S - ball whose seam is one S stroke, cut as real negative space
def arc(c,r,p,q):
    cr=(p[0]-c[0])*(q[1]-c[1])-(p[1]-c[1])*(q[0]-c[0])
    return f"A{f(r)} {f(r)} 0 0 {1 if cr>0 else 0} {f(q[0])} {f(q[1])}"
def concept_a(R=118, Rs=74, w=20):
    O=(C,C); C1=(C-Rs,C); C2=(C+Rs,C)
    out=[]
    for side in (-1,1):
        ru = Rs + side*w/2      # upper arc (centre left): left side nearer
        rl = Rs - side*w/2      # lower arc (centre right): left side farther
        pu=[p for p in cc_int(O,R,C1,ru) if p[1]<C][0]
        pl=[p for p in cc_int(O,R,C2,rl) if p[1]>C][0]
        mid=(C+side*w/2, C); ext=(C+side*R, C)
        d=(f"M{f(pu[0])} {f(pu[1])}"+arc(O,R,pu,ext)+arc(O,R,ext,pl)
           +arc(C2,rl,pl,mid)+arc(C1,ru,mid,pu)+"Z")
        out.append(d)
    return out

# ---- B: Booked box - court plan whose lines draw the T, ball in one service box
def rrect(x,y,w,h,r,cw=True):
    if cw:
        return (f"M{f(x+r)} {f(y)}H{f(x+w-r)}A{r} {r} 0 0 1 {f(x+w)} {f(y+r)}V{f(y+h-r)}A{r} {r} 0 0 1 {f(x+w-r)} {f(y+h)}"
                f"H{f(x+r)}A{r} {r} 0 0 1 {f(x)} {f(y+h-r)}V{f(y+r)}A{r} {r} 0 0 1 {f(x+r)} {f(y)}Z")
    return (f"M{f(x+r)} {f(y)}A{r} {r} 0 0 0 {f(x)} {f(y+r)}V{f(y+h-r)}A{r} {r} 0 0 0 {f(x+r)} {f(y+h)}"
            f"H{f(x+w-r)}A{r} {r} 0 0 0 {f(x+w)} {f(y+h-r)}V{f(y+r)}A{r} {r} 0 0 0 {f(x+w-r)} {f(y)}Z")
def concept_b(t=18):
    x0,y0,s=16,16,224; r=26
    inner_r=0.001
    sy=y0+t+62          # service line top
    # holes: back court (top), left box, right box
    top=rrect(x0+t,y0+t,s-2*t,sy-(y0+t),inner_r,False)
    by=sy+t; bh=y0+s-t-by; bw=(s-3*t)/2
    left=rrect(x0+t,by,bw,bh,inner_r,False)
    right=rrect(x0+2*t+bw,by,bw,bh,inner_r,False)
    frame=rrect(x0,y0,s,s,r)+top+left+right
    bc=(x0+t+bw/2, by+bh/2); br=min(bw,bh)/2-13
    ball=f"M{f(bc[0]-br)} {f(bc[1])}A{f(br)} {f(br)} 0 1 0 {f(bc[0]+br)} {f(bc[1])}A{f(br)} {f(br)} 0 1 0 {f(bc[0]-br)} {f(bc[1])}Z"
    return [frame, ball]

# ---- C: Kawung doubles - Solo's kawung batik: four ovals, one per player
def ellipse_path(cx,cy,rx,ry,ang):
    a=math.radians(ang); ux,uy=math.cos(a),math.sin(a)  # long axis dir
    p1=(cx+ux*ry,cy+uy*ry); p2=(cx-ux*ry,cy-uy*ry)
    return f"M{f(p1[0])} {f(p1[1])}A{rx} {ry} {f(ang-90)} 1 1 {f(p2[0])} {f(p2[1])}A{rx} {ry} {f(ang-90)} 1 1 {f(p1[0])} {f(p1[1])}Z"
def concept_c(d=58, rx=27, ry=44):
    ps=[]
    for k in range(4):
        ang=45+90*k
        ps.append(ellipse_path(C+d*math.cos(math.radians(ang)), C+d*math.sin(math.radians(ang)), rx, ry, ang))
    disc=f"M{C-118} {C}A118 118 0 1 0 {C+118} {C}A118 118 0 1 0 {C-118} {C}Z"
    return [disc+"".join(ps)]

def svg(paths, w=256, h=256, fills=None, ntext=0):
    fills=fills or ["#000"]*len(paths)
    body="".join(f'<path fill="{c}"{"" if i>=len(paths)-ntext else " fill-rule=\"evenodd\""} d="{p}"/>' for i,(p,c) in enumerate(zip(paths,fills)))
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}">{body}</svg>'

def lockup(sym):
    # symbol 256 + gap + STC (cap 120) over SOLO TENNIS CLUB
    big,b1=outline("STC",700,168,2,0,0)
    capTop=-b1[1]
    x=256+44
    big,b1=outline("STC",700,168,2,x-b1[0],128-6)          # baseline so caps sit upper part
    small,b2=outline("SOLO TENNIS CLUB",600,30.5,4.2,x,128+52)
    W=max(b1[2],b2[2])+8
    return svg(sym+[big,small],w=round(W),ntext=2)

for name,fn in [("a",concept_a),("b",concept_b),("c",concept_c)]:
    sym=fn()
    open(f"{name}-symbol.svg","w").write(svg(sym))
    open(f"{name}-lockup.svg","w").write(lockup(sym))
print("done")
