export const LINK_BIO_STORAGE_KEY = 'tw_preview_link_bio:v1';

export const LINK_BIO_THEMES = [
  { id:'harbor', name:'Harbor', note:'Sea glass and coral', bg:'#D8E5E2', ink:'#163B38', accent:'#E8644B', soft:'#BFD2CF' },
  { id:'afterglow', name:'Afterglow', note:'Sunset and warm sand', bg:'#F07858', ink:'#2E1D1B', accent:'#FFE0A7', soft:'#DC6247' },
  { id:'paper', name:'Paper', note:'Menu paper and plum', bg:'#EEE6D4', ink:'#343522', accent:'#795361', soft:'#D8CFBC' },
  { id:'night', name:'Night', note:'Deep water after dark', bg:'#101820', ink:'#F4EEE4', accent:'#FF8D6D', soft:'#24323C' },
];

export const LINK_BIO_ART = [
  { id:'table', name:'Sunday table' },
  { id:'sunset', name:'Golden hour' },
  { id:'sea', name:'By the water' },
  { id:'menu', name:'The table is yours' },
];

export const LINK_BIO_SOCIAL_CATALOG=[
  {id:'instagram',label:'Instagram',url:'https://instagram.com/marinasocialclub',placeholder:'https://instagram.com/username'},
  {id:'facebook',label:'Facebook',url:'https://facebook.com/marinasocialclub',placeholder:'https://facebook.com/username'},
  {id:'tiktok',label:'TikTok',url:'https://tiktok.com/@marinasocialclub',placeholder:'https://tiktok.com/@username'},
  {id:'whatsapp',label:'WhatsApp',url:'https://wa.me/97300000000',placeholder:'https://wa.me/973...'},
  {id:'linkedin',label:'LinkedIn',url:'https://linkedin.com/company/marinasocialclub',placeholder:'https://linkedin.com/company/name'},
  {id:'youtube',label:'YouTube',url:'https://youtube.com/@marinasocialclub',placeholder:'https://youtube.com/@channel'},
  {id:'x',label:'X',url:'https://x.com/marinasocialclub',placeholder:'https://x.com/username'},
  {id:'snapchat',label:'Snapchat',url:'https://snapchat.com/add/marinasocialclub',placeholder:'https://snapchat.com/add/username'},
  {id:'threads',label:'Threads',url:'https://threads.net/@marinasocialclub',placeholder:'https://threads.net/@username'},
  {id:'pinterest',label:'Pinterest',url:'https://pinterest.com/marinasocialclub',placeholder:'https://pinterest.com/username'},
  {id:'telegram',label:'Telegram',url:'https://t.me/marinasocialclub',placeholder:'https://t.me/username'},
  {id:'email',label:'Email',url:'mailto:hello@marinasocialclub.com',placeholder:'mailto:hello@example.com'},
];

export const LINK_BIO_BLOCK_CATALOG=[
  {id:'link',label:'Classic link',note:'Send visitors anywhere'},
  {id:'featured',label:'Featured story',note:'A visual 16:9 highlight'},
  {id:'reservation',label:'Reservation',note:'Book without hunting for a form'},
  {id:'menu',label:'Menu',note:'Open the current food or drinks menu'},
  {id:'video',label:'Video',note:'Feature a reel, film, or channel'},
  {id:'signup',label:'Email signup',note:'Grow an audience you own'},
  {id:'contact',label:'Contact',note:'WhatsApp, call, email, or directions'},
];

export const LINK_BIO_INSIGHTS={
  period:'Last 28 days',views:4820,uniqueViews:3614,clicks:2391,uniqueClicks:1876,subscribers:184,clickRate:49.6,
  sources:[{label:'Instagram',value:58},{label:'Direct',value:24},{label:'WhatsApp',value:11},{label:'Other',value:7}],
  days:[36,49,43,58,71,65,82,76,94,88,110,102,119,131],
};

const seed = {
  title:'Marina Social Club',
  handle:'@marinasocialclub',
  logo:'',
  location:'Bahrain · By the water',
  bio:'Lunch stretches a little longer here.',
  theme:'harbor',
  featuredEnabled:false,
  featured:{ eyebrow:'This Sunday', title:'Sunday slows down.', note:'Long lunch, small plates and an open view of the water.', art:'table' },
  collections:['Visit','Connect'],
  links:[
    { id:'reserve', title:'Reserve a table', url:'https://example.com/reserve', visible:true, type:'reservation', layout:'featured', art:'table', clicks:892, group:'Visit', highlight:true, schedule:'' },
    { id:'menu', title:'See the lunch menu', url:'https://example.com/menu', visible:true, type:'menu', layout:'classic', art:'menu', clicks:641, group:'Visit', highlight:false, schedule:'' },
    { id:'whatsapp', title:'WhatsApp the team', url:'https://wa.me/97300000000', visible:true, type:'contact', layout:'classic', art:'sea', clicks:517, group:'Connect', highlight:false, schedule:'' },
    { id:'directions', title:'Find us by the water', url:'https://maps.google.com', visible:true, type:'link', layout:'classic', art:'sunset', clicks:341, group:'Connect', highlight:false, schedule:'' },
  ],
  slug:'marina',
  headerStyle:'editorial',
  buttonStyle:'rules',
  subscribeEnabled:true,
  subscribeTitle:'Stay for the next table.',
  seoTitle:'Marina Social Club | Bahrain waterfront dining',
  seoDescription:'Menus, reservations, events and everything happening by the water at Marina Social Club.',
  qrColor:'#163B38',
  socialPosition:'bottom',
  socials:LINK_BIO_SOCIAL_CATALOG.map(item=>({...item,enabled:['instagram','facebook','whatsapp'].includes(item.id)})),
};

