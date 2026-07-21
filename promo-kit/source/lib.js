const { createCanvas, GlobalFonts } = require('@napi-rs/canvas');
const fs = require('fs');
const LP='/usr/share/fonts/truetype/liberation/';
GlobalFonts.registerFromPath(LP+'LiberationSans-Bold.ttf','UIB');
GlobalFonts.registerFromPath(LP+'LiberationSans-Regular.ttf','UIR');
const DP='/usr/share/fonts/truetype/dejavu/';
GlobalFonts.registerFromPath(DP+'DejaVuSans-Bold.ttf','DVB');

const W=1080,H=1920;
const clamp=(t,a=0,b=1)=>Math.max(a,Math.min(b,t));
const lerp=(a,b,t)=>a+(b-a)*t;
const easeOut=t=>1-Math.pow(1-t,3);
const easeInOut=t=>t<0.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;
// seeded rng for stable starfield
function mulberry(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
const rnd=mulberry(20260720);
const STARS=[]; for(let i=0;i<220;i++){STARS.push({x:rnd()*W,y:rnd()*H,r:rnd()*1.8+0.3,a:rnd()*0.6+0.15,tw:rnd()*6.28});}

function rr(ctx,x,y,w,h,r){r=Math.min(r,w/2,h/2);ctx.beginPath();ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+h,r);ctx.arcTo(x+w,y+h,x,y+h,r);ctx.arcTo(x,y+h,x,y,r);ctx.arcTo(x,y,x+w,y,r);ctx.closePath();}

function background(ctx,t){
  // base gradient
  let g=ctx.createRadialGradient(W*0.5,H*0.30,80,W*0.5,H*0.42,H*0.9);
  g.addColorStop(0,'#341560');g.addColorStop(0.45,'#1c0f3c');g.addColorStop(1,'#0a0617');
  ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
  // magenta lower glow
  let m=ctx.createRadialGradient(W*0.5,H*0.86,40,W*0.5,H*0.86,H*0.6);
  m.addColorStop(0,'rgba(196,54,158,0.55)');m.addColorStop(0.5,'rgba(120,40,140,0.18)');m.addColorStop(1,'rgba(0,0,0,0)');
  ctx.fillStyle=m;ctx.fillRect(0,0,W,H);
  // top violet bloom
  let v=ctx.createRadialGradient(W*0.5,H*0.06,10,W*0.5,H*0.06,H*0.4);
  v.addColorStop(0,'rgba(150,90,255,0.35)');v.addColorStop(1,'rgba(0,0,0,0)');
  ctx.fillStyle=v;ctx.fillRect(0,0,W,H);
  // stars
  for(const s of STARS){const a=s.a*(0.6+0.4*Math.sin(t*1.6+s.tw));ctx.fillStyle='rgba(255,255,255,'+a.toFixed(3)+')';ctx.beginPath();ctx.arc(s.x,s.y,s.r,0,6.2832);ctx.fill();}
  // vignette
  let vg=ctx.createRadialGradient(W*0.5,H*0.5,H*0.35,W*0.5,H*0.5,H*0.75);
  vg.addColorStop(0,'rgba(0,0,0,0)');vg.addColorStop(1,'rgba(0,0,0,0.55)');
  ctx.fillStyle=vg;ctx.fillRect(0,0,W,H);
}

// neon glass panel; returns nothing, draws at x,y,w,h
function panel(ctx,x,y,w,h,r,glow){
  glow=glow==null?1:glow;
  ctx.save();
  // outer neon glow
  ctx.shadowColor='rgba(236,72,168,'+(0.55*glow)+')';ctx.shadowBlur=55*glow;
  rr(ctx,x,y,w,h,r);
  let rim=ctx.createLinearGradient(x,y,x+w,y+h);
  rim.addColorStop(0,'#ff62ad');rim.addColorStop(0.5,'#a855f7');rim.addColorStop(1,'#5f8dff');
  ctx.strokeStyle=rim;ctx.lineWidth=2.4;ctx.stroke();
  ctx.restore();
  // fill
  rr(ctx,x,y,w,h,r);
  let fg=ctx.createLinearGradient(0,y,0,y+h);
  fg.addColorStop(0,'rgba(30,21,50,0.97)');fg.addColorStop(1,'rgba(15,10,27,0.98)');
  ctx.fillStyle=fg;ctx.fill();
  // top sheen
  ctx.save();rr(ctx,x,y,w,h,r);ctx.clip();
  let sh=ctx.createLinearGradient(0,y,0,y+h*0.28);
  sh.addColorStop(0,'rgba(255,255,255,0.06)');sh.addColorStop(1,'rgba(255,255,255,0)');
  ctx.fillStyle=sh;ctx.fillRect(x,y,w,h*0.28);
  ctx.restore();
}

function text(ctx,s,x,y,size,color,{font='UIB',align='left',alpha=1}={}){
  ctx.globalAlpha=alpha;ctx.fillStyle=color;ctx.font=size+'px '+font;ctx.textAlign=align;ctx.textBaseline='alphabetic';ctx.fillText(s,x,y);ctx.globalAlpha=1;ctx.textAlign='left';
}

