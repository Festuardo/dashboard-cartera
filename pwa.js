/* © 2026 Fgarcia. Todos los derechos reservados. */
(() => {
 const el=id=>document.getElementById(id);let deferred=null,installed=false,dismissed=false;
 const display=window.matchMedia('(display-mode: standalone)');
 try{dismissed=sessionStorage.getItem('fgCarteraInstallDismissed')==='1'}catch(e){}
 const standalone=()=>installed||display.matches||navigator.standalone===true;
 const sync=()=>{el('installBar').hidden=standalone()||dismissed;el('installApp').hidden=!deferred||standalone()};
 window.addEventListener('beforeinstallprompt',event=>{event.preventDefault();deferred=event;sync()});
 window.addEventListener('appinstalled',()=>{installed=true;deferred=null;sync()});
 display.addEventListener?.('change',sync);
 el('installApp').onclick=async()=>{if(!deferred||standalone())return;const prompt=deferred;deferred=null;sync();try{await prompt.prompt();const choice=await prompt.userChoice;if(choice.outcome==='accepted')installed=true}catch(e){}sync()};
 el('installHelp').onclick=()=>el('installDialog').showModal();el('closeInstallHelp').onclick=()=>el('installDialog').close();
 el('dismissInstall').onclick=()=>{dismissed=true;try{sessionStorage.setItem('fgCarteraInstallDismissed','1')}catch(e){}sync()};
 sync();
 if('serviceWorker' in navigator&&['https:','http:'].includes(location.protocol)){
 window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js',{scope:'./',updateViaCache:'none'}).catch(()=>{}));
 }
})();