const cleanText = (value,fallback,max=160) => typeof value === 'string' ? value.trim().slice(0,max) || fallback : fallback;
const cleanOptionalText = (value,max=160) => typeof value === 'string' ? value.trim().slice(0,max) : '';
const cloneSeed = () => JSON.parse(JSON.stringify(seed));

export function normalizeLinkBio(value) {
  const base = cloneSeed();
  if (!value || typeof value !== 'object') return base;
  const themes = new Set(LINK_BIO_THEMES.map(item=>item.id));
  const arts = new Set(LINK_BIO_ART.map(item=>item.id));
  const links = Array.isArray(value.links) ? value.links.slice(0,8).map((link,index)=>({
    id:cleanText(link?.id,`link-${index+1}`,60),
    title:cleanText(link?.title,'Untitled link',80),
    url:cleanText(link?.url,'https://example.com',300),
    visible:link?.visible !== false,
    type:LINK_BIO_BLOCK_CATALOG.some(item=>item.id===link?.type)?link.type:'link',
    layout:link?.layout==='featured'?'featured':'classic',
    art:LINK_BIO_ART.some(item=>item.id===link?.art)?link.art:LINK_BIO_ART[index%LINK_BIO_ART.length].id,
    clicks:Number.isFinite(Number(link?.clicks))?Math.max(0,Number(link.clicks)):Math.max(84,620-index*137),
    group:cleanOptionalText(link?.group,40),
    highlight:link?.highlight===true,
    schedule:typeof link?.schedule==='string'?link.schedule.slice(0,40):'',
  })) : base.links;
  const savedSocials=Array.isArray(value.socials)?value.socials:[];
  const savedCollections=Array.isArray(value.collections)?value.collections.map(item=>cleanOptionalText(item,40)):[];
  const collections=[...savedCollections,...links.map(link=>link.group)].filter((item,index,list)=>item&&list.indexOf(item)===index).slice(0,12);
  const socials=[...savedSocials.map(entry=>entry?.id),...base.socials.map(item=>item.id)].filter((id,index,list)=>id&&list.indexOf(id)===index).map(id=>{
    const item=base.socials.find(entry=>entry.id===id);if(!item)return null;
    const saved=savedSocials.find(entry=>entry?.id===id);
    return {...item,enabled:saved?saved.enabled!==false:item.enabled,url:cleanText(saved?.url,item.url,300)};
  }).filter(Boolean);
  return {
    title:cleanText(value.title,base.title,80),
    handle:cleanText(value.handle,base.handle,80),
    logo:typeof value.logo === 'string' && value.logo.startsWith('data:image/') ? value.logo.slice(0,1500000) : base.logo,
    location:Object.prototype.hasOwnProperty.call(value,'location') ? cleanOptionalText(value.location,100) : base.location,
    bio:Object.prototype.hasOwnProperty.call(value,'bio') ? cleanOptionalText(value.bio,180) : base.bio,
    theme:themes.has(value.theme) ? value.theme : base.theme,
    featuredEnabled:value.featuredEnabled===true,
    featured:{
      eyebrow:cleanText(value.featured?.eyebrow,base.featured.eyebrow,50),
      title:cleanText(value.featured?.title,base.featured.title,90),
      note:cleanText(value.featured?.note,base.featured.note,180),
      art:arts.has(value.featured?.art) ? value.featured.art : base.featured.art,
    },
    collections,
    links:links.length ? links : base.links,
    slug:cleanText(value.slug,base.slug,60).toLowerCase().replace(/[^a-z0-9-]/g,'-'),
    headerStyle:['editorial','classic','hero'].includes(value.headerStyle)?value.headerStyle:base.headerStyle,
    buttonStyle:['rules','solid','soft'].includes(value.buttonStyle)?value.buttonStyle:base.buttonStyle,
    subscribeEnabled:value.subscribeEnabled!==false,
    subscribeTitle:cleanText(value.subscribeTitle,base.subscribeTitle,90),
    seoTitle:cleanText(value.seoTitle,base.seoTitle,60),
    seoDescription:cleanText(value.seoDescription,base.seoDescription,155),
    qrColor:/^#[0-9a-f]{6}$/i.test(value.qrColor||'')?value.qrColor:base.qrColor,
    socialPosition:value.socialPosition==='top'?'top':'bottom',
    socials,
  };
}

