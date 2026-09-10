/* Enkel blockbyggare ovanpå den befintliga datamodellen. */
(function(){
  const $=s=>document.querySelector(s);
  const esc2=s=>String(s??'').replace(/[&<>\"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[m]));
  const icons={Pyssel:'🎨',Fotboll:'⚽',Hinderbana:'🏃',Brädspel:'🎲',Skogsutflykt:'🌲',Film:'🎬',Högläsning:'📚',Bakning:'🧁','Dans & musik':'🎵'};
  let dragId=null,dragTemplate=null;
  function day(){return state.days.find(d=>d.id===state.selected)}
  function sorted(){return (day()?.activities||[]).slice().sort((a,b)=>min(a.start)-min(b.start))}
  function render(){
    const d=day(),e=$('#editorView'); if(!d||!e)return;
    const acts=sorted();
    const blocks=acts.map(a=>`<div class="block" draggable="true" data-id="${a.id}" style="--h:${Math.max(1,(min(a.end)-min(a.start))/60)}"><div class="block-grip">⠿</div><div class="block-icon">${icons[a.name]||'✨'}</div><div class="block-text"><strong>${esc2(a.name)}</strong><small>${a.start}–${a.end} · ${esc2(a.placeType)}</small></div><button class="block-delete" onclick="event.stopPropagation();removeActivity('${a.id}')">×</button></div>`).join('');
    const palette=templates.map((t,i)=>`<div class="palette-item" draggable="true" data-template="${i}"><span>${t[0]}</span><b>${esc2(t[1])}</b></div>`).join('');
    e.innerHTML=`<div class="block-app"><div class="block-head"><button class="back-simple" onclick="closeEditor()">← Till dagar</button><div><h1>${esc2(dayName(d.date))}</h1><p>${esc2(dateText(d.date))}</p></div><div class="block-head-actions"><button onclick="exportWord()">📄 Word</button></div></div><div class="block-layout"><aside class="palette"><h2>Aktiviteter</h2><p>Dra ett block till schemat.</p>${palette}<button class="plain-add" onclick="addActivity()">＋ Tom aktivitet</button></aside><section class="canvas"><div class="canvas-title"><div><b>Planering</b><span>Dra blocken upp eller ner</span></div><button onclick="addActivity()">＋ Lägg till</button></div><div class="schedule" id="schedule"><div class="drop-line" data-time="08:00"></div>${[8,9,10,11,12,13,14,15,16].map(h=>`<div class="hour" data-hour="${h}"><span>${String(h).padStart(2,'0')}:00</span><div></div></div>`).join('')}${blocks}</div></section></div><div class="block-footer"><label>📅 Datum <input type="date" value="${d.date}" onchange="updateDay('date',this.value)"></label><label>👧 Barn <input type="number" min="0" value="${d.children}" onchange="updateDay('children',this.value)"></label><label>👤 Ansvarig <input value="${esc2(d.responsible)}" placeholder="Namn" onchange="updateDay('responsible',this.value)"></label></div></div>`;
    wire();
  }
  function wire(){
    document.querySelectorAll('.palette-item').forEach(x=>x.addEventListener('dragstart',e=>{dragTemplate=x.dataset.template;e.dataTransfer.setData('text/plain','template')}));
    document.querySelectorAll('.block').forEach(x=>{x.addEventListener('dragstart',e=>{dragId=x.dataset.id;x.classList.add('dragging');e.dataTransfer.setData('text/plain','activity')});x.addEventListener('dragend',()=>{x.classList.remove('dragging');dragId=null;dragTemplate=null})});
    const s=$('#schedule');
    s.addEventListener('dragover',e=>{e.preventDefault();s.classList.add('over')});
    s.addEventListener('dragleave',e=>{if(!s.contains(e.relatedTarget))s.classList.remove('over')});
    s.addEventListener('drop',e=>{e.preventDefault();s.classList.remove('over');const d=day();if(!d)return;const y=e.clientY-s.getBoundingClientRect().top;let hour=Math.max(8,Math.min(16,Math.floor(8+y/76)));const start=tm(hour*60);if(dragTemplate!==null&&dragTemplate!==undefined){addActivity({name:templates[Number(dragTemplate)][1],placeType:templates[Number(dragTemplate)][2],material:templates[Number(dragTemplate)][3],start:start,end:tm(hour*60+60)});dragTemplate=null;return}if(!dragId)return;const a=d.activities.find(x=>x.id===dragId);if(!a)return;a.start=start;a.end=tm(hour*60+Math.max(60,min(a.end)-min(a.start)));d.activities.sort((a,b)=>min(a.start)-min(b.start));save();render();});
    document.querySelectorAll('.block').forEach(x=>x.addEventListener('click',e=>{if(e.target.closest('.block-delete'))return;const a=day().activities.find(a=>a.id===x.dataset.id);if(a)openEdit(a)}));
  }
  function openEdit(a){
    const old=document.getElementById('blockModal');if(old)old.remove();const m=document.createElement('div');m.id='blockModal';m.className='block-modal';m.innerHTML=`<div class="modal-card"><button class="modal-x" onclick="this.closest('.block-modal').remove()">×</button><div class="modal-icon">${icons[a.name]||'✨'}</div><h2>Ändra aktivitet</h2><label>Vad ska ni göra?<input id="bmName" value="${esc2(a.name)}"></label><div class="modal-row"><label>Från<input id="bmStart" type="time" value="${a.start}"></label><label>Till<input id="bmEnd" type="time" value="${a.end}"></label></div><label>Inne eller ute?<select id="bmPlace"><option ${a.placeType==='Inne'?'selected':''}>Inne</option><option ${a.placeType==='Ute'?'selected':''}>Ute</option><option ${a.placeType==='Både'?'selected':''}>Både</option></select></label><label>Personal<input id="bmStaff" value="${esc2(a.staff.join(', '))}" placeholder="Anna, Johan"></label><button class="modal-save" onclick="window.__saveBlock('${a.id}')">Spara</button></div>`;document.body.appendChild(m);
  }
  window.__saveBlock=id=>{const a=day().activities.find(a=>a.id===id);if(!a)return;a.name=$('#bmName').value||'Aktivitet';a.start=$('#bmStart').value;a.end=$('#bmEnd').value;a.placeType=$('#bmPlace').value;a.staff=$('#bmStaff').value.split(',').map(x=>x.trim()).filter(Boolean);save();document.getElementById('blockModal')?.remove();render()};
  const old=window.renderEditor;window.renderEditor=function(){render()};
  document.addEventListener('DOMContentLoaded',()=>{if(state.selected)render()});
})();
