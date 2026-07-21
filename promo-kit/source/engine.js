const L=require('./lib.js');const B=require('./bodies.js');
const {createCanvas,W,H,clamp,lerp,easeOut,easeInOut,rr,background,panel,text,mark,captionBlock,brandLockup,cursor,toast,fs}=L;

const SCENES={
  dashboard:{body:B.analytics,eyebrow:'ONE DASHBOARD',l1:'Run every brand',kw:'from one screen',dur:4.6,extras:'dash'},
  planner:{body:B.planner,eyebrow:'PLAN & AUTO-PUBLISH',l1:'A month of content,',kw:'scheduled in minutes',dur:4.6,extras:'plan'},
  ai:{body:B.ai,eyebrow:'AI STUDIO',l1:'AI writes, replies',kw:'and sells — in Arabic',dur:5.0},
  whatsapp:{body:B.whatsapp,eyebrow:'WHATSAPP ENGINE',l1:'Orders & bookings,',kw:'straight to WhatsApp',dur:4.8},
  google:{body:B.google,eyebrow:'GOOGLE BUSINESS',l1:'Win on Google —',kw:'reviews on autopilot',dur:4.8},
  menu:{body:B.menu,eyebrow:'LIVING MENU',l1:'Update your menu live,',kw:'never reprint again',dur:4.8},
  pickup:{body:B.pickup,eyebrow:'PICKUP ORDERING',l1:'Take orders direct —',kw:'skip the delivery cut',dur:5.0},
  reservations:{body:B.reservations,eyebrow:'RESERVATIONS',l1:'It books the table',kw:'while you run the floor',dur:4.8},
  audience:{body:B.audience,eyebrow:'BUILT FOR EVERYONE',l1:'',kw:'',dur:4.8},
};
const FPS=25;
const geom={pw:944,ph:980,px:(W-944)/2,pyRest:392};

function extrasDraw(kind,ctx,t,g){
  if(kind==='dash'){
    // live toast slides in top-right of panel
    const ta=clamp((t-1.9)/0.5), ts=easeOut(ta);
    if(ta>0) toast(ctx,g.px+g.pw-430,g.py-26,410,'Post published','Marina Café · Instagram',Math.min(1,ta*1.4),ts);
    // cursor moves toward publish then click ripple
    const cx=lerp(W*0.5,g.px+g.pw-235,easeOut(clamp((t-1.0)/0.8)));
    const cy=lerp(H*0.62,g.py+84,easeOut(clamp((t-1.0)/0.8)));
    const click=t>1.75&&t<2.05?clamp((t-1.75)/0.3):0;
    if(t>0.9&&t<2.6){ctx.globalAlpha=clamp((t-0.9)/0.3)*clamp((2.6-t)/0.3);cursor(ctx,cx,cy,click);ctx.globalAlpha=1;}
  }
  if(kind==='plan'){
    const cx=lerp(W*0.42,g.px+g.pw*0.72,easeOut(clamp((t-1.0)/1.0)));
    const cy=lerp(H*0.6,g.py+g.ph*0.55,easeOut(clamp((t-1.0)/1.0)));
    if(t>0.9&&t<3.0){ctx.globalAlpha=clamp((t-0.9)/0.3)*clamp((3.0-t)/0.3);cursor(ctx,cx,cy,0);ctx.globalAlpha=1;}
  }
}


function drawFrame(ctx,name,mode,f){
  const S=SCENES[name];const {pw,ph,px,pyRest}=geom;const t=f/FPS;
  ctx.clearRect(0,0,W,H);
  if(mode!=='alpha') background(ctx,t);
  const bl=clamp((t-0.1)/0.5);brandLockup(ctx,70,150,26,bl);
  const eb=clamp((t-0.2)/0.5);
  ctx.save();ctx.globalAlpha=eb;ctx.textAlign='center';
  let gg=ctx.createLinearGradient(W/2-200,0,W/2+200,0);gg.addColorStop(0,'#ff8fce');gg.addColorStop(1,'#8fb0ff');
  ctx.fillStyle=gg;ctx.font='28px UIB';ctx.fillText(S.eyebrow.split('').join(' '),W/2,268);ctx.restore();ctx.textAlign='left';
  const fi=easeOut(clamp(t/0.9));
  const py=pyRest+(1-fi)*120;const sc=lerp(0.94,1,fi);const alpha=clamp(t/0.6);
  const floatY=Math.sin(t*1.1)*6;
  ctx.save();ctx.globalAlpha=alpha;
  const ccx=px+pw/2,ccy=py+ph/2+floatY;ctx.translate(ccx,ccy);ctx.scale(sc,sc);ctx.translate(-ccx,-ccy);
  panel(ctx,px,py+floatY,pw,ph,34,1);
  ctx.save();rr(ctx,px+2,py+floatY+2,pw-4,ph-4,32);ctx.clip();
  S.body(ctx,px+8,py+floatY+14,pw-16,ph-28,clamp((t-0.35)/(S.dur*0.55)),t-0.35);
  ctx.restore();
  const sweep=(t*0.5)%2.4;if(sweep<1){ctx.save();rr(ctx,px,py+floatY,pw,ph,34);ctx.clip();const lx=px-300+sweep*(pw+600);let lg=ctx.createLinearGradient(lx-120,0,lx+120,0);lg.addColorStop(0,'rgba(255,255,255,0)');lg.addColorStop(0.5,'rgba(255,255,255,0.05)');lg.addColorStop(1,'rgba(255,255,255,0)');ctx.fillStyle=lg;ctx.fillRect(px,py+floatY,pw,ph);ctx.restore();}
  ctx.restore();
  if(S.extras) extrasDraw(S.extras,ctx,t,{px,py:py+floatY,pw,ph});
  const cap=clamp((t-0.95)/0.6);const rise=easeOut(cap);
  if(S.l1||S.kw)captionBlock(ctx,S.l1,S.kw,S.kw,cap,rise);
}
function stillPanel(name){
  const S=SCENES[name];const cv=createCanvas(W,H);const ctx=cv.getContext('2d');
  const {pw,ph,px,pyRest}=geom;const t=S.dur-0.1;
  panel(ctx,px,pyRest,pw,ph,34,1);
  ctx.save();rr(ctx,px+2,pyRest+2,pw-4,ph-4,32);ctx.clip();S.body(ctx,px+8,pyRest+14,pw-16,ph-28,1,t);ctx.restore();
  const m=70;const cw=pw+m*2, ch=ph+m*2;const out=createCanvas(cw,ch);out.getContext('2d').drawImage(cv,px-m,pyRest-m,cw,ch,0,0,cw,ch);
  return out.toBuffer('image/png');
}
function bgFrame(ctx,f){ctx.clearRect(0,0,W,H);background(ctx,f/FPS);}
function frameCount(name){return Math.round(SCENES[name].dur*FPS);}
module.exports={SCENES,geom,FPS,W,H,createCanvas,drawFrame,stillPanel,bgFrame,frameCount,fs};