// Tawaslo linked-circles mark
function mark(ctx,cx,cy,s,alpha=1){
  ctx.save();ctx.globalAlpha=alpha;ctx.translate(cx,cy);
  let g=ctx.createLinearGradient(-s,-s,s,s);g.addColorStop(0,'#8b5cf6');g.addColorStop(1,'#c94ba0');
  ctx.strokeStyle=g;ctx.lineWidth=s*0.34;ctx.lineCap='round';
  ctx.beginPath();ctx.arc(-s*0.42,0,s*0.62,-1.1,3.6);ctx.stroke();
  ctx.beginPath();ctx.arc(s*0.42,0,s*0.62,2.05,6.7);ctx.stroke();
  ctx.restore();
}

// gradient keyword caption at bottom
function captionBlock(ctx,line1,kw,line2,alpha,rise){
  const cx=W/2, by=H-330+ (1-rise)*40;
  ctx.textAlign='center';
  const sz=66;ctx.font=sz+'px UIB';
  ctx.globalAlpha=alpha;
  // line1 (white) possibly with colored keyword appended
  if(line2){
    ctx.fillStyle='#fff';ctx.fillText(line1,cx,by);
    // keyword line gradient
    let g=ctx.createLinearGradient(cx-300,0,cx+300,0);g.addColorStop(0,'#ff77bf');g.addColorStop(1,'#7aa2ff');
    ctx.fillStyle=g;ctx.fillText(line2,cx,by+80);
  } else {
    ctx.fillStyle='#fff';ctx.fillText(line1,cx,by+40);
  }
  ctx.globalAlpha=1;ctx.textAlign='left';
}

module.exports={createCanvas,W,H,clamp,lerp,easeOut,easeInOut,rr,background,panel,text,mark,captionBlock,fs};

// ---- realism helpers (appended) ----
const _L=module.exports;
_L.brandLockup=function(ctx,x,y,s,alpha){
  ctx.save();ctx.globalAlpha=alpha==null?1:alpha;
  _L.mark(ctx,x+s*0.7,y,s*0.9,1);
  ctx.fillStyle='#efe8fb';ctx.font=(s*1.7)+'px UIB';ctx.textAlign='left';ctx.textBaseline='middle';
  ctx.fillText('Tawaslo',x+s*1.9,y+1);
  ctx.restore();ctx.textBaseline='alphabetic';
};
_L.cursor=function(ctx,x,y,click){
  ctx.save();
  if(click>0){ctx.beginPath();ctx.arc(x,y,18+click*26,0,6.29);ctx.strokeStyle='rgba(255,255,255,'+(0.5*(1-click))+')';ctx.lineWidth=3;ctx.stroke();}
  ctx.translate(x,y);ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(0,26);ctx.lineTo(7,20);ctx.lineTo(12,30);ctx.lineTo(16,28);ctx.lineTo(11,18);ctx.lineTo(20,18);ctx.closePath();
  ctx.fillStyle='#fff';ctx.shadowColor='rgba(0,0,0,0.5)';ctx.shadowBlur=8;ctx.fill();ctx.strokeStyle='#241636';ctx.lineWidth=1.5;ctx.stroke();
  ctx.restore();
};
_L.toast=function(ctx,x,y,w,title,sub,alpha,slide){
  ctx.save();ctx.globalAlpha=alpha;ctx.translate((1-slide)*60,0);
  const h=100;_L.rr(ctx,x,y,w,h,18);
  ctx.shadowColor='rgba(52,211,153,0.35)';ctx.shadowBlur=30;
  let g=ctx.createLinearGradient(x,y,x,y+h);g.addColorStop(0,'rgba(34,24,44,0.98)');g.addColorStop(1,'rgba(18,12,28,0.98)');
  ctx.fillStyle=g;ctx.fill();ctx.shadowBlur=0;ctx.strokeStyle='rgba(52,211,153,0.5)';ctx.lineWidth=1.5;ctx.stroke();
  ctx.beginPath();ctx.arc(x+40,y+50,20,0,6.29);ctx.fillStyle='#34d399';ctx.fill();
  ctx.strokeStyle='#04210f';ctx.lineWidth=4;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(x+31,y+50);ctx.lineTo(x+38,y+58);ctx.lineTo(x+50,y+42);ctx.stroke();
  _L.text(ctx,title,x+76,y+44,25,'#fff');_L.text(ctx,sub,x+76,y+76,20,'#9be7c4',{font:'UIR'});
  ctx.restore();
};
// count-up formatting: v numeric target, suf suffix
_L.countUp=function(target,suf,p){const v=target*p;let s;if(suf==='%')s=v.toFixed(1);else if(suf==='M')s=v.toFixed(1);else if(suf==='k')s=v.toFixed(1);else s=Math.round(v).toString();return s+suf;};
