import { useCallback, useEffect, useState } from 'react';
import { supabase } from './supabase';
import { formatInvoiceMoney } from './invoiceCurrencies';
import { InvoicingExperience } from './WorkspaceAdminExperience';

// Live invoicing. Every figure comes from the invoices table; totals are grouped by the
// currency they were billed in rather than summed into one made-up currency.

const lineTotal = invoice => {
  const subtotal = (invoice.items || []).reduce((sum, item) => sum + (Number(item.qty || 0) * Number(item.price || 0)), 0);
  return subtotal + subtotal * (Number(invoice.tax_pct || 0) / 100);
};

const isOverdue = invoice => invoice.status === 'sent' && invoice.due_date && new Date(invoice.due_date) < new Date(new Date().toDateString());
const statusOf = invoice => (invoice.status === 'paid' ? 'paid' : isOverdue(invoice) ? 'overdue' : invoice.status || 'draft');
const STATUS_LABEL = { draft: 'Draft', sent: 'Sent', paid: 'Paid', overdue: 'Overdue' };

// Returns "BHD 420.000 · USD 80.00" — never one blended number.
function byCurrency(invoices) {
  const totals = {};
  invoices.forEach(invoice => {
    const currency = invoice.currency || 'USD';
    totals[currency] = (totals[currency] || 0) + lineTotal(invoice);
  });
  return Object.entries(totals).map(([currency, total]) => formatInvoiceMoney(total, currency, 'en')).join(' · ');
}

export default function InvoicingLive({ clients = [], onOpenInvoice = null } = {}) {
  const [rows, setRows] = useState([]);
  const [ownerId, setOwnerId] = useState('');

  const load = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setOwnerId((user && user.id) || '');
    } catch (error) { setOwnerId(''); }
    try {
      const { data } = await supabase.from('invoices').select('*').order('created_at', { ascending: false });
      setRows(data || []);
    } catch (error) { setRows([]); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  const paidThisMonth = rows.filter(row => row.status === 'paid' && row.created_at && new Date(row.created_at) >= monthStart);
  const outstanding = rows.filter(row => row.status !== 'draft' && statusOf(row) !== 'paid');
  const overdue = rows.filter(row => statusOf(row) === 'overdue');
  const drafts = rows.filter(row => statusOf(row) === 'draft');

  const liveStats = [];
  if (paidThisMonth.length) liveStats.push({ label: 'Paid this month', value: byCurrency(paidThisMonth), note: `${paidThisMonth.length} invoice${paidThisMonth.length === 1 ? '' : 's'} settled` });
  if (outstanding.length) liveStats.push({ label: 'Outstanding', value: byCurrency(outstanding), note: `${outstanding.length} awaiting payment`, tone: 'aqua' });
  if (overdue.length) liveStats.push({ label: 'Overdue', value: byCurrency(overdue), note: `${overdue.length} need follow-up`, tone: 'coral' });
  liveStats.push({ label: 'Drafts', value: String(drafts.length), note: drafts.length ? 'ready for your review' : 'nothing waiting', tone: 'gold' });

  const liveInvoices = rows.map(invoice => [
    invoice.number || '—',
    invoice.client_name || '—',
    formatInvoiceMoney(lineTotal(invoice), invoice.currency || 'USD', 'en'),
    invoice.created_at ? new Date(invoice.created_at).toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' }) : '—',
    STATUS_LABEL[statusOf(invoice)] || 'Draft',
  ]);

  const create = useCallback(async draft => {
    if (!ownerId) return 'Sign in again to create an invoice.';
    if (!draft || !draft.clientName) return 'Choose a client first.';
    const price = Number(draft.amount);
    if (!isFinite(price) || price <= 0) return 'Enter an amount for this invoice.';
    const row = {
      owner_id: ownerId,
      client_id: draft.clientId || null,
      client_name: draft.clientName,
      number: `INV-${String(rows.length + 1).padStart(4, '0')}`,
      currency: draft.currency || 'USD',
      // The quick modal captures one amount; line items are named in the full editor.
      items: [{ desc: '', qty: 1, price }],
      tax_pct: 0,
      status: 'draft',
    };
    const { data, error } = await supabase.from('invoices').insert([row]).select();
    if (error) return 'That invoice could not be created.';
    if (data && data[0]) setRows(current => [data[0], ...current]);
    return `${row.number} saved as a draft.`;
  }, [ownerId, rows.length]);

  const openInvoice = useCallback(async invoiceRow => {
    if (onOpenInvoice) { onOpenInvoice(invoiceRow); return `${invoiceRow[0]} opened.`; }
    return 'Open Invoicing from the sidebar to edit this invoice.';
  }, [onOpenInvoice]);

  return <InvoicingExperience liveInvoices={liveInvoices} liveStats={liveStats} liveClients={clients} onCreate={create} onOpenInvoice={openInvoice}/>;
}