export function readLinkBio(store = typeof window !== 'undefined' ? window.localStorage : null) {
  if (!store) return { data:cloneSeed(), error:'' };
  try {
    const raw = store.getItem(LINK_BIO_STORAGE_KEY);
    return { data:raw ? normalizeLinkBio(JSON.parse(raw)) : cloneSeed(), error:'' };
  } catch (_) {
    return { data:cloneSeed(), error:'Saved changes could not be read. The sample page is still available.' };
  }
}

export function saveLinkBio(data, store = typeof window !== 'undefined' ? window.localStorage : null) {
  if (!store) return { ok:false, error:'Browser storage is unavailable. Keep this page open to preserve your edits.' };
  try {
    const normalized = normalizeLinkBio(data);
    store.setItem(LINK_BIO_STORAGE_KEY,JSON.stringify(normalized));
    return { ok:true, data:normalized, error:'' };
  } catch (_) {
    return { ok:false, error:'This page could not be saved in the browser. Your edits remain open.' };
  }
}

export function moveLink(data,id,direction) {
  const links = [...data.links];
  const from = links.findIndex(link=>link.id===id);
  const to = from + direction;
  if (from < 0 || to < 0 || to >= links.length) return data;
  const [item] = links.splice(from,1);
  links.splice(to,0,item);
  return {...data,links};
}

export function moveSocial(data,id,direction){
  const active=data.socials.filter(item=>item.enabled),inactive=data.socials.filter(item=>!item.enabled),from=active.findIndex(item=>item.id===id),to=from+direction;
  if(from<0||to<0||to>=active.length)return data;
  const [item]=active.splice(from,1);active.splice(to,0,item);return {...data,socials:[...active,...inactive]};
}

export function linkBioVisitorMode(search = '') {
  return new URLSearchParams(search).get('bioView') === 'visitor';
}

export function activeLinkBioTheme(id) {
  return LINK_BIO_THEMES.find(theme=>theme.id===id) || LINK_BIO_THEMES[0];
}

export function linkBioSummary(page,insights=LINK_BIO_INSIGHTS){
  const visible=page.links.filter(link=>link.visible),top=[...visible].sort((a,b)=>b.clicks-a.clicks)[0];
  return {visible:visible.length,totalClicks:visible.reduce((sum,link)=>sum+link.clicks,0),top,clickRate:insights.clickRate};
}

export function createLinkBioBlock(type='link',now=Date.now()){
  const presets={
    featured:{title:'New featured story',url:'https://example.com/story',layout:'featured',art:'sunset',group:'Explore'},
    reservation:{title:'Reserve your table',url:'https://example.com/reserve',layout:'featured',art:'table',group:'Visit'},
    menu:{title:'Open the current menu',url:'https://example.com/menu',layout:'classic',art:'menu',group:'Visit'},
    video:{title:'Watch our latest film',url:'https://youtube.com',layout:'featured',art:'sea',group:'Explore'},
    signup:{title:'Join the guest list',url:'#subscribe',layout:'classic',art:'sunset',group:'Connect'},
    contact:{title:'Talk to the team',url:'https://wa.me/97300000000',layout:'classic',art:'sea',group:'Connect'},
    collection:{title:'A collection of moments',url:'#collection',layout:'featured',art:'menu',group:'Explore'},
    link:{title:'New link',url:'https://example.com',layout:'classic',art:'table',group:'Explore'},
  };
  return {id:`block-${now}`,visible:true,type,clicks:0,highlight:false,schedule:'',...(presets[type]||presets.link)};
}

export function linkBioQrPattern(value,size=21){
  const text=String(value||''),cells=Array.from({length:size},()=>Array(size).fill(false));let seed=2166136261;
  for(const char of text){seed^=char.charCodeAt(0);seed=Math.imul(seed,16777619)>>>0;}
  const finder=(ox,oy)=>{for(let y=0;y<7;y++)for(let x=0;x<7;x++)cells[oy+y][ox+x]=(x===0||x===6||y===0||y===6||(x>=2&&x<=4&&y>=2&&y<=4));};
  finder(0,0);finder(size-7,0);finder(0,size-7);
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){const inFinder=(x<8&&y<8)||(x>=size-8&&y<8)||(x<8&&y>=size-8);if(!inFinder){seed=(Math.imul(seed,1664525)+1013904223)>>>0;cells[y][x]=(seed&3)===0||(seed&7)===3;}}
  return cells;
}
