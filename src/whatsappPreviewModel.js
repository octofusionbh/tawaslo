export const WHATSAPP_FILTERS=[
  {id:'open',label:'Open'},
  {id:'unread',label:'Unread'},
  {id:'reservations',label:'Reservations'},
  {id:'orders',label:'Orders'},
  {id:'done',label:'Done'},
];

export const WHATSAPP_QUICK_REPLIES=[
  {id:'availability',label:'Share availability',text:'Absolutely. We have a table available at 8:00 PM this evening. Would you like me to reserve it for you?'},
  {id:'menu',label:'Send lunch menu',text:'Here is today’s lunch menu. Our kitchen serves lunch from 12:00 PM to 4:00 PM, Sunday to Thursday.'},
  {id:'location',label:'Share location',text:'You can find us by the waterfront at Marina Social Club. I can send you the exact map pin if that helps.'},
];

export const WHATSAPP_CONVERSATIONS=[
  {
    id:'layla',name:'Layla Al Zayani',initials:'LZ',phone:'+973 39 220 184',time:'2 min',unread:2,status:'open',type:'reservations',intent:'Dinner reservation',priority:'Ready to book',assigned:'Abdulla',tone:'#cf6a57',
    preview:'Could we have a table outside tonight?',
    details:{visits:'4 visits',lastVisit:'18 Aug 2026',spend:'BHD 186',preference:'Terrace · quiet table',occasion:'Anniversary dinner'},
    messages:[
      {id:'l1',side:'guest',time:'7:42 PM',text:'Hi, do you have an outdoor table available tonight?'},
      {id:'l2',side:'team',time:'7:44 PM',text:'Hi Layla. Yes, the terrace is open tonight. How many guests will be joining you?'},
      {id:'l3',side:'guest',time:'7:45 PM',text:'Two people, around 8 if possible. It is our anniversary.'},
      {id:'l4',side:'guest',time:'7:46 PM',text:'Could we have a table outside tonight?'},
    ],
  },
  {
    id:'yousif',name:'Yousif Jassim',initials:'YJ',phone:'+973 36 948 023',time:'11 min',unread:1,status:'open',type:'orders',intent:'Pickup order',priority:'Needs answer',assigned:'Unassigned',tone:'#456c67',
    preview:'Is the sea bass available for pickup?',
    details:{visits:'First order',lastVisit:'No visit yet',spend:'BHD 0',preference:'Pickup · 7:30 PM',occasion:'Dinner at home'},
    messages:[
      {id:'y1',side:'guest',time:'7:31 PM',text:'Hello. Is the grilled sea bass available for pickup tonight?'},
      {id:'y2',side:'guest',time:'7:32 PM',text:'I would need two portions around 7:30.'},
    ],
  },
  {
    id:'sara',name:'Sara Ebrahim',initials:'SE',phone:'+973 33 740 892',time:'34 min',unread:0,status:'open',type:'reservations',intent:'Private event',priority:'Follow up',assigned:'Maya',tone:'#7b5b70',
    preview:'I will confirm the final guest count tomorrow.',
    details:{visits:'7 visits',lastVisit:'2 Jul 2026',spend:'BHD 492',preference:'Private dining room',occasion:'Birthday lunch'},
    messages:[
      {id:'s1',side:'team',time:'6:58 PM',text:'The private room can host up to 18 guests. I have placed a courtesy hold for Saturday afternoon.'},
      {id:'s2',side:'guest',time:'7:04 PM',text:'Perfect, thank you. I will confirm the final guest count tomorrow.'},
    ],
  },
  {
    id:'omar',name:'Omar Yusuf',initials:'OY',phone:'+973 38 116 503',time:'Yesterday',unread:0,status:'done',type:'orders',intent:'Order collected',priority:'Completed',assigned:'Abdulla',tone:'#9a7240',
    preview:'Collected, thank you. Everything was great.',
    details:{visits:'12 visits',lastVisit:'Yesterday',spend:'BHD 714',preference:'No shellfish',occasion:'Regular guest'},
    messages:[
      {id:'o1',side:'team',time:'8:12 PM',text:'Your order is ready at the marina entrance.'},
      {id:'o2',side:'guest',time:'8:26 PM',text:'Collected, thank you. Everything was great.'},
      {id:'o3',side:'team',time:'8:28 PM',text:'Wonderful. Have a lovely evening, Omar.'},
    ],
  },
  {
    id:'reem',name:'Reem Hasan',initials:'RH',phone:'+973 32 881 770',time:'Yesterday',unread:0,status:'done',type:'general',intent:'Opening hours',priority:'Completed',assigned:'Maya',tone:'#5e708e',
    preview:'Thank you, see you Friday.',
    details:{visits:'2 visits',lastVisit:'6 Aug 2026',spend:'BHD 74',preference:'Window table',occasion:'Weekend lunch'},
    messages:[
      {id:'r1',side:'guest',time:'5:16 PM',text:'Are you open for lunch on Friday?'},
      {id:'r2',side:'team',time:'5:18 PM',text:'Yes. Friday lunch begins at 12:30 PM and the kitchen stays open throughout the afternoon.'},
      {id:'r3',side:'guest',time:'5:19 PM',text:'Thank you, see you Friday.'},
    ],
  },
];

export function conversationById(id,items=WHATSAPP_CONVERSATIONS){return items.find(item=>item.id===id)||items[0];}

export function filterWhatsAppConversations(items,{filter='open',query=''}={}){
  const needle=String(query||'').trim().toLowerCase();
  return items.filter(item=>{
    const matchesFilter=filter==='unread'?item.unread>0:filter==='reservations'?item.type==='reservations':filter==='orders'?item.type==='orders':filter==='done'?item.status==='done':item.status==='open';
    const haystack=`${item.name} ${item.preview} ${item.intent} ${item.phone}`.toLowerCase();
    return matchesFilter&&(!needle||haystack.includes(needle));
  });
}

export function appendWhatsAppMessage(items,id,text,time='Now'){
  const value=String(text||'').trim();
  if(!value)return items;
  return items.map(item=>item.id===id?{...item,preview:value,time:'Now',unread:0,messages:[...item.messages,{id:`local-${Date.now()}`,side:'team',time,text:value}]}:item);
}

export function setWhatsAppConversationStatus(items,id,status){
  return items.map(item=>item.id===id?{...item,status,priority:status==='done'?'Completed':item.priority,unread:0}:item);
}

export function assignWhatsAppConversation(items,id,assigned){return items.map(item=>item.id===id?{...item,assigned}:item);}

export function createWhatsAppReservation(items,id){
  return items.map(item=>item.id===id?{...item,priority:'Reservation held',type:'reservations',intent:'Dinner reservation',details:{...item.details,occasion:item.details.occasion||'Guest reservation'}}:item);
}
