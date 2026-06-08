document.addEventListener('DOMContentLoaded', async () => {
  await renderSongs();
  await renderMusisi();
  renderGenre();
  scrollReveal();
  animateProgress();
});

async function renderSongs() {
  const grid = document.getElementById('songGrid');
  if (!grid) return;
  try {
    const songs = (await API.songs.all({ status: 'published' })).slice(0, 6);
    grid.innerHTML = songs.map(s => `
      <div class="bg-[#16161f] border border-[#222230] rounded-2xl p-5 card-hover group cursor-pointer" onclick="playSong('${s.id}')">
        <div class="flex items-center gap-4 mb-4">
          <div class="w-14 h-14 rounded-xl bg-gradient-to-br from-orange-500/30 to-yellow-500/20 flex items-center justify-center text-3xl flex-shrink-0">${s.cover}</div>
          <div class="flex-1 min-w-0">
            <h4 class="font-semibold text-white text-sm truncate font-[Syne]">${s.title}</h4>
            <p class="text-gray-400 text-xs mt-0.5">${s.musisiName}</p>
            <span class="text-xs text-[#ff5e3a] bg-[#ff5e3a]/10 px-2 py-0.5 rounded-full mt-1 inline-block">${s.genre}</span>
          </div>
          <button class="w-9 h-9 rounded-full bg-[#ff5e3a] opacity-0 group-hover:opacity-100 transition flex items-center justify-center play-btn flex-shrink-0">
            <i class="fa-solid fa-play text-white text-xs"></i>
          </button>
        </div>
        <div class="flex items-center justify-between text-xs text-gray-500">
          <span><i class="fa-solid fa-headphones mr-1"></i>${fmtNum(s.streams)} stream</span>
          <span><i class="fa-solid fa-heart mr-1 text-[#ff5e3a]"></i>${fmtNum(s.likes)}</span>
          <span><i class="fa-regular fa-clock mr-1"></i>${s.duration}</span>
        </div>
      </div>
    `).join('');
  } catch (e) { console.error('Gagal load lagu:', e); }
}

async function renderMusisi() {
  const grid = document.getElementById('musisiGrid');
  if (!grid) return;
  try {
    const list = (await API.musisi.all()).slice(0, 4);
    grid.innerHTML = list.map(m => `
      <div class="bg-[#16161f] border border-[#222230] rounded-2xl p-6 text-center card-hover">
        <div class="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500/30 to-blue-500/20 flex items-center justify-center text-4xl mx-auto mb-4">${m.cover}</div>
        ${m.verified ? '<div class="inline-flex items-center gap-1 bg-[#ff5e3a]/10 text-[#ff5e3a] text-xs px-2 py-0.5 rounded-full mb-2"><i class="fa-solid fa-check text-xs"></i> Verified</div>' : ''}
        <h4 class="font-[Syne] font-bold text-white text-sm mb-0.5">${m.name}</h4>
        <p class="text-gray-500 text-xs mb-1">${m.genre}</p>
        <p class="text-gray-500 text-xs mb-3"><i class="fa-solid fa-location-dot mr-1"></i>${m.kota}</p>
        <div class="flex justify-around text-center text-xs">
          <div><div class="font-bold text-white">${fmtNum(m.followers)}</div><div class="text-gray-500">Fans</div></div>
          <div><div class="font-bold text-white">${m.songs}</div><div class="text-gray-500">Lagu</div></div>
          <div><div class="font-bold text-white">${fmtNum(m.streams)}</div><div class="text-gray-500">Stream</div></div>
        </div>
      </div>
    `).join('');
  } catch (e) { console.error('Gagal load musisi:', e); }
}

function renderGenre() {
  const grid = document.getElementById('genreGrid');
  if (!grid) return;
  const genres = [
    { name:'Indie Folk',icon:'🎸',color:'from-green-500/20 to-emerald-500/10',count:128 },
    { name:'Jazz Lokal',icon:'🎷',color:'from-blue-500/20 to-cyan-500/10',count:74 },
    { name:'Pop Alternatif',icon:'🎹',color:'from-purple-500/20 to-pink-500/10',count:210 },
    { name:'R&B Lokal',icon:'🎤',color:'from-orange-500/20 to-red-500/10',count:96 },
    { name:'Dangdut Modern',icon:'🥁',color:'from-yellow-500/20 to-amber-500/10',count:185 },
    { name:'Keroncong',icon:'🪕',color:'from-rose-500/20 to-pink-500/10',count:42 },
    { name:'Hip-Hop Lokal',icon:'🎧',color:'from-slate-500/20 to-gray-500/10',count:133 },
    { name:'Elektronik',icon:'🎛️',color:'from-indigo-500/20 to-blue-500/10',count:67 },
  ];
  grid.innerHTML = genres.map(g => `
    <div class="bg-gradient-to-br ${g.color} border border-white/5 rounded-2xl p-5 card-hover cursor-pointer group">
      <div class="text-3xl mb-3">${g.icon}</div>
      <h4 class="font-[Syne] font-semibold text-white text-sm mb-1">${g.name}</h4>
      <p class="text-gray-500 text-xs">${g.count} lagu</p>
    </div>
  `).join('');
}

function scrollReveal() {
  const els = document.querySelectorAll('.scroll-reveal');
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
  }, { threshold: 0.1 });
  els.forEach(el => obs.observe(el));
}

function animateProgress() {
  setTimeout(() => { const bar = document.getElementById('progressBar'); if (bar) bar.style.width='45%'; }, 500);
}

function playSong(id) { window.location.href = `pages/user-dashboard.html?play=${id}`; }
