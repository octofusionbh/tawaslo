import { useState, useEffect, createContext, useContext } from "react";
import { supabase, signIn, signUp, signOut, createProfile, resetPassword } from './supabase';
import {
  LayoutDashboard, Calendar, BarChart2, Megaphone, Users,
  Settings, Plus, Search, Bell, Globe, Image, Clock, Send,
  Heart, Bookmark, TrendingUp, Eye, CheckCircle, Circle,
  Download, ArrowUpRight, ArrowDownRight, Inbox, Star,
  Target, PieChart, Activity, UserPlus, Building2, FileText,
  CreditCard, LogOut, ChevronRight, ChevronDown,
  Radio, Edit3, XCircle, Link, Shield, DollarSign, Sparkles,
  ArrowLeft, Lock, Mail, User, MessageCircle, Sun, Moon,
  Languages, Wand2, MoreHorizontal,
} from "lucide-react";
import { FaInstagram, FaFacebook, FaTwitter, FaLinkedin, FaTiktok, FaYoutube } from 'react-icons/fa';
const PlatformIcons = {  ig: () => <FaInstagram style={{color:"#E1306C", fontSize:14}}/>,
  fb: () => <FaFacebook  style={{color:"#1877F2", fontSize:14}}/>,
  tw: () => <FaTwitter   style={{color:"#1DA1F2", fontSize:14}}/>,
  li: () => <FaLinkedin  style={{color:"#0A66C2", fontSize:14}}/>,
  tt: () => <FaTiktok    style={{color:"#FF0050", fontSize:14}}/>,
  yt: () => <FaYoutube   style={{color:"#FF0000", fontSize:14}}/>,
};

const DARK = {
  bg:"#07090F", surface:"#0C1120", card:"#101828", card2:"#141E2E",
  border:"#1C2D45", text:"#E8EFF8", text2:"#7A8BA8", text3:"#3D5068",
  accent:"#4F6EF7", accent2:"#7C3AED",
  accentSoft:"rgba(79,110,247,0.11)", accent2Soft:"rgba(124,58,237,0.09)",
  success:"#10B981", successSoft:"rgba(16,185,129,0.1)",
  warning:"#F59E0B", warningSoft:"rgba(245,158,11,0.1)",
  danger:"#EF4444", dangerSoft:"rgba(239,68,68,0.1)",
  info:"#06B6D4", infoSoft:"rgba(6,182,212,0.1)",
  orange:"#F97316", orangeSoft:"rgba(249,115,22,0.1)",
  gradient:"linear-gradient(135deg,#4F6EF7,#7C3AED)",
  gradientSoft:"linear-gradient(135deg,rgba(79,110,247,0.1),rgba(124,58,237,0.08))",
  shadow:"0 4px 20px rgba(0,0,0,0.5)",
  insta:"#E1306C", fb:"#1877F2", tw:"#1DA1F2", li:"#0A66C2", tt:"#FF0050", yt:"#FF0000",
};

const LIGHT = {
  bg:"#EEF2FC", surface:"#FFFFFF", card:"#FFFFFF", card2:"#F5F8FF",
  border:"#DDE5F5", text:"#0D1526", text2:"#4A5C7A", text3:"#94A3B8",
  accent:"#4F6EF7", accent2:"#7C3AED",
  accentSoft:"rgba(79,110,247,0.07)", accent2Soft:"rgba(124,58,237,0.06)",
  success:"#059669", successSoft:"rgba(5,150,105,0.07)",
  warning:"#D97706", warningSoft:"rgba(217,119,6,0.07)",
  danger:"#DC2626", dangerSoft:"rgba(220,38,38,0.07)",
  info:"#0891B2", infoSoft:"rgba(8,145,178,0.07)",
  orange:"#EA6B0A", orangeSoft:"rgba(234,107,10,0.07)",
  gradient:"linear-gradient(135deg,#4F6EF7,#7C3AED)",
  gradientSoft:"linear-gradient(135deg,rgba(79,110,247,0.06),rgba(124,58,237,0.05))",
  shadow:"0 4px 20px rgba(79,110,247,0.07)",
  insta:"#E1306C", fb:"#1877F2", tw:"#1DA1F2", li:"#0A66C2", tt:"#FF0050", yt:"#FF0000",
};

const PLATFORMS = [
  {id:"ig",name:"Instagram",color:"insta"},
  {id:"fb",name:"Facebook", color:"fb"  },
  {id:"tw",name:"Twitter/X",color:"tw"  },
  {id:"li",name:"LinkedIn", color:"li"  },
  {id:"tt",name:"TikTok",   color:"tt"  },
  {id:"yt",name:"YouTube",  color:"yt"  },
];

const CLIENTS = [
  { id:"octo",   name:"Octo Fusion",       plan:"Internal", free:true,  status:"active",   accounts:8,  posts:142, reach:"380K", health:99, spend:0   },
  { id:"bloom",  name:"Bloom Agency",       plan:"Pro",      free:false, status:"active",   accounts:12, posts:284, reach:"1.2M", health:96, spend:99  },
  { id:"gulf",   name:"Gulf Motors Group",  plan:"Corporate",free:false, status:"active",   accounts:28, posts:891, reach:"4.8M", health:88, spend:199 },
  { id:"zara",   name:"Zara Bahrain",       plan:"Growth",   free:false, status:"active",   accounts:6,  posts:142, reach:"380K", health:72, spend:69  },
  { id:"nbb",    name:"NBB Bank",           plan:"Corporate",free:false, status:"inactive", accounts:20, posts:0,   reach:"—",    health:0,  spend:199 },
  { id:"ithmaar",name:"Ithmaar Properties", plan:"Growth",   free:false, status:"active",   accounts:8,  posts:98,  reach:"240K", health:64, spend:69  },
];

const AppCtx = createContext(null);
const useApp = () => useContext(AppCtx);

function useTheme() {
  const { dark } = useApp();
  return dark ? DARK : LIGHT;
}

function Badge({ color, children, size="sm" }) {
  const th = useTheme();
  const C  = th[color] || th.accent;
  const CS = th[color+"Soft"] || th.accentSoft;
  return (
    <span style={{
      padding: size==="xs"?"1px 6px":"2px 9px",
      borderRadius:20, fontSize:size==="xs"?9:10, fontWeight:700,
      background:CS, color:C,
      display:"inline-flex", alignItems:"center", gap:3,
    }}>{children}</span>
  );
}

function Toggle({ on, onColor="accent", onClick }) {
  const th = useTheme();
  return (
    <div onClick={onClick} style={{
      width:36, height:18, borderRadius:9,
      background:on?(th[onColor]||th.accent):th.border,
      cursor:"pointer", position:"relative", transition:"all 0.3s", flexShrink:0,
    }}>
      <div style={{
        position:"absolute", top:2, left:on?18:2,
        width:14, height:14, borderRadius:"50%",
        background:"#fff", transition:"left 0.3s",
      }}/>
    </div>
  );
}

