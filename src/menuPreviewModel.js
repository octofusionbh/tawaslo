export const MENU_STORAGE_KEY='tw_preview_menu:v1';

export const MENU_CATEGORIES=[
  {id:'small',name:'To begin',note:'Small plates for the table'},
  {id:'mains',name:'From the kitchen',note:'Long lunches and dinner by the water'},
  {id:'sweet',name:'Something sweet',note:'A gentle finish'},
  {id:'drinks',name:'From the bar',note:'Cold, bright, and made for the view'},
];

export const MENU_ARTS=[
  {id:'coral',name:'Coral plate'},
  {id:'sea',name:'Sea glass'},
  {id:'herb',name:'Garden green'},
  {id:'sun',name:'Golden hour'},
];

export const MENU_STYLES=[
  {id:'classic',name:'Classic',note:'No dish photos'},
  {id:'visual',name:'Visual',note:'Photo-led'},
];

export const MENU_FONTS=[
  {id:'editorial',name:'Editorial'},
  {id:'clean',name:'Clean'},
  {id:'friendly',name:'Friendly'},
];

export const MENU_TAGS=['Vegetarian','Vegan','Gluten free','Spicy','Halal','Contains nuts','Shellfish','Zero proof'];
export const MENU_BOOK_STORAGE_KEY='tw_preview_menu_book:v1';

export const MENU_SEED={
  title:'Lunch by the water',subtitle:'A seasonal menu made for passing plates, slow afternoons, and one more round.',currency:'BHD',serviceNote:'Lunch · Sunday to Thursday · 12:00 PM to 4:00 PM',menuStyle:'visual',available:true,brand:{primary:'#22594E',accent:'#B13D31',background:'#FBF5E9',text:'#241B16',font:'editorial'},categories:MENU_CATEGORIES,
  items:[
    {id:'burrata',category:'small',name:'Burrata, tomato and sumac',description:'Local tomatoes, basil oil, toasted sourdough.',price:'6.800',tags:['Vegetarian'],available:true,featured:true,art:'coral',photo:0,service:'all'},
    {id:'prawns',category:'small',name:'Charred Gulf prawns',description:'Brown butter, lemon, chilli and grilled bread.',price:'8.400',tags:['Shellfish'],available:true,featured:false,art:'sun',photo:1,service:'all'},
    {id:'hummus',category:'small',name:'Warm hummus',description:'Spiced chickpeas, parsley and fresh khubz.',price:'4.200',tags:['Vegan'],available:true,featured:false,art:'herb',photo:2,service:'all'},
    {id:'seabass',category:'mains',name:'Grilled sea bass',description:'Fennel, capers, citrus and a light saffron broth.',price:'12.600',tags:['Gluten free'],available:true,featured:false,art:'sea',photo:3,service:'dine-in'},
    {id:'rigatoni',category:'mains',name:'Truffle rigatoni',description:'Wild mushrooms, parmesan and black pepper.',price:'9.800',tags:['Vegetarian'],available:true,featured:false,art:'herb',photo:4,service:'all'},
    {id:'chicken',category:'mains',name:'Wood-fired chicken',description:'Preserved lemon, roasted garlic and crisp potatoes.',price:'10.500',tags:[],available:false,featured:false,art:'sun',photo:5,service:'all'},
    {id:'date',category:'sweet',name:'Warm date pudding',description:'Tahini caramel and vanilla ice cream.',price:'4.800',tags:['Vegetarian'],available:true,featured:false,art:'coral',photo:6,service:'all'},
    {id:'tart',category:'sweet',name:'Lemon and olive oil tart',description:'Sea salt, whipped cream and citrus peel.',price:'4.600',tags:['Vegetarian'],available:true,featured:false,art:'sea',photo:7,service:'all'},
    {id:'spritz',category:'drinks',name:'Marina spritz',description:'Grapefruit, rosemary, sparkling water.',price:'3.800',tags:['Zero proof'],available:true,featured:false,art:'sun',photo:8,service:'all'},
    {id:'lunch-box',category:'mains',name:'Marina lunch box',description:'Truffle rigatoni, garden salad, warm focaccia, and a citrus spritz packed for pickup.',price:'11.900',tags:['Pickup only'],available:true,featured:false,art:'sea',photo:4,service:'pickup'},
    {id:'picnic-two',category:'mains',name:'Seaside picnic for two',description:'Burrata, warm hummus, grilled bread, date pudding, and two sparkling drinks.',price:'22.000',tags:['Pickup only'],available:true,featured:false,art:'coral',photo:0,service:'pickup'},
    {id:'focaccia-box',category:'small',name:'Roasted chicken focaccia box',description:'Wood-fired chicken, preserved lemon, leaves, and crisp potatoes for the road.',price:'7.800',tags:['Pickup only'],available:true,featured:false,art:'sun',photo:5,service:'pickup'},
  ],
};

