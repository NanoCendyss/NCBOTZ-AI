const CALCULATOR = `<!doctype html>
<html lang="id">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Kalkulator Sederhana</title>
<style>
*{box-sizing:border-box}
body{margin:0;min-height:100vh;display:grid;place-items:center;background:#050811;font-family:system-ui,sans-serif;color:#e2e8f0}
.calc{width:min(340px,92vw);background:#0b1220;border:1px solid #1e293b;border-radius:20px;padding:24px;box-shadow:0 0 48px rgba(6,182,212,.15)}
.display{background:#050811;border-radius:12px;padding:16px;text-align:right;font-size:2rem;min-height:80px;word-break:break-all;margin-bottom:16px;color:#67e8f9}
.keys{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}
button{border:0;border-radius:12px;padding:16px 0;font-size:1.1rem;background:#111b2e;color:#e2e8f0;cursor:pointer;transition:transform .1s,background .2s}
button:hover{background:#1c2a44}
button:active{transform:scale(.95)}
button.op{background:#0e7490;color:#ecfeff}
button.eq{background:#10b981;color:#03111a;font-weight:600}
</style>
</head>
<body>
<div class="calc">
  <div class="display" id="display">0</div>
  <div class="keys" id="keys"></div>
</div>
<script>
const display = document.getElementById('display');
const keys = document.getElementById('keys');
const layout = ['C', '(', ')', '/', '7', '8', '9', '*', '4', '5', '6', '-', '1', '2', '3', '+', '0', '.', 'DEL', '='];
const operators = ['/', '*', '-', '+', '(', ')'];
let expr = '';

function render() {
  display.textContent = expr || '0';
}

function press(key) {
  if (key === 'C') {
    expr = '';
  } else if (key === 'DEL') {
    expr = expr.slice(0, -1);
  } else if (key === '=') {
    if (/^[0-9+\\-*/().\\s]+$/.test(expr)) {
      try {
        expr = String(Function('"use strict"; return (' + expr + ')')());
      } catch (e) {
        expr = 'Error';
      }
    } else {
      expr = 'Error';
    }
  } else {
    if (expr === 'Error') expr = '';
    expr += key;
  }
  render();
}

layout.forEach((key) => {
  const btn = document.createElement('button');
  btn.textContent = key;
  if (operators.includes(key)) btn.classList.add('op');
  if (key === '=') btn.classList.add('eq');
  btn.addEventListener('click', () => press(key));
  keys.appendChild(btn);
});

document.addEventListener('keydown', (e) => {
  if (/^[0-9+\\-*/().]$/.test(e.key)) press(e.key);
  else if (e.key === 'Enter') press('=');
  else if (e.key === 'Backspace') press('DEL');
  else if (e.key === 'Escape') press('C');
});

render();
</script>
</body>
</html>`

const TODO = `<!doctype html>
<html lang="id">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Daftar Tugas</title>
<style>
*{box-sizing:border-box}
body{margin:0;min-height:100vh;display:grid;place-items:center;background:#050811;font-family:system-ui,sans-serif;color:#e2e8f0;padding:24px}
.card{width:min(440px,100%);background:#0b1220;border:1px solid #1e293b;border-radius:20px;padding:24px}
h1{margin:0 0 8px;font-size:1.5rem}
.count{margin:0 0 16px;color:#94a3b8;font-size:.9rem}
form{display:flex;gap:8px;margin-bottom:16px}
input{flex:1;min-width:0;background:#050811;border:1px solid #1e293b;border-radius:12px;padding:12px;color:#e2e8f0;font:inherit}
input:focus{outline:2px solid #06b6d4;border-color:transparent}
button{border:0;border-radius:12px;padding:12px 16px;font:inherit;cursor:pointer;background:#06b6d4;color:#03111a;font-weight:600;transition:transform .1s}
button:active{transform:scale(.96)}
ul{list-style:none;margin:0;padding:0;display:grid;gap:8px}
li{display:flex;align-items:center;gap:12px;background:#111b2e;border-radius:12px;padding:12px}
li span{flex:1;cursor:pointer;word-break:break-word}
li.done span{text-decoration:line-through;color:#64748b}
li button.del{background:#1e293b;color:#fda4af;font-weight:500;padding:8px 12px}
</style>
</head>
<body>
<div class="card">
  <h1>Daftar Tugas</h1>
  <p class="count" id="count"></p>
  <form id="form">
    <input id="text" placeholder="Tulis tugas baru..." autocomplete="off" required />
    <button type="submit">Tambah</button>
  </form>
  <ul id="list"></ul>
</div>
<script>
const list = document.getElementById('list');
const count = document.getElementById('count');
const form = document.getElementById('form');
const input = document.getElementById('text');
let todos = [];

function render() {
  list.innerHTML = '';
  todos.forEach((todo, index) => {
    const li = document.createElement('li');
    if (todo.done) li.classList.add('done');
    const label = document.createElement('span');
    label.textContent = todo.text;
    label.addEventListener('click', () => { todo.done = !todo.done; render(); });
    const del = document.createElement('button');
    del.className = 'del';
    del.textContent = 'Hapus';
    del.addEventListener('click', () => { todos.splice(index, 1); render(); });
    li.append(label, del);
    list.appendChild(li);
  });
  const open = todos.filter((t) => !t.done).length;
  count.textContent = open + ' tugas belum selesai';
}

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const text = input.value.trim();
  if (!text) return;
  todos.push({ text, done: false });
  input.value = '';
  render();
});

render();
</script>
</body>
</html>`

