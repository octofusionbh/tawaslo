import { savePlannerPost } from './plannerPreviewModel';

export const REVIEW_GROUPS = { changes:'Needs changes', waiting:'With client', approved:'Approved' };
export const reviewGroup = post => post.status === 'changes' ? 'changes' : post.status === 'approved' ? 'approved' : 'waiting';
export const reviewLabel = post => post.status === 'approved' && post.approvedBy === 'Agency' ? 'Approved by me' : post.status === 'revised' ? 'Updated for review' : REVIEW_GROUPS[reviewGroup(post)];
export function sharedReviewPosts(state) {
  const priority = {changes:0,waiting:1,approved:2};
  return state.posts.filter(post=>state.sharedIds.includes(post.id) && post.status!=='draft')
    .sort((a,b)=>priority[reviewGroup(a)]-priority[reviewGroup(b)] || a.day-b.day || a.time.localeCompare(b.time));
}
export function reviewAccess(state, now=Date.now()) {
  if (state.expiresAt && state.expiresAt<=now) return {kind:'expired',label:'Review link expired',detail:'Prepare a new review in Calendar so the client can respond.'};
  if (state.access==='view') return {kind:'view',label:'View-only calendar',detail:'The client can read the calendar, but cannot approve or request changes.'};
  if (state.expiresAt) return {kind:'review',label:'Client review is open',detail:`Local preview expires ${new Date(state.expiresAt).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'})}.`};
  return {kind:'sample',label:'Sample review',detail:'Prepare a review in Calendar to choose access and expiry.'};
}
export function reviseApproval(state,id,caption,note,expectedVersion) {
  const post=state.posts.find(p=>p.id===id);
  if (!post || !state.sharedIds.includes(id) || post.status!=='changes' || post.version!==expectedVersion) return {ok:false,error:'This review changed in another view. Cancel this revision and reopen the post before editing.'};
  if (!caption.trim()) return {ok:false,error:'Add the revised caption before saving.'};
  if (caption.trim()===post.caption.trim()) return {ok:false,error:'Update the caption to address the client feedback before saving.'};
  if (note.trim().length>500) return {ok:false,error:'Keep the revision note to 500 characters or fewer.'};
  const result=savePlannerPost(state,{...post,caption},id,expectedVersion,'changes');
  if (!result.ok) return result;
  const updated={...result.post,
    notes:[...post.notes,{author:'Agency',kind:'revised',version:result.post.version,text:note.trim()||'Caption updated. Please review this new version.'}],
    revisions:[...(post.revisions||[]),{version:post.version,caption:post.caption}].slice(-20)};
  return {...result,post:updated,data:{...result.data,posts:result.data.posts.map(p=>p.id===id?updated:p),activity:[{text:`${post.title} revised after client feedback`,at:Date.now()},...state.activity].slice(0,20)}};
}
