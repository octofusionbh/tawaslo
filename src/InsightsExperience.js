import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Activity, AlertTriangle, ArrowRight, BarChart3, CalendarDays, Check,
  CheckCircle2, Clock3, Copy, Download, ExternalLink, FileBarChart,
  Eye, Globe2, Link2, MessageCircleWarning, MousePointerClick, Plus, Share2,
  RefreshCw, Search, Send, ShieldCheck, Target, TrendingUp,
  UserPlus, Users, X,
} from 'lucide-react';
import { FaInstagram, FaFacebook, FaLinkedin, FaTiktok } from 'react-icons/fa';
import './agency-suite-experience.css';
import './portal-overlays.css';

const periods = ['7 days', '30 days', '90 days'];
const platforms = ['All channels', 'Instagram', 'Facebook', 'LinkedIn', 'TikTok'];

const analyticsChannels = [
  ['All channels', BarChart3], ['Instagram', FaInstagram], ['Facebook', FaFacebook],
  ['LinkedIn', FaLinkedin], ['TikTok', FaTiktok],
];
const analyticsProfiles = {
  'All channels': { audience:'110.2K', reach:'1.24M', impressions:'2.81M', engagement:'6.8%', clicks:'12.4K', views:'684K', activity:[28,34,31,42,46,43,55,62,59,71,68,78,83,88] },
  Instagram: { audience:'64.8K', reach:'684K', impressions:'1.42M', engagement:'8.4%', clicks:'7.8K', views:'392K', activity:[24,31,36,42,39,51,58,55,63,70,75,79,86,92] },
  Facebook: { audience:'28.1K', reach:'312K', impressions:'672K', engagement:'4.9%', clicks:'2.6K', views:'118K', activity:[18,22,27,31,37,35,41,46,49,53,58,61,64,68] },
  LinkedIn: { audience:'9.6K', reach:'146K', impressions:'318K', engagement:'5.7%', clicks:'1.4K', views:'42K', activity:[20,26,24,33,38,42,39,47,52,55,61,58,65,72] },
  TikTok: { audience:'7.7K', reach:'98K', impressions:'400K', engagement:'7.2%', clicks:'620', views:'132K', activity:[16,21,29,26,38,45,49,57,54,66,71,75,82,86] },
};
const analyticsPlatformRows = [
  ['Instagram','64.8K','684K','8.4%','10.2K','+5.8%'],
  ['Facebook','28.1K','312K','4.9%','4.1K','+2.1%'],
  ['LinkedIn','9.6K','146K','5.7%','2.2K','+6.4%'],
  ['TikTok','7.7K','98K','7.2%','2.1K','+9.8%'],
];

const activity = [28,34,31,42,46,43,55,62,59,71,68,78,83,88];
const comparison = [21,27,25,31,38,35,41,45,43,49,54,57,61,64];

function MiniLine({ values=activity, compare=false, label='Performance over time' }) {
  const path = values.map((value,index)=>`${index?'L':'M'} ${index*(100/(values.length-1))} ${100-value}`).join(' ');
  const fill = `${path} L 100 100 L 0 100 Z`;
  const comparisonPath = comparison.map((value,index)=>`${index?'L':'M'} ${index*(100/(comparison.length-1))} ${100-value}`).join(' ');
  return <svg className="suite-chart" viewBox="0 0 100 100" role="img" aria-label={label} preserveAspectRatio="none">
    <defs><linearGradient id="suiteFade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#7b6dff" stopOpacity=".42"/><stop offset="1" stopColor="#7b6dff" stopOpacity="0"/></linearGradient></defs>
    {[20,40,60,80].map(y=><line key={y} x1="0" y1={y} x2="100" y2={y} className="suite-gridline"/>)}
    {compare&&<path d={comparisonPath} className="suite-line suite-line--compare"/>}
    <path d={fill} fill="url(#suiteFade)"/>
    <path d={path} className="suite-line"/>
  </svg>;
}

function PageIntro({ eyebrow, title, copy, actions, children }) {
  return <header className="suite-intro">
    <div className="suite-intro-copy"><span><BarChart3 size={15}/>{eyebrow}</span><h1>{title}</h1><p>{copy}</p>{children}</div>
    {actions&&<div className="suite-actions">{actions}</div>}
  </header>;
}

function PeriodSwitch({ value, onChange }) {
  return <div className="suite-switch" role="group" aria-label="Reporting period">{periods.map(period=><button type="button" key={period} aria-pressed={period===value} onClick={()=>onChange(period)}>{period}</button>)}</div>;
}

function Stat({ label, value, note, trend, tone='violet' }) {
  return <article className="suite-stat" data-tone={tone}><span>{label}</span><strong>{value}</strong><small>{trend&&<b>{trend}</b>}{note}</small></article>;
}

function Toast({ text }) { return text ? createPortal(<div className="suite-toast" role="status"><Check size={15}/>{text}</div>, document.body) : null; }

function useToast() {
  const [toast,setToast]=useState('');
  const notify=text=>{setToast(text);window.clearTimeout(window.__twSuiteToast);window.__twSuiteToast=window.setTimeout(()=>setToast(''),2200);};
  return [toast,notify];
}

