import { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  ArrowRight, Building2, Check, CheckCircle2, ChevronDown, CircleDollarSign,
  Copy, CreditCard, ExternalLink, FileText, Mail,
  MoreHorizontal, Plus, Search, ShieldCheck, Trash2, UserPlus,
  Users, X,
} from 'lucide-react';
import { FaFacebook, FaInstagram, FaLinkedin, FaTiktok } from 'react-icons/fa';
import './agency-suite-experience.css';
import './workspace-admin-experience.css';
import './portal-overlays.css';

const clients=[
  {id:'marina',name:'Marina Social Club',type:'Hospitality',initials:'MS',accent:'#ff7a6d',accounts:4,posts:12,attention:3,status:'Active'},
  {id:'north',name:'Northline Goods',type:'Retail',initials:'NG',accent:'#4bd9be',accounts:3,posts:8,attention:1,status:'Active'},
  {id:'atelier',name:'Atelier Noura',type:'Fashion',initials:'AN',accent:'#9b87ff',accounts:5,posts:16,attention:0,status:'Active'},
  {id:'harbour',name:'Harbour Dental',type:'Services',initials:'HD',accent:'#6ca8ff',accounts:2,posts:6,attention:2,status:'Review'},
  {id:'orbit',name:'Orbit Learning',type:'Education',initials:'OL',accent:'#f2b651',accounts:3,posts:9,attention:0,status:'Active'},
];

const invoiceRows=[
  ['INV-1048','Marina Social Club','BHD 420.000','1 Sep 2026','Paid'],
  ['INV-1047','Atelier Noura','BHD 680.000','1 Sep 2026','Paid'],
  ['INV-1046','Northline Goods','BHD 510.000','28 Aug 2026','Sent'],
  ['INV-1045','Harbour Dental','BHD 390.000','25 Aug 2026','Overdue'],
  ['INV-1044','Orbit Learning','BHD 460.000','20 Aug 2026','Draft'],
];

const teamSeed=[
  {name:'Abdulla',email:'abdulla@agency.test',role:'Owner',status:'Active',initials:'AB'},
  {name:'Maya Chen',email:'maya@agency.test',role:'Admin',status:'Active',initials:'MC'},
  {name:'Omar Yusuf',email:'omar@agency.test',role:'Manager',status:'Active',initials:'OY'},
  {name:'Sara Hassan',email:'sara@agency.test',role:'Content creator',status:'Active',initials:'SH'},
];

const accounts=[
  {name:'Marina Social Club',handle:'@marinasocialclub',channel:'Instagram',status:'Connected',updated:'8 min ago',Icon:FaInstagram,color:'#f14b8b'},
  {name:'Marina Social Club',handle:'Marina Social Club',channel:'Facebook',status:'Connected',updated:'12 min ago',Icon:FaFacebook,color:'#498af2'},
  {name:'Marina Social Club',handle:'Marina Social Club',channel:'LinkedIn',status:'Connected',updated:'18 min ago',Icon:FaLinkedin,color:'#5fa8ff'},
  {name:'Marina Social Club',handle:'@marinasocialclub',channel:'TikTok',status:'Needs attention',updated:'Reconnect to refresh',Icon:FaTiktok,color:'#ff6f78'},
];

function Intro({eyebrow,title,copy,actions}){return <header className="wa-intro"><div><span><Building2 size={15}/>{eyebrow}</span><h1>{title}</h1><p>{copy}</p></div>{actions&&<div>{actions}</div>}</header>}
function Stat({label,value,note,tone='violet'}){return <article className="wa-stat" data-tone={tone}><span>{label}</span><strong>{value}</strong><small>{note}</small></article>}
function Toast({text}){return text?createPortal(<div className="suite-toast" role="status"><Check size={15}/>{text}</div>,document.body):null}
function useToast(){const[toast,setToast]=useState('');const notify=text=>{setToast(text);window.clearTimeout(window.__twAdminToast);window.__twAdminToast=window.setTimeout(()=>setToast(''),2200)};return[toast,notify]}

