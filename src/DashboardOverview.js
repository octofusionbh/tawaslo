import { useState } from "react";
import { ArrowUpRight, Plus, CalendarDays, Clock3, CheckCheck, MessageSquare, FilePenLine, ArrowRight, ChartNoAxesCombined } from "lucide-react";
import { FaInstagram, FaFacebook, FaLinkedin, FaTiktok } from "react-icons/fa";
import "./dashboard-overview.css";
import { useMobileWeb } from "./workspaceResponsive";
import { SAMPLE_SUGGESTED_IDEAS } from "./suggestedPreviewModel";

const NETWORKS = {
  ig: { name: "Instagram", Icon: FaInstagram, color: "#BC3863" },
  fb: { name: "Facebook", Icon: FaFacebook, color: "#1877F2" },
  li: { name: "LinkedIn", Icon: FaLinkedin, color: "#0A66C2" },
  tt: { name: "TikTok", Icon: FaTiktok, color: "#27272B" },
};
const compact = n => new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(n);
const DAILY_REACH = [61, 68, 63, 79, 73, 90, 84, 93, 88, 110, 96, 113, 104, 118].map(n => n * 1000);
const DAILY_ENGAGEMENT = [4.8, 5.1, 4.9, 5.7, 5.4, 6, 5.8, 6.3, 6.1, 6.8, 6.4, 7, 6.8, 7.2];
const CHANNEL_FIXTURES = {
  all: { reach: 1240000, reachLabel: "1.24M", engagement: 6.8, published: 42, scheduled: 12, drafts: 8, review: 7, dailyReach: DAILY_REACH, dailyEngagement: DAILY_ENGAGEMENT },
  ig: { reach: 612000, reachLabel: "612K", engagement: 7.6, published: 16, scheduled: 4, drafts: 3, review: 3, dailyReach: DAILY_REACH.map(n => Math.round(n * .52)), dailyEngagement: [5.8, 6.1, 6, 6.7, 6.4, 7.2, 6.9, 7.5, 7.1, 7.9, 7.4, 8.1, 7.8, 8.3] },
  fb: { reach: 286000, reachLabel: "286K", engagement: 4.9, published: 9, scheduled: 2, drafts: 2, review: 1, dailyReach: DAILY_REACH.map(n => Math.round(n * .25)), dailyEngagement: [3.7, 3.9, 3.8, 4.2, 4.1, 4.5, 4.3, 4.7, 4.5, 5, 4.8, 5.2, 4.9, 5.3] },
  li: { reach: 112000, reachLabel: "112K", engagement: 5.4, published: 7, scheduled: 3, drafts: 1, review: 1, dailyReach: DAILY_REACH.map(n => Math.round(n * .11)), dailyEngagement: [4.1, 4.3, 4.2, 4.6, 4.5, 4.8, 4.7, 5.1, 5, 5.5, 5.2, 5.7, 5.4, 5.8] },
  tt: { reach: 404000, reachLabel: "404K", engagement: 8.2, published: 10, scheduled: 3, drafts: 2, review: 2, dailyReach: DAILY_REACH.map(n => Math.round(n * .36)), dailyEngagement: [6.2, 6.5, 6.4, 7.1, 6.8, 7.5, 7.2, 7.9, 7.7, 8.4, 8, 8.7, 8.3, 8.9] },
};

