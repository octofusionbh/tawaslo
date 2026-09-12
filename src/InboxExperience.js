import {useEffect,useMemo,useState} from 'react';
import {ArrowRight,AtSign,Check,CheckCheck,ChevronDown,Clock3,CornerUpLeft,Inbox,MessageCircle,MoreHorizontal,RefreshCw,Search,Send,X} from 'lucide-react';
import {FaFacebook,FaInstagram,FaLinkedin,FaTiktok} from 'react-icons/fa';
import './inbox-experience.css';

const CHANNELS={
  all:{label:'All channels',Icon:Inbox,color:'#8d7cff'},
  instagram:{label:'Instagram',Icon:FaInstagram,color:'#ef4f87'},
  facebook:{label:'Facebook',Icon:FaFacebook,color:'#5b8def'},
  linkedin:{label:'LinkedIn',Icon:FaLinkedin,color:'#61a9dc'},
  tiktok:{label:'TikTok',Icon:FaTiktok,color:'#f5f4ff'},
};

const CONVERSATIONS=[
  {id:'sara',type:'comment',platform:'instagram',name:'Sara Hassan',handle:'@sara.eats',time:'8m',unread:true,priority:'Sales question',tone:'#577b9b',preview:'This looks amazing! Where can I order?',text:'This looks amazing 😍 Where can I order from? Do you deliver to Seef?',post:'Weekend brunch has arrived.',mood:'Positive',suggestions:['Thank you, Sara! You can order through the link in our bio. We deliver to Seef too. Would you like today’s menu?','So glad you like it, Sara. Tap Order now in our bio and choose Seef at checkout.','Yes, we deliver to Seef. I can share today’s menu and ordering link with you right here.']},
  {id:'lulwa',type:'dm',platform:'instagram',name:'Lulwa Events',handle:'@lulwa.events',time:'24m',unread:true,priority:'Potential lead',tone:'#8b617d',preview:'Can you send the private-events package?',text:'Hi! Can you send me your catering and private-events package? We are planning something for around 40 guests.',post:'Direct message',mood:'Lead',suggestions:['Absolutely, Lulwa. I can share our private-events package. May I also have your preferred date and contact number?','We would love to help. I’ll send the package now. What date are you considering for the 40 guests?','Of course. Our events team can prepare the right options once we know your date and preferred setup.']},
  {id:'mohammed',type:'comment',platform:'facebook',name:'Mohammed Jassim',handle:'Mohammed J.',time:'1h',unread:true,priority:'Needs an answer',tone:'#4f7c73',preview:'هل يوجد توصيل للمنطقة؟',text:'هل يوجد توصيل للمنطقة؟ وكم سعر البرانش؟',post:'Friday by the water.',mood:'Question',suggestions:['نعم، التوصيل متوفر للمنطقة. سعر البرانش 14 د.ب للشخص، ويمكنك الطلب من الرابط في صفحتنا.','أهلاً محمد، نوصل للمنطقة وسعر البرانش 14 د.ب. هل نرسل لك رابط الطلب؟','أكيد! التوصيل متوفر، والبرانش بسعر 14 د.ب للشخص. يسعدنا إرسال القائمة لك.']},
  {id:'noor',type:'mention',platform:'instagram',name:'Noor Designs',handle:'@noor.designs',time:'2h',unread:false,priority:'Brand mention',tone:'#75649e',preview:'Featured you in my story 💛',text:'Featured you in my story! Tag me back please 💛',post:'Story mention',mood:'Positive',suggestions:['Thank you for sharing us, Noor! We love this and are reposting now 💛','You made our day, Noor. Thank you for the lovely mention!','Thank you, Noor! We’re so happy you enjoyed it and we’ll share your story.']},
  {id:'dana',type:'dm',platform:'linkedin',name:'Dana Rahman',handle:'Dana Rahman',time:'3h',unread:false,priority:'Partnership',tone:'#745d68',preview:'I would love to discuss a collaboration.',text:'Hello, I would love to discuss a possible brand collaboration for October. Who is the best person to speak with?',post:'Direct message',mood:'Lead',suggestions:['Hi Dana, thank you for reaching out. I can connect you with our partnerships team. Could you share your email and a short overview?','We would be happy to explore this, Dana. Please send your campaign idea and preferred contact details.','Thanks, Dana. October sounds interesting. Share your email and proposal and our team will follow up.']},
  {id:'ali',type:'comment',platform:'tiktok',name:'Ali H.',handle:'@ali.bh',time:'5h',unread:false,priority:'Simple question',tone:'#836c50',preview:'Are you open on Friday morning?',text:'Are you open on Friday morning?',post:'Meet you by the bay.',mood:'Question',suggestions:['Yes, Ali. We open at 9 AM on Fridays. We’d love to see you.','We are! Friday hours start at 9 AM.','Yes, we open Friday morning at 9 AM. Would you like the breakfast menu?']},
];

const FILTERS=[['all','All'],['comment','Comments'],['dm','DMs'],['mention','Mentions']];
const TYPE_LABEL={comment:'Comment',dm:'Direct message',mention:'Mention'};

