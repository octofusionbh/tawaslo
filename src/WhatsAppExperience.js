import {useEffect,useMemo,useState} from 'react';
import {Archive,ArrowRight,CalendarCheck,Check,CheckCheck,ChevronDown,Clock,MapPin,MessageCircle,MoreHorizontal,Moon,Paperclip,Search,Send,Smile,Sun,UserRound,Users,X} from 'lucide-react';
import {FaWhatsapp} from 'react-icons/fa';
import {WHATSAPP_CONVERSATIONS,WHATSAPP_FILTERS,WHATSAPP_QUICK_REPLIES,appendWhatsAppMessage,assignWhatsAppConversation,conversationById,createWhatsAppReservation,filterWhatsAppConversations,setWhatsAppConversationStatus} from './whatsappPreviewModel';
import './whatsapp-experience.css';

// wa_threads rows carry no status, unread count, intent or type, so the live queue
// can only be narrowed by what a thread really holds: the person and the message text.
function searchConversations(items,query){
  const needle=String(query||'').trim().toLowerCase();
  if(!needle)return items;
  return items.filter(item=>`${item.name} ${item.preview} ${item.phone}`.toLowerCase().includes(needle));
}

function ConversationRow({conversation,active,onChoose}){
  return <li><button type="button" className="wa-conversation-row" aria-pressed={active} onClick={()=>onChoose(conversation.id)}>
    <span className="wa-avatar" style={{'--wa-avatar':conversation.tone}}>{conversation.initials}</span>
    <span className="wa-conversation-copy"><span><strong>{conversation.name}</strong><small>{conversation.time}</small></span>{conversation.intent?<b>{conversation.intent}</b>:null}<p>{conversation.preview}</p></span>
    {conversation.unread>0&&<span className="wa-unread" aria-label={`${conversation.unread} unread`}>{conversation.unread}</span>}
  </button></li>;
}

function GuestMessage({message,receipts=true}){
  const meta=message.time||(receipts&&message.side==='team');
  return <div className={`wa-message wa-message-${message.side}`}><p>{message.text}</p>{meta?<span>{message.time}{receipts&&message.side==='team'&&<CheckCheck size={13} aria-label="Read"/>}</span>:null}</div>;
}