const TIMER = `<!doctype html>
<html lang="id">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Stopwatch</title>
<style>
*{box-sizing:border-box}
body{margin:0;min-height:100vh;display:grid;place-items:center;background:#050811;font-family:system-ui,sans-serif;color:#e2e8f0}
.wrap{text-align:center;padding:24px}
.time{font-size:clamp(3rem,12vw,5rem);font-variant-numeric:tabular-nums;color:#67e8f9;margin-bottom:24px}
.row{display:flex;gap:12px;justify-content:center;flex-wrap:wrap}
button{border:0;border-radius:12px;padding:14px 28px;font-size:1rem;cursor:pointer;font-weight:600;transition:transform .1s}
button:active{transform:scale(.96)}
#toggle{background:#10b981;color:#03111a}
#reset{background:#1e293b;color:#e2e8f0}
</style>
</head>
<body>
<div class="wrap">
  <div class="time" id="time">00:00.00</div>
  <div class="row">
    <button id="toggle">Mulai</button>
    <button id="reset">Reset</button>
  </div>
</div>
<script>
const timeEl = document.getElementById('time');
const toggle = document.getElementById('toggle');
const reset = document.getElementById('reset');
let elapsed = 0;
let startedAt = null;
let frame = null;

function format(ms) {
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  const hundredths = Math.floor((ms % 1000) / 10);
  const pad = (n) => String(n).padStart(2, '0');
  return pad(minutes) + ':' + pad(seconds) + '.' + pad(hundredths);
}

function tick() {
  timeEl.textContent = format(elapsed + (Date.now() - startedAt));
  frame = requestAnimationFrame(tick);
}

toggle.addEventListener('click', () => {
  if (startedAt === null) {
    startedAt = Date.now();
    toggle.textContent = 'Jeda';
    tick();
  } else {
    elapsed += Date.now() - startedAt;
    startedAt = null;
    cancelAnimationFrame(frame);
    toggle.textContent = 'Lanjut';
  }
});

reset.addEventListener('click', () => {
  elapsed = 0;
  startedAt = null;
  cancelAnimationFrame(frame);
  timeEl.textContent = format(0);
  toggle.textContent = 'Mulai';
});
</script>
</body>
</html>`

const LANDING = `<!doctype html>
<html lang="id">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Aplikasi Web Sederhana</title>
<style>
*{box-sizing:border-box}
body{margin:0;font-family:system-ui,sans-serif;background:#050811;color:#e2e8f0;line-height:1.5}
header{padding:24px 32px;display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #1e293b}
.brand{font-weight:600;color:#67e8f9}
.hero{text-align:center;padding:96px 24px}
h1{font-size:clamp(2rem,6vw,3.5rem);line-height:1.2;margin:0 0 16px}
.hero p{color:#94a3b8;max-width:560px;margin:0 auto 32px}
.cta{background:#06b6d4;color:#03111a;border:0;border-radius:12px;padding:14px 28px;font-size:1rem;font-weight:600;cursor:pointer;transition:transform .15s,background .2s}
.cta:hover{background:#22d3ee;transform:translateY(-2px)}
.features{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:16px;padding:0 32px 64px;max-width:1000px;margin:0 auto}
.feature{background:#0b1220;border:1px solid #1e293b;border-radius:16px;padding:24px}
.feature h3{margin:0 0 8px;color:#10b981}
.feature p{margin:0;color:#94a3b8}
</style>
</head>
<body>
<header><span class="brand">Aplikasi Saya</span></header>
<section class="hero">
  <h1>Selamat datang di halaman baru Anda</h1>
  <p>Halaman ini dibuat otomatis oleh NCBOTZ AI. Ganti teks dan warnanya sesuai kebutuhan Anda.</p>
  <button class="cta" id="cta">Mulai Sekarang</button>
</section>
<section class="features">
  <div class="feature"><h3>Cepat</h3><p>Tampilan ringan yang berjalan lancar di semua perangkat.</p></div>
  <div class="feature"><h3>Responsif</h3><p>Menyesuaikan diri dengan layar ponsel, tablet, dan desktop.</p></div>
  <div class="feature"><h3>Mudah Diubah</h3><p>Semua kode berada dalam satu file sehingga mudah disunting.</p></div>
</section>
<script>
document.getElementById('cta').addEventListener('click', () => {
  document.querySelector('.features').scrollIntoView({ behavior: 'smooth' });
});
</script>
</body>
</html>`

const TEMPLATES = {
  calculator: CALCULATOR,
  todo: TODO,
  timer: TIMER,
  landing: LANDING,
}

export function getTemplate(id) {
  return TEMPLATES[id]
}