// Sample figures stay in named constants so the design still renders untouched when
// no live report is supplied.
const venueSampleStats=[
  {label:'Customer actions',value:'1,284',trend:'+18%',note:' across purchases, bookings and visits'},
  {label:'Social reach',value:'1.24M',trend:'+12%',note:' compared with the prior period',tone:'aqua'},
  {label:'Attributed value',value:'BHD 8,420',trend:'+9%',note:' from tracked links and campaigns',tone:'coral'},
  {label:'Repeat customers',value:'64%',trend:'+6 pts',note:' returned during this period',tone:'gold'},
];
const venueSampleChannels={head:['Source','Reach','Actions','Attributed value','Signal'],rows:[['Instagram','684K','624','BHD 4,180','Leading'],['Facebook','312K','286','BHD 1,960','Steady'],['Direct & link in bio','—','228','BHD 1,620','Growing'],['Google & reviews','94K','146','BHD 660','Healthy']]};
const venueSampleAxis=['Week 1','Week 2','Week 3','Now'];

export function VenueReportExperience({ live=null, clientName='', onPeriodChange=null, onCopyShareLink=null, onExportPdf=null } = {}) {
  const [period,setPeriod]=useState('30 days');
  const [toast,notify]=useToast();
  // A live report carries only what the workspace records. The prior-period line, the
  // "what matters next" recommendation and per-source attribution have no stored source,
  // so they are hidden rather than estimated.
  const run=(handler,fallback)=>{if(!handler){notify(fallback);return;}Promise.resolve(handler()).then(message=>notify(typeof message==='string'&&message?message:fallback)).catch(()=>notify('That did not complete. Try again.'));};
  const changePeriod=value=>{setPeriod(value);if(onPeriodChange)onPeriodChange(value);};
  const stats=live?(live.stats||[]):venueSampleStats;
  const momentum=live?live.momentum:{values:activity,axis:venueSampleAxis};
  const channels=live?live.channels:venueSampleChannels;
  return <main className="suite-page suite-page--report">
    {!live&&<div className="suite-preview"><span>Business report · Sample connected data</span><span><ShieldCheck size={14}/>Agency preview</span></div>}
    <PageIntro eyebrow={live?`${clientName||'Workspace'} / Business report`:"Marina Social Club / Business report"} title={<>The whole business,<br/><em>in one honest view.</em></>} copy="Bring customer activity, social performance and commercial results together—without turning the report into a wall of charts." actions={<><button type="button" className="suite-secondary" onClick={()=>run(onCopyShareLink,'Share link copied for review.')}><Copy size={16}/>Copy share link</button><button type="button" className="suite-primary" onClick={()=>run(onExportPdf,'PDF report prepared.')}><Download size={16}/>Export PDF</button></>}><PeriodSwitch value={period} onChange={changePeriod}/></PageIntro>
    {stats.length>0&&<section className="suite-stat-grid" aria-label="Business performance summary">{stats.map(stat=><Stat key={stat.label} label={stat.label} value={stat.value} trend={stat.trend} note={stat.note} tone={stat.tone||'violet'}/>)}</section>}
    {momentum&&Array.isArray(momentum.values)&&momentum.values.length>1&&<section className="suite-dashboard-grid" style={live?{gridTemplateColumns:'minmax(0,1fr)'}:undefined}>
      <article className="suite-panel suite-panel--wide"><header><div><span>Business momentum</span><h2>Attention that became action.</h2></div>{!live&&<span className="suite-chip suite-chip--good"><TrendingUp size={13}/>Healthy growth</span>}</header><div className="suite-chart-wrap"><MiniLine values={momentum.values} compare={!live} label={`Business momentum for ${period}`}/><div className="suite-axis">{(momentum.axis||venueSampleAxis).map((item,index)=><span key={index}>{item}</span>)}</div></div><div className="suite-legend"><span><i/>Customer actions</span>{!live&&<span><i/>Previous period</span>}</div></article>
      {!live&&<aside className="suite-panel suite-focus"><span>What matters next</span><h2>Turn Friday interest into repeat visits.</h2><p>Your strongest social attention arrives 18–26 hours before the weekend. The customers who return most often respond to useful reminders, not broad discounts.</p><button type="button" onClick={()=>notify('A campaign brief was prepared for AI Studio.')}>Prepare a campaign brief <ArrowRight size={16}/></button><small><Target size={13}/>{live?'Recommendation based on the period shown':'Recommendation based on this sample period'}</small></aside>}
    </section>}
    {channels&&Array.isArray(channels.rows)&&channels.rows.length>0&&<section className="suite-panel suite-table-panel"><header><div><span>Channel contribution</span><h2>Where the result began.</h2></div>{!live&&<button type="button" onClick={()=>notify('The full contribution report is ready.')}>View full detail <ArrowRight size={15}/></button>}</header><div className="suite-data-table"><div className="suite-row suite-row--head">{channels.head.map((cell,index)=><span key={index}>{cell}</span>)}</div>{channels.rows.map((row,rowIndex)=><div className="suite-row" key={rowIndex}>{row.map((cell,index)=><span key={index}>{index===0?<strong>{cell}</strong>:cell}</span>)}</div>)}</div></section>}
    <Toast text={toast}/>
  </main>;
}

