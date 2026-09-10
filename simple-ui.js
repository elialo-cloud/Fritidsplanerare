(function(){
  function enhance(){
    const timeline=document.querySelector('.timeline');
    if(!timeline) return;

    timeline.addEventListener('dragover',function(e){e.preventDefault();const row=e.target.closest('.activity-row');document.querySelectorAll('.activity-row').forEach(x=>x.classList.remove('drag-over'));if(row&&!row.classList.contains('dragging'))row.classList.add('drag-over')});
    timeline.addEventListener('dragleave',function(e){if(!timeline.contains(e.relatedTarget))document.querySelectorAll('.activity-row').forEach(x=>x.classList.remove('drag-over'))});
    timeline.addEventListener('drop',function(e){
      e.preventDefault();
      const id=e.dataTransfer.getData('activity-id');
      const template=e.dataTransfer.getData('template-index');
      if(template){if(typeof addTemplate==='function')addTemplate(Number(template));return}
      if(!id||!state.selected)return;
      const d=state.days.find(x=>x.id===state.selected);if(!d)return;
      const from=d.activities.findIndex(a=>a.id===id);if(from<0)return;
      const target=e.target.closest('.activity-row');
      if(target&&target.dataset.activityId!==id){
        const to=d.activities.findIndex(a=>a.id===target.dataset.activityId);
        const [item]=d.activities.splice(from,1);d.activities.splice(to,0,item);
      }
      d.activities.forEach((a,i)=>{if(i===0&&min(a.start)<480)a.start='08:00';});
      save();renderEditor();renderStats();
    });

    timeline.querySelectorAll('.activity-row').forEach(row=>{
      const id=row.querySelector('.remove')?.getAttribute('onclick')?.match(/'([^']+)'/)?.[1];
      if(!id)return;
      row.dataset.activityId=id;row.draggable=true;
      row.addEventListener('dragstart',function(e){e.dataTransfer.effectAllowed='move';e.dataTransfer.setData('activity-id',id);row.classList.add('dragging')});
      row.addEventListener('dragend',function(){row.classList.remove('dragging');document.querySelectorAll('.drag-over').forEach(x=>x.classList.remove('drag-over'))});
    });
  }

  function addQuickTray(){
    const section=document.querySelector('.section-head');
    if(!section||document.getElementById('quickTray'))return;
    const tray=document.createElement('div');tray.id='quickTray';tray.className='quick-tray';
    tray.innerHTML='<span>Dra in:</span>'+(templates||[]).slice(0,6).map((t,i)=>`<button class="quick-template" draggable="true" data-template="${i}">${t[0]} ${t[1]}</button>`).join('');
    section.after(tray);
    tray.querySelectorAll('.quick-template').forEach(btn=>btn.addEventListener('dragstart',e=>{e.dataTransfer.setData('template-index',btn.dataset.template);e.dataTransfer.effectAllowed='copy'}));
  }

  const oldRenderEditor=window.renderEditor;
  if(typeof oldRenderEditor==='function'){
    window.renderEditor=function(){oldRenderEditor();addQuickTray();enhance()};
  }

  document.addEventListener('DOMContentLoaded',function(){
    state.selected=null;save();
    if(typeof show==='function')show('dashboard');
    if(typeof render==='function')render();
    setTimeout(function(){
      const old=window.renderEditor;
      if(old&&old!==window.__simpleWrapped){window.__simpleWrapped=old;}
      addQuickTray();enhance();
    },50);
  });
})();