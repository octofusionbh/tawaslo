import {useCallback,useEffect,useRef,useState} from 'react';
import {supabase} from './supabase';
import LoyaltyExperience from './LoyaltyExperience';

const HEX=/^#[0-9a-f]{6}$/i;
const text=value=>typeof value==='string'?value:'';
const slugify=value=>String(value||'r').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,26)||'r';

// Column defaults declared in tawaslo-loyalty.sql / tawaslo-loyalty-branding.sql, used only when a row
// predates the column. They are the workspace's own defaults, not figures chosen for the redesign.
const COLUMN_DEFAULTS={stampGoal:8,pointsGoal:100,pointsPerVisit:10,brandColor:'#6e8cab'};
// loyalty_programs.theme is 'dark' | 'light'; the design names the same two moods differently.
const THEME_TO_MOOD={light:'paper',dark:'night'};
const MOOD_TO_THEME={paper:'light',night:'dark'};

function stamp(value){
  if(!value)return '';
  const date=new Date(value);
  return Number.isNaN(date.getTime())?'':date.toLocaleDateString([],{day:'numeric',month:'short',year:'numeric'});
}
function year(value){
  if(!value)return '';
  const date=new Date(value);
  return Number.isNaN(date.getTime())?'':String(date.getFullYear());
}

function toProgram(row,clientName){
  return {
    enabled:row.enabled!==false,
    // 'tiers' programs are passed through untouched: the design has no tier editor, so nothing rewrites them.
    type:text(row.type)||'stamps',
    reward:text(row.reward),
    stampGoal:Number(row.stamp_goal)||COLUMN_DEFAULTS.stampGoal,
    pointsGoal:Number(row.points_goal)||COLUMN_DEFAULTS.pointsGoal,
    pointsPerVisit:Number(row.points_per_visit)||COLUMN_DEFAULTS.pointsPerVisit,
    brandColor:HEX.test(text(row.brand_color))?row.brand_color.toLowerCase():COLUMN_DEFAULTS.brandColor,
    stampIcon:text(row.stamp_icon)||'check',
    cardTheme:THEME_TO_MOOD[text(row.theme)]||THEME_TO_MOOD.dark,
    welcome:text(row.welcome),
    // No column names the program, so the card carries the workspace's own name instead of an invented one.
    programName:clientName,
    // These have no column at all; LoyaltyExperience hides every control that reads them while live.
    // accentColor stays at the stylesheet's own value because the card art is drawn from it.
    accentColor:'#f0b94f',businessType:'other',earnAction:'visit',expiryDays:180,
    guestLanguage:'workspace',guestAction:'',guestActionUrl:'',
  };
}

function toMember(row){
  return {
    id:row.id,
    name:text(row.name).trim()||text(row.code).trim()||'Guest',
    phone:text(row.phone),
    code:text(row.code),
    stamps:Number(row.stamps)||0,
    points:Number(row.points)||0,
    visits:Number(row.visits)||0,
    redeemed:Number(row.redeemed)||0,
    // updated_at is what the loyalty page this replaces treats as the card's last activity.
    lastVisit:stamp(row.updated_at||row.created_at),
    since:year(row.created_at),
    // No column records a dormant member, a favourite, or a free-text memory.
    quiet:false,favorite:'',note:'',
  };
}