export function ClientsExperience(){
  const[query,setQuery]=useState('');const[filter,setFilter]=useState('All');const[selected,setSelected]=useState('marina');const[toast,notify]=useToast();
  const visible=useMemo(()=>clients.filter(client=>(filter==='All'||client.type===filter)&&client.name.toLowerCase().includes(query.toLowerCase())),[query,filter]);
  const active=clients.find(client=>client.id===selected)||clients[0];
  return <main className="wa-page"><div className="wa-preview"><span>Client workspace · Sample portfolio</span><span><ShieldCheck size={14}/>Agency only</span></div><Intro eyebrow="Agency portfolio" title={<>Every client.<br/><em>One calm workspace.</em></>} copy="See what needs attention across every brand, then move into the right workspace without losing context." actions={<button className="wa-primary" type="button" onClick={()=>notify('New client setup opened.')}><Plus size={16}/>Add client</button>}/>
    <section className="wa-stats"><Stat label="Active clients" value="5" note="across four business types"/><Stat label="Connected accounts" value="17" note="one connection needs attention" tone="aqua"/><Stat label="Posts this month" value="51" note="published and scheduled" tone="coral"/><Stat label="Needs attention" value="6" note="reviews, approvals and connections" tone="gold"/></section>
    <section className="wa-client-layout"><div className="wa-panel wa-client-list"><header><div><span>Client list</span><h2>Choose a workspace.</h2></div><label><Search size={16}/><input aria-label="Search clients" placeholder="Search clients" value={query} onChange={event=>setQuery(event.target.value)}/></label></header><div className="wa-filter-row" role="group" aria-label="Client type">{['All','Retail','Hospitality','Fashion','Services','Education'].map(item=><button type="button" key={item} aria-pressed={filter===item} onClick={()=>setFilter(item)}>{item}</button>)}</div><div className="wa-client-rows">{visible.map(client=><button type="button" key={client.id} aria-pressed={selected===client.id} onClick={()=>setSelected(client.id)}><i style={{'--client-accent':client.accent}}>{client.initials}</i><span><strong>{client.name}</strong><small>{client.type} · {client.accounts} connected accounts</small></span><span><strong>{client.posts}</strong><small>posts</small></span><span data-empty={!client.attention}><strong>{client.attention||'—'}</strong><small>attention</small></span><ArrowRight size={16}/></button>)}</div></div>
      <aside className="wa-panel wa-client-preview" style={{'--client-accent':active.accent}}><span>Selected workspace</span><div className="wa-client-mark">{active.initials}</div><h2>{active.name}</h2><p>{active.type} · {active.accounts} connected accounts</p><div><span><strong>{active.posts}</strong><small>posts this month</small></span><span><strong>{active.attention||0}</strong><small>need attention</small></span></div><button type="button" onClick={()=>notify(`${active.name} workspace opened.`)}>Open client workspace <ArrowRight size={16}/></button><button type="button" onClick={()=>notify(`${active.name} settings opened.`)}>Manage client</button></aside>
    </section><Toast text={toast}/></main>
}

export function InvoicingExperience(){
  const[query,setQuery]=useState('');const[filter,setFilter]=useState('All');const[creating,setCreating]=useState(false);const[toast,notify]=useToast();
  const visible=invoiceRows.filter(row=>(filter==='All'||row[4]===filter)&&row.join(' ').toLowerCase().includes(query.toLowerCase()));
  return <main className="wa-page"><div className="wa-preview"><span>Invoicing · Sample agency data · Currency BHD</span><span><ShieldCheck size={14}/>Preview only</span></div><Intro eyebrow="Agency finances" title={<>Invoices without<br/><em>the admin fog.</em></>} copy="Create, send and follow up on client invoices from one clear view. Currency and tax rules stay configurable per client." actions={<button className="wa-primary" type="button" onClick={()=>setCreating(true)}><Plus size={16}/>New invoice</button>}/>
    <section className="wa-stats"><Stat label="Paid this month" value="BHD 6.8K" note="12 invoices settled"/><Stat label="Outstanding" value="BHD 1.4K" note="4 invoices awaiting payment" tone="aqua"/><Stat label="Overdue" value="BHD 390" note="one invoice needs follow-up" tone="coral"/><Stat label="Drafts" value="3" note="ready for your review" tone="gold"/></section>
    <section className="wa-panel wa-table-panel"><header><div><span>Invoice ledger</span><h2>Recent invoices.</h2></div><div className="wa-table-tools"><label><Search size={15}/><input aria-label="Search invoices" placeholder="Search invoices" value={query} onChange={event=>setQuery(event.target.value)}/></label><select aria-label="Invoice status" value={filter} onChange={event=>setFilter(event.target.value)}>{['All','Paid','Sent','Overdue','Draft'].map(item=><option key={item}>{item}</option>)}</select></div></header><div className="wa-table"><div className="wa-table-row wa-table-head"><span>Invoice</span><span>Client</span><span>Amount</span><span>Issued</span><span>Status</span><span/></div>{visible.map(row=><div className="wa-table-row" key={row[0]}>{row.map((cell,index)=><span key={cell}>{index===0?<strong>{cell}</strong>:index===4?<i data-status={cell.toLowerCase()}>{cell}</i>:cell}</span>)}<button type="button" aria-label={`Open ${row[0]}`} onClick={()=>notify(`${row[0]} opened.`)}><ArrowRight size={16}/></button></div>)}</div></section>
    <section className="wa-note"><CircleDollarSign size={18}/><div><strong>Built for international client work</strong><span>Choose currency, tax label, due terms and locale per invoice. Nothing assumes one country or one kind of business.</span></div><button type="button" onClick={()=>notify('Invoice defaults opened.')}>Invoice defaults</button></section>
    {creating&&createPortal(<InvoiceModal onClose={()=>setCreating(false)} onCreate={()=>{setCreating(false);notify('Draft invoice created.')}}/>,document.body)}<Toast text={toast}/></main>
}

