import { useState, useEffect, createContext, useContext } from "react";
import { supabase, signIn, signUp, signOut, createProfile, createInitialClient, resetPassword, ensureOctoFusionClient, getProfile, updateProfile, getClients } from './supabase';
import {
  LayoutDashboard, Calendar, BarChart2, Megaphone, Users,
  Settings, Plus, Search, Bell, Globe, Image, Clock, Send,
  Heart, Bookmark, TrendingUp, Eye, CheckCircle, Circle,
  Download, ArrowUpRight, ArrowDownRight, Inbox, Star,
  Target, PieChart, Activity, UserPlus, Building2, FileText,
  CreditCard, LogOut, ChevronRight, ChevronDown,
  Radio, Edit3, XCircle, Link, Shield, DollarSign, Sparkles,
  ArrowLeft, Lock, Mail, User, MessageCircle, Sun, Moon,
  Languages, Wand2, MoreHorizontal, RefreshCw,
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

const ADMIN_EMAIL = 'theoctopus.bh@gmail.com';
const ADMIN_HOST_PREFIX = 'admin.';
const ACCOUNT_LABELS = { agency: "Agency", freelancer: "Freelancer", corporate: "Corporate", enterprise: "Enterprise" };
const accountLabelOf = (t) => ACCOUNT_LABELS[t] || "Agency";

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
      background:th.card, borderRadius:18, border:`1px solid ${th.border}`,
      padding:"18px 20px", boxShadow:"0 10px 30px rgba(0,0,0,0.28)",
    }}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
        <div style={{width:34,height:34,borderRadius:11,background:th[color+"Soft"]||th.accentSoft,display:"flex",alignItems:"center",justifyContent:"center"}}>
          <I size={16} color={th[color]||th.accent}/>
        </div>
        {change&&(
          <div style={{display:"flex",alignItems:"center",gap:3,fontSize:11,fontWeight:600,color:up?th.success:th.danger}}>
            {up?<ArrowUpRight size={13}/>:<ArrowDownRight size={13}/>}{change}
          </div>
        )}
      </div>
      <div style={{fontSize:26,fontWeight:600,letterSpacing:-0.5,marginBottom:3}}>{value}</div>
      <div style={{fontSize:12,color:th.text2}}>{label}</div>
    </div>
  );
}

