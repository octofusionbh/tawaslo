export const SUGGESTED_SAVED_KEY='tw_suggested_saved_v1:preview-marina';

export const SUGGESTED_CATEGORIES=[
  ['all','All ideas'],
  ['local','Local moments'],
  ['dining','Dining culture'],
  ['social','Social formats'],
  ['strategy','Growth angles'],
];

export const SAMPLE_SUGGESTED_IDEAS=[
  {
    id:'waterfront-third-place',priority:1,category:'local',title:'The waterfront table is becoming the city’s new third place',source:'Local dining desk',published:'Today',signal:'Rising locally',moment:'Act this week',platform:'Instagram',format:'Carousel',timing:'Tuesday · 6:30 PM',art:'sea',
    angle:'Show Marina as the place between work and home: the table people return to when they want the evening to slow down.',
    why:['Waterfront posts earned Marina’s strongest saves this month.','The idea connects atmosphere with a real guest habit.','A carousel gives the story room without feeling promotional.'],
    opener:'Not home. Not work. Just your table by the water.',caption:'Some places are for passing through. Others become part of your week. Save your table by the water.',
  },
  {
    id:'small-plates-long-lunch',priority:2,category:'dining',title:'Small plates are replacing the long, fixed brunch',source:'Hospitality signals',published:'Today',signal:'Conversation growing',moment:'Test now',platform:'Instagram',format:'Reel',timing:'Thursday · 12:15 PM',art:'table',
    angle:'Turn the trend into an easy, shareable lunch ritual: order for the table, stay for one more plate.',
    why:['The format naturally shows several menu items.','It creates a social reason to visit with friends.','The reel can be cut from one short lunch shoot.'],
    opener:'Lunch is better when nobody orders alone.',caption:'A little for you. A little for the table. Lunch by the water, served at your pace.',
  },
  {
    id:'making-not-only-plate',priority:3,category:'social',title:'Guests want the making, not only the final plate',source:'Short-form watchlist',published:'Yesterday',signal:'High completion',moment:'Act this week',platform:'TikTok',format:'Vertical video',timing:'Wednesday · 8:00 PM',art:'kitchen',
    angle:'Follow one plate from the first sound in the kitchen to the moment it reaches the waterfront table.',
    why:['Process footage builds trust and appetite together.','Marina already has a strong behind-the-scenes visual language.','One shoot can create a reel, story, and still cover.'],
    opener:'The part you never see starts here.',caption:'Before it reaches your table, every plate has a rhythm of its own.',
  },
  {
    id:'sunday-quiet-hours',priority:4,category:'strategy',title:'Sunday lunch can own the quiet-hours gap',source:'Marina performance note',published:'Yesterday',signal:'Open opportunity',moment:'Plan this week',platform:'Facebook',format:'Post',timing:'Sunday · 10:45 AM',art:'menu',
    angle:'Position Sunday lunch as a deliberate reset, not a leftover weekend occasion.',
    why:['Sunday has lower posting competition in the local set.','The lunch menu gives the message a concrete reason to act.','A calm tone matches Marina better than a discount-led offer.'],
    opener:'Sunday does not need to rush.',caption:'A slower table, a longer lunch, and the water beside you. Sunday is ready when you are.',
  },
  {
    id:'zero-proof-dinner-choice',priority:5,category:'dining',title:'Zero-proof drinks are becoming a dinner choice',source:'Global menu watch',published:'2 days ago',signal:'Steady growth',moment:'Evergreen',platform:'Instagram',format:'Story',timing:'Friday · 4:30 PM',art:'sunset',
    angle:'Present the drink as part of the evening mood, with the same care and visual weight as the food.',
    why:['The sunset palette suits Marina’s existing art direction.','Stories make the idea easy to test before a full post.','It widens the evening message without changing the brand voice.'],
    opener:'The evening still has a signature.',caption:'Bright, considered, and made for the table. Your evening pour can be zero-proof.',
  },
  {
    id:'saveable-waterfront-guide',priority:6,category:'social',title:'A saveable waterfront guide can outperform another menu post',source:'Format desk',published:'3 days ago',signal:'Strong saves',moment:'Build this month',platform:'Instagram',format:'Guide carousel',timing:'Monday · 7:00 PM',art:'sea',
    angle:'Create a practical guide to the best time, table, view, and order for a Marina evening.',
    why:['Utility gives guests a reason to save and share.','The idea can reuse approved media already in the library.','It introduces several experiences without listing the whole menu.'],
    opener:'Your Marina evening, planned in five slides.',caption:'The view, the table, the first order, and the hour worth staying for. Save this for your next evening by the water.',
  },
];

export const SAMPLE_SUGGESTED_SOURCES=[
  {id:'source-local',name:'Local dining desk',detail:'Local openings, habits and occasions',active:true},
  {id:'source-hospitality',name:'Hospitality signals',detail:'Dining and menu behavior',active:true},
  {id:'source-formats',name:'Short-form watchlist',detail:'Formats gaining attention',active:true},
];

const ids=new Set(SAMPLE_SUGGESTED_IDEAS.map(idea=>idea.id));
const clean=value=>String(value||'').trim().toLowerCase();

export function filterSuggestedIdeas(ideas=SAMPLE_SUGGESTED_IDEAS,{category='all',query='',savedOnly=false,saved=[]}={}){
  const needle=clean(query),savedSet=new Set(saved);
  return ideas.filter(idea=>(category==='all'||idea.category===category)&&(!savedOnly||savedSet.has(idea.id))&&(!needle||[idea.title,idea.source,idea.signal,idea.platform,idea.format,idea.angle,...idea.why].some(value=>clean(value).includes(needle))));
}

export function readSuggestedRoute(search=''){
  const params=new URLSearchParams(search),category=SUGGESTED_CATEGORIES.some(([id])=>id===params.get('ideaType'))?params.get('ideaType'):'all',query=String(params.get('ideaSearch')||'').slice(0,80),savedOnly=params.get('ideaView')==='saved',idea=ids.has(params.get('idea'))?params.get('idea'):'';
  return {category,query,savedOnly,idea};
}

export function readSuggestedSaved(store){
  try{const raw=(store||window.localStorage).getItem(SUGGESTED_SAVED_KEY),items=raw?JSON.parse(raw):[];if(!Array.isArray(items)||items.length>50||items.some(id=>typeof id!=='string'||!ids.has(id))||new Set(items).size!==items.length)throw Error('invalid');return {items,error:''};}catch(_){return {items:[],error:'Saved ideas could not be read. The briefing is still available.'};}
}

export function toggleSuggestedSaved(id,current=[],store){
  if(!ids.has(id))return {ok:false,items:current,error:'This sample idea is not available.'};
  const next=current.includes(id)?current.filter(item=>item!==id):[id,...current];
  try{(store||window.localStorage).setItem(SUGGESTED_SAVED_KEY,JSON.stringify(next));return {ok:true,items:next,error:''};}catch(_){return {ok:false,items:current,error:'Idea not saved. Browser storage is unavailable.'};}
}

export function suggestedIdeaById(id,ideas=SAMPLE_SUGGESTED_IDEAS){return ideas.find(idea=>idea.id===id)||null;}