function InvoiceModal({onClose,onCreate}){const[client,setClient]=useState('Marina Social Club');const[amount,setAmount]=useState('420.000');return <div className="wa-modal-backdrop" role="presentation" onMouseDown={event=>event.target===event.currentTarget&&onClose()}><form className="wa-modal" role="dialog" aria-modal="true" aria-labelledby="invoice-modal-title" onSubmit={event=>{event.preventDefault();onCreate()}}><button type="button" aria-label="Close" onClick={onClose}><X size={18}/></button><span>New invoice</span><h2 id="invoice-modal-title">Start with the essentials.</h2><p>Save a clean draft now. Add line items, tax and payment details in the full editor.</p><label>Client<select value={client} onChange={event=>setClient(event.target.value)}>{clients.map(item=><option key={item.id}>{item.name}</option>)}</select></label><div><label>Currency<select aria-label="Invoice currency"><option>BHD</option><option>SAR</option><option>AED</option><option>USD</option><option>GBP</option><option>EUR</option></select></label><label>Amount<input value={amount} onChange={event=>setAmount(event.target.value)} inputMode="decimal"/></label></div><footer><button type="button" onClick={onClose}>Cancel</button><button type="submit" className="wa-primary"><FileText size={15}/>Create draft</button></footer></form></div>}

export function SocialAccountsExperience(){
  const[toast,notify]=useToast();const[connecting,setConnecting]=useState(false);
  return <main className="wa-page"><div className="wa-preview"><span>Social accounts · Sample connections</span><span><ShieldCheck size={14}/>Encrypted connections</span></div><Intro eyebrow="Connected channels" title={<>One workspace.<br/><em>Every social account.</em></>} copy="Connect the channels each client uses, understand connection health, and fix access before it interrupts publishing or reporting." actions={<button className="wa-primary" type="button" onClick={()=>setConnecting(true)}><Plus size={16}/>Connect account</button>}/>
    <section className="wa-stats"><Stat label="Connected" value="16" note="across five client workspaces"/><Stat label="Healthy" value="15" note="publishing and insights available" tone="aqua"/><Stat label="Needs attention" value="1" note="reconnect before the next post" tone="coral"/><Stat label="Channels" value="5" note="Instagram, Facebook, LinkedIn, TikTok, Google" tone="gold"/></section>
    <section className="wa-panel wa-account-panel"><header><div><span>Marina Social Club</span><h2>Connection health.</h2></div><button type="button" onClick={()=>notify('All account permissions were checked.')}>Check all permissions</button></header><div className="wa-account-grid">{accounts.map(({name,handle,channel,status,updated,Icon,color})=><article key={channel} data-warning={status!=='Connected'}><i style={{color}}><Icon size={21}/></i><div><span>{channel}</span><strong>{handle}</strong><small>{name}</small></div><em data-status={status==='Connected'?'good':'warn'}>{status==='Connected'?<CheckCircle2 size={13}/>:<ShieldCheck size={13}/>} {status}</em><small>{updated}</small><button type="button" aria-label={`Manage ${channel}`} onClick={()=>notify(`${channel} connection settings opened.`)}><MoreHorizontal size={17}/></button></article>)}</div></section>
    <section className="wa-note"><ShieldCheck size={18}/><div><strong>Accounts belong to the client workspace.</strong><span>Team members only see the clients and actions their role allows. Access can be removed without deleting content history.</span></div></section>
    {connecting&&createPortal(<ConnectModal onClose={()=>setConnecting(false)} onSelect={name=>{setConnecting(false);notify(`${name} connection flow opened.`)}}/>,document.body)}<Toast text={toast}/></main>
}