function Sidebar() {
  const { dark, setDark, lang, setLang, mode, setMode, page, setPage,
          selClient, setSelClient, setIsAuthed, clients } = useApp();
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
      {key:"inbox",     Icon:Inbox,           label:"Inbox",     badge:null},
      {key:"listening", Icon:Activity,        label:"Listening", badge:null},
    ]},
    {section:"Create", items:[
      {key:"campaigns", Icon:Megaphone,       label:"Campaigns", badge:null},
      {key:"aistudio",  Icon:Wand2,           label:"AI Studio", badge:null},
      {key:"media",     Icon:Image,           label:"Media",     badge:null},
    ]},
    {section:"Analyse", items:[
      {key:"analytics", Icon:BarChart2,       label:"Analytics", badge:null},
      {key:"ads",       Icon:DollarSign,      label:"Ads",       badge:null},
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
        <img src="/logo-transparent.png" alt="Tawaslo" style={{width:38,height:38,objectFit:"contain",flexShrink:0}}/>
        <div>
          <div style={{fontWeight:900,fontSize:18,letterSpacing:-0.8,lineHeight:1}}>Tawaslo</div>
          <div style={{fontSize:9,color:th.text2,letterSpacing:0.4,marginTop:1,textTransform:"uppercase"}}>Social Intelligence</div>
        </div>
      </div>

      {mode==="agency"&&(
        <div style={{padding:"0 14px 12px"}}>
          <div style={{background:th.card2,border:`1px solid ${th.border}`,borderRadius:9,padding:"8px 11px",cursor:"pointer",marginBottom:6}}>
            <div style={{fontSize:11,fontWeight:700}}>{selClient.name}</div>
            <div style={{fontSize:9,color:th.text2,marginTop:1}}>{selClient.plan} · {selClient.accounts} accounts</div>
          </div>
          {clients.length===0 && (
            <div style={{fontSize:10,color:th.text3,padding:"6px 9px"}}>No brands yet</div>
          )}
          {clients.map(c=>(
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
            <LogOut size={10}/>Log out
          </button>
        </div>
      </div>
    </aside>
  );
}

function Topbar() {
  const { mode, page, selClient, accountType } = useApp();
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
            {mode==="owner"?"Owner":accountLabelOf(accountType)}
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
      <div style={{background:th.card,borderRadius:18,border:`1px solid ${th.border}`,boxShadow:"0 10px 30px rgba(0,0,0,0.28)",overflow:"hidden"}}>
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
            <h1 style={{margin:0,fontSize:21,fontWeight:600,letterSpacing:-0.4}}>{selClient.name}</h1>
            <Badge color={selClient.status==="active"?"success":"danger"}>{selClient.status}</Badge>
            <Badge color={selClient.free?"success":"accent2"}>{selClient.free?"Free":selClient.plan}</Badge>
          </div>
          <p style={{margin:0,fontSize:12,color:th.text2}}>{selClient.accounts} accounts · {selClient.posts} posts · {selClient.reach} reach</p>
        </div>
        <button onClick={()=>setPage("publisher")} style={{display:"flex",alignItems:"center",gap:6,padding:"10px 18px",borderRadius:11,background:th.gradient,border:"none",color:"#fff",fontWeight:600,fontSize:13,cursor:"pointer"}}>
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
        <div style={{background:th.card,borderRadius:18,border:`1px solid ${th.border}`,boxShadow:"0 10px 30px rgba(0,0,0,0.28)",overflow:"hidden"}}>
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

        <div style={{background:th.card,borderRadius:18,border:`1px solid ${th.border}`,boxShadow:"0 10px 30px rgba(0,0,0,0.28)",overflow:"hidden"}}>
          <div style={{padding:"14px 18px",borderBottom:`1px solid ${th.border}`,fontWeight:600,fontSize:13,display:"flex",alignItems:"center",gap:7}}>
            <Sparkles size={14} color={th.accent}/>Quick actions
          </div>
          <div style={{padding:18}}>
            <button onClick={()=>setPage("publisher")} style={{width:"100%",padding:"11px",borderRadius:11,background:th.accent,border:"none",color:"#fff",fontSize:13,fontWeight:600,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:7,marginBottom:14}}>
              <Plus size={15}/>New post
            </button>
            {[["analytics","Analytics",BarChart2],["inbox","Inbox",Inbox],["reports","Reports",PieChart]].map(([pg,lbl,Ic])=>(
              <button key={pg} onClick={()=>setPage(pg)} style={{width:"100%",padding:"10px 12px",borderRadius:10,background:th.card2,border:`1px solid ${th.border}`,color:th.text,fontSize:12,fontWeight:500,cursor:"pointer",display:"flex",alignItems:"center",gap:9,marginBottom:8}}>
                <Ic size={15} color={th.text2}/>{lbl}<ChevronRight size={13} color={th.text3} style={{marginLeft:"auto"}}/>
              </button>
            ))}
            <div style={{marginTop:6,paddingTop:16,borderTop:`1px solid ${th.border}`}}>
              <div style={{fontSize:12,fontWeight:600,marginBottom:12}}>Reach by post type</div>
              <div style={{display:"flex",alignItems:"center",gap:14}}>
                <svg viewBox="0 0 120 120" width="92" height="92">
                  <circle cx="60" cy="60" r="42" fill="none" stroke={th.border} strokeWidth="15"/>
                  <circle cx="60" cy="60" r="42" fill="none" stroke="#4F6EF7" strokeWidth="15" strokeDasharray="118.8 145.1" transform="rotate(-90 60 60)" strokeLinecap="round"/>
                  <circle cx="60" cy="60" r="42" fill="none" stroke="#7C3AED" strokeWidth="15" strokeDasharray="79.2 184.7" strokeDashoffset="-120" transform="rotate(-90 60 60)" strokeLinecap="round"/>
                  <circle cx="60" cy="60" r="42" fill="none" stroke="#2DD4BF" strokeWidth="15" strokeDasharray="60 203.9" strokeDashoffset="-202" transform="rotate(-90 60 60)" strokeLinecap="round"/>
                </svg>
                <div style={{fontSize:11,color:th.text2,lineHeight:2}}>
                  <div><span style={{color:"#4F6EF7"}}>●</span> Reels 45%</div>
                  <div><span style={{color:"#7C3AED"}}>●</span> Carousel 30%</div>
                  <div><span style={{color:"#2DD4BF"}}>●</span> Photo 25%</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PublisherPage() {
  const { selClient, dark } = useApp();
  const th = dark ? DARK : LIGHT;

  const [accounts, setAccounts] = useState([]);
  const [selectedAccounts, setSelectedAccounts] = useState([]);
  const [caption, setCaption] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [altText, setAltText] = useState("");
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaPreview, setMediaPreview] = useState(null);
  const [mediaType, setMediaType] = useState(null); // 'image' or 'video'
  const [mediaWarning, setMediaWarning] = useState("");
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [scheduleType, setScheduleType] = useState("now");
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");
  const [posting, setPosting] = useState(false);
  const [generatingAI, setGeneratingAI] = useState(false);
  const [aiTopic, setAiTopic] = useState("");
  const [results, setResults] = useState([]);
  const [realClientId, setRealClientId] = useState(null);

  useEffect(() => {
    if (!selClient?.name) return;
    supabase.from('clients').select('id').eq('name', selClient.name).limit(1)
      .then(({ data }) => { if (data && data.length > 0) setRealClientId(data[0].id); });
  }, [selClient]);

  useEffect(() => {
    if (!realClientId) return;
    supabase.from('social_accounts').select('*').eq('client_id', realClientId).neq('is_active', false)
      .then(({ data }) => { if (data) setAccounts(data); });
  }, [realClientId]);

  const toggleAccount = (id) => {
    setSelectedAccounts(prev => prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]);
  };

  const generateCaption = async () => {
    if (!aiTopic.trim()) return;
    setGeneratingAI(true);
    try {
      const res = await fetch('/api/generate-caption', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: aiTopic, brand: selClient?.name }),
      });
      const data = await res.json();
      if (data.english) setCaption(data.english + (data.arabic ? '\n\n' + data.arabic : ''));
    } catch (e) { console.error(e); }
    setGeneratingAI(false);
  };

  const handleFileSelect = async (file) => {
    if (!file) return;
    const isVideo = file.type.startsWith('video/');
    const isImage = file.type.startsWith('image/');
    const sizeMB = file.size / 1024 / 1024;
    setMediaFile(file);
    setMediaType(isVideo ? 'video' : 'image');
    setMediaWarning('');
    if (sizeMB > 100) { setMediaWarning('File exceeds 100MB limit. Please compress before uploading.'); return; }
    if (isImage) setMediaPreview(URL.createObjectURL(file));
    else setMediaPreview(null);
    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const uid = user?.id || 'anonymous';
      const ext = file.name.split('.').pop();
      const path = `${uid}/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from('media').upload(path, file, { upsert: true });
      if (error) throw error;
      const { data: urlData } = supabase.storage.from('media').getPublicUrl(path);
      setImageUrl(urlData.publicUrl);
    } catch (err) {
      setMediaWarning('Upload failed: ' + err.message);
    }
    setUploading(false);
  };

  const handlePost = async () => {
    if (!caption.trim()) return;
    if (selectedAccounts.length === 0) return;
    setPosting(true);
    setResults([]);

    const postResults = [];
    for (const accId of selectedAccounts) {
      const acc = accounts.find(a => a.id === accId);
      if (!acc) continue;

      if (scheduleType === "schedule" && scheduleDate && scheduleTime) {
        // Save to posts table for scheduling
        const scheduledAt = new Date(`${scheduleDate}T${scheduleTime}`).toISOString();
        const { error } = await supabase.from('posts').insert([{
          client_id: realClientId,
          platform: acc.platform,
          account_id: acc.account_id,
          caption,
          image_url: imageUrl || null,
          status: 'scheduled',
          scheduled_at: scheduledAt,
        }]);
        postResults.push({ account: acc.account_name, success: !error, error: error?.message });
      } else {
        // Post now
        const res = await fetch('/api/meta-publish', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            platform: acc.platform,
            accountId: acc.account_id,
            accessToken: acc.access_token,
            caption,
            imageUrl: imageUrl || null,
            videoUrl: mediaType === 'video' ? imageUrl : null,
            altText: altText || null,
          }),
        });
        const data = await res.json();
        postResults.push({ account: acc.account_name, success: data.success, error: data.error });
      }
    }

    setResults(postResults);
    setPosting(false);
    if (postResults.every(r => r.success)) {
      setCaption(""); setImageUrl(""); setSelectedAccounts([]); setAltText(""); setMediaFile(null); setMediaPreview(null); setMediaType(null);
    }
  };

  const platformInfo = { ig: { name:"Instagram", color:"#E1306C", Icon:FaInstagram }, fb: { name:"Facebook", color:"#1877F2", Icon:FaFacebook } };

  return (
    <div style={{ padding:"28px 32px", maxWidth:900, display:"grid", gridTemplateColumns:"1fr 340px", gap:24, alignItems:"start" }}>
      {/* Left: Composer */}
      <div>
        <div style={{ marginBottom:24 }}>
          <h2 style={{ margin:0, fontSize:22, fontWeight:900, letterSpacing:-0.5 }}>Create Post</h2>
          <p style={{ margin:"6px 0 0", fontSize:13, color:th.text2 }}>Publish or schedule content for {selClient?.name}</p>
        </div>

        {/* Account selector */}
        <div style={{ background:th.card, border:`1px solid ${th.border}`, borderRadius:14, padding:20, marginBottom:16 }}>
          <div style={{ fontSize:12, fontWeight:700, color:th.text2, marginBottom:12, textTransform:"uppercase", letterSpacing:0.5 }}>Post to</div>
          {accounts.length === 0 ? (
            <div style={{ fontSize:13, color:th.text2 }}>No connected accounts. <span style={{ color:th.accent, cursor:"pointer" }}>Connect accounts first.</span></div>
          ) : (
            <div style={{ display:"flex", flexWrap:"wrap", gap:10 }}>
              {accounts.map(acc => {
                const info = platformInfo[acc.platform] || { name:acc.platform, color:th.accent, Icon:Globe };
                const selected = selectedAccounts.includes(acc.id);
                return (
                  <div key={acc.id} onClick={() => toggleAccount(acc.id)} style={{ display:"flex", alignItems:"center", gap:8, padding:"8px 14px", borderRadius:20, border:`2px solid ${selected ? info.color : th.border}`, background:selected ? `${info.color}18` : th.card2, cursor:"pointer", transition:"all 0.15s" }}>
                    <info.Icon style={{ color:info.color, fontSize:14 }}/>
                    <div>
                      <div style={{ fontSize:12, fontWeight:700, color:selected ? info.color : th.text }}>{acc.account_name}</div>
                      <div style={{ fontSize:10, color:th.text2 }}>{info.name}</div>
                    </div>
                    {selected && <CheckCircle size={14} color={info.color}/>}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* AI Caption */}
        <div style={{ background:th.card, border:`1px solid ${th.border}`, borderRadius:14, padding:20, marginBottom:16 }}>
          <div style={{ fontSize:12, fontWeight:700, color:th.text2, marginBottom:12, textTransform:"uppercase", letterSpacing:0.5 }}>AI Caption Generator</div>
          <div style={{ display:"flex", gap:8 }}>
            <input value={aiTopic} onChange={e=>setAiTopic(e.target.value)} onKeyDown={e=>e.key==="Enter"&&generateCaption()} placeholder="Describe your post topic..." style={{ flex:1, padding:"10px 14px", borderRadius:8, border:`1px solid ${th.border}`, background:th.card2, color:th.text, fontSize:13, outline:"none" }}/>
            <button onClick={generateCaption} disabled={generatingAI||!aiTopic.trim()} style={{ padding:"10px 16px", borderRadius:8, background:th.gradient, border:"none", color:"#fff", fontSize:12, fontWeight:700, cursor:"pointer", display:"flex", alignItems:"center", gap:6, whiteSpace:"nowrap", opacity:generatingAI?0.7:1 }}>
              <Sparkles size={13}/>{generatingAI?"Generating…":"Generate"}
            </button>
          </div>
        </div>

        {/* Caption */}
        <div style={{ background:th.card, border:`1px solid ${th.border}`, borderRadius:14, padding:20, marginBottom:16 }}>
          <div style={{ fontSize:12, fontWeight:700, color:th.text2, marginBottom:12, textTransform:"uppercase", letterSpacing:0.5 }}>Caption</div>
          <textarea value={caption} onChange={e=>setCaption(e.target.value)} placeholder="Write your caption here..." rows={5} style={{ width:"100%", padding:"12px 14px", borderRadius:8, border:`1px solid ${th.border}`, background:th.card2, color:th.text, fontSize:13, outline:"none", resize:"vertical", boxSizing:"border-box", fontFamily:"inherit", lineHeight:1.6 }}/>
          <div style={{ fontSize:11, color:th.text3, marginTop:6, textAlign:"right" }}>{caption.length} characters</div>
        </div>

        {/* Media Upload */}
        <div style={{ background:th.card, border:`1px solid ${th.border}`, borderRadius:14, padding:20, marginBottom:16 }}>
          <div style={{ fontSize:12, fontWeight:700, color:th.text2, marginBottom:12, textTransform:"uppercase", letterSpacing:0.5 }}>Media <span style={{ fontWeight:400, color:th.text3 }}>(optional)</span></div>
          <div
            onClick={()=>document.getElementById('media-file-input').click()}
            onDragOver={e=>{e.preventDefault();setDragOver(true);}}
            onDragLeave={()=>setDragOver(false)}
            onDrop={e=>{e.preventDefault();setDragOver(false);handleFileSelect(e.dataTransfer.files[0]);}}
            style={{ border:`2px dashed ${dragOver?th.accent:th.border}`, borderRadius:10, padding:24, textAlign:"center", cursor:"pointer", background:dragOver?th.accentSoft:"transparent", transition:"all 0.2s" }}>
            <input type="file" id="media-file-input" accept="image/*,video/*" style={{ display:"none" }} onChange={e=>handleFileSelect(e.target.files[0])}/>
            {mediaPreview ? (
              <img src={mediaPreview} alt="preview" style={{ maxHeight:160, borderRadius:8, objectFit:"cover", maxWidth:"100%" }}/>
            ) : mediaType === 'video' ? (
              <div><div style={{ fontSize:28, marginBottom:6 }}>🎬</div><div style={{ fontSize:12, fontWeight:700 }}>Reel detected</div><div style={{ fontSize:11, color:th.text2 }}>{mediaFile?.name}</div></div>
            ) : (
              <div><div style={{ fontSize:28, marginBottom:6 }}>📎</div><div style={{ fontSize:13, fontWeight:600, marginBottom:4 }}>Drag & drop or click to upload</div><div style={{ fontSize:11, color:th.text2 }}>Images (JPG, PNG) or Videos (MP4) · Max 100MB</div></div>
            )}
          </div>
          {uploading && <div style={{ fontSize:12, color:th.accent, marginTop:8, textAlign:"center" }}>⬆️ Uploading...</div>}
          {imageUrl && !uploading && <div style={{ fontSize:11, color:th.success, marginTop:8 }}>✓ {mediaType === 'video' ? 'Reel' : 'Image'} uploaded successfully</div>}
          {mediaWarning && <div style={{ fontSize:11, color:th.danger, marginTop:8 }}>⚠️ {mediaWarning}</div>}
          {mediaFile && <div style={{ marginTop:8, display:"flex", alignItems:"center", gap:8 }}><span style={{ fontSize:11, padding:"2px 8px", borderRadius:10, background:mediaType==='video'?"#FF005020":"#4F6EF720", color:mediaType==='video'?"#FF0050":"#4F6EF7", fontWeight:700, border:`1px solid ${mediaType==='video'?"#FF0050":"#4F6EF7"}` }}>{mediaType==='video'?'REEL':'POST'}</span><span style={{ fontSize:11, color:th.text2 }}>{mediaFile.name}</span></div>}

          {/* Format guide */}
          <div style={{ marginTop:14, borderTop:`1px solid ${th.border}`, paddingTop:12 }}>
            <div style={{ fontSize:10, fontWeight:700, color:th.text3, marginBottom:8, textTransform:"uppercase" }}>Instagram Format Guide</div>
            <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
              {[["🖼","Square Post","1080×1080px · 1:1"],["📸","Portrait Post","1080×1350px · 4:5"],["🎬","Reel","1080×1920px · 9:16 · Max 90s"],["🌐","Landscape","1080×566px · 16:9"]].map(([icon,name,spec])=>(
                <div key={name} style={{ display:"flex", justifyContent:"space-between", fontSize:11, color:th.text2 }}><span>{icon} {name}</span><span style={{ color:th.text3 }}>{spec}</span></div>
              ))}
            </div>
          </div>
        </div>

        {/* Alt Text */}
        <div style={{ background:th.card, border:`1px solid ${th.border}`, borderRadius:14, padding:20, marginBottom:16 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
            <div style={{ fontSize:12, fontWeight:700, color:th.text2, textTransform:"uppercase", letterSpacing:0.5 }}>Alt Text</div>
            <span style={{ fontSize:10, color:th.accent, background:th.accentSoft, padding:"2px 8px", borderRadius:10 }}>Accessibility & SEO</span>
          </div>
          <textarea value={altText} onChange={e=>setAltText(e.target.value)} placeholder="Describe your image for visually impaired users and search engines..." rows={2} style={{ width:"100%", padding:"10px 14px", borderRadius:8, border:`1px solid ${th.border}`, background:th.card2, color:th.text, fontSize:13, outline:"none", resize:"none", boxSizing:"border-box", fontFamily:"inherit" }}/>
          <div style={{ fontSize:11, color:th.text3, marginTop:6 }}>Supported on Instagram. Improves discoverability.</div>
        </div>

        {/* Schedule */}
        <div style={{ background:th.card, border:`1px solid ${th.border}`, borderRadius:14, padding:20, marginBottom:20 }}>
          <div style={{ fontSize:12, fontWeight:700, color:th.text2, marginBottom:12, textTransform:"uppercase", letterSpacing:0.5 }}>When to Post</div>
          <div style={{ display:"flex", gap:8, marginBottom:scheduleType==="schedule"?14:0 }}>
            {["now","schedule"].map(t => (
              <button key={t} onClick={()=>setScheduleType(t)} style={{ padding:"8px 16px", borderRadius:8, border:`2px solid ${scheduleType===t?th.accent:th.border}`, background:scheduleType===t?th.accentSoft:th.card2, color:scheduleType===t?th.accent:th.text2, fontSize:12, fontWeight:700, cursor:"pointer" }}>
                {t==="now"?"Post Now":"Schedule"}
              </button>
            ))}
          </div>
          {scheduleType==="schedule" && (
            <div style={{ display:"flex", gap:10, marginTop:12 }}>
              <input type="date" value={scheduleDate} onChange={e=>setScheduleDate(e.target.value)} style={{ flex:1, padding:"9px 12px", borderRadius:8, border:`1px solid ${th.border}`, background:th.card2, color:th.text, fontSize:13, outline:"none" }}/>
              <input type="time" value={scheduleTime} onChange={e=>setScheduleTime(e.target.value)} style={{ flex:1, padding:"9px 12px", borderRadius:8, border:`1px solid ${th.border}`, background:th.card2, color:th.text, fontSize:13, outline:"none" }}/>
            </div>
          )}
        </div>

        {/* Results */}
        {results.length > 0 && (
          <div style={{ marginBottom:16 }}>
            {results.map((r, i) => (
              <div key={i} style={{ padding:"10px 14px", borderRadius:8, background:r.success?th.successSoft:th.dangerSoft, color:r.success?th.success:th.danger, fontSize:13, marginBottom:8, display:"flex", alignItems:"center", gap:8 }}>
                {r.success ? <CheckCircle size={14}/> : <XCircle size={14}/>}
                <span><b>{r.account}</b>: {r.success ? (scheduleType==="schedule"?"Scheduled!":"Posted!") : r.error}</span>
              </div>
            ))}
          </div>
        )}

        {/* Post button */}
        <button onClick={handlePost} disabled={posting||!caption.trim()||selectedAccounts.length===0} style={{ width:"100%", padding:"14px", borderRadius:12, background:th.gradient, border:"none", color:"#fff", fontSize:15, fontWeight:800, cursor:"pointer", opacity:(posting||!caption.trim()||selectedAccounts.length===0)?0.5:1, display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
          {posting ? "Posting…" : scheduleType==="schedule" ? <><Clock size={16}/>Schedule Post</> : <><Send size={16}/>Publish Now</>}
        </button>
      </div>

      {/* Right: Preview */}
      <div style={{ position:"sticky", top:24 }}>
        <div style={{ background:th.card, border:`1px solid ${th.border}`, borderRadius:14, overflow:"hidden" }}>
          <div style={{ padding:"14px 18px", borderBottom:`1px solid ${th.border}`, fontSize:12, fontWeight:700, color:th.text2, textTransform:"uppercase", letterSpacing:0.5 }}>Preview</div>
          <div style={{ padding:18 }}>
            {/* Mock post preview */}
            <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:12 }}>
              <div style={{ width:36, height:36, borderRadius:"50%", background:th.gradient, display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, color:"#fff", fontWeight:700 }}>
                {selClient?.name?.[0] || "T"}
              </div>
              <div>
                <div style={{ fontSize:13, fontWeight:700 }}>{selClient?.name || "Your Brand"}</div>
                <div style={{ fontSize:11, color:th.text2 }}>Just now</div>
              </div>
            </div>
            {imageUrl && (
              <img src={imageUrl} alt="preview" style={{ width:"100%", borderRadius:10, marginBottom:10, maxHeight:200, objectFit:"cover" }} onError={e=>e.target.style.display="none"}/>
            )}
            <div style={{ fontSize:13, color:th.text, lineHeight:1.6, whiteSpace:"pre-wrap", wordBreak:"break-word" }}>
              {caption || <span style={{ color:th.text3 }}>Your caption will appear here…</span>}
            </div>
          </div>
        </div>

        {selectedAccounts.length > 0 && (
          <div style={{ marginTop:12, background:th.card, border:`1px solid ${th.border}`, borderRadius:12, padding:14 }}>
            <div style={{ fontSize:11, fontWeight:700, color:th.text2, marginBottom:8 }}>POSTING TO</div>
            {selectedAccounts.map(id => {
              const acc = accounts.find(a => a.id === id);
              if (!acc) return null;
              const info = platformInfo[acc.platform] || { name:acc.platform, color:th.accent, Icon:Globe };
              return <div key={id} style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6, fontSize:12 }}>
                <info.Icon style={{ color:info.color, fontSize:13 }}/> {acc.account_name}
              </div>;
            })}
          </div>
        )}
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

  // Handle Instagram OAuth callback redirect
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const igCode = params.get('ig_code');
    const igError = params.get('ig_error');
    if (igError) {
      setError('Instagram connection failed: ' + igError);
      window.history.replaceState({}, '', '/social');
    } else if (igCode && realClientId) {
      handleInstagramCallback(igCode);
    }
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

  const connectInstagram = () => {
    const redirectUri = `https://tawaslo.com/api/instagram-callback`;
    const IG_APP_ID = '3569589083219608';
    const scope = 'instagram_business_basic,instagram_business_content_publish,instagram_business_manage_comments,instagram_business_manage_messages,instagram_business_manage_insights';
    // Store current page so callback can return here
    if (realClientId) sessionStorage.setItem('ig_redirect_client', realClientId);
    const authUrl = `https://www.instagram.com/oauth/authorize?force_reauth=true&client_id=${IG_APP_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope)}&response_type=code`;
    window.location.href = authUrl;
  };

  const handleInstagramCallback = async (code) => {
    const redirectUri = `https://tawaslo.com/api/instagram-callback`;
    const storedId = sessionStorage.getItem('ig_redirect_client');
    const clientId = (storedId && storedId !== 'null') ? storedId : realClientId;
    sessionStorage.removeItem('ig_redirect_client');
    setConnecting(true);
    try {
      const res = await fetch('/api/instagram-oauth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, redirectUri }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      const acc = data.account;
      const { error: upsertErr } = await supabase.from('social_accounts').upsert({
        client_id: clientId,
        platform: acc.platform,
        account_id: acc.account_id,
        account_name: acc.account_name,
        username: acc.username || null,
        access_token: acc.access_token,
        picture: acc.picture || null,
        followers_count: acc.followers_count || 0,
        is_active: true,
      }, { onConflict: 'client_id,account_id' });
      if (upsertErr) throw new Error(upsertErr.message);
      setSuccess(`Instagram @${acc.username} connected!`);
      loadAccounts(clientId);
    } catch (err) {
      setError('Instagram save failed: ' + err.message);
    }
    setConnecting(false);
    // Clean URL
    window.history.replaceState({}, '', '/social');
  };

  const connectMeta = () => {
    const redirectUri = `https://tawaslo.com/api/meta-callback`;
    const scope = [
      "pages_show_list",
      "pages_read_engagement",
      "pages_manage_posts",
      "business_management",
      "public_profile",
      "instagram_content_publish",
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
          console.log('META OAUTH RESPONSE:', JSON.stringify(data, null, 2));
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

      {/* Connect Buttons */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 24 }}>
        {/* Facebook */}
        <div style={{ background: th.card, border: `1px solid ${th.border}`, borderRadius: 14, padding: 20 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: "rgba(24,119,242,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <FaFacebook style={{ color: "#1877F2", fontSize: 20 }} />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14 }}>Connect Facebook Pages</div>
                <div style={{ fontSize: 12, color: th.text2, marginTop: 2 }}>Connect your Facebook pages</div>
              </div>
            </div>
            <button onClick={connectMeta} disabled={connecting}
              style={{ padding: "10px 20px", borderRadius: 10, background: "#1877F2", border: "none", color: "#fff", fontSize: 13, fontWeight: 700, cursor: connecting ? "not-allowed" : "pointer", opacity: connecting ? 0.7 : 1, display: "flex", alignItems: "center", gap: 8 }}>
              <Link size={14} />{connecting ? "Connecting…" : "Connect via Facebook"}
            </button>
          </div>
        </div>
        {/* Instagram */}
        <div style={{ background: th.card, border: `1px solid ${th.border}`, borderRadius: 14, padding: 20 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: "rgba(225,48,108,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <FaInstagram style={{ color: "#E1306C", fontSize: 20 }} />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14 }}>Connect Instagram Business</div>
                <div style={{ fontSize: 12, color: th.text2, marginTop: 2 }}>Connect Instagram business or creator accounts</div>
              </div>
            </div>
            <button onClick={connectInstagram} disabled={connecting}
              style={{ padding: "10px 20px", borderRadius: 10, background: "linear-gradient(135deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888)", border: "none", color: "#fff", fontSize: 13, fontWeight: 700, cursor: connecting ? "not-allowed" : "pointer", opacity: connecting ? 0.7 : 1, display: "flex", alignItems: "center", gap: 8 }}>
              <Link size={14} />{connecting ? "Connecting…" : "Connect via Instagram"}
            </button>
          </div>
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

function InsightChart({ chartData, dark }) {
  const th = dark ? DARK : LIGHT;
  if (!chartData || chartData.length < 2) return (
    <div style={{textAlign:"center", padding:"30px 0", fontSize:12, color:th.text2}}>
      Chart data available after <strong style={{color:th.text}}>instagram_manage_insights</strong> is approved by Meta.
    </div>
  );
  const padL = 42, padR = 12, padT = 14, padB = 28;
  const vW = 600, vH = 160;
  const chartW = vW - padL - padR;
  const chartH = vH - padT - padB;
  const maxVal = Math.max(...chartData.flatMap(d => [d.reach||0, d.impressions||0]), 1);
  const x = i => padL + (i / (chartData.length - 1)) * chartW;
  const y = v => padT + (1 - v / maxVal) * chartH;
  const reachPts = chartData.map((d,i) => `${x(i)},${y(d.reach||0)}`).join(' ');
  const impPts   = chartData.map((d,i) => `${x(i)},${y(d.impressions||0)}`).join(' ');
  const reachArea = `${padL},${padT+chartH} ${reachPts} ${x(chartData.length-1)},${padT+chartH}`;
  const impArea   = `${padL},${padT+chartH} ${impPts}   ${x(chartData.length-1)},${padT+chartH}`;
  const yTicks = [0, 0.25, 0.5, 0.75, 1];
  const xStep = Math.ceil(chartData.length / 6);
  const fmt = v => v >= 1000 ? `${(v/1000).toFixed(0)}k` : `${v}`;
  return (
    <svg viewBox={`0 0 ${vW} ${vH}`} style={{width:"100%", height:"auto", display:"block"}}>
      <defs>
        <linearGradient id="rGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#E1306C" stopOpacity="0.35"/>
          <stop offset="100%" stopColor="#E1306C" stopOpacity="0"/>
        </linearGradient>
        <linearGradient id="iGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#A78BFA" stopOpacity="0.25"/>
          <stop offset="100%" stopColor="#A78BFA" stopOpacity="0"/>
        </linearGradient>
      </defs>
      {yTicks.map(p => {
        const yy = y(maxVal * p);
        return (
          <g key={p}>
            <line x1={padL} y1={yy} x2={padL+chartW} y2={yy} stroke={dark?"#ffffff18":"#00000012"} strokeWidth={1}/>
            <text x={padL-5} y={yy+3.5} textAnchor="end" fontSize={9} fill={th.text2}>{fmt(Math.round(maxVal*p))}</text>
          </g>
        );
      })}
      <polygon points={impArea}   fill="url(#iGrad)"/>
      <polygon points={reachArea} fill="url(#rGrad)"/>
      <polyline points={impPts}   fill="none" stroke="#A78BFA" strokeWidth={2} strokeLinejoin="round"/>
      <polyline points={reachPts} fill="none" stroke="#E1306C" strokeWidth={2} strokeLinejoin="round"/>
      {chartData.map((d,i) => {
        if (i % xStep !== 0) return null;
        return <text key={i} x={x(i)} y={vH-6} textAnchor="middle" fontSize={8.5} fill={th.text2}>{d.date}</text>;
      })}
      {/* Legend */}
      <circle cx={padL+2} cy={padT-4} r={4} fill="#E1306C"/>
      <text x={padL+10} y={padT-0.5} fontSize={9} fill={th.text2}>Reach</text>
      <circle cx={padL+52} cy={padT-4} r={4} fill="#A78BFA"/>
      <text x={padL+60} y={padT-0.5} fontSize={9} fill={th.text2}>Impressions</text>
    </svg>
  );
}

function AnalyticsPage() {
  const { selClient, dark } = useApp();
  const th = dark ? DARK : LIGHT;
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState({});
  const [selectedAcc, setSelectedAcc] = useState(null);
  const [realClientId, setRealClientId] = useState(null);

  useEffect(() => {
    if (!selClient?.name) return;
    supabase.from('clients').select('id').eq('name', selClient.name).limit(1)
      .then(({ data }) => { if (data?.[0]) setRealClientId(data[0].id); });
  }, [selClient]);

  useEffect(() => {
    if (!realClientId) return;
    supabase.from('social_accounts').select('*').eq('client_id', realClientId).neq('is_active', false)
      .then(({ data }) => {
        if (data) {
          setAccounts(data);
          const igAccs = data.filter(a => a.platform === 'ig');
          if (igAccs.length > 0) {
            setSelectedAcc(igAccs[0]);
            fetchAnalytics(igAccs[0]);
          } else {
            setLoading(false);
          }
        }
      });
  }, [realClientId]);

  const fetchAnalytics = async (acc) => {
    setLoading(true);
    try {
      const res = await fetch('/api/instagram-analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountId: acc.account_id, accessToken: acc.access_token }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setAnalyticsData(prev => ({ ...prev, [acc.id]: data }));
    } catch(e) {
      console.warn('Analytics error:', e);
      setAnalyticsData(prev => ({ ...prev, [acc.id]: { error: e.message } }));
    }
    setLoading(false);
  };

  const igAccounts = accounts.filter(a => a.platform === 'ig');
  const fbAccounts = accounts.filter(a => a.platform === 'fb');
  const totalFollowers = accounts.reduce((s,a) => s + (a.followers_count||0), 0);
  const data = selectedAcc ? analyticsData[selectedAcc.id] : null;

  const statCard = (label, value, sub, color) => (
    <div style={{background:th.card, border:`1px solid ${th.border}`, borderRadius:14, padding:20}}>
      <div style={{fontSize:11, color:th.text2, fontWeight:600, marginBottom:8, textTransform:"uppercase", letterSpacing:0.5}}>{label}</div>
      <div style={{fontSize:26, fontWeight:900, color: color || th.text}}>{value}</div>
      {sub && <div style={{fontSize:11, color:th.text2, marginTop:4}}>{sub}</div>}
    </div>
  );

  return (
    <div style={{padding:"28px 32px", maxWidth:1200}}>
      <div style={{marginBottom:24, display:"flex", justifyContent:"space-between", alignItems:"center"}}>
        <div>
          <h2 style={{margin:0, fontSize:22, fontWeight:900}}>Analytics</h2>
          <p style={{margin:"6px 0 0", fontSize:13, color:th.text2}}>Performance overview for {selClient?.name}</p>
        </div>
        {igAccounts.length > 1 && (
          <div style={{display:"flex", gap:8}}>
            {igAccounts.map(acc => (
              <button key={acc.id} onClick={()=>{setSelectedAcc(acc);fetchAnalytics(acc);}} style={{padding:"6px 14px", borderRadius:20, border:`1px solid ${selectedAcc?.id===acc.id?"#E1306C":th.border}`, background:selectedAcc?.id===acc.id?"rgba(225,48,108,0.1)":"transparent", color:selectedAcc?.id===acc.id?"#E1306C":th.text2, fontSize:11, fontWeight:600, cursor:"pointer"}}>
                @{acc.username || acc.account_name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Summary cards */}
      <div style={{display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:16, marginBottom:24}}>
        {statCard("Total Followers", totalFollowers.toLocaleString(), `Across ${accounts.length} accounts`, th.accent)}
        {statCard("Instagram", igAccounts.reduce((s,a)=>s+(a.followers_count||0),0).toLocaleString(), `${igAccounts.length} account${igAccounts.length!==1?'s':''}`, "#E1306C")}
        {statCard("Facebook Pages", fbAccounts.length.toString(), "Connected pages", "#1877F2")}
        {statCard("Engagement Rate", data?.summary?.engagementRate ? `${data.summary.engagementRate}%` : "—", "Last 30 days", th.success)}
      </div>

      {loading ? (
        <div style={{textAlign:"center", padding:40, color:th.text2, fontSize:13}}>Loading analytics...</div>
      ) : data?.error ? (
        <div style={{background:th.card, border:`1px solid ${th.border}`, borderRadius:14, padding:24}}>
          <div style={{fontSize:13, color:th.danger, marginBottom:8}}>Could not load Instagram insights</div>
          <div style={{fontSize:12, color:th.text2, lineHeight:1.6}}>{data.error}</div>
          <div style={{fontSize:12, color:th.text2, marginTop:8, lineHeight:1.6}}>Full analytics (reach, impressions, engagement) will be available after <strong style={{color:th.text}}>instagram_manage_insights</strong> permission is approved by Meta.</div>
        </div>
      ) : data ? (
        <>
          {/* Instagram insights summary */}
          <div style={{display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:16, marginBottom:24}}>
            {statCard("Reach (30d)", data.summary.totalReach.toLocaleString(), "Unique accounts reached", "#E1306C")}
            {statCard("Impressions (30d)", data.summary.totalImpressions.toLocaleString(), "Total content views", "#A78BFA")}
            {statCard("Profile Views", data.summary.totalProfileViews.toLocaleString(), "Last 30 days", th.accent)}
            {statCard("Total Likes", data.summary.totalLikes.toLocaleString(), `On ${data.summary.postsAnalyzed} recent posts`, "#F59E0B")}
          </div>

          {/* Reach & Impressions chart */}
          <div style={{background:th.card, border:`1px solid ${th.border}`, borderRadius:14, padding:20, marginBottom:16}}>
            <div style={{fontSize:13, fontWeight:700, marginBottom:4}}>Reach &amp; Impressions — last 30 days</div>
            <div style={{fontSize:11, color:th.text2, marginBottom:16}}>Daily reach vs impressions trend</div>
            <InsightChart chartData={data.chartData} dark={dark}/>
          </div>

          {/* Top performing post */}
          {data.recentPosts.length > 0 && (() => {
            const top = [...data.recentPosts].sort((a,b) => (b.likes+b.comments) - (a.likes+a.comments))[0];
            return (
              <div style={{background:th.card, border:`1px solid ${th.accent}40`, borderRadius:14, overflow:"hidden", marginBottom:16, display:"flex"}}>
                {top.thumbnail ? (
                  <img src={top.thumbnail} alt="" style={{width:200, minWidth:200, objectFit:"cover", display:"block"}} onError={e=>{e.target.style.display="none"; e.target.nextSibling && (e.target.nextSibling.style.display="flex");}}/>
                ) : null}
                {!top.thumbnail && (
                  <div style={{width:200, minWidth:200, background:`linear-gradient(135deg,${th.accentSoft},rgba(124,58,237,0.1))`, display:"flex", alignItems:"center", justifyContent:"center", color:th.accent, fontSize:32}}>📸</div>
                )}
                <div style={{flex:1, padding:20, display:"flex", flexDirection:"column", justifyContent:"space-between"}}>
                  <div>
                    <div style={{display:"flex", alignItems:"center", gap:8, marginBottom:10}}>
                      <svg width="22" height="22" viewBox="0 0 32 32" fill="none">
                        <path d="M5 26H27" stroke="#4F6EF7" strokeWidth="2" strokeLinecap="round"/>
                        <path d="M8 26V18" stroke="#4F6EF7" strokeWidth="2" strokeLinecap="round"/>
                        <path d="M15 26V13" stroke="#4F6EF7" strokeWidth="2" strokeLinecap="round"/>
                        <path d="M22 26V8" stroke="#4F6EF7" strokeWidth="2" strokeLinecap="round"/>
                        <path d="M8 15L14 10L19 12L24 6" stroke="#4F6EF7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M24 4.5L25.1 6.8L27.6 7.15L25.8 8.95L26.25 11.45L24 10.25L21.75 11.45L22.2 8.95L20.4 7.15L22.9 6.8L24 4.5Z" stroke="#4F6EF7" strokeWidth="1.6" strokeLinejoin="round"/>
                      </svg>
                      <div style={{fontSize:12, fontWeight:700, color:th.accent}}>Top Performing Post</div>
                    </div>
                    <div style={{fontSize:12, color:th.text, lineHeight:1.8}}>{top.caption || '(No caption)'}</div>
                  </div>
                  <div style={{display:"flex", gap:24, marginTop:16}}>
                    <div><div style={{fontSize:20, fontWeight:900, color:th.text}}>{top.likes.toLocaleString()}</div><div style={{fontSize:10, color:th.text2}}>Likes</div></div>
                    <div><div style={{fontSize:20, fontWeight:900, color:th.text}}>{top.comments.toLocaleString()}</div><div style={{fontSize:10, color:th.text2}}>Comments</div></div>
                    {top.reach > 0 && <div><div style={{fontSize:20, fontWeight:900, color:th.text}}>{top.reach.toLocaleString()}</div><div style={{fontSize:10, color:th.text2}}>Reach</div></div>}
                    {top.saved > 0 && <div><div style={{fontSize:20, fontWeight:900, color:th.text}}>{top.saved.toLocaleString()}</div><div style={{fontSize:10, color:th.text2}}>Saved</div></div>}
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Recent posts grid */}
          <div style={{background:th.card, border:`1px solid ${th.border}`, borderRadius:14, padding:20, marginBottom:16}}>
            <div style={{fontSize:13, fontWeight:700, marginBottom:16}}>Recent posts performance</div>
            {data.recentPosts.length === 0 ? (
              <div style={{color:th.text2, fontSize:13}}>No recent posts found.</div>
            ) : (
              <div style={{display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12}}>
                {data.recentPosts.map(post => (
                  <div key={post.id} style={{background:th.card2, borderRadius:10, overflow:"hidden", border:`1px solid ${th.border}`}}>
                    {post.thumbnail && <img src={post.thumbnail} alt="" style={{width:"100%", height:"auto", display:"block"}} onError={e=>e.target.style.display="none"}/>}
                    <div style={{padding:12}}>
                      <div style={{fontSize:11, color:th.text2, marginBottom:8, lineHeight:1.6}}>{post.caption || '(No caption)'}</div>
                      <div style={{display:"flex", gap:12}}>
                        <div style={{fontSize:11}}><span style={{color:th.text2}}>❤️</span> <strong style={{color:th.text}}>{post.likes}</strong></div>
                        <div style={{fontSize:11}}><span style={{color:th.text2}}>💬</span> <strong style={{color:th.text}}>{post.comments}</strong></div>
                        {post.reach > 0 && <div style={{fontSize:11}}><span style={{color:th.text2}}>👁</span> <strong style={{color:th.text}}>{post.reach.toLocaleString()}</strong></div>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      ) : (
        <div style={{background:th.card, border:`1px solid ${th.border}`, borderRadius:14, padding:24}}>
          <div style={{fontSize:13, fontWeight:700, marginBottom:8}}>Instagram Analytics</div>
          <div style={{fontSize:12, color:th.text2, lineHeight:1.6}}>Connect an Instagram Business account to see detailed analytics including reach, impressions, and post performance.</div>
        </div>
      )}
    </div>
  );
}

function AdsPage() {
  const { selClient, dark } = useApp();
  const th = dark ? DARK : LIGHT;
  const [loading, setLoading] = useState(false);
  const [adsData, setAdsData] = useState(null);
  const [error, setError] = useState('');
  const [accounts, setAccounts] = useState([]);
  const [realClientId, setRealClientId] = useState(null);

  useEffect(() => {
    if (!selClient?.name) return;
    supabase.from('clients').select('id').eq('name', selClient.name).limit(1)
      .then(({ data }) => { if (data?.[0]) setRealClientId(data[0].id); });
  }, [selClient]);

  useEffect(() => {
    if (!realClientId) return;
    supabase.from('social_accounts').select('*').eq('client_id', realClientId).neq('is_active', false)
      .then(({ data }) => { if (data) { setAccounts(data); fetchAds(data); } });
  }, [realClientId]);

  const fetchAds = async (accs) => {
    const fbAcc = (accs || accounts).find(a => a.platform === 'fb');
    if (!fbAcc) return;
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/meta-ads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessToken: fbAcc.access_token, pageId: fbAcc.account_id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setAdsData(data);
    } catch(e) {
      setError(e.message);
    }
    setLoading(false);
  };

  const statCard = (label, value, sub, color) => (
    <div style={{background:th.card, border:`1px solid ${th.border}`, borderRadius:14, padding:20}}>
      <div style={{fontSize:11, color:th.text2, fontWeight:600, marginBottom:8, textTransform:"uppercase", letterSpacing:0.5}}>{label}</div>
      <div style={{fontSize:26, fontWeight:900, color: color || th.text}}>{value}</div>
      {sub && <div style={{fontSize:11, color:th.text2, marginTop:4}}>{sub}</div>}
    </div>
  );

  const statusColor = (s) => s === 'ACTIVE' ? th.success : s === 'PAUSED' ? th.warning : th.text2;

  return (
    <div style={{padding:"28px 32px", maxWidth:1200}}>
      <div style={{marginBottom:24, display:"flex", justifyContent:"space-between", alignItems:"center"}}>
        <div>
          <h2 style={{margin:0, fontSize:22, fontWeight:900}}>Ads Performance</h2>
          <p style={{margin:"6px 0 0", fontSize:13, color:th.text2}}>Last 30 days — {selClient?.name}</p>
        </div>
        <button onClick={()=>fetchAds(accounts)} disabled={loading} style={{padding:"10px 20px", borderRadius:10, background:th.gradient, border:"none", color:"#fff", fontSize:12, fontWeight:700, cursor:"pointer", display:"flex", alignItems:"center", gap:6}}>
          <RefreshCw size={13}/> {loading ? 'Loading…' : 'Refresh'}
        </button>
      </div>

      {loading ? (
        <div style={{textAlign:"center", padding:60, color:th.text2, fontSize:13}}>Loading ads data...</div>
      ) : error ? (
        <div style={{background:th.card, border:`1px solid ${th.border}`, borderRadius:14, padding:24}}>
          <div style={{fontSize:13, color:th.danger, marginBottom:8, fontWeight:700}}>Could not load ads data</div>
          <div style={{fontSize:12, color:th.text2, lineHeight:1.7, marginBottom:12}}>{error}</div>
          <div style={{fontSize:12, color:th.text2, lineHeight:1.7}}>
            Ads performance requires the <strong style={{color:th.text}}>ads_read</strong> permission from Meta App Review.
            Connect your Facebook account with ads access to see campaign performance.
          </div>
        </div>
      ) : !adsData ? (
        <div style={{background:th.card, border:`1px solid ${th.border}`, borderRadius:14, padding:32, textAlign:"center"}}>
          <div style={{fontSize:32, marginBottom:16}}>📊</div>
          <div style={{fontSize:14, fontWeight:700, marginBottom:8}}>No Ads Connected</div>
          <div style={{fontSize:12, color:th.text2, lineHeight:1.7, maxWidth:400, margin:"0 auto"}}>
            Connect a Facebook account that has ad account access, then reconnect via Social Accounts to see campaign performance.
          </div>
        </div>
      ) : adsData.campaigns.length === 0 ? (
        <div style={{background:th.card, border:`1px solid ${th.border}`, borderRadius:14, padding:32, textAlign:"center"}}>
          <div style={{fontSize:32, marginBottom:16}}>📭</div>
          <div style={{fontSize:14, fontWeight:700, marginBottom:8}}>No campaigns in the last 30 days</div>
          <div style={{fontSize:12, color:th.text2}}>Create a campaign in Meta Ads Manager to see data here.</div>
        </div>
      ) : (
        <>
          {/* Summary */}
          <div style={{display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:16, marginBottom:24}}>
            {statCard("Total Spend", `$${adsData.summary.totalSpend}`, "Last 30 days", th.danger)}
            {statCard("Total Reach", adsData.summary.totalReach.toLocaleString(), "Unique accounts", "#E1306C")}
            {statCard("Total Clicks", adsData.summary.totalClicks.toLocaleString(), `Avg CPC $${adsData.summary.avgCPC}`, th.accent)}
          </div>
          <div style={{display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:16, marginBottom:24}}>
            {statCard("Impressions", adsData.summary.totalImpressions.toLocaleString(), "Total views", "#A78BFA")}
            {statCard("Avg CPM", `$${adsData.summary.avgCPM}`, "Cost per 1k impressions", th.warning)}
            {statCard("Campaigns", adsData.campaigns.length.toString(), `${adsData.campaigns.filter(c=>c.status==='ACTIVE').length} active`, th.success)}
          </div>

          {/* Campaigns table */}
          <div style={{background:th.card, border:`1px solid ${th.border}`, borderRadius:14, overflow:"hidden"}}>
            <div style={{padding:"16px 20px", borderBottom:`1px solid ${th.border}`, fontSize:13, fontWeight:700}}>Campaigns</div>
            <div style={{overflowX:"auto"}}>
              <table style={{width:"100%", borderCollapse:"collapse", fontSize:12}}>
                <thead>
                  <tr style={{background:th.card2}}>
                    {["Campaign","Status","Objective","Spend","Reach","Impressions","Clicks","CPC"].map(h => (
                      <th key={h} style={{padding:"10px 16px", textAlign:"left", fontWeight:700, color:th.text2, fontSize:11, textTransform:"uppercase", letterSpacing:0.5, whiteSpace:"nowrap"}}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {adsData.campaigns.map((c, i) => (
                    <tr key={c.id} style={{borderTop:`1px solid ${th.border}`, background:i%2===0?"transparent":th.card2}}>
                      <td style={{padding:"12px 16px", fontWeight:600, maxWidth:200, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap"}}>{c.name}</td>
                      <td style={{padding:"12px 16px"}}>
                        <span style={{fontSize:10, fontWeight:700, padding:"3px 8px", borderRadius:20, background:`${statusColor(c.status)}20`, color:statusColor(c.status)}}>{c.status}</span>
                      </td>
                      <td style={{padding:"12px 16px", color:th.text2}}>{c.objective?.replace(/_/g,' ')}</td>
                      <td style={{padding:"12px 16px", fontWeight:700, color:th.danger}}>${c.spend.toFixed(2)}</td>
                      <td style={{padding:"12px 16px"}}>{c.reach.toLocaleString()}</td>
                      <td style={{padding:"12px 16px"}}>{c.impressions.toLocaleString()}</td>
                      <td style={{padding:"12px 16px"}}>{c.clicks.toLocaleString()}</td>
                      <td style={{padding:"12px 16px", color:th.text2}}>${c.cpc.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function ReportsPage() {
  const { selClient, dark } = useApp();
  const th = dark ? DARK : LIGHT;
  const [accounts, setAccounts] = useState([]);
  const [realClientId, setRealClientId] = useState(null);
  const [analyticsData, setAnalyticsData] = useState(null);

  useEffect(() => {
    if (!selClient?.name) return;
    supabase.from('clients').select('id').eq('name', selClient.name).limit(1)
      .then(({ data }) => { if (data && data.length > 0) setRealClientId(data[0].id); });
  }, [selClient]);

  useEffect(() => {
    if (!realClientId) return;
    supabase.from('social_accounts').select('*').eq('client_id', realClientId).neq('is_active', false)
      .then(({ data }) => {
        if (data) {
          setAccounts(data);
          const igAcc = data.find(a => a.platform === 'ig');
          if (igAcc) {
            fetch('/api/instagram-analytics', {
              method: 'POST', headers: {'Content-Type':'application/json'},
              body: JSON.stringify({ accountId: igAcc.account_id, accessToken: igAcc.access_token }),
            }).then(r => r.json()).then(d => { if (!d.error) setAnalyticsData(d); });
          }
        }
      });
  }, [realClientId]);

  const now = new Date();
  const month = now.toLocaleString('default', { month: 'long', year: 'numeric' });
  const totalFollowers = accounts.reduce((s,a)=>s+(a.followers_count||0),0);
  const platforms = [...new Set(accounts.map(a=>a.platform))];

  const exportPDF = () => {

    const igAccounts = accounts.filter(a => a.platform === 'ig');
    const fbAccounts = accounts.filter(a => a.platform === 'fb');
    const topPosts = analyticsData
      ? [...analyticsData.recentPosts].sort((a,b)=>(b.likes+b.comments)-(a.likes+a.comments)).slice(0,5)
      : [];
    const maxEng = topPosts.length ? topPosts[0].likes + topPosts[0].comments : 1;

    const postsHtml = topPosts.map((p, i) => {
      const eng = p.likes + p.comments;
      const pct = Math.round((eng / maxEng) * 100);
      const thumbHtml = p.thumbnail
        ? '<img class="post-thumb" src="' + p.thumbnail + '" alt="" onerror="this.style.display=\'none\'"/>'
        : '<div class="post-thumb-placeholder">📸</div>';
      const cap = (p.caption || '(No caption)').replace(/</g,'&lt;').replace(/>/g,'&gt;');
      const reachHtml = p.reach > 0 ? '<div class="ps"><div class="psv">' + p.reach.toLocaleString() + '</div><div class="psl">Reach</div></div>' : '';
      const savedHtml = (p.saved||0) > 0 ? '<div class="ps"><div class="psv">' + p.saved.toLocaleString() + '</div><div class="psl">Saved</div></div>' : '';
      return '<div class="post-card">' + thumbHtml +
        '<div class="post-body"><div><div class="post-rank">#' + (i+1) + ' Top Post</div>' +
        '<div class="post-cap">' + cap + '</div></div>' +
        '<div><div class="bar-row"><span class="bar-pct">' + pct + '%</span>' +
        '<div class="bar-bg"><div class="bar-fill" style="width:' + pct + '%"></div></div></div>' +
        '<div class="post-stats"><div class="ps"><div class="psv">' + p.likes.toLocaleString() + '</div><div class="psl">Likes</div></div>' +
        '<div class="ps"><div class="psv">' + p.comments.toLocaleString() + '</div><div class="psl">Comments</div></div>' +
        reachHtml + savedHtml + '</div></div></div></div>';
    }).join('');

    const accountsHtml = accounts.map(a =>
      '<tr><td><strong>' + a.account_name + '</strong>' + (a.username ? ' <span style="color:#aaa;font-size:11px">@' + a.username + '</span>' : '') + '</td>' +
      '<td><span class="badge ' + a.platform + '">' + (a.platform === 'ig' ? 'Instagram' : 'Facebook') + '</span></td>' +
      '<td><strong style="font-size:14px">' + (a.followers_count||0).toLocaleString() + '</strong></td>' +
      '<td><span style="color:#059669;font-weight:700;font-size:11px">&#9679; Active</span></td></tr>'
    ).join('');

    const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>${selClient?.name} — ${month} Social Media Report</title>
<style>
  @page{margin:0;size:A4}
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:'Segoe UI',Helvetica,Arial,sans-serif;background:#fff;color:#1a1a2e}
  .cover{min-height:100vh;background:linear-gradient(135deg,#0f0c29 0%,#302b63 50%,#24243e 100%);display:flex;flex-direction:column;justify-content:space-between;padding:60px;page-break-after:always}
  .cover-logo{display:flex;align-items:center;gap:14px}
  .cover-logo img{width:48px;height:48px;object-fit:contain}
  .cover-logo-text{font-size:36px;font-weight:900;color:#fff;letter-spacing:-1px}
  .cover-tag{font-size:12px;color:rgba(255,255,255,.4);margin-top:8px;letter-spacing:3px;text-transform:uppercase}
  .cover-label{font-size:11px;color:rgba(255,255,255,.35);text-transform:uppercase;letter-spacing:2px;margin-bottom:12px}
  .cover-client{font-size:48px;font-weight:900;color:#fff;line-height:1.1;margin-bottom:16px}
  .cover-sub{font-size:18px;color:rgba(255,255,255,.55);margin-bottom:32px}
  .cover-pill{display:inline-block;background:rgba(79,110,247,.2);border:1px solid rgba(79,110,247,.5);color:#8ba4fa;padding:10px 22px;border-radius:30px;font-size:13px;font-weight:600}
  .cover-ft{display:flex;justify-content:space-between;align-items:flex-end}
  .cover-ft-l{font-size:10px;color:rgba(255,255,255,.25);line-height:1.8}
  .cover-ft-r{font-size:10px;color:rgba(255,255,255,.25)}
  .page{padding:50px;page-break-after:always}
  .page:last-child{page-break-after:auto}
  .ph{display:flex;justify-content:space-between;align-items:center;margin-bottom:36px;padding-bottom:14px;border-bottom:2px solid #f0f0f0}
  .ph-logo{display:flex;align-items:center;gap:7px;font-size:14px;font-weight:900;color:#4F6EF7}
  .ph-logo img{width:22px;height:22px;object-fit:contain}
  .ph-info{font-size:10px;color:#aaa;text-align:right;line-height:1.6}
  .sec{margin-bottom:32px}
  .sec-title{font-size:10px;font-weight:700;color:#4F6EF7;text-transform:uppercase;letter-spacing:2.5px;margin-bottom:14px}
  .sg4{display:grid;grid-template-columns:repeat(4,1fr);gap:14px}
  .sc{background:#f8f9ff;border-radius:12px;padding:20px 16px;text-align:center;border:1px solid #e8ecff}
  .sv{font-size:26px;font-weight:900;color:#1a1a2e}
  .sv.a{color:#4F6EF7}.sv.ig{color:#E1306C}.sv.fb{color:#1877F2}.sv.g{color:#059669}.sv.p{color:#A78BFA}.sv.o{color:#F59E0B}
  .sl{font-size:10px;color:#999;margin-top:6px;text-transform:uppercase;letter-spacing:.5px;font-weight:600}
  table{width:100%;border-collapse:collapse}
  th{padding:10px 16px;text-align:left;font-size:10px;font-weight:700;color:#999;text-transform:uppercase;letter-spacing:.5px;background:#f8f9ff}
  td{padding:13px 16px;border-bottom:1px solid #f5f5f5;font-size:12px}
  .badge{display:inline-block;padding:3px 10px;border-radius:20px;font-size:10px;font-weight:700}
  .badge.ig{background:#fce4ec;color:#c2185b}.badge.fb{background:#e3f2fd;color:#1565c0}
  .post-card{display:flex;margin-bottom:14px;border:1px solid #eee;border-radius:12px;overflow:hidden}
  .post-thumb{width:120px;min-width:120px;height:120px;object-fit:cover;display:block}
  .post-thumb-placeholder{width:120px;min-width:120px;height:120px;background:linear-gradient(135deg,#e8ecff,#f0f4ff);display:flex;align-items:center;justify-content:center;font-size:30px;flex-shrink:0}
  .post-body{flex:1;padding:14px 18px;display:flex;flex-direction:column;justify-content:space-between}
  .post-rank{font-size:10px;font-weight:700;color:#4F6EF7;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:6px}
  .post-cap{font-size:11px;color:#333;line-height:1.7;overflow:hidden;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical}
  .bar-row{display:flex;align-items:center;gap:10px;margin-top:10px;margin-bottom:8px}
  .bar-pct{font-size:10px;font-weight:700;color:#4F6EF7;min-width:30px}
  .bar-bg{flex:1;height:5px;background:#eee;border-radius:3px}
  .bar-fill{height:5px;border-radius:3px;background:linear-gradient(90deg,#4F6EF7,#a78bfa)}
  .post-stats{display:flex;gap:18px}
  .psv{font-size:17px;font-weight:900;color:#1a1a2e}
  .psl{font-size:9px;color:#aaa;margin-top:1px;text-transform:uppercase;letter-spacing:.5px}
  .ft{margin-top:36px;padding-top:14px;border-top:1px solid #eee;display:flex;justify-content:space-between}
  .ft div{font-size:10px;color:#ccc}
  @media print{.page{padding:30px}}
</style>
</head>
<body>

<div class="cover">
  <div>
    <div class="cover-logo">
      <img src="https://www.tawaslo.com/logo-transparent.png" alt="Tawaslo"/>
      <div class="cover-logo-text">Tawaslo</div>
    </div>
    <div class="cover-tag">Social Intelligence Platform</div>
  </div>
  <div>
    <div class="cover-label">Monthly Social Media Report</div>
    <div class="cover-client">${selClient?.name}</div>
    <div class="cover-sub">Performance Analysis &amp; Insights</div>
    <div class="cover-pill">&#128197; ${month}</div>
  </div>
  <div class="cover-ft">
    <div class="cover-ft-l">
      Generated on ${now.toLocaleDateString('en-US',{weekday:'long',year:'numeric',month:'long',day:'numeric'})}<br/>
      Confidential &#8212; Prepared by Tawaslo
    </div>
    <div class="cover-ft-r">tawaslo.com</div>
  </div>
</div>

<div class="page">
  <div class="ph">
    <div class="ph-logo"><img src="https://www.tawaslo.com/logo-transparent.png" alt=""/>Tawaslo</div>
    <div class="ph-info">${selClient?.name}<br/>${month} &middot; Performance Overview</div>
  </div>

  <div class="sec">
    <div class="sec-title">Audience Overview</div>
    <div class="sg4">
      <div class="sc"><div class="sv a">${totalFollowers.toLocaleString()}</div><div class="sl">Total Followers</div></div>
      <div class="sc"><div class="sv">${accounts.length}</div><div class="sl">Connected Accounts</div></div>
      <div class="sc"><div class="sv ig">${igAccounts.reduce((s,a)=>s+(a.followers_count||0),0).toLocaleString()}</div><div class="sl">Instagram</div></div>
      <div class="sc"><div class="sv fb">${fbAccounts.reduce((s,a)=>s+(a.followers_count||0),0).toLocaleString()}</div><div class="sl">Facebook</div></div>
    </div>
  </div>

  ${analyticsData ? `<div class="sec">
    <div class="sec-title">Engagement &mdash; Last 30 Days</div>
    <div class="sg4">
      <div class="sc"><div class="sv ig">${analyticsData.summary.totalReach.toLocaleString()}</div><div class="sl">Total Reach</div></div>
      <div class="sc"><div class="sv p">${analyticsData.summary.totalImpressions.toLocaleString()}</div><div class="sl">Impressions</div></div>
      <div class="sc"><div class="sv o">${analyticsData.summary.totalLikes.toLocaleString()}</div><div class="sl">Total Likes</div></div>
      <div class="sc"><div class="sv g">${analyticsData.summary.engagementRate}%</div><div class="sl">Engagement Rate</div></div>
    </div>
  </div>` : ''}

  <div class="sec">
    <div class="sec-title">Connected Accounts</div>
    <table>
      <thead><tr><th>Account</th><th>Platform</th><th>Followers</th><th>Status</th></tr></thead>
      <tbody>${accountsHtml}</tbody>
    </table>
  </div>

  <div class="ft">
    <div>Tawaslo &mdash; Social Intelligence Platform &middot; tawaslo.com</div>
    <div>Confidential &middot; ${selClient?.name}</div>
  </div>
</div>

${topPosts.length > 0 ? `<div class="page">
  <div class="ph">
    <div class="ph-logo"><img src="https://www.tawaslo.com/logo-transparent.png" alt=""/>Tawaslo</div>
    <div class="ph-info">${selClient?.name}<br/>${month} &middot; Top Performing Posts</div>
  </div>
  <div class="sec">
    <div class="sec-title">Top Posts &mdash; Last 30 Days</div>
    ${postsHtml}
  </div>
  <div class="ft">
    <div>Tawaslo &mdash; Social Intelligence Platform &middot; tawaslo.com</div>
    <div>Confidential &middot; ${selClient?.name}</div>
  </div>
</div>` : ''}

<script>window.onload=function(){window.print();}</script>
</body>
</html>`;
    const w = window.open('', '_blank');
    w.document.write(html);
    w.document.close();
  };

  return (
    <div style={{padding:"28px 32px", maxWidth:900}}>
      <div style={{marginBottom:24, display:"flex", justifyContent:"space-between", alignItems:"center"}}>
        <div>
          <h2 style={{margin:0, fontSize:22, fontWeight:900}}>Reports</h2>
          <p style={{margin:"6px 0 0", fontSize:13, color:th.text2}}>Monthly summary for {selClient?.name}</p>
        </div>
        <button onClick={exportPDF} style={{padding:"10px 20px", borderRadius:10, background:th.gradient, border:"none", color:"#fff", fontSize:12, fontWeight:700, cursor:"pointer", display:"flex", alignItems:"center", gap:6}}>
          <Download size={14}/> Export PDF
        </button>
      </div>
      <div style={{background:th.card, border:`1px solid ${th.border}`, borderRadius:14, padding:24, marginBottom:16}}>
        <div style={{fontSize:14, fontWeight:700, marginBottom:4}}>{month} Report</div>
        <div style={{fontSize:12, color:th.text2, marginBottom:20}}>Social media performance summary</div>
        <div style={{display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:16}}>
          {[["Connected Accounts", accounts.length, th.accent],["Total Followers", accounts.reduce((s,a)=>s+(a.followers_count||0),0).toLocaleString(), th.success],["Platforms", [...new Set(accounts.map(a=>a.platform))].length, th.warning]].map(([label,val,color])=>(
            <div key={label} style={{background:th.card2, borderRadius:10, padding:16, textAlign:"center"}}>
              <div style={{fontSize:24, fontWeight:900, color}}>{val}</div>
              <div style={{fontSize:11, color:th.text2, marginTop:4}}>{label}</div>
            </div>
          ))}
        </div>
      </div>
      <div style={{background:th.card, border:`1px solid ${th.border}`, borderRadius:14, padding:20}}>
        <div style={{fontSize:13, fontWeight:700, marginBottom:12}}>Account Breakdown</div>
        {accounts.length === 0 ? <div style={{fontSize:13, color:th.text2}}>No accounts connected.</div> : accounts.map(acc => (
          <div key={acc.id} style={{display:"flex", justifyContent:"space-between", padding:"10px 0", borderBottom:`1px solid ${th.border}`}}>
            <div style={{fontSize:13}}>{acc.account_name}</div>
            <div style={{fontSize:13, fontWeight:700, color:acc.platform==='ig'?"#E1306C":"#1877F2"}}>{(acc.followers_count||0).toLocaleString()} followers</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function InboxPage() {
  const { selClient, dark } = useApp();
  const th = dark ? DARK : LIGHT;
  const [accounts, setAccounts] = useState([]);
  const [messages, setMessages] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all');
  const [reply, setReply] = useState('');
  const [replying, setReplying] = useState(false);
  const [replyError, setReplyError] = useState('');
  const [replySuccess, setReplySuccess] = useState(false);
  const [realClientId, setRealClientId] = useState(null);

  useEffect(() => {
    console.log('[Inbox] selClient:', selClient?.name);
    if (!selClient?.name) return;
    supabase.from('clients').select('id').eq('name', selClient.name).limit(1)
      .then(({ data, error }) => {
        console.log('[Inbox] clients result:', data, error);
        if (data?.[0]) setRealClientId(data[0].id);
      });
  }, [selClient]);

  useEffect(() => {
    console.log('[Inbox] realClientId:', realClientId);
    if (!realClientId) return;
    supabase.from('social_accounts').select('*').eq('client_id', realClientId).neq('is_active', false)
      .then(({ data, error }) => {
        console.log('[Inbox] accounts result:', data, error);
        if (data) setAccounts(data);
      });
  }, [realClientId]);

  useEffect(() => {
    console.log('[Inbox] accounts:', accounts.length);
    if (accounts.length === 0) return;
    fetchInbox();
  }, [accounts]);

  const sendReply = async () => {
    if (!reply.trim() || !selected || selected.type === 'dm') return;
    const acc = accounts.find(a => a.platform === 'ig');
    if (!acc) return;
    setReplying(true); setReplyError(''); setReplySuccess(false);
    try {
      const res = await fetch('/api/instagram-reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commentId: selected.id, message: reply, accessToken: acc.access_token }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setReply('');
      setReplySuccess(true);
      setTimeout(() => setReplySuccess(false), 3000);
    } catch(e) {
      setReplyError(e.message);
    }
    setReplying(false);
  };

  const fetchInbox = async () => {
    setLoading(true);
    const allMessages = [];
    for (const acc of accounts.filter(a => a.platform === 'ig')) {
      try {
        const res = await fetch('/api/instagram-inbox', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ accountId: acc.account_id, accessToken: acc.access_token, type: 'comments' }),
        });
        const data = await res.json();
        console.log('[Inbox] API response:', JSON.stringify(data));
        if (data.data) allMessages.push(...data.data.map(m => ({ ...m, accountName: acc.account_name })));
      } catch(e) { console.warn('Inbox fetch error:', e); }
    }
    allMessages.sort((a, b) => new Date(b.time) - new Date(a.time));
    setMessages(allMessages);
    if (allMessages.length > 0) setSelected(allMessages[0]);
    setLoading(false);
  };

  const formatTime = (ts) => {
    if (!ts) return '';
    const d = new Date(ts);
    const now = new Date();
    const diff = (now - d) / 1000;
    if (diff < 3600) return `${Math.floor(diff/60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff/3600)}h ago`;
    return `${Math.floor(diff/86400)}d ago`;
  };

  const filtered = filter === 'all' ? messages : messages.filter(m => m.type === filter);

  return (
    <div style={{padding:"28px 32px", maxWidth:1200}}>
      <div style={{marginBottom:20, display:"flex", justifyContent:"space-between", alignItems:"center"}}>
        <div>
          <h2 style={{margin:0, fontSize:22, fontWeight:900}}>Inbox</h2>
          <p style={{margin:"6px 0 0", fontSize:13, color:th.text2}}>Real-time comments and messages for {selClient?.name}</p>
        </div>
        <div style={{display:"flex", gap:8}}>
          {['all','comment','dm'].map(f => (
            <button key={f} onClick={()=>setFilter(f)} style={{padding:"6px 14px", borderRadius:20, border:`1px solid ${filter===f?th.accent:th.border}`, background:filter===f?th.accentSoft:"transparent", color:filter===f?th.accent:th.text2, fontSize:11, fontWeight:600, cursor:"pointer"}}>
              {f==='all'?'All':f==='comment'?'Comments':'DMs'}
            </button>
          ))}
          <button onClick={fetchInbox} disabled={loading} style={{padding:"6px 14px", borderRadius:20, border:`1px solid ${th.border}`, background:"transparent", color:th.text2, fontSize:11, cursor:"pointer", display:"flex", alignItems:"center", gap:4}}>
            <RefreshCw size={11}/>{loading?'Loading…':'Refresh'}
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{textAlign:"center", padding:60, color:th.text2, fontSize:13}}>Loading inbox...</div>
      ) : messages.length === 0 ? (
        <div style={{textAlign:"center", padding:60, color:th.text2, fontSize:13}}>
          <MessageCircle size={32} style={{marginBottom:12, opacity:0.3}}/>
          <div>No messages yet. Comments and DMs will appear here once your Instagram account receives activity.</div>
          {accounts.filter(a=>a.platform==='ig').length === 0 && (
            <div style={{marginTop:8, fontSize:12, color:th.danger}}>No Instagram accounts connected for this client.</div>
          )}
        </div>
      ) : (
        <div style={{display:"grid", gridTemplateColumns:"340px 1fr", gap:16, height:560}}>
          <div style={{background:th.card, border:`1px solid ${th.border}`, borderRadius:14, overflowY:"auto"}}>
            {filtered.map(msg => (
              <div key={msg.id} onClick={()=>setSelected(msg)} style={{padding:"14px 16px", borderBottom:`1px solid ${th.border}`, cursor:"pointer", background:selected?.id===msg.id?th.accentSoft:"transparent", transition:"background 0.15s"}}>
                <div style={{display:"flex", justifyContent:"space-between", marginBottom:4}}>
                  <div style={{fontSize:12, fontWeight:700, color:th.text, display:"flex", alignItems:"center", gap:6}}>
                    <FaInstagram style={{color:"#E1306C", fontSize:10}}/>
                    @{msg.from}
                  </div>
                  <div style={{fontSize:10, color:th.text2}}>{formatTime(msg.time)}</div>
                </div>
                <div style={{fontSize:11, color:th.text2, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis"}}>{msg.text}</div>
                {msg.mediaCaption && <div style={{fontSize:9, color:th.text3, marginTop:3}}>On: {msg.mediaCaption}...</div>}
                <div style={{marginTop:4, display:"flex", gap:4}}>
                  <span style={{fontSize:9, fontWeight:700, color:"#E1306C", background:"rgba(225,48,108,0.1)", padding:"2px 6px", borderRadius:4}}>
                    {msg.type === 'dm' ? 'DM' : 'Comment'}
                  </span>
                  {msg.likeCount > 0 && <span style={{fontSize:9, color:th.text2}}>❤️ {msg.likeCount}</span>}
                </div>
              </div>
            ))}
          </div>

          <div style={{background:th.card, border:`1px solid ${th.border}`, borderRadius:14, padding:20, display:"flex", flexDirection:"column"}}>
            {selected ? (
              <>
                <div style={{display:"flex", alignItems:"center", gap:10, marginBottom:16, paddingBottom:16, borderBottom:`1px solid ${th.border}`}}>
                  <div style={{width:38, height:38, borderRadius:"50%", background:"rgba(225,48,108,0.15)", display:"flex", alignItems:"center", justifyContent:"center"}}>
                    <FaInstagram style={{color:"#E1306C", fontSize:16}}/>
                  </div>
                  <div>
                    <div style={{fontSize:13, fontWeight:700, color:th.text}}>@{selected.from}</div>
                    <div style={{fontSize:11, color:th.text2}}>Instagram {selected.type === 'dm' ? 'DM' : 'Comment'} · {formatTime(selected.time)}</div>
                  </div>
                </div>
                <div style={{flex:1, overflowY:"auto", marginBottom:16}}>
                  <div style={{background:th.card2, borderRadius:10, padding:16, fontSize:13, color:th.text, lineHeight:1.6, marginBottom:12}}>{selected.text}</div>
                  {selected.replies?.length > 0 && (
                    <div style={{marginLeft:16}}>
                      <div style={{fontSize:11, color:th.text2, marginBottom:8}}>Replies:</div>
                      {selected.replies.map(r => (
                        <div key={r.id} style={{background:th.card2, borderRadius:8, padding:"10px 14px", fontSize:12, color:th.text, marginBottom:6, borderLeft:`3px solid ${th.accent}`}}>
                          <span style={{fontWeight:700}}>@{r.username}</span>: {r.text}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {replySuccess && <div style={{fontSize:12, color:th.success, marginBottom:8, fontWeight:600}}>✓ Reply posted successfully!</div>}
                {replyError && <div style={{fontSize:12, color:th.danger, marginBottom:8}}>{replyError}</div>}
                <div style={{display:"flex", gap:8}}>
                  <input
                    value={reply}
                    onChange={e=>{setReply(e.target.value); setReplyError('');}}
                    onKeyDown={e=>e.key==='Enter'&&sendReply()}
                    placeholder={selected.type==='dm'?"DM replies coming soon…":"Type a reply…"}
                    disabled={selected.type==='dm'||replying}
                    style={{flex:1, padding:"10px 14px", borderRadius:8, border:`1px solid ${th.border}`, background:th.card2, color:th.text, fontSize:13, outline:"none", opacity:selected.type==='dm'?0.5:1}}
                  />
                  <button
                    onClick={sendReply}
                    disabled={!reply.trim()||replying||selected.type==='dm'}
                    style={{padding:"10px 20px", borderRadius:8, background:th.gradient, border:"none", color:"#fff", fontSize:12, fontWeight:700, cursor:"pointer", opacity:(!reply.trim()||replying||selected.type==='dm')?0.5:1}}
                  >{replying?'Sending…':'Reply'}</button>
                </div>
                <div style={{fontSize:10, color:th.text3, marginTop:6}}>
                  {selected.type==='dm'?'DM replies require instagram_manage_messages (pending Meta approval).':'Requires instagram_manage_comments (pending Meta approval).'}
                </div>
              </>
            ) : (
              <div style={{display:"flex", alignItems:"center", justifyContent:"center", height:"100%", color:th.text2, fontSize:13}}>Select a message to view</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function TeamPage() {
  const { dark } = useApp();
  const th = dark ? DARK : LIGHT;
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const team = [
    { name:"Abdulla Al-Nahas", email:"theoctopus.bh@gmail.com", role:"Owner", joined:"Jan 2025", avatar:"A" },
    { name:"Agency Manager", email:"manager@octofusion.bh", role:"Admin", joined:"Mar 2025", avatar:"M" },
  ];

  return (
    <div style={{padding:"28px 32px", maxWidth:800}}>
      <div style={{marginBottom:24, display:"flex", justifyContent:"space-between", alignItems:"center"}}>
        <div>
          <h2 style={{margin:0, fontSize:22, fontWeight:900}}>Team</h2>
          <p style={{margin:"6px 0 0", fontSize:13, color:th.text2}}>Manage your team members</p>
        </div>
        <button onClick={()=>setShowInvite(!showInvite)} style={{padding:"10px 20px", borderRadius:10, background:th.gradient, border:"none", color:"#fff", fontSize:12, fontWeight:700, cursor:"pointer", display:"flex", alignItems:"center", gap:6}}>
          <UserPlus size={14}/> Invite Member
        </button>
      </div>
      {showInvite && (
        <div style={{background:th.card, border:`1px solid ${th.border}`, borderRadius:14, padding:20, marginBottom:16}}>
          <div style={{fontSize:13, fontWeight:700, marginBottom:12}}>Invite Team Member</div>
          <div style={{display:"flex", gap:8}}>
            <input value={inviteEmail} onChange={e=>setInviteEmail(e.target.value)} placeholder="Email address" style={{flex:1, padding:"10px 14px", borderRadius:8, border:`1px solid ${th.border}`, background:th.card2, color:th.text, fontSize:13, outline:"none"}}/>
            <select style={{padding:"10px 14px", borderRadius:8, border:`1px solid ${th.border}`, background:th.card2, color:th.text, fontSize:13, outline:"none"}}>
              <option>Admin</option><option>Editor</option><option>Viewer</option>
            </select>
            <button onClick={()=>{alert("Invite sent to "+inviteEmail); setInviteEmail(""); setShowInvite(false);}} style={{padding:"10px 20px", borderRadius:8, background:th.accent, border:"none", color:"#fff", fontSize:12, fontWeight:700, cursor:"pointer"}}>Send</button>
          </div>
        </div>
      )}
      <div style={{background:th.card, border:`1px solid ${th.border}`, borderRadius:14, overflow:"hidden"}}>
        <div style={{display:"grid", gridTemplateColumns:"1fr 1fr 120px 120px 80px", padding:"12px 20px", borderBottom:`1px solid ${th.border}`, fontSize:11, fontWeight:700, color:th.text2, textTransform:"uppercase"}}>
          <div>Member</div><div>Email</div><div>Role</div><div>Joined</div><div></div>
        </div>
        {team.map((m,i) => (
          <div key={i} style={{display:"grid", gridTemplateColumns:"1fr 1fr 120px 120px 80px", padding:"14px 20px", borderBottom:i<team.length-1?`1px solid ${th.border}`:"none", alignItems:"center"}}>
            <div style={{display:"flex", alignItems:"center", gap:10}}>
              <div style={{width:32, height:32, borderRadius:"50%", background:th.gradient, display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:700, color:"#fff"}}>{m.avatar}</div>
              <div style={{fontSize:13, fontWeight:600}}>{m.name}</div>
            </div>
            <div style={{fontSize:12, color:th.text2}}>{m.email}</div>
            <div><span style={{fontSize:11, fontWeight:700, padding:"3px 10px", borderRadius:20, background:m.role==="Owner"?`${th.accent}20`:th.card2, color:m.role==="Owner"?th.accent:th.text2}}>{m.role}</span></div>
            <div style={{fontSize:12, color:th.text2}}>{m.joined}</div>
            <div>{m.role!=="Owner"&&<button style={{fontSize:11, color:th.danger, background:"none", border:"none", cursor:"pointer"}}>Remove</button>}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function BillingPage() {
  const { dark } = useApp();
  const th = dark ? DARK : LIGHT;
  const plans = [
    { name:"Essential", price:"49", accounts:3, users:1, posts:30, current:true },
    { name:"Professional", price:"99", accounts:10, users:5, posts:100, current:false },
    { name:"Enterprise", price:"199", accounts:999, users:20, posts:999, current:false },
  ];

  return (
    <div style={{padding:"28px 32px", maxWidth:900}}>
      <div style={{marginBottom:24}}>
        <h2 style={{margin:0, fontSize:22, fontWeight:900}}>Billing</h2>
        <p style={{margin:"6px 0 0", fontSize:13, color:th.text2}}>Manage your subscription</p>
      </div>
      <div style={{background:th.card, border:`1px solid ${th.border}`, borderRadius:14, padding:20, marginBottom:24, display:"flex", justifyContent:"space-between", alignItems:"center"}}>
        <div>
          <div style={{fontSize:13, fontWeight:700}}>Current Plan: <span style={{color:th.accent}}>Essential</span></div>
          <div style={{fontSize:12, color:th.text2, marginTop:4}}>Next billing date: July 1, 2026</div>
        </div>
        <div style={{fontSize:24, fontWeight:900, color:th.accent}}>$49<span style={{fontSize:12, fontWeight:400, color:th.text2}}>/mo</span></div>
      </div>
      <div style={{display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:16}}>
        {plans.map(plan => (
          <div key={plan.name} style={{background:th.card, border:`2px solid ${plan.current?th.accent:th.border}`, borderRadius:14, padding:24, position:"relative"}}>
            {plan.current && <div style={{position:"absolute", top:12, right:12, fontSize:10, fontWeight:700, background:th.accent, color:"#fff", padding:"3px 8px", borderRadius:10}}>CURRENT</div>}
            <div style={{fontSize:16, fontWeight:800, marginBottom:8}}>{plan.name}</div>
            <div style={{fontSize:28, fontWeight:900, color:plan.current?th.accent:th.text, marginBottom:16}}>{plan.price} <span style={{fontSize:13, fontWeight:400, color:th.text2}}>USD/mo</span></div>
            <div style={{fontSize:12, color:th.text2, lineHeight:2}}>
              <div>✓ {plan.accounts===999?"Unlimited":plan.accounts} social accounts</div>
              <div>✓ {plan.users} team member{plan.users>1?"s":""}</div>
              <div>✓ {plan.posts===999?"Unlimited":plan.posts} posts/month</div>
              <div>✓ AI caption generator</div>
              <div>✓ Analytics dashboard</div>
            </div>
            {!plan.current && <button style={{width:"100%", marginTop:16, padding:"10px", borderRadius:8, background:th.gradient, border:"none", color:"#fff", fontSize:12, fontWeight:700, cursor:"pointer"}}>Upgrade</button>}
          </div>
        ))}
      </div>
    </div>
  );
}

function SettingsPage() {
  const { dark, setDark, lang, setLang } = useApp();
  const th = dark ? DARK : LIGHT;
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [userId, setUserId] = useState(null);
  const [agencyName, setAgencyName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [website, setWebsite] = useState("");

  // Load the signed-in user's profile from Supabase
  useEffect(() => {
    let active = true;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !active) { setLoading(false); return; }
      setUserId(user.id);
      const { data: profile } = await getProfile(user.id);
      if (!active) return;
      setAgencyName(profile?.company_name || profile?.name || "");
      setContactEmail(profile?.email || user.email || "");
      setWebsite(profile?.website || "");
      setLoading(false);
    })();
    return () => { active = false; };
  }, []);

  const handleSave = async () => {
    if (!userId || saving) return;
    setSaving(true); setErr("");
    const { error } = await updateProfile(userId, { company_name: agencyName, email: contactEmail });
    await updateProfile(userId, { website });
    setSaving(false);
    if (error) { setErr(error.message || "Could not save. Please try again."); return; }
    setSaved(true); setTimeout(()=>setSaved(false), 2000);
  };

  const fieldStyle = {width:"100%", padding:"10px 14px", borderRadius:8, border:`1px solid ${th.border}`, background:th.card2, color:th.text, fontSize:13, outline:"none", boxSizing:"border-box"};

  return (
    <div style={{padding:"28px 32px", maxWidth:700}}>
      <div style={{marginBottom:24}}>
        <h2 style={{margin:0, fontSize:22, fontWeight:900}}>Settings</h2>
        <p style={{margin:"6px 0 0", fontSize:13, color:th.text2}}>Account and app preferences</p>
      </div>
      <div style={{display:"flex", flexDirection:"column", gap:16}}>
        <div style={{background:th.card, border:`1px solid ${th.border}`, borderRadius:14, padding:20}}>
          <div style={{fontSize:13, fontWeight:700, marginBottom:16}}>Appearance</div>
          <div style={{display:"flex", justifyContent:"space-between", alignItems:"center"}}>
            <div>
              <div style={{fontSize:13}}>Dark Mode</div>
              <div style={{fontSize:11, color:th.text2}}>Toggle between dark and light theme</div>
            </div>
            <button onClick={()=>setDark(!dark)} style={{width:44, height:24, borderRadius:12, background:dark?th.accent:th.border, border:"none", cursor:"pointer", position:"relative"}}>
              <div style={{position:"absolute", top:3, left:dark?22:3, width:18, height:18, borderRadius:"50%", background:"#fff", transition:"left 0.2s"}}/>
            </button>
          </div>
        </div>
        <div style={{background:th.card, border:`1px solid ${th.border}`, borderRadius:14, padding:20}}>
          <div style={{fontSize:13, fontWeight:700, marginBottom:16}}>Language</div>
          <div style={{display:"flex", gap:8}}>
            {["en","ar"].map(l => (
              <button key={l} onClick={()=>setLang(l)} style={{padding:"8px 20px", borderRadius:8, border:`2px solid ${lang===l?th.accent:th.border}`, background:lang===l?th.accentSoft:"transparent", color:lang===l?th.accent:th.text2, fontSize:13, fontWeight:600, cursor:"pointer"}}>
                {l==="en"?"English":"العربية"}
              </button>
            ))}
          </div>
        </div>
        <div style={{background:th.card, border:`1px solid ${th.border}`, borderRadius:14, padding:20}}>
          <div style={{fontSize:13, fontWeight:700, marginBottom:16}}>Agency Info</div>
          <div style={{display:"flex", flexDirection:"column", gap:12}}>
            <div>
              <div style={{fontSize:11, color:th.text2, marginBottom:4}}>Agency Name</div>
              <input value={agencyName} disabled={loading} onChange={e=>setAgencyName(e.target.value)} placeholder={loading?"Loading…":"Your agency name"} style={fieldStyle}/>
            </div>
            <div>
              <div style={{fontSize:11, color:th.text2, marginBottom:4}}>Contact Email</div>
              <input type="email" value={contactEmail} disabled={loading} onChange={e=>setContactEmail(e.target.value)} placeholder={loading?"Loading…":"you@example.com"} style={fieldStyle}/>
            </div>
            <div>
              <div style={{fontSize:11, color:th.text2, marginBottom:4}}>Website</div>
              <input value={website} disabled={loading} onChange={e=>setWebsite(e.target.value)} placeholder={loading?"Loading…":"yoursite.com"} style={fieldStyle}/>
            </div>
          </div>
          {err && <div style={{marginTop:10, fontSize:12, color:th.danger}}>{err}</div>}
          <button onClick={handleSave} disabled={saving||loading} style={{marginTop:16, padding:"10px 24px", borderRadius:8, background:saved?th.success:th.gradient, border:"none", color:"#fff", fontSize:12, fontWeight:700, cursor:(saving||loading)?"not-allowed":"pointer", opacity:(saving||loading)?0.7:1}}>
            {saved?"✓ Saved!":saving?"Saving…":"Save Changes"}
          </button>
        </div>
        <div style={{background:th.card, border:`1px solid ${th.border}`, borderRadius:14, padding:20}}>
          <div style={{fontSize:13, fontWeight:700, marginBottom:4}}>Danger Zone</div>
          <div style={{fontSize:12, color:th.text2, marginBottom:12}}>These actions cannot be undone.</div>
          <button style={{padding:"8px 16px", borderRadius:8, border:`1px solid ${th.danger}`, background:"transparent", color:th.danger, fontSize:12, fontWeight:600, cursor:"pointer"}}>Delete Account</button>
        </div>
      </div>
    </div>
  );
}

function LandingPage({ onGetStarted, onLogin }) {
  const [landingPage, setLandingPage] = useState('home');
  const [billing, setBilling] = useState('monthly');
  const prices = { monthly:{starter:49,pro:99,agency:199}, yearly:{starter:39,pro:79,agency:159} };
  const p = prices[billing];

  const navLink = (id, label) => (
    <span onClick={()=>setLandingPage(id)} style={{color:landingPage===id?"#E8EFF8":"#7A8BA8", fontSize:14, fontWeight:600, cursor:"pointer", borderBottom:landingPage===id?"2px solid #4F6EF7":"2px solid transparent", paddingBottom:2}}>{label}</span>
  );

  const Logo = () => (
    <div style={{cursor:"pointer",display:"flex",alignItems:"center",gap:10}} onClick={()=>setLandingPage('home')}>
      <img src="/logo-transparent.png" alt="Tawaslo" style={{height:38,objectFit:"contain"}}/>
      <span style={{fontSize:20,fontWeight:900,color:"#E8EFF8",letterSpacing:-0.5}}>Tawaslo</span>
    </div>
  );

  const Nav = () => (
    <nav style={{position:"sticky",top:0,zIndex:100,background:"rgba(7,9,15,0.97)",borderBottom:"1px solid #1C2D45",padding:"0 32px",height:58,display:"flex",alignItems:"center",justifyContent:"space-between",backdropFilter:"blur(12px)"}}>
      <Logo/>
      <div style={{display:"flex",alignItems:"center",gap:28}}>
        {navLink('home','Home')}
        {navLink('features','Features')}
        {navLink('pricing','Pricing')}
        {navLink('about','About')}
        {navLink('contact','Contact')}
      </div>
      <div style={{display:"flex",gap:10}}>
        <button onClick={onLogin} style={{padding:"8px 18px",borderRadius:8,background:"transparent",border:"1px solid #1C2D45",color:"#E8EFF8",fontSize:13,fontWeight:600,cursor:"pointer"}}>Log In</button>
        <button onClick={onGetStarted} style={{padding:"8px 18px",borderRadius:8,background:"linear-gradient(135deg,#4F6EF7,#7C3AED)",border:"none",color:"#fff",fontSize:13,fontWeight:700,cursor:"pointer"}}>Start Free Trial</button>
      </div>
    </nav>
  );

  const Footer = () => (
    <div style={{background:"#07090F",borderTop:"1px solid #1C2D45",padding:"24px 32px",display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:12}}>
      <div style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer"}} onClick={()=>setLandingPage('home')}><img src="/logo-transparent.png" alt="Tawaslo" style={{height:30,objectFit:"contain"}}/><span style={{fontSize:16,fontWeight:900,color:"#E8EFF8"}}>Tawaslo</span></div>
      <div style={{fontSize:11,color:"#3D5068"}}>© 2026 Tawaslo. All rights reserved.</div>
      <div style={{display:"flex",gap:20}}>
        {['Privacy','Terms','Contact'].map(l=><span key={l} onClick={()=>setLandingPage(l.toLowerCase())} style={{fontSize:11,color:"#3D5068",cursor:"pointer"}}>{l}</span>)}
      </div>
    </div>
  );

  const grad = {background:"linear-gradient(135deg,#4F6EF7,#7C3AED)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"};
  const card = {background:"#101828",border:"1px solid #1C2D45",borderRadius:14,padding:22};

  const PlanCard = ({name,desc,price,features,popular,extra=[],planKey}) => (
    <div style={{background:"#101828",border:`2px solid ${popular?"#4F6EF7":"#1C2D45"}`,borderRadius:16,padding:24,position:"relative"}}>
      {popular&&<div style={{position:"absolute",top:-12,left:"50%",transform:"translateX(-50%)",background:"linear-gradient(135deg,#4F6EF7,#7C3AED)",color:"#fff",fontSize:10,fontWeight:700,padding:"4px 16px",borderRadius:20,whiteSpace:"nowrap"}}>MOST POPULAR</div>}
      <div style={{fontSize:15,fontWeight:800,marginBottom:4}}>{name}</div>
      <div style={{fontSize:12,color:"#7A8BA8",marginBottom:16}}>{desc}</div>
      <div style={{marginBottom:8}}><span style={{fontSize:34,fontWeight:900,color:popular?"#4F6EF7":"#E8EFF8"}}>${price}</span><span style={{fontSize:13,color:"#7A8BA8"}}> /mo</span></div>
      {billing==='yearly'&&<div style={{fontSize:11,color:"#10B981",marginBottom:12}}>Save ${(prices.monthly[planKey]-price)*12}/year</div>}
      <div style={{fontSize:12,color:"#7A8BA8",lineHeight:2.2,marginBottom:20}}>{features.map(f=><div key={f}>✓ {f}</div>)}{extra.map(f=><div key={f} style={{color:"#3D5068"}}>— {f}</div>)}</div>
      <button onClick={onGetStarted} style={{width:"100%",padding:"11px",borderRadius:10,background:popular?"linear-gradient(135deg,#4F6EF7,#7C3AED)":"transparent",border:popular?"none":"1px solid #1C2D45",color:popular?"#fff":"#7A8BA8",fontSize:13,fontWeight:700,cursor:"pointer"}}>Get started</button>
    </div>
  );

  const FeatureIcon = ({ type }) => {
    const icons = {
      publisher: <svg width="32" height="32" viewBox="0 0 32 32" fill="none"><defs><linearGradient id="ig1" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#4F6EF7"/><stop offset="1" stopColor="#7C3AED"/></linearGradient></defs><rect x="2" y="4" width="28" height="24" rx="4" fill="url(#ig1)" opacity="0.15" stroke="url(#ig1)" strokeWidth="1.5"/><rect x="6" y="9" width="12" height="2" rx="1" fill="url(#ig1)"/><rect x="6" y="14" width="8" height="2" rx="1" fill="url(#ig1)" opacity="0.6"/><circle cx="24" cy="22" r="5" fill="url(#ig1)"/><path d="M22 22l1.5 1.5L26 20" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>,
      analytics: <svg width="32" height="32" viewBox="0 0 32 32" fill="none"><defs><linearGradient id="ig2" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#4F6EF7"/><stop offset="1" stopColor="#7C3AED"/></linearGradient></defs><rect x="2" y="4" width="28" height="24" rx="4" fill="url(#ig2)" opacity="0.15" stroke="url(#ig2)" strokeWidth="1.5"/><rect x="6" y="18" width="4" height="8" rx="1" fill="url(#ig2)" opacity="0.5"/><rect x="12" y="13" width="4" height="13" rx="1" fill="url(#ig2)" opacity="0.7"/><rect x="18" y="9" width="4" height="17" rx="1" fill="url(#ig2)"/><path d="M7 17l5-5 5 3 5-7" stroke="url(#ig2)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>,
      inbox: <svg width="32" height="32" viewBox="0 0 32 32" fill="none"><defs><linearGradient id="ig3" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#4F6EF7"/><stop offset="1" stopColor="#7C3AED"/></linearGradient></defs><rect x="2" y="6" width="28" height="20" rx="4" fill="url(#ig3)" opacity="0.15" stroke="url(#ig3)" strokeWidth="1.5"/><path d="M2 11l14 9 14-9" stroke="url(#ig3)" strokeWidth="1.5" strokeLinecap="round"/><circle cx="25" cy="8" r="4" fill="#EF4444"/><text x="25" y="11" textAnchor="middle" fill="#fff" fontSize="6" fontWeight="bold">7</text></svg>,
      ai: <svg width="32" height="32" viewBox="0 0 32 32" fill="none"><defs><linearGradient id="ig4" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#4F6EF7"/><stop offset="1" stopColor="#7C3AED"/></linearGradient></defs><circle cx="16" cy="16" r="13" fill="url(#ig4)" opacity="0.15" stroke="url(#ig4)" strokeWidth="1.5"/><path d="M10 13h12M10 16h8M10 19h10" stroke="url(#ig4)" strokeWidth="1.5" strokeLinecap="round"/><circle cx="24" cy="10" r="4" fill="url(#ig4)"/><text x="24" y="13" textAnchor="middle" fill="#fff" fontSize="6" fontWeight="bold">AI</text></svg>,
      multiclient: <svg width="32" height="32" viewBox="0 0 32 32" fill="none"><defs><linearGradient id="ig5" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#4F6EF7"/><stop offset="1" stopColor="#7C3AED"/></linearGradient></defs><circle cx="12" cy="11" r="4" fill="url(#ig5)" opacity="0.8"/><circle cx="22" cy="11" r="4" fill="url(#ig5)" opacity="0.5"/><path d="M4 26c0-4.4 3.6-8 8-8s8 3.6 8 8" stroke="url(#ig5)" strokeWidth="1.5" strokeLinecap="round"/><path d="M22 18c2.2 1.5 3.7 3.8 4 6.5" stroke="url(#ig5)" strokeWidth="1.5" strokeLinecap="round" opacity="0.6"/></svg>,
      reports: <svg width="32" height="32" viewBox="0 0 32 32" fill="none"><defs><linearGradient id="ig6" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#4F6EF7"/><stop offset="1" stopColor="#7C3AED"/></linearGradient></defs><rect x="4" y="2" width="24" height="28" rx="4" fill="url(#ig6)" opacity="0.15" stroke="url(#ig6)" strokeWidth="1.5"/><rect x="8" y="8" width="16" height="2" rx="1" fill="url(#ig6)"/><rect x="8" y="13" width="12" height="2" rx="1" fill="url(#ig6)" opacity="0.7"/><rect x="8" y="18" width="10" height="2" rx="1" fill="url(#ig6)" opacity="0.5"/><path d="M8 24l4-3 3 2 4-4" stroke="url(#ig6)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>,
    };
    return <div style={{marginBottom:14}}>{icons[type]}</div>;
  };

  const features = [
    { icon:"publisher", title:"Smart Publisher", desc:"Schedule and publish posts to Instagram, Facebook, TikTok and LinkedIn. AI writes captions in English and Arabic." },
    { icon:"analytics", title:"Analytics Dashboard", desc:"Track followers, engagement, and growth across all your connected social accounts in real time." },
    { icon:"inbox", title:"Unified Inbox", desc:"Manage all your messages and comments from Instagram and Facebook in a single inbox." },
    { icon:"ai", title:"AI Caption Generator", desc:"Generate bilingual captions (English + Arabic) instantly. Hashtags, emojis and tone — all customizable." },
    { icon:"multiclient", title:"Multi-Client Management", desc:"Manage multiple brands and clients from one agency dashboard. Each client gets their own workspace." },
    { icon:"reports", title:"Reports", desc:"Get monthly performance reports for each client with follower counts, post history, and platform breakdowns." },
  ];

  const plans = [
    { name:"Essential", price:"49", desc:"Perfect for small businesses", accounts:3, users:1, posts:30 },
    { name:"Professional", price:"99", desc:"For growing brands", accounts:10, users:5, posts:100, popular:true },
    { name:"Enterprise", price:"199", desc:"For agencies managing multiple clients", accounts:999, users:20, posts:999 },
  ];

  const s = {
    nav: { position:"fixed", top:0, left:0, right:0, zIndex:100, padding:"0 40px", height:64, display:"flex", alignItems:"center", justifyContent:"space-between", background: "rgba(7,9,15,0.95)", backdropFilter: "blur(12px)", borderBottom: "1px solid #1C2D45", transition:"all 0.3s" },
    logo: { fontSize:20, fontWeight:900, background:"linear-gradient(135deg,#4F6EF7,#7C3AED)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" },
    hero: { minHeight:"100vh", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", textAlign:"center", padding:"120px 20px 80px", background:"#07090F", position:"relative", overflow:"hidden" },
    heroBg: { position:"absolute", top:0, left:0, right:0, bottom:0, background:"radial-gradient(ellipse 80% 60% at 50% 0%, rgba(79,110,247,0.15) 0%, transparent 70%)", pointerEvents:"none" },
    badge: { display:"inline-flex", alignItems:"center", gap:6, padding:"6px 16px", borderRadius:20, background:"rgba(79,110,247,0.1)", border:"1px solid rgba(79,110,247,0.3)", color:"#4F6EF7", fontSize:12, fontWeight:700, marginBottom:24 },
    h1: { fontSize:56, fontWeight:900, color:"#E8EFF8", lineHeight:1.1, marginBottom:24, letterSpacing:-1.5, maxWidth:800 },
    sub: { fontSize:18, color:"#7A8BA8", maxWidth:560, lineHeight:1.7, marginBottom:40 },
    btnPrimary: { padding:"14px 32px", borderRadius:12, background:"linear-gradient(135deg,#4F6EF7,#7C3AED)", border:"none", color:"#fff", fontSize:15, fontWeight:700, cursor:"pointer", display:"inline-flex", alignItems:"center", gap:8 },
    btnSecondary: { padding:"14px 32px", borderRadius:12, background:"transparent", border:"1px solid #1C2D45", color:"#7A8BA8", fontSize:15, fontWeight:600, cursor:"pointer" },
    section: { padding:"80px 40px", maxWidth:1100, margin:"0 auto" },
    sectionTitle: { fontSize:36, fontWeight:900, color:"#E8EFF8", textAlign:"center", marginBottom:12, letterSpacing:-0.5 },
    sectionSub: { fontSize:16, color:"#7A8BA8", textAlign:"center", marginBottom:56 },
  };

  const HomePage = () => (
    <div>
      <div style={{background:"radial-gradient(ellipse 80% 50% at 50% -10%, rgba(79,110,247,0.2) 0%, transparent 65%), #07090F", padding:"88px 32px 72px", textAlign:"center"}}>
        <div style={{display:"inline-flex",alignItems:"center",gap:6,padding:"5px 16px",borderRadius:20,background:"rgba(79,110,247,0.1)",border:"1px solid rgba(79,110,247,0.3)",color:"#4F6EF7",fontSize:11,fontWeight:700,marginBottom:24}}>✦ Social media management, reimagined</div>
        <h1 style={{fontSize:52,fontWeight:900,lineHeight:1.1,marginBottom:20,letterSpacing:-1.5,maxWidth:760,margin:"0 auto 20px"}}>One platform.<br/><span style={grad}>Every language. Every brand.</span></h1>
        <p style={{fontSize:16,color:"#7A8BA8",maxWidth:520,margin:"0 auto 36px",lineHeight:1.75}}>Tawaslo is the social media management platform for agencies and brands worldwide. Publish, schedule, analyze, and grow — with full Arabic and English support.</p>
        <div style={{display:"flex",gap:12,justifyContent:"center",marginBottom:56,flexWrap:"wrap"}}>
          <button onClick={onGetStarted} style={{padding:"13px 30px",borderRadius:10,background:"linear-gradient(135deg,#4F6EF7,#7C3AED)",border:"none",color:"#fff",fontSize:14,fontWeight:700,cursor:"pointer"}}>Start free trial →</button>
          <button onClick={()=>setLandingPage('pricing')} style={{padding:"13px 30px",borderRadius:10,background:"transparent",border:"1px solid #1C2D45",color:"#7A8BA8",fontSize:14,fontWeight:600,cursor:"pointer"}}>View pricing</button>
        </div>
        <div style={{display:"flex",gap:48,justifyContent:"center",flexWrap:"wrap"}}>
          {[["English + Arabic","AI caption generator"],["All-in-one","Publish, inbox, analytics"],["Multi-brand","Agency-ready platform"]].map(([v,l])=>(
            <div key={v} style={{textAlign:"center"}}><div style={{fontSize:22,fontWeight:900,...grad}}>{v}</div><div style={{fontSize:12,color:"#7A8BA8",marginTop:3}}>{l}</div></div>
          ))}
        </div>
      </div>
      <div style={{background:"#0C1120",padding:"72px 32px"}}>
        <div style={{maxWidth:1000,margin:"0 auto"}}>
          <h2 style={{fontSize:30,fontWeight:900,textAlign:"center",marginBottom:10}}>Everything your brand needs</h2>
          <p style={{color:"#7A8BA8",fontSize:14,textAlign:"center",marginBottom:40}}>Built for agencies and brands managing social media at scale.</p>
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:14}}>
            {[["publisher","Smart Publisher","Schedule and publish to Instagram, Facebook, TikTok & LinkedIn. AI captions in English and Arabic."],["ai","AI Captions","Generate bilingual captions instantly. Hashtags, emojis, and tone — all customizable."],["analytics","Analytics","Track followers, engagement, and growth across all platforms in real time."],["inbox","Unified Inbox","All your DMs and comments from Instagram and Facebook in one place."],["multiclient","Multi-Client","Manage multiple brands under one agency workspace with team roles."],["reports","Reports","Monthly performance reports per client. Export-ready for presentations."]].map(([icon,title,desc])=>(
              <div key={title} style={card}><FeatureIcon type={icon}/><div style={{fontSize:13,fontWeight:700,marginBottom:6}}>{title}</div><div style={{fontSize:12,color:"#7A8BA8",lineHeight:1.7}}>{desc}</div></div>
            ))}
          </div>
          <div style={{textAlign:"center",marginTop:32}}><button onClick={()=>setLandingPage('features')} style={{padding:"10px 24px",borderRadius:10,background:"linear-gradient(135deg,#4F6EF7,#7C3AED)",border:"none",color:"#fff",fontSize:13,fontWeight:700,cursor:"pointer"}}>See all features →</button></div>
        </div>
      </div>
      <div style={{padding:"72px 32px",textAlign:"center",background:"#07090F",borderTop:"1px solid #1C2D45"}}>
        <h2 style={{fontSize:30,fontWeight:900,marginBottom:12}}>Ready to grow your brand?</h2>
        <p style={{color:"#7A8BA8",fontSize:14,marginBottom:28}}>Join brands worldwide using Tawaslo to manage their social media.</p>
        <button onClick={onGetStarted} style={{padding:"13px 30px",borderRadius:10,background:"linear-gradient(135deg,#4F6EF7,#7C3AED)",border:"none",color:"#fff",fontSize:14,fontWeight:700,cursor:"pointer"}}>Start free — no credit card needed</button>
      </div>
    </div>
  );

  const FeaturesPage = () => (
    <div style={{padding:"60px 32px",maxWidth:1000,margin:"0 auto"}}>
      <div style={{textAlign:"center",marginBottom:48}}>
        <h1 style={{fontSize:36,fontWeight:900,marginBottom:12}}>Everything you need to<br/><span style={grad}>manage social media at scale</span></h1>
        <p style={{color:"#7A8BA8",fontSize:14,maxWidth:500,margin:"0 auto"}}>From publishing to analytics to inbox management — Tawaslo has it all.</p>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:20}}>

        {/* Publishing */}
        <div style={{background:"#0C1120",border:"1px solid #1C2D45",borderRadius:16,padding:28,display:"grid",gridTemplateColumns:"1fr 1fr",gap:24,alignItems:"center"}}>
          <div>
            <div style={{fontSize:11,fontWeight:700,color:"#4F6EF7",marginBottom:10,letterSpacing:1}}>PUBLISHING</div>
            <h3 style={{fontSize:20,fontWeight:800,marginBottom:10}}>Publish & schedule to all platforms</h3>
            <p style={{fontSize:13,color:"#7A8BA8",lineHeight:1.7,marginBottom:16}}>Write once, publish everywhere. Schedule posts for the perfect time. Preview exactly how your post will look before it goes live.</p>
            <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
              <div style={{padding:"5px 10px",borderRadius:20,background:"#E1306C18",border:"1px solid #E1306C",fontSize:11,fontWeight:700,color:"#E1306C",display:"flex",alignItems:"center",gap:5}}><FaInstagram/> Instagram</div>
              <div style={{padding:"5px 10px",borderRadius:20,background:"#1877F218",border:"1px solid #1877F2",fontSize:11,fontWeight:700,color:"#1877F2",display:"flex",alignItems:"center",gap:5}}><FaFacebook/> Facebook</div>
              <div style={{padding:"5px 10px",borderRadius:20,background:"#FF005018",border:"1px solid #FF0050",fontSize:11,fontWeight:700,color:"#FF0050",display:"flex",alignItems:"center",gap:5}}><FaTiktok/> TikTok</div>
              <div style={{padding:"5px 10px",borderRadius:20,background:"#0A66C218",border:"1px solid #0A66C2",fontSize:11,fontWeight:700,color:"#0A66C2",display:"flex",alignItems:"center",gap:5}}><FaLinkedin/> LinkedIn</div>
            </div>
          </div>
          <div style={{background:"#101828",borderRadius:12,padding:16,border:"1px solid #1C2D45"}}>
            <div style={{fontSize:10,color:"#7A8BA8",fontWeight:700,marginBottom:10}}>SCHEDULE</div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:4,marginBottom:12,textAlign:"center"}}>
              {["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map(d=><div key={d} style={{fontSize:9,color:"#7A8BA8"}}>{d}</div>)}
              {[["2",false],["3",true,"#4F6EF7"],["4",false],["5",true,"#E1306C"],["6",false],["7",true,"#4F6EF7"],["8",false]].map(([n,active,c])=>(
                <div key={n} style={{fontSize:10,padding:4,borderRadius:4,background:active?`${c}30`:"transparent",color:active?c:"#7A8BA8",fontWeight:active?700:400}}>{n}</div>
              ))}
            </div>
            <div style={{background:"#0C1120",borderRadius:8,padding:"8px 10px",fontSize:11,color:"#7A8BA8",marginBottom:6,display:"flex",justifyContent:"space-between"}}><span>🚀 Product launch post</span><span style={{color:"#4F6EF7",fontSize:10}}>Tue 9:00am</span></div>
            <div style={{background:"#0C1120",borderRadius:8,padding:"8px 10px",fontSize:11,color:"#7A8BA8",display:"flex",justifyContent:"space-between"}}><span>✨ Weekly highlights</span><span style={{color:"#E1306C",fontSize:10}}>Thu 6:00pm</span></div>
          </div>
        </div>

        {/* AI Captions */}
        <div style={{background:"#0C1120",border:"1px solid #1C2D45",borderRadius:16,padding:28,display:"grid",gridTemplateColumns:"1fr 1fr",gap:24,alignItems:"center"}}>
          <div style={{background:"#101828",borderRadius:12,padding:16,border:"1px solid #1C2D45"}}>
            <div style={{fontSize:10,color:"#7A8BA8",fontWeight:700,marginBottom:4}}>TOPIC</div>
            <div style={{background:"#0C1120",borderRadius:8,padding:"8px 10px",fontSize:12,color:"#7A8BA8",marginBottom:10}}>New summer collection launch</div>
            <div style={{display:"flex",gap:6,marginBottom:10}}>
              <span style={{padding:"4px 10px",borderRadius:20,background:"#4F6EF730",fontSize:10,color:"#4F6EF7"}}>Instagram</span>
              <span style={{padding:"4px 10px",borderRadius:20,background:"#7C3AED30",fontSize:10,color:"#7C3AED"}}>Exciting tone</span>
            </div>
            <div style={{border:"1px solid #1C2D45",borderRadius:8,padding:10,marginBottom:8}}>
              <div style={{fontSize:9,color:"#4F6EF7",fontWeight:700,marginBottom:4}}>🇬🇧 ENGLISH</div>
              <div style={{fontSize:11,color:"#E8EFF8",lineHeight:1.6}}>Summer is here & so is our new collection! ☀️ Fresh styles made for you. Shop now and shine! ✨ #SummerVibes #NewCollection</div>
            </div>
            <div style={{border:"1px solid #1C2D45",borderRadius:8,padding:10}}>
              <div style={{fontSize:9,color:"#7C3AED",fontWeight:700,marginBottom:4}}>🇸🇦 ARABIC</div>
              <div style={{fontSize:11,color:"#E8EFF8",lineHeight:1.6,direction:"rtl",textAlign:"right"}}>الصيف هنا ومعه مجموعتنا الجديدة! ☀️ أزياء عصرية صُممت لك. تسوق الآن! ✨ #أزياء_الصيف #مجموعة_جديدة</div>
            </div>
          </div>
          <div>
            <div style={{fontSize:11,fontWeight:700,color:"#7C3AED",marginBottom:10,letterSpacing:1}}>AI CAPTIONS</div>
            <h3 style={{fontSize:20,fontWeight:800,marginBottom:10}}>Write in Arabic & English — Simultaneously</h3>
            <p style={{fontSize:13,color:"#7A8BA8",lineHeight:1.7}}>Our AI generates bilingual captions tailored to your brand voice, platform, and tone. Hashtags and emojis included — in both languages.</p>
          </div>
        </div>

        {/* Analytics */}
        <div style={{background:"#0C1120",border:"1px solid #1C2D45",borderRadius:16,padding:28,display:"grid",gridTemplateColumns:"1fr 1fr",gap:24,alignItems:"center"}}>
          <div>
            <div style={{fontSize:11,fontWeight:700,color:"#10B981",marginBottom:10,letterSpacing:1}}>ANALYTICS</div>
            <h3 style={{fontSize:20,fontWeight:800,marginBottom:10}}>Real data. Real insights.</h3>
            <p style={{fontSize:13,color:"#7A8BA8",lineHeight:1.7,marginBottom:16}}>Track followers, engagement, and growth across all platforms in real time. Monthly reports ready for your clients.</p>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              {[["12.4K","Total Followers","#4F6EF7"],["+8.2%","Growth this month","#10B981"],["8.2K","Instagram","#E1306C"],["4.2K","Facebook","#1877F2"]].map(([v,l,c])=>(
                <div key={l} style={{background:"#101828",borderRadius:10,padding:12,textAlign:"center"}}><div style={{fontSize:18,fontWeight:900,color:c}}>{v}</div><div style={{fontSize:10,color:"#7A8BA8",marginTop:3}}>{l}</div></div>
              ))}
            </div>
          </div>
          <div style={{background:"#101828",borderRadius:12,padding:16,border:"1px solid #1C2D45"}}>
            <div style={{fontSize:10,color:"#7A8BA8",fontWeight:700,marginBottom:12}}>FOLLOWER GROWTH — LAST 6 MONTHS</div>
            <svg viewBox="0 0 260 110" style={{width:"100%",height:"auto"}}>
              <defs><linearGradient id="cg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#4F6EF7" stopOpacity="0.3"/><stop offset="100%" stopColor="#4F6EF7" stopOpacity="0"/></linearGradient></defs>
              <path d="M0,95 L52,82 L104,65 L156,45 L208,25 L260,8 L260,110 L0,110 Z" fill="url(#cg)"/>
              <path d="M0,95 L52,82 L104,65 L156,45 L208,25 L260,8" fill="none" stroke="#4F6EF7" strokeWidth="2.5" strokeLinecap="round"/>
              {[[0,95],[52,82],[104,65],[156,45],[208,25],[260,8]].map(([x,y],i)=><circle key={i} cx={x} cy={y} r={i===5?4:3} fill="#4F6EF7" stroke={i===5?"#E8EFF8":"none"} strokeWidth="1.5"/>)}
              {[["Jan",0],["Feb",46],["Mar",92],["Apr",138],["May",184],["Jun",230]].map(([m,x])=><text key={m} x={x} y="108" fontSize="8" fill="#3D5068">{m}</text>)}
              <text x="220" y="6" fontSize="9" fill="#4F6EF7" fontWeight="bold">12.4K</text>
            </svg>
          </div>
        </div>

        {/* Inbox */}
        <div style={{background:"#0C1120",border:"1px solid #1C2D45",borderRadius:16,padding:28,display:"grid",gridTemplateColumns:"1fr 1fr",gap:24,alignItems:"center"}}>
          <div style={{background:"#101828",borderRadius:12,padding:16,border:"1px solid #1C2D45"}}>
            <div style={{fontSize:10,color:"#7A8BA8",fontWeight:700,marginBottom:10}}>INBOX <span style={{background:"#4F6EF7",color:"#fff",borderRadius:10,padding:"1px 7px",fontSize:9,marginLeft:4}}>7</span></div>
            {[["A","Ahmed Al-Mansoori","Love your latest post! Can you share more?","2h","#E1306C"],["S","Sara Mohammed","What are your working hours?","4h","#1877F2"],["K","Khalid Hassan","Great content, keep it up! 🔥","6h","#FF0050"]].map(([init,name,msg,time,c])=>(
              <div key={name} style={{display:"flex",gap:10,alignItems:"center",padding:8,background:"#0C1120",borderRadius:8,borderLeft:`2px solid ${c}`,marginBottom:6}}>
                <div style={{width:28,height:28,borderRadius:"50%",background:`${c}30`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,color:c,flexShrink:0}}>{init}</div>
                <div style={{flex:1,minWidth:0}}><div style={{fontSize:11,fontWeight:700}}>{name}</div><div style={{fontSize:10,color:"#7A8BA8",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{msg}</div></div>
                <div style={{fontSize:9,color:"#7A8BA8",flexShrink:0}}>{time}</div>
              </div>
            ))}
          </div>
          <div>
            <div style={{fontSize:11,fontWeight:700,color:"#F59E0B",marginBottom:10,letterSpacing:1}}>UNIFIED INBOX</div>
            <h3 style={{fontSize:20,fontWeight:800,marginBottom:10}}>All messages. One place.</h3>
            <p style={{fontSize:13,color:"#7A8BA8",lineHeight:1.7}}>Never miss a DM or comment again. Manage Instagram and Facebook messages together — reply, assign, and track all from one inbox.</p>
          </div>
        </div>

        {/* Multi-client */}
        <div style={{background:"#0C1120",border:"1px solid #1C2D45",borderRadius:16,padding:28,display:"grid",gridTemplateColumns:"1fr 1fr",gap:24,alignItems:"center"}}>
          <div style={{background:"#101828",borderRadius:12,padding:16,border:"1px solid #1C2D45"}}>
            <div style={{fontSize:10,color:"#7A8BA8",fontWeight:700,marginBottom:10}}>YOUR CLIENTS</div>
            {[["🍽","Lumière Dining","Fine Dining","#E1306C","#F97316","Active"],["👗","Velour Fashion","Retail & Fashion","#7C3AED","#E1306C","Active"],["🏠","Prime Properties","Real Estate","#4F6EF7","#10B981","Active"],["🚗","Motivo Motors","Automotive","#F59E0B","#EF4444","Pending"]].map(([icon,name,cat,c1,c2,status])=>(
              <div key={name} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 10px",background:"#0C1120",borderRadius:8,marginBottom:6}}>
                <div style={{display:"flex",alignItems:"center",gap:8}}>
                  <div style={{width:28,height:28,borderRadius:6,background:`linear-gradient(135deg,${c1},${c2})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13}}>{icon}</div>
                  <div><div style={{fontSize:12,fontWeight:600}}>{name}</div><div style={{fontSize:10,color:"#7A8BA8"}}>{cat}</div></div>
                </div>
                <span style={{fontSize:10,color:status==="Active"?"#10B981":"#F59E0B",fontWeight:600}}>● {status}</span>
              </div>
            ))}
          </div>
          <div>
            <div style={{fontSize:11,fontWeight:700,color:"#4F6EF7",marginBottom:10,letterSpacing:1}}>MULTI-CLIENT</div>
            <h3 style={{fontSize:20,fontWeight:800,marginBottom:10}}>Manage all your clients from one place</h3>
            <p style={{fontSize:13,color:"#7A8BA8",lineHeight:1.7}}>Switch between clients in one click. Each brand gets its own workspace, social accounts, and reports. Perfect for agencies and freelancers managing multiple brands.</p>
          </div>
        </div>

      </div>
    </div>
  );

  const PricingPage = () => (
    <div style={{padding:"60px 32px",maxWidth:1000,margin:"0 auto"}}>
      <div style={{textAlign:"center",marginBottom:36}}>
        <h1 style={{fontSize:36,fontWeight:900,marginBottom:12}}>Simple, transparent pricing</h1>
        <p style={{color:"#7A8BA8",fontSize:14,marginBottom:24}}>No hidden fees. Cancel anytime.</p>
        <div style={{display:"inline-flex",background:"#0C1120",border:"1px solid #1C2D45",borderRadius:10,padding:4}}>
          {['monthly','yearly'].map(b=>(
            <button key={b} onClick={()=>setBilling(b)} style={{padding:"7px 20px",borderRadius:8,fontSize:13,fontWeight:600,cursor:"pointer",border:"none",background:billing===b?"linear-gradient(135deg,#4F6EF7,#7C3AED)":"transparent",color:billing===b?"#fff":"#7A8BA8"}}>
              {b==='monthly'?'Monthly':'Yearly '}{b==='yearly'&&<span style={{fontSize:10,color:billing==='yearly'?"#fff":"#10B981",fontWeight:700}}>save 20%</span>}
            </button>
          ))}
        </div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:16,marginBottom:48}}>
        <PlanCard name="Essential" planKey="starter" desc="For small businesses" price={p.starter} features={["3 social accounts","1 team member","30 posts/month","AI captions (EN + AR)","Analytics dashboard","Monthly reports"]}/>
        <PlanCard name="Professional" planKey="pro" desc="For growing brands" price={p.pro} popular features={["10 social accounts","5 team members","100 posts/month","AI captions (EN + AR)","Analytics dashboard","Priority support"]}/>
        <PlanCard name="Enterprise" planKey="agency" desc="For agencies" price={p.agency} features={["Unlimited accounts","20 team members","Unlimited posts","AI captions (EN + AR)","White-label reports","Dedicated support"]}/>
      </div>
      <div style={{background:"#0C1120",border:"1px solid #1C2D45",borderRadius:16,overflow:"hidden"}}>
        <div style={{padding:"16px 20px",borderBottom:"1px solid #1C2D45"}}><h3 style={{fontSize:15,fontWeight:800}}>Compare plans</h3></div>
        {[["","Essential","Professional","Enterprise",true],["Publishing","","","",false,"header"],["Social accounts","3","10","Unlimited",false],["Posts per month","30","100","Unlimited",false],["Post scheduling","✓","✓","✓",false],["AI Features","","","",false,"header"],["AI caption generator","✓","✓","✓",false],["Arabic captions","✓","✓","✓",false],["Custom tone & style","—","✓","✓",false],["Analytics","","","",false,"header"],["Analytics dashboard","✓","✓","✓",false],["Monthly reports","✓","✓","✓",false],["White-label reports","—","—","✓",false],["Team","","","",false,"header"],["Team members","1","5","20",false],["Multi-client workspace","—","✓","✓",false],["Dedicated support","—","—","✓",false]].map(([feat,s,pr,ag,isHead,type],i)=>(
          <div key={i} style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr 1fr",padding:type==="header"?"6px 20px":"10px 20px",borderBottom:"1px solid #1C2D4530",background:isHead?"#101828":type==="header"?"#0C1120":"transparent",fontSize:12,alignItems:"center",color:type==="header"?"#4F6EF7":isHead?"#7A8BA8":"#E8EFF8",fontWeight:type==="header"?700:isHead?700:400,textTransform:type==="header"?"uppercase":"none",letterSpacing:type==="header"?"0.5px":"0"}}>
            <div>{feat}</div>
            <div style={{textAlign:"center",color:s==="✓"?"#10B981":s==="—"?"#3D5068":"#E8EFF8"}}>{s}</div><div style={{textAlign:"center",color:pr==="✓"?"#10B981":pr==="—"?"#3D5068":"#E8EFF8"}}>{pr}</div><div style={{textAlign:"center",color:ag==="✓"?"#10B981":ag==="—"?"#3D5068":"#E8EFF8"}}>{ag}</div>
          </div>
        ))}
      </div>
    </div>
  );

  const AboutPage = () => (
    <div style={{padding:"60px 32px",maxWidth:860,margin:"0 auto"}}>
      <h1 style={{fontSize:38,fontWeight:900,marginBottom:20,lineHeight:1.2}}>Social media management,<br/><span style={grad}>reimagined for every brand.</span></h1>
      <p style={{fontSize:15,color:"#7A8BA8",lineHeight:1.85,marginBottom:20}}>Tawaslo is a global social media management platform built for agencies and brands who want to do more — publish smarter, analyze better, and grow faster. Whether you're managing one brand or fifty, Tawaslo brings everything into one clean workspace.</p>
      <p style={{fontSize:15,color:"#7A8BA8",lineHeight:1.85,marginBottom:40}}>But we didn't stop there. We noticed something every other platform ignored: <strong style={{color:"#E8EFF8"}}>400 million people speak Arabic</strong> — and not a single major social media tool was truly built for them. So we built Tawaslo with Arabic as a first-class citizen. Full Arabic dashboard, AI captions in Arabic, right-to-left support. Not a plugin. Not a translation. Built in from day one.</p>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14,marginBottom:40}}>
        {[["400M+","Arabic speakers worldwide"],["5th","Most spoken language globally"],["22","Countries speak Arabic"],["$1T+","MENA digital economy by 2030"]].map(([v,l])=>(
          <div key={l} style={card}><div style={{fontSize:22,fontWeight:900,...grad,textAlign:"center"}}>{v}</div><div style={{fontSize:11,color:"#7A8BA8",marginTop:5,textAlign:"center"}}>{l}</div></div>
        ))}
      </div>
      <div style={{background:"#0C1120",border:"1px solid #1C2D45",borderRadius:16,padding:28,marginBottom:28}}>
        <div style={{fontSize:11,fontWeight:700,color:"#4F6EF7",letterSpacing:1,marginBottom:16}}>WHAT MAKES US DIFFERENT</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
          {[["🌍","Truly global platform","Works for any brand anywhere in the world. No geographic limits."],["🇸🇦","Native Arabic support","Full Arabic dashboard and AI captions. RTL interface. Built in, not bolted on."],["🏢","Agency-ready","Manage dozens of clients and brands from one clean workspace."],["💰","Priced fairly","Fraction of the cost of Hootsuite or Sprout Social. No per-user nonsense."]].map(([icon,title,desc])=>(
            <div key={title} style={{display:"flex",gap:12,alignItems:"flex-start"}}>
              <div style={{fontSize:20,marginTop:2}}>{icon}</div>
              <div><div style={{fontSize:13,fontWeight:700,marginBottom:4}}>{title}</div><div style={{fontSize:12,color:"#7A8BA8",lineHeight:1.6}}>{desc}</div></div>
            </div>
          ))}
        </div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:14}}>
        {[["2026","Founded"],["Bahrain","Headquarters"],["Global","Vision"]].map(([v,l])=>(
          <div key={l} style={{...card,textAlign:"center"}}><div style={{fontSize:22,fontWeight:900,...grad}}>{v}</div><div style={{fontSize:11,color:"#7A8BA8",marginTop:5}}>{l}</div></div>
        ))}
      </div>
    </div>
  );

  const ContactPage = () => (
    <div style={{padding:"60px 32px",maxWidth:600,margin:"0 auto"}}>
      <div style={{textAlign:"center",marginBottom:40}}>
        <h1 style={{fontSize:36,fontWeight:900,marginBottom:12}}>Get in touch</h1>
        <p style={{color:"#7A8BA8",fontSize:14}}>Have questions? We'd love to hear from you.</p>
      </div>
      <div style={{background:"#0C1120",border:"1px solid #1C2D45",borderRadius:16,padding:28,display:"flex",flexDirection:"column",gap:16}}>
        {[["Name","text","Your name"],["Email","email","your@email.com"],["Company","text","Your company (optional)"]].map(([label,type,ph])=>(
          <div key={label}><div style={{fontSize:11,color:"#7A8BA8",marginBottom:6}}>{label}</div><input type={type} placeholder={ph} style={{width:"100%",padding:"11px 14px",borderRadius:8,border:"1px solid #1C2D45",background:"#101828",color:"#E8EFF8",fontSize:13,outline:"none"}}/></div>
        ))}
        <div><div style={{fontSize:11,color:"#7A8BA8",marginBottom:6}}>Message</div><textarea placeholder="How can we help?" style={{width:"100%",padding:"11px 14px",borderRadius:8,border:"1px solid #1C2D45",background:"#101828",color:"#E8EFF8",fontSize:13,outline:"none",resize:"vertical",height:120}}/></div>
        <button style={{padding:13,borderRadius:10,background:"linear-gradient(135deg,#4F6EF7,#7C3AED)",border:"none",color:"#fff",fontSize:13,fontWeight:700,cursor:"pointer"}}>Send message</button>
      </div>
      <div style={{marginTop:24,textAlign:"center",fontSize:13,color:"#7A8BA8"}}>Or email us: <span style={{color:"#4F6EF7"}}>hello@tawaslo.com</span></div>
    </div>
  );

  const sectionStyle = { fontSize:13, color:"#A8B9CE", lineHeight:1.75, marginBottom:12 };
  const sectionTitleStyle = { fontSize:13, fontWeight:700, color:"#4F6EF7", marginBottom:8, marginTop:0 };
  const dividerStyle = { border:"none", borderTop:"1px solid #1C2D45", margin:"24px 0" };
  const ulStyle = { fontSize:13, color:"#A8B9CE", lineHeight:1.75, marginBottom:12, paddingLeft:18 };

  const PrivacyPage = () => (
    <div style={{padding:"60px 32px", maxWidth:720, margin:"0 auto"}}>
      <div style={{display:"inline-block",fontSize:11,background:"rgba(79,110,247,0.15)",color:"#4F6EF7",borderRadius:20,padding:"3px 12px",marginBottom:14}}>Legal</div>
      <h1 style={{fontSize:32,fontWeight:900,margin:"0 0 6px"}}>Privacy policy</h1>
      <p style={{fontSize:12,color:"#7A8BA8",marginBottom:32}}>Last updated: June 2026</p>

      <p style={sectionTitleStyle}>1. Information we collect</p>
      <p style={sectionStyle}>We collect information you provide when you create an account, connect social accounts, or contact us — including your name, email address, and OAuth access tokens for connected platforms.</p>
      <p style={sectionStyle}>When you publish content through Tawaslo, we process your media files and captions to deliver them to the relevant platform via their respective APIs.</p>
      <hr style={dividerStyle}/>

      <p style={sectionTitleStyle}>2. Social platform data we access</p>
      <p style={sectionStyle}>Tawaslo is designed for professional and business use. Due to platform API restrictions, only business-type accounts can be connected and managed. Depending on which platforms you connect, we may access the following data on your behalf:</p>
      <ul style={ulStyle}>
        <li style={{marginBottom:10}}><strong style={{color:"#E8EFF8"}}>Facebook</strong> — page name, page ID, profile picture, follower count, and the ability to publish posts and media to your page. <span style={{fontSize:11,color:"#7A8BA8"}}>Requires a Facebook Page. Personal profiles cannot be connected via the API.</span></li>
        <li style={{marginBottom:10}}><strong style={{color:"#E8EFF8"}}>Instagram</strong> — username, profile picture, follower count, and the ability to publish posts, reels, and stories via the Meta Graph API. <span style={{fontSize:11,color:"#7A8BA8"}}>Requires an Instagram Business or Creator account linked to a Facebook Page. Personal accounts cannot be connected.</span></li>
        <li style={{marginBottom:10}}><strong style={{color:"#E8EFF8"}}>TikTok</strong> <span style={{fontSize:10,background:"rgba(79,210,150,0.15)",color:"#4FD296",borderRadius:10,padding:"2px 8px",marginLeft:6}}>coming soon</span> — account username, display name, and the ability to upload and publish videos via the TikTok Content Posting API. <span style={{fontSize:11,color:"#7A8BA8"}}>Requires a TikTok Business account. Personal accounts are not supported.</span></li>
        <li style={{marginBottom:10}}><strong style={{color:"#E8EFF8"}}>LinkedIn</strong> <span style={{fontSize:10,background:"rgba(79,210,150,0.15)",color:"#4FD296",borderRadius:10,padding:"2px 8px",marginLeft:6}}>coming soon</span> — organization name and the ability to create posts via the LinkedIn Marketing API. <span style={{fontSize:11,color:"#7A8BA8"}}>Requires a LinkedIn Company or Organization page. Personal profiles are not supported.</span></li>
      </ul>
      <p style={sectionStyle}>We only request the minimum permissions required to deliver the service. We never read your followers' private data or direct messages.</p>
      <hr style={dividerStyle}/>

      <p style={sectionTitleStyle}>3. How we use your information</p>
      <ul style={ulStyle}>
        {["To authenticate you and manage your account","To publish content to your connected social accounts on your behalf","To store your media files securely via Supabase Storage","To generate AI captions via Anthropic's API on your request","To provide analytics and reporting on your published content","To improve and maintain the platform"].map(i=><li key={i}>{i}</li>)}
      </ul>
      <hr style={dividerStyle}/>

      <p style={sectionTitleStyle}>4. Access token storage & retention</p>
      <p style={sectionStyle}>OAuth access tokens are stored securely in our database and are used solely to perform actions you explicitly request. Long-lived tokens (e.g. Meta 60-day tokens) are stored for the duration of your connection. Tokens are permanently deleted when you disconnect an account or delete your Tawaslo account.</p>
      <hr style={dividerStyle}/>

      <p style={sectionTitleStyle}>5. Third-party services</p>
      <p style={sectionStyle}>Tawaslo integrates with Meta (Facebook & Instagram), TikTok, LinkedIn, Supabase, and Anthropic. Each service operates under its own privacy policy. We do not sell your data to any third party.</p>
      <hr style={dividerStyle}/>

      <p style={sectionTitleStyle}>6. Data deletion</p>
      <p style={sectionStyle}>You may request deletion of your account and all associated data at any time by emailing <span style={{color:"#4F6EF7"}}>support@tawaslo.com</span>. We will process your request within 30 days.</p>
      <p style={sectionStyle}>For Facebook/Instagram users: in compliance with Meta's Platform Terms, you may also use our Data Deletion Request endpoint. Upon receiving a deletion request, we remove all stored tokens, media, and account data linked to your Facebook user ID.</p>
      <hr style={dividerStyle}/>

      <p style={sectionTitleStyle}>7. Contact</p>
      <p style={sectionStyle}>Questions about this policy? Email us at <span style={{color:"#4F6EF7"}}>support@tawaslo.com</span></p>
    </div>
  );

  const TermsPage = () => (
    <div style={{padding:"60px 32px", maxWidth:720, margin:"0 auto"}}>
      <div style={{display:"inline-block",fontSize:11,background:"rgba(79,110,247,0.15)",color:"#4F6EF7",borderRadius:20,padding:"3px 12px",marginBottom:14}}>Legal</div>
      <h1 style={{fontSize:32,fontWeight:900,margin:"0 0 6px"}}>Terms of service</h1>
      <p style={{fontSize:12,color:"#7A8BA8",marginBottom:32}}>Last updated: June 2026</p>

      <p style={sectionTitleStyle}>1. Acceptance of terms</p>
      <p style={sectionStyle}>By accessing or using Tawaslo, you agree to these Terms of Service. If you do not agree, please do not use the platform.</p>
      <hr style={dividerStyle}/>

      <p style={sectionTitleStyle}>2. Use of the platform</p>
      <p style={sectionStyle}>Tawaslo is a social media management tool for scheduling and publishing content to business social accounts on Facebook, Instagram, TikTok, and LinkedIn. You are responsible for all content you publish through the platform and must comply with each platform's terms of service and community standards.</p>
      <p style={sectionStyle}>Due to API restrictions, only business-type accounts may be connected: Facebook Pages, Instagram Business or Creator accounts, TikTok Business accounts, and LinkedIn Company pages. Personal accounts are not supported.</p>
      <hr style={dividerStyle}/>

      <p style={sectionTitleStyle}>3. Account responsibilities</p>
      <ul style={ulStyle}>
        {["You must provide accurate information when creating an account","You are responsible for keeping your credentials secure","You may not use the platform for spam, harassment, or illegal activity","You may not use the platform to violate any platform's terms or policies"].map(i=><li key={i}>{i}</li>)}
      </ul>
      <hr style={dividerStyle}/>

      <p style={sectionTitleStyle}>4. Intellectual property</p>
      <p style={sectionStyle}>You retain ownership of all content you upload. By using Tawaslo, you grant us a limited license to process and transmit your content solely to provide the service.</p>
      <hr style={dividerStyle}/>

      <p style={sectionTitleStyle}>5. Limitation of liability</p>
      <p style={sectionStyle}>Tawaslo is provided "as is." We are not liable for any loss of data, missed posts, or platform downtime. Our liability is limited to the amount paid for the service in the prior 30 days.</p>
      <hr style={dividerStyle}/>

      <p style={sectionTitleStyle}>6. Termination</p>
      <p style={sectionStyle}>We reserve the right to suspend or terminate accounts that violate these terms. You may cancel your account at any time by contacting us at <span style={{color:"#4F6EF7"}}>support@tawaslo.com</span>.</p>
      <hr style={dividerStyle}/>

      <p style={sectionTitleStyle}>7. Contact</p>
      <p style={sectionStyle}>Questions? Email us at <span style={{color:"#4F6EF7"}}>support@tawaslo.com</span></p>
    </div>
  );

  return (
    <div style={{background:"#07090F",color:"#E8EFF8",fontFamily:"'Plus Jakarta Sans','Sora','Segoe UI',sans-serif",minHeight:"100vh"}}>
      <Nav/>
      {landingPage==='home'&&<HomePage/>}
      {landingPage==='features'&&<FeaturesPage/>}
      {landingPage==='pricing'&&<PricingPage/>}
      {landingPage==='about'&&<AboutPage/>}
      {landingPage==='contact'&&<ContactPage/>}
      {landingPage==='privacy'&&<PrivacyPage/>}
      {landingPage==='terms'&&<TermsPage/>}
      <Footer/>
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

  const [signupStep,    setSignupStep]    = useState(1);
  const [accountType,   setAccountType]   = useState("agency");
  const [selectedPlan,  setSelectedPlan]  = useState("professional");
  const [billingPeriod, setBillingPeriod] = useState("monthly");
  const [companyName,   setCompanyName]   = useState("");
  const [tosAgreed,     setTosAgreed]     = useState(false);

  const handleSignUp = async () => {
    if (!tosAgreed) { setError("Please agree to the Terms of Service to continue."); return; }
    if (!companyName.trim()) { setError("Please enter your company or agency name."); return; }
    setError(""); setLoading(true);
    const { data, error: err } = await signUp(email, pw, name);
    setLoading(false);
    if (err) { setError(err.message); return; }
    if (data?.user) {
      await createProfile(data.user.id, name, email, selectedPlan, accountType, companyName);
      await createInitialClient(data.user.id, companyName || name, selectedPlan, accountType);
      // Send welcome email
      try {
        await fetch('/api/send-welcome-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: companyName || name, email, plan: selectedPlan, accountType, billingPeriod }),
        });
      } catch(e) { console.warn('Welcome email failed:', e); }
      setSignupStep(4);
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
    <div style={{display:"flex",height:"100vh",background:th.bg,color:th.text,fontFamily:"'Plus Jakarta Sans','Sora','Segoe UI',sans-serif",overflow:"hidden"}}>
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
            Schedule, analyse, respond, and grow — one platform built for agencies and brands worldwide.
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
                  <img src="/logo-transparent.png" alt="Tawaslo" style={{width:44,height:44,objectFit:"contain"}}/>
                  <div style={{fontWeight:900,fontSize:22,letterSpacing:-0.8}}>Tawaslo</div>
                </div>
                <h1 style={{margin:0,fontSize:24,fontWeight:900,letterSpacing:-0.6}}>Welcome back</h1>
                <p style={{margin:"6px 0 0",fontSize:13,color:th.text2}}>Sign in to your Tawaslo workspace</p>
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
              {/* Step pills */}
              {signupStep < 4 && (
                <div style={{display:"flex",gap:6,marginBottom:24}}>
                  {[1,2,3].map(s=>(
                    <div key={s} style={{height:4,flex:1,borderRadius:2,background:s<=signupStep?th.accent:"#1C2D45",transition:"background 0.3s"}}/>
                  ))}
                </div>
              )}

              {/* STEP 1 — Account type */}
              {signupStep===1&&(
                <>
                  <div style={{marginBottom:24}}>
                    <h1 style={{margin:0,fontSize:22,fontWeight:900,letterSpacing:-0.5}}>What best describes you?</h1>
                    <p style={{margin:"6px 0 0",fontSize:13,color:th.text2}}>We will customize your workspace based on your selection.</p>
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:20}}>
                    {[
                      { id:"agency", label:"Agency", desc:"Managing social media for multiple clients", icon:(
                        <svg width="40" height="40" viewBox="0 0 56 56" fill="none"><rect x="8" y="10" width="40" height="38" rx="2" stroke="#4F6EF7" strokeWidth="1.8" fill="none"/><rect x="8" y="6" width="40" height="6" rx="1.5" stroke="#4F6EF7" strokeWidth="1.8" fill="none"/><rect x="13" y="16" width="8" height="8" rx="1.5" stroke="#4F6EF7" strokeWidth="1.5" fill="none"/><rect x="24" y="16" width="8" height="8" rx="1.5" stroke="#4F6EF7" strokeWidth="1.5" fill="none"/><rect x="35" y="16" width="8" height="8" rx="1.5" stroke="#4F6EF7" strokeWidth="1.5" fill="none"/><rect x="11" y="27" width="34" height="8" rx="1.5" stroke="#4F6EF7" strokeWidth="1.5" fill="none"/><text x="28" y="34" textAnchor="middle" fontSize="5.5" fontWeight="700" fill="#4F6EF7" fontFamily="sans-serif" letterSpacing="0.5">AGENCY</text><rect x="13" y="38" width="8" height="10" rx="1" stroke="#4F6EF7" strokeWidth="1.5" fill="none"/><rect x="35" y="38" width="8" height="10" rx="1" stroke="#4F6EF7" strokeWidth="1.5" fill="none"/><rect x="22" y="38" width="12" height="10" rx="1" stroke="#4F6EF7" strokeWidth="1.5" fill="none"/><line x1="28" y1="38" x2="28" y2="48" stroke="#4F6EF7" strokeWidth="1.2"/></svg>
                      )},
                      { id:"freelancer", label:"Freelancer", desc:"Independent social media manager", icon:(
                        <svg width="40" height="40" viewBox="0 0 64 64" fill="none"><circle cx="28" cy="11" r="6" stroke="#4F6EF7" strokeWidth="1.8" fill="none"/><path d="M12 38 C12 28 18 24 28 24 C38 24 44 28 44 38" stroke="#4F6EF7" strokeWidth="1.8" strokeLinecap="round" fill="none"/><path d="M15 44 L41 44 L43 38 L13 38 Z" stroke="#4F6EF7" strokeWidth="1.8" strokeLinejoin="round" fill="none"/><path d="M17 38 L19 28 L37 28 L39 38" stroke="#4F6EF7" strokeWidth="1.8" strokeLinejoin="round" fill="none"/><circle cx="28" cy="33" r="2.5" stroke="#4F6EF7" strokeWidth="1.5" fill="none"/><line x1="8" y1="48" x2="58" y2="48" stroke="#4F6EF7" strokeWidth="1.8" strokeLinecap="round"/><rect x="47" y="39" width="9" height="9" rx="1.5" stroke="#4F6EF7" strokeWidth="1.5" fill="none"/><path d="M56 41.5 C58.5 41.5 58.5 46 56 46" stroke="#4F6EF7" strokeWidth="1.4" strokeLinecap="round" fill="none"/><line x1="46" y1="48" x2="57" y2="48" stroke="#4F6EF7" strokeWidth="1.5" strokeLinecap="round"/></svg>
                      )},
                      { id:"corporate", label:"Corporate", desc:"Managing your own brand's social presence", icon:(
                        <svg width="40" height="40" viewBox="0 0 56 56" fill="none"><rect x="16" y="8" width="24" height="40" rx="2" stroke="#4F6EF7" strokeWidth="1.8" fill="none"/><rect x="6" y="20" width="10" height="28" rx="2" stroke="#4F6EF7" strokeWidth="1.8" fill="none"/><rect x="40" y="20" width="10" height="28" rx="2" stroke="#4F6EF7" strokeWidth="1.8" fill="none"/><line x1="21" y1="14" x2="23" y2="14" stroke="#4F6EF7" strokeWidth="1.5" strokeLinecap="round"/><line x1="27" y1="14" x2="29" y2="14" stroke="#4F6EF7" strokeWidth="1.5" strokeLinecap="round"/><line x1="33" y1="14" x2="35" y2="14" stroke="#4F6EF7" strokeWidth="1.5" strokeLinecap="round"/><line x1="21" y1="20" x2="23" y2="20" stroke="#4F6EF7" strokeWidth="1.5" strokeLinecap="round"/><line x1="27" y1="20" x2="29" y2="20" stroke="#4F6EF7" strokeWidth="1.5" strokeLinecap="round"/><line x1="33" y1="20" x2="35" y2="20" stroke="#4F6EF7" strokeWidth="1.5" strokeLinecap="round"/><line x1="9" y1="26" x2="13" y2="26" stroke="#4F6EF7" strokeWidth="1.3" strokeLinecap="round"/><line x1="9" y1="31" x2="13" y2="31" stroke="#4F6EF7" strokeWidth="1.3" strokeLinecap="round"/><line x1="43" y1="26" x2="47" y2="26" stroke="#4F6EF7" strokeWidth="1.3" strokeLinecap="round"/><line x1="43" y1="31" x2="47" y2="31" stroke="#4F6EF7" strokeWidth="1.3" strokeLinecap="round"/><rect x="22" y="38" width="12" height="10" rx="1" stroke="#4F6EF7" strokeWidth="1.5" fill="none"/><line x1="28" y1="38" x2="28" y2="48" stroke="#4F6EF7" strokeWidth="1.2"/><line x1="4" y1="48" x2="52" y2="48" stroke="#4F6EF7" strokeWidth="1.8" strokeLinecap="round"/></svg>
                      )},
                    ].map(({id,label,desc,icon})=>(
                      <div key={id} onClick={()=>setAccountType(id)} style={{background:th.card,border:`1.5px solid ${accountType===id?th.accent:th.border}`,borderRadius:10,padding:"14px 10px",textAlign:"center",cursor:"pointer",background:accountType===id?"rgba(79,110,247,0.1)":th.card,transition:"all 0.15s"}}>
                        <div style={{display:"flex",justifyContent:"center",marginBottom:8}}>{icon}</div>
                        <div style={{fontSize:11,fontWeight:700,color:th.text}}>{label}</div>
                        <div style={{fontSize:9,color:th.text2,marginTop:3,lineHeight:1.4}}>{desc}</div>
                      </div>
                    ))}
                  </div>
                  <button onClick={()=>setSignupStep(2)} style={{width:"100%",padding:"13px",borderRadius:11,background:th.gradient,border:"none",color:"#fff",fontSize:14,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:8,marginBottom:12}}>
                    Continue <ChevronRight size={15}/>
                  </button>
                  <div style={{textAlign:"center",fontSize:12,color:th.text2}}>
                    Already have an account?{" "}
                    <button onClick={()=>{setAuthPage("login");setError("");}} style={{background:"none",border:"none",color:th.accent,fontWeight:700,cursor:"pointer",fontSize:12}}>Sign in</button>
                  </div>
                </>
              )}

              {/* STEP 2 — Plan */}
              {signupStep===2&&(
                <>
                  <div style={{marginBottom:24}}>
                    <h1 style={{margin:0,fontSize:22,fontWeight:900,letterSpacing:-0.5}}>Choose your plan</h1>
                    <p style={{margin:"6px 0 0",fontSize:13,color:th.text2}}>7-day free trial included. No credit card required.</p>
                  </div>
                  <div style={{display:"flex",justifyContent:"center",gap:4,background:th.card2,border:`1px solid ${th.border}`,borderRadius:10,padding:3,width:"fit-content",margin:"0 auto 16px"}}>
                    {[["monthly","Monthly"],["annual","Annual"]].map(([b,lbl])=>(
                      <button key={b} onClick={()=>setBillingPeriod(b)} style={{padding:"6px 18px",borderRadius:8,border:"none",background:billingPeriod===b?th.gradient:"transparent",color:billingPeriod===b?"#fff":th.text2,fontSize:12,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",gap:6}}>
                        {lbl}{b==="annual"&&<span style={{fontSize:9,background:"rgba(16,185,129,0.2)",color:"#10B981",padding:"1px 6px",borderRadius:8}}>-20%</span>}
                      </button>
                    ))}
                  </div>
                  {[
                    {id:"starter",      name:"Essential",    monthly:49,  annual:39,  desc:"3 accounts · 1 member · 30 posts/mo"},
                    {id:"professional", name:"Professional", monthly:99,  annual:79,  desc:"10 accounts · 5 members · 100 posts/mo", popular:true},
                    {id:"agency",       name:"Enterprise",   monthly:199, annual:159, desc:"Unlimited accounts · 20 members · unlimited posts"},
                  ].map(p=>(
                    <div key={p.id} onClick={()=>setSelectedPlan(p.id)} style={{background:selectedPlan===p.id?"rgba(79,110,247,0.1)":th.card,border:`1.5px solid ${selectedPlan===p.id?th.accent:th.border}`,borderRadius:10,padding:"14px 16px",marginBottom:10,cursor:"pointer",display:"flex",justifyContent:"space-between",alignItems:"center",transition:"all 0.15s"}}>
                      <div>
                        <div style={{fontSize:13,fontWeight:800,color:th.text}}>
                          {p.name}
                          {p.popular&&<span style={{fontSize:9,background:"rgba(124,58,237,0.2)",color:"#A78BFA",padding:"2px 8px",borderRadius:10,marginLeft:8}}>Most popular</span>}
                        </div>
                        <div style={{fontSize:11,color:th.text2,marginTop:2}}>{p.desc}</div>
                      </div>
                      <div style={{textAlign:"right"}}>
                        <div style={{fontSize:18,fontWeight:800,color:th.accent}}>${billingPeriod==="annual"?p.annual:p.monthly}</div>
                        <div style={{fontSize:10,color:th.text2}}>/mo{billingPeriod==="annual"?" · billed yearly":""}</div>
                        {billingPeriod==="annual"&&<div style={{fontSize:9,color:"#10B981",marginTop:2}}>Save ${(p.monthly-p.annual)*12}/yr</div>}
                      </div>
                    </div>
                  ))}
                  <div style={{display:"flex",gap:8,marginTop:4}}>
                    <button onClick={()=>setSignupStep(1)} style={{flex:1,padding:"11px",borderRadius:11,background:"transparent",border:`1px solid ${th.border}`,color:th.text2,fontSize:13,fontWeight:600,cursor:"pointer"}}>← Back</button>
                    <button onClick={()=>setSignupStep(3)} style={{flex:2,padding:"13px",borderRadius:11,background:th.gradient,border:"none",color:"#fff",fontSize:14,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>Continue <ChevronRight size={15}/></button>
                  </div>
                </>
              )}

              {/* STEP 3 — Details */}
              {signupStep===3&&(
                <>
                  <div style={{marginBottom:24}}>
                    <h1 style={{margin:0,fontSize:22,fontWeight:900,letterSpacing:-0.5}}>Create your account</h1>
                    <p style={{margin:"6px 0 0",fontSize:13,color:th.text2}}>Almost there — set up your workspace in seconds.</p>
                  </div>
                  <div style={{display:"flex",alignItems:"center",gap:10,background:th.card,border:`1px solid ${th.border}`,borderRadius:11,padding:"11px 14px",marginBottom:10}}>
                    <Building2 size={15} color={th.text3}/>
                    <input value={companyName} onChange={e=>setCompanyName(e.target.value)} placeholder="Agency or company name" style={{background:"transparent",border:"none",outline:"none",color:th.text,fontSize:13,width:"100%",fontFamily:"inherit"}}/>
                  </div>
                  {inp("Your full name",name,e=>{setName(e.target.value);setError("");},"text")}
                  {inp("Work email address",email,e=>{setEmail(e.target.value);setError("");},"email")}
                  {inp("Password (min 8 characters)",pw,e=>{setPw(e.target.value);setError("");},"password")}
                  <div style={{display:"flex",alignItems:"flex-start",gap:10,marginBottom:20,marginTop:4}}>
                    <div onClick={()=>setTosAgreed(!tosAgreed)} style={{width:16,height:16,minWidth:16,borderRadius:4,border:`1.5px solid ${tosAgreed?th.accent:th.border}`,background:tosAgreed?"rgba(79,110,247,0.2)":"transparent",marginTop:1,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}}>
                      {tosAgreed&&<CheckCircle size={10} color={th.accent}/>}
                    </div>
                    <div style={{fontSize:11,color:th.text2,lineHeight:1.6}}>
                      I agree to Tawaslo's <a href="https://tawaslo.com/terms.html" target="_blank" rel="noreferrer" style={{color:th.accent}}>Terms of Service</a> and <a href="https://tawaslo.com/privacy.html" target="_blank" rel="noreferrer" style={{color:th.accent}}>Privacy Policy</a>. I confirm this is a business account and I will only connect business or creator social accounts.
                    </div>
                  </div>
                  <div style={{display:"flex",gap:8}}>
                    <button onClick={()=>{setSignupStep(2);setError("");}} style={{flex:1,padding:"11px",borderRadius:11,background:"transparent",border:`1px solid ${th.border}`,color:th.text2,fontSize:13,fontWeight:600,cursor:"pointer"}}>← Back</button>
                    <button onClick={handleSignUp} disabled={loading} style={{flex:2,padding:"13px",borderRadius:11,background:th.gradient,border:"none",color:"#fff",fontSize:14,fontWeight:700,cursor:loading?"not-allowed":"pointer",opacity:loading?0.7:1,display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
                      {loading?"Creating…":"Create workspace"} {!loading&&<ChevronRight size={15}/>}
                    </button>
                  </div>
                </>
              )}

              {/* STEP 4 — Success */}
              {signupStep===4&&(
                <div style={{textAlign:"center",padding:"20px 0"}}>
                  <div style={{width:60,height:60,borderRadius:"50%",background:"rgba(16,185,129,0.15)",border:"1.5px solid rgba(16,185,129,0.3)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 20px"}}>
                    <CheckCircle size={28} color="#10B981"/>
                  </div>
                  <h1 style={{margin:"0 0 10px",fontSize:22,fontWeight:900}}>Your workspace is live!</h1>
                  <p style={{fontSize:13,color:th.text2,lineHeight:1.7,marginBottom:24}}>Welcome email sent to your inbox.<br/>Confirm your email and sign in to get started.</p>
                  <button onClick={()=>{setAuthPage("login");setSignupStep(1);setError("");}} style={{width:"100%",padding:"13px",borderRadius:11,background:th.gradient,border:"none",color:"#fff",fontSize:14,fontWeight:700,cursor:"pointer"}}>
                    Go to sign in
                  </button>
                </div>
              )}
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
  const [showLanding, setShowLanding] = useState(true);
  const [isAuthed,  setIsAuthed]  = useState(false);
  const [authPage,  setAuthPage]  = useState("login");
  const [mode,      setMode]      = useState("agency");
  const [page,      setPage]      = useState(()=>sessionStorage.getItem('tw_page')||"overview");
  const [selClient, setSelClient] = useState({ id:null, name:"Workspace", plan:"", status:"active", free:false, accounts:0, posts:0, reach:"—", health:100, spend:0 });
  const [authReady, setAuthReady] = useState(false); // prevents flash of login screen
  const [userEmail, setUserEmail] = useState(null);
  const [clients,   setClients]   = useState([]);
  const [accountType, setAccountType] = useState("agency");
  const isAdminHost = typeof window !== "undefined" && window.location.hostname.indexOf(ADMIN_HOST_PREFIX) === 0;
  const isAdminUser = userEmail === ADMIN_EMAIL;

  // Load the signed-in user's real brands + decide which app (client vs admin) to show
  const loadWorkspace = async (user) => {
    setUserEmail(user.email || null);
    const { data: prof } = await getProfile(user.id);
    setAccountType(prof?.account_type || "agency");
    await ensureOctoFusionClient(user.id);
    const { data: rows } = await getClients(user.id);
    const norm = (rows || []).map(c => ({
      ...c,
      free: c.is_free ?? false,
      accounts: c.accounts ?? 0,
      posts: c.posts ?? 0,
      reach: c.reach ?? "—",
      health: c.health ?? 100,
      spend: c.spend ?? 0,
    }));
    setClients(norm);
    if (norm.length) setSelClient(norm[0]);
    const onAdminHost = typeof window !== "undefined" && window.location.hostname.indexOf(ADMIN_HOST_PREFIX) === 0;
    setMode(onAdminHost && user.email === ADMIN_EMAIL ? "owner" : "agency");
  };

  // Restore session on load
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setIsAuthed(true);
        loadWorkspace(session.user);
      }
      setAuthReady(true);
    });
    // Listen for auth changes (e.g. email confirmation callback)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthed(!!session?.user);
      if (session?.user) loadWorkspace(session.user);
    });
    return () => subscription.unsubscribe();
  }, []);

  const th = dark ? DARK : LIGHT;

  const savePage = (p) => { sessionStorage.setItem('tw_page', p); setPage(p); };
  const saveMode = (m) => { sessionStorage.setItem('tw_mode', m); setMode(m); };

  const ctx = {
    dark, setDark, lang, setLang,
    isAuthed, setIsAuthed,
    authPage, setAuthPage,
    mode, setMode: saveMode,
    page, setPage: savePage,
    selClient, setSelClient,
    clients, setClients,
    accountType,
  };

  const renderPage = () => {
    if (mode==="owner") {
      if (page==="overview") return <OwnerDashboard/>;
      return <Placeholder icon={Settings} title={page.charAt(0).toUpperCase()+page.slice(1)} description="This section is coming soon."/>;
    }
    if (page==="dashboard") return <AgencyDashboard/>;
    if (page==="social") return <SocialAccountsPage/>;
    if (page==="publisher") return <PublisherPage/>;
    if (page==="analytics") return <AnalyticsPage/>;
    if (page==="ads") return <AdsPage/>;
    if (page==="reports") return <ReportsPage/>;
    if (page==="inbox") return <InboxPage/>;
    if (page==="agencyteam") return <TeamPage/>;
    if (page==="billing") return <BillingPage/>;
    if (page==="agencysets") return <SettingsPage/>;
    const icons = {
      streams:Radio, listening:Activity,
      campaigns:Megaphone, aistudio:Wand2, media:Image,
    };
    const Icon = icons[page]||Settings;
    return <Placeholder icon={Icon} title={page.charAt(0).toUpperCase()+page.slice(1)} description="This page is being connected. Full version ready — linking it now."/>;
  };

  // Don't render anything until we've checked the session
  if (!authReady) return null;

  // admin.tawaslo.com is the private Super Admin console — only the admin email may enter
  if (isAdminHost && isAuthed && userEmail && !isAdminUser) {
    return (
      <AppCtx.Provider value={ctx}>
        <div style={{height:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:th.bg,color:th.text,fontFamily:"'Plus Jakarta Sans','Sora','Segoe UI',sans-serif",textAlign:"center",padding:24,direction:"ltr"}}>
          <div>
            <div style={{fontSize:20,fontWeight:900,marginBottom:8}}>Restricted area</div>
            <div style={{fontSize:13,color:th.text2,marginBottom:18}}>This is the Tawaslo admin console. Your account doesn't have access.</div>
            <a href="https://www.tawaslo.com" style={{color:th.accent,fontSize:13,fontWeight:700,textDecoration:"none"}}>Go to your dashboard →</a>
          </div>
        </div>
      </AppCtx.Provider>
    );
  }

  if (showLanding && !isAuthed) {
    return (
      <AppCtx.Provider value={ctx}>
        <LandingPage onGetStarted={()=>setShowLanding(false)} onLogin={()=>setShowLanding(false)}/>
      </AppCtx.Provider>
    );
  }

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
        fontFamily:"'Plus Jakarta Sans','Sora','Segoe UI',sans-serif",
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