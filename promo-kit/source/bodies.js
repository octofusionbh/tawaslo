const {rr,text,mark,clamp,lerp,easeOut}=require('./lib.js');
// All bodies draw INSIDE a panel at (x,y,w,h). p = progress 0..1 for internal anims.
const NET=[['#E1306C','IG'],['#25D366','WA'],['#1DA1F2','X'],['#1877F2','f'],['#000','TT'],['#FF0000','YT'],['#4285F4','G']];
function chip(ctx,x,y,label,col){rr(ctx,x,y,150,44,22);ctx.fillStyle='rgba(255,255,255,0.06)';ctx.fill();ctx.strokeStyle='rgba(255,255,255,0.12)';ctx.lineWidth=1;ctx.stroke();ctx.beginPath();ctx.arc(x+24,y+22,8,0,6.29);ctx.fillStyle=col;ctx.fill();text(ctx,label,x+40,y+29,20,'#cbb8e6',{font:'UIR'});}
function head(ctx,x,y,w,title){mark(ctx,x+30,y+26,16);text(ctx,title,x+58,y+34,26,'#fff');ctx.beginPath();ctx.arc(x+w-112,y+27,7,0,6.29);ctx.fillStyle='#34d399';ctx.fill();text(ctx,'Live',x+w-96,y+34,20,'#9be7c4',{font:'UIR'});}

function analytics(ctx,x,y,w,h,p,t){
  t=t==null?p*4:t;
  head(ctx,x,y+18,w,'Marina Café — Overview');
  const stats=[['Followers',24.8,'k','+6.4%'],['Reach',1.2,'M','+18%'],['Engagement',9.1,'%','+2.3%']];
  const cw=(w-72)/3; let sx=x+24;
  const {clamp,lerp,easeOut,countUp}=require('./lib.js');
  for(let i=0;i<stats.length;i++){const s=stats[i];const te=clamp((t-(0.2+i*0.13))/0.5);const e=easeOut(te);const oy=(1-e)*26;ctx.globalAlpha=e;
    rr(ctx,sx,y+70+oy,cw,120,16);ctx.fillStyle='rgba(255,255,255,0.04)';ctx.fill();ctx.strokeStyle='rgba(255,255,255,0.08)';ctx.lineWidth=1;ctx.stroke();
    text(ctx,s[0],sx+18,y+104+oy,19,'#a08fc0',{font:'UIR'});
    const cp=clamp((t-(0.4+i*0.13))/0.9);text(ctx,countUp(s[1],s[2],easeOut(cp)),sx+18,y+150+oy,40,'#fff');
    text(ctx,s[3],sx+18,y+178+oy,19,'#5fe0a8',{font:'UIR'});ctx.globalAlpha=1;sx+=cw+24;}
  const gx=x+24,gy=y+214,gw=w-48,gh=h-214-150;
  rr(ctx,gx,gy,gw,gh,16);ctx.fillStyle='rgba(255,255,255,0.03)';ctx.fill();ctx.strokeStyle='rgba(255,255,255,0.07)';ctx.lineWidth=1;ctx.stroke();
  const pts=[0.2,0.32,0.28,0.45,0.4,0.6,0.55,0.72,0.68,0.85,0.92];
  const n=pts.length, dr=clamp((t-0.5)/1.5)*(n-1);
  ctx.save();rr(ctx,gx,gy,gw,gh,16);ctx.clip();
  let grad=ctx.createLinearGradient(0,gy,0,gy+gh);grad.addColorStop(0,'#ff6ab0');grad.addColorStop(1,'#6f8cff');
  ctx.strokeStyle=grad;ctx.lineWidth=4;ctx.lineJoin='round';ctx.beginPath();
  let lastX=gx+30,lastY=gy+gh-24;
  for(let i=0;i<n;i++){const px=gx+30+(gw-60)*(i/(n-1));const py=gy+gh-24-(gh-48)*pts[i];if(i===0){ctx.moveTo(px,py);lastX=px;lastY=py;}else if(i<=dr+1){ctx.lineTo(px,py);lastX=px;lastY=py;}}
  ctx.stroke();
  ctx.lineTo(lastX,gy+gh-24);ctx.lineTo(gx+30,gy+gh-24);ctx.closePath();
  let ag=ctx.createLinearGradient(0,gy,0,gy+gh);ag.addColorStop(0,'rgba(255,106,176,0.22)');ag.addColorStop(1,'rgba(111,140,255,0)');ctx.fillStyle=ag;ctx.fill();
  // moving dot at head of line
  if(dr<n-1){ctx.beginPath();ctx.arc(lastX,lastY,7,0,6.29);ctx.fillStyle='#fff';ctx.shadowColor='#ff6ab0';ctx.shadowBlur=16;ctx.fill();ctx.shadowBlur=0;}
  ctx.restore();
  text(ctx,'Reach — last 30 days',gx+24,gy+40,20,'#c9b6e6',{font:'UIR'});
  const ry=y+h-118;text(ctx,'Scheduled',x+24,ry+2,20,'#a08fc0',{font:'UIR'});
  let qx=x+24;for(let i=0;i<7;i++){const te=clamp((t-(1.3+i*0.08))/0.4);const e=easeOut(te);ctx.globalAlpha=e;const oy=(1-e)*14;
    rr(ctx,qx,ry+18+oy,80,80,12);ctx.fillStyle='rgba(255,255,255,0.05)';ctx.fill();ctx.strokeStyle='rgba(255,255,255,0.09)';ctx.stroke();ctx.beginPath();ctx.arc(qx+40,ry+58+oy,12,0,6.29);ctx.fillStyle=NET[i%NET.length][0];ctx.fill();ctx.globalAlpha=1;qx+=96;}
}