const clone=value=>JSON.parse(JSON.stringify(value));
const clean=(value,fallback,max=160)=>typeof value==='string'?(value.trim().slice(0,max)||fallback):fallback;
export function itemCategoryIds(item){const source=Array.isArray(item?.categories)?item.categories:[item?.category];return[...new Set(source.filter(value=>typeof value==='string'&&value))];}
export function itemInCategory(item,categoryId){return itemCategoryIds(item).includes(categoryId);}

export function normalizeMenu(value){
  const base=clone(MENU_SEED);if(!value||typeof value!=='object')return base;
  const normalizedCategories=Array.isArray(value.categories)?value.categories.slice(0,10).map((item,index)=>({id:clean(item?.id,`section-${index+1}`,60),name:clean(item?.name,`Section ${index+1}`,48),note:clean(item?.note,'Add a short section note.',100)})):base.categories;
  const uniqueCategories=normalizedCategories.filter((item,index,list)=>list.findIndex(candidate=>candidate.id===item.id)===index);
  const menuCategories=uniqueCategories.length?uniqueCategories:base.categories,categories=new Set(menuCategories.map(item=>item.id)),defaultCategory=menuCategories[0].id,arts=new Set(MENU_ARTS.map(item=>item.id));
  let items=Array.isArray(value.items)?value.items.slice(0,24).map((item,index)=>{const id=clean(item?.id,`dish-${index+1}`,60),assigned=[...new Set((Array.isArray(item?.categories)?item.categories:[item?.category]).filter(category=>categories.has(category)))],itemCategories=assigned.length?assigned:[defaultCategory];return{
    id,productId:clean(item?.productId,id,60),category:itemCategories[0],categories:itemCategories,name:clean(item?.name,'Untitled dish',80),description:clean(item?.description,'Add a short description.',180),price:/^\d{1,4}(\.\d{0,3})?$/.test(String(item?.price||''))?String(item.price):'0.000',tags:Array.isArray(item?.tags)?item.tags.filter(tag=>typeof tag==='string').slice(0,6).map(tag=>tag.slice(0,30)):[],available:item?.available!==false,featured:item?.featured===true,art:arts.has(item?.art)?item.art:MENU_ARTS[index%MENU_ARTS.length].id,photo:Number.isInteger(item?.photo)&&item.photo>=0&&item.photo<9?item.photo:index%9,service:['all','dine-in','pickup'].includes(item?.service)?item.service:item?.id==='seabass'?'dine-in':'all',fulfillmentMinutes:item?.fulfillmentMinutes===null||item?.fulfillmentMinutes===''||item?.fulfillmentMinutes===undefined?null:Math.max(0,Math.min(10080,Math.round(Number(item.fulfillmentMinutes)||0))),
  }}):base.items.map((item,index)=>({...item,productId:item.id,categories:[item.category],photo:item.photo??index%9,fulfillmentMinutes:null}));
  if(!items.some(item=>item.service==='pickup'))items=[...items,...base.items.filter(item=>item.service==='pickup')].slice(0,24);
  const isHex=color=>/^#[0-9a-f]{6}$/i.test(String(color||''));
  const brand={primary:isHex(value.brand?.primary)?value.brand.primary.toUpperCase():base.brand.primary,accent:isHex(value.brand?.accent)?value.brand.accent.toUpperCase():base.brand.accent,background:isHex(value.brand?.background)?value.brand.background.toUpperCase():base.brand.background,text:isHex(value.brand?.text)?value.brand.text.toUpperCase():base.brand.text,font:MENU_FONTS.some(font=>font.id===value.brand?.font)?value.brand.font:base.brand.font};
  return {title:clean(value.title,base.title,80),subtitle:clean(value.subtitle,base.subtitle,180),currency:clean(value.currency,base.currency,6),serviceNote:clean(value.serviceNote,base.serviceNote,120),menuStyle:MENU_STYLES.some(style=>style.id===value.menuStyle)?value.menuStyle:base.menuStyle,available:value.available!==false,brand,categories:menuCategories,items:items.length?items:base.items};
}

