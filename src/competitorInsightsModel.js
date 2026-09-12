import {SAMPLE_COMPETITORS,COMPETITOR_MONTHS,COMPETITOR_NETWORKS,competitorMetrics,competitorPosts,monthName} from './competitorPreviewModel';
import {DEFAULT_STUDIO_FIELDS,readStudioSaved,saveStudioItem} from './studioPreviewModel';

const average=values=>values.reduce((sum,value)=>sum+value,0)/values.length;
export function competitorInsights(platform,month){
  if(!Object.hasOwn(COMPETITOR_NETWORKS,platform)||!COMPETITOR_MONTHS.includes(month))return [];
  const posts=id=>competitorPosts(SAMPLE_COMPETITORS.find(a=>a.id===id),platform,month);
  const metric=id=>competitorMetrics(id,platform,month),own=metric('marina'),coast=posts('coast'),olive=metric('olive'),afterglow=metric('afterglow');
  const pairs=['coast','olive','afterglow'].flatMap(id=>[posts(id)[0],posts(id)[2]]);
  const videoComments=average(pairs.filter((_,i)=>i%2===0).map(p=>p.comments));
  const photoComments=average(pairs.filter((_,i)=>i%2===1).map(p=>p.comments));
  const findings=platform==='ig'?[
    {key:'kitchen',category:'Format experiment',title:'Put a face to the food.',summary:`The 3 selected reels average ${videoComments.toFixed(0)} comments, versus ${photoComments.toFixed(0)} for 3 photo examples.`,
      evidence:pairs,measure:'Average comments per selected post',values:[{label:'Reels · 3 examples',value:videoComments,display:videoComments.toFixed(0)},{label:'Photos · 3 examples',value:photoComments,display:photoComments.toFixed(0)}],
      limitation:'One reel and one photo from each of three fictional accounts. This is not a complete month or evidence that a format caused the difference.',
      experiment:'Film a short introduction to one Marina chef through the preparation of a favourite dish. Use original footage, a specific opening and a question guests can answer.',
      success:'Compare comments per post with your recent, comparable Marina posts over the same number of days. Repeat the test before treating it as a pattern.',preset:'kitchen'},
    {key:'menu',category:'Content opportunity',title:'Make the menu easier to explore.',summary:`Carousels make up ${Math.round(olive.mix[1]/olive.posts*100)}% of Olive House’s sample month, compared with ${Math.round(own.mix[1]/own.posts*100)}% at Marina.`,
      evidence:[posts('olive')[1],posts('marina')[1]],measure:'Share of monthly posts that are carousels',values:[{label:`Olive House · ${olive.mix[1]} of ${olive.posts}`,value:olive.mix[1]/olive.posts*100,display:`${Math.round(olive.mix[1]/olive.posts*100)}%`},{label:`Marina · ${own.mix[1]} of ${own.posts}`,value:own.mix[1]/own.posts*100,display:`${Math.round(own.mix[1]/own.posts*100)}%`}],
      limitation:'The percentages use the fictional monthly totals, not the two examples below. More carousels does not mean better results or prove that Marina has a content gap.',
      experiment:'Create one useful Marina menu guide: a sharing dish per frame, a flavour note and who it suits. Finish with an invitation to ask the team for a recommendation.',
      success:'Review questions and comments on the guide against comparable Marina carousels. Check saves in your own account if available; competitor saves are not shown here.',preset:'brunch'},
    {key:'cadence',category:'Planning experiment',title:'Test the idea before adding volume.',summary:`Afterglow has ${afterglow.posts} sample posts and ${afterglow.rate.toFixed(1)}% interaction rate. Marina has ${own.posts} and ${own.rate.toFixed(1)}%.`,
      evidence:[...posts('afterglow'),...posts('marina')],measure:'Monthly interaction rate · likes + comments / followers',values:[{label:`Afterglow · ${afterglow.posts} posts`,value:afterglow.rate,display:`${afterglow.rate.toFixed(1)}%`},{label:`Marina · ${own.posts} posts`,value:own.rate,display:`${own.rate.toFixed(1)}%`}],
      limitation:'These are different audiences and accounts. Rate is average likes plus comments per post, divided by followers. The sample does not show that posting less improves performance.',
      experiment:'Keep Marina’s posting schedule steady. Replace one routine post with an original guest’s-eye evening story, then review what the audience responds to.',
      success:'Compare the new post with your own recent baseline at the same age. Keep the publishing volume unchanged so you can evaluate the creative direction first.',preset:'sunset'},
  ]:[
    {key:'guest-story',category:'Creative experiment',title:'Try a guest’s-eye story.',summary:`Coast’s selected arrival video has ${coast[0].comments} comments; its conversation video has ${coast[2].comments}.`,
      evidence:[coast[0],coast[2]],measure:'Comments on two selected videos',values:[{label:'Arrival story · 24th',value:coast[0].comments,display:String(coast[0].comments)},{label:'Conversation story · 8th',value:coast[2].comments,display:String(coast[2].comments)}],
      limitation:'Only two fictional videos, posted on different days. Their views, watch time and audience exposure are unknown. The opening or topic may not explain the difference.',
      experiment:'Create two original Marina videos about an afternoon by the water. Try a guest arriving in one opening and the first dish being served in the other. Keep the rest of the idea comparable.',
      success:'Review both after the same number of days. Compare comments, and your own retention data if available. Repeat before choosing a regular opening style.',preset:'brunch'},
    {key:'kitchen-series',category:'Content opportunity',title:'Give the kitchen a repeatable story.',summary:`Olive House has ${olive.posts} videos in this sample month. Its selected examples cover ingredients, menu choices and preparation.`,
      evidence:posts('olive'),measure:'Posts in the sample month',values:[{label:'Olive House',value:olive.posts,display:String(olive.posts)},{label:'Marina',value:own.posts,display:String(own.posts)}],
      limitation:'The three fictional examples illustrate topics, not a proven successful series. Monthly posting volume is context, not a performance recommendation.',
      experiment:'Plan a three-part Marina kitchen series: meet an ingredient, see the chef’s technique, then discover the finished dish. Give each video a useful answer to a guest’s question.',
      success:'Track questions and comments across the three posts at the same age. Keep the topics guests ask about and adjust the others.',preset:'kitchen'},
  ];
  return findings.map(item=>({...item,id:`insight:${platform}:${month}:${item.key}`,platform,month}));
}
export function insightBrief(insight){return `TEST\n${insight.title}\n\nCREATE\n${insight.experiment}\n\nHOW TO REVIEW IT\n${insight.success}`;}
export function insightEvidenceText(insight){return `SOURCE: Competitor Insights design preview\n${COMPETITOR_NETWORKS[insight.platform]} · ${monthName(insight.month)}\n${insight.summary}\n\nLIMITS\n${insight.limitation}\n\nSelected fictional examples:\n${insight.evidence.map(post=>`${post.accountName}: ${post.title} (${post.format}, ${post.day} ${monthName(post.month)}; ${post.likes} likes, ${post.comments} comments)`).join('\n')}\n\nAll accounts, posts and numbers are illustrative. No live research, AI generation or publishing has taken place.`;}
export function saveInsightBrief(insight,draft,store){
  const canonical=competitorInsights(insight?.platform,insight?.month).find(item=>item.id===insight?.id);
  if(!canonical||typeof draft!=='string'||!draft.trim()||draft.length>6000)return {ok:false,error:'Add a brief between 1 and 6,000 characters before saving.'};
  const current=readStudioSaved(store);if(current.error)return {ok:false,error:current.error};
  const text=`${draft.trim()}\n\n${insightEvidenceText(canonical)}`;
  const existing=current.items.find(item=>item.kind==='competitor-brief'&&item.sourceId===canonical.id&&item.text===text);
  if(existing)return {ok:true,id:existing.id,alreadySaved:true};
  const response=saveStudioItem({kind:'competitor-brief',sourceId:canonical.id,tool:'ideas',title:canonical.title,fields:{...DEFAULT_STUDIO_FIELDS,preset:canonical.preset,platform:canonical.platform,language:'en',topic:canonical.experiment},text},store);
  return response.ok?{ok:true,id:response.items[0].id}:response;
}
