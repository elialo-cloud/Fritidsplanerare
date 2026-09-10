(function(){
  function uid(){return (crypto&&crypto.randomUUID)?crypto.randomUUID():'a-'+Date.now()+'-'+Math.random().toString(36).slice(2)}
  function makeDay(){
    try{
      const key='fritidsplanerare-v1';
      let state;
      try{state=JSON.parse(localStorage.getItem(key)||'null')}catch(e){state=null}
      if(!state||typeof state!=='object')state={days:[],people:['Anna','Erik','Sara'],selected:null};
      if(!Array.isArray(state.days))state.days=[];
      if(!Array.isArray(state.people))state.people=['Anna','Erik','Sara'];
      let base=new Date();
      const valid=state.days.filter(d=>d&&typeof d.date==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(d.date));
      if(valid.length){
        const latest=valid.slice().sort((a,b)=>b.date.localeCompare(a.date))[0];
        base=new Date(latest.date+'T12:00:00');
        if(!Number.isNaN(base.getTime()))base.setDate(base.getDate()+1);else base=new Date();
      }
      const d={id:uid(),date:base.toISOString().slice(0,10),type:'Övrigt',children:0,responsible:'',activities:[],lunch:'11:30 – Matsal',snack:'14:30 – Fritids',materials:[],todos:[]};
      state.days.push(d);state.selected=d.id;
      localStorage.setItem(key,JSON.stringify(state));
      location.reload();
    }catch(err){console.error(err);alert('Kunde inte skapa dagen. Testa att ladda om sidan (Ctrl+F5).')}
  }
  window.newDay=makeDay;
  document.addEventListener('DOMContentLoaded',function(){
    const a=document.getElementById('newDay'),b=document.getElementById('newDay2');
    if(a)a.onclick=makeDay;if(b)b.onclick=makeDay;
  });
  if(document.readyState!=='loading'){
    const a=document.getElementById('newDay'),b=document.getElementById('newDay2');
    if(a)a.onclick=makeDay;if(b)b.onclick=makeDay;
  }
})();
