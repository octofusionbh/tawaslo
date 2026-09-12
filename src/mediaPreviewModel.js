export const MEDIA_FAVORITES_KEY='tw_media_favorites_v1:preview-marina';

export const MEDIA_KINDS=[['all','Everything'],['photo','Photos'],['design','Designs'],['video','Videos']];
export const MEDIA_PLATFORMS=[['all','All channels'],['ig','Instagram'],['fb','Facebook'],['li','LinkedIn'],['tt','TikTok']];
export const MEDIA_STATUS_LABELS={ready:'Ready',campaign:'In campaign',needsAlt:'Needs alt text',unused:'Unused'};
export const MEDIA_ATTENTION_STATUSES=new Set(['needsAlt','unused']);

export const SAMPLE_MEDIA_ASSETS=[
  {id:'msc-table-yours',title:'The table is yours',fileName:'table-is-yours-01.jpg',kind:'design',platform:'ig',collection:'Launch set',width:1080,height:1080,size:'1.8 MB',added:'Today',usage:3,status:'campaign',art:'menu',shape:'square',alt:'Marina Social Club campaign artwork with editorial type',history:[{title:'Launch week',detail:'Instagram carousel · 31 Aug'},{title:'September reservations',detail:'Facebook post · Scheduled'}]},
  {id:'msc-sunday-slow',title:'Sunday slows down',fileName:'sunday-slows-down.jpg',kind:'design',platform:'ig',collection:'Lunch menu',width:1080,height:1350,size:'2.1 MB',added:'Today',usage:1,status:'needsAlt',art:'table',shape:'portrait',alt:'Sunday lunch artwork for Marina Social Club',history:[{title:'Sunday lunch',detail:'Instagram post · Draft'}]},
  {id:'msc-golden-hour',title:'Golden hour',fileName:'golden-hour-story.jpg',kind:'design',platform:'ig',collection:'Weekend',width:1080,height:1920,size:'2.4 MB',added:'Yesterday',usage:2,status:'ready',art:'sunset',shape:'portrait',alt:'Golden hour story artwork for Marina Social Club',history:[{title:'Golden hour',detail:'Instagram story · 30 Aug'}]},
  {id:'msc-made-love',title:'Made with love',fileName:'made-with-love-reel-cover.jpg',kind:'video',platform:'tt',collection:'Kitchen stories',width:1080,height:1920,size:'18.6 MB',added:'Yesterday',usage:1,status:'campaign',art:'kitchen',shape:'portrait',alt:'Reel cover showing the Marina Social Club kitchen story',history:[{title:'Inside the kitchen',detail:'TikTok video · Scheduled'}]},
  {id:'msc-weekend-table',title:'Weekend table',fileName:'weekend-table.jpg',kind:'photo',platform:'fb',collection:'Food and venue',width:1600,height:1067,size:'3.7 MB',added:'28 Aug',usage:4,status:'ready',art:'table',shape:'wide',alt:'A styled weekend table by the water',history:[{title:'Weekend tables',detail:'Facebook post · 28 Aug'},{title:'Reserve by the water',detail:'Instagram post · 22 Aug'}]},
  {id:'msc-waterfront',title:'Waterfront details',fileName:'waterfront-details.jpg',kind:'photo',platform:'li',collection:'Food and venue',width:1600,height:1200,size:'3.2 MB',added:'27 Aug',usage:0,status:'unused',art:'sea',shape:'wide',alt:'Marina Social Club waterfront details',history:[]},
  {id:'msc-lunch-menu',title:'Lunch menu reveal',fileName:'lunch-menu-reveal.jpg',kind:'design',platform:'fb',collection:'Lunch menu',width:1080,height:1080,size:'1.6 MB',added:'26 Aug',usage:5,status:'campaign',art:'menu',shape:'square',alt:'Lunch menu reveal artwork',history:[{title:'New lunch menu',detail:'Facebook campaign · Live'},{title:'Midweek lunch',detail:'Instagram carousel · 26 Aug'}]},
  {id:'msc-behind-bar',title:'Behind the bar',fileName:'behind-the-bar-cover.jpg',kind:'video',platform:'tt',collection:'People and process',width:1080,height:1920,size:'22.1 MB',added:'25 Aug',usage:2,status:'needsAlt',art:'kitchen',shape:'portrait',alt:'Behind the bar vertical video cover',history:[{title:'Meet the team',detail:'TikTok video · Draft'}]},
  {id:'msc-evening-edit',title:'Evening edit',fileName:'evening-edit.jpg',kind:'photo',platform:'ig',collection:'Food and venue',width:1350,height:1080,size:'2.8 MB',added:'24 Aug',usage:0,status:'unused',art:'sunset',shape:'wide',alt:'Evening dining scene at Marina Social Club',history:[]},
];

const ids=new Set(SAMPLE_MEDIA_ASSETS.map(asset=>asset.id));
const clean=value=>String(value||'').trim().toLowerCase();

export function filterMediaAssets(assets=SAMPLE_MEDIA_ASSETS,{kind='all',platform='all',view='all',query='',favorites=[]}={}){
  const needle=clean(query),favoriteSet=new Set(favorites);
  return assets.filter(asset=>(kind==='all'||asset.kind===kind)&&(platform==='all'||asset.platform===platform)&&(view!=='favorites'||favoriteSet.has(asset.id))&&(view!=='attention'||MEDIA_ATTENTION_STATUSES.has(asset.status))&&(!needle||[asset.title,asset.fileName,asset.collection,asset.kind,asset.platform,MEDIA_STATUS_LABELS[asset.status]].some(value=>clean(value).includes(needle))));
}

export function readMediaRoute(search=''){
  const params=new URLSearchParams(search),kind=MEDIA_KINDS.some(([id])=>id===params.get('mediaType'))?params.get('mediaType'):'all',platform=MEDIA_PLATFORMS.some(([id])=>id===params.get('mediaPlatform'))?params.get('mediaPlatform'):'all',view=['favorites','attention'].includes(params.get('mediaView'))?params.get('mediaView'):'all',query=String(params.get('mediaSearch')||'').slice(0,80),asset=ids.has(params.get('asset'))?params.get('asset'):'';
  return {kind,platform,view,query,asset};
}

export function readMediaFavorites(store){
  try{const raw=(store||window.localStorage).getItem(MEDIA_FAVORITES_KEY),items=raw?JSON.parse(raw):[];if(!Array.isArray(items)||items.length>50||items.some(id=>typeof id!=='string'||!ids.has(id))||new Set(items).size!==items.length)throw Error('invalid');return {items,error:''};}catch(_){return {items:[],error:'Favorites could not be read. Your media library is still available.'};}
}

export function toggleMediaFavorite(id,current=[],store){
  if(!ids.has(id))return {ok:false,items:current,error:'This sample asset is not available.'};
  const next=current.includes(id)?current.filter(item=>item!==id):[id,...current];
  try{(store||window.localStorage).setItem(MEDIA_FAVORITES_KEY,JSON.stringify(next));return {ok:true,items:next,error:''};}catch(_){return {ok:false,items:current,error:'Favorite not saved. Browser storage is unavailable.'};}
}

export function assetById(id,assets=SAMPLE_MEDIA_ASSETS){return assets.find(asset=>asset.id===id)||null;}
