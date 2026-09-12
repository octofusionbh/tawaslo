export const PICKUP_STORAGE_KEY='tw_preview_pickup:v1';
export const PICKUP_STATUSES=['new','preparing','ready','completed'];

export const PICKUP_SEED={
  settings:{
    enabled:true,prepMinutes:30,opens:'11:30',closes:'22:30',inside:true,carhop:true,payOnline:true,payCounter:true,aiEnabled:true,allowScheduled:true,
    serviceModes:['pickup'],currency:'BHD',taxMode:'included',minimumOrder:'0.000',advanceDays:7,timezone:'Asia/Bahrain',
    location:'Marina Social Club · Seef',hostDestination:'Host dashboard + email',hostEmail:'orders@marinasocialclub.com',
    orderPrefix:'MSC',notifyGuest:true,languages:['English','العربية'],
    checkoutNote:'Please tell us about allergies, delivery notes, or anything the team should know.',
  },
  orders:[
    {id:'MSC-1048',guest:'Mariam',placed:'12:08',promised:'12:30',status:'new',method:'Inside pickup',payment:'Paid online',source:'AI concierge',phone:'••• 4812',total:'14.600',note:'No chilli on the prawns.',items:[{qty:1,name:'Charred Gulf prawns'},{qty:1,name:'Warm hummus'}]},
    {id:'MSC-1047',guest:'Yousef',placed:'12:02',promised:'12:25',status:'new',method:'Car pickup',payment:'Pay at counter',source:'Pickup QR',phone:'••• 9904',total:'8.400',note:'White SUV. Call when ready.',items:[{qty:2,name:'Marina spritz'},{qty:1,name:'Lemon and olive oil tart'}]},
    {id:'MSC-1046',guest:'Noor',placed:'11:51',promised:'12:15',status:'preparing',method:'Inside pickup',payment:'Paid online',source:'Pickup menu',phone:'••• 3327',total:'16.800',note:'Gluten-free request confirmed by the team.',items:[{qty:1,name:'Grilled sea bass'},{qty:1,name:'Warm hummus'}]},
    {id:'MSC-1045',guest:'Ali',placed:'11:42',promised:'12:05',status:'preparing',method:'Car pickup',payment:'Paid online',source:'AI concierge',phone:'••• 7251',total:'13.600',note:'Black sedan.',items:[{qty:1,name:'Truffle rigatoni'},{qty:1,name:'Marina spritz'}]},
    {id:'MSC-1044',guest:'Dana',placed:'11:35',promised:'12:00',status:'ready',method:'Inside pickup',payment:'Paid online',source:'Pickup QR',phone:'••• 1083',total:'11.600',note:'Guest has been notified.',items:[{qty:1,name:'Burrata, tomato and sumac'},{qty:1,name:'Warm date pudding'}]},
    {id:'MSC-1043',guest:'Hamad',placed:'11:18',promised:'11:45',status:'completed',method:'Inside pickup',payment:'Pay at counter',source:'Pickup menu',phone:'••• 6140',total:'12.600',note:'Collected at 11:43.',items:[{qty:1,name:'Grilled sea bass'}]},
  ],
};

const clone=value=>JSON.parse(JSON.stringify(value));
const clean=(value,fallback,max=120)=>typeof value==='string'?(value.trim().slice(0,max)||fallback):fallback;

