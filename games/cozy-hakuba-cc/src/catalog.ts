import manifest from '../content/asset-manifest.json';

type Asset = (typeof manifest.assets)[number] & { season?: string };

const grid = document.getElementById('grid')!;
const filters = document.getElementById('filters')!;
const palette = document.getElementById('palette')!;
document.getElementById('sub')!.textContent = `${manifest.assets.length} assets · style ${manifest.style} · replace any asset by keeping its id, size and anchor.`;

for (const [name, hex] of Object.entries(manifest.palette)) {
  palette.insertAdjacentHTML('beforeend', `<div class="sw"><i style="background:${hex}"></i>${name}</div>`);
}

const roles = ['all', ...new Set(manifest.assets.map((a) => a.role))];
let active = 'all';

function render() {
  grid.innerHTML = '';
  for (const a of manifest.assets as Asset[]) {
    if (active !== 'all' && a.role !== active) continue;
    grid.insertAdjacentHTML(
      'beforeend',
      `<div class="card"><div class="stage"><img src="/assets/${a.file}" alt="${a.id}"></div>
       <div class="meta"><div class="id">${a.id}</div>
       <span class="role">${a.role}</span>${a.season ? `<span class="role">${a.season}</span>` : ''}<span class="role">${a.w}×${a.h}</span>
       <div class="purpose">${a.purpose}</div></div></div>`,
    );
  }
  filters.querySelectorAll('button').forEach((b) => b.classList.toggle('on', b.dataset.role === active));
}

for (const r of roles) {
  const b = document.createElement('button');
  b.textContent = r;
  b.dataset.role = r;
  b.onclick = () => { active = r; render(); };
  filters.appendChild(b);
}
render();