function ConnectModal({onClose,onSelect}){return <div className="wa-modal-backdrop" role="presentation" onMouseDown={event=>event.target===event.currentTarget&&onClose()}><section className="wa-modal" role="dialog" aria-modal="true" aria-labelledby="connect-title"><button type="button" aria-label="Close" onClick={onClose}><X size={18}/></button><span>Connect a channel</span><h2 id="connect-title">Choose the account type.</h2><p>You will review permissions before anything is connected.</p><div className="wa-connect-grid">{[["Instagram",'Business or creator',FaInstagram],["Facebook",'Page',FaFacebook],["LinkedIn",'Company Page or profile',FaLinkedin],["TikTok",'Business or creator',FaTiktok]].map(([name,copy,Icon])=><button type="button" key={name} onClick={()=>onSelect(name)}><Icon size={20}/><span><strong>{name}</strong><small>{copy}</small></span><ArrowRight size={15}/></button>)}</div></section></div>}

export function TeamExperience(){
  const[members,setMembers]=useState(teamSeed);const[inviting,setInviting]=useState(false);const[toast,notify]=useToast();
  return <main className="wa-page"><div className="wa-preview"><span>Team & permissions · Sample members</span><span><ShieldCheck size={14}/>Role-based access</span></div><Intro eyebrow="Agency team" title={<>The right access.<br/><em>Nothing more.</em></>} copy="Invite collaborators, set what they can see, and keep client work separated as the agency grows." actions={<button className="wa-primary" type="button" onClick={()=>setInviting(true)}><UserPlus size={16}/>Invite teammate</button>}/>
    <section className="wa-stats"><Stat label="Team members" value={String(members.length)} note="including one owner"/><Stat label="Client access" value="Scoped" note="assigned by role and client" tone="aqua"/><Stat label="Pending invites" value="1" note="expires in five days" tone="coral"/><Stat label="Security" value="2FA" note="recommended for every member" tone="gold"/></section>
    <section className="wa-panel wa-team-panel"><header><div><span>People</span><h2>Workspace members.</h2></div><button type="button" onClick={()=>notify('The permissions matrix opened.')}>View permissions matrix</button></header><div className="wa-team-list">{members.map(member=><article key={member.email}><i>{member.initials}</i><span><strong>{member.name}</strong><small>{member.email}</small></span><label><span className="sr-only">Role for {member.name}</span><select aria-label={`Role for ${member.name}`} value={member.role} disabled={member.role==='Owner'} onChange={event=>{setMembers(current=>current.map(item=>item.email===member.email?{...item,role:event.target.value}:item));notify(`${member.name} is now ${event.target.value}.`)}}>{['Owner','Admin','Manager','Content creator','Analyst','Billing'].map(role=><option key={role}>{role}</option>)}</select><ChevronDown size={14}/></label><em><i/>Active</em><button type="button" aria-label={`More options for ${member.name}`} onClick={()=>notify(`${member.name} member options opened.`)}><MoreHorizontal size={17}/></button></article>)}</div></section>
    <section className="wa-permission-grid">{[['Owner','Full workspace, billing and security'],['Admin','Clients, content, team and settings'],['Manager','Assigned clients and approvals'],['Content creator','Create and schedule for assigned clients'],['Analyst','Analytics and reports only'],['Billing','Invoices and billing only']].map(([role,copy])=><article key={role}><strong>{role}</strong><span>{copy}</span></article>)}</section>
    {inviting&&createPortal(<InviteModal onClose={()=>setInviting(false)} onInvite={(email,role)=>{setInviting(false);notify(`Invitation prepared for ${email} as ${role}.`)}}/>,document.body)}<Toast text={toast}/></main>
}

function InviteModal({onClose,onInvite}){const[email,setEmail]=useState('');const[role,setRole]=useState('Content creator');return <div className="wa-modal-backdrop" role="presentation" onMouseDown={event=>event.target===event.currentTarget&&onClose()}><form className="wa-modal" role="dialog" aria-modal="true" aria-labelledby="invite-title" onSubmit={event=>{event.preventDefault();if(email.trim())onInvite(email.trim(),role)}}><button type="button" aria-label="Close" onClick={onClose}><X size={18}/></button><span>Invite teammate</span><h2 id="invite-title">Give access with intention.</h2><p>They will only see the clients and actions allowed by the selected role.</p><label>Email address<input autoFocus type="email" required value={email} onChange={event=>setEmail(event.target.value)} placeholder="name@agency.com"/></label><label>Role<select value={role} onChange={event=>setRole(event.target.value)}>{['Admin','Manager','Content creator','Analyst','Billing'].map(item=><option key={item}>{item}</option>)}</select></label><footer><button type="button" onClick={onClose}>Cancel</button><button type="submit" className="wa-primary"><Mail size={15}/>Send invite</button></footer></form></div>}