function planner(ctx,x,y,w,h,p){
  head(ctx,x,y+18,w,'Content Planner — June');
  const days=['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];const cw=(w-48)/7;
  let gx=x+24,gy=y+80;
  for(let i=0;i<7;i++){text(ctx,days[i],gx+i*cw+cw/2,gy,18,'#a08fc0',{font:'UIR',align:'center'});}
  const cells=[[0,0,'#E1306C'],[2,0,'#25D366'],[4,1,'#1DA1F2'],[1,2,'#FF0000'],[5,2,'#1877F2'],[3,3,'#E1306C'],[6,3,'#000'],[0,4,'#4285F4'],[2,4,'#E1306C'],[4,4,'#25D366']];
  const rows=5, ch=(h-120-40)/rows;gy+=20;
  for(let r=0;r<rows;r++)for(let c=0;c<7;c++){rr(ctx,gx+c*cw+4,gy+r*ch+4,cw-8,ch-8,10);ctx.fillStyle='rgba(255,255,255,0.03)';ctx.fill();ctx.strokeStyle='rgba(255,255,255,0.06)';ctx.lineWidth=1;ctx.stroke();}
  const show=Math.floor(easeOut(clamp(p*1.3))*cells.length);
  for(let k=0;k<show;k++){const[c,r,col]=cells[k];rr(ctx,gx+c*cw+10,gy+r*ch+10,cw-20,ch-40,8);ctx.fillStyle=col;ctx.globalAlpha=0.9;ctx.fill();ctx.globalAlpha=1;text(ctx,'▲ posted',gx+c*cw+16,gy+r*ch+ch-20,13,'#d8c9ef',{font:'DVB'});}
}

function ai(ctx,x,y,w,h,p){
  head(ctx,x,y+18,w,'AI Studio — Caption');
  const msgs=[['u','Write a launch caption for our new saffron latte'],['a','Meet the Saffron Latte — velvety, aromatic, unmistakably ours. Now pouring at Marina Café. #Manama #SpecialtyCoffee'],['u','Make an Arabic version too'],['a','قهوتنا الجديدة بالزعفران وصلت — نكهة ملكية بانتظارك في مارينا كافيه.']];
  let cy=y+90;const show=Math.floor(clamp(p*1.25)*msgs.length+0.001);
  for(let i=0;i<Math.min(show+1,msgs.length);i++){const[who,t]=msgs[i];const right=who==='u';const bw=w-140;
    const lines=wrap(ctx,t,bw-40,24);const bh=lines.length*32+30;const bx=right?x+w-24-bw*0.82:x+24;const bwid=bw*0.82;
    rr(ctx,bx,cy,bwid,bh,16);
    if(right){let g=ctx.createLinearGradient(bx,cy,bx+bwid,cy);g.addColorStop(0,'#7c3aed');g.addColorStop(1,'#c94ba0');ctx.fillStyle=g;}
    else ctx.fillStyle='rgba(255,255,255,0.06)';
    ctx.fill();if(!right){ctx.strokeStyle='rgba(255,255,255,0.1)';ctx.lineWidth=1;ctx.stroke();}
    let ty=cy+34;for(const ln of lines){text(ctx,ln,bx+20,ty,24,right?'#fff':'#e7ddf6',{font:'UIR'});ty+=32;}
    cy+=bh+18;}
}
function wrap(ctx,s,maxw,size){ctx.font=size+'px UIR';const words=s.split(' ');let line='',out=[];for(const wd of words){const test=line?line+' '+wd:wd;if(ctx.measureText(test).width>maxw&&line){out.push(line);line=wd;}else line=test;}if(line)out.push(line);return out;}

function whatsapp(ctx,x,y,w,h,p){
  head(ctx,x,y+18,w,'WhatsApp — Auto notifications');
  const msgs=[['New order #1042','Marina Café · Pickup 7:30pm','2× Saffron Latte, 1× Croissant — 6.400 BHD','#25D366'],['Booking confirmed','Table for 4 · Tonight 9:00pm','Guest: Sara — reminder sent','#25D366'],['Loyalty reward','+50 pts · Sara reached Gold','Win-back message queued','#a855f7']];
  let cy=y+90;const show=Math.floor(clamp(p*1.25)*msgs.length+0.001);
  for(let i=0;i<Math.min(show+1,msgs.length);i++){const m=msgs[i];const bh=150;rr(ctx,x+24,cy,w-48,bh,18);ctx.fillStyle='rgba(255,255,255,0.05)';ctx.fill();ctx.strokeStyle='rgba(255,255,255,0.09)';ctx.lineWidth=1;ctx.stroke();
    ctx.beginPath();ctx.arc(x+58,cy+42,20,0,6.29);ctx.fillStyle=m[3];ctx.fill();text(ctx,'✓',x+51,cy+50,24,'#fff');
    text(ctx,m[0],x+92,cy+40,26,'#fff');text(ctx,m[1],x+92,cy+74,20,'#9fb0c8',{font:'UIR'});text(ctx,m[2],x+92,cy+108,20,'#cbb8e6',{font:'UIR'});
    text(ctx,'now',x+w-80,cy+40,18,'#7d8aa0',{font:'UIR'});cy+=bh+18;}
}

function google(ctx,x,y,w,h,p){
  head(ctx,x,y+18,w,'Google Business — Live');
  rr(ctx,x+24,y+80,w-48,150,16);ctx.fillStyle='rgba(255,255,255,0.04)';ctx.fill();ctx.strokeStyle='rgba(255,255,255,0.08)';ctx.stroke();
  text(ctx,'Marina Café & Bistro',x+48,y+130,32,'#fff');text(ctx,'4.9  ★★★★★  · 812 reviews',x+48,y+170,22,'#f4c150',{font:'DVB'});text(ctx,'Manama · Open now · Coffee shop',x+48,y+204,20,'#9fb0c8',{font:'UIR'});
  const revs=[['Layla','★★★★★','Best saffron latte in Bahrain. Replied in minutes!'],['Omar','★★★★★','Booked a table straight from Google. Seamless.'],['Noor','★★★★☆','Lovely spot, quick service, great coffee.']];
  let cy=y+250;const show=Math.floor(clamp(p*1.3)*revs.length+0.001);
  for(let i=0;i<Math.min(show+1,revs.length);i++){const r=revs[i];rr(ctx,x+24,cy,w-48,120,14);ctx.fillStyle='rgba(255,255,255,0.03)';ctx.fill();ctx.strokeStyle='rgba(255,255,255,0.07)';ctx.stroke();
    ctx.beginPath();ctx.arc(x+56,cy+38,18,0,6.29);ctx.fillStyle='#4285F4';ctx.fill();text(ctx,r[0][0],x+49,cy+46,22,'#fff');
    text(ctx,r[0],x+88,cy+36,24,'#fff');text(ctx,r[1],x+88,cy+66,18,'#f4c150',{font:'DVB'});text(ctx,r[2],x+88,cy+98,19,'#c9b6e6',{font:'UIR'});cy+=134;}
}

function menu(ctx,x,y,w,h,p){
  head(ctx,x,y+18,w,'Living Menu — Marina Café');
  const items=[['Saffron Latte','Signature · velvety','2.400',1],['Truffle Croissant','Fresh daily','3.100',1],['Date & Tahini Cake','Chef special','2.800',1],['Iced Spanish Latte','Bestseller','2.600',0],['Shakshuka','Sold out today','3.400',0]];
  let cy=y+96;const show=Math.floor(clamp(p*1.3)*items.length+0.001);
  for(let i=0;i<Math.min(show+1,items.length);i++){const it=items[i];rr(ctx,x+24,cy,w-48,116,16);ctx.fillStyle='rgba(255,255,255,0.04)';ctx.fill();ctx.strokeStyle='rgba(255,255,255,0.08)';ctx.stroke();
    rr(ctx,x+40,cy+18,80,80,12);let ig=ctx.createLinearGradient(x+40,cy,x+120,cy+80);ig.addColorStop(0,'#c94ba0');ig.addColorStop(1,'#6f8cff');ctx.fillStyle=ig;ctx.fill();
    text(ctx,it[0],x+140,cy+52,26,it[3]?'#fff':'#8a7ba6');text(ctx,it[1],x+140,cy+86,20,it[3]?'#a08fc0':'#7a6b96',{font:'UIR'});
    text(ctx,it[2]+' BHD',x+w-60,cy+56,26,it[3]?'#5fe0a8':'#8a7ba6',{align:'right'});
    if(!it[3]){text(ctx,'Sold out',x+w-60,cy+88,17,'#c96a8a',{font:'UIR',align:'right'});}
    cy+=132;}
}

function pickup(ctx,x,y,w,h,p){
  head(ctx,x,y+18,w,'Pickup Order — Checkout');
  const items=[['2× Saffron Latte','4.800'],['1× Truffle Croissant','3.100'],['1× Date Cake','2.800']];
  let cy=y+96;const show=Math.floor(clamp(p*1.15)*(items.length+1)+0.001);
  for(let i=0;i<Math.min(show,items.length);i++){rr(ctx,x+24,cy,w-48,88,14);ctx.fillStyle='rgba(255,255,255,0.04)';ctx.fill();ctx.strokeStyle='rgba(255,255,255,0.08)';ctx.stroke();
    text(ctx,items[i][0],x+48,cy+54,26,'#fff',{font:'UIR'});text(ctx,items[i][1]+' BHD',x+w-56,cy+54,26,'#cbb8e6',{align:'right'});cy+=100;}
  // total + button
  rr(ctx,x+24,cy+6,w-48,70,14);ctx.fillStyle='rgba(255,255,255,0.02)';ctx.fill();
  text(ctx,'Total',x+48,cy+50,26,'#a08fc0',{font:'UIR'});text(ctx,'10.700 BHD',x+w-56,cy+50,30,'#fff',{align:'right'});
  const by=cy+96;rr(ctx,x+24,by,w-48,84,18);let g=ctx.createLinearGradient(x,by,x+w,by);g.addColorStop(0,'#25D366');g.addColorStop(1,'#12b358');ctx.fillStyle=g;
  ctx.save();ctx.shadowColor='rgba(37,211,102,0.5)';ctx.shadowBlur=30;ctx.fill();ctx.restore();
  text(ctx,'Pay & pick up in 15 min',x+w/2,by+52,28,'#04210f',{align:'center'});
  // assistant bubble
  const ab=clamp((p-0.5)*3);if(ab>0){ctx.globalAlpha=ab;rr(ctx,x+w-150,y+30,120,54,27);let ag=ctx.createLinearGradient(x+w-150,0,x+w-30,0);ag.addColorStop(0,'#7c3aed');ag.addColorStop(1,'#c94ba0');ctx.fillStyle=ag;ctx.fill();text(ctx,'Ask AI',x+w-124,y+64,22,'#fff');ctx.globalAlpha=1;}
}

function reservations(ctx,x,y,w,h,p){
  head(ctx,x,y+18,w,'Reservations — Tonight');
  const books=[['9:00 PM','Sara · 4 guests','Window · confirmed','#5fe0a8'],['9:30 PM','Ahmed · 2 guests','Bar · confirmed','#5fe0a8'],['10:00 PM','Layla · 6 guests','Terrace · pending','#f4c150'],['10:30 PM','Walk-in','Table 12 · seated','#8fb0ff']];
  let cy=y+96;const show=Math.floor(clamp(p*1.3)*books.length+0.001);
  for(let i=0;i<Math.min(show+1,books.length);i++){const b=books[i];rr(ctx,x+24,cy,w-48,104,16);ctx.fillStyle='rgba(255,255,255,0.04)';ctx.fill();ctx.strokeStyle='rgba(255,255,255,0.08)';ctx.stroke();
    text(ctx,b[0],x+44,cy+62,30,'#fff');text(ctx,b[1],x+220,cy+48,24,'#e7ddf6',{font:'UIR'});text(ctx,b[2],x+220,cy+80,20,'#a08fc0',{font:'UIR'});
    ctx.beginPath();ctx.arc(x+w-56,cy+52,10,0,6.29);ctx.fillStyle=b[3];ctx.fill();cy+=118;}
}

function audience(ctx,x,y,w,h,p){
  // centered statement + 4 pills
  text(ctx,'Built for the way you work',x+w/2,y+130,40,'#fff',{align:'center'});
  const pills=[['Agencies','#c94ba0'],['Freelancers','#7c3aed'],['Corporates','#5f8dff'],['Restaurants & shops','#25D366']];
  let cy=y+200;const show=Math.floor(clamp(p*1.4)*pills.length+0.001);
  for(let i=0;i<Math.min(show+1,pills.length);i++){const pw=w-120;const px=x+60;rr(ctx,px,cy,pw,96,22);ctx.fillStyle='rgba(255,255,255,0.05)';ctx.fill();ctx.strokeStyle='rgba(255,255,255,0.12)';ctx.lineWidth=1.5;ctx.stroke();
    ctx.beginPath();ctx.arc(px+52,cy+48,16,0,6.29);ctx.fillStyle=pills[i][1];ctx.fill();
    text(ctx,pills[i][0],px+92,cy+60,34,'#fff');cy+=116;}
}

module.exports={analytics,planner,ai,whatsapp,google,menu,pickup,reservations,audience};
