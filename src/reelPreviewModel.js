// Storyboard design preview only. Nothing is generated, rendered or published.
export const REEL_STORAGE_KEY = 'tw_reel_design_v1:preview-marina';
export const REEL_PLATFORMS = {ig:'Instagram Reels',tt:'TikTok',yt:'YouTube Shorts'};
export const REEL_ART = ['sea','menu','kitchen','sunset'];
const uid = prefix => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2,10)}`;
export function newScene() {return {id:uid('scene'),name:'New scene',seconds:3,shot:'',onscreen:'',voiceover:'',art:'sea'};}
export function sampleReel() {
  return {title:'A slower kind of weekend',topic:'Invite guests to spend an unhurried afternoon at Marina Social Club. Move from the waterfront to a table made for sharing.',platform:'ig',language:'en',caption:'Good food. Better company. A little more time by the water. Your weekend table is waiting at Marina Social Club.\n\n#MarinaSocialClub #BahrainBrunch #WaterfrontDining',audio:'Warm instrumental. Keep it quiet under the voiceover and leave room for the sound of the table.',scenes:[
    {id:uid('scene'),name:'The hook',seconds:3,shot:'Open on the waterfront. Hold the camera still and let the afternoon light set the pace.',onscreen:'Your weekend.\nA little slower.',voiceover:'What if your weekend had a little more room?',art:'sea'},
    {id:uid('scene'),name:'Set the table',seconds:5,shot:'Overhead close-up of sharing dishes arriving. Hands reach into frame naturally.',onscreen:'Good food.\nBetter company.',voiceover:'For another conversation. Another dish to share.',art:'menu'},
    {id:uid('scene'),name:'Make it personal',seconds:4,shot:'Cut to the final touches in the kitchen, then a smile as the plate is served.',onscreen:'Made with care.',voiceover:'And the little things that make you feel at home.',art:'kitchen'},
    {id:uid('scene'),name:'The invitation',seconds:3,shot:'End on a table by the water. Leave the invitation on screen until the final frame.',onscreen:'Your table is waiting.',voiceover:'Find your weekend at Marina Social Club.',art:'sunset'},
  ]};
}
export function blankReel() {return {title:'Untitled reel',topic:'',platform:'ig',language:'en',caption:'',audio:'',scenes:[newScene()]};}
export function sceneTimeline(scenes) {let cursor=0;return scenes.map(scene=>{const start=cursor;cursor+=Number(scene.seconds)||0;return {...scene,start,end:cursor};});}
export const reelDuration = scenes => scenes.reduce((total,scene)=>total+(Number(scene.seconds)||0),0);
export const timecode = seconds => `${String(Math.floor(seconds/60)).padStart(2,'0')}:${String(Math.floor(seconds%60)).padStart(2,'0')}`;
export function sceneAt(scenes,second) {const timeline=sceneTimeline(scenes);return timeline.find(scene=>second>=scene.start&&second<scene.end)||timeline[timeline.length-1];}
const text = (value,max) => typeof value==='string'&&value.length<=max;
export function validReel(project) {
  return !!project&&text(project.title,90)&&!!project.title.trim()&&text(project.topic,1500)&&text(project.caption,5000)&&text(project.audio,1000)&&Object.hasOwn(REEL_PLATFORMS,project.platform)&&['en','ar'].includes(project.language)
    &&Array.isArray(project.scenes)&&project.scenes.length>=1&&project.scenes.length<=12&&new Set(project.scenes.map(scene=>scene?.id)).size===project.scenes.length
    &&project.scenes.every(scene=>scene&&text(scene.id,100)&&scene.id.startsWith('scene-')&&text(scene.name,60)&&!!scene.name.trim()&&Number.isInteger(scene.seconds)&&scene.seconds>=1&&scene.seconds<=30&&text(scene.shot,1000)&&text(scene.onscreen,140)&&text(scene.voiceover,1000)&&REEL_ART.includes(scene.art));
}
export function readReels(store) {
  try {const raw=(store||window.localStorage).getItem(REEL_STORAGE_KEY),items=raw?JSON.parse(raw):[];
    if(!Array.isArray(items)||items.length>50||!items.every(item=>item&&text(item.id,100)&&item.id.startsWith('reel-')&&Number.isFinite(item.savedAt)&&validReel(item.project))||new Set(items.map(item=>item.id)).size!==items.length)throw Error('Invalid saved reels');
    return {items,error:''};
  }catch(_){return {items:[],error:'Saved storyboards could not be read. Saving is paused to protect them. You can still edit and copy your script.'};}
}
export function saveReel(project,store) {
  const current=readReels(store);if(current.error)return {ok:false,error:current.error};
  if(!validReel(project))return {ok:false,error:'Check the title and scene names before saving. Each scene needs a length from 1 to 30 seconds.'};
  if(!project.scenes.some(scene=>scene.shot.trim()||scene.onscreen.trim()||scene.voiceover.trim()))return {ok:false,error:'Add a shot description, on-screen text or voiceover to at least one scene.'};
  if(current.items.length>=50)return {ok:false,error:'This preview has reached 50 saved versions. Copy your script to keep another version.'};
  // Store only known text fields. No media, credentials or publishing state.
  const {title,topic,platform,language,caption,audio}=project;
  const clean={title,topic,platform,language,caption,audio,scenes:project.scenes.map(({id,name,seconds,shot,onscreen,voiceover,art})=>({id,name,seconds,shot,onscreen,voiceover,art}))};
  const items=[{id:uid('reel'),savedAt:Date.now(),project:clean},...current.items];
  try{(store||window.localStorage).setItem(REEL_STORAGE_KEY,JSON.stringify(items));return {ok:true,items};}
  catch(_){return {ok:false,error:'Not saved. Browser storage is full or unavailable. Your storyboard is still here; copy your script to keep it.'};}
}
export function moveScene(project,id,offset) {const index=project.scenes.findIndex(scene=>scene.id===id),target=index+offset;if(index<0||target<0||target>=project.scenes.length)return project;const scenes=[...project.scenes];[scenes[index],scenes[target]]=[scenes[target],scenes[index]];return {...project,scenes};}
export function duplicateScene(project,id) {if(project.scenes.length>=12)return project;const index=project.scenes.findIndex(scene=>scene.id===id);if(index<0)return project;const scenes=[...project.scenes];scenes.splice(index+1,0,{...scenes[index],id:uid('scene'),name:`${scenes[index].name.slice(0,53)} (copy)`});return {...project,scenes};}
export function reelScript(project) {return `${project.title}\n${REEL_PLATFORMS[project.platform]} · 9:16 · ${reelDuration(project.scenes)} seconds\n\nBRIEF\n${project.topic}\n\n${sceneTimeline(project.scenes).map((scene,i)=>`SCENE ${i+1}: ${scene.name} (${timecode(scene.start)} to ${timecode(scene.end)})\nShot: ${scene.shot}\nOn-screen text: ${scene.onscreen}\nVoiceover: ${scene.voiceover}`).join('\n\n')}\n\nCAPTION\n${project.caption}\n\nAUDIO DIRECTION\n${project.audio}`;}
