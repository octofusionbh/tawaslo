// Working canvases, not guarantees that every publishing endpoint accepts a format.
export const STUDIO_FORMATS = [
  {id:'1:1',label:'Square',width:1080,height:1080,hint:'Social feeds'},
  {id:'4:5',label:'Portrait',width:1080,height:1350,hint:'Feed portrait'},
  {id:'9:16',label:'Story',width:1080,height:1920,hint:'Full-screen vertical'},
  {id:'1.91:1',label:'Landscape',width:1200,height:627,hint:'Wide post / link artwork'},
  {id:'16:9',label:'Widescreen',width:1920,height:1080,hint:'Video / thumbnail layout'},
  {id:'3:4',label:'Tall photo',width:1080,height:1440,hint:'Photo portrait'},
  {id:'2:3',label:'Pinterest',width:1000,height:1500,hint:'Standard Pin'},
];
export const STUDIO_FORMAT_DEFAULTS = {originalWidth:0,originalHeight:0,customWidth:1080,customHeight:1080,imageFit:'contain'};
export const validImageSize=(width,height)=>Number.isInteger(width)&&Number.isInteger(height)&&width>0&&height>0&&width<=65535&&height<=65535&&width*height<=100000000;
export const validCustomSize=(width,height)=>Number.isInteger(width)&&Number.isInteger(height)&&width>=16&&height>=16&&width<=8192&&height<=8192;
export const resetInvalidCustomSize=fields=>validCustomSize(fields.customWidth,fields.customHeight)?{}:{customWidth:1080,customHeight:1080};
const gcd=(a,b)=>b?gcd(b,a%b):a;
export function sizeRatio(width,height){if(!validImageSize(width,height))return '';const divisor=gcd(width,height);return `${width/divisor}:${height/divisor}`;}
export function studioCanvas(fields){
  const preset=STUDIO_FORMATS.find(item=>item.id===fields.ratio);
  if(preset)return {...preset,aspect:`${preset.width} / ${preset.height}`,ratio:preset.id};
  const original=fields.ratio==='original';
  if(!original&&fields.ratio!=='custom')return null;
  const width=original?fields.originalWidth:fields.customWidth,height=original?fields.originalHeight:fields.customHeight;
  if(!(original?validImageSize:validCustomSize)(width,height))return null;
  return {id:fields.ratio,label:original?'Original size':'Custom size',width,height,ratio:sizeRatio(width,height),aspect:`${width} / ${height}`};
}
export function validFormatFields(fields){
  const f={...STUDIO_FORMAT_DEFAULTS,...fields};
  return !!studioCanvas(f)&&['contain','cover'].includes(f.imageFit)
    &&validCustomSize(f.customWidth,f.customHeight)
    &&((f.originalWidth===0&&f.originalHeight===0)||validImageSize(f.originalWidth,f.originalHeight));
}
export const dimensionLabel=({width,height})=>`${width.toLocaleString('en-US')} × ${height.toLocaleString('en-US')} px`;

// Decode locally, including browser-supported image orientation. Never upload the file.
export function readStudioImage(file,signal){
  return new Promise((resolve,reject)=>{
    if(!file||!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size<=0||file.size>10*1024*1024){reject(new Error('Choose a JPG, PNG or WebP image up to 10 MB.'));return;}
    let url='',timer,settled=false;
    const picture=document.createElement('img');
    const cleanup=()=>{clearTimeout(timer);picture.onload=null;picture.onerror=null;signal?.removeEventListener('abort',abort);};
    const fail=error=>{if(settled)return;settled=true;cleanup();if(url)URL.revokeObjectURL(url);reject(error);};
    const abort=()=>fail(Object.assign(new Error('Image selection cancelled.'),{name:'AbortError'}));
    if(signal?.aborted){abort();return;}
    signal?.addEventListener('abort',abort,{once:true});
    picture.onload=()=>{
      const width=picture.naturalWidth,height=picture.naturalHeight;
      if(!validImageSize(width,height)){fail(new Error('This image is too large to preview. Choose an image up to 100 megapixels and 65,535 pixels per side.'));return;}
      if(settled)return;settled=true;cleanup();resolve({name:file.name,url,width,height});
    };
    picture.onerror=()=>fail(new Error('This image could not be opened. Try another JPG, PNG or WebP file. Your previous image is kept.'));
    try{url=URL.createObjectURL(file);timer=setTimeout(()=>fail(new Error('Reading this image took too long. Try a smaller file. Your previous image is kept.')),15000);picture.src=url;}
    catch(_){fail(new Error('This image could not be opened. Try another file. Your previous image is kept.'));}
  });
}
