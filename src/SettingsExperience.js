import { useEffect, useRef, useState } from 'react';
import { ArrowUp, ArrowUpRight, Bell, Building2, Check, ChevronRight, Globe2, Lock, Moon, Palette, Sun, Monitor, Save, ShieldCheck, Trash2, Upload, UserRound } from 'lucide-react';
import InvoiceColorPicker from './InvoiceColorPicker';
import { INVOICE_CURRENCIES, formatInvoiceMoney } from './invoiceCurrencies';
import { readPreviewSettings, savePreviewSettings } from './settingsPreviewModel';
import './settings-experience.css';

const GROUPS = [
  ['Account', [['profile', 'Profile'], ['agency', 'Agency'], ['security', 'Security']]],
  ['Workspace', [['invoices', 'Invoice defaults'], ['notifications', 'Notifications'], ['appearance', 'Appearance'], ['regional', 'Language & region'], ['billing', 'Billing & plan']]],
  ['Help', [['support', 'Support'], ['faq', 'Help & FAQ'], ['about', 'About']]],
];
const SECTIONS = GROUPS.flatMap(([, items]) => items);
const PRESETS = [['Slate', '#4F6B8C'], ['Orange', '#B43D31'], ['Indigo', '#405CA8'], ['Gold', '#C79622'], ['Green', '#1E9976'], ['Purple', '#8474DD'], ['Rose', '#CF507D'], ['Ink', '#272725']].map(([name, accent]) => ({ name, accent }));
const TIMEZONES = ['Asia/Bahrain', 'Asia/Riyadh', 'Asia/Dubai', 'Asia/Kuwait', 'Asia/Qatar', 'Asia/Muscat', 'Africa/Cairo', 'Europe/London', 'Europe/Paris', 'America/New_York', 'America/Los_Angeles', 'Asia/Kolkata', 'Asia/Singapore', 'Australia/Sydney'];
const NOTIFICATIONS = [
  ['approvals', 'Client decisions', 'Approvals and requests for changes to a post.'],
  ['publishing', 'Publishing updates', 'Scheduled posts that publish or need attention.'],
  ['connections', 'Account connections', 'A channel needs to be reconnected.'],
  ['digest', 'Weekly summary', 'A recap of your workspace activity.'],
];
const FAQ = [
  ['Will these changes affect my live account?', 'No. This is the isolated design preview. Account credentials, connected channels, subscriptions and client data are unchanged.'],
  ['Where is my invoice color saved?', 'In this browser, for the sample workspace. New invoices start with your saved color, currency, template and notes. Existing invoices keep their original design. Cross-device account sync is not connected in this preview.'],
  ['Can clients approve content on a phone?', 'Yes. The Calendar client preview becomes a readable agenda on smaller screens. Clients can inspect each post, approve it or request changes. Publishing tools stay out of the mobile web workspace.'],
  ['Does an approval publish the post?', 'No. Approving content and publishing it are separate steps. The design preview does not publish or send anything.'],
];

function Field({ label, children, hint }) {
  return <label className="set-field"><span>{label}</span>{children}{hint && <small>{hint}</small>}</label>;
}
function InvoiceExample({ settings, agency }) {
  const money = value => formatInvoiceMoney(value, settings.currency, 'en');
  return <aside className="set-invoice-example" aria-label="Invoice style example">
    <span className="set-eyebrow">Your signature style</span>
    <div className={`set-paper set-paper-${settings.template}`} style={{ '--invoice-accent': settings.accent }}>
      <div className="set-paper-top"><strong>{agency.logo && <img src={agency.logo} alt=""/>}{agency.name}</strong><span>INVOICE<br/>EXAMPLE</span></div>
      <div className="set-paper-title">Good work.<br/>Beautifully billed.</div>
      <div className="set-paper-client"><span>PREPARED FOR</span><strong>Sample client</strong></div>
      <div className="set-paper-line"><span>Creative services</span><span>{money(250)}</span></div>
      <div className="set-paper-total"><strong>Total</strong><strong>{money(250)}</strong></div>
      <p>{settings.notes || 'Thank you for creating with us.'}</p>
      <div className="set-paper-rule"/>
    </div>
    <p>Style example only. No invoice is created.</p>
  </aside>;
}

