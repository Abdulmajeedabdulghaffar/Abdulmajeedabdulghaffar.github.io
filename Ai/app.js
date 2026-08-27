const API_BASE = window.IMPERROR_AI_API || 'https://api.imperror.me';
const $ = (id) => document.getElementById(id);
const logs = $('logs');
let timer = null;
let startMs = 0;

function addLog(message, cls='') {
  const el = document.createElement('div');
  el.className = `log ${cls}`;
  el.textContent = message;
  logs.appendChild(el);
  logs.scrollTop = logs.scrollHeight;
}
function setBusy(busy) {
  document.querySelector('.status').classList.toggle('busy', busy);
  $('statusText').textContent = busy ? 'Running' : 'Ready';
  $('startBtn').disabled = busy;
}
function selectedModules() {
  return [...document.querySelectorAll('.checks input:checked')].map(x=>x.value);
}
function renderFindings(items=[]) {
  const box = $('findings');
  box.innerHTML = '';
  if (!items.length) { box.innerHTML = '<div class="empty">No actionable findings in this pass.</div>'; $('findingCount').textContent='0 findings'; return; }
  $('findingCount').textContent = `${items.length} finding${items.length===1?'':'s'}`;
  for (const f of items) {
    const sev = (f.severity || 'low').toLowerCase();
    const card = document.createElement('article');
    card.className='finding';
    card.innerHTML = `<div class="finding-top"><span class="sev ${sev}">${sev.toUpperCase()}</span><h3></h3></div><p></p>`;
    card.querySelector('h3').textContent = f.title || 'Untitled finding';
    card.querySelector('p').textContent = f.description || '';
    box.appendChild(card);
  }
}
$('authMode').addEventListener('change', () => $('cookie').classList.toggle('hidden', $('authMode').value !== 'cookie'));
$('startBtn').addEventListener('click', async () => {
  const target = $('target').value.trim();
  if (!/^https:\/\//i.test(target)) return alert('Use an HTTPS target URL.');
  $('logs').innerHTML=''; renderFindings([]); setBusy(true); startMs=Date.now(); clearInterval(timer); timer=setInterval(()=>{const s=Math.floor((Date.now()-startMs)/1000);$('elapsed').textContent=`${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`},500);
  addLog(`Target accepted: ${target}`);
  addLog('Checking scope and starting browser session…');
  try {
    const body = {target, modules:selectedModules(), cookie:$('authMode').value==='cookie' ? $('cookie').value : null};
    const res = await fetch(`${API_BASE}/api/scan`, {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(body)});
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || 'Scan failed');
    for (const step of (data.activity || [])) addLog(step);
    renderFindings(data.findings || []);
    addLog('Analysis complete.');
  } catch (e) {
    addLog(`Error: ${e.message}`, 'muted');
  } finally { setBusy(false); clearInterval(timer); }
});
