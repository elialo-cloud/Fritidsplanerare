(function(){
  const KEY='fritidsplanerare-v1';
  const uid=()=>{try{if(window.crypto&&crypto.randomUUID)return crypto.randomUUID()}catch(e){}return 'a-'+Date.now()+'-'+Math.random().toString(36).slice(2)};
  const pad=n=>String(n).padStart(2,'0');
  const dateStr=d=>d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());
  const today=()=>dateStr(new Date());
  function nextMonday(){const d=new Date();const day=d.getDay();const add=day===0?1:day===1?0:8-day;d.setDate(d.getDate()+add);return dateStr(d)}
  function load(){try{return JSON.parse(localStorage.getItem(KEY))||{days:[],people:[],selected:null}}catch(e){return {days:[],people:[],selected:null}}}
  function save(s){localStorage.setItem(KEY,JSON.stringify(s))}
  function defaultDay(date,name){return {id:uid(),date,type:name||'Övrigt',name:name||'',children:0,responsible:'',activities:[],lunch:'11:30 – Matsal',snack:'14:30 – Fritids',materials:[],todos:[]}}
  function openModal(){
    const modal=document.getElementById('modal'),card=document.getElementById('modalCard');if(!modal||!card)return;
    card.innerHTML='<div class="simple-create"><button class="simple-close" id="scClose" aria-label="Stäng">×</button><h2>Ny planering</h2><p>Vad vill du skapa?</p><div class="simple-choice"><button data-mode="day"><span>📅</span>Dag</button><button data-mode="week"><span>📆</span>Vecka</button></div></div>';
    modal.classList.remove('hidden');
    card.querySelector('#scClose').onclick=close;
    card.querySelectorAll('[data-mode]').forEach(b=>b.onclick=()=>showForm(b.dataset.mode));
  }
  function close(){document.getElementById('modal')?.classList.add('hidden')}
  function showForm(mode){
    const card=document.getElementById('modalCard');
    if(mode==='day'){
      card.innerHTML='<div class="simple-create"><button class="simple-close" id="scClose" aria-label="Stäng">×</button><h2>Ny dag</h2><div class="simple-form"><label>Datum<input id="scDate" type="date" value="'+today()+'"></label><label>Namn<input id="scName" type="text" value="Höstlov" placeholder="T.ex. Höstlov"></label></div><div class="simple-actions"><button class="secondary" id="scBack">Tillbaka</button><button class="primary" id="scCreate">Skapa</button></div></div>';
    }else{
      card.innerHTML='<div class="simple-create"><button class="simple-close" id="scClose" aria-label="Stäng">×</button><h2>Ny vecka</h2><div class="simple-form"><label>Från<input id="scFrom" type="date" value="'+nextMonday()+'"></label><label>Till<input id="scTo" type="date" value="'+dateStr(new Date(nextMonday()+'T12:00:00').setDate(new Date(nextMonday()+'T12:00:00').getDate()+4))+'"></label><label class="full">Namn<input id="scName" type="text" value="Höstlov" placeholder="T.ex. Höstlov"></label></div><div class="simple-actions"><button class="secondary" id="scBack">Tillbaka</button><button class="primary" id="scCreate">Skapa</button></div></div>';
    }
    card.querySelector('#scClose').onclick=close;
    card.querySelector('#scBack').onclick=openModal;
    card.querySelector('#scCreate').onclick=()=>create(mode);
  }
  function create(mode){
    const card=document.getElementById('modalCard');
    const name=(card.querySelector('#scName')?.value||'Övrigt').trim()||'Övrigt';
    const dates=[];
    if(mode==='day'){
      const date=card.querySelector('#scDate')?.value;if(!date)return;
      dates.push(date);
    }else{
      const from=card.querySelector('#scFrom')?.value,to=card.querySelector('#scTo')?.value;if(!from||!to||from>to)return;
      const d=new Date(from+'T12:00:00'),end=new Date(to+'T12:00:00');
      while(d<=end){dates.push(dateStr(d));d.setDate(d.getDate()+1)}
    }
    const s=load();if(!Array.isArray(s.days))s.days=[];
    const created=dates.map(date=>{const day=defaultDay(date,name);s.days.push(day);return day});
    s.selected=created[0].id;save(s);close();
    if(typeof window.openDay==='function')window.openDay(created[0].id);else location.reload();
  }
  function intercept(e){const t=e.target.closest?.('#newDay,#newDay2,.day-card button[onclick="newDay()"]');if(!t)return;e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();openModal()}
  document.addEventListener('click',intercept,true);
  document.addEventListener('click',e=>{if(e.target===document.getElementById('modal'))close()});
})();
