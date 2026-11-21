from PIL import Image, ImageDraw, ImageFont
F = ImageFont.truetype('/workspace/work/hiplab/assets/fonts/NotoSansSC.ttf', 20)
HIP={44:(1087,425),47:(1128,434),103:(1149,456),112:(1167,463),116:(1099,503)}
K = [(44,176,'1.47 s'),(47,190,'1.58 s'),(103,412,'3.43 s'),(112,449,'3.74 s'),(116,465,'3.87 s')]
OFF = {44:(0,0.05),47:(0,0),103:(0,0),112:(0,0),116:(0,0)}
def box(k):
    from PIL import ImageChops
    A=Image.open('shots/v-r6-%03d.png'%k).convert('RGB'); B=Image.open('shots/v-r7-%03d.png'%k).convert('RGB'); x0,y0,x1,y1=ImageChops.difference(A,B).getbbox()
    cx,cy=(x0+x1)/2,(y0+y1)/2; h=170; return (int(cx-h),int(cy-h),int(cx+h),int(cy+h))
S=320; cols=['原片','r6 视频机位','r7 视频机位','r6 正/下','r7 正/下','r6 背/后上','r7 背/后上']
Wd=S*len(cols); out=Image.new('RGB',(Wd,40+S*len(K)),'white'); d=ImageDraw.Draw(out)
for c,t in enumerate(cols): d.text((c*S+8,8),t,font=F,fill='black')
fr = {176:('0176-v0z','0176-back'),190:('0190-crotch','0190-back'),412:('0412-v0z','0412-back'),449:('0449-crotch','0449-back'),465:('0465-crotch','0465-back')}
for r,(k,f,lab) in enumerate(K):
    b=box(k); y=40+r*S
    hx,hy=HIP[k]; ims=[Image.open('src720/s-%d.png'%k).crop((hx-200,hy-200,hx+200,hy+200)),Image.open('shots/v-r6-%03d.png'%k).crop(b),Image.open('shots/v-r7-%03d.png'%k).crop(b)]
    a,bk=fr[f]; cr=.22
    for p,n in (('r6',a),('fin',a),('r6',bk),('fin',bk)):
        im=Image.open('shots/%s-%s.png'%(p,n)); w,h=im.size; ims.append(im.crop((int(w*cr),int(h*cr),int(w*(1-cr)),int(h*(1-cr)))))
    for c,im in enumerate(ims): out.paste(im.convert('RGB').resize((S,S)),(c*S,y))
    d.rectangle((0,y,92,y+28),fill='black'); d.text((6,y+2),lab,font=F,fill='white')
    for c in range(1,len(cols)): d.line((c*S,40,c*S,out.size[1]),fill='white',width=2)
out.save('crotch_flat_r6_vs_r7.jpg',quality=88); print(out.size)