export function AnalyticsExperience({ live = null, clientName = '' } = {}) {
  const [period,setPeriod]=useState('30 days');
  const [channel,setChannel]=useState('All channels');
  const [toast,notify]=useToast();
  // `live` carries only what the connected account actually reports. Meta retired
  // impressions and profile views, so those tiles are dropped rather than faked.
  const profile=live ? live.profile : analyticsProfiles[channel];
  const channelRows=channel==='All channels'?analyticsPlatformRows:analyticsPlatformRows.filter(row=>row[0]===channel);
  return <main className="suite-page suite-page--analytics">
    {!live&&<div className="suite-preview"><span>Analytics · Sample connected data · Updated 8 minutes ago</span><span><Activity size={14}/>Live view</span></div>}
    <PageIntro eyebrow={live ? `${clientName || 'Workspace'} / Analytics` : "Marina Social Club / Analytics"} title={<>Every signal.<br/><em>One clear picture.</em></>} copy="Audience, reach, engagement and content performance—connected across every channel and ready to act on." actions={<button type="button" className="suite-primary" onClick={()=>notify('Analytics export prepared.')}><Download size={16}/>Export report</button>}>
      <div className="suite-analytics-filters"><PeriodSwitch value={period} onChange={setPeriod}/><div className="suite-analytics-channels" role="group" aria-label="Analytics channel">{analyticsChannels.map(([name,Icon])=><button type="button" key={name} aria-pressed={channel===name} onClick={()=>setChannel(name)}><Icon size={15} aria-hidden="true"/><span>{name}</span></button>)}</div></div>
    </PageIntro>
    <section className="suite-stat-grid suite-stat-grid--analytics" aria-label={`${channel} analytics summary`}><Stat label="Total audience" value={profile.audience} trend={live?undefined:"+4.8%"} note={live?" followers":" net growth"}/><Stat label="Accounts reached" value={profile.reach} trend={live?undefined:"+12.4%"} note={live?" last 14 days":` · ${channel}`} tone="aqua"/>{!live&&<Stat label="Impressions" value={profile.impressions} trend="+14.1%" note=" content displayed" tone="coral"/>}<Stat label="Engagement rate" value={profile.engagement} trend={live?undefined:"+0.9 pts"} note={live?" across analysed posts":" versus prior period"} tone="gold"/>{!live&&<Stat label="Link clicks" value={profile.clicks} trend="+18%" note=" tracked destinations" tone="aqua"/>}{live?<Stat label="Video views" value={profile.views} note=" reported by the network" tone="coral"/>:<Stat label="Video views" value={profile.views} trend="+22%" note=" three seconds or more" tone="coral"/>}</section>
    {!live && <section className="suite-analytics-snapshot" aria-label="Additional analytics"><article><Eye size={18} aria-hidden="true"/><span>Profile visits<strong>36.4K</strong><small>+16% from last period</small></span></article><article><UserPlus size={18} aria-hidden="true"/><span>New followers<strong>5,248</strong><small>4.8% audience growth</small></span></article><article><Activity size={18} aria-hidden="true"/><span>Average watch time<strong>12.8s</strong><small>+2.4 seconds</small></span></article><article><MousePointerClick size={18} aria-hidden="true"/><span>Replies &amp; DM starts<strong>1,934</strong><small>+11% customer intent</small></span></article></section>}
    <section className="suite-dashboard-grid suite-dashboard-grid--analytics"><article className="suite-panel suite-panel--wide"><header><div><span>Reach and engagement</span><h2>Strong attention, sustained.</h2></div><span className="suite-chip">{channel} · {period}</span></header><div className="suite-chart-wrap"><MiniLine values={profile.activity} compare label={`${channel} reach and engagement over ${period}`}/><div className="suite-axis"><span>Start</span><span>Week 2</span><span>Week 3</span><span>Today</span></div></div><div className="suite-legend"><span><i/>Reach</span><span><i/>Previous period</span></div></article><aside className="suite-panel suite-breakdown"><header><div><span>Content mix</span><h2>What earned attention.</h2></div></header>{[['Short video','46%',78],['Carousels','31%',58],['Stories','15%',35],['Single images','8%',21]].map(([label,value,width])=><div className="suite-progress" key={label}><span><strong>{label}</strong><b>{value}</b></span><i><b style={{width:`${width}%`}}/></i></div>)}</aside></section>
    {!live && <section className="suite-analytics-detail-grid"><article className="suite-panel suite-breakdown"><header><div><span>Audience quality</span><h2>People who come back.</h2></div></header>{[['Returning viewers','61%',82],['Engaged followers','44%',64],['Reached non-followers','72%',91],['Profile action rate','9.6%',48]].map(([label,value,width])=><div className="suite-progress" key={label}><span><strong>{label}</strong><b>{value}</b></span><i><b style={{width:`${width}%`}}/></i></div>)}</article><article className="suite-panel suite-insight-list"><header><div><span>Audience context</span><h2>Who is paying attention.</h2></div></header>{[[Globe2,'Top markets','Bahrain 46% · Saudi Arabia 21%'],[Users,'Languages','Arabic 54% · English 43%'],[Clock3,'Peak activity','Thu–Sat · 7:30–9:00 PM'],[Target,'Highest intent','Profile visits after saved posts']].map(([Icon,label,value])=><div key={label}><i><Icon size={16} aria-hidden="true"/></i><span><small>{label}</small><strong>{value}</strong></span></div>)}</article><article className="suite-panel suite-insight-list"><header><div><span>Publishing output</span><h2>Work shipped this month.</h2></div></header>{[[CheckCircle2,'Published','42 posts'],[CalendarDays,'Scheduled','12 posts'],[ShieldCheck,'First-pass approval','94%'],[TrendingUp,'Best-performing day','Friday']].map(([Icon,label,value])=><div key={label}><i><Icon size={16} aria-hidden="true"/></i><span><small>{label}</small><strong>{value}</strong></span></div>)}</article></section>}
    {!live && <section className="suite-panel suite-analytics-table"><header><div><span>Channel comparison</span><h2>See where each channel earns its place.</h2></div><span className="suite-chip">{channelRows.length} {channelRows.length===1?'channel':'channels'}</span></header><div className="suite-analytics-table-scroll"><div className="suite-analytics-table-row suite-analytics-table-head"><span>Channel</span><span>Audience</span><span>Reach</span><span>Engagement</span><span>Actions</span><span>Growth</span></div>{channelRows.map(row=><div className="suite-analytics-table-row" key={row[0]}>{row.map((cell,index)=><span key={cell}>{index===0?<strong>{cell}</strong>:cell}</span>)}</div>)}</div></section>}
    {!live && <section className="suite-card-grid"><article className="suite-panel suite-best-post"><div className="suite-post-art"><span>MARINA<br/>SOCIAL CLUB</span><strong>Sunday<br/>slows down.</strong></div><div><span>Top content</span><h2>The post people kept.</h2><p>Carousel · Instagram · 28 August</p><div><strong>42.8K<small>reach</small></strong><strong>8.4%<small>engagement</small></strong><strong>814<small>saves</small></strong></div><button type="button" onClick={()=>notify('Top content details opened.')}>Open performance <ArrowRight size={15}/></button></div></article><article className="suite-panel suite-action-list"><header><div><span>Next actions</span><h2>Three useful moves.</h2></div></header>{['Reuse the Sunday carousel structure','Publish Friday between 7:30–8:30 PM','Turn saved comments into next week’s FAQ'].map((item,index)=><button type="button" key={item} onClick={()=>notify(`Action ${index+1} added to your plan.`)}><i>{index+1}</i><span>{item}<small>Based on visible performance signals</small></span><Plus size={16}/></button>)}</article></section>}
    <Toast text={toast}/>
  </main>;
}

