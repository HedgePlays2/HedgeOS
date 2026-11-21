const Widgets = (() => {
  let timer;
  function init() {
    const desktop=document.getElementById('desktop');
    const panel=document.createElement('aside');
    panel.id='widgets-panel';
    panel.innerHTML=`<div class="widgets-top"><h2>Widgets</h2><button type="button" id="widgets-close" aria-label="Close">✕</button></div>
      <div class="widgets-grid">
        <section class="widget-card"><h3>Clock</h3><div class="widget-time" id="widget-time">--:--</div><div class="widget-date" id="widget-date"></div></section>
        <section class="widget-card"><h3>Calendar</h3><div class="widget-calendar" id="widget-calendar"></div></section>
        <section class="widget-card widget-weather"><h3>Weather</h3><button type="button" id="widget-weather-get">Use location for weather</button><p id="widget-weather-result">Weather is optional and only loads after you request it.</p></section>
        <section class="widget-card widget-notes"><h3>Quick Notes</h3><textarea id="widget-notes" placeholder="Jot something down..."></textarea></section>
      </div>`;
    desktop.appendChild(panel);
    const btn=document.getElementById('widgets-btn');
    btn.addEventListener('click',()=>panel.classList.toggle('open'));
    panel.querySelector('#widgets-close').onclick=()=>panel.classList.remove('open');
    const notes=panel.querySelector('#widget-notes');
    try{notes.value=localStorage.getItem('hedgeos-widget-notes')||'';}catch{}
    notes.addEventListener('input',()=>{try{localStorage.setItem('hedgeos-widget-notes',notes.value);}catch{}});
    renderCalendar();
    updateClock();
    timer=setInterval(updateClock,1000);
    panel.querySelector('#widget-weather-get').onclick=getWeather;
    document.addEventListener('click',e=>{if(panel.classList.contains('open')&&!panel.contains(e.target)&&e.target!==btn)panel.classList.remove('open');});
  }
  function updateClock(){const n=new Date();const t=document.getElementById('widget-time');if(!t)return;t.textContent=n.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'});document.getElementById('widget-date').textContent=n.toLocaleDateString([],{weekday:'long',month:'long',day:'numeric'});}
  function renderCalendar(){const el=document.getElementById('widget-calendar');if(!el)return;const now=new Date();const y=now.getFullYear(),m=now.getMonth();const names=['S','M','T','W','T','F','S'];const days=new Date(y,m+1,0).getDate();const start=new Date(y,m,1).getDay();el.innerHTML=names.map(x=>'<span>'+x+'</span>').join('')+Array(start).fill('<span></span>').join('')+Array.from({length:days},(_,i)=>'<span class="'+(i+1===now.getDate()?'today':'')+'">'+(i+1)+'</span>').join('';}
  function getWeather(){const out=document.getElementById('widget-weather-result');if(!navigator.geolocation){out.textContent='Location is unavailable in this browser.';return;}out.textContent='Requesting location…';navigator.geolocation.getCurrentPosition(async pos=>{try{const url='https://api.open-meteo.com/v1/forecast?latitude='+pos.coords.latitude+'&longitude='+pos.coords.longitude+'&current=temperature_2m,weather_code&temperature_unit=fahrenheit';const data=await(await fetch(url)).json();out.textContent='Current temperature: '+Math.round(data.current.temperature_2m)+'°F · Weather code '+data.current.weather_code;}catch{out.textContent='Could not load weather right now.';}},()=>{out.textContent='Location permission was not granted.';},{timeout:10000});}
  return {init};
})();