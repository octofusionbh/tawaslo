import { useEffect, useState } from 'react';
import { supabase } from './supabase';
import WinClientsExperience from './WinClientsExperience';

// The proposal desk writes nothing to the database — there is no proposals table — so the
// only live parts are the agency's own name and a per-account key, which keeps a real
// agency's drafts out of the shared design-preview slot.
export default function WinClientsLive({ dark = false, setDark = () => {}, agencyName = '' } = {}) {
  const [name, setName] = useState(agencyName);
  const [storageKey, setStorageKey] = useState('');

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!active) return;
        if (!user) { setStorageKey('tw_proposals_v1:local'); return; }
        setStorageKey(`tw_proposals_v1:${user.id}`);
        if (agencyName) return;
        const { data } = await supabase.from('profiles').select('*').eq('id', user.id).limit(1);
        const profile = data && data[0];
        if (active && profile) setName(profile.company || profile.company_name || profile.agency_name || profile.name || '');
      } catch (error) { if (active) setStorageKey(current => current || 'tw_proposals_v1:local'); }
    })();
    return () => { active = false; };
  }, [agencyName]);

  // Without a key the desk would fall back to the preview slot, so it waits for the account.
  if (!storageKey) return null;
  return <WinClientsExperience live dark={dark} setDark={setDark} agencyName={name || 'Your agency'} storageKey={storageKey}/>;
}