const heat = [[28,34,42,46,58,66,53],[45,49,55,61,72,88,74],[54,58,63,70,84,92,86],[31,38,45,52,68,76,64]];
export function BestTimeExperience() {
  const [channel,setChannel]=useState('Instagram');
  const [selected,setSelected]=useState(0);
  const [toast,notify]=useToast();
  const slots=[['Friday','8:00 PM','92% audience activity'],['Saturday','7:30 PM','88% audience activity'],['Thursday','8:30 PM','84% audience activity']];
  return <main className="suite-page">
    <div className="suite-preview"><span>Best time · Guidance from sample activity</span><span><Clock3 size={14}/>Local time · Bahrain</span></div>
    <PageIntro eyebrow="Marina Social Club / Best time" title={<>Meet your audience<br/><em>when they are ready.</em></>} copy="Use real audience activity as guidance, then choose the time that fits the message and the market." actions={<button className="suite-primary" type="button" onClick={()=>notify('The selected time was sent to Publisher.')}><CalendarDays size={16}/>Schedule a post</button>}><div className="suite-channel-tabs" role="group" aria-label="Channel">{platforms.slice(1).map(item=><button type="button" key={item} aria-pressed={channel===item} onClick={()=>setChannel(item)}>{item}</button>)}</div></PageIntro>
    <section className="suite-slot-grid" aria-label="Recommended publishing times">{slots.map((slot,index)=><button type="button" key={slot.join('')} aria-pressed={selected===index} onClick={()=>setSelected(index)}><span>{index===0?'Best match':`Option ${index+1}`}</span><strong>{slot[0]} <em>{slot[1]}</em></strong><small>{slot[2]}</small><i><Check size={15}/></i></button>)}</section>
    <section className="suite-dashboard-grid"><article className="suite-panel suite-panel--wide suite-heatmap"><header><div><span>Weekly audience activity</span><h2>See the rhythm, not just a score.</h2></div><span className="suite-chip">{channel}</span></header><div className="suite-heat-grid"><span/><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>{['Morning','Noon','Evening','Night'].flatMap((label,row)=>[<strong key={label}>{label}</strong>,...heat[row].map((value,col)=><button type="button" key={`${row}-${col}`} title={`${label}: ${value}% audience activity`} aria-label={`${['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'][col]} ${label}, ${value}% activity`} style={{'--heat':value/100}} onClick={()=>notify(`${label} activity is ${value}% on ${['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'][col]}.`)}/> )])}</div><footer><span>Quieter</span><i/><i/><i/><i/><i/><span>Busier</span></footer></article><aside className="suite-panel suite-focus"><span>Your best window</span><h2>{slots[selected][0]}<br/>{slots[selected][1]}</h2><p>{slots[selected][2]}. This is guidance—not a guarantee—based on the activity pattern visible for {channel}.</p><button type="button" onClick={()=>notify(`${slots[selected][0]} at ${slots[selected][1]} is ready in Publisher.`)}>Use this time <ArrowRight size={16}/></button><small><ShieldCheck size={13}/>Updates as connected data becomes available</small></aside></section>
    <Toast text={toast}/>
  </main>;
}

