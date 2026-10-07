export function createWorkspace({viewer,refreshIcons,onNotice,extraInsets}){
  const library=document.querySelector('#library-drawer'),details=document.querySelector('#details-drawer');
  const libraryToggle=document.querySelector('#toggle-library'),detailsToggle=document.querySelector('#toggle-details'),focusButton=document.querySelector('#canvas-focus');
  const mobile=()=>innerWidth<=960;
  let state={libraryOpen:true,detailsOpen:false,focus:false},restore=null; // desktop: steps open, details on demand
  try{const saved=JSON.parse(localStorage.getItem('flare-workspace-v1')||'null');if(saved&&typeof saved.libraryOpen==='boolean'&&typeof saved.detailsOpen==='boolean')state={libraryOpen:saved.libraryOpen,detailsOpen:saved.detailsOpen,focus:false};}catch{}
  // phone: the home screen is the animation, so every drawer starts closed
  if(mobile())state={libraryOpen:false,detailsOpen:false,focus:false};
  const scrim=document.querySelector('#drawer-scrim'),header=document.querySelector('.workspace-header');

  function sync(){
    library.hidden=!state.libraryOpen;details.hidden=!state.detailsOpen;
    libraryToggle.setAttribute('aria-expanded',String(state.libraryOpen));detailsToggle.setAttribute('aria-expanded',String(state.detailsOpen));
    focusButton.setAttribute('aria-pressed',String(state.focus));focusButton.setAttribute('aria-label',state.focus?'恢复侧栏':'隐藏所有侧栏');focusButton.title=state.focus?'恢复侧栏 · H':'隐藏所有侧栏 · H';
    document.body.dataset.canvasFocus=String(state.focus);
    if(scrim)scrim.hidden=!(mobile()&&(state.libraryOpen||state.detailsOpen));
    document.body.dataset.drawer=state.libraryOpen?'library':state.detailsOpen?'details':'none';
    const reserve=!mobile(),edge=innerWidth<=600?12:20,left=reserve&&state.libraryOpen?library.getBoundingClientRect().right+20:edge,right=reserve&&state.detailsOpen?innerWidth-details.getBoundingClientRect().left+20:edge;
    document.documentElement.style.setProperty('--canvas-left',`${left}px`);document.documentElement.style.setProperty('--canvas-right',`${right}px`);
    // extra room an overlay keeps for itself (the synced muscle body), framing only
    const extra=extraInsets?.()||{};
    const top=Math.round((header?.getBoundingClientRect().bottom||64)+(mobile()?4:20));
    viewer()?.setFramingInsets({left,right:right+(extra.right||0),top,bottom:Math.max(mobile()?24:46,extra.bottom||0)});
    try{localStorage.setItem('flare-workspace-v1',JSON.stringify({libraryOpen:state.libraryOpen,detailsOpen:state.detailsOpen}));}catch{}
  }
  function setOpen(side,open){
    state[side+'Open']=open;state.focus=false;restore=null;
    if(open&&mobile())state[side==='library'?'detailsOpen':'libraryOpen']=false;
    sync();
  }
  function focus(){
    if(state.focus){state={...restore,focus:false};restore=null;}else{restore={...state};state={libraryOpen:false,detailsOpen:false,focus:true};}
    sync();
  }
  scrim?.addEventListener('click',()=>{state.libraryOpen=false;state.detailsOpen=false;sync();});
  libraryToggle.addEventListener('click',()=>setOpen('library',!state.libraryOpen));detailsToggle.addEventListener('click',()=>setOpen('details',!state.detailsOpen));focusButton.addEventListener('click',focus);
  document.querySelectorAll('[data-close-drawer]').forEach(button=>button.addEventListener('click',()=>{const side=button.dataset.closeDrawer;setOpen(side,false);(side==='library'?libraryToggle:detailsToggle).focus();}));
  document.querySelector('#canvas-fullscreen').addEventListener('click',async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();}catch{onNotice('当前窗口暂不支持浏览器全屏；三维画布已铺满窗口。');}});
  document.addEventListener('fullscreenchange',()=>{const full=!!document.fullscreenElement,button=document.querySelector('#canvas-fullscreen');button.setAttribute('aria-pressed',String(full));button.setAttribute('aria-label',full?'退出全屏':'进入全屏');button.title=full?'退出全屏':'进入全屏';sync();});
  document.addEventListener('keydown',event=>{if(event.key.toLowerCase()==='h'&&!/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)&&!document.querySelector('dialog[open]')&&!viewer()?.poseEditor?.getState().dragging){event.preventDefault();focus();}});
  addEventListener('resize',()=>{if(mobile()&&state.libraryOpen&&state.detailsOpen)state.detailsOpen=false;sync();});
  sync();refreshIcons();
  return {sync,setOpen,focus,getState:()=>({...state}),setMode(mode){document.querySelector('#details-heading').textContent=mode==='transition'?'过渡调整':mode==='pose'?'姿势调整':mode==='motion'?'动作分解':mode==='training'?'练习详情':'肌群与结构';},afterPreset(){if(mobile()){state.libraryOpen=false;state.detailsOpen=false;state.focus=false;sync();}},revealDetails(){setOpen('details',true);}};
}