function StatCard({ label, value, change, up, Icon:I, color="accent" }) {
  const th = useTheme();
  return (
    <div style={{
      background:th.card, borderRadius:14, border:`1px solid ${th.border}`,
      padding:18, position:"relative", overflow:"hidden",
    }}>
      <div style={{position:"absolute",top:-15,right:-15,width:55,height:55,borderRadius:"50%",background:th[color+"Soft"]||th.accentSoft}}/>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:12}}>
        <div style={{width:32,height:32,borderRadius:9,background:th[color+"Soft"]||th.accentSoft,display:"flex",alignItems:"center",justifyContent:"center"}}>
          <I size={15} color={th[color]||th.accent}/>
        </div>
        {change&&(
          <div style={{display:"flex",alignItems:"center",gap:3,fontSize:10,fontWeight:700,color:up?th.success:th.danger,background:up?th.successSoft:th.dangerSoft,padding:"2px 7px",borderRadius:6}}>
            {up?<ArrowUpRight size={10}/>:<ArrowDownRight size={10}/>}{change}
          </div>
        )}
      </div>
      <div style={{fontSize:24,fontWeight:900,letterSpacing:-0.8,marginBottom:3}}>{value}</div>
      <div style={{fontSize:11,color:th.text2}}>{label}</div>
    </div>
  );
}

