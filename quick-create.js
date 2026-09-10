(function(){
  const TYPES=['Höstlov','Jullov','Sportlov','Påsklov','Sommarlov','Studiedag','Övrigt'];
  const KEY='fritidsplanerare-v1';
  const uid=()=>{try{if(window.crypto&&crypto.randomUUID)return crypto.randomUUID()}catch(e){}return 'a-'+Date.now()+'-'+Math.random().toString(36).slice(2)};
  const pad=n=>String(n).padStart(2,'0');
  const dateStr=d=>d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());
  function nextMonday(){const d=new Date();const day=d.getDay();d.setDate(d.getDate()+((8-day)%7||7));return dateStr(d)}
  function today(){return dateStr(new Date())}
  function load(){try{return JSON.parse(localStorage.getItem(KEY))||{days:[],people:[],selected:null}}catch(e){return {days:[],people:[],selected:null}}}
  function save(s){localStorage.setItem(KEY,JSON.stringify(s))}
  function defaultDay(date,type){return {id:uid(),date,type,children:0,responsible:'',activities:[],lunch:'11:30 – Matsal',snack:'14:30 – Fritids',materials:[],todos:[]}}
  function openModal(){
    const modal=document.getElementById('modal'), card=document.getElementById('modalCard'); if(!modal||!card)return;
    card.innerHTML=`<div class="quick-create"><button class="qc-close" id="qcClose" aria-label="Stäng">×</button><div class="qc-kicker">SKAPA PLANERING</div><h2>Vad ska du planera?</h2><p class="qc-lead">Välj ett upplägg. Resten fixar vi åt dig.</p><div class="qc-choice-grid"><button class="qc-choice" data-qc-mode="day"><span>☀️</span><strong>En lovdag</strong><small>Skapa en dag och börja fylla den direkt.</small></button><button class="qc-choice" data-qc-mode="week"><span>📅</span><strong>En lovvecka</strong><small>Skapa måndag–fredag på en gång.</small></button></div></div>`;
    modal.classList.remove('hidden');
    card.querySelector('#qcClose').onclick=close;
    card.querySelectorAll('[data-qc-mode]').forEach(b=>b.onclick=()=>step2(b.dataset.qcMode));
  }
  function close(){document.getElementById('modal')?.classList.add('hidden')}
  function step2(mode){
    const card=document.getElementById('modalCard'); const isWeek=mode==='week';
    card.innerHTML=`<div class="quick-create"><button class="qc-close" id="qcClose" aria-label="Stäng">×</button><div class="qc-kicker">${isWeek?'LOVVECKA':'LOVDAG'}</div><h2>${isWeek?'När börjar lovet?':'När är dagen?'}</h2><div class="qc-form"><label>Första dagen<input id="qcDate" type="date" value="${isWeek?nextMonday():today()}"></label><label>Lov / typ<select id="qcType">${TYPES.map(x=>`<option>${x}</option>`).join('')}</select></label><label>Antal barn<input id="qcChildren" type="number" min="0" placeholder="t.ex. 35"></label><label>Ansvarig<input id="qcResponsible" placeholder="t.ex. Elias"></label></div><div class="qc-preview" id="qcPreview"></div><button class="primary qc-create" id="qcCreate">${isWeek?'✨ Skapa hela lovveckan':'✨ Skapa lovdagen'}</button></div>`;
    card.querySelector('#qcClose').onclick=close;
    const date=card.querySelector('#qcDate'), preview=card.querySelector('#qcPreview');
    function updatePreview(){
      if(!isWeek){preview.textContent='En planeringsdag skapas. Du fyller aktiviteterna efteråt.';return}
      const d=new Date((date.value||nextMonday())+'T12:00:00'),days=[];
      while(days.length<5){if(d.getDay()!==0&&d.getDay()!==6)days.push(new Intl.DateTimeFormat('sv-SE',{weekday:'long',day:'numeric',month:'long'}).format(d));d.setDate(d.getDate()+1)}
      preview.innerHTML='<strong>Det här skapas:</strong> '+days.join(' · ');
    }
    date.addEventListener('input',updatePreview);updatePreview();
    card.querySelector('#qcCreate').onclick=()=>create(mode);
  }
  function create(mode){
    const card=document.getElementById('modalCard'), date=card.querySelector('#qcDate')?.value; if(!date)return;
    const type=card.querySelector('#qcType')?.value||'Övrigt', children=Number(card.querySelector('#qcChildren')?.value)||0, responsible=(card.querySelector('#qcResponsible')?.value||'').trim();
    const s=load(); if(!Array.isArray(s.days))s.days=[];
    const created=[]; let d=new Date(date+'T12:00:00'), count=mode==='week'?5:1;
    while(created.length<count){
      if(mode==='week'&&(d.getDay()===0||d.getDay()===6)){d.setDate(d.getDate()+1);continue}
      const day=defaultDay(dateStr(d),type); day.children=children;day.responsible=responsible;s.days.push(day);created.push(day);d.setDate(d.getDate()+1);
    }
    s.selected=created[0].id;save(s);close();
    if(typeof window.openDay==='function')window.openDay(created[0].id);else location.reload();
  }
  function intercept(e){
    const t=e.target.closest?.('#newDay,#newDay2,.day-card button[onclick="newDay()"]');
    if(!t)return;e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();openModal();
  }
  document.addEventListener('click',intercept,true);
  document.addEventListener('click',e=>{if(e.target===document.getElementById('modal'))close()});
})();