const crisisSampleSignals=[
  {id:'delivery',title:'Delivery timing',meta:'3 comments · Within normal range',warn:false},
  {id:'availability',title:'Product availability',meta:'2 mentions · Within normal range',warn:false},
  {id:'service',title:'Service experience',meta:'1 message · Human review recommended',warn:true},
];
const crisisSampleVolume=[19,17,22,28,24,31,36,34,48,54,51,58,62,57];
const crisisLevelLabel={calm:'Normal',watch:'Watch',alert:'Alert'};

export function CrisisExperience({ live=null, clientName='', onRescan=null, onOpenInbox=null, onConnectAccounts=null } = {}) {
  const [scanning,setScanning]=useState(false);
  const [toast,notify]=useToast();
  // Monitoring reads comments and DMs. Nothing classifies tone beyond the negative
  // keyword pass, so the positive/neutral split is hidden on live data instead of guessed.
  const run=(handler,fallback)=>{if(!handler){notify(fallback);return;}Promise.resolve(handler()).then(message=>notify(typeof message==='string'&&message?message:fallback)).catch(()=>notify('That did not complete. Try again.'));};
  const rescan=()=>{
    if(onRescan){setScanning(true);Promise.resolve(onRescan()).then(message=>{setScanning(false);notify(typeof message==='string'&&message?message:'Scan complete.');}).catch(()=>{setScanning(false);notify('The scan could not finish.');});return;}
    setScanning(true);window.setTimeout(()=>{setScanning(false);notify('Scan complete. No unusual spike detected.');},900);
  };
  const busy=scanning||(live?live.scanning===true:false);
  const connected=live?live.connected!==false:true;
  const signals=live?(live.signals||[]):crisisSampleSignals;
  const volume=live?live.volume:crisisSampleVolume;
  const showVolume=Array.isArray(volume)&&volume.length>1;
  const showSignals=signals.length>0;
  const level=live?(live.level||'calm'):'calm';
  return <main className="suite-page">
    {!live&&<div className="suite-preview"><span>Crisis Radar · Sample monitoring · No automatic replies</span><span className="suite-chip suite-chip--good"><ShieldCheck size={13}/>Normal</span></div>}
    <PageIntro eyebrow={live?`${clientName||'Workspace'} / Crisis Radar`:"Marina Social Club / Crisis Radar"} title={<>Know early.<br/><em>Respond with care.</em></>} copy="Watch public comments, mentions and messages for sudden changes in tone—then bring a human in before anything is sent." actions={<button type="button" className="suite-secondary" onClick={rescan} disabled={busy}><RefreshCw className={busy?'suite-spin':''} size={16}/>{busy?'Scanning…':'Rescan now'}</button>}/>
    <section className="suite-health"><div className="suite-health-orbit">{level==='alert'?<AlertTriangle size={34}/>:<ShieldCheck size={34}/>}<span>{live?(crisisLevelLabel[level]||'Normal'):'Normal'}</span></div><div><span>Current signal</span><h2>{live?(live.title||'No unusual negativity spike.'):'No unusual negativity spike.'}</h2><p>{live?(live.summary||''):'Conversation volume is 8% above the normal Friday range, while sentiment remains steady. Two messages need a human reply.'}</p>{live?(connected&&typeof live.scanned==='number'?<div><span><i className="warn"/>Negative {live.rate}%</span><span><i/>{live.scanned.toLocaleString()} messages read</span>{typeof live.negative24==='number'&&<span><i className="warn"/>{live.negative24} in the last 24 hours</span>}</div>:null):<div><span><i className="good"/>Positive 71%</span><span><i/>Neutral 21%</span><span><i className="warn"/>Negative 8%</span></div>}</div>{live?(connected?(signals.length>0?<button type="button" onClick={()=>run(onOpenInbox,'Inbox opened.')}>Review {signals.length} conversation{signals.length===1?'':'s'} <ArrowRight size={16}/></button>:null):<button type="button" onClick={()=>run(onConnectAccounts,'Account settings opened.')}>Connect accounts <ArrowRight size={16}/></button>):<button type="button" onClick={()=>notify('The two priority conversations are ready in Inbox.')}>Review 2 conversations <ArrowRight size={16}/></button>}</section>
    {(showVolume||showSignals)&&<section className="suite-dashboard-grid" style={showVolume&&showSignals?undefined:{gridTemplateColumns:'minmax(0,1fr)'}}>{showVolume&&<article className="suite-panel suite-panel--wide"><header><div><span>Conversation signal</span><h2>{live?'Conversation volume.':'Volume rose. Sentiment held.'}</h2></div><span className="suite-chip">Last 24 hours</span></header><div className="suite-chart-wrap"><MiniLine values={volume} label="Conversation volume in the last 24 hours"/><div className="suite-axis"><span>12 AM</span><span>6 AM</span><span>12 PM</span><span>Now</span></div></div></article>}{showSignals&&<aside className="suite-panel suite-action-list"><header><div><span>Watch list</span><h2>Signals worth a look.</h2></div></header>{signals.map(item=><button type="button" key={item.id} onClick={()=>live?run(onOpenInbox?()=>onOpenInbox(item):null,'Inbox opened.'):notify(`${item.title} conversations opened.`)}><i className={item.warn?'warn':''}><MessageCircleWarning size={15}/></i><span>{item.title}<small>{item.meta}</small></span><ArrowRight size={15}/></button>)}</aside>}</section>}
    <section className="suite-note"><AlertTriangle size={18}/><div><strong>Monitoring supports judgment—it does not replace it.</strong><span>Tawaslo never hides, deletes or answers a sensitive conversation without your team’s decision.</span></div></section>
    <Toast text={toast}/>
  </main>;
}

