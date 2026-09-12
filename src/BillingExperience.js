import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, ChevronDown, Edit3, Image, Lightbulb, Lock, Plus, ShieldCheck, Sparkles } from 'lucide-react';
import './billing-experience.css';

// Display-only copy of the existing catalog. No payment IDs or checkout services.
export const BILLING_PREVIEW_PLANS = [
  { name: 'Essential', monthly: 49, annual: 39, accounts: '3', members: '1', posts: '30', aiCredits: 'Not included', eyebrow: 'Find your rhythm', description: 'A focused toolkit for freelancers and small businesses.' },
  { name: 'Professional', monthly: 99, annual: 79, accounts: '10', members: '5', posts: '100', aiCredits: 'XX / month', eyebrow: 'Make room to grow', description: 'More channels, more collaboration, one clear workspace.', featured: true },
  { name: 'Enterprise', monthly: 199, annual: 159, accounts: 'Unlimited', members: '20', posts: 'Unlimited', aiCredits: 'XX / month', eyebrow: 'Bring everyone together', description: 'Room for your agency, your team and every client channel.' },
];
export const BILLING_AI_CREDIT_PACKS = [
  { id: 'none', name: 'No AI credit pack', credits: 0, images: 0, price: 0 },
  { id: 'lite', name: 'Lite', credits: 50, images: 50, price: 20.9 },
  { id: 'plus', name: 'Plus', credits: 100, images: 100, price: 26.9 },
  { id: 'max', name: 'Max', credits: 250, images: 250, price: 42.9 },
];
export const BILLING_IMAGE_PACKS = BILLING_AI_CREDIT_PACKS;
export function billingPreviewTotal(plan, period, pack = BILLING_AI_CREDIT_PACKS[0]) {
  const months = period === 'annual' ? 12 : 1;
  return Math.round((plan[period] + pack.price) * months * 100) / 100;
}
const dollars = n => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: Number.isInteger(n) ? 0 : 2, maximumFractionDigits: 2 }).format(n);
const FAQ = [
  ['Is the yearly price billed every month?', 'No. The yearly option shows a monthly equivalent for comparison, but the full 12-month amount is billed once per year. The review step shows that total explicitly.'],
  ['What happens when I choose a plan here?', 'You can review the plan and optional AI credit pack. This is a design preview, so it does not collect payment details, charge you or change your subscription.'],
  ['How do AI credits work?', 'One shared balance powers Captions, Post ideas and Images. Essential includes no AI credits; Professional and Enterprise allowances are being finalized. Monthly packs and one-time top-ups add to the same wallet.'],
  ['Will changing plans disconnect my clients?', 'This preview cannot change your plan or connected accounts. Before a real plan change is enabled, existing connections, limits and billing-provider behavior will need to be verified.'],
];

const CREDIT_TOPUPS = [
  { credits:50, price:14.9 },
  { credits:100, price:24.9 },
  { credits:250, price:49.9 },
];