const makeEdition=(id,name,type,patch={})=>({id,name,type,...normalizeMenu({...MENU_SEED,...patch})});
export function menuBookSeed(){
  const lunch=makeEdition('lunch','Lunch','Everyday');
  const dinner=makeEdition('dinner','Dinner','Everyday',{title:'Dinner after sunset',subtitle:'Fire, citrus, sharing plates, and a table that stays a little longer.',serviceNote:'Dinner · Daily · 6:00 PM to 11:30 PM',items:MENU_SEED.items.map(item=>({...item,available:true,featured:item.id==='seabass'}))});
  const summer=makeEdition('summer','Summer menu','Seasonal',{title:'A cooler kind of summer',subtitle:'Bright plates, cold drinks, and dishes made for the late afternoon.',serviceNote:'Summer menu · June to September · From 12:00 PM',items:MENU_SEED.items.map(item=>({...item,featured:item.id==='spritz'}))});
  return {activeMenuId:'lunch',menus:[lunch,dinner,summer]};
}
export function normalizeMenuBook(value){const fallback=menuBookSeed();if(!value||typeof value!=='object'||!Array.isArray(value.menus))return fallback;const menus=value.menus.slice(0,24).map((menu,index)=>({id:clean(menu?.id,`menu-${index+1}`,60),name:clean(menu?.name,`Menu ${index+1}`,40),type:['Everyday','Seasonal','Limited'].includes(menu?.type)?menu.type:'Everyday',...normalizeMenu(menu)}));if(!menus.length)return fallback;return{activeMenuId:menus.some(menu=>menu.id===value.activeMenuId)?value.activeMenuId:menus[0].id,menus};}
export function readMenuBook(store=typeof window!=='undefined'?window.localStorage:null){if(!store)return{data:menuBookSeed(),error:''};try{const raw=store.getItem(MENU_BOOK_STORAGE_KEY);if(raw)return{data:normalizeMenuBook(JSON.parse(raw)),error:''};const legacy=readMenu(store);const fallback=menuBookSeed();fallback.menus[0]={...fallback.menus[0],...legacy.data,id:'lunch',name:'Lunch',type:'Everyday'};return{data:fallback,error:legacy.error};}catch(_){return{data:menuBookSeed(),error:'Saved menu changes could not be read. The sample menus are still available.'};}}
export function saveMenuBook(data,store=typeof window!=='undefined'?window.localStorage:null){if(!store)return{ok:false,error:'Browser storage is unavailable. Keep this page open to preserve your edits.'};try{const normalized=normalizeMenuBook(data);store.setItem(MENU_BOOK_STORAGE_KEY,JSON.stringify(normalized));return{ok:true,data:normalized,error:''};}catch(_){return{ok:false,error:'These menus could not be saved in the browser. Your edits remain open.'};}}
export function addMenuEdition(book,now=Date.now()){if(book.menus.length>=24)return book;const source=book.menus.find(menu=>menu.id===book.activeMenuId)||book.menus[0],id=`menu-${now}`;return{activeMenuId:id,menus:[...book.menus,{...clone(source),id,name:'New menu',type:'Seasonal',title:'New menu'}]};}
export function removeMenuEdition(book,id){if(book.menus.length<=1)return book;const menus=book.menus.filter(menu=>menu.id!==id);return{...book,activeMenuId:book.activeMenuId===id?menus[0].id:book.activeMenuId,menus};}

