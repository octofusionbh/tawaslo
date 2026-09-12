import {useCallback,useEffect,useRef,useState} from 'react';
import {supabase} from './supabase';
import PickupExperience from './PickupExperience';

const ORIGIN=(typeof window!=='undefined'&&window.location.origin)||'https://tawaslo.com';
const text=value=>typeof value==='string'?value:'';

// The public ordering page reads pickup_pay to decide which payment paths it offers, so it is the
// column the two design toggles have to round-trip through.
function payFlags(row){
  const mode=text(row.pickup_pay)||'cash';
  return {payOnline:mode==='online'||mode==='both',payCounter:mode==='cash'||mode==='both'};
}
function payMode(settings){
  if(settings.payOnline&&settings.payCounter)return 'both';
  if(settings.payOnline)return 'online';
  return 'cash';
}

// menus.pickup_methods always carries 'inside'; the design exposes only the car/curbside half of it.
function methods(carhop){return carhop?['inside','carhop']:['inside'];}

function toSettings(row){
  const {payOnline,payCounter}=payFlags(row);
  const list=Array.isArray(row.pickup_methods)?row.pickup_methods:text(row.pickup_methods).split(',').map(item=>item.trim()).filter(Boolean);
  const minimum=row.pickup_min_order===null||row.pickup_min_order===undefined||row.pickup_min_order===''?'0.000':String(row.pickup_min_order);
  return {
    enabled:row.pickup_enabled===true,
    opens:text(row.pickup_open)||'08:00',
    closes:text(row.pickup_close)||'23:00',
    prepMinutes:Number(row.pickup_prep_min)||0,
    advanceDays:row.pickup_days_ahead==null?0:Number(row.pickup_days_ahead),
    currency:text(row.currency)||'BHD',
    minimumOrder:minimum,
    payOnline,payCounter,
    carhop:list.includes('carhop'),
    inside:list.includes('inside')||list.length===0,
    aiEnabled:row.order_ai===true,
    // pickup_days_ahead is always in force on the live ordering page, so scheduling is never "off" here.
    allowScheduled:true,
    // No column backs these, and PickupExperience hides every control that reads them while live props are present.
    serviceModes:[],languages:[],taxMode:'none',timezone:'',location:'',
    hostDestination:'',hostEmail:'',orderPrefix:'',notifyGuest:false,checkoutNote:'',
  };
}

function toMenu(row,rows){
  // Mirrors the public order page: visible items only, narrowed to the pickup selection when one exists.
  const visible=rows.filter(item=>item.hidden!==true&&item.available!==false);
  const picked=visible.filter(item=>item.on_pickup===true);
  const items=(picked.length?picked:visible).map(item=>({
    id:item.id,
    name:text(item.name_en).trim()||text(item.name_ar).trim(),
    price:item.price===null||item.price===undefined||item.price===''?'':String(item.price),
    available:true,
    // menu_items.lead_hours is advance notice for pre-orders, not preparation time, so every item
    // inherits the one real default instead of borrowing a column that means something else.
    fulfillmentMinutes:null,
  }));
  return {id:row.id,title:text(row.title)||'',items};
}

export default function OrdersLive({client,dark=false,setDark=()=>{},onOpenHostTest=()=>{}}){
  const [state,setState]=useState({status:'loading',settings:null,menu:null,slug:'',error:''});
  // The saved row is kept out of React state: it is only ever read to build the next update.
  const rowRef=useRef(null);
  const clientId=client?.id||'';
  const clientName=client?.name||'';

  useEffect(()=>{
    let active=true;
    if(!clientId&&!clientName){setState({status:'empty',settings:null,menu:null,slug:'',error:''});return undefined;}
    setState({status:'loading',settings:null,menu:null,slug:'',error:''});
    (async()=>{
      try{
        let id=clientId;
        if(!id){
          const {data,error}=await supabase.from('clients').select('id').eq('name',clientName).limit(1);
          if(error)throw error;
          id=data&&data[0]&&data[0].id;
        }
        if(!id)throw new Error('This client is not in the workspace yet.');
        const {data:menuRows,error:menuError}=await supabase.from('menus').select('*').eq('client_id',id).limit(1);
        if(menuError)throw menuError;
        const row=menuRows&&menuRows[0];
        // Creating the menu is the Menu page's job; ordering has nothing to configure without one.
        if(!row)throw new Error('Open Menu / catalog first to create this client’s menu. Order setup lives on that menu.');
        const {data:itemRows,error:itemError}=await supabase.from('menu_items').select('*').eq('menu_id',row.id).order('sort',{ascending:true}).order('created_at',{ascending:true});
        if(itemError)throw itemError;
        if(!active)return;
        rowRef.current=row;
        setState({status:'ready',settings:toSettings(row),menu:toMenu(row,itemRows||[]),slug:text(row.slug),error:''});
      }catch(error){
        if(!active)return;
        setState({status:'error',settings:null,menu:null,slug:'',error:(error&&error.message)||'Order setup could not be loaded.'});
      }
    })();
    return()=>{active=false};
  },[clientId,clientName]);

  const handleSave=useCallback(async settings=>{
    const row=rowRef.current;
    if(!row)return {error:'This order setup is not connected yet.'};
    const minimum=String(settings.minimumOrder??'').trim();
    const parsed=minimum===''?0:Number(minimum);
    const patch={
      pickup_enabled:settings.enabled===true,
      pickup_open:settings.opens,
      pickup_close:settings.closes,
      pickup_prep_min:Number(settings.prepMinutes)||0,
      pickup_days_ahead:Number(settings.advanceDays)||0,
      pickup_methods:methods(settings.carhop===true),
      pickup_pay:payMode(settings),
      // online_pay_enabled gates the card-payment branch elsewhere; it stays in step with pickup_pay.
      online_pay_enabled:settings.payOnline===true,
      order_ai:settings.aiEnabled===true,
      currency:settings.currency,
    };
    // A minimum that will not parse is left untouched rather than written as zero.
    if(Number.isFinite(parsed))patch.pickup_min_order=parsed;
    try{
      const {error}=await supabase.from('menus').update(patch).eq('id',row.id);
      if(error)throw error;
      const {data:refreshed,error:refreshError}=await supabase.from('menus').select('*').eq('id',row.id).limit(1);
      if(refreshError)throw refreshError;
      rowRef.current=(refreshed&&refreshed[0])||{...row,...patch};
      return {};
    }catch(error){
      return {error:(error&&error.message)||'Order setup could not be saved.'};
    }
  },[]);

  if(state.status!=='ready'||!state.settings){
    return <main className="tw-pickup" data-pickup-theme={dark?'dark':'light'}>
      <header className="po-heading"><div><span><img src="/logo-transparent.png" width="22" height="22" alt=""/>{clientName?`${clientName} / Order setup`:'Order setup'}</span><h1>Orders, ready before launch.</h1>
      <p>{state.status==='loading'?'Loading this client’s order setup…':state.status==='empty'?'Choose a client to open their order setup.':state.error}</p></div></header>
    </main>;
  }

  return <PickupExperience key={state.menu.id} liveSettings={state.settings} liveMenu={state.menu} clientName={clientName} orderLink={state.slug?`${ORIGIN}/order/${state.slug}`:''} onSave={handleSave} dark={dark} setDark={setDark} onOpenHostTest={onOpenHostTest}/>;
}
