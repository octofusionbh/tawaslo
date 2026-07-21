const {spawn}=require('child_process');
const E=require('./engine.js');const {W,H,FPS,createCanvas,drawFrame,frameCount}=E;
const name=process.argv[2];const mode=process.argv[3]||'full';const out=process.argv[4];
const frames=frameCount(name);
const args=['-y','-f','rawvideo','-pixel_format','rgba','-video_size',W+'x'+H,'-framerate',String(FPS),'-i','-'];
if(mode==='alpha'){args.push('-c:v','qtrle');} // not used now
args.push('-c:v','libx264','-pix_fmt','yuv420p','-crf','19','-preset','veryfast','-movflags','+faststart',out,'-loglevel','error');
const ff=spawn('ffmpeg',args,{stdio:['pipe','inherit','inherit']});
const cv=createCanvas(W,H);const ctx=cv.getContext('2d');
let f=0;
function tick(){
  if(f>=frames){ff.stdin.end();return;}
  drawFrame(ctx,name,mode,f);
  const buf=Buffer.from(ctx.getImageData(0,0,W,H).data.buffer);
  const ok=ff.stdin.write(buf);f++;
  if(ok)setImmediate(tick);else ff.stdin.once('drain',tick);
}
ff.on('close',c=>{console.log(name,'->',out,'frames',frames,'exit',c);});
tick();