function Sidebar() {
  const { dark, setDark, lang, setLang, mode, setMode, page, setPage,
          selClient, setSelClient, setIsAuthed } = useApp();
  const th = useTheme();
  const isAR = lang==="ar";

  const OWNER_NAV = [
    {key:"overview", Icon:LayoutDashboard, label:"Overview"    },
    {key:"clients",  Icon:Building2,       label:"All Clients" },
    {key:"revenue",  Icon:DollarSign,      label:"Revenue"     },
    {key:"apiusage", Icon:Activity,        label:"API & Usage" },
    {key:"team",     Icon:Users,           label:"Team"        },
    {key:"settings", Icon:Settings,        label:"Settings"    },
  ];

  const AGENCY_NAV = [
    {section:"Manage", items:[
      {key:"dashboard", Icon:LayoutDashboard, label:"Dashboard", badge:null},
      {key:"publisher", Icon:Calendar,        label:"Publisher", badge:null},
      {key:"streams",   Icon:Radio,           label:"Streams",   badge:null},
      {key:"inbox",     Icon:Inbox,           label:"Inbox",     badge:7   },
      {key:"listening", Icon:Activity,        label:"Listening", badge:null},
    ]},
    {section:"Create", items:[
      {key:"campaigns", Icon:Megaphone,       label:"Campaigns", badge:null},
      {key:"aistudio",  Icon:Wand2,           label:"AI Studio", badge:null},
      {key:"media",     Icon:Image,           label:"Media",     badge:null},
    ]},
    {section:"Analyse", items:[
      {key:"analytics", Icon:BarChart2,       label:"Analytics", badge:null},
      {key:"reports",   Icon:PieChart,        label:"Reports",   badge:null},
    ]},
    {section:"Account", items:[
      {key:"social",     Icon:Link,           label:"Social Accounts", badge:null},
      {key:"agencyteam", Icon:Users,          label:"Team",      badge:null},
      {key:"billing",    Icon:CreditCard,     label:"Billing",   badge:null},
      {key:"agencysets", Icon:Settings,       label:"Settings",  badge:null},
    ]},
  ];

  const navItem = (key, Icon, label, badge, isActive, onClick) => (
    <div key={key} onClick={onClick} style={{
      display:"flex", alignItems:"center", justifyContent:"space-between",
      padding:"8px 10px", borderRadius:9, marginBottom:1, cursor:"pointer",
      background:isActive?th.accentSoft:"transparent",
      color:isActive?th.accent:th.text2,
      fontWeight:isActive?600:400, fontSize:12.5,
      borderLeft:!isAR&&isActive?`3px solid ${th.accent}`:"3px solid transparent",
      borderRight:isAR&&isActive?`3px solid ${th.accent}`:"3px solid transparent",
      transition:"all 0.15s",
    }}>
      <div style={{display:"flex",alignItems:"center",gap:9}}>
        <Icon size={15} strokeWidth={isActive?2.2:1.7}/>{label}
      </div>
      {badge&&<span style={{background:th.danger,color:"#fff",borderRadius:10,fontSize:9,fontWeight:700,padding:"1px 6px"}}>{badge}</span>}
    </div>
  );

  return (
    <aside style={{
      width:230, flexShrink:0, background:th.surface,
      borderRight:!isAR?`1px solid ${th.border}`:"none",
      borderLeft:isAR?`1px solid ${th.border}`:"none",
      display:"flex", flexDirection:"column",
      boxShadow:th.shadow, zIndex:30, overflow:"hidden",
    }}>
      <div style={{padding:"20px 18px 14px",display:"flex",alignItems:"center",gap:10}}>
        <img src="/logo.png" alt="Tawasalo" style={{width:38,height:38,borderRadius:11,objectFit:"contain",flexShrink:0}}/>
        <div>
          <div style={{fontWeight:900,fontSize:18,letterSpacing:-0.8,lineHeight:1}}>Tawasalo</div>
          <div style={{fontSize:9,color:th.text2,letterSpacing:0.4,marginTop:1,textTransform:"uppercase"}}>Social Intelligence</div>
        </div>
      </div>

      <div style={{padding:"0 14px 12px"}}>
        <div style={{background:th.card2,border:`1px solid ${th.border}`,borderRadius:10,padding:3,display:"flex",gap:2}}>
          {[{key:"owner",Icon:Shield,label:"Owner"},{key:"agency",Icon:Building2,label:"Agency"}].map(({key,Icon:I,label})=>(
            <button key={key} onClick={()=>{setMode(key);setPage(key==="owner"?"overview":"dashboard");}} style={{
              flex:1,padding:"7px 0",borderRadius:8,
              background:mode===key?th.gradient:"transparent",
              border:"none",color:mode===key?"#fff":th.text2,
              fontSize:11,fontWeight:700,cursor:"pointer",
              display:"flex",alignItems:"center",justifyContent:"center",gap:5,
              transition:"all 0.2s",
            }}>
              <I size={11}/>{label}
            </button>
          ))}
        </div>
      </div>

      {mode==="agency"&&(
        <div style={{padding:"0 14px 12px"}}>
          <div style={{background:th.card2,border:`1px solid ${th.border}`,borderRadius:9,padding:"8px 11px",cursor:"pointer",marginBottom:6}}>
            <div style={{fontSize:11,fontWeight:700}}>{selClient.name}</div>
            <div style={{fontSize:9,color:th.text2,marginTop:1}}>{selClient.plan} · {selClient.accounts} accounts</div>
          </div>
          {CLIENTS.map(c=>(
            <div key={c.id} onClick={()=>setSelClient(c)} style={{
              display:"flex",alignItems:"center",gap:7,
              padding:"6px 9px",borderRadius:7,cursor:"pointer",
              background:selClient.id===c.id?th.accentSoft:"transparent",
              color:selClient.id===c.id?th.accent:th.text2,
              fontSize:11,fontWeight:selClient.id===c.id?600:400,
              transition:"all 0.15s",
            }}>
              <div style={{width:6,height:6,borderRadius:"50%",background:c.status==="active"?th.success:th.text3,flexShrink:0}}/>
              <span style={{flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{c.name}</span>
              {c.free&&<span style={{fontSize:8,color:th.success,fontWeight:700}}>FREE</span>}
            </div>
          ))}
        </div>
      )}

      <div style={{padding:"0 14px 14px"}}>
        <button style={{
          width:"100%",padding:"9px 0",borderRadius:10,
          background:th.gradient,border:"none",
          color:"#fff",fontWeight:700,fontSize:12,cursor:"pointer",
          boxShadow:`0 4px 16px rgba(79,110,247,0.4)`,
          display:"flex",alignItems:"center",justifyContent:"center",gap:6,
        }}>
          <Plus size={14} strokeWidth={2.5}/>
          {mode==="owner"?"New Campaign":"Create Post"}
        </button>
      </div>

      <nav style={{flex:1,overflowY:"auto",padding:"0 10px"}}>
        {mode==="owner"?(
          <div>{OWNER_NAV.map(({key,Icon:I,label})=>navItem(key,I,label,null,page===key,()=>setPage(key)))}</div>
        ):(
          AGENCY_NAV.map((sec,si)=>(
            <div key={si} style={{marginBottom:16}}>
              <div style={{fontSize:9,color:th.text3,fontWeight:700,textTransform:"uppercase",letterSpacing:1.2,padding:"0 10px",marginBottom:4}}>{sec.section}</div>
              {sec.items.map(({key,Icon:I,label,badge})=>navItem(key,I,label,badge,page===key,()=>setPage(key)))}
            </div>
          ))
        )}
      </nav>

      <div style={{padding:"12px 14px",borderTop:`1px solid ${th.border}`}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
          <span style={{fontSize:11,color:th.text2,display:"flex",alignItems:"center",gap:5}}>
            {dark?<Moon size={11}/>:<Sun size={11}/>}{dark?"Dark":"Light"}
          </span>
          <Toggle on={dark} onColor="accent" onClick={()=>setDark(!dark)}/>
        </div>
        <div style={{display:"flex",gap:6}}>
          <button onClick={()=>setLang(l=>l==="en"?"ar":"en")} style={{flex:1,padding:"5px",borderRadius:7,background:"transparent",border:`1px solid ${th.border}`,color:th.text2,fontSize:10,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:4}}>
            <Languages size={10}/>{lang==="en"?"عربي":"EN"}
          </button>
          <button onClick={async()=>{ await signOut(); setIsAuthed(false); }} style={{flex:1,padding:"5px",borderRadius:7,background:th.dangerSoft,border:`1px solid ${th.danger}30`,color:th.danger,fontSize:10,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:4}}>
            <LogOut size={10}/>Out
          </button>
        </div>
      </div>
    </aside>
  );
}

function Topbar() {
  const { mode, page, selClient } = useApp();
  const th = useTheme();
  const titles = {
    overview:"Platform Overview", clients:"All Clients", revenue:"Revenue",
    apiusage:"API & Usage", team:"Team", settings:"Settings",
    dashboard:"Dashboard", publisher:"Publisher", streams:"Streams",
    inbox:"Inbox", listening:"Listening", campaigns:"Campaigns",
    aistudio:"AI Studio", media:"Media", analytics:"Analytics",
    reports:"Reports", agencyteam:"Team", billing:"Billing", agencysets:"Settings",
  };
  return (
    <header style={{height:58,flexShrink:0,background:th.surface,borderBottom:`1px solid ${th.border}`,display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 22px"}}>
      <div style={{display:"flex",alignItems:"center",gap:12}}>
        <div style={{display:"flex",alignItems:"center",gap:7,background:th.card2,border:`1px solid ${th.border}`,borderRadius:9,padding:"6px 12px",width:220}}>
          <Search size={13} color={th.text3}/>
          <input placeholder="Search..." style={{background:"transparent",border:"none",outline:"none",color:th.text,fontSize:12,width:"100%",fontFamily:"inherit"}}/>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:6,fontSize:12,color:th.text2}}>
          <span style={{padding:"4px 10px",borderRadius:7,background:mode==="owner"?th.accentSoft:th.accent2Soft,color:mode==="owner"?th.accent:th.accent2,fontWeight:700,fontSize:11}}>
            {mode==="owner"?"Owner":"Agency"}
          </span>
          {mode==="agency"&&<><ChevronRight size={12}/><span style={{fontWeight:600}}>{selClient.name}</span></>}
          <ChevronRight size={12}/>
          <span style={{fontWeight:500,color:th.text}}>{titles[page]||page}</span>
        </div>
      </div>
      <div style={{display:"flex",alignItems:"center",gap:9}}>
        <button style={{display:"flex",alignItems:"center",gap:5,padding:"6px 12px",borderRadius:8,background:th.card2,border:`1px solid ${th.border}`,color:th.text2,fontSize:11,cursor:"pointer"}}>
          <Download size={12}/> Export
        </button>
        <button style={{width:32,height:32,borderRadius:8,background:th.card2,border:`1px solid ${th.border}`,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",position:"relative"}}>
          <Bell size={14} color={th.text2}/>
          <span style={{position:"absolute",top:6,right:6,width:6,height:6,borderRadius:"50%",background:th.danger,border:`1.5px solid ${th.surface}`}}/>
        </button>
        <div style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer"}}>
          <div style={{width:32,height:32,borderRadius:9,background:th.gradient,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:800,color:"#fff"}}>OF</div>
          <div style={{lineHeight:1}}>
            <div style={{fontSize:12,fontWeight:700}}>Abdulla</div>
            <div style={{fontSize:9,color:th.text2}}>Octo Fusion</div>
          </div>
        </div>
      </div>
    </header>
  );
}

function OwnerDashboard() {
  const { setMode, setPage, setSelClient } = useApp();
  const th = useTheme();
  return (
    <div>
      <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:22}}>
        <div>
          <h1 style={{margin:0,fontSize:21,fontWeight:900,letterSpacing:-0.6}}>Good morning, Abdulla 👋</h1>
          <p style={{margin:"4px 0 0",fontSize:12,color:th.text2}}>Platform overview · Tawaslo · May 2026</p>
        </div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(6,1fr)",gap:13,marginBottom:22}}>
        {[
          {label:"Monthly Revenue",   value:"$1,994",change:"+12%",up:true, Icon:DollarSign,color:"success"},
          {label:"Active Clients",    value:"5",     change:"+1",  up:true, Icon:Building2, color:"accent" },
          {label:"Posts Published",   value:"1,742", change:"+23%",up:true, Icon:Send,      color:"accent2"},
          {label:"Total Reach",       value:"8.7M",  change:"+41%",up:true, Icon:Eye,       color:"info"   },
          {label:"Accounts",          value:"88",    change:"+14", up:true, Icon:Link,      color:"orange" },
          {label:"API Usage",         value:"74%",   change:"+8%", up:false,Icon:Activity,  color:"warning"},
        ].map((s,i)=><StatCard key={i} {...s}/>)}
      </div>
      <div style={{background:th.card,borderRadius:14,border:`1px solid ${th.border}`}}>
        <div style={{padding:"14px 20px",borderBottom:`1px solid ${th.border}`,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div style={{fontWeight:700,fontSize:14,display:"flex",alignItems:"center",gap:8}}><Building2 size={15} color={th.accent}/>All Clients</div>
          <button style={{display:"flex",alignItems:"center",gap:5,padding:"5px 11px",borderRadius:7,background:th.gradient,border:"none",color:"#fff",fontSize:11,fontWeight:600,cursor:"pointer"}}>
            <UserPlus size={11}/>Add Client
          </button>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr 1fr 1fr 1fr 80px",padding:"9px 20px",borderBottom:`1px solid ${th.border}`,fontSize:10,fontWeight:700,color:th.text3,textTransform:"uppercase",letterSpacing:0.7}}>
          {["Client","Plan","Status","Accounts","Posts","Revenue","Health"].map(h=><div key={h}>{h}</div>)}
        </div>
        {CLIENTS.map((cl,i)=>(
          <div key={cl.id} onClick={()=>{setSelClient(cl);setMode("agency");setPage("dashboard");}} style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr 1fr 1fr 1fr 80px",padding:"13px 20px",borderBottom:i<CLIENTS.length-1?`1px solid ${th.border}`:"none",alignItems:"center",cursor:"pointer",transition:"background 0.15s"}}>
            <div>
              <div style={{fontWeight:600,fontSize:13,display:"flex",alignItems:"center",gap:7}}>
                {cl.name}{cl.free&&<Badge color="success" size="xs">Free</Badge>}
              </div>
              <div style={{fontSize:10,color:th.text2,marginTop:1}}>{cl.reach} reach</div>
            </div>
            <Badge color={cl.plan==="Corporate"?"orange":cl.plan==="Pro"?"accent2":cl.plan==="Internal"?"success":"accent"}>{cl.plan}</Badge>
            <Badge color={cl.status==="active"?"success":"danger"}>{cl.status}</Badge>
            <div style={{fontSize:13,fontWeight:600}}>{cl.accounts}</div>
            <div style={{fontSize:13,fontWeight:600}}>{cl.posts}</div>
            <div style={{fontSize:13,fontWeight:700,color:cl.free?th.success:th.text}}>{cl.free?"Free":"$"+cl.spend}</div>
            <div>
              <div style={{height:4,background:th.border,borderRadius:2,overflow:"hidden"}}>
                <div style={{height:"100%",width:`${cl.health}%`,background:cl.health>=80?th.success:cl.health>=50?th.warning:th.danger,borderRadius:2}}/>
              </div>
              <div style={{fontSize:10,color:th.text2,marginTop:2}}>{cl.health}%</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AgencyDashboard() {
  const { selClient, setPage } = useApp();
  const th = useTheme();
  const [caption, setCaption] = useState("");
  const [selPl, setSelPl] = useState(["ig","fb"]);

  // AI caption state
  const [showAI, setShowAI]       = useState(false);
  const [aiTopic, setAiTopic]     = useState("");
  const [aiTone, setAiTone]       = useState("engaging and professional");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError]     = useState("");
  const [aiResult, setAiResult]   = useState(null); // {english, arabic}

  const generateCaption = async () => {
    if (!aiTopic.trim()) return;
    setAiLoading(true); setAiError(""); setAiResult(null);
    try {
      const res = await fetch('/api/generate-caption', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: aiTopic,
          platform: selPl[0] || 'ig',
          tone: aiTone,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      setAiResult(data);
    } catch (e) {
      setAiError(e.message);
    } finally {
      setAiLoading(false);
    }
  };
  return (
    <div>
      <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:22}}>
        <div>
          <div style={{display:"flex",alignItems:"center",gap:9,marginBottom:4}}>
            <h1 style={{margin:0,fontSize:21,fontWeight:900,letterSpacing:-0.6}}>{selClient.name}</h1>
            <Badge color={selClient.status==="active"?"success":"danger"}>{selClient.status}</Badge>
            <Badge color={selClient.free?"success":"accent2"}>{selClient.free?"Free":selClient.plan}</Badge>
          </div>
          <p style={{margin:0,fontSize:12,color:th.text2}}>{selClient.accounts} accounts · {selClient.posts} posts · {selClient.reach} reach</p>
        </div>
        <button style={{display:"flex",alignItems:"center",gap:6,padding:"9px 18px",borderRadius:10,background:th.gradient,border:"none",color:"#fff",fontWeight:700,fontSize:13,cursor:"pointer",boxShadow:`0 4px 14px rgba(79,110,247,0.4)`}}>
          <Plus size={14}/>New Post
        </button>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14,marginBottom:22}}>
        {[
          {label:"Total Posts",  value:"342",  change:"+12%", up:true,Icon:FileText,color:"accent" },
          {label:"Total Reach",  value:"1.2M", change:"+28%", up:true,Icon:Eye,     color:"info"   },
          {label:"Engagement",   value:"6.8%", change:"+1.2%",up:true,Icon:Heart,   color:"danger" },
          {label:"Followers",    value:"45.2K",change:"+2.1K",up:true,Icon:Users,   color:"success"},
        ].map((s,i)=><StatCard key={i} {...s}/>)}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 340px",gap:18}}>
        <div style={{background:th.card,borderRadius:14,border:`1px solid ${th.border}`}}>
          <div style={{padding:"14px 18px",borderBottom:`1px solid ${th.border}`,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
            <div style={{fontWeight:700,fontSize:13,display:"flex",alignItems:"center",gap:7}}><Calendar size={14} color={th.accent}/>Upcoming Posts</div>
            <button onClick={()=>setPage("publisher")} style={{fontSize:11,color:th.accent,background:"transparent",border:"none",cursor:"pointer",fontWeight:600,display:"flex",alignItems:"center",gap:3}}>View All<ChevronRight size={12}/></button>
          </div>
          {[
            {platform:"ig",time:"Today · 3:00 PM",  caption:"New collection drop 🔥",     status:"scheduled"},
            {platform:"fb",time:"Today · 5:30 PM",  caption:"Behind the scenes",           status:"scheduled"},
            {platform:"tw",time:"Today · 7:00 PM",  caption:"Exciting news dropping soon", status:"draft"    },
            {platform:"li",time:"Tomorrow · 9 AM",  caption:"We're hiring! Apply now →",   status:"scheduled"},
            {platform:"tt",time:"Tomorrow · 6 PM",  caption:"Day in the life 🎬",          status:"draft"    },
          ].map((p,i)=>{
            const PI = PlatformIcons[p.platform];
            return (
              <div key={i} style={{padding:"11px 18px",borderBottom:i<4?`1px solid ${th.border}`:"none",display:"flex",alignItems:"center",gap:12,cursor:"pointer"}}>
                <div style={{width:32,height:32,borderRadius:9,flexShrink:0,background:th.card2,display:"flex",alignItems:"center",justifyContent:"center"}}>
                  <PI/>
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:12,fontWeight:500,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.caption}</div>
                  <div style={{fontSize:10,color:th.text2,marginTop:2,display:"flex",alignItems:"center",gap:3}}><Clock size={9}/>{p.time}</div>
                </div>
                <Badge color={p.status==="scheduled"?"success":"warning"} size="xs">
                  {p.status==="scheduled"?<CheckCircle size={8}/>:<Circle size={8}/>}{p.status}
                </Badge>
              </div>
            );
          })}
        </div>

        <div style={{background:th.card,borderRadius:14,border:`1px solid ${th.border}`,overflow:"hidden"}}>
          <div style={{padding:"13px 16px",borderBottom:`1px solid ${th.border}`,fontWeight:700,fontSize:13,display:"flex",alignItems:"center",gap:7,background:th.gradientSoft}}>
            <Edit3 size={13} color={th.accent}/>Create Post
          </div>
          <div style={{padding:16}}>
            <div style={{marginBottom:12}}>
              <div style={{fontSize:9,color:th.text2,marginBottom:7,fontWeight:700,textTransform:"uppercase",letterSpacing:0.8}}>Publish to</div>
              <div style={{display:"flex",flexWrap:"wrap",gap:5}}>
                {PLATFORMS.map(pl=>{
                  const sel=selPl.includes(pl.id);
                  const PI=PlatformIcons[pl.id];
                  return (
                    <button key={pl.id} onClick={()=>setSelPl(p=>p.includes(pl.id)?p.filter(x=>x!==pl.id):[...p,pl.id])} style={{
                      padding:"4px 8px",borderRadius:6,
                      border:sel?`1.5px solid ${DARK[pl.color]}`:`1.5px solid ${th.border}`,
                      background:sel?`${DARK[pl.color]}15`:"transparent",
                      fontSize:10,fontWeight:600,cursor:"pointer",
                      display:"flex",alignItems:"center",gap:4,
                    }}>
                      <PI/>{pl.name.split("/")[0]}
                    </button>
                  );
                })}
              </div>
            </div>
            <textarea value={caption} onChange={e=>setCaption(e.target.value)} placeholder="Write your caption..." rows={4}
              style={{width:"100%",background:th.card2,border:`1px solid ${th.border}`,borderRadius:9,padding:"9px 11px",color:th.text,fontSize:12,resize:"none",outline:"none",fontFamily:"inherit",boxSizing:"border-box",marginBottom:10}}/>

            {/* AI Caption Generator */}
            <button onClick={()=>{setShowAI(!showAI);setAiResult(null);setAiError("");}} style={{width:"100%",padding:"8px",borderRadius:8,background:th.accent2Soft,border:`1px solid ${th.accent2}30`,color:th.accent2,fontSize:11,fontWeight:700,cursor:"pointer",marginBottom:showAI?8:10,display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
              <Sparkles size={12}/>{showAI?"Hide AI Generator":"Generate with AI"}
            </button>

            {showAI&&(
              <div style={{background:th.card2,border:`1px solid ${th.accent2}30`,borderRadius:10,padding:12,marginBottom:10}}>
                <div style={{fontSize:9,color:th.text2,fontWeight:700,textTransform:"uppercase",letterSpacing:0.8,marginBottom:6}}>Describe your post topic</div>
                <input value={aiTopic} onChange={e=>setAiTopic(e.target.value)} placeholder="e.g. New summer collection launch for a fashion brand"
                  style={{width:"100%",background:th.card,border:`1px solid ${th.border}`,borderRadius:7,padding:"8px 10px",color:th.text,fontSize:11,outline:"none",fontFamily:"inherit",boxSizing:"border-box",marginBottom:8}}/>
                <div style={{fontSize:9,color:th.text2,fontWeight:700,textTransform:"uppercase",letterSpacing:0.8,marginBottom:6}}>Tone</div>
                <select value={aiTone} onChange={e=>setAiTone(e.target.value)}
                  style={{width:"100%",background:th.card,border:`1px solid ${th.border}`,borderRadius:7,padding:"7px 10px",color:th.text,fontSize:11,outline:"none",fontFamily:"inherit",boxSizing:"border-box",marginBottom:8}}>
                  <option>engaging and professional</option>
                  <option>fun and casual</option>
                  <option>luxury and premium</option>
                  <option>urgent and promotional</option>
                  <option>informative and educational</option>
                </select>
                <button onClick={generateCaption} disabled={aiLoading||!aiTopic.trim()} style={{width:"100%",padding:"8px",borderRadius:7,background:th.gradient,border:"none",color:"#fff",fontSize:11,fontWeight:700,cursor:aiLoading?"not-allowed":"pointer",opacity:aiLoading||!aiTopic.trim()?0.7:1,display:"flex",alignItems:"center",justifyContent:"center",gap:5}}>
                  <Sparkles size={11}/>{aiLoading?"Generating…":"Generate"}
                </button>
                {aiError&&<div style={{marginTop:8,fontSize:10,color:th.danger,background:th.dangerSoft,borderRadius:6,padding:"6px 9px"}}>{aiError}</div>}
                {aiResult&&(
                  <div style={{marginTop:10}}>
                    <div style={{fontSize:9,color:th.text2,fontWeight:700,textTransform:"uppercase",letterSpacing:0.8,marginBottom:4}}>English</div>
                    <div style={{background:th.card,border:`1px solid ${th.border}`,borderRadius:7,padding:"8px 10px",fontSize:11,lineHeight:1.6,marginBottom:8}}>{aiResult.english}</div>
                    <button onClick={()=>setCaption(aiResult.english)} style={{width:"100%",padding:"5px",borderRadius:6,background:th.accentSoft,border:`1px solid ${th.accent}30`,color:th.accent,fontSize:10,fontWeight:600,cursor:"pointer",marginBottom:10}}>Use English Caption</button>
                    <div style={{fontSize:9,color:th.text2,fontWeight:700,textTransform:"uppercase",letterSpacing:0.8,marginBottom:4}}>Arabic / عربي</div>
                    <div style={{background:th.card,border:`1px solid ${th.border}`,borderRadius:7,padding:"8px 10px",fontSize:12,lineHeight:1.8,direction:"rtl",textAlign:"right",marginBottom:8}}>{aiResult.arabic}</div>
                    <button onClick={()=>setCaption(aiResult.arabic)} style={{width:"100%",padding:"5px",borderRadius:6,background:th.accentSoft,border:`1px solid ${th.accent}30`,color:th.accent,fontSize:10,fontWeight:600,cursor:"pointer"}}>Use Arabic Caption</button>
                  </div>
                )}
              </div>
            )}
            <button style={{width:"100%",padding:"10px",borderRadius:9,background:th.gradient,border:"none",color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer",boxShadow:`0 4px 14px rgba(79,110,247,0.4)`,display:"flex",alignItems:"center",justifyContent:"center",gap:6,marginBottom:7}}>
              <Calendar size={13}/>Schedule Post
            </button>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
              <button style={{padding:"7px 0",borderRadius:8,background:th.successSoft,border:`1px solid ${th.success}40`,color:th.success,fontSize:11,fontWeight:600,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:4}}>
                <Send size={11}/>Publish Now
              </button>
              <button style={{padding:"7px 0",borderRadius:8,background:th.card2,border:`1px solid ${th.border}`,color:th.text2,fontSize:11,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:4}}>
                <Bookmark size={11}/>Draft
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SocialAccountsPage() {
  const { selClient } = useApp();
  const th = useTheme();
  const META_APP_ID = process.env.REACT_APP_META_APP_ID || "1652475822681144";
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [realClientId, setRealClientId] = useState(null);

  // Resolve real Supabase UUID for the selected client
  useEffect(() => {
    if (!selClient?.name) return;
    setRealClientId(null);
    supabase.from('clients').select('id').eq('name', selClient.name).limit(1)
      .then(({ data, error }) => {
        if (data && data.length > 0) setRealClientId(data[0].id);
        else if (error) console.error('Client lookup error:', error);
        else console.warn('No client found for name:', selClient.name);
      });
  }, [selClient]);

  // Load connected accounts from Supabase
  useEffect(() => {
    if (!realClientId) return;
    loadAccounts(realClientId);
  }, [realClientId]);

  const loadAccounts = async (clientId) => {
    const cid = clientId || realClientId;
    if (!cid) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('social_accounts')
      .select('*')
      .eq('client_id', cid);
    if (!error && data) setAccounts(data);
    setLoading(false);
  };

  const connectMeta = () => {
    const redirectUri = `${window.location.origin}/api/meta-callback`;
    const scope = [
      "pages_show_list",
      "pages_read_engagement",
      "business_management",
      "public_profile",
    ].join(",");
    const authUrl = `https://www.facebook.com/v19.0/dialog/oauth?client_id=${META_APP_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope)}&response_type=code&state=${realClientId}`;
    const popup = window.open(authUrl, "meta_oauth", "width=600,height=700,scrollbars=yes");
    setConnecting(true);

    // Listen for the callback
    const interval = setInterval(async () => {
      try {
        if (popup.closed) {
          clearInterval(interval);
          setConnecting(false);
          loadAccounts(realClientId);
          return;
        }
        const popupUrl = popup.location.href;
        if (popupUrl.includes("code=")) {
          const url = new URL(popupUrl);
          const code = url.searchParams.get("code");
          popup.close();
          clearInterval(interval);

          // Exchange code for tokens
          const res = await fetch('/api/meta-oauth', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code, redirectUri }),
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error);

          // Save each account to Supabase
          let saveErrors = [];
          for (const acc of data.accounts) {
            const { error: upsertErr } = await supabase.from('social_accounts').upsert({
              client_id: realClientId,
              platform: acc.platform,
              account_id: acc.account_id,
              account_name: acc.account_name,
              username: acc.username || null,
              access_token: acc.access_token,
              picture: acc.picture || null,
              followers_count: acc.followers_count || 0,
              is_active: true,
            }, { onConflict: 'client_id,account_id' });
            if (upsertErr) saveErrors.push(upsertErr.message);
          }

          if (saveErrors.length > 0) {
            setError(`Save failed: ${saveErrors.join('; ')}`);
            setConnecting(false);
            return;
          }

          setSuccess(`Connected ${data.accounts.length} account(s) successfully!`);
          setConnecting(false);
          loadAccounts(realClientId);
        }
      } catch (e) {
        // Popup still navigating — keep waiting
      }
    }, 1000);
  };

  const disconnectAccount = async (accountId) => {
    await supabase.from('social_accounts').delete().eq('id', accountId);
    setAccounts(prev => prev.filter(a => a.id !== accountId));
  };

  const platformInfo = {
    ig: { name: "Instagram", color: "#E1306C", bg: "rgba(225,48,108,0.1)", Icon: FaInstagram },
    fb: { name: "Facebook",  color: "#1877F2", bg: "rgba(24,119,242,0.1)", Icon: FaFacebook  },
  };

  return (
    <div style={{ padding: "28px 32px", maxWidth: 860 }}>
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 900, letterSpacing: -0.5 }}>Social Accounts</h2>
        <p style={{ margin: "6px 0 0", fontSize: 13, color: th.text2 }}>
          Connect Instagram and Facebook accounts for {selClient?.name}
        </p>
      </div>

      {error && <div style={{ padding: "12px 16px", borderRadius: 10, background: th.dangerSoft, color: th.danger, fontSize: 13, marginBottom: 16 }}>{error}</div>}
      {success && <div style={{ padding: "12px 16px", borderRadius: 10, background: th.successSoft, color: th.success, fontSize: 13, marginBottom: 16 }}>{success}</div>}

      {/* Connect Button */}
      <div style={{ background: th.card, border: `1px solid ${th.border}`, borderRadius: 14, padding: 24, marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ display: "flex", gap: 8 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: "rgba(225,48,108,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <FaInstagram style={{ color: "#E1306C", fontSize: 20 }} />
              </div>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: "rgba(24,119,242,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <FaFacebook style={{ color: "#1877F2", fontSize: 20 }} />
              </div>
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14 }}>Connect Instagram & Facebook</div>
              <div style={{ fontSize: 12, color: th.text2, marginTop: 3 }}>Log in with Facebook to connect pages and Instagram business accounts</div>
            </div>
          </div>
          <button
            onClick={connectMeta}
            disabled={connecting}
            style={{ padding: "11px 22px", borderRadius: 10, background: th.gradient, border: "none", color: "#fff", fontSize: 13, fontWeight: 700, cursor: connecting ? "not-allowed" : "pointer", opacity: connecting ? 0.7 : 1, display: "flex", alignItems: "center", gap: 8, whiteSpace: "nowrap" }}
          >
            <Link size={14} />{connecting ? "Connecting…" : "Connect via Facebook"}
          </button>
        </div>
      </div>

      {/* Connected Accounts */}
      <div style={{ background: th.card, border: `1px solid ${th.border}`, borderRadius: 14, overflow: "hidden" }}>
        <div style={{ padding: "16px 20px", borderBottom: `1px solid ${th.border}`, fontWeight: 700, fontSize: 13 }}>
          Connected Accounts {accounts.length > 0 && <span style={{ fontWeight: 400, color: th.text2 }}>({accounts.length})</span>}
        </div>
        {loading ? (
          <div style={{ padding: 32, textAlign: "center", color: th.text2, fontSize: 13 }}>Loading…</div>
        ) : accounts.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center" }}>
            <Link size={32} color={th.text3} style={{ marginBottom: 12 }} />
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 6 }}>No accounts connected</div>
            <div style={{ fontSize: 12, color: th.text2 }}>Click "Connect via Facebook" above to get started</div>
          </div>
        ) : (
          accounts.map((acc, i) => {
            const info = platformInfo[acc.platform] || { name: acc.platform, color: th.accent, bg: th.accentSoft, Icon: Globe };
            const PIcon = info.Icon;
            return (
              <div key={acc.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px", borderBottom: i < accounts.length - 1 ? `1px solid ${th.border}` : "none" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ position: "relative" }}>
                    {acc.picture ? (
                      <img src={acc.picture} alt="" style={{ width: 40, height: 40, borderRadius: 10, objectFit: "cover" }} />
                    ) : (
                      <div style={{ width: 40, height: 40, borderRadius: 10, background: info.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <PIcon style={{ color: info.color, fontSize: 20 }} />
                      </div>
                    )}
                    <div style={{ position: "absolute", bottom: -3, right: -3, width: 16, height: 16, borderRadius: "50%", background: info.bg, border: `2px solid ${th.card}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <PIcon style={{ color: info.color, fontSize: 8 }} />
                    </div>
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 13 }}>{acc.account_name}</div>
                    <div style={{ fontSize: 11, color: th.text2 }}>
                      {acc.username ? `@${acc.username} · ` : ""}{info.name}
                      {acc.followers_count > 0 && ` · ${acc.followers_count.toLocaleString()} followers`}
                    </div>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ padding: "3px 10px", borderRadius: 20, background: th.successSoft, color: th.success, fontSize: 11, fontWeight: 700 }}>
                    ● Active
                  </div>
                  <button
                    onClick={() => disconnectAccount(acc.id)}
                    style={{ padding: "6px 12px", borderRadius: 8, background: th.dangerSoft, border: "none", color: th.danger, fontSize: 11, fontWeight: 600, cursor: "pointer" }}
                  >
                    Disconnect
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Info box */}
      <div style={{ marginTop: 20, padding: "14px 18px", borderRadius: 10, background: th.accentSoft, border: `1px solid ${th.border}`, fontSize: 12, color: th.text2, lineHeight: 1.6 }}>
        <strong style={{ color: th.accent }}>Note:</strong> Instagram accounts must be Business or Creator accounts connected to a Facebook Page. Personal Instagram accounts cannot be connected via the API.
      </div>
    </div>
  );
}

function Placeholder({ icon:Icon, title, description }) {
  const { setPage } = useApp();
  const th = useTheme();
  return (
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:"60vh",textAlign:"center",padding:40}}>
      <div style={{width:72,height:72,borderRadius:20,background:th.accentSoft,display:"flex",alignItems:"center",justifyContent:"center",marginBottom:20}}>
        <Icon size={32} color={th.accent} strokeWidth={1.5}/>
      </div>
      <h2 style={{margin:0,fontSize:22,fontWeight:900,letterSpacing:-0.6,marginBottom:8}}>{title}</h2>
      <p style={{margin:0,fontSize:13,color:th.text2,maxWidth:400,lineHeight:1.6,marginBottom:24}}>{description}</p>
      <button onClick={()=>setPage("dashboard")} style={{padding:"10px 20px",borderRadius:10,background:th.gradient,border:"none",color:"#fff",fontSize:13,fontWeight:700,cursor:"pointer",boxShadow:`0 4px 14px rgba(79,110,247,0.4)`,display:"flex",alignItems:"center",gap:7}}>
        <LayoutDashboard size={14}/>Go to Dashboard
      </button>
    </div>
  );
}

function AuthPage() {
  const { authPage, setAuthPage, setIsAuthed } = useApp();
  const [showPw,  setShowPw]  = useState(false);
  const [email,   setEmail]   = useState("");
  const [pw,      setPw]      = useState("");
  const [name,    setName]    = useState("");
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");
  const [success, setSuccess] = useState("");
  const th = DARK;

  const handleSignIn = async () => {
    setError(""); setLoading(true);
    const { data, error: err } = await signIn(email, pw);
    setLoading(false);
    if (err) { setError(err.message); return; }
    if (data?.user) setIsAuthed(true);
  };

  const handleSignUp = async () => {
    setError(""); setLoading(true);
    const { data, error: err } = await signUp(email, pw, name);
    setLoading(false);
    if (err) { setError(err.message); return; }
    if (data?.user) {
      await createProfile(data.user.id, name, email);
      setSuccess("Account created! Check your email to confirm, then sign in.");
      setAuthPage("login");
    }
  };

  const handleReset = async () => {
    setError(""); setLoading(true);
    const { error: err } = await resetPassword(email);
    setLoading(false);
    if (err) { setError(err.message); return; }
    setSuccess("Reset link sent — check your email.");
  };

  const inp = (placeholder, value, onChange, type="text") => (
    <div style={{display:"flex",alignItems:"center",gap:10,background:th.card,border:`1px solid ${th.border}`,borderRadius:11,padding:"11px 14px",marginBottom:12}}>
      {type==="email"&&<Mail size={15} color={th.text3}/>}
      {type==="password"&&<Lock size={15} color={th.text3}/>}
      {type==="text"&&<User size={15} color={th.text3}/>}
      <input type={showPw&&type==="password"?"text":type} value={value} onChange={onChange} placeholder={placeholder}
        style={{background:"transparent",border:"none",outline:"none",color:th.text,fontSize:13,width:"100%",fontFamily:"inherit"}}/>
      {type==="password"&&(
        <button onClick={()=>setShowPw(!showPw)} style={{background:"none",border:"none",cursor:"pointer",display:"flex",alignItems:"center"}}>
          <Eye size={14} color={th.text3}/>
        </button>
      )}
    </div>
  );

  return (
    <div style={{display:"flex",height:"100vh",background:th.bg,color:th.text,fontFamily:"'Sora','DM Sans','Segoe UI',sans-serif",overflow:"hidden"}}>
      <div style={{width:420,flexShrink:0,background:"linear-gradient(145deg,#0D1425 0%,#111827 50%,#0D1425 100%)",borderRight:`1px solid ${th.border}`,display:"flex",flexDirection:"column",padding:"40px 36px",position:"relative",overflow:"hidden"}}>
        <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:60}}>
          <div style={{width:42,height:42,borderRadius:12,background:th.gradient,display:"flex",alignItems:"center",justifyContent:"center"}}>
            <Link size={20} color="#fff" strokeWidth={2.5}/>
          </div>
          <div>
            <div style={{fontWeight:900,fontSize:22,letterSpacing:-0.8}}>Tawaslo</div>
            <div style={{fontSize:10,color:th.text2,letterSpacing:0.5,textTransform:"uppercase"}}>Social Intelligence</div>
          </div>
        </div>
        <div style={{flex:1}}>
          <div style={{fontSize:32,fontWeight:900,letterSpacing:-1,lineHeight:1.2,marginBottom:16}}>
            Manage every<br/>
            <span style={{background:th.gradient,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>social account</span><br/>
            from one place.
          </div>
          <div style={{fontSize:13,color:th.text2,lineHeight:1.7,marginBottom:36,maxWidth:320}}>
            Schedule, analyse, respond, and grow — one platform built for GCC agencies.
          </div>
          {[
            {Icon:BarChart2,     label:"Real-time analytics across all platforms"},
            {Icon:Sparkles,      label:"AI captions in Arabic and English"},
            {Icon:MessageCircle, label:"Unified inbox for all comments and DMs"},
            {Icon:Shield,        label:"Enterprise security and team controls"},
          ].map(({Icon:I,label},i)=>(
            <div key={i} style={{display:"flex",alignItems:"center",gap:10,marginBottom:12}}>
              <div style={{width:28,height:28,borderRadius:7,background:th.accentSoft,flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center"}}>
                <I size={13} color={th.accent}/>
              </div>
              <span style={{fontSize:12,color:th.text2}}>{label}</span>
            </div>
          ))}
        </div>
        <div style={{display:"flex",gap:7,marginTop:24}}>
          {PLATFORMS.map(p=>{
            const PI=PlatformIcons[p.id];
            return (
              <div key={p.id} style={{width:30,height:30,borderRadius:8,background:`${DARK[p.color]}18`,display:"flex",alignItems:"center",justifyContent:"center",border:`1px solid ${DARK[p.color]}30`}}>
                <PI/>
              </div>
            );
          })}
        </div>
      </div>
      <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",padding:40,overflowY:"auto"}}>
        <div style={{width:"100%",maxWidth:400}}>
          {/* Error / Success banners */}
          {error&&(
            <div style={{background:th.dangerSoft,border:`1px solid ${th.danger}40`,borderRadius:9,padding:"10px 14px",marginBottom:14,fontSize:12,color:th.danger}}>
              {error}
            </div>
          )}
          {success&&(
            <div style={{background:th.successSoft,border:`1px solid ${th.success}40`,borderRadius:9,padding:"10px 14px",marginBottom:14,fontSize:12,color:th.success}}>
              {success}
            </div>
          )}

          {authPage==="login"&&(
            <>
              <div style={{marginBottom:28}}>
                <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:18}}>
                  <img src="/logo.png" alt="Tawasalo" style={{width:44,height:44,borderRadius:12,objectFit:"contain"}}/>
                  <div style={{fontWeight:900,fontSize:22,letterSpacing:-0.8}}>Tawasalo</div>
                </div>
                <h1 style={{margin:0,fontSize:24,fontWeight:900,letterSpacing:-0.6}}>Welcome back</h1>
                <p style={{margin:"6px 0 0",fontSize:13,color:th.text2}}>Sign in to your Tawasalo workspace</p>
              </div>
              {inp("Email address",email,e=>{setEmail(e.target.value);setError("");},"email")}
              {inp("Password",pw,e=>{setPw(e.target.value);setError("");},"password")}
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:20}}>
                <label style={{display:"flex",alignItems:"center",gap:6,fontSize:12,color:th.text2,cursor:"pointer"}}>
                  <input type="checkbox" style={{accentColor:th.accent}}/>Remember me
                </label>
                <button onClick={()=>{setAuthPage("forgot");setError("");setSuccess("");}} style={{background:"none",border:"none",color:th.accent,fontSize:12,fontWeight:600,cursor:"pointer"}}>Forgot password?</button>
              </div>
              <button onClick={handleSignIn} disabled={loading} style={{width:"100%",padding:"13px",borderRadius:11,background:th.gradient,border:"none",color:"#fff",fontSize:14,fontWeight:700,cursor:loading?"not-allowed":"pointer",opacity:loading?0.7:1,boxShadow:`0 4px 18px rgba(79,110,247,0.4)`,display:"flex",alignItems:"center",justifyContent:"center",gap:8,marginBottom:10}}>
                {loading?"Signing in…":"Sign in"} {!loading&&<ChevronRight size={15}/>}
              </button>
              <div style={{textAlign:"center",fontSize:12,color:th.text2}}>
                Don't have an account?{" "}
                <button onClick={()=>{setAuthPage("register");setError("");setSuccess("");}} style={{background:"none",border:"none",color:th.accent,fontWeight:700,cursor:"pointer",fontSize:12}}>Sign up free</button>
              </div>
            </>
          )}
          {authPage==="register"&&(
            <>
              <div style={{marginBottom:28}}>
                <h1 style={{margin:0,fontSize:24,fontWeight:900,letterSpacing:-0.6}}>Create your account</h1>
                <p style={{margin:"6px 0 0",fontSize:13,color:th.text2}}>14-day free trial · No credit card required</p>
              </div>
              {inp("Full name",name,e=>{setName(e.target.value);setError("");},"text")}
              {inp("Work email",email,e=>{setEmail(e.target.value);setError("");},"email")}
              {inp("Password",pw,e=>{setPw(e.target.value);setError("");},"password")}
              <button onClick={handleSignUp} disabled={loading} style={{width:"100%",padding:"13px",borderRadius:11,background:th.gradient,border:"none",color:"#fff",fontSize:14,fontWeight:700,cursor:loading?"not-allowed":"pointer",opacity:loading?0.7:1,boxShadow:`0 4px 18px rgba(79,110,247,0.4)`,display:"flex",alignItems:"center",justifyContent:"center",gap:8,marginBottom:12}}>
                {loading?"Creating account…":"Create account"} {!loading&&<ChevronRight size={15}/>}
              </button>
              <div style={{textAlign:"center",fontSize:12,color:th.text2}}>
                Already have an account?{" "}
                <button onClick={()=>{setAuthPage("login");setError("");setSuccess("");}} style={{background:"none",border:"none",color:th.accent,fontWeight:700,cursor:"pointer",fontSize:12}}>Sign in</button>
              </div>
            </>
          )}
          {authPage==="forgot"&&(
            <>
              <div style={{marginBottom:28}}>
                <h1 style={{margin:0,fontSize:24,fontWeight:900,letterSpacing:-0.6}}>Reset password</h1>
                <p style={{margin:"6px 0 0",fontSize:13,color:th.text2}}>We'll send a reset link to your email</p>
              </div>
              {inp("Your email address",email,e=>{setEmail(e.target.value);setError("");},"email")}
              <button onClick={handleReset} disabled={loading} style={{width:"100%",padding:"13px",borderRadius:11,background:th.gradient,border:"none",color:"#fff",fontSize:14,fontWeight:700,cursor:loading?"not-allowed":"pointer",opacity:loading?0.7:1,display:"flex",alignItems:"center",justifyContent:"center",gap:8,marginBottom:12}}>
                {loading?"Sending…":"Send reset link"} {!loading&&<ChevronRight size={15}/>}
              </button>
              <button onClick={()=>{setAuthPage("login");setError("");setSuccess("");}} style={{width:"100%",padding:"11px",borderRadius:11,background:"transparent",border:`1px solid ${th.border}`,color:th.text2,fontSize:13,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
                <ArrowLeft size={13}/>Back to sign in
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function TawasloApp() {
  const [dark,      setDark]      = useState(true);
  const [lang,      setLang]      = useState("en");
  const [isAuthed,  setIsAuthed]  = useState(false);
  const [authPage,  setAuthPage]  = useState("login");
  const [mode,      setMode]      = useState("owner");
  const [page,      setPage]      = useState("overview");
  const [selClient, setSelClient] = useState(CLIENTS[0]);
  const [authReady, setAuthReady] = useState(false); // prevents flash of login screen

  // Restore session on load
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setIsAuthed(true);
        // Ensure Octo Fusion client exists in DB
        ensureOctoFusionClient(session.user.id);
      }
      setAuthReady(true);
    });
    // Listen for auth changes (e.g. email confirmation callback)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthed(!!session?.user);
      if (session?.user) ensureOctoFusionClient(session.user.id);
    });
    return () => subscription.unsubscribe();
  }, []);

  const th = dark ? DARK : LIGHT;

  const ctx = {
    dark, setDark, lang, setLang,
    isAuthed, setIsAuthed,
    authPage, setAuthPage,
    mode, setMode,
    page, setPage,
    selClient, setSelClient,
  };

  const renderPage = () => {
    if (mode==="owner") {
      if (page==="overview") return <OwnerDashboard/>;
      return <Placeholder icon={Settings} title={page.charAt(0).toUpperCase()+page.slice(1)} description="This section is coming soon."/>;
    }
    if (page==="dashboard") return <AgencyDashboard/>;
    if (page==="social") return <SocialAccountsPage/>;
    const icons = {
      publisher:Calendar, streams:Radio, inbox:Inbox, listening:Activity,
      campaigns:Megaphone, aistudio:Wand2, media:Image,
      analytics:BarChart2, reports:PieChart,
      agencyteam:Users, billing:CreditCard, agencysets:Settings,
    };
    const Icon = icons[page]||Settings;
    return <Placeholder icon={Icon} title={page.charAt(0).toUpperCase()+page.slice(1)} description="This page is being connected. Full version ready — linking it now."/>;
  };

  // Don't render anything until we've checked the session
  if (!authReady) return null;

  if (!isAuthed) {
    return (
      <AppCtx.Provider value={ctx}>
        <AuthPage/>
      </AppCtx.Provider>
    );
  }

  return (
    <AppCtx.Provider value={ctx}>
      <div style={{
        display:"flex", height:"100vh",
        background:th.bg, color:th.text,
        fontFamily:"'Sora','DM Sans','Segoe UI',sans-serif",
        direction:lang==="ar"?"rtl":"ltr",
        transition:"all 0.3s", overflow:"hidden",
      }}>
        <Sidebar/>
        <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
          <Topbar/>
          <div style={{flex:1,overflowY:"auto",padding:22}}>
            {renderPage()}
          </div>
        </div>
      </div>
    </AppCtx.Provider>
  );
}