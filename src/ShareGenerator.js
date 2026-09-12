import {useEffect,useMemo,useState} from 'react';
import QRCode from 'qrcode';
import {Bot,Check,Copy,Download,ExternalLink,EyeOff,Link2,Monitor,ShoppingBag,X} from 'lucide-react';
import {FaWhatsapp} from 'react-icons/fa';
import './share-generator.css';

const ORIGIN='https://menu.tawaslo.com/marina-social-club';

export function shareTargets(menus=[],activeMenuId=''){
  const menuTargets=menus.map(menu=>({id:`menu:${menu.id}`,label:menu.name,detail:menu.available===false?'Hidden menu':menu.type==='Seasonal'?'Seasonal guest menu':'Guest menu',url:`${ORIGIN}/menu/${menu.id}`,ai:true,available:menu.available!==false}));
  return[...menuTargets,{id:'pickup',label:'Pickup menu',detail:'Guest ordering',url:`${ORIGIN}/pickup`,ai:true},{id:`counter:${activeMenuId||menus[0]?.id||'lunch'}`,label:'Counter display',detail:'Cashier screen',url:`${ORIGIN}/counter/${activeMenuId||menus[0]?.id||'lunch'}`,ai:false}];
}

export default function ShareGenerator({menus=[],activeMenuId='',defaultTarget='pickup',onClose=()=>{}}){
  const targets=useMemo(()=>shareTargets(menus,activeMenuId),[menus,activeMenuId]),fallback=targets.find(target=>target.id===defaultTarget)||targets.find(target=>target.id===`menu:${activeMenuId}`)||targets[0],[targetId,setTargetId]=useState(fallback?.id||''),[qr,setQr]=useState(''),[copied,setCopied]=useState(false),target=targets.find(item=>item.id===targetId)||fallback;
  useEffect(()=>{if(!targets.some(item=>item.id===targetId)&&fallback)setTargetId(fallback.id)},[targets,targetId,fallback]);
  useEffect(()=>{let active=true;if(!target)return;QRCode.toDataURL(target.url,{width:520,margin:2,errorCorrectionLevel:'M',color:{dark:'#171918',light:'#FFFFFF'}}).then(url=>{if(active)setQr(url)}).catch(()=>{if(active)setQr('')});return()=>{active=false}},[target]);
  async function copy(){try{await navigator.clipboard.writeText(target.url);setCopied(true);setTimeout(()=>setCopied(false),1800)}catch(_){setCopied(false)}}
  if(!target)return null;
  const whatsappUrl=`https://wa.me/?text=${encodeURIComponent(`${target.label} from Marina Social Club\n${target.url}`)}`;
  return <section className="sg-panel" aria-label="Link and QR generator"><header><span><Link2 size={17}/><i><strong>Link and QR generator</strong><small>Choose exactly what guests should open.</small></i></span><button type="button" aria-label="Close link generator" onClick={onClose}><X size={18}/></button></header><div className="sg-layout"><nav aria-label="Share destinations">{targets.map(item=><button type="button" key={item.id} aria-pressed={item.id===target.id} onClick={()=>setTargetId(item.id)}>{item.id==='pickup'?<ShoppingBag size={16}/>:item.id.startsWith('counter')?<Monitor size={16}/>:<Link2 size={16}/>}<span><strong>{item.label}</strong><small>{item.detail}</small></span>{item.ai?<Bot size={13}/>:null}</button>)}</nav><div className="sg-code"><div>{qr?<img src={qr} alt={`QR code for ${target.label}`}/>:<span>Building QR code</span>}</div><section><span>{target.label}</span><strong>{target.available===false?<><EyeOff size={14}/>Hidden from guests</>:target.ai?<><Bot size={14}/>Concierge ready</>:<><Monitor size={14}/>View only</>}</strong><p>{target.available===false?'This QR is ready, but the menu link stays hidden until you make the menu visible.':target.ai?'Guests can ask the AI concierge about this menu or their pickup order.':'This counter screen has no AI assistant or ordering controls.'}</p><label>Share link<input readOnly value={target.url}/></label><div><button type="button" onClick={copy}>{copied?<Check size={15}/>:<Copy size={15}/>} {copied?'Copied':'Copy link'}</button>{qr&&<a href={qr} download={`tawaslo-${target.id.replace(':','-')}-qr.png`}><Download size={15}/>Download QR</a>}<a className="sg-whatsapp" href={whatsappUrl} target="_blank" rel="noreferrer"><FaWhatsapp/>Share to WhatsApp</a><a href={target.url} target="_blank" rel="noreferrer"><ExternalLink size={15}/>Open link</a></div></section></div></div><footer>Each destination has its own link. Changing the active menu updates the counter code automatically.</footer></section>;
}