export default function LoyaltyLive({client,dark=false,setDark=()=>{},onOpenHostTest=()=>{}}){
  const [state,setState]=useState({status:'loading',data:null,error:''});
  // The saved program row is kept out of React state: it is only ever read to address the next update.
  const rowRef=useRef(null);
  const clientId=client?.id||'';
  const clientName=client?.name||'';

  useEffect(()=>{
    let active=true;
    if(!clientId&&!clientName){setState({status:'empty',data:null,error:''});return undefined;}
    setState({status:'loading',data:null,error:''});
    (async()=>{
      try{
        let id=clientId;
        if(!id){
          const {data,error}=await supabase.from('clients').select('id').eq('name',clientName).limit(1);
          if(error)throw error;
          id=data&&data[0]&&data[0].id;
        }
        if(!id)throw new Error('This client is not in the workspace yet.');

        // Same first-run behaviour as the loyalty page this replaces: a client without a bio page or a
        // program row gets one, so the customer link and the program exist from the first visit.
        let slug='';
        const {data:pages}=await supabase.from('bio_pages').select('slug').eq('client_id',id).limit(1);
        slug=(pages&&pages[0]&&pages[0].slug)||'';
        if(!slug){
          slug=`${slugify(clientName)}-${Math.random().toString(36).slice(2,5)}`;
          await supabase.from('bio_pages').insert([{client_id:id,slug,title:clientName}]);
        }

        const {data:programs,error:programError}=await supabase.from('loyalty_programs').select('*').eq('client_id',id).limit(1);
        if(programError)throw programError;
        let row=programs&&programs[0];
        if(!row){
          const {data:created,error:createError}=await supabase.from('loyalty_programs').insert([{client_id:id,type:'stamps',stamp_goal:8,reward:'Free item',points_per_visit:10,points_goal:100,tiers:[]}]).select();
          if(createError)throw createError;
          row=created&&created[0];
        }
        if(!row)throw new Error('This loyalty program could not be opened.');

        const {data:cards,error:cardError}=await supabase.from('loyalty_cards').select('*').eq('client_id',id).order('updated_at',{ascending:false});
        if(cardError)throw cardError;
        if(!active)return;
        rowRef.current=row;
        setState({status:'ready',data:{
          program:toProgram(row,clientName),
          members:(cards||[]).map(toMember),
          share:{slug},
          // The design's activity feed has no table behind it; LoyaltyExperience hides that section live.
          activity:[],
        },error:''});
      }catch(error){
        if(!active)return;
        setState({status:'error',data:null,error:(error&&error.message)||'This loyalty program could not be loaded.'});
      }
    })();
    return()=>{active=false};
  },[clientId,clientName]);

  const handleProgramChange=useCallback(update=>{
    const row=rowRef.current;
    if(!row)return;
    const patch={};
    if('enabled' in update)patch.enabled=update.enabled!==false;
    if('type' in update)patch.type=update.type;
    if('reward' in update)patch.reward=update.reward;
    if('stampGoal' in update&&Number.isFinite(Number(update.stampGoal)))patch.stamp_goal=Number(update.stampGoal);
    if('pointsGoal' in update&&Number.isFinite(Number(update.pointsGoal)))patch.points_goal=Number(update.pointsGoal);
    if('pointsPerVisit' in update&&Number.isFinite(Number(update.pointsPerVisit)))patch.points_per_visit=Number(update.pointsPerVisit);
    if('brandColor' in update&&HEX.test(String(update.brandColor)))patch.brand_color=String(update.brandColor).toLowerCase();
    if('stampIcon' in update)patch.stamp_icon=update.stampIcon;
    if('cardTheme' in update&&MOOD_TO_THEME[update.cardTheme])patch.theme=MOOD_TO_THEME[update.cardTheme];
    if('welcome' in update)patch.welcome=update.welcome;
    // Fields the design offers but the table has no column for never reach the database.
    if(!Object.keys(patch).length)return;
    patch.updated_at=new Date().toISOString();
    supabase.from('loyalty_programs').update(patch).eq('id',row.id).then(()=>{},()=>{});
  },[]);

  if(state.status!=='ready'||!state.data){
    return <main className="tw-loyalty" data-theme={dark?'dark':'light'}>
      <header className="ly-heading"><div><span>{clientName?`Loyalty / ${clientName}`:'Loyalty'}</span><h1>Make coming back <em>feel personal.</em></h1>
      <p>{state.status==='loading'?'Loading this client’s loyalty program…':state.status==='empty'?'Choose a client to open their loyalty program.':state.error}</p></div></header>
    </main>;
  }

  return <LoyaltyExperience key={clientId||clientName} liveData={state.data} clientName={clientName} onProgramChange={handleProgramChange} dark={dark} setDark={setDark} onOpenHostTest={onOpenHostTest}/>;
}