const impactSampleStats=[
  {label:'Tracked actions',value:'1,284',trend:'+18%',note:' customer outcomes'},
  {label:'Attributed value',value:'BHD 8,420',trend:'+9%',note:' from connected journeys',tone:'aqua'},
  {label:'Return on content',value:'4.6×',trend:'+0.7×',note:' value per BHD spent',tone:'coral'},
  {label:'Assisted journeys',value:'38%',note:' used more than one touchpoint',tone:'gold'},
];
const impactSampleBreakdown={eyebrow:'Value by source',title:'What assisted the outcome.',rows:[{label:'Instagram',value:'42%',width:82},{label:'Link in bio',value:'27%',width:61},{label:'Google & reviews',value:'19%',width:47},{label:'Direct',value:'12%',width:31}]};

export function ImpactExperience({ live=null, clientName='', onPeriodChange=null, onExport=null } = {}) {
  const [period,setPeriod]=useState('30 days');
  const [toast,notify]=useToast();
  // Nothing in the workspace links a customer outcome back through a chain of
  // touchpoints, so the journey funnel is hidden on live data rather than modelled.
  const run=(handler,fallback)=>{if(!handler){notify(fallback);return;}Promise.resolve(handler()).then(message=>notify(typeof message==='string'&&message?message:fallback)).catch(()=>notify('That did not complete. Try again.'));};
  const changePeriod=value=>{setPeriod(value);if(onPeriodChange)onPeriodChange(value);};
  const stats=live?(live.stats||[]):impactSampleStats;
  const breakdown=live?live.breakdown:impactSampleBreakdown;
  return <main className="suite-page">
    {!live&&<div className="suite-preview"><span>Impact · Sample attribution · Currency BHD</span><span><Target size={14}/>Connected touchpoints</span></div>}
    <PageIntro eyebrow={live?`${clientName||'Workspace'} / Impact`:"Marina Social Club / Impact"} title={<>From attention<br/><em>to business value.</em></>} copy="Understand which content and links helped a customer buy, book, visit or enquire—without pretending every result has one cause." actions={<button type="button" className="suite-primary" onClick={()=>run(onExport,'Impact report prepared.')}><Download size={16}/>Export impact</button>}><PeriodSwitch value={period} onChange={changePeriod}/></PageIntro>
    {stats.length>0&&<section className="suite-stat-grid">{stats.map(stat=><Stat key={stat.label} label={stat.label} value={stat.value} trend={stat.trend} note={stat.note} tone={stat.tone||'violet'}/>)}</section>}
      {(!live||(breakdown&&breakdown.rows&&breakdown.rows.length>0))&&<section className="suite-dashboard-grid" style={live?{gridTemplateColumns:'minmax(0,1fr)'}:undefined}>{!live&&<article className="suite-panel suite-panel--wide suite-journey"><header><div><span>Customer journey</span><h2>One result. Several useful moments.</h2></div><span className="suite-chip">Most common path</span></header><div className="suite-journey-line">{[[Share2,'Discovered','8,420'],[MousePointerClick,'Clicked','2,184'],[Users,'Returned','1,284'],[CheckCircle2,'Completed','426']].map(([Icon,label,value],index)=><div key={label}><i><Icon size={18}/></i><strong>{value}</strong><span>{label}</span>{index<3&&<b><ArrowRight size={14}/></b>}</div>)}</div><p>Completed can mean a purchase, booking, lead, sign-up or another goal chosen for the client.</p></article>}{breakdown&&breakdown.rows&&breakdown.rows.length>0&&<aside className="suite-panel suite-breakdown"><header><div><span>{breakdown.eyebrow}</span><h2>{breakdown.title}</h2></div></header>{breakdown.rows.map(row=><div className="suite-progress" key={row.label}><span><strong>{row.label}</strong><b>{row.value}</b></span><i><b style={{width:`${row.width}%`}}/></i></div>)}</aside>}</section>}
    <section className="suite-note suite-note--info"><ShieldCheck size={18}/><div><strong>Transparent attribution</strong><span>Every figure shows its source and confidence. Unknown journeys stay unknown instead of being forced into a channel.</span></div></section>
    <Toast text={toast}/>
  </main>;
}