function AiCreditsPanel() {
  const [picked, setPicked] = useState(null);
  const [tested, setTested] = useState(false);
  return <section className="bill-ai" aria-labelledby="bill-ai-title">
    <header className="bill-ai-heading"><div><span className="bill-kicker"><Sparkles size={15}/>Shared AI wallet</span><h2 id="bill-ai-title">One balance. Three creative tools.</h2><p>Captions, Post ideas and Images use the same wallet. Buying 50 credits means 50 total—not 50 for each tool.</p></div><div className="bill-ai-balance"><span>Current preview balance</span><strong>5 <small>left</small></strong><i><b style={{width:'100%'}}/></i><small>0 used of 5 free-trial credits</small></div></header>
    <div className="bill-ai-tools" aria-label="AI tools using the shared balance">{[[Edit3,'Captions','One request uses one credit'],[Lightbulb,'Post ideas','One request uses one credit'],[Image,'Images','One request uses one credit and returns two options']].map(([Icon,name,note])=><article key={name}><i><Icon size={20}/></i><span><strong>{name}</strong><small>{note}</small></span><b>Shared</b></article>)}</div>
    <div className="bill-ai-layout"><section className="bill-ai-panel"><span className="bill-kicker">Included with each plan</span><h3>Monthly allowance.</h3><p>Professional and Enterprise amounts stay marked XX until the final package decision.</p>{BILLING_PREVIEW_PLANS.map(plan=><div className="bill-ai-plan" key={plan.name}><span><strong>{plan.name}</strong><small>{plan.name==='Essential'?'Buy credits only when needed':'Refreshes every month'}</small></span><b>{plan.aiCredits}</b></div>)}</section><section className="bill-ai-panel"><span className="bill-kicker">One-time top-ups</span><h3>Add room when you need it.</h3><p>Top-ups feed the same wallet and do not split by tool. The real expiry policy will be confirmed before checkout is connected.</p><div className="bill-topups" role="group" aria-label="AI credit top-ups">{CREDIT_TOPUPS.map(pack=><button type="button" key={pack.credits} aria-pressed={picked===pack.credits} onClick={()=>{setPicked(pack.credits);setTested(false)}}><span><strong>+{pack.credits} AI credits</strong><small>Shared across all three tools</small></span><b>{dollars(pack.price)}</b><i><Check size={14}/></i></button>)}</div><button className="bill-primary" type="button" disabled={!picked} onClick={()=>setTested(true)}><Plus size={16}/>Test {picked?`+${picked}-credit`:''} top-up</button><div className="bill-review-status" role="status">{tested?<><ShieldCheck size={18}/><span>Top-up reviewed.<br/>No charge was made.</span></>:'Preview only. Checkout is not connected.'}</div></section></div>
    <aside className="bill-ai-note"><ShieldCheck size={18}/><div><strong>When the balance reaches zero</strong><span>Every AI Studio tool opens the same top-up prompt. Drafts and saved work remain available; only new AI requests pause.</span></div></aside>
  </section>;
}