export function readMenu(store=typeof window!=='undefined'?window.localStorage:null){if(!store)return{data:clone(MENU_SEED),error:''};try{const raw=store.getItem(MENU_STORAGE_KEY);return{data:raw?normalizeMenu(JSON.parse(raw)):clone(MENU_SEED),error:''};}catch(_){return{data:clone(MENU_SEED),error:'Saved menu changes could not be read. The sample menu is still available.'};}}
export function saveMenu(data,store=typeof window!=='undefined'?window.localStorage:null){if(!store)return{ok:false,error:'Browser storage is unavailable. Keep this page open to preserve your edits.'};try{const normalized=normalizeMenu(data);store.setItem(MENU_STORAGE_KEY,JSON.stringify(normalized));return{ok:true,data:normalized,error:''};}catch(_){return{ok:false,error:'This menu could not be saved in the browser. Your edits remain open.'};}}

export function filterMenuItems(items,{category='all',query='',availability='all'}={}){const needle=String(query||'').trim().toLowerCase();return items.filter(item=>(category==='all'||itemInCategory(item,category))&&(availability==='all'||(availability==='available'?item.available:!item.available))&&(!needle||`${item.name} ${item.description} ${item.tags.join(' ')}`.toLowerCase().includes(needle)));}
export function menuSummary(items){const available=items.filter(item=>item.available);return{dishes:items.length,available:available.length,unavailable:items.length-available.length,categories:new Set(available.flatMap(item=>itemCategoryIds(item))).size,featured:available.find(item=>item.featured)||available[0]||items[0]};}
export function getMenuCategories(menu){return Array.isArray(menu?.categories)&&menu.categories.length?menu.categories:MENU_CATEGORIES;}
export function addMenuCategory(menu,now=Date.now()){const categories=getMenuCategories(menu);if(categories.length>=10)return menu;return{...menu,categories:[...categories,{id:`section-${now}`,name:'New section',note:'Add a short section note.'}]};}
export function updateMenuCategory(categories,id,patch){return categories.map(item=>item.id===id?{...item,...patch}:item);}
export function moveMenuCategory(categories,id,direction){const index=categories.findIndex(item=>item.id===id),nextIndex=index+direction;if(index<0||nextIndex<0||nextIndex>=categories.length)return categories;const next=[...categories];[next[index],next[nextIndex]]=[next[nextIndex],next[index]];return next;}
export function setMenuCategoryPosition(categories,id,position){const index=categories.findIndex(item=>item.id===id),target=Math.max(0,Math.min(categories.length-1,Number(position)));if(index<0||index===target)return categories;const next=[...categories],[item]=next.splice(index,1);next.splice(target,0,item);return next;}
export function reorderMenuCategory(categories,sourceId,targetId){const source=categories.findIndex(item=>item.id===sourceId),target=categories.findIndex(item=>item.id===targetId);if(source<0||target<0||source===target)return categories;const next=[...categories],[item]=next.splice(source,1);next.splice(target,0,item);return next;}
export function removeMenuCategory(menu,id){const categories=getMenuCategories(menu);if(categories.length<=1)return menu;const nextCategories=categories.filter(item=>item.id!==id),fallback=nextCategories[0].id;return{...menu,categories:nextCategories,items:menu.items.map(item=>{const remaining=itemCategoryIds(item).filter(category=>category!==id),assigned=remaining.length?remaining:[fallback];return{...item,category:assigned[0],categories:assigned};})};}
export function addMenuItem(items,now=Date.now(),category='small'){const id=`dish-${now}`;return[...items,{id,productId:id,category,categories:[category],name:'New dish',description:'Add a short description.',price:'0.000',tags:[],available:true,featured:false,art:'coral',photo:items.length%9,service:'all',fulfillmentMinutes:null}];}
export function updateMenuItem(items,id,patch){return items.map(item=>{if(item.id!==id)return item;if(Array.isArray(patch.categories)){const assigned=[...new Set(patch.categories.filter(Boolean))];return{...item,...patch,categories:assigned.length?assigned:itemCategoryIds(item),category:(assigned.length?assigned:itemCategoryIds(item))[0]||item.category};}if(patch.category)return{...item,...patch,category:patch.category,categories:[patch.category]};return{...item,...patch};});}
export function featureMenuItem(items,id){return items.map(item=>({...item,featured:item.id===id}));}
export function removeMenuItem(items,id){return items.filter(item=>item.id!==id);}
export function moveMenuItem(items,id,direction,categoryId){const item=items.find(candidate=>candidate.id===id);if(!item)return items;const scope=categoryId&&categoryId!=='all'?categoryId:itemCategoryIds(item)[0],peers=items.map((candidate,index)=>({candidate,index})).filter(entry=>itemInCategory(entry.candidate,scope)),peerIndex=peers.findIndex(entry=>entry.candidate.id===id),nextPeer=peers[peerIndex+direction];if(peerIndex<0||!nextPeer)return items;const currentIndex=peers[peerIndex].index,next=[...items];[next[currentIndex],next[nextPeer.index]]=[next[nextPeer.index],next[currentIndex]];return next;}
export function setMenuItemPosition(items,id,position,categoryId='all'){const item=items.find(candidate=>candidate.id===id);if(!item)return items;const scope=categoryId==='all'?'all':(categoryId||itemCategoryIds(item)[0]),peers=scope==='all'?[...items]:items.filter(candidate=>itemInCategory(candidate,scope)),index=peers.findIndex(candidate=>candidate.id===id),target=Math.max(0,Math.min(peers.length-1,Number(position)));if(index<0||index===target)return items;const ordered=[...peers],[moved]=ordered.splice(index,1);ordered.splice(target,0,moved);const peerIds=new Set(peers.map(candidate=>candidate.id));let cursor=0;return items.map(candidate=>peerIds.has(candidate.id)?ordered[cursor++]:candidate);}
export function reorderMenuItem(items,sourceId,targetId){const source=items.findIndex(item=>item.id===sourceId),target=items.findIndex(item=>item.id===targetId);if(source<0||target<0||source===target)return items;const next=[...items],[item]=next.splice(source,1),targetAfter=next.findIndex(candidate=>candidate.id===targetId);next.splice(targetAfter,0,item);return next;}