function ChannelIcon({platform,size=15}){
  const channel=CHANNELS[platform]||CHANNELS.all;
  return <channel.Icon aria-hidden="true" style={{fontSize:size,color:channel.color}}/>;
}

function ConversationItem({item,active,onSelect}){
  return <li><button type="button" className="ib-row" aria-pressed={active} onClick={()=>onSelect(item.id)}>
    <span className="ib-avatar" style={{'--ib-avatar':item.tone}}>{item.name.slice(0,1)}</span>
    <span className="ib-row-copy">
      <span className="ib-row-line"><strong>{item.name}</strong><small>{item.time}</small></span>
      <span className="ib-row-line ib-row-meta"><span><ChannelIcon platform={item.platform}/>{TYPE_LABEL[item.type]}</span>{item.unread&&<i aria-label="Unread"/>}</span>
      <span className="ib-preview">{item.preview}</span>
    </span>
  </button></li>;
}

export default function InboxExperience({ liveItems = null, clientName = '', onReply = null, loading = false, error = '' } = {}){
  const live = liveItems !== null && liveItems !== undefined;
  const source = liveItems || CONVERSATIONS;
  const [items,setItems]=useState(source);
  const [selectedId,setSelectedId]=useState(source[0]?.id ?? null);
  useEffect(()=>{ if(liveItems){ setItems(liveItems); setSelectedId(current => liveItems.some(i=>i.id===current) ? current : (liveItems[0]?.id ?? null)); } },[liveItems]);
  const [filter,setFilter]=useState('all');
  const [channel,setChannel]=useState('all');
  const [query,setQuery]=useState('');
  const [draft,setDraft]=useState('');
  const [tone,setTone]=useState('Warm');
  const [suggestionPage,setSuggestionPage]=useState(0);
  const [notice,setNotice]=useState('');
  const [sent,setSent]=useState([]);

  const filtered=useMemo(()=>items.filter(item=>(filter==='all'||item.type===filter)&&(channel==='all'||item.platform===channel)&&(!query.trim()||`${item.name} ${item.handle} ${item.text}`.toLowerCase().includes(query.trim().toLowerCase()))),[items,filter,channel,query]);
  const selected=filtered.find(item=>item.id===selectedId)||filtered[0]||items.find(item=>item.id===selectedId)||items[0];
  const unread=items.filter(item=>item.unread).length;
  const waiting=items.filter(item=>item.type!=='mention'&&!sent.some(reply=>reply.id===item.id)).length;
  const counts=Object.fromEntries(FILTERS.map(([key])=>[key,key==='all'?items.length:items.filter(item=>item.type===key).length]));
  const suggestions=selected.suggestions.map((copy,index)=>selected.type==='mention'&&tone==='Professional'?copy.replace('love this','appreciate the mention'):tone==='Apologetic'&&index===0?`Thanks for your patience. ${copy}`:copy);

  useEffect(()=>{
    if(filtered.length&&!filtered.some(item=>item.id===selectedId)){
      setSelectedId(filtered[0].id);
      setDraft('');
      setSuggestionPage(0);
    }
  },[filtered,selectedId]);

  function choose(id){
    setSelectedId(id);
    setItems(current=>current.map(item=>item.id===id?{...item,unread:false}:item));
    setDraft('');
    setSuggestionPage(0);
  }
  function sendReply(){
    const text=draft.trim();
    if(!text)return;
    setSent(current=>[...current.filter(reply=>reply.id!==selected.id),{id:selected.id,text}]);
    setItems(current=>current.map(item=>item.id===selected.id?{...item,unread:false}:item));
    setDraft('');
    if (onReply) { onReply(selected, text).then(ok => setNotice(ok ? `Reply sent to ${selected.name}.` : `Could not send that reply to ${selected.name}.`)).catch(() => setNotice('Could not send that reply.')); }
    else setNotice(`Reply ready in this preview for ${selected.name}.`);
    window.setTimeout(()=>setNotice(''),2400);
  }
  function clearFilters(){setFilter('all');setChannel('all');setQuery('');}

  return <main className="ib-experience">
    <header className="ib-hero">
      <div className="ib-title-block">
        <span className="ib-kicker"><AtSign size={15}/>{live?`${clientName||'Workspace'} / Social Inbox`:'Marina Social Club / Social Inbox'}</span>
        <h1>Every conversation, in one place.</h1>
        <p>Comments, mentions and messages, sorted by what needs you first.</p>
      </div>
      <div className="ib-summary" aria-label="Inbox summary">
        <div><strong>{unread}</strong><span>unread</span></div>
        <div><strong>{waiting}</strong><span>need replies</span></div>
        <div className="ib-ai-on"><MessageCircle size={15}/><span><strong>AI replies</strong><small>Ready when you are</small></span></div>
      </div>
    </header>

    <section className="ib-channel-bar" aria-label="Social channel filter">
      <div className="ib-channel-copy"><span>Showing activity from</span><strong>{CHANNELS[channel].label}</strong></div>
      <div className="ib-channels">{Object.entries(CHANNELS).map(([key,item])=><button type="button" key={key} aria-pressed={channel===key} onClick={()=>setChannel(key)}><item.Icon aria-hidden="true"/>{item.label}</button>)}</div>
    </section>

    <section className="ib-workspace">
      <aside className="ib-queue" aria-label="Conversation list">
        <div className="ib-queue-head"><div><span>Conversation queue</span><small>Newest activity first</small></div><button type="button" aria-label="More inbox options"><MoreHorizontal size={19}/></button></div>
        <label className="ib-search"><Search size={16}/><span className="ib-sr-only">Search conversations</span><input type="search" value={query} onChange={event=>setQuery(event.target.value.slice(0,70))} placeholder="Search people or messages"/>{query&&<button type="button" onClick={()=>setQuery('')} aria-label="Clear search"><X size={15}/></button>}</label>
        <div className="ib-filters">{FILTERS.map(([key,label])=><button type="button" key={key} aria-pressed={filter===key} onClick={()=>setFilter(key)}>{label}<span>{counts[key]}</span></button>)}</div>
        <ol className="ib-list">{filtered.map(item=><ConversationItem key={item.id} item={item} active={item.id===selected.id} onSelect={choose}/>)}</ol>
        {!filtered.length&&<div className="ib-empty"><MessageCircle size={27}/><strong>No conversations found</strong><span>Try another filter or search.</span><button type="button" onClick={clearFilters}>Clear filters</button></div>}
      </aside>

      <section className="ib-stage" aria-label={`Conversation with ${selected.name}`}>
        <header className="ib-stage-head">
          <span className="ib-avatar ib-avatar-lg" style={{'--ib-avatar':selected.tone}}>{selected.name.slice(0,1)}</span>
          <span><strong>{selected.name}</strong><small><ChannelIcon platform={selected.platform}/>{selected.handle} · {TYPE_LABEL[selected.type]}</small></span>
          <span className="ib-priority">{selected.priority}</span>
          <button type="button" className="ib-resolve" onClick={()=>setNotice('Conversation marked handled in this preview.')}><Check size={16}/>Mark handled</button>
        </header>

        <div className="ib-stage-body">
          <section className="ib-thread-column">
            <div className="ib-thread">
              <div className="ib-context-line"><span><ChannelIcon platform={selected.platform}/>{selected.post}</span><button type="button">Open original<ArrowRight size={14}/></button></div>
              <div className="ib-day"><span>Today</span></div>
              <article className="ib-message"><p>{selected.text}</p><footer><span>{selected.time} ago</span><span className={`ib-mood ib-mood-${selected.mood.toLowerCase()}`}>{selected.mood}</span></footer></article>
              {sent.find(reply=>reply.id===selected.id)&&<article className="ib-message ib-message-team"><p>{sent.find(reply=>reply.id===selected.id).text}</p><footer><span>Just now</span><span><CheckCheck size={14}/>Preview reply</span></footer></article>}
            </div>

            <footer className="ib-composer">
              <div className="ib-compose-label"><span>{live?`Reply as ${clientName||'your workspace'}`:'Reply as Marina Social Club'}</span><span>{draft.length}/600</span></div>
              <div className="ib-compose-row"><textarea rows="2" value={draft} onChange={event=>setDraft(event.target.value.slice(0,600))} onKeyDown={event=>{if(event.key==='Enter'&&!event.shiftKey){event.preventDefault();sendReply();}}} placeholder={`Reply to ${selected.name.split(' ')[0]}…`}/><button type="button" disabled={!draft.trim()} onClick={sendReply}><Send size={17}/>Send reply</button></div>
              <div className="ib-compose-foot"><span>Enter to send · Shift + Enter for a new line</span><button type="button"><ChevronDown size={14}/>Saved replies</button></div>
            </footer>
          </section>

          <aside className="ib-assist" aria-label="AI reply assistant">
            <header><span><MessageCircle size={16}/>AI reply</span><small>Optional · Uses brand voice</small></header>
            <div className="ib-tones">{['Warm','Professional','Apologetic'].map(option=><button type="button" key={option} aria-pressed={tone===option} onClick={()=>setTone(option)}>{option}</button>)}</div>
            <div className="ib-suggestion"><p>{suggestions[suggestionPage%suggestions.length]}</p><button type="button" onClick={()=>setDraft(suggestions[suggestionPage%suggestions.length])}>Use this reply<CornerUpLeft size={14}/></button></div>
            <button type="button" className="ib-regenerate" onClick={()=>setSuggestionPage(page=>(page+1)%suggestions.length)}><RefreshCw size={14}/>Show another option</button>
            <div className="ib-ai-note"><Clock3 size={14}/><span>You review every AI reply before it is sent.</span></div>
          </aside>
        </div>

      </section>
    </section>
    <div className={`ib-toast${notice?' is-visible':''}`} role="status">{notice}</div>
  </main>;
}
