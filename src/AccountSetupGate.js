import {useEffect,useRef,useState} from 'react';
import {ArrowRight,Check,Building2,Loader2,Upload} from 'lucide-react';
import {completeAccountSetup,finishAccountSetupWithoutLogo,getPendingSetup,updateAccountSetupMetadata} from './accountSetup';
import {saveLogoDraft} from './logoDraftStore';
import './auth-experience.css';

const PLAN_NAMES={starter:'Essential',professional:'Professional',agency:'Enterprise',studio:'Studio'};

export default function AccountSetupGate({user,onReady,onSignOut,loadError,onRetry,loadingOnly=false}){
  const [result,setResult]=useState(null);
  const [error,setError]=useState('');
  const [busy,setBusy]=useState(!loadingOnly);
  const userRef=useRef(user);
  const activeRef=useRef(true);
  const runningRef=useRef(false);
  const fileRef=useRef(null);
  const headingRef=useRef(null);
  const setup=getPendingSetup(user)||user?.user_metadata?.tawaslo_setup;
  const execute=async(skip=false)=>{
    if(runningRef.current)return;
    runningRef.current=true;setBusy(true);setError('');
    try{
      const next=await (skip?finishAccountSetupWithoutLogo:completeAccountSetup)(userRef.current);
      if(!activeRef.current)return;
      userRef.current=next.user;setResult(next);
      if(next.status==='logo-required')setError('Your account details are saved, but the logo is not attached yet. Retry, choose the file again, or add it later.');
    }catch(_){if(activeRef.current)setError('Your account is safe. We could not finish saving the workspace. Check your connection and retry—there is no need to create another account.')}
    finally{runningRef.current=false;if(activeRef.current)setBusy(false)}
  };
  useEffect(()=>{
    activeRef.current=true;
    if(!loadingOnly)execute();
    return ()=>{activeRef.current=false};
    // One completion per mounted account; retries are explicit.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[]);
  useEffect(()=>{headingRef.current?.focus({preventScroll:true})},[result?.status,error,loadError]);
  const attach=async(event)=>{
    const file=event.target.files?.[0];event.target.value='';
    if(!file||runningRef.current)return;
    setBusy(true);setError('');
    try{
      await saveLogoDraft(setup.initialClientId,file);
      userRef.current=await updateAccountSetupMetadata(userRef.current,{logo:{name:file.name,type:file.type,size:file.size},logoUpload:null,logoRevision:Date.now().toString()});
      await execute();
    }catch(_){setError('Choose a PNG, JPG or WebP logo under 5 MB. If it still will not save, you can add it later.')}
    finally{if(activeRef.current)setBusy(false)}
  };
  const ready=result?.status==='ready';
  const needsLogo=result?.status==='logo-required';
  const message=loadError||error;
  return <main className="ax-shell ax-shell-light ax-setup-gate">
    <header className="ax-gate-brand"><img src="/logo-transparent.png" alt=""/><strong>Tawaslo</strong></header>
    <section className="ax-panel ax-gate-panel" aria-busy={busy||loadingOnly&&!loadError}>
      <div className="ax-result">
        <span className="ax-result-icon">{ready?<Check size={28}/>:busy||loadingOnly&&!loadError?<Loader2 size={28} className="ax-spin"/>:<Building2 size={28}/>}</span>
        <small>{ready?'Made for your next chapter':needsLogo?'One optional finishing touch':'Your account, coming together'}</small>
        <h1 ref={headingRef} tabIndex={-1}>{ready?'Your workspace is ready.':needsLogo?'Let’s bring your logo along.':message?'Let’s finish where you left off.':'Opening your workspace.'}</h1>
        <p>{ready?'Your choices are saved. You can start exploring, then connect your accounts when you are ready.':needsLogo?'Confirming on a different device? Attach the logo again here. Your other setup choices are already saved.':'We are checking your account and saving the details that make this space yours.'}</p>
        {setup&&<div className="ax-setup-summary">
          <div><small>Workspace</small><strong>{setup.companyName}</strong></div>
          <div><small>Plan preference</small><strong>{PLAN_NAMES[setup.selectedPlan]||'Selected plan'}</strong></div>
          <div><small>Billing preference</small><strong>{setup.billing==='yearly'?'Yearly':'Monthly'} · no charge today</strong></div>
        </div>}
        {message&&<p className="ax-inline-notice" role="alert">{message}</p>}
        {ready&&<button className="ax-primary" type="button" onClick={()=>onReady(result.user)}>Continue to workspace<ArrowRight size={18}/></button>}
        {!ready&&!busy&&!loadingOnly&&<button className="ax-primary" type="button" onClick={()=>execute()}>{needsLogo?'Retry logo upload':'Retry workspace setup'}<ArrowRight size={18}/></button>}
        {needsLogo&&!busy&&<>
          <input className="ax-visually-hidden" ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" aria-label="Choose organisation logo" tabIndex={-1} onChange={attach}/>
          <button className="ax-secondary ax-full" type="button" onClick={()=>fileRef.current?.click()}><Upload size={18}/>Choose logo again</button>
          <button className="ax-text-button ax-full" type="button" onClick={()=>execute(true)}>Add the logo later</button>
        </>}
        {loadingOnly&&loadError&&<button type="button" className="ax-primary" onClick={onRetry}>Try again<ArrowRight size={18}/></button>}
        {!busy&&(message||ready)&&<button type="button" className="ax-text-button ax-full" onClick={onSignOut}>Sign out</button>}
        <a className="ax-result-support ax-text-button" href="mailto:support@tawaslo.com">Need a hand? Contact support</a>
      </div>
    </section>
  </main>;
}
