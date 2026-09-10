(function(){
  const KEY='fritidsplanerare-v1';
  const BANK=[['🎨','Pyssel','Inne'],['⚽','Fotboll','Ute'],['🏃','Hinderbana','Ute'],['🎲','Brädspel','Inne'],['🌲','Skogsutflykt','Ute'],['🎬','Film','Inne'],['📚','Högläsning','Inne'],['🧁','Bakning','Inne'],['🎵','Dans & musik','Inne']];
  const TIMES=[];
  for(let m=480;m<960;m+=30) TIMES.push(String(Math.floor(m/60)).padStart(2,'0')+':'+String(m%60).padStart(2,'0'));
  const mins=t=>{const p=String(t||'08:00').split(':').map(Number);return (p[0]||0)*60+(p[1]||0)};
  const time=m=>{m=Math.max(480,Math.min(1439,m));return String(Math.floor(m/60)).padStart(2,'0')+':'+String(m%60).padStart(2,'0')};
  const uid=()=>{try{if(window.crypto&&crypto.randomUUID)return crypto.randomUUID()}catch(e){}return 'a-'+Date.now()+'-'+Math.random().toString(36).slice(2)};
  const esc=s=>String(s??'').replace(/[&<>\\"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','\\"':'&quot;',"'":'&#039;'}[m]));
  function state(){try{return JSON.parse(localStorage.getItem(KEY))||{days:[]}}catch(e){return {days:[]}}}
  function currentDay(){const s=state();return (s.days||[]).find(d=>d.id===s.selected)||null}
  function saveDay(day){const s=state();const i=(s.days||[]).findIndex(d=>d.id===day.id);if(i<0)return;s.days[i]=day;localStorage.setItem(KEY,JSON.stringify(s))}
  function makeActivity(name,placeType,start){return {id:uid(),start:start,end:time(mins(start)+60),name:name,placeType:placeType,place:'Fritids',group:'Alla',staff:[],material:'',description:'',safety:''}}
  function activityCard(a){
    const top=((mins(a.start)-480)/30)*56;
    const height=Math.max(58,((mins(a.end)-mins(a.start))/30)*56-6);
    return '<div class="dnd-card '+(a.placeType==='Ute'?'outside':'inside')+'" draggable="true" data-id="'+esc(a.id)+'" style="top:'+top+'px;height:'+height+'px">'+
      '<span class="dnd-card-icon">'+(a.placeType==='Ute'?'☀':'✦')+'</span><div><strong>'+esc(a.name)+'</strong><small>'+esc(a.start)+'–'+esc(a.end)+'</small></div><button type="button" class="dnd-delete" data-delete="'+esc(a.id)+'">×</button></div>';
  }
  function renderPlanner(){
    const host=document.getElementById('editorView');
    const d=currentDay();
    if(!host||!d)return;
    const acts=(d.activities||[]).slice().sort((a,b)=>mins(a.start)-mins(b.start));
    host.innerHTML='<div class="dnd-planner">'+
      '<div class="dnd-top"><div><div class="eyebrow">PLANERINGSTAVLA</div><h2>'+esc(new Date(d.date+'T12:00:00').toLocaleDateString('sv-SE',{weekday:'long',day:'numeric',month:'long'}))+'</h2><p>Dra en aktivitet till rätt tid. Den sparas direkt.</p></div><div class="dnd-top-actions"><button class="secondary" onclick="closeEditor()">Tillbaka</button><button class="primary" onclick="exportWord()">📄 Word</button></div></div>'+ 
      '<div class="dnd-layout"><aside class="activity-bank"><div class="bank-title">AKTIVITETER</div><div class="bank-help">Dra → släpp på tiden</div>'+BANK.map((x,i)=>'<div class="bank-item" draggable="true" data-bank="'+i+'"><span>'+x[0]+'</span><strong>'+x[1]+'</strong><small>'+x[2]+'</small></div>').join('')+'</aside>'+ 
      '<section class="timeline"><div class="timeline-head">'+TIMES.map(t=>'<div class="time-head">'+t+'</div>').join('')+'</div><div class="timeline-body">'+TIMES.map(t=>'<div class="drop-row" data-time="'+t+'"><div class="row-time">'+t+'</div><div class="drop-zone" data-drop-time="'+t+'"></div></div>').join('')+acts.map(activityCard).join('')+'</div></section></div></div>';
    wirePlanner(host);
  }
  function clearDragState(host){
    if(host)host.querySelectorAll('.dragging,.drag-over').forEach(x=>x.classList.remove('dragging','drag-over'));
    try{document.body.classList.remove('is-dragging')}catch(e){}
  }
  function wirePlanner(host){
    host.querySelectorAll('.bank-item').forEach(item=>item.addEventListener('dragstart',e=>{
      e.stopPropagation();
      e.dataTransfer.clearData();
      e.dataTransfer.setData('text/plain','bank:'+item.dataset.bank);
      e.dataTransfer.effectAllowed='copy';
      item.classList.add('dragging');
      document.body.classList.add('is-dragging');
    }));
    host.querySelectorAll('.dnd-card').forEach(card=>card.addEventListener('dragstart',e=>{
      if(e.target.closest('.dnd-delete')){e.preventDefault();return}
      e.stopPropagation();
      e.dataTransfer.clearData();
      e.dataTransfer.setData('text/plain','act:'+card.dataset.id);
      e.dataTransfer.effectAllowed='move';
      card.classList.add('dragging');
      document.body.classList.add('is-dragging');
    }));
    host.addEventListener('dragend',()=>clearDragState(host));

    host.querySelectorAll('.drop-row').forEach(row=>{
      row.addEventListener('dragover',e=>{
        e.preventDefault();
        e.stopPropagation();
        e.dataTransfer.dropEffect='move';
        row.classList.add('drag-over');
      });
      row.addEventListener('dragleave',e=>{
        if(!row.contains(e.relatedTarget))row.classList.remove('drag-over');
      });
      row.addEventListener('drop',e=>{
        e.preventDefault();
        e.stopPropagation();
        const payload=e.dataTransfer.getData('text/plain');
        row.classList.remove('drag-over');
        clearDragState(host);
        dropAt(payload,row.dataset.time);
      });
    });
    host.querySelectorAll('[data-delete]').forEach(btn=>btn.addEventListener('click',e=>{
      e.preventDefault();e.stopPropagation();removeActivity(btn.dataset.delete);
    }));
  }
  function dropAt(payload,start){
    const d=currentDay();
    if(!d||!payload)return;
    const split=payload.indexOf(':');
    const kind=split<0?payload:payload.slice(0,split);
    const id=split<0?'':payload.slice(split+1);
    d.activities=Array.isArray(d.activities)?d.activities:[];
    if(kind==='bank'){
      const b=BANK[Number(id)];
      if(!b)return;
      d.activities.push(makeActivity(b[1],b[2],start));
      saveDay(d);renderPlanner();
      return;
    }
    if(kind==='act'){
      const a=d.activities.find(x=>x.id===id);
      if(!a)return;
      const duration=Math.max(30,mins(a.end)-mins(a.start));
      a.start=start;a.end=time(mins(start)+duration);
      saveDay(d);renderPlanner();
    }
  }
  function boot(){
    const ev=document.getElementById('editorView');
    if(!ev)return;
    const observer=new MutationObserver(()=>{
      if(!ev.classList.contains('hidden')&&!ev.querySelector('.dnd-planner')&&currentDay())renderPlanner();
    });
    observer.observe(ev,{childList:true,subtree:true});
    if(!ev.classList.contains('hidden')&&currentDay())renderPlanner();
  }
  document.addEventListener('DOMContentLoaded',boot);
  setTimeout(boot,500);
})();