export function normalizePickup(value){
  const base=clone(PICKUP_SEED),settings=value?.settings||{},orders=Array.isArray(value?.orders)?value.orders.slice(0,30):base.orders;
  const allowedServices=['pickup','delivery','shipping'];
  const allowedLanguages=['English','العربية','Français','Español'];
  const serviceModes=Array.isArray(settings.serviceModes)?settings.serviceModes.filter(item=>allowedServices.includes(item)).slice(0,3):base.settings.serviceModes;
  const languages=Array.isArray(settings.languages)?settings.languages.filter(item=>allowedLanguages.includes(item)).slice(0,4):base.settings.languages;
  return{settings:{
    enabled:settings.enabled!==false,
    prepMinutes:[0,10,15,20,25,30,45,50,60,90,120,180,240,480,1440].includes(Number(settings.prepMinutes))?Number(settings.prepMinutes):30,
    opens:clean(settings.opens,'11:30',5),closes:clean(settings.closes,'22:30',5),inside:settings.inside!==false,carhop:settings.carhop!==false,
    payOnline:settings.payOnline!==false,payCounter:settings.payCounter!==false,aiEnabled:settings.aiEnabled!==false,allowScheduled:settings.allowScheduled!==false,
    serviceModes:serviceModes.length?serviceModes:[],
    currency:['BHD','SAR','AED','QAR','KWD','OMR','USD','EUR','GBP'].includes(settings.currency)?settings.currency:'BHD',
    taxMode:['included','added','none'].includes(settings.taxMode)?settings.taxMode:'included',
    minimumOrder:/^\d{1,6}(\.\d{0,3})?$/.test(String(settings.minimumOrder||''))?String(settings.minimumOrder):'0.000',
    advanceDays:[0,1,3,7,14,30,60].includes(Number(settings.advanceDays))?Number(settings.advanceDays):7,
    timezone:clean(settings.timezone,'Asia/Bahrain',60),location:clean(settings.location,'Marina Social Club · Seef',100),
    hostDestination:['Host dashboard + email','Host dashboard only','Host dashboard + SMS'].includes(settings.hostDestination)?settings.hostDestination:'Host dashboard + email',
    hostEmail:clean(settings.hostEmail,'orders@marinasocialclub.com',100),
    orderPrefix:clean(settings.orderPrefix,'MSC',8).toUpperCase().replace(/[^A-Z0-9-]/g,''),notifyGuest:settings.notifyGuest!==false,
    languages:languages.length?languages:[],checkoutNote:clean(settings.checkoutNote,'Please tell us anything the team should know.',180),
  },orders:orders.map((order,index)=>({id:clean(order?.id,`MSC-${1040-index}`,20),guest:clean(order?.guest,'Guest',60),placed:clean(order?.placed,'12:00',12),promised:clean(order?.promised,'12:20',12),status:PICKUP_STATUSES.includes(order?.status)?order.status:'new',method:['Inside pickup','Car pickup'].includes(order?.method)?order.method:'Inside pickup',payment:['Paid online','Pay at counter'].includes(order?.payment)?order.payment:'Paid online',source:['AI concierge','Pickup QR','Pickup menu'].includes(order?.source)?order.source:'Pickup menu',phone:clean(order?.phone,'••• 0000',24),total:/^\d{1,4}(\.\d{1,3})?$/.test(String(order?.total||''))?String(order.total):'0.000',note:clean(order?.note,'No special notes.',180),items:Array.isArray(order?.items)?order.items.slice(0,12).map(item=>({qty:Math.max(1,Math.min(20,Number(item?.qty)||1)),name:clean(item?.name,'Menu item',80)})):[]}))};
}

export function readPickup(store=typeof window!=='undefined'?window.localStorage:null){
  if(!store)return{data:clone(PICKUP_SEED),error:''};
  try{
    const raw=store.getItem(PICKUP_STORAGE_KEY);
    if(!raw)return{data:clone(PICKUP_SEED),error:''};
    const parsed=JSON.parse(raw);
    // Migrate the old sample default once without changing a value the client chose later.
    if(parsed?.settings?.allowScheduled===undefined&&Number(parsed?.settings?.prepMinutes)===20)parsed.settings.prepMinutes=30;
    return{data:normalizePickup(parsed),error:''};
  }catch(_){return{data:clone(PICKUP_SEED),error:'Saved pickup changes could not be read. The sample queue is still available.'};}
}
export function savePickup(data,store=typeof window!=='undefined'?window.localStorage:null){if(!store)return{ok:false,error:'Browser storage is unavailable. Keep this page open to preserve your changes.'};try{const normalized=normalizePickup(data);store.setItem(PICKUP_STORAGE_KEY,JSON.stringify(normalized));return{ok:true,data:normalized,error:''};}catch(_){return{ok:false,error:'Pickup settings could not be saved in this browser. Your changes remain open.'};}}
export function pickupSummary(orders){const active=orders.filter(order=>order.status!=='completed');return{new:active.filter(order=>order.status==='new').length,preparing:active.filter(order=>order.status==='preparing').length,ready:active.filter(order=>order.status==='ready').length,completed:orders.filter(order=>order.status==='completed').length,active:active.length};}
export function advancePickupOrder(orders,id){return orders.map(order=>{if(order.id!==id)return order;const index=PICKUP_STATUSES.indexOf(order.status);return{...order,status:PICKUP_STATUSES[Math.min(index+1,PICKUP_STATUSES.length-1)]};});}
export function addPreviewPickupOrder(data,{items=[],total='0.000',method='Inside pickup',promised='12:45'}={},now=Date.now()){if(!items.length)return data;const id=`MSC-${String(now).slice(-4)}`,order={id,guest:'Preview guest',placed:'Now',promised,status:'new',method,payment:'Paid online',source:'Pickup menu',phone:'••• 2026',total:String(total),note:'Preview order from the guest pickup menu.',items:items.map(item=>({qty:item.qty,name:item.name}))};return{...data,orders:[order,...data.orders]};}