export default function SettingsExperience({ dark, setDark, onNameChange = () => {}, onAgencyLogoChange = () => {} }) {
  const [saved, setSaved] = useState(readPreviewSettings);
  const [draft, setDraft] = useState(readPreviewSettings);
  const entryTarget = useRef(null);
  const [active, setActive] = useState(() => {
    try {
      const requested = sessionStorage.getItem('tw_settings_section');
      sessionStorage.removeItem('tw_settings_section');
      if (SECTIONS.some(([key]) => key === requested)) {
        entryTarget.current = requested;
        return requested;
      }
      return 'profile';
    } catch (error) { return 'profile'; }
  });
  const [compact, setCompact] = useState(false);
  const [messages, setMessages] = useState({});
  const [colorValid, setColorValid] = useState(true);
  const root = useRef(null);
  const [colorKey, setColorKey] = useState(0);
  const dirty = key => !!draft[key] && JSON.stringify(saved[key]) !== JSON.stringify(draft[key]);
  const anyDirty = Object.keys(draft).some(dirty) || !colorValid;

  useEffect(() => {
    const observer = new ResizeObserver(entries => setCompact(entries[0].contentRect.width < 900));
    if (root.current) observer.observe(root.current);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    if (!entryTarget.current) return undefined;
    const target = entryTarget.current;
    const timer = setTimeout(() => {
      const heading = root.current?.querySelector(`#set-${target}-title`);
      heading?.focus({ preventScroll: true });
      heading?.scrollIntoView({ block: 'start', behavior: 'instant' });
      entryTarget.current = null;
    }, 100);
    return () => clearTimeout(timer);
  }, [compact]);
  useEffect(() => {
    const warn = event => { if (anyDirty) { event.preventDefault(); event.returnValue = ''; } };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [anyDirty]);

  const change = (key, field, value) => {
    setDraft(current => ({ ...current, [key]: { ...current[key], [field]: value } }));
    setMessages(current => ({ ...current, [key]: '' }));
  };
  const chooseAgencyLogo = file => {
    if (!file) return;
    if (!String(file.type || '').startsWith('image/')) {
      setMessages(current => ({ ...current, agency: 'Choose a PNG, JPG, WebP or SVG image.' }));
      return;
    }
    if (file.size > 1024 * 1024) {
      setMessages(current => ({ ...current, agency: 'Choose a logo smaller than 1 MB.' }));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => change('agency', 'logo', String(reader.result || ''));
    reader.onerror = () => setMessages(current => ({ ...current, agency: 'That logo could not be read. Try another image.' }));
    reader.readAsDataURL(file);
  };
  const save = (key, value = draft[key]) => {
    if (key === 'invoices' && !colorValid) return false;
    if ((key === 'profile' || key === 'agency') && !value.name.trim()) {
      setMessages(current => ({ ...current, [key]: 'Enter a name before saving.' }));
      return false;
    }
    const result = savePreviewSettings(key, value);
    if (!result.ok) {
      setMessages(current => ({ ...current, [key]: 'Not saved. Browser storage is unavailable. Your edits are still here.' }));
      return false;
    }
    setSaved(current => ({ ...current, [key]: result.value }));
    setDraft(current => ({ ...current, [key]: result.value }));
    setMessages(current => ({ ...current, [key]: key === 'support' ? 'Draft saved in this browser. Nothing was sent.' : 'Saved in this browser.' }));
    if (key === 'profile') onNameChange(result.value.name);
    if (key === 'agency') onAgencyLogoChange(result.value.logo || '');
    return true;
  };
  const cancel = key => {
    setDraft(current => ({ ...current, [key]: saved[key] }));
    setMessages(current => ({ ...current, [key]: '' }));
    if (key === 'invoices') { setColorValid(true); setColorKey(key => key + 1); }
  };
  const chooseTheme = theme => {
    if (save('appearance', { theme })) setDark(theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches));
  };
  const goTo = key => {
    setActive(key);
    requestAnimationFrame(() => {
      const heading = root.current?.querySelector(`#set-${key}-title`);
      heading?.focus({ preventScroll: true });
      heading?.scrollIntoView({ block: 'start', behavior: 'instant' });
    });
  };
  const footer = (key, label) => <div className="set-form-footer">
    <span role="status">{messages[key] || (dirty(key) || (key === 'invoices' && !colorValid) ? 'Unsaved changes. Save before leaving Settings.' : 'Changes apply to this preview only.')}</span>
    <div><button type="button" className="set-secondary" disabled={!dirty(key) && !(key === 'invoices' && !colorValid)} onClick={() => cancel(key)}>Cancel</button><button className="set-primary" type="submit" disabled={(!dirty(key) && key !== 'support') || (key === 'invoices' && !colorValid)}><Save size={15} aria-hidden="true"/>{label}</button></div>
  </div>;
  const form = (key, children, label) => <form onSubmit={event => { event.preventDefault(); save(key); }}>{children}{footer(key, label)}</form>;

  const content = {
    profile: <><div className="set-identity"><span className="set-avatar" aria-hidden="true">{draft.profile.name.trim().slice(0, 2).toUpperCase() || 'AB'}</span><div><strong>{draft.profile.name || 'Your profile'}</strong><span>Sample workspace member</span></div></div>
      {form('profile', <div className="set-field-grid"><Field label="Full name"><input required maxLength={80} autoComplete="name" value={draft.profile.name} onChange={e => change('profile', 'name', e.target.value)}/></Field><Field label="Login email" hint="Your real login details are unchanged."><input type="email" value="preview@tawaslo.local" readOnly/></Field></div>, 'Save profile')}</>,
    agency: form('agency', <><div className="set-agency-logo-row"><span className="set-agency-logo-mark" aria-hidden="true">{draft.agency.logo ? <img src={draft.agency.logo} alt=""/> : <Building2 size={22}/>}</span><div className="set-agency-logo-copy"><strong>Agency logo</strong><span>Recommended · PNG, JPG, WebP or SVG · up to 1 MB</span></div><div className="set-agency-logo-actions"><label className="set-secondary set-logo-upload"><Upload size={14} aria-hidden="true"/>{draft.agency.logo ? 'Change logo' : 'Upload logo'}<input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" onChange={event => { chooseAgencyLogo(event.target.files?.[0]); event.target.value = ''; }}/></label>{draft.agency.logo && <button type="button" className="set-secondary" onClick={() => change('agency', 'logo', '')}><Trash2 size={14} aria-hidden="true"/>Remove</button>}</div></div><Field label="Agency name"><input required maxLength={100} value={draft.agency.name} onChange={e => change('agency', 'name', e.target.value)}/></Field><div className="set-field-grid"><Field label="Contact email (optional)"><input type="email" maxLength={200} placeholder="hello@youragency.com" value={draft.agency.email} onChange={e => change('agency', 'email', e.target.value)}/></Field><Field label="Website (optional)"><input type="url" maxLength={200} placeholder="https://youragency.com" value={draft.agency.website} onChange={e => change('agency', 'website', e.target.value)}/></Field></div><p className="set-note">The logo is optional. If you skip it, Tawaslo uses a neutral agency mark—never personal initials.</p></>, 'Save agency'),
    invoices: form('invoices', <div className="set-invoice-layout"><div>
      <InvoiceColorPicker key={colorKey} value={draft.invoices.accent} onChange={value => change('invoices', 'accent', value)} onValidityChange={setColorValid} presets={PRESETS}/>
      <Field label="Default currency"><select value={draft.invoices.currency} onChange={e => change('invoices', 'currency', e.target.value)}>{INVOICE_CURRENCIES.map(([code, name]) => <option key={code} value={code}>{code} · {name}</option>)}</select></Field>
      <fieldset className="set-choice-field"><legend>Default template</legend><div className="set-template-options">{['classic', 'minimal', 'accent', 'elegant'].map(template => <button type="button" key={template} aria-pressed={draft.invoices.template === template} onClick={() => change('invoices', 'template', template)}>{template}{draft.invoices.template === template && <Check size={14} aria-hidden="true"/>}</button>)}</div></fieldset>
      <Field label="Default invoice note (optional)"><textarea maxLength={2000} rows={3} placeholder="A thank-you note or your payment terms" value={draft.invoices.notes} onChange={e => change('invoices', 'notes', e.target.value)}/></Field>
      <p className="set-note">Your next invoice starts here. Existing invoices keep their own color, currency and notes.</p>
    </div><InvoiceExample settings={draft.invoices} agency={draft.agency}/></div>, 'Save invoice defaults'),
    notifications: form('notifications', <><div className="set-rows">{NOTIFICATIONS.map(([key, title, description]) => <label className="set-toggle-row" key={key}><span><strong>{title}</strong><small>{description}</small></span><input type="checkbox" role="switch" checked={draft.notifications[key]} onChange={e => change('notifications', key, e.target.checked)} aria-label={title}/></label>)}</div><p className="set-note">Preference preview only. No email or push subscriptions are changed.</p></>, 'Save notifications'),
    appearance: <><div className="set-theme-options">{[['light', 'Light', Sun], ['dark', 'Dark', Moon], ['system', 'System', Monitor]].map(([key, title, Icon]) => <button type="button" key={key} aria-pressed={draft.appearance.theme === key} onClick={() => chooseTheme(key)}><span className={`set-theme-sample set-theme-${key}`} aria-hidden="true"><span/><span/><span/></span><span><Icon size={17} aria-hidden="true"/>{title}{draft.appearance.theme === key && <Check size={16} aria-hidden="true"/>}</span></button>)}</div><p className="set-note">Applied immediately and remembered in this browser. System follows your device preference when the preview opens.</p><p className="set-inline-status" role="status">{messages.appearance}</p></>,
    regional: form('regional', <><div className="set-field-grid"><Field label="Preferred language"><select value={draft.regional.language} onChange={e => change('regional', 'language', e.target.value)}><option value="en">English</option><option value="ar">العربية · Arabic</option></select></Field><Field label="Time zone"><select value={draft.regional.timezone} onChange={e => change('regional', 'timezone', e.target.value)}>{[...new Set([draft.regional.timezone, ...TIMEZONES])].map(zone => <option key={zone} value={zone}>{zone.replaceAll('_', ' ')}</option>)}</select></Field></div><Field label="Week starts on"><select value={draft.regional.weekStarts} onChange={e => change('regional', 'weekStarts', e.target.value)}><option value="monday">Monday</option><option value="sunday">Sunday</option></select></Field><p className="set-note">These preferences are saved for review. Translation, calendar week layout and scheduled post times are not changed in this design pass.</p></>, 'Save regional preferences'),
    security: <><div className="set-assurance"><ShieldCheck size={22} aria-hidden="true"/><p>Your live account stays protected.<br/><span>Security actions are intentionally inactive in this design preview.</span></p></div><div className="set-rows">{[['Password', 'Request a password reset by email.', 'Reset password'], ['Active sessions', 'Manage devices signed in to your account.', 'Sign out all devices'], ['Account deletion', 'A separate confirmation would be required.', 'Request deletion']].map(([title, detail, action]) => <div className="set-detail-row" key={title}><div><strong>{title}</strong><p>{detail}</p></div><button type="button" disabled className="set-secondary"><Lock size={14} aria-hidden="true"/>{action}</button></div>)}</div></>,
    billing: <><div className="set-billing-heading"><span className="set-eyebrow">Design workspace</span><h3>No billing changes.</h3><p>Your actual subscription, renewal date and payment details are not loaded here.</p></div><div className="set-rows">{[['Subscription', 'Your live plan remains unchanged.'], ['Payment method', 'No card or banking details are accessed.'], ['Billing history', 'Preview invoices are separate from subscription charges.']].map(([label, text]) => <div className="set-detail-row" key={label}><strong>{label}</strong><p>{text}</p></div>)}</div><button className="set-secondary" type="button" disabled><Lock size={14} aria-hidden="true"/>Manage subscription</button></>,
    support: form('support', <><Field label="Subject"><input maxLength={160} required value={draft.support.subject} placeholder="What do you need help with?" onChange={e => change('support', 'subject', e.target.value)}/></Field><Field label="Message"><textarea required rows={5} maxLength={4000} placeholder="Describe what happened and what you expected." value={draft.support.message} onChange={e => change('support', 'message', e.target.value)}/></Field><p className="set-note">Try the support form as a local draft. Nothing is sent to a support team. Please do not enter passwords or API keys.</p></>, 'Save support draft'),
    faq: <div className="set-faq">{FAQ.map(([question, answer]) => <details key={question}><summary>{question}<ChevronRight size={18} aria-hidden="true"/></summary><p>{answer}</p></details>)}</div>,
    about: <div className="set-about"><img src="/logo-transparent.png" alt="Tawaslo"/><h3>A little more space<br/>for your best work.</h3><p>Tawaslo brings your agency's content, clients and conversations together.</p><dl><div><dt>Environment</dt><dd>Isolated design preview</dd></div><div><dt>Storage</dt><dd>This browser, sample workspace only</dd></div><div><dt>Live connections</dt><dd>Unchanged</dd></div></dl></div>,
  };
  const descriptions = {
    profile: 'The name your workspace knows you by.', agency: 'Make the workspace feel like your agency.', invoices: 'Set it once. Start every new invoice in your style.', notifications: 'Choose what deserves your attention.', appearance: 'The same workspace, in your preferred light.', regional: 'Your language, time zone and weekly rhythm.', security: 'Account access, sessions and sensitive actions.', billing: 'A clear place for your subscription and billing details.', support: 'Tell us what you need a hand with.', faq: 'A few useful answers about this preview.', about: 'Built around the way agencies work.',
  };
  return <div className="tw-settings-experience" ref={root} data-layout={compact ? 'single' : 'split'} data-theme={dark ? 'dark' : 'light'}>
    <header className="set-page-header" id="settings-top"><div className="set-page-heading"><span className="set-eyebrow"><img src="/logo-transparent.png" alt=""/>Workspace control</span><h1>Make the workspace yours.</h1><p>Identity, billing, regional preferences and team notifications—clear, organised and easy to revisit.</p></div><span className="set-local-note"><Monitor size={16} aria-hidden="true"/>Saved on this browser</span><div className="set-hero-summary" role="list" aria-label="Workspace settings summary"><div role="listitem"><UserRound size={18} aria-hidden="true"/><span><small>Profile</small><strong>{draft.profile.name || 'Your profile'}</strong></span></div><div role="listitem"><Bell size={18} aria-hidden="true"/><span><small>Notifications</small><strong>{Object.values(draft.notifications).filter(Boolean).length} active</strong></span></div><div role="listitem"><Globe2 size={18} aria-hidden="true"/><span><small>Region</small><strong>{draft.regional.timezone.replace('Asia/','')} · {draft.regional.language.toUpperCase()}</strong></span></div><div role="listitem"><Palette size={18} aria-hidden="true"/><span><small>Appearance</small><strong>{dark ? 'Dark' : 'Light'}</strong></span></div></div></header>
      <div className="set-layout"><nav className="set-nav" aria-label="Settings sections">{compact && <span className="set-eyebrow">Jump to a section</span>}{GROUPS.map(([label, items]) => <div className="set-nav-group" key={label}><span>{label}</span>{items.map(([key, title]) => <button type="button" key={key} onClick={() => goTo(key)} aria-current={active === key ? 'page' : undefined}>{title}{dirty(key) && <span className="set-dirty" aria-label="Unsaved changes"/>}{!compact && active === key && <ChevronRight size={14} aria-hidden="true"/>}</button>)}</div>)}<p className="set-nav-footnote">Your live account<br/>is unchanged.</p></nav>
      <div className="set-content">{SECTIONS.map(([key, title], index) => <section key={key} hidden={active !== key} className="set-section" aria-labelledby={`set-${key}-title`}><header><div><span className="set-section-number">{String(index + 1).padStart(2, '0')} / {GROUPS.find(([, items]) => items.some(([item]) => item === key))[0]}</span><h2 id={`set-${key}-title`} tabIndex={-1}>{title}</h2><p>{descriptions[key]}</p></div>{compact && <a href="#settings-top" aria-label="Back to Settings sections"><ArrowUp size={18} aria-hidden="true"/></a>}</header>{content[key]}</section>)}</div>
    </div><footer className="set-page-footer"><span>Preferences stay in this browser, not across devices.</span><span>Built around you <ArrowUpRight size={14} aria-hidden="true"/></span></footer>
  </div>;
}
