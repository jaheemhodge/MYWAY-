# Usage: python3 scripts/video/day01_poster.py public/videos/day-01/day01-poster.jpg
import sys
from PIL import Image, ImageDraw, ImageFont
W,H=1920,1080
img=Image.new("RGB",(W,H),(244,240,233))
d=ImageDraw.Draw(img)
# soft gradient band
for y in range(H):
    t=y/H
    d.line([(0,y),(W,y)],fill=(int(244-10*t),int(240-6*t),int(233-2*t)))
F="/usr/share/fonts/opentype/inter/"
f=lambda n,s: ImageFont.truetype(F+n,s)
ink=(38,52,48); sage=(92,122,108); muted=(110,118,112)
# simple hip-knee-ankle motif
cx=1480
pts=[(cx,300),(cx+40,560),(cx-10,800)]
d.line(pts,fill=sage,width=14,joint="curve")
for (x,y),r in zip(pts,(34,30,26)):
    d.ellipse([x-r,y-r,x+r,y+r],fill=(244,240,233),outline=sage,width=10)
d.text((cx+80,286),"Hip",font=f("Inter-Medium.otf",34),fill=muted)
d.text((cx+110,546),"Knee",font=f("Inter-Medium.otf",34),fill=muted)
d.text((cx+60,786),"Ankle",font=f("Inter-Medium.otf",34),fill=muted)
d.text((140,170),"MOBILITY  ·  DAY 1",font=f("Inter-SemiBold.otf",36),fill=sage)
d.text((140,250),"Build Stronger",font=f("InterDisplay-SemiBold.otf",120),fill=ink)
d.text((140,390),"Support for",font=f("InterDisplay-SemiBold.otf",120),fill=ink)
d.text((140,530),"Your Knees",font=f("InterDisplay-SemiBold.otf",120),fill=ink)
d.text((140,720),"Seated knee extension  ·  Standing hip extension  ·  Sit-to-stand",font=f("Inter-Regular.otf",36),fill=muted)
d.text((140,780),"About 8 minutes  ·  Chair and counter",font=f("Inter-Regular.otf",36),fill=muted)
d.rounded_rectangle([140,900,520,960],radius=30,outline=(170,110,60),width=3)
d.text((170,910),"DRAFT · NOT APPROVED",font=f("Inter-SemiBold.otf",28),fill=(170,110,60))
img.save(sys.argv[1],quality=90)
