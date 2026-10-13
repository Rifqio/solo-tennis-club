# usage: outline.py "TEXT" weight size tracking -> prints path d, width, cap-top offset
import sys
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.pens.boundsPen import BoundsPen
FONT=r"E:/Code/TApp/node_modules/@fontsource-variable/outfit/files/outfit-latin-wght-normal.woff2"
def outline(text, wght, size, track=0, x0=0, baseline=0):
    f=TTFont(FONT); f=instantiateVariableFont(f,{"wght":wght})
    gs=f.getGlyphSet(); cmap=f.getBestCmap(); upm=f['head'].unitsPerEm; s=size/upm
    pen=SVGPathPen(gs); x=0
    for ch in text:
        g=cmap[ord(ch)]
        tp=TransformPen(pen,(s,0,0,-s,x0+x,baseline)); gs[g].draw(tp)
        x+=gs[g].width*s+track
    bp=BoundsPen(gs); x=0
    for ch in text:
        g=cmap[ord(ch)]; tp=TransformPen(bp,(s,0,0,-s,x0+x,baseline)); gs[g].draw(tp); x+=gs[g].width*s+track
    return pen.getCommands(), bp.bounds
if __name__=="__main__":
    d,b=outline(sys.argv[1],float(sys.argv[2]),float(sys.argv[3]),float(sys.argv[4]))
    print(b); print(d[:200])
