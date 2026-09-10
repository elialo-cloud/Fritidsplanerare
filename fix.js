/* Interaction + week-planning layer. Loaded after app.js. */
(function(){
  const weekBtn=document.createElement('button');
  weekBtn.textContent='Veckoplanering';
  weekBtn.onclick=()=>showWeek();
  document.querySelector('.top-actions')?.before(weekBtn);

  window.addDays=(d,n)=>{const x=new Date(d+'T12:00:00');x.setDate(x.getDate()+n);return x.toISOString().slice(0,10)};
  window.mondayOf=d=>{const x=new Date(d+'T12:00:00'),day=x.getDay()||7;x.setDate(x.getDate()-day+1);return x.toISOString().slice(0,10)};
  window.showWeek=d=>{state.selected=null;state.weekDate=mondayOf(d||state.weekDate||new Date().toISOString().slice(0,10));save();renderWeek()};
  window.renderWeek=()=>{
    const mon=state.weekDate, days=Array.from({length:7},(_,i)=>addDays(mon,i));
    const cells=days.map(d=>{const day=state.days.find(x=>x.date===d);const acts=day?[...day.activities].sort((a,b)=>mins(a.start)-mins(b.start)):[];
      return `<section class="week-day ${day?'has-day':'empty-day'}"><button class="week-day-head" onclick="${day?`openDay('${day.id}')`:`createWeekDay('${d}')`}"><span>${shortWeekDate(d)}</span><b>${day?esc(day.type):'＋ Skapa dag'}</b></button>${day?acts.map(a=>`<button class="week-block" onclick="openDay('${day.id}')"><strong>${esc(a.emoji||'✦')} ${esc(a.name)}</strong><small>${a.start}–${a.end}</small></button>`).join(''):`<button class="week-add" onclick="createWeekDay('${d}')">＋ Lägg till dag</button>`}</section>`;
    }).join('');
    document.getElementById('main').innerHTML=`<div class="week-page"><div class="week-head"><div><button class="back" onclick="home()">← Dagar</button><div class="kicker">Veckoöversikt</div><h1>Veckoplanering</h1><p>${esc(dateLabel(mon))} – ${esc(dateLabel(addDays(mon,6)))}</p></div><div class="week-nav"><button class="secondary" onclick="showWeek(addDays(state.weekDate,-7))">← Förra veckan</button><button class="secondary" onclick="showWeek(new Date().toISOString().slice(0,10))">Idag</button><button class="secondary" onclick="showWeek(addDays(state.weekDate,7))">Nästa vecka →</button></div></div><div class="week-grid">${cells}</div></div>`;
  };
  window.shortWeekDate=d=>new Date(d+'T12:00:00').toLocaleDateString('sv-SE',{weekday:'short',day:'numeric',month:'short'});
  window.createWeekDay=date=>{const d={id:uid(),date,type:'Övrigt',children:0,responsible:'',activities:[],lunch:'11:30',snack:'14:30',notes:'',materials:'',todos:''};d.date=date;state.days.push(d);state.selected=d.id;state.weekDate=null;save();renderEditor()};

  const originalRenderHome=window.renderHome;
  window.renderHome=function(){originalRenderHome();const h=document.querySelector('.home-head');if(h&&!h.querySelector('.week-home-btn')){const b=document.createElement('button');b.className='secondary week-home-btn';b.textContent='▦ Veckoplanering';b.onclick=()=>showWeek();h.querySelector('div')?.after(b)}};

  window.attachScheduleEvents=function(){
    const s=document.querySelector('#schedule'); if(!s)return;
    document.querySelectorAll('.activity-block').forEach(el=>el.addEventListener('pointerdown',startDragFix));
    s.addEventListener('pointermove',moveFix);s.addEventListener('pointerup',upFix);s.addEventListener('pointercancel',cancelFix);
    s.addEventListener('click',e=>{const b=e.target.closest('.activity-block');if(b&&!dragFix?.moved)openActivity(b.dataset.id)});
  };
  let dragFix=null;
  function startDragFix(e){if(e.target.closest('.delete'))return;const el=e.currentTarget,a=getDay().activities.find(x=>x.id===el.dataset.id);if(!a)return;dragFix={kind:'move',id:a.id,startY:e.clientY,baseTop:(mins(a.start)-START*60)*(HOUR/60),duration:mins(a.end)-mins(a.start),moved:false,el};el.classList.add('dragging');el.setPointerCapture?.(e.pointerId);document.body.style.userSelect='none';e.preventDefault()}
  window.paletteDown=function(e,i){if(e.button!==undefined&&e.button!==0)return;const t=tools[i];const g=document.createElement('div');g.className='drag-ghost';g.textContent=t.e+' '+t.n;document.body.appendChild(g);dragFix={kind:'new',tool:i,startY:e.clientY,moved:false,ghost:g};document.body.style.userSelect='none';e.preventDefault()};
  function moveFix(e){if(!dragFix)return;const s=document.querySelector('#schedule'),r=s.getBoundingClientRect();dragFix.moved=dragFix.moved||Math.abs(e.clientY-dragFix.startY)>5;if(dragFix.kind==='new'){dragFix.ghost.style.left=e.clientX+14+'px';dragFix.ghost.style.top=e.clientY+14+'px'}if(e.clientY<r.top||e.clientY>r.bottom)return;const duration=dragFix.kind==='move'?dragFix.duration:60;const start=Math.max(START*60,Math.min(END*60-duration,START*60+Math.round((e.clientY-r.top)/HOUR)*60));const top=(start-START*60)*(HOUR/60);const line=document.querySelector('#dropLine');if(line){line.style.top=top+'px';line.style.opacity='1'}if(dragFix.kind==='move')dragFix.el.style.transform=`translateY(${top-dragFix.baseTop}px)`}
  function upFix(e){if(!dragFix)return;const s=document.querySelector('#schedule'),r=s.getBoundingClientRect(),inside=e.clientY>=r.top&&e.clientY<=r.bottom;if(inside){const duration=dragFix.kind==='move'?dragFix.duration:60,start=Math.max(START*60,Math.min(END*60-duration,START*60+Math.round((e.clientY-r.top)/HOUR)*60));if(dragFix.kind==='new'){const t=tools[dragFix.tool];addActivity({name:t.n,emoji:t.e,placeType:t.p,material:t.m,start:tm(start),end:tm(start+duration)})}else if(dragFix.moved){const a=getDay().activities.find(x=>x.id===dragFix.id);a.start=tm(start);a.end=tm(start+duration);save();renderEditor()}}cancelFix()}
  function cancelFix(){if(dragFix?.ghost)dragFix.ghost.remove();document.querySelectorAll('.dragging').forEach(x=>{x.classList.remove('dragging');x.style.transform='' });const line=document.querySelector('#dropLine');if(line){line.style.opacity='0';line.style.top=''}dragFix=null;document.body.style.userSelect=''}
})();
