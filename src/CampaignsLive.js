import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from './supabase';
import CampaignsExperience from './CampaignsExperience';

const text = value => (typeof value === 'string' ? value : '');
const day = value => (value ? String(value).slice(0, 10) : '');
const STATUS_LABEL = { active: 'Active', scheduled: 'Scheduled', completed: 'Completed', paused: 'Paused', draft: 'Draft' };

// campaigns rows hold no link to posts, so postIds stays empty and the design's
// post counts, artwork and approval progress are left out rather than guessed.
function toCampaign(row) {
  return {
    id: row.id,
    name: text(row.name).trim() || 'Untitled campaign',
    goal: text(row.goal).trim(),
    start: day(row.start_date),
    end: day(row.end_date),
    postIds: [],
    sample: false,
    statusLabel: STATUS_LABEL[text(row.status).toLowerCase()] || '',
  };
}

export default function CampaignsLive({ client, dark = false, setDark = () => {}, mobileWeb = false }) {
  const [state, setState] = useState({ status: 'loading', campaigns: [], error: '' });
  const idRef = useRef('');
  const clientId = client?.id || '';
  const clientName = client?.name || '';

  useEffect(() => {
    let active = true;
    if (!clientId && !clientName) { setState({ status: 'empty', campaigns: [], error: '' }); return undefined; }
    setState({ status: 'loading', campaigns: [], error: '' });
    (async () => {
      try {
        let id = clientId;
        if (!id) {
          const { data, error } = await supabase.from('clients').select('id').eq('name', clientName).limit(1);
          if (error) throw error;
          id = data && data[0] && data[0].id;
        }
        if (!id) throw new Error('This client is not in the workspace yet.');
        const { data: rows, error } = await supabase.from('campaigns').select('*').eq('client_id', id).order('created_at', { ascending: false });
        if (error) throw error;
        if (!active) return;
        idRef.current = id;
        setState({ status: 'ready', campaigns: (rows || []).map(toCampaign), error: '' });
      } catch (error) {
        if (!active) return;
        setState({ status: 'error', campaigns: [], error: (error && error.message) || 'Campaigns could not be loaded.' });
      }
    })();
    return () => { active = false; };
  }, [clientId, clientName]);

  const handleCreate = useCallback(async form => {
    const id = idRef.current;
    if (!id) return { error: 'This workspace is not connected yet.' };
    // The redesigned brief has no account picker, so platform keeps the column default.
    const row = {
      client_id: id,
      name: text(form.name).trim(),
      goal: text(form.goal).trim() || null,
      status: 'active',
      start_date: form.start || null,
      end_date: form.end || null,
    };
    try {
      const { data, error } = await supabase.from('campaigns').insert([row]).select();
      if (error) throw error;
      const created = data && data[0];
      if (!created) throw new Error('The campaign could not be saved.');
      const campaign = toCampaign(created);
      setState(current => ({ ...current, campaigns: [campaign, ...current.campaigns] }));
      return { campaign };
    } catch (error) {
      return { error: (error && error.message) || 'The campaign could not be saved.' };
    }
  }, []);

  if (state.status !== 'ready') {
    return <main className="tw-campaigns-experience" data-campaigns-theme={dark ? 'dark' : 'light'}>
      <header className="cp-heading"><div className="cp-heading-copy">
        <span className="cp-kicker">{clientName ? `Campaigns / ${clientName}` : 'Campaigns'}</span>
        <h1>One idea.<br /><em>Every expression.</em></h1>
        <p>{state.status === 'loading' ? 'Loading this workspace’s campaigns…' : state.status === 'empty' ? 'Choose a client to open their campaigns.' : state.error}</p>
      </div></header>
    </main>;
  }

  return <CampaignsExperience
    dark={dark}
    setDark={setDark}
    mobileWeb={mobileWeb}
    liveCampaigns={state.campaigns}
    clientName={clientName}
    onCreateCampaign={handleCreate}
  />;
}
