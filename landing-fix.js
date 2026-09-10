(function(){
  function forceDashboard(){
    if(typeof show!=='function')return;
    state.selected=null;
    try{save()}catch(e){}
    show('dashboard');
    if(typeof render==='function')render();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',function(){setTimeout(forceDashboard,0)});
  else setTimeout(forceDashboard,0);
})();
