const {spawn}=require('child_process');const E=require('./engine.js');const {W,H,FPS,createCanvas,bgFrame}=E;
const ff=spawn('ffmpeg',['-y','-f','rawvideo','-pixel_format','rgba','-video_size',W+'x'+H,'-framerate',String(FPS),'-i','-','-c:v','libx264','-pix_fmt','yuv420p','-crf','20','-preset','veryfast','editable/background/tawaslo_bg_loop.mp4','-loglevel','error'],{stdio:['pipe','inherit','inherit']});
const cv=createCanvas(W,H);const ctx=cv.getContext('2d');let f=0;const N=125;
(function t(){if(f>=N){ff.stdin.end();return;}bgFrame(ctx,f);const b=Buffer.from(ctx.getImageData(0,0,W,H).data.buffer);const ok=ff.stdin.write(b);f++;ok?setImmediate(t):ff.stdin.once('drain',t);})();
ff.on('close',()=>console.log('bg mp4 done'));