export function draftDishDescription(item,prompt='',mode='notes'){
  const note=String(prompt||'').trim().replace(/\s+/g,' ').replace(/[.!?]+$/,'').slice(0,120),name=clean(item?.name,'This dish',80),categoryCues={small:'made for sharing and finished with bright, balanced flavours',mains:'thoughtfully prepared with generous texture and a clean finish',sweet:'layered with gentle sweetness and a refined finish',drinks:'fresh, vibrant, and made to enjoy slowly'},photoCues=['finished with garden herbs and a bright citrus lift','with warm, toasted notes and a delicate savoury finish','balanced with fresh herbs, spice, and a silky texture','lightly charred with coastal flavours and a clean finish','rich and comforting with an earthy, aromatic finish','roasted until tender with crisp edges and preserved lemon','warm and indulgent with caramel notes and a creamy finish','bright with citrus, sea salt, and a delicate crumb','cool, sparkling, and lifted with fresh botanicals'],tag=item?.tags?.[0];
  const detail=note||(mode==='photo'?photoCues[Number(item?.photo||0)%photoCues.length]:categoryCues[item?.category]||'prepared with seasonal ingredients and a thoughtful finish'),tagLine=tag?` ${tag} friendly.`:'';
  return `${name}, ${detail.charAt(0).toLowerCase()}${detail.slice(1)}.${tagLine}`.replace(/\.\s*\./g,'.').trim();
}

