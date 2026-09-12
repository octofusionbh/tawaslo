import { STUDIO_FORMAT_DEFAULTS, validFormatFields } from './studioFormats';
export const STUDIO_TOOLS = ['captions','ideas','hashtags','images','templates'];
export const STUDIO_STORAGE_KEY = 'tw_studio_saved_design_v1:preview-marina';
export const STUDIO_PRESETS = {
  brunch: {
    label:'Weekend brunch', topic:'Introduce our weekend brunch at Marina Social Club. Focus on sharing dishes and an unhurried afternoon by the water.', art:'menu', headline:'Make room for a slow weekend.', subline:'Good food. Better company. Marina Social Club.',
    captions:[
      {label:'Warm',en:'Good food tastes even better together. Make room for a slow weekend, sharing plates and a little time by the water. Your table is waiting at Marina Social Club.',ar:'يصبح الطعام ألذّ حين نتشاركه. استمتعوا بعطلة هادئة، وأطباق للمشاركة، ووقت جميل بجانب البحر. طاولتكم بانتظاركم في مارينا سوشال كلوب.'},
      {label:'Direct',en:'Your weekend plans, sorted. Discover brunch at Marina Social Club, with sharing dishes and waterfront views. Get in touch to reserve your table.',ar:'خطط عطلتكم جاهزة. اكتشفوا البرانش في مارينا سوشال كلوب، مع أطباق للمشاركة وإطلالة على البحر. تواصلوا معنا لحجز طاولتكم.'},
      {label:'Story-led',en:'The best weekends have a way of slowing down. One more conversation. Another dish to share. A table you are in no rush to leave. Find yours at Marina Social Club.',ar:'أجمل العطلات هي التي نتمهّل فيها. حديث آخر، وطبق نتشاركه، وطاولة لا نرغب في مغادرتها. عيشوا هذه اللحظات في مارينا سوشال كلوب.'},
    ],
    ideas:[['A table made for sharing','Carousel','Start with the full table, then give each sharing dish its own frame. Close with an invitation to book.'],['Your unhurried weekend','Reel','Follow a slow afternoon from the first coffee to the last conversation by the water.'],['Let the guests choose','Story','Show two brunch dishes and invite followers to pick the one they would share first.']],
    tags:['#MarinaSocialClub','#BahrainBrunch','#BahrainFood','#WeekendBrunch','#WaterfrontDining'],
  },
  kitchen: {
    label:'Behind the menu', topic:'Show the people and care behind our food. Introduce the Marina kitchen team through a behind-the-scenes story.', art:'kitchen', headline:'Made with care. Shared with you.', subline:'Meet the people behind your favourite dishes.',
    captions:[
      {label:'Warm',en:'A little care goes into everything we put on your table. Meet the people behind the dishes, the details and the welcome at Marina Social Club.',ar:'نضع العناية في كل ما نقدّمه على طاولتكم. تعرّفوا على الأشخاص وراء الأطباق والتفاصيل والترحيب في مارينا سوشال كلوب.'},
      {label:'Direct',en:'From our kitchen to your table. Go behind the scenes with the team at Marina Social Club and discover what goes into every dish.',ar:'من مطبخنا إلى طاولتكم. انضمّوا إلينا خلف الكواليس مع فريق مارينا سوشال كلوب واكتشفوا تفاصيل إعداد كل طبق.'},
      {label:'Story-led',en:'Before a dish reaches your table, there is a whole story behind it. Early starts, careful hands and people who love what they do. This is our kitchen.',ar:'قبل أن يصل الطبق إلى طاولتكم، تكون خلفه حكاية كاملة. بدايات مبكرة، وأيدٍ حريصة، وأشخاص يحبّون عملهم. هذا هو مطبخنا.'},
    ],
    ideas:[['Meet the hands behind the plate','Reel','Introduce one team member through the preparation of their favourite dish.'],['One ingredient, a whole story','Carousel','Trace an ingredient from preparation to the finished plate.'],['Ask the kitchen','Story','Invite a question for the chef and answer it in a short follow-up story.']],
    tags:['#MarinaSocialClub','#BehindTheMenu','#BahrainRestaurants','#MeetTheChef','#MadeWithCare'],
  },
  sunset: {
    label:'Golden hour', topic:'Invite guests to stay a little longer at Marina Social Club, with sunset views and a relaxed evening by the water.', art:'sunset', headline:'Stay a little longer.', subline:'Golden hour at Marina Social Club.',
    captions:[
      {label:'Warm',en:'Some evenings deserve a little longer. Find your place by the water and let golden hour do the rest. We will save you a seat at Marina Social Club.',ar:'بعض الأمسيات تستحق أن تطول. اختاروا مكانكم بجانب البحر واستمتعوا بألوان الغروب. مقعدكم بانتظاركم في مارينا سوشال كلوب.'},
      {label:'Direct',en:'Golden hour looks good from here. Join us by the water at Marina Social Club. Get in touch to plan your next evening.',ar:'للغروب جمال خاص من هنا. انضمّوا إلينا بجانب البحر في مارينا سوشال كلوب. تواصلوا معنا للتخطيط لأمسيتكم القادمة.'},
      {label:'Story-led',en:'The light changes. The conversation carries on. And suddenly, there is nowhere else you need to be. An evening by the water, the Marina way.',ar:'يتغيّر الضوء ويستمرّ الحديث، وفجأة لا ترغبون في الذهاب إلى مكان آخر. أمسية بجانب البحر، على طريقة مارينا.'},
    ],
    ideas:[['An evening in three frames','Carousel','Move from the setting sun to the first dish and a table full of conversation.'],['Watch the light change','Reel','Film the waterfront from afternoon into golden hour, with a quiet invitation to visit.'],['Who is joining you?','Story','Share the evening view and invite guests to mention their next dinner companion.']],
    tags:['#MarinaSocialClub','#GoldenHour','#BahrainDining','#WaterfrontViews','#EveningInBahrain'],
  },
};
export const DEFAULT_STUDIO_FIELDS = {...STUDIO_FORMAT_DEFAULTS,preset:'brunch',topic:STUDIO_PRESETS.brunch.topic,platform:'ig',tone:'Warm',language:'both',dialect:'msa',prompt:'Warm natural light, an inviting brunch table by the water, rich food textures. No text overlay.',imageMode:'generate',ratio:'1:1',look:'editorial',headline:STUDIO_PRESETS.brunch.headline,subline:STUDIO_PRESETS.brunch.subline};
export function captionText(caption,language) {return (language==='en'?[caption.en]:language==='ar'?[caption.ar]:[caption.en,caption.ar]).join('\n\n');}
export function validStudioFields(fields) {
  return fields && ['preset','topic','platform','tone','language','dialect','prompt','imageMode','ratio','look','headline','subline'].every(key=>typeof fields[key]==='string'&&fields[key].length<=2000)
    && Object.hasOwn(STUDIO_PRESETS,fields.preset) && ['ig','fb','li','tt','tw','yt'].includes(fields.platform) && ['Warm','Direct','Story-led'].includes(fields.tone) && ['en','ar','both'].includes(fields.language) && ['gulf','saudi','egyptian','levantine','msa'].includes(fields.dialect) && ['generate','edit'].includes(fields.imageMode) && validFormatFields(fields) && ['editorial','bold','minimal'].includes(fields.look) && fields.headline.length<=90 && fields.subline.length<=180;
}
export function readStudioSaved(store) {
  try {
    const raw=(store||window.localStorage).getItem(STUDIO_STORAGE_KEY);
    const items=raw?JSON.parse(raw):[];
    if(!Array.isArray(items)||items.length>100||!items.every(item=>item&&typeof item.id==='string'&&item.id.startsWith('studio-')&&STUDIO_TOOLS.includes(item.tool)&&typeof item.text==='string'&&item.text.length<=12000&&typeof item.title==='string'&&item.title.length<=90&&validStudioFields(item.fields))||new Set(items.map(item=>item.id)).size!==items.length)throw Error('Invalid saved items');
    return {items,error:''};
  }catch(_){return {items:[],error:'Saved Studio items could not be read. Saving is paused to protect them. You can still explore and copy your work.'};}
}
export function saveStudioItem(item,store) {
  const current=readStudioSaved(store);
  if(current.error)return {ok:false,error:current.error};
  if(current.items.length>=100)return {ok:false,error:'This preview has reached its 100 saved-item limit. Copy your work to keep it.'};
  if(!STUDIO_TOOLS.includes(item.tool)||!validStudioFields(item.fields)||typeof item.text!=='string'||item.text.length>12000||typeof item.title!=='string'||!item.title.trim()||item.title.length>90)return {ok:false,error:'This item could not be saved. Check the brief and try again.'};
  const saved={...item,fields:{...item.fields},id:`studio-${Date.now()}-${Math.random().toString(36).slice(2,9)}`};
  const items=[saved,...current.items];
  try{(store||window.localStorage).setItem(STUDIO_STORAGE_KEY,JSON.stringify(items));return {ok:true,items};}
  catch(_){return {ok:false,error:'Not saved. Browser storage is full or unavailable. Your work is still on this page; copy it to keep it.'};}
}
export function stageStudioCaption(text,store) {
  if(typeof text!=='string'||!text.trim()||text.length>12000)return {ok:false,error:'Add some text before opening Publisher.'};
  try {
    const session=store||window.sessionStorage;
    if(['tw_studio_caption','tw_studio_media','tw_studio_aitopic','tw_repost','tw_prefill_date','tw_prefill_time'].some(key=>session.getItem(key)))return {ok:false,error:'Another item is already waiting in Publisher. Open Publisher first, then come back for this one.'};
    session.setItem('tw_studio_caption',text);
    return {ok:true};
  }catch(_){return {ok:false,error:'Could not pass this text to Publisher. Copy it instead; your work is still here.'};}
}