const reportRows=[
  ['Monthly performance','Marina Social Club','1 Sep 2026','Ready'],
  ['Campaign wrap-up','Made for Sharing','29 Aug 2026','Ready'],
  ['Customer & loyalty','Marina Social Club','26 Aug 2026','Draft'],
  ['Executive snapshot','Marina Social Club','1 Aug 2026','Sent'],
];
const reportSampleTemplates=[
  {id:'performance',title:'Performance report',copy:'Reach, engagement and content results'},
  {id:'business',title:'Business report',copy:'Customer actions and attributed value'},
  {id:'campaign',title:'Campaign report',copy:'One campaign from brief to outcome'},
];
const reportTemplateIcons={performance:BarChart3,business:TrendingUp,campaign:Target};

export function ReportsExperience({ live=null, clientName='', onCreateReport=null, onUseTemplate=null, onOpenReport=null, onToggleSchedule=null } = {}) {
  const [query,setQuery]=useState('');
  const [toast,notify]=useToast();
  // Reports are generated on demand; the workspace keeps no saved-report record, so the
  // library only appears when a caller supplies real rows.
  const run=(handler,fallback)=>{if(!handler){notify(fallback);return;}Promise.resolve(handler()).then(message=>notify(typeof message==='string'&&message?message:fallback)).catch(()=>notify('That did not complete. Try again.'));};
  const templates=live?(live.templates||[]):reportSampleTemplates;
  const library=live?live.library:{rows:reportRows};
  const rows=library&&Array.isArray(library.rows)?library.rows:[];
  const schedule=live?live.schedule:null;
  const visible=rows.filter(row=>row.join(' ').toLowerCase().includes(query.toLowerCase()));
  return <main className="suite-page">
    {!live&&<div className="suite-preview"><span>Reports · Sample workspace</span><span><FileBarChart size={14}/>4 report types</span></div>}
    <PageIntro eyebrow={live?`${clientName||'Workspace'} / Reporting`:"Agency reporting"} title={<>A report clients<br/><em>will actually read.</em></>} copy="Build clear, branded reports around the questions that matter—then share a live link or a polished PDF." actions={<button type="button" className="suite-primary" onClick={()=>run(onCreateReport,'A new report draft was created.')}><Plus size={16}/>Create report</button>}/>
    {templates.length>0&&<section className="suite-template-grid">{templates.map(item=>{const Icon=reportTemplateIcons[item.id]||FileBarChart;return <button type="button" key={item.id} onClick={()=>live?run(onUseTemplate?()=>onUseTemplate(item.id):null,`${item.title} prepared.`):notify(`${item.title} draft created.`)}><i><Icon size={21}/></i><strong>{item.title}</strong><span>{item.copy}</span><b>Use template <ArrowRight size={14}/></b></button>;})}</section>}
    {rows.length>0&&<section className="suite-panel suite-table-panel"><header><div><span>Report library</span><h2>Recent reports.</h2></div><label className="suite-search"><Search size={16}/><input aria-label="Search reports" placeholder="Search reports" value={query} onChange={event=>setQuery(event.target.value)}/></label></header><div className="suite-data-table"><div className="suite-row suite-row--head"><span>Report</span><span>For</span><span>Updated</span><span>Status</span><span/></div>{visible.map((row,rowIndex)=><div className="suite-row" key={rowIndex}>{row.map((cell,index)=><span key={index}>{index===0?<strong>{cell}</strong>:index===3?<i className={`suite-status suite-status--${String(cell).toLowerCase()}`}>{cell}</i>:cell}</span>)}<button type="button" aria-label={`Open ${row[0]}`} onClick={()=>live?run(onOpenReport?()=>onOpenReport(row):null,`${row[0]} opened.`):notify(`${row[0]} opened.`)}><ArrowRight size={16}/></button></div>)}</div></section>}
    {(!live||schedule)&&<section className="suite-note suite-note--info"><CalendarDays size={18}/><div><strong>Monthly delivery can be automated.</strong><span>{live?(schedule.enabled?`This report is sent monthly${schedule.email?` to ${schedule.email}`:''}.`:'Monthly delivery is off for this client.'):'Choose the reporting day, reviewers and recipients. Your team still approves every report before it is sent.'}</span></div><button type="button" onClick={()=>live?run(onToggleSchedule?()=>onToggleSchedule(!schedule.enabled):null,'Monthly delivery updated.'):notify('Report schedules opened.')}>{live?(schedule.enabled?'Turn off monthly delivery':'Turn on monthly delivery'):'Manage schedules'}</button></section>}
    <Toast text={toast}/>
  </main>;
}

