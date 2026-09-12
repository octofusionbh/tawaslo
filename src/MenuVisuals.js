import {useMemo,useState} from 'react';
import {ArrowLeft,Check,ChevronRight,Clock3,Plus,Search,ShoppingBag,Star,X} from 'lucide-react';
import {getMenuCategories,itemCategoryIds,itemInCategory} from './menuPreviewModel';
import menuDishGrid from './assets/menu-dishes-grid.png';
import './menu-visual.css';

const photoPosition=index=>({x:(index%3)*50,y:Math.floor((index%9)/3)*50});
export const menuBrandStyle=menu=>({'--menu-bg':menu.brand?.background||'#FBF5E9','--menu-ink':menu.brand?.text||'#241B16','--menu-primary':menu.brand?.primary||'#22594E','--menu-accent':menu.brand?.accent||'#B13D31','--mv-cream':menu.brand?.background||'#FBF5E9','--mv-ink':menu.brand?.text||'#241B16','--mv-green':menu.brand?.primary||'#22594E','--mv-red':menu.brand?.accent||'#B13D31','--mc-paper':menu.brand?.background||'#FBF5E9','--mc-ink':menu.brand?.text||'#241B16','--mc-red':menu.brand?.accent||'#B13D31'});

export function DishPhoto({item,className=''}){
  const position=photoPosition(item?.photo||0);
  return <div className={`mv-photo ${className}`} style={{backgroundImage:`url(${menuDishGrid})`,backgroundPosition:`${position.x}% ${position.y}%`}} role="img" aria-label={`${item?.name||'Dish'} photo`}/>;
}

function CategoryRail({available,active,setActive,categories}){
  const visible=categories.filter(category=>available.some(item=>itemInCategory(item,category.id)));
  return <nav className="mv-categories" aria-label="Photo menu categories"><button type="button" aria-pressed={active==='all'} onClick={()=>setActive('all')}>All dishes</button>{visible.map(category=><button type="button" key={category.id} aria-pressed={active===category.id} onClick={()=>setActive(category.id)}>{category.name}</button>)}</nav>;
}

function DishDetail({item,menu,onClose,onAction}){
  return <section className="mv-detail" aria-label={`${item.name} details`}>
    <div className="mv-detail-bar"><button type="button" onClick={onClose}><ArrowLeft size={17}/>Back</button><button type="button" aria-label="Close dish details" onClick={onClose}><X size={18}/></button></div>
    <DishPhoto item={item} className="mv-detail-photo"/>
    <div className="mv-detail-copy"><span>{itemCategoryIds(item).map(id=>getMenuCategories(menu).find(category=>category.id===id)?.name).filter(Boolean).join(' · ')}</span><h3>{item.name}</h3><p>{item.description}</p>{item.tags.length>0&&<small>{item.tags.join(' · ')}</small>}<div><strong>{menu.currency} {item.price}</strong><button type="button" onClick={()=>onAction(item.name)}><ShoppingBag size={16}/>Add to order</button></div><small className="mv-demo-note">Ordering is shown as a preview until payments and the kitchen connection are added.</small></div>
  </section>;
}

export function VisualGuestMenu({menu,onAction=()=>{},full=false}){
  const available=menu.items.filter(item=>item.available),featured=available.find(item=>item.featured)||available[0],[active,setActive]=useState('all'),[selected,setSelected]=useState(null),categories=getMenuCategories(menu);
  const shown=active==='all'?available:available.filter(item=>itemInCategory(item,active));
  if(selected)return <article className={`mn-visual-menu${full?' mn-visual-menu-full':''}`} style={menuBrandStyle(menu)} data-menu-font={menu.brand?.font||'editorial'} aria-label="Photo menu preview"><DishDetail item={selected} menu={menu} onClose={()=>setSelected(null)} onAction={onAction}/></article>;
  return <article className={`mn-visual-menu${full?' mn-visual-menu-full':''}`} style={menuBrandStyle(menu)} data-menu-font={menu.brand?.font||'editorial'} aria-label="Photo menu preview">
    <header className="mv-header"><span><b>MSC</b><i><strong>Marina Social Club</strong><small>Seafront kitchen</small></i></span><span className="mv-open"><i/>Open now</span></header>
    <div className="mv-search"><Search size={16}/><span>Search dishes</span><small>{available.length} available</small></div>
    {featured&&<button type="button" className="mv-feature" onClick={()=>setSelected(featured)}><DishPhoto item={featured}/><span><small><Star size={12}/>Today’s favourite</small><strong>{featured.name}</strong><p>{featured.description}</p><b>{menu.currency} {featured.price}<ChevronRight size={15}/></b></span></button>}
    <CategoryRail available={available} active={active} setActive={setActive} categories={categories}/>
    <section className="mv-list-head"><span>{active==='all'?'Made for today':categories.find(category=>category.id===active)?.name}</span><small>{shown.length} {shown.length===1?'dish':'dishes'}</small></section>
    <div className="mv-card-grid">{shown.map(item=><button type="button" className="mv-card" key={item.id} onClick={()=>setSelected(item)}><DishPhoto item={item}/><span><strong>{item.name}</strong><p>{item.description}</p><i>{item.tags[0]||'House favourite'}</i><b>{menu.currency} {item.price}</b></span><em aria-hidden="true"><Plus size={15}/></em></button>)}</div>
    <footer className="mv-footer"><span>Marina Social Club</span><small>{menu.serviceNote}</small></footer>
  </article>;
}

export function CounterMenu({menu,onAction=()=>{},full=false}){
  const available=menu.items.filter(item=>item.available),featured=available.find(item=>item.featured)||available[0];
  const categories=getMenuCategories(menu),categoryGroups=useMemo(()=>categories.map(category=>({...category,items:available.filter(item=>itemInCategory(item,category.id))})).filter(group=>group.items.length),[available,categories]);
  return <article className={`mn-counter-menu${full?' mn-counter-menu-full':''}`} style={menuBrandStyle(menu)} data-menu-font={menu.brand?.font||'editorial'} aria-label="Counter display preview">
    <header><span><b>MSC</b><i><strong>Marina Social Club</strong><small>Order here, collect by the water</small></i></span><div><Clock3 size={15}/><strong>Serving now</strong><small>{menu.serviceNote}</small></div></header>
    <div className="mc-board">
      {featured&&<button type="button" className="mc-feature" onClick={()=>onAction(featured.name)}><DishPhoto item={featured}/><span><small>Chef’s pick</small><strong>{featured.name}</strong><p>{featured.description}</p><b>{menu.currency} {featured.price}</b></span></button>}
      <div className="mc-groups">{categoryGroups.map(group=><section key={group.id}><header><span>{group.name}</span><small>{group.note}</small></header>{group.items.map(item=><button type="button" key={item.id} onClick={()=>onAction(item.name)}><DishPhoto item={item}/><span><strong>{item.name}</strong><small>{item.tags[0]||item.description}</small></span><b>{menu.currency} {item.price}</b></button>)}</section>)}</div>
    </div>
    <footer><span><Check size={14}/>Prices include VAT</span><strong>Ask us about allergies</strong><small>Menu kept fresh with Tawaslo</small></footer>
  </article>;
}

export function PhotoPicker({selected,onSelect}){
  return <div className="mv-photo-picker" aria-label="Dish photo">{Array.from({length:9},(_,index)=><button type="button" key={index} aria-pressed={selected===index} onClick={()=>onSelect(index)}><DishPhoto item={{name:`Photo ${index+1}`,photo:index}}/><span>Photo {index+1}</span></button>)}</div>;
}