// This review screen deliberately uses fixtures, never production totals.
// The surrounding app only mounts it in the isolated editorial design preview.
export default function DashboardOverview({ client, accounts, onNavigate, lang, aiCredits = { used: 0, remaining: 5, limit: 5, extra: 0, unlimited: false }, live = null }) {
  const mobileWeb = useMobileWeb();
  const ar = lang === "ar";
  const t = (en, arabic) => ar ? arabic : en;
  const [metric, setMetric] = useState("reach");
  const [activePoint, setActivePoint] = useState(null);
  const [showData, setShowData] = useState(false);
  const [activeScope, setActiveScope] = useState("all");
  const soleAccount = accounts.length === 1 ? accounts[0] : null;
  const scopeId = soleAccount?.id || (activeScope === "all" || accounts.some(account => account.id === activeScope) ? activeScope : "all");
  const activeAccount = scopeId === "all" ? null : accounts.find(account => account.id === scopeId);
  const activeNetwork = activeAccount ? (NETWORKS[activeAccount.platform] || { name: activeAccount.platform, Icon: ChartNoAxesCombined, color: "#6C6286" }) : null;
  const ActiveNetworkIcon = activeNetwork?.Icon || ChartNoAxesCombined;
  const scopeKey = activeAccount?.platform || "all";
  const scopeFixture = live ? (live.scopes[scopeKey] || live.scopes.all) : (CHANNEL_FIXTURES[scopeKey] || CHANNEL_FIXTURES.all);
  const scopedAccounts = activeAccount ? [activeAccount] : accounts;
  const chooseScope = id => { setActiveScope(id); setActivePoint(null); };
  const isReach = metric === "reach";
  const series = isReach ? scopeFixture.dailyReach : scopeFixture.dailyEngagement;
  const ceiling = isReach ? Math.max(...scopeFixture.dailyReach) * 1.24 : Math.max(...scopeFixture.dailyEngagement) * 1.12;
  const dates = series.map((_, i) => {
    const date = new Date(); date.setDate(date.getDate() - 13 + i);
    return date.toLocaleDateString(ar ? "ar-BH" : "en-GB", { day: "numeric", month: "short" });
  });
  const xy = series.map((value, i) => [46 + i * 494 / 13, 172 - value / ceiling * 146]);
  const line = xy.map(([x, y], i) => `${i ? "L" : "M"}${x},${y}`).join(" ");
  const valueLabel = value => isReach ? compact(value) : `${value.toFixed(1)}%`;
  const totalFollowers = scopedAccounts.reduce((sum, account) => sum + (account.followers_count || 0), 0);
  const allFollowers = accounts.reduce((sum, account) => sum + (account.followers_count || 0), 0);
  const scopeTitle = activeAccount ? activeNetwork.name : t("All channels", "كل المنصات");
  const scopeSubtitle = activeAccount
    ? `${activeAccount.username ? "@" + activeAccount.username : activeAccount.account_name} · ${t("one connected account", "حساب مرتبط واحد")}`
    : `${accounts.length} ${t("connected accounts combined", "حسابات مرتبطة مجمعة")}`;
  const scopeDetail = activeAccount ? activeNetwork.name : t(`Across ${accounts.length} channels`, `عبر ${accounts.length} منصات`);
  const aiUsed = Math.max(0, Number(aiCredits.used || 0));
  const aiRemaining = aiCredits.unlimited ? Infinity : Math.max(0, Number(aiCredits.remaining || 0));
  const aiTotal = aiCredits.unlimited ? 0 : Math.max(0, aiUsed + aiRemaining);
  const aiUsagePercent = aiCredits.unlimited ? 100 : aiTotal ? Math.min(100, aiUsed / aiTotal * 100) : 0;
  const aiLow = !aiCredits.unlimited && aiRemaining <= Math.max(1, aiTotal * .2);
  const aiBalanceLabel = aiCredits.unlimited ? t("Unlimited", "غير محدود") : `${aiRemaining.toLocaleString()} ${t("left", "متبقية")}`;
  const aiMeterText = aiCredits.unlimited
    ? t(`${aiUsed.toLocaleString()} AI credits used. Unlimited credits remain. Open AI Studio.`, `تم استخدام ${aiUsed.toLocaleString()} من أرصدة الذكاء الاصطناعي. الرصيد المتبقي غير محدود. افتح استوديو الذكاء الاصطناعي.`)
    : t(`${aiUsed.toLocaleString()} AI credits used and ${aiRemaining.toLocaleString()} remaining. ${aiRemaining ? "Open AI Studio." : "Manage AI credits."}`, `تم استخدام ${aiUsed.toLocaleString()} من أرصدة الذكاء الاصطناعي ويتبقى ${aiRemaining.toLocaleString()}. ${aiRemaining ? "افتح استوديو الذكاء الاصطناعي." : "إدارة أرصدة الذكاء الاصطناعي."}`);
  const stages = [
    { name: t("Drafts", "مسودات"), count: scopeFixture.drafts, key: "draft", page: "publisher" },
    { name: t("In review", "قيد المراجعة"), count: scopeFixture.review, key: "review", page: "approvals" },
    { name: t("Scheduled", "مجدولة"), count: scopeFixture.scheduled, key: "scheduled", page: "planner" },
    { name: t("Published", "منشورة"), count: scopeFixture.published, key: "published", page: "planner" },
  ];
  const sampleNextPosts = [
    { platform: "ig", day: t("Today", "اليوم"), time: "6:30 PM", title: t("Golden hour, by the water.", "الساعة الذهبية على البحر."), description: t("Carousel · 4 photos", "منشور متعدد · ٤ صور"), format: "01" },
    { platform: "tt", day: t("Tomorrow", "غداً"), time: "7:00 PM", title: t("Your Thursday plans found you.", "لقينا لك خطة الخميس."), description: t("Video · 18 seconds", "فيديو · ١٨ ثانية"), format: "02" },
    { platform: "li", day: t("Tuesday", "الثلاثاء"), time: "10:00 AM", title: t("A new season of hospitality.", "موسم جديد من الضيافة."), description: t("Image post", "منشور بصورة"), format: "03" },
    { platform: "fb", day: t("Wednesday", "الأربعاء"), time: "5:45 PM", title: t("A table worth gathering around.", "طاولة تستحق أن نجتمع حولها."), description: t("Landscape photo", "صورة أفقية"), format: "04" },
  ];
  const nextPosts = live ? live.nextPosts : sampleNextPosts;
  const scopedNextPosts = activeAccount ? nextPosts.filter(post => post.platform === activeAccount.platform) : nextPosts;
  const signalSets = {
    all: [
      [t("Best moment", "أفضل وقت"), t("Thu · 6 to 9 PM", "الخميس · ٦ إلى ٩ م"), t("Engagement peaks before the weekend.", "يتصاعد التفاعل قبل عطلة الأسبوع.")],
      [t("Strongest format", "أقوى صيغة"), t("Carousels", "المنشورات المتعددة"), t("29% more saves than single images.", "حفظ أكثر بنسبة ٢٩٪ من الصور المفردة.")],
      [t("Discovery", "الاكتشاف"), "41%", t("of reach came from non-followers.", "من الوصول جاء من غير المتابعين.")],
    ],
    ig: [[t("Best moment", "أفضل وقت"), t("Thu · 7 PM", "الخميس · ٧ م"), t("Your audience is most active here.", "جمهورك أكثر نشاطاً في هذا الوقت.")],[t("Strongest format", "أقوى صيغة"), t("Carousels", "المنشورات المتعددة"), t("1.8× more saves than single images.", "حفظ أكثر بـ١٫٨ مرة من الصور المفردة.")],[t("Discovery", "الاكتشاف"), "48%", t("of reach came from non-followers.", "من الوصول جاء من غير المتابعين.")]],
    fb: [[t("Best moment", "أفضل وقت"), t("Wed · 6 PM", "الأربعاء · ٦ م"), t("Conversation rises after work.", "يزداد الحوار بعد ساعات العمل.")],[t("Strongest format", "أقوى صيغة"), t("Photo stories", "قصص الصور"), t("21% more comments than link posts.", "تعليقات أكثر بنسبة ٢١٪ من منشورات الروابط.")],[t("Community", "المجتمع"), "63%", t("of engagement came from returning fans.", "من التفاعل جاء من جمهور عائد.")]],
    li: [[t("Best moment", "أفضل وقت"), t("Tue · 10 AM", "الثلاثاء · ١٠ ص"), t("Professional reach is strongest then.", "الوصول المهني أقوى في هذا الوقت.")],[t("Strongest theme", "أقوى موضوع"), t("Hospitality stories", "قصص الضيافة"), t("34% more clicks than announcements.", "نقرات أكثر بنسبة ٣٤٪ من الإعلانات.")],[t("Click rate", "معدل النقر"), "2.4%", t("led by people-and-culture posts.", "تقوده منشورات الأشخاص والثقافة.")]],
    tt: [[t("Best moment", "أفضل وقت"), t("Thu · 8 PM", "الخميس · ٨ م"), t("Completion rate peaks at night.", "يبلغ إكمال المشاهدة ذروته مساءً.")],[t("Strongest format", "أقوى صيغة"), t("Under 20 seconds", "أقل من ٢٠ ثانية"), t("Short edits hold attention longer.", "المقاطع القصيرة تحافظ على الانتباه.")],[t("Completion", "إكمال المشاهدة"), "38%", t("watched the latest reel to the end.", "شاهدوا أحدث فيديو حتى النهاية.")]],
  };
  const signals = live ? (live.signals || []) : (signalSets[scopeKey] || signalSets.all);
  const suggestedIdeas = live ? [] : SAMPLE_SUGGESTED_IDEAS.slice(0, 3);
  const openSuggested = ideaId => {
    try {
      if (ideaId) sessionStorage.setItem("tw_suggested_dashboard_idea", ideaId);
      else sessionStorage.removeItem("tw_suggested_dashboard_idea");
    } catch (_) {}
    onNavigate("suggested");
  };
  // On real data we only know how many posts are in review, not how that splits
  // between "needs changes" and "awaiting approval" — so we show the one number.
  const changesCount = live ? 0 : Math.max(1, Math.round(scopeFixture.review * .3));
  const waitingCount = live ? scopeFixture.review : Math.max(0, scopeFixture.review - changesCount);
  const statItems = [
    { name: t("Total audience", "إجمالي الجمهور"), value: compact(totalFollowers), detail: scopeDetail },
    { name: t("Accounts reached", "الحسابات التي تم الوصول إليها"), value: scopeFixture.reachLabel, detail: t("Last 14 days", "آخر ١٤ يوماً") },
    { name: t("Engagement rate", "معدل التفاعل"), value: `${scopeFixture.engagement}%`, detail: t("Last 14 days", "آخر ١٤ يوماً") },
    { name: t("Published posts", "المنشورات المنشورة"), value: String(scopeFixture.published), detail: t("This month", "هذا الشهر") },
    { name: t("Scheduled posts", "المنشورات المجدولة"), value: String(scopeFixture.scheduled), detail: t("Ready to go live", "جاهزة للنشر") },
  ];
  return (
    <main className="tw-overview" dir={ar ? "rtl" : "ltr"}>
      <header className="ov-heading">
        <div><p className="ov-eyebrow">{client?.name || "Tawaslo"} / {t("Live workspace", "مساحة عمل مباشرة")}</p><h1>{t("Your week, in motion.", "أسبوعك يتحرك معك.")}</h1><p className="ov-subtitle">{t("Performance, publishing, and client work in one living view.", "الأداء والنشر وعمل العملاء في عرض حي واحد.")}</p></div>
        <div className="ov-heading-actions">
          <button className="ov-ai-meter" data-low={aiLow ? "true" : undefined} onClick={() => onNavigate(!aiCredits.unlimited && aiRemaining <= 0 ? "billing" : "aistudio")} aria-label={aiMeterText}>
            <span className="ov-ai-copy"><FilePenLine size={15} aria-hidden="true"/><span><small>{t("Shared AI credits", "أرصدة الذكاء الاصطناعي المشتركة")}</small><strong>{aiBalanceLabel}</strong></span><ArrowUpRight size={14} aria-hidden="true"/></span>
            <span className="ov-ai-track" role="progressbar" aria-label={t("AI credit usage", "استخدام أرصدة الذكاء الاصطناعي")} aria-valuemin="0" aria-valuemax={aiCredits.unlimited ? undefined : aiTotal || 0} aria-valuenow={aiCredits.unlimited ? undefined : aiUsed} aria-valuetext={aiCredits.unlimited ? t("Unlimited credits", "أرصدة غير محدودة") : `${aiUsed.toLocaleString()} ${t("used", "مستخدمة")}, ${aiRemaining.toLocaleString()} ${t("remaining", "متبقية")}`}><i style={{width:`${aiUsagePercent}%`}}/></span>
          </button>
          {!mobileWeb&&<button data-publishing-action="true" className="ov-primary" onClick={() => onNavigate("publisher")}><Plus size={16} aria-hidden="true"/>{t("Create post", "إنشاء منشور")}</button>}
        </div>
      </header>
      <div className="ov-context"><span>{live ? (client?.name || t("Live workspace", "مساحة عمل مباشرة")) : t("Design preview · Sample data", "معاينة التصميم · بيانات تجريبية")}</span><time>{new Date().toLocaleDateString(ar ? "ar-BH" : "en-GB", { weekday: "long", day: "numeric", month: "long" })}</time></div>

      {accounts.length > 0 && <section className="ov-scope" aria-label={t("Dashboard account view", "نطاق حسابات لوحة التحكم")}>
        <div className="ov-scope-copy"><span>{t("Viewing performance for", "عرض أداء")}</span><strong>{scopeTitle}</strong><small>{scopeSubtitle}</small></div>
        {accounts.length > 1 ? <div className="ov-scope-options" role="group" aria-label={t("Choose an account", "اختر حساباً")}>
          <button aria-pressed={scopeId === "all"} onClick={() => chooseScope("all")}><ChartNoAxesCombined size={15} aria-hidden="true"/><span>{t("All channels", "كل المنصات")}</span></button>
          {accounts.map(account => { const network = NETWORKS[account.platform] || { name:account.platform, Icon:ChartNoAxesCombined }; const Icon=network.Icon; return <button key={account.id} aria-pressed={scopeId === account.id} onClick={() => chooseScope(account.id)} title={account.username ? `@${account.username}` : account.account_name}><Icon size={15} aria-hidden="true"/><span>{network.name}</span></button>; })}
        </div> : activeAccount ? <div className="ov-scope-single"><ActiveNetworkIcon size={16} aria-hidden="true"/><span>{activeNetwork.name}</span><small>{activeAccount.username ? `@${activeAccount.username}` : activeAccount.account_name}</small></div> : null}
      </section>}

      <dl className="ov-stats">{statItems.map(stat => <div className="ov-stat" key={stat.name}><dt>{stat.name}</dt><dd>{stat.value}</dd><p>{stat.detail}</p></div>)}</dl>

      <div className="ov-main-grid">
        <section className="ov-performance" aria-labelledby="ov-performance-title">
          <div className="ov-section-heading"><div><h2 id="ov-performance-title">{t("Performance", "الأداء")}</h2><p>{scopeTitle} · {t("The last 14 days, at a glance.", "نظرة على آخر ١٤ يوماً.")}</p></div><div className="ov-tabs" aria-label={t("Chart metric", "مقياس الرسم")}>
            <button aria-pressed={isReach} onClick={() => { setMetric("reach"); setActivePoint(null); }}>{t("Reach", "الوصول")}</button><button aria-pressed={!isReach} onClick={() => { setMetric("engagement"); setActivePoint(null); }}>{t("Engagement", "التفاعل")}</button>
          </div></div>
          <div className="ov-chart-readout" aria-live="polite">{activePoint === null ? <><span className="ov-chart-key"/>{t("Daily", "يومي")} {isReach ? t("reach", "الوصول") : t("engagement rate", "معدل التفاعل")}<span className="ov-chart-hint">{t("Hover or focus a point to explore", "اختر نقطة لعرض التفاصيل")}</span></> : <><strong>{valueLabel(series[activePoint])}</strong><span>{dates[activePoint]}</span></>}</div>
          <svg className="ov-chart" viewBox="0 0 558 212" role="group" aria-label={t("Sample performance chart. Each point can be focused for its value.", "رسم أداء تجريبي. اختر نقطة لعرض قيمتها.")}>
            <defs><linearGradient id="ov-chart-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#42DFBA" stopOpacity=".32"/><stop offset="100%" stopColor="#634CFF" stopOpacity="0"/></linearGradient></defs>
            {[0, 1, 2, 3].map(i => <g key={i}><line x1="46" x2="540" y1={172 - i * 146 / 3} y2={172 - i * 146 / 3} className="ov-chart-grid"/><text x="0" y={176 - i * 146 / 3}>{valueLabel(ceiling * i / 3)}</text></g>)}
            <path d={`${line} L540,172 L46,172 Z`} fill="url(#ov-chart-fill)"/><path d={line} fill="none" className="ov-chart-line"/>
            {xy.map(([x, y], i) => <g key={i}><circle cx={x} cy={y} r={activePoint === i ? 5 : 2.8} className="ov-chart-point"/><circle cx={x} cy={y} r="15" fill="transparent" tabIndex="0" role="img" aria-label={`${dates[i]}: ${valueLabel(series[i])}`} onFocus={() => setActivePoint(i)} onBlur={() => setActivePoint(null)} onMouseEnter={() => setActivePoint(i)} onMouseLeave={() => setActivePoint(null)} className="ov-point-target"/></g>)}
            {[0, 4, 8, 13].map(i => <text key={i} x={xy[i][0]} y="202" textAnchor={i === 0 ? "start" : i === 13 ? "end" : "middle"}>{dates[i]}</text>)}
          </svg>
          <div className="ov-chart-footer"><button className="ov-text-button" onClick={() => onNavigate("analytics")}>{t("View analytics", "عرض التحليلات")}<ArrowUpRight size={15} aria-hidden="true"/></button><button className="ov-muted-button" aria-expanded={showData} onClick={() => setShowData(!showData)}>{showData ? t("Hide data", "إخفاء البيانات") : t("View chart data", "عرض بيانات الرسم")}</button></div>
          {showData && <table className="ov-data-table"><caption>{live ? t("Daily performance", "الأداء اليومي") : t("Sample daily performance", "الأداء اليومي التجريبي")}</caption><thead><tr><th>{t("Date", "التاريخ")}</th><th>{t("Reach", "الوصول")}</th><th>{t("Engagement", "التفاعل")}</th></tr></thead><tbody>{dates.map((date, i) => <tr key={date}><th scope="row">{date}</th><td>{scopeFixture.dailyReach[i].toLocaleString()}</td><td>{scopeFixture.dailyEngagement[i]}%</td></tr>)}</tbody></table>}
        </section>
        <aside className="ov-attention" aria-labelledby="ov-attention-title">
          <div className="ov-section-heading"><div><h2 id="ov-attention-title">{t("Needs attention", "يحتاج إلى اهتمامك")}</h2><p>{scopeTitle} · {t("A short list. A clear next step.", "قائمة مختصرة وخطوة تالية واضحة.")}</p></div><span className="ov-attention-total">{scopeFixture.review}</span></div>
          {changesCount > 0 && <button className="ov-task" onClick={() => onNavigate("approvals")}><MessageSquare size={18} aria-hidden="true"/><span><strong>{changesCount} {t(changesCount === 1 ? "post needs changes" : "posts need changes", "منشورات تحتاج إلى تعديل")}</strong><small>{t("Client feedback is ready to review.", "ملاحظات العميل جاهزة للمراجعة.")}</small></span><ArrowUpRight size={16} aria-hidden="true"/></button>}
          <button className="ov-task" onClick={() => onNavigate("approvals")}><Clock3 size={18} aria-hidden="true"/><span><strong>{waitingCount} {t(waitingCount === 1 ? "post awaiting approval" : "posts awaiting approval", "منشورات تنتظر الموافقة")}</strong><small>{t("Check the client approval queue.", "راجع قائمة موافقات العميل.")}</small></span><ArrowUpRight size={16} aria-hidden="true"/></button>
          <div className="ov-next-step"><CheckCheck size={17} aria-hidden="true"/><p><strong>{t("Your next 3 days are covered.", "محتوى الأيام الثلاثة القادمة جاهز.")}</strong><span>{scopeFixture.scheduled} {t("posts are scheduled. Keep the next week moving in Planner.", "منشوراً مجدولاً. حضّر الأسبوع القادم في المخطط.")}</span></p></div>
          <button className="ov-text-button" onClick={() => onNavigate("planner")}>{t("Open planner", "فتح المخطط")}<ArrowRight size={15} aria-hidden="true"/></button>
        </aside>
      </div>

      {signals.length > 0 && <section className="ov-signals" aria-labelledby="ov-signals-title">
        <div className="ov-signals-heading"><span>{t("Creative signals", "إشارات إبداعية")}</span><h2 id="ov-signals-title">{t("What is shaping results", "ما الذي يشكّل النتائج")}</h2><p>{scopeTitle}</p></div>
        {signals.map(([label,value,note]) => <div className="ov-signal" key={label}><span>{label}</span><strong>{value}</strong><small>{note}</small></div>)}
      </section>}

      {suggestedIdeas.length > 0 && <section className="ov-ideas" aria-labelledby="ov-ideas-title">
        <div className="ov-ideas-heading">
          <div><span><CalendarDays size={14} aria-hidden="true"/>{t("Daily briefing", "موجز يومي")}</span><h2 id="ov-ideas-title">{t("Ideas for you", "أفكار لك")}</h2><p>{t("Three timely directions, already shaped for Marina.", "ثلاثة اتجاهات مناسبة ومهيأة لمارينا.")}</p></div>
          <button className="ov-ideas-all" onClick={() => openSuggested()}>{t("View all ideas", "عرض كل الأفكار")}<ArrowUpRight size={15} aria-hidden="true"/></button>
        </div>
        <div className="ov-idea-list">
          {suggestedIdeas.map((idea, index) => <button className="ov-idea" key={idea.id} onClick={() => openSuggested(idea.id)} aria-label={`${t("Open idea", "فتح الفكرة")}: ${idea.title}`}>
            <span className="ov-idea-index">{String(index + 1).padStart(2, "0")}</span>
            <span className="ov-idea-copy"><small>{idea.signal}</small><strong>{idea.title}</strong><span>{idea.platform} · {idea.format}</span></span>
            <ArrowUpRight size={16} aria-hidden="true"/>
          </button>)}
        </div>
      </section>}

      <section className="ov-pipeline" aria-labelledby="ov-pipeline-title">
        <div className="ov-pipeline-heading"><h2 id="ov-pipeline-title">{t("Content pipeline", "مسار المحتوى")}</h2><p>{t("From first draft to published.", "من المسودة الأولى إلى النشر.")}</p></div>
        <div className="ov-stage-list">{stages.map(stage => { const readOnly=mobileWeb&&stage.page==="publisher"; const Item=readOnly?"div":"button"; return <Item className={`ov-stage ov-stage-${stage.key}`} key={stage.key} onClick={readOnly?undefined:() => onNavigate(stage.page)}><span>{stage.name}{!readOnly&&<ArrowUpRight size={13} aria-hidden="true"/>}</span><strong>{stage.count}</strong><div className="ov-stage-track"><i style={{ width: `${stage.count / Math.max(scopeFixture.published, 1) * 100}%` }}/></div></Item>; })}</div>
      </section>

      <div className="ov-bottom-grid">
        <section aria-labelledby="ov-upcoming-title"><div className="ov-section-heading"><div><h2 id="ov-upcoming-title">{t("Next to go live", "المنشورات القادمة")}</h2><p>{t("Scheduled in your workspace timezone.", "مجدولة حسب التوقيت المحلي لمساحة العمل.")}</p></div><button className="ov-text-button" onClick={() => onNavigate("planner")}>{t("View all", "عرض الكل")}<ArrowUpRight size={15} aria-hidden="true"/></button></div>
          <div className="ov-post-list">{scopedNextPosts.length === 0 && <p className="ov-empty">{t("Nothing scheduled yet. Plan a post and it will appear here.", "\u0644\u0627 \u064a\u0648\u062c\u062f \u0645\u062d\u062a\u0648\u0649 \u0645\u062c\u062f\u0648\u0644 \u0628\u0639\u062f.")}</p>}{scopedNextPosts.map(post => { const network = NETWORKS[post.platform] || { Icon: ChartNoAxesCombined, name: post.platform, color: "#6C6286" }; const Icon = network.Icon; return <button className="ov-post" key={post.id || post.platform} onClick={() => onNavigate("planner")}><div className="ov-post-time"><strong>{post.day}</strong><span>{post.time}</span></div><div className={`ov-post-art ov-art-${post.platform}`} aria-hidden="true">{post.platform === "ig" ? <><span>MARINA</span><i/><small>GOLDEN HOUR</small></> : post.platform === "tt" ? <><span>MEET YOU<br/>BY THE BAY.</span><i/></> : <><span>A NEW<br/>SEASON.</span><small>MARINA SOCIAL CLUB</small></>}</div><span className="ov-post-copy"><strong>{post.title}</strong><small><Icon color={network.color} aria-hidden="true"/>{network.name}<span>·</span>{post.description}</small></span><ArrowUpRight size={16} aria-hidden="true"/></button>; })}</div>
        </section>
        <section className="ov-channels" aria-labelledby="ov-channels-title"><div className="ov-section-heading"><div><h2 id="ov-channels-title">{t("Your channels", "منصاتك")}</h2><p>{t("Audience by network. Select one to focus.", "الجمهور حسب المنصة. اختر منصة للتركيز.")}</p></div><span className="ov-small-note">{accounts.length} {t("connected", "مرتبطة")}</span></div>
          {accounts.map(account => { const network = NETWORKS[account.platform] || { Icon: ChartNoAxesCombined, name: account.platform, color: "#6C6286" }; const Icon = network.Icon; return <button className="ov-channel" aria-pressed={scopeId === account.id} onClick={() => chooseScope(account.id)} key={account.id}><Icon className="ov-network-icon" color={network.color} aria-hidden="true"/><span className="ov-channel-body"><span><strong>{network.name}</strong><span>{compact(account.followers_count || 0)}</span></span><span className="ov-channel-track"><i style={{ width: `${(account.followers_count || 0) / Math.max(allFollowers, 1) * 100}%`, backgroundColor: network.color }}/></span></span></button>; })}
          <button className="ov-text-button ov-channel-link" onClick={() => onNavigate("social")}>{t("Manage accounts", "إدارة الحسابات")}<ArrowUpRight size={15} aria-hidden="true"/></button>
        </section>
      </div>
      <footer className="ov-footer"><CalendarDays size={14} aria-hidden="true"/>{t("Plan the week, publish with confidence, and keep your clients in the loop.", "خطّط للأسبوع وانشر بثقة وأبقِ عملاءك على اطلاع.")}<FilePenLine size={14} aria-hidden="true"/></footer>
    </main>
  );
}