export default function WhatsAppExperience({dark=false,setDark=()=>{},liveConversations=null,clientName='',liveMetrics=null,liveQuickReplies=null,onSendMessage=null}){
  const live=liveConversations!==null&&liveConversations!==undefined;
  const [items,setItems]=useState(()=>live?liveConversations:WHATSAPP_CONVERSATIONS),[filter,setFilter]=useState('open'),[query,setQuery]=useState(''),[selectedId,setSelectedId]=useState(()=>live?((liveConversations[0]&&liveConversations[0].id)||''):WHATSAPP_CONVERSATIONS[0].id),[draft,setDraft]=useState(''),[notice,setNotice]=useState(''),[contextOpen,setContextOpen]=useState(false);
  useEffect(()=>{if(live)setItems(liveConversations);},[live,liveConversations]);
  const quickReplies=live?(liveQuickReplies||[]):WHATSAPP_QUICK_REPLIES;
  const shown=useMemo(()=>live?searchConversations(items,query):filterWhatsAppConversations(items,{filter,query}),[live,items,filter,query]);
  const selected=conversationById(selectedId,items);
  useEffect(()=>{if(shown.length&&!shown.some(item=>item.id===selectedId))setSelectedId(shown[0].id);},[shown,selectedId]);
  useEffect(()=>{if(!notice)return;const timer=setTimeout(()=>setNotice(''),2500);return()=>clearTimeout(timer);},[notice]);
  async function sendMessage(){
    const text=draft.trim();
    if(!text||!selected)return;
    if(live){
      setDraft('');setNotice('Sending\u2026');
      const result=onSendMessage?await onSendMessage(selected,text):null;
      if(result&&result.error){setDraft(text);setNotice(result.error);return;}
      // wa_threads stores no per-message timestamp, so the sent line carries none.
      setItems(current=>appendWhatsAppMessage(current,selected.id,text,''));setNotice('Reply sent on WhatsApp.');return;
    }
    setItems(current=>appendWhatsAppMessage(current,selected.id,draft));setDraft('');setNotice('Reply added to this local preview.');
  }
  function useReply(text){setDraft(text);setNotice('Reply placed in the composer.');}
  function toggleDone(){const next=selected.status==='done'?'open':'done';setItems(current=>setWhatsAppConversationStatus(current,selected.id,next));setNotice(next==='done'?'Conversation marked done.':'Conversation reopened.');}
  function reserve(){setItems(current=>createWhatsAppReservation(current,selected.id));setNotice(`A table is held for ${selected.name.split(' ')[0]} at 8:00 PM in this preview.`);}
  function assign(value){setItems(current=>assignWhatsAppConversation(current,selected.id,value));setNotice(value==='Unassigned'?'Conversation unassigned.':`Assigned to ${value}.`);}

  const openCount=items.filter(item=>item.status==='open').length;
  const unreadCount=items.reduce((sum,item)=>sum+item.unread,0);
  return <main className="tw-whatsapp-desk" data-whatsapp-theme={dark?'dark':'light'}>
    <div className="wa-preview-line">{live?<span/>:<span>Concierge preview · Sample guests · Nothing is sent or booked</span>}<button type="button" className="wa-icon-button" onClick={()=>setDark(!dark)} aria-label={dark?'Use light Concierge theme':'Use dark Concierge theme'}>{dark?<Sun size={18}/>:<Moon size={18}/>}</button></div>
    <header className="wa-heading">
      <div><span className="wa-kicker"><img src="/logo-transparent.png" width="22" height="22" alt=""/>{live?`${clientName||'Workspace'} / Concierge`:'Marina Social Club / Concierge'}</span><h1>Every conversation, understood.</h1><p>Concierge answers first, keeps customer context nearby, and brings the team in whenever a human touch matters.</p></div>
      {live
        ?<div className="wa-service-note"><span>Live conversations</span><div><strong>{items.length}</strong><small>{items.length===1?'conversation':'conversations'}</small></div>{liveMetrics&&Number.isFinite(liveMetrics.chatsThisMonth)?<div><strong>{liveMetrics.chatsThisMonth}</strong><small>chats this month</small></div>:null}</div>
        :<div className="wa-service-note"><span>Live conversations</span><div><strong>{openCount}</strong><small>open now</small></div><div><strong>{unreadCount}</strong><small>need attention</small></div><div><strong>4m</strong><small>first response</small></div></div>}
    </header>
    <div className="wa-toast" role="status">{notice}</div>
    <section className="wa-toolbar" aria-label="Conversation tools">
      <label className="wa-search"><Search size={17}/><span className="wa-sr-only">Search conversations</span><input type="search" value={query} onChange={event=>setQuery(event.target.value.slice(0,70))} placeholder="Search people or messages"/>{query&&<button type="button" onClick={()=>setQuery('')} aria-label="Clear search"><X size={15}/></button>}</label>
      {!live&&<div className="wa-filters">{WHATSAPP_FILTERS.map(item=><button type="button" key={item.id} aria-pressed={filter===item.id} onClick={()=>setFilter(item.id)}>{item.label}{item.id==='unread'&&unreadCount>0?<span>{unreadCount}</span>:null}</button>)}</div>}
      {(!live||items.length>0)&&<div className="wa-connection"><FaWhatsapp/><span><strong>Concierge on WhatsApp</strong>{!live&&<small>Sample connection</small>}</span><i/></div>}
    </section>

    <div className="wa-desk">
      <aside className="wa-queue" aria-label="Conversation queue">
        <div className="wa-column-title"><span>{filter==='done'?'Completed':'Conversation queue'}</span><small>{shown.length} conversations</small></div>
        {shown.length?<ol>{shown.map(conversation=><ConversationRow key={conversation.id} conversation={conversation} active={!!selected&&conversation.id===selected.id} onChoose={id=>{setSelectedId(id);setContextOpen(false);}}/>)}</ol>:<div className="wa-empty"><MessageCircle size={28}/><strong>{live?'No conversations yet':'No conversations here'}</strong><span>{live?(query?'No conversation matches this search.':'Conversations appear here when a guest messages this workspace on WhatsApp.'):'Try another view or clear the search.'}</span>{(!live||query)&&<button type="button" onClick={()=>{setFilter('open');setQuery('');}}>{live?'Clear search':'Show open conversations'}</button>}</div>}
      </aside>

      {selected&&<>
      <section className="wa-thread" aria-label={`Conversation with ${selected.name}`}>
        <header className="wa-thread-head"><div className="wa-avatar" style={{'--wa-avatar':selected.tone}}>{selected.initials}</div><div><strong>{selected.name}</strong><span>{selected.phone} · WhatsApp</span></div><button type="button" className="wa-context-toggle" onClick={()=>setContextOpen(value=>!value)} aria-expanded={contextOpen}><UserRound size={16}/>Customer context</button><button type="button" className="wa-icon-button" aria-label="More conversation options"><MoreHorizontal size={19}/></button></header>
        {!live&&<div className="wa-intent-strip"><span><i/>{selected.priority}</span><strong>{selected.intent}</strong><small>Assigned to {selected.assigned}</small></div>}
        <div className="wa-message-field">
          {!live&&<div className="wa-dayline"><span>Today</span></div>}
          {(selected.messages||[]).map(message=><GuestMessage key={message.id} message={message} receipts={!live}/>)}
        </div>
        <footer className="wa-composer">
          {quickReplies.length>0&&<div className="wa-quick-replies" aria-label="Quick replies">{quickReplies.map(reply=><button type="button" key={reply.id} onClick={()=>useReply(reply.text)}>{reply.label}</button>)}</div>}
          <div className="wa-compose-row"><button type="button" className="wa-icon-button" aria-label="Attach a file"><Paperclip size={18}/></button><label><span className="wa-sr-only">Write a reply</span><textarea rows="1" value={draft} onChange={event=>setDraft(event.target.value.slice(0,900))} onKeyDown={event=>{if(event.key==='Enter'&&!event.shiftKey){event.preventDefault();sendMessage();}}} placeholder={`Reply to ${selected.name.split(' ')[0]}...`}/></label><button type="button" className="wa-icon-button" aria-label="Add an emoji"><Smile size={18}/></button><button type="button" className="wa-send" disabled={!draft.trim()} onClick={sendMessage}><Send size={17}/><span>Send</span></button></div>
          <small>Enter to send · Shift + Enter for a new line</small>
        </footer>
      </section>

      <aside className={`wa-context${contextOpen?' wa-context-open':''}`} aria-label="Customer context">
        <div className="wa-column-title"><span>Customer context</span><button type="button" className="wa-mobile-close" onClick={()=>setContextOpen(false)} aria-label="Close customer context"><X size={18}/></button></div>
        <section className="wa-guest"><span className="wa-avatar wa-avatar-large" style={{'--wa-avatar':selected.tone}}>{selected.initials}</span><h2>{selected.name}</h2><p>{selected.phone}</p>{!live&&<div className="wa-assignee"><label htmlFor="wa-assignee">Owner</label><span><Users size={14}/><select id="wa-assignee" value={selected.assigned} onChange={event=>assign(event.target.value)}><option>Abdulla</option><option>Maya</option><option>Unassigned</option></select><ChevronDown size={14}/></span></div>}</section>
        {(()=>{
          const detail=selected.details||{};
          const facts=live
            ?[['Relationship',detail.visits],['Last interaction',detail.lastVisit],['Prefers',detail.preference]].filter(row=>row[1])
            :[['Relationship',detail.visits],['Last interaction',detail.lastVisit],['Recorded spend',detail.spend],['Prefers',detail.preference]];
          return facts.length?<dl className="wa-guest-facts">{facts.map(([label,value])=><div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>:null;
        })()}
        {!live&&<section className="wa-service-ticket"><div><span>Service cue</span><strong>{selected.details.occasion}</strong></div>{selected.type==='reservations'&&selected.status!=='done'?<><div className="wa-ticket-time"><Clock size={17}/><span><strong>8:00 PM</strong><small>Tonight · 2 guests</small></span></div><div className="wa-ticket-place"><MapPin size={15}/>Terrace, quiet table</div><button type="button" onClick={reserve}><CalendarCheck size={17}/>{selected.priority==='Reservation held'?'Reservation held':'Hold this table'}<ArrowRight size={16}/></button></>:<><p>{selected.type==='orders'?'Confirm the item and pickup time before closing the conversation.':'Guest request is ready for a thoughtful reply.'}</p><button type="button" onClick={()=>useReply(WHATSAPP_QUICK_REPLIES[selected.type==='orders'?1:2].text)}>Prepare reply<ArrowRight size={16}/></button></>}</section>}
        {!live&&<button type="button" className={`wa-complete${selected.status==='done'?' is-done':''}`} onClick={toggleDone}>{selected.status==='done'?<><Archive size={16}/>Reopen conversation</>:<><Check size={16}/>Mark conversation done</>}</button>}
        {!live&&<p className="wa-local-note">Sample workspace. Replies, assignments, reservations, and guest history stay in this browser preview.</p>}
      </aside>
      </>}
    </div>
    <footer className="wa-footer"><span>Clarity in every conversation.</span><span>{live?`${clientName?clientName+' · ':''}Tawaslo Concierge`:'Marina Social Club · Tawaslo Concierge'}</span></footer>
  </main>;
}
