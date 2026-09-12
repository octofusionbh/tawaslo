import {useCallback,useEffect,useRef,useState} from 'react';
import {supabase} from './supabase';
import MenuExperience from './MenuExperience';

// menu_items.category is a free-text string and every read path in the app falls back to this label,
// so it is the workspace's own default rather than a value invented for the redesign.
const DEFAULT_CATEGORY='General';

const ORIGIN=(typeof window!=='undefined'&&window.location.origin)||'https://tawaslo.com';
const slugify=value=>String(value||'menu').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,26)||'menu';
const text=value=>typeof value==='string'?value:'';

// The design keeps decorative plate artwork and photo slots per dish. menu_items has neither, so every
// live dish gets the same neutral placeholders; MenuExperience hides the pickers that would edit them.
const DECORATIVE_ART='coral';

function toExperienceItem(row){
  const category=text(row.category).trim()||DEFAULT_CATEGORY;
  const price=row.price===null||row.price===undefined||row.price===''?'':String(row.price);
  // dine_in / on_pickup are the real channel flags; anything else stays visible so nothing disappears from the editor.
  const service=row.dine_in===false&&row.on_pickup!==false?'pickup':row.dine_in!==false&&row.on_pickup===false?'dine-in':'all';
  return {
    id:row.id,
    productId:row.id,
    category,
    categories:[category],
    name:text(row.name_en).trim()||text(row.name_ar).trim(),
    description:text(row.description),
    price,
    tags:Array.isArray(row.tags)?row.tags.filter(tag=>typeof tag==='string'):[],
    available:row.available!==false&&row.hidden!==true,
    featured:false,
    art:DECORATIVE_ART,
    photo:0,
    service,
    fulfillmentMinutes:null,
  };
}

function toExperienceMenu(row,rows){
  const present=[];
  rows.forEach(item=>{const name=text(item.category).trim()||DEFAULT_CATEGORY;if(!present.includes(name))present.push(name);});
  const saved=Array.isArray(row.cat_order)?row.cat_order.filter(name=>typeof name==='string'&&present.includes(name)):[];
  const names=[...saved,...present.filter(name=>!saved.includes(name))];
  return {
    id:row.id,
    // menus has no separate display name or menu type, so both mirror the one real column and their editors stay hidden.
    name:text(row.title)||'Menu',
    type:'Everyday',
    title:text(row.title),
    subtitle:'',
    currency:text(row.currency),
    serviceNote:'',
    // photo-led layout renders the design's sample dish grid, which would attach stock food photos to real dishes.
    menuStyle:'classic',
    available:true,
    // menus.theme stores a named preset, not a palette; these are the stylesheet's own defaults and the brand editor is hidden.
    brand:{primary:'#22594E',accent:'#B13D31',background:'#FBF5E9',text:'#241B16',font:'editorial'},
    categories:(names.length?names:[DEFAULT_CATEGORY]).map(name=>({id:name,name,note:''})),
    items:rows.map(toExperienceItem),
    publicUrl:row.slug?`${ORIGIN}/menu/${row.slug}`:'',
  };
}

async function loadItems(menuId){
  const {data,error}=await supabase.from('menu_items').select('*').eq('menu_id',menuId).order('sort',{ascending:true}).order('created_at',{ascending:true});
  if(error)throw error;
  return data||[];
}

