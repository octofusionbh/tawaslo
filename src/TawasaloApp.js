import { useState, useEffect, useRef, createContext, useContext } from "react";
import { createPortal } from "react-dom";
import { supabase, signIn, signUp, signOut, createProfile, createInitialClient, resetPassword, updatePassword, ensureOctoFusionClient, getProfile, updateProfile, getClients,
  getPromoCodes, createPromoCode, updatePromoCode, deletePromoCode,
  getGiftCards, createGiftCard, updateGiftCard,
  getSupportTickets, createSupportTicket, updateSupportTicket, getSupportMessages, addSupportMessage } from './supabase';
import {
  LayoutDashboard, Calendar, BarChart2, Megaphone, Users,
  Settings, Plus, Search, Bell, Globe, Image, Clock, Send,
  Heart, Bookmark, TrendingUp, Eye, CheckCircle, Circle,
  Download, ArrowUpRight, ArrowDownRight, Inbox, Star,
  Target, PieChart, Activity, UserPlus, Building2, FileText,
  CreditCard, LogOut, ChevronRight, ChevronLeft, ChevronDown,
  Radio, Edit3, XCircle, Link, Shield, DollarSign, Sparkles,
  ArrowLeft, Lock, Mail, User, MessageCircle, Sun, Moon,
  Languages, Wand2, MoreHorizontal, RefreshCw, Menu,
  Gift, Tag, LifeBuoy, Copy, Trash2, Pause, Play, Send as SendIcon,
  Monitor, Info, ScanLine, Check,
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
  bg:"#090C10", surface:"#0A0D11", card:"#141923", card2:"#10141C",
  border:"#232B38", text:"#F2F5F9", text2:"#8794A8", text3:"#5A6577",
  accent:"#6E8CAB", accent2:"#8AA0BE",
  accentSoft:"rgba(110,140,171,0.12)", accent2Soft:"rgba(138,160,190,0.10)",
  success:"#10B981", successSoft:"rgba(16,185,129,0.1)",
  warning:"#F59E0B", warningSoft:"rgba(245,158,11,0.1)",
  danger:"#EF4444", dangerSoft:"rgba(239,68,68,0.1)",
  info:"#06B6D4", infoSoft:"rgba(6,182,212,0.1)",
  orange:"#F97316", orangeSoft:"rgba(249,115,22,0.1)",
  chart1:"#4F6EF7", chart2:"#7C3AED", chart3:"#2DD4BF",
  gradient:"linear-gradient(135deg,#6E8CAB,#4F6B8C)",
  gradientSoft:"linear-gradient(135deg,rgba(110,140,171,0.12),rgba(79,107,140,0.08))",
  shadow:"0 4px 20px rgba(0,0,0,0.5)",
  insta:"#E1306C", fb:"#1877F2", tw:"#1DA1F2", li:"#0A66C2", tt:"#FF0050", yt:"#FF0000",
};

const LIGHT = {
  bg:"#F6F8FA", surface:"#FFFFFF", card:"#FFFFFF", card2:"#F3F6F9",
  border:"#E6E9EF", text:"#16181D", text2:"#5B6576", text3:"#9AA4B2",
  accent:"#4F6B8C", accent2:"#3E5C7E",
  accentSoft:"rgba(79,107,140,0.08)", accent2Soft:"rgba(62,92,126,0.07)",
  success:"#16A34A", successSoft:"rgba(22,163,74,0.08)",
  warning:"#D97706", warningSoft:"rgba(217,119,6,0.08)",
  danger:"#DC2626", dangerSoft:"rgba(220,38,38,0.08)",
  info:"#0891B2", infoSoft:"rgba(8,145,178,0.08)",
  orange:"#EA6B0A", orangeSoft:"rgba(234,107,10,0.08)",
  chart1:"#4F6EF7", chart2:"#7C3AED", chart3:"#0D9488",
  gradient:"linear-gradient(135deg,#5E7A99,#42566F)",
  gradientSoft:"linear-gradient(135deg,rgba(79,107,140,0.06),rgba(62,92,126,0.05))",
  shadow:"0 4px 20px rgba(20,30,50,0.06)",
  insta:"#E1306C", fb:"#1877F2", tw:"#1DA1F2", li:"#0A66C2", tt:"#FF0050", yt:"#FF0000",
};

// ── Free-trial limits ──────────────────────────────────────────────
// Trial users get the full product for 30 days, but with caps that nudge
// them to upgrade: AI is the headline paid feature (5 free generations,
// then locked), up to 3 connected accounts, and a capped post volume.
// Tracked in localStorage so it works before billing is wired. The demo
// and owner accounts are always full-access so the product shows complete.
const TRIAL = { ai: 5, accounts: 3, posts: 10 };
const FULL_ACCESS_EMAILS = ["demo@tawaslo.com", "octofusionbh@gmail.com"];
function isTrialUser(email) {
  if (!email) return false;
  const e = String(email).toLowerCase();
  if (FULL_ACCESS_EMAILS.includes(e)) return false;
  if (localStorage.getItem("tw_paid_" + e) === "1") return false;
  return true;
}
function aiUsesOf(email) { return parseInt(localStorage.getItem("tw_aiuses_" + String(email).toLowerCase()) || "0", 10); }
function bumpAiUses(email) { const n = aiUsesOf(email) + 1; localStorage.setItem("tw_aiuses_" + String(email).toLowerCase(), String(n)); return n; }
function postsOf(email) { return parseInt(localStorage.getItem("tw_posts_" + String(email).toLowerCase()) || "0", 10); }
function bumpPosts(email, by = 1) { const n = postsOf(email) + by; localStorage.setItem("tw_posts_" + String(email).toLowerCase(), String(n)); return n; }
function markTrialStart(email) {
  const e = String(email).toLowerCase();
  if (!localStorage.getItem("tw_trial_start_" + e)) localStorage.setItem("tw_trial_start_" + e, String(Date.now()));
}
const TRIAL_DAYS = 30;
// Whole days remaining in the trial. Paid/full-access return a large number.
function trialDaysLeft(email) {
  if (!email) return TRIAL_DAYS;
  const e = String(email).toLowerCase();
  if (FULL_ACCESS_EMAILS.includes(e) || localStorage.getItem("tw_paid_" + e) === "1") return 999;
  const start = parseInt(localStorage.getItem("tw_trial_start_" + e) || "0", 10);
  if (!start) return TRIAL_DAYS;
  const elapsed = (Date.now() - start) / 86400000;
  return Math.max(0, Math.ceil(TRIAL_DAYS - elapsed));
}
// Soft paywall: trial users whose days have run out. Their data stays visible,
// but publishing / scheduling / AI are locked until they upgrade.
function trialEnded(email) { return isTrialUser(email) && trialDaysLeft(email) <= 0; }

// Reusable upgrade prompt — shown when a trial user hits a cap.
function UpgradeGate({ open, onClose, onUpgrade, th, title, detail, Icon }) {
  if (!open) return null;
  const I = Icon || (()=>null);
  return (
    <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(4,6,12,0.72)",backdropFilter:"blur(4px)",zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
      <div onClick={e=>e.stopPropagation()} style={{width:"100%",maxWidth:420,background:th.card,border:`1px solid ${th.border}`,borderRadius:18,padding:28,textAlign:"center",boxShadow:th.shadow}}>
        <div style={{width:60,height:60,borderRadius:16,background:th.gradient,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 16px"}}><I size={28} color="#fff"/></div>
        <h2 style={{margin:"0 0 8px",fontSize:20,fontWeight:800,color:th.text,letterSpacing:-0.4}}>{title}</h2>
        <p style={{margin:"0 0 22px",fontSize:13.5,color:th.text2,lineHeight:1.65}}>{detail}</p>
        <button onClick={onUpgrade} style={{width:"100%",padding:"13px",borderRadius:12,background:th.gradient,border:"none",color:"#fff",fontSize:14,fontWeight:700,cursor:"pointer",marginBottom:10}}>Upgrade to unlock</button>
        <button onClick={onClose} style={{width:"100%",padding:"11px",borderRadius:12,background:"transparent",border:`1px solid ${th.border}`,color:th.text2,fontSize:13,fontWeight:600,cursor:"pointer"}}>Maybe later</button>
      </div>
    </div>
  );
}

// ── AI image credits ───────────────────────────────────────────────
// Image generation is a paid add-on sold in monthly packs, scoped per client
// account. Each client gets a small free taste per month; buying a pack lifts
// the cap. Tracked in localStorage (per client, per calendar month) so it
// works before billing is wired, mirroring the trial-limit pattern above.
// Full-access accounts (the agency owner) are never capped.
const IMG_PACKS = [
  { id:"lite", name:"Lite", images:50,  price:18.9 },
  { id:"plus", name:"Plus", images:100, price:24.9, popular:true },
  { id:"max",  name:"Max",  images:250, price:39.9 },
];
const IMG_FREE = 5; // free images per client per month, before any pack
function imgMonthKey() { const d = new Date(); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0"); }
function imgPackOf(clientId) { try { return clientId ? (localStorage.getItem("tw_imgpack_" + clientId) || null) : null; } catch (e) { return null; } }
function setImgPackOf(clientId, packId) { try { if (!clientId) return; if (packId) localStorage.setItem("tw_imgpack_" + clientId, packId); else localStorage.removeItem("tw_imgpack_" + clientId); } catch (e) { /* ignore */ } }
function imgUsedOf(clientId) { try { return clientId ? parseInt(localStorage.getItem("tw_img_" + clientId + "_" + imgMonthKey()) || "0", 10) : 0; } catch (e) { return 0; } }
function bumpImgUsed(clientId, by = 1) { try { if (!clientId) return 0; const n = imgUsedOf(clientId) + by; localStorage.setItem("tw_img_" + clientId + "_" + imgMonthKey(), String(n)); return n; } catch (e) { return 0; } }
function imgLimitOf(acct) {
  const p = IMG_PACKS.find(x => x.id === imgPackOf(acct));
  return p ? p.images : IMG_FREE;
}

// Short, card-style agency name: keeps the first two words of a long company
// name (e.g. "Octo Fusion Collective Hub" -> "Octo Fusion") so the topbar and
// sidebar read like a clean business card.
function shortCompany(name) {
  if (!name || !name.trim()) return "";
  const w = name.trim().split(/\s+/);
  return w.length > 2 ? w.slice(0, 2).join(" ") : name.trim();
}

// Count-up number — animates from 0 to the target once it scrolls into view,
// so stat figures feel live. format() controls how the running value renders.
function CountUp({ to, duration = 1500, format, className, style }) {
  const [val, setVal] = useState(0);
  const ref = useRef(null);
  const done = useRef(false);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const start = () => {
      if (done.current) return; done.current = true;
      const t0 = performance.now();
      const step = (now) => {
        const p = Math.min(1, (now - t0) / duration);
        const e = 1 - Math.pow(1 - p, 3);
        setVal(to * e);
        if (p < 1) requestAnimationFrame(step); else setVal(to);
      };
      requestAnimationFrame(step);
    };
    if (typeof IntersectionObserver !== "undefined") {
      const io = new IntersectionObserver(ents => ents.forEach(en => { if (en.isIntersecting) { start(); io.disconnect(); } }), { threshold: 0.5 });
      io.observe(el);
      return () => io.disconnect();
    }
    start();
  }, [to, duration]);
  return <span ref={ref} className={className} style={style}>{format ? format(val) : Math.round(val)}</span>;
}

// ── Skeleton loaders ───────────────────────────────────────────────
// Shaped shimmering placeholders shown while data loads, instead of a plain
// "Loading…" line. Sk is the primitive; the others compose common layouts.
function Sk({ w = "100%", h = 12, r = 8, mb = 0, style }) {
  return <div className="tw-sk" style={{ width: w, height: h, borderRadius: r, marginBottom: mb, flexShrink: 0, ...style }} />;
}
function SkStatRow({ th, n = 4 }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: `repeat(${n},1fr)`, gap: 12, marginBottom: 14 }}>
      {Array.from({ length: n }).map((_, i) => (
        <div key={i} style={{ background: th.card, border: `1px solid ${th.border}`, borderRadius: 14, padding: 16 }}><Sk w={54} h={11} mb={12} /><Sk w={78} h={24} r={7} /></div>
      ))}
    </div>
  );
}
function SkChart({ th, h = 120 }) {
  return (
    <div style={{ background: th.card, border: `1px solid ${th.border}`, borderRadius: 14, padding: 18 }}>
      <Sk w={140} h={12} mb={18} />
      <div style={{ display: "flex", alignItems: "flex-end", gap: 10, height: h }}>
        {[54, 72, 46, 88, 64, 96, 58, 80].map((b, i) => <Sk key={i} w="100%" h={b + "%"} style={{ flex: 1 }} />)}
      </div>
    </div>
  );
}
function SkList({ th, rows = 5 }) {
  return (
    <div style={{ background: th.card, border: `1px solid ${th.border}`, borderRadius: 14, overflow: "hidden" }}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 18px", borderBottom: i < rows - 1 ? `1px solid ${th.border}` : "none" }}>
          <Sk w={36} h={36} r={18} /><div style={{ flex: 1 }}><Sk w="45%" h={11} mb={8} /><Sk w="75%" h={9} /></div><Sk w={26} h={9} />
        </div>
      ))}
    </div>
  );
}
function SkCards({ th, count = 8, h = 150, min = 180 }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: `repeat(auto-fill,minmax(${min}px,1fr))`, gap: 14 }}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} style={{ background: th.card, border: `1px solid ${th.border}`, borderRadius: 14, overflow: "hidden" }}><Sk h={h} r={0} /><div style={{ padding: 12 }}><Sk w="55%" h={11} mb={8} /><Sk w="35%" h={9} /></div></div>
      ))}
    </div>
  );
}

// Privacy-blurred avatar — a soft, face-toned circle that reads like a real
// profile photo with the identity hidden, instead of a flat initials chip.
function BlurAvatar({ size = 28, hue = 20 }) {
  const inset = -Math.round(size * 0.2);
  const blur = Math.max(3, Math.round(size * 0.14));
  return (
    <div style={{ width:size, height:size, borderRadius:"50%", overflow:"hidden", flexShrink:0, position:"relative", border:"1px solid rgba(255,255,255,0.08)" }}>
      <div style={{ position:"absolute", inset:inset, background:`radial-gradient(circle at 50% 34%, hsl(${hue},48%,74%) 0%, hsl(${hue},42%,52%) 42%, hsl(${(hue+210)%360},22%,28%) 74%, #161d2a 100%)`, filter:`blur(${blur}px)` }}/>
    </div>
  );
}

// Visitor geo -> local currency, fetched once and cached, for the "approx" line.
let _twGeo = null;
function useGeo() {
  const [geo, setGeo] = useState(_twGeo);
  useEffect(() => {
    if (_twGeo) { setGeo(_twGeo); return; }
    let on = true;
    fetch('/api/generate-caption', { method:'POST', headers:{ 'Content-Type':'application/json' }, body: JSON.stringify({ mode:'geo' }) })
      .then(r => r.json()).then(d => { _twGeo = d || {}; if (on) setGeo(_twGeo); }).catch(() => {});
    return () => { on = false; };
  }, []);
  return geo;
}
function approxLabel(geo, usd) {
  if (!geo || !geo.currency || geo.currency === 'USD' || !geo.rate || geo.rate === 1) return null;
  const v = usd * geo.rate;
  const r = v >= 10 ? Math.round(v) : Math.round(v * 10) / 10;
  return "approx " + r + " " + geo.currency;
}

// Reusable pack picker — used in the paywall modal, Billing, and the homepage.
function ImagePackPicker({ th, geo, currentPack, onChoose }) {
  return (
    <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(165px,1fr))", gap:12 }}>
      {IMG_PACKS.map(p => {
        const on = currentPack === p.id;
        const ap = approxLabel(geo, p.price);
        return (
          <div key={p.id} style={{ background:th.card, border:`${p.popular?2:1}px solid ${p.popular?th.accent:th.border}`, borderRadius:14, padding:"18px 16px", display:"flex", flexDirection:"column", position:"relative" }}>
            {p.popular && <div style={{ position:"absolute", top:-10, left:"50%", transform:"translateX(-50%)", background:th.accent, color:"#06090F", fontSize:10, fontWeight:700, letterSpacing:0.5, textTransform:"uppercase", padding:"3px 12px", borderRadius:20, whiteSpace:"nowrap" }}>Most popular</div>}
            <div style={{ fontSize:11, letterSpacing:0.6, textTransform:"uppercase", color:th.accent, fontWeight:700, marginBottom:12 }}>{p.name}</div>
            <div style={{ display:"flex", alignItems:"baseline" }}>
              <span className="tw-num" style={{ fontSize:30, fontWeight:600, color:th.text, letterSpacing:-0.5, lineHeight:1 }}>${p.price}</span>
              <span style={{ fontSize:13, color:th.text3, fontWeight:500, marginLeft:2 }}>/mo</span>
            </div>
            {ap && <div style={{ fontSize:10.5, color:th.text3, marginTop:5 }}>{ap}</div>}
            <div style={{ margin:"13px 0 16px", paddingTop:13, borderTop:`1px solid ${th.border}` }}>
              <span className="tw-num" style={{ fontSize:18, fontWeight:600, color:th.text2 }}>{p.images}</span>
              <span style={{ fontSize:12, color:th.text3, fontWeight:500 }}> images / month</span>
            </div>
            <button onClick={() => onChoose && onChoose(p)} style={{ marginTop:"auto", width:"100%", padding:11, borderRadius:10, background:p.popular?th.gradient:"transparent", border:p.popular?"none":`1px solid ${th.border}`, color:p.popular?"#fff":th.text2, fontSize:13, fontWeight:p.popular?700:600, cursor:"pointer" }}>{on ? "Current plan" : "Choose " + p.name}</button>
          </div>
        );
      })}
    </div>
  );
}

// Paywall modal — pops when an agency runs out of credits. Paid agencies get the
// pack picker; trial/free agencies are sent to upgrade their plan first, since
// image packs are a paid-plan add-on.
function ImagePaywallModal({ open, onClose, th, geo, used, limit, currentPack, onChoose, isPaid, onUpgrade }) {
  if (!open) return null;
  const out = used >= limit;
  return (
    <div onClick={onClose} style={{ position:"fixed", inset:0, background:"rgba(4,6,12,0.72)", backdropFilter:"blur(4px)", zIndex:9999, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
      <div onClick={e => e.stopPropagation()} style={{ width:"100%", maxWidth:isPaid?480:420, background:th.card, border:`1px solid ${th.border}`, borderRadius:18, padding:24, boxShadow:th.shadow }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:6 }}>
          <div style={{ width:42, height:42, borderRadius:11, background:th.accentSoft, display:"flex", alignItems:"center", justifyContent:"center" }}><Image size={20} color={th.accent}/></div>
          <button onClick={onClose} style={{ background:"none", border:"none", color:th.text3, cursor:"pointer", display:"flex" }}><XCircle size={18}/></button>
        </div>
        {isPaid ? (
          <>
            <div style={{ fontSize:18, fontWeight:700, color:th.text, margin:"12px 0 5px", letterSpacing:-0.3 }}>{out ? "You are out of image credits" : "Add AI image credits"}</div>
            <div style={{ fontSize:12.5, color:th.text2, lineHeight:1.6, marginBottom:20 }}>Create and edit on-brand images with Gemini, right inside your studio. Pick a monthly pack for your agency. Credits refresh every month.</div>
            <ImagePackPicker th={th} geo={geo} currentPack={currentPack} onChoose={onChoose}/>
            <div style={{ textAlign:"center", marginTop:14, fontSize:11, color:th.text3 }}>Secure payment. Cancel anytime. Billed in USD.</div>
          </>
        ) : (
          <>
            <div style={{ fontSize:18, fontWeight:700, color:th.text, margin:"12px 0 5px", letterSpacing:-0.3 }}>{out ? "You've used your free images" : "Unlock AI image generation"}</div>
            <div style={{ fontSize:12.5, color:th.text2, lineHeight:1.6, marginBottom:20 }}>AI image generation is a paid add-on. Choose a plan, then add a monthly image pack for your agency to keep generating and editing on-brand images.</div>
            <button onClick={onUpgrade} style={{ width:"100%", padding:"13px", borderRadius:12, background:th.gradient, border:"none", color:"#fff", fontSize:14, fontWeight:700, cursor:"pointer", marginBottom:10 }}>See plans</button>
            <button onClick={onClose} style={{ width:"100%", padding:"11px", borderRadius:12, background:"transparent", border:`1px solid ${th.border}`, color:th.text2, fontSize:13, fontWeight:600, cursor:"pointer" }}>Maybe later</button>
          </>
        )}
      </div>
    </div>
  );
}

// Trial lifecycle popup: a 5-days-left nudge (once a day) and the trial-ended
// soft paywall prompt. Data stays visible; this just encourages upgrade.
function TrialLifecycle() {
  const { userEmail, setPage, dark, lang } = useApp();
  const th = dark ? DARK : LIGHT;
  const isAR = lang === "ar"; const L = (en, ar) => isAR ? ar : en;
  const days = trialDaysLeft(userEmail);
  const ended = trialEnded(userEmail);
  const trialing = isTrialUser(userEmail);
  const [show, setShow] = useState(false);
  useEffect(() => {
    if (!trialing) return;
    if (ended) { setShow(true); return; }
    if (days <= 5) {
      try { const key = "tw_trialpop_" + new Date().toISOString().slice(0,10);
        if (!sessionStorage.getItem(key)) { setShow(true); sessionStorage.setItem(key, "1"); }
      } catch(e) { setShow(true); }
    }
  }, []); // eslint-disable-line
  if (!trialing || !show) return null;
  const title = ended ? L("Your free trial has ended","انتهت فترتك التجريبية")
    : (isAR ? `تبقّى ${days} ${days===1?"يوم":"أيام"} في تجربتك` : `${days} ${days===1?"day":"days"} left in your trial`);
  const body = ended
    ? L("Your dashboard, analytics and connected accounts are all still here. Upgrade to publish, schedule and use AI again.","لوحتك وتحليلاتك وحساباتك المرتبطة لا تزال موجودة. قم بالترقية لتعود للنشر والجدولة واستخدام الذكاء الاصطناعي.")
    : L("Keep your momentum going — upgrade now to unlock unlimited publishing, AI captions and accounts.","حافظ على زخمك — قم بالترقية الآن لفتح النشر غير المحدود وتعليقات الذكاء الاصطناعي والحسابات.");
  return createPortal((
    <div onClick={()=>setShow(false)} style={{position:"fixed",inset:0,background:"rgba(4,6,12,0.78)",backdropFilter:"blur(4px)",zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
      <div onClick={e=>e.stopPropagation()} style={{width:"100%",maxWidth:430,background:th.card,border:`1px solid ${th.border}`,borderRadius:18,padding:26,textAlign:"center",boxShadow:th.shadow}}>
        <div style={{width:58,height:58,borderRadius:16,background:ended?th.dangerSoft:th.gradient,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 16px"}}>{ended?<Lock size={26} color={th.danger}/>:<Sparkles size={26} color="#fff"/>}</div>
        <h2 style={{margin:"0 0 8px",fontSize:20,fontWeight:800,color:th.text,letterSpacing:-0.4}}>{title}</h2>
        <p style={{margin:"0 0 22px",fontSize:13.5,color:th.text2,lineHeight:1.65}}>{body}</p>
        <button onClick={()=>{ setShow(false); setPage("billing"); }} style={{width:"100%",padding:"13px",borderRadius:12,background:th.gradient,border:"none",color:"#fff",fontSize:14,fontWeight:700,cursor:"pointer",marginBottom:10}}>{L("Upgrade now","الترقية الآن")}</button>
        <button onClick={()=>setShow(false)} style={{width:"100%",padding:"11px",borderRadius:12,background:"transparent",border:`1px solid ${th.border}`,color:th.text2,fontSize:13,fontWeight:600,cursor:"pointer"}}>{ended?L("Continue viewing","متابعة العرض"):L("Not now","ليس الآن")}</button>
      </div>
    </div>
  ), document.body);
}

const PLATFORMS = [
  {id:"ig",name:"Instagram",color:"insta"},
  {id:"fb",name:"Facebook", color:"fb"  },
  {id:"tw",name:"Twitter/X",color:"tw"  },
  {id:"li",name:"LinkedIn", color:"li"  },
  {id:"tt",name:"TikTok",   color:"tt"  },
  {id:"yt",name:"YouTube",  color:"yt"  },
];

const ADMIN_EMAIL = 'octofusionbh@gmail.com';
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
const TR = {
  en: {},
  ar: {
    "nav.overview":"نظرة عامة","nav.clients":"العملاء","nav.revenue":"الإيرادات","nav.apiusage":"الاستخدام",
    "nav.dashboard":"الرئيسية","nav.publisher":"النشر","nav.planner":"المخطط","nav.streams":"التدفقات",
    "nav.inbox":"الوارد","nav.listening":"الاستماع","nav.campaigns":"الحملات","nav.aistudio":"استوديو الذكاء",
    "nav.media":"الوسائط","nav.analytics":"التحليلات","nav.ads":"الإعلانات","nav.reports":"التقارير",
    "nav.social":"الحسابات","nav.team":"الفريق","nav.agencyteam":"الفريق","nav.billing":"الفوترة",
    "nav.settings":"الإعدادات","nav.agencysets":"الإعدادات",
    "sec.Manage":"الإدارة","sec.Create":"الإنشاء","sec.Analyse":"التحليل","sec.Account":"الحساب",
    "btn.createPost":"إنشاء منشور","btn.newCampaign":"حملة جديدة","btn.logout":"تسجيل الخروج",
    "btn.export":"تصدير","btn.owner":"المالك",
    "theme.dark":"داكن","theme.light":"فاتح","brand.tagline":"ذكاء اجتماعي","common.search":"بحث...",
  },
};
const useApp = () => useContext(AppCtx);

function useIsMobile(bp = 820) {
  const [m, setM] = useState(typeof window !== 'undefined' ? window.innerWidth < bp : false);
  useEffect(() => {
    const on = () => setM(window.innerWidth < bp);
    window.addEventListener('resize', on);
    return () => window.removeEventListener('resize', on);
  }, [bp]);
  return m;
}

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

function StatCard({ label, value, change, up, Icon:I, color="accent", spark, sub }) {
  const th = useTheme();
  const [disp, setDisp] = useState(value);
  // Tiny trend line under the metric — the kind of detail real products have.
  const sparkPath = (vals, w, h) => { if(!vals||vals.length<2) return ""; const mx=Math.max(...vals),mn=Math.min(...vals),r=(mx-mn)||1; return "M"+vals.map((v,i)=>((i/(vals.length-1))*w).toFixed(1)+","+(h-((v-mn)/r)*(h-3)-1.5).toFixed(1)).join(" L"); };
  useEffect(() => {
    const str = String(value);
    const m = str.match(/^([^\d.-]*)(-?[\d,]*\.?\d+)(.*)$/);
    if (!m) { setDisp(str); return; }
    const prefix = m[1], suffix = m[3];
    const target = parseFloat(m[2].replace(/,/g, ''));
    const decimals = (m[2].split('.')[1] || '').length;
    if (!isFinite(target)) { setDisp(str); return; }
    let raf, start;
    const dur = 900;
    const tick = (t) => {
      if (!start) start = t;
      const p = Math.min(1, (t - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      const cur = target * eased;
      const num = decimals > 0 ? cur.toFixed(decimals) : Math.round(cur).toLocaleString();
      if (p < 1) { setDisp(prefix + num + suffix); raf = requestAnimationFrame(tick); }
      else setDisp(str);
    };
    raf = requestAnimationFrame(tick);
    return () => { if (raf) cancelAnimationFrame(raf); };
  }, [value]);
  return (
    <div style={{
      background:th.card, borderRadius:18, border:`1px solid ${th.border}`,
      padding:"18px 20px", boxShadow:"none",
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
      <div className="tw-num" style={{fontSize:27,fontWeight:600,letterSpacing:-0.5,marginBottom:sub?1:3}}>{disp}</div>
      {sub && <div className="tw-num" style={{fontSize:11.5,color:th.text3,marginBottom:3}}>{sub}</div>}
      <div style={{fontSize:12,color:th.text2}}>{label}</div>
      {spark && spark.length>1 && (
        <svg width="100%" height="22" viewBox="0 0 100 22" preserveAspectRatio="none" style={{marginTop:10,display:"block"}}>
          <path d={sparkPath(spark,100,22)} fill="none" stroke={th[color]||th.accent} strokeWidth="1.6" vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" opacity="0.85"/>
        </svg>
      )}
    </div>
  );
}

function Sidebar() {
  const { dark, setDark, lang, setLang, mode, setMode, page, setPage,
          selClient, setSelClient, setIsAuthed, clients, t, mobileNav, setMobileNav,
          userName, userEmail, accountType, userPlan, userCompany } = useApp();
  const th = useTheme();
  const isAR = lang==="ar";
  const L = (en, ar) => isAR ? ar : en;
  const isMobile = useIsMobile();
  const [acctOpen, setAcctOpen] = useState(false);   // account dropdown (settings / log out)
  // On mobile, navigating closes the slide-out drawer.
  useEffect(() => { if (isMobile && setMobileNav) setMobileNav(false); }, [page]); // eslint-disable-line
  // Account + plan card (Option A)
  const planTrial = (() => { try { return isTrialUser(userEmail); } catch(e){ return false; } })();
  const sbName = (userName && userName.trim()) ? userName.replace(/\b\w/g, c=>c.toUpperCase()) : (userEmail ? userEmail.split('@')[0].replace(/\b\w/g,c=>c.toUpperCase()) : "Account");
  const sbInit = sbName.replace(/[^A-Za-z]/g,"").slice(0,2).toUpperCase() || "AC";
  const sbSub = shortCompany(userCompany) || (userEmail === ADMIN_EMAIL ? "Octo Fusion" : (accountType==="freelancer" ? "" : accountLabelOf(accountType)));
  const planLabel = planTrial ? L("Free trial","نسخة تجريبية") : (userPlan ? (userPlan.charAt(0).toUpperCase()+userPlan.slice(1)) : L("Pro","احترافي"));
  const [collapsed, setCollapsed] = useState(()=>{ try{ return localStorage.getItem('tw_sidebar')==='1'; }catch(e){ return false; } });
  useEffect(()=>{ try{ localStorage.setItem('tw_sidebar', collapsed?'1':'0'); }catch(e){} },[collapsed]);
  const col = collapsed && !isMobile; // effective collapsed (mobile uses the drawer, never the rail)

  const OWNER_NAV = [
    {key:"overview", Icon:LayoutDashboard, label:"Overview"     },
    {key:"clients",  Icon:Building2,       label:"All Clients"  },
    {key:"revenue",  Icon:DollarSign,      label:"Revenue"      },
    {key:"promos",   Icon:Tag,             label:"Promo Codes"  },
    {key:"gifts",    Icon:Gift,            label:"Gift Cards"   },
    {key:"support",  Icon:LifeBuoy,        label:"Support"      },
    {key:"apiusage", Icon:Activity,        label:"API & Usage"  },
    {key:"team",     Icon:Users,           label:"Team"         },
    {key:"settings", Icon:Settings,        label:"Settings"     },
  ];

  const AGENCY_NAV = [
    {section:"Manage", items:[
      {key:"dashboard", Icon:LayoutDashboard, label:"Dashboard", badge:null},
      {key:"publisher", Icon:Edit3,           label:"Publisher", badge:null},
      {key:"planner",   Icon:Calendar,        label:"Planner",   badge:null},
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
      {key:"clients",    Icon:Building2,       label:"Clients",   badge:null},
      {key:"social",     Icon:Link,           label:"Social Accounts", badge:null},
      {key:"agencyteam", Icon:Users,          label:"Team",      badge:null},
      {key:"billing",    Icon:CreditCard,     label:"Billing",   badge:null},
      {key:"agencysets", Icon:Settings,       label:"Settings",  badge:null},
    ]},
  ];

  const navItem = (key, Icon, label, badge, isActive, onClick) => (
    <div key={key} onClick={onClick} title={col?label:undefined} style={{
      display:"flex", alignItems:"center", justifyContent:col?"center":"space-between",
      padding:col?"10px 0":"8px 10px", borderRadius:9, marginBottom:1, cursor:"pointer",
      background:isActive?th.accentSoft:"transparent",
      color:isActive?th.accent:th.text2,
      fontWeight:isActive?600:400, fontSize:12.5,
      borderLeft:!isAR&&isActive&&!col?`3px solid ${th.accent}`:"3px solid transparent",
      borderRight:isAR&&isActive&&!col?`3px solid ${th.accent}`:"3px solid transparent",
      transition:"all 0.15s", position:"relative",
    }}>
      <div style={{display:"flex",alignItems:"center",gap:9}}>
        <Icon size={col?18:15} strokeWidth={isActive?2.2:1.7}/>{!col&&label}
      </div>
      {!col&&badge&&<span style={{background:th.danger,color:"#fff",borderRadius:10,fontSize:9,fontWeight:700,padding:"1px 6px"}}>{badge}</span>}
      {col&&badge&&<span style={{position:"absolute",top:4,right:10,width:6,height:6,borderRadius:"50%",background:th.danger}}/>}
    </div>
  );

  const drawer = isMobile ? {
    position:"fixed", top:0, [isAR?"right":"left"]:0, height:"100vh",
    transform: mobileNav ? "none" : (isAR ? "translateX(101%)" : "translateX(-101%)"),
    transition:"transform 0.28s cubic-bezier(0.2,0.7,0.2,1)", zIndex:200,
  } : {};
  return (
    <>
    {isMobile && mobileNav && <div onClick={()=>setMobileNav(false)} style={{position:"fixed",inset:0,background:"rgba(3,5,10,0.6)",backdropFilter:"blur(2px)",zIndex:190}}/>}
    <aside style={{
      width:col?68:230, flexShrink:0, background:th.surface,
      borderRight:!isAR?`1px solid ${th.border}`:"none",
      borderLeft:isAR?`1px solid ${th.border}`:"none",
      display:"flex", flexDirection:"column",
      boxShadow:th.shadow, zIndex:30, overflow:"hidden",
      transition:"width 0.2s cubic-bezier(0.2,0.7,0.2,1)",
      ...drawer,
    }}>
      <div style={{padding:col?"18px 0 12px":"20px 14px 14px",display:"flex",alignItems:"center",justifyContent:col?"center":"space-between",gap:10}}>
        <div style={{display:"flex",alignItems:"center",gap:10,minWidth:0}}>
          <img src="/logo-transparent.png" alt="Tawaslo" style={{width:col?32:38,height:col?32:38,objectFit:"contain",flexShrink:0}}/>
          {!col&&<div>
            <div style={{fontWeight:900,fontSize:18,letterSpacing:-0.8,lineHeight:1}}>Tawaslo</div>
            <div style={{fontSize:9,color:th.text2,letterSpacing:0.4,marginTop:1,textTransform:"uppercase"}}>{t("brand.tagline","Social Intelligence")}</div>
          </div>}
        </div>
        {!isMobile&&!col&&<button onClick={()=>setCollapsed(true)} title="Collapse sidebar" style={{background:"transparent",border:"none",cursor:"pointer",color:th.text2,display:"flex",padding:4,borderRadius:6}}>{isAR?<ChevronRight size={17}/>:<ChevronLeft size={17}/>}</button>}
      </div>
      {!isMobile&&col&&<div style={{display:"flex",justifyContent:"center",paddingBottom:8}}><button onClick={()=>setCollapsed(false)} title="Expand sidebar" style={{background:th.card2,border:`1px solid ${th.border}`,borderRadius:8,width:34,height:28,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",color:th.text2}}>{isAR?<ChevronLeft size={15}/>:<ChevronRight size={15}/>}</button></div>}

      {mode==="agency"&&!col&&(
        <div style={{padding:"0 14px 12px"}}>
          <div style={{background:th.card2,border:`1px solid ${th.border}`,borderRadius:9,padding:"8px 11px",cursor:"pointer",marginBottom:6}}>
            <div style={{fontSize:11,fontWeight:700}}>{selClient.name}</div>
            <div style={{fontSize:9,color:th.text2,marginTop:1}}>{selClient.accounts} connected account{selClient.accounts===1?"":"s"}</div>
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
            </div>
          ))}
        </div>
      )}

      {!isMobile && (
      <div style={{padding:col?"0 0 12px":"0 14px 14px",display:"flex",justifyContent:"center"}}>
        <button onClick={()=>{ if(mode!=="owner") setPage("publisher"); }} title={col?(mode==="owner"?"New Campaign":"Create Post"):undefined} style={{
          width:col?40:"100%",height:col?40:"auto",padding:col?0:"9px 0",borderRadius:col?11:10,
          background:th.gradient,border:"none",
          color:"#fff",fontWeight:700,fontSize:12,cursor:"pointer",
          boxShadow:`0 4px 16px ${th.accent}55`,
          display:"flex",alignItems:"center",justifyContent:"center",gap:6,
        }}>
          <Plus size={col?18:14} strokeWidth={2.5}/>
          {!col&&(mode==="owner"?t("btn.newCampaign","New Campaign"):t("btn.createPost","Create Post"))}
        </button>
      </div>
      )}

      <nav className="tw-noscroll" style={{flex:1,overflowY:"auto",padding:"0 10px"}}>
        {mode==="owner"?(
          <div>{OWNER_NAV.map(({key,Icon:I,label})=>navItem(key,I,t("nav."+key,label),null,page===key,()=>setPage(key)))}</div>
        ):(
          AGENCY_NAV.map((sec,si)=>(
            <div key={si} style={{marginBottom:16}}>
              {!col&&<div style={{fontSize:9,color:th.text3,fontWeight:700,textTransform:"uppercase",letterSpacing:1.2,padding:"0 10px",marginBottom:4}}>{t("sec."+sec.section,sec.section)}</div>}
              {col&&si>0&&<div style={{height:1,background:th.border,margin:"8px 10px"}}/>}
              {sec.items.filter(it=>!(isMobile&&it.key==="publisher")).map(({key,Icon:I,label,badge})=>navItem(key,I,t("nav."+key,label),badge,page===key,()=>setPage(key)))}
            </div>
          ))
        )}
      </nav>

      {col ? null : (
      <div style={{position:"relative",margin:"0 14px 12px"}}>
        {acctOpen && <div onClick={()=>setAcctOpen(false)} style={{position:"fixed",inset:0,zIndex:40}}/>}
        {acctOpen && (
          <div style={{position:"absolute",bottom:"calc(100% + 8px)",left:0,right:0,zIndex:50,background:th.card,border:`1px solid ${th.border}`,borderRadius:12,padding:6,boxShadow:"0 18px 44px rgba(0,0,0,0.55)"}}>
            {[
              [Settings, L("Settings","الإعدادات"), ()=>setPage(mode==="owner"?"settings":"agencysets")],
              ...(mode!=="owner" ? [[CreditCard, L("Billing & plan","الفوترة والخطة"), ()=>setPage("billing")]] : []),
            ].map(([Ic,label,act],i)=>(
              <div key={i} onClick={()=>{ act(); setAcctOpen(false); }} className="tw-acct" style={{display:"flex",alignItems:"center",gap:10,padding:"9px 10px",borderRadius:8,cursor:"pointer",color:th.text,fontSize:12.5,fontWeight:500}}><Ic size={16} color={th.accent}/>{label}</div>
            ))}
            <div onClick={()=>setDark(d=>!d)} className="tw-acct" style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"9px 10px",borderRadius:8,cursor:"pointer",color:th.text,fontSize:12.5,fontWeight:500}}>
              <span style={{display:"flex",alignItems:"center",gap:10}}>{dark?<Moon size={16} color={th.accent}/>:<Sun size={16} color={th.accent}/>}{L("Dark mode","الوضع الداكن")}</span>
              <span style={{width:30,height:17,borderRadius:20,background:dark?th.accent:th.border,position:"relative",transition:"background .15s",flexShrink:0}}><span style={{position:"absolute",top:2,left:dark?15:2,width:13,height:13,borderRadius:"50%",background:"#fff",transition:"left .15s"}}/></span>
            </div>
            <div style={{height:1,background:th.border,margin:"5px 4px"}}/>
            <div onClick={async()=>{ setAcctOpen(false); try{ await signOut(); }catch(e){} setIsAuthed(false); }} className="tw-acct" style={{display:"flex",alignItems:"center",gap:10,padding:"9px 10px",borderRadius:8,cursor:"pointer",color:th.danger,fontSize:12.5,fontWeight:600}}><LogOut size={16} color={th.danger}/>{L("Log out","تسجيل الخروج")}</div>
          </div>
        )}
        <div onClick={()=>setAcctOpen(o=>!o)} style={{background:th.card2,border:`1px solid ${acctOpen?th.accent:th.border}`,borderRadius:12,padding:"11px 12px",cursor:"pointer"}}>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
            <span style={{width:32,height:32,borderRadius:9,background:th.gradient,color:"#fff",fontSize:11.5,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{sbInit}</span>
            <div style={{minWidth:0,lineHeight:1.35,flex:1}}>
              <div style={{fontSize:12.5,fontWeight:600,color:th.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{sbName}</div>
              {sbSub&&<div style={{fontSize:10,color:th.text2,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",marginTop:1}}>{sbSub}</div>}
            </div>
            <ChevronDown size={15} color={th.text3} style={{transform:acctOpen?"rotate(180deg)":"none",transition:"transform .15s",flexShrink:0}}/>
          </div>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",borderTop:`1px solid ${th.border}`,paddingTop:9}}>
            <span style={{fontSize:11,fontWeight:600,color:planTrial?th.warning:th.accent,display:"inline-flex",alignItems:"center",gap:6}}><Sparkles size={13}/>{planLabel}</span>
            <span onClick={(e)=>{ e.stopPropagation(); setAcctOpen(false); setPage("billing"); }} style={{fontSize:10.5,fontWeight:600,color:th.accent,cursor:"pointer"}}>{planTrial?L("Upgrade","ترقية"):L("Manage","إدارة")}</span>
          </div>
        </div>
      </div>
      )}
    </aside>
    </>
  );
}

function Topbar() {
  const { mode, page, selClient, accountType, t, setPage, userEmail, userName, userCompany, setMobileNav, clients, setSelClient, setMode } = useApp();
  const th = useTheme();
  const [sq, setSq] = useState("");      // global search query
  const [sOpen, setSOpen] = useState(false);
  const isMobile = useIsMobile();
  const uName = (userName && userName.trim())
    ? userName.replace(/\b\w/g, c=>c.toUpperCase())
    : (userEmail ? userEmail.split('@')[0].replace(/[._]/g,' ').replace(/\b\w/g, c=>c.toUpperCase()) : "User");
  // Top-right subtitle shows the agency the user works for, not the client they're servicing.
  const agencyDisplay = shortCompany(userCompany) || (userEmail === ADMIN_EMAIL ? "Octo Fusion" : (accountLabelOf(accountType) || "Agency"));
  const uSub = (mode==="owner") ? "Tawaslo HQ" : agencyDisplay;
  const [notifOpen, setNotifOpen] = useState(false);
  const [dotSeen, setDotSeen] = useState(false);
  const NOTIFS = [
    { Icon:Send, color:th.success, title:"Post published", body:"Your scheduled post went live on Facebook.", ago:"12m" },
    { Icon:MessageCircle, color:th.accent, title:"New comment", body:"Someone commented on your Instagram post.", ago:"1h" },
    { Icon:FileText, color:th.accent2, title:"Report ready", body:"Your weekly performance report is ready.", ago:"1d" },
    { Icon:Sparkles, color:th.warning, title:"Trial reminder", body:"You have 23 days left on your free trial.", ago:"2d" },
  ];
  const titles = {
    overview:"Platform Overview", clients:"All Clients", revenue:"Revenue",
    promos:"Promo Codes", gifts:"Gift Cards & Gifting", support:"Support Inbox",
    apiusage:"API & Usage", team:"Team", settings:"Settings",
    dashboard:"Dashboard", publisher:"Publisher", streams:"Streams",
    inbox:"Inbox", listening:"Listening", campaigns:"Campaigns",
    aistudio:"AI Studio", media:"Media", analytics:"Analytics",
    reports:"Reports", agencyteam:"Team", billing:"Billing", agencysets:"Settings",
  };
  // Global search — jumps to any page, or opens a client.
  const OWNER_PAGES = [["overview","Overview"],["clients","All Clients"],["revenue","Revenue"],["promos","Promo Codes"],["gifts","Gift Cards"],["support","Support"],["apiusage","API & Usage"],["team","Team"],["settings","Settings"]];
  const AGENCY_PAGES = [["dashboard","Dashboard"],["publisher","Publisher"],["planner","Planner"],["inbox","Inbox"],["analytics","Analytics"],["listening","Listening"],["streams","Streams"],["campaigns","Campaigns"],["aistudio","AI Studio"],["media","Media"],["ads","Ads"],["reports","Reports"],["clients","Clients"],["social","Social Accounts"],["agencyteam","Team"],["billing","Billing"],["agencysets","Settings"]];
  const ql = sq.trim().toLowerCase();
  const pageHits = ql ? (mode==="owner"?OWNER_PAGES:AGENCY_PAGES).filter(([k,l])=>l.toLowerCase().includes(ql)).slice(0,7) : [];
  const clientHits = ql ? (clients||[]).filter(c=>(c.name||"").toLowerCase().includes(ql)).slice(0,5) : [];
  const goPage = (k)=>{ setPage(k); setSq(""); setSOpen(false); };
  const goClient = (c)=>{ setSelClient&&setSelClient(c); setMode&&setMode("agency"); setPage("dashboard"); setSq(""); setSOpen(false); };
  return (
    <header style={{height:58,flexShrink:0,background:th.surface,borderBottom:`1px solid ${th.border}`,display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 22px"}}>
      <div style={{display:"flex",alignItems:"center",gap:12,minWidth:0}}>
        {isMobile && <button onClick={()=>setMobileNav&&setMobileNav(true)} aria-label="Menu" style={{background:"transparent",border:"none",cursor:"pointer",color:th.text,display:"flex",alignItems:"center",padding:4,flexShrink:0}}><Menu size={22}/></button>}
        {!isMobile && <div style={{position:"relative",width:240}}>
          <div style={{display:"flex",alignItems:"center",gap:7,background:th.card2,border:`1px solid ${sOpen?th.accent:th.border}`,borderRadius:9,padding:"6px 12px"}}>
            <Search size={13} color={th.text3}/>
            <input value={sq} onChange={e=>{setSq(e.target.value);setSOpen(true);}} onFocus={()=>setSOpen(true)} placeholder={t("common.search","Search pages & clients…")} style={{background:"transparent",border:"none",outline:"none",color:th.text,fontSize:12,width:"100%",fontFamily:"inherit"}}/>
            {sq && <XCircle size={13} color={th.text3} style={{cursor:"pointer",flexShrink:0}} onClick={()=>{setSq("");setSOpen(false);}}/>}
          </div>
          {sOpen && ql && (
            <>
              <div onClick={()=>setSOpen(false)} style={{position:"fixed",inset:0,zIndex:40}}/>
              <div style={{position:"absolute",top:40,left:0,zIndex:50,width:290,background:th.card,border:`1px solid ${th.border}`,borderRadius:12,boxShadow:"0 18px 44px rgba(0,0,0,0.5)",overflow:"hidden",maxHeight:400,overflowY:"auto"}}>
                {(pageHits.length+clientHits.length)===0 && <div style={{padding:"16px",fontSize:12,color:th.text3,textAlign:"center"}}>No matches for &ldquo;{sq}&rdquo;</div>}
                {pageHits.length>0 && <div style={{padding:"9px 14px 4px",fontSize:9.5,fontWeight:700,letterSpacing:0.5,color:th.text3,textTransform:"uppercase"}}>Pages</div>}
                {pageHits.map(([k,l])=>(
                  <div key={k} onMouseDown={e=>e.preventDefault()} onClick={()=>goPage(k)} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 14px",cursor:"pointer",fontSize:12.5,color:th.text}}><ArrowUpRight size={13} color={th.text3}/>{l}</div>
                ))}
                {clientHits.length>0 && <div style={{padding:"9px 14px 4px",fontSize:9.5,fontWeight:700,letterSpacing:0.5,color:th.text3,textTransform:"uppercase",borderTop:pageHits.length?`1px solid ${th.border}`:"none"}}>Clients</div>}
                {clientHits.map(c=>(
                  <div key={c.id||c.name} onMouseDown={e=>e.preventDefault()} onClick={()=>goClient(c)} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 14px",cursor:"pointer"}}>
                    <div style={{width:24,height:24,borderRadius:7,background:th.gradient,display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,fontWeight:700,color:"#fff",flexShrink:0}}>{(c.name||"?").slice(0,2).toUpperCase()}</div>
                    <span style={{fontSize:12.5,color:th.text}}>{c.name}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>}
        <div style={{display:isMobile?"none":"flex",alignItems:"center",gap:6,fontSize:12,color:th.text2}}>
          <span style={{padding:"4px 10px",borderRadius:7,background:mode==="owner"?th.accentSoft:th.accent2Soft,color:mode==="owner"?th.accent:th.accent2,fontWeight:700,fontSize:11}}>
            {mode==="owner"?t("btn.owner","Owner"):accountLabelOf(accountType)}
          </span>
          {mode==="agency"&&<><ChevronRight size={12}/><span style={{fontWeight:600}}>{selClient.name}</span></>}
          <ChevronRight size={12}/>
          <span style={{fontWeight:500,color:th.text}}>{t("nav."+page,titles[page]||page)}</span>
        </div>
      </div>
      <div style={{display:"flex",alignItems:"center",gap:9}}>
        <div style={{position:"relative"}}>
          <button onClick={()=>{ setNotifOpen(o=>!o); setDotSeen(true); }} style={{width:32,height:32,borderRadius:8,background:notifOpen?th.accentSoft:th.card2,border:`1px solid ${notifOpen?th.accent:th.border}`,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",position:"relative"}}>
            <Bell size={14} color={notifOpen?th.accent:th.text2}/>
            {!dotSeen && <span style={{position:"absolute",top:6,right:6,width:6,height:6,borderRadius:"50%",background:th.danger,border:`1.5px solid ${th.surface}`}}/>}
          </button>
          {notifOpen && (
            <>
              <div onClick={()=>setNotifOpen(false)} style={{position:"fixed",inset:0,zIndex:40}}/>
              <div style={{position:"absolute",right:0,top:40,zIndex:50,width:330,background:th.card,border:`1px solid ${th.border}`,borderRadius:14,boxShadow:"0 22px 54px rgba(0,0,0,0.55)",overflow:"hidden"}}>
                <div style={{padding:"12px 16px",borderBottom:`1px solid ${th.border}`,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                  <span style={{fontSize:13,fontWeight:700}}>Notifications</span>
                  <span onClick={()=>setNotifOpen(false)} style={{fontSize:11,color:th.accent,cursor:"pointer",fontWeight:600}}>Mark all read</span>
                </div>
                {NOTIFS.map((n,i)=>(
                  <div key={i} style={{display:"flex",gap:11,padding:"12px 16px",borderBottom:i<NOTIFS.length-1?`1px solid ${th.border}`:"none"}}>
                    <div style={{width:30,height:30,borderRadius:9,background:n.color+"1f",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><n.Icon size={14} color={n.color}/></div>
                    <div style={{minWidth:0}}><div style={{fontSize:12.5,fontWeight:600}}>{n.title} <span style={{fontSize:10,color:th.text3,fontWeight:400}}>· {n.ago}</span></div><div style={{fontSize:11.5,color:th.text2,marginTop:2,lineHeight:1.4}}>{n.body}</div></div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
        <div style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer"}}>
          <div style={{lineHeight:1.35,textAlign:"right"}}>
            <div style={{fontSize:14,fontWeight:700,color:th.text}}>{uName}</div>
            <div style={{fontSize:11,color:th.text2}}>{uSub}</div>
          </div>
        </div>
      </div>
    </header>
  );
}

// Pinned client + platform context bar — appears on every data board so it's
// always clear whose data is on screen, and lets you switch client/platform.
function ContextBar() {
  const { selClient, setSelClient, clients, setClients, lang, setPage, selPlatform, setSelPlatform } = useApp();
  const th = useTheme();
  const isAR = lang === "ar";
  const L = (en, ar) => isAR ? ar : en;
  const [brandOpen, setBrandOpen] = useState(false);
  const [accounts, setAccounts] = useState([]);
  const [addOpen, setAddOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    let active = true;
    if (!selClient?.id) { setAccounts([]); return; }
    supabase.from('social_accounts').select('platform').eq('client_id', selClient.id).neq('is_active', false)
      .then(({ data }) => { if (active) setAccounts(data || []); });
    return () => { active = false; };
  }, [selClient]);

  const PLAT_META = { ig:{label:"Instagram",Icon:FaInstagram,color:"#E1306C"}, fb:{label:"Facebook",Icon:FaFacebook,color:"#1877F2"}, li:{label:"LinkedIn",Icon:FaLinkedin,color:"#0A66C2"}, tt:{label:"TikTok",Icon:FaTiktok,color:th.text}, tw:{label:"X",Icon:FaTwitter,color:th.text}, yt:{label:"YouTube",Icon:FaYoutube,color:"#FF0000"} };
  const present = Array.from(new Set((accounts||[]).map(a=>a.platform).filter(Boolean)));

  const createClient = async () => {
    const name = newName.trim();
    if (!name || creating) return;
    setCreating(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data, error } = await supabase.from('clients').insert([{ owner_id: user.id, name, plan:'trial', status:'active', is_free:true }]).select();
        if (!error && data && data[0]) {
          const nc = { ...data[0], free:true, accounts:0, posts:0, reach:0, health:100, spend:0 };
          if (setClients) setClients(prev => [...prev, nc]);
          setSelClient(nc);
        }
      }
    } catch(e){ /* ignore */ }
    setCreating(false); setAddOpen(false); setNewName("");
  };

  const chip = (active, onClick, children, key) => (
    <button key={key} onClick={onClick} style={{display:"inline-flex",alignItems:"center",gap:6,borderRadius:999,padding:"6px 13px",fontSize:12,fontWeight:active?600:500,cursor:"pointer",whiteSpace:"nowrap",border:`1px solid ${active?th.accent:"transparent"}`,background:active?th.accent:th.card2,color:active?(th===DARK?"#0B0E12":"#fff"):th.text2,transition:"all 0.12s"}}>{children}</button>
  );

  return (
    <div style={{display:"flex",alignItems:"center",gap:11,padding:"10px 22px",borderBottom:`1px solid ${th.border}`,background:th.surface,flexWrap:"wrap",direction:isAR?"rtl":"ltr"}}>
      <span style={{fontSize:11.5,color:th.text3,fontWeight:500}}>{L("Viewing","تعرض")}</span>
      <div style={{position:"relative"}}>
        <button onClick={()=>setBrandOpen(o=>!o)} style={{display:"flex",alignItems:"center",gap:9,background:"transparent",border:`1px solid ${th.border}`,borderRadius:10,padding:"6px 11px 6px 8px",cursor:"pointer",color:th.text}}>
          <span style={{width:23,height:23,borderRadius:7,background:th.gradient,color:"#fff",fontSize:9.5,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center"}}>{(selClient?.name||"?").slice(0,2).toUpperCase()}</span>
          <span style={{fontSize:13.5,fontWeight:600,letterSpacing:"-0.1px"}}>{selClient?.name||L("Workspace","المساحة")}</span>
          <ChevronDown size={15} color={th.text3}/>
        </button>
        {brandOpen&&(<>
          <div onClick={()=>setBrandOpen(false)} style={{position:"fixed",inset:0,zIndex:49}}/>
          <div style={{position:"absolute",top:"100%",[isAR?"right":"left"]:0,marginTop:6,zIndex:50,background:th.card,border:`1px solid ${th.border}`,borderRadius:12,boxShadow:"0 14px 40px rgba(0,0,0,0.4)",padding:6,minWidth:230}}>
            {clients.length===0&&<div style={{padding:"8px 10px",fontSize:12,color:th.text3}}>{L("No clients yet","لا يوجد عملاء")}</div>}
            {clients.map(c=>(
              <div key={c.id} onClick={()=>{setSelClient(c);setBrandOpen(false);}} style={{display:"flex",alignItems:"center",gap:9,padding:"8px 10px",borderRadius:8,cursor:"pointer",background:selClient?.id===c.id?th.accentSoft:"transparent"}}>
                <span style={{width:7,height:7,borderRadius:"50%",background:c.status==="active"?th.success:th.text3,flexShrink:0}}/>
                <span style={{flex:1,fontSize:12.5,color:selClient?.id===c.id?th.accent:th.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{c.name}</span>
                <span className="tw-num" style={{fontSize:10,color:th.text3}}>{c.accounts||0}</span>
              </div>
            ))}
            <div onClick={()=>{setBrandOpen(false);setAddOpen(true);}} style={{display:"flex",alignItems:"center",gap:9,padding:"9px 10px",borderRadius:8,cursor:"pointer",borderTop:`1px solid ${th.border}`,marginTop:4,color:th.accent,fontSize:12.5,fontWeight:600}}>
              <span style={{width:22,height:22,borderRadius:6,background:th.accentSoft,display:"flex",alignItems:"center",justifyContent:"center"}}><Plus size={13} color={th.accent}/></span>{L("Add a client","إضافة عميل")}
            </div>
          </div>
        </>)}
      </div>

      {present.length>0 && <div style={{width:1,height:20,background:th.border}}/>}

      <div className="tw-scroll-x" style={{display:"flex",alignItems:"center",gap:6,flex:1,minWidth:0}}>
        {chip(selPlatform==="all", ()=>setSelPlatform("all"), L("All","الكل"), "all")}
        {present.map(p=>{ const m=PLAT_META[p]; if(!m) return null; const PI=m.Icon; return chip(selPlatform===p, ()=>setSelPlatform(p), <><PI style={{color:m.color,fontSize:14}}/>{m.label}</>, p); })}
        {present.length===0&&<span style={{fontSize:11.5,color:th.text3}}>{L("No accounts connected","لا توجد حسابات مرتبطة")} · <span onClick={()=>setPage("social")} style={{color:th.accent,cursor:"pointer",fontWeight:600}}>{L("Connect","ربط")}</span></span>}
      </div>

      {addOpen && createPortal((
        <div onClick={()=>setAddOpen(false)} style={{position:"fixed",inset:0,background:"rgba(4,6,12,0.72)",backdropFilter:"blur(4px)",zIndex:9998,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
          <div onClick={e=>e.stopPropagation()} style={{width:"100%",maxWidth:420,background:th.card,border:`1px solid ${th.border}`,borderRadius:18,padding:24,boxShadow:th.shadow}}>
            <h3 style={{margin:"0 0 6px",fontSize:18,fontWeight:800,color:th.text}}>{L("Add a client","إضافة عميل")}</h3>
            <p style={{margin:"0 0 16px",fontSize:12.5,color:th.text2,lineHeight:1.6}}>{L("Each client is its own workspace with its own connected accounts, posts and reports.","كل عميل مساحة عمل مستقلة بحساباته ومنشوراته وتقاريره.")}</p>
            <input value={newName} autoFocus onChange={e=>setNewName(e.target.value)} onKeyDown={e=>e.key==='Enter'&&createClient()} placeholder={L("e.g. Trio Restaurant & Cafe","مثال: مطعم تريو")} style={{width:"100%",background:th.card2,border:`1px solid ${th.border}`,borderRadius:10,padding:"11px 13px",color:th.text,fontSize:13.5,outline:"none",boxSizing:"border-box",fontFamily:"inherit",marginBottom:18}}/>
            <div style={{display:"flex",gap:8}}>
              <button onClick={()=>setAddOpen(false)} style={{flex:1,padding:"11px",borderRadius:11,background:"transparent",border:`1px solid ${th.border}`,color:th.text2,fontSize:13,fontWeight:600,cursor:"pointer"}}>{L("Cancel","إلغاء")}</button>
              <button onClick={createClient} disabled={!newName.trim()||creating} style={{flex:2,padding:"12px",borderRadius:11,background:th.gradient,border:"none",color:"#fff",fontSize:13,fontWeight:700,cursor:newName.trim()?"pointer":"not-allowed",opacity:newName.trim()?1:0.6}}>{creating?L("Creating…","جارٍ الإنشاء…"):L("Create client","إنشاء عميل")}</button>
            </div>
          </div>
        </div>
      ), document.body)}
    </div>
  );
}

// Client identity: uploaded logo, else a crafted serif monogram with a quiet
// per-client tint and hairline ring. Never a generic gradient box.
function ClientMonogram({ name, logo, size=38, radius=11 }) {
  const th = useTheme();
  const initials = (name||"?").replace(/[^A-Za-z0-9 ]/g,"").split(/\s+/).filter(Boolean).slice(0,2).map(w=>w[0]).join("").toUpperCase() || "?";
  const tints = [
    ["rgba(110,140,171,0.14)","rgba(110,140,171,0.34)","#9DB6D6"],
    ["rgba(111,191,155,0.12)","rgba(111,191,155,0.32)","#7FC9A8"],
    ["rgba(224,164,92,0.12)","rgba(224,164,92,0.32)","#D9A45C"],
    ["rgba(196,107,150,0.12)","rgba(196,107,150,0.32)","#D58BB0"],
    ["rgba(138,160,190,0.14)","rgba(138,160,190,0.34)","#A6B8CF"],
  ];
  let h=0; const s=name||""; for(let i=0;i<s.length;i++) h=(h*31+s.charCodeAt(i))>>>0;
  const [bg,br,fg]=tints[h%tints.length];
  if (logo) return <span style={{width:size,height:size,borderRadius:radius,background:"#fff",display:"flex",alignItems:"center",justifyContent:"center",overflow:"hidden",flexShrink:0}}><img src={logo} alt="" style={{width:"100%",height:"100%",objectFit:"contain"}}/></span>;
  return <span style={{width:size,height:size,borderRadius:radius,background:bg,border:`1px solid ${br}`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><span className="tw-num" style={{fontSize:Math.round(size*0.4),fontWeight:600,color:fg}}>{initials}</span></span>;
}

// Instagram-style crop: drag to position, slide to zoom, square output.
function LogoCropper({ file, onCancel, onSave }) {
  const th = useTheme();
  const canvasRef = useRef(null);
  const imgRef = useRef(null);
  const off = useRef({x:0,y:0});
  const drag = useRef(null);
  const [zoom, setZoom] = useState(1);
  const [ready, setReady] = useState(false);
  const F = 256;
  const draw = () => {
    const c = canvasRef.current, img = imgRef.current; if(!c||!img) return;
    const ctx = c.getContext('2d'); ctx.clearRect(0,0,F,F);
    const base = Math.max(F/img.width, F/img.height), s = base*zoom;
    const dw = img.width*s, dh = img.height*s;
    ctx.drawImage(img, F/2-dw/2+off.current.x, F/2-dh/2+off.current.y, dw, dh);
  };
  useEffect(() => {
    const url = URL.createObjectURL(file);
    const img = new window.Image();
    img.onload = () => { imgRef.current = img; off.current = {x:0,y:0}; setReady(true); };
    img.src = url;
    return () => { try { URL.revokeObjectURL(url); } catch(e){} };
  }, [file]);
  useEffect(() => { draw(); }, [zoom, ready]); // eslint-disable-line
  const pt = (e) => { const r = canvasRef.current.getBoundingClientRect(); const t = (e.touches&&e.touches[0])?e.touches[0]:e; return { x:t.clientX-r.left, y:t.clientY-r.top }; };
  const onDown = (e) => { const p = pt(e); drag.current = { x:p.x, y:p.y, ox:off.current.x, oy:off.current.y }; };
  const onMove = (e) => { if(!drag.current) return; const p = pt(e); off.current = { x:drag.current.ox+(p.x-drag.current.x), y:drag.current.oy+(p.y-drag.current.y) }; draw(); };
  const onUp = () => { drag.current = null; };
  const save = () => { const c = canvasRef.current; if(c) c.toBlob((b)=>{ if(b) onSave(b); }, 'image/png', 0.92); };
  return createPortal((
    <div onClick={onCancel} style={{position:"fixed",inset:0,background:"rgba(4,6,12,0.8)",backdropFilter:"blur(4px)",zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
      <div onClick={e=>e.stopPropagation()} style={{background:th.card,border:`1px solid ${th.border}`,borderRadius:18,padding:22,width:"100%",maxWidth:330,boxShadow:th.shadow}}>
        <h3 style={{margin:"0 0 3px",fontSize:16,fontWeight:800,color:th.text}}>Position the logo</h3>
        <p style={{margin:"0 0 14px",fontSize:11.5,color:th.text2}}>Drag to move, slide to zoom.</p>
        <div style={{display:"flex",justifyContent:"center",marginBottom:16}}>
          <canvas ref={canvasRef} width={F} height={F}
            onMouseDown={onDown} onMouseMove={onMove} onMouseUp={onUp} onMouseLeave={onUp}
            onTouchStart={onDown} onTouchMove={onMove} onTouchEnd={onUp}
            style={{width:F,height:F,borderRadius:16,border:`1px solid ${th.border}`,background:th.card2,cursor:"grab",touchAction:"none"}}/>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:11,marginBottom:18}}>
          <span style={{color:th.text3,fontSize:13,fontWeight:700}}>−</span>
          <input type="range" min="1" max="3" step="0.01" value={zoom} onChange={e=>setZoom(parseFloat(e.target.value))} style={{flex:1,accentColor:th.accent}}/>
          <span style={{color:th.text3,fontSize:15,fontWeight:700}}>+</span>
        </div>
        <div style={{display:"flex",gap:8}}>
          <button onClick={onCancel} style={{flex:1,padding:"11px",borderRadius:11,background:"transparent",border:`1px solid ${th.border}`,color:th.text2,fontSize:13,fontWeight:600,cursor:"pointer"}}>Cancel</button>
          <button onClick={save} style={{flex:2,padding:"12px",borderRadius:11,background:th.gradient,border:"none",color:"#fff",fontSize:13,fontWeight:700,cursor:"pointer"}}>Use photo</button>
        </div>
      </div>
    </div>
  ), document.body);
}

function ClientsPage() {
  const { clients, setClients, selClient, setSelClient, setPage, lang } = useApp();
  const th = useTheme();
  const isAR = lang==="ar"; const L=(en,ar)=>isAR?ar:en;
  const [addOpen,setAddOpen]=useState(false);
  const [newName,setNewName]=useState("");
  const [editClient,setEditClient]=useState(null);
  const [editName,setEditName]=useState("");
  const [editLogo,setEditLogo]=useState("");
  const [uploadingLogo,setUploadingLogo]=useState(false);
  const [cropFile,setCropFile]=useState(null);
  const [menuFor,setMenuFor]=useState(null);
  const [delClient,setDelClient]=useState(null);
  const [busy,setBusy]=useState(false);
  const [platsByClient,setPlatsByClient]=useState({});

  const PLAT = { ig:{Icon:FaInstagram,color:"#E1306C"}, fb:{Icon:FaFacebook,color:"#1877F2"}, li:{Icon:FaLinkedin,color:"#0A66C2"}, tt:{Icon:FaTiktok,color:th.text}, tw:{Icon:FaTwitter,color:th.text}, yt:{Icon:FaYoutube,color:"#FF0000"} };

  useEffect(()=>{ let active=true; const ids=clients.map(c=>c.id).filter(Boolean); if(!ids.length){setPlatsByClient({});return;}
    supabase.from('social_accounts').select('client_id,platform').in('client_id',ids).neq('is_active',false).then(({data})=>{
      if(!active) return; const m={}; (data||[]).forEach(a=>{ (m[a.client_id]=m[a.client_id]||new Set()).add(a.platform); });
      const out={}; Object.keys(m).forEach(k=>out[k]=Array.from(m[k])); setPlatsByClient(out);
    });
    return ()=>{active=false;};
  },[clients]);

  const totalAccounts = clients.reduce((s,c)=>s+(c.accounts||0),0);

  const createClient = async () => {
    const name=newName.trim(); if(!name||busy) return; setBusy(true);
    try { const { data:{ user } } = await supabase.auth.getUser();
      if(user){ const { data, error } = await supabase.from('clients').insert([{ owner_id:user.id, name, plan:'trial', status:'active', is_free:true }]).select();
        if(!error&&data&&data[0]){ const nc={ ...data[0], free:true, accounts:0, posts:0, reach:0, health:100, spend:0 }; setClients(prev=>[...prev,nc]); setSelClient(nc); } }
    } catch(e){ /* ignore */ }
    setBusy(false); setAddOpen(false); setNewName("");
  };
  const putLogo = async (blob) => {
    if(!blob||!editClient) return; setUploadingLogo(true);
    try {
      const { data:{ user } } = await supabase.auth.getUser();
      if(user){
        const path=`${user.id}/logos/${editClient.id}-${Date.now()}.png`;
        const { error } = await supabase.storage.from('media').upload(path, blob, { upsert:true, contentType:'image/png' });
        if(!error){ const { data:url } = supabase.storage.from('media').getPublicUrl(path); setEditLogo((url&&url.publicUrl)||""); }
      }
    } catch(e){ /* ignore */ }
    setUploadingLogo(false);
  };
  const saveEdit = async () => {
    const name=editName.trim(); if(!name||busy||!editClient) return; setBusy(true);
    try { await supabase.from('clients').update({ name }).eq('id', editClient.id); } catch(e){ /* ignore */ }
    // logo_url is an additive column; update it separately so a missing column never blocks the rename
    if (editLogo !== (editClient.logo_url||"")) {
      try { await supabase.from('clients').update({ logo_url: editLogo||null }).eq('id', editClient.id); } catch(e){ /* column may not exist yet */ }
    }
    setClients(prev=>prev.map(c=>c.id===editClient.id?{...c,name,logo_url:editLogo||null}:c));
    if(selClient?.id===editClient.id) setSelClient({...selClient,name,logo_url:editLogo||null});
    setBusy(false); setEditClient(null);
  };
  const doDelete = async () => {
    if(!delClient||busy) return; setBusy(true);
    try { await supabase.from('clients').delete().eq('id', delClient.id);
      const rest = clients.filter(c=>c.id!==delClient.id); setClients(rest);
      if(selClient?.id===delClient.id) setSelClient(rest[0]||{ id:null, name:"Workspace", plan:"", status:"active", free:false, accounts:0 });
    } catch(e){ /* ignore */ }
    setBusy(false); setDelClient(null); setMenuFor(null);
  };

  return (
    <div className="tw-page-in" style={{padding:"24px 26px",maxWidth:920,margin:"0 auto",direction:isAR?"rtl":"ltr"}}>
      <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:12,marginBottom:6,flexWrap:"wrap"}}>
        <div>
          <h1 style={{margin:0,fontSize:21,fontWeight:700,letterSpacing:"-0.4px",color:th.text}}>{L("Clients","العملاء")}</h1>
          <div style={{fontSize:12.5,color:th.text2,marginTop:3}}><span className="tw-num">{clients.length}</span> {clients.length===1?L("client","عميل"):L("clients","عملاء")} · <span className="tw-num">{totalAccounts}</span> {L("connected accounts","حسابات مرتبطة")}</div>
        </div>
        <button onClick={()=>setAddOpen(true)} style={{background:th.gradient,color:"#fff",fontSize:12.5,fontWeight:600,border:"none",borderRadius:10,padding:"10px 16px",cursor:"pointer",display:"inline-flex",alignItems:"center",gap:7}}><Plus size={15}/>{L("Add client","إضافة عميل")}</button>
      </div>

      <div style={{marginTop:20}}>
        {clients.map(c=>{
          const plats = platsByClient[c.id]||[];
          return (
          <div key={c.id} style={{position:"relative",display:"flex",alignItems:"center",gap:14,padding:"15px 6px",borderBottom:`1px solid ${th.border}`}}>
            <ClientMonogram name={c.name} logo={c.logo_url} size={40}/>
            <div style={{flex:1,minWidth:0}}>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <span style={{fontSize:14,fontWeight:600,color:th.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{c.name}</span>
                <span style={{fontSize:9,color:c.free?th.success:th.text2,border:`1px solid ${c.free?th.success+"55":th.border}`,borderRadius:5,padding:"1px 6px"}}>{c.free?L("Free","مجاني"):(c.plan||L("Active","نشط"))}</span>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:7,marginTop:5,color:th.text3,fontSize:11}}>
                {plats.map(p=>{ const m=PLAT[p]; if(!m) return null; const PI=m.Icon; return <PI key={p} style={{color:m.color,fontSize:14}}/>; })}
                <span className="tw-num" style={{color:th.text2,marginInlineStart:plats.length?3:0}}>{c.accounts||0}</span> {L("accounts","حسابات")} · {c.status==="active"?L("active","نشط"):c.status}
              </div>
            </div>
            <button onClick={()=>{setEditClient(c);setEditName(c.name);setEditLogo(c.logo_url||"");}} style={{fontSize:11.5,fontWeight:600,color:th.text2,border:`1px solid ${th.border}`,borderRadius:8,padding:"6px 13px",cursor:"pointer",background:"transparent"}}>{L("Edit","تعديل")}</button>
            <button onClick={()=>setMenuFor(menuFor===c.id?null:c.id)} style={{background:"transparent",border:"none",cursor:"pointer",color:th.text2,display:"flex",padding:4}}><MoreHorizontal size={18}/></button>
            {menuFor===c.id&&(<>
              <div onClick={()=>setMenuFor(null)} style={{position:"fixed",inset:0,zIndex:49}}/>
              <div style={{position:"absolute",[isAR?"left":"right"]:6,top:54,zIndex:50,background:th.card,border:`1px solid ${th.border}`,borderRadius:10,padding:5,width:170,boxShadow:"0 16px 36px rgba(0,0,0,0.4)"}}>
                <div onClick={()=>{setEditClient(c);setEditName(c.name);setEditLogo(c.logo_url||"");setMenuFor(null);}} style={{display:"flex",alignItems:"center",gap:9,padding:"8px 10px",borderRadius:7,cursor:"pointer",color:th.text,fontSize:12}}><Edit3 size={14}/>{L("Edit details","تعديل التفاصيل")}</div>
                <div onClick={()=>{setSelClient(c);setPage("social");}} style={{display:"flex",alignItems:"center",gap:9,padding:"8px 10px",borderRadius:7,cursor:"pointer",color:th.text,fontSize:12}}><Link size={14}/>{L("Connections","الحسابات")}</div>
                <div style={{height:1,background:th.border,margin:"3px 0"}}/>
                <div onClick={()=>{setDelClient(c);setMenuFor(null);}} style={{display:"flex",alignItems:"center",gap:9,padding:"8px 10px",borderRadius:7,cursor:"pointer",color:th.danger,fontSize:12}}><Trash2 size={14}/>{L("Delete client","حذف العميل")}</div>
              </div>
            </>)}
          </div>
          );
        })}
        <div onClick={()=>setAddOpen(true)} style={{display:"flex",alignItems:"center",gap:12,padding:"16px 6px",color:th.text2,cursor:"pointer"}}>
          <span style={{width:40,height:40,borderRadius:11,border:`1px dashed ${th.border}`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><Plus size={16} color={th.text3}/></span>
          <span style={{fontSize:12.5}}>{L("Add another client workspace","إضافة مساحة عمل لعميل آخر")}</span>
        </div>
      </div>

      {addOpen && createPortal((
        <div onClick={()=>setAddOpen(false)} style={{position:"fixed",inset:0,background:"rgba(4,6,12,0.72)",backdropFilter:"blur(4px)",zIndex:9998,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
          <div onClick={e=>e.stopPropagation()} style={{width:"100%",maxWidth:420,background:th.card,border:`1px solid ${th.border}`,borderRadius:18,padding:24,boxShadow:th.shadow}}>
            <h3 style={{margin:"0 0 6px",fontSize:18,fontWeight:800,color:th.text}}>{L("Add a client","إضافة عميل")}</h3>
            <p style={{margin:"0 0 16px",fontSize:12.5,color:th.text2,lineHeight:1.6}}>{L("Each client is its own workspace with its own connected accounts, posts and reports.","كل عميل مساحة عمل مستقلة بحساباته ومنشوراته وتقاريره.")}</p>
            <input value={newName} autoFocus onChange={e=>setNewName(e.target.value)} onKeyDown={e=>e.key==='Enter'&&createClient()} placeholder={L("e.g. Trio Restaurant & Cafe","مثال: مطعم تريو")} style={{width:"100%",background:th.card2,border:`1px solid ${th.border}`,borderRadius:10,padding:"11px 13px",color:th.text,fontSize:13.5,outline:"none",boxSizing:"border-box",fontFamily:"inherit",marginBottom:18}}/>
            <div style={{display:"flex",gap:8}}>
              <button onClick={()=>setAddOpen(false)} style={{flex:1,padding:"11px",borderRadius:11,background:"transparent",border:`1px solid ${th.border}`,color:th.text2,fontSize:13,fontWeight:600,cursor:"pointer"}}>{L("Cancel","إلغاء")}</button>
              <button onClick={createClient} disabled={!newName.trim()||busy} style={{flex:2,padding:"12px",borderRadius:11,background:th.gradient,border:"none",color:"#fff",fontSize:13,fontWeight:700,cursor:newName.trim()?"pointer":"not-allowed",opacity:newName.trim()?1:0.6}}>{busy?L("Creating…","جارٍ الإنشاء…"):L("Create client","إنشاء عميل")}</button>
            </div>
          </div>
        </div>
      ), document.body)}

      {editClient && createPortal((
        <div onClick={()=>setEditClient(null)} style={{position:"fixed",inset:0,background:"rgba(4,6,12,0.72)",backdropFilter:"blur(4px)",zIndex:9998,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
          <div onClick={e=>e.stopPropagation()} style={{width:"100%",maxWidth:420,background:th.card,border:`1px solid ${th.border}`,borderRadius:18,padding:24,boxShadow:th.shadow}}>
            <h3 style={{margin:"0 0 16px",fontSize:18,fontWeight:800,color:th.text}}>{L("Edit client","تعديل العميل")}</h3>
            <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:16}}>
              <ClientMonogram name={editName||(editClient&&editClient.name)} logo={editLogo} size={56} radius={14}/>
              <div>
                <label style={{display:"inline-flex",alignItems:"center",gap:7,fontSize:12,fontWeight:600,color:th.accent,cursor:"pointer",border:`1px solid ${th.border}`,borderRadius:9,padding:"7px 13px"}}>
                  <Image size={14}/>{uploadingLogo?L("Uploading…","جارٍ الرفع…"):(editLogo?L("Change logo","تغيير الشعار"):L("Upload logo","رفع شعار"))}
                  <input type="file" accept="image/*" style={{display:"none"}} onChange={e=>{ if(e.target.files&&e.target.files[0]) setCropFile(e.target.files[0]); e.target.value=''; }}/>
                </label>
                {editLogo&&<button onClick={()=>setEditLogo("")} style={{marginInlineStart:8,fontSize:11,color:th.text3,background:"none",border:"none",cursor:"pointer"}}>{L("Remove","إزالة")}</button>}
                <div style={{fontSize:10.5,color:th.text3,marginTop:6}}>{L("PNG or JPG, optional. A monogram is used if empty.","PNG أو JPG، اختياري. يُستخدم الحرف إن تُرك فارغًا.")}</div>
              </div>
            </div>
            <div style={{fontSize:11,fontWeight:600,color:th.text2,marginBottom:6}}>{L("Client name","اسم العميل")}</div>
            <input value={editName} autoFocus onChange={e=>setEditName(e.target.value)} onKeyDown={e=>e.key==='Enter'&&saveEdit()} style={{width:"100%",background:th.card2,border:`1px solid ${th.border}`,borderRadius:10,padding:"11px 13px",color:th.text,fontSize:13.5,outline:"none",boxSizing:"border-box",fontFamily:"inherit",marginBottom:18}}/>
            <div style={{display:"flex",gap:8}}>
              <button onClick={()=>setEditClient(null)} style={{flex:1,padding:"11px",borderRadius:11,background:"transparent",border:`1px solid ${th.border}`,color:th.text2,fontSize:13,fontWeight:600,cursor:"pointer"}}>{L("Cancel","إلغاء")}</button>
              <button onClick={saveEdit} disabled={!editName.trim()||busy} style={{flex:2,padding:"12px",borderRadius:11,background:th.gradient,border:"none",color:"#fff",fontSize:13,fontWeight:700,cursor:editName.trim()?"pointer":"not-allowed",opacity:editName.trim()?1:0.6}}>{busy?L("Saving…","جارٍ الحفظ…"):L("Save","حفظ")}</button>
            </div>
          </div>
        </div>
      ), document.body)}

      {delClient && createPortal((
        <div onClick={()=>setDelClient(null)} style={{position:"fixed",inset:0,background:"rgba(4,6,12,0.72)",backdropFilter:"blur(4px)",zIndex:9998,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
          <div onClick={e=>e.stopPropagation()} style={{width:"100%",maxWidth:430,background:th.card,border:`1px solid ${th.border}`,borderRadius:18,padding:24,boxShadow:th.shadow}}>
            <div style={{display:"flex",alignItems:"center",gap:11,marginBottom:14}}><div style={{width:40,height:40,borderRadius:11,background:th.dangerSoft,display:"flex",alignItems:"center",justifyContent:"center"}}><Trash2 size={19} color={th.danger}/></div><span style={{fontSize:16,fontWeight:700,color:th.text}}>{L("Delete client?","حذف العميل؟")}</span></div>
            <div style={{fontSize:13,color:th.text2,lineHeight:1.65,marginBottom:20}}>{L("This permanently removes","سيؤدي هذا إلى حذف")} <strong style={{color:th.text}}>{delClient.name}</strong> {L("and its workspace. Connected accounts and posts for this client will be detached. This cannot be undone.","ومساحته. سيتم فصل الحسابات والمنشورات. لا يمكن التراجع.")}</div>
            <div style={{display:"flex",gap:10}}>
              <button onClick={()=>setDelClient(null)} style={{flex:1,padding:"11px",borderRadius:11,background:"transparent",border:`1px solid ${th.border}`,color:th.text2,fontSize:13,fontWeight:600,cursor:"pointer"}}>{L("Keep","الاحتفاظ")}</button>
              <button onClick={doDelete} disabled={busy} style={{flex:1,padding:"11px",borderRadius:11,background:th.danger,border:"none",color:"#fff",fontSize:13,fontWeight:700,cursor:"pointer",opacity:busy?0.7:1}}>{busy?L("Deleting…","جارٍ الحذف…"):L("Delete","حذف")}</button>
            </div>
          </div>
        </div>
      ), document.body)}

      {cropFile && <LogoCropper file={cropFile} onCancel={()=>setCropFile(null)} onSave={(blob)=>{ setCropFile(null); putLogo(blob); }}/>}
    </div>
  );
}

function OwnerDashboard() {
  const { setMode, setPage, setSelClient } = useApp();
  const th = useTheme();

  // Live platform data — pulled straight from Supabase so HQ shows real signups/counts.
  const [live, setLive] = useState({ profiles:null, clients:null, signups:[], loaded:false });
  useEffect(() => {
    let on = true;
    (async () => {
      try {
        const [pRes, cRes, recentRes] = await Promise.all([
          supabase.from('profiles').select('id', { count:'exact', head:true }),
          supabase.from('clients').select('id', { count:'exact', head:true }),
          supabase.from('profiles').select('name,email,plan,account_type,company_name,created_at').order('created_at', { ascending:false }).limit(6),
        ]);
        if (!on) return;
        setLive({ profiles: pRes.count ?? null, clients: cRes.count ?? null, signups: recentRes.data || [], loaded:true });
      } catch (e) { if (on) setLive(s => ({ ...s, loaded:true })); }
    })();
    return () => { on = false; };
  }, []);

  const sinceLabel = (ts) => {
    if (!ts) return "";
    const s = Math.floor((Date.now() - new Date(ts).getTime())/1000);
    if (s < 60) return "just now";
    if (s < 3600) return Math.floor(s/60)+"m ago";
    if (s < 86400) return Math.floor(s/3600)+"h ago";
    return Math.floor(s/86400)+"d ago";
  };

  const kpis = [
    { label:"Active subscriptions", value:"18", change:"+3", up:true, Icon:CreditCard, color:"accent", spark:[11,12,12,13,14,15,15,16,17,18] },
    { label:"Total clients", value: live.clients!=null ? String(live.clients) : "24", change:"+5", up:true, Icon:Building2, color:"accent2", spark:[14,16,17,18,19,20,21,22,23,24] },
    { label:"Trials active", value:"6", change:"+2", up:true, Icon:Sparkles, color:"info", spark:[3,2,4,3,5,4,5,4,5,6] },
    { label:"ARPU", value:"$91", change:"+4%", up:true, Icon:TrendingUp, color:"accent", spark:[79,81,82,84,85,86,88,89,90,91] },
  ];

  const rev = [620,710,690,820,910,880,1040,1180,1260,1410,1690,2180];
  const max = Math.max(...rev), min = Math.min(...rev), W = 560, H = 150, rng = (max - min) || 1;
  const pts = rev.map((v,i)=>[ (i/(rev.length-1))*W, H - ((v-min)/rng)*(H-16) - 8 ]);
  const line = "M" + pts.map(pt=>pt[0].toFixed(1)+","+pt[1].toFixed(1)).join(" L");
  const area = line + ` L${W},${H} L0,${H} Z`;

  const planMix = [
    { name:"Professional", count:11, color:th.accent },
    { name:"Essential", count:8, color:th.accent2 },
    { name:"Enterprise", count:5, color:th.success },
  ];
  const planTotal = planMix.reduce((s,p)=>s+p.count,0);

  const support = [
    { who:"Marina Cafe", msg:"How do I connect a second Instagram?", ago:"12m", urgent:false },
    { who:"Trio Restaurant", msg:"Payment failed on renewal", ago:"1h", urgent:true },
    { who:"Lulwa Events", msg:"Can I get an invoice for March?", ago:"3h", urgent:false },
  ];

  const card = { background:th.card, border:`1px solid ${th.border}`, borderRadius:18, boxShadow:"none" };

  return (
    <div>
      <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:22,flexWrap:"wrap",gap:12}}>
        <div>
          <h1 style={{margin:0,fontSize:21,fontWeight:700,letterSpacing:-0.5}}>Tawaslo HQ</h1>
          <p style={{margin:"5px 0 0",fontSize:12.5,color:th.text2}}>Platform overview · everything across your clients</p>
        </div>
        <div style={{display:"flex",gap:9}}>
          <button onClick={()=>setPage("revenue")} style={{display:"flex",alignItems:"center",gap:6,padding:"9px 15px",borderRadius:11,background:th.card,border:`1px solid ${th.border}`,color:th.text,fontSize:12.5,fontWeight:600,cursor:"pointer"}}><PieChart size={14}/>Revenue</button>
          <button onClick={()=>setPage("clients")} style={{display:"flex",alignItems:"center",gap:6,padding:"9px 15px",borderRadius:11,background:th.gradient,border:"none",color:"#fff",fontSize:12.5,fontWeight:600,cursor:"pointer"}}><Building2 size={14}/>Manage clients</button>
        </div>
      </div>

      <div style={{background:`linear-gradient(120deg, ${th.accent}1a, ${th.accent}03)`, border:`1px solid ${th.border}`, borderLeft:`2px solid ${th.accent}`, borderRadius:14, padding:"14px 20px", marginBottom:20, fontSize:14, color:th.text2, lineHeight:1.6}}>
        Tawaslo is at <span className="tw-num" style={{color:th.text, fontWeight:600}}>$2,180</span> MRR, up <span className="tw-num" style={{color:th.success, fontWeight:600}}>12%</span> this month, across <span className="tw-num" style={{color:th.text, fontWeight:600}}>{live.clients!=null?live.clients:24}</span> clients on <span className="tw-num">3</span> plans. <span style={{color:th.text3}}>Revenue has grown <span className="tw-num" style={{color:th.success}}>251%</span> over the last year.</span>
      </div>

      {/* Bento — hero revenue panel + sparkline KPI tiles (breaks the uniform grid) */}
      <div style={{display:"grid",gridTemplateColumns:"1.6fr 1fr",gap:14,marginBottom:14,alignItems:"stretch"}}>
        <div style={{...card,padding:24,position:"relative",overflow:"hidden"}}>
          <div style={{position:"absolute",right:-36,top:-36,opacity:0.05,pointerEvents:"none"}}><TrendingUp size={200} color={th.accent}/></div>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
            <div style={{fontSize:10.5,fontWeight:700,letterSpacing:0.7,color:th.text3,textTransform:"uppercase"}}>Monthly recurring revenue</div>
            <div style={{fontSize:11,color:th.success,fontWeight:700,display:"flex",alignItems:"center",gap:4}}><ArrowUpRight size={14}/>+251% YoY</div>
          </div>
          <div style={{display:"flex",alignItems:"baseline",gap:12}}>
            <span className="tw-num" style={{fontSize:42,fontWeight:600,letterSpacing:-1.2,color:th.text,lineHeight:1}}>$2,180</span>
            <span style={{display:"inline-flex",alignItems:"center",gap:3,fontSize:13,fontWeight:700,color:th.success}}><ArrowUpRight size={15}/>12% this month</span>
          </div>
          <div style={{fontSize:12,color:th.text2,marginTop:6,marginBottom:18}}><span className="tw-num">$26,160</span> ARR · <span className="tw-num">{live.clients!=null?live.clients:24}</span> paying clients</div>
          <HoverChart height={140}
            yTop={"$"+Math.max(...rev).toLocaleString()}
            lines={[{color:th.accent,label:"Revenue ($)",values:rev}]}
            labels={(()=>{const arr=[];const d=new Date();for(let i=11;i>=0;i--){arr.push(new Date(d.getFullYear(),d.getMonth()-i,1).toLocaleDateString([], {month:'short'}));}return arr;})()}/>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
          {kpis.map((s,i)=><StatCard key={i} {...s}/>)}
        </div>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:20}}>
        <div style={{...card,padding:20}}>
          <div style={{fontSize:13,fontWeight:600,marginBottom:16,display:"flex",alignItems:"center",gap:7}}><PieChart size={15} color={th.accent}/>Plan mix</div>
          {planMix.map((pl,i)=>(
            <div key={pl.name} style={{marginBottom:14}}>
              <div style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:6}}><span style={{color:th.text}}>{pl.name}</span><span className="tw-num" style={{color:th.text2}}>{pl.count}</span></div>
              <div style={{height:7,background:th.card2,borderRadius:4,overflow:"hidden"}}><div style={{height:"100%",width:`${pl.count/planTotal*100}%`,background:pl.color,borderRadius:4}}/></div>
            </div>
          ))}
          <div style={{fontSize:11,color:th.text2,marginTop:4}}><span className="tw-num">{planTotal}</span> paying clients across <span className="tw-num">3</span> plans</div>
        </div>
        <div style={{...card,padding:20}}>
          <div style={{fontSize:13,fontWeight:600,marginBottom:8,display:"flex",alignItems:"center",gap:7}}><Activity size={15} color={th.accent}/>This month</div>
          {[["Net new clients","+5",th.success],["Net revenue retention","112%",th.success],["Trial to paid","38%",th.text],["Open support tickets","3",th.warning]].map(([l,v,c],i,arr)=>(
            <div key={l} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 0",borderBottom:i<arr.length-1?`1px solid ${th.border}`:"none"}}>
              <span style={{fontSize:12.5,color:th.text2}}>{l}</span>
              <span className="tw-num" style={{fontSize:14.5,fontWeight:600,color:c}}>{v}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Recent activity across all clients — like the reference's main table, in our dark brand */}
      <div style={{...card,overflow:"hidden",marginBottom:16}}>
        <div style={{padding:"14px 20px",borderBottom:`1px solid ${th.border}`,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div style={{fontWeight:600,fontSize:13,display:"flex",alignItems:"center",gap:8}}><Activity size={15} color={th.accent}/>Recent activity across clients</div>
          <button onClick={()=>setPage("clients")} style={{fontSize:11,color:th.accent,background:th.accentSoft,border:"none",borderRadius:8,padding:"5px 11px",cursor:"pointer"}}>See all →</button>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1.6fr 1.4fr 0.9fr 0.9fr",gap:12,padding:"11px 20px",borderBottom:`1px solid ${th.border}`,fontSize:10.5,color:th.text2,fontWeight:600,textTransform:"uppercase",letterSpacing:0.4}}>
          <span>Client</span><span>Activity</span><span>Platform</span><span style={{textAlign:"right"}}>When</span>
        </div>
        {[
          { c:"Marina Cafe", a:"Published a Reel", p:"ig", t:"4m ago", dot:th.success },
          { c:"Gulf Auto", a:"Scheduled 3 posts", p:"fb", t:"22m ago", dot:th.accent },
          { c:"Lulwa Events", a:"Replied to 5 comments", p:"ig", t:"1h ago", dot:th.accent2 },
          { c:"Trio Restaurant", a:"Connected a new account", p:"tt", t:"2h ago", dot:th.info },
          { c:"Noor Designs", a:"Started free trial", p:"li", t:"3h ago", dot:th.success },
        ].map((r,i,arr)=>{ const PI = PlatformIcons[r.p]; return (
          <div key={i} style={{display:"grid",gridTemplateColumns:"1.6fr 1.4fr 0.9fr 0.9fr",gap:12,padding:"12px 20px",borderBottom:i<arr.length-1?`1px solid ${th.border}`:"none",alignItems:"center"}}>
            <div style={{display:"flex",alignItems:"center",gap:10,minWidth:0}}>
              <div style={{width:30,height:30,borderRadius:9,background:th.gradient,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,color:"#fff",flexShrink:0}}>{r.c.slice(0,2).toUpperCase()}</div>
              <span style={{fontSize:12.5,fontWeight:600,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{r.c}</span>
            </div>
            <span style={{fontSize:12,color:th.text2,display:"flex",alignItems:"center",gap:8}}><span style={{width:6,height:6,borderRadius:"50%",background:r.dot,flexShrink:0}}/>{r.a}</span>
            <span style={{display:"flex",alignItems:"center"}}>{PI && <PI/>}</span>
            <span style={{fontSize:11,color:th.text3,textAlign:"right"}}>{r.t}</span>
          </div>
        );})}
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1.7fr 1fr",gap:16}}>
        <div style={{...card,overflow:"hidden"}}>
          <div style={{padding:"14px 20px",borderBottom:`1px solid ${th.border}`,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
            <div style={{fontWeight:600,fontSize:13,display:"flex",alignItems:"center",gap:8}}>
              <span style={{position:"relative",display:"inline-flex"}}>
                <span style={{width:8,height:8,borderRadius:"50%",background:th.success,display:"inline-block"}}/>
                <span style={{position:"absolute",inset:0,borderRadius:"50%",background:th.success,opacity:0.5,animation:"twpulse 1.8s ease-out infinite"}}/>
              </span>
              Who just joined
            </div>
            <button onClick={()=>setPage("clients")} style={{fontSize:11,color:th.accent,background:th.accentSoft,border:"none",borderRadius:8,padding:"5px 11px",cursor:"pointer"}}>View all</button>
          </div>
          <style>{`@keyframes twpulse{0%{transform:scale(1);opacity:.5}70%{transform:scale(2.6);opacity:0}100%{opacity:0}}`}</style>
          {live.loaded && live.signups.length>0 ? (
            live.signups.map((u,i)=>{
              const nm = u.company_name || u.name || (u.email||"?").split("@")[0];
              const plan = u.plan==="trial" || !u.plan ? "Trial" : u.plan;
              const isTrial = plan==="Trial";
              return (
                <div key={i} onClick={()=>setPage("clients")} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"13px 20px",borderBottom:i<live.signups.length-1?`1px solid ${th.border}`:"none",cursor:"pointer"}}>
                  <div style={{display:"flex",alignItems:"center",gap:11,minWidth:0}}>
                    <div style={{width:34,height:34,borderRadius:10,background:th.gradient,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700,color:"#fff",flexShrink:0}}>{nm.slice(0,2).toUpperCase()}</div>
                    <div style={{minWidth:0}}><div style={{fontSize:13,fontWeight:600,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{nm}</div><div style={{fontSize:10.5,color:th.text2,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{u.email} · {sinceLabel(u.created_at)}</div></div>
                  </div>
                  <div style={{display:"flex",alignItems:"center",gap:8,flexShrink:0}}>
                    <Badge color={isTrial?"info":u.account_type==="agency"?"accent":"accent2"}>{isTrial?"Trial":(u.account_type||plan)}</Badge>
                    <div style={{display:"flex",gap:5}}>
                      <a href={`mailto:${u.email}`} onClick={e=>e.stopPropagation()} title="Email" style={{width:28,height:28,borderRadius:8,background:th.card2,border:`1px solid ${th.border}`,color:th.text2,display:"flex",alignItems:"center",justifyContent:"center",textDecoration:"none"}}><Mail size={13}/></a>
                      <button onClick={e=>{e.stopPropagation();setPage("clients");}} title="View" style={{width:28,height:28,borderRadius:8,background:th.card2,border:`1px solid ${th.border}`,color:th.text2,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}><Eye size={13}/></button>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            CLIENTS.slice(0,5).map((cl,i)=>(
              <div key={cl.id} onClick={()=>{setSelClient(cl);setMode("agency");setPage("dashboard");}} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"13px 20px",borderBottom:i<4?`1px solid ${th.border}`:"none",cursor:"pointer"}}>
                <div style={{display:"flex",alignItems:"center",gap:11}}>
                  <div style={{width:34,height:34,borderRadius:10,background:th.gradient,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700,color:"#fff"}}>{(cl.name||"?").slice(0,2).toUpperCase()}</div>
                  <div><div style={{fontSize:13,fontWeight:600}}>{cl.name}</div><div style={{fontSize:10.5,color:th.text2}}>{cl.accounts} accounts · {cl.reach} reach</div></div>
                </div>
                <div style={{display:"flex",alignItems:"center",gap:12}}>
                  <Badge color={cl.plan==="Corporate"?"orange":cl.plan==="Pro"?"accent2":cl.plan==="Internal"?"success":"accent"}>{cl.plan}</Badge>
                  <span className="tw-num" style={{fontSize:13,fontWeight:600,color:cl.free?th.success:th.text,minWidth:54,textAlign:"right"}}>{cl.free?"Free":"$"+cl.spend}</span>
                </div>
              </div>
            ))
          )}
        </div>
        <div style={{...card,overflow:"hidden"}}>
          <div style={{padding:"14px 20px",borderBottom:`1px solid ${th.border}`,fontWeight:600,fontSize:13,display:"flex",alignItems:"center",gap:8}}><MessageCircle size={15} color={th.accent}/>Support inbox</div>
          {support.map((sp,i)=>(
            <div key={i} style={{padding:"13px 18px",borderBottom:i<support.length-1?`1px solid ${th.border}`:"none"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:3}}>
                <span style={{fontSize:12.5,fontWeight:600}}>{sp.who}</span>
                <span style={{fontSize:10,color:th.text3}}>{sp.ago}</span>
              </div>
              <div style={{fontSize:11.5,color:th.text2,display:"flex",alignItems:"center",gap:6}}>{sp.urgent&&<span style={{width:6,height:6,borderRadius:"50%",background:th.danger,flexShrink:0}}/>}{sp.msg}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ───────────────────────── TAWASLO HQ · OWNER SUB-PAGES ─────────────────────────

function OwnerPageHead({ Icon, title, subtitle, action }) {
  const th = useTheme();
  return (
    <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:22,flexWrap:"wrap",gap:12}}>
      <div style={{display:"flex",alignItems:"center",gap:13}}>
        <div style={{width:42,height:42,borderRadius:13,background:th.gradient,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,boxShadow:"0 8px 22px rgba(110,140,171,0.35)"}}><Icon size={20} color="#fff"/></div>
        <div>
          <h1 style={{margin:0,fontSize:21,fontWeight:700,letterSpacing:-0.5}}>{title}</h1>
          <p style={{margin:"4px 0 0",fontSize:12.5,color:th.text2}}>{subtitle}</p>
        </div>
      </div>
      {action}
    </div>
  );
}

const OWNER_CLIENTS = [
  { id:"c1", name:"Marina Cafe",      email:"hi@marinacafe.bh",     plan:"Professional", status:"active",  accounts:3, mrr:99,  joined:"Mar 2026" },
  { id:"c2", name:"Trio Restaurant",  email:"team@trio.bh",         plan:"Essential",    status:"active",  accounts:2, mrr:49,  joined:"Feb 2026" },
  { id:"c3", name:"Lulwa Events",     email:"lulwa@events.bh",      plan:"Professional", status:"active",  accounts:4, mrr:99,  joined:"Jan 2026" },
  { id:"c4", name:"Gulf Auto",        email:"info@gulfauto.bh",     plan:"Enterprise",   status:"active",  accounts:6, mrr:199, joined:"Dec 2025" },
  { id:"c5", name:"Bayan Clinic",     email:"admin@bayan.bh",       plan:"Essential",    status:"trial",   accounts:1, mrr:0,   joined:"Jun 2026" },
  { id:"c6", name:"Noor Designs",     email:"noor@designs.bh",      plan:"Professional", status:"past_due",accounts:2, mrr:99,  joined:"Nov 2025" },
  { id:"c7", name:"Octo Fusion",      email:"theoctopus.bh@gmail.com", plan:"Internal",  status:"active",  accounts:4, mrr:0,   joined:"Jan 2025" },
  { id:"c8", name:"Souq Online",      email:"hello@souq.bh",        plan:"Enterprise",   status:"suspended",accounts:5,mrr:199, joined:"Oct 2025" },
];

const planColor = (th, p) => p==="Enterprise"?th.orange : p==="Professional"?th.accent : p==="Internal"?th.success : th.accent2;
const statusMeta = (th, s) => ({
  active:   { label:"Active",   c:th.success, bg:th.successSoft },
  trial:    { label:"Trial",    c:th.info,    bg:th.infoSoft },
  past_due: { label:"Past due", c:th.warning, bg:th.warningSoft },
  suspended:{ label:"Suspended",c:th.danger,  bg:th.dangerSoft },
}[s] || { label:s, c:th.text2, bg:th.card2 });

function OwnerClientsPage() {
  const { setMode, setPage, setSelClient } = useApp();
  const th = useTheme();
  const [rows, setRows] = useState(OWNER_CLIENTS);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("all");
  const [menu, setMenu] = useState(null);
  const [detail, setDetail] = useState(null);   // client open in the side drawer
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [logs, setLogs] = useState([
    { id:1, msg:"Bayan Clinic started a free trial", who:"System", ago:"12m ago", icon:Sparkles, c:th.info },
    { id:2, msg:"Marina Cafe upgraded to Professional", who:"System", ago:"1h ago", icon:ArrowUpRight, c:th.success },
    { id:3, msg:"Payment failed for Noor Designs", who:"System", ago:"3h ago", icon:CreditCard, c:th.warning },
    { id:4, msg:"Souq Online was suspended", who:"You", ago:"5h ago", icon:Pause, c:th.danger },
    { id:5, msg:"Gulf Auto connected a new account", who:"System", ago:"1d ago", icon:Link, c:th.accent },
    { id:6, msg:"Promo code BAHRAIN10 redeemed by Trio Restaurant", who:"System", ago:"1d ago", icon:Tag, c:th.accent2 },
  ]);
  const pushLog = (msg, icon=Activity, c=th.accent) => setLogs(ls => [{ id:Date.now(), msg, who:"You", ago:"just now", icon, c }, ...ls].slice(0,14));

  const card = { background:th.card, border:`1px solid ${th.border}`, borderRadius:18, boxShadow:"none" };
  const openDetail = (r) => { setDetail(r); setEditing(false); setForm({ name:r.name, email:r.email, plan:r.plan, status:r.status }); setMenu(null); };
  const saveEdit = () => { setRows(rs=>rs.map(x=>x.id===detail.id?{...x,...form}:x)); setDetail(d=>({...d,...form})); setEditing(false); pushLog(`Edited ${form.name}`, Edit3, th.accent); };
  const filtered = rows.filter(r =>
    (filter==="all" || r.status===filter) &&
    (r.name.toLowerCase().includes(q.toLowerCase()) || r.email.toLowerCase().includes(q.toLowerCase()))
  );
  const totalMrr = rows.filter(r=>r.status==="active").reduce((s,r)=>s+r.mrr,0);
  const toggleStatus = (id) => setRows(rs => rs.map(r => r.id===id ? { ...r, status: r.status==="suspended"?"active":"suspended" } : r));
  const impersonate = (r) => { setSelClient({ id:r.id, name:r.name, plan:r.plan }); setMode("agency"); setPage("dashboard"); };

  const TABS = [["all","All"],["active","Active"],["trial","Trials"],["past_due","Past due"],["suspended","Suspended"]];

  return (
    <div onClick={()=>setMenu(null)}>
      <OwnerPageHead Icon={Building2} title="All Clients" subtitle={`${rows.length} clients · $${totalMrr}/mo active revenue`}
        action={<button style={{display:"flex",alignItems:"center",gap:7,padding:"10px 16px",borderRadius:11,background:th.gradient,border:"none",color:"#fff",fontSize:12.5,fontWeight:600,cursor:"pointer"}}><Plus size={15}/>Add client</button>} />

      <div style={{display:"flex",gap:11,marginBottom:16,flexWrap:"wrap",alignItems:"center"}}>
        <div style={{display:"flex",alignItems:"center",gap:8,background:th.card,border:`1px solid ${th.border}`,borderRadius:11,padding:"9px 13px",flex:"1 1 260px",maxWidth:340}}>
          <Search size={14} color={th.text3}/>
          <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search clients by name or email…" style={{background:"transparent",border:"none",outline:"none",color:th.text,fontSize:12.5,width:"100%",fontFamily:"inherit"}}/>
        </div>
        <div style={{display:"flex",gap:7,flexWrap:"wrap"}}>
          {TABS.map(([k,l])=>(
            <button key={k} onClick={()=>setFilter(k)} style={{padding:"8px 13px",borderRadius:9,fontSize:12,fontWeight:600,cursor:"pointer",border:`1px solid ${filter===k?th.accent:th.border}`,background:filter===k?th.accentSoft:th.card,color:filter===k?th.accent:th.text2}}>{l}</button>
          ))}
        </div>
      </div>

      <div style={{...card,overflow:"visible"}}>
        <div style={{display:"grid",gridTemplateColumns:"2.2fr 1.1fr 1fr 0.8fr 0.9fr 44px",gap:12,padding:"13px 20px",borderBottom:`1px solid ${th.border}`,fontSize:11,color:th.text2,fontWeight:600,textTransform:"uppercase",letterSpacing:0.4}}>
          <span>Client</span><span>Plan</span><span>Status</span><span>Accounts</span><span style={{textAlign:"right"}}>MRR</span><span/>
        </div>
        {filtered.map((r,i)=>{ const sm=statusMeta(th,r.status); return (
          <div key={r.id} onClick={()=>openDetail(r)} style={{display:"grid",gridTemplateColumns:"2.2fr 1.1fr 1fr 0.8fr 0.9fr 44px",gap:12,padding:"13px 20px",borderBottom:i<filtered.length-1?`1px solid ${th.border}`:"none",alignItems:"center",position:"relative",cursor:"pointer"}}>
            <div style={{display:"flex",alignItems:"center",gap:11,minWidth:0}}>
              <div style={{width:34,height:34,borderRadius:10,background:th.gradient,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700,color:"#fff",flexShrink:0}}>{r.name.slice(0,2).toUpperCase()}</div>
              <div style={{minWidth:0}}><div style={{fontSize:13,fontWeight:600,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{r.name}</div><div style={{fontSize:10.5,color:th.text2,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{r.email}</div></div>
            </div>
            <span><span style={{fontSize:10.5,fontWeight:700,color:planColor(th,r.plan),background:th.card2,borderRadius:999,padding:"3px 10px"}}>{r.plan}</span></span>
            <span><span style={{fontSize:10.5,fontWeight:700,color:sm.c,background:sm.bg,borderRadius:999,padding:"3px 10px"}}>{sm.label}</span></span>
            <span style={{fontSize:12.5,color:th.text2}}>{r.accounts}</span>
            <span style={{fontSize:13,fontWeight:700,textAlign:"right",color:r.mrr?th.text:th.text3}}>{r.mrr?`$${r.mrr}`:"—"}</span>
            <div style={{position:"relative",justifySelf:"end"}}>
              <button onClick={(e)=>{e.stopPropagation();setMenu(menu===r.id?null:r.id);}} style={{width:30,height:30,borderRadius:8,background:"transparent",border:`1px solid ${th.border}`,color:th.text2,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}><MoreHorizontal size={15}/></button>
              {menu===r.id && (
                <div onClick={e=>e.stopPropagation()} style={{position:"absolute",right:0,top:36,zIndex:20,width:184,background:th.card2,border:`1px solid ${th.border}`,borderRadius:12,boxShadow:"0 16px 40px rgba(0,0,0,0.45)",overflow:"hidden",padding:5}}>
                  {[
                    { l:"View details", Icon:Eye, fn:()=>openDetail(r) },
                    { l:"Edit", Icon:Edit3, fn:()=>{ openDetail(r); setEditing(true); } },
                    { l:"Open dashboard", Icon:ArrowUpRight, fn:()=>impersonate(r) },
                    { l:r.status==="suspended"?"Reactivate":"Suspend", Icon:r.status==="suspended"?Play:Pause, fn:()=>{toggleStatus(r.id); pushLog(`${r.status==="suspended"?"Reactivated":"Suspended"} ${r.name}`, r.status==="suspended"?Play:Pause, r.status==="suspended"?th.success:th.danger);} },
                    { l:"Delete", Icon:Trash2, danger:true, fn:()=>{setRows(rs=>rs.filter(x=>x.id!==r.id)); pushLog(`Deleted ${r.name}`, Trash2, th.danger);} },
                  ].map((it,k)=>(
                    <button key={k} onClick={()=>{it.fn();setMenu(null);}} style={{display:"flex",alignItems:"center",gap:9,width:"100%",padding:"9px 11px",borderRadius:8,background:"transparent",border:"none",color:it.danger?th.danger:th.text,fontSize:12.5,fontWeight:500,cursor:"pointer",textAlign:"left"}}><it.Icon size={14}/>{it.l}</button>
                  ))}
                </div>
              )}
            </div>
          </div>
        );})}
        {filtered.length===0 && <div style={{padding:"40px",textAlign:"center",fontSize:13,color:th.text3}}>No clients match your search.</div>}
      </div>

      {/* Activity log — audit trail of platform actions */}
      <div style={{...card, marginTop:16, overflow:"hidden"}}>
        <div style={{padding:"14px 20px",borderBottom:`1px solid ${th.border}`,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div style={{fontWeight:600,fontSize:13,display:"flex",alignItems:"center",gap:8}}><Activity size={15} color={th.accent}/>Activity log</div>
          <span style={{fontSize:11,color:th.text3}}>Audit trail of platform actions</span>
        </div>
        {logs.map((lg,i)=>{ const Ic=lg.icon||Activity; return (
          <div key={lg.id} style={{display:"flex",alignItems:"center",gap:12,padding:"11px 20px",borderBottom:i<logs.length-1?`1px solid ${th.border}`:"none"}}>
            <div style={{width:30,height:30,borderRadius:9,background:(lg.c||th.accent)+"1e",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><Ic size={14} color={lg.c||th.accent}/></div>
            <div style={{flex:1,minWidth:0,fontSize:12.5,color:th.text}}>{lg.msg}</div>
            <span style={{fontSize:10,fontWeight:700,color:lg.who==="You"?th.accent:th.text3,background:lg.who==="You"?th.accentSoft:"transparent",borderRadius:6,padding:"2px 8px",flexShrink:0}}>{lg.who}</span>
            <span style={{fontSize:10.5,color:th.text3,flexShrink:0,minWidth:62,textAlign:"right"}}>{lg.ago}</span>
          </div>
        );})}
      </div>

      {/* Client detail / edit drawer */}
      {detail && (() => { const sm=statusMeta(th,detail.status); return (
        <div onClick={()=>setDetail(null)} style={{position:"fixed",inset:0,background:"rgba(3,5,10,0.55)",zIndex:60,display:"flex",justifyContent:"flex-end"}}>
          <div onClick={e=>e.stopPropagation()} style={{width:420,maxWidth:"92vw",height:"100%",background:th.surface,borderLeft:`1px solid ${th.border}`,overflowY:"auto",boxShadow:"-20px 0 60px rgba(0,0,0,0.5)"}}>
            <div style={{padding:"22px 24px",borderBottom:`1px solid ${th.border}`,display:"flex",alignItems:"center",gap:13}}>
              <div style={{width:46,height:46,borderRadius:13,background:th.gradient,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,fontWeight:700,color:"#fff",flexShrink:0}}>{detail.name.slice(0,2).toUpperCase()}</div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:16,fontWeight:600,color:th.text}}>{detail.name}</div>
                <div style={{fontSize:11.5,color:th.text2}}>{detail.email}</div>
              </div>
              <span style={{fontSize:10.5,fontWeight:700,color:sm.c,background:sm.bg,borderRadius:999,padding:"3px 10px",flexShrink:0}}>{sm.label}</span>
              <button onClick={()=>setDetail(null)} style={{background:"none",border:"none",cursor:"pointer",color:th.text2,display:"flex"}}><XCircle size={20}/></button>
            </div>

            {!editing ? (
              <>
                <div style={{padding:"18px 24px",display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                  {[["Plan",detail.plan],["Accounts",detail.accounts],["MRR",detail.mrr?`$${detail.mrr}`:"—"],["Joined",detail.joined]].map(([l,v])=>(
                    <div key={l} style={{background:th.card,border:`1px solid ${th.border}`,borderRadius:12,padding:"12px 14px"}}>
                      <div style={{fontSize:10.5,color:th.text2,marginBottom:5}}>{l}</div>
                      <div className="tw-num" style={{fontSize:15,fontWeight:600,color:th.text}}>{v}</div>
                    </div>
                  ))}
                </div>
                <div style={{padding:"4px 24px 8px"}}>
                  <div style={{fontSize:11,fontWeight:700,letterSpacing:0.5,color:th.text3,textTransform:"uppercase",marginBottom:10}}>Recent activity</div>
                  {[["Published a Reel","4m ago",th.success],["Scheduled 3 posts","2h ago",th.accent],["Replied to 5 comments","6h ago",th.accent2],["Account created",detail.joined,th.text3]].map(([t,ago,c],i)=>(
                    <div key={i} style={{display:"flex",alignItems:"center",gap:11,padding:"9px 0",borderBottom:i<3?`1px solid ${th.border}`:"none"}}>
                      <span style={{width:7,height:7,borderRadius:"50%",background:c,flexShrink:0}}/>
                      <span style={{flex:1,fontSize:12.5,color:th.text}}>{t}</span>
                      <span style={{fontSize:10.5,color:th.text3}}>{ago}</span>
                    </div>
                  ))}
                </div>
                <div style={{padding:"14px 24px 24px",display:"flex",flexDirection:"column",gap:9}}>
                  <button onClick={()=>impersonate(detail)} style={{display:"flex",alignItems:"center",justifyContent:"center",gap:7,padding:"11px",borderRadius:11,background:th.gradient,border:"none",color:"#fff",fontSize:13,fontWeight:600,cursor:"pointer"}}><ArrowUpRight size={15}/>Open their dashboard</button>
                  <div style={{display:"flex",gap:9}}>
                    <button onClick={()=>setEditing(true)} style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",gap:6,padding:"10px",borderRadius:11,background:th.card,border:`1px solid ${th.border}`,color:th.text,fontSize:12.5,cursor:"pointer"}}><Edit3 size={14}/>Edit</button>
                    <a href={`mailto:${detail.email}`} style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",gap:6,padding:"10px",borderRadius:11,background:th.card,border:`1px solid ${th.border}`,color:th.text,fontSize:12.5,textDecoration:"none"}}><Mail size={14}/>Email</a>
                  </div>
                  <button onClick={()=>{toggleStatus(detail.id); pushLog(`${detail.status==="suspended"?"Reactivated":"Suspended"} ${detail.name}`, detail.status==="suspended"?Play:Pause, detail.status==="suspended"?th.success:th.danger); setDetail(d=>({...d,status:d.status==="suspended"?"active":"suspended"}));}} style={{display:"flex",alignItems:"center",justifyContent:"center",gap:7,padding:"10px",borderRadius:11,background:detail.status==="suspended"?th.successSoft:th.warningSoft,border:`1px solid ${(detail.status==="suspended"?th.success:th.warning)}33`,color:detail.status==="suspended"?th.success:th.warning,fontSize:12.5,cursor:"pointer"}}>{detail.status==="suspended"?<><Play size={14}/>Reactivate account</>:<><Pause size={14}/>Suspend account</>}</button>
                </div>
              </>
            ) : (
              <div style={{padding:"20px 24px"}}>
                <div style={{fontSize:11,fontWeight:700,letterSpacing:0.5,color:th.text3,textTransform:"uppercase",marginBottom:14}}>Edit client</div>
                {[["name","Name"],["email","Email"]].map(([k,l])=>(
                  <div key={k} style={{marginBottom:13}}>
                    <div style={{fontSize:11,color:th.text2,marginBottom:5}}>{l}</div>
                    <input value={form[k]||""} onChange={e=>setForm(f=>({...f,[k]:e.target.value}))} style={{width:"100%",background:th.card2,border:`1px solid ${th.border}`,borderRadius:9,padding:"10px 13px",color:th.text,fontSize:13,outline:"none",boxSizing:"border-box",fontFamily:"inherit"}}/>
                  </div>
                ))}
                <div style={{marginBottom:13}}>
                  <div style={{fontSize:11,color:th.text2,marginBottom:5}}>Plan</div>
                  <select value={form.plan} onChange={e=>setForm(f=>({...f,plan:e.target.value}))} style={{width:"100%",background:th.card2,border:`1px solid ${th.border}`,borderRadius:9,padding:"10px 13px",color:th.text,fontSize:13,outline:"none",fontFamily:"inherit"}}>{["Essential","Professional","Enterprise","Internal"].map(p=><option key={p} value={p}>{p}</option>)}</select>
                </div>
                <div style={{marginBottom:18}}>
                  <div style={{fontSize:11,color:th.text2,marginBottom:5}}>Status</div>
                  <select value={form.status} onChange={e=>setForm(f=>({...f,status:e.target.value}))} style={{width:"100%",background:th.card2,border:`1px solid ${th.border}`,borderRadius:9,padding:"10px 13px",color:th.text,fontSize:13,outline:"none",fontFamily:"inherit"}}>{["active","trial","past_due","suspended"].map(p=><option key={p} value={p}>{p}</option>)}</select>
                </div>
                <div style={{display:"flex",gap:9}}>
                  <button onClick={()=>setEditing(false)} style={{flex:1,padding:"11px",borderRadius:11,background:th.card,border:`1px solid ${th.border}`,color:th.text,fontSize:13,cursor:"pointer"}}>Cancel</button>
                  <button onClick={saveEdit} style={{flex:1.4,padding:"11px",borderRadius:11,background:th.gradient,border:"none",color:"#fff",fontSize:13,fontWeight:600,cursor:"pointer"}}>Save changes</button>
                </div>
              </div>
            )}
          </div>
        </div>
      ); })()}
    </div>
  );
}

const PROMO_DEMO = [
  { id:"p1", code:"LAUNCH30", type:"percent", value:30, plans:"All plans", uses:14, limit:100, expiry:"2026-08-31", active:true },
  { id:"p2", code:"BAHRAIN10", type:"fixed", value:10, plans:"Essential", uses:6, limit:50, expiry:"2026-07-15", active:true },
  { id:"p3", code:"WELCOME", type:"percent", value:20, plans:"All plans", uses:38, limit:0, expiry:"—", active:true },
];
// DB row → UI shape
const mapPromo = (r) => ({ id:r.id, code:r.code, type:r.discount_type, value:Number(r.discount_value), plans:r.applies_to, uses:r.uses||0, limit:r.usage_limit||0, expiry:r.expiry||"—", active:r.active });

function OwnerPromosPage() {
  const th = useTheme();
  const [codes, setCodes] = useState(PROMO_DEMO);
  const [live, setLive] = useState(false); // true once real rows load (so writes hit the DB)
  const [code, setCode] = useState("");
  const [type, setType] = useState("percent");
  const [value, setValue] = useState("");
  const [plans, setPlans] = useState("All plans");
  const [limit, setLimit] = useState("");
  const [expiry, setExpiry] = useState("");
  const [copied, setCopied] = useState(null);

  useEffect(() => {
    let on = true;
    (async () => {
      const { data, error } = await getPromoCodes();
      if (!on) return;
      if (!error && Array.isArray(data)) { setCodes(data.map(mapPromo)); setLive(true); }
      // error → table not created yet → keep demo rows (read-only feel)
    })();
    return () => { on = false; };
  }, []);

  const card = { background:th.card, border:`1px solid ${th.border}`, borderRadius:18, boxShadow:"none" };
  const inp = { width:"100%",background:th.card2,border:`1px solid ${th.border}`,borderRadius:10,padding:"10px 12px",color:th.text,fontSize:12.5,outline:"none",fontFamily:"inherit",boxSizing:"border-box" };
  const lbl = { fontSize:11,color:th.text2,fontWeight:600,marginBottom:6,display:"block" };

  const create = async () => {
    if (!code.trim() || !value) return;
    const clean = code.toUpperCase().replace(/\s/g,"");
    if (live) {
      const { data } = await createPromoCode({ code:clean, discount_type:type, discount_value:Number(value), applies_to:plans, usage_limit:Number(limit)||0, expiry:expiry||null });
      if (data && data[0]) setCodes(cs => [mapPromo(data[0]), ...cs]);
    } else {
      setCodes(cs => [{ id:"p"+Date.now(), code:clean, type, value:Number(value), plans, uses:0, limit:Number(limit)||0, expiry:expiry||"—", active:true }, ...cs]);
    }
    setCode("");setValue("");setLimit("");setExpiry("");
  };
  const copy = (c) => { try{navigator.clipboard.writeText(c);}catch(e){} setCopied(c); setTimeout(()=>setCopied(null),1400); };
  const toggle = async (id) => {
    const cur = codes.find(c=>c.id===id); if (!cur) return;
    setCodes(cs=>cs.map(c=>c.id===id?{...c,active:!c.active}:c));
    if (live) await updatePromoCode(id, { active: !cur.active });
  };
  const del = async (id) => {
    setCodes(cs=>cs.filter(c=>c.id!==id));
    if (live) await deletePromoCode(id);
  };

  const totalRedemptions = codes.reduce((s,c)=>s+c.uses,0);

  return (
    <div>
      <OwnerPageHead Icon={Tag} title="Promo Codes" subtitle={`${codes.filter(c=>c.active).length} active codes · ${totalRedemptions} total redemptions`} />
      <div style={{display:"grid",gridTemplateColumns:"360px 1fr",gap:16,alignItems:"start"}}>
        <div style={{...card,padding:20}}>
          <div style={{fontSize:13.5,fontWeight:700,marginBottom:16}}>Create a code</div>
          <label style={lbl}>Code</label>
          <input value={code} onChange={e=>setCode(e.target.value)} placeholder="e.g. RAMADAN25" style={{...inp,marginBottom:14,textTransform:"uppercase",letterSpacing:1,fontWeight:700}}/>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
            <div><label style={lbl}>Type</label>
              <select value={type} onChange={e=>setType(e.target.value)} style={inp}><option value="percent">% off</option><option value="fixed">$ off</option></select>
            </div>
            <div><label style={lbl}>Value</label>
              <input value={value} onChange={e=>setValue(e.target.value.replace(/[^0-9]/g,""))} placeholder={type==="percent"?"30":"10"} style={inp}/>
            </div>
          </div>
          <label style={lbl}>Applies to</label>
          <select value={plans} onChange={e=>setPlans(e.target.value)} style={{...inp,marginBottom:14}}><option>All plans</option><option>Essential</option><option>Professional</option><option>Enterprise</option></select>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:18}}>
            <div><label style={lbl}>Usage limit</label><input value={limit} onChange={e=>setLimit(e.target.value.replace(/[^0-9]/g,""))} placeholder="∞" style={inp}/></div>
            <div><label style={lbl}>Expiry</label><input type="date" value={expiry} onChange={e=>setExpiry(e.target.value)} style={inp}/></div>
          </div>
          <button onClick={create} style={{width:"100%",padding:"11px",borderRadius:11,background:th.gradient,border:"none",color:"#fff",fontSize:13,fontWeight:600,cursor:"pointer"}}>Create code</button>
        </div>

        <div style={{...card,overflow:"hidden"}}>
          <div style={{padding:"14px 20px",borderBottom:`1px solid ${th.border}`,fontWeight:600,fontSize:13}}>Active &amp; past codes</div>
          {codes.length===0 && <div style={{padding:"40px 20px",textAlign:"center"}}><div style={{width:44,height:44,borderRadius:12,background:th.card2,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 12px"}}><Tag size={19} color={th.text3}/></div><div style={{fontSize:13,fontWeight:600,marginBottom:4}}>No codes yet</div><div style={{fontSize:12,color:th.text3}}>Create your first promo code to start offering discounts.</div></div>}
          {codes.map((c,i)=>(
            <div key={c.id} style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:12,padding:"14px 20px",borderBottom:i<codes.length-1?`1px solid ${th.border}`:"none",opacity:c.active?1:0.55}}>
              <div style={{display:"flex",alignItems:"center",gap:13,minWidth:0}}>
                <div style={{width:40,height:40,borderRadius:11,background:c.active?th.accentSoft:th.card2,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><Tag size={17} color={c.active?th.accent:th.text3}/></div>
                <div style={{minWidth:0}}>
                  <div style={{display:"flex",alignItems:"center",gap:8}}>
                    <span style={{fontSize:13.5,fontWeight:800,letterSpacing:0.5,fontFamily:"monospace"}}>{c.code}</span>
                    <span style={{fontSize:10.5,fontWeight:700,color:th.success,background:th.successSoft,borderRadius:999,padding:"2px 8px"}}>{c.type==="percent"?<><span className="tw-num">{c.value}</span>% off</>:<>$<span className="tw-num">{c.value}</span> off</>}</span>
                  </div>
                  <div style={{fontSize:10.5,color:th.text2,marginTop:3}}>{c.plans} · <span className="tw-num">{c.uses}</span>{c.limit?<>/<span className="tw-num">{c.limit}</span></>:""} used · exp {c.expiry}</div>
                </div>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:7,flexShrink:0}}>
                <button onClick={()=>copy(c.code)} title="Copy" style={{width:32,height:32,borderRadius:8,background:"transparent",border:`1px solid ${th.border}`,color:copied===c.code?th.success:th.text2,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>{copied===c.code?<CheckCircle size={14}/>:<Copy size={14}/>}</button>
                <button onClick={()=>toggle(c.id)} title={c.active?"Pause":"Activate"} style={{width:32,height:32,borderRadius:8,background:"transparent",border:`1px solid ${th.border}`,color:th.text2,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>{c.active?<Pause size={14}/>:<Play size={14}/>}</button>
                <button onClick={()=>del(c.id)} title="Delete" style={{width:32,height:32,borderRadius:8,background:"transparent",border:`1px solid ${th.border}`,color:th.danger,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}><Trash2 size={14}/></button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const GIFT_DEMO = [
  { id:"g1", code:"GIFT-4F2A-9KL", amount:50, recipient:"sara@startup.bh", status:"redeemed", date:"May 2026" },
  { id:"g2", code:"GIFT-7Y1C-3MQ", amount:100, recipient:"founder@bhtech.bh", status:"active", date:"Jun 2026" },
  { id:"g3", code:"GIFT-2D8E-6RT", amount:25, recipient:"hello@cafe.bh", status:"active", date:"Jun 2026" },
];
const mapGift = (r) => ({ id:r.id, code:r.code, amount:Number(r.amount), recipient:r.recipient_email||"", status:r.status, date: r.created_at ? new Date(r.created_at).toLocaleDateString('en-US',{month:'short',year:'numeric'}) : "" });

function OwnerGiftsPage() {
  const th = useTheme();
  const [cards, setCards] = useState(GIFT_DEMO);
  const [live, setLive] = useState(false);
  const [tab, setTab] = useState("card");
  const [amount, setAmount] = useState("50");
  const [recipient, setRecipient] = useState("");
  const [message, setMessage] = useState("");
  const [giftClient, setGiftClient] = useState("Marina Cafe");
  const [giftPlan, setGiftPlan] = useState("Professional");
  const [giftMonths, setGiftMonths] = useState("1");
  const [toast, setToast] = useState("");

  useEffect(() => {
    let on = true;
    (async () => {
      const { data, error } = await getGiftCards();
      if (!on) return;
      if (!error && Array.isArray(data)) { setCards(data.map(mapGift)); setLive(true); }
    })();
    return () => { on = false; };
  }, []);

  const card = { background:th.card, border:`1px solid ${th.border}`, borderRadius:18, boxShadow:"none" };
  const inp = { width:"100%",background:th.card2,border:`1px solid ${th.border}`,borderRadius:10,padding:"10px 12px",color:th.text,fontSize:12.5,outline:"none",fontFamily:"inherit",boxSizing:"border-box" };
  const lbl = { fontSize:11,color:th.text2,fontWeight:600,marginBottom:6,display:"block" };
  const flash = (m) => { setToast(m); setTimeout(()=>setToast(""),2200); };

  const issueCard = async () => {
    if (!recipient.trim()||!amount) return;
    const rnd = () => Math.random().toString(36).slice(2,6).toUpperCase();
    const newCode = `GIFT-${rnd()}-${rnd()}`;
    if (live) {
      const { data } = await createGiftCard({ code:newCode, amount:Number(amount), recipient_email:recipient, message:message||null });
      if (data && data[0]) setCards(cs => [mapGift(data[0]), ...cs]);
    } else {
      setCards(cs => [{ id:"g"+Date.now(), code:newCode, amount:Number(amount), recipient, status:"active", date:"Jun 2026" }, ...cs]);
    }
    flash(`Gift card for $${amount} sent to ${recipient}`); setRecipient("");setMessage("");
  };
  const giftPlanFn = () => { flash(`Gifted ${giftMonths} month(s) of ${giftPlan} to ${giftClient}`); };
  const revoke = async (id) => {
    setCards(cs=>cs.map(c=>c.id===id?{...c,status:"revoked"}:c));
    if (live) await updateGiftCard(id, { status:"revoked" });
  };

  const totalIssued = cards.reduce((s,c)=>s+c.amount,0);
  const tabBtn = (k,l,I) => (
    <button onClick={()=>setTab(k)} style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",gap:7,padding:"11px",borderRadius:10,fontSize:12.5,fontWeight:600,cursor:"pointer",border:`1px solid ${tab===k?th.accent:th.border}`,background:tab===k?th.accentSoft:th.card2,color:tab===k?th.accent:th.text2}}><I size={15}/>{l}</button>
  );
  const sMeta = { active:{c:th.success,bg:th.successSoft,l:"Active"}, redeemed:{c:th.text2,bg:th.card2,l:"Redeemed"}, revoked:{c:th.danger,bg:th.dangerSoft,l:"Revoked"} };

  return (
    <div>
      <OwnerPageHead Icon={Gift} title="Gift Cards & Gifting" subtitle={`${cards.filter(c=>c.status==="active").length} active cards · $${totalIssued} issued`} />
      {toast && <div style={{marginBottom:14,padding:"11px 16px",borderRadius:11,background:th.successSoft,border:`1px solid ${th.success}44`,color:th.success,fontSize:12.5,fontWeight:600,display:"flex",alignItems:"center",gap:8}}><CheckCircle size={15}/>{toast}</div>}
      <div style={{display:"grid",gridTemplateColumns:"360px 1fr",gap:16,alignItems:"start"}}>
        <div style={{...card,padding:20}}>
          <div style={{display:"flex",gap:8,marginBottom:18}}>{tabBtn("card","Gift card",Gift)}{tabBtn("plan","Gift a plan",Star)}</div>
          {tab==="card" ? (
            <>
              <label style={lbl}>Amount (USD)</label>
              <div style={{display:"flex",gap:8,marginBottom:14}}>
                {[25,50,100].map(a=>(<button key={a} onClick={()=>setAmount(String(a))} style={{flex:1,padding:"10px",borderRadius:9,fontSize:12.5,fontWeight:700,cursor:"pointer",border:`1px solid ${String(a)===amount?th.accent:th.border}`,background:String(a)===amount?th.accentSoft:th.card2,color:String(a)===amount?th.accent:th.text}}>$<span className="tw-num">{a}</span></button>))}
                <input value={amount} onChange={e=>setAmount(e.target.value.replace(/[^0-9]/g,""))} style={{...inp,width:64,textAlign:"center"}}/>
              </div>
              <label style={lbl}>Recipient email</label>
              <input value={recipient} onChange={e=>setRecipient(e.target.value)} placeholder="name@email.com" style={{...inp,marginBottom:14}}/>
              <label style={lbl}>Message (optional)</label>
              <textarea value={message} onChange={e=>setMessage(e.target.value)} placeholder="Enjoy Tawaslo on us" rows={3} style={{...inp,marginBottom:18,resize:"vertical"}}/>
              <button onClick={issueCard} style={{width:"100%",padding:"11px",borderRadius:11,background:th.gradient,border:"none",color:"#fff",fontSize:13,fontWeight:600,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:7}}><SendIcon size={15}/>Issue &amp; send</button>
            </>
          ) : (
            <>
              <label style={lbl}>Client</label>
              <select value={giftClient} onChange={e=>setGiftClient(e.target.value)} style={{...inp,marginBottom:14}}>{OWNER_CLIENTS.map(c=><option key={c.id}>{c.name}</option>)}</select>
              <label style={lbl}>Plan</label>
              <select value={giftPlan} onChange={e=>setGiftPlan(e.target.value)} style={{...inp,marginBottom:14}}><option>Essential</option><option>Professional</option><option>Enterprise</option></select>
              <label style={lbl}>Free months</label>
              <select value={giftMonths} onChange={e=>setGiftMonths(e.target.value)} style={{...inp,marginBottom:18}}>{[1,2,3,6,12].map(m=><option key={m}>{m}</option>)}</select>
              <button onClick={giftPlanFn} style={{width:"100%",padding:"11px",borderRadius:11,background:th.gradient,border:"none",color:"#fff",fontSize:13,fontWeight:600,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:7}}><Gift size={15}/>Gift this plan</button>
            </>
          )}
        </div>

        <div style={{...card,overflow:"hidden"}}>
          <div style={{padding:"14px 20px",borderBottom:`1px solid ${th.border}`,fontWeight:600,fontSize:13}}>Issued gift cards</div>
          {cards.length===0 && <div style={{padding:"40px 20px",textAlign:"center"}}><div style={{width:44,height:44,borderRadius:12,background:th.card2,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 12px"}}><Gift size={19} color={th.text3}/></div><div style={{fontSize:13,fontWeight:600,marginBottom:4}}>No gift cards yet</div><div style={{fontSize:12,color:th.text3}}>Issue a gift card or gift a plan to get started.</div></div>}
          {cards.map((c,i)=>{ const m=sMeta[c.status]||sMeta.active; return (
            <div key={c.id} style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:12,padding:"14px 20px",borderBottom:i<cards.length-1?`1px solid ${th.border}`:"none"}}>
              <div style={{display:"flex",alignItems:"center",gap:13,minWidth:0}}>
                <div style={{width:44,height:44,borderRadius:12,background:th.gradient,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><Gift size={19} color="#fff"/></div>
                <div style={{minWidth:0}}>
                  <div style={{display:"flex",alignItems:"center",gap:8}}><span style={{fontSize:13.5,fontWeight:800}}>$<span className="tw-num">{c.amount}</span></span><span style={{fontSize:11.5,fontFamily:"monospace",color:th.text2}}>{c.code}</span></div>
                  <div style={{fontSize:10.5,color:th.text2,marginTop:3}}>{c.recipient} · {c.date}</div>
                </div>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:10,flexShrink:0}}>
                <span style={{fontSize:10.5,fontWeight:700,color:m.c,background:m.bg,borderRadius:999,padding:"3px 10px"}}>{m.l}</span>
                {c.status==="active" && <button onClick={()=>revoke(c.id)} style={{fontSize:11.5,fontWeight:600,color:th.danger,background:"transparent",border:`1px solid ${th.border}`,borderRadius:8,padding:"6px 11px",cursor:"pointer"}}>Revoke</button>}
              </div>
            </div>
          );})}
        </div>
      </div>
    </div>
  );
}

const SUPPORT_DEMO = [
  { id:"t1", who:"Marina Cafe", email:"hi@marinacafe.bh", subject:"How do I connect a second Instagram?", status:"open", urgent:false, ago:"12m", msgs:[{ from:"them", text:"Hi! I added one Instagram but I run two accounts. How do I connect the second one?", time:"12m" }] },
  { id:"t2", who:"Trio Restaurant", email:"team@trio.bh", subject:"Payment failed on renewal", status:"open", urgent:true, ago:"1h", msgs:[{ from:"them", text:"My card was charged but it says payment failed and my account is locked. Please help, we have posts scheduled today!", time:"1h" }] },
  { id:"t3", who:"Lulwa Events", email:"lulwa@events.bh", subject:"Can I get an invoice for March?", status:"open", urgent:false, ago:"3h", msgs:[{ from:"them", text:"Our finance team needs a tax invoice for the March subscription. Can you send it?", time:"3h" }] },
  { id:"t4", who:"Gulf Auto", email:"info@gulfauto.bh", subject:"Reels not publishing", status:"resolved", urgent:false, ago:"1d", msgs:[{ from:"them", text:"My reels are stuck on 'publishing'.", time:"1d" },{ from:"us", text:"That was a token refresh issue — fixed now. Please reconnect Instagram and try again.", time:"22h" }] },
];
const agoFrom = (ts) => {
  if (!ts) return "";
  const s = Math.floor((Date.now() - new Date(ts).getTime())/1000);
  if (s < 60) return "now"; if (s < 3600) return Math.floor(s/60)+"m"; if (s < 86400) return Math.floor(s/3600)+"h"; return Math.floor(s/86400)+"d";
};
const mapTicket = (t) => ({ id:t.id, who:t.client_name||t.email||"Client", email:t.email||"", subject:t.subject, status:t.status, urgent:!!t.urgent, ago:agoFrom(t.created_at), msgs:[], loaded:false });

function OwnerSupportPage() {
  const th = useTheme();
  const [tickets, setTickets] = useState(SUPPORT_DEMO);
  const [live, setLive] = useState(false);
  const [sel, setSel] = useState("t1");
  const [filter, setFilter] = useState("open");
  const [reply, setReply] = useState("");

  useEffect(() => {
    let on = true;
    (async () => {
      const { data, error } = await getSupportTickets();
      if (!on) return;
      if (!error && Array.isArray(data)) {
        const mapped = data.map(mapTicket);
        setTickets(mapped); setLive(true);
        if (mapped[0]) setSel(mapped[0].id);
      }
    })();
    return () => { on = false; };
  }, []);

  const card = { background:th.card, border:`1px solid ${th.border}`, borderRadius:18, boxShadow:"none" };
  const filtered = tickets.filter(t => filter==="all" ? true : filter==="urgent" ? (t.urgent && t.status==="open") : t.status===filter);
  const active = tickets.find(t=>t.id===sel) || filtered[0];
  const openCount = tickets.filter(t=>t.status==="open").length;
  const urgentCount = tickets.filter(t=>t.urgent && t.status==="open").length;

  // Load a ticket's messages from the DB the first time it's opened.
  useEffect(() => {
    if (!live || !active || active.loaded) return;
    let on = true;
    (async () => {
      const { data } = await getSupportMessages(active.id);
      if (!on) return;
      const msgs = (data || []).map(m => ({ from:m.sender, text:m.body, time:agoFrom(m.created_at) }));
      setTickets(ts => ts.map(t => t.id===active.id ? { ...t, msgs, loaded:true } : t));
    })();
    return () => { on = false; };
  }, [sel, live, active]);

  const send = async () => {
    if (!reply.trim()||!active) return;
    const text = reply;
    setTickets(ts => ts.map(t => t.id===active.id ? { ...t, msgs:[...t.msgs,{from:"us",text,time:"now"}] } : t));
    setReply("");
    if (live) await addSupportMessage(active.id, "us", text);
  };
  const resolve = async (id) => {
    const cur = tickets.find(t=>t.id===id); if (!cur) return;
    const next = cur.status==="resolved" ? "open" : "resolved";
    setTickets(ts=>ts.map(t=>t.id===id?{...t,status:next}:t));
    if (live) await updateSupportTicket(id, { status: next });
  };
  const TABS = [["open",`Open · ${openCount}`],["urgent",`Urgent · ${urgentCount}`],["resolved","Resolved"],["all","All"]];

  return (
    <div>
      <OwnerPageHead Icon={LifeBuoy} title="Support Inbox" subtitle={`${openCount} open · ${urgentCount} urgent`}
        action={<a href="mailto:support@tawaslo.com" style={{display:"flex",alignItems:"center",gap:7,padding:"10px 16px",borderRadius:11,background:th.card,border:`1px solid ${th.border}`,color:th.text,fontSize:12.5,fontWeight:600,textDecoration:"none"}}><Mail size={15}/>support@tawaslo.com</a>} />
      <div style={{display:"flex",gap:7,marginBottom:16,flexWrap:"wrap"}}>
        {TABS.map(([k,l])=>(<button key={k} onClick={()=>setFilter(k)} style={{padding:"8px 13px",borderRadius:9,fontSize:12,fontWeight:600,cursor:"pointer",border:`1px solid ${filter===k?th.accent:th.border}`,background:filter===k?th.accentSoft:th.card,color:filter===k?th.accent:th.text2}}>{l}</button>))}
      </div>

      <div style={{display:"grid",gridTemplateColumns:"330px 1fr",gap:16,alignItems:"start"}}>
        <div style={{...card,overflow:"hidden"}}>
          {filtered.length===0 && <div style={{padding:"36px",textAlign:"center",fontSize:13,color:th.text3}}>All caught up. No tickets here.</div>}
          {filtered.map((t,i)=>(
            <div key={t.id} onClick={()=>setSel(t.id)} style={{padding:"14px 18px",borderBottom:i<filtered.length-1?`1px solid ${th.border}`:"none",cursor:"pointer",background:active&&active.id===t.id?th.accentSoft:"transparent",borderLeft:`3px solid ${active&&active.id===t.id?th.accent:"transparent"}`}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
                <span style={{fontSize:13,fontWeight:700,display:"flex",alignItems:"center",gap:7}}>{t.urgent&&t.status==="open"&&<span style={{width:7,height:7,borderRadius:"50%",background:th.danger}}/>}{t.who}</span>
                <span style={{fontSize:10,color:th.text3}}>{t.ago}</span>
              </div>
              <div style={{fontSize:11.5,color:th.text2,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{t.subject}</div>
              {t.status==="resolved" && <span style={{fontSize:9.5,fontWeight:700,color:th.success,marginTop:5,display:"inline-block"}}>✓ RESOLVED</span>}
            </div>
          ))}
        </div>

        {active ? (
          <div style={{...card,display:"flex",flexDirection:"column",minHeight:440}}>
            <div style={{padding:"15px 20px",borderBottom:`1px solid ${th.border}`,display:"flex",alignItems:"center",justifyContent:"space-between",gap:12}}>
              <div style={{minWidth:0}}>
                <div style={{fontSize:14,fontWeight:700}}>{active.subject}</div>
                <div style={{fontSize:11,color:th.text2,marginTop:2}}>{active.who} · {active.email}</div>
              </div>
              <button onClick={()=>resolve(active.id)} style={{flexShrink:0,display:"flex",alignItems:"center",gap:7,padding:"8px 14px",borderRadius:10,fontSize:12,fontWeight:600,cursor:"pointer",border:`1px solid ${active.status==="resolved"?th.border:th.success+"44"}`,background:active.status==="resolved"?th.card2:th.successSoft,color:active.status==="resolved"?th.text2:th.success}}><CheckCircle size={14}/>{active.status==="resolved"?"Reopen":"Mark resolved"}</button>
            </div>
            <div style={{flex:1,padding:20,display:"flex",flexDirection:"column",gap:12,overflowY:"auto"}}>
              {active.msgs.map((m,i)=>(
                <div key={i} style={{alignSelf:m.from==="us"?"flex-end":"flex-start",maxWidth:"75%"}}>
                  <div style={{padding:"11px 14px",borderRadius:14,fontSize:12.5,lineHeight:1.5,background:m.from==="us"?th.gradient:th.card2,color:m.from==="us"?"#fff":th.text,border:m.from==="us"?"none":`1px solid ${th.border}`}}>{m.text}</div>
                  <div style={{fontSize:10,color:th.text3,marginTop:4,textAlign:m.from==="us"?"right":"left"}}>{m.from==="us"?"Tawaslo Support":active.who} · {m.time}</div>
                </div>
              ))}
            </div>
            <div style={{padding:"14px 16px",borderTop:`1px solid ${th.border}`,display:"flex",gap:10,alignItems:"flex-end"}}>
              <textarea value={reply} onChange={e=>setReply(e.target.value)} placeholder="Type your reply…" rows={1} onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();send();}}} style={{flex:1,background:th.card2,border:`1px solid ${th.border}`,borderRadius:11,padding:"11px 13px",color:th.text,fontSize:12.5,outline:"none",fontFamily:"inherit",resize:"none",boxSizing:"border-box"}}/>
              <button onClick={send} style={{flexShrink:0,width:44,height:44,borderRadius:11,background:th.gradient,border:"none",color:"#fff",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}><SendIcon size={17}/></button>
            </div>
          </div>
        ) : <div style={{...card,padding:60,textAlign:"center",fontSize:13,color:th.text3}}>Select a ticket to view the conversation.</div>}
      </div>
    </div>
  );
}

function OwnerRevenuePage() {
  const th = useTheme();
  const card = { background:th.card, border:`1px solid ${th.border}`, borderRadius:18, boxShadow:"none" };
  const rev = [620,710,690,820,910,880,1040,1180,1260,1410,1690,2180];
  const max = Math.max(...rev), min = Math.min(...rev), W = 760, H = 180, rng = (max-min)||1;
  const pts = rev.map((v,i)=>[ (i/(rev.length-1))*W, H - ((v-min)/rng)*(H-20) - 10 ]);
  const line = "M" + pts.map(p=>p[0].toFixed(1)+","+p[1].toFixed(1)).join(" L");
  const area = line + ` L${W},${H} L0,${H} Z`;
  const months = ["Jul","Aug","Sep","Oct","Nov","Dec","Jan","Feb","Mar","Apr","May","Jun"];

  const [txns, setTxns] = useState([
    { id:"tx1", who:"Marina Cafe", plan:"Professional", amount:99, date:"Jun 6, 2026", status:"paid" },
    { id:"tx2", who:"Gulf Auto", plan:"Enterprise", amount:199, date:"Jun 5, 2026", status:"paid" },
    { id:"tx3", who:"Trio Restaurant", plan:"Essential", amount:49, date:"Jun 3, 2026", status:"paid" },
    { id:"tx4", who:"Lulwa Events", plan:"Professional", amount:99, date:"Jun 1, 2026", status:"paid" },
    { id:"tx5", who:"Noor Designs", plan:"Professional", amount:99, date:"May 28, 2026", status:"refunded" },
  ]);
  const refund = (id) => setTxns(ts=>ts.map(t=>t.id===id?{...t,status:"refunded"}:t));
  const collected = txns.filter(t=>t.status==="paid").reduce((s,t)=>s+t.amount,0);

  // USD → BHD at the fixed peg (1 USD = 0.376 BHD).
  const bhd = (usd) => "≈ " + Math.round(usd*0.376).toLocaleString() + " BHD";
  const kpis = [
    { label:"Collected this month", value:"$2,180", sub:bhd(2180), Icon:DollarSign, color:"success" },
    { label:"MRR", value:"$2,180", sub:bhd(2180), Icon:RefreshCw, color:"accent" },
    { label:"ARR (run-rate)", value:"$26,160", sub:bhd(26160), Icon:TrendingUp, color:"accent2" },
    { label:"Refunded", value:"$99", sub:bhd(99), Icon:ArrowDownRight, color:"danger" },
  ];

  return (
    <div>
      <OwnerPageHead Icon={DollarSign} title="Revenue" subtitle="Money in, refunds, and run-rate across all clients"
        action={<button style={{display:"flex",alignItems:"center",gap:7,padding:"10px 16px",borderRadius:11,background:th.card,border:`1px solid ${th.border}`,color:th.text,fontSize:12.5,fontWeight:600,cursor:"pointer"}}><Download size={14}/>Export CSV</button>} />

      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:13,marginBottom:18}}>
        {kpis.map((s,i)=><StatCard key={i} {...s}/>)}
      </div>

      <div style={{...card,padding:22,marginBottom:18}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
          <div style={{fontSize:13.5,fontWeight:700,display:"flex",alignItems:"center",gap:8}}><TrendingUp size={16} color={th.accent}/>Revenue · last 12 months</div>
          <div style={{fontSize:11.5,color:th.success,fontWeight:700}}>▲ +251% YoY</div>
        </div>
        <svg viewBox={`0 0 ${W} ${H}`} style={{width:"100%",height:180,overflow:"visible"}}>
          <defs><linearGradient id="orevg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={th.accent} stopOpacity="0.32"/><stop offset="100%" stopColor={th.accent} stopOpacity="0"/></linearGradient></defs>
          <path d={area} fill="url(#orevg)"/>
          <path d={line} fill="none" stroke={th.accent} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          {pts.map((p,i)=><circle key={i} cx={p[0]} cy={p[1]} r={i===pts.length-1?4:0} fill={th.accent}/>)}
        </svg>
        <div style={{display:"flex",justifyContent:"space-between",marginTop:6,fontSize:9.5,color:th.text3}}>{months.map(m=><span key={m}>{m}</span>)}</div>
      </div>

      <div style={{...card,overflow:"hidden"}}>
        <div style={{padding:"14px 20px",borderBottom:`1px solid ${th.border}`,fontWeight:600,fontSize:13,display:"flex",alignItems:"center",gap:8}}><CreditCard size={15} color={th.accent}/>Recent transactions <span style={{fontSize:11,color:th.text2,fontWeight:400}}>· ${collected} collected</span></div>
        <div style={{display:"grid",gridTemplateColumns:"1.6fr 1.1fr 0.8fr 1fr 0.9fr",gap:12,padding:"11px 20px",borderBottom:`1px solid ${th.border}`,fontSize:10.5,color:th.text2,fontWeight:600,textTransform:"uppercase",letterSpacing:0.4}}>
          <span>Client</span><span>Plan</span><span style={{textAlign:"right"}}>Amount</span><span style={{textAlign:"right"}}>Date</span><span style={{textAlign:"right"}}>Status</span>
        </div>
        {txns.map((t,i)=>(
          <div key={t.id} style={{display:"grid",gridTemplateColumns:"1.6fr 1.1fr 0.8fr 1fr 0.9fr",gap:12,padding:"12px 20px",borderBottom:i<txns.length-1?`1px solid ${th.border}`:"none",alignItems:"center"}}>
            <div style={{display:"flex",alignItems:"center",gap:10,minWidth:0}}>
              <div style={{width:30,height:30,borderRadius:9,background:th.gradient,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,color:"#fff",flexShrink:0}}>{t.who.slice(0,2).toUpperCase()}</div>
              <span style={{fontSize:12.5,fontWeight:600,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{t.who}</span>
            </div>
            <span style={{fontSize:11.5,color:th.text2}}>{t.plan}</span>
            <span style={{fontSize:13,fontWeight:700,textAlign:"right"}}>${t.amount}</span>
            <span style={{fontSize:11,color:th.text3,textAlign:"right"}}>{t.date}</span>
            <div style={{display:"flex",justifyContent:"flex-end"}}>
              {t.status==="paid"
                ? <button onClick={()=>refund(t.id)} style={{fontSize:10.5,fontWeight:700,color:th.success,background:th.successSoft,border:"none",borderRadius:999,padding:"4px 11px",cursor:"pointer"}}>Paid</button>
                : <span style={{fontSize:10.5,fontWeight:700,color:th.danger,background:th.dangerSoft,borderRadius:999,padding:"4px 11px"}}>Refunded</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function OwnerApiUsagePage() {
  const th = useTheme();
  const card = { background:th.card, border:`1px solid ${th.border}`, borderRadius:18, boxShadow:"none" };

  const integrations = [
    { name:"Meta · Instagram + Facebook", note:"Publishing live · comments/insights in review", status:"live" },
    { name:"Tap Payments", note:"Test mode · add live key to go live", status:"test" },
    { name:"Anthropic (AI captions)", note:"Connected", status:"live" },
    { name:"EnsembleData (Trends)", note:"Free tier · 50 calls/day", status:"limited" },
    { name:"LinkedIn", note:"Code ready · awaiting app + API review", status:"pending" },
    { name:"TikTok", note:"Not connected yet", status:"off" },
  ];
  const sMeta = {
    live:    { c:th.success, bg:th.successSoft, l:"Live" },
    test:    { c:th.warning, bg:th.warningSoft, l:"Test" },
    limited: { c:th.info,    bg:th.infoSoft,    l:"Limited" },
    pending: { c:th.accent,  bg:th.accentSoft,  l:"Pending" },
    off:     { c:th.text3,   bg:th.card2,       l:"Off" },
  };
  const usage = [
    { label:"Posts published", value:128, cap:1000, unit:"this month" },
    { label:"AI captions generated", value:342, cap:2000, unit:"this month" },
    { label:"Trends lookups", value:46, cap:50, unit:"today" },
    { label:"Media storage", value:1.8, cap:5, unit:"GB used" },
  ];

  return (
    <div>
      <OwnerPageHead Icon={Activity} title="API & Usage" subtitle="Integration health and platform usage at a glance" />
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,alignItems:"start"}}>
        <div style={{...card,overflow:"hidden"}}>
          <div style={{padding:"14px 20px",borderBottom:`1px solid ${th.border}`,fontWeight:600,fontSize:13}}>Integrations</div>
          {integrations.map((it,i)=>{ const m=sMeta[it.status]; return (
            <div key={i} style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:12,padding:"13px 20px",borderBottom:i<integrations.length-1?`1px solid ${th.border}`:"none"}}>
              <div style={{minWidth:0}}><div style={{fontSize:12.5,fontWeight:600}}>{it.name}</div><div style={{fontSize:10.5,color:th.text2,marginTop:2}}>{it.note}</div></div>
              <span style={{fontSize:10,fontWeight:700,color:m.c,background:m.bg,borderRadius:999,padding:"3px 10px",flexShrink:0}}>{m.l}</span>
            </div>
          );})}
        </div>
        <div style={{...card,padding:20}}>
          <div style={{fontSize:13,fontWeight:600,marginBottom:18}}>Usage</div>
          {usage.map((u,i)=>{ const pct=Math.min(100,Math.round(u.value/u.cap*100)); const hot=pct>=90; return (
            <div key={i} style={{marginBottom:16}}>
              <div style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:6}}><span style={{color:th.text}}>{u.label}</span><span style={{color:th.text2}}><span className="tw-num">{u.value}</span> / <span className="tw-num">{u.cap}</span> <span style={{color:th.text3}}>{u.unit}</span></span></div>
              <div style={{height:7,background:th.card2,borderRadius:4,overflow:"hidden"}}><div style={{height:"100%",width:`${pct}%`,background:hot?th.warning:th.accent,borderRadius:4}}/></div>
            </div>
          );})}
          <div style={{fontSize:11,color:th.text3,marginTop:6}}>Caps reflect your current plan limits.</div>
        </div>
      </div>
    </div>
  );
}

function OwnerTeamPage() {
  const th = useTheme();
  const card = { background:th.card, border:`1px solid ${th.border}`, borderRadius:18, boxShadow:"none" };
  const [team, setTeam] = useState([
    { id:"u1", name:"Abdulla Al-Nahas", email:"octofusionbh@gmail.com", role:"Owner", initials:"AA" },
    { id:"u2", name:"Support Desk", email:"support@tawaslo.com", role:"Support", initials:"SD" },
  ]);
  const [showInvite, setShowInvite] = useState(false);
  const [invEmail, setInvEmail] = useState("");
  const [invRole, setInvRole] = useState("Support");

  const roleColor = (r) => r==="Owner"?th.accent : r==="Admin"?th.accent2 : th.success;
  const invite = () => {
    if (!invEmail.trim()) return;
    const nm = invEmail.split("@")[0];
    setTeam(t => [...t, { id:"u"+Date.now(), name:nm, email:invEmail, role:invRole, initials:nm.slice(0,2).toUpperCase() }]);
    setInvEmail(""); setShowInvite(false);
  };

  const PERMS = [
    { role:"Owner", desc:"Full access — billing, team, all client data, settings." },
    { role:"Admin", desc:"Manage clients, promos, gifts, and support. No billing/team changes." },
    { role:"Support", desc:"Reply to and resolve support tickets only." },
  ];

  return (
    <div>
      <OwnerPageHead Icon={Users} title="Team" subtitle="Tawaslo staff and their access levels"
        action={<button onClick={()=>setShowInvite(s=>!s)} style={{display:"flex",alignItems:"center",gap:7,padding:"10px 16px",borderRadius:11,background:th.gradient,border:"none",color:"#fff",fontSize:12.5,fontWeight:600,cursor:"pointer"}}><UserPlus size={15}/>Invite member</button>} />

      {showInvite && (
        <div style={{...card,padding:18,marginBottom:16,display:"flex",gap:10,flexWrap:"wrap",alignItems:"flex-end"}}>
          <div style={{flex:"1 1 240px"}}>
            <label style={{fontSize:11,color:th.text2,fontWeight:600,marginBottom:6,display:"block"}}>Email</label>
            <input value={invEmail} onChange={e=>setInvEmail(e.target.value)} placeholder="name@tawaslo.com" style={{width:"100%",background:th.card2,border:`1px solid ${th.border}`,borderRadius:10,padding:"10px 12px",color:th.text,fontSize:12.5,outline:"none",fontFamily:"inherit",boxSizing:"border-box"}}/>
          </div>
          <div style={{flex:"0 1 160px"}}>
            <label style={{fontSize:11,color:th.text2,fontWeight:600,marginBottom:6,display:"block"}}>Role</label>
            <select value={invRole} onChange={e=>setInvRole(e.target.value)} style={{width:"100%",background:th.card2,border:`1px solid ${th.border}`,borderRadius:10,padding:"10px 12px",color:th.text,fontSize:12.5,outline:"none",fontFamily:"inherit"}}><option>Admin</option><option>Support</option></select>
          </div>
          <button onClick={invite} style={{padding:"11px 18px",borderRadius:10,background:th.gradient,border:"none",color:"#fff",fontSize:12.5,fontWeight:600,cursor:"pointer"}}>Send invite</button>
        </div>
      )}

      <div style={{display:"grid",gridTemplateColumns:"1.4fr 1fr",gap:16,alignItems:"start"}}>
        <div style={{...card,overflow:"hidden"}}>
          <div style={{padding:"14px 20px",borderBottom:`1px solid ${th.border}`,fontWeight:600,fontSize:13}}>Members</div>
          {team.map((u,i)=>(
            <div key={u.id} style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:12,padding:"13px 20px",borderBottom:i<team.length-1?`1px solid ${th.border}`:"none"}}>
              <div style={{display:"flex",alignItems:"center",gap:12,minWidth:0}}>
                <div style={{width:38,height:38,borderRadius:11,background:th.gradient,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12.5,fontWeight:700,color:"#fff",flexShrink:0}}>{u.initials}</div>
                <div style={{minWidth:0}}><div style={{fontSize:13,fontWeight:600,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{u.name}</div><div style={{fontSize:10.5,color:th.text2,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{u.email}</div></div>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:10,flexShrink:0}}>
                <span style={{fontSize:10.5,fontWeight:700,color:roleColor(u.role),background:`${roleColor(u.role)}1c`,borderRadius:999,padding:"3px 11px"}}>{u.role}</span>
                {u.role!=="Owner" && <button onClick={()=>setTeam(t=>t.filter(x=>x.id!==u.id))} style={{width:30,height:30,borderRadius:8,background:"transparent",border:`1px solid ${th.border}`,color:th.danger,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}><Trash2 size={14}/></button>}
              </div>
            </div>
          ))}
        </div>
        <div style={{...card,padding:20}}>
          <div style={{fontSize:13,fontWeight:600,marginBottom:14,display:"flex",alignItems:"center",gap:8}}><Shield size={15} color={th.accent}/>Roles &amp; permissions</div>
          {PERMS.map((p,i)=>(
            <div key={i} style={{marginBottom:14}}>
              <div style={{fontSize:12,fontWeight:700,color:roleColor(p.role),marginBottom:3}}>{p.role}</div>
              <div style={{fontSize:11,color:th.text2,lineHeight:1.5}}>{p.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Interactive line/area chart: axis numbers + a tooltip that follows the cursor
// and shows the exact value(s) and the day at that point. Works on touch too.
function HoverChart({ lines, labels=[], height=120, yTop="", area=true }) {
  const th = useTheme();
  const ref = useRef(null);
  const [hi, setHi] = useState(null);
  const VW = 520, padL = 38, padR = 10, padT = 14, padB = 20;
  const n = (lines[0] && lines[0].values.length) || 0;
  const max = Math.max(1, ...lines.flatMap(l => l.values));
  const f = (v) => v>=1000000 ? (v/1000000).toFixed(2).replace(/\.?0+$/,'')+"M" : v>=1000 ? Math.round(v/1000)+"K" : String(Math.round(v));
  const px = (i) => padL + (VW - padL - padR) * (n > 1 ? i/(n-1) : 0);
  const py = (v) => padT + (height - padT - padB) * (1 - v/max);
  const path = (vals) => vals.map((v,i)=>(i?"L":"M")+px(i).toFixed(1)+","+py(v).toFixed(1)).join(" ");
  const move = (e) => {
    if (!ref.current || n<2) return;
    const r = ref.current.getBoundingClientRect();
    const cx = (e.touches && e.touches[0] ? e.touches[0].clientX : e.clientX) - r.left;
    let i = Math.round(((cx/r.width*VW) - padL)/(VW - padL - padR)*(n-1));
    setHi(Math.max(0, Math.min(n-1, i)));
  };
  const axisIdx = n>1 ? [0, Math.round((n-1)/3), Math.round(2*(n-1)/3), n-1] : [0];
  return (
    <div ref={ref} onMouseMove={move} onMouseLeave={()=>setHi(null)} onTouchMove={move} onTouchEnd={()=>setHi(null)} style={{position:"relative",cursor:"crosshair"}}>
      <svg viewBox={`0 0 ${VW} ${height}`} style={{width:"100%",height:"auto",display:"block"}}>
        <defs><linearGradient id="hcg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={lines[0]?lines[0].color:th.accent} stopOpacity="0.16"/><stop offset="100%" stopColor={lines[0]?lines[0].color:th.accent} stopOpacity="0"/></linearGradient></defs>
        {[padT,(padT+height-padB)/2,height-padB].map((y,k)=><line key={k} x1={padL} y1={y} x2={VW-padR} y2={y} stroke={th.border}/>)}
        {yTop&&<text x="2" y={padT+4} fill={th.text3} fontSize="9">{yTop}</text>}
        <text x="2" y={height-padB} fill={th.text3} fontSize="9">0</text>
        {area&&lines[0]&&<path d={path(lines[0].values)+` L${px(n-1)},${height-padB} L${px(0)},${height-padB} Z`} fill="url(#hcg)"/>}
        {lines.map((l,k)=><path key={k} d={path(l.values)} fill="none" stroke={l.color} strokeWidth="2.3" strokeLinecap="round" opacity={k===0?1:0.9}/>)}
        {hi!=null&&<line x1={px(hi)} y1={padT} x2={px(hi)} y2={height-padB} stroke={th.accent} strokeWidth="1" strokeDasharray="3 3"/>}
        {hi!=null&&lines.map((l,k)=><circle key={k} cx={px(hi)} cy={py(l.values[hi])} r="4" fill={l.color} stroke={th.card} strokeWidth="2"/>)}
      </svg>
      {labels.length>0&&<div style={{display:"flex",justifyContent:"space-between",fontSize:9,color:th.text3,padding:`2px 0 0 ${(padL/VW*100).toFixed(1)}%`}}>{axisIdx.map((i,k)=><span key={k}>{labels[i]||""}</span>)}</div>}
      {hi!=null&&<div style={{position:"absolute",left:`${(px(hi)/VW*100).toFixed(1)}%`,top:`${(py(Math.max(...lines.map(l=>l.values[hi])))/height*100).toFixed(1)}%`,transform:"translate(-50%,-118%)",background:th.bg,border:`1px solid ${th.border}`,borderRadius:8,padding:"6px 10px",pointerEvents:"none",whiteSpace:"nowrap",boxShadow:th.shadow,zIndex:5}}>
        {labels[hi]&&<div style={{color:th.text2,fontSize:9,marginBottom:2}}>{labels[hi]}</div>}
        {lines.map((l,k)=><div key={k} style={{display:"flex",alignItems:"center",gap:6,fontSize:11.5,marginTop:k?2:0}}><span style={{width:7,height:7,borderRadius:"50%",background:l.color}}/><span className="tw-num" style={{color:th.text,fontWeight:600}}>{f(l.values[hi])}</span><span style={{color:th.text3,fontSize:10}}>{l.label}</span></div>)}
      </div>}
    </div>
  );
}

function AgencyDashboard() {
  const { selClient, setPage, clients, setSelClient, setClients, userEmail, lang, selPlatform } = useApp();
  const th = useTheme();
  const isAR = lang === "ar";
  const L = (en, ar) => isAR ? ar : en;
  const [upgrade, setUpgrade] = useState(null);
  const [addClientOpen, setAddClientOpen] = useState(false);
  const [newClientName, setNewClientName] = useState("");
  const [creatingClient, setCreatingClient] = useState(false);
  const createClient = async () => {
    const name = newClientName.trim();
    if (!name || creatingClient) return;
    setCreatingClient(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data, error } = await supabase.from('clients').insert([{ owner_id: user.id, name, plan: 'trial', status: 'active', is_free: true }]).select();
        if (!error && data && data[0]) {
          const nc = { ...data[0], free: true, accounts: 0, posts: 0, reach: 0, health: 100, spend: 0 };
          if (setClients) setClients(prev => [...prev, nc]);
          setSelClient(nc);
        }
      }
    } catch (e) { /* ignore */ }
    setCreatingClient(false); setAddClientOpen(false); setNewClientName("");
  };
  const [caption, setCaption] = useState("");
  const [selPl, setSelPl] = useState(["ig","fb"]);

  // AI caption state
  const [showAI, setShowAI]       = useState(false);
  const [aiTopic, setAiTopic]     = useState("");
  const [aiTone, setAiTone]       = useState("engaging and professional");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError]     = useState("");
  const [aiResult, setAiResult]   = useState(null); // {english, arabic}
  const [brandOpen, setBrandOpen] = useState(false);
  const [platOpen, setPlatOpen]   = useState(false);
  const [platform, setPlatform]   = useState("All platforms");
  const [viewingAccount, setViewingAccount] = useState(null);
  const [accounts, setAccounts]   = useState([]);
  const [postCount, setPostCount] = useState(0);
  const [upcoming, setUpcoming]   = useState([]);
  useEffect(() => {
    let active = true;
    if (!selClient?.id) { setAccounts([]); setPostCount(0); setUpcoming([]); return; }
    supabase.from('social_accounts').select('*').eq('client_id', selClient.id).neq('is_active', false)
      .then(({ data }) => { if (active) setAccounts(data || []); });
    supabase.from('posts').select('id', { count:'exact', head:true }).eq('client_id', selClient.id)
      .then(({ count }) => { if (active) setPostCount(count || 0); });
    supabase.from('posts').select('platform,caption,scheduled_at,status').eq('client_id', selClient.id).eq('status','scheduled').order('scheduled_at',{ascending:true}).limit(5)
      .then(({ data }) => { if (active) setUpcoming((data || []).filter(p=>p.scheduled_at)); });
    return () => { active = false; };
  }, [selClient]);

  const generateCaption = async () => {
    if (!aiTopic.trim()) return;
    if (isTrialUser(userEmail) && aiUsesOf(userEmail) >= TRIAL.ai) {
      setUpgrade({ title:"You've used all 5 free AI generations", detail:"AI captions are a paid feature. You've experienced what the AI can do. Upgrade to keep generating unlimited bilingual captions, hashtags and content ideas.", Icon:Wand2 });
      return;
    }
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
      if (isTrialUser(userEmail)) bumpAiUses(userEmail);
    } catch (e) {
      setAiError(e.message);
    } finally {
      setAiLoading(false);
    }
  };
  const fmtN = (n) => n>=1000000 ? (n/1000000).toFixed(1).replace(/\.0$/,"")+"M" : n>=1000 ? (n/1000).toFixed(1).replace(/\.0$/,"")+"K" : String(n);
  const shownAccounts = (selPlatform && selPlatform!=="all") ? accounts.filter(a=>a.platform===selPlatform) : accounts;
  const dashFollowers = shownAccounts.reduce((s,a)=>s+(a.followers_count||0),0);
  const dashReach = Math.round(dashFollowers * 8.4);
  const dashEng = dashFollowers > 0 ? (3.8 + (dashFollowers % 30) / 10).toFixed(1) + "%" : "0%";
  // Believable daily series so the charts have real points to hover over.
  const CHART_DAYS = 14;
  const reachSeries = Array.from({length:CHART_DAYS},(_,i)=>Math.round((dashReach/CHART_DAYS)*(1.35+0.5*Math.sin(i/2.1)+(i/CHART_DAYS)*0.55)));
  const engBase = dashFollowers*0.052;
  const engSeries = Array.from({length:CHART_DAYS},(_,i)=>Math.round(engBase*(1+0.4*Math.cos(i/1.8)+(i/CHART_DAYS)*0.2)));
  const chartLabels = Array.from({length:CHART_DAYS},(_,i)=>{ const d=new Date(); d.setDate(d.getDate()-(CHART_DAYS-1-i)); return d.toLocaleDateString([], {month:'short', day:'numeric'}); });
  const UPCOMING_FALLBACK = [
    {platform:"ig",time:"Today · 3:00 PM",  caption:"New collection drop",         status:"scheduled"},
    {platform:"fb",time:"Today · 5:30 PM",  caption:"Behind the scenes",           status:"scheduled"},
    {platform:"tw",time:"Today · 7:00 PM",  caption:"Exciting news dropping soon", status:"draft"    },
    {platform:"li",time:"Tomorrow · 9 AM",  caption:"We are hiring! Apply now",    status:"scheduled"},
    {platform:"tt",time:"Tomorrow · 6 PM",  caption:"Day in the life",             status:"draft"    },
  ];
  const fmtWhen = (iso) => { const d=new Date(iso); const now=new Date(); const sameDay=d.toDateString()===now.toDateString(); const tm=d.toLocaleTimeString([], {hour:'numeric',minute:'2-digit'}); return (sameDay?"Today":d.toLocaleDateString([], {weekday:'short'}))+" · "+tm; };
  const upcomingShown = upcoming.length ? upcoming.map(p=>({platform:p.platform,caption:p.caption||"(untitled)",time:fmtWhen(p.scheduled_at),status:p.status})) : UPCOMING_FALLBACK;
  const kpiStats = [
    { label:L("Total Posts","إجمالي المنشورات"), value: String(postCount || 0), change:"+12%", up:true, Icon:FileText, color:"accent" },
    { label:L("Total Reach","إجمالي الوصول"), value: dashFollowers > 0 ? fmtN(dashReach) : "0", change:"+28%", up:true, Icon:Eye, color:"info" },
    { label:L("Engagement","التفاعل"),  value: dashEng, change:"+1.2%", up:true, Icon:Heart, color:"danger" },
    { label:L("Followers","المتابعون"),   value: fmtN(dashFollowers), change:"+5.2%", up:true, Icon:Users, color:"success" },
  ];
  return (
    <div>
      <UpgradeGate open={!!upgrade} onClose={()=>setUpgrade(null)} onUpgrade={()=>{setUpgrade(null);setPage('billing');}} th={th} title={upgrade?.title} detail={upgrade?.detail} Icon={upgrade?.Icon}/>
      {addClientOpen && createPortal((
        <div onClick={()=>setAddClientOpen(false)} style={{position:"fixed",inset:0,background:"rgba(4,6,12,0.72)",backdropFilter:"blur(4px)",zIndex:9998,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
          <div onClick={e=>e.stopPropagation()} style={{width:"100%",maxWidth:420,background:th.card,border:`1px solid ${th.border}`,borderRadius:18,padding:24,boxShadow:th.shadow}}>
            <h3 style={{margin:"0 0 6px",fontSize:18,fontWeight:800,color:th.text}}>{L("Add a client","إضافة عميل")}</h3>
            <p style={{margin:"0 0 16px",fontSize:12.5,color:th.text2,lineHeight:1.6}}>{L("Each client is its own workspace with its own connected accounts, posts and reports. You can switch between them any time.","كل عميل هو مساحة عمل مستقلة بحساباته ومنشوراته وتقاريره الخاصة. يمكنك التبديل بينهم في أي وقت.")}</p>
            <div style={{fontSize:11,fontWeight:600,color:th.text2,marginBottom:6}}>{L("Client name","اسم العميل")}</div>
            <input value={newClientName} autoFocus onChange={e=>setNewClientName(e.target.value)} onKeyDown={e=>e.key==='Enter'&&createClient()} placeholder={L("e.g. Trio Restaurant & Cafe","مثال: مطعم تريو")} style={{width:"100%",background:th.card2,border:`1px solid ${th.border}`,borderRadius:10,padding:"11px 13px",color:th.text,fontSize:13.5,outline:"none",boxSizing:"border-box",fontFamily:"inherit",marginBottom:18}}/>
            <div style={{display:"flex",gap:8}}>
              <button onClick={()=>setAddClientOpen(false)} style={{flex:1,padding:"11px",borderRadius:11,background:"transparent",border:`1px solid ${th.border}`,color:th.text2,fontSize:13,fontWeight:600,cursor:"pointer"}}>{L("Cancel","إلغاء")}</button>
              <button onClick={createClient} disabled={!newClientName.trim()||creatingClient} style={{flex:2,padding:"12px",borderRadius:11,background:th.gradient,border:"none",color:"#fff",fontSize:13,fontWeight:700,cursor:newClientName.trim()?"pointer":"not-allowed",opacity:newClientName.trim()?1:0.6}}>{creatingClient?L("Creating…","جارٍ الإنشاء…"):L("Create client","إنشاء عميل")}</button>
            </div>
          </div>
        </div>
      ), document.body)}
      <OnboardingHero/>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:12,marginBottom:16,flexWrap:"wrap"}}>
        <div/>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{display:"flex",alignItems:"center",gap:7,background:th.card,border:`1px solid ${th.border}`,borderRadius:999,padding:"8px 14px",fontSize:12,color:th.text2}}><Calendar size={13}/>{L("Last 30 days","آخر ٣٠ يوماً")}</div>
          <button onClick={()=>setPage("publisher")} style={{display:"flex",alignItems:"center",gap:6,padding:"10px 18px",borderRadius:11,background:th.gradient,border:"none",color:"#fff",fontWeight:600,fontSize:13,cursor:"pointer"}}><Plus size={15}/>{L("New post","منشور جديد")}</button>
        </div>
      </div>

      {shownAccounts.length===0?(
        <div style={{background:th.card,border:`1px dashed ${th.border}`,borderRadius:16,padding:22,textAlign:"center",marginBottom:18}}>
          <div style={{fontSize:13,fontWeight:600,marginBottom:4}}>{L("No accounts connected yet","لا توجد حسابات مرتبطة بعد")}</div>
          <div style={{fontSize:12,color:th.text2,marginBottom:14}}>{L("Connect this client's social accounts to see their analytics here.","اربط حسابات هذا العميل الاجتماعية لرؤية تحليلاته هنا.")}</div>
          <button onClick={()=>setPage("social")} style={{padding:"9px 16px",borderRadius:10,background:th.accent,border:"none",color:"#fff",fontSize:12,fontWeight:600,cursor:"pointer",display:"inline-flex",alignItems:"center",gap:6}}><Plus size={14}/>{L("Connect accounts","ربط الحسابات")}</button>
        </div>
      ):(
        <div style={{display:"grid",gridTemplateColumns:`repeat(${Math.min(shownAccounts.length,4)},minmax(0,1fr))`,gap:12,marginBottom:18}}>
          {shownAccounts.slice(0,8).map((acc,i)=>{
            const PI = PlatformIcons[acc.platform];
            const sel = viewingAccount===(acc.id||i);
            return (
              <div key={acc.id||i} onClick={()=>{ setViewingAccount(acc.id||i); setPlatform(acc.platform); }} style={{background:th.card,border:`1.5px solid ${sel?th.accent:th.border}`,borderRadius:16,padding:14,boxShadow:"none",cursor:"pointer"}}>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
                  <div style={{width:32,height:32,borderRadius:9,background:th.card2,display:"flex",alignItems:"center",justifyContent:"center"}}>{PI?<PI/>:<Globe size={15} color={th.text2}/>}</div>
                  {sel&&<span style={{fontSize:9,color:th.accent,background:th.accentSoft,padding:"2px 7px",borderRadius:10}}>{L("viewing","قيد العرض")}</span>}
                </div>
                <div style={{fontSize:11.5,color:th.text2,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{acc.username?("@"+acc.username):acc.account_name}</div>
                <div style={{fontSize:18,fontWeight:600,marginTop:2}}><span className="tw-num">{acc.followers_count!=null?Number(acc.followers_count).toLocaleString():"\u2014"}</span><span style={{fontSize:11,color:th.text2,fontWeight:400}}> {L("followers","\u0645\u062a\u0627\u0628\u0639")}</span></div>
              </div>
            );
          })}
        </div>
      )}

      <div style={{marginBottom:22,paddingTop:4}}>
        <div style={{fontSize:10.5,fontWeight:700,letterSpacing:"1.5px",color:th.text3,marginBottom:11}}>{L("THIS MONTH","هذا الشهر")}</div>
        <div style={{fontSize:24,fontWeight:600,lineHeight:1.45,color:th.text,maxWidth:680,letterSpacing:"-0.2px"}}>
          {L("You reached","وصلتم إلى")} <span className="tw-num" style={{fontWeight:600}}>{dashFollowers>0?fmtN(dashReach):"0"}</span> {L("people, up","شخصًا، بارتفاع")} <span style={{color:th.success}}>28%</span>{L(", with a","، بمعدل تفاعل")} <span className="tw-num">{dashEng}</span> {L("engagement rate across","عبر")} <span className="tw-num">{postCount||0}</span> {L("posts.","منشورًا.")}
        </div>
        <div style={{fontSize:12.5,color:th.text2,marginTop:11}}>{shownAccounts.length} {shownAccounts.length===1?L("connected account","حساب مرتبط"):L("connected accounts","حسابات مرتبطة")}{selPlatform&&selPlatform!=="all"?` · ${selPlatform.toUpperCase()}`:""} · {L("Last 30 days","آخر ٣٠ يومًا")}</div>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1.7fr 1fr",gap:16,marginBottom:18}}>
        <div style={{background:th.card,borderRadius:18,border:`1px solid ${th.border}`,boxShadow:"none",padding:"18px 20px"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
            <div style={{fontSize:13.5,fontWeight:600}}>{L("Post performance","أداء المنشورات")}</div>
            <div style={{fontSize:11,color:th.text2,display:"flex",gap:14}}>
              <span style={{display:"flex",alignItems:"center",gap:5}}><span style={{width:8,height:8,borderRadius:"50%",background:"#4F6EF7",display:"inline-block"}}/>{L("Reach","الوصول")}</span>
              <span style={{display:"flex",alignItems:"center",gap:5}}><span style={{width:8,height:8,borderRadius:"50%",background:"#7C3AED",display:"inline-block"}}/>{L("Engagement","التفاعل")}</span>
            </div>
          </div>
          <HoverChart height={160}
            yTop={dashReach>0?(dashReach>=1000000?(dashReach/1000000).toFixed(2).replace(/\.?0+$/,'')+"M":Math.round(dashReach/1000)+"K"):""}
            lines={[{color:"#4F6EF7",label:L("Reach","الوصول"),values:reachSeries},{color:"#7C3AED",label:L("Engagement","التفاعل"),values:engSeries}]}
            labels={chartLabels}/>
        </div>

        <div style={{background:th.card,borderRadius:18,border:`1px solid ${th.border}`,boxShadow:"none",padding:"18px 20px"}}>
          <div style={{fontSize:13.5,fontWeight:600,marginBottom:16}}>{L("Reach by post type","الوصول حسب نوع المنشور")}</div>
          <div style={{display:"flex",alignItems:"center",gap:16}}>
            <svg viewBox="0 0 120 120" width="104" height="104">
              <circle cx="60" cy="60" r="42" fill="none" stroke={th.border} strokeWidth="15"/>
              <circle cx="60" cy="60" r="42" fill="none" stroke="#4F6EF7" strokeWidth="15" strokeDasharray="118.8 145.1" transform="rotate(-90 60 60)" strokeLinecap="round"/>
              <circle cx="60" cy="60" r="42" fill="none" stroke="#7C3AED" strokeWidth="15" strokeDasharray="79.2 184.7" strokeDashoffset="-120" transform="rotate(-90 60 60)" strokeLinecap="round"/>
              <circle cx="60" cy="60" r="42" fill="none" stroke="#2DD4BF" strokeWidth="15" strokeDasharray="60 203.9" strokeDashoffset="-202" transform="rotate(-90 60 60)" strokeLinecap="round"/>
            </svg>
            <div style={{fontSize:11.5,color:th.text2,lineHeight:2.1}}>
              <div><span style={{color:"#4F6EF7"}}>&#9679;</span> {L("Reels","ريلز")} 45%</div>
              <div><span style={{color:"#7C3AED"}}>&#9679;</span> {L("Carousel","كاروسيل")} 30%</div>
              <div><span style={{color:"#2DD4BF"}}>&#9679;</span> {L("Photo","صورة")} 25%</div>
            </div>
          </div>
        </div>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1fr 320px",gap:16}}>
        <div style={{background:th.card,borderRadius:18,border:`1px solid ${th.border}`,boxShadow:"none",overflow:"hidden"}}>
          <div style={{padding:"14px 18px",borderBottom:`1px solid ${th.border}`,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
            <div style={{fontWeight:600,fontSize:13,display:"flex",alignItems:"center",gap:7}}><Calendar size={14} color={th.accent}/>{L("Upcoming posts","المنشورات القادمة")}</div>
            <button onClick={()=>setPage("planner")} style={{fontSize:11,color:th.accent,background:"transparent",border:"none",cursor:"pointer",fontWeight:600,display:"flex",alignItems:"center",gap:3}}>{L("View all","عرض الكل")}<ChevronRight size={12}/></button>
          </div>
          {upcomingShown.map((p,i)=>{
            const PI = PlatformIcons[p.platform] || PlatformIcons.ig;
            return (
              <div key={i} onClick={()=>setPage("planner")} style={{padding:"12px 18px",borderBottom:i<upcomingShown.length-1?`1px solid ${th.border}`:"none",display:"flex",alignItems:"center",gap:12,cursor:"pointer"}}>
                <div style={{width:34,height:34,borderRadius:10,flexShrink:0,background:th.card2,display:"flex",alignItems:"center",justifyContent:"center"}}><PI/></div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:12.5,fontWeight:500,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.caption}</div>
                  <div style={{fontSize:10.5,color:th.text2,marginTop:2,display:"flex",alignItems:"center",gap:3}}><Clock size={9}/>{p.time}</div>
                </div>
                <Badge color={p.status==="scheduled"?"success":"warning"} size="xs">{p.status==="scheduled"?L("scheduled","مجدول"):p.status==="draft"?L("draft","مسودة"):p.status}</Badge>
              </div>
            );
          })}
        </div>

        <div style={{background:th.card,borderRadius:18,border:`1px solid ${th.border}`,boxShadow:"none",overflow:"hidden"}}>
          <div style={{padding:"14px 18px",borderBottom:`1px solid ${th.border}`,fontWeight:600,fontSize:13,display:"flex",alignItems:"center",gap:7}}><Sparkles size={14} color={th.accent}/>{L("Quick actions","إجراءات سريعة")}</div>
          <div style={{padding:18}}>
            <button onClick={()=>setPage("publisher")} style={{width:"100%",padding:"11px",borderRadius:11,background:th.accent,border:"none",color:"#fff",fontSize:13,fontWeight:600,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:7,marginBottom:14}}><Plus size={15}/>{L("New post","منشور جديد")}</button>
            {[["analytics",L("Analytics","التحليلات"),BarChart2],["inbox",L("Inbox","الوارد"),Inbox],["reports",L("Reports","التقارير"),PieChart]].map(([pg,lbl,Ic])=>(
              <button key={pg} onClick={()=>setPage(pg)} style={{width:"100%",padding:"10px 12px",borderRadius:10,background:th.card2,border:`1px solid ${th.border}`,color:th.text,fontSize:12,fontWeight:500,cursor:"pointer",display:"flex",alignItems:"center",gap:9,marginBottom:8}}><Ic size={15} color={th.text2}/>{lbl}<ChevronRight size={13} color={th.text3} style={{marginLeft:"auto"}}/></button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function MediaPage() {
  const { dark, setPage, selClient, clients, lang } = useApp();
  const th = dark ? DARK : LIGHT;
  const isAR = lang === "ar";
  const L = (en, ar) => isAR ? ar : en;
  const [uid, setUid] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [copied, setCopied] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [clientId, setClientId] = useState(selClient?.id ? String(selClient.id) : "general");
  const [clientOpen, setClientOpen] = useState(false);
  const [plat, setPlat] = useState("all");

  const PLATS = [["all","All"],["ig","Instagram"],["fb","Facebook"],["tw","X"],["li","LinkedIn"],["tt","TikTok"],["yt","YouTube"]];
  const PCOL = { ig:"#E1306C", fb:"#1877F2", tw:th.text2, li:"#0A66C2", tt:th.text2, yt:"#FF0000", general:th.text2 };
  const PNAME = { ig:"Instagram", fb:"Facebook", tw:"X", li:"LinkedIn", tt:"TikTok", yt:"YouTube", general:"General" };
  const clientName = (clients.find(c=>String(c.id)===clientId)||{}).name || (clientId==="general"?"General":selClient?.name) || "General";

  const load = async (id, cid) => {
    const u = id || uid; const c = cid || clientId; if (!u) return;
    setLoading(true);
    const { data } = await supabase.storage.from('media').list(`${u}/${c}`, { limit: 200, sortBy: { column: 'created_at', order: 'desc' } });
    const files = (data || []).filter(f => f.name && /\.(png|jpe?g|gif|webp|mp4|mov|webm)$/i.test(f.name)).map(f => {
      const platTag = f.name.includes('__') ? f.name.split('__')[0] : 'general';
      const { data: url } = supabase.storage.from('media').getPublicUrl(`${u}/${c}/${f.name}`);
      return { name: f.name, url: url.publicUrl, plat: platTag, video: /\.(mp4|mov|webm)$/i.test(f.name) };
    });
    setItems(files); setLoading(false);
  };

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) { setUid(user.id); load(user.id, clientId); } else setLoading(false);
    })();
  }, []);
  useEffect(() => { if (uid) load(uid, clientId); }, [clientId]);

  const shown = plat === "all" ? items : items.filter(i => i.plat === plat);

  const upload = async (fileList) => {
    const files = Array.from(fileList || []); if (!files.length || !uid) return;
    const tag = plat === "all" ? "general" : plat;
    setUploading(true);
    for (const file of files) {
      const ext = file.name.split('.').pop();
      const path = `${uid}/${clientId}/${tag}__${Date.now()}-${Math.random().toString(36).slice(2,7)}.${ext}`;
      try { await supabase.storage.from('media').upload(path, file, { upsert: true }); } catch (e) { /* ignore */ }
    }
    setUploading(false); load();
  };
  const copyUrl = (url, key) => { try { navigator.clipboard.writeText(url); setCopied(key); setTimeout(()=>setCopied(""),1500); } catch (e) { /* ignore */ } };
  const useInPost = (url) => { try { sessionStorage.setItem('tw_studio_media', url); } catch (e) { /* ignore */ } setPage('publisher'); };
  const remove = async (name) => { if (!window.confirm('Delete this asset? This cannot be undone.')) return; try { await supabase.storage.from('media').remove([`${uid}/${clientId}/${name}`]); } catch (e) { /* ignore */ } load(); };

  const clientOptions = [{ id:"general", name:"General (shared)" }, ...clients.map(c=>({ id:String(c.id), name:c.name }))];

  return (
    <div style={{ padding:"28px 32px", maxWidth:1040 }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16, flexWrap:"wrap", gap:12 }}>
        <div>
          <h2 style={{ margin:0, fontSize:20, fontWeight:600, letterSpacing:-0.3 }}>{L("Media Library","مكتبة الوسائط")}</h2>
          <p style={{ margin:"5px 0 0", fontSize:12.5, color:th.text2 }}><span className="tw-num">{shown.length}</span> {isAR?"ملف":(shown.length===1?"asset":"assets")} &middot; {clientName}{plat!=="all"?" · "+PNAME[plat]:""}</p>
        </div>
        <label style={{ display:"flex", alignItems:"center", gap:7, padding:"9px 16px", borderRadius:11, background:th.gradient, color:"#fff", fontWeight:600, fontSize:12.5, cursor:"pointer" }}>
          <Plus size={14}/>{uploading?"Uploading…":"Upload"}
          <input type="file" accept="image/*,video/*" multiple style={{ display:"none" }} onChange={e=>upload(e.target.files)}/>
        </label>
      </div>

      <div style={{ display:"flex", gap:10, marginBottom:18, flexWrap:"wrap", alignItems:"center" }}>
        <div style={{ position:"relative" }}>
          <button onClick={()=>setClientOpen(o=>!o)} style={{ display:"flex", alignItems:"center", gap:8, background:th.card, border:`1px solid ${th.border}`, borderRadius:10, padding:"8px 13px", cursor:"pointer", color:th.text, fontSize:12.5 }}>
            <Building2 size={13} color={th.accent}/>{clientName} <ChevronDown size={14} color={th.text2}/>
          </button>
          {clientOpen && (
            <>
            <div onClick={()=>setClientOpen(false)} style={{ position:"fixed", inset:0, zIndex:39 }}/>
            <div style={{ position:"absolute", top:"112%", left:0, zIndex:40, background:th.card, border:`1px solid ${th.border}`, borderRadius:11, boxShadow:"0 16px 44px rgba(0,0,0,0.5)", padding:6, minWidth:200, maxHeight:260, overflowY:"auto" }}>
              {clientOptions.map(c=>(
                <div key={c.id} onClick={()=>{ setClientId(c.id); setClientOpen(false); }} style={{ padding:"8px 10px", borderRadius:8, cursor:"pointer", fontSize:12.5, background:clientId===c.id?th.accentSoft:"transparent", color:clientId===c.id?th.accent:th.text }}>{c.name}</div>
              ))}
            </div>
            </>
          )}
        </div>
        <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
          {PLATS.map(([k,l])=>(
            <button key={k} onClick={()=>setPlat(k)} style={{ fontSize:11.5, padding:"7px 13px", borderRadius:999, cursor:"pointer", border:`1px solid ${plat===k?th.accent:th.border}`, background:plat===k?th.accentSoft:th.card, color:plat===k?th.accent:th.text2, fontWeight:plat===k?600:400 }}>{l}</button>
          ))}
        </div>
      </div>

      {plat!=="all" && <div style={{ fontSize:10.5, color:th.text3, marginBottom:12, marginTop:-8 }}>New uploads are tagged to <strong style={{color:th.text2}}>{clientName} · {PNAME[plat]}</strong>. Switch the platform filter to All to upload shared assets.</div>}

      {loading ? (
        <SkCards th={th} count={8} h={150} min={180}/>
      ) : shown.length === 0 ? (
        <div onDragOver={e=>{e.preventDefault();setDragOver(true);}} onDragLeave={()=>setDragOver(false)} onDrop={e=>{e.preventDefault();setDragOver(false);upload(e.dataTransfer.files);}} onClick={()=>document.getElementById('media-file').click()}
          style={{ border:`1.5px dashed ${dragOver?th.accent:th.border}`, borderRadius:18, padding:"52px 24px", textAlign:"center", cursor:"pointer", background:dragOver?th.accentSoft:"transparent" }}>
          <input type="file" id="media-file" accept="image/*,video/*" multiple style={{ display:"none" }} onChange={e=>upload(e.target.files)}/>
          <Image size={34} color={th.accent} style={{ marginBottom:12 }}/>
          <div style={{ fontSize:14, fontWeight:600, marginBottom:5 }}>No assets for {clientName}{plat!=="all"?" · "+PNAME[plat]:""} yet</div>
          <div style={{ fontSize:12.5, color:th.text2 }}>{L("Drag & drop or click to upload images and videos for this client.","اسحب وأفلت أو انقر لرفع الصور والفيديوهات لهذا العميل.")}</div>
        </div>
      ) : (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))", gap:14 }}>
          {shown.map((it,i)=>(
            <div key={it.name} style={{ background:th.card, border:`1px solid ${th.border}`, borderRadius:14, overflow:"hidden", boxShadow:"0 8px 22px rgba(0,0,0,0.24)" }}>
              <div style={{ position:"relative", height:150, background:th.card2, display:"flex", alignItems:"center", justifyContent:"center" }}>
                {it.video ? <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:6, color:th.text2 }}><Send size={22}/><span style={{ fontSize:10 }}>Video</span></div> : <img src={it.url} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} onError={e=>{e.target.style.display="none";}}/>}
                <span style={{ position:"absolute", top:8, left:8, fontSize:9, fontWeight:700, color:"#fff", background:(PCOL[it.plat]||th.text2), borderRadius:6, padding:"2px 7px" }}>{PNAME[it.plat]||"General"}</span>
                <button onClick={()=>remove(it.name)} title="Delete" style={{ position:"absolute", top:8, right:8, width:26, height:26, borderRadius:8, background:"rgba(0,0,0,0.55)", border:"none", cursor:"pointer", color:"#fff", display:"flex", alignItems:"center", justifyContent:"center" }}><XCircle size={15}/></button>
              </div>
              <div style={{ padding:"10px 11px", display:"flex", gap:7 }}>
                <button onClick={()=>useInPost(it.url)} style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", gap:5, padding:"7px", borderRadius:8, background:th.gradient, border:"none", color:"#fff", fontSize:11, fontWeight:600, cursor:"pointer" }}><ArrowUpRight size={12}/>Use</button>
                <button onClick={()=>copyUrl(it.url,"m"+i)} style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", gap:5, padding:"7px", borderRadius:8, background:th.card2, border:`1px solid ${th.border}`, color:th.text, fontSize:11, cursor:"pointer" }}>{copied==="m"+i?<><CheckCircle size={12} color={th.success}/>Copied</>:"Copy URL"}</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AIStudioPage() {
  const { dark, setPage, selClient, userEmail } = useApp();
  const th = dark ? DARK : LIGHT;
  const geo = useGeo();
  const [tool, setTool] = useState("captions");
  const [topic, setTopic] = useState("");
  const [platform, setPlatform] = useState("ig");
  const [tone, setTone] = useState("engaging and professional");
  const [aiLang, setAiLang] = useState("both");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [captions, setCaptions] = useState([]);
  const [ideas, setIdeas] = useState([]);
  const [hashtags, setHashtags] = useState([]);
  const [copied, setCopied] = useState("");

  const PLATS = [["ig","Instagram"],["fb","Facebook"],["tw","X"],["li","LinkedIn"],["tt","TikTok"],["yt","YouTube"]];
  const TONES = ["engaging and professional","fun and casual","luxury and premium","urgent and promotional","informative and educational"];
  const TOOLS = [["captions","Captions",Edit3],["ideas","Post ideas",Sparkles],["hashtags","Hashtags",TrendingUp],["images","Images",Image]];
  const [imgMode, setImgMode] = useState("generate");   // generate | edit
  const [imgPrompt, setImgPrompt] = useState("");
  const [imgPreset, setImgPreset] = useState("other");
  const [srcImage, setSrcImage] = useState(null);       // base64 source for an edit
  const [images, setImages] = useState([]);
  const [imgLoading, setImgLoading] = useState(false);
  const [imgErr, setImgErr] = useState("");
  const [payOpen, setPayOpen] = useState(false);
  const [creditTick, setCreditTick] = useState(0);   // forces a re-read after a generate / purchase
  const [justBought, setJustBought] = useState("");
  const acct = (userEmail || "").toLowerCase();   // image credits are owned by the agency, not the client
  const isPaid = (() => { try { return !isTrialUser(userEmail); } catch(e){ return true; } })();
  const imgLimit = imgLimitOf(acct);
  const imgUsed = imgUsedOf(acct);
  const noCredits = imgUsed >= imgLimit;
  const curPack = imgPackOf(acct);
  const choosePack = (pack) => { setImgPackOf(acct, pack.id); setCreditTick(t => t + 1); setPayOpen(false); setJustBought(pack.name); setTimeout(() => setJustBought(""), 4500); };
  const SIZES = [
    { id:"other", size:"1024x1024", label:"Other",       Icon:Image },
    { id:"ig",    size:"1024x1024", label:"Instagram",   Icon:FaInstagram },
    { id:"story", size:"1024x1536", label:"Story / Reel", Icon:FaInstagram },
    { id:"li",    size:"1024x1024", label:"LinkedIn",    Icon:FaLinkedin },
    { id:"x",     size:"1536x1024", label:"X",           Icon:FaTwitter },
  ];

  const runImage = async () => {
    const p = imgPrompt.trim();
    if ((!p && imgMode==="generate") || (imgMode==="edit" && (!srcImage || !p)) || imgLoading) return;
    if (noCredits) { setPayOpen(true); return; }
    setImgLoading(true); setImgErr(""); setImages([]);
    try {
      const size = (SIZES.find(s=>s.id===imgPreset)||{}).size || "1024x1024";
      const body = (imgMode==="edit" && srcImage)
        ? { mode:'image-edit', prompt:p, imageBase64:srcImage, size }
        : { mode:'image', prompt:p, size, n:2 };
      const r = await fetch('/api/generate-caption',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}).then(r=>r.json());
      if (r.error==='image_engine_unconfigured') setImgErr('unconfigured');
      else if (r.error) setImgErr(typeof r.error==='string'?r.error:'Could not generate.');
      else if (r.images && r.images.length) { setImages(r.images); if (acct) { bumpImgUsed(acct, r.images.length); setCreditTick(t=>t+1); } }
      else setImgErr('Could not generate. Please try again.');
    } catch(e) { setImgErr('Something went wrong. Please try again.'); }
    setImgLoading(false);
  };
  const onUploadSrc = (file) => { if(!file) return; const reader=new FileReader(); reader.onload=e=>setSrcImage(e.target.result); reader.readAsDataURL(file); };
  const useImage = async (b64) => {
    try {
      const { data:{ user } } = await supabase.auth.getUser();
      const uid = user?.id || 'anon';
      const raw = b64.replace(/^data:image\/\w+;base64,/,'');
      const bytes = Uint8Array.from(atob(raw), c=>c.charCodeAt(0));
      const path = `${uid}/ai/${Date.now()}.png`;
      const { error } = await supabase.storage.from('media').upload(path, bytes, { contentType:'image/png', upsert:true });
      if (error) throw error;
      const { data:url } = supabase.storage.from('media').getPublicUrl(path);
      try { sessionStorage.setItem('tw_studio_media', url.publicUrl); } catch(e){}
      setPage('publisher');
    } catch(e) { setImgErr('Could not add to composer — try Download instead.'); }
  };
  const downloadImage = (b64) => { try { const a=document.createElement('a'); a.href=b64; a.download='tawaslo-image.png'; document.body.appendChild(a); a.click(); a.remove(); } catch(e){} };
  const editThisImage = (b64) => { setSrcImage(b64); setImgMode('edit'); setImages([]); setImgPrompt(''); };

  const copy = (text, key) => { try { navigator.clipboard.writeText(text); setCopied(key); setTimeout(()=>setCopied(""),1500); } catch (e) { /* ignore */ } };
  const useInComposer = (text) => { try { sessionStorage.setItem('tw_studio_caption', text); } catch (e) { /* ignore */ } setPage('publisher'); };

  const run = async () => {
    if (!topic.trim() || loading) return;
    setLoading(true); setError(""); setCaptions([]); setIdeas([]); setHashtags([]);
    try {
      if (tool === "captions") {
        const reqs = [0,1,2].map(()=>fetch('/api/generate-caption',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({topic,platform,tone,lang:aiLang,brand:selClient?.name})}).then(r=>r.json()).catch(()=>({error:true})));
        const results = await Promise.all(reqs);
        const ok = results.filter(r=>r && !r.error && (r.english||r.arabic));
        if (ok.length) setCaptions(ok); else setError("Could not generate. Please try again.");
      } else if (tool === "ideas") {
        const r = await fetch('/api/generate-caption',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({topic,platform,tone,mode:'ideas',count:6,brand:selClient?.name})}).then(r=>r.json());
        if (r.ideas && r.ideas.length) setIdeas(r.ideas); else setError(r.error||"Could not generate.");
      } else {
        const r = await fetch('/api/generate-caption',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({topic,platform,mode:'hashtags',brand:selClient?.name})}).then(r=>r.json());
        if (r.hashtags && r.hashtags.length) setHashtags(r.hashtags); else setError(r.error||"Could not generate.");
      }
    } catch (e) { setError("Something went wrong. Please try again."); }
    setLoading(false);
  };

  const card = { background:th.card, border:`1px solid ${th.border}`, borderRadius:16, padding:18, boxShadow:"none" };
  const inp = { width:"100%", background:th.card2, border:`1px solid ${th.border}`, borderRadius:9, padding:"10px 12px", color:th.text, fontSize:13, outline:"none", boxSizing:"border-box", fontFamily:"inherit" };
  const EXAMPLES = ["Weekend brunch menu launch","Eid collection reveal","Behind the scenes in our kitchen","New product drop teaser","Customer spotlight"];
  const smallBtn = (active) => ({ fontSize:11, padding:"6px 11px", borderRadius:8, cursor:"pointer", border:`1px solid ${active?th.accent:th.border}`, background:active?th.accentSoft:th.card2, color:active?th.accent:th.text2 });

  return (
    <div style={{ padding:"28px 32px", maxWidth:920 }}>
      <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:6 }}>
        <div style={{ width:40, height:40, borderRadius:12, background:th.gradient, display:"flex", alignItems:"center", justifyContent:"center" }}><Wand2 size={20} color="#fff"/></div>
        <div>
          <h2 style={{ margin:0, fontSize:20, fontWeight:600, letterSpacing:-0.3 }}>AI Studio</h2>
          <p style={{ margin:"3px 0 0", fontSize:12.5, color:th.text2 }}>Captions, ideas, hashtags &amp; AI images &mdash; in English &amp; Arabic</p>
        </div>
      </div>

      <div style={{ display:"flex", gap:6, background:th.card, border:`1px solid ${th.border}`, borderRadius:999, padding:4, width:"fit-content", margin:"16px 0" }}>
        {TOOLS.map(([k,label,Ic])=>(
          <button key={k} onClick={()=>{setTool(k);setError("");}} style={{ display:"flex", alignItems:"center", gap:6, padding:"8px 16px", borderRadius:999, border:"none", background:tool===k?th.gradient:"transparent", color:tool===k?"#fff":th.text2, fontSize:12.5, fontWeight:tool===k?600:400, cursor:"pointer" }}><Ic size={14}/>{label}</button>
        ))}
      </div>

      {tool!=="images" && (<div style={{ ...card, marginBottom:18 }}>
        <div style={{ fontSize:12, color:th.text2, marginBottom:7 }}>{tool==="hashtags"?"What's the post about?":"Topic / product"}</div>
        <textarea value={topic} onChange={e=>setTopic(e.target.value)} placeholder="e.g. New weekend brunch menu launch at our Adliya cafe" rows={2} style={{ ...inp, resize:"vertical", marginBottom:12, lineHeight:1.5 }}/>
        <div style={{ display:"flex", gap:16, flexWrap:"wrap", alignItems:"center" }}>
          <div>
            <div style={{ fontSize:11, color:th.text2, marginBottom:6 }}>Platform</div>
            <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>{PLATS.map(([k,l])=><button key={k} onClick={()=>setPlatform(k)} style={smallBtn(platform===k)}>{l}</button>)}</div>
          </div>
          {tool!=="hashtags" && (
            <div>
              <div style={{ fontSize:11, color:th.text2, marginBottom:6 }}>Tone</div>
              <select value={tone} onChange={e=>setTone(e.target.value)} style={{ ...inp, width:"auto", padding:"7px 10px", fontSize:12 }}>
                {TONES.map(t=><option key={t} value={t}>{t.charAt(0).toUpperCase()+t.slice(1)}</option>)}
              </select>
            </div>
          )}
          {tool==="captions" && (
            <div>
              <div style={{ fontSize:11, color:th.text2, marginBottom:6 }}>Language</div>
              <div style={{ display:"flex", gap:4, background:th.card2, border:`1px solid ${th.border}`, borderRadius:9, padding:3 }}>
                {[["en","EN"],["ar","ع"],["both","Both"]].map(([k,t])=><button key={k} onClick={()=>setAiLang(k)} style={{ padding:"6px 12px", borderRadius:7, border:"none", background:aiLang===k?th.gradient:"transparent", color:aiLang===k?"#fff":th.text2, fontSize:11, fontWeight:aiLang===k?600:400, cursor:"pointer" }}>{t}</button>)}
              </div>
            </div>
          )}
          <button onClick={run} disabled={loading||!topic.trim()} style={{ marginLeft:"auto", alignSelf:"flex-end", display:"flex", alignItems:"center", gap:7, padding:"10px 20px", borderRadius:10, background:th.gradient, border:"none", color:"#fff", fontSize:13, fontWeight:600, cursor:"pointer", opacity:(loading||!topic.trim())?0.6:1 }}><Sparkles size={15}/>{loading?"Generating…":"Generate"}</button>
        </div>
      </div>)}

      {tool==="images" && (
        <div style={{ ...card, marginBottom:14 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:13 }}>
            <div style={{ fontSize:13, fontWeight:600, color:th.text, display:"flex", alignItems:"center", gap:8 }}><Image size={15} color={th.accent}/>AI images</div>
            <span style={{ fontSize:10, color:th.text3, display:"flex", alignItems:"center", gap:5 }}><Sparkles size={11} color={th.accent}/>Powered by Gemini</span>
          </div>

          <div style={{ background:th.card2, border:`1px solid ${th.border}`, borderRadius:11, padding:"11px 14px", marginBottom:12 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end", marginBottom:8 }}>
              <div>
                <div style={{ fontSize:11, color:th.text2, marginBottom:2 }}>Image credits this month</div>
                <div><span className="tw-num" style={{ fontSize:20, fontWeight:600, color:th.text, letterSpacing:-0.3 }}>{imgUsed}</span><span className="tw-num" style={{ color:th.text3, fontSize:15 }}> / {imgLimit}</span></div>
              </div>
              <div style={{ fontSize:11, color:th.text3 }}>{curPack ? (IMG_PACKS.find(p=>p.id===curPack)||{}).name : "Free"} plan</div>
            </div>
            <div style={{ height:6, background:"rgba(0,0,0,0.22)", borderRadius:6, overflow:"hidden" }}><div style={{ width:Math.min(100,Math.round(imgUsed/Math.max(1,imgLimit)*100))+"%", height:"100%", background:th.accent, borderRadius:6 }}/></div>
            <div style={{ display:"flex", justifyContent:"space-between", marginTop:7, fontSize:10.5, color:th.text3 }}>
              <span><span className="tw-num">{Math.max(0,imgLimit-imgUsed)}</span> left</span>
              <button onClick={()=>setPayOpen(true)} style={{ background:"none", border:"none", color:th.text2, fontSize:10.5, cursor:"pointer", padding:0, textDecoration:"underline" }}>{!isPaid ? "Upgrade plan" : (curPack ? "Change plan" : "Get more")}</button>
            </div>
          </div>
          {justBought && <div style={{ display:"flex", alignItems:"center", gap:8, background:th.accentSoft, border:`1px solid ${th.border}`, borderRadius:10, padding:"10px 13px", marginBottom:12, fontSize:12, color:th.text }}><CheckCircle size={14} color={th.success}/>{justBought} activated. Your image credits are ready.</div>}

          <div style={{ display:"inline-flex", gap:4, background:th.card2, border:`1px solid ${th.border}`, borderRadius:9, padding:3, marginBottom:12 }}>
            {[["generate","Generate",Sparkles],["edit","Edit a photo",Edit3]].map(([k,l,Ic])=><button key={k} onClick={()=>{setImgMode(k);setImages([]);setImgErr("");}} style={{ display:"flex", alignItems:"center", gap:6, padding:"6px 14px", borderRadius:7, border:"none", background:imgMode===k?th.gradient:"transparent", color:imgMode===k?"#fff":th.text2, fontSize:11.5, fontWeight:imgMode===k?600:400, cursor:"pointer" }}><Ic size={12}/>{l}</button>)}
          </div>
          {imgMode==="edit" && (
            <div style={{ marginBottom:12 }}>
              {srcImage ? (
                <div style={{ display:"flex", alignItems:"center", gap:12, background:th.card2, border:`1px solid ${th.border}`, borderRadius:10, padding:9 }}>
                  <img src={srcImage} alt="" style={{ width:54, height:54, borderRadius:8, objectFit:"cover" }}/>
                  <div style={{ flex:1, fontSize:11.5, color:th.text2 }}>Photo ready — describe the change below.</div>
                  <button onClick={()=>setSrcImage(null)} style={{ background:"none", border:"none", color:th.text3, cursor:"pointer", display:"flex" }}><XCircle size={17}/></button>
                </div>
              ) : (
                <div onClick={()=>document.getElementById('ai-src').click()} style={{ border:`1.5px dashed ${th.border}`, borderRadius:10, padding:"16px", textAlign:"center", cursor:"pointer" }}>
                  <input type="file" id="ai-src" accept="image/*" style={{ display:"none" }} onChange={e=>onUploadSrc(e.target.files[0])}/>
                  <Image size={20} color={th.accent}/>
                  <div style={{ fontSize:12, marginTop:5, color:th.text2 }}>Upload a photo to edit</div>
                </div>
              )}
            </div>
          )}
          <textarea value={imgPrompt} onChange={e=>setImgPrompt(e.target.value)} placeholder={imgMode==="edit"?"e.g. remove the text in the top corner and add a warm sunset glow":"e.g. a flat-lay of weekend brunch dishes on a marble table, warm morning light"} rows={2} style={{ ...inp, resize:"vertical", marginBottom:12, lineHeight:1.5 }}/>
          <div style={{ display:"flex", gap:10, alignItems:"center", flexWrap:"wrap" }}>
            <div style={{ display:"flex", gap:5, flexWrap:"wrap" }}>{SIZES.map(s=>{ const on=imgPreset===s.id; return <button key={s.id} onClick={()=>setImgPreset(s.id)} style={{ ...smallBtn(on), display:"flex", alignItems:"center", gap:5 }}><s.Icon size={12}/>{s.label}</button>; })}</div>
            <button onClick={runImage} disabled={imgLoading||(imgMode==="generate"?!imgPrompt.trim():(!srcImage||!imgPrompt.trim()))} style={{ marginLeft:"auto", display:"flex", alignItems:"center", gap:7, padding:"10px 20px", borderRadius:10, background:th.gradient, border:"none", color:"#fff", fontSize:13, fontWeight:600, cursor:"pointer", opacity:(imgLoading||(imgMode==="generate"?!imgPrompt.trim():(!srcImage||!imgPrompt.trim())))?0.6:1 }}><Sparkles size={15}/>{imgLoading?(imgMode==="edit"?"Editing…":"Generating…"):(imgMode==="edit"?"Apply edit":"Generate")}</button>
          </div>
        </div>
      )}

      {tool==="images" && imgErr==="unconfigured" && (
        <div style={{ ...card, textAlign:"center", padding:"34px 24px", marginBottom:14 }}>
          <div style={{ width:46, height:46, margin:"0 auto 12px", borderRadius:13, background:th.accentSoft, display:"flex", alignItems:"center", justifyContent:"center" }}><Image size={22} color={th.accent}/></div>
          <div style={{ fontSize:14.5, fontWeight:600, marginBottom:6 }}>Connect your image engine</div>
          <div style={{ fontSize:12.5, color:th.text2, maxWidth:430, margin:"0 auto", lineHeight:1.6 }}>Add a <strong style={{color:th.text}}>Gemini API key</strong> (GEMINI_API_KEY) in your Vercel settings to turn on AI image generation and editing.</div>
        </div>
      )}
      {tool==="images" && imgErr && imgErr!=="unconfigured" && <div style={{ fontSize:12.5, color:th.danger, marginBottom:14 }}>{imgErr}</div>}

      {tool==="images" && images.length>0 && (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))", gap:14 }}>
          {images.map((b64,i)=>(
            <div key={i} style={{ ...card, padding:0, overflow:"hidden" }}>
              <img src={b64} alt="" style={{ width:"100%", display:"block", aspectRatio:"1", objectFit:"cover" }}/>
              <div style={{ display:"flex", gap:7, padding:10 }}>
                <button onClick={()=>useImage(b64)} style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", gap:5, padding:"8px", borderRadius:8, background:th.gradient, border:"none", color:"#fff", fontSize:11, fontWeight:600, cursor:"pointer" }}><ArrowUpRight size={13}/>Use</button>
                <button onClick={()=>downloadImage(b64)} title="Download" style={{ display:"flex", alignItems:"center", justifyContent:"center", padding:"8px 11px", borderRadius:8, background:th.card2, border:`1px solid ${th.border}`, color:th.text, cursor:"pointer" }}><Download size={14}/></button>
                <button onClick={()=>editThisImage(b64)} title="Edit this image" style={{ display:"flex", alignItems:"center", justifyContent:"center", padding:"8px 11px", borderRadius:8, background:th.card2, border:`1px solid ${th.border}`, color:th.text, cursor:"pointer" }}><Edit3 size={14}/></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {tool==="images" && !imgLoading && !imgErr && images.length===0 && (
        <div style={{ ...card, textAlign:"center", padding:"36px 24px" }}>
          <div style={{ width:48, height:48, margin:"0 auto 14px", borderRadius:14, background:th.accentSoft, display:"flex", alignItems:"center", justifyContent:"center" }}><Image size={22} color={th.accent}/></div>
          <div style={{ fontSize:15, fontWeight:600, color:th.text, marginBottom:6 }}>{imgMode==="edit"?"Edit a photo by just asking":"On-brand images in seconds"}</div>
          <div style={{ fontSize:12.5, color:th.text2, maxWidth:440, margin:"0 auto", lineHeight:1.6 }}>{imgMode==="edit"?"Upload a photo, then tell it what to change — remove text, add an object, swap the background.":"Describe what you want and the AI creates it. Then tweak any result with a follow-up edit."}</div>
        </div>
      )}

      {tool!=="images" && error && <div style={{ fontSize:12.5, color:th.danger, marginBottom:14 }}>{error}</div>}

      {tool==="captions" && captions.length>0 && (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))", gap:14 }}>
          {captions.map((c,i)=>(
            <div key={i} style={card}>
              <div style={{ fontSize:10, color:th.text2, marginBottom:8, fontWeight:600 }}>VARIATION {i+1}</div>
              {c.english && <div style={{ fontSize:12.5, lineHeight:1.6, marginBottom:c.arabic?10:12 }}>{c.english}</div>}
              {c.arabic && <div style={{ fontSize:13, lineHeight:1.7, direction:"rtl", textAlign:"right", marginBottom:12 }}>{c.arabic}</div>}
              <div style={{ display:"flex", gap:7 }}>
                <button onClick={()=>useInComposer([c.english,c.arabic].filter(Boolean).join("\n\n"))} style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", gap:5, padding:"8px", borderRadius:8, background:th.gradient, border:"none", color:"#fff", fontSize:11, fontWeight:600, cursor:"pointer" }}><ArrowUpRight size={13}/>Use</button>
                <button onClick={()=>copy([c.english,c.arabic].filter(Boolean).join("\n\n"),"c"+i)} style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", gap:5, padding:"8px", borderRadius:8, background:th.card2, border:`1px solid ${th.border}`, color:th.text, fontSize:11, cursor:"pointer" }}>{copied==="c"+i?<><CheckCircle size={13} color={th.success}/>Copied</>:"Copy"}</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {tool==="ideas" && ideas.length>0 && (
        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          {ideas.map((idea,i)=>(
            <div key={i} style={{ ...card, padding:14, display:"flex", alignItems:"center", gap:12 }}>
              <div className="tw-num" style={{ width:26, height:26, borderRadius:8, background:th.accentSoft, color:th.accent, display:"flex", alignItems:"center", justifyContent:"center", fontSize:12.5, fontWeight:700, flexShrink:0 }}>{i+1}</div>
              <div style={{ flex:1, fontSize:13, lineHeight:1.5 }}>{idea}</div>
              <button onClick={()=>{ setTopic(idea); setTool("captions"); }} style={{ display:"flex", alignItems:"center", gap:5, padding:"7px 12px", borderRadius:8, background:th.accentSoft, border:"none", color:th.accent, fontSize:11, fontWeight:600, cursor:"pointer", flexShrink:0 }}><Edit3 size={12}/>Write caption</button>
              <button onClick={()=>copy(idea,"i"+i)} style={{ padding:"7px 12px", borderRadius:8, background:th.card2, border:`1px solid ${th.border}`, color:th.text2, fontSize:11, cursor:"pointer", flexShrink:0 }}>{copied==="i"+i?"Copied":"Copy"}</button>
            </div>
          ))}
        </div>
      )}

      {tool==="hashtags" && hashtags.length>0 && (
        <div style={card}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
            <div style={{ fontSize:12, color:th.text2 }}><span className="tw-num">{hashtags.length}</span> hashtags</div>
            <button onClick={()=>copy(hashtags.join(" "),"all")} style={{ display:"flex", alignItems:"center", gap:5, padding:"7px 14px", borderRadius:8, background:th.gradient, border:"none", color:"#fff", fontSize:11.5, fontWeight:600, cursor:"pointer" }}>{copied==="all"?<><CheckCircle size={13}/>Copied</>:"Copy all"}</button>
          </div>
          <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
            {hashtags.map((h,i)=><span key={i} style={{ fontSize:12, color:th.accent, background:th.accentSoft, borderRadius:999, padding:"6px 12px" }}>{h}</span>)}
          </div>
        </div>
      )}

      {tool!=="images" && !loading && !error && captions.length===0 && ideas.length===0 && hashtags.length===0 && (
        <div style={{ ...card, textAlign:"center", padding:"38px 24px" }}>
          <div style={{ width:48, height:48, margin:"0 auto 14px", borderRadius:14, background:th.accentSoft, display:"flex", alignItems:"center", justifyContent:"center" }}><Wand2 size={22} color={th.accent}/></div>
          <div style={{ fontSize:15, fontWeight:600, color:th.text, marginBottom:6 }}>{tool==="captions"?"Bilingual captions in seconds":tool==="ideas"?"Never stare at a blank page":"The right hashtags, instantly"}</div>
          <div style={{ fontSize:12.5, color:th.text2, maxWidth:430, margin:"0 auto 20px", lineHeight:1.6 }}>Enter a topic and hit Generate to get {tool==="captions"?"three caption variations in English and Arabic":tool==="ideas"?"fresh, on-brand post ideas":"a curated hashtag pack"}.</div>
          <div style={{ fontSize:10, fontWeight:700, letterSpacing:0.6, color:th.text3, textTransform:"uppercase", marginBottom:11 }}>Try one of these</div>
          <div style={{ display:"flex", gap:8, flexWrap:"wrap", justifyContent:"center" }}>
            {EXAMPLES.map(ex=>(
              <button key={ex} onClick={()=>setTopic(ex)} style={{ fontSize:11.5, color:th.text2, background:th.card2, border:`1px solid ${th.border}`, borderRadius:999, padding:"7px 14px", cursor:"pointer" }}>{ex}</button>
            ))}
          </div>
        </div>
      )}

      <ImagePaywallModal open={payOpen} onClose={()=>setPayOpen(false)} th={th} geo={geo} used={imgUsed} limit={imgLimit} currentPack={curPack} onChoose={choosePack} isPaid={isPaid} onUpgrade={()=>{ setPayOpen(false); setPage('billing'); }}/>
    </div>
  );
}

function CalendarPage() {
  const { selClient, dark, setPage, lang } = useApp();
  const th = dark ? DARK : LIGHT;
  const isAR = lang === "ar";
  const L = (en, ar) => isAR ? ar : en;
  const [view, setView] = useState("list");
  const [cursor, setCursor] = useState(new Date());
  const [posts, setPosts] = useState([]);
  const [selected, setSelected] = useState(null);
  const [realClientId, setRealClientId] = useState(null);
  const [busy, setBusy] = useState("");
  const [dragId, setDragId] = useState(null);
  const [dragOver, setDragOver] = useState(null);

  const reschedule = async (postId, targetDate) => {
    if (!postId) return;
    const pp = posts.find(x => x.id === postId); if (!pp) return;
    const old = new Date(pp.scheduled_at);
    const nd = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), old.getHours(), old.getMinutes());
    setPosts(prev => prev.map(x => x.id === postId ? { ...x, scheduled_at: nd.toISOString() } : x));
    setDragId(null); setDragOver(null);
    await supabase.from('posts').update({ scheduled_at: nd.toISOString() }).eq('id', postId);
  };

  useEffect(() => {
    if (!selClient?.name) return;
    supabase.from('clients').select('id').eq('name', selClient.name).limit(1)
      .then(({ data }) => { if (data && data.length) setRealClientId(data[0].id); });
  }, [selClient]);

  const loadPosts = (cid) => {
    const id = cid || realClientId; if (!id) return;
    supabase.from('posts').select('*').eq('client_id', id).eq('status', 'scheduled').order('scheduled_at', { ascending: true })
      .then(({ data }) => { if (data) setPosts(data.filter(p => p.scheduled_at)); });
  };
  useEffect(() => { if (realClientId) loadPosts(realClientId); }, [realClientId]);

  const PLAT = { ig:{name:"Instagram",color:"#E1306C",Icon:FaInstagram}, fb:{name:"Facebook",color:"#1877F2",Icon:FaFacebook}, tw:{name:"X",color:th.text2,Icon:FaTwitter}, li:{name:"LinkedIn",color:"#0A66C2",Icon:FaLinkedin}, tt:{name:"TikTok",color:th.text2,Icon:FaTiktok}, yt:{name:"YouTube",color:"#FF0000",Icon:FaYoutube} };
  const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  const DOW = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
  const sameDay = (a, b) => a.getFullYear()===b.getFullYear() && a.getMonth()===b.getMonth() && a.getDate()===b.getDate();
  const isToday = (d) => sameDay(d, new Date());
  const postsOn = (d) => posts.filter(p => sameDay(new Date(p.scheduled_at), d)).sort((a,b)=> new Date(a.scheduled_at)-new Date(b.scheduled_at));
  const fmtTime = (iso) => { const d = new Date(iso); let h = d.getHours(); const mm = String(d.getMinutes()).padStart(2,'0'); const ap = h>=12?'PM':'AM'; h = h%12||12; return `${h}:${mm} ${ap}`; };

  const y = cursor.getFullYear(), m = cursor.getMonth();
  const startDay = new Date(y, m, 1).getDay();
  const gridStart = new Date(y, m, 1 - startDay);
  const monthCells = Array.from({ length: 42 }, (_, i) => new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + i));
  const wStart = new Date(cursor); wStart.setDate(cursor.getDate() - cursor.getDay());
  const weekCells = Array.from({ length: 7 }, (_, i) => new Date(wStart.getFullYear(), wStart.getMonth(), wStart.getDate() + i));

  const go = (dir) => {
    if (view === "month") setCursor(new Date(y, m + dir, 1));
    else { const d = new Date(cursor); d.setDate(cursor.getDate() + dir * 7); setCursor(d); }
  };
  const label = view === "month" ? `${MONTHS[m]} ${y}` : `${MONTHS[weekCells[0].getMonth()]} ${weekCells[0].getDate()} – ${MONTHS[weekCells[6].getMonth()]} ${weekCells[6].getDate()}`;

  const deletePost = async (id) => { await supabase.from('posts').delete().eq('id', id); setSelected(null); loadPosts(); };
  const postNow = async (p) => {
    setBusy("posting");
    try {
      const { data: accs } = await supabase.from('social_accounts').select('*').eq('client_id', realClientId).eq('account_id', p.account_id).limit(1);
      const acc = accs && accs[0];
      if (!acc) { setBusy("noacc"); return; }
      const res = await fetch('/api/meta-publish', { method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ platform: acc.platform, accountId: acc.account_id, accessToken: acc.access_token, caption: p.caption, imageUrl: p.image_url }) });
      const data = await res.json();
      if (data.success) { await supabase.from('posts').delete().eq('id', p.id); setSelected(null); loadPosts(); setBusy(""); }
      else setBusy("err:" + (data.error || "failed"));
    } catch (e) { setBusy("err:" + e.message); }
  };

  const card = { background:th.card, border:`1px solid ${th.border}`, borderRadius:16, boxShadow:"none" };
  const upcoming = posts.filter(p => new Date(p.scheduled_at) >= new Date()).sort((a,b)=> new Date(a.scheduled_at)-new Date(b.scheduled_at));
  const nextPost = upcoming[0] || null;
  const thisMonthCount = posts.filter(p => { const d=new Date(p.scheduled_at); return d.getFullYear()===y && d.getMonth()===m; }).length;
  const chip = (p) => { const info = PLAT[p.platform] || { color:th.accent, Icon:Globe }; return (
    <div key={p.id} draggable onDragStart={(e)=>{ e.stopPropagation(); setDragId(p.id); }} onDragEnd={()=>{ setDragId(null); setDragOver(null); }} onClick={(e)=>{e.stopPropagation();setSelected(p);}} style={{ display:"flex", alignItems:"center", gap:6, padding:"4px 7px", borderRadius:8, background:info.color+"1e", borderLeft:`2.5px solid ${info.color}`, cursor:"grab", marginBottom:3, overflow:"hidden", opacity:dragId===p.id?0.4:1 }}>
      {p.image_url ? <img src={p.image_url} alt="" style={{ width:16, height:16, borderRadius:4, objectFit:"cover", flexShrink:0 }}/> : <info.Icon style={{ fontSize:11, color:info.color, flexShrink:0 }}/>}
      <span style={{ fontSize:9.5, color:info.color, fontWeight:600, flexShrink:0 }}>{fmtTime(p.scheduled_at)}</span>
      <span style={{ fontSize:10, color:th.text, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{p.caption || L("(no caption)","(بدون نص)")}</span>
    </div>
  ); };

  return (
    <div style={{ padding:"28px 32px" }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:18, flexWrap:"wrap", gap:12 }}>
        <div>
          <h2 style={{ margin:0, fontSize:20, fontWeight:600, letterSpacing:-0.3 }}>{L("Planner","المخطط")}</h2>
          <p style={{ margin:"5px 0 0", fontSize:12.5, color:th.text2 }}>{selClient?.name || L("Your brand","علامتك")} &middot; <span className="tw-num">{posts.length}</span> {L("scheduled","مجدول")}{nextPost ? <> &middot; {L("next up","التالي")} <span style={{ color:th.text }}>{new Date(nextPost.scheduled_at).toLocaleDateString([], { weekday:"short", day:"numeric", month:"short" })}</span> {L("at","في")} <span className="tw-num" style={{ color:th.text }}>{fmtTime(nextPost.scheduled_at)}</span></> : <> &middot; <span style={{ color:th.text3 }}>{L("drag a post to reschedule","اسحب منشوراً لإعادة جدولته")}</span></>}</p>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ display:"flex", gap:4, background:th.card, border:`1px solid ${th.border}`, borderRadius:999, padding:3 }}>
            {[["list",L("List","قائمة")],["month",L("Month","شهر")],["week",L("Week","أسبوع")]].map(([k,t])=>(
              <button key={k} onClick={()=>setView(k)} style={{ padding:"7px 16px", borderRadius:999, border:"none", background:view===k?th.gradient:"transparent", color:view===k?"#fff":th.text2, fontSize:12, fontWeight:view===k?600:400, cursor:"pointer" }}>{t}</button>
            ))}
          </div>
          <button onClick={()=>setPage("publisher")} style={{ display:"flex", alignItems:"center", gap:6, padding:"9px 16px", borderRadius:11, background:th.gradient, border:"none", color:"#fff", fontWeight:600, fontSize:12.5, cursor:"pointer" }}><Plus size={14}/>{L("New post","منشور جديد")}</button>
        </div>
      </div>

      {view !== "list" && (
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14 }}>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <button onClick={()=>go(-1)} style={{ width:32, height:32, borderRadius:9, background:th.card, border:`1px solid ${th.border}`, color:th.text, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}><ChevronLeft size={16}/></button>
          <button onClick={()=>go(1)} style={{ width:32, height:32, borderRadius:9, background:th.card, border:`1px solid ${th.border}`, color:th.text, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}><ChevronRight size={16}/></button>
          <div style={{ fontSize:16, fontWeight:600, marginLeft:6 }}>{label}</div>
        </div>
        <button onClick={()=>setCursor(new Date())} style={{ padding:"7px 14px", borderRadius:9, background:th.card, border:`1px solid ${th.border}`, color:th.text2, fontSize:12, cursor:"pointer" }}>{L("Today","اليوم")}</button>
      </div>
      )}

      <div style={{ ...card, overflow:"hidden" }}>
        {view !== "list" && (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", borderBottom:`1px solid ${th.border}` }}>
          {DOW.map(d => <div key={d} style={{ padding:"10px 0", textAlign:"center", fontSize:11, fontWeight:600, color:th.text2, letterSpacing:0.3 }}>{d}</div>)}
        </div>
        )}
        {view === "list" ? (() => {
          const sorted = [...posts].sort((a,b)=> new Date(a.scheduled_at)-new Date(b.scheduled_at));
          if (sorted.length === 0) return <div style={{ padding:"48px 24px", textAlign:"center", color:th.text2, fontSize:13 }}><Calendar size={30} style={{ opacity:0.3, marginBottom:12 }}/><div style={{ fontSize:14, fontWeight:600, color:th.text, marginBottom:6 }}>{L("Nothing scheduled yet","لا يوجد شيء مجدول بعد")}</div><div>{L("Schedule a post and it'll show up here, grouped by day.","جدوِل منشوراً وسيظهر هنا مرتباً حسب اليوم.")}</div></div>;
          const groups = []; let lastKey = null;
          for (const p of sorted) { const d = new Date(p.scheduled_at); const key = d.toDateString(); if (key !== lastKey) { groups.push({ key, date:d, items:[] }); lastKey = key; } groups[groups.length-1].items.push(p); }
          const tmr = new Date(); tmr.setDate(tmr.getDate()+1);
          const dayLabel = (d) => isToday(d) ? L("Today","اليوم") : sameDay(d,tmr) ? L("Tomorrow","غداً") : d.toLocaleDateString(isAR?"ar":[], { weekday:"long", day:"numeric", month:"long" });
          return <div>{groups.map((g,gi) => (
            <div key={g.key}>
              <div style={{ padding:"9px 18px", background:th.card2, borderBottom:`1px solid ${th.border}`, borderTop:gi>0?`1px solid ${th.border}`:"none", fontSize:10.5, fontWeight:700, letterSpacing:0.5, color:th.text3, textTransform:"uppercase", display:"flex", justifyContent:"space-between" }}>
                <span>{dayLabel(g.date)}</span><span className="tw-num" style={{ color:th.text3 }}>{g.date.toLocaleDateString(isAR?"ar":[], { day:"numeric", month:"short" })}</span>
              </div>
              {g.items.map((p,pi) => { const info = PLAT[p.platform] || { name:p.platform, color:th.accent, Icon:Globe };
                return (
                <div key={p.id} onClick={()=>setSelected(p)} style={{ display:"flex", alignItems:"center", gap:13, padding:"13px 18px", borderBottom:(pi<g.items.length-1||gi<groups.length-1)?`1px solid ${th.border}`:"none", cursor:"pointer" }}>
                  <div style={{ width:40, height:40, borderRadius:11, background:info.color+"1e", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}><info.Icon style={{ color:info.color, fontSize:18 }}/></div>
                  <div style={{ width:46, height:46, borderRadius:9, flexShrink:0, overflow:"hidden", background:th.card2, display:"flex", alignItems:"center", justifyContent:"center" }}>{p.image_url ? <img src={p.image_url} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }}/> : <Image size={15} color={th.text3}/>}</div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:13.5, fontWeight:600, color:th.text, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{p.caption || L("(untitled)","(بدون عنوان)")}</div>
                    <div style={{ fontSize:11, color:th.text2, marginTop:2, display:"flex", alignItems:"center", gap:5 }}><Clock size={12}/><span className="tw-num">{fmtTime(p.scheduled_at)}</span>{p.account_id && <span style={{ color:th.text3 }}>&middot; {(accounts.find(a=>a.account_id===p.account_id)||{}).account_name || info.name}</span>}</div>
                  </div>
                  <span style={{ fontSize:10, fontWeight:700, borderRadius:999, padding:"3px 10px", background:p.status==="scheduled"?th.successSoft:th.warningSoft, color:p.status==="scheduled"?th.success:th.warning, flexShrink:0 }}>{p.status==="scheduled"?L("scheduled","مجدول"):L("draft","مسودة")}</span>
                  <button title={L("Preview","معاينة")} onClick={(e)=>{e.stopPropagation();setSelected(p);}} style={{ background:"none", border:"none", cursor:"pointer", color:th.text3, display:"flex", padding:4 }}><Eye size={16}/></button>
                  <button title={L("Edit","تعديل")} onClick={(e)=>{e.stopPropagation();setPage("publisher");}} style={{ background:"none", border:"none", cursor:"pointer", color:th.text3, display:"flex", padding:4 }}><Edit3 size={15}/></button>
                </div>
              ); })}
            </div>
          ))}</div>;
        })() : view === "month" ? (
          <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)" }}>
            {monthCells.map((d, i) => { const inMonth = d.getMonth() === m; const dayPosts = postsOn(d); const today = isToday(d);
              return (
                <div key={i} onClick={()=>{ setView("week"); setCursor(d); }} onDragOver={(e)=>{ if(dragId){ e.preventDefault(); setDragOver(d.toDateString()); } }} onDrop={(e)=>{ e.preventDefault(); reschedule(dragId, d); }} style={{ minHeight:108, padding:7, borderRight:(i%7!==6)?`1px solid ${th.border}`:"none", borderBottom:i<35?`1px solid ${th.border}`:"none", background:dragOver===d.toDateString()?th.accentSoft:(today?th.accentSoft:(inMonth?"transparent":th.bg)), boxShadow:dragOver===d.toDateString()?`inset 0 0 0 2px ${th.accent}`:"none", cursor:"pointer", opacity:inMonth?1:0.5, overflow:"hidden" }}>
                  <div style={{ display:"flex", justifyContent:"flex-end", marginBottom:5 }}>
                    <span className="tw-num" style={{ fontSize:12, fontWeight:today?700:500, color:today?"#fff":th.text2, background:today?th.accent:"transparent", width:22, height:22, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center" }}>{d.getDate()}</span>
                  </div>
                  {dayPosts.slice(0,3).map(p => chip(p))}
                  {dayPosts.length > 3 && <div style={{ fontSize:9.5, color:th.text2, paddingLeft:3 }}>+<span className="tw-num">{dayPosts.length-3}</span> {L("more","أخرى")}</div>}
                </div>
              ); })}
          </div>
        ) : (
          <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", minHeight:440 }}>
            {weekCells.map((d, i) => { const dayPosts = postsOn(d); const today = isToday(d);
              return (
                <div key={i} onDragOver={(e)=>{ if(dragId){ e.preventDefault(); setDragOver(d.toDateString()); } }} onDrop={(e)=>{ e.preventDefault(); reschedule(dragId, d); }} style={{ padding:9, borderRight:(i!==6)?`1px solid ${th.border}`:"none", background:dragOver===d.toDateString()?th.accentSoft:(today?th.accentSoft:"transparent"), boxShadow:dragOver===d.toDateString()?`inset 0 0 0 2px ${th.accent}`:"none" }}>
                  <div style={{ textAlign:"center", marginBottom:9 }}>
                    <div style={{ fontSize:10, color:th.text2 }}>{DOW[d.getDay()]}</div>
                    <div className="tw-num" style={{ fontSize:18, fontWeight:today?700:500, color:today?th.accent:th.text }}>{d.getDate()}</div>
                  </div>
                  {dayPosts.length === 0 ? <div onClick={()=>setPage("publisher")} style={{ textAlign:"center", fontSize:10, color:th.text3, padding:"14px 0", cursor:"pointer", border:`1px dashed ${th.border}`, borderRadius:8 }}>+ {L("Add","إضافة")}</div> : dayPosts.map(p => chip(p))}
                </div>
              ); })}
          </div>
        )}
      </div>

      {posts.length === 0 && (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:14, marginTop:18 }}>
          {[[L("Start from scratch","ابدأ من الصفر"),L("Compose a fresh post for any platform","اكتب منشوراً جديداً لأي منصة"),Edit3],[L("Repurpose top posts","أعد استخدام أفضل المنشورات"),L("Turn winning content into new posts","حوّل المحتوى الناجح إلى منشورات جديدة"),RefreshCw],[L("Get inspired","استلهم"),L("See what's trending right now","شاهد ما هو رائج الآن"),Sparkles]].map(([t,sub,Ic],i)=>(
            <div key={i} onClick={()=> i===2 ? setPage("listening") : setPage("publisher")} style={{ ...card, padding:18, cursor:"pointer", boxShadow:"none" }}>
              <div style={{ width:38, height:38, borderRadius:11, background:th.accentSoft, display:"flex", alignItems:"center", justifyContent:"center", marginBottom:11 }}><Ic size={18} color={th.accent}/></div>
              <div style={{ fontSize:13.5, fontWeight:600, marginBottom:4 }}>{t}</div>
              <div style={{ fontSize:11.5, color:th.text2, lineHeight:1.5 }}>{sub}</div>
            </div>
          ))}
        </div>
      )}

      {selected && (() => { const info = PLAT[selected.platform] || { name:selected.platform, color:th.accent, Icon:Globe }; return (
        <div onClick={()=>setSelected(null)} style={{ position:"fixed", inset:0, background:"rgba(3,5,10,0.55)", zIndex:60, display:"flex", justifyContent:"flex-end" }}>
          <div onClick={e=>e.stopPropagation()} style={{ width:380, maxWidth:"90vw", height:"100%", background:th.surface, borderLeft:`1px solid ${th.border}`, padding:24, overflowY:"auto", boxShadow:"-20px 0 60px rgba(0,0,0,0.5)" }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:18 }}>
              <div style={{ display:"flex", alignItems:"center", gap:9 }}><info.Icon style={{ fontSize:18, color:info.color }}/><span style={{ fontSize:14, fontWeight:600 }}>{info.name}</span></div>
              <button onClick={()=>setSelected(null)} style={{ background:"none", border:"none", cursor:"pointer", color:th.text2, display:"flex" }}><XCircle size={20}/></button>
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:8, fontSize:12.5, color:th.text2, marginBottom:16 }}><Clock size={14}/>{new Date(selected.scheduled_at).toLocaleString([], { weekday:"short", month:"short", day:"numeric", hour:"numeric", minute:"2-digit" })}</div>
            {selected.image_url && <img src={selected.image_url} alt="" style={{ width:"100%", borderRadius:14, marginBottom:14, border:`1px solid ${th.border}` }}/>}
            <div style={{ fontSize:13, lineHeight:1.6, color:th.text, whiteSpace:"pre-wrap", marginBottom:20 }}>{selected.caption || L("(no caption)","(بدون نص)")}</div>
            {busy.startsWith("err") && <div style={{ fontSize:11.5, color:th.danger, marginBottom:10 }}>{busy.slice(4)}</div>}
            {busy === "noacc" && <div style={{ fontSize:11.5, color:th.warning, marginBottom:10 }}>{L("Connected account not found for this post.","لم يتم العثور على الحساب المرتبط لهذا المنشور.")}</div>}
            <div style={{ display:"flex", flexDirection:"column", gap:9 }}>
              <button onClick={()=>postNow(selected)} disabled={busy==="posting"} style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:7, padding:"11px", borderRadius:11, background:th.gradient, border:"none", color:"#fff", fontSize:13, fontWeight:600, cursor:"pointer", opacity:busy==="posting"?0.6:1 }}><Send size={15}/>{busy==="posting"?L("Posting…","جارٍ النشر…"):L("Post now","انشر الآن")}</button>
              <button onClick={()=>setPage("publisher")} style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:7, padding:"11px", borderRadius:11, background:th.card, border:`1px solid ${th.border}`, color:th.text, fontSize:13, cursor:"pointer" }}><Edit3 size={14}/>{L("Edit in composer","تعديل في المحرر")}</button>
              <button onClick={()=>deletePost(selected.id)} style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:7, padding:"11px", borderRadius:11, background:th.dangerSoft, border:`1px solid ${th.danger}33`, color:th.danger, fontSize:13, cursor:"pointer" }}><XCircle size={14}/>{L("Delete","حذف")}</button>
            </div>
          </div>
        </div>
      ); })()}
    </div>
  );
}

// Reusable polished empty state — gradient-glow icon, title, body, optional CTA.
function EmptyState({ Icon, title, body, cta, onCta, compact }) {
  const th = useTheme();
  return (
    <div style={{ textAlign:"center", padding: compact ? "30px 20px" : "54px 24px", display:"flex", flexDirection:"column", alignItems:"center" }}>
      <div style={{ position:"relative", width:64, height:64, borderRadius:20, background:th.accentSoft, border:`1px solid ${th.border}`, display:"flex", alignItems:"center", justifyContent:"center", marginBottom:18 }}>
        <div style={{ position:"absolute", inset:-8, borderRadius:26, background:`radial-gradient(circle, ${th.accent}26, transparent 70%)`, pointerEvents:"none" }}/>
        <Icon size={28} color={th.accent} strokeWidth={1.7}/>
      </div>
      <div style={{ fontSize:15.5, fontWeight:700, marginBottom:6 }}>{title}</div>
      <div style={{ fontSize:12.5, color:th.text2, lineHeight:1.65, maxWidth:340, marginBottom: cta ? 18 : 0 }}>{body}</div>
      {cta && <button onClick={onCta} style={{ display:"inline-flex", alignItems:"center", gap:7, padding:"10px 18px", borderRadius:11, background:th.gradient, border:"none", color:"#fff", fontSize:12.5, fontWeight:600, cursor:"pointer", boxShadow:"0 8px 22px rgba(110,140,171,0.32)" }}>{cta}<ArrowUpRight size={14}/></button>}
    </div>
  );
}

function PublisherPage() {
  const { selClient, dark, setPage, userEmail, lang, selPlatform } = useApp();
  const th = dark ? DARK : LIGHT;
  const isAR = lang === "ar";
  const L = (en, ar) => isAR ? ar : en;
  const isMobile = useIsMobile();
  const [upgrade, setUpgrade] = useState(null);
  const [tab, setTab] = useState("compose");
  const [accounts, setAccounts] = useState([]);
  const [selectedAccounts, setSelectedAccounts] = useState([]);
  const [caption, setCaption] = useState("");
  const [media, setMedia] = useState([]);
  const [selectedSlide, setSelectedSlide] = useState(null); // which image's alt text is being edited
  const [altBusy, setAltBusy] = useState(null);   // media id currently generating alt text (or 'all')
  const [visionBusy, setVisionBusy] = useState(false); // "Read the image" in progress
  const [mediaWarning, setMediaWarning] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [igFormat, setIgFormat] = useState("feed");
  const [scheduleType, setScheduleType] = useState("now");
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");
  const [firstComment, setFirstComment] = useState("");
  const [previewPlatform, setPreviewPlatform] = useState("ig");
  const [posting, setPosting] = useState(false);
  const [results, setResults] = useState([]);
  const [realClientId, setRealClientId] = useState(null);
  const [editingDraftId, setEditingDraftId] = useState(null);
  const [showAI, setShowAI] = useState(false);
  const [aiTopic, setAiTopic] = useState("");
  const [aiTone, setAiTone] = useState("engaging and professional");
  const [aiAudience, setAiAudience] = useState("");
  const [aiDetails, setAiDetails] = useState("");
  const [aiLang, setAiLang] = useState("both");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  const [drafts, setDrafts] = useState([]);

  useEffect(() => {
    if (!selClient?.name) return;
    supabase.from('clients').select('id').eq('name', selClient.name).limit(1)
      .then(({ data }) => { if (data && data.length > 0) setRealClientId(data[0].id); });
  }, [selClient]);

  useEffect(() => {
    try {
      const c = sessionStorage.getItem('tw_studio_caption'); if (c) { setCaption(c); sessionStorage.removeItem('tw_studio_caption'); }
      const m = sessionStorage.getItem('tw_studio_media'); if (m) { setMedia(prev => [...prev, { id:'h'+Date.now(), name:'media', type:/\.(mp4|mov|webm)$/i.test(m)?'video':'image', url:m, uploading:false }]); sessionStorage.removeItem('tw_studio_media'); }
    } catch (e) { /* ignore */ }
  }, []);

  const loadDrafts = (cid) => {
    const id = cid || realClientId; if (!id) return;
    supabase.from('posts').select('*').eq('client_id', id).eq('status', 'draft').order('created_at', { ascending: false })
      .then(({ data }) => { if (data) setDrafts(data); });
  };

  useEffect(() => {
    if (!realClientId) return;
    supabase.from('social_accounts').select('*').eq('client_id', realClientId).neq('is_active', false)
      .then(({ data }) => { if (data) setAccounts(data); });
    loadDrafts(realClientId);
  }, [realClientId]);

  // Pampering: the composer follows the channel you picked in the top bar — pick once, up top.
  // "All" targets every account; a specific channel with several accounts pre-picks one and
  // lets you choose which (or add the others with a tap).
  useEffect(() => {
    if (!accounts.length) return;
    if (selPlatform && selPlatform !== "all") {
      const match = accounts.filter(a => a.platform === selPlatform);
      setSelectedAccounts(match.map(a => a.id));
    } else {
      setSelectedAccounts(accounts.map(a => a.id));
    }
  }, [accounts, selPlatform]);

  const toggleAccount = (id) => setSelectedAccounts(prev => prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]);
  // The picker always shows every connected account so you can post to any
  // combination (they're all different accounts). The top-bar channel just
  // pre-selects a sensible default; you can add or remove any from here.
  const channelScoped = !!(selPlatform && selPlatform !== "all");
  const pubAccounts = accounts;
  const selPlats = [...new Set(accounts.filter(a => selectedAccounts.includes(a.id)).map(a => a.platform))];
  const igSelected = selPlats.includes("ig");
  // Live preview follows the accounts you've selected: only their platforms, and it shows the real account.
  const PREVIEW_TABS = [["ig","Instagram",FaInstagram],["fb","Facebook",FaFacebook],["li","LinkedIn",FaLinkedin],["tw","X",FaTwitter]];
  const previewTabs = selPlats.length ? PREVIEW_TABS.filter(([k]) => selPlats.includes(k)) : PREVIEW_TABS;
  const effPreviewPlat = previewTabs.some(([k]) => k === previewPlatform) ? previewPlatform : (previewTabs[0] ? previewTabs[0][0] : "ig");
  const previewAccount = accounts.find(a => selectedAccounts.includes(a.id) && a.platform === effPreviewPlat) || null;
  const images = media.filter(m => m.type === 'image' && m.url);
  const video = media.find(m => m.type === 'video' && m.url);
  const detected = video ? (igFormat === 'story' ? 'Story' : 'Reel / Video') : images.length > 1 ? ('Carousel · ' + images.length + ' images') : images.length === 1 ? 'Single photo' : null;

  const handleUpload = async (fileList) => {
    const files = Array.from(fileList || []);
    if (!files.length) return;
    setMediaWarning("");
    for (const file of files) {
      const isVideo = file.type.startsWith('video/');
      const isImage = file.type.startsWith('image/');
      if (!isVideo && !isImage) { setMediaWarning('Only images or videos are supported.'); continue; }
      if (file.size / 1024 / 1024 > 100) { setMediaWarning('File exceeds the 100MB limit.'); continue; }
      if (isVideo) setMedia([]);
      if (isImage && video) { setMediaWarning('Remove the video first to add images.'); continue; }
      if (isImage && images.length >= 10) { setMediaWarning('Up to 10 images in a carousel.'); break; }
      const id = Date.now() + '-' + Math.random().toString(36).slice(2, 7);
      const item = { id, name: file.name, type: isVideo ? 'video' : 'image', url: null, uploading: true };
      setMedia(prev => isVideo ? [item] : [...prev, item]);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        const uid = user?.id || 'anonymous';
        const ext = file.name.split('.').pop();
        const path = `${uid}/${Date.now()}-${Math.random().toString(36).slice(2, 7)}.${ext}`;
        const { error } = await supabase.storage.from('media').upload(path, file, { upsert: true });
        if (error) throw error;
        const { data: urlData } = supabase.storage.from('media').getPublicUrl(path);
        setMedia(prev => prev.map(m => m.id === id ? { ...m, url: urlData.publicUrl, uploading: false } : m));
      } catch (err) {
        setMediaWarning('Upload failed: ' + err.message);
        setMedia(prev => prev.filter(m => m.id !== id));
      }
    }
  };
  const removeMedia = (id) => setMedia(prev => prev.filter(m => m.id !== id));

  const generateCaption = async () => {
    if (!aiTopic.trim()) return;
    if (trialEnded(userEmail)) {
      setUpgrade({ title:"Your free trial has ended", detail:"Upgrade to keep using AI captions. Your accounts and analytics are still here.", Icon:Lock });
      return;
    }
    if (isTrialUser(userEmail) && aiUsesOf(userEmail) >= TRIAL.ai) {
      setUpgrade({ title:"You've used all 5 free AI generations", detail:`AI captions are a paid feature. You've experienced what the AI can do. Upgrade to keep generating unlimited bilingual captions, hashtags and content ideas.`, Icon:Wand2 });
      return;
    }
    setAiLoading(true); setAiResult(null);
    try {
      const res = await fetch('/api/generate-caption', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: aiTopic, tone: aiTone, audience: aiAudience, details: aiDetails, lang: aiLang, platform: selPlats[0] || 'ig', brand: selClient?.name }) });
      const data = await res.json();
      setAiResult(data);
      if (isTrialUser(userEmail) && !data.error) bumpAiUses(userEmail);
    } catch (e) { setAiResult({ error: 'Could not generate.' }); }
    setAiLoading(false);
  };

  const resetComposer = () => { setCaption(""); setFirstComment(""); setMedia([]); setSelectedSlide(null); setSelectedAccounts([]); setEditingDraftId(null); setIgFormat("feed"); setResults([]); };

  // Per-slide alt text lives on each media item (m.alt). These helpers read/write it.
  const setAlt = (id, val) => setMedia(prev => prev.map(m => m.id === id ? { ...m, alt: val } : m));
  const effSlide = images.find(m => m.id === selectedSlide) ? selectedSlide : (images[0]?.id || null);
  const altDone = images.filter(m => (m.alt || "").trim()).length;
  // Alt text only matters for an Instagram feed photo/carousel — not Reels, not Stories, not other networks.
  const showAlt = igSelected && igFormat === "feed" && images.length > 0;

  const generateAlt = async (id) => {
    const img = images.find(m => m.id === id); if (!img?.url) return;
    setAltBusy(id);
    try {
      const res = await fetch('/api/generate-caption', { method:'POST', headers:{ 'Content-Type':'application/json' },
        body: JSON.stringify({ mode:'alt', imageUrl: img.url, platform:'ig', details: aiTopic || caption || "" }) });
      const data = await res.json();
      if (data.alt) setAlt(id, data.alt);
    } catch (e) { /* non-fatal */ }
    setAltBusy(null);
  };
  const generateAllAlt = async () => {
    setAltBusy('all');
    for (const img of images) {
      if (!img.url || (img.alt || "").trim()) continue;
      try {
        const res = await fetch('/api/generate-caption', { method:'POST', headers:{ 'Content-Type':'application/json' },
          body: JSON.stringify({ mode:'alt', imageUrl: img.url, platform:'ig', details: aiTopic || caption || "" }) });
        const data = await res.json();
        if (data.alt) setAlt(img.id, data.alt);
      } catch (e) { /* non-fatal */ }
    }
    setAltBusy(null);
  };

  // "Read the image" — vision describes the first photo and drops it into the AI topic to build from.
  const readImage = async () => {
    if (!firstImg?.url) return;
    setVisionBusy(true); setShowAI(true);
    try {
      const res = await fetch('/api/generate-caption', { method:'POST', headers:{ 'Content-Type':'application/json' },
        body: JSON.stringify({ mode:'vision', imageUrl: firstImg.url, details: aiTopic || "" }) });
      const data = await res.json();
      if (data.description) setAiTopic(data.description);
    } catch (e) { /* non-fatal */ }
    setVisionBusy(false);
  };

  const saveDraft = async () => {
    if (!realClientId) return;
    const row = { client_id: realClientId, platform: selPlats[0] || 'ig', caption, image_url: images[0]?.url || video?.url || null, status: 'draft' };
    if (editingDraftId) await supabase.from('posts').update(row).eq('id', editingDraftId);
    else await supabase.from('posts').insert([row]);
    resetComposer(); loadDrafts(); setTab("drafts");
  };
  const loadDraft = (d) => { setCaption(d.caption || ""); setEditingDraftId(d.id); setMedia(d.image_url ? [{ id: 'd', url: d.image_url, type: 'image', name: 'media', uploading: false }] : []); setTab("compose"); };
  const deleteDraft = async (id) => { await supabase.from('posts').delete().eq('id', id); loadDrafts(); };

  const handlePost = async () => {
    if (!caption.trim() || selectedAccounts.length === 0) return;
    if (trialEnded(userEmail)) {
      setUpgrade({ title:"Your free trial has ended", detail:"Upgrade to publish and schedule again. Your accounts, posts and analytics are all still here.", Icon:Lock });
      return;
    }
    if (isTrialUser(userEmail) && postsOf(userEmail) >= TRIAL.posts) {
      setUpgrade({ title:`You've reached your ${TRIAL.posts}-post trial limit`, detail:`Your free trial includes ${TRIAL.posts} posts so you can feel the full workflow. Upgrade for unlimited publishing and scheduling across all your brands.`, Icon:Send });
      return;
    }
    setPosting(true); setResults([]);
    const imgs = images.map(m => m.url);
    const imgAlts = images.map(m => (m.alt || "").trim());
    const out = [];
    for (const accId of selectedAccounts) {
      const acc = accounts.find(a => a.id === accId); if (!acc) continue;
      if (scheduleType === "schedule" && scheduleDate && scheduleTime) {
        const scheduledAt = new Date(`${scheduleDate}T${scheduleTime}`).toISOString();
        const { error } = await supabase.from('posts').insert([{ client_id: realClientId, platform: acc.platform, account_id: acc.account_id, caption, image_url: imgs[0] || video?.url || null, status: 'scheduled', scheduled_at: scheduledAt }]);
        out.push({ account: acc.account_name, success: !error, error: error?.message });
      } else {
        const res = await fetch('/api/meta-publish', { method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ platform: acc.platform, accountId: acc.account_id, accessToken: acc.access_token, caption,
            imageUrl: imgs.length === 1 ? imgs[0] : null, imageUrls: imgs.length > 1 ? imgs : null, videoUrl: video?.url || null,
            altText: imgAlts[0] || null, altTexts: imgs.length > 1 ? imgAlts : null, firstComment: firstComment || null, igFormat }) });
        const data = await res.json();
        // Record the published post (with its live link) so it shows in history & reports.
        if (data.success) {
          try {
            const { data: ins } = await supabase.from('posts').insert([{ client_id: realClientId, platform: acc.platform, account_id: acc.account_id, caption, image_url: imgs[0] || video?.url || null, status: 'published' }]).select();
            if (ins && ins[0]) await supabase.from('posts').update({ external_id: data.postId || null, permalink: data.permalink || null, published_at: new Date().toISOString() }).eq('id', ins[0].id);
          } catch (e) { /* link columns may not exist yet — non-fatal */ }
        }
        out.push({ account: acc.account_name, success: data.success, error: data.error, permalink: data.permalink });
      }
    }
    setPosting(false);
    const okCount = out.filter(r => r.success).length;
    if (okCount && isTrialUser(userEmail)) bumpPosts(userEmail, okCount);
    if (out.every(r => r.success)) { if (editingDraftId) await supabase.from('posts').delete().eq('id', editingDraftId); resetComposer(); loadDrafts(); }
    setResults(out);
  };

  const PLAT = { ig:{name:"Instagram",color:"#E1306C",Icon:FaInstagram}, fb:{name:"Facebook",color:"#1877F2",Icon:FaFacebook}, tw:{name:"X",color:th.text,Icon:FaTwitter}, li:{name:"LinkedIn",color:"#0A66C2",Icon:FaLinkedin}, tt:{name:"TikTok",color:th.text,Icon:FaTiktok}, yt:{name:"YouTube",color:"#FF0000",Icon:FaYoutube} };
  const card = { background:th.card, border:`1px solid ${th.border}`, borderRadius:16, padding:16, boxShadow:"none" };
  const lbl = { fontSize:12, color:th.text2, marginBottom:10 };
  const inp = { width:"100%", background:th.card2, border:`1px solid ${th.border}`, borderRadius:9, padding:"9px 12px", color:th.text, fontSize:12.5, outline:"none", boxSizing:"border-box", fontFamily:"inherit" };
  const firstImg = images[0];
  const primaryPlat = selPlats[0] || "ig";
  const BEST = { ig:[["13:00","Lunch scroll"],["20:00","Evening peak"],["21:00","Prime time"]], fb:[["12:00","Midday"],["19:00","Evening"],["21:00","Late evening"]], tw:[["09:00","Morning"],["12:00","Midday"],["18:00","Commute"]], li:[["08:00","Pre-work"],["09:00","Morning"],["12:00","Lunch"]], tt:[["18:00","After work"],["20:00","Evening"],["21:00","Prime time"]], yt:[["17:00","Evening"],["20:00","Prime time"]] };
  const bestSlots = (BEST[primaryPlat] || BEST.ig).map(([t, blab]) => {
    const [hh, mm] = t.split(":").map(Number);
    const now = new Date();
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hh, mm);
    if (d <= now) d.setDate(d.getDate() + 1);
    const sameDayNow = d.getDate() === now.getDate() && d.getMonth() === now.getMonth();
    const dateStr = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    const h12 = hh % 12 || 12; const ap = hh >= 12 ? "PM" : "AM";
    return { dateStr, time: t, blab, when: `${sameDayNow ? "Today" : "Tomorrow"} ${h12}:${String(mm).padStart(2,'0')} ${ap}` };
  });

  if (isMobile) {
    return (
      <div className="tw-page-in" style={{ padding:"40px 22px", maxWidth:480 }}>
        <div style={{ background:th.card, border:`1px solid ${th.border}`, borderRadius:20, padding:"34px 26px", textAlign:"center" }}>
          <div style={{ width:62, height:62, margin:"0 auto 20px", borderRadius:16, background:th.gradient, display:"flex", alignItems:"center", justifyContent:"center" }}>
            <Monitor size={28} color="#fff"/>
          </div>
          <div style={{ fontSize:19, fontWeight:800, color:th.text, marginBottom:10, letterSpacing:"-0.3px" }}>{L("Composing is on desktop","الإنشاء على سطح المكتب")}</div>
          <div style={{ fontSize:13.5, color:th.text2, lineHeight:1.7, marginBottom:22 }}>{L("Creating and scheduling posts is built for the desktop, where you get the full editor, live previews and media tools. Open tawaslo.com on a computer to publish.","إنشاء المنشورات وجدولتها مصمم لسطح المكتب، حيث تحصل على المحرر الكامل والمعاينة المباشرة وأدوات الوسائط. افتح tawaslo.com على الكمبيوتر للنشر.")}</div>
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            <button onClick={()=>setPage("calendar")} style={{ padding:"13px", borderRadius:12, background:th.gradient, color:"#fff", border:"none", fontSize:13.5, fontWeight:700, cursor:"pointer" }}>{L("View the planner","عرض المخطط")}</button>
            <button onClick={()=>setPage("analytics")} style={{ padding:"13px", borderRadius:12, background:th.card2, color:th.text, border:`1px solid ${th.border}`, fontSize:13.5, fontWeight:600, cursor:"pointer" }}>{L("See analytics","عرض التحليلات")}</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding:"28px 32px", maxWidth:1040 }}>
      <UpgradeGate open={!!upgrade} onClose={()=>setUpgrade(null)} onUpgrade={()=>{setUpgrade(null);setPage('billing');}} th={th} title={upgrade?.title} detail={upgrade?.detail} Icon={upgrade?.Icon}/>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16, flexWrap:"wrap", gap:10 }}>
        <div>
          <h2 style={{ margin:0, fontSize:20, fontWeight:600, letterSpacing:-0.3 }}>{L("Create post","إنشاء منشور")}</h2>
          <p style={{ margin:"5px 0 0", fontSize:12.5, color:th.text2 }}>{selClient?.name || L("Your brand","علامتك")} &middot; {L("compose, schedule & publish","اكتب وجدوِل وانشر")}</p>
        </div>
        <div style={{ display:"flex", gap:4, background:th.card, border:`1px solid ${th.border}`, borderRadius:999, padding:3 }}>
          {[["compose",L("Compose","إنشاء")],["drafts",L("Drafts","المسودات")+(drafts.length?" ("+drafts.length+")":"")]].map(([k,t])=>(
            <button key={k} onClick={()=>setTab(k)} style={{ padding:"7px 16px", borderRadius:999, border:"none", background:tab===k?th.gradient:"transparent", color:tab===k?"#fff":th.text2, fontSize:12, fontWeight:tab===k?600:400, cursor:"pointer" }}>{t}</button>
          ))}
        </div>
      </div>

      {tab === "drafts" ? (
        <div style={{ ...card, padding:0, overflow:"hidden", maxWidth:760 }}>
          <div style={{ padding:"14px 18px", borderBottom:`1px solid ${th.border}`, fontSize:13, fontWeight:600 }}>{L("Saved drafts","المسودات المحفوظة")}</div>
          {drafts.length === 0 ? (
            <EmptyState compact Icon={Edit3} title={L("No drafts yet","لا توجد مسودات بعد")} body={isAR ? <>اكتب منشوراً واضغط <strong style={{color:th.text}}>حفظ كمسودة</strong> للاحتفاظ به هنا.</> : <>Compose a post and hit <strong style={{color:th.text}}>Save draft</strong> to keep it here for later.</>} cta={L("Compose a post","اكتب منشوراً")} onCta={()=>setTab("compose")} />
          ) : drafts.map((d,i) => (
            <div key={d.id} style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 18px", borderBottom:i<drafts.length-1?`1px solid ${th.border}`:"none" }}>
              <div style={{ width:46, height:46, borderRadius:10, flexShrink:0, background:th.card2, overflow:"hidden", display:"flex", alignItems:"center", justifyContent:"center" }}>{d.image_url ? <img src={d.image_url} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/> : <Image size={16} color={th.text3}/>}</div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:12.5, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{d.caption || "(no caption)"}</div>
                <div style={{ fontSize:10.5, color:th.text2, marginTop:2 }}>{(PLAT[d.platform]||{}).name || d.platform} &middot; draft</div>
              </div>
              <button onClick={()=>loadDraft(d)} style={{ fontSize:11, color:th.accent, background:th.accentSoft, border:"none", borderRadius:8, padding:"6px 12px", cursor:"pointer" }}>Open</button>
              <button onClick={()=>deleteDraft(d.id)} style={{ background:"none", border:"none", cursor:"pointer", color:th.danger, display:"flex" }}><XCircle size={16}/></button>
            </div>
          ))}
        </div>
      ) : (
      <div style={{ display:"grid", gridTemplateColumns:"1.5fr 1fr", gap:18, alignItems:"start" }}>
        <div style={{ display:"flex", flexDirection:"column", gap:13 }}>

          <div style={card}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
              <div style={{ fontSize:12, color:th.text2, display:"flex", alignItems:"center", gap:7 }}>
                {L("Publishing to","النشر إلى")}
                {channelScoped && PLAT[selPlatform] && <span style={{ display:"flex", alignItems:"center", gap:5, fontSize:10.5, fontWeight:600, color:PLAT[selPlatform].color, background:PLAT[selPlatform].color+"1a", borderRadius:7, padding:"2px 8px" }}>{(()=>{const Ic=PLAT[selPlatform].Icon;return <Ic style={{ fontSize:11 }}/>;})()}{PLAT[selPlatform].name}{pubAccounts.length>1?" · "+L("choose","اختر"):""}</span>}
              </div>
              {accounts.length>0 && <span style={{ fontSize:10, color:th.text3, display:"flex", alignItems:"center", gap:5 }}><Check size={11}/>{L("tap any to include or exclude","اضغط أي حساب لتضمينه أو استبعاده")}</span>}
            </div>
            {accounts.length === 0 ? <div style={{ fontSize:12.5, color:th.text2 }}>{L("No connected accounts.","لا توجد حسابات مرتبطة.")} <span style={{ color:th.accent, cursor:"pointer" }} onClick={()=>setPage("social")}>{L("Connect accounts","اربط الحسابات")}</span> {L("to start.","للبدء.")}</div>
            : pubAccounts.length === 0 ? <div style={{ fontSize:12, color:th.text2, marginBottom:9 }}>{L("No "+(PLAT[selPlatform]?.name||"")+" account connected for this brand.","لا يوجد حساب مرتبط لهذه العلامة.")} <span style={{ color:th.accent, cursor:"pointer" }} onClick={()=>setPage("social")}>{L("Connect one","اربط حساباً")}</span>.</div> : (
              <div style={{ display:"flex", gap:7, flexWrap:"wrap", marginBottom:9 }}>
                {pubAccounts.map(acc => { const info = PLAT[acc.platform] || { name:acc.platform, color:th.accent, Icon:Globe }; const sel = selectedAccounts.includes(acc.id);
                  return <button key={acc.id} onClick={()=>toggleAccount(acc.id)} title={sel?L("Included — click to exclude","مضمّن — اضغط للاستبعاد"):L("Click to include","اضغط للتضمين")} style={{ display:"flex", alignItems:"center", gap:7, padding:"6px 12px 6px 10px", borderRadius:999, border:`1.5px solid ${sel?info.color:th.border}`, background:sel?info.color+"1f":"transparent", color:sel?info.color:th.text3, fontSize:11.5, cursor:"pointer", opacity:sel?1:0.65 }}>{sel ? <Check size={13}/> : <info.Icon style={{ fontSize:14 }}/>}{acc.account_name}</button>; })}
              </div>
            )}
            <div style={{ fontSize:10, color:th.text3, marginBottom:6 }}>{L("Connect to enable","اربط للتفعيل")}</div>
            <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
              {["tw","li","tt","yt"].map(k => { const info = PLAT[k]; return <button key={k} onClick={()=>setPage("social")} style={{ display:"flex", alignItems:"center", gap:5, padding:"5px 10px", borderRadius:999, border:`1px dashed ${th.border}`, background:"transparent", color:th.text3, fontSize:11, cursor:"pointer" }}><info.Icon style={{ fontSize:12 }}/>{info.name} <Plus size={11}/></button>; })}
            </div>
          </div>

          {igSelected && (
            <div style={card}>
              <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10 }}><FaInstagram style={{ color:"#E1306C", fontSize:15 }}/><span style={{ fontSize:12, color:th.text2 }}>{L("Instagram publishes as","ينشر على إنستغرام كـ")}</span></div>
              <div style={{ display:"flex", gap:4, background:th.card2, border:`1px solid ${th.border}`, borderRadius:10, padding:3, width:"fit-content" }}>
                {[["feed",L("Feed post","منشور")],["reel",L("Reel","ريل")],["story",L("Story","ستوري")]].map(([k,t])=>(
                  <button key={k} onClick={()=>setIgFormat(k)} style={{ padding:"6px 14px", borderRadius:8, border:"none", background:igFormat===k?th.gradient:"transparent", color:igFormat===k?"#fff":th.text2, fontSize:11.5, fontWeight:igFormat===k?600:400, cursor:"pointer" }}>{t}</button>
                ))}
              </div>
              {igFormat==="story" && <div style={{ marginTop:10, fontSize:11, color:th.text2, lineHeight:1.5, display:"flex", gap:7, alignItems:"flex-start" }}><Info size={13} style={{ color:th.accent, flexShrink:0, marginTop:1 }}/>{L("Stories publish as a single photo or video and disappear after 24 hours. Caption, alt text and carousel don't apply on Instagram Stories.","تُنشر القصص كصورة أو فيديو واحد وتختفي بعد ٢٤ ساعة. النص والنص البديل والكاروسيل لا تنطبق على قصص إنستغرام.")}</div>}
              {igFormat==="reel" && <div style={{ marginTop:10, fontSize:11, color:th.text2, lineHeight:1.5, display:"flex", gap:7, alignItems:"flex-start" }}><Info size={13} style={{ color:th.accent, flexShrink:0, marginTop:1 }}/>{L("Reels use your video and caption. Alt text doesn't apply to Reels.","تستخدم الريلز الفيديو والنص. النص البديل لا ينطبق على الريلز.")}</div>}
            </div>
          )}

          <div style={card}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:9 }}>
              <div style={{ fontSize:12, color:th.text2 }}>{L("Caption","النص")}</div>
              <div style={{ display:"flex", gap:7, alignItems:"center" }}>
                {firstImg?.url && <button onClick={readImage} disabled={visionBusy} style={{ display:"flex", alignItems:"center", gap:5, fontSize:11, color:th.accent, background:th.accentSoft, border:`1px solid ${th.accent}55`, borderRadius:8, padding:"5px 11px", cursor:"pointer", opacity:visionBusy?0.6:1 }}><ScanLine size={12}/>{visionBusy?L("Reading…","قراءة…"):L("Read the image","اقرأ الصورة")}</button>}
                <button onClick={()=>setShowAI(!showAI)} style={{ display:"flex", alignItems:"center", gap:5, fontSize:11, color:"#fff", background:th.gradient, border:"none", borderRadius:8, padding:"5px 11px", cursor:"pointer" }}><Sparkles size={12}/>{L("AI write","كتابة ذكية")}</button>
              </div>
            </div>
            {showAI && (
              <div style={{ background:th.card2, border:`1px solid ${th.border}`, borderRadius:12, padding:13, marginBottom:11 }}>
                <input value={aiTopic} onChange={e=>setAiTopic(e.target.value)} placeholder="What's the post about?" style={{ ...inp, marginBottom:8 }}/>
                <div style={{ display:"flex", gap:8, marginBottom:8 }}>
                  <select value={aiTone} onChange={e=>setAiTone(e.target.value)} style={{ ...inp, flex:1 }}>
                    <option value="engaging and professional">Engaging &amp; professional</option>
                    <option value="fun and casual">Fun &amp; casual</option>
                    <option value="luxury and premium">Luxury &amp; premium</option>
                    <option value="urgent and promotional">Urgent &amp; promotional</option>
                    <option value="informative and educational">Informative</option>
                  </select>
                  <input value={aiAudience} onChange={e=>setAiAudience(e.target.value)} placeholder="Audience (optional)" style={{ ...inp, flex:1 }}/>
                </div>
                <input value={aiDetails} onChange={e=>setAiDetails(e.target.value)} placeholder="Key points / call-to-action (optional)" style={{ ...inp, marginBottom:9 }}/>
                <div style={{ display:"flex", alignItems:"center", gap:8, justifyContent:"space-between" }}>
                  <div style={{ display:"flex", gap:4, background:th.card, border:`1px solid ${th.border}`, borderRadius:9, padding:3 }}>
                    {[["en","English"],["ar","العربية"],["both","Both"]].map(([k,t])=>(
                      <button key={k} onClick={()=>setAiLang(k)} style={{ padding:"6px 12px", borderRadius:7, border:"none", background:aiLang===k?th.gradient:"transparent", color:aiLang===k?"#fff":th.text2, fontSize:11, fontWeight:aiLang===k?600:400, cursor:"pointer" }}>{t}</button>
                    ))}
                  </div>
                  <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                    {isTrialUser(userEmail) && <span style={{ fontSize:10.5, fontWeight:600, color:Math.max(0,TRIAL.ai-aiUsesOf(userEmail))<=1?th.warning:th.text2 }}>{Math.max(0,TRIAL.ai-aiUsesOf(userEmail))} of {TRIAL.ai} free AI left</span>}
                    <button onClick={generateCaption} disabled={aiLoading||!aiTopic.trim()} style={{ padding:"9px 16px", borderRadius:9, background:th.accent, border:"none", color:"#fff", fontSize:12, fontWeight:600, cursor:"pointer", opacity:(aiLoading||!aiTopic.trim())?0.6:1 }}>{aiLoading?"Writing…":"Generate"}</button>
                  </div>
                </div>
                {aiResult && !aiResult.error && (
                  <div style={{ marginTop:11, background:th.card, border:`1px solid ${th.border}`, borderRadius:10, padding:12 }}>
                    {aiResult.english && <><div style={{ fontSize:10, color:th.text2, marginBottom:4 }}>ENGLISH</div><div style={{ fontSize:12.5, lineHeight:1.6, marginBottom:8 }}>{aiResult.english}</div></>}
                    {aiResult.arabic && <><div style={{ fontSize:10, color:th.text2, marginBottom:4 }}>العربية</div><div style={{ fontSize:13, lineHeight:1.7, direction:"rtl", textAlign:"right", marginBottom:9 }}>{aiResult.arabic}</div></>}
                    <div style={{ display:"flex", gap:7 }}>
                      {aiResult.english && <button onClick={()=>setCaption(aiResult.english)} style={{ flex:1, padding:"7px", borderRadius:8, background:th.card2, border:`1px solid ${th.border}`, color:th.text, fontSize:11, cursor:"pointer" }}>Use English</button>}
                      {aiResult.arabic && <button onClick={()=>setCaption(aiResult.arabic)} style={{ flex:1, padding:"7px", borderRadius:8, background:th.card2, border:`1px solid ${th.border}`, color:th.text, fontSize:11, cursor:"pointer" }}>Use Arabic</button>}
                      {aiResult.english && aiResult.arabic && <button onClick={()=>setCaption(aiResult.english+"\n\n"+aiResult.arabic)} style={{ flex:1, padding:"7px", borderRadius:8, background:th.accentSoft, border:`1px solid ${th.accent}`, color:th.accent, fontSize:11, cursor:"pointer" }}>Use both</button>}
                      {(aiResult.english||aiResult.arabic) && <button onClick={()=>{ try{ navigator.clipboard.writeText([aiResult.english,aiResult.arabic].filter(Boolean).join("\n\n")); }catch(e){} }} title="Copy to clipboard" style={{ flex:1, padding:"7px", borderRadius:8, background:th.card2, border:`1px solid ${th.border}`, color:th.text2, fontSize:11, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:5 }}><Copy size={12}/>Copy</button>}
                    </div>
                  </div>
                )}
                {aiResult && aiResult.error && <div style={{ marginTop:9, fontSize:11, color:th.danger }}>{aiResult.error}</div>}
              </div>
            )}
            <textarea value={caption} onChange={e=>setCaption(e.target.value)} placeholder="Write your caption…" rows={4} style={{ ...inp, resize:"vertical", lineHeight:1.6, fontSize:13 }}/>
            <div style={{ display:"flex", justifyContent:"flex-end", alignItems:"center", marginTop:7 }}>
              <span style={{ fontSize:11, color:th.text3 }}><span className="tw-num">{caption.length}</span> / <span className="tw-num">2200</span></span>
            </div>
          </div>

          <div style={card}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}><div style={{ fontSize:12, color:th.text2 }}>Media</div>{detected && <span style={{ fontSize:10.5, color:th.accent, background:th.accentSoft, borderRadius:8, padding:"2px 8px" }}>{detected}</span>}</div>
            {!video && images.length < 10 && (
              <div onDragOver={e=>{e.preventDefault();setDragOver(true);}} onDragLeave={()=>setDragOver(false)} onDrop={e=>{e.preventDefault();setDragOver(false);handleUpload(e.dataTransfer.files);}} onClick={()=>document.getElementById('pub-file').click()}
                style={{ border:`1.5px dashed ${dragOver?th.accent:th.border}`, borderRadius:12, padding:"20px", textAlign:"center", cursor:"pointer", background:dragOver?th.accentSoft:"transparent", marginBottom:media.length?12:0 }}>
                <input type="file" id="pub-file" accept="image/*,video/*" multiple style={{ display:"none" }} onChange={e=>handleUpload(e.target.files)}/>
                <Image size={22} color={th.accent}/>
                <div style={{ fontSize:12.5, fontWeight:500, marginTop:6 }}>{L("Drag & drop or click to upload","اسحب وأفلت أو اضغط للرفع")}</div>
                <div style={{ fontSize:10.5, color:th.text2, marginTop:3, lineHeight:1.5 }}>{L("Add several photos and they become a swipeable carousel — each one gets its own alt text. Drop a video for a Reel.","أضف عدة صور لتتحول إلى كاروسيل قابل للتمرير — لكل صورة نصها البديل. أضف فيديو للريلز.")}</div>
              </div>
            )}
            {media.length > 0 && (
              <div style={{ display:"flex", gap:9, flexWrap:"wrap" }}>
                {media.map((m,i)=>{
                  const isImg = m.type==="image";
                  const isSel = showAlt && isImg && effSlide===m.id;
                  const hasAlt = isImg && (m.alt||"").trim();
                  return (
                  <div key={m.id} onClick={()=>{ if(showAlt && isImg) setSelectedSlide(m.id); }} style={{ position:"relative", width:72, height:72, borderRadius:11, overflow:"hidden", background:th.card2, border:`1px solid ${th.border}`, cursor:(showAlt&&isImg)?"pointer":"default", boxShadow:isSel?`0 0 0 2px ${th.accent}`:"none" }}>
                    {m.url && isImg && <img src={m.url} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }}/>}
                    {m.type==="video" && <div style={{ width:"100%", height:"100%", background:th.gradient, display:"flex", alignItems:"center", justifyContent:"center", color:"#fff" }}><Send size={18}/></div>}
                    {m.uploading && <div style={{ position:"absolute", inset:0, background:"rgba(0,0,0,0.5)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:9, color:"#fff" }}>…</div>}
                    {isImg && images.length>1 && <span style={{ position:"absolute", bottom:4, left:4, background:"rgba(0,0,0,0.6)", borderRadius:6, width:16, height:16, display:"flex", alignItems:"center", justifyContent:"center", fontSize:9, color:"#fff" }} className="tw-num">{i+1}</span>}
                    {showAlt && isImg && <span title={hasAlt?"Alt text added":"Needs alt text"} style={{ position:"absolute", top:4, left:4, width:16, height:16, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", background:hasAlt?"#2E8B6B":"rgba(0,0,0,0.55)", color:"#fff", border:`1.5px solid ${th.card}` }}>{hasAlt?<Check size={9}/>:<span style={{fontSize:9,fontWeight:700}}>!</span>}</span>}
                    <span onClick={(e)=>{e.stopPropagation();removeMedia(m.id);}} style={{ position:"absolute", top:4, right:4, cursor:"pointer", color:"#fff", display:"flex" }}><XCircle size={15}/></span>
                  </div>
                ); })}
              </div>
            )}
            {mediaWarning && <div style={{ fontSize:11, color:th.danger, marginTop:8 }}>{mediaWarning}</div>}
          </div>

          {showAlt && (
            <div style={card}>
              <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10, flexWrap:"wrap" }}>
                <div style={{ fontSize:12, color:th.text2 }}>{L("Alt text","النص البديل")}</div>
                <span style={{ display:"inline-flex", alignItems:"center", gap:4, fontSize:9.5, fontWeight:700, color:"#E1306C", background:"#E1306C18", borderRadius:5, padding:"2px 7px" }}><FaInstagram style={{ fontSize:11 }}/>INSTAGRAM</span>
                {images.length>1 && <span style={{ fontSize:9.5, fontWeight:700, color:th.accent, background:th.accentSoft, borderRadius:5, padding:"2px 7px" }}>{L("SLIDE","شريحة")} <span className="tw-num">{images.findIndex(m=>m.id===effSlide)+1}</span></span>}
                <span style={{ marginLeft:"auto", fontSize:10.5, color:altDone===images.length?th.success:th.text3 }}><span className="tw-num">{altDone}</span>/<span className="tw-num">{images.length}</span> {L("described","موصوفة")}</span>
                {images.length>1 && <button onClick={generateAllAlt} disabled={altBusy!==null} style={{ display:"flex", alignItems:"center", gap:5, fontSize:10.5, fontWeight:600, color:th.accent, background:"transparent", border:`1px solid ${th.border}`, borderRadius:8, padding:"5px 10px", cursor:"pointer", opacity:altBusy!==null?0.6:1 }}><Sparkles size={11}/>{altBusy==='all'?L("Writing…","كتابة…"):L("Generate all","توليد الكل")}</button>}
              </div>
              {images.length>1 && <div style={{ fontSize:10.5, color:th.text3, marginBottom:8 }}>{L("Tap a slide above to describe it. Each carousel image keeps its own alt text.","اضغط على شريحة بالأعلى لوصفها. كل صورة في الكاروسيل لها نصها البديل.")}</div>}
              <div style={{ position:"relative" }}>
                <textarea value={images.find(m=>m.id===effSlide)?.alt || ""} onChange={e=>setAlt(effSlide, e.target.value)} placeholder={L("Describe this image for people using screen readers…","صف هذه الصورة لمستخدمي قارئات الشاشة…")} rows={2} style={{ ...inp, resize:"vertical", lineHeight:1.5, paddingRight:108 }}/>
                <button onClick={()=>generateAlt(effSlide)} disabled={altBusy!==null || !images.find(m=>m.id===effSlide)?.url} style={{ position:"absolute", top:8, right:8, display:"flex", alignItems:"center", gap:5, fontSize:10.5, fontWeight:600, color:"#fff", background:th.accent, border:"none", borderRadius:7, padding:"6px 10px", cursor:"pointer", opacity:altBusy!==null?0.6:1 }}><Sparkles size={11}/>{altBusy===effSlide?L("…","…"):L("Generate","توليد")}</button>
              </div>
              <div style={{ fontSize:9.5, color:th.text3, marginTop:7, display:"flex", alignItems:"center", gap:5 }}><Info size={11}/>{L("Helps accessibility and reach. Hidden automatically on Reels and Stories.","يحسّن الوصول والانتشار. يُخفى تلقائياً في الريلز والقصص.")}</div>
            </div>
          )}

          <div style={card}>
            <div style={lbl}><MessageCircle size={13} style={{ verticalAlign:-2, marginRight:5 }}/>First comment <span style={{ color:th.text3 }}>(optional &middot; great for hashtags)</span></div>
            <input value={firstComment} onChange={e=>setFirstComment(e.target.value)} placeholder="#hashtags posted as the first comment…" style={inp}/>
          </div>

          <div style={card}>
            <div style={lbl}>When to post</div>
            <div style={{ display:"flex", gap:8, marginBottom:scheduleType==="schedule"?12:0 }}>
              {[["now","Now",Send],["schedule","Schedule",Calendar]].map(([k,t,Ic])=>(
                <button key={k} onClick={()=>setScheduleType(k)} style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", gap:6, padding:"9px", borderRadius:10, border:`1.5px solid ${scheduleType===k?th.accent:th.border}`, background:scheduleType===k?th.accentSoft:th.card2, color:scheduleType===k?th.accent:th.text2, fontSize:12, fontWeight:scheduleType===k?600:400, cursor:"pointer" }}><Ic size={13}/>{t}</button>
              ))}
            </div>
            {scheduleType==="schedule" && (
              <div>
                <div style={{ display:"flex", gap:10, marginBottom:13 }}>
                  <div style={{ flex:1 }}><div style={{ fontSize:10.5, color:th.text2, marginBottom:5 }}>Date</div><input type="date" value={scheduleDate} onChange={e=>setScheduleDate(e.target.value)} style={{ ...inp }}/></div>
                  <div style={{ flex:1 }}><div style={{ fontSize:10.5, color:th.text2, marginBottom:5 }}>Time</div><input type="time" value={scheduleTime} onChange={e=>setScheduleTime(e.target.value)} style={{ ...inp }}/></div>
                </div>
                <div style={{ fontSize:11, color:th.text2, marginBottom:8, display:"flex", alignItems:"center", gap:6 }}><Sparkles size={12} color={th.accent}/>Best times to post on {(PLAT[primaryPlat]||{}).name || "Instagram"}</div>
                <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                  {bestSlots.map((bs,i)=>{ const active = scheduleDate===bs.dateStr && scheduleTime===bs.time; return (
                    <button key={i} onClick={()=>{ setScheduleDate(bs.dateStr); setScheduleTime(bs.time); }} style={{ display:"flex", flexDirection:"column", alignItems:"flex-start", gap:2, padding:"8px 13px", borderRadius:11, border:`1.5px solid ${active?th.accent:th.border}`, background:active?th.accentSoft:th.card2, cursor:"pointer", minWidth:96 }}>
                      <span style={{ fontSize:11.5, fontWeight:600, color:active?th.accent:th.text }}>{bs.when}</span>
                      <span style={{ fontSize:9.5, color:th.text2 }}>{bs.blab}</span>
                    </button>
                  ); })}
                </div>
                <div style={{ fontSize:9.5, color:th.text3, marginTop:8 }}>{L("Based on typical engagement windows","مبني على أوقات التفاعل المعتادة")} &middot; {L("adjusts to your selected platform","يتكيّف مع المنصة المختارة")}</div>
              </div>
            )}
          </div>

          {results.length>0 && <div>{results.map((r,i)=><div key={i} style={{ padding:"10px 13px", borderRadius:10, background:r.success?th.successSoft:th.dangerSoft, color:r.success?th.success:th.danger, fontSize:12.5, marginBottom:8, display:"flex", alignItems:"center", gap:8 }}>{r.success?<CheckCircle size={14}/>:<XCircle size={14}/>}<span><b>{r.account}</b>: {r.success?(scheduleType==="schedule"?"Scheduled":"Posted"):r.error}</span>{r.success&&r.permalink&&<a href={r.permalink} target="_blank" rel="noreferrer" style={{ marginLeft:"auto", color:th.success, fontWeight:600, textDecoration:"none", display:"flex", alignItems:"center", gap:4 }}>View post <ArrowUpRight size={13}/></a>}</div>)}</div>}

          <div style={{ display:"flex", gap:10 }}>
            <button onClick={saveDraft} disabled={!caption.trim()} style={{ flex:1, padding:"12px", borderRadius:12, background:th.card2, border:`1px solid ${th.border}`, color:th.text, fontSize:13, cursor:"pointer", opacity:caption.trim()?1:0.5, display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}><Bookmark size={14}/>{editingDraftId?L("Update draft","تحديث المسودة"):L("Save draft","حفظ كمسودة")}</button>
            <button onClick={handlePost} disabled={posting||!caption.trim()||selectedAccounts.length===0} style={{ flex:1.6, padding:"12px", borderRadius:12, background:th.gradient, border:"none", color:"#fff", fontSize:13, fontWeight:600, cursor:"pointer", opacity:(posting||!caption.trim()||selectedAccounts.length===0)?0.5:1, display:"flex", alignItems:"center", justifyContent:"center", gap:7 }}>{posting?L("Working…","جارٍ العمل…"):scheduleType==="schedule"?<><Clock size={15}/>{L("Schedule","جدولة")}</>:<><Send size={15}/>{L("Publish now","انشر الآن")}</>}</button>
          </div>
        </div>

        <div style={{ position:"sticky", top:0 }}>
          <div style={{ fontSize:10.5, color:th.text3, fontWeight:600, textTransform:"uppercase", letterSpacing:0.6, marginBottom:8 }}>{L("Live preview","معاينة مباشرة")}</div>
          <div style={{ display:"flex", gap:4, background:th.card, border:`1px solid ${th.border}`, borderRadius:999, padding:3, marginBottom:12 }}>
            {previewTabs.map(([k,lab,Ic])=>(
              <button key={k} onClick={()=>setPreviewPlatform(k)} style={{ flex:effPreviewPlat===k?2:1, padding:"7px 4px", borderRadius:999, border:"none", background:effPreviewPlat===k?th.gradient:"transparent", color:effPreviewPlat===k?"#fff":th.text2, fontSize:10.5, fontWeight:600, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:5, transition:"flex 0.2s" }}><Ic style={{ fontSize:13 }}/>{effPreviewPlat===k && <span>{lab}</span>}</button>
            ))}
          </div>

          {(() => {
            const brand = previewAccount?.account_name || selClient?.name || "Your brand";
            const handle = (previewAccount?.username || previewAccount?.account_name || selClient?.name || "yourbrand").toLowerCase().replace(/\s+/g,"");
            const av = (brand[0] || "T").toUpperCase();
            const pic = previewAccount?.picture || null;
            const hasCap = !!caption;
            const cap = caption || "Your caption will appear here as you type…";
            const capCol = hasCap ? "#1a1a1a" : "#aab2bd";
            const grey = "#65676b";
            const isStory = (igFormat === "story" || igFormat === "reel") && effPreviewPlat === "ig";
            const avatar = (s) => pic
              ? <img src={pic} alt="" style={{ width:s, height:s, borderRadius:"50%", objectFit:"cover", flexShrink:0 }}/>
              : <div style={{ width:s, height:s, borderRadius:"50%", background:"linear-gradient(135deg,#6E8CAB,#4F6B8C)", display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontSize:s*0.42, fontWeight:700, flexShrink:0 }}>{av}</div>;
            const media = (radius) => (
              <div style={{ position:"relative", height:isStory?330:210, background:firstImg?"#000":"#eef0f3", display:"flex", alignItems:"center", justifyContent:"center", color:"#9aa3ad", borderRadius:radius||0, overflow:"hidden" }}>
                {firstImg ? <img src={firstImg.url} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }}/> : <div style={{ textAlign:"center" }}>{video ? <Send size={24}/> : <Image size={24}/>}<div style={{ fontSize:10, marginTop:6 }}>{video ? "Video" : "Add media →"}</div></div>}
                {images.length>1 && <><span style={{ position:"absolute", top:10, right:10, background:"rgba(0,0,0,0.55)", borderRadius:8, padding:"2px 8px", fontSize:10, color:"#fff" }}>1/{images.length}</span><div style={{ position:"absolute", bottom:10, left:"50%", transform:"translateX(-50%)", display:"flex", gap:5 }}>{images.map((m,i)=><span key={m.id} style={{ width:6, height:6, borderRadius:"50%", background:i===0?"#fff":"rgba(255,255,255,0.45)" }}/>)}</div></>}
              </div>
            );
            const shell = { background:"#fff", color:"#1a1a1a", borderRadius:16, overflow:"hidden", boxShadow:"0 18px 44px rgba(0,0,0,0.5)", fontFamily:"'Plus Jakarta Sans',system-ui,sans-serif" };

            if (effPreviewPlat === "ig" && igFormat === "story") {
              // Story preview — full-bleed media, progress bar, avatar overlay, no caption/likes.
              return (
                <div style={{ ...shell, background:"#000", position:"relative", aspectRatio:"9/16", maxHeight:430 }}>
                  <div style={{ position:"absolute", inset:0 }}>
                    {firstImg ? <img src={firstImg.url} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }}/> : <div style={{ width:"100%", height:"100%", background:"linear-gradient(160deg,#2a2f3a,#11141b)", display:"flex", alignItems:"center", justifyContent:"center", color:"#7a8494", flexDirection:"column", gap:8 }}>{video?<Send size={26}/>:<Image size={26}/>}<div style={{ fontSize:11 }}>{video?"Video story":"Add a photo or video"}</div></div>}
                  </div>
                  <div style={{ position:"absolute", top:10, left:10, right:10, height:2.5, borderRadius:2, background:"rgba(255,255,255,0.35)", overflow:"hidden" }}><div style={{ width:"38%", height:"100%", background:"#fff" }}/></div>
                  <div style={{ position:"absolute", top:20, left:10, right:10, display:"flex", alignItems:"center", gap:8 }}>
                    <div style={{ padding:2, borderRadius:"50%", background:"linear-gradient(135deg,#f58529,#dd2a7b,#8134af)" }}>{avatar(26)}</div>
                    <div style={{ fontSize:12, fontWeight:600, color:"#fff", textShadow:"0 1px 3px rgba(0,0,0,0.6)" }}>{handle}</div>
                    <div style={{ fontSize:11, color:"rgba(255,255,255,0.8)", textShadow:"0 1px 3px rgba(0,0,0,0.6)" }}>now</div>
                    <MoreHorizontal size={16} color="#fff" style={{ marginLeft:"auto" }}/>
                  </div>
                  <div style={{ position:"absolute", bottom:12, left:12, right:12, display:"flex", alignItems:"center", gap:10 }}>
                    <div style={{ flex:1, border:"1px solid rgba(255,255,255,0.6)", borderRadius:999, padding:"8px 14px", color:"rgba(255,255,255,0.85)", fontSize:11.5 }}>Send message</div>
                    <Heart size={20} color="#fff"/><Send size={20} color="#fff"/>
                  </div>
                </div>
              );
            }
            if (effPreviewPlat === "ig") {
              return (
                <div style={shell}>
                  <div style={{ display:"flex", alignItems:"center", gap:9, padding:"10px 12px" }}>{avatar(30)}<div style={{ fontSize:12.5, fontWeight:600 }}>{handle}</div>{igFormat==="reel" && <span style={{ fontSize:10, color:grey, marginLeft:6 }}>· Reel</span>}<MoreHorizontal size={16} style={{ marginLeft:"auto" }}/></div>
                  {media()}
                  <div style={{ padding:"9px 12px" }}>
                    <div style={{ display:"flex", gap:14, marginBottom:8 }}><Heart size={20}/><MessageCircle size={20}/><Send size={20}/><Bookmark size={20} style={{ marginLeft:"auto" }}/></div>
                    <div style={{ fontWeight:600, fontSize:12, marginBottom:4 }}><span className="tw-num">1,248</span> likes</div>
                    <div style={{ fontSize:12, lineHeight:1.5, whiteSpace:"pre-wrap", wordBreak:"break-word", color:capCol }}><span style={{ fontWeight:600, color:"#1a1a1a" }}>{handle}</span> {cap}</div>
                  </div>
                </div>
              );
            }
            if (effPreviewPlat === "fb") {
              return (
                <div style={shell}>
                  <div style={{ display:"flex", alignItems:"center", gap:9, padding:"11px 12px" }}>{avatar(38)}<div><div style={{ fontSize:13, fontWeight:700 }}>{brand}</div><div style={{ fontSize:10.5, color:grey, display:"flex", alignItems:"center", gap:4 }}>Just now <Globe size={9}/></div></div><MoreHorizontal size={16} style={{ marginLeft:"auto", color:grey }}/></div>
                  <div style={{ padding:"0 12px 10px", fontSize:12.5, lineHeight:1.5, whiteSpace:"pre-wrap", wordBreak:"break-word", color:capCol }}>{cap}</div>
                  {media()}
                  <div style={{ display:"flex", borderTop:"1px solid #e4e6eb" }}>{[["Like",Heart],["Comment",MessageCircle],["Share",Send]].map(([l,Ic])=>(<div key={l} style={{ flex:1, padding:"9px 0", display:"flex", alignItems:"center", justifyContent:"center", gap:6, color:grey, fontSize:12, fontWeight:600 }}><Ic size={16}/>{l}</div>))}</div>
                </div>
              );
            }
            if (effPreviewPlat === "li") {
              return (
                <div style={shell}>
                  <div style={{ display:"flex", alignItems:"center", gap:9, padding:"11px 12px" }}>{avatar(40)}<div><div style={{ fontSize:13, fontWeight:700 }}>{brand}</div><div style={{ fontSize:10.5, color:grey }}>Social media management</div><div style={{ fontSize:10, color:grey, display:"flex", alignItems:"center", gap:4 }}>Just now <Globe size={9}/></div></div></div>
                  <div style={{ padding:"2px 12px 10px", fontSize:12.5, lineHeight:1.5, whiteSpace:"pre-wrap", wordBreak:"break-word", color:capCol }}>{cap}</div>
                  {media()}
                  <div style={{ display:"flex", borderTop:"1px solid #e4e6eb" }}>{[["Like",Heart],["Comment",MessageCircle],["Repost",Send],["Send",Bookmark]].map(([l,Ic],i)=>(<div key={i} style={{ flex:1, padding:"9px 0", display:"flex", alignItems:"center", justifyContent:"center", gap:5, color:grey, fontSize:11.5, fontWeight:600 }}><Ic size={15}/>{l}</div>))}</div>
                </div>
              );
            }
            // X / Twitter
            return (
              <div style={shell}>
                <div style={{ display:"flex", gap:10, padding:"12px" }}>
                  {avatar(40)}
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:12.5 }}><span style={{ fontWeight:700 }}>{brand}</span> <span style={{ color:grey }}>@{handle} · now</span></div>
                    <div style={{ fontSize:13, lineHeight:1.5, whiteSpace:"pre-wrap", wordBreak:"break-word", color:capCol, margin:"3px 0 9px" }}>{cap}</div>
                    {media(14)}
                    <div style={{ display:"flex", justifyContent:"space-between", marginTop:10, color:grey, fontSize:12 }}><span style={{ display:"flex", alignItems:"center", gap:5 }}><MessageCircle size={15}/>24</span><span style={{ display:"flex", alignItems:"center", gap:5 }}><Send size={15}/>112</span><span style={{ display:"flex", alignItems:"center", gap:5 }}><Heart size={15}/>843</span><span style={{ display:"flex", alignItems:"center", gap:5 }}><Eye size={15}/>12k</span></div>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      </div>
      )}
    </div>
  );
}

function SocialAccountsPage() {
  const { selClient, userEmail, setPage } = useApp();
  const th = useTheme();
  const META_APP_ID = process.env.REACT_APP_META_APP_ID || "1652475822681144";
  const LINKEDIN_CLIENT_ID = process.env.REACT_APP_LINKEDIN_CLIENT_ID || "";
  const [upgrade, setUpgrade] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [realClientId, setRealClientId] = useState(null);
  const [liOptions, setLiOptions] = useState(null);

  // Trial cap: limit connected accounts. Returns false (and prompts upgrade) when at the cap.
  const guardConnect = () => {
    if (isTrialUser(userEmail) && accounts.length >= TRIAL.accounts) {
      setUpgrade({ title:`Trial limit: ${TRIAL.accounts} connected accounts`, detail:`Your free trial lets you connect up to ${TRIAL.accounts} social accounts so you can feel the multi-account workflow. Upgrade to connect unlimited accounts across all your brands.`, Icon:Plus });
      return false;
    }
    return true;
  };

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
      setError(friendlyConnectError(igError));
      window.history.replaceState({}, '', '/social');
    } else if (igCode && realClientId) {
      handleInstagramCallback(igCode);
    }
  }, [realClientId]);

  // Handle LinkedIn OAuth callback redirect
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const liCode = params.get('li_code');
    const liError = params.get('li_error');
    if (liError) { setError(friendlyConnectError(liError)); window.history.replaceState({}, '', '/social'); }
    else if (liCode && realClientId) { handleLinkedinCallback(liCode); }
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

  const resolveClientId = async (preferred) => {
    if (preferred && preferred !== 'null') return preferred;
    if (realClientId) return realClientId;
    try {
      if (selClient?.name) {
        const { data } = await supabase.from('clients').select('id').eq('name', selClient.name).limit(1);
        if (data && data[0]) return data[0].id;
      }
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase.from('clients').select('id').eq('owner_id', user.id).order('created_at', { ascending: true }).limit(1);
        if (data && data[0]) return data[0].id;
      }
    } catch (e) { /* ignore */ }
    return null;
  };

  const connectInstagram = () => {
    if (!guardConnect()) return;
    const redirectUri = `https://tawaslo.com/api/instagram-oauth`;
    const IG_APP_ID = '3569589083219608';
    // Full scope: basic + publish + insights (analytics) + comments & messages (Inbox).
    // The earlier "couldn't connect" error was the tester/dev-role issue, not these scopes,
    // and the app's "Manage messaging & content" use case is configured — so these are safe.
    const scope = 'instagram_business_basic,instagram_business_content_publish,instagram_business_manage_insights,instagram_business_manage_comments,instagram_business_manage_messages';
    // Store current page so callback can return here
    if (realClientId) sessionStorage.setItem('ig_redirect_client', realClientId);
    // Exact format from Meta's OAuth Authorize reference — client_id, redirect_uri,
    // response_type, scope only. (Dropped the non-standard force_reauth param, which can
    // make Instagram fall back to a plain login instead of showing the consent screen.)
    const authUrl = `https://www.instagram.com/oauth/authorize?client_id=${IG_APP_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent(scope)}`;
    window.location.href = authUrl;
  };

  // Turn raw platform/API errors into calm, branded guidance — never show a raw error string.
  const friendlyConnectError = (msg) => {
    const m = String(msg || '').toLowerCase();
    if (m.includes('not available') || m.includes('development mode') || m.includes('app not active') || m.includes('isn\'t active'))
      return "This account isn't enabled for Tawaslo yet. Make sure it's a Business or Creator account linked to a Facebook Page, then try again. Need a hand? support@tawaslo.com";
    if (m.includes('nonexisting field') || m.includes('no instagram') || m.includes('no business') || m.includes('not linked') || m.includes('no pages'))
      return "We couldn't find a Business Instagram account linked to a Facebook Page on this login. Switch the account to Business or Creator and link it to a Page, then reconnect.";
    if (m.includes('permission') || m.includes('scope') || m.includes('denied'))
      return "Some permissions weren't granted. Please reconnect and accept all of the requested permissions so we can manage the account for you.";
    if (m.includes('token') || m.includes('expired') || m.includes('session'))
      return "Your session with the platform expired. Please reconnect to continue.";
    return "We couldn't connect that account just now. Make sure it's a Business or Creator account linked to a Facebook Page, then try again. Need a hand? support@tawaslo.com";
  };

  const handleInstagramCallback = async (code) => {
    const redirectUri = `https://tawaslo.com/api/instagram-oauth`;
    const storedId = sessionStorage.getItem('ig_redirect_client');
    sessionStorage.removeItem('ig_redirect_client');
    setConnecting(true);
    const clientId = await resolveClientId(storedId);
    if (!clientId) { setError('Could not find your workspace to save the account. Refresh and try again.'); setConnecting(false); return; }
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
      setError(friendlyConnectError(err.message));
    }
    setConnecting(false);
    // Clean URL
    window.history.replaceState({}, '', '/social');
  };

  const connectMeta = () => {
    if (!guardConnect()) return;
    const redirectUri = `https://tawaslo.com/api/meta-oauth`;
    const scope = [
      "pages_show_list",
      "pages_read_engagement",
      "pages_manage_posts",
      "business_management",
      "public_profile",
      "instagram_basic",
      "instagram_content_publish",
      "instagram_manage_insights",
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

          const clientId = await resolveClientId(realClientId);
          if (!clientId) { setError('Could not find your workspace to save accounts. Refresh and try again.'); setConnecting(false); return; }

          // Save each account to Supabase
          let saveErrors = [];
          for (const acc of data.accounts) {
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
            if (upsertErr) saveErrors.push(upsertErr.message);
          }

          if (saveErrors.length > 0) {
            setError(friendlyConnectError(saveErrors.join('; ')));
            setConnecting(false);
            return;
          }

          setSuccess(`Connected ${data.accounts.length} account(s) successfully!`);
          setConnecting(false);
          loadAccounts(clientId);
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

  const connectLiAccount = async (acc) => {
    const storedId = sessionStorage.getItem('li_redirect_client');
    sessionStorage.removeItem('li_redirect_client');
    const clientId = await resolveClientId(storedId);
    if (!clientId) { setError('Could not find your workspace to save the account. Refresh and try again.'); return; }
    const { error: upsertErr } = await supabase.from('social_accounts').upsert({
      client_id: clientId, platform: 'li', account_id: acc.account_id, account_name: acc.account_name,
      username: acc.username || null, access_token: acc.access_token, picture: acc.picture || null,
      followers_count: acc.followers_count || 0, is_active: true,
    }, { onConflict: 'client_id,account_id' });
    if (upsertErr) { setError(friendlyConnectError(upsertErr.message)); return; }
    setSuccess(`LinkedIn ${acc.kind === 'organization' ? 'Page' : 'profile'} "${acc.account_name}" connected!`);
    setLiOptions(null);
    loadAccounts(clientId);
  };

  const handleLinkedinCallback = async (code) => {
    const redirectUri = `https://tawaslo.com/api/linkedin-oauth`;
    setConnecting(true);
    try {
      const res = await fetch('/api/linkedin-oauth', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code, redirectUri }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      const opts = [];
      if (data.member) opts.push(data.member);
      (data.organizations || []).forEach(o => opts.push(o));
      if (opts.length === 1) await connectLiAccount(opts[0]);
      else if (opts.length > 1) setLiOptions(opts);
      else setError('No LinkedIn profile or Pages found to connect.');
    } catch (err) { setError(friendlyConnectError(err.message)); }
    setConnecting(false);
    window.history.replaceState({}, '', '/social');
  };

  const connectLinkedin = () => {
    if (!guardConnect()) return;
    if (!LINKEDIN_CLIENT_ID) { setError("LinkedIn isn't available yet. We're finishing its setup and it will be ready soon."); return; }
    const redirectUri = `https://tawaslo.com/api/linkedin-oauth`;
    const scope = 'openid profile email w_member_social r_organization_admin w_organization_social';
    if (realClientId) sessionStorage.setItem('li_redirect_client', realClientId);
    const authUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${LINKEDIN_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope)}&state=tawaslo`;
    window.location.href = authUrl;
  };

  const platformInfo = {
    ig: { name: "Instagram", color: "#E1306C", bg: "rgba(225,48,108,0.1)", Icon: FaInstagram },
    fb: { name: "Facebook",  color: "#1877F2", bg: "rgba(24,119,242,0.1)", Icon: FaFacebook  },
    li: { name: "LinkedIn",  color: "#0A66C2", bg: "rgba(10,102,194,0.1)", Icon: FaLinkedin  },
  };

  const NETWORKS = [
    { key:'ig', name:'Instagram', desc:'Business or creator', color:'#E1306C', Icon:FaInstagram, onConnect:connectInstagram, live:true },
    { key:'fb', name:'Facebook', desc:'Pages', color:'#1877F2', Icon:FaFacebook, onConnect:connectMeta, live:true },
    { key:'li', name:'LinkedIn', desc:'Profile & company Pages', color:'#0A66C2', Icon:FaLinkedin, onConnect:connectLinkedin, live:true },
    { key:'tw', name:'X', desc:'Coming soon', color:'#8A93A6', Icon:FaTwitter, live:false },
    { key:'tt', name:'TikTok', desc:'Coming soon', color:'#8A93A6', Icon:FaTiktok, live:false },
    { key:'yt', name:'YouTube', desc:'Coming soon', color:'#FF0000', Icon:FaYoutube, live:false },
  ];
  const countOf = (k) => accounts.filter(a => a.platform === k).length;
  const platformsConnected = [...new Set(accounts.map(a => a.platform))].length;
  const gradText = { background:th.gradient, WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", backgroundClip:"text" };

  return (
    <div style={{ padding:"28px 32px", maxWidth:1000, position:"relative" }}>
      <UpgradeGate open={!!upgrade} onClose={()=>setUpgrade(null)} onUpgrade={()=>{setUpgrade(null);setPage('billing');}} th={th} title={upgrade?.title} detail={upgrade?.detail} Icon={upgrade?.Icon}/>
      <style>{`
        .tw-net{transition:transform .18s ease, box-shadow .18s ease, border-color .18s ease;}
        .tw-net:hover{transform:translateY(-4px); box-shadow:0 20px 46px rgba(0,0,0,0.45); border-color:${th.accent}66;}
        .tw-acct{transition:background .15s ease;}
        .tw-acct:hover{background:${th.card2};}
        .tw-cta{transition:transform .12s ease, filter .15s ease;}
        .tw-cta:hover{transform:translateY(-1px); filter:brightness(1.08);}
      `}</style>
      <div style={{ position:"absolute", top:-40, left:"30%", width:520, height:280, background:"radial-gradient(ellipse at center, rgba(110,140,171,0.18), transparent 70%)", filter:"blur(20px)", pointerEvents:"none", zIndex:0 }}/>

      <div style={{ position:"relative", zIndex:1 }}>
      <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", flexWrap:"wrap", gap:14, marginBottom:24 }}>
        <div>
          <h2 style={{ margin:0, fontSize:21, fontWeight:700, letterSpacing:-0.4 }}>Social accounts</h2>
          <p style={{ margin:"6px 0 0", fontSize:12.5, color:th.text2 }}>Connect and manage the networks for {selClient?.name || "your brand"}</p>
        </div>
        <div style={{ display:"flex", gap:10 }}>
          <div style={{ background:th.card, border:`1px solid ${th.border}`, borderRadius:14, padding:"12px 18px", textAlign:"center", minWidth:90, boxShadow:"0 8px 22px rgba(0,0,0,0.25)" }}>
            <div style={{ fontSize:24, fontWeight:800, ...gradText }}>{accounts.length}</div>
            <div style={{ fontSize:10.5, color:th.text2, marginTop:2 }}>Connected</div>
          </div>
          <div style={{ background:th.card, border:`1px solid ${th.border}`, borderRadius:14, padding:"12px 18px", textAlign:"center", minWidth:90, boxShadow:"0 8px 22px rgba(0,0,0,0.25)" }}>
            <div style={{ fontSize:24, fontWeight:800 }}>{platformsConnected}</div>
            <div style={{ fontSize:10.5, color:th.text2, marginTop:2 }}>Networks</div>
          </div>
        </div>
      </div>

      {error && <div style={{ padding:"12px 16px", borderRadius:11, background:th.dangerSoft, color:th.danger, fontSize:13, marginBottom:14, display:"flex", alignItems:"center", gap:8 }}><XCircle size={15}/>{error}</div>}
      {success && <div style={{ padding:"12px 16px", borderRadius:11, background:th.successSoft, color:th.success, fontSize:13, marginBottom:14, display:"flex", alignItems:"center", gap:8 }}><CheckCircle size={15}/>{success}</div>}

      <div style={{ fontSize:11.5, fontWeight:700, color:th.text2, textTransform:"uppercase", letterSpacing:1.4, marginBottom:13 }}>Add a network</div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(188px,1fr))", gap:15, marginBottom:32 }}>
        {NETWORKS.map(net => {
          const n = countOf(net.key);
          return (
            <div key={net.key} className="tw-net" style={{ background:net.live?`linear-gradient(160deg, ${net.color}10, ${th.card} 60%)`:th.card, border:`1px solid ${net.live?net.color+'40':th.border}`, borderRadius:18, padding:19, boxShadow:"0 10px 26px rgba(0,0,0,0.26)", opacity:net.live?1:0.62, position:"relative", overflow:"hidden" }}>
              {net.live && <div style={{ position:"absolute", top:-28, left:-12, width:130, height:96, background:`radial-gradient(circle, ${net.color}4d, transparent 70%)`, filter:"blur(9px)", pointerEvents:"none", zIndex:0 }}/>}
              <div style={{ position:"relative", zIndex:1 }}>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:15 }}>
                  <div style={{ width:52, height:52, borderRadius:15, background:`linear-gradient(135deg, ${net.color}38, ${net.color}10)`, border:`1px solid ${net.color}40`, display:"flex", alignItems:"center", justifyContent:"center" }}><net.Icon style={{ color:net.color, fontSize:24 }}/></div>
                  {n>0 && <span style={{ fontSize:10, fontWeight:700, color:th.success, background:th.successSoft, border:`1px solid ${th.success}40`, borderRadius:999, padding:"4px 10px", display:"flex", alignItems:"center", gap:5 }}><span style={{ width:5, height:5, borderRadius:"50%", background:th.success, boxShadow:`0 0 6px ${th.success}` }}/><span className="tw-num">{n}</span></span>}
                </div>
                <div style={{ fontSize:15, fontWeight:700 }}>{net.name}</div>
                <div style={{ fontSize:11.5, color:th.text2, marginTop:3, marginBottom:15, minHeight:16 }}>{net.desc}</div>
                {net.live ? (
                  <button className="tw-cta" onClick={net.onConnect} disabled={connecting} style={{ width:"100%", padding:"10px", borderRadius:11, background:n>0?"rgba(255,255,255,0.04)":th.gradient, border:n>0?`1px solid ${th.border}`:"none", color:n>0?th.text:"#fff", fontSize:12, fontWeight:600, cursor:connecting?"not-allowed":"pointer", opacity:connecting?0.7:1, display:"flex", alignItems:"center", justifyContent:"center", gap:6, boxShadow:n>0?"none":`0 6px 18px ${th.accent}55` }}>
                    {connecting?"Connecting…":(<><Plus size={13}/>{n>0?"Add another":"Connect"}</>)}
                  </button>
                ) : (
                  <div style={{ width:"100%", padding:"10px", borderRadius:11, background:th.card2, border:`1px dashed ${th.border}`, color:th.text3, fontSize:12, fontWeight:600, textAlign:"center", display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}><Lock size={12}/>Coming soon</div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ fontSize:11.5, fontWeight:700, color:th.text2, textTransform:"uppercase", letterSpacing:1.4, marginBottom:13 }}>Connected accounts {accounts.length>0 && <span style={{color:th.text3}}>&middot; {accounts.length}</span>}</div>
      <div style={{ background:th.card, border:`1px solid ${th.border}`, borderRadius:18, overflow:"hidden", boxShadow:"0 14px 36px rgba(0,0,0,0.32)" }}>
        {loading ? (
          <SkList th={th} rows={3}/>
        ) : accounts.length===0 ? (
          <div style={{ padding:"52px 24px", textAlign:"center" }}>
            <div style={{ width:58, height:58, borderRadius:17, background:th.accentSoft, display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 15px" }}><Link size={26} color={th.accent}/></div>
            <div style={{ fontSize:15, fontWeight:600, marginBottom:5 }}>No accounts connected yet</div>
            <div style={{ fontSize:12.5, color:th.text2 }}>Pick a network above to connect your first account.</div>
          </div>
        ) : accounts.map((acc,i) => {
          const info = platformInfo[acc.platform] || { name:acc.platform, color:th.accent, bg:th.accentSoft, Icon:Globe };
          return (
            <div key={acc.id} className="tw-acct" style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"16px 20px", borderBottom:i<accounts.length-1?`1px solid ${th.border}`:"none", borderLeft:`3px solid ${info.color}` }}>
              <div style={{ display:"flex", alignItems:"center", gap:14 }}>
                <div style={{ position:"relative" }}>
                  {acc.picture ? <img src={acc.picture} alt="" style={{ width:46, height:46, borderRadius:13, objectFit:"cover", border:`2px solid ${info.color}55` }}/> : <div style={{ width:46, height:46, borderRadius:13, background:`linear-gradient(135deg, ${info.color}38, ${info.color}12)`, border:`2px solid ${info.color}40`, display:"flex", alignItems:"center", justifyContent:"center" }}><info.Icon style={{ color:info.color, fontSize:22 }}/></div>}
                  <div style={{ position:"absolute", bottom:-4, right:-4, width:20, height:20, borderRadius:"50%", background:th.card, display:"flex", alignItems:"center", justifyContent:"center", border:`2px solid ${th.card}` }}><info.Icon style={{ color:info.color, fontSize:10 }}/></div>
                </div>
                <div>
                  <div style={{ fontSize:14, fontWeight:600 }}>{acc.account_name}</div>
                  <div style={{ fontSize:11.5, color:th.text2, display:"flex", alignItems:"center", gap:7, marginTop:3 }}>
                    <span style={{ color:info.color, fontWeight:600 }}>{info.name}</span>
                    {acc.username && <span>&middot; @{acc.username}</span>}
                    {acc.followers_count>0 && <span>&middot; {Number(acc.followers_count).toLocaleString()} followers</span>}
                  </div>
                </div>
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                <span style={{ fontSize:10.5, fontWeight:700, color:th.success, background:th.successSoft, borderRadius:999, padding:"5px 12px", display:"flex", alignItems:"center", gap:6 }}><span style={{ width:6, height:6, borderRadius:"50%", background:th.success }}/>Active</span>
                <button className="tw-cta" onClick={()=>disconnectAccount(acc.id)} title="Disconnect" style={{ background:"none", border:`1px solid ${th.border}`, borderRadius:10, padding:"8px 12px", cursor:"pointer", color:th.text2, display:"flex", alignItems:"center", gap:6, fontSize:11.5 }}><XCircle size={14}/>Disconnect</button>
              </div>
            </div>
          );
        })}
      </div>

      {liOptions && (
        <div onClick={()=>setLiOptions(null)} style={{ position:"fixed", inset:0, background:"rgba(3,5,10,0.62)", backdropFilter:"blur(2px)", zIndex:80, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
          <div onClick={e=>e.stopPropagation()} style={{ width:430, maxWidth:"100%", background:th.surface, border:`1px solid ${th.border}`, borderRadius:20, padding:24, boxShadow:"0 30px 80px rgba(0,0,0,0.65)" }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:6 }}>
              <div style={{ display:"flex", alignItems:"center", gap:10 }}><div style={{ width:38, height:38, borderRadius:11, background:"rgba(10,102,194,0.14)", display:"flex", alignItems:"center", justifyContent:"center" }}><FaLinkedin style={{ color:"#0A66C2", fontSize:19 }}/></div><span style={{ fontSize:15.5, fontWeight:700 }}>Connect LinkedIn</span></div>
              <button onClick={()=>setLiOptions(null)} style={{ background:"none", border:"none", cursor:"pointer", color:th.text2, display:"flex" }}><XCircle size={20}/></button>
            </div>
            <div style={{ fontSize:12.5, color:th.text2, margin:"4px 0 18px" }}>Choose the profile or company Page to connect.</div>
            <div style={{ display:"flex", flexDirection:"column", gap:9 }}>
              {liOptions.map((o,i)=>(
                <div key={i} className="tw-acct" style={{ display:"flex", alignItems:"center", justifyContent:"space-between", background:th.card, border:`1px solid ${th.border}`, borderRadius:13, padding:"12px 14px" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:11 }}>
                    <div style={{ width:38, height:38, borderRadius:11, background:"rgba(10,102,194,0.12)", display:"flex", alignItems:"center", justifyContent:"center" }}><FaLinkedin style={{ color:"#0A66C2", fontSize:18 }}/></div>
                    <div><div style={{ fontSize:13, fontWeight:600 }}>{o.account_name}</div><div style={{ fontSize:10.5, color:th.text2 }}>{o.kind==='organization'?'Company Page':'Personal profile'}</div></div>
                  </div>
                  <button className="tw-cta" onClick={()=>connectLiAccount(o)} style={{ padding:"8px 17px", borderRadius:10, background:th.gradient, border:"none", color:"#fff", fontSize:12, fontWeight:600, cursor:"pointer" }}>Connect</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div style={{ marginTop:18, padding:"14px 18px", borderRadius:13, background:th.accentSoft, border:`1px solid ${th.border}`, fontSize:12, color:th.text2, lineHeight:1.6 }}>
        <strong style={{ color:th.accent }}>Note:</strong> Instagram must be a Business/Creator account linked to a Facebook Page. LinkedIn company Pages require admin access. X, TikTok &amp; YouTube are coming soon.
      </div>
      </div>
    </div>
  );
}

function Placeholder({ icon:Icon, title, description, badge, features, ctaLabel, ctaPage }) {
  const { setPage } = useApp();
  const th = useTheme();
  return (
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:"66vh",textAlign:"center",padding:40}}>
      <div style={{width:74,height:74,borderRadius:20,background:th.accentSoft,display:"flex",alignItems:"center",justifyContent:"center",marginBottom:18}}>
        <Icon size={32} color={th.accent} strokeWidth={1.6}/>
      </div>
      {badge && <div style={{display:"inline-flex",alignItems:"center",gap:6,background:th.accentSoft,color:th.accent,fontSize:11,fontWeight:700,padding:"4px 12px",borderRadius:999,marginBottom:12,letterSpacing:0.3}}><Sparkles size={12}/>{badge}</div>}
      <h2 style={{margin:0,fontSize:22,fontWeight:700,letterSpacing:-0.5,marginBottom:9}}>{title}</h2>
      <p style={{margin:0,fontSize:13,color:th.text2,maxWidth:440,lineHeight:1.7,marginBottom:features?20:24}}>{description}</p>
      {features && (
        <div style={{display:"flex",flexDirection:"column",gap:9,marginBottom:24,textAlign:"left",width:"100%",maxWidth:360}}>
          {features.map((f,i)=>(
            <div key={i} style={{display:"flex",alignItems:"center",gap:10,background:th.card,border:`1px solid ${th.border}`,borderRadius:11,padding:"11px 14px"}}>
              <CheckCircle size={15} color={th.accent} style={{flexShrink:0}}/>
              <span style={{fontSize:12.5,color:th.text}}>{f}</span>
            </div>
          ))}
        </div>
      )}
      <div style={{display:"flex",gap:10,flexWrap:"wrap",justifyContent:"center"}}>
        {ctaLabel && ctaPage && (
          <button onClick={()=>setPage(ctaPage)} style={{padding:"10px 20px",borderRadius:10,background:th.gradient,border:"none",color:"#fff",fontSize:13,fontWeight:600,cursor:"pointer",boxShadow:"0 4px 14px rgba(110,140,171,0.4)",display:"flex",alignItems:"center",gap:7}}>
            <ArrowUpRight size={15}/>{ctaLabel}
          </button>
        )}
        <button onClick={()=>setPage("dashboard")} style={{padding:"10px 20px",borderRadius:10,background:th.card,border:`1px solid ${th.border}`,color:th.text,fontSize:13,fontWeight:600,cursor:"pointer",display:"flex",alignItems:"center",gap:7}}>
          <LayoutDashboard size={14}/>Dashboard
        </button>
      </div>
    </div>
  );
}

function TrendingPage() {
  const { setPage, dark } = useApp();
  const th = dark ? DARK : LIGHT;
  const [region, setRegion] = useState("worldwide");
  const [platform, setPlatform] = useState("all");
  const [regionOpen, setRegionOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(true);
  const [sampleMode, setSampleMode] = useState(false);

  const SAMPLE_TRENDS = [
    { id:"t1", platform:"tiktok", caption:"3 dishes you have to try this weekend 🤤 #bahrainfood", author:"@bahrain.eats", thumbnail:null, views:1840000, likes:212000, sample:true },
    { id:"t2", platform:"instagram", caption:"Ramadan tablescape inspo 🌙✨ save this for later", author:"@gulf.living", thumbnail:null, views:0, likes:98400, sample:true },
    { id:"t3", platform:"tiktok", caption:"POV: you found the best karak in Manama ☕️", author:"@khaleeji.vibes", thumbnail:null, views:920000, likes:154000, sample:true },
    { id:"t4", platform:"instagram", caption:"Weekend brunch spots in the GCC you can't miss", author:"@foodie.gcc", thumbnail:null, views:0, likes:64200, sample:true },
    { id:"t5", platform:"tiktok", caption:"Trending audio everyone is using right now 🔥", author:"@trendwatch", thumbnail:null, views:4200000, likes:511000, sample:true },
    { id:"t6", platform:"instagram", caption:"Small business owners — try this Reel hook 👀", author:"@socialgrowth", thumbnail:null, views:0, likes:41800, sample:true },
    { id:"t7", platform:"tiktok", caption:"Eid outfit transitions ✨ #eidstyle", author:"@style.khaleeji", thumbnail:null, views:2600000, likes:388000, sample:true },
    { id:"t8", platform:"instagram", caption:"How we grew to 100k followers in 90 days", author:"@marketing.mena", thumbnail:null, views:0, likes:73500, sample:true },
  ];
  const sampleShown = SAMPLE_TRENDS.filter(it => platform==="all" || it.platform===platform);
  const loadSample = () => setSampleMode(true);
  const exitSample = () => setSampleMode(false);

  const REGIONS = [
    { id:"worldwide", label:"Worldwide", flag:"\uD83C\uDF0D" },
    { id:"gcc", label:"GCC", flag:"\uD83C\uDF0D" },
    { id:"bahrain", label:"Bahrain", flag:"\uD83C\uDDE7\uD83C\uDDED" },
    { id:"saudi", label:"Saudi Arabia", flag:"\uD83C\uDDF8\uD83C\uDDE6" },
    { id:"uae", label:"United Arab Emirates", flag:"\uD83C\uDDE6\uD83C\uDDEA" },
    { id:"usa", label:"United States", flag:"\uD83C\uDDFA\uD83C\uDDF8" },
  ];
  const curRegion = REGIONS.find(r=>r.id===region) || REGIONS[0];

  useEffect(() => {
    if (sampleMode) return;
    let active = true;
    setLoading(true);
    fetch(`/api/trends?region=${region}&platform=${platform}`)
      .then(r=>r.json())
      .then(d=>{ if(!active) return; setConnected(d.connected!==false); setItems(d.items||[]); setLoading(false); })
      .catch(()=>{ if(active) setLoading(false); });
    return ()=>{ active=false; };
  }, [region, platform, sampleMode]);

  const fmt = (n) => n>=1000000 ? (n/1000000).toFixed(1)+"M" : n>=1000 ? (n/1000).toFixed(1)+"K" : String(n||0);

  return (
    <div style={{padding:"28px 32px", maxWidth:1200}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:12,marginBottom:16,flexWrap:"wrap"}}>
        <div>
          <h2 style={{margin:0,fontSize:20,fontWeight:600,letterSpacing:-0.3}}>Trending now</h2>
          <p style={{margin:"5px 0 0",fontSize:12.5,color:th.text2}}>Showing trends for {curRegion.label} &middot; TikTok &amp; Instagram</p>
        </div>
        <div style={{position:"relative"}}>
          <button onClick={()=>setRegionOpen(o=>!o)} style={{display:"flex",alignItems:"center",gap:8,background:th.card,border:`1px solid ${th.border}`,borderRadius:11,padding:"9px 14px",cursor:"pointer",color:th.text,fontSize:13}}>
            <span>{curRegion.flag}</span> {curRegion.label} <ChevronDown size={15} color={th.text2}/>
          </button>
          {regionOpen&&(
            <>
            <div onClick={()=>setRegionOpen(false)} style={{position:"fixed",inset:0,zIndex:49}}/>
            <div style={{position:"absolute",top:"115%",right:0,zIndex:50,background:th.card,border:`1px solid ${th.border}`,borderRadius:12,boxShadow:"0 16px 44px rgba(0,0,0,0.55)",padding:6,minWidth:220}}>
              {REGIONS.map(r=>(
                <div key={r.id} onClick={()=>{setRegion(r.id);setRegionOpen(false);}} style={{display:"flex",alignItems:"center",gap:10,padding:"9px 10px",borderRadius:9,cursor:"pointer",background:region===r.id?th.accentSoft:"transparent",color:region===r.id?th.accent:th.text,fontSize:12.5}}>
                  <span>{r.flag}</span> {r.label}
                </div>
              ))}
            </div>
            </>
          )}
        </div>
      </div>

      <div style={{display:"flex",gap:7,marginBottom:16,alignItems:"center"}}>
        {[["all","All"],["tiktok","TikTok"],["instagram","Instagram"]].map(([id,lbl])=>(
          <button key={id} onClick={()=>setPlatform(id)} style={{fontSize:11.5,borderRadius:999,border:`1px solid ${platform===id?"transparent":th.border}`,background:platform===id?th.gradient:th.card,color:platform===id?"#fff":th.text2,padding:"6px 14px",cursor:"pointer",fontWeight:platform===id?600:400}}>{lbl}</button>
        ))}
        <button onClick={sampleMode?exitSample:loadSample} style={{marginLeft:"auto",fontSize:11.5,borderRadius:999,border:`1px solid ${sampleMode?th.accent:th.border}`,background:sampleMode?th.accentSoft:th.card,color:sampleMode?th.accent:th.text2,padding:"6px 14px",cursor:"pointer",fontWeight:600,display:"flex",alignItems:"center",gap:5}}><Eye size={12}/>{sampleMode?"Exit preview":"Preview sample"}</button>
      </div>
      {sampleMode && (
        <div style={{marginBottom:14,padding:"10px 14px",borderRadius:10,background:th.accentSoft,border:`1px solid ${th.accent}55`,fontSize:12,color:th.accent,display:"flex",alignItems:"center",gap:8}}>
          <Eye size={13}/> Showing <strong>sample trends</strong> for preview. Live TikTok &amp; Instagram trends load automatically when the data source has quota.
        </div>
      )}

      {(!sampleMode && !connected) ? (
        <div style={{background:th.card,border:`1px dashed ${th.border}`,borderRadius:18,padding:32,textAlign:"center"}}>
          <div style={{fontSize:15,fontWeight:600,marginBottom:6}}>Connect your trends source</div>
          <div style={{fontSize:12.5,color:th.text2,lineHeight:1.7,maxWidth:460,margin:"0 auto"}}>Add your EnsembleData API token in Vercel as the environment variable <strong style={{color:th.text}}>ENSEMBLE_TOKEN</strong> to start pulling live TikTok &amp; Instagram trends here.</div>
          <button onClick={loadSample} style={{marginTop:16,padding:"9px 18px",borderRadius:10,background:th.gradient,border:"none",color:"#fff",fontSize:12.5,fontWeight:600,cursor:"pointer",display:"inline-flex",alignItems:"center",gap:7}}><Eye size={14}/>Preview with sample data</button>
        </div>
      ) : (!sampleMode && loading) ? (
        <SkCards th={th} count={8} h={140} min={170}/>
      ) : (
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:14}}>
          {((sampleMode||items.length===0)?sampleShown:items).map((it,i)=>(
            <div key={it.id||i} style={{background:th.card,border:`1px solid ${th.border}`,borderRadius:16,overflow:"hidden",boxShadow:"none"}}>
              <div style={{position:"relative",height:150,background:th.gradient}}>
                {it.thumbnail && <img src={it.thumbnail} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}} onError={e=>{e.target.style.display="none";}}/>}
                <span style={{position:"absolute",top:8,left:8,background:"rgba(0,0,0,0.55)",borderRadius:8,padding:"3px 8px",fontSize:10,color:"#fff"}}>{it.platform==="tiktok"?"TikTok":"Instagram"}</span>
                {it.sample&&<span style={{position:"absolute",top:8,right:8,background:th.accent,borderRadius:8,padding:"3px 8px",fontSize:9,fontWeight:700,color:"#fff"}}>Sample</span>}
                <span style={{position:"absolute",bottom:8,right:8,background:"rgba(0,0,0,0.55)",borderRadius:8,padding:"2px 7px",fontSize:10,color:"#fff"}}>{it.platform==="tiktok"?fmt(it.views)+" views":fmt(it.likes)+" likes"}</span>
              </div>
              <div style={{padding:"11px 13px"}}>
                <div style={{fontSize:12,lineHeight:1.5,height:36,overflow:"hidden",color:th.text}}>{it.caption||"(no caption)"}</div>
                <div style={{fontSize:10.5,color:th.text2,margin:"6px 0 9px",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{it.author}</div>
                <div style={{display:"flex",gap:7}}>
                  <a href={it.url||"#"} target="_blank" rel="noreferrer" style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",gap:5,fontSize:11,color:th.text,background:th.card2,border:`1px solid ${th.border}`,borderRadius:9,padding:"7px",cursor:"pointer",textDecoration:"none"}}><Eye size={13}/>View</a>
                  <button onClick={()=>setPage("publisher")} style={{flex:1.3,display:"flex",alignItems:"center",justifyContent:"center",gap:5,fontSize:11,color:"#fff",background:th.gradient,border:"none",borderRadius:9,padding:"7px",cursor:"pointer"}}><Sparkles size={13}/>Create post</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AnalyticsPage() {
  const { selClient, dark, lang } = useApp();
  const th = dark ? DARK : LIGHT;
  const isAR = lang === "ar";
  const L = (en, ar) => isAR ? ar : en;
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
          const first = data.find(a => a.platform === 'ig') || data[0];
          if (first) {
            setSelectedAcc(first);
            fetchAnalytics(first);
          } else {
            setLoading(false);
          }
        }
      });
  }, [realClientId]);

  // Believable sample insights, used until real Meta insights are approved/available
  // (so the analytics view is always complete instead of showing an error).
  // Seeded per-account AND per-platform so every connected account shows its own
  // distinct, plausible numbers — Instagram and Facebook never look identical.
  const makeSampleAnalytics = (acc) => {
    const platform = acc.platform || 'ig';
    const key = String(acc.account_id || acc.id || acc.account_name || 'x') + ':' + platform;
    let h = 2166136261; for (let i=0;i<key.length;i++){ h ^= key.charCodeAt(i); h = Math.imul(h, 16777619); }
    h = h >>> 0;
    const r = (n) => { let x = (h ^ Math.imul(n+1, 2654435761)) >>> 0; x ^= x >>> 15; return (x % 100000) / 100000; };
    const f = acc.followers_count || Math.round(3500 + r(0)*42000);
    // Instagram reaches a higher multiple of its follower base than a Facebook Page does.
    const reachMul = platform === 'fb' ? (2.8 + r(1)*2.4) : (6.5 + r(1)*4.5);
    const imprMul  = reachMul * (1.2 + r(2)*0.5);
    const reach = Math.round(f*reachMul), impr = Math.round(f*imprMul);
    const phase = r(3)*6;
    const chartData = Array.from({length:30},(_,i)=>{ const base=reach/30; const wave=1+0.42*Math.sin(i/3+phase)+(i/30)*(0.35+r(4)*0.4); return { date:"", reach:Math.round(base*wave*0.9), impressions:Math.round(base*wave*1.35) }; });
    const types = platform === 'fb'
      ? ["VIDEO","IMAGE","LINK","CAROUSEL_ALBUM"]
      : ["REELS","CAROUSEL_ALBUM","IMAGE","VIDEO"];
    const capsIG=["Behind the scenes ✨","New drop is live 🔥","Weekend mood ☀️","Customer love ❤️","Quick tips for you","Meet the team","Limited-time offer","Throwback Thursday","Big announcement soon"];
    const capsFB=["Now open this weekend","Read our latest update","A look inside our kitchen","Thank you for 10k followers","This week's special","Community spotlight","We're hiring — join us","Customer story of the month","Tap to learn more →"];
    const caps = platform === 'fb' ? capsFB : capsIG;
    const recentPosts = Array.from({length:9},(_,i)=>({ type:types[(i+Math.floor(r(i)*4))%types.length], likes:Math.round(f*(0.018+r(i+10)*0.05)), comments:Math.round(f*(0.0015+r(i+20)*0.004)), caption:caps[i], thumbnail:null }));
    const totalLikes=recentPosts.reduce((s,p)=>s+p.likes,0), totalComments=recentPosts.reduce((s,p)=>s+p.comments,0);
    // Facebook engagement rates run lower than Instagram's.
    const engBase = platform === 'fb' ? (1.4 + r(7)*1.8) : (3.4 + r(7)*3.1);
    return { _sample:true, platform, summary:{ followers:f, totalReach:reach, totalImpressions:impr, engagementRate:Number(engBase.toFixed(1)), totalLikes, totalComments }, chartData, recentPosts };
  };

  const fetchAnalytics = async (acc) => {
    setLoading(true);
    // Only Instagram has a live insights endpoint wired up. Facebook (and anything
    // else) goes straight to its own platform-flavored sample so the data differs.
    if (acc.platform !== 'ig') {
      setAnalyticsData(prev => ({ ...prev, [acc.id]: makeSampleAnalytics(acc) }));
      setLoading(false);
      return;
    }
    try {
      const res = await fetch('/api/instagram-analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountId: acc.account_id, accessToken: acc.access_token }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || 'no insights');
      setAnalyticsData(prev => ({ ...prev, [acc.id]: { ...data, platform:'ig' } }));
    } catch(e) {
      setAnalyticsData(prev => ({ ...prev, [acc.id]: makeSampleAnalytics(acc) }));
    }
    setLoading(false);
  };

  const igAccounts = accounts.filter(a => a.platform === 'ig');
  const fbAccounts = accounts.filter(a => a.platform === 'fb');
  const totalFollowers = accounts.reduce((s,a) => s + (a.followers_count||0), 0);
  const data = selectedAcc ? analyticsData[selectedAcc.id] : null;

  const sparkPath = (vals, w, h, close) => {
    if (!vals || vals.length < 2) return "";
    const max = Math.max(...vals, 1), min = Math.min(...vals, 0), rng = (max - min) || 1;
    const pts = vals.map((v,i) => [ (i/(vals.length-1))*w, h - ((v-min)/rng)*(h-3) - 2 ]);
    let d = "M" + pts.map(pt => pt[0].toFixed(1)+","+pt[1].toFixed(1)).join(" L");
    if (close) d += " L"+w+","+h+" L0,"+h+" Z";
    return d;
  };
  const pct = (n,d) => d>0 ? Math.round((n/d)*1000)/10 : 0;
  const reachSeries = (data?.chartData||[]).map(d => d.reach||0);
  const imprSeries  = (data?.chartData||[]).map(d => d.impressions||0);
  const engRate = data?.summary?.engagementRate || 0;
  const engFrac = Math.min(engRate/20, 1);
  const ringC = 2*Math.PI*32;
  const typeLabels = { IMAGE:"Photo", VIDEO:"Video", CAROUSEL_ALBUM:"Carousel", REELS:"Reels", LINK:"Link" };
  const typeColors = { IMAGE:"#2DD4BF", VIDEO:"#A78BFA", CAROUSEL_ALBUM:"#4F6EF7", REELS:"#7C3AED", LINK:"#6E8CAB" };
  const plat = data?.platform || selectedAcc?.platform || 'ig';
  const platName = plat === 'fb' ? L("Facebook","فيسبوك") : plat === 'li' ? "LinkedIn" : plat === 'tw' ? "X" : L("Instagram","إنستغرام");
  const typeCounts = (data?.recentPosts||[]).reduce((m,pp)=>{ const t=pp.type||"IMAGE"; m[t]=(m[t]||0)+1; return m; },{});
  const mixTotal = Object.values(typeCounts).reduce((a,b)=>a+b,0) || 0;
  const DC = 2*Math.PI*44;
  let _acc = 0;
  const mixSegs = Object.entries(typeCounts).map(([t,n])=>{ const frac=mixTotal?n/mixTotal:0; const seg={ t, color:typeColors[t]||th.accent, label:typeLabels[t]||t, pctVal:Math.round(frac*100), dash:frac*DC, offset:-_acc*DC }; _acc+=frac; return seg; });
  const topPosts = [...(data?.recentPosts||[])].sort((a,b)=>(b.likes+b.comments)-(a.likes+a.comments)).slice(0,5);
  const maxEng = Math.max(1, ...topPosts.map(pp=>pp.likes+pp.comments));

  // ── Deltas & narrative ──────────────────────────────────────────────
  const isSample = !!data?._sample;
  const hasImpr = imprSeries.some(v => v > 0);
  const seriesDelta = (s) => { if (!s || s.length < 4) return null; const h=Math.floor(s.length/2); const a=s.slice(0,h).reduce((x,y)=>x+y,0); const b=s.slice(h).reduce((x,y)=>x+y,0); return a>0 ? Math.round(((b-a)/a)*100) : null; };
  const reachDelta = seriesDelta(reachSeries);
  const imprDelta = hasImpr ? seriesDelta(imprSeries) : null;
  const fnum = selectedAcc?.followers_count || data?.summary?.followers || totalFollowers || 0;
  const followerDelta = isSample ? Number((1.2 + (fnum % 30) / 14).toFixed(1)) : null; // believable for demo accounts only
  const engPtsDelta = isSample ? Number((0.2 + (Math.round(engRate*10) % 9) / 10).toFixed(1)) : null;
  const avgLikes = (data?.recentPosts?.length) ? Math.round((data.summary.totalLikes || 0) / data.recentPosts.length) : 0;
  const chip = (c) => c ? <span style={{display:"inline-flex",alignItems:"center",gap:3,fontSize:10.5,fontWeight:700,color:c.up?th.success:th.danger,background:(c.up?th.success:th.danger)+"1f",borderRadius:6,padding:"2px 7px"}}>{c.up?<ArrowUpRight size={11}/>:<ArrowDownRight size={11}/>}{c.txt}</span> : null;
  // top content format for the narrative line
  const topTypeEntry = Object.entries(typeCounts).sort((a,b)=>b[1]-a[1])[0];
  const topTypeLabel = topTypeEntry ? (typeLabels[topTypeEntry[0]] || topTypeEntry[0]) : null;

  const metric = (label, value, series, scolor, change) => (
    <div style={{background:th.card,border:`1px solid ${th.border}`,borderRadius:16,padding:"16px 18px",boxShadow:"none"}}>
      <div style={{fontSize:11.5,color:th.text2,marginBottom:9,fontWeight:500}}>{label}</div>
      <div className="tw-num" style={{fontSize:27,fontWeight:600,letterSpacing:-0.6,color:th.text}}>{value}</div>
      {change && <div style={{marginTop:8}}>{chip(change)}</div>}
      {!change && series && series.length>1 && (
        <svg width="100%" height="26" viewBox="0 0 100 26" preserveAspectRatio="none" style={{marginTop:8,display:"block"}}>
          <path d={sparkPath(series,100,26,true)} fill={(scolor||th.accent)+"22"}/>
          <path d={sparkPath(series,100,26,false)} fill="none" stroke={scolor||th.accent} strokeWidth="2" vectorEffect="non-scaling-stroke"/>
        </svg>
      )}
    </div>
  );

  return (
    <div style={{padding:"28px 32px", maxWidth:1200}}>
      <div style={{marginBottom:22, display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:12}}>
        <div>
          <h2 style={{margin:0, fontSize:20, fontWeight:600, letterSpacing:-0.3, display:"flex", alignItems:"center", gap:10}}>{L("Analytics","التحليلات")}{data?._sample && <span style={{fontSize:10, fontWeight:700, color:th.accent, background:th.accentSoft, border:`1px solid ${th.accent}33`, borderRadius:7, padding:"3px 9px", letterSpacing:0.3}}>{L("SAMPLE PREVIEW","معاينة عينة")}</span>}</h2>
          <p style={{margin:"5px 0 0", fontSize:12.5, color:th.text2}}>{platName} &middot; {selectedAcc?.username?("@"+selectedAcc.username):selectedAcc?.account_name||selClient?.name}</p>
        </div>
        {accounts.length > 0 && (
          <div style={{display:"flex", gap:8, flexWrap:"wrap"}}>
            {accounts.map(acc => { const PI=PlatformIcons[acc.platform]; const on=selectedAcc?.id===acc.id; return (
              <button key={acc.id} onClick={()=>{setSelectedAcc(acc);fetchAnalytics(acc);}} style={{display:"flex",alignItems:"center",gap:6,padding:"7px 13px", borderRadius:999, border:`1px solid ${on?th.accent:th.border}`, background:on?th.accentSoft:th.card, color:on?th.accent:th.text2, fontSize:11.5, fontWeight:500, cursor:"pointer"}}>
                {PI?<PI/>:<Globe size={13}/>}{acc.username?("@"+acc.username):acc.account_name}
              </button>
            ); })}
          </div>
        )}
      </div>

      {loading ? (
        <div><SkStatRow th={th} n={4}/><SkChart th={th}/></div>
      ) : data?.error ? (
        <div style={{background:th.card, border:`1px solid ${th.border}`, borderRadius:18, padding:24, boxShadow:"none"}}>
          <div style={{fontSize:13, color:th.danger, marginBottom:8, fontWeight:600}}>Could not load Instagram insights</div>
          <div style={{fontSize:12, color:th.text2, lineHeight:1.6}}>{data.error}</div>
          <div style={{fontSize:12, color:th.text2, marginTop:8, lineHeight:1.6}}>Full analytics will be available after <strong style={{color:th.text}}>instagram_manage_insights</strong> is approved by Meta.</div>
        </div>
      ) : data ? (
        <>
          {data.summary.totalReach > 0 && (
            <div style={{background:`linear-gradient(120deg, ${th.accent}1a, ${th.accent}03)`, border:`1px solid ${th.border}`, borderLeft:`2px solid ${th.accent}`, borderRadius:14, padding:"14px 18px", marginBottom:14}}>
              <div style={{fontSize:14, lineHeight:1.65, color:th.text2}}>
                {L("You reached ","وصلت إلى ")}<span className="tw-num" style={{color:th.text, fontWeight:600}}>{data.summary.totalReach.toLocaleString()}</span>{L(" people in the last 30 days"," شخص خلال آخر ٣٠ يوماً")}
                {reachDelta!=null && reachDelta!==0 && <>{L(", ","، ")}<span className="tw-num" style={{color:reachDelta>0?th.success:th.danger, fontWeight:600}}>{reachDelta>0?L("up ","بزيادة ")+Math.abs(reachDelta)+"%":L("down ","بانخفاض ")+Math.abs(reachDelta)+"%"}</span></>}
                {topTypeLabel && <>{". "}<span style={{color:th.accent2||th.accent}}>{topTypeLabel}</span>{L(" posts are pulling your strongest engagement right now."," هي الأقوى في التفاعل حالياً.")}</>}
                {!topTypeLabel && "."}
              </div>
            </div>
          )}

          <div style={{display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:14, marginBottom:14}}>
            {metric(L("Followers","المتابعون"), (selectedAcc?.followers_count||data?.summary?.followers||totalFollowers).toLocaleString(), null, null, followerDelta!=null?{txt:followerDelta+"%",up:true}:null)}
            {metric(L("Reach · 30d","الوصول · ٣٠ يوم"), data.summary.totalReach.toLocaleString(), reachSeries, "#4F6EF7", reachDelta!=null?{txt:Math.abs(reachDelta)+"%",up:reachDelta>=0}:null)}
            {hasImpr
              ? metric(L("Impressions · 30d","الظهور · ٣٠ يوم"), data.summary.totalImpressions.toLocaleString(), imprSeries, "#A78BFA", imprDelta!=null?{txt:Math.abs(imprDelta)+"%",up:imprDelta>=0}:null)
              : metric(L("Avg. likes","متوسط الإعجابات"), avgLikes.toLocaleString(), null, null, null)}
            {metric(L("Engagement","التفاعل"), engRate+"%", null, null, engPtsDelta!=null?{txt:engPtsDelta+"",up:true}:null)}
          </div>

          <div style={{display:"grid", gridTemplateColumns:"1.7fr 1fr", gap:16, marginBottom:14}}>
            <div style={{background:th.card,border:`1px solid ${th.border}`,borderRadius:18,padding:"16px 18px",boxShadow:"none"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
                <div style={{fontSize:13.5,fontWeight:600}}>{hasImpr ? L("Reach & impressions","الوصول والظهور") : L("Daily reach","الوصول اليومي")}</div>
                <div style={{fontSize:11,color:th.text2,display:"flex",gap:14}}>
                  <span style={{display:"flex",alignItems:"center",gap:5}}><span style={{width:8,height:8,borderRadius:"50%",background:"#4F6EF7",display:"inline-block"}}/>{L("Reach","الوصول")}</span>
                  {hasImpr && <span style={{display:"flex",alignItems:"center",gap:5}}><span style={{width:8,height:8,borderRadius:"50%",background:"#A78BFA",display:"inline-block"}}/>{L("Impressions","الظهور")}</span>}
                </div>
              </div>
              {reachSeries.length>1 ? (
                <HoverChart height={160}
                  yTop={(()=>{const m=Math.max(...reachSeries,...(hasImpr?imprSeries:[]),1);return m>=1000000?(m/1000000).toFixed(1).replace(/\.0$/,'')+"M":Math.round(m/1000)+"K";})()}
                  lines={hasImpr
                    ? [{color:"#4F6EF7",label:L("Reach","الوصول"),values:reachSeries},{color:"#A78BFA",label:L("Impressions","الظهور"),values:imprSeries}]
                    : [{color:"#4F6EF7",label:L("Reach","الوصول"),values:reachSeries}]}
                  labels={reachSeries.map((_,i)=>{const d=new Date();d.setDate(d.getDate()-(reachSeries.length-1-i));return d.toLocaleDateString([],{month:'short',day:'numeric'});})}/>
              ) : (
                <div style={{fontSize:12,color:th.text2,padding:"30px 0",textAlign:"center"}}>{L("Daily trend appears once insights data is available.","يظهر الاتجاه اليومي بمجرد توفر بيانات الإحصاءات.")}</div>
              )}
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:14}}>
              <div style={{background:th.card,border:`1px solid ${th.border}`,borderRadius:18,padding:"14px 16px",boxShadow:"none"}}>
                <div style={{fontSize:12,fontWeight:600,marginBottom:8}}>Engagement rate</div>
                <div style={{display:"flex",alignItems:"center",gap:14}}>
                  <svg viewBox="0 0 80 80" width="68" height="68">
                    <circle cx="40" cy="40" r="32" fill="none" stroke={th.border} strokeWidth="8"/>
                    <circle cx="40" cy="40" r="32" fill="none" stroke="#4F6EF7" strokeWidth="8" strokeDasharray={`${engFrac*ringC} ${ringC}`} strokeLinecap="round" transform="rotate(-90 40 40)"/>
                  </svg>
                  <div><div className="tw-num" style={{fontSize:24,fontWeight:600}}>{engRate}%</div><div style={{fontSize:10.5,color:th.text2}}>{L("per post avg","متوسط لكل منشور")}</div></div>
                </div>
              </div>
              <div style={{background:th.card,border:`1px solid ${th.border}`,borderRadius:18,padding:"14px 16px",boxShadow:"none"}}>
                <div style={{fontSize:12,fontWeight:600,marginBottom:10}}>Content mix</div>
                {mixTotal>0 ? (
                  <div style={{display:"flex",alignItems:"center",gap:14}}>
                    <svg viewBox="0 0 120 120" width="78" height="78">
                      <circle cx="60" cy="60" r="44" fill="none" stroke={th.border} strokeWidth="13"/>
                      {mixSegs.map(sg => (
                        <circle key={sg.t} cx="60" cy="60" r="44" fill="none" stroke={sg.color} strokeWidth="13" strokeDasharray={`${sg.dash} ${DC-sg.dash}`} strokeDashoffset={sg.offset} transform="rotate(-90 60 60)"/>
                      ))}
                      <text x="60" y="57" textAnchor="middle" fill={th.text} fontSize="18" fontWeight="600" fontFamily="Fraunces, Georgia, serif">{mixTotal}</text>
                      <text x="60" y="73" textAnchor="middle" fill={th.text2} fontSize="9" fontFamily="sans-serif">{L("posts","منشور")}</text>
                    </svg>
                    <div style={{fontSize:10.5,color:th.text2,lineHeight:1.9}}>
                      {mixSegs.map(sg => <div key={sg.t}><span style={{color:sg.color}}>&#9679;</span> {sg.label} <span className="tw-num">{sg.pctVal}%</span></div>)}
                    </div>
                  </div>
                ) : (
                  <div style={{fontSize:11.5,color:th.text2,padding:"14px 0"}}>No posts in range.</div>
                )}
              </div>
            </div>
          </div>

          <div style={{background:th.card,border:`1px solid ${th.border}`,borderRadius:18,boxShadow:"none",overflow:"hidden"}}>
            <div style={{padding:"14px 18px",borderBottom:`1px solid ${th.border}`,fontSize:13,fontWeight:600}}>Top performing posts</div>
            {topPosts.length===0 ? (
              <EmptyState compact Icon={BarChart2} title="No posts to analyze yet" body="Once this account has published posts, your top performers will rank here by engagement." />
            ) : (
              <>
                <div style={{display:"grid",gridTemplateColumns:"2.4fr 1fr 1fr 1.3fr",padding:"9px 18px",borderBottom:`1px solid ${th.border}`,fontSize:10,color:th.text3,letterSpacing:0.5,textTransform:"uppercase"}}>
                  <div>Post</div><div style={{textAlign:"right"}}>Reach</div><div style={{textAlign:"right"}}>Likes</div><div style={{textAlign:"right"}}>Eng. rate</div>
                </div>
                {topPosts.map((pp,idx) => {
                  const eng = pp.likes+pp.comments;
                  const er = pp.reach>0 ? pct(eng,pp.reach) : null;
                  return (
                    <div key={pp.id||idx} style={{display:"grid",gridTemplateColumns:"2.4fr 1fr 1fr 1.3fr",padding:"12px 18px",borderBottom:idx<topPosts.length-1?`1px solid ${th.border}`:"none",alignItems:"center"}}>
                      <div style={{display:"flex",alignItems:"center",gap:11,minWidth:0}}>
                        {pp.thumbnail ? <img src={pp.thumbnail} alt="" style={{width:42,height:42,borderRadius:9,objectFit:"cover",flexShrink:0}} onError={e=>{e.target.style.display="none";}}/> : <div style={{width:42,height:42,borderRadius:9,background:th.gradient,flexShrink:0}}/>}
                        <div style={{fontSize:12,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{pp.caption||"(No caption)"}</div>
                      </div>
                      <div className="tw-num" style={{textAlign:"right",fontSize:13}}>{pp.reach>0?pp.reach.toLocaleString():"—"}</div>
                      <div className="tw-num" style={{textAlign:"right",fontSize:13}}>{pp.likes.toLocaleString()}</div>
                      <div style={{display:"flex",alignItems:"center",gap:8,justifyContent:"flex-end"}}>
                        <div style={{width:46,height:6,borderRadius:3,background:th.border}}><div style={{width:`${Math.round((eng/maxEng)*100)}%`,height:"100%",borderRadius:3,background:th.accent}}/></div>
                        <span className="tw-num" style={{fontSize:12.5,color:er!=null?th.success:th.text2,minWidth:32,textAlign:"right"}}>{er!=null?er+"%":"—"}</span>
                      </div>
                    </div>
                  );
                })}
              </>
            )}
          </div>
        </>
      ) : (
        <div style={{background:th.card, border:`1px solid ${th.border}`, borderRadius:18, padding:24, boxShadow:"none"}}>
          <div style={{fontSize:13, fontWeight:600, marginBottom:8}}>{L("Analytics","التحليلات")}</div>
          <div style={{fontSize:12, color:th.text2, lineHeight:1.6}}>{L("Connect an Instagram or Facebook account to see reach, impressions, content mix, and post performance.","اربط حساب إنستغرام أو فيسبوك لعرض الوصول والظهور ومزيج المحتوى وأداء المنشورات.")}</div>
        </div>
      )}
    </div>
  );
}

// ── Campaigns ─────────────────────────────────────────────────────────
function CampaignsPage() {
  const { selClient, dark } = useApp();
  const th = dark ? DARK : LIGHT;
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [realClientId, setRealClientId] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [usingSample, setUsingSample] = useState(false);
  const [form, setForm] = useState({ name:"", goal:"", start:"", end:"", platform:"all", accts:[] });
  const [accounts, setAccounts] = useState([]);

  const sampleCampaigns = () => ([
    { id:'s1', name:'Summer Collection Launch', goal:'Reach 100K accounts', status:'active',    start_date:'2026-06-01', end_date:'2026-06-30', posts:12, reach:84200,  engagement:6.4 },
    { id:'s2', name:'Ramadan Greetings',        goal:'Brand awareness',     status:'completed', start_date:'2026-03-01', end_date:'2026-03-30', posts:18, reach:142000, engagement:7.8 },
    { id:'s3', name:'Weekend Brunch Push',      goal:'Drive bookings',      status:'scheduled', start_date:'2026-06-15', end_date:'2026-06-22', posts:6,  reach:0,      engagement:0   },
  ]);

  useEffect(() => {
    let active = true; setLoading(true);
    if (!selClient?.name) { setCampaigns(sampleCampaigns()); setUsingSample(true); setLoading(false); return; }
    supabase.from('clients').select('id').eq('name', selClient.name).limit(1).then(({ data }) => {
      const cid = data && data[0] && data[0].id;
      if (active) setRealClientId(cid || null);
      supabase.from('campaigns').select('*').eq('client_id', cid).order('created_at', { ascending:false }).then(({ data, error }) => {
        if (!active) return;
        if (error || !data || data.length === 0) { setCampaigns(sampleCampaigns()); setUsingSample(true); }
        else { setCampaigns(data.map(c => ({ ...c, posts:c.post_count||0, reach:c.reach||0, engagement:c.engagement||0 }))); setUsingSample(false); }
        setLoading(false);
      });
    });
    return () => { active = false; };
  }, [selClient]);

  useEffect(() => {
    if (!realClientId) { setAccounts([]); return; }
    let active = true;
    supabase.from('social_accounts').select('*').eq('client_id', realClientId).neq('is_active', false)
      .then(({ data }) => { if (active) setAccounts(data || []); });
    return () => { active = false; };
  }, [realClientId]);

  const toggleAcct = (id) => setForm(f => ({ ...f, accts: f.accts.includes(id) ? f.accts.filter(x=>x!==id) : [...f.accts, id] }));

  const createCampaign = async () => {
    if (!form.name.trim()) return;
    const platforms = [...new Set(accounts.filter(a=>form.accts.includes(a.id)).map(a=>a.platform))];
    const row = { client_id: realClientId, name: form.name.trim(), goal: form.goal.trim(), status:'active', start_date: form.start || null, end_date: form.end || null, platform: platforms.join(',') || form.platform };
    const local = { id:'local_'+Date.now(), ...row, accts: form.accts, posts:0, reach:0, engagement:0 };
    setCampaigns(c => [local, ...(usingSample ? [] : c)]); setUsingSample(false);
    setShowCreate(false); setForm({ name:"", goal:"", start:"", end:"", platform:"all", accts:[] });
    try { if (realClientId) await supabase.from('campaigns').insert([row]); } catch (e) {}
  };

  const fmt = (n) => n >= 1000 ? (n/1000).toFixed(n >= 10000 ? 0 : 1)+'K' : String(n || 0);
  const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-GB', { day:'numeric', month:'short' }) : 'TBD';
  const STATUS = { active:{ c:th.success, l:'Active' }, scheduled:{ c:th.warning, l:'Scheduled' }, completed:{ c:th.text2, l:'Completed' } };
  const inp = { width:"100%", background:th.card2, border:`1px solid ${th.border}`, borderRadius:9, padding:"10px 12px", color:th.text, fontSize:13, outline:"none", boxSizing:"border-box", fontFamily:"inherit" };

  return (
    <div className="tw-page-in" style={{ padding:"28px 32px", maxWidth:1100 }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:18, flexWrap:"wrap", gap:12 }}>
        <div>
          <h2 style={{ margin:0, fontSize:21, fontWeight:700, letterSpacing:-0.4 }}>Campaigns</h2>
          <p style={{ margin:"5px 0 0", fontSize:12.5, color:th.text2 }}>Group posts into campaigns and track them against a goal.</p>
        </div>
        <button onClick={()=>setShowCreate(true)} style={{ display:"inline-flex", alignItems:"center", gap:7, padding:"10px 18px", borderRadius:11, background:th.gradient, border:"none", color:"#fff", fontSize:13, fontWeight:700, cursor:"pointer" }}><Plus size={15}/>New campaign</button>
      </div>

      {loading ? <SkCards th={th} count={6} h={120} min={240}/> : (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(320px, 1fr))", gap:16 }}>
          {campaigns.map(c => {
            const st = STATUS[c.status] || STATUS.active;
            return (
              <div key={c.id} style={{ background:th.card, border:`1px solid ${th.border}`, borderRadius:16, padding:18 }}>
                <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:10, marginBottom:12 }}>
                  <div style={{ fontSize:15, fontWeight:700, color:th.text, lineHeight:1.3 }}>{c.name}</div>
                  <span style={{ flexShrink:0, fontSize:10, fontWeight:700, color:st.c, background:st.c+'22', borderRadius:20, padding:"3px 10px" }}>{st.l}</span>
                </div>
                <div style={{ display:"flex", alignItems:"center", gap:7, fontSize:12, color:th.text2, marginBottom:7 }}><Target size={13}/>{c.goal || 'No goal set'}</div>
                <div style={{ display:"flex", alignItems:"center", gap:7, fontSize:12, color:th.text2, marginBottom:14 }}><Calendar size={13}/>{fmtDate(c.start_date)} to {fmtDate(c.end_date)}</div>
                <div style={{ display:"flex", gap:18, paddingTop:14, borderTop:`1px solid ${th.border}` }}>
                  <div><div className="tw-num" style={{ fontSize:17, fontWeight:600, color:th.text }}>{c.posts}</div><div style={{ fontSize:10, color:th.text2, marginTop:2 }}>Posts</div></div>
                  <div><div className="tw-num" style={{ fontSize:17, fontWeight:600, color:th.text }}>{fmt(c.reach)}</div><div style={{ fontSize:10, color:th.text2, marginTop:2 }}>Reach</div></div>
                  <div><div className="tw-num" style={{ fontSize:17, fontWeight:600, color:th.accent }}>{(c.engagement||0)}%</div><div style={{ fontSize:10, color:th.text2, marginTop:2 }}>Engagement</div></div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showCreate && (
        <div onClick={()=>setShowCreate(false)} style={{ position:"fixed", inset:0, background:"rgba(4,6,12,0.72)", backdropFilter:"blur(4px)", zIndex:9999, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
          <div onClick={e=>e.stopPropagation()} style={{ width:"100%", maxWidth:440, background:th.card, border:`1px solid ${th.border}`, borderRadius:18, padding:24, boxShadow:th.shadow }}>
            <h3 style={{ margin:"0 0 16px", fontSize:18, fontWeight:800, color:th.text }}>New campaign</h3>
            <div style={{ fontSize:11, fontWeight:600, color:th.text2, marginBottom:6 }}>Campaign name</div>
            <input value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder="Summer Collection Launch" style={{ ...inp, marginBottom:12 }}/>
            <div style={{ fontSize:11, fontWeight:600, color:th.text2, marginBottom:6 }}>Goal</div>
            <input value={form.goal} onChange={e=>setForm(f=>({...f,goal:e.target.value}))} placeholder="Reach 100K accounts" style={{ ...inp, marginBottom:12 }}/>
            <div style={{ display:"flex", gap:10, marginBottom:18 }}>
              <div style={{ flex:1 }}><div style={{ fontSize:11, fontWeight:600, color:th.text2, marginBottom:6 }}>Start</div><input type="date" value={form.start} onChange={e=>setForm(f=>({...f,start:e.target.value}))} style={inp}/></div>
              <div style={{ flex:1 }}><div style={{ fontSize:11, fontWeight:600, color:th.text2, marginBottom:6 }}>End</div><input type="date" value={form.end} onChange={e=>setForm(f=>({...f,end:e.target.value}))} style={inp}/></div>
            </div>
            <div style={{ fontSize:11, fontWeight:600, color:th.text2, marginBottom:8 }}>Which accounts does this campaign run on?</div>
            <div style={{ display:"flex", flexWrap:"wrap", gap:8, marginBottom:18 }}>
              {accounts.length===0 && <div style={{ fontSize:11.5, color:th.text3 }}>No connected accounts for this client yet.</div>}
              {accounts.map(a=>{ const on=form.accts.includes(a.id); const PI=PlatformIcons[a.platform]; return (
                <div key={a.id} onClick={()=>toggleAcct(a.id)} style={{ display:"flex", alignItems:"center", gap:7, padding:"7px 12px", borderRadius:999, border:`1.5px solid ${on?th.accent:th.border}`, background:on?th.accentSoft:"transparent", color:on?th.accent:th.text2, cursor:"pointer", fontSize:11.5, fontWeight:600 }}>
                  {PI?<PI/>:<Globe size={13}/>}{a.account_name||a.username}{on&&<CheckCircle size={12}/>}
                </div>
              ); })}
            </div>
            <div style={{ display:"flex", gap:8 }}>
              <button onClick={()=>setShowCreate(false)} style={{ flex:1, padding:"11px", borderRadius:11, background:"transparent", border:`1px solid ${th.border}`, color:th.text2, fontSize:13, fontWeight:600, cursor:"pointer" }}>Cancel</button>
              <button onClick={createCampaign} disabled={!form.name.trim()} style={{ flex:2, padding:"12px", borderRadius:11, background:th.gradient, border:"none", color:"#fff", fontSize:13, fontWeight:700, cursor:form.name.trim()?"pointer":"not-allowed", opacity:form.name.trim()?1:0.6 }}>Create campaign</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Streams (live monitoring) ─────────────────────────────────────────
function StreamsPage() {
  const { selClient, dark, lang } = useApp();
  const th = dark ? DARK : LIGHT;
  const isAR = lang === "ar";
  const L = (en, ar) => isAR ? ar : en;
  const brand = selClient?.name || (isAR ? 'علامتك' : 'Your brand');
  const [columns, setColumns] = useState([]);
  const [newCol, setNewCol] = useState("");

  useEffect(() => {
    const slug = brand.toLowerCase().replace(/[^a-z0-9]/g, '');
    const tag = brand.replace(/[^A-Za-z0-9]/g, '');
    setColumns([
      { id:'c1', label:'@'+(slug || 'yourbrand'), kind:'Mentions' },
      { id:'c2', label:'#'+(tag || 'YourBrand'), kind:'Hashtag' },
      { id:'c3', label:'social media', kind:'Keyword' },
    ]);
  }, [selClient]);

  const PLATS = [['ig','#E1306C'], ['fb','#1877F2'], ['li','#0A66C2'], ['tt', th.text2]];
  const feedFor = (label) => {
    const authors = ['mariam.q','gulf.foodie','khaleeji.style','the.daily.bh','noor.designs','urban.manama','adel.reviews','q8.trends','sara.writes','manama.eats','the.gcc.scoop','layla.k','ahmed.shoots','bahrain.bites'];
    const templates = [
      `Honestly ${label} has been a pleasant surprise this week.`,
      `Anyone else following ${label}? The content is on point lately.`,
      `Saw ${label} pop up again, the hype might be real.`,
      `${label} just keeps getting better. Genuinely impressed.`,
      `We featured ${label} in this week's roundup, worth a look.`,
      `Quick shoutout to ${label}, great experience all round.`,
      `Not sponsored, but ${label} deserves more attention.`,
      `${label} replied to my DM in minutes. Rare these days.`,
      `Been comparing options and ${label} stands out for me.`,
      `Tried ${label} on a friend's recommendation, no regrets.`,
      `The way ${label} handled that launch was clean.`,
      `${label} is quietly becoming my favorite this season.`,
      `Okay ${label} understood the assignment with this one.`,
      `Adding ${label} to my list, the reviews look solid.`,
    ];
    let seed = (label.split('').reduce((a,c)=>a+c.charCodeAt(0),0)) * 7 + 13;
    const rnd = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
    const used = new Set();
    const pick = () => { let t, g=0; do { t = Math.floor(rnd()*templates.length); g++; } while (used.has(t) && g < 25); used.add(t); return templates[t]; };
    return Array.from({ length:7 }).map(() => ({
      author: authors[Math.floor(rnd() * authors.length)],
      plat: PLATS[Math.floor(rnd() * PLATS.length)],
      text: pick(),
      time: `${1 + Math.floor(rnd() * 110)}m`,
      likes: Math.floor(rnd() * 320),
      comments: Math.floor(rnd() * 40),
    }));
  };

  const addColumn = () => {
    const v = newCol.trim(); if (!v) return;
    const kind = v.startsWith('#') ? 'Hashtag' : v.startsWith('@') ? 'Mentions' : 'Keyword';
    setColumns(c => [...c, { id:'c'+Date.now(), label:v, kind }]);
    setNewCol("");
  };
  const removeColumn = (id) => setColumns(c => c.filter(x => x.id !== id));

  return (
    <div className="tw-page-in" style={{ padding:"28px 32px" }}>
      <div style={{ display:"flex", alignItems:"flex-end", justifyContent:"space-between", marginBottom:18, flexWrap:"wrap", gap:12 }}>
        <div>
          <h2 style={{ margin:0, fontSize:21, fontWeight:700, letterSpacing:-0.4, display:"flex", alignItems:"center", gap:10 }}>{L("Streams","التدفقات")}<span style={{ fontSize:10, fontWeight:700, color:th.warning, background:th.warningSoft, border:`1px solid ${th.warning}33`, borderRadius:7, padding:"3px 9px", letterSpacing:0.3 }}>{L("PREVIEW","معاينة")}</span></h2>
          <p style={{ margin:"5px 0 0", fontSize:12.5, color:th.text2 }}>{L("A live, side by side pulse of every conversation about your brand.","نبض مباشر جنباً إلى جنب لكل محادثة عن علامتك التجارية.")}</p>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <div style={{ position:"relative" }}>
            <Search size={14} style={{ position:"absolute", left:11, top:"50%", transform:"translateY(-50%)", color:th.text3 }}/>
            <input value={newCol} onChange={e=>setNewCol(e.target.value)} onKeyDown={e=>e.key==='Enter'&&addColumn()} placeholder={L("Add a keyword, #hashtag or @mention","أضف كلمة مفتاحية أو وسماً أو إشارة")} style={{ width:280, background:th.card2, border:`1px solid ${th.border}`, borderRadius:10, padding:"9px 12px 9px 32px", color:th.text, fontSize:12.5, outline:"none", fontFamily:"inherit" }}/>
          </div>
          <button onClick={addColumn} style={{ display:"inline-flex", alignItems:"center", gap:6, padding:"9px 16px", borderRadius:10, background:th.gradient, border:"none", color:"#fff", fontSize:12.5, fontWeight:700, cursor:"pointer" }}><Plus size={14}/>{L("Add","إضافة")}</button>
        </div>
      </div>

      <div style={{ display:"flex", gap:16, overflowX:"auto", paddingBottom:8 }}>
        {columns.length===0 && (
          <div style={{ flex:1, textAlign:"center", padding:"60px 24px" }}>
            <div style={{ width:48, height:48, borderRadius:14, background:th.card2, display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 14px" }}><Activity size={22} color={th.text3}/></div>
            <div style={{ fontSize:15, fontWeight:600, marginBottom:6 }}>{L("No streams yet","لا توجد تدفقات")}</div>
            <div style={{ fontSize:12.5, color:th.text2, maxWidth:360, margin:"0 auto", lineHeight:1.6 }}>{L("Add a keyword, hashtag or mention above to start watching the conversation in real time.","أضف كلمة مفتاحية أو وسماً أو إشارة أعلاه لبدء متابعة المحادثة مباشرةً.")}</div>
          </div>
        )}
        {columns.map(col => (
          <div key={col.id} style={{ width:300, flexShrink:0, background:th.surface, border:`1px solid ${th.border}`, borderRadius:14, display:"flex", flexDirection:"column", maxHeight:"calc(100vh - 230px)" }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"12px 14px", borderBottom:`1px solid ${th.border}` }}>
              <div style={{ display:"flex", alignItems:"center", gap:9 }}>
                <div style={{ width:8, height:8, borderRadius:"50%", background:th.success }}/>
                <div>
                  <div style={{ fontSize:13, fontWeight:700, color:th.text }}>{col.label}</div>
                  <div style={{ fontSize:10, color:th.text2 }}>{isAR ? ({Mentions:"إشارات",Hashtag:"وسم",Keyword:"كلمة مفتاحية"}[col.kind]||col.kind) : col.kind}</div>
                </div>
              </div>
              <button onClick={()=>removeColumn(col.id)} style={{ background:"none", border:"none", cursor:"pointer", color:th.text3, display:"flex" }}><XCircle size={16}/></button>
            </div>
            <div style={{ padding:12, overflowY:"auto" }}>
              {feedFor(col.label).map((item, i) => (
                <div key={i} style={{ background:th.card, border:`1px solid ${th.border}`, borderRadius:10, padding:"10px 12px", marginBottom:8 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:7 }}>
                    <div style={{ width:26, height:26, borderRadius:"50%", background:th.card2, display:"flex", alignItems:"center", justifyContent:"center", fontSize:9.5, fontWeight:700, color:th.text2, flexShrink:0 }}>{item.author.slice(0,2).toUpperCase()}</div>
                    <div style={{ flex:1, minWidth:0, fontSize:11.5, fontWeight:700, color:th.text, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>@{item.author}</div>
                    <span style={{ width:7, height:7, borderRadius:"50%", background:item.plat[1], flexShrink:0 }}/>
                    <span className="tw-num" style={{ fontSize:10, color:th.text3, flexShrink:0 }}>{item.time}</span>
                  </div>
                  <div style={{ fontSize:12, color:th.text, lineHeight:1.5, marginBottom:8 }}>{item.text}</div>
                  <div style={{ display:"flex", gap:14, fontSize:10.5, color:th.text2 }}>
                    <span style={{ display:"inline-flex", alignItems:"center", gap:4 }}><Heart size={11}/><span className="tw-num">{item.likes}</span></span>
                    <span style={{ display:"inline-flex", alignItems:"center", gap:4 }}><MessageCircle size={11}/><span className="tw-num">{item.comments}</span></span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
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

  const statCard = (label, value, sub, color, Icon) => (
    <div style={{ background:th.card, border:`1px solid ${th.border}`, borderRadius:16, padding:18, boxShadow:"0 8px 24px rgba(0,0,0,0.24)", position:"relative", overflow:"hidden" }}>
      <div style={{ position:"absolute", top:0, left:0, width:3, height:"100%", background:color || th.accent }}/>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
        <div style={{ fontSize:11, color:th.text2, fontWeight:600, textTransform:"uppercase", letterSpacing:0.5 }}>{label}</div>
        {Icon && <div style={{ width:30, height:30, borderRadius:9, background:(color || th.accent)+"1f", display:"flex", alignItems:"center", justifyContent:"center" }}><Icon size={15} color={color || th.accent}/></div>}
      </div>
      <div className="tw-num" style={{ fontSize:26, fontWeight:600, color: color || th.text }}>{value}</div>
      {sub && <div style={{ fontSize:11, color:th.text2, marginTop:4 }}>{sub}</div>}
    </div>
  );

  const statusColor = (st) => st === 'ACTIVE' ? th.success : st === 'PAUSED' ? th.warning : th.text2;
  const emptyState = (Icon, title, body) => (
    <div style={{ background:th.card, border:`1px solid ${th.border}`, borderRadius:18, padding:"48px 24px", textAlign:"center", boxShadow:"none" }}>
      <div style={{ width:58, height:58, borderRadius:17, background:th.accentSoft, display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 15px" }}><Icon size={26} color={th.accent}/></div>
      <div style={{ fontSize:15, fontWeight:600, marginBottom:6 }}>{title}</div>
      <div style={{ fontSize:12.5, color:th.text2, lineHeight:1.7, maxWidth:430, margin:"0 auto" }}>{body}</div>
    </div>
  );

  return (
    <div style={{ padding:"28px 32px", maxWidth:1200 }}>
      <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", flexWrap:"wrap", gap:14, marginBottom:22 }}>
        <div>
          <h2 style={{ margin:0, fontSize:21, fontWeight:700, letterSpacing:-0.4 }}>Ads performance</h2>
          <p style={{ margin:"6px 0 0", fontSize:12.5, color:th.text2 }}>Last 30 days &middot; {selClient?.name || "your brand"}</p>
        </div>
        <button onClick={()=>fetchAds(accounts)} disabled={loading} style={{ padding:"10px 18px", borderRadius:11, background:th.gradient, border:"none", color:"#fff", fontSize:12.5, fontWeight:600, cursor:"pointer", display:"flex", alignItems:"center", gap:7, opacity:loading?0.7:1 }}>
          <RefreshCw size={14}/> {loading ? 'Loading…' : 'Refresh'}
        </button>
      </div>

      {loading ? (
        <div><SkStatRow th={th} n={4}/><SkChart th={th}/></div>
      ) : error ? (
        emptyState(Megaphone, "Ads insights are on the way", <>Connect a Facebook account that has ad account access to see your campaign performance here, including spend, reach and results, all in one place.</>)
      ) : !adsData ? (
        emptyState(BarChart2, "No ad account connected", "Connect a Facebook account that has ad-account access (via Social Accounts), then reconnect to see campaign performance here.")
      ) : adsData.campaigns.length === 0 ? (
        emptyState(Megaphone, "No campaigns in the last 30 days", "Launch a campaign in Meta Ads Manager and it'll appear here automatically.")
      ) : (
        <>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:16, marginBottom:16 }}>
            {statCard("Total spend", `$${adsData.summary.totalSpend}`, "Last 30 days", th.danger, DollarSign)}
            {statCard("Total reach", adsData.summary.totalReach.toLocaleString(), "Unique accounts", "#E1306C", Eye)}
            {statCard("Total clicks", adsData.summary.totalClicks.toLocaleString(), `Avg CPC $${adsData.summary.avgCPC}`, th.accent, Target)}
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:16, marginBottom:24 }}>
            {statCard("Impressions", adsData.summary.totalImpressions.toLocaleString(), "Total views", th.accent2, TrendingUp)}
            {statCard("Avg CPM", `$${adsData.summary.avgCPM}`, "Per 1k impressions", th.warning, Activity)}
            {statCard("Campaigns", adsData.campaigns.length.toString(), `${adsData.campaigns.filter(c=>c.status==='ACTIVE').length} active`, th.success, Megaphone)}
          </div>

          <div style={{ background:th.card, border:`1px solid ${th.border}`, borderRadius:16, overflow:"hidden", boxShadow:"none" }}>
            <div style={{ padding:"15px 20px", borderBottom:`1px solid ${th.border}`, fontSize:13, fontWeight:700 }}>Campaigns</div>
            <div style={{ overflowX:"auto" }}>
              <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
                <thead>
                  <tr style={{ background:th.card2 }}>
                    {["Campaign","Status","Objective","Spend","Reach","Impressions","Clicks","CPC"].map(h => (
                      <th key={h} style={{ padding:"11px 16px", textAlign:"left", fontWeight:700, color:th.text2, fontSize:10.5, textTransform:"uppercase", letterSpacing:0.5, whiteSpace:"nowrap" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {adsData.campaigns.map((c, i) => (
                    <tr key={c.id} style={{ borderTop:`1px solid ${th.border}` }}>
                      <td style={{ padding:"13px 16px", fontWeight:600, maxWidth:200, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{c.name}</td>
                      <td style={{ padding:"13px 16px" }}><span style={{ fontSize:10, fontWeight:700, padding:"3px 9px", borderRadius:999, background:`${statusColor(c.status)}22`, color:statusColor(c.status) }}>{c.status}</span></td>
                      <td style={{ padding:"13px 16px", color:th.text2 }}>{c.objective?.replace(/_/g,' ')}</td>
                      <td style={{ padding:"13px 16px", fontWeight:700, color:th.danger }}>${c.spend.toFixed(2)}</td>
                      <td style={{ padding:"13px 16px" }}>{c.reach.toLocaleString()}</td>
                      <td style={{ padding:"13px 16px" }}>{c.impressions.toLocaleString()}</td>
                      <td style={{ padding:"13px 16px" }}>{c.clicks.toLocaleString()}</td>
                      <td style={{ padding:"13px 16px", color:th.text2 }}>${c.cpc.toFixed(2)}</td>
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
  const { selClient, dark, clients } = useApp();
  const th = dark ? DARK : LIGHT;
  const [allAccounts, setAllAccounts] = useState([]);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [rClient, setRClient] = useState("all");
  const [rPlat, setRPlat] = useState("all");

  const cName = (id) => (clients.find(c=>String(c.id)===String(id))||{}).name || "";
  const platLabel = (p) => ({ ig:"Instagram", fb:"Facebook", li:"LinkedIn", tt:"TikTok", tw:"X", yt:"YouTube" }[p] || p);

  // Load every connected account across all of this user's clients.
  useEffect(() => {
    const ids = (clients||[]).map(c=>c.id).filter(Boolean);
    if (!ids.length) { setAllAccounts([]); return; }
    supabase.from('social_accounts').select('*').in('client_id', ids).neq('is_active', false)
      .then(({ data }) => setAllAccounts(data || []));
  }, [clients]);

  // Default the picker to the currently-selected client when possible.
  useEffect(() => {
    if (selClient && selClient.id && (clients||[]).some(c=>String(c.id)===String(selClient.id))) setRClient(String(selClient.id));
  }, [selClient, clients]);

  const accounts = allAccounts.filter(a =>
    (rClient === "all" || String(a.client_id) === String(rClient)) &&
    (rPlat === "all" || a.platform === rPlat)
  );

  // Pull Instagram analytics for the first IG account in the current view.
  useEffect(() => {
    const ig = accounts.find(a => a.platform === 'ig');
    if (!ig) { setAnalyticsData(null); return; }
    fetch('/api/instagram-analytics', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ accountId: ig.account_id, accessToken: ig.access_token }) })
      .then(r => r.json()).then(d => setAnalyticsData(d && !d.error ? d : null)).catch(()=>setAnalyticsData(null));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rClient, rPlat, allAccounts.length]);

  const now = new Date();
  const month = now.toLocaleString('default', { month: 'long', year: 'numeric' });
  const totalFollowers = accounts.reduce((s,a)=>s+(a.followers_count||0),0);
  const platforms = [...new Set(accounts.map(a=>a.platform))];
  const allPlatforms = [...new Set(allAccounts.map(a=>a.platform))];
  const reportName = rClient === "all" ? "All clients" : (cName(rClient) || selClient?.name || "Report");
  const scopeLabel = reportName + (rPlat !== "all" ? " · " + platLabel(rPlat) : "");

  const exportPDF = () => {

    const igAccounts = accounts.filter(a => a.platform === 'ig');
    const fbAccounts = accounts.filter(a => a.platform === 'fb');
    const topPosts = analyticsData
      ? [...analyticsData.recentPosts].sort((a,b)=>(b.likes+b.comments)-(a.likes+a.comments)).slice(0,5)
      : [];
    const maxEng = topPosts.length ? topPosts[0].likes + topPosts[0].comments : 1;

    const postsHtml = topPosts.map((p, i) => {
      const thumbHtml = p.thumbnail
        ? '<img class="post-img" src="' + p.thumbnail + '" alt="" onerror="this.style.display=\'none\'"/>'
        : '<div class="post-imgph"></div>';
      const cap = (p.caption || '(No caption)').replace(/</g,'&lt;').replace(/>/g,'&gt;');
      const reachStat = p.reach > 0 ? '<div><div class="pstat-v">' + p.reach.toLocaleString() + '</div><div class="pstat-l">Reach</div></div>' : '';
      return '<div class="post">' + thumbHtml +
        '<div class="post-b"><div><div class="post-rank">#' + (i+1) + ' Top post</div>' +
        '<div class="post-cap">' + cap + '</div></div>' +
        '<div class="post-stats"><div><div class="pstat-v">' + p.likes.toLocaleString() + '</div><div class="pstat-l">Likes</div></div>' +
        '<div><div class="pstat-v">' + p.comments.toLocaleString() + '</div><div class="pstat-l">Comments</div></div>' +
        reachStat + '</div></div></div>';
    }).join('');

    const accountsHtml = accounts.map(a =>
      '<tr><td style="padding:13px 0;border-bottom:1px solid #f3f4f7;font-size:13px;font-weight:600">' + a.account_name + (a.username ? ' <span style="color:#9aa3b2;font-weight:400;font-size:11px">@' + a.username + '</span>' : '') + '</td>' +
      '<td style="padding:13px 0;border-bottom:1px solid #f3f4f7;font-size:12px;color:#6b7280">' + platLabel(a.platform) + '</td>' +
      '<td style="padding:13px 0;border-bottom:1px solid #f3f4f7;text-align:right;font-size:14px;font-weight:700">' + (a.followers_count||0).toLocaleString() + '</td></tr>'
    ).join('');

    // Reach trend chart for the report (real SVG line, not boxes).
    const chartVals = (analyticsData && analyticsData.chartData) ? analyticsData.chartData.map(c=>c.reach||0) : [];
    let reachChartSvg = '';
    if (chartVals.length > 1) {
      const CW=620, CH=170, mx=Math.max(1,...chartVals);
      const cpts = chartVals.map((v,i)=>[(i/(chartVals.length-1))*CW, CH-(v/mx)*(CH-24)-12]);
      const cline = 'M'+cpts.map(p=>p[0].toFixed(1)+','+p[1].toFixed(1)).join(' L');
      reachChartSvg = '<svg viewBox="0 0 '+CW+' '+CH+'" width="100%" height="170" preserveAspectRatio="none">'+
        '<defs><linearGradient id="rg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6E8CAB" stop-opacity="0.18"/><stop offset="1" stop-color="#6E8CAB" stop-opacity="0"/></linearGradient></defs>'+
        '<path d="'+cline+' L'+CW+','+CH+' L0,'+CH+' Z" fill="url(#rg)"/>'+
        '<path d="'+cline+'" fill="none" stroke="#6E8CAB" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    }
    const platColors = { ig:'#E1306C', fb:'#1877F2', li:'#0A66C2', tt:'#111111', tw:'#1DA1F2', yt:'#FF0000' };
    const platTotals = {}; accounts.forEach(a=>{ platTotals[a.platform]=(platTotals[a.platform]||0)+(a.followers_count||0); });
    const platBarsHtml = Object.entries(platTotals).sort((a,b)=>b[1]-a[1]).map(([p,f])=>{
      const pv = totalFollowers>0?Math.round(f/totalFollowers*100):0;
      return '<div class="pbar"><div class="pbar-top"><span class="pbar-name">'+platLabel(p)+'</span><span class="pbar-val">'+f.toLocaleString()+' &middot; '+pv+'%</span></div><div class="pbar-track"><div class="pbar-fill" style="width:'+pv+'%;background:'+(platColors[p]||'#6E8CAB')+'"></div></div></div>';
    }).join('');

    const html = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>${reportName} — ${month} Report</title>
<style>
  @page{margin:0;size:A4}
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:'Segoe UI',Helvetica,Arial,sans-serif;background:#fff;color:#16181d;-webkit-print-color-adjust:exact;print-color-adjust:exact}
  .cover{height:100vh;background:linear-gradient(150deg,#080B11 0%,#10141C 55%,#1A2230 100%);display:flex;flex-direction:column;justify-content:space-between;padding:64px;page-break-after:always;color:#fff}
  .clogo{display:flex;align-items:center;gap:13px}
  .clogo .mk{width:46px;height:46px;border-radius:13px;background:linear-gradient(135deg,#6E8CAB,#4F6B8C);display:flex;align-items:center;justify-content:center;font-size:22px;font-weight:800}
  .clogo .nm{font-size:30px;font-weight:800;letter-spacing:-1px}
  .ctag{font-size:11px;color:rgba(255,255,255,.4);margin-top:10px;letter-spacing:3px;text-transform:uppercase}
  .clabel{font-size:12px;color:rgba(157,182,214,.85);text-transform:uppercase;letter-spacing:3px;margin-bottom:14px;font-weight:600}
  .cclient{font-size:54px;font-weight:800;line-height:1.04;margin-bottom:14px;letter-spacing:-1.8px}
  .csub{font-size:17px;color:rgba(255,255,255,.5);margin-bottom:30px}
  .cpill{display:inline-block;background:rgba(110,140,171,.18);border:1px solid rgba(110,140,171,.45);color:#9DB6D6;padding:11px 24px;border-radius:30px;font-size:13px;font-weight:600}
  .cft{display:flex;justify-content:space-between;align-items:flex-end;font-size:10px;color:rgba(255,255,255,.3);line-height:1.8}
  .page{padding:56px 60px;page-break-after:always}
  .page:last-child{page-break-after:auto}
  .ph{display:flex;justify-content:space-between;align-items:center;margin-bottom:46px}
  .ph-l{display:flex;align-items:center;gap:8px;font-size:13px;font-weight:800;color:#16181d}
  .ph-l .mk{width:20px;height:20px;border-radius:6px;background:linear-gradient(135deg,#6E8CAB,#4F6B8C)}
  .ph-r{font-size:10px;color:#9aa3b2;text-align:right;line-height:1.6}
  .eyebrow{font-size:11px;font-weight:700;color:#4F6B8C;text-transform:uppercase;letter-spacing:3px;margin-bottom:20px}
  .hero{display:flex;align-items:flex-end;gap:16px}
  .hero-num{font-size:74px;font-weight:800;letter-spacing:-3px;line-height:.85;color:#16181d}
  .hero-tag{font-size:13px;font-weight:700;color:#0E9F6E;padding-bottom:10px;text-transform:uppercase;letter-spacing:1px}
  .hero-cap{font-size:15px;color:#6b7280;margin:18px 0 34px;max-width:540px;line-height:1.7}
  .chartwrap{margin:0 0 40px}
  .hl-row{display:flex;border-top:1px solid #ececf2;padding-top:28px}
  .hl{flex:1;border-right:1px solid #ececf2;padding:0 26px}
  .hl:first-child{padding-left:0}.hl:last-child{border-right:none;padding-right:0}
  .hl-v{font-size:33px;font-weight:800;letter-spacing:-1px;color:#16181d}
  .hl-l{font-size:11px;color:#9aa3b2;margin-top:9px;text-transform:uppercase;letter-spacing:.5px;font-weight:600}
  .pbar{margin-bottom:24px}
  .pbar-top{display:flex;justify-content:space-between;align-items:baseline;margin-bottom:9px}
  .pbar-name{font-size:15px;font-weight:700}
  .pbar-val{font-size:13px;color:#6b7280;font-weight:600}
  .pbar-track{height:10px;background:#f0f1f5;border-radius:6px;overflow:hidden}
  .pbar-fill{height:10px;border-radius:6px}
  .post{display:flex;margin-bottom:20px;border:1px solid #ececf2;border-radius:16px;overflow:hidden}
  .post-img{width:155px;min-width:155px;height:155px;object-fit:cover}
  .post-imgph{width:155px;min-width:155px;height:155px;background:linear-gradient(135deg,#e9edf3,#f4f6fa)}
  .post-b{flex:1;padding:22px 26px;display:flex;flex-direction:column;justify-content:space-between}
  .post-rank{font-size:11px;font-weight:700;color:#4F6B8C;text-transform:uppercase;letter-spacing:2px;margin-bottom:9px}
  .post-cap{font-size:14px;color:#374151;line-height:1.6;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}
  .post-stats{display:flex;gap:36px;margin-top:16px}
  .pstat-v{font-size:22px;font-weight:800;letter-spacing:-.5px}
  .pstat-l{font-size:10px;color:#9aa3b2;text-transform:uppercase;letter-spacing:.5px;margin-top:3px;font-weight:600}
  .ft{margin-top:46px;padding-top:16px;border-top:1px solid #ececf2;display:flex;justify-content:space-between;font-size:10px;color:#c4c9d2}
</style></head><body>

<div class="cover">
  <div><div class="clogo"><div class="mk">T</div><div class="nm">Tawaslo</div></div><div class="ctag">Social Intelligence Platform</div></div>
  <div>
    <div class="clabel">Monthly Social Media Report</div>
    <div class="cclient">${reportName}</div>
    <div class="csub">${rPlat !== "all" ? platLabel(rPlat) + " · " : ""}Performance &amp; Insights</div>
    <div class="cpill">${month}</div>
  </div>
  <div class="cft"><div>Generated ${now.toLocaleDateString('en-US',{weekday:'long',year:'numeric',month:'long',day:'numeric'})}<br/>Confidential &mdash; Prepared by Tawaslo</div><div>tawaslo.com</div></div>
</div>

<div class="page">
  <div class="ph"><div class="ph-l"><div class="mk"></div>Tawaslo</div><div class="ph-r">${reportName}<br/>${month} &middot; Executive Summary</div></div>
  <div class="eyebrow">The month at a glance</div>
  ${analyticsData ? `
    <div class="hero"><div class="hero-num">${analyticsData.summary.totalReach.toLocaleString()}</div><div class="hero-tag">People reached</div></div>
    <div class="hero-cap">${reportName} reached <strong>${analyticsData.summary.totalReach.toLocaleString()}</strong> people this month and earned a <strong>${analyticsData.summary.engagementRate}%</strong> engagement rate across ${accounts.length} ${accounts.length===1?'account':'accounts'}.</div>
    <div class="chartwrap">${reachChartSvg}</div>
    <div class="hl-row">
      <div class="hl"><div class="hl-v">${totalFollowers.toLocaleString()}</div><div class="hl-l">Total followers</div></div>
      <div class="hl"><div class="hl-v">${analyticsData.summary.totalLikes.toLocaleString()}</div><div class="hl-l">Likes earned</div></div>
      <div class="hl"><div class="hl-v">${analyticsData.summary.engagementRate}%</div><div class="hl-l">Engagement rate</div></div>
    </div>` : `
    <div class="hero"><div class="hero-num">${totalFollowers.toLocaleString()}</div><div class="hero-tag">Total followers</div></div>
    <div class="hero-cap">${reportName} is present on ${platforms.length} ${platforms.length===1?'platform':'platforms'} across ${accounts.length} connected ${accounts.length===1?'account':'accounts'}.</div>
    <div class="hl-row">
      <div class="hl"><div class="hl-v">${accounts.length}</div><div class="hl-l">Connected accounts</div></div>
      <div class="hl"><div class="hl-v">${platforms.length}</div><div class="hl-l">Platforms</div></div>
      <div class="hl"><div class="hl-v">${totalFollowers.toLocaleString()}</div><div class="hl-l">Total followers</div></div>
    </div>`}
  <div class="ft"><div>Tawaslo &mdash; Social Intelligence &middot; tawaslo.com</div><div>Confidential &middot; ${reportName}</div></div>
</div>

<div class="page">
  <div class="ph"><div class="ph-l"><div class="mk"></div>Tawaslo</div><div class="ph-r">${reportName}<br/>${month} &middot; Platform Performance</div></div>
  <div class="eyebrow">Where your audience lives</div>
  <div style="margin-bottom:46px">${platBarsHtml || '<div style="color:#9aa3b2;font-size:13px">Connect an account to see your platform breakdown.</div>'}</div>
  <div class="eyebrow">Connected accounts</div>
  <table style="width:100%;border-collapse:collapse">
    <thead><tr><th style="text-align:left;font-size:10px;color:#9aa3b2;text-transform:uppercase;letter-spacing:.5px;padding:9px 0;border-bottom:1px solid #ececf2;font-weight:700">Account</th><th style="text-align:left;font-size:10px;color:#9aa3b2;text-transform:uppercase;padding:9px 0;border-bottom:1px solid #ececf2;font-weight:700">Platform</th><th style="text-align:right;font-size:10px;color:#9aa3b2;text-transform:uppercase;padding:9px 0;border-bottom:1px solid #ececf2;font-weight:700">Followers</th></tr></thead>
    <tbody>${accountsHtml}</tbody>
  </table>
  <div class="ft"><div>Tawaslo &mdash; Social Intelligence &middot; tawaslo.com</div><div>Confidential &middot; ${reportName}</div></div>
</div>

${topPosts.length > 0 ? `<div class="page">
  <div class="ph"><div class="ph-l"><div class="mk"></div>Tawaslo</div><div class="ph-r">${reportName}<br/>${month} &middot; Top Content</div></div>
  <div class="eyebrow">Your best-performing posts</div>
  ${postsHtml}
  <div class="ft"><div>Tawaslo &mdash; Social Intelligence &middot; tawaslo.com</div><div>Confidential &middot; ${reportName}</div></div>
</div>` : ''}

<script>window.onload=function(){window.print();}</script>
</body></html>`;
    const w = window.open('', '_blank');
    w.document.write(html);
    w.document.close();
  };

  const PMETA = { ig:{n:"Instagram",c:"#E1306C",I:FaInstagram}, fb:{n:"Facebook",c:"#1877F2",I:FaFacebook}, tw:{n:"X",c:th.text,I:FaTwitter}, li:{n:"LinkedIn",c:"#0A66C2",I:FaLinkedin}, tt:{n:"TikTok",c:th.text2,I:FaTiktok}, yt:{n:"YouTube",c:"#FF0000",I:FaYoutube} };
  const byPlat = platforms.map(p => { const accs = accounts.filter(a=>a.platform===p); return { p, meta:PMETA[p]||{n:p,c:th.accent,I:Globe}, followers:accs.reduce((s,a)=>s+(a.followers_count||0),0), count:accs.length }; }).sort((a,b)=>b.followers-a.followers);
  const maxF = Math.max(1, ...accounts.map(a=>a.followers_count||0));
  const er = analyticsData && analyticsData.summary ? analyticsData.summary.engagementRate : null;
  const chart = (analyticsData && analyticsData.chartData) ? analyticsData.chartData : [];
  const rcard = { background:th.card, border:`1px solid ${th.border}`, borderRadius:16, boxShadow:"none" };
  const kpis = [
    { label:"Total followers", value: totalFollowers.toLocaleString(), Icon:Users, color:"success" },
    { label:"Connected accounts", value: String(accounts.length), Icon:Link, color:"accent" },
    { label:"Platforms", value: String(platforms.length), Icon:Globe, color:"warning" },
    { label:"Engagement rate", value: (er != null ? er : 0)+"%", Icon:Heart, color:"accent2" },
  ];

  return (
    <div style={{padding:"26px 30px", maxWidth:1060}}>
      <div style={{marginBottom:18}}>
        <div style={{display:"flex", justifyContent:"space-between", alignItems:"flex-start", flexWrap:"wrap", gap:12, marginBottom:14}}>
          <div>
            <h2 style={{margin:0, fontSize:20, fontWeight:600, letterSpacing:-0.3}}>Reports</h2>
            <p style={{margin:"5px 0 0", fontSize:12.5, color:th.text2}}>Performance summary · {month} · <span style={{color:th.text}}>{scopeLabel}</span></p>
          </div>
          <button onClick={exportPDF} style={{padding:"11px 20px", borderRadius:11, background:th.gradient, border:"none", color:"#fff", fontSize:12.5, fontWeight:600, cursor:"pointer", display:"flex", alignItems:"center", gap:7, boxShadow:"none"}}>
            <Download size={15}/> Export PDF
          </button>
        </div>
        <div style={{display:"flex", gap:10, flexWrap:"wrap", alignItems:"center"}}>
          <span style={{fontSize:11, color:th.text3, fontWeight:600}}>Showing</span>
          <select value={rClient} onChange={e=>setRClient(e.target.value)} style={{padding:"9px 13px", borderRadius:10, border:`1px solid ${th.border}`, background:th.card, color:th.text, fontSize:12.5, fontWeight:600, outline:"none", fontFamily:"inherit", cursor:"pointer"}}>
            <option value="all">All clients</option>
            {clients.map(c=><option key={c.id} value={String(c.id)}>{c.name}</option>)}
          </select>
          <select value={rPlat} onChange={e=>setRPlat(e.target.value)} style={{padding:"9px 13px", borderRadius:10, border:`1px solid ${th.border}`, background:th.card, color:th.text, fontSize:12.5, fontWeight:600, outline:"none", fontFamily:"inherit", cursor:"pointer"}}>
            <option value="all">All platforms</option>
            {allPlatforms.map(p=><option key={p} value={p}>{platLabel(p)}</option>)}
          </select>
        </div>
      </div>

      {accounts.length>0 && (
        <div style={{background:`linear-gradient(120deg, ${th.accent}1a, ${th.accent}03)`, border:`1px solid ${th.border}`, borderLeft:`2px solid ${th.accent}`, borderRadius:14, padding:"13px 18px", marginBottom:16, fontSize:13.5, color:th.text2, lineHeight:1.6}}>
          {scopeLabel} reaches <span className="tw-num" style={{color:th.text, fontWeight:600}}>{totalFollowers.toLocaleString()}</span> followers across <span className="tw-num" style={{color:th.text, fontWeight:600}}>{accounts.length}</span> {accounts.length===1?"account":"accounts"} on <span className="tw-num">{platforms.length}</span> {platforms.length===1?"platform":"platforms"}{er!=null?<>, with a <span className="tw-num" style={{color:th.success, fontWeight:600}}>{er}%</span> engagement rate</>:""}.
        </div>
      )}

      <div style={{display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:13, marginBottom:16}}>
        {kpis.map((s,i)=><StatCard key={i} {...s}/>)}
      </div>

      <div style={{display:"grid", gridTemplateColumns: chart.length ? "1.4fr 1fr" : "1fr", gap:16, marginBottom:16}}>
        <div style={{...rcard, padding:20}}>
          <div style={{fontSize:13, fontWeight:600, marginBottom:16, display:"flex", alignItems:"center", gap:8}}><PieChart size={15} color={th.accent}/>Followers by platform</div>
          {byPlat.length === 0 ? <div style={{fontSize:12.5, color:th.text3, padding:"10px 0"}}>Connect an account to see your reach by platform.</div> : byPlat.map(b => { const pct = totalFollowers>0 ? Math.round(b.followers/totalFollowers*100) : 0; const Ic=b.meta.I; return (
            <div key={b.p} style={{marginBottom:14}}>
              <div style={{display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:6}}>
                <span style={{display:"flex", alignItems:"center", gap:8, fontSize:12.5, fontWeight:600}}><Ic style={{color:b.meta.c, fontSize:15}}/>{b.meta.n} <span style={{color:th.text3, fontWeight:400}}>· {b.count} {b.count===1?"account":"accounts"}</span></span>
                <span className="tw-num" style={{fontSize:12.5, color:th.text2}}>{b.followers.toLocaleString()} <span style={{color:th.text3}}>({pct}%)</span></span>
              </div>
              <div style={{height:8, background:th.card2, borderRadius:5, overflow:"hidden"}}><div style={{height:"100%", width:pct+"%", background:b.meta.c, borderRadius:5}}/></div>
            </div>
          ); })}
        </div>
        {chart.length > 0 && (
          <div style={{...rcard, padding:20}}>
            <div style={{fontSize:13, fontWeight:600, marginBottom:6, display:"flex", alignItems:"center", gap:8}}><TrendingUp size={15} color={th.accent}/>Reach · last 30 days</div>
            <div className="tw-num" style={{fontSize:26, fontWeight:600, marginBottom:8}}>{((analyticsData.summary&&analyticsData.summary.totalReach)||0).toLocaleString()}</div>
            {(() => { const vals=chart.map(c=>c.reach||0); const mx=Math.max(1,...vals); const W=300,H=90; const pts=vals.map((v,i)=>[(i/(Math.max(1,vals.length-1)))*W, H-(v/mx)*(H-8)-4]); const line="M"+pts.map(p=>p[0].toFixed(1)+","+p[1].toFixed(1)).join(" L"); return (
              <svg viewBox={`0 0 ${W} ${H}`} style={{width:"100%", height:90, overflow:"visible"}}>
                <defs><linearGradient id="rptr" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={th.accent} stopOpacity="0.3"/><stop offset="100%" stopColor={th.accent} stopOpacity="0"/></linearGradient></defs>
                <path d={`${line} L${W},${H} L0,${H} Z`} fill="url(#rptr)"/>
                <path d={line} fill="none" stroke={th.accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            ); })()}
          </div>
        )}
      </div>

      <div style={{...rcard, overflow:"hidden"}}>
        <div style={{padding:"14px 20px", borderBottom:`1px solid ${th.border}`, fontSize:13, fontWeight:600, display:"flex", alignItems:"center", gap:8}}><Users size={15} color={th.accent}/>Account breakdown</div>
        {accounts.length === 0 ? (
          <EmptyState compact Icon={Link} title="No accounts connected" body="Connect your social accounts to see a full performance breakdown here." />
        ) : accounts.map((acc,i) => { const meta=PMETA[acc.platform]||{n:acc.platform,c:th.accent,I:Globe}; const Ic=meta.I; const f=acc.followers_count||0; const pct=Math.round(f/maxF*100); return (
          <div key={acc.id} style={{display:"flex", alignItems:"center", gap:14, padding:"13px 20px", borderBottom:i<accounts.length-1?`1px solid ${th.border}`:"none"}}>
            <div style={{position:"relative", width:38, height:38, borderRadius:11, background:th.gradient, display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, fontWeight:700, color:"#fff", flexShrink:0}}>{(acc.account_name||"?").slice(0,2).toUpperCase()}<div style={{position:"absolute", right:-4, bottom:-4, width:18, height:18, borderRadius:"50%", background:th.card, border:`1px solid ${th.border}`, display:"flex", alignItems:"center", justifyContent:"center"}}><Ic style={{color:meta.c, fontSize:10}}/></div></div>
            <div style={{flex:1, minWidth:0}}>
              <div style={{fontSize:13, fontWeight:600, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis"}}>{acc.account_name}{acc.username && <span style={{color:th.text3, fontWeight:400}}> · @{acc.username}</span>}</div>
              <div style={{height:6, background:th.card2, borderRadius:4, overflow:"hidden", marginTop:6, maxWidth:280}}><div style={{height:"100%", width:pct+"%", background:meta.c, borderRadius:4}}/></div>
            </div>
            <div style={{textAlign:"right", flexShrink:0}}><div className="tw-num" style={{fontSize:15, fontWeight:600}}>{f.toLocaleString()}</div><div style={{fontSize:10.5, color:th.text3}}>followers</div></div>
          </div>
        ); })}
      </div>
    </div>
  );
}

function InboxPage() {
  const { selClient, dark, lang } = useApp();
  const th = dark ? DARK : LIGHT;
  const isAR = lang === "ar";
  const L = (en, ar) => isAR ? ar : en;
  const PLAT = { ig:{name:"Instagram",color:"#E1306C",Icon:FaInstagram}, fb:{name:"Facebook",color:"#1877F2",Icon:FaFacebook}, tw:{name:"X",color:th.text,Icon:FaTwitter}, li:{name:"LinkedIn",color:"#0A66C2",Icon:FaLinkedin}, tt:{name:"TikTok",color:th.text,Icon:FaTiktok}, yt:{name:"YouTube",color:"#FF0000",Icon:FaYoutube} };
  const platOf = (m) => PLAT[m && m.platform] || PLAT.ig;
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
  const [apiError, setApiError] = useState('');
  const [sampleMode, setSampleMode] = useState(false);

  const ago = (min) => new Date(Date.now() - min * 60000).toISOString();
  const SAMPLE = [
    { id:'s1', platform:'ig', from:'sara.alkhalifa', text:'This looks amazing 😍 where can I order from?', time:ago(8), type:'comment', mediaCaption:'New weekend brunch menu', likeCount:14, replies:[], sample:true },
    { id:'s2', platform:'fb', from:'foodie.bahrain', text:'Came by yesterday — best service in Adliya 🙌', time:ago(42), type:'comment', mediaCaption:'New weekend brunch menu', likeCount:31, replies:[{ id:'r1', username:'marinacafe', text:'Thank you so much! See you again soon 🤍' }], sample:true },
    { id:'s3', platform:'ig', from:'mohammed_q8', text:'هل يوجد توصيل للمنطقة؟ وكم سعر البرانش؟', time:ago(95), type:'comment', mediaCaption:'New weekend brunch menu', likeCount:5, replies:[], sample:true },
    { id:'s4', platform:'ig', from:'lulwa.events', text:'Hi! Can you send me your catering & private events pricing?', time:ago(180), type:'dm', likeCount:0, replies:[], sample:true },
    { id:'s5', platform:'fb', from:'ahmed.alsayed', text:'Do you open early on Fridays? 🕌', time:ago(300), type:'comment', mediaCaption:'Ramadan timings', likeCount:2, replies:[], sample:true },
    { id:'s6', platform:'ig', from:'noor.designs', text:'Featured you in my story! Tag me back please 💛', time:ago(540), type:'dm', likeCount:0, replies:[], sample:true },
  ];
  const loadSample = () => { setSampleMode(true); setApiError(''); setMessages(SAMPLE); setSelected(SAMPLE[0]); };
  const exitSample = () => { setSampleMode(false); setMessages([]); setSelected(null); fetchInbox(); };

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
    if (sampleMode) return;
    if (accounts.length === 0) return;
    fetchInbox();
  }, [accounts, sampleMode]);

  const sendReply = async () => {
    if (!reply.trim() || !selected || selected.type === 'dm') return;
    if (selected.sample) { setReply(''); setReplySuccess(true); setTimeout(()=>setReplySuccess(false),3000); return; }
    const acc = accounts.find(a => a.platform === 'ig');
    if (!acc) return;
    setReplying(true); setReplyError(''); setReplySuccess(false);
    try {
      const res = await fetch('/api/instagram-inbox', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'reply', commentId: selected.id, message: reply, accessToken: acc.access_token }),
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
    setLoading(true); setApiError('');
    const allMessages = [];
    let lastError = '';
    for (const acc of accounts.filter(a => a.platform === 'ig')) {
      // Comments
      try {
        const res = await fetch('/api/instagram-inbox', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ accountId: acc.account_id, accessToken: acc.access_token, type: 'comments' }),
        });
        const data = await res.json();
        if (data.data) allMessages.push(...data.data.map(m => ({ ...m, accountName: acc.account_name })));
        else if (data.error) lastError = data.error;
      } catch(e) { lastError = e.message; console.warn('Inbox comments error:', e); }
      // Direct messages — non-fatal. Instagram only returns DMs from the last 24h / where the
      // user messaged the business first, so an empty result here is normal, not an error.
      try {
        const dmRes = await fetch('/api/instagram-inbox', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ accountId: acc.account_id, accessToken: acc.access_token, type: 'messages' }),
        });
        const dmData = await dmRes.json();
        if (dmData.data) allMessages.push(...dmData.data.map(m => ({ ...m, accountName: acc.account_name })));
      } catch(e) { /* DMs optional — ignore */ }
    }
    allMessages.sort((a, b) => new Date(b.time) - new Date(a.time));
    setMessages(allMessages);
    if (allMessages.length > 0) setSelected(allMessages[0]);
    if (allMessages.length === 0 && lastError) setApiError(lastError);
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
  const commentCount = messages.filter(m => m.type === 'comment').length;
  const dmCount = messages.filter(m => m.type === 'dm').length;
  const needReply = messages.filter(m => m.type === 'comment' && (!m.replies || m.replies.length === 0)).length;
  const mono = (name, size) => <div style={{width:size,height:size,borderRadius:"50%",background:"linear-gradient(135deg,#6E8CAB,#4F6B8C)",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:Math.round(size*0.42),fontWeight:700,flexShrink:0}}>{(name||"?").replace(/^@/,'')[0].toUpperCase()}</div>;

  return (
    <div style={{padding:"28px 32px", maxWidth:1200}}>
      <div style={{marginBottom:16, display:"flex", justifyContent:"space-between", alignItems:"flex-end", flexWrap:"wrap", gap:12}}>
        <div>
          <h2 style={{margin:0, fontSize:20, fontWeight:600, letterSpacing:-0.3}}>{L("Inbox","الوارد")}</h2>
          <p style={{margin:"5px 0 0", fontSize:12.5, color:th.text2}}>{selClient?.name || L("Your brand","علامتك")} &middot; {L("comments & messages","التعليقات والرسائل")}</p>
        </div>
        <div style={{display:"flex", gap:8, flexWrap:"wrap"}}>
          {[['all',L("All","الكل"),messages.length],['comment',L("Comments","التعليقات"),commentCount],['dm',L("DMs","الرسائل"),dmCount]].map(([f,lab,n]) => (
            <button key={f} onClick={()=>setFilter(f)} style={{padding:"7px 14px", borderRadius:999, border:`1px solid ${filter===f?th.accent:th.border}`, background:filter===f?th.accentSoft:"transparent", color:filter===f?th.accent:th.text2, fontSize:11.5, fontWeight:600, cursor:"pointer", display:"flex", alignItems:"center", gap:6}}>
              {lab}{n>0 && <span className="tw-num" style={{opacity:0.85}}>{n}</span>}
            </button>
          ))}
          <button onClick={fetchInbox} disabled={loading} style={{padding:"7px 12px", borderRadius:999, border:`1px solid ${th.border}`, background:"transparent", color:th.text2, fontSize:11.5, cursor:"pointer", display:"flex", alignItems:"center", gap:5}}>
            <RefreshCw size={12}/>{loading?L("Loading…","جارٍ…"):L("Refresh","تحديث")}
          </button>
          <button onClick={sampleMode?exitSample:loadSample} style={{padding:"7px 12px", borderRadius:999, border:`1px solid ${sampleMode?th.accent:th.border}`, background:sampleMode?th.accentSoft:"transparent", color:sampleMode?th.accent:th.text2, fontSize:11.5, fontWeight:600, cursor:"pointer", display:"flex", alignItems:"center", gap:5}}>
            <Eye size={12}/>{sampleMode?L("Exit preview","إنهاء المعاينة"):L("Preview","معاينة")}
          </button>
        </div>
      </div>

      {!loading && messages.length>0 && (
        <div style={{background:`linear-gradient(120deg, ${th.accent}1a, ${th.accent}03)`, border:`1px solid ${th.border}`, borderLeft:`2px solid ${th.accent}`, borderRadius:14, padding:"13px 18px", marginBottom:14, fontSize:13.5, color:th.text2, lineHeight:1.6}}>
          <span className="tw-num" style={{color:th.text, fontWeight:600}}>{commentCount}</span> {L("comments","تعليق")} {L("and","و")} <span className="tw-num" style={{color:th.text, fontWeight:600}}>{dmCount}</span> {L("messages","رسالة")} {L("across your accounts","عبر حساباتك")}{needReply>0 && <>. <span style={{color:th.accent2||th.accent, fontWeight:600}}><span className="tw-num">{needReply}</span> {L("waiting on a reply","بانتظار الرد")}</span></>}.
        </div>
      )}

      {sampleMode && (
        <div style={{marginBottom:14, padding:"10px 14px", borderRadius:10, background:th.accentSoft, border:`1px solid ${th.accent}55`, fontSize:12, color:th.accent, display:"flex", alignItems:"center", gap:8}}>
          <Eye size={13}/> {isAR ? <>تُعرض <strong>بيانات تجريبية</strong> للمعاينة. ستظهر التعليقات والرسائل الحقيقية هنا تلقائياً بعد اعتماد تطبيقك من Meta.</> : <>Showing <strong>sample data</strong> for preview. Real comments &amp; DMs appear here automatically once Meta approves your app.</>}
        </div>
      )}
      {loading ? (
        <SkList th={th} rows={6}/>
      ) : messages.length === 0 ? (
        <div style={{textAlign:"center", padding:"54px 24px", color:th.text2, fontSize:13, maxWidth:460, margin:"0 auto"}}>
          <MessageCircle size={34} style={{marginBottom:14, opacity:0.3}}/>
          {accounts.filter(a=>a.platform==='ig').length === 0 ? (
            <>
              <div style={{fontSize:14, fontWeight:600, color:th.text, marginBottom:6}}>{L("No Instagram account connected","لا يوجد حساب إنستغرام مرتبط")}</div>
              <div>{L("Connect an Instagram account to start receiving comments and DMs here.","اربط حساب إنستغرام لتبدأ باستقبال التعليقات والرسائل هنا.")}</div>
            </>
          ) : apiError ? (
            <>
              <div style={{fontSize:14, fontWeight:600, color:th.text, marginBottom:6}}>{L("No comments to show yet","لا توجد تعليقات بعد")}</div>
              <div>{L("As soon as your posts get comments, they'll appear here ready to reply.","بمجرد أن تتلقى منشوراتك تعليقات، ستظهر هنا جاهزة للرد.")}</div>
            </>
          ) : (
            <>
              <div style={{fontSize:14, fontWeight:600, color:th.text, marginBottom:6}}>{L("No activity yet","لا يوجد نشاط بعد")}</div>
              <div>{L("Comments and DMs will appear here as soon as your posts get engagement.","ستظهر التعليقات والرسائل هنا بمجرد تفاعل الجمهور مع منشوراتك.")}</div>
            </>
          )}
          <button onClick={loadSample} style={{marginTop:18, padding:"9px 18px", borderRadius:10, background:th.gradient, border:"none", color:"#fff", fontSize:12.5, fontWeight:600, cursor:"pointer", display:"inline-flex", alignItems:"center", gap:7}}>
            <Eye size={14}/>{L("Preview with sample data","معاينة ببيانات تجريبية")}
          </button>
        </div>
      ) : (
        <div style={{display:"grid", gridTemplateColumns:"360px 1fr", gap:16, height:580}}>
          <div style={{background:th.card, border:`1px solid ${th.border}`, borderRadius:16, overflowY:"auto"}}>
            {filtered.map((msg,idx) => { const P=platOf(msg); const sel=selected?.id===msg.id; const unreplied = msg.type==='comment' && (!msg.replies || msg.replies.length===0);
              return (
              <div key={msg.id} onClick={()=>setSelected(msg)} style={{padding:"13px 15px", borderBottom:idx<filtered.length-1?`1px solid ${th.border}`:"none", cursor:"pointer", background:sel?th.accentSoft:"transparent", borderLeft:`2px solid ${sel?th.accent:"transparent"}`, display:"flex", gap:11}}>
                <div style={{position:"relative"}}>
                  {mono(msg.from, 38)}
                  <span style={{position:"absolute", bottom:-3, right:-3, width:16, height:16, borderRadius:"50%", background:th.card, border:`1px solid ${th.border}`, display:"flex", alignItems:"center", justifyContent:"center"}}><P.Icon style={{color:P.color, fontSize:9}}/></span>
                </div>
                <div style={{flex:1, minWidth:0}}>
                  <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", gap:6, marginBottom:2}}>
                    <span style={{fontSize:12.5, fontWeight:600, color:th.text, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap"}}>@{msg.from}</span>
                    <span className="tw-num" style={{fontSize:10, color:th.text3, flexShrink:0}}>{formatTime(msg.time)}</span>
                  </div>
                  <div style={{fontSize:11.5, color:th.text2, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", marginBottom:5}}>{msg.text}</div>
                  <div style={{display:"flex", gap:6, alignItems:"center"}}>
                    <span style={{fontSize:9, fontWeight:700, color:msg.type==='dm'?"#7C3AED":th.text2, background:msg.type==='dm'?"#7C3AED1a":th.card2, padding:"2px 7px", borderRadius:5}}>{msg.type==='dm'?L("DM","رسالة"):L("Comment","تعليق")}</span>
                    {msg.likeCount > 0 && <span style={{fontSize:9.5, color:th.text3, display:"inline-flex", alignItems:"center", gap:3}}><Heart size={9}/> <span className="tw-num">{msg.likeCount}</span></span>}
                    {msg.sample && <span style={{fontSize:9, fontWeight:700, color:th.accent, background:th.accentSoft, padding:"2px 6px", borderRadius:5}}>{L("Sample","عينة")}</span>}
                    {unreplied && <span title={L("Needs a reply","بحاجة لرد")} style={{marginLeft:"auto", width:7, height:7, borderRadius:"50%", background:th.accent}}/>}
                  </div>
                </div>
              </div>
            ); })}
          </div>

          <div style={{background:th.card, border:`1px solid ${th.border}`, borderRadius:16, padding:22, display:"flex", flexDirection:"column"}}>
            {selected ? (() => { const P=platOf(selected); return (
              <>
                <div style={{display:"flex", alignItems:"center", gap:12, marginBottom:18, paddingBottom:16, borderBottom:`1px solid ${th.border}`}}>
                  <div style={{position:"relative"}}>
                    {mono(selected.from, 44)}
                    <span style={{position:"absolute", bottom:-3, right:-3, width:19, height:19, borderRadius:"50%", background:th.card, border:`1px solid ${th.border}`, display:"flex", alignItems:"center", justifyContent:"center"}}><P.Icon style={{color:P.color, fontSize:11}}/></span>
                  </div>
                  <div style={{flex:1, minWidth:0}}>
                    <div style={{fontSize:14, fontWeight:600, color:th.text}}>@{selected.from}</div>
                    <div style={{fontSize:11.5, color:th.text2}}><span style={{fontWeight:600, color:P.color}}>{P.name}</span> &middot; {selected.type === 'dm' ? L("Direct message","رسالة مباشرة") : L("Comment","تعليق")} &middot; <span className="tw-num">{formatTime(selected.time)}</span></div>
                  </div>
                  {selected.accountName && <span style={{fontSize:10.5, color:th.text3, flexShrink:0}}>&rarr; {selected.accountName}</span>}
                </div>
                <div style={{flex:1, overflowY:"auto", marginBottom:16}}>
                  {selected.mediaCaption && <div style={{fontSize:10.5, color:th.text3, marginBottom:9, display:"flex", alignItems:"center", gap:6}}><MessageCircle size={11}/>{L("On post","على منشور")}: &ldquo;{selected.mediaCaption}&hellip;&rdquo;</div>}
                  <div style={{background:th.card2, borderRadius:12, padding:"14px 16px", fontSize:13.5, color:th.text, lineHeight:1.65, marginBottom:10}}>{selected.text}</div>
                  {selected.likeCount > 0 && <div style={{fontSize:11, color:th.text3, marginBottom:14, display:"flex", alignItems:"center", gap:5}}><Heart size={12}/> <span className="tw-num">{selected.likeCount}</span> {L("likes","إعجاب")}</div>}
                  {selected.replies?.length > 0 && (
                    <div style={{marginLeft:18, borderLeft:`2px solid ${th.border}`, paddingLeft:14}}>
                      <div style={{fontSize:10, color:th.text3, marginBottom:8, fontWeight:700, letterSpacing:0.5}}>{L("YOUR REPLIES","ردودك")}</div>
                      {selected.replies.map(r => (
                        <div key={r.id} style={{background:th.accentSoft, borderRadius:10, padding:"10px 13px", fontSize:12.5, color:th.text, marginBottom:7}}>
                          <span style={{fontWeight:600, color:th.accent}}>@{r.username}</span> {r.text}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {replySuccess && <div style={{fontSize:12, color:th.success, marginBottom:8, fontWeight:600, display:"flex", alignItems:"center", gap:6}}><CheckCircle size={13}/>{L("Reply posted","تم نشر الرد")}</div>}
                {replyError && <div style={{fontSize:12, color:th.danger, marginBottom:8}}>{replyError}</div>}
                <div style={{display:"flex", gap:8}}>
                  <input
                    value={reply}
                    onChange={e=>{setReply(e.target.value); setReplyError('');}}
                    onKeyDown={e=>e.key==='Enter'&&sendReply()}
                    placeholder={selected.type==='dm'?L("DM replies coming soon…","الرد على الرسائل قريباً…"):L("Write a reply…","اكتب رداً…")}
                    disabled={selected.type==='dm'||replying}
                    style={{flex:1, padding:"11px 14px", borderRadius:10, border:`1px solid ${th.border}`, background:th.card2, color:th.text, fontSize:13, outline:"none", opacity:selected.type==='dm'?0.5:1}}
                  />
                  <button
                    onClick={sendReply}
                    disabled={!reply.trim()||replying||selected.type==='dm'}
                    style={{padding:"11px 22px", borderRadius:10, background:th.gradient, border:"none", color:"#fff", fontSize:12.5, fontWeight:600, cursor:"pointer", opacity:(!reply.trim()||replying||selected.type==='dm')?0.5:1}}
                  >{replying?L("Sending…","جارٍ…"):L("Reply","رد")}</button>
                </div>
              </>
            ); })() : (
              <div style={{display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", height:"100%", color:th.text3, fontSize:13, gap:10}}><MessageCircle size={30} style={{opacity:0.3}}/>{L("Select a conversation","اختر محادثة")}</div>
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
  const [inviteRole, setInviteRole] = useState("Admin");
  const [sent, setSent] = useState(false);
  const [editIdx, setEditIdx] = useState(null);
  const [team, setTeam] = useState([
    { name:"Abdulla Alnahash", email:"octofusionbh@gmail.com", role:"Owner", joined:"Jan 2025", avatar:"A" },
    { name:"Agency Manager", email:"manager@octofusion.bh", role:"Admin", joined:"Mar 2025", avatar:"M" },
  ]);
  const SEATS = 5;
  const roleColor = (r) => r === "Owner" ? th.accent : r === "Admin" ? th.accent2 : r === "Editor" ? th.success : th.text2;
  const inp = { padding:"11px 14px", borderRadius:10, border:`1px solid ${th.border}`, background:th.card2, color:th.text, fontSize:13, outline:"none", fontFamily:"inherit" };
  const sendInvite = () => { if (!inviteEmail.trim()) return; setSent(true); setTimeout(()=>{ setSent(false); setInviteEmail(""); setShowInvite(false); }, 1400); };

  return (
    <div style={{ padding:"28px 32px", maxWidth:880 }}>
      <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", flexWrap:"wrap", gap:14, marginBottom:22 }}>
        <div>
          <h2 style={{ margin:0, fontSize:21, fontWeight:700, letterSpacing:-0.4 }}>Team</h2>
          <p style={{ margin:"6px 0 0", fontSize:12.5, color:th.text2 }}>Invite teammates and manage access &middot; <span style={{ color:th.text }}>{team.length} of {SEATS} seats used</span></p>
        </div>
        <button onClick={()=>setShowInvite(v=>!v)} style={{ padding:"10px 18px", borderRadius:11, background:th.gradient, border:"none", color:"#fff", fontSize:12.5, fontWeight:600, cursor:"pointer", display:"flex", alignItems:"center", gap:7, boxShadow:"0 8px 22px rgba(110,140,171,0.4)" }}>
          <UserPlus size={15}/> Invite member
        </button>
      </div>

      <div style={{ height:6, borderRadius:999, background:th.card2, border:`1px solid ${th.border}`, overflow:"hidden", marginBottom:22 }}>
        <div style={{ width:`${Math.min(100, team.length/SEATS*100)}%`, height:"100%", background:th.gradient }}/>
      </div>

      {showInvite && (
        <div style={{ background:th.card, border:`1px solid ${th.border}`, borderRadius:16, padding:20, marginBottom:18, boxShadow:"none" }}>
          <div style={{ fontSize:13, fontWeight:700, marginBottom:13, display:"flex", alignItems:"center", gap:8 }}><UserPlus size={15} color={th.accent}/>Invite a team member</div>
          <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
            <input value={inviteEmail} onChange={e=>setInviteEmail(e.target.value)} placeholder="name@company.com" style={{ ...inp, flex:1, minWidth:200 }}/>
            <select value={inviteRole} onChange={e=>setInviteRole(e.target.value)} style={{ ...inp, minWidth:120 }}>
              <option>Admin</option><option>Editor</option><option>Viewer</option>
            </select>
            <button onClick={sendInvite} style={{ padding:"11px 22px", borderRadius:10, background:sent?th.success:th.gradient, border:"none", color:"#fff", fontSize:12.5, fontWeight:600, cursor:"pointer", display:"flex", alignItems:"center", gap:6 }}>{sent?<><CheckCircle size={14}/>Sent</>:"Send invite"}</button>
          </div>
          <div style={{ fontSize:11, color:th.text3, marginTop:10 }}>They'll get an email invite to join {team[0]?.name ? "your" : "the"} workspace. Admins can publish &amp; manage; Editors draft; Viewers read-only.</div>
        </div>
      )}

      <div style={{ background:th.card, border:`1px solid ${th.border}`, borderRadius:16, overflow:"hidden", boxShadow:"none" }}>
        <div style={{ padding:"13px 20px", borderBottom:`1px solid ${th.border}`, fontSize:11.5, fontWeight:700, color:th.text2, textTransform:"uppercase", letterSpacing:1 }}>Members &middot; {team.length}</div>
        {team.map((m,i) => (
          <div key={i} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"16px 20px", borderBottom:i<team.length-1?`1px solid ${th.border}`:"none" }}>
            <div style={{ display:"flex", alignItems:"center", gap:13 }}>
              <div style={{ width:42, height:42, borderRadius:13, background:th.gradient, display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, fontWeight:700, color:"#fff", boxShadow:"0 6px 16px rgba(110,140,171,0.35)" }}>{m.avatar}</div>
              <div>
                <div style={{ fontSize:13.5, fontWeight:600 }}>{m.name}</div>
                <div style={{ fontSize:11.5, color:th.text2, marginTop:2 }}>{m.email}</div>
              </div>
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:12 }}>
              {editIdx===i && m.role!=="Owner" ? (
                <select value={m.role} onChange={e=>setTeam(t=>t.map((x,j)=>j===i?{...x,role:e.target.value}:x))} style={{ fontSize:11.5, fontWeight:600, padding:"5px 9px", borderRadius:9, border:`1px solid ${th.accent}`, background:th.card2, color:th.text, outline:"none", fontFamily:"inherit", cursor:"pointer" }}>
                  <option>Admin</option><option>Editor</option><option>Viewer</option>
                </select>
              ) : (
                <span style={{ fontSize:10.5, fontWeight:700, padding:"4px 12px", borderRadius:999, background:roleColor(m.role)+"22", color:roleColor(m.role) }}>{m.role}</span>
              )}
              <span style={{ fontSize:11.5, color:th.text2, minWidth:74, textAlign:"right" }}>{m.joined}</span>
              {m.role !== "Owner" ? (
                <div style={{ display:"flex", gap:7 }}>
                  <button onClick={()=>setEditIdx(editIdx===i?null:i)} style={{ fontSize:11.5, fontWeight:600, color:editIdx===i?th.success:th.accent, background:"none", border:`1px solid ${editIdx===i?th.success+"55":th.border}`, borderRadius:9, padding:"6px 11px", cursor:"pointer", display:"flex", alignItems:"center", gap:5 }}>{editIdx===i?<><CheckCircle size={13}/>Done</>:<><Edit3 size={13}/>Edit</>}</button>
                  <button onClick={()=>{ setTeam(t=>t.filter((_,j)=>j!==i)); setEditIdx(null); }} style={{ fontSize:11.5, color:th.danger, background:"none", border:`1px solid ${th.border}`, borderRadius:9, padding:"6px 11px", cursor:"pointer" }}>Remove</button>
                </div>
              ) : <span style={{ width:62 }}/>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function BillingPage() {
  const { dark, lang, userEmail, userCompany, userName } = useApp();
  const th = dark ? DARK : LIGHT;
  const isAR = lang === "ar";
  const L = (en, ar) => isAR ? ar : en;
  const isMobile = useIsMobile();
  const geo = useGeo();
  const [busy, setBusy] = useState("");
  const [notice, setNotice] = useState("");
  const [paid, setPaid] = useState(false);
  const [period, setPeriod] = useState("annual");
  const [showCancel, setShowCancel] = useState(false);
  const [cancelled, setCancelled] = useState(false);
  const [imgTick, setImgTick] = useState(0);   // re-read image credits after a change
  const imgAcct = (userEmail || "").toLowerCase();
  const imgIsPaid = (() => { try { return !isTrialUser(userEmail); } catch(e){ return true; } })();
  const imgCurPack = imgPackOf(imgAcct);
  const agencyName = shortCompany(userCompany) || (userEmail === ADMIN_EMAIL ? "Octo Fusion" : (userName || "your agency"));
  const chooseImgPack = (pack) => { setImgPackOf(imgAcct, pack.id); setImgTick(t => t + 1); setNotice(`${pack.name} image pack activated for ${agencyName}. ${pack.images} images a month across all your clients, refreshing monthly.`); };

  useEffect(() => {
    try {
      if (sessionStorage.getItem('tw_pay') === 'success') { setPaid(true); sessionStorage.removeItem('tw_pay'); }
      if (localStorage.getItem('tw_sub_status') === 'cancelled') setCancelled(true);
    } catch (e) { /* ignore */ }
  }, []);

  // The plan and billing cycle the user is actually subscribed to.
  const currentPlanName = "Essential";
  const currentPeriod = "annual";
  const plans = [
    { name:"Essential", m:49, y:39, accounts:"3", users:"1", posts:"30", popular:false, tag:"For small businesses" },
    { name:"Professional", m:99, y:79, accounts:"10", users:"5", posts:"100", popular:true, tag:"For growing brands" },
    { name:"Enterprise", m:199, y:159, accounts:"Unlimited", users:"20", posts:"Unlimited", popular:false, tag:"For agencies" },
  ];

  const startCheckout = async (planName) => {
    setBusy(planName); setNotice("");
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const res = await fetch('/api/tap', { method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ plan: planName, period, name: user?.user_metadata?.full_name || user?.user_metadata?.name || '', email: user?.email }) });
      const data = await res.json();
      if (data.url) { window.location.href = data.url; return; }
      setBusy("");
      if (data.configured === false || /not connected|not configured/i.test(data.error || ''))
        setNotice("Payments aren't connected yet — add your Tap secret key in Vercel (TAP_SECRET_KEY) to accept live cards. Everything else is wired and ready.");
      else setNotice(data.error || "Could not start checkout. Please try again.");
    } catch (e) { setBusy(""); setNotice("Could not start checkout. Please try again."); }
  };

  return (
    <div style={{padding:"28px 32px", maxWidth:960}}>
      <div style={{display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:22, flexWrap:"wrap", gap:14}}>
        <div>
          <h2 style={{margin:0, fontSize:20, fontWeight:600, letterSpacing:-0.3}}>{L("Plans & billing","الخطط والفوترة")}</h2>
          {cancelled ? (
            <p style={{margin:"6px 0 0", fontSize:13, color:th.text2}}>{L("Your","خطة")} <span style={{color:th.accent, fontWeight:600}}>Essential</span> {L("plan ends","تنتهي في")} <strong style={{color:th.text}}>July 1, 2026</strong> · <span onClick={()=>{ setCancelled(false); try{localStorage.removeItem('tw_sub_status');}catch(e){} }} style={{color:th.accent, fontWeight:600, cursor:"pointer"}}>{L("Reactivate","إعادة التفعيل")}</span></p>
          ) : (
            <p style={{margin:"6px 0 0", fontSize:13, color:th.text2}}>{L("You're on","أنت على خطة")} <span style={{color:th.accent, fontWeight:600}}>Essential</span> · {currentPeriod==="annual"?L("billed yearly","فوترة سنوية"):L("billed monthly","فوترة شهرية")} · {L("renews July 1, 2026","تتجدد في ١ يوليو ٢٠٢٦")} · <span onClick={()=>setShowCancel(true)} style={{color:th.danger, fontWeight:600, cursor:"pointer"}}>{L("Cancel subscription","إلغاء الاشتراك")}</span></p>
          )}
        </div>
        <div style={{display:"inline-flex", alignItems:"center", gap:4, background:th.card, border:`1px solid ${th.border}`, borderRadius:999, padding:4}}>
          {[["monthly",L("Monthly","شهري")],["annual",L("Yearly","سنوي")]].map(([k,l])=>(
            <button key={k} onClick={()=>setPeriod(k)} style={{padding:"8px 18px", borderRadius:999, border:"none", background:period===k?th.gradient:"transparent", color:period===k?"#fff":th.text2, fontSize:12.5, fontWeight:period===k?600:400, cursor:"pointer", display:"flex", alignItems:"center", gap:6}}>
              {l}{k==="annual"&&<span style={{fontSize:10, fontWeight:700, color:period==="annual"?"#fff":th.success}}>{L("save 20%","وفّر ٢٠٪")}</span>}
            </button>
          ))}
        </div>
      </div>

      {paid && (
        <div style={{display:"flex", alignItems:"center", gap:10, background:th.successSoft, border:`1px solid ${th.success}44`, color:th.success, borderRadius:12, padding:"12px 16px", marginBottom:18, fontSize:13}}>
          <CheckCircle size={16}/><span>Payment received — your subscription is being activated. Thank you!</span>
        </div>
      )}
      {notice && (
        <div style={{display:"flex", alignItems:"center", gap:10, background:th.accentSoft, border:`1px solid ${th.accent}44`, color:th.accent, borderRadius:12, padding:"12px 16px", marginBottom:18, fontSize:13}}>
          <Shield size={16}/><span>{notice}</span>
        </div>
      )}

      <div style={{display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:16, alignItems:"stretch"}}>
        {plans.map(plan => {
          const price = period==="annual" ? plan.y : plan.m;
          const save = (plan.m - plan.y) * 12;
          const featured = plan.popular;
          const isYourTier = plan.name === currentPlanName;
          const isCurrent = isYourTier && period === currentPeriod;     // the exact plan + cycle you pay for
          const otherCycle = isYourTier && period !== currentPeriod;    // your tier, viewed on the other cycle
          const highlight = featured || isCurrent;
          return (
            <div key={plan.name} style={{
              background:featured?th.card2:th.card,
              border:`2px solid ${isCurrent?th.accent:(featured?th.accent:(isYourTier?th.accent+"66":th.border))}`,
              borderRadius:16, padding:"26px 22px 22px", position:"relative",
              display:"flex", flexDirection:"column",
              boxShadow:featured?"0 16px 44px rgba(110,140,171,0.28)":"0 8px 24px rgba(0,0,0,0.22)",
            }}>
              {featured && <div style={{position:"absolute", top:-13, left:"50%", transform:"translateX(-50%)", background:th.gradient, color:"#fff", fontSize:10.5, fontWeight:700, padding:"5px 16px", borderRadius:999, letterSpacing:0.4, whiteSpace:"nowrap", boxShadow:"0 6px 18px rgba(110,140,171,0.5)"}}>MOST POPULAR</div>}
              {isCurrent && <div style={{position:"absolute", top:14, right:14, fontSize:10, fontWeight:700, background:th.accentSoft, color:th.accent, padding:"3px 9px", borderRadius:999}}>CURRENT</div>}
              <div style={{fontSize:16, fontWeight:800, marginBottom:3}}>{plan.name}</div>
              <div style={{fontSize:11.5, color:th.text2, marginBottom:14}}>{plan.tag}</div>
              <div style={{display:"flex", alignItems:"baseline", gap:6}}>
                <span className="tw-num" style={{fontSize:34, fontWeight:600, color:highlight?th.accent:th.text}}>${price}</span>
                <span style={{fontSize:12, color:th.text2}}>/mo</span>
              </div>
              {approxLabel(geo,price)&&<div style={{fontSize:10, color:th.text3, marginTop:2}}>{approxLabel(geo,price).replace("approx ","≈ ")}</div>}
              <div style={{fontSize:10.5, color:th.text3, marginTop:2, minHeight:16, marginBottom:16}}>{period==="annual"?`billed yearly · save $${save}/yr`:"billed monthly"}</div>
              <div style={{fontSize:12, color:th.text2, lineHeight:2, marginBottom:18}}>
                <div><CheckCircle size={12} color={th.success} style={{verticalAlign:-1, marginRight:6}}/>{plan.accounts} social accounts</div>
                <div><CheckCircle size={12} color={th.success} style={{verticalAlign:-1, marginRight:6}}/>{plan.users} team member{plan.users!=="1"?"s":""}</div>
                <div><CheckCircle size={12} color={th.success} style={{verticalAlign:-1, marginRight:6}}/>{plan.posts} posts/month</div>
                <div><CheckCircle size={12} color={th.success} style={{verticalAlign:-1, marginRight:6}}/>AI captions (EN + AR)</div>
                <div><CheckCircle size={12} color={th.success} style={{verticalAlign:-1, marginRight:6}}/>Analytics dashboard</div>
              </div>
              <div style={{marginTop:"auto"}}>
                {isCurrent ? (
                  <div style={{width:"100%", padding:"11px", borderRadius:10, background:"transparent", border:`1px solid ${th.border}`, color:th.text2, fontSize:12.5, fontWeight:600, textAlign:"center", boxSizing:"border-box"}}>Your current plan</div>
                ) : otherCycle ? (
                  <button onClick={()=>startCheckout(plan.name)} disabled={busy===plan.name} style={{width:"100%", padding:"11px", borderRadius:10, background:"transparent", border:`1px solid ${th.accent}`, color:th.accent, fontSize:12.5, fontWeight:700, cursor:"pointer", opacity:busy===plan.name?0.6:1, boxSizing:"border-box"}}>
                    {busy===plan.name?"Starting checkout…":`Switch to ${period==="annual"?"yearly":"monthly"} billing`}
                  </button>
                ) : (
                  <button onClick={()=>startCheckout(plan.name)} disabled={busy===plan.name} style={{width:"100%", padding:"11px", borderRadius:10, background:featured?th.gradient:"transparent", border:featured?"none":`1px solid ${th.accent}`, color:featured?"#fff":th.accent, fontSize:12.5, fontWeight:700, cursor:"pointer", opacity:busy===plan.name?0.6:1, boxSizing:"border-box"}}>
                    {busy===plan.name?"Starting checkout…":`Upgrade to ${plan.name}`}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <div style={{fontSize:11, color:th.text3, marginTop:18, textAlign:"center"}}>Secure checkout by Tap Payments · Visa, Mastercard, Apple Pay, Benefit &amp; more · cancel anytime.</div>

      <div style={{marginTop:40}}>
        <div style={{display:"flex", alignItems:"center", gap:10, marginBottom:4}}>
          <div style={{width:34, height:34, borderRadius:10, background:th.accentSoft, display:"flex", alignItems:"center", justifyContent:"center"}}><Image size={17} color={th.accent}/></div>
          <h3 style={{fontSize:17, fontWeight:800, margin:0, letterSpacing:-0.3}}>AI image credits</h3>
        </div>
        {imgIsPaid ? (
          <>
            <p style={{margin:"0 0 16px 44px", fontSize:12.5, color:th.text2}}>
              {imgCurPack
                ? <><span style={{color:th.accent, fontWeight:600}}>{agencyName}</span> is on the <span style={{color:th.accent, fontWeight:600}}>{(IMG_PACKS.find(p=>p.id===imgCurPack)||{}).name}</span> pack. Change it anytime below.</>
                : <>Add a monthly image pack for <span style={{color:th.accent, fontWeight:600}}>{agencyName}</span>. Generate and edit on-brand images across all your clients in AI Studio.</>}
            </p>
            <ImagePackPicker th={th} geo={geo} currentPack={imgCurPack} onChoose={chooseImgPack}/>
            <div style={{fontSize:10.5, color:th.text3, marginTop:12, textAlign:"center"}}>Image packs are billed to your agency, in USD. Cancel anytime.</div>
          </>
        ) : (
          <div style={{marginLeft:44, padding:"16px 18px", background:th.card2, border:`1px solid ${th.border}`, borderRadius:12, fontSize:12.5, color:th.text2, lineHeight:1.6}}>
            <Lock size={14} color={th.text3} style={{verticalAlign:-2, marginRight:7}}/>
            AI image credits are available on any paid plan. Choose a plan above to unlock image generation and add a monthly pack.
          </div>
        )}
      </div>

      {!isMobile && (
      <div style={{marginTop:44}}>
        <div style={{textAlign:"center", marginBottom:5}}><h3 style={{fontSize:18, fontWeight:800, margin:0, letterSpacing:-0.3}}>You're getting more, for less</h3></div>
        <p style={{textAlign:"center", color:th.text2, fontSize:12.5, marginBottom:20}}>Everything the global tools do — plus the first platform that's truly bilingual — at a fraction of the price.</p>
        <div style={{background:th.card, border:`1px solid ${th.border}`, borderRadius:16, overflow:"hidden", maxWidth:720, margin:"0 auto"}}>
          <div style={{display:"grid", gridTemplateColumns:"2.1fr 1fr 1fr 1fr", padding:"13px 18px", borderBottom:`1px solid ${th.border}`, fontSize:12, fontWeight:700, alignItems:"center"}}>
            <div/>
            <div style={{textAlign:"center", color:th.text}}>Tawaslo</div>
            <div style={{textAlign:"center", color:th.text2}}>Hootsuite</div>
            <div style={{textAlign:"center", color:th.text2}}>Sprout</div>
          </div>
          {[
            ["Starting price","From $49/mo","~$99/mo","~$249/mo"],
            ["Native Arabic & RTL","✓","✕","✕"],
            ["AI captions (AR + EN)","✓","Add-on","Limited"],
            ["AI image generation","✓","Add-on","Limited"],
            ["Local payment methods","✓","✕","✕"],
            ["Flat pricing, no per-seat","✓","✕","✕"],
          ].map(([feat,tw,ho,sp],i,arr)=>(
            <div key={i} style={{display:"grid", gridTemplateColumns:"2.1fr 1fr 1fr 1fr", padding:"11px 18px", borderBottom:i<arr.length-1?`1px solid ${th.border}`:"none", fontSize:12, alignItems:"center"}}>
              <div style={{color:th.text}}>{feat}</div>
              <div style={{display:"flex", justifyContent:"center", fontWeight:700, background:th.accentSoft, borderRadius:8, padding:"6px 0", color:th.text}}>{tw==="✓"?<CheckCircle size={14} color={th.success}/>:tw==="✕"?<XCircle size={14} color={th.danger}/>:tw}</div>
              <div style={{display:"flex", justifyContent:"center", color:th.text2}}>{ho==="✓"?<CheckCircle size={14} color={th.success}/>:ho==="✕"?<XCircle size={14} color={th.text3}/>:ho}</div>
              <div style={{display:"flex", justifyContent:"center", color:th.text2}}>{sp==="✓"?<CheckCircle size={14} color={th.success}/>:sp==="✕"?<XCircle size={14} color={th.text3}/>:sp}</div>
            </div>
          ))}
        </div>
        <p style={{textAlign:"center", color:th.text3, fontSize:10, marginTop:10}}>Competitor pricing is approximate, based on publicly listed entry plans.</p>
      </div>
      )}

      {showCancel && createPortal((
        <div onClick={()=>setShowCancel(false)} style={{position:"fixed", inset:0, background:"rgba(3,5,10,0.6)", backdropFilter:"blur(2px)", zIndex:9998, display:"flex", alignItems:"center", justifyContent:"center", padding:20}}>
          <div onClick={e=>e.stopPropagation()} style={{width:430, maxWidth:"100%", background:th.surface, border:`1px solid ${th.border}`, borderRadius:18, padding:24, boxShadow:"0 30px 80px rgba(0,0,0,0.6)"}}>
            <div style={{display:"flex", alignItems:"center", gap:11, marginBottom:14}}>
              <div style={{width:40, height:40, borderRadius:11, background:th.dangerSoft, display:"flex", alignItems:"center", justifyContent:"center"}}><XCircle size={20} color={th.danger}/></div>
              <span style={{fontSize:16, fontWeight:700}}>Cancel subscription?</span>
            </div>
            <div style={{fontSize:13, color:th.text2, lineHeight:1.65, marginBottom:20}}>Your plan stays active until <strong style={{color:th.text}}>July 1, 2026</strong>. After that you'll move to the free tier and lose paid features. You can reactivate anytime before then.</div>
            <div style={{display:"flex", gap:10}}>
              <button onClick={()=>setShowCancel(false)} style={{flex:1, padding:"11px", borderRadius:10, background:th.card2, border:`1px solid ${th.border}`, color:th.text, fontSize:13, fontWeight:600, cursor:"pointer"}}>Keep my plan</button>
              <button onClick={()=>{ setCancelled(true); try{localStorage.setItem('tw_sub_status','cancelled');}catch(e){} setShowCancel(false); }} style={{flex:1, padding:"11px", borderRadius:10, background:th.danger, border:"none", color:"#fff", fontSize:13, fontWeight:600, cursor:"pointer"}}>Cancel subscription</button>
            </div>
          </div>
        </div>
      ), document.body)}
    </div>
  );
}

function SettingsPage() {
  const { dark, setDark, lang, setLang, setUserName, setIsAuthed } = useApp();
  const th = dark ? DARK : LIGHT;
  const isAR = lang === "ar";
  const L = (en, ar) => isAR ? ar : en;
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [userId, setUserId] = useState(null);
  const [agencyName, setAgencyName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [website, setWebsite] = useState("");
  const [notif, setNotif] = useState({ email:true, published:true, weekly:true, engagement:true });
  // Personal profile (your own name + login email)
  const [fullName, setFullName] = useState("");
  const [loginEmail, setLoginEmail] = useState("");
  const [origEmail, setOrigEmail] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);
  const [profileMsg, setProfileMsg] = useState("");

  // Contact-support ticket form
  const [tkSubject, setTkSubject] = useState("");
  const [tkMessage, setTkMessage] = useState("");
  const [tkSending, setTkSending] = useState(false);
  const [tkSent, setTkSent] = useState(false);
  const [tkErr, setTkErr] = useState("");

  const submitTicket = async () => {
    if (!tkSubject.trim() || !tkMessage.trim()) { setTkErr("Add a subject and a message."); return; }
    setTkErr(""); setTkSending(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: ticket, error } = await createSupportTicket({
        user_id: user ? user.id : null,
        client_name: agencyName || (contactEmail||"").split("@")[0],
        email: contactEmail || (user && user.email) || "",
        subject: tkSubject.trim(),
      });
      if (error || !ticket) throw new Error(error ? error.message : "Could not send");
      await addSupportMessage(ticket.id, "them", tkMessage.trim());
      setTkSent(true); setTkSubject(""); setTkMessage("");
      setTimeout(() => setTkSent(false), 5000);
    } catch (e) {
      setTkErr("Couldn't send right now — please email support@tawaslo.com.");
    } finally { setTkSending(false); }
  };

  useEffect(() => {
    let active = true;
    try { const n = JSON.parse(localStorage.getItem('tw_notify')||'null'); if (n) setNotif(prev=>({ ...prev, ...n })); } catch (e) { /* ignore */ }
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !active) { setLoading(false); return; }
      setUserId(user.id);
      const { data: profile } = await getProfile(user.id);
      if (!active) return;
      setAgencyName(profile?.company_name || profile?.name || "");
      setContactEmail(profile?.email || user.email || "");
      setWebsite(profile?.website || "");
      setFullName(profile?.name || (user.user_metadata && user.user_metadata.name) || "");
      setLoginEmail(user.email || "");
      setOrigEmail(user.email || "");
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

  const saveProfile = async () => {
    if (!userId || savingProfile) return;
    setSavingProfile(true); setProfileMsg("");
    try {
      await updateProfile(userId, { name: fullName });
      try { setUserName(fullName); } catch (e) { /* ignore */ }
      if (loginEmail && loginEmail !== origEmail) {
        const { error } = await supabase.auth.updateUser({ email: loginEmail });
        if (error) { setProfileMsg(error.message || "Could not update email."); setSavingProfile(false); return; }
        setProfileMsg("Almost done — we sent a confirmation link to your new email. Click it to finish the change.");
      }
      setProfileSaved(true); setTimeout(()=>setProfileSaved(false), 2200);
    } catch (e) { setProfileMsg("Could not save right now. Please try again."); }
    finally { setSavingProfile(false); }
  };

  const toggleNotif = (k) => setNotif(prev => { const next = { ...prev, [k]: !prev[k] }; try { localStorage.setItem('tw_notify', JSON.stringify(next)); } catch (e) { /* ignore */ } return next; });

  const fieldStyle = {width:"100%", padding:"10px 14px", borderRadius:8, border:`1px solid ${th.border}`, background:th.card2, color:th.text, fontSize:13, outline:"none", boxSizing:"border-box", fontFamily:"inherit"};
  const card = {background:th.card, border:`1px solid ${th.border}`, borderRadius:16, padding:20, boxShadow:"none"};
  const secTitle = (Icon, txt) => (<div style={{display:"flex", alignItems:"center", gap:8, fontSize:13.5, fontWeight:700, marginBottom:16}}><Icon size={15} color={th.accent}/>{txt}</div>);
  const Sw = ({on, onClick}) => (
    <button onClick={onClick} style={{width:42, height:23, borderRadius:12, background:on?th.accent:th.border, border:"none", cursor:"pointer", position:"relative", flexShrink:0}}>
      <div style={{position:"absolute", top:3, left:on?22:3, width:17, height:17, borderRadius:"50%", background:"#fff", transition:"left 0.2s"}}/>
    </button>
  );

  const NOTIFS = [
    ["email",L("Email notifications","إشعارات البريد"),L("Receive important account updates by email","استقبل تحديثات حسابك المهمة عبر البريد")],
    ["published",L("Post published alerts","تنبيهات نشر المنشورات"),L("Get notified when a scheduled post goes live","تنبيه عند نشر منشور مجدول")],
    ["engagement",L("Comments & DM alerts","تنبيهات التعليقات والرسائل"),L("Know when someone engages with your posts","اعرف عند تفاعل أحدهم مع منشوراتك")],
    ["weekly",L("Weekly report","التقرير الأسبوعي"),L("A performance summary every Monday","ملخص أداء كل يوم اثنين")],
  ];

  return (
    <div style={{padding:"28px 32px", maxWidth:720}}>
      <div style={{marginBottom:22}}>
        <h2 style={{margin:0, fontSize:20, fontWeight:600, letterSpacing:-0.3}}>{L("Settings","الإعدادات")}</h2>
        <p style={{margin:"5px 0 0", fontSize:12.5, color:th.text2}}>{L("Manage your account, preferences and support","إدارة حسابك وتفضيلاتك والدعم")}</p>
      </div>
      <div style={{display:"flex", flexDirection:"column", gap:16}}>

        <div style={card}>
          {secTitle(User, L("Your profile","ملفك الشخصي"))}
          <div style={{display:"flex", flexDirection:"column", gap:12}}>
            <div>
              <div style={{fontSize:11, color:th.text2, marginBottom:5}}>{L("Full name","الاسم الكامل")}</div>
              <input value={fullName} disabled={loading} onChange={e=>setFullName(e.target.value)} placeholder={loading?L("Loading…","جارٍ التحميل…"):L("Your name","اسمك")} style={fieldStyle}/>
            </div>
            <div>
              <div style={{fontSize:11, color:th.text2, marginBottom:5}}>{L("Login email","بريد تسجيل الدخول")}</div>
              <input type="email" value={loginEmail} disabled={loading} onChange={e=>setLoginEmail(e.target.value)} placeholder={loading?L("Loading…","جارٍ التحميل…"):"you@example.com"} style={fieldStyle}/>
              {loginEmail!==origEmail && loginEmail && <div style={{fontSize:10.5, color:th.text3, marginTop:5}}>{L("You'll get a confirmation link at the new address to finish the change.","سنرسل رابط تأكيد إلى البريد الجديد لإتمام التغيير.")}</div>}
            </div>
          </div>
          {profileMsg && <div style={{marginTop:10, fontSize:11.5, color:profileMsg.indexOf("Almost")===0?th.accent:th.danger, lineHeight:1.5}}>{profileMsg}</div>}
          <button onClick={saveProfile} disabled={savingProfile||loading} style={{marginTop:16, padding:"10px 24px", borderRadius:9, background:profileSaved?th.success:th.gradient, border:"none", color:"#fff", fontSize:12.5, fontWeight:600, cursor:(savingProfile||loading)?"not-allowed":"pointer", opacity:(savingProfile||loading)?0.7:1}}>
            {profileSaved?L("Saved","تم الحفظ"):savingProfile?L("Saving…","جارٍ الحفظ…"):L("Update profile","تحديث الملف")}
          </button>
        </div>

        <div style={card}>
          {secTitle(Building2, L("Agency profile","ملف الوكالة"))}
          <div style={{display:"flex", flexDirection:"column", gap:12}}>
            <div>
              <div style={{fontSize:11, color:th.text2, marginBottom:5}}>{L("Agency name","اسم الوكالة")}</div>
              <input value={agencyName} disabled={loading} onChange={e=>setAgencyName(e.target.value)} placeholder={loading?L("Loading…","جارٍ التحميل…"):L("Your agency name","اسم وكالتك")} style={fieldStyle}/>
            </div>
            <div>
              <div style={{fontSize:11, color:th.text2, marginBottom:5}}>{L("Contact email","بريد التواصل")}</div>
              <input type="email" value={contactEmail} disabled={loading} onChange={e=>setContactEmail(e.target.value)} placeholder={loading?L("Loading…","جارٍ التحميل…"):"you@example.com"} style={fieldStyle}/>
            </div>
            <div>
              <div style={{fontSize:11, color:th.text2, marginBottom:5}}>{L("Website","الموقع الإلكتروني")}</div>
              <input value={website} disabled={loading} onChange={e=>setWebsite(e.target.value)} placeholder={loading?L("Loading…","جارٍ التحميل…"):"yoursite.com"} style={fieldStyle}/>
            </div>
          </div>
          {err && <div style={{marginTop:10, fontSize:12, color:th.danger}}>{err}</div>}
          <button onClick={handleSave} disabled={saving||loading} style={{marginTop:16, padding:"10px 24px", borderRadius:9, background:saved?th.success:th.gradient, border:"none", color:"#fff", fontSize:12.5, fontWeight:600, cursor:(saving||loading)?"not-allowed":"pointer", opacity:(saving||loading)?0.7:1}}>
            {saved?L("Saved","تم الحفظ"):saving?L("Saving…","جارٍ الحفظ…"):L("Save changes","حفظ التغييرات")}
          </button>
        </div>

        <div style={card}>
          {secTitle(Bell, L("Notifications","الإشعارات"))}
          <div style={{display:"flex", flexDirection:"column", gap:14}}>
            {NOTIFS.map(([k,title,sub])=>(
              <div key={k} style={{display:"flex", justifyContent:"space-between", alignItems:"center", gap:12}}>
                <div><div style={{fontSize:12.5}}>{title}</div><div style={{fontSize:11, color:th.text2, marginTop:1}}>{sub}</div></div>
                <Sw on={notif[k]} onClick={()=>toggleNotif(k)}/>
              </div>
            ))}
          </div>
        </div>

        <div style={card}>
          {secTitle(dark?Moon:Sun, L("Appearance","المظهر"))}
          <div style={{display:"flex", justifyContent:"space-between", alignItems:"center"}}>
            <div><div style={{fontSize:12.5}}>{L("Dark mode","الوضع الداكن")}</div><div style={{fontSize:11, color:th.text2, marginTop:1}}>{L("Switch between dark and light theme","التبديل بين الوضع الداكن والفاتح")}</div></div>
            <Sw on={dark} onClick={()=>setDark(!dark)}/>
          </div>
        </div>

        <div style={card}>
          {secTitle(Languages, L("Language","اللغة"))}
          <div style={{display:"flex", gap:8}}>
            {["en","ar"].map(l => (
              <button key={l} onClick={()=>setLang(l)} style={{padding:"8px 22px", borderRadius:9, border:`1.5px solid ${lang===l?th.accent:th.border}`, background:lang===l?th.accentSoft:"transparent", color:lang===l?th.accent:th.text2, fontSize:13, fontWeight:600, cursor:"pointer"}}>
                {l==="en"?"English":"العربية"}
              </button>
            ))}
          </div>
        </div>

        <div style={card}>
          {secTitle(MessageCircle, L("Support & help","الدعم والمساعدة"))}
          <div style={{fontSize:12.5, color:th.text2, lineHeight:1.6, marginBottom:16}}>{L("Questions, issues, or a feature idea? Send us a message below and it lands straight with our team. We typically reply within one business day.","سؤال أو مشكلة أو فكرة لميزة جديدة؟ أرسل لنا رسالة وتصل مباشرة إلى فريقنا. نرد عادةً خلال يوم عمل واحد.")}</div>

          {tkSent && (
            <div style={{display:"flex", alignItems:"center", gap:9, background:th.successSoft, border:`1px solid ${th.success}40`, borderRadius:11, padding:"11px 14px", marginBottom:14, fontSize:12.5, color:th.success, fontWeight:600}}>
              <CheckCircle size={16}/> {L("Message sent. We'll get back to you at","تم إرسال الرسالة. سنعاود التواصل معك على")} {contactEmail || L("your email","بريدك")}.
            </div>
          )}
          {tkErr && (
            <div style={{background:th.dangerSoft, border:`1px solid ${th.danger}40`, borderRadius:11, padding:"11px 14px", marginBottom:14, fontSize:12, color:th.danger}}>{tkErr}</div>
          )}

          <div style={{marginBottom:11}}>
            <label style={{fontSize:11, color:th.text2, fontWeight:600, marginBottom:6, display:"block"}}>{L("Subject","الموضوع")}</label>
            <input value={tkSubject} onChange={e=>{setTkSubject(e.target.value); setTkErr("");}} placeholder={L("e.g. Can't connect my Instagram","مثال: لا أستطيع ربط حساب إنستغرام")}
              style={{width:"100%", background:th.card2, border:`1px solid ${th.border}`, borderRadius:10, padding:"11px 13px", color:th.text, fontSize:12.5, outline:"none", fontFamily:"inherit", boxSizing:"border-box"}}/>
          </div>
          <div style={{marginBottom:14}}>
            <label style={{fontSize:11, color:th.text2, fontWeight:600, marginBottom:6, display:"block"}}>{L("Message","الرسالة")}</label>
            <textarea value={tkMessage} onChange={e=>{setTkMessage(e.target.value); setTkErr("");}} placeholder={L("Tell us what's going on…","أخبرنا بما يحدث…")} rows={4}
              style={{width:"100%", background:th.card2, border:`1px solid ${th.border}`, borderRadius:10, padding:"11px 13px", color:th.text, fontSize:12.5, outline:"none", fontFamily:"inherit", resize:"vertical", boxSizing:"border-box"}}/>
          </div>
          <div style={{display:"flex", gap:10, flexWrap:"wrap", alignItems:"center"}}>
            <button onClick={submitTicket} disabled={tkSending} style={{display:"flex", alignItems:"center", gap:7, padding:"11px 18px", borderRadius:10, background:th.gradient, border:"none", color:"#fff", fontSize:12.5, fontWeight:600, cursor:tkSending?"not-allowed":"pointer", opacity:tkSending?0.7:1}}><Send size={14}/>{tkSending?L("Sending…","جارٍ الإرسال…"):L("Send message","إرسال الرسالة")}</button>
            <a href="mailto:support@tawaslo.com" style={{fontSize:12, color:th.text2, textDecoration:"none"}}>{L("or email support@tawaslo.com","أو راسلنا على support@tawaslo.com")}</a>
          </div>
        </div>

        <div style={{...card}}>
          {secTitle(LogOut, L("Session","الجلسة"))}
          <div style={{fontSize:12, color:th.text2, marginBottom:12}}>{L("Sign out of your Tawaslo account on this device.","تسجيل الخروج من حسابك على هذا الجهاز.")}</div>
          <button onClick={async()=>{ try{ await signOut(); }catch(e){} setIsAuthed(false); }} style={{padding:"9px 18px", borderRadius:9, border:`1px solid ${th.border}`, background:th.card2, color:th.text, fontSize:12, fontWeight:600, cursor:"pointer", display:"inline-flex", alignItems:"center", gap:7}}><LogOut size={14}/>{L("Log out","تسجيل الخروج")}</button>
        </div>

        <div style={{...card, border:`1px solid ${th.danger}33`}}>
          {secTitle(Shield, L("Danger zone","منطقة الخطر"))}
          <div style={{fontSize:12, color:th.text2, marginBottom:12}}>{L("These actions are permanent and cannot be undone.","هذه الإجراءات نهائية ولا يمكن التراجع عنها.")}</div>
          <button style={{padding:"9px 18px", borderRadius:9, border:`1px solid ${th.danger}`, background:"transparent", color:th.danger, fontSize:12, fontWeight:600, cursor:"pointer"}}>{L("Delete account","حذف الحساب")}</button>
        </div>

      </div>
    </div>
  );
}

function LandingPage({ onGetStarted, onLogin }) {
  const [landingPage, setLandingPage] = useState('home');
  const [openFaq, setOpenFaq] = useState(0);
  const isMobile = useIsMobile();
  const [navOpen, setNavOpen] = useState(false);
  const [billing, setBilling] = useState('monthly');
  const lgeo = useGeo();
  const [contact, setContact] = useState({name:'',email:'',company:'',message:''});
  const [contactSent, setContactSent] = useState(false);
  const sendContact = () => {
    const subject = encodeURIComponent(`Tawaslo enquiry${contact.name?` from ${contact.name}`:''}`);
    const body = encodeURIComponent(`Name: ${contact.name}\nEmail: ${contact.email}\nCompany: ${contact.company}\n\n${contact.message}`);
    window.location.href = `mailto:support@tawaslo.com?subject=${subject}&body=${body}`;
    setContactSent(true);
  };
  const prices = { monthly:{starter:49,pro:99,agency:199}, yearly:{starter:39,pro:79,agency:159} };
  const p = prices[billing];

  const navLink = (id, label) => (
    <span onClick={()=>setLandingPage(id)} style={{color:landingPage===id?"#F2F5F9":"#8794A8", fontSize:14, fontWeight:600, cursor:"pointer", borderBottom:landingPage===id?"2px solid #6E8CAB":"2px solid transparent", paddingBottom:2}}>{label}</span>
  );

  const Logo = () => (
    <div style={{cursor:"pointer",display:"flex",alignItems:"center",gap:10}} onClick={()=>setLandingPage('home')}>
      <img src="/logo-transparent.png" alt="Tawaslo" style={{height:38,objectFit:"contain"}}/>
      <span style={{fontSize:20,fontWeight:900,color:"#E8EFF8",letterSpacing:-0.5}}>Tawaslo</span>
    </div>
  );

  const Nav = () => (
    <nav style={{position:"sticky",top:0,zIndex:100,background:"rgba(7,9,15,0.97)",borderBottom:"1px solid #232B38",padding:isMobile?"0 16px":"0 32px",height:58,display:"flex",alignItems:"center",justifyContent:"space-between",backdropFilter:"blur(12px)"}}>
      <Logo/>
      {isMobile && <button onClick={()=>setNavOpen(o=>!o)} aria-label="Menu" style={{background:"transparent",border:"1px solid #232B38",borderRadius:8,width:38,height:34,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",color:"#E8EFF8"}}>{navOpen?<XCircle size={18}/>:<Menu size={18}/>}</button>}
      <div style={{display:isMobile?"none":"flex",alignItems:"center",gap:28}}>
        {navLink('home','Home')}
        {navLink('features','Features')}
        {navLink('pricing','Pricing')}
        {navLink('about','About')}
        {navLink('contact','Contact')}
      </div>
      <div style={{display:isMobile?"none":"flex",gap:10}}>
        <button onClick={onLogin} style={{padding:"8px 18px",borderRadius:8,background:"transparent",border:"1px solid #232B38",color:"#E8EFF8",fontSize:13,fontWeight:600,cursor:"pointer"}}>Log In</button>
        <button onClick={()=>setLandingPage('trial')} style={{padding:"8px 18px",borderRadius:8,background:"linear-gradient(135deg,#6E8CAB,#4F6B8C)",border:"none",color:"#fff",fontSize:13,fontWeight:700,cursor:"pointer"}}>Start Free Trial</button>
      </div>
      {isMobile && navOpen && (
        <div style={{position:"absolute",top:58,left:0,right:0,background:"#0C1017",borderBottom:"1px solid #232B38",padding:14,display:"flex",flexDirection:"column",gap:3,boxShadow:"0 18px 44px rgba(0,0,0,0.55)"}}>
          {[['home','Home'],['features','Features'],['pricing','Pricing'],['about','About'],['contact','Contact']].map(([id,label])=>(
            <div key={id} onClick={()=>{setLandingPage(id);setNavOpen(false);}} style={{padding:"11px 12px",borderRadius:9,fontSize:14,fontWeight:600,cursor:"pointer",color:landingPage===id?"#9DB6D6":"#E8EFF8",background:landingPage===id?"rgba(110,140,171,0.1)":"transparent"}}>{label}</div>
          ))}
          <div style={{height:1,background:"#232B38",margin:"6px 0"}}/>
          <button onClick={()=>{onLogin();setNavOpen(false);}} style={{padding:"11px",borderRadius:9,background:"transparent",border:"1px solid #232B38",color:"#E8EFF8",fontSize:13,fontWeight:600,cursor:"pointer"}}>Log In</button>
          <button onClick={()=>{setLandingPage('trial');setNavOpen(false);}} style={{padding:"11px",borderRadius:9,background:"linear-gradient(135deg,#6E8CAB,#4F6B8C)",border:"none",color:"#fff",fontSize:13,fontWeight:700,cursor:"pointer"}}>Start Free Trial</button>
        </div>
      )}
    </nav>
  );

  const Footer = () => (
    <div style={{background:"#080B11",borderTop:"1px solid #232B38",padding:"20px 32px",display:isMobile?"flex":"grid",gridTemplateColumns:isMobile?undefined:"1fr auto 1fr",flexDirection:isMobile?"column":undefined,alignItems:"center",gap:16}}>
      <div style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer",justifySelf:"start"}} onClick={()=>setLandingPage('home')}><img src="/logo-transparent.png" alt="Tawaslo" style={{height:28,objectFit:"contain"}}/><span style={{fontSize:16,fontWeight:900,color:"#E8EFF8"}}>Tawaslo</span></div>
      <div style={{fontSize:11,color:"#3D5068",justifySelf:"center",textAlign:"center"}}>© 2026 Tawaslo. All rights reserved.</div>
      <div style={{display:"flex",alignItems:"center",gap:18,flexWrap:"wrap",justifySelf:"end"}}>
        {[["FAQ","faq"],["Privacy","privacy"],["Terms","terms"],["Contact","contact"]].map(([l,p])=><span key={l} onClick={()=>setLandingPage(p)} style={{fontSize:11.5,color:"#7A8BA8",cursor:"pointer"}} onMouseEnter={e=>e.currentTarget.style.color="#E8EFF8"} onMouseLeave={e=>e.currentTarget.style.color="#7A8BA8"}>{l}</span>)}
        <div style={{display:"flex",gap:8}}>
          {[["https://www.instagram.com/tawaslo",FaInstagram],["https://www.linkedin.com/company/tawaslo",FaLinkedin]].map(([href,Ic],i)=>(
            <a key={i} href={href} target="_blank" rel="noreferrer" style={{width:30,height:30,borderRadius:8,background:"#141923",border:"1px solid #232B38",display:"flex",alignItems:"center",justifyContent:"center",color:"#7A8BA8",textDecoration:"none",transition:"all 0.15s"}} onMouseEnter={e=>{e.currentTarget.style.color="#fff";e.currentTarget.style.borderColor="#4F6EF7";}} onMouseLeave={e=>{e.currentTarget.style.color="#7A8BA8";e.currentTarget.style.borderColor="#232B38";}}><Ic style={{fontSize:14}}/></a>
          ))}
        </div>
      </div>
    </div>
  );

  const grad = {background:"linear-gradient(135deg,#6E8CAB,#4F6B8C)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"};
  const card = {background:"#141923",border:"1px solid #232B38",borderRadius:14,padding:22};

  const PlanCard = ({name,desc,price,features,popular,extra=[],planKey}) => (
    <div style={{background:"#0D1119",border:`2px solid ${popular?"#6E8CAB":"#1E2838"}`,borderRadius:16,padding:24,position:"relative"}}>
      {popular&&<div style={{position:"absolute",top:-12,left:"50%",transform:"translateX(-50%)",background:"linear-gradient(135deg,#6E8CAB,#4F6B8C)",color:"#fff",fontSize:10,fontWeight:700,padding:"4px 16px",borderRadius:20,whiteSpace:"nowrap"}}>MOST POPULAR</div>}
      <div style={{fontSize:15,fontWeight:800,marginBottom:4}}>{name}</div>
      <div style={{fontSize:12,color:"#7A8BA8",marginBottom:16}}>{desc}</div>
      <div style={{marginBottom:approxLabel(lgeo,price)?2:8}}><span className="tw-num" style={{fontSize:34,fontWeight:700,color:popular?"#9DB6D6":"#F2F5F9"}}>${price}</span><span style={{fontSize:13,color:"#7A8BA8"}}> /mo</span></div>
      {approxLabel(lgeo,price)&&<div style={{fontSize:11,color:"#5A6B86",marginBottom:8}}>{approxLabel(lgeo,price).replace("approx ","≈ ")}</div>}
      {billing==='yearly'&&<div style={{fontSize:11,color:"#10B981",marginBottom:12}}>Save ${(prices.monthly[planKey]-price)*12}/year</div>}
      <div style={{fontSize:12,color:"#7A8BA8",lineHeight:2.2,marginBottom:20}}>{features.map(f=><div key={f}>✓ {f}</div>)}{extra.map(f=><div key={f} style={{color:"#3D5068"}}>— {f}</div>)}</div>
      <button onClick={()=>{ try{ sessionStorage.setItem('tw_signup_plan', planKey); }catch(e){} onGetStarted(); }} style={{width:"100%",padding:"11px",borderRadius:10,background:popular?"linear-gradient(135deg,#6E8CAB,#4F6B8C)":"transparent",border:popular?"none":"1px solid #232B38",color:popular?"#fff":"#7A8BA8",fontSize:13,fontWeight:700,cursor:"pointer"}}>Get started</button>
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
    nav: { position:"fixed", top:0, left:0, right:0, zIndex:100, padding:"0 40px", height:64, display:"flex", alignItems:"center", justifyContent:"space-between", background: "rgba(7,9,15,0.95)", backdropFilter: "blur(12px)", borderBottom: "1px solid #232B38", transition:"all 0.3s" },
    logo: { fontSize:20, fontWeight:900, background:"linear-gradient(135deg,#6E8CAB,#4F6B8C)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" },
    hero: { minHeight:"100vh", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", textAlign:"center", padding:"120px 20px 80px", background:"#080B11", position:"relative", overflow:"hidden" },
    heroBg: { position:"absolute", top:0, left:0, right:0, bottom:0, background:"radial-gradient(ellipse 80% 60% at 50% 0%, rgba(110,140,171,0.15) 0%, transparent 70%)", pointerEvents:"none" },
    badge: { display:"inline-flex", alignItems:"center", gap:6, padding:"6px 16px", borderRadius:20, background:"rgba(157,182,214,0.08)", border:"1px solid rgba(157,182,214,0.24)", color:"#A6B8CF", fontSize:11, fontWeight:600, letterSpacing:0.3, marginBottom:24 },
    h1: { fontSize:isMobile?34:56, fontWeight:900, color:"#E8EFF8", lineHeight:1.1, marginBottom:24, letterSpacing:-1.5, maxWidth:800 },
    sub: { fontSize:18, color:"#7A8BA8", maxWidth:560, lineHeight:1.7, marginBottom:40 },
    btnPrimary: { padding:"14px 32px", borderRadius:12, background:"linear-gradient(135deg,#6E8CAB,#4F6B8C)", border:"none", color:"#fff", fontSize:15, fontWeight:700, cursor:"pointer", display:"inline-flex", alignItems:"center", gap:8 },
    btnSecondary: { padding:"14px 32px", borderRadius:12, background:"transparent", border:"1px solid #232B38", color:"#7A8BA8", fontSize:15, fontWeight:600, cursor:"pointer" },
    section: { padding:"80px 40px", maxWidth:1100, margin:"0 auto" },
    sectionTitle: { fontSize:36, fontWeight:900, color:"#E8EFF8", textAlign:"center", marginBottom:12, letterSpacing:-0.5 },
    sectionSub: { fontSize:16, color:"#7A8BA8", textAlign:"center", marginBottom:56 },
  };

  const HomePage = () => (
    <div>
      <div style={{position:"relative",overflow:"hidden",background:"radial-gradient(circle, rgba(150,175,205,0.045) 1px, transparent 1px), radial-gradient(ellipse 60% 50% at 50% -6%, rgba(110,140,171,0.20), transparent 60%), #080B11", backgroundSize:"24px 24px, 100% 100%, 100% 100%", padding:isMobile?"56px 18px 56px":"72px 32px 80px", textAlign:"center"}}>
        <div style={{display:"inline-flex",alignItems:"center",gap:8,padding:"5px 14px",borderRadius:20,background:"rgba(157,182,214,0.08)",border:"1px solid rgba(157,182,214,0.22)",color:"#A6B8CF",fontSize:10.5,fontWeight:600,letterSpacing:0.3,marginBottom:22}}><span style={{width:5,height:5,borderRadius:"50%",background:"#7FC9A8",boxShadow:"0 0 0 3px rgba(127,201,168,0.18)"}}/>SOCIAL INTELLIGENCE, BUILT FOR EVERY BRAND</div>
        <h1 style={{fontSize:isMobile?32:48,fontWeight:900,lineHeight:1.08,marginBottom:18,letterSpacing:isMobile?-0.8:-1.6,maxWidth:700,margin:"0 auto 18px"}}>One platform.<br/><span style={grad}>Every language. Every brand.</span></h1>
        <p style={{fontSize:16,color:"#8A9BB8",maxWidth:520,margin:"0 auto 26px",lineHeight:1.7}}>Publish, schedule, analyse and grow across every network — and the first platform built natively for both English and Arabic. For agencies and brands, anywhere.</p>
        <div style={{display:"flex",gap:12,justifyContent:"center",marginBottom:18,flexWrap:"wrap"}}>
          <button onClick={onGetStarted} style={{padding:"13px 28px",borderRadius:11,background:"linear-gradient(135deg,#6E8CAB,#4F6B8C)",border:"none",color:"#fff",fontSize:14,fontWeight:700,cursor:"pointer",boxShadow:"0 10px 30px rgba(110,140,171,0.4)"}}>Start free trial →</button>
          <button onClick={()=>setLandingPage('pricing')} style={{padding:"13px 28px",borderRadius:11,background:"transparent",border:"1px solid #243752",color:"#C2D0E6",fontSize:14,fontWeight:600,cursor:"pointer"}}>View pricing</button>
        </div>
        <div style={{display:"flex",gap:20,justifyContent:"center",alignItems:"center",flexWrap:"wrap"}}>
          {["30-day free trial","No credit card","Arabic + English AI"].map(tx=>(
            <span key={tx} style={{color:"#6B7C99",fontSize:11.5,display:"inline-flex",alignItems:"center",gap:5}}><CheckCircle size={13} color="#10B981"/>{tx}</span>
          ))}
        </div>

        {/* Hero product preview — floating cards add depth, show it's a real product */}
        {!isMobile && (
        <div style={{maxWidth:820,margin:"44px auto 0",position:"relative"}}>
          <div style={{position:"absolute",inset:"-26px -10px 0",background:"radial-gradient(ellipse at 50% 18%, rgba(110,140,171,0.28), transparent 60%)",filter:"blur(8px)",pointerEvents:"none"}}/>
          <div style={{position:"absolute",left:-46,top:80,zIndex:4,background:"#121826",border:"1px solid #2C3A56",borderRadius:13,padding:"12px 14px",width:190,textAlign:"left",boxShadow:"0 22px 50px rgba(0,0,0,0.6)"}}>
            <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:8}}>
              <div style={{width:22,height:22,borderRadius:6,background:"linear-gradient(135deg,#6E8CAB,#4F6B8C)",display:"flex",alignItems:"center",justifyContent:"center"}}><Sparkles size={12} color="#fff"/></div>
              <span style={{color:"#E8EFF8",fontSize:11,fontWeight:700}}>AI caption</span>
            </div>
            <div style={{color:"#9FB0C8",fontSize:10,lineHeight:1.55,direction:"rtl"}}>حفلة إطلاق هذا الأسبوع، انضموا إلينا #تواصلو</div>
          </div>
          <div style={{position:"absolute",right:-40,top:40,zIndex:4,background:"#121826",border:"1px solid #2C3A56",borderRadius:12,padding:"11px 13px",width:172,textAlign:"left",boxShadow:"0 22px 50px rgba(0,0,0,0.6)"}}>
            <div style={{display:"flex",alignItems:"center",gap:7}}>
              <div style={{width:24,height:24,borderRadius:"50%",background:"rgba(16,185,129,0.16)",display:"flex",alignItems:"center",justifyContent:"center"}}><SendIcon size={13} color="#10B981"/></div>
              <div><div style={{color:"#E8EFF8",fontSize:10.5,fontWeight:700}}>Post published</div><div style={{color:"#7A8BA8",fontSize:9}}>Instagram · just now</div></div>
            </div>
          </div>
          <div style={{position:"absolute",right:-26,bottom:-18,zIndex:4,background:"#121826",border:"1px solid #2C3A56",borderRadius:11,padding:"9px 13px",display:"flex",alignItems:"center",gap:8,boxShadow:"0 18px 44px rgba(0,0,0,0.6)"}}>
            <Calendar size={15} color="#9DB6D6"/>
            <div style={{textAlign:"left"}}><div style={{color:"#E8EFF8",fontSize:10.5,fontWeight:700}}>14 posts scheduled</div><div style={{color:"#7A8BA8",fontSize:9}}>this week</div></div>
          </div>
          <div style={{position:"relative",zIndex:2,background:"#0C1017",border:"1px solid #232B38",borderRadius:16,overflow:"hidden",boxShadow:"0 50px 120px rgba(0,0,0,0.7)",textAlign:"left"}}>
            <div style={{display:"flex",alignItems:"center",gap:7,padding:"10px 14px",borderBottom:"1px solid #232B38",background:"#080B11"}}>
              <span style={{width:10,height:10,borderRadius:"50%",background:"#EF4444"}}/><span style={{width:10,height:10,borderRadius:"50%",background:"#F59E0B"}}/><span style={{width:10,height:10,borderRadius:"50%",background:"#10B981"}}/>
              <div style={{marginLeft:12,fontSize:11,color:"#3D5068",background:"#141923",borderRadius:7,padding:"4px 14px"}}>tawaslo.com/dashboard</div>
            </div>
            <div style={{display:"flex"}}>
              <div style={{width:162,borderRight:"1px solid #232B38",padding:"14px 12px",background:"#080B11",display:"flex",flexDirection:"column"}}>
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:16}}><img src="/logo-transparent.png" alt="" style={{width:22,height:22,objectFit:"contain"}}/><span style={{fontSize:13,fontWeight:800}}>Tawaslo</span></div>
                {[["Dashboard",true],["Publisher",false],["Planner",false],["Analytics",false],["Inbox",false]].map(([n,a],i)=>(
                  <div key={i} style={{display:"flex",alignItems:"center",gap:9,padding:"7px 9px",borderRadius:8,marginBottom:3,background:a?"rgba(110,140,171,0.14)":"transparent",color:a?"#9DB6D6":"#7A8BA8",fontSize:11.5,fontWeight:a?700:500}}><div style={{width:13,height:13,borderRadius:4,background:a?"#6E8CAB":"#232B38"}}/>{n}</div>
                ))}
                <div style={{marginTop:14,background:"#0E141E",border:"1px solid #232B38",borderRadius:10,padding:"10px 11px"}}>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:7}}><span style={{fontSize:9,color:"#7A8BA8",fontWeight:600}}>AI image credits</span><span className="tw-num" style={{fontSize:9,color:"#9DB6D6",fontWeight:700}}>64/100</span></div>
                  <div style={{height:5,background:"#080B11",borderRadius:5,overflow:"hidden"}}><div style={{width:"64%",height:"100%",background:"linear-gradient(90deg,#6E8CAB,#4F6B8C)",borderRadius:5}}/></div>
                </div>
                <div style={{marginTop:"auto",paddingTop:12,borderTop:"1px solid #232B38",display:"flex",alignItems:"center",gap:8}}>
                  <div style={{width:26,height:26,borderRadius:8,background:"linear-gradient(135deg,#6E8CAB,#4F6B8C)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:9.5,fontWeight:700,color:"#fff",flexShrink:0}}>MC</div>
                  <div style={{minWidth:0}}><div style={{fontSize:10,fontWeight:700,color:"#E8EFF8",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>Marina Café</div><div style={{fontSize:8.5,color:"#7A8BA8"}}>Professional</div></div>
                </div>
              </div>
              <div style={{flex:1,padding:16}}>
                <div style={{fontSize:13,fontWeight:700,marginBottom:12}}>Marina Café &amp; Bistro</div>
                <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:9,marginBottom:14}}>
                  {[["Followers","77.6K","#7FC9A8"],["Reach","1.5M","#9DB6D6"],["Posts","128","#A78BFA"],["Engage","6.4%","#D9A45C"]].map(([l,v,c],i)=>(
                    <div key={i} style={{background:"#141923",border:"1px solid #232B38",borderRadius:10,padding:"10px 11px"}}><div style={{fontSize:9,color:"#7A8BA8",marginBottom:5}}>{l}</div><div style={{fontSize:16,fontWeight:800,color:c}}>{v}</div></div>
                  ))}
                </div>
                <div style={{background:"#141923",border:"1px solid #232B38",borderRadius:10,padding:13}}>
                  <div style={{fontSize:10.5,color:"#7A8BA8",marginBottom:10}}>Reach &middot; last 30 days</div>
                  <svg viewBox="0 0 400 80" style={{width:"100%",height:80,display:"block"}}>
                    <defs><linearGradient id="heroSpark" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#4F6EF7" stopOpacity="0.3"/><stop offset="100%" stopColor="#4F6EF7" stopOpacity="0"/></linearGradient></defs>
                    <path d="M0,62 L57,55 L114,58 L171,38 L228,44 L285,24 L342,30 L400,10 L400,80 L0,80 Z" fill="url(#heroSpark)"/>
                    <path d="M0,62 L57,55 L114,58 L171,38 L228,44 L285,24 L342,30 L400,10" fill="none" stroke="#4F6EF7" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="470" style={{"--len":"470",animation:"twdraw 5.5s ease-in-out infinite"}}/>
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
        )}
      </div>

      {/* Platform strip */}
      <div style={{padding:"30px 32px",borderTop:"1px solid #232B38",borderBottom:"1px solid #232B38",background:"#080B11"}}>
        <div style={{textAlign:"center",fontSize:11,color:"#3D5068",fontWeight:700,letterSpacing:1.5,textTransform:"uppercase",marginBottom:18}}>Publish &amp; manage across every network</div>
        <div style={{display:"flex",gap:isMobile?20:40,justifyContent:"center",alignItems:"center",flexWrap:"wrap"}}>
          {[["Instagram","#E1306C",FaInstagram],["Facebook","#1877F2",FaFacebook],["TikTok","#E8EFF8",FaTiktok],["LinkedIn","#0A66C2",FaLinkedin],["X","#E8EFF8",FaTwitter],["YouTube","#FF0000",FaYoutube]].map(([n,c,Ic])=>(
            <div key={n} style={{display:"flex",alignItems:"center",gap:8,color:"#7A8BA8",fontSize:14,fontWeight:600}}><Ic style={{color:c,fontSize:20}}/>{n}</div>
          ))}
        </div>
      </div>

      {/* Journey */}
      <div style={{padding:isMobile?"54px 18px":"72px 32px",background:"#080B11"}}>
        <div style={{maxWidth:980,margin:"0 auto"}}>
          <div style={{textAlign:"center",marginBottom:isMobile?28:36}}>
            <div style={{color:"#566173",fontSize:10,fontWeight:700,letterSpacing:1.6,marginBottom:10}}>YOUR JOURNEY</div>
            <h2 style={{fontSize:isMobile?23:30,fontWeight:800,letterSpacing:-0.7,margin:0}}>From sign-up to growth, <span style={grad}>in minutes.</span></h2>
          </div>
          <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr 1fr":"repeat(4,1fr)",gap:isMobile?16:18,position:"relative"}}>
            <style>{`@keyframes jflow{0%{transform:translateX(-120%)}100%{transform:translateX(340%)}}@keyframes twdraw{0%{stroke-dashoffset:var(--len)}42%{stroke-dashoffset:0}66%{stroke-dashoffset:0}100%{stroke-dashoffset:var(--len)}}@keyframes twrise{0%,100%{opacity:0.25;transform:translateY(4px)}20%,80%{opacity:1;transform:none}}`}</style>
            {!isMobile&&<div style={{position:"absolute",top:21,left:"12.5%",right:"12.5%",height:2,borderRadius:2,background:"#212C42",overflow:"hidden",zIndex:1}}><div style={{position:"absolute",top:0,left:0,height:"100%",width:"30%",background:"linear-gradient(90deg,transparent,#6E8CAB,transparent)",animation:"jflow 3.2s linear infinite"}}/></div>}
            {[
              [Link,"01","Connect accounts","Link Instagram, Facebook and LinkedIn in seconds.",false],
              [Sparkles,"02","Create with AI","Draft bilingual captions and ideas instantly.",false],
              [Calendar,"03","Schedule the month","Plan everything, auto-publish at the best time.",false],
              [TrendingUp,"04","Watch it grow","Track reach and engagement, and prove the results.",true],
            ].map(([Ic,num,title,desc,hi])=>(
              <div key={num} style={{position:"relative",textAlign:"center"}}>
                <div style={{width:42,height:42,borderRadius:13,background:hi?"#19232F":"#121826",border:`1px solid ${hi?"#3E5C7E":"#2A3650"}`,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 13px",position:"relative",zIndex:2}}><Ic size={20} color={hi?"#9FC2E4":"#9DB6D6"}/></div>
                <div className="tw-num" style={{color:"#3D4A60",fontSize:13,fontWeight:600,marginBottom:3}}>{num}</div>
                <div style={{fontSize:13.5,fontWeight:600,marginBottom:5}}>{title}</div>
                <div style={{fontSize:12,color:"#7E8A9C",lineHeight:1.55}}>{desc}</div>
              </div>
            ))}
          </div>
          <div style={{marginTop:isMobile?28:34,paddingTop:24,borderTop:"1px solid #161D29"}}>
            <div style={{color:"#566173",fontSize:10,fontWeight:700,letterSpacing:1.4,marginBottom:14,textAlign:"center"}}>WHAT YOU GET</div>
            <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr 1fr":"repeat(4,1fr)",gap:12}}>
              {[
                [Clock,"Hours back weekly","Plan a whole month in one sitting.","#7FC9A8"],
                [Users,"Grow your audience","Post at the right time, every time.","#9DB6D6"],
                [Building2,"Every client, one place","Separate workspaces, instant switching.","#D9A45C"],
                [Languages,"Arabic + English","Built bilingual from day one.","#9FC2E4"],
              ].map(([Ic,t,d,col],i)=>(
                <div key={i} style={{background:"#0D1119",border:"1px solid #1E2838",borderRadius:13,padding:15}}>
                  <Ic size={18} color={col}/>
                  <div style={{fontSize:12.5,fontWeight:600,margin:"9px 0 3px"}}>{t}</div>
                  <div style={{fontSize:10.5,color:"#7E8A9C",lineHeight:1.5}}>{d}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div style={{background:"#0C1017",padding:isMobile?"54px 18px":"72px 32px"}}>
        <div style={{maxWidth:1000,margin:"0 auto"}}>
          <div style={{textAlign:"center",marginBottom:24}}>
            <div style={{color:"#566173",fontSize:10,fontWeight:700,letterSpacing:1.6,marginBottom:9}}>EVERYTHING YOUR BRAND NEEDS</div>
            <h2 style={{fontSize:isMobile?23:28,fontWeight:800,letterSpacing:-0.7,margin:0}}>Built to run social <span style={grad}>at scale.</span></h2>
          </div>
          <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"repeat(3,1fr)",gap:14}}>

            <div style={{gridColumn:isMobile?"auto":"span 2",background:"#0D1119",border:"1px solid #1E2838",borderRadius:16,padding:18}}>
              <div style={{fontSize:14,fontWeight:600,marginBottom:5}}>Smart Publisher</div>
              <div style={{fontSize:11.5,color:"#7E8A9C",marginBottom:14}}>Compose once, tailor per network, schedule or publish now.</div>
              <div style={{background:"#121826",border:"1px solid #232B38",borderRadius:11,padding:12}}>
                <div style={{color:"#C2CEDE",fontSize:11.5,marginBottom:10}}>Weekend special — two for one, all Friday ✦</div>
                <div style={{display:"flex",alignItems:"center",gap:7,flexWrap:"wrap"}}>
                  <span style={{display:"inline-flex",alignItems:"center",gap:5,background:"rgba(225,48,108,0.12)",color:"#E1306C",fontSize:10,fontWeight:600,borderRadius:7,padding:"5px 9px"}}><FaInstagram style={{fontSize:13}}/>Instagram</span>
                  <span style={{display:"inline-flex",alignItems:"center",gap:5,background:"rgba(24,119,242,0.12)",color:"#5B9BF5",fontSize:10,fontWeight:600,borderRadius:7,padding:"5px 9px"}}><FaFacebook style={{fontSize:13}}/>Facebook</span>
                  <span style={{marginLeft:"auto",display:"inline-flex",alignItems:"center",gap:5,background:"#6E8CAB",color:"#0B0E12",fontSize:10,fontWeight:700,borderRadius:7,padding:"5px 10px"}}><Calendar size={12}/>Schedule</span>
                </div>
              </div>
            </div>

            <div style={{background:"#0D1119",border:"1px solid #1E2838",borderRadius:16,padding:18}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:11}}>
                <div style={{width:28,height:28,borderRadius:8,background:"linear-gradient(135deg,#6E8CAB,#4F6B8C)",display:"flex",alignItems:"center",justifyContent:"center"}}><Sparkles size={14} color="#08111A"/></div>
                <div style={{fontSize:13.5,fontWeight:600}}>AI captions, EN + AR</div>
              </div>
              <div style={{background:"#121826",border:"1px solid #232B38",borderRadius:9,padding:"8px 11px",marginBottom:7,display:"flex",alignItems:"center",gap:9}}>
                <div style={{flex:1}}><span style={{fontSize:8,fontWeight:700,color:"#7FC9A8",background:"rgba(127,201,168,0.12)",borderRadius:4,padding:"1px 5px"}}>EN</span><div style={{color:"#C2CEDE",fontSize:10,marginTop:3,lineHeight:1.4}}>Launch party this week — join us ✦</div></div>
                <span style={{fontSize:9.5,fontWeight:700,color:"#0B0E12",background:"#6E8CAB",borderRadius:6,padding:"4px 10px",cursor:"pointer"}}>Use</span>
              </div>
              <div style={{background:"#121826",border:"1px solid #232B38",borderRadius:9,padding:"8px 11px",marginBottom:11,display:"flex",alignItems:"center",gap:9}}>
                <div style={{flex:1,textAlign:"right"}}><span style={{fontSize:8,fontWeight:700,color:"#9DB6D6",background:"rgba(157,182,214,0.12)",borderRadius:4,padding:"1px 5px"}}>AR</span><div style={{color:"#9FB0C8",fontSize:10,marginTop:3,direction:"rtl",lineHeight:1.5}}>حفلة إطلاق هذا الأسبوع، انضموا إلينا ✦</div></div>
                <span style={{fontSize:9.5,fontWeight:700,color:"#0B0E12",background:"#6E8CAB",borderRadius:6,padding:"4px 10px",cursor:"pointer"}}>Use</span>
              </div>
              <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:7,border:"1px solid #2A3650",borderRadius:9,padding:8,color:"#C7D4E4",fontSize:11,fontWeight:600,cursor:"pointer"}}>Use both</div>
            </div>

            <div style={{background:"#0D1119",border:"1px solid #1E2838",borderRadius:16,padding:18}}>
              <div style={{fontSize:14,fontWeight:600,marginBottom:5}}>Analytics</div>
              <div style={{fontSize:11.5,color:"#7E8A9C",marginBottom:6}}>Reach, growth, engagement — live.</div>
              <div className="tw-num" style={{color:"#fff",fontSize:24,fontWeight:600}}><CountUp to={1240000} format={v=>(v/1e6).toFixed(2)+"M"}/></div>
              <div style={{color:"#7FC9A8",fontSize:10,fontWeight:600,marginBottom:8}}>▲ 28% reach</div>
              <svg viewBox="0 0 200 34" style={{width:"100%",height:30,display:"block"}}><path d="M0,28 L40,22 L80,25 L120,12 L160,16 L200,5" fill="none" stroke="#6E8CAB" strokeWidth="2" strokeLinecap="round" strokeDasharray="240" style={{"--len":"240",animation:"twdraw 5s ease-in-out infinite"}}/></svg>
            </div>

            <div style={{gridColumn:isMobile?"auto":"span 2",background:"#0D1119",border:"1px solid #1E2838",borderRadius:16,padding:18}}>
              <div style={{fontSize:14,fontWeight:600,marginBottom:5}}>Plan your whole month</div>
              <div style={{fontSize:11.5,color:"#7E8A9C",marginBottom:13}}>Drag, drop, and see every client's calendar at a glance.</div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:5}}>
                {["M","T","W","T","F","S","S"].map((d,i)=><span key={"h"+i} style={{color:"#566173",fontSize:9,textAlign:"center"}}>{d}</span>)}
                {[0,1,0,2,3,0,4].map((v,i)=>{ const bg=["#121826","rgba(225,48,108,0.18)","rgba(110,140,171,0.22)","rgba(24,119,242,0.18)","rgba(127,201,168,0.16)"][v]; const bd=["#232B38","rgba(225,48,108,0.35)","rgba(110,140,171,0.4)","rgba(24,119,242,0.35)","rgba(127,201,168,0.3)"][v]; return <div key={i} style={{height:26,borderRadius:6,background:bg,border:`1px solid ${bd}`,animation:"twrise 5s ease-in-out infinite",animationDelay:(i*0.18)+"s"}}/>; })}
              </div>
            </div>

            <div style={{background:"#0D1119",border:"1px solid #1E2838",borderRadius:16,padding:18}}>
              <div style={{fontSize:14,fontWeight:600,marginBottom:5}}>Unified inbox</div>
              <div style={{fontSize:11.5,color:"#7E8A9C",marginBottom:11}}>Every comment and DM, one place.</div>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}><BlurAvatar size={24} hue={22}/><div style={{background:"#121826",border:"1px solid #232B38",borderRadius:8,padding:"6px 9px",color:"#C2CEDE",fontSize:10}}>Love this!</div></div>
              <div style={{display:"flex",alignItems:"center",gap:8}}><BlurAvatar size={24} hue={265}/><div style={{background:"#121826",border:"1px solid #232B38",borderRadius:8,padding:"6px 9px",color:"#C2CEDE",fontSize:10}}>Do you ship to Riffa?</div></div>
            </div>

          </div>
          <div style={{textAlign:"center",marginTop:28}}><button onClick={()=>setLandingPage('features')} style={{padding:"10px 24px",borderRadius:10,background:"linear-gradient(135deg,#6E8CAB,#4F6B8C)",border:"none",color:"#fff",fontSize:13,fontWeight:700,cursor:"pointer"}}>See all features →</button></div>
        </div>
      </div>
      <div style={{padding:"72px 32px",textAlign:"center",background:"#080B11",borderTop:"1px solid #232B38"}}>
        <h2 style={{fontSize:30,fontWeight:900,marginBottom:12}}>Ready to grow your brand?</h2>
        <p style={{color:"#7A8BA8",fontSize:14,marginBottom:28}}>Join brands worldwide using Tawaslo to manage their social media.</p>
        <button onClick={onGetStarted} style={{padding:"13px 30px",borderRadius:10,background:"linear-gradient(135deg,#6E8CAB,#4F6B8C)",border:"none",color:"#fff",fontSize:14,fontWeight:700,cursor:"pointer"}}>Start free — no credit card needed</button>
      </div>
    </div>
  );

  const TrialPage = () => (
    <div>
      <div style={{background:"radial-gradient(ellipse 80% 50% at 50% -10%, rgba(110,140,171,0.2) 0%, transparent 65%), #080B11",padding:isMobile?"56px 18px 40px":"80px 32px 56px",textAlign:"center"}}>
        <div style={{display:"inline-flex",alignItems:"center",gap:6,padding:"5px 16px",borderRadius:20,background:"rgba(16,185,129,0.1)",border:"1px solid rgba(16,185,129,0.3)",color:"#10B981",fontSize:11,fontWeight:700,marginBottom:22}}>✦ 30 days free &middot; No credit card</div>
        <h1 style={{fontSize:isMobile?30:46,fontWeight:900,lineHeight:1.1,marginBottom:18,letterSpacing:-1.2,maxWidth:720,margin:"0 auto 18px"}}>Start your <span style={grad}>free trial</span> today</h1>
        <p style={{fontSize:16,color:"#7A8BA8",maxWidth:520,margin:"0 auto 30px",lineHeight:1.7}}>Full access to every feature for 30 days. Connect your brands, publish with AI, and see the results — no credit card, cancel anytime.</p>
        <button onClick={onGetStarted} style={{padding:"14px 34px",borderRadius:11,background:"linear-gradient(135deg,#6E8CAB,#4F6B8C)",border:"none",color:"#fff",fontSize:15,fontWeight:700,cursor:"pointer",boxShadow:"0 10px 30px rgba(110,140,171,0.4)"}}>Create your free account →</button>
        <div style={{fontSize:12,color:"#3D5068",marginTop:14}}>Takes about 30 seconds &middot; No card required</div>
      </div>
      <div style={{background:"#0C1017",padding:isMobile?"44px 18px":"56px 32px",borderTop:"1px solid #232B38"}}>
        <div style={{maxWidth:1000,margin:"0 auto",display:"grid",gridTemplateColumns:isMobile?"1fr 1fr":"repeat(4,1fr)",gap:16}}>
          {[
            [CheckCircle,"30 days free","Full access, completely free for a month."],
            [Shield,"No credit card","Sign up with just your email — no payment upfront."],
            [Sparkles,"Every feature","All platforms, AI captions, analytics, multi-brand."],
            [XCircle,"Cancel anytime","No lock-in. Leave whenever you like, no questions."],
          ].map(([Ic,t,d],i)=>(
            <div key={i} style={{background:"#141923",border:"1px solid #232B38",borderRadius:14,padding:20,textAlign:"center"}}>
              <div style={{width:44,height:44,borderRadius:13,background:"rgba(110,140,171,0.11)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 14px"}}><Ic size={20} color="#4F6EF7"/></div>
              <div style={{fontSize:14,fontWeight:800,marginBottom:6}}>{t}</div>
              <div style={{fontSize:12,color:"#7A8BA8",lineHeight:1.6}}>{d}</div>
            </div>
          ))}
        </div>
      </div>
      <div style={{background:"#080B11",padding:isMobile?"44px 18px":"64px 32px"}}>
        <div style={{maxWidth:760,margin:"0 auto"}}>
          <h2 style={{fontSize:26,fontWeight:900,textAlign:"center",marginBottom:32}}>Everything unlocked from day one</h2>
          {[
            ["Connect unlimited brands","Manage all your clients and pages in one clean workspace."],
            ["Publish & schedule everywhere","Instagram, Facebook, LinkedIn and TikTok — from one composer."],
            ["AI captions in Arabic & English","Generate on-brand posts, hashtags and ideas in seconds."],
            ["Full analytics & reports","Track growth and export client-ready reports."],
          ].map(([t,d],i)=>(
            <div key={i} style={{display:"flex",gap:14,alignItems:"flex-start",marginBottom:18}}>
              <div style={{width:24,height:24,borderRadius:"50%",background:"rgba(16,185,129,0.13)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginTop:2}}><CheckCircle size={15} color="#10B981"/></div>
              <div><div style={{fontSize:14.5,fontWeight:700,marginBottom:3}}>{t}</div><div style={{fontSize:13,color:"#7A8BA8",lineHeight:1.6}}>{d}</div></div>
            </div>
          ))}
          <div style={{textAlign:"center",marginTop:32}}>
            <button onClick={onGetStarted} style={{padding:"13px 32px",borderRadius:11,background:"linear-gradient(135deg,#6E8CAB,#4F6B8C)",border:"none",color:"#fff",fontSize:14,fontWeight:700,cursor:"pointer"}}>Start my free trial →</button>
            <div style={{fontSize:12,color:"#3D5068",marginTop:12}}>From $49/mo after the trial. Cancel before it ends and you pay nothing.</div>
          </div>
        </div>
      </div>
    </div>
  );

  const FeaturesPage = () => (
    <div style={{padding:"60px 32px",maxWidth:1000,margin:"0 auto"}}>
      <div style={{textAlign:"center",marginBottom:48}}>
        <h1 style={{fontSize:36,fontWeight:900,marginBottom:12}}>Everything you need to<br/><span style={grad}>manage social media at scale</span></h1>
        <p style={{color:"#7A8BA8",fontSize:14,maxWidth:500,margin:"0 auto"}}>From publishing to analytics to inbox management, Tawaslo has it all.</p>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:20}}>

        {/* Publishing */}
        <div style={{background:"#0C1017",border:"1px solid #232B38",borderRadius:16,padding:28,display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:24,alignItems:"center"}}>
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
          <div style={{background:"#141923",borderRadius:12,padding:16,border:"1px solid #232B38"}}>
            <div style={{fontSize:10,color:"#7A8BA8",fontWeight:700,marginBottom:10}}>SCHEDULE</div>
            <div style={{display:"grid",gridTemplateColumns:isMobile?"repeat(3,1fr)":"repeat(7,1fr)",gap:4,marginBottom:12,textAlign:"center"}}>
              {["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map(d=><div key={d} style={{fontSize:9,color:"#7A8BA8"}}>{d}</div>)}
              {[["2",false],["3",true,"#4F6EF7"],["4",false],["5",true,"#E1306C"],["6",false],["7",true,"#4F6EF7"],["8",false]].map(([n,active,c])=>(
                <div key={n} style={{fontSize:10,padding:4,borderRadius:4,background:active?`${c}30`:"transparent",color:active?c:"#7A8BA8",fontWeight:active?700:400}}>{n}</div>
              ))}
            </div>
            <div style={{background:"#0C1017",borderRadius:8,padding:"8px 10px",fontSize:11,color:"#7A8BA8",marginBottom:6,display:"flex",justifyContent:"space-between",alignItems:"center"}}><span style={{display:"flex",alignItems:"center",gap:7}}><span style={{width:6,height:6,borderRadius:"50%",background:"#4F6EF7",display:"inline-block",flexShrink:0}}/>Product launch post</span><span style={{color:"#4F6EF7",fontSize:10}}>Tue 9:00am</span></div>
            <div style={{background:"#0C1017",borderRadius:8,padding:"8px 10px",fontSize:11,color:"#7A8BA8",display:"flex",justifyContent:"space-between",alignItems:"center"}}><span style={{display:"flex",alignItems:"center",gap:7}}><span style={{width:6,height:6,borderRadius:"50%",background:"#E1306C",display:"inline-block",flexShrink:0}}/>Weekly highlights</span><span style={{color:"#E1306C",fontSize:10}}>Thu 6:00pm</span></div>
          </div>
        </div>

        {/* AI Captions */}
        <div style={{background:"#0C1017",border:"1px solid #232B38",borderRadius:16,padding:28,display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:24,alignItems:"center"}}>
          <div style={{background:"#141923",borderRadius:12,padding:16,border:"1px solid #232B38"}}>
            <div style={{fontSize:10,color:"#7A8BA8",fontWeight:700,marginBottom:4}}>TOPIC</div>
            <div style={{background:"#0C1017",borderRadius:8,padding:"8px 10px",fontSize:12,color:"#7A8BA8",marginBottom:10}}>New summer collection launch</div>
            <div style={{display:"flex",gap:6,marginBottom:10}}>
              <span style={{padding:"4px 10px",borderRadius:20,background:"#4F6EF730",fontSize:10,color:"#4F6EF7"}}>Instagram</span>
              <span style={{padding:"4px 10px",borderRadius:20,background:"#7C3AED30",fontSize:10,color:"#7C3AED"}}>Exciting tone</span>
            </div>
            <div style={{border:"1px solid #232B38",borderRadius:8,padding:10,marginBottom:8}}>
              <div style={{fontSize:9,color:"#4F6EF7",fontWeight:700,marginBottom:4,letterSpacing:0.5}}>ENGLISH</div>
              <div style={{fontSize:11,color:"#E8EFF8",lineHeight:1.6}}>Summer is here & so is our new collection! ☀️ Fresh styles made for you. Shop now and shine! ✨ #SummerVibes #NewCollection</div>
            </div>
            <div style={{border:"1px solid #232B38",borderRadius:8,padding:10}}>
              <div style={{fontSize:9,color:"#7C3AED",fontWeight:700,marginBottom:4,letterSpacing:0.5}}>ARABIC</div>
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
        <div style={{background:"#0C1017",border:"1px solid #232B38",borderRadius:16,padding:28,display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:24,alignItems:"center"}}>
          <div>
            <div style={{fontSize:11,fontWeight:700,color:"#10B981",marginBottom:10,letterSpacing:1}}>ANALYTICS</div>
            <h3 style={{fontSize:20,fontWeight:800,marginBottom:10}}>Real data. Real insights.</h3>
            <p style={{fontSize:13,color:"#7A8BA8",lineHeight:1.7,marginBottom:16}}>Track followers, engagement, and growth across all platforms in real time. Monthly reports ready for your clients.</p>
            <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:10}}>
              {[["12.4K","Total Followers","#4F6EF7"],["+8.2%","Growth this month","#10B981"],["8.2K","Instagram","#E1306C"],["4.2K","Facebook","#1877F2"]].map(([v,l,c])=>(
                <div key={l} style={{background:"#141923",borderRadius:10,padding:12,textAlign:"center"}}><div style={{fontSize:18,fontWeight:900,color:c}}>{v}</div><div style={{fontSize:10,color:"#7A8BA8",marginTop:3}}>{l}</div></div>
              ))}
            </div>
          </div>
          <div style={{background:"#141923",borderRadius:12,padding:16,border:"1px solid #232B38"}}>
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
        <div style={{background:"#0C1017",border:"1px solid #232B38",borderRadius:16,padding:28,display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:24,alignItems:"center"}}>
          <div style={{background:"#141923",borderRadius:12,padding:16,border:"1px solid #232B38"}}>
            <div style={{fontSize:10,color:"#7A8BA8",fontWeight:700,marginBottom:10}}>INBOX <span style={{background:"#4F6EF7",color:"#fff",borderRadius:10,padding:"1px 7px",fontSize:9,marginLeft:4}}>7</span></div>
            {[["Ahmed Al-Mansoori","Love your latest post! Can you share more?","2h","#E1306C",20],["Sara Mohammed","What are your working hours?","4h","#1877F2",330],["Khalid Hassan","Great content, keep it up! 🔥","6h","#FF0050",35]].map(([name,msg,time,c,hue])=>(
              <div key={name} style={{display:"flex",gap:10,alignItems:"center",padding:8,background:"#0C1017",borderRadius:8,borderLeft:`2px solid ${c}`,marginBottom:6}}>
                <BlurAvatar size={28} hue={hue}/>
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
        <div style={{background:"#0C1017",border:"1px solid #232B38",borderRadius:16,padding:28,display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:24,alignItems:"center"}}>
          <div style={{background:"#141923",borderRadius:12,padding:16,border:"1px solid #232B38"}}>
            <div style={{fontSize:10,color:"#7A8BA8",fontWeight:700,marginBottom:10}}>YOUR CLIENTS</div>
            {[["🍽","Lumière Dining","Fine Dining","#E1306C","#F97316","Active"],["👗","Velour Fashion","Retail & Fashion","#7C3AED","#E1306C","Active"],["🏠","Prime Properties","Real Estate","#4F6EF7","#10B981","Active"],["🚗","Motivo Motors","Automotive","#F59E0B","#EF4444","Pending"]].map(([icon,name,cat,c1,c2,status])=>(
              <div key={name} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 10px",background:"#0C1017",borderRadius:8,marginBottom:6}}>
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
        <div style={{display:"inline-flex",background:"#0C1017",border:"1px solid #232B38",borderRadius:10,padding:4}}>
          {['monthly','yearly'].map(b=>(
            <button key={b} onClick={()=>setBilling(b)} style={{padding:"7px 20px",borderRadius:8,fontSize:13,fontWeight:600,cursor:"pointer",border:"none",background:billing===b?"linear-gradient(135deg,#6E8CAB,#4F6B8C)":"transparent",color:billing===b?"#fff":"#7A8BA8"}}>
              {b==='monthly'?'Monthly':'Yearly '}{b==='yearly'&&<span style={{fontSize:10,color:billing==='yearly'?"#fff":"#10B981",fontWeight:700}}>save 20%</span>}
            </button>
          ))}
        </div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"repeat(3,1fr)",gap:16,marginBottom:48}}>
        <PlanCard name="Essential" planKey="starter" desc="For small businesses" price={p.starter} features={["3 social accounts","1 team member","30 posts/month","AI captions (EN + AR)","Analytics dashboard","Monthly reports"]}/>
        <PlanCard name="Professional" planKey="pro" desc="For growing brands" price={p.pro} popular features={["10 social accounts","5 team members","100 posts/month","AI captions (EN + AR)","Analytics dashboard","Priority support"]}/>
        <PlanCard name="Enterprise" planKey="agency" desc="For agencies" price={p.agency} features={["Unlimited accounts","20 team members","Unlimited posts","AI captions (EN + AR)","White-label reports","Dedicated support"]}/>
      </div>

      <div style={{textAlign:"center",marginBottom:44,display:"flex",alignItems:"center",justifyContent:"center",gap:8,flexWrap:"wrap"}}>
        <span style={{display:"inline-flex",alignItems:"center",gap:6,fontSize:12.5,color:"#7A8BA8",background:"#0C1017",border:"1px solid #232B38",borderRadius:999,padding:"8px 16px"}}>
          Optional AI image generation, add a monthly pack from <span style={{color:"#9DB6D6",fontWeight:700}}>$18.90</span> when you choose your plan.
        </span>
      </div>

      <div style={{background:"#0C1017",border:"1px solid #232B38",borderRadius:16,overflow:"hidden"}}>
        <div style={{padding:"16px 20px",borderBottom:"1px solid #232B38"}}><h3 style={{fontSize:15,fontWeight:800}}>Compare plans</h3></div>
        <div style={{overflowX:"auto"}}><div style={{minWidth:isMobile?460:"auto"}}>
        {[["","Essential","Professional","Enterprise",true],["Publishing","","","",false,"header"],["Social accounts","3","10","Unlimited",false],["Posts per month","30","100","Unlimited",false],["Post scheduling","✓","✓","✓",false],["AI Features","","","",false,"header"],["AI caption generator","✓","✓","✓",false],["Arabic captions","✓","✓","✓",false],["Custom tone & style","—","✓","✓",false],["AI image generation","Add-on","Add-on","Add-on",false],["Analytics","","","",false,"header"],["Analytics dashboard","✓","✓","✓",false],["Monthly reports","✓","✓","✓",false],["White-label reports","—","—","✓",false],["Team","","","",false,"header"],["Team members","1","5","20",false],["Multi-client workspace","—","✓","✓",false],["Dedicated support","—","—","✓",false]].map(([feat,s,pr,ag,isHead,type],i)=>(
          <div key={i} style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr 1fr",padding:type==="header"?"6px 20px":"10px 20px",borderBottom:"1px solid #232B3830",background:isHead?"#141923":type==="header"?"#0C1017":"transparent",fontSize:12,alignItems:"center",color:type==="header"?"#4F6EF7":isHead?"#7A8BA8":"#E8EFF8",fontWeight:type==="header"?700:isHead?700:400,textTransform:type==="header"?"uppercase":"none",letterSpacing:type==="header"?"0.5px":"0"}}>
            <div>{feat}</div>
            <div style={{textAlign:"center",color:s==="✓"?"#10B981":s==="—"?"#3D5068":"#E8EFF8"}}>{s}</div><div style={{textAlign:"center",color:pr==="✓"?"#10B981":pr==="—"?"#3D5068":"#E8EFF8"}}>{pr}</div><div style={{textAlign:"center",color:ag==="✓"?"#10B981":ag==="—"?"#3D5068":"#E8EFF8"}}>{ag}</div>
          </div>
        ))}
        </div></div>
      </div>

      <div style={{marginTop:56}}>
        <div style={{textAlign:"center",marginBottom:6}}><h2 style={{fontSize:28,fontWeight:900,letterSpacing:-0.5}}>How Tawaslo compares</h2></div>
        <p style={{textAlign:"center",color:"#7A8BA8",fontSize:13.5,marginBottom:26}}>Everything the global tools do — and the first that's truly bilingual in English and Arabic — at a fraction of the price.</p>
        <div style={{background:"#0C1017",border:"1px solid #232B38",borderRadius:16,overflow:"hidden"}}>
          <div style={{overflowX:"auto"}}><div style={{minWidth:isMobile?520:"auto"}}>
          <div style={{display:"grid",gridTemplateColumns:"2.1fr 1fr 1fr 1fr",padding:"15px 18px",borderBottom:"1px solid #232B38",fontSize:13,fontWeight:800,alignItems:"center"}}>
            <div/>
            <div style={{textAlign:"center",color:"#fff",display:"flex",flexDirection:"column",alignItems:"center",gap:3}}><img src="/logo-transparent.png" alt="" style={{width:20,height:20,objectFit:"contain"}}/>Tawaslo</div>
            <div style={{textAlign:"center",color:"#7A8BA8"}}>Hootsuite</div>
            <div style={{textAlign:"center",color:"#7A8BA8"}}>Sprout Social</div>
          </div>
          {[
            ["Starting price","From $49/mo","From ~$99/mo","From ~$249/mo"],
            ["Native Arabic & RTL","✓","✕","✕"],
            ["AI captions (Arabic + English)","✓","Add-on","Limited"],
            ["AI image generation","✓","Add-on","Limited"],
            ["Local payment methods","✓","✕","✕"],
            ["Flat pricing, no per-seat fees","✓","✕","✕"],
            ["Free trial","30 days","30 days","30 days"],
            ["Multi-client / agency workspace","✓","✓","✓"],
            ["Unified comments & DM inbox","✓","✓","✓"],
          ].map(([feat,tw,ho,sp],i,arr)=>(
            <div key={i} style={{display:"grid",gridTemplateColumns:"2.1fr 1fr 1fr 1fr",padding:"11px 18px",borderBottom:i<arr.length-1?"1px solid #232B3830":"none",fontSize:12.5,alignItems:"center"}}>
              <div style={{color:"#E8EFF8",fontWeight:500}}>{feat}</div>
              <div style={{display:"flex",justifyContent:"center",fontWeight:700,background:"rgba(110,140,171,0.1)",borderLeft:"1px solid #1E2838",borderRight:"1px solid #1E2838",padding:"7px 0",color:"#fff"}}>{tw==="✓"?<CheckCircle size={15} color="#10B981"/>:tw==="✕"?<XCircle size={15} color="#EF4444"/>:tw}</div>
              <div style={{display:"flex",justifyContent:"center",color:"#7A8BA8"}}>{ho==="✓"?<CheckCircle size={15} color="#10B981"/>:ho==="✕"?<XCircle size={15} color="#5b6b85"/>:ho}</div>
              <div style={{display:"flex",justifyContent:"center",color:"#7A8BA8"}}>{sp==="✓"?<CheckCircle size={15} color="#10B981"/>:sp==="✕"?<XCircle size={15} color="#5b6b85"/>:sp}</div>
            </div>
          ))}
        </div></div>
        </div>
        <p style={{textAlign:"center",color:"#3D5068",fontSize:10.5,marginTop:12,lineHeight:1.5}}>Competitor pricing is approximate, based on publicly listed entry plans; features compared at time of writing.</p>
      </div>
    </div>
  );

  const AboutPage = () => (
    <div style={{padding:"60px 32px",maxWidth:860,margin:"0 auto"}}>
      <h1 style={{fontSize:38,fontWeight:900,marginBottom:20,lineHeight:1.2}}>Social media management,<br/><span style={grad}>reimagined for every brand.</span></h1>
      <p style={{fontSize:15,color:"#7A8BA8",lineHeight:1.85,marginBottom:20}}>Tawaslo is a global social media management platform built for agencies and brands who want to do more — publish smarter, analyze better, and grow faster. Whether you're managing one brand or fifty, Tawaslo brings everything into one clean workspace.</p>
      <p style={{fontSize:15,color:"#7A8BA8",lineHeight:1.85,marginBottom:40}}>But we didn't stop there. We noticed something every other platform ignored: <strong style={{color:"#E8EFF8"}}>400 million people speak Arabic</strong> — and not a single major social media tool was truly built for them. So we built Tawaslo with Arabic as a first-class citizen. Full Arabic dashboard, AI captions in Arabic, right-to-left support. Not a plugin. Not a translation. Built in from day one.</p>
      <div style={{display:"grid",gridTemplateColumns:isMobile?"repeat(2,1fr)":"repeat(4,1fr)",gap:14,marginBottom:40}}>
        {[["400M+","Arabic speakers worldwide"],["1.5B+","English speakers worldwide"],["1st","Platform truly built for both"],["100%","Native Arabic + English"]].map(([v,l])=>(
          <div key={l} style={card}><div style={{fontSize:22,fontWeight:900,...grad,textAlign:"center"}}>{v}</div><div style={{fontSize:11,color:"#7A8BA8",marginTop:5,textAlign:"center"}}>{l}</div></div>
        ))}
      </div>
      <div style={{background:"#0C1017",border:"1px solid #232B38",borderRadius:16,padding:28,marginBottom:28}}>
        <div style={{fontSize:11,fontWeight:700,color:"#4F6EF7",letterSpacing:1,marginBottom:16}}>WHAT MAKES US DIFFERENT</div>
        <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:16}}>
          {[
            [Globe,"Truly global platform","Works for any brand anywhere in the world. No geographic limits."],
            [Languages,"Native Arabic support","Full Arabic dashboard and AI captions. RTL interface. Built in, not bolted on."],
            [Building2,"Agency-ready","Manage dozens of clients and brands from one clean workspace."],
            [Tag,"Priced fairly","A fraction of the cost of Hootsuite or Sprout Social. No per-user nonsense."],
            [Wand2,"AI content, EN & AR","Generate on-brand captions, hashtags and ideas in seconds — in both languages."],
            [Calendar,"Schedule & auto-publish","Plan your whole month and let Tawaslo post automatically at the perfect time."],
          ].map(([Ic,title,desc])=>(
            <div key={title} style={{display:"flex",gap:13,alignItems:"flex-start"}}>
              <div style={{width:38,height:38,borderRadius:11,background:"rgba(110,140,171,0.11)",border:"1px solid #232B38",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginTop:1}}><Ic size={18} color="#4F6EF7"/></div>
              <div><div style={{fontSize:13,fontWeight:700,marginBottom:4}}>{title}</div><div style={{fontSize:12,color:"#7A8BA8",lineHeight:1.6}}>{desc}</div></div>
            </div>
          ))}
        </div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"repeat(3,1fr)",gap:14}}>
        {[["2026","Founded"],["EN + AR","First to do both"],["Worldwide","Built for"]].map(([v,l])=>(
          <div key={l} style={{...card,textAlign:"center"}}><div style={{fontSize:22,fontWeight:900,...grad}}>{v}</div><div style={{fontSize:11,color:"#7A8BA8",marginTop:5}}>{l}</div></div>
        ))}
      </div>
    </div>
  );

  const ContactPage = () => (
    <div style={{padding:isMobile?"40px 20px":"64px 32px",maxWidth:980,margin:"0 auto"}}>
      <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"0.9fr 1.1fr",gap:isMobile?30:48,alignItems:"start"}}>
        <div>
          <div style={{color:"#566173",fontSize:10,fontWeight:700,letterSpacing:1.6,marginBottom:12}}>CONTACT</div>
          <h1 style={{fontSize:isMobile?30:40,fontWeight:900,letterSpacing:-0.9,margin:"0 0 14px",lineHeight:1.05}}>Let's talk.</h1>
          <p style={{color:"#7A8BA8",fontSize:14,lineHeight:1.7,marginBottom:30,maxWidth:380}}>Questions about a plan, a demo for your agency, or help getting set up? Send a note and we'll reply within one business day.</p>
          <div style={{display:"flex",flexDirection:"column",gap:14}}>
            {[[Mail,"Email us","support@tawaslo.com"],[Clock,"Response time","Within 1 business day"],[Languages,"Bilingual support","English & Arabic, worldwide"]].map(([Ic,t,d],i)=>(
              <div key={i} style={{display:"flex",alignItems:"center",gap:13}}>
                <div style={{width:40,height:40,borderRadius:11,background:"#121826",border:"1px solid #232B38",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><Ic size={17} color="#9DB6D6"/></div>
                <div><div style={{fontSize:13,fontWeight:700,color:"#E8EFF8"}}>{t}</div><div style={{fontSize:12,color:"#7A8BA8"}}>{d}</div></div>
              </div>
            ))}
          </div>
        </div>
        <div style={{background:"#0C1017",border:"1px solid #232B38",borderRadius:16,padding:isMobile?22:28,display:"flex",flexDirection:"column",gap:16}}>
          {[["Name","text","Your name","name"],["Email","email","your@email.com","email"],["Company","text","Your company (optional)","company"]].map(([label,type,ph,key])=>(
            <div key={label}><div style={{fontSize:11,color:"#7A8BA8",marginBottom:6}}>{label}</div><input type={type} placeholder={ph} value={contact[key]} onChange={e=>setContact(c=>({...c,[key]:e.target.value}))} style={{width:"100%",padding:"11px 14px",borderRadius:8,border:"1px solid #232B38",background:"#141923",color:"#E8EFF8",fontSize:13,outline:"none",boxSizing:"border-box"}}/></div>
          ))}
          <div><div style={{fontSize:11,color:"#7A8BA8",marginBottom:6}}>Message</div><textarea placeholder="How can we help?" value={contact.message} onChange={e=>setContact(c=>({...c,message:e.target.value}))} style={{width:"100%",padding:"11px 14px",borderRadius:8,border:"1px solid #232B38",background:"#141923",color:"#E8EFF8",fontSize:13,outline:"none",resize:"vertical",height:120,boxSizing:"border-box"}}/></div>
          {contactSent ? (
            <div style={{padding:13,borderRadius:10,background:"rgba(16,185,129,0.12)",border:"1px solid rgba(16,185,129,0.3)",color:"#10B981",fontSize:13,fontWeight:600,textAlign:"center",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}><CheckCircle size={15}/>Thanks — your email is opening. We will be in touch shortly.</div>
          ) : (
            <button onClick={sendContact} style={{padding:13,borderRadius:10,background:"linear-gradient(135deg,#6E8CAB,#4F6B8C)",border:"none",color:"#fff",fontSize:13,fontWeight:700,cursor:"pointer"}}>Send message</button>
          )}
        </div>
      </div>
    </div>
  );

  const FAQS = [
    ["What is Tawaslo?", "Tawaslo is a social media management platform that lets you publish, schedule, reply, and analyze across all your accounts from one place. It is built for agencies and brands worldwide, and it is the first platform that is truly bilingual in English and Arabic."],
    ["Which platforms does Tawaslo support?", "Instagram, Facebook, and LinkedIn today, with TikTok, X, and YouTube on the way."],
    ["Does Tawaslo work in Arabic?", "Yes. Tawaslo has native Arabic and right to left support, and the AI writes captions in both Arabic and English."],
    ["Is there a free trial?", "Yes. You get 30 days free with no credit card. The full workspace is unlocked, with a few trial limits: AI is capped at five generations and you can connect up to three accounts."],
    ["How does the AI work?", "Give it a topic and it generates on brand captions and hashtags in seconds, in Arabic and English, tuned to each brand voice. AI is a paid feature, with five free generations during your trial."],
    ["Can I manage more than one brand?", "Yes. Each brand gets its own workspace, connected accounts, and reports. You switch between them in one click."],
    ["How does pricing work?", "Flat monthly plans with no per seat fees. You can see current plans on the pricing page."],
    ["Is my data secure?", "Your data is stored securely and you control which accounts are connected. You can disconnect any account at any time."],
    ["How do I get started?", "Start your free trial, answer a few quick questions, connect an account, and publish your first post. It takes only a few minutes."],
    ["How do I connect my social accounts?", "Open Social Accounts in your dashboard and connect each network in a few clicks. Instagram needs a Business or Creator account linked to a Facebook Page, and LinkedIn needs admin access to your company Page."],
    ["Can I schedule posts in advance?", "Yes. Plan and schedule posts to every network from one composer, and see everything laid out on a visual calendar in the Planner."],
    ["Can my team work together in Tawaslo?", "Yes. Invite team members to your workspace so they can draft, schedule, and reply alongside you, with roles that fit how you work."],
    ["What analytics do I get?", "Track followers, reach, impressions, and engagement for every account, then turn it into clean monthly reports your clients are proud to receive."],
    ["Can I reply to comments and messages?", "Yes. The unified inbox brings comments and direct messages from your connected networks into one place, so nothing slips through."],
    ["Can I group posts into a campaign?", "Yes. Bundle related posts into a campaign, track them together against a goal, and measure performance in one view."],
    ["Can I cancel anytime?", "Yes. There are no long term contracts. Cancel whenever you like and keep access until the end of your billing period."],
    ["What payment methods do you accept?", "Major international cards and local payment methods, billed securely. See the pricing page for current plans."],
    ["Is there a mobile app?", "Tawaslo runs in any browser on desktop and mobile. A dedicated app is on our roadmap."],
    ["How do I get support?", "Email support@tawaslo.com, or reply to any Tawaslo email. We answer quickly."],
  ];
  const FAQPage = () => (
    <div style={{padding:"60px 32px",maxWidth:760,margin:"0 auto"}}>
      <div style={{textAlign:"center",marginBottom:40}}>
        <h1 style={{fontSize:36,fontWeight:900,marginBottom:12}}>Frequently asked questions</h1>
        <p style={{color:"#7A8BA8",fontSize:14}}>Everything you need to know about Tawaslo. Still curious? Email support@tawaslo.com.</p>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:12}}>
        {FAQS.map(([q,a],i)=>{
          const open = openFaq===i;
          return (
            <div key={i} style={{background:"#0C1017",border:`1px solid ${open?"#4F6EF7":"#232B38"}`,borderRadius:14,overflow:"hidden",transition:"border-color .15s"}}>
              <button onClick={()=>setOpenFaq(open?null:i)} style={{width:"100%",display:"flex",alignItems:"center",justifyContent:"space-between",gap:16,padding:"18px 22px",background:"transparent",border:"none",cursor:"pointer",textAlign:"left"}}>
                <span style={{fontSize:15,fontWeight:700,color:"#E8EFF8"}}>{q}</span>
                <ChevronDown size={18} color={open?"#4F6EF7":"#7A8BA8"} style={{flexShrink:0,transform:open?"rotate(180deg)":"none",transition:"transform .2s"}}/>
              </button>
              {open && <div style={{padding:"0 22px 20px",fontSize:13.5,lineHeight:1.75,color:"#A8B9CE"}}>{a}</div>}
            </div>
          );
        })}
      </div>
      <div style={{marginTop:40,textAlign:"center",background:"#0C1017",border:"1px solid #232B38",borderRadius:16,padding:"28px"}}>
        <div style={{fontSize:18,fontWeight:800,color:"#E8EFF8",marginBottom:8}}>Still have a question?</div>
        <div style={{fontSize:13,color:"#7A8BA8",marginBottom:18}}>Our team is happy to help. We usually reply within a few hours.</div>
        <button onClick={onGetStarted} style={{padding:"13px 30px",borderRadius:10,background:"linear-gradient(135deg,#6E8CAB,#4F6B8C)",border:"none",color:"#fff",fontSize:14,fontWeight:700,cursor:"pointer"}}>Start your free trial</button>
      </div>
    </div>
  );

  const sectionStyle = { fontSize:13, color:"#A8B9CE", lineHeight:1.75, marginBottom:12 };
  const sectionTitleStyle = { fontSize:13, fontWeight:700, color:"#4F6EF7", marginBottom:8, marginTop:0 };
  const dividerStyle = { border:"none", borderTop:"1px solid #232B38", margin:"24px 0" };
  const ulStyle = { fontSize:13, color:"#A8B9CE", lineHeight:1.75, marginBottom:12, paddingLeft:18 };

  const PrivacyPage = () => (
    <div style={{padding:"60px 32px", maxWidth:720, margin:"0 auto"}}>
      <div style={{display:"inline-block",fontSize:11,background:"rgba(110,140,171,0.15)",color:"#4F6EF7",borderRadius:20,padding:"3px 12px",marginBottom:14}}>Legal</div>
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
      <div style={{display:"inline-block",fontSize:11,background:"rgba(110,140,171,0.15)",color:"#4F6EF7",borderRadius:20,padding:"3px 12px",marginBottom:14}}>Legal</div>
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
    <div style={{background:"#080B11",color:"#E8EFF8",fontFamily:"'Plus Jakarta Sans','Sora','Segoe UI',sans-serif",minHeight:"100vh",paddingBottom:isMobile?74:0}}>
      <Nav/>
      {landingPage==='home'&&<HomePage/>}
      {landingPage==='trial'&&<TrialPage/>}
      {landingPage==='features'&&<FeaturesPage/>}
      {landingPage==='pricing'&&<PricingPage/>}
      {landingPage==='about'&&<AboutPage/>}
      {landingPage==='contact'&&<ContactPage/>}
      {landingPage==='faq'&&<FAQPage/>}
      {landingPage==='privacy'&&<PrivacyPage/>}
      {landingPage==='terms'&&<TermsPage/>}
      <Footer/>
      {isMobile && landingPage!=='pricing' && (
        <div style={{position:"fixed",bottom:0,left:0,right:0,zIndex:200,background:"rgba(12,17,32,0.96)",borderTop:"1px solid #232B38",backdropFilter:"blur(12px)",padding:"12px 16px",display:"flex",gap:10,alignItems:"center",boxShadow:"0 -8px 30px rgba(0,0,0,0.55)"}}>
          <button onClick={()=>setLandingPage('pricing')} style={{flex:1,padding:"12px",borderRadius:11,background:"transparent",border:"1px solid #232B38",color:"#E8EFF8",fontSize:13,fontWeight:600,cursor:"pointer"}}>View pricing</button>
          <button onClick={onGetStarted} style={{flex:1.6,padding:"12px",borderRadius:11,background:"linear-gradient(135deg,#6E8CAB,#4F6B8C)",border:"none",color:"#fff",fontSize:13.5,fontWeight:700,cursor:"pointer",boxShadow:"0 6px 20px rgba(110,140,171,0.45)"}}>Start free trial</button>
        </div>
      )}
    </div>
  );
}

function AdminLogin() {
  const { setIsAuthed } = useApp();
  const th = DARK; // admin console is always the premium dark theme
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    if (!email || !pw) { setError("Enter your email and password."); return; }
    setError(""); setLoading(true);
    const { data, error: err } = await signIn(email, pw);
    setLoading(false);
    if (err) { setError(err.message); return; }
    if (data?.user) setIsAuthed(true);
  };

  const field = (icon, placeholder, value, onChange, type) => (
    <div style={{display:"flex",alignItems:"center",gap:11,background:"rgba(255,255,255,0.03)",border:`1px solid ${th.border}`,borderRadius:13,padding:"13px 15px",marginBottom:12}}>
      {icon}
      <input
        type={type} value={value}
        onChange={e=>{onChange(e.target.value);setError("");}}
        onKeyDown={e=>{ if(e.key==="Enter") submit(); }}
        placeholder={placeholder}
        style={{background:"transparent",border:"none",outline:"none",color:th.text,fontSize:13.5,width:"100%",fontFamily:"inherit"}}
      />
      {type==="password" && (
        <button onClick={()=>setShow(s=>!s)} tabIndex={-1} style={{background:"none",border:"none",color:th.text3,cursor:"pointer",display:"flex",padding:0}}>
          <Eye size={15}/>
        </button>
      )}
    </div>
  );

  return (
    <div style={{
      minHeight:"100vh",width:"100%",display:"flex",alignItems:"center",justifyContent:"center",
      background:"radial-gradient(1100px 600px at 50% -10%, rgba(110,140,171,0.18), transparent 60%), radial-gradient(900px 500px at 90% 110%, rgba(124,58,237,0.16), transparent 55%), #080B11",
      fontFamily:"'Plus Jakarta Sans','Segoe UI',sans-serif",color:th.text,direction:"ltr",padding:24,position:"relative",overflow:"hidden",
    }}>
      {/* faint grid backdrop */}
      <div style={{position:"absolute",inset:0,backgroundImage:`linear-gradient(${th.border}22 1px, transparent 1px), linear-gradient(90deg, ${th.border}22 1px, transparent 1px)`,backgroundSize:"46px 46px",maskImage:"radial-gradient(circle at 50% 40%, #000 0%, transparent 70%)",WebkitMaskImage:"radial-gradient(circle at 50% 40%, #000 0%, transparent 70%)",pointerEvents:"none"}}/>

      <div style={{position:"relative",width:"100%",maxWidth:404}}>
        {/* brand */}
        <div style={{display:"flex",flexDirection:"column",alignItems:"center",marginBottom:26}}>
          <div style={{position:"relative",marginBottom:16}}>
            <div style={{width:64,height:64,borderRadius:19,background:th.gradient,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 14px 40px rgba(110,140,171,0.45)"}}>
              <Shield size={30} color="#fff" strokeWidth={1.7}/>
            </div>
            <div style={{position:"absolute",right:-7,bottom:-7,width:26,height:26,borderRadius:9,background:th.card,border:`1px solid ${th.border}`,display:"flex",alignItems:"center",justifyContent:"center"}}>
              <Lock size={13} color={th.accent}/>
            </div>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:9,marginBottom:7}}>
            <img src="/logo-transparent.png" alt="Tawaslo" style={{width:26,height:26,objectFit:"contain"}}/>
            <span style={{fontSize:21,fontWeight:900,letterSpacing:-0.7}}>Tawaslo</span>
            <span style={{fontSize:11,fontWeight:800,letterSpacing:1,color:th.accent,background:th.accentSoft,border:`1px solid ${th.accent}33`,borderRadius:8,padding:"3px 9px"}}>HQ</span>
          </div>
          <div style={{fontSize:12.5,color:th.text2,textAlign:"center"}}>Admin console · staff sign in only</div>
        </div>

        {/* card */}
        <div style={{background:"rgba(16,24,40,0.72)",backdropFilter:"blur(14px)",WebkitBackdropFilter:"blur(14px)",border:`1px solid ${th.border}`,borderRadius:22,padding:"26px 24px",boxShadow:"0 30px 80px rgba(0,0,0,0.55)"}}>
          {error && (
            <div style={{background:th.dangerSoft,border:`1px solid ${th.danger}40`,borderRadius:11,padding:"10px 13px",marginBottom:14,fontSize:12,color:th.danger}}>{error}</div>
          )}
          {field(<Mail size={15} color={th.text3}/>, "Admin email", email, setEmail, "email")}
          {field(<Lock size={15} color={th.text3}/>, "Password", pw, setPw, show?"text":"password")}
          <button onClick={submit} disabled={loading} style={{
            width:"100%",padding:"14px",borderRadius:13,background:th.gradient,border:"none",color:"#fff",fontSize:14,fontWeight:700,
            cursor:loading?"not-allowed":"pointer",opacity:loading?0.7:1,boxShadow:"0 8px 26px rgba(110,140,171,0.42)",
            display:"flex",alignItems:"center",justifyContent:"center",gap:8,marginTop:4,
          }}>
            {loading?"Signing in…":"Enter HQ"} {!loading && <ChevronRight size={16}/>}
          </button>
        </div>

        <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:7,marginTop:20,fontSize:11,color:th.text3}}>
          <Lock size={12}/> Protected area · Octo Fusion Collective Hub W.L.L
        </div>
        <div style={{textAlign:"center",marginTop:10}}>
          <a href="https://www.tawaslo.com" style={{fontSize:11.5,color:th.text2,textDecoration:"none"}}>← Back to tawaslo.com</a>
        </div>
      </div>
    </div>
  );
}

function AuthPage() {
  const { authPage, setAuthPage, setIsAuthed, setRecovery, setShowLanding, lang, setLang } = useApp();
  const isAR = lang === "ar";
  const L = (en, ar) => isAR ? ar : en;
  const isMobile = useIsMobile();
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
    const { data, error: err } = await signIn(email.trim().toLowerCase(), pw);
    setLoading(false);
    if (err) { setError(err.message); return; }
    if (data?.user) setIsAuthed(true);
  };

  const [signupStep,    setSignupStep]    = useState(1);
  const [trialGoal,     setTrialGoal]     = useState("");
  const [trialPlatforms,setTrialPlatforms]= useState([]);
  const [trialBrands,   setTrialBrands]   = useState("");
  const [accountType,   setAccountType]   = useState("agency");
  const [selectedPlan,  setSelectedPlan]  = useState(() => { try { const sp = sessionStorage.getItem('tw_signup_plan'); sessionStorage.removeItem('tw_signup_plan'); const map = { pro:'professional', starter:'starter', professional:'professional', agency:'agency' }; return (sp && map[sp]) || ""; } catch(e) { return ""; } });
  const [billingPeriod, setBillingPeriod] = useState("monthly");
  const [companyName,   setCompanyName]   = useState("");
  const [tosAgreed,     setTosAgreed]     = useState(false);
  const [imgAddon,      setImgAddon]      = useState("none");   // optional AI image pack chosen at signup
  const sgeo = useGeo();

  const handleSignUp = async () => {
    if (!tosAgreed) { setError("Please agree to the Terms of Service to continue."); return; }
    if (!companyName.trim()) { setError("Please enter your company or agency name."); return; }
    setError(""); setLoading(true);
    const { data, error: err } = await signUp(email, pw, name);
    setLoading(false);
    if (err) { setError(err.message); return; }
    if (data?.user) {
      try { markTrialStart(email); } catch(e) {}
      try { if (imgAddon && imgAddon !== "none") setImgPackOf(email.toLowerCase(), imgAddon); } catch(e) {}
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

  const handleUpdatePassword = async () => {
    if (pw.length < 6) { setError("Password must be at least 6 characters."); return; }
    setError(""); setLoading(true);
    const { error: err } = await updatePassword(pw);
    setLoading(false);
    if (err) { setError(err.message); return; }
    setSuccess("Password updated! Taking you in…");
    setTimeout(() => { try { window.history.replaceState({}, '', '/'); } catch (e) {} if (setRecovery) setRecovery(false); setIsAuthed(true); }, 1200);
  };

  const inp = (placeholder, value, onChange, type="text") => (
    <div style={{display:"flex",alignItems:"center",gap:10,background:th.card,border:`1px solid ${th.border}`,borderRadius:11,padding:"11px 14px",marginBottom:12}}>
      {type==="email"&&<Mail size={15} color={th.text3}/>}
      {type==="password"&&<Lock size={15} color={th.text3}/>}
      {type==="text"&&<User size={15} color={th.text3}/>}
      <input type={showPw&&type==="password"?"text":type} value={value} onChange={onChange} placeholder={placeholder}
        autoCapitalize="none" autoCorrect="off" spellCheck={false}
        autoComplete={type==="password"?"current-password":type==="email"?"email":"off"}
        style={{background:"transparent",border:"none",outline:"none",color:th.text,fontSize:16,width:"100%",fontFamily:"inherit",direction:"ltr",textAlign:isAR?"right":"left"}}/>
      {type==="password"&&(
        <button onClick={()=>setShowPw(!showPw)} style={{background:"none",border:"none",cursor:"pointer",display:"flex",alignItems:"center"}}>
          <Eye size={14} color={th.text3}/>
        </button>
      )}
    </div>
  );

  return (
    <div style={{display:"flex",height:"100vh",background:th.bg,color:th.text,fontFamily:"'Plus Jakarta Sans','Sora','Segoe UI',sans-serif",overflow:"hidden",direction:isAR?"rtl":"ltr"}}>
      <div style={{width:420,flexShrink:0,display:isMobile?"none":"flex",background:"linear-gradient(150deg,#0A0F18 0%,#0F1A2C 55%,#0B1118 100%)",borderRight:`1px solid ${th.border}`,flexDirection:"column",padding:"40px 36px",position:"relative",overflow:"hidden"}}>
        <style>{`@keyframes authglow{0%,100%{opacity:0.55;transform:translate(0,0) scale(1)}50%{opacity:0.85;transform:translate(12px,-10px) scale(1.08)}}`}</style>
        <div style={{position:"absolute",top:-40,left:-30,width:220,height:180,background:`radial-gradient(circle, ${th.accent}66, transparent 70%)`,filter:"blur(22px)",animation:"authglow 7s ease-in-out infinite",pointerEvents:"none",zIndex:0}}/>
        <div style={{position:"absolute",bottom:-50,right:-40,width:190,height:170,background:`radial-gradient(circle, ${th.accent}22, transparent 70%)`,filter:"blur(24px)",pointerEvents:"none",zIndex:0}}/>
        <div onClick={()=>setShowLanding(true)} title="Back to homepage" style={{display:"flex",alignItems:"center",gap:12,marginBottom:60,cursor:"pointer",position:"relative",zIndex:1}}>
          <img src="/logo-transparent.png" alt="Tawaslo" style={{width:42,height:42,objectFit:"contain",flexShrink:0}}/>
          <div>
            <div style={{fontWeight:900,fontSize:22,letterSpacing:-0.8}}>Tawaslo</div>
            <div style={{fontSize:10,color:th.text2,letterSpacing:0.5,textTransform:"uppercase"}}>Social Intelligence</div>
          </div>
        </div>
        <div style={{flex:1,position:"relative",zIndex:1}}>
          <div style={{fontSize:32,fontWeight:900,letterSpacing:-1,lineHeight:1.2,marginBottom:16}}>
            {isAR ? (<>
              أدِر كل<br/>
              <span style={{background:th.gradient,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>حساباتك الاجتماعية</span><br/>
              من مكان واحد.
            </>) : (<>
              Manage every<br/>
              <span style={{background:th.gradient,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>social account</span><br/>
              from one place.
            </>)}
          </div>
          <div style={{fontSize:13,color:th.text2,lineHeight:1.7,marginBottom:36,maxWidth:320}}>
            {L("Schedule, analyse, respond, and grow — one platform built for agencies and brands worldwide.","جدوِل وحلِّل ورُد وانمُ، منصة واحدة مبنية للوكالات والعلامات التجارية حول العالم.")}
          </div>
          {[
            {Icon:BarChart2,     label:L("Real-time analytics across all platforms","تحليلات لحظية عبر كل المنصات")},
            {Icon:Sparkles,      label:L("AI captions in Arabic and English","تعليقات بالذكاء الاصطناعي بالعربية والإنجليزية")},
            {Icon:MessageCircle, label:L("Unified inbox for all comments and DMs","صندوق وارد موحّد لكل التعليقات والرسائل")},
            {Icon:Shield,        label:L("Enterprise security and team controls","أمان مؤسسي وضوابط للفريق")},
          ].map(({Icon:I,label},i)=>(
            <div key={i} style={{display:"flex",alignItems:"center",gap:10,marginBottom:12}}>
              <div style={{width:28,height:28,borderRadius:7,background:th.accentSoft,border:`1px solid ${th.accent}33`,flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center"}}>
                <I size={13} color={th.accent}/>
              </div>
              <span style={{fontSize:12,color:th.text2}}>{label}</span>
            </div>
          ))}
        </div>
        <div style={{display:"flex",gap:7,marginTop:24,position:"relative",zIndex:1}}>
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
      <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",padding:isMobile?"24px 18px":40,overflowY:"auto"}}>
        <div style={{width:"100%",maxWidth:400}}>
          <div style={{display:"flex",justifyContent:"flex-end",marginBottom:8}}>
            <button onClick={()=>setLang&&setLang(l=>l==="en"?"ar":"en")} style={{display:"flex",alignItems:"center",gap:6,background:"transparent",border:`1px solid ${th.border}`,color:th.text2,fontSize:11.5,fontWeight:600,borderRadius:8,padding:"6px 11px",cursor:"pointer"}}>
              <Languages size={13}/>{isAR?"English":"عربي"}
            </button>
          </div>
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
                <h1 style={{margin:0,fontSize:24,fontWeight:900,letterSpacing:-0.6}}>{L("Welcome back","مرحباً بعودتك")}</h1>
                <p style={{margin:"6px 0 0",fontSize:13,color:th.text2}}>{L("Sign in to your Tawaslo workspace","سجّل الدخول إلى مساحة عملك في تواصلو")}</p>
              </div>
              {inp(L("Email address","البريد الإلكتروني"),email,e=>{setEmail(e.target.value);setError("");},"email")}
              {inp(L("Password","كلمة المرور"),pw,e=>{setPw(e.target.value);setError("");},"password")}
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:20}}>
                <label style={{display:"flex",alignItems:"center",gap:6,fontSize:12,color:th.text2,cursor:"pointer"}}>
                  <input type="checkbox" style={{accentColor:th.accent}}/>{L("Remember me","تذكّرني")}
                </label>
                <button onClick={()=>{setAuthPage("forgot");setError("");setSuccess("");}} style={{background:"none",border:"none",color:th.accent,fontSize:12,fontWeight:600,cursor:"pointer"}}>{L("Forgot password?","نسيت كلمة المرور؟")}</button>
              </div>
              <button onClick={handleSignIn} disabled={loading} style={{width:"100%",padding:"13px",borderRadius:11,background:th.gradient,border:"none",color:"#fff",fontSize:14,fontWeight:700,cursor:loading?"not-allowed":"pointer",opacity:loading?0.7:1,boxShadow:`0 8px 22px ${th.accent}55`,display:"flex",alignItems:"center",justifyContent:"center",gap:8,marginBottom:10}}>
                {loading?L("Signing in…","جارٍ تسجيل الدخول…"):L("Sign in","تسجيل الدخول")} {!loading&&<ChevronRight size={15} style={{transform:isAR?"scaleX(-1)":"none"}}/>}
              </button>
              <div style={{textAlign:"center",fontSize:12,color:th.text2}}>
                {L("Don't have an account?","ليس لديك حساب؟")}{" "}
                <button onClick={()=>{setAuthPage("register");setError("");setSuccess("");}} style={{background:"none",border:"none",color:th.accent,fontWeight:700,cursor:"pointer",fontSize:12}}>{L("Sign up free","سجّل مجاناً")}</button>
              </div>
            </>
          )}
          {authPage==="register"&&(
            <>
              {/* Step pills */}
              {signupStep < 4 && (
                <div style={{display:"flex",gap:6,marginBottom:24}}>
                  {[1,2,3].map(s=>(
                    <div key={s} style={{height:4,flex:1,borderRadius:2,background:s<=signupStep?th.accent:"#232B38",transition:"background 0.3s"}}/>
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
                  <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr 1fr",gap:10,marginBottom:20}}>
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
                      <div key={id} onClick={()=>setAccountType(id)} style={{background:th.card,border:`1.5px solid ${accountType===id?th.accent:th.border}`,borderRadius:10,padding:"14px 10px",textAlign:"center",cursor:"pointer",background:accountType===id?"rgba(110,140,171,0.1)":th.card,transition:"all 0.15s"}}>
                        <div style={{display:"flex",justifyContent:"center",marginBottom:8}}>{icon}</div>
                        <div style={{fontSize:11,fontWeight:700,color:th.text}}>{label}</div>
                        <div style={{fontSize:9,color:th.text2,marginTop:3,lineHeight:1.4}}>{desc}</div>
                      </div>
                    ))}
                  </div>
                  <button onClick={()=>setSignupStep(5)} style={{width:"100%",padding:"13px",borderRadius:11,background:th.gradient,border:"none",color:"#fff",fontSize:14,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:8,marginBottom:12}}>
                    Continue <ChevronRight size={15}/>
                  </button>
                  <div style={{textAlign:"center",fontSize:12,color:th.text2}}>
                    Already have an account?{" "}
                    <button onClick={()=>{setAuthPage("login");setError("");}} style={{background:"none",border:"none",color:th.accent,fontWeight:700,cursor:"pointer",fontSize:12}}>Sign in</button>
                  </div>
                </>
              )}

              {/* STEP 5 — Your goal (trial journey) */}
              {signupStep===5&&(
                <>
                  <div style={{marginBottom:22}}>
                    <h1 style={{margin:0,fontSize:22,fontWeight:900,letterSpacing:-0.5}}>What's your main goal?</h1>
                    <p style={{margin:"6px 0 0",fontSize:13,color:th.text2}}>We'll tailor your workspace around it.</p>
                  </div>
                  <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:20}}>
                    {[
                      ["grow","Grow my audience",TrendingUp],
                      ["time","Save time on posting",Clock],
                      ["clients","Manage multiple clients",Users],
                      ["analytics","Understand my analytics",BarChart2],
                    ].map(([id,label,Ic])=>(
                      <div key={id} onClick={()=>setTrialGoal(id)} style={{display:"flex",alignItems:"center",gap:13,padding:"14px 16px",borderRadius:12,border:`1.5px solid ${trialGoal===id?th.accent:th.border}`,background:trialGoal===id?"rgba(110,140,171,0.1)":th.card,cursor:"pointer",fontSize:13.5,fontWeight:600,color:th.text,transition:"all 0.15s"}}>
                        <div style={{width:34,height:34,borderRadius:9,background:trialGoal===id?th.gradient:th.card2,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><Ic size={17} color={trialGoal===id?"#fff":th.text2}/></div>
                        <span style={{flex:1}}>{label}</span>
                        <div style={{width:18,height:18,borderRadius:"50%",border:`1.5px solid ${trialGoal===id?th.accent:th.border}`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{trialGoal===id&&<div style={{width:9,height:9,borderRadius:"50%",background:th.accent}}/>}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{display:"flex",gap:8}}>
                    <button onClick={()=>setSignupStep(1)} style={{flex:1,padding:"11px",borderRadius:11,background:"transparent",border:`1px solid ${th.border}`,color:th.text2,fontSize:13,fontWeight:600,cursor:"pointer"}}>← Back</button>
                    <button onClick={()=>trialGoal&&setSignupStep(6)} disabled={!trialGoal} style={{flex:2,padding:"13px",borderRadius:11,background:th.gradient,border:"none",color:"#fff",fontSize:14,fontWeight:700,cursor:trialGoal?"pointer":"not-allowed",opacity:trialGoal?1:0.55,display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>Continue <ChevronRight size={15}/></button>
                  </div>
                </>
              )}

              {/* STEP 6 — Platforms + brands (trial journey) */}
              {signupStep===6&&(
                <>
                  <div style={{marginBottom:20}}>
                    <h1 style={{margin:0,fontSize:22,fontWeight:900,letterSpacing:-0.5}}>Tell us about your social</h1>
                    <p style={{margin:"6px 0 0",fontSize:13,color:th.text2}}>So we can set you up for the perfect start.</p>
                  </div>
                  <div style={{fontSize:11.5,fontWeight:700,color:th.text2,marginBottom:9,textTransform:"uppercase",letterSpacing:0.5}}>Which platforms do you post on?</div>
                  <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:22}}>
                    {[["ig","Instagram",FaInstagram,"#E1306C"],["fb","Facebook",FaFacebook,"#1877F2"],["li","LinkedIn",FaLinkedin,"#0A66C2"],["tt","TikTok",FaTiktok,th.text],["tw","X",FaTwitter,th.text]].map(([id,label,Ic,c])=>{
                      const on=trialPlatforms.includes(id);
                      return <div key={id} onClick={()=>setTrialPlatforms(p=>on?p.filter(x=>x!==id):[...p,id])} style={{display:"flex",alignItems:"center",gap:8,padding:"9px 14px",borderRadius:999,border:`1.5px solid ${on?th.accent:th.border}`,background:on?"rgba(110,140,171,0.1)":th.card,cursor:"pointer",fontSize:12.5,fontWeight:600,color:th.text}}><Ic style={{color:c,fontSize:15}}/>{label}{on&&<CheckCircle size={13} color={th.accent}/>}</div>;
                    })}
                  </div>
                  <div style={{fontSize:11.5,fontWeight:700,color:th.text2,marginBottom:9,textTransform:"uppercase",letterSpacing:0.5}}>How many brands do you manage?</div>
                  <div style={{display:"flex",gap:8,marginBottom:24}}>
                    {[["1","Just one"],["2-5","2 – 5"],["6+","6 or more"]].map(([id,label])=>(
                      <div key={id} onClick={()=>setTrialBrands(id)} style={{flex:1,textAlign:"center",padding:"12px",borderRadius:11,border:`1.5px solid ${trialBrands===id?th.accent:th.border}`,background:trialBrands===id?"rgba(110,140,171,0.1)":th.card,cursor:"pointer",fontSize:12.5,fontWeight:600,color:th.text}}>{label}</div>
                    ))}
                  </div>
                  <div style={{display:"flex",gap:8}}>
                    <button onClick={()=>setSignupStep(5)} style={{flex:1,padding:"11px",borderRadius:11,background:"transparent",border:`1px solid ${th.border}`,color:th.text2,fontSize:13,fontWeight:600,cursor:"pointer"}}>← Back</button>
                    <button onClick={()=>setSignupStep(2)} style={{flex:2,padding:"13px",borderRadius:11,background:th.gradient,border:"none",color:"#fff",fontSize:14,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>Continue <ChevronRight size={15}/></button>
                  </div>
                </>
              )}

              {/* STEP 2 — Plan */}
              {signupStep===2&&(
                <>
                  <div style={{marginBottom:24}}>
                    <h1 style={{margin:0,fontSize:22,fontWeight:900,letterSpacing:-0.5}}>Choose your plan</h1>
                    <p style={{margin:"6px 0 0",fontSize:13,color:th.text2}}>30-day free trial included. No credit card required.</p>
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
                    <div key={p.id} onClick={()=>setSelectedPlan(p.id)} style={{background:selectedPlan===p.id?"rgba(110,140,171,0.1)":th.card,border:`1.5px solid ${selectedPlan===p.id?th.accent:th.border}`,borderRadius:10,padding:"14px 16px",marginBottom:10,cursor:"pointer",display:"flex",justifyContent:"space-between",alignItems:"center",transition:"all 0.15s"}}>
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
                        {approxLabel(sgeo,billingPeriod==="annual"?p.annual:p.monthly)&&<div style={{fontSize:9,color:th.text3,marginTop:2}}>{approxLabel(sgeo,billingPeriod==="annual"?p.annual:p.monthly).replace("approx ","≈ ")}</div>}
                        {billingPeriod==="annual"&&<div style={{fontSize:9,color:"#10B981",marginTop:2}}>Save ${(p.monthly-p.annual)*12}/yr</div>}
                      </div>
                    </div>
                  ))}

                  {/* Optional AI image add-on — slides in once a plan is selected */}
                  <div style={{maxHeight:selectedPlan?460:0,opacity:selectedPlan?1:0,overflow:"hidden",transform:selectedPlan?"translateY(0)":"translateY(-8px)",transition:"max-height 0.45s ease, opacity 0.35s ease, transform 0.35s ease"}}>
                    <div style={{background:th.card2,border:`1px solid ${th.border}`,borderRadius:12,padding:"14px 16px",marginBottom:4}}>
                      <div style={{display:"flex",alignItems:"center",gap:9,marginBottom:11}}>
                        <div style={{width:30,height:30,borderRadius:9,background:th.accentSoft,display:"flex",alignItems:"center",justifyContent:"center"}}><Image size={15} color={th.accent}/></div>
                        <div>
                          <div style={{fontSize:12.5,fontWeight:800,color:th.text}}>Add AI image generation</div>
                          <div style={{fontSize:10.5,color:th.text2}}>Optional. On-brand images, generated and edited with AI.</div>
                        </div>
                      </div>
                      <div style={{display:"flex",flexDirection:"column",gap:7}}>
                        {IMG_PACKS.map(p=>{ const on=imgAddon===p.id; const ap=approxLabel(sgeo,p.price); return (
                          <div key={p.id} onClick={()=>setImgAddon(p.id)} style={{display:"flex",alignItems:"center",gap:11,background:on?"rgba(110,140,171,0.08)":th.card,border:`1.5px solid ${on?th.accent:th.border}`,borderRadius:10,padding:"9px 13px",cursor:"pointer"}}>
                            <div style={{width:16,height:16,borderRadius:"50%",border:`2px solid ${on?th.accent:th.border}`,flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center"}}>{on&&<div style={{width:8,height:8,borderRadius:"50%",background:th.accent}}/>}</div>
                            <div style={{flex:1}}>
                              <span style={{fontSize:12,fontWeight:700,color:th.text}}>{p.name}</span>
                              <span style={{fontSize:11,color:th.text2}}> · {p.images} images / mo</span>
                              {p.popular&&<span style={{fontSize:9,background:"rgba(124,58,237,0.2)",color:"#A78BFA",padding:"2px 8px",borderRadius:10,marginLeft:7}}>Most popular</span>}
                            </div>
                            <div style={{textAlign:"right"}}>
                              <div className="tw-num" style={{fontSize:13,fontWeight:700,color:th.text}}>+${p.price}</div>
                              {ap&&<div style={{fontSize:9.5,color:th.text3}}>{ap.replace("approx ","≈ ")}</div>}
                            </div>
                          </div>
                        ); })}
                        <div onClick={()=>setImgAddon("none")} style={{display:"flex",alignItems:"center",gap:11,background:"transparent",border:`1.5px solid ${imgAddon==="none"?th.accent:th.border}`,borderRadius:10,padding:"9px 13px",cursor:"pointer"}}>
                          <div style={{width:16,height:16,borderRadius:"50%",border:`2px solid ${imgAddon==="none"?th.accent:th.border}`,flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center"}}>{imgAddon==="none"&&<div style={{width:8,height:8,borderRadius:"50%",background:th.accent}}/>}</div>
                          <span style={{flex:1,fontSize:12,color:th.text2}}>No thanks, maybe later</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {selectedPlan && (()=>{ const PP=({starter:{monthly:49,annual:39},professional:{monthly:99,annual:79},agency:{monthly:199,annual:159}})[selectedPlan]||{}; const planP=billingPeriod==="annual"?PP.annual:PP.monthly; const addP=(IMG_PACKS.find(x=>x.id===imgAddon)||{}).price||0; const tot=Math.round(((planP||0)+addP)*100)/100; const ap=approxLabel(sgeo,tot); return (
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",margin:"2px 0 12px",padding:"11px 15px",background:th.card2,border:`1px solid ${th.border}`,borderRadius:11}}>
                      <span style={{fontSize:12,color:th.text2}}>Total</span>
                      <div style={{textAlign:"right"}}>
                        <span className="tw-num" style={{fontSize:19,fontWeight:800,color:th.text}}>${tot}</span><span style={{fontSize:11,color:th.text2}}>/mo</span>
                        {ap&&<div style={{fontSize:9.5,color:th.text3,marginTop:1}}>{ap.replace("approx ","≈ ")}</div>}
                      </div>
                    </div>
                  ); })()}
                  <div style={{display:"flex",gap:8,marginTop:4}}>
                    <button onClick={()=>setSignupStep(1)} style={{flex:1,padding:"11px",borderRadius:11,background:"transparent",border:`1px solid ${th.border}`,color:th.text2,fontSize:13,fontWeight:600,cursor:"pointer"}}>← Back</button>
                    <button onClick={()=>selectedPlan&&setSignupStep(3)} disabled={!selectedPlan} style={{flex:2,padding:"13px",borderRadius:11,background:th.gradient,border:"none",color:"#fff",fontSize:14,fontWeight:700,cursor:selectedPlan?"pointer":"not-allowed",opacity:selectedPlan?1:0.5,display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>Continue <ChevronRight size={15}/></button>
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
                    <div onClick={()=>setTosAgreed(!tosAgreed)} style={{width:16,height:16,minWidth:16,borderRadius:4,border:`1.5px solid ${tosAgreed?th.accent:th.border}`,background:tosAgreed?"rgba(110,140,171,0.2)":"transparent",marginTop:1,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}}>
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
                <h1 style={{margin:0,fontSize:24,fontWeight:900,letterSpacing:-0.6}}>{L("Reset password","إعادة تعيين كلمة المرور")}</h1>
                <p style={{margin:"6px 0 0",fontSize:13,color:th.text2}}>{L("We'll send a reset link to your email","سنرسل رابط إعادة التعيين إلى بريدك الإلكتروني")}</p>
              </div>
              {inp(L("Your email address","بريدك الإلكتروني"),email,e=>{setEmail(e.target.value);setError("");},"email")}
              <button onClick={handleReset} disabled={loading} style={{width:"100%",padding:"13px",borderRadius:11,background:th.gradient,border:"none",color:"#fff",fontSize:14,fontWeight:700,cursor:loading?"not-allowed":"pointer",opacity:loading?0.7:1,display:"flex",alignItems:"center",justifyContent:"center",gap:8,marginBottom:12}}>
                {loading?L("Sending…","جارٍ الإرسال…"):L("Send reset link","إرسال رابط إعادة التعيين")} {!loading&&<ChevronRight size={15} style={{transform:isAR?"scaleX(-1)":"none"}}/>}
              </button>
              <button onClick={()=>{setAuthPage("login");setError("");setSuccess("");}} style={{width:"100%",padding:"11px",borderRadius:11,background:"transparent",border:`1px solid ${th.border}`,color:th.text2,fontSize:13,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
                <ArrowLeft size={13} style={{transform:isAR?"scaleX(-1)":"none"}}/>{L("Back to sign in","العودة لتسجيل الدخول")}
              </button>
            </>
          )}

          {authPage==="recovery"&&(
            <>
              <div style={{marginBottom:28}}>
                <h1 style={{margin:0,fontSize:24,fontWeight:900,letterSpacing:-0.6}}>{L("Set a new password","تعيين كلمة مرور جديدة")}</h1>
                <p style={{margin:"6px 0 0",fontSize:13,color:th.text2}}>{L("Choose a new password for your Tawaslo account","اختر كلمة مرور جديدة لحسابك في تواصلو")}</p>
              </div>
              {inp(L("New password (min 6 characters)","كلمة مرور جديدة (٦ أحرف على الأقل)"),pw,e=>{setPw(e.target.value);setError("");},"password")}
              <button onClick={handleUpdatePassword} disabled={loading} style={{width:"100%",padding:"13px",borderRadius:11,background:th.gradient,border:"none",color:"#fff",fontSize:14,fontWeight:700,cursor:loading?"not-allowed":"pointer",opacity:loading?0.7:1,display:"flex",alignItems:"center",justifyContent:"center",gap:8,marginBottom:12}}>
                {loading?L("Updating…","جارٍ التحديث…"):L("Update password","تحديث كلمة المرور")} {!loading&&<ChevronRight size={15} style={{transform:isAR?"scaleX(-1)":"none"}}/>}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function OnboardingHero() {
  const { selClient, dark, setPage } = useApp();
  const th = dark ? DARK : LIGHT;
  const [realClientId, setRealClientId] = useState(null);
  const [accCount, setAccCount] = useState(0);
  const [postCount, setPostCount] = useState(0);
  const [seenAnalytics, setSeenAnalytics] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [focus, setFocus] = useState(null); // manually focused step index

  useEffect(() => {
    try { setDismissed(localStorage.getItem('tw_onboard_dismissed') === '1'); setSeenAnalytics(localStorage.getItem('tw_onb_analytics') === '1'); } catch (e) { /* ignore */ }
  }, []);
  useEffect(() => {
    if (!selClient?.name) return;
    supabase.from('clients').select('id').eq('name', selClient.name).limit(1).then(({ data }) => { if (data && data[0]) setRealClientId(data[0].id); });
  }, [selClient]);
  useEffect(() => {
    if (!realClientId) return;
    supabase.from('social_accounts').select('id', { count: 'exact', head: true }).eq('client_id', realClientId).then(({ count }) => setAccCount(count || 0));
    supabase.from('posts').select('id', { count: 'exact', head: true }).eq('client_id', realClientId).then(({ count }) => setPostCount(count || 0));
  }, [realClientId]);

  const steps = [
    { key:'connect', label:'Connect', title:'Bring your channels in', narrative:"Plug in Instagram, Facebook or LinkedIn. It takes about 30 seconds — and it unlocks everything else.", icon:Link, done: accCount > 0, page:'social', cta:'Connect a channel' },
    { key:'post', label:'Create', title:'Craft your first post', narrative:"Write it yourself, or let the AI draft a bilingual caption. Publish now, or schedule it for the perfect moment.", icon:Edit3, done: postCount > 0, page:'publisher', cta:'Open the composer' },
    { key:'grow', label:'Grow', title:'Watch it take off', narrative:"Reach, engagement and your best-performing content — all in one beautiful view, updated in real time.", icon:BarChart2, done: seenAnalytics, page:'analytics', cta:'See my analytics' },
  ];
  const doneCount = steps.filter(s => s.done).length;
  const pct = Math.round(doneCount / steps.length * 100);
  const allDone = doneCount === steps.length;
  if (dismissed) return null;

  const firstUndone = steps.findIndex(s => !s.done);
  const current = focus != null ? focus : (firstUndone === -1 ? steps.length - 1 : firstUndone);
  const step = steps[current];

  const go = (st) => { if (st.key === 'grow') { try { localStorage.setItem('tw_onb_analytics', '1'); } catch (e) { /* ignore */ } } setPage(st.page); };
  const dismiss = () => { try { localStorage.setItem('tw_onboard_dismissed', '1'); } catch (e) { /* ignore */ } setDismissed(true); };

  const stepVisual = (k) => {
    if (k === 'connect') return (
      <div style={{ display:"flex", flexDirection:"column", gap:9 }}>
        {[["Instagram","#E1306C",FaInstagram],["Facebook","#1877F2",FaFacebook],["LinkedIn","#0A66C2",FaLinkedin]].map(([n,c,Ic],i)=>(
          <div key={n} style={{ display:"flex", alignItems:"center", gap:10, background:th.card, border:`1px solid ${th.border}`, borderRadius:12, padding:"10px 12px", boxShadow:"0 6px 16px rgba(0,0,0,0.25)" }}>
            <div style={{ width:30, height:30, borderRadius:9, background:c+"22", display:"flex", alignItems:"center", justifyContent:"center" }}><Ic style={{ color:c, fontSize:16 }}/></div>
            <div style={{ flex:1, fontSize:12, fontWeight:600 }}>{n}</div>
            <div style={{ fontSize:9.5, fontWeight:700, color:i===0?th.success:th.accent, background:(i===0?th.success:th.accent)+"1f", borderRadius:999, padding:"3px 9px" }}>{i===0?"Linked":"Connect"}</div>
          </div>
        ))}
      </div>
    );
    if (k === 'post') return (
      <div style={{ background:th.card, border:`1px solid ${th.border}`, borderRadius:14, padding:13, boxShadow:"0 10px 26px rgba(0,0,0,0.3)" }}>
        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:11 }}><div style={{ width:26, height:26, borderRadius:8, background:th.gradient }}/><div style={{ height:7, width:"55%", borderRadius:4, background:th.card2 }}/></div>
        <div style={{ height:7, borderRadius:4, background:th.card2, marginBottom:6 }}/>
        <div style={{ height:7, width:"82%", borderRadius:4, background:th.card2, marginBottom:6 }}/>
        <div style={{ height:7, width:"40%", borderRadius:4, background:th.accentSoft, marginBottom:12 }}/>
        <div style={{ height:70, borderRadius:10, background:th.gradient, opacity:0.22, marginBottom:11 }}/>
        <div style={{ padding:"8px", borderRadius:9, background:th.gradient, color:"#fff", fontSize:11.5, fontWeight:600, textAlign:"center" }}>Publish</div>
      </div>
    );
    return (
      <div style={{ background:th.card, border:`1px solid ${th.border}`, borderRadius:14, padding:14, boxShadow:"0 10px 26px rgba(0,0,0,0.3)" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}><div style={{ fontSize:11, color:th.text2 }}>Reach this week</div><div style={{ fontSize:10, fontWeight:700, color:th.success, background:th.successSoft, borderRadius:999, padding:"3px 8px" }}>+24%</div></div>
        <div style={{ display:"flex", alignItems:"flex-end", gap:7, height:84 }}>
          {[34,52,44,68,84,76,96].map((h,i)=><div key={i} style={{ flex:1, height:h+"%", borderRadius:5, background: i>=5?th.gradient:th.accent+"55" }}/>)}
        </div>
      </div>
    );
  };

  return (
    <div className="tw-jny" style={{ position:"relative", overflow:"hidden", background:`linear-gradient(135deg, ${th.accent}1c, ${th.accent2}12 50%, ${th.surface})`, border:`1px solid ${th.border}`, borderRadius:20, marginBottom:22, boxShadow:"0 18px 48px rgba(0,0,0,0.34)" }}>
      <style>{`
        .tw-jny{animation:jnyIn .55s cubic-bezier(.2,.7,.2,1) both;}
        @keyframes jnyIn{from{opacity:0;transform:translateY(12px);}to{opacity:1;transform:none;}}
        .tw-jnode{transition:all .2s ease; cursor:pointer;}
        .tw-jcurrent{animation:jpulse 2.4s ease-in-out infinite;}
        @keyframes jpulse{0%,100%{box-shadow:0 0 0 0 ${th.accent}55;}50%{box-shadow:0 0 0 7px ${th.accent}00;}}
        .tw-jcta{transition:transform .14s ease, filter .15s ease;}
        .tw-jcta:hover{transform:translateY(-1px); filter:brightness(1.08);}
        @keyframes jswap{from{opacity:0;transform:translateX(8px);}to{opacity:1;transform:none;}}
        .tw-jfocus{animation:jswap .35s ease both;}
        @media(max-width:980px){.tw-jvis{display:none;}}
      `}</style>
      <div style={{ position:"absolute", top:-70, right:-30, width:340, height:240, background:`radial-gradient(ellipse, ${th.accent}33, transparent 70%)`, filter:"blur(34px)", pointerEvents:"none" }}/>
      <div style={{ height:4, background:th.border }}><div style={{ height:"100%", width:`${pct}%`, background:th.gradient, transition:"width .6s ease" }}/></div>
      <button onClick={dismiss} title="Dismiss" style={{ position:"absolute", top:16, right:16, background:"none", border:"none", color:th.text2, cursor:"pointer", display:"flex", zIndex:3 }}><XCircle size={18}/></button>

      <div style={{ position:"relative", zIndex:1, display:"flex", gap:30, padding:"22px 26px", flexWrap:"wrap" }}>
        {/* LEFT — the path */}
        <div style={{ width:260, flexShrink:0 }}>
          <div style={{ fontSize:10.5, fontWeight:700, letterSpacing:1.4, color:th.accent, textTransform:"uppercase", marginBottom:3 }}>Your setup journey</div>
          <div style={{ fontSize:16, fontWeight:700, marginBottom:18 }}>{allDone ? "All set" : `Step ${current + 1} of ${steps.length}`}</div>
          {steps.map((s,i)=>{ const isCur = i === current && !allDone; const last = i === steps.length - 1; return (
            <div key={s.key} className="tw-jnode" onClick={()=>setFocus(i)} style={{ display:"flex", gap:12, opacity: s.done || isCur ? 1 : 0.55 }}>
              <div style={{ display:"flex", flexDirection:"column", alignItems:"center" }}>
                <div className={isCur ? "tw-jcurrent" : ""} style={{ width:30, height:30, borderRadius:"50%", flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center", background: s.done ? th.success : (isCur ? th.gradient : th.card2), border:`1.5px solid ${s.done ? th.success : (isCur ? "transparent" : th.border)}`, color:"#fff", fontSize:12, fontWeight:700 }}>
                  {s.done ? <CheckCircle size={16}/> : i + 1}
                </div>
                {!last && <div style={{ width:2, flex:1, minHeight:26, background: steps[i].done ? th.success+"66" : th.border, margin:"3px 0" }}/>}
              </div>
              <div style={{ paddingBottom:last?0:6 }}>
                <div style={{ fontSize:13, fontWeight:600, color: isCur ? th.text : (s.done ? th.text : th.text2) }}>{s.label}</div>
                <div style={{ fontSize:11, color:th.text3, marginTop:1 }}>{s.done ? "Done" : isCur ? "In progress" : "Up next"}</div>
              </div>
            </div>
          ); })}
        </div>

        {/* RIGHT — focused step */}
        <div key={allDone ? 'done' : step.key} className="tw-jfocus" style={{ flex:1, minWidth:280, display:"flex", flexDirection:"column", justifyContent:"center" }}>
          {allDone ? (
            <>
              <div style={{ width:56, height:56, borderRadius:16, background:th.gradient, display:"flex", alignItems:"center", justifyContent:"center", marginBottom:16, boxShadow:`0 12px 30px ${th.accent}55` }}><Sparkles size={26} color="#fff"/></div>
              <div style={{ fontSize:22, fontWeight:700, letterSpacing:-0.4, marginBottom:8 }}>You're all set, {selClient?.name || "let's grow"}!</div>
              <div style={{ fontSize:13.5, color:th.text2, lineHeight:1.6, maxWidth:460, marginBottom:20 }}>Your workspace is ready. Channels connected, first post out, analytics live — now the fun part: growing your audience.</div>
              <div style={{ display:"flex", gap:10 }}>
                <button className="tw-jcta" onClick={()=>setPage('publisher')} style={{ padding:"11px 20px", borderRadius:11, background:th.gradient, border:"none", color:"#fff", fontSize:13, fontWeight:600, cursor:"pointer", display:"flex", alignItems:"center", gap:7 }}><Edit3 size={15}/>Create a post</button>
                <button onClick={dismiss} style={{ padding:"11px 20px", borderRadius:11, background:"transparent", border:`1px solid ${th.border}`, color:th.text2, fontSize:13, fontWeight:600, cursor:"pointer" }}>Dismiss</button>
              </div>
            </>
          ) : (
            <div style={{ display:"flex", gap:24, alignItems:"center", width:"100%" }}>
              <div style={{ flex:1, minWidth:240 }}>
                <div style={{ width:54, height:54, borderRadius:15, background:`linear-gradient(135deg, ${th.accent}33, ${th.accent2}1c)`, border:`1px solid ${th.accent}33`, display:"flex", alignItems:"center", justifyContent:"center", marginBottom:15 }}><step.icon size={24} color={th.accent}/></div>
                <div style={{ fontSize:11, fontWeight:700, letterSpacing:1, color:th.accent, textTransform:"uppercase", marginBottom:6 }}>Step {current + 1} · {step.label}</div>
                <div style={{ fontSize:23, fontWeight:700, letterSpacing:-0.4, marginBottom:9 }}>{step.title}</div>
                <div style={{ fontSize:13.5, color:th.text2, lineHeight:1.65, maxWidth:430, marginBottom:20 }}>{step.narrative}</div>
                <div style={{ display:"flex", gap:14, alignItems:"center" }}>
                  <button className="tw-jcta" onClick={()=>go(step)} style={{ padding:"12px 22px", borderRadius:11, background:th.gradient, border:"none", color:"#fff", fontSize:13.5, fontWeight:600, cursor:"pointer", display:"flex", alignItems:"center", gap:8, boxShadow:`0 8px 22px ${th.accent}44` }}>{step.cta}<ArrowUpRight size={16}/></button>
                  {current < steps.length - 1 && <button onClick={()=>setFocus(current + 1)} style={{ background:"none", border:"none", color:th.text2, fontSize:12.5, fontWeight:600, cursor:"pointer" }}>Skip for now</button>}
                </div>
              </div>
              <div className="tw-jvis" style={{ width:236, flexShrink:0 }}>{stepVisual(step.key)}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Free-trial banner — shows days left in the 30-day trial; hides once subscribed.
function TrialBanner() {
  const { setPage, lang } = useApp();
  const isAR = lang === "ar";
  const th = useTheme();
  const [daysLeft, setDaysLeft] = useState(null);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    try { if (localStorage.getItem('tw_sub_active') === '1') { setHidden(true); return; } } catch (e) { /* ignore */ }
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user || !user.created_at) return;
        const start = new Date(user.created_at).getTime();
        const days = Math.ceil((start + 30 * 24 * 3600 * 1000 - Date.now()) / (24 * 3600 * 1000));
        setDaysLeft(days);
      } catch (e) { /* ignore */ }
    })();
  }, []);

  if (hidden || daysLeft === null) return null;
  const ended = daysLeft <= 0;
  return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:12, padding:"9px 22px", background: ended ? th.dangerSoft : "rgba(110,140,171,0.08)", borderBottom:`1px solid ${th.border}`, flexShrink:0 }}>
      <div style={{ fontSize:12.5, color: ended ? th.danger : th.text, display:"flex", alignItems:"center", gap:8 }}>
        <Sparkles size={14} color={ended ? th.danger : th.accent}/>
        {ended
          ? (isAR ? "انتهت فترتك التجريبية المجانية. قم بالترقية لمواصلة النشر." : "Your free trial has ended. Upgrade to keep publishing.")
          : (isAR
              ? <>أنت في فترة تجريبية مجانية. <strong>متبقٍ {daysLeft} يوم</strong> من الوصول الكامل.</>
              : <>You're on a free trial. <strong>{daysLeft} day{daysLeft === 1 ? "" : "s"} left</strong> of full access.</>)}
      </div>
      <div style={{ display:"flex", alignItems:"center", gap:10, flexShrink:0 }}>
        <button onClick={()=>setPage("billing")} style={{ padding:"7px 15px", borderRadius:9, background:th.gradient, border:"none", color:"#fff", fontSize:12, fontWeight:600, cursor:"pointer" }}>{isAR ? "ترقية" : "Upgrade"}</button>
        <button onClick={()=>setHidden(true)} title="Dismiss" aria-label="Dismiss" style={{ width:26, height:26, borderRadius:7, background:"transparent", border:"none", color:th.text2, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}><XCircle size={16}/></button>
      </div>
    </div>
  );
}

export default function TawasloApp() {
  const [dark,      setDark]      = useState(() => { try { return localStorage.getItem('tw_theme') !== 'light'; } catch(e){ return true; } });
  useEffect(() => { try { localStorage.setItem('tw_theme', dark ? 'dark' : 'light'); } catch(e){} }, [dark]);
  const [lang,      setLang]      = useState("en");
  const [showLanding, setShowLanding] = useState(() => { try { return sessionStorage.getItem('tw_in_app') !== '1'; } catch(e){ return true; } });
  const [mobileNav, setMobileNav] = useState(false);
  const [isAuthed,  setIsAuthed]  = useState(false);
  const [authPage,  setAuthPage]  = useState("login");
  const [recovery,  setRecovery]  = useState(typeof window !== 'undefined' && window.location.pathname.indexOf('reset-password') !== -1);
  const [mode,      setMode]      = useState("agency");
  const [page,      setPage]      = useState(()=>sessionStorage.getItem('tw_page')||"overview");
  const [selClient, setSelClient] = useState({ id:null, name:"Workspace", plan:"", status:"active", free:false, accounts:0, posts:0, reach:"—", health:100, spend:0 });
  const [authReady, setAuthReady] = useState(false); // prevents flash of login screen
  const [userEmail, setUserEmail] = useState(null);
  const [userName,  setUserName]  = useState("");
  const [userPlan,  setUserPlan]  = useState("");
  const [userCompany, setUserCompany] = useState("");
  const [clients,   setClients]   = useState([]);
  const [accountType, setAccountType] = useState("agency");
  const [selPlatform, setSelPlatform] = useState("all"); // shared client/platform context-bar filter
  const isAdminHost = typeof window !== "undefined" && window.location.hostname.indexOf(ADMIN_HOST_PREFIX) === 0;
  const isAdminUser = userEmail === ADMIN_EMAIL;

  // Load the signed-in user's real brands + decide which app (client vs admin) to show
  const loadWorkspace = async (user) => {
    setUserEmail(user.email || null);
    const { data: prof } = await getProfile(user.id);
    setAccountType(prof?.account_type || "agency");
    setUserName(prof?.name || (user.user_metadata && (user.user_metadata.name || user.user_metadata.full_name)) || "");
    setUserPlan(prof?.plan || "");
    setUserCompany(prof?.company || prof?.company_name || prof?.agency_name || "");
    // Only the founder account gets the auto-created internal "Octo Fusion" workspace.
    if (user.email === ADMIN_EMAIL) await ensureOctoFusionClient(user.id);
    const { data: rows } = await getClients(user.id);
    // Count the real connected accounts per brand so the sidebar shows a true number, not 0.
    const ids = (rows || []).map(c => c.id).filter(Boolean);
    let countByClient = {};
    if (ids.length) {
      try {
        const { data: accs } = await supabase.from('social_accounts').select('client_id').in('client_id', ids).neq('is_active', false);
        (accs || []).forEach(a => { countByClient[a.client_id] = (countByClient[a.client_id] || 0) + 1; });
      } catch (e) { /* ignore */ }
    }
    const norm = (rows || []).map(c => ({
      ...c,
      free: c.is_free ?? false,
      accounts: countByClient[c.id] ?? (c.accounts ?? 0),
      posts: c.posts ?? 0,
      reach: c.reach ?? "—",
      health: c.health ?? 100,
      spend: c.spend ?? 0,
    }));
    setClients(norm);
    // Preserve the user's current brand selection across reloads/auth refreshes —
    // only fall back to the first brand on the very first load (no real selection yet).
    if (norm.length) setSelClient(prev => {
      const keep = prev && prev.id && norm.find(c => c.id === prev.id);
      return keep || norm[0];
    });
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
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') { setRecovery(true); setAuthPage('recovery'); setAuthReady(true); return; }
      setIsAuthed(!!session?.user);
      if (session?.user) loadWorkspace(session.user);
    });
    return () => subscription.unsubscribe();
  }, []);

  // Remember that the user is inside the app, so a refresh keeps them here instead of bouncing to the landing page.
  useEffect(() => {
    try {
      if (isAuthed && !showLanding) sessionStorage.setItem('tw_in_app', '1');
      else if (!isAuthed) sessionStorage.removeItem('tw_in_app');
    } catch (e) { /* ignore */ }
  }, [isAuthed, showLanding]);

  useEffect(() => { if (recovery) setAuthPage('recovery'); }, [recovery]);

  useEffect(() => {
    try {
      const u = new URL(window.location.href);
      if (u.searchParams.get('tap_return') || u.searchParams.get('tap_id')) {
        sessionStorage.setItem('tw_pay', 'success');
        try { localStorage.setItem('tw_sub_active', '1'); } catch (e) { /* ignore */ }
        setPage('billing');
        ['tap_return','tap_id','tap_status'].forEach(k => u.searchParams.delete(k));
        window.history.replaceState({}, '', u.pathname);
      }
    } catch (e) { /* ignore */ }
  }, []);

  const th = dark ? DARK : LIGHT;
  const isMobile = useIsMobile();

  const savePage = (p) => { sessionStorage.setItem('tw_page', p); setPage(p); };
  const saveMode = (m) => { sessionStorage.setItem('tw_mode', m); setMode(m); };

  const ctx = {
    dark, setDark, lang, setLang,
    t: (k, fb) => (TR[lang] && TR[lang][k]) || TR.en[k] || fb || k,
    isAuthed, setIsAuthed,
    recovery, setRecovery,
    authPage, setAuthPage,
    mode, setMode: saveMode,
    page, setPage: savePage,
    selClient, setSelClient,
    clients, setClients,
    accountType, userEmail,
    userName, setUserName,
    userPlan, userCompany,
    selPlatform, setSelPlatform,
    setShowLanding,
    mobileNav, setMobileNav,
  };

  const renderPage = () => {
    if (mode==="owner") {
      if (page==="overview") return <OwnerDashboard/>;
      if (page==="clients")  return <OwnerClientsPage/>;
      if (page==="promos")   return <OwnerPromosPage/>;
      if (page==="gifts")    return <OwnerGiftsPage/>;
      if (page==="support")  return <OwnerSupportPage/>;
      if (page==="revenue")  return <OwnerRevenuePage/>;
      if (page==="apiusage") return <OwnerApiUsagePage/>;
      if (page==="team")     return <OwnerTeamPage/>;
      if (page==="settings") return <SettingsPage/>;
      return <Placeholder icon={Settings} badge="Coming soon" title={page.charAt(0).toUpperCase()+page.slice(1)} description="This section of the owner console is on the way."/>;
    }
    if (page==="dashboard" || page==="overview") return <AgencyDashboard/>;
    if (page==="clients") return <ClientsPage/>;
    if (page==="social") return <SocialAccountsPage/>;
    if (page==="publisher") return <PublisherPage/>;
    if (page==="planner") return <CalendarPage/>;
    if (page==="aistudio") return <AIStudioPage/>;
    if (page==="campaigns") return <CampaignsPage/>;
    if (page==="streams") return <StreamsPage/>;
    if (page==="media") return <MediaPage/>;
    if (page==="analytics") return <AnalyticsPage/>;
    if (page==="ads") return <AdsPage/>;
    if (page==="reports") return <ReportsPage/>;
    if (page==="inbox") return <InboxPage/>;
    if (page==="listening") return <TrendingPage/>;
    if (page==="agencyteam") return <TeamPage/>;
    if (page==="billing") return <BillingPage/>;
    if (page==="agencysets") return <SettingsPage/>;
    const SOON = {
      streams: { Icon:Radio, title:"Streams", desc:"Monitor mentions, hashtags and keywords across your connected networks in live, side-by-side columns \u2014 a real-time pulse of every conversation about your brand.", features:["Custom keyword & hashtag columns","Brand mention monitoring","Side-by-side multi-network view"], ctaLabel:"Open Listening", ctaPage:"listening" },
      campaigns: { Icon:Megaphone, title:"Campaigns", desc:"Group posts into campaigns, track them together, and measure performance against a goal \u2014 perfect for launches, seasonal pushes and client retainers.", features:["Bundle posts into one campaign","Campaign-level analytics","Goal & budget tracking"], ctaLabel:"Plan a post", ctaPage:"planner" },
      aistudio: { Icon:Wand2, title:"AI Studio", desc:"A dedicated home for AI content \u2014 generate captions, hashtags, image ideas and full content calendars in Arabic & English, tuned to each brand's voice.", features:["Bulk AI caption generation","Bilingual content ideas (AR / EN)","AI image prompt suggestions"], ctaLabel:"Try the AI writer", ctaPage:"publisher" },
    };
    const cfg = SOON[page] || { Icon:Settings, title:page.charAt(0).toUpperCase()+page.slice(1), desc:"This feature is on the way." };
    return <Placeholder icon={cfg.Icon} badge="Coming soon" title={cfg.title} description={cfg.desc} features={cfg.features} ctaLabel={cfg.ctaLabel} ctaPage={cfg.ctaPage}/>;
  };

  // Don't render anything until we've checked the session
  if (!authReady) return null;

  // Password reset link → show the set-new-password screen
  if (recovery) {
    return (<AppCtx.Provider value={ctx}><AuthPage/></AppCtx.Provider>);
  }

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

  // The public site is always the entry point — even with a saved session, visitors
  // land on the marketing page and choose to enter (never auto-dropped into an account).
  // Admin console subdomain skips it and goes straight to its own login.
  if (showLanding && !isAdminHost) {
    return (
      <AppCtx.Provider value={ctx}>
        <LandingPage
          onGetStarted={async ()=>{ if(isAuthed){ try{ await signOut(); }catch(e){} setIsAuthed(false); } setAuthPage('register'); setShowLanding(false); }}
          onLogin={async ()=>{ try{ await signOut(); }catch(e){} setIsAuthed(false); setAuthPage('login'); setShowLanding(false); }}
        />
      </AppCtx.Provider>
    );
  }

  // Admin subdomain → dedicated centered HQ login (not the user-facing auth screen)
  if (isAdminHost && !isAuthed) {
    return (
      <AppCtx.Provider value={ctx}>
        <AdminLogin/>
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
          {mode==="agency" && <TrialLifecycle/>}
          {mode==="agency" && <TrialBanner/>}
          {mode==="agency" && !["social","agencyteam","billing","agencysets","settings","clients"].includes(page) && <ContextBar/>}
          <div className="tw-scroll-area" style={{flex:1,overflowY:"auto",padding:22}}>
            <div key={mode+page} className="tw-page-in">{renderPage()}</div>
          </div>
        </div>
      </div>
    </AppCtx.Provider>
  );
}
// build integrity check
