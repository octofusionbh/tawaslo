import {SAMPLE_COMPETITORS,COMPETITOR_MONTHS,competitorPosts,monthName,COMPETITOR_NETWORKS} from './competitorPreviewModel';
import {DEFAULT_STUDIO_FIELDS,readStudioSaved,saveStudioItem} from './studioPreviewModel';

export const INSPIRATION_FORMATS=[['all','All formats'],['video','Reels & videos'],['Carousel','Carousels'],['Photo','Photos']];
export function inspirationPosts(platform='ig',month='2026-08') {
  if(!['ig','tt'].includes(platform)||!COMPETITOR_MONTHS.includes(month))return [];
  const accounts=SAMPLE_COMPETITORS.filter(account=>!account.own);
  // Alternate the sources so the first row offers three different creative directions.
  return [0,1,2].flatMap(index=>accounts.map(account=>competitorPosts(account,platform,month)[index]));
}
export function inspirationById(id) {
  if(typeof id!=='string')return null;
  const [platform,month,accountId]=id.split(':');
  if(!['ig','tt'].includes(platform)||!COMPETITOR_MONTHS.includes(month))return null;
  const account=SAMPLE_COMPETITORS.find(item=>item.id===accountId);
  return account?competitorPosts(account,platform,month).find(post=>post.id===id)||null:null;
}
export function filterInspiration(posts,format,query) {
  const search=String(query||'').trim().toLowerCase();
  return posts.filter(post=>(format==='all'||(format==='video'?['Reel','Video'].includes(post.format):post.format===format))&&(!search||`${post.title} ${post.accountName} ${post.caption} ${post.brief}`.toLowerCase().includes(search)));
}
export function inspirationTakeaway(post) {
  return post.look==='coast'?'Give the setting a role in the story. Lead with a recognisable place and make the invitation specific.':post.look==='olive'?'Bring one detail into focus. Use a person, ingredient or dish to make the story easy to follow.':'Build a reason to visit. Connect the atmosphere to a moment the guest can imagine being part of.';
}
export function inspirationBrief(post) {
  return `ORIGINAL IDEA FOR MARINA SOCIAL CLUB\n${post.brief}\n\nCREATIVE DIRECTION\nUse Marina’s own ${['Reel','Video'].includes(post.format)?'footage':'photography'}, voice and setting. Do not copy the example’s wording or artwork.\n\nREVIEW BEFORE CREATING\nConfirm the featured dish, permissions for anyone shown, and the invitation or booking details.`;
}
export function inspirationSource(post) {
  return `SOURCE: Steal This / ${post.accountName}\n${COMPETITOR_NETWORKS[post.platform]} · ${monthName(post.month)} · ${post.format}\nExample: ${post.title}\nFictional account and illustrative content for the design preview. No live performance claims. Create original assets and copy.`;
}
export function saveInspirationBrief(id,text,store) {
  const post=inspirationById(id);
  if(!post)return {ok:false,error:'This example is unavailable. Return to Discover and choose another.'};
  if(typeof text!=='string'||!text.trim()||text.length>6000)return {ok:false,error:'Add your original direction, up to 6,000 characters, before saving.'};
  const library=readStudioSaved(store);
  if(library.error)return {ok:false,error:library.error};
  const content=`${text.trim()}\n\n${inspirationSource(post)}`;
  const existing=library.items.find(item=>item.kind==='inspiration-brief'&&item.sourceId===id&&item.text===content);
  if(existing)return {ok:true,id:existing.id,alreadySaved:true};
  const response=saveStudioItem({kind:'inspiration-brief',sourceId:id,tool:'ideas',title:post.title,fields:{...DEFAULT_STUDIO_FIELDS,language:'en',platform:post.platform,preset:post.look==='olive'?'kitchen':post.look==='afterglow'?'sunset':'brunch',topic:post.brief},text:content},store);
  return response.ok?{ok:true,id:response.items[0].id}:response;
}
export function readInspirationRoute(search='') {
  const params=new URLSearchParams(search);
  return {platform:['ig','tt'].includes(params.get('ideaPlatform'))?params.get('ideaPlatform'):'ig',month:COMPETITOR_MONTHS.includes(params.get('ideaMonth'))?params.get('ideaMonth'):'2026-08',view:params.get('ideaView')==='saved'?'saved':'discover',format:INSPIRATION_FORMATS.some(([key])=>key===params.get('ideaFormat'))?params.get('ideaFormat'):'all',query:(params.get('ideaSearch')||'').slice(0,100),postId:params.get('idea')||''};
}