export default function MenuLive({client,dark=false,setDark=()=>{},onOpenHostTest=()=>{}}){
  const [state,setState]=useState({status:'loading',menu:null,error:''});
  // The saved rows are kept out of React state: they are only ever read to diff the next save.
  const rowsRef=useRef({menu:null,items:[]});
  const clientId=client?.id||'';
  const clientName=client?.name||'';

  useEffect(()=>{
    let active=true;
    if(!clientId&&!clientName){setState({status:'empty',menu:null,error:''});return undefined;}
    setState({status:'loading',menu:null,error:''});
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
        let row=menuRows&&menuRows[0];
        if(!row){
          // Same first-run behaviour as the menu page this replaces: a client without a menus row gets one.
          const {data:created,error:createError}=await supabase.from('menus').insert([{client_id:id,slug:`${slugify(clientName)}-${Math.random().toString(36).slice(2,5)}`,title:clientName||'Menu',currency:'BHD'}]).select();
          if(createError)throw createError;
          row=created&&created[0];
        }
        if(!row)throw new Error('This menu could not be opened.');
        const items=await loadItems(row.id);
        if(!active)return;
        rowsRef.current={menu:row,items};
        setState({status:'ready',menu:toExperienceMenu(row,items),error:''});
      }catch(error){
        if(!active)return;
        setState({status:'error',menu:null,error:(error&&error.message)||'This menu could not be loaded.'});
      }
    })();
    return()=>{active=false};
  },[clientId,clientName]);

  const handleSave=useCallback(async draft=>{
    const row=rowsRef.current.menu;
    if(!row)return {error:'This menu is not connected yet.'};
    const sections=Array.isArray(draft.categories)&&draft.categories.length?draft.categories:[{id:DEFAULT_CATEGORY,name:DEFAULT_CATEGORY}];
    // Renaming a section keeps its id, so the id -> name map is what turns an edited section into the stored category string.
    const nameFor=id=>{const match=sections.find(section=>section.id===id);return (text(match&&match.name).trim()||text(id).trim())||DEFAULT_CATEGORY;};
    const items=Array.isArray(draft.items)?draft.items:[];
    if(items.some(item=>!text(item.name).trim()))return {error:'Give every item a name before saving.'};

    const order=[];
    sections.forEach(section=>{const name=nameFor(section.id);if(!order.includes(name))order.push(name);});
    const known=new Set(rowsRef.current.items.map(item=>item.id));
    const kept=new Set(items.filter(item=>known.has(item.id)).map(item=>item.id));

    try{
      const {error:menuError}=await supabase.from('menus').update({title:text(draft.title).trim(),cat_order:order}).eq('id',row.id);
      if(menuError)throw menuError;

      for(const item of rowsRef.current.items){
        if(kept.has(item.id))continue;
        const {error}=await supabase.from('menu_items').delete().eq('id',item.id);
        if(error)throw error;
      }

      for(let index=0;index<items.length;index+=1){
        const item=items[index];
        const price=text(String(item.price??'')).trim();
        const parsed=price===''?null:Number(price);
        const patch={menu_id:row.id,category:nameFor(item.category),name_en:text(item.name).trim(),description:text(item.description).trim()||null,tags:Array.isArray(item.tags)?item.tags:[],sort:index};
        // A price that will not parse is left untouched rather than written as null or guessed.
        if(price===''||Number.isFinite(parsed))patch.price=parsed;
        const existing=known.has(item.id)?rowsRef.current.items.find(candidate=>candidate.id===item.id):null;
        if(existing){
          const wasAvailable=existing.available!==false&&existing.hidden!==true;
          // hidden and available are separate states in the database; only touch them when the operator actually flipped the switch.
          if(item.available!==wasAvailable){patch.available=item.available!==false;if(item.available!==false)patch.hidden=false;}
          const {error}=await supabase.from('menu_items').update(patch).eq('id',item.id);
          if(error)throw error;
        }else{
          const {error}=await supabase.from('menu_items').insert([{...patch,available:item.available!==false,hidden:false}]);
          if(error)throw error;
        }
      }

      const {data:refreshed,error:refreshError}=await supabase.from('menus').select('*').eq('id',row.id).limit(1);
      if(refreshError)throw refreshError;
      const nextRow=(refreshed&&refreshed[0])||row;
      const nextItems=await loadItems(row.id);
      rowsRef.current={menu:nextRow,items:nextItems};
      const nextMenu=toExperienceMenu(nextRow,nextItems);
      setState({status:'ready',menu:nextMenu,error:''});
      return {menu:nextMenu};
    }catch(error){
      return {error:(error&&error.message)||'This menu could not be saved.'};
    }
  },[]);

  if(state.status!=='ready'||!state.menu){
    return <main className="tw-menu-studio" data-menu-theme={dark?'dark':'light'}>
      <header className="mn-heading"><div><span className="mn-kicker"><img src="/logo-transparent.png" width="22" height="22" alt=""/>{clientName?`${clientName} / Menu`:'Menu'}</span><h1>The menu, <br/>still moving.</h1>
      <p>{state.status==='loading'?'Loading this client’s menu…':state.status==='empty'?'Choose a client to open their menu.':state.error}</p></div></header>
    </main>;
  }

  return <MenuExperience key={state.menu.id} liveMenu={state.menu} clientName={clientName} onSave={handleSave} dark={dark} setDark={setDark} onOpenHostTest={onOpenHostTest}/>;
}