export default function BillingExperience({ dark, live = null, onCheckout = null, onManageAccount = null }) {
  const [area, setArea] = useState('plans');
  const [period, setPeriod] = useState('annual');
  const [selected, setSelected] = useState(null);
  const [packId, setPackId] = useState('none');
  const [reviewed, setReviewed] = useState(false);
  const [compare, setCompare] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const root = useRef(null);
  const returnPlan = useRef(null);
  useEffect(() => {
    if (selected) {
      const heading = root.current?.querySelector('h1');
      heading?.focus({preventScroll:true});
      heading?.scrollIntoView({block:'start',behavior:'instant'});
    } else if (returnPlan.current) {
      root.current?.querySelector(`[data-plan="${returnPlan.current}"]`)?.focus();
      returnPlan.current = null;
    }
  }, [selected]);
  const choose = plan => {
    setSelected(plan); setPackId('none'); setReviewed(false);
  };
  const back = () => {
    returnPlan.current = selected.name;
    setSelected(null); setReviewed(false);
  };
  const cycle = <div className="bill-cycle" role="group" aria-label="Billing cycle"><button type="button" aria-pressed={period === 'monthly'} onClick={() => {setPeriod('monthly');setReviewed(false);}}>Monthly</button><button type="button" aria-pressed={period === 'annual'} onClick={() => {setPeriod('annual');setReviewed(false);}}>Yearly <span>Save about 20%</span></button></div>;
  const pack = BILLING_AI_CREDIT_PACKS.find(p => p.id === packId);
  return <div className="tw-billing-experience" ref={root} data-theme={dark ? 'dark' : 'light'} data-area={selected ? 'review' : area}>
    {selected ? <>
      <button className="bill-back" type="button" onClick={back}><ArrowLeft size={16} aria-hidden="true"/>Back to plans</button>
      <header className="bill-heading"><span className="bill-kicker">Your plan, at a glance</span><h1 tabIndex={-1}>Make it {selected.name}.</h1><p>Review the details. Nothing changes until you decide.</p></header>
      <div className="bill-review-layout"><section className="bill-review-options" aria-label="Plan options"><h2>01 <span>Choose your rhythm</span></h2>{cycle}<p className="bill-muted">{period === 'annual' ? 'One payment for 12 months. The monthly equivalent is shown for comparison.' : 'One payment per month. The review total covers one month.'}</p>
        <h2>02 <span>Add AI credits, if you need them</span></h2><p className="bill-muted">One optional allowance shared by Captions, Post ideas and Images.</p><fieldset className="bill-pack-list"><legend className="bill-sr-only">Optional AI credit pack</legend>{BILLING_AI_CREDIT_PACKS.map(p => <label key={p.id}><span><input type="radio" name="ai-credit-pack" value={p.id} checked={packId === p.id} onChange={() => {setPackId(p.id);setReviewed(false);}}/><strong>{p.name}</strong><small>{p.credits ? `${p.credits} AI credits / month` : 'Keep the plan on its own'}</small></span><span>{p.price ? `+${dollars(p.price)}` : '$0'}<small>/ month</small></span></label>)}</fieldset>
        <p className="bill-note"><Lock size={15} aria-hidden="true"/>{onCheckout ? 'Payment is handled by Polar, our merchant of record. Card details never reach Tawaslo.' : 'Preview only. No payment details are requested.'}</p>
      </section><aside className="bill-receipt" aria-label="Plan review"><span className="bill-kicker">The details</span><h2>{selected.name}</h2><p>{selected.accounts} accounts · {selected.members} team {selected.members === '1' ? 'member' : 'members'}</p>
        <dl><div><dt>Billing cycle</dt><dd>{period === 'annual' ? 'Yearly' : 'Monthly'}</dd></div><div><dt>{selected.name} plan</dt><dd>{dollars(selected[period] * (period === 'annual' ? 12 : 1))}</dd></div><div><dt>{pack.id === 'none' ? 'AI credit pack' : `${pack.name} AI credit pack`}</dt><dd>{pack.id === 'none' ? 'Not added' : dollars(pack.price * (period === 'annual' ? 12 : 1))}</dd></div></dl>
        <div className="bill-total"><span>{period === 'annual' ? 'Yearly total' : 'Monthly total'}</span><strong>{dollars(billingPreviewTotal(selected,period,pack))}<small>USD</small></strong></div>
        <p className="bill-muted">{period === 'annual' ? `${dollars(selected[period] + pack.price)} monthly equivalent. Billed once per year.` : 'Billed once per month.'} Taxes, if applicable, are not included in this preview estimate.</p>
        <button className="bill-primary" type="button" onClick={() => onCheckout ? onCheckout(selected, period, pack) : setReviewed(true)}><Check size={17} aria-hidden="true"/>{onCheckout ? `Continue to checkout` : 'Test plan selection'}</button>
        <div className="bill-review-status" role="status">{onCheckout ? <><ShieldCheck size={19} aria-hidden="true"/><span>Secure checkout opens in a new tab.<br/>Nothing changes until you complete it.</span></> : (reviewed ? <><ShieldCheck size={19} aria-hidden="true"/><span>Selection reviewed.<br/>No charge. No subscription change.</span></> : 'Design preview. This does not open checkout.')}</div>
      </aside></div>
    </> : <>
      <header className="bill-hero"><div className="bill-heading"><span className="bill-kicker"><img src="/logo-transparent.png" alt=""/>Plans & billing</span><h1>A little more room.<br/><em>A lot more possibility.</em></h1><p>Find the right fit for your agency's next chapter.</p></div><div className="bill-account-summary"><span className="bill-kicker">Your account</span><strong>{live ? (live.planName || 'Free trial') : 'Preview workspace'}</strong><p>{live ? (live.statusNote || 'Your subscription details are shown below.') : 'Your live subscription is unchanged.'}</p><button type="button" onClick={() => {setAccountOpen(true);requestAnimationFrame(()=>root.current?.querySelector('#bill-account-title')?.scrollIntoView({block:'start',behavior:'instant'}));}}>Billing details <ArrowRight size={15} aria-hidden="true"/></button></div></header>
      <nav className="bill-area-tabs" aria-label="Billing areas"><button type="button" aria-pressed={area==='plans'} onClick={()=>setArea('plans')}>Plans</button><button type="button" aria-pressed={area==='credits'} onClick={()=>setArea('credits')}>AI credits <span>{live ? live.creditsLabel : '5 left'}</span></button></nav>
      {area === 'plans' ? <>
      <div className="bill-plan-toolbar"><span>Three plans. One connected workspace.</span>{cycle}</div>
      <section className="bill-plans" aria-label="Available plans">{BILLING_PREVIEW_PLANS.map((plan,index) => <article className={`bill-plan ${plan.featured ? 'bill-plan-featured' : ''}`} key={plan.name} aria-labelledby={`bill-plan-${index}`}>
        <div className="bill-plan-top"><span>{String(index+1).padStart(2,'0')} / {plan.eyebrow}</span>{plan.featured && <span className="bill-recommended">Recommended</span>}</div>
        <h2 id={`bill-plan-${index}`}>{plan.name}</h2><p className="bill-plan-description">{plan.description}</p>
        <div className="bill-price"><strong>{dollars(plan[period])}</strong><span>USD<br/>/ month</span></div>
        <p className="bill-cycle-total">{period === 'annual' ? `${dollars(plan.annual*12)} billed yearly` : `${dollars(plan.monthly)} billed monthly`}</p>
        <p className="bill-saving">{period === 'annual' ? `Save ${dollars((plan.monthly-plan.annual)*12)} a year` : 'A flexible monthly rhythm'}</p>
        <dl className="bill-plan-limits"><div><dt>Social accounts</dt><dd>{plan.accounts}</dd></div><div><dt>Team members</dt><dd>{plan.members}</dd></div><div><dt>Posts per month</dt><dd>{plan.posts}</dd></div><div><dt>Included AI credits</dt><dd>{plan.aiCredits}</dd></div></dl>
        <button type="button" data-plan={plan.name} className="bill-plan-action" onClick={() => choose(plan)}>Explore {plan.name}<ArrowRight size={17} aria-hidden="true"/></button>
      </article>)}</section>
      <div className="bill-included"><span>In every plan</span><span><Check size={15} aria-hidden="true"/>English & Arabic AI captions</span><span><Check size={15} aria-hidden="true"/>Analytics dashboard</span><span>USD pricing · Preview only</span></div>
      <section className="bill-comparison"><button className="bill-disclosure" type="button" aria-expanded={compare} aria-controls="bill-compare" onClick={()=>setCompare(!compare)}><span>Compare the details</span><ChevronDown size={20} aria-hidden="true"/></button>{compare && <div id="bill-compare"><div className="bill-compare-grid"><span>Included</span>{BILLING_PREVIEW_PLANS.map(p=><strong key={p.name}>{p.name}</strong>)}{[['Social accounts','accounts'],['Team members','members'],['Posts per month','posts'],['Shared AI credits','aiCredits']].map(([label,key])=><div className="bill-compare-row" key={key}><span>{label}</span>{BILLING_PREVIEW_PLANS.map(p=><span key={p.name} data-label={p.name}><span className="bill-sr-only">{p.name}: </span>{p[key]}</span>)}</div>)}</div><p className="bill-muted">Professional and Enterprise shared AI allowances are marked XX until the final package limits are decided.</p></div>}</section>
      <section className="bill-account-section" aria-labelledby="bill-account-title"><header><div><span className="bill-kicker">Your billing desk</span><h2 id="bill-account-title">Everything in its place.</h2></div><button className="bill-text-action" type="button" aria-expanded={accountOpen} aria-controls="bill-account-details" onClick={()=>setAccountOpen(!accountOpen)}>{accountOpen ? 'Hide details' : 'View details'}<ChevronDown size={16} aria-hidden="true"/></button></header><p className="bill-muted">Your subscription, payment method and receipts belong here.</p>{accountOpen && <div id="bill-account-details" className="bill-account-rows">{[['Subscription','No live subscription data loaded.','Manage subscription'],['Payment method','Your card details are never shown in the preview.','Update payment method'],['Receipts','Live payment history stays untouched.','View receipts']].map(([name,description,action])=><div key={name}><div><strong>{name}</strong><p>{description}</p></div><button type="button" disabled><Lock size={14} aria-hidden="true"/>{action}</button></div>)}</div>}</section>
      <section className="bill-faq" aria-labelledby="bill-faq-title"><h2 id="bill-faq-title">Before you choose.</h2><div>{FAQ.map(([question,answer])=><details key={question}><summary>{question}<ChevronDown size={17} aria-hidden="true"/></summary><p>{answer}</p></details>)}</div></section>
      </> : <AiCreditsPanel/>}
    </>}
    <footer className="bill-footer"><span>Thoughtful plans for thoughtful work.</span><span><ShieldCheck size={14} aria-hidden="true"/>No live billing changes in this preview.</span></footer>
  </div>;
}
