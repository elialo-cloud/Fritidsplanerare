(function(){
  function enhance(){
    const timeline=document.querySelector('.timeline');
    if(!timeline||timeline.dataset.dndReady==='1')return;
    timeline.dataset.dndReady='1';
    timeline.addEventListener('dragover',function(e){e.preventDefault();const row=e.target.closest('.activity-row');document.querySelectorAll('.activity-row').forEach(x=>x.classList.remove('drag-over'));if(row&&!row.classList.contains('dragging'))row.classList.add('drag-over')});
    timeline.addEventListener('drop',function(e){
      e.preventDefault();
      const template=e.dataTransfer.getData('template-index');
      if(template){if(typeof addTemplate==='function')addTemplate(Number(template));return}
      const id=e.dataTransfer.getData('activity-id');if(!id||!state.selected)return;
      const d=state.days.find(x=>x.id===state.selected);if(!d)return;
      const from=d.activities.findIndex(a=>a.id===id);if(from<0)return;
      const target=e.target.closest('.activity-row');
      if(target&&target.dataset.activityId!==id){const to=d.activities.findIndex(a=>a.id===target.dataset.activityId);const item=d.activities.splice(from,1)[0];d.activities.splice(to,0,item)}
      save();renderEditor();renderStats();
    });
    timeline.querySelectorAll('.activity-row').forEach(row=>{
      const id=row.querySelector('.remove')?.getAttribute('onclick')?.match(/'([^']+)'/)?.[1];if(!id)return;
      row.dataset.activityId=id;row.draggable=true;
      row.addEventListener('dragstart',e=>{e.dataTransfer.setData('activity-id',id);e.dataTransfer.effectAllowed='move';row.classList.add('dragging')});
      row.addEventListener('dragend',()=>{row.classList.remove('dragging');document.querySelectorAll('.drag-over').forEach(x=>x.classList.remove('drag-over'))});
    });
  }
  function addQuickTray(){
    const section=document.querySelector('.section-head');if(!section||document.getElementById('quickTray'))return;
    const tray=document.createElement('div');tray.id='quickTray';tray.className='quick-tray';
    tray.innerHTML='<span>Dra in:</span>'+(templates||[]).slice(0,6).map((t,i)=>`<button class="quick-template" draggable="true" data-template="${i}">${t[0]} ${t[1]}</button>`).join('');
    section.after(tray);tray.querySelectorAll('.quick-template').forEach(btn=>btn.addEventListener('dragstart',e=>{e.dataTransfer.setData('template-index',btn.dataset.template);e.dataTransfer.effectAllowed='copy'}));
  }
  function refresh(){addQuickTray();enhance()}
  document.addEventListener('DOMContentLoaded',function(){
    state.selected=null;save();if(typeof show==='function')show('dashboard');if(typeof render==='function')render();
    const editor=document.getElementById('editorView');if(editor)new MutationObserver(()=>setTimeout(refresh,0)).observe(editor,{childList:true,subtree:true});
    setTimeout(refresh,50);
  });
})();