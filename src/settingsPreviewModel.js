import { DEFAULT_INVOICE_COLOR, normalizeInvoiceHex } from './invoiceColor';
import { INVOICE_CURRENCIES } from './invoiceCurrencies';

// Deliberately separate from live account, branding and notification storage.
export const SETTINGS_PREVIEW_KEY = 'tw_settings_design_v1:preview-workspace';
export const SETTINGS_DEFAULTS = {
  profile: { name: 'Abdulla' },
  agency: { name: 'Your agency', email: '', website: '', logo: '' },
  invoices: { accent: DEFAULT_INVOICE_COLOR, currency: 'USD', template: 'classic', notes: '' },
  notifications: { approvals: true, publishing: true, connections: true, digest: false },
  appearance: { theme: 'light' },
  regional: { timezone: 'Asia/Bahrain', language: 'en', weekStarts: 'monday' },
  support: { subject: '', message: '' },
};
const object = value => value && typeof value === 'object' && !Array.isArray(value) ? value : {};
const string = (value, fallback, max = 200) => typeof value === 'string' ? value.slice(0, max) : fallback;
const choice = (value, choices, fallback) => choices.includes(value) ? value : fallback;
export function normalizeSettings(input) {
  const data = object(input);
  const result = Object.fromEntries(Object.entries(SETTINGS_DEFAULTS).map(([key, value]) => [key, { ...value }]));
  const p = object(data.profile), a = object(data.agency), i = object(data.invoices), r = object(data.regional);
  result.profile.name = string(p.name, 'Abdulla', 80).trim() || 'Abdulla';
  result.agency = {
    name: string(a.name, 'Your agency', 100).trim() || 'Your agency',
    email: string(a.email, ''),
    website: string(a.website, ''),
    logo: string(a.logo, '', 1500000),
  };
  result.invoices = {
    accent: normalizeInvoiceHex(i.accent) || DEFAULT_INVOICE_COLOR,
    currency: INVOICE_CURRENCIES.some(([code]) => code === i.currency) ? i.currency : 'USD',
    template: choice(i.template, ['classic', 'minimal', 'accent', 'elegant'], 'classic'),
    notes: string(i.notes, '', 2000),
  };
  for (const key of Object.keys(result.notifications)) {
    if (typeof object(data.notifications)[key] === 'boolean') result.notifications[key] = data.notifications[key];
  }
  result.appearance.theme = choice(object(data.appearance).theme, ['light', 'dark', 'system'], 'light');
  try { new Intl.DateTimeFormat('en', { timeZone: r.timezone }).format(); if (typeof r.timezone === 'string') result.regional.timezone = r.timezone; } catch (_) { /* Use the sample workspace timezone. */ }
  result.regional.language = choice(r.language, ['en', 'ar'], 'en');
  result.regional.weekStarts = choice(r.weekStarts, ['monday', 'sunday'], 'monday');
  result.support = { subject: string(object(data.support).subject, '', 160), message: string(object(data.support).message, '', 4000) };
  return result;
}
export function readPreviewSettings(store) {
  try { return normalizeSettings(JSON.parse((store || window.localStorage).getItem(SETTINGS_PREVIEW_KEY))); }
  catch (_) { return normalizeSettings(null); }
}
export function savePreviewSettings(section, value, store) {
  if (!Object.hasOwn(SETTINGS_DEFAULTS, section)) return { ok: false };
  try {
    const storage = store || window.localStorage;
    const next = normalizeSettings({ ...readPreviewSettings(storage), [section]: value });
    storage.setItem(SETTINGS_PREVIEW_KEY, JSON.stringify(next));
    return { ok: true, value: next[section] };
  } catch (_) { return { ok: false }; }
}
export const readPreviewInvoiceDefaults = () => readPreviewSettings().invoices;
export function previewThemeIsDark() {
  const theme = readPreviewSettings().appearance.theme;
  return theme === 'dark' || (theme === 'system' && !!window.matchMedia?.('(prefers-color-scheme: dark)').matches);
}