export function LinksExperience({ liveLinks = null, clientName = '', onCreate = null } = {}) {
  const [query,setQuery]=useState('');
  const [creating,setCreating]=useState(false);
  const [links,setLinks]=useState(liveLinks||[['Weekend collection','tawas.lo/weekend','2,841','Instagram bio'],['Book a consultation','tawas.lo/hello','1,306','LinkedIn'],['New arrivals','tawas.lo/new','984','Campaign'],['Customer feedback','tawas.lo/review','426','Receipt QR']]);
  useEffect(()=>{if(liveLinks)setLinks(liveLinks);},[liveLinks]);
  const totalClicks=liveLinks?liveLinks.reduce((sum,row)=>sum+(Number(String(row[2]).replace(/,/g,''))||0),0):0;
  const topLink=liveLinks&&liveLinks.length?[...liveLinks].sort((a,b)=>(Number(String(b[2]).replace(/,/g,''))||0)-(Number(String(a[2]).replace(/,/g,''))||0))[0]:null;
  const [draft,setDraft]=useState('');
  const [toast,notify]=useToast();
  const add=event=>{event.preventDefault();if(!draft.trim())return;if(onCreate){onCreate(draft.trim()).then(ok=>notify(ok?'Short link created and ready to copy.':'Could not create that link.')).catch(()=>notify('Could not create that link.'));}else{setLinks(current=>[[draft.trim(),`tawas.lo/${draft.trim().toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')||'link'}`,'0','New'],...current]);notify('Short link created and ready to copy.');}setDraft('');setCreating(false);};
  const visible=useMemo(()=>links.filter(row=>row.join(' ').toLowerCase().includes(query.toLowerCase())),[links,query]);
  return <main className="suite-page">
    {!liveLinks&&<div className="suite-preview"><span>Tracked links · Sample click data</span><span><Link2 size={14}/>All links use HTTPS</span></div>}
    <PageIntro eyebrow={liveLinks ? `${clientName || 'Workspace'} / Links` : "Marina Social Club / Links"} title={<>Short links.<br/><em>Clear journeys.</em></>} copy="Create branded links for posts, bios, QR codes and campaigns—then see what people chose to open." actions={<button type="button" className="suite-primary" onClick={()=>setCreating(true)}><Plus size={16}/>Create link</button>}/>
    <section className="suite-stat-grid">{liveLinks?<><Stat label="Total clicks" value={totalClicks.toLocaleString()} note=" across every link"/><Stat label="Links" value={String(liveLinks.length)} note=" created in this workspace" tone="aqua"/>{topLink&&<Stat label="Top destination" value={topLink[0]} note={` ${topLink[2]} clicks`} tone="coral"/>}</>:<><Stat label="Total clicks" value="5,557" trend="+14%" note=" this month"/><Stat label="Unique visitors" value="4,108" trend="+11%" note=" across all links" tone="aqua"/><Stat label="Top destination" value="Weekend" note=" collection page" tone="coral"/><Stat label="Conversion rate" value="12.6%" trend="+1.8 pts" note=" on tracked goals" tone="gold"/></>}</section>
    <section className="suite-panel suite-table-panel"><header><div><span>Link library</span><h2>Every destination, together.</h2></div><label className="suite-search"><Search size={16}/><input aria-label="Search links" placeholder="Search links" value={query} onChange={event=>setQuery(event.target.value)}/></label></header><div className="suite-data-table"><div className="suite-row suite-row--head"><span>Name</span><span>Short link</span><span>Clicks</span><span>Used in</span><span/></div>{visible.map(row=><div className="suite-row" key={row[1]}><span><strong>{row[0]}</strong></span><span>{row[1]}</span><span>{row[2]}</span><span>{row[3]}</span><span className="suite-inline-actions"><button type="button" aria-label={`Copy ${row[0]}`} onClick={()=>notify(`${row[1]} copied.`)}><Copy size={15}/></button><button type="button" aria-label={`Open ${row[0]}`} onClick={()=>notify(`${row[0]} analytics opened.`)}><ExternalLink size={15}/></button></span></div>)}</div></section>
    {creating&&createPortal(<div className="suite-modal-backdrop" role="presentation" onMouseDown={event=>event.target===event.currentTarget&&setCreating(false)}><form className="suite-modal" onSubmit={add} role="dialog" aria-modal="true" aria-labelledby="suite-link-title"><button type="button" className="suite-modal-close" aria-label="Close" onClick={()=>setCreating(false)}><X size={18}/></button><span>New tracked link</span><h2 id="suite-link-title">Name the customer journey.</h2><p>The destination can be added in the next step. This preview creates a safe sample link.</p><label>Link name<input autoFocus value={draft} onChange={event=>setDraft(event.target.value)} placeholder="e.g. Autumn collection"/></label><footer><button type="button" onClick={()=>setCreating(false)}>Cancel</button><button type="submit" className="suite-primary"><Link2 size={15}/>Create link</button></footer></form></div>,document.body)}
    <Toast text={toast}/>
  </main>;
}
