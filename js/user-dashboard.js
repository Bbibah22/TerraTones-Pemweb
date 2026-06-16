// ============================================================
// js/user-dashboard.js — Dashboard Pendengar
// ============================================================

document.addEventListener('DOMContentLoaded', async () => {
  // ── Auth guard ────────────────────────────────────────────
  let cu;
  try {
    cu = await API.auth.me();
    if (!cu) throw new Error('not logged in');
  } catch {
    location.href = 'login.html';
    return;
  }

  document.getElementById('sidebarName').textContent   = cu.name;
  document.getElementById('sidebarAvatar').textContent = cu.avatar;
  document.getElementById('greetingText').textContent  = 'Halo, ' + cu.name.split(' ')[0] + ' 👋';

  let currentGenre      = '';
  let currentSongIndex  = 0;
  let isPlaying         = false;
  let playQueue         = [];
  let progressInterval;
  let fakeProgress      = 0;
  let likedSongs        = new Set(); // Set of song IDs liked by user
  let followedSet       = new Set(); // Set of musisi_id yang difollow user

  // Ambil likes user
  async function fetchLikes() {
    const ids = await API.likes.byUser(cu.id);
    likedSongs = new Set(ids);
  }

  // Ambil following user
  async function fetchFollows() {
    const list = await API.follows.byUser(cu.id);
    followedSet = new Set(list.map(m => m.id));
    // Update badge Feed jika ada following
    const badge = document.getElementById('feedBadge');
    if (badge && followedSet.size > 0) {
      badge.textContent = followedSet.size;
      badge.classList.remove('hidden');
    }
  }

  // ── Tab switching ─────────────────────────────────────────
  window.showTab = function (name, el) {
    document.querySelectorAll('main > div[id^="tab-"]').forEach(d => d.classList.add('hidden'));
    document.getElementById('tab-' + name).classList.remove('hidden');
    document.querySelectorAll('.nav-item').forEach(n => {
      n.classList.remove('active');
      n.classList.add('text-gray-400');
    });
    el.classList.add('active');
    el.classList.remove('text-gray-400');
    if (name === 'liked')  renderLiked();
    if (name === 'feed')   renderFeed();
    if (name === 'musisi') renderMusisi();
    if (name === 'profil') loadProfil();
  };

  // ── UNIFIED DISCOVER SEARCH ───────────────────────────────
  let _discoverSearchTimer = null;
  window.onDiscoverSearch = function (val) {
    const clearBtn = document.getElementById('discoverSearchClear');
    if (clearBtn) clearBtn.classList.toggle('hidden', !val.trim());
    clearTimeout(_discoverSearchTimer);
    _discoverSearchTimer = setTimeout(async () => {
      // Sync nilai ke gigSearchInput (hidden) agar applyGigFilters baca dari sini
      const gigInput = document.getElementById('gigSearchInput');
      if (gigInput) gigInput.value = val;
      // Filter gigs
      applyGigFilters();
      // Filter lagu
      const q = val.trim();
      const params = { status: 'published' };
      if (q) params.q = q;
      if (currentGenre) params.genre = currentGenre;
      const songs = await API.songs.all(params);
      renderDiscover(songs);
      // Banner hasil pencarian di grid lagu
      if (q) {
        const grid = document.getElementById('discoverGrid');
        if (grid) {
          const existing = grid.querySelector('.discover-search-banner');
          if (existing) existing.remove();
          const banner = document.createElement('div');
          banner.className = 'col-span-3 mb-2 discover-search-banner';
          banner.innerHTML = `
            <div class="flex items-center justify-between bg-brand/10 border border-brand/20 rounded-xl px-4 py-2.5">
              <span class="text-xs text-brand font-semibold">
                <i class="fa-solid fa-magnifying-glass mr-2"></i>Menampilkan hasil untuk: "<span class="text-white">${q}</span>"
              </span>
              <button onclick="clearDiscoverSearch()" class="text-xs text-gray-400 hover:text-white transition">
                <i class="fa-solid fa-xmark mr-1"></i>Hapus
              </button>
            </div>`;
          grid.insertBefore(banner, grid.firstChild);
        }
      }
    }, 280);
  };

  window.clearDiscoverSearch = function () {
    const input = document.getElementById('discoverSearch');
    if (input) { input.value = ''; onDiscoverSearch(''); }
  };

  // ── DISCOVER ──────────────────────────────────────────────
  function renderDiscover(songs) {
    const grid = document.getElementById('discoverGrid');
    if (!songs.length) {
      grid.innerHTML = '<p class="text-gray-500 col-span-3 py-10 text-center">Tidak ada lagu ditemukan</p>';
      return;
    }
    playQueue = songs;
    grid.innerHTML = songs.map((s, i) => {
      const liked = likedSongs.has(s.id);
      return `
        <div class="song-card card p-5 flex items-center gap-4" onclick="playSong(${i})">
          <div class="w-14 h-14 rounded-xl bg-gradient-to-br from-brand/30 to-yellow-500/10 flex items-center justify-center text-3xl flex-shrink-0">${s.cover}</div>
          <div class="flex-1 min-w-0">
            <h4 class="font-semibold text-white text-sm truncate">${s.title}</h4>
            <p class="text-gray-400 text-xs">${s.musisiName}</p>
            <span class="text-xs text-brand bg-brand/10 px-2 py-0.5 rounded-full mt-1 inline-block">${s.genre}</span>
          </div>
          <div class="flex flex-col items-end gap-2">
            <button onclick="event.stopPropagation();toggleLike('${s.id}',this)" class="text-lg transition ${liked ? 'liked text-brand' : 'text-gray-600 hover:text-brand'}">
              <i class="fa-${liked ? 'solid' : 'regular'} fa-heart"></i>
            </button>
            <span class="text-xs text-gray-500">${s.duration}</span>
            <button onclick="event.stopPropagation();openShare(${JSON.stringify(s).replace(/"/g,'&quot;')})"
              class="share-song-btn text-gray-600 hover:text-white transition text-xs p-1">
              <i class="fa-solid fa-share-nodes"></i>
            </button>
          </div>
        </div>`;
    }).join('');
  }

  window.filterSongs = async function () {
    let params = { status: 'published' };
    if (currentGenre) params.genre = currentGenre;
    const songs = await API.songs.all(params);
    renderDiscover(songs);
  };

  window.filterByGenre = async function (genre, btn) {
    currentGenre = genre;
    document.querySelectorAll('.genre-filter').forEach(b => {
      b.classList.remove('active', 'bg-brand', 'text-white');
      b.classList.add('text-gray-400');
    });
    btn.classList.add('active', 'bg-brand', 'text-white');
    btn.classList.remove('text-gray-400');
    filterSongs();
  };

  // ══════════════════════════════════════════════════════════
  // SEARCH ENGINE — Global real-time search
  // ══════════════════════════════════════════════════════════
  async function buildGenreFilters() {
    const songs  = await API.songs.all({ status: 'published' });
    const genres = [...new Set(songs.map(s => s.genre))];
    const container = document.getElementById('genreFilters');
    genres.forEach(g => {
      const btn = document.createElement('button');
      btn.className   = 'genre-filter text-gray-400 text-xs px-4 py-2 rounded-full border border-[#222230] hover:border-brand transition';
      btn.textContent = g;
      btn.onclick     = () => filterByGenre(g, btn);
      container.appendChild(btn);
    });
  }

  // ── LIKES ─────────────────────────────────────────────────
  window.toggleLike = async function (songId, btn) {
    const result = await API.likes.toggle(cu.id, songId);
    if (result.liked) {
      likedSongs.add(songId);
      btn.innerHTML = '<i class="fa-solid fa-heart"></i>';
      btn.className = 'text-lg transition liked text-brand';
      showToast('♥ Ditambahkan ke favorit');
    } else {
      likedSongs.delete(songId);
      btn.innerHTML = '<i class="fa-regular fa-heart"></i>';
      btn.className = 'text-lg transition text-gray-600 hover:text-brand';
      showToast('Dihapus dari favorit');
    }
  };

  window.renderLiked = async function () {
    const allSongs  = await API.songs.all({ status: 'published' });
    const songs     = allSongs.filter(s => likedSongs.has(s.id));
    const grid      = document.getElementById('likedGrid');
    if (!songs.length) {
      grid.innerHTML = '<p class="col-span-2 text-gray-500 py-10 text-center">Belum ada lagu favorit. Tekan ♥ pada lagu yang kamu suka!</p>';
      return;
    }
    grid.innerHTML = songs.map((s, i) => `
      <div class="song-card card p-5 flex items-center gap-4" onclick="playFromLiked(${i})">
        <div class="w-14 h-14 rounded-xl bg-gradient-to-br from-brand/30 to-yellow-500/10 flex items-center justify-center text-3xl">${s.cover}</div>
        <div class="flex-1 min-w-0">
          <h4 class="font-semibold text-white text-sm truncate">${s.title}</h4>
          <p class="text-gray-400 text-xs">${s.musisiName} · ${s.genre}</p>
        </div>
        <div class="flex items-center gap-2">
          <button onclick="event.stopPropagation();openShare(${JSON.stringify(s).replace(/"/g,'&quot;')})"
            class="share-song-btn text-gray-600 hover:text-white transition text-xs p-1.5 rounded-lg hover:bg-white/10">
            <i class="fa-solid fa-share-nodes"></i>
          </button>
          <button onclick="event.stopPropagation();toggleLike('${s.id}',this)" class="text-lg liked text-brand">
            <i class="fa-solid fa-heart"></i>
          </button>
        </div>
      </div>
    `).join('');
  };

  window.playFromLiked = async function (i) {
    const allSongs = await API.songs.all({ status: 'published' });
    playQueue      = allSongs.filter(s => likedSongs.has(s.id));
    playSong(i);
  };

  // ── MUSISI ────────────────────────────────────────────────
  window.renderMusisi = async function (filterMode = 'all') {
    const grid = document.getElementById('musisiGrid');
    grid.innerHTML = '<div class="col-span-3 text-center py-12 text-gray-600"><i class="fa-solid fa-spinner fa-spin text-2xl block mb-2"></i>Memuat musisi...</div>';

    let list;
    if (filterMode === 'following') {
      list = await API.follows.byUser(cu.id);
    } else {
      list = await API.musisi.all();
    }

    if (!list.length) {
      grid.innerHTML = `
        <div class="col-span-3 text-center py-16 text-gray-500">
          <i class="fa-solid fa-user-slash text-4xl block mb-4 opacity-30"></i>
          <p class="text-sm">${filterMode === 'following' ? 'Kamu belum mengikuti musisi apapun.<br>Temukan musisi di tab <b>Semua</b>.' : 'Belum ada musisi terdaftar.'}</p>
        </div>`;
      return;
    }

    grid.innerHTML = list.map(m => {
      const isFollowed = followedSet.has(m.id);
      return `
      <div class="card p-6" id="musisi-card-${m.id}">
        <div class="flex items-center gap-4 mb-4">
          <div class="w-14 h-14 rounded-full bg-purple-500/20 flex items-center justify-center text-3xl flex-shrink-0">${m.cover}</div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2">
              <h4 class="font-bold text-white truncate">${m.name}</h4>
              ${m.verified ? '<i class="fa-solid fa-circle-check text-brand text-xs flex-shrink-0"></i>' : ''}
            </div>
            <p class="text-xs text-gray-400">${m.genre}</p>
            <p class="text-xs text-gray-500"><i class="fa-solid fa-location-dot mr-1"></i>${m.kota || 'Indonesia'}</p>
          </div>
        </div>
        <p class="text-xs text-gray-500 mb-4 leading-relaxed line-clamp-2">${m.bio || 'Musisi lokal berbakat dari Indonesia.'}</p>
        <div class="flex justify-around border-t border-[#1a1a28] pt-4 text-center text-xs mb-4">
          <div><div class="font-bold text-white" id="followers-${m.id}">${fmtNum(m.followers)}</div><div class="text-gray-500">Fans</div></div>
          <div><div class="font-bold text-white">${m.songs}</div><div class="text-gray-500">Lagu</div></div>
          <div><div class="font-bold text-white">${fmtNum(m.streams)}</div><div class="text-gray-500">Stream</div></div>
        </div>
        <button
          id="follow-btn-${m.id}"
          onclick="toggleFollow('${m.id}', '${m.name}', this)"
          class="btn-follow w-full py-2 rounded-xl border text-xs font-semibold transition
            ${isFollowed
              ? 'bg-brand/10 text-brand border-brand/30 following'
              : 'bg-white/5 text-gray-300 border-white/10 hover:bg-brand/10 hover:text-brand hover:border-brand/30'}"
        >
          ${isFollowed
            ? '<i class="fa-solid fa-user-check mr-1.5"></i><span>Diikuti</span>'
            : '<i class="fa-solid fa-user-plus mr-1.5"></i><span>Ikuti</span>'}
        </button>
      </div>`;
    }).join('');
  };

  window.filterMusisi = function (mode, btn) {
    document.getElementById('filterAllBtn').className       = `text-xs px-3 py-1.5 rounded-lg font-semibold transition ${mode === 'all' ? 'bg-brand text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`;
    document.getElementById('filterFollowingBtn').className = `text-xs px-3 py-1.5 rounded-lg font-semibold transition ${mode === 'following' ? 'bg-brand text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`;
    renderMusisi(mode);
  };

  // ── TOGGLE FOLLOW ─────────────────────────────────────────
  window.toggleFollow = async function (musisiId, musisiName, btn) {
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-1.5"></i>Memproses...';

    try {
      const res = await API.follows.toggle(cu.id, musisiId);

      if (res.following) {
        // Sekarang follow
        followedSet.add(musisiId);
        btn.className = 'btn-follow w-full py-2 rounded-xl border text-xs font-semibold transition bg-brand/10 text-brand border-brand/30 following';
        btn.innerHTML = '<i class="fa-solid fa-user-check mr-1.5"></i><span>Diikuti</span>';
        showToast(`Kamu sekarang mengikuti ${musisiName} 🎵`);

        // Naikkan counter followers di card
        const counter = document.getElementById('followers-' + musisiId);
        if (counter) {
          const cur = parseInt(counter.textContent.replace('K','')) || 0;
          counter.textContent = fmtNum(cur + 1);
        }
      } else {
        // Unfollow
        followedSet.delete(musisiId);
        btn.className = 'btn-follow w-full py-2 rounded-xl border text-xs font-semibold transition bg-white/5 text-gray-300 border-white/10 hover:bg-brand/10 hover:text-brand hover:border-brand/30';
        btn.innerHTML = '<i class="fa-solid fa-user-plus mr-1.5"></i><span>Ikuti</span>';
        showToast(`Berhenti mengikuti ${musisiName}`);

        const counter = document.getElementById('followers-' + musisiId);
        if (counter) {
          const cur = parseInt(counter.textContent.replace('K','')) || 1;
          counter.textContent = fmtNum(Math.max(0, cur - 1));
        }
      }

      // Update badge Feed
      const badge = document.getElementById('feedBadge');
      if (badge) {
        if (followedSet.size > 0) {
          badge.textContent = followedSet.size;
          badge.classList.remove('hidden');
        } else {
          badge.classList.add('hidden');
        }
      }

      // Update stat di profil
      const statEl = document.getElementById('statFollowing');
      if (statEl) statEl.textContent = followedSet.size;

    } catch (e) {
      showToast('Gagal. Coba lagi.', 'error');
      btn.innerHTML = '<i class="fa-solid fa-user-plus mr-1.5"></i><span>Ikuti</span>';
    } finally {
      btn.disabled = false;
    }
  };

  // ── FEED ─────────────────────────────────────────────────
  window.renderFeed = async function () {
    const feedGrid    = document.getElementById('feedGrid');
    const followingBar = document.getElementById('followingBar');
    feedGrid.innerHTML = '<div class="text-center py-12 text-gray-600"><i class="fa-solid fa-spinner fa-spin text-2xl block mb-2"></i>Memuat feed...</div>';

    try {
      const [feedData, followingList] = await Promise.all([
        API.follows.feed(cu.id, 40),
        API.follows.byUser(cu.id),
      ]);

      // ── Following bar (avatar strip) ──────────────────────
      if (followingList.length) {
        followingBar.innerHTML = followingList.map(m => `
          <div class="flex flex-col items-center gap-1.5 flex-shrink-0 cursor-pointer group" onclick="filterFeedByMusisi('${m.id}', this)">
            <div class="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center text-2xl border-2 border-transparent group-hover:border-brand transition" id="feed-avatar-${m.id}">
              ${m.cover}
            </div>
            <span class="text-xs text-gray-500 group-hover:text-gray-300 transition truncate max-w-[56px] text-center">${m.name.split(' ')[0]}</span>
          </div>
        `).join('');
      } else {
        followingBar.innerHTML = '';
      }

      // ── Feed kosong ───────────────────────────────────────
      if (feedData.isEmpty || !feedData.songs.length) {
        feedGrid.innerHTML = `
          <div class="text-center py-16">
            <div class="text-5xl mb-4">🎸</div>
            <h3 class="text-white font-semibold mb-2">Feed kamu masih kosong</h3>
            <p class="text-gray-400 text-sm mb-6">Ikuti musisi lokal favoritmu untuk melihat<br>lagu terbaru mereka di sini</p>
            <button onclick="showTab('musisi', document.querySelector('[onclick*=\\'showTab(\\'musisi\\'\\']'))"
              class="bg-brand text-white text-sm font-semibold px-6 py-3 rounded-xl hover:opacity-90 transition">
              <i class="fa-solid fa-guitar mr-2"></i>Temukan Musisi
            </button>
          </div>`;
        return;
      }

      // ── Render songs ──────────────────────────────────────
      window._feedSongs = feedData.songs;
      renderFeedSongs(feedData.songs);

    } catch (e) {
      feedGrid.innerHTML = '<div class="text-center py-12 text-red-400 text-sm">Gagal memuat feed. Coba lagi.</div>';
    }
  };

  function renderFeedSongs(songs) {
    const feedGrid = document.getElementById('feedGrid');
    if (!songs.length) {
      feedGrid.innerHTML = '<p class="text-center text-gray-600 text-sm py-8">Tidak ada lagu dari musisi ini.</p>';
      return;
    }
    feedGrid.innerHTML = songs.map((s, i) => `
      <div class="feed-card" onclick="playFeed(${i})">
        <div class="w-11 h-11 rounded-xl bg-brand/20 flex items-center justify-center text-2xl flex-shrink-0">${s.cover}</div>
        <div class="flex-1 min-w-0">
          <div class="text-sm font-semibold text-white truncate">${s.title}</div>
          <div class="text-xs text-gray-400 truncate mt-0.5">${s.musisiName} · ${s.genre}</div>
        </div>
        <div class="text-xs text-gray-600 flex-shrink-0 text-right">
          <div>${s.duration}</div>
          <div class="mt-0.5">${fmtNum(s.streams)} ♫</div>
        </div>
        <button onclick="event.stopPropagation();toggleLike('${s.id}',this)"
          class="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition hover:bg-white/10 ${likedSongs.has(s.id) ? 'text-red-400' : 'text-gray-600'}">
          <i class="fa-${likedSongs.has(s.id) ? 'solid' : 'regular'} fa-heart text-xs"></i>
        </button>
      </div>
    `).join('');
  }

  window.playFeed = function (i) {
    if (!window._feedSongs) return;
    playQueue = window._feedSongs;
    playSong(i);
  };

  // Filter feed berdasarkan musisi yang diklik di avatar bar
  let _activeFeedMusisi = null;
  window.filterFeedByMusisi = function (musisiId, el) {
    // Toggle — klik lagi = tampilkan semua
    if (_activeFeedMusisi === musisiId) {
      _activeFeedMusisi = null;
      document.querySelectorAll('[id^="feed-avatar-"]').forEach(a => a.classList.remove('border-brand'));
      renderFeedSongs(window._feedSongs || []);
      return;
    }
    _activeFeedMusisi = musisiId;
    document.querySelectorAll('[id^="feed-avatar-"]').forEach(a => a.classList.remove('border-brand'));
    document.getElementById('feed-avatar-' + musisiId)?.classList.add('border-brand');
    const filtered = (window._feedSongs || []).filter(s => s.musisiId === musisiId);
    renderFeedSongs(filtered);
  };

  // ── PROFILE ───────────────────────────────────────────────
  window.loadProfil = async function () {
    document.getElementById('profileAvatar').textContent = cu.avatar;
    document.getElementById('profileName').textContent   = cu.name;
    document.getElementById('profileEmail').textContent  = cu.email;
    document.getElementById('profileJoined').textContent = 'Bergabung: ' + cu.joined;

    const allSongs = await API.songs.all({ status: 'published' });
    const liked    = allSongs.filter(s => likedSongs.has(s.id)).length;
    document.getElementById('statLiked').textContent     = liked;
    document.getElementById('statFollowing').textContent = followedSet.size;
  };

  // ── PLAYER ────────────────────────────────────────────────
  window.playSong = function (i) {
    currentSongIndex = i;
    const s = playQueue[i];
    if (!s) return;

    // ── Update UI player bar ───────────────────────────────
    document.getElementById('playerCover').textContent  = s.cover;
    document.getElementById('playerTitle').textContent  = s.title;
    document.getElementById('playerArtist').textContent = s.musisiName + ' · ' + s.genre;
    document.getElementById('timeTotal').textContent    = s.duration;
    updatePlayerShareBtn();

    // ── Reset progress ─────────────────────────────────────
    fakeProgress = 0;
    document.getElementById('playerProgress').style.width = '0%';
    document.getElementById('timeNow').textContent = '0:00';

    // ── Audio nyata: load file MP3 jika ada ───────────────
    clearInterval(progressInterval);

    if (s.fileUrl) {
      // Resolusi URL: jika dimulai http maka langsung, jika path relatif maka tambah BASE
      const audioSrc = s.fileUrl.startsWith('http') ? s.fileUrl : (BASE + s.fileUrl);

      if (!window._audioEl) {
        window._audioEl = new Audio();

        // Sync progress bar dengan waktu audio nyata
        window._audioEl.addEventListener('timeupdate', () => {
          const dur = window._audioEl.duration || 0;
          const cur = window._audioEl.currentTime;
          if (!dur) return;
          const pct = (cur / dur) * 100;
          document.getElementById('playerProgress').style.width = pct + '%';
          const m = Math.floor(cur / 60), sec = Math.floor(cur % 60);
          document.getElementById('timeNow').textContent = m + ':' + String(sec).padStart(2, '0');
          fakeProgress = Math.floor(cur);
        });

        // Auto next saat lagu habis
        window._audioEl.addEventListener('ended', () => nextSong());

        // Tampilkan durasi asli dari metadata audio
        window._audioEl.addEventListener('loadedmetadata', () => {
          const dur = window._audioEl.duration;
          if (dur && isFinite(dur)) {
            const m = Math.floor(dur / 60), sec = Math.floor(dur % 60);
            document.getElementById('timeTotal').textContent = m + ':' + String(sec).padStart(2, '0');
          }
        });
      }

      window._audioEl.src = audioSrc;
      window._audioEl.currentTime = 0;
      window._audioEl.play().catch(err => {
        console.warn('Audio play error:', err);
        showToast('Tidak bisa memutar audio. Cek URL file.', 'error');
      });

    } else {
      // Tidak ada file MP3 — gunakan progress simulasi (demo)
      if (window._audioEl) { window._audioEl.pause(); window._audioEl.src = ''; }
      const parts    = s.duration.split(':');
      const totalSec = parseInt(parts[0]) * 60 + parseInt(parts[1]);
      startProgress(totalSec);
    }

    // Increment stream count (fire-and-forget)
    API.songs.update(s.id, { streams: s.streams + 1 }).catch(() => {});

    isPlaying = true;
    updatePlayBtn();
  };

  window.togglePlay = function () {
    if (!playQueue.length) return;
    isPlaying = !isPlaying;
    updatePlayBtn();

    if (window._audioEl && window._audioEl.src) {
      // Audio nyata
      if (isPlaying) window._audioEl.play().catch(() => {});
      else window._audioEl.pause();
    } else {
      // Mode simulasi
      if (isPlaying) startProgress(); else clearInterval(progressInterval);
    }
  };

  function updatePlayBtn() {
    document.getElementById('playIcon').className = `fa-solid fa-${isPlaying ? 'pause' : 'play'} text-white`;
    const waves = document.querySelectorAll('#playerWave div');
    waves.forEach((w, idx) => {
      if (isPlaying) { w.className = 'w-0.5 bg-brand rounded wave'; w.style.animationDelay = (idx * 0.15) + 's'; }
      else { w.className = 'w-0.5 bg-brand/30 rounded'; }
    });
  }

  function startProgress(totalSec) {
    clearInterval(progressInterval);
    if (!totalSec) {
      const song = playQueue[currentSongIndex];
      if (!song) return;
      const parts = song.duration.split(':');
      totalSec = parseInt(parts[0]) * 60 + parseInt(parts[1]);
    }
    progressInterval = setInterval(() => {
      if (!isPlaying) return;
      fakeProgress = Math.min(fakeProgress + 1, totalSec);
      const pct    = (fakeProgress / totalSec) * 100;
      document.getElementById('playerProgress').style.width = pct + '%';
      const m = Math.floor(fakeProgress / 60), s = fakeProgress % 60;
      document.getElementById('timeNow').textContent = m + ':' + String(s).padStart(2, '0');
      if (fakeProgress >= totalSec) nextSong();
    }, 1000);
  }

  window.seek = function (e, bar) {
    const rect     = bar.getBoundingClientRect();
    const pct      = (e.clientX - rect.left) / rect.width;
    const song     = playQueue[currentSongIndex];
    if (!song) return;

    if (window._audioEl && window._audioEl.src && window._audioEl.duration) {
      // Seek audio nyata
      window._audioEl.currentTime = pct * window._audioEl.duration;
    } else {
      // Seek simulasi
      const parts    = song.duration.split(':');
      const totalSec = parseInt(parts[0]) * 60 + parseInt(parts[1]);
      fakeProgress   = Math.floor(pct * totalSec);
    }
  };

  window.nextSong = function () {
    if (currentSongIndex < playQueue.length - 1) playSong(currentSongIndex + 1);
    else playSong(0);
  };

  window.prevSong = function () {
    if (fakeProgress > 3) { fakeProgress = 0; return; }
    if (currentSongIndex > 0) playSong(currentSongIndex - 1);
    else playSong(playQueue.length - 1);
  };

  window.logout = async function () {
    await API.auth.logout();
    location.href = 'login.html';
  };

  // ══════════════════════════════════════════════════════════
  // GIGS ENGINE
  // ══════════════════════════════════════════════════════════
  let _gigsData        = [];     // semua gigs yang sedang ditampilkan
  let _gigViewMode     = 'grid'; // 'grid' | 'list'
  let _gigGoingSet     = new Set(); // gig_id yang user tandai going
  let _gigDebounceTimer = null;
  let _gigChipActive   = null;   // 'free' | 'today' | 'week' | 'month'

  // ── Render utama ─────────────────────────────────────────
  window.renderGigs = async function () {
    const container = document.getElementById('gigsContainer');
    if (!container) return;
    container.innerHTML = `
      <div class="text-center py-16 text-gray-600">
        <i class="fa-solid fa-spinner fa-spin text-2xl block mb-3"></i>
        Memuat gigs...
      </div>`;

    try {
      // Ambil gigs + metadata filter sekaligus
      const data = await API.gigs.withMeta({ status: 'upcoming' });
      _gigsData  = data.gigs || data;

      // Isi dropdown kota
      const kotaSel = document.getElementById('gigKotaFilter');
      if (kotaSel) {
        const kota = data.kota || [];
        kotaSel.innerHTML = '<option value="">Semua kota</option>' +
          kota.map(k => `<option value="${k}">${k}</option>`).join('');
      }

      // Ambil going state user
      if (_gigsData.length && cu?.id) {
        // Cek satu per satu tidak efisien untuk banyak gig — gunakan local storage sementara
        const savedGoing = JSON.parse(localStorage.getItem('tt_going_' + cu.id) || '[]');
        _gigGoingSet = new Set(savedGoing);
      }

      renderGigCards(_gigsData);
    } catch (e) {
      container.innerHTML = `
        <div class="text-center py-16 text-red-400 text-sm">
          <i class="fa-solid fa-triangle-exclamation text-2xl block mb-3"></i>
          Gagal memuat gigs. Coba lagi.
        </div>`;
    }
  };

  // ── Render kartu gig ──────────────────────────────────────
  function renderGigCards(gigs) {
    const container = document.getElementById('gigsContainer');
    const countEl   = document.getElementById('gigCount');
    if (!container) return;

    if (countEl) countEl.textContent = `${gigs.length} gig ditemukan`;

    if (!gigs.length) {
      container.innerHTML = `
        <div class="text-center py-16">
          <div class="text-5xl mb-4">🎸</div>
          <h3 class="text-white font-semibold mb-2">Tidak ada gig yang sesuai</h3>
          <p class="text-gray-400 text-sm mb-4">Coba ubah filter atau reset pencarian</p>
          <button onclick="resetGigFilters()" class="text-brand text-sm hover:underline">
            <i class="fa-solid fa-rotate-left mr-1"></i>Reset filter
          </button>
        </div>`;
      return;
    }

    if (_gigViewMode === 'grid') {
      container.innerHTML = `<div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">${gigs.map(gigCardGrid).join('')}</div>`;
    } else {
      container.innerHTML = `<div class="space-y-3">${gigs.map(gigCardList).join('')}</div>`;
    }
  }

  // ── Kartu mode Grid ───────────────────────────────────────
  function gigCardGrid(g) {
    const going    = _gigGoingSet.has(g.id);
    const dateStr  = formatGigDate(g.date);
    const price    = g.isFree ? '<span class="text-green-400 font-semibold">Gratis</span>' : `<span class="text-white font-semibold">${fmtPrice(g.priceMin, g.priceMax)}</span>`;
    const lineupHtml = g.lineup.slice(0, 3).map(l =>
      `<span class="inline-flex items-center gap-1 text-xs bg-white/5 px-2 py-0.5 rounded-full text-gray-400">
        ${l.cover} ${l.name}${l.verified ? ' <i class="fa-solid fa-circle-check text-brand text-[9px]"></i>' : ''}
      </span>`
    ).join('');
    const moreActs = g.lineup.length > 3 ? `<span class="text-xs text-gray-600">+${g.lineup.length - 3} lagi</span>` : '';

    return `
    <div class="card overflow-hidden hover:border-brand/40 transition-all group" id="gig-card-${g.id}">
      <!-- Poster header -->
      <div class="relative h-28 bg-gradient-to-br from-brand/20 via-purple-900/20 to-black flex items-center justify-center">
        <span class="text-6xl opacity-60 group-hover:opacity-80 transition">${g.poster}</span>
        <!-- Badge status -->
        <div class="absolute top-3 left-3 flex gap-2">
          ${g.isFree ? '<span class="text-[10px] font-bold bg-green-500 text-white px-2 py-0.5 rounded-full">GRATIS</span>' : ''}
          ${isGigSoon(g.date) ? '<span class="text-[10px] font-bold bg-brand text-white px-2 py-0.5 rounded-full">SEGERA</span>' : ''}
        </div>
        <!-- Going count badge -->
        <div class="absolute top-3 right-3 flex items-center gap-1 bg-black/50 rounded-full px-2.5 py-1 text-xs text-gray-300">
          <i class="fa-solid fa-user-group text-[10px]"></i>
          <span id="going-count-${g.id}">${g.goingCount}</span>
        </div>
      </div>

      <div class="p-5">
        <!-- Tanggal + jam -->
        <div class="flex items-center gap-2 mb-3">
          <div class="flex items-center gap-1.5 text-brand text-xs font-semibold bg-brand/10 px-2.5 py-1 rounded-lg">
            <i class="fa-solid fa-calendar-day text-[10px]"></i>
            ${dateStr}
          </div>
          <div class="flex items-center gap-1 text-gray-500 text-xs">
            <i class="fa-regular fa-clock text-[10px]"></i>
            ${g.timeStart}
          </div>
        </div>

        <!-- Judul -->
        <h3 class="font-bold text-white text-base mb-1 leading-tight line-clamp-2">${g.title}</h3>

        <!-- Venue & kota -->
        <div class="flex items-center gap-1.5 text-xs text-gray-400 mb-3">
          <i class="fa-solid fa-location-dot text-gray-600 text-[10px]"></i>
          <span class="truncate">${g.venue}</span>
          <span class="text-gray-600">·</span>
          <span class="text-gray-500 flex-shrink-0">${g.kota}</span>
        </div>

        <!-- Lineup -->
        ${g.lineup.length ? `
        <div class="flex flex-wrap gap-1.5 mb-4">
          ${lineupHtml}${moreActs}
        </div>` : `<div class="mb-4"></div>`}

        <!-- Harga + genre -->
        <div class="flex items-center justify-between mb-4">
          <div class="text-sm">${price}</div>
          ${g.genre ? `<span class="text-[10px] text-gray-500 bg-white/5 px-2 py-0.5 rounded-full">${g.genre}</span>` : ''}
        </div>

        <!-- Actions -->
        <div class="flex gap-2">
          <button onclick="toggleGoing('${g.id}', this)"
            class="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border text-xs font-semibold transition
              ${going ? 'bg-brand/15 border-brand/40 text-brand' : 'bg-white/5 border-white/10 text-gray-400 hover:border-brand/30 hover:text-brand'}">
            <i class="fa-${going ? 'solid' : 'regular'} fa-calendar-check"></i>
            <span id="going-label-${g.id}">${going ? 'Hadir' : 'Tandai Hadir'}</span>
          </button>
          ${g.ticketUrl ? `
          <a href="${g.ticketUrl}" target="_blank" rel="noopener"
            class="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-brand hover:opacity-90 text-white text-xs font-semibold transition">
            <i class="fa-solid fa-ticket"></i> Beli Tiket
          </a>` : `
          <button onclick="openGigDetail('${g.id}')"
            class="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 text-xs font-semibold transition">
            <i class="fa-solid fa-circle-info"></i> Detail
          </button>`}
        </div>
      </div>
    </div>`;
  }

  // ── Kartu mode List ───────────────────────────────────────
  function gigCardList(g) {
    const going   = _gigGoingSet.has(g.id);
    const dateStr = formatGigDate(g.date);
    const price   = g.isFree ? '<span class="text-green-400 text-xs font-semibold">Gratis</span>'
      : `<span class="text-white text-xs">${fmtPrice(g.priceMin, g.priceMax)}</span>`;

    return `
    <div class="card p-4 flex items-center gap-4 hover:border-brand/30 transition" id="gig-card-${g.id}">
      <!-- Poster emoji -->
      <div class="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand/20 to-purple-900/20 flex items-center justify-center text-3xl flex-shrink-0">
        ${g.poster}
      </div>
      <!-- Info -->
      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-2 mb-0.5">
          <h3 class="font-semibold text-white text-sm truncate">${g.title}</h3>
          ${g.isFree ? '<span class="text-[9px] font-bold bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded-full flex-shrink-0">GRATIS</span>' : ''}
        </div>
        <div class="text-xs text-gray-400 truncate mb-1">${g.venue} · ${g.kota}</div>
        <div class="flex items-center gap-3 text-xs text-gray-500">
          <span class="text-brand font-medium"><i class="fa-solid fa-calendar-day mr-1 text-[10px]"></i>${dateStr} ${g.timeStart}</span>
          ${g.genre ? `<span>${g.genre}</span>` : ''}
          ${price}
        </div>
      </div>
      <!-- Going + tiket -->
      <div class="flex flex-col items-end gap-2 flex-shrink-0">
        <div class="text-xs text-gray-600 flex items-center gap-1">
          <i class="fa-solid fa-user-group text-[10px]"></i>
          <span id="going-count-${g.id}">${g.goingCount}</span>
        </div>
        <button onclick="toggleGoing('${g.id}', this)"
          class="text-xs px-3 py-1.5 rounded-lg border font-semibold transition
            ${going ? 'bg-brand/15 border-brand/40 text-brand' : 'border-white/10 text-gray-400 hover:border-brand/30 hover:text-brand'}">
          <i class="fa-${going ? 'solid' : 'regular'} fa-calendar-check mr-1"></i>
          <span id="going-label-${g.id}">${going ? 'Hadir' : 'Hadir'}</span>
        </button>
        ${g.ticketUrl ? `
        <a href="${g.ticketUrl}" target="_blank" rel="noopener"
          class="text-xs px-3 py-1.5 rounded-lg bg-brand text-white font-semibold hover:opacity-90 transition">
          Tiket <i class="fa-solid fa-arrow-right ml-0.5 text-[10px]"></i>
        </a>` : ''}
      </div>
    </div>`;
  }


  // ── View toggle (grid/list) ───────────────────────────────
  window.setGigView = function (mode) {
    _gigViewMode = mode;
    document.getElementById('gigViewGrid').className = `p-1.5 rounded-lg transition ${mode === 'grid' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-white'}`;
    document.getElementById('gigViewList').className = `p-1.5 rounded-lg transition ${mode === 'list' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-white'}`;
    renderGigCards(_gigsData);
  };

  // ── Filter & search ───────────────────────────────────────
  window.applyGigFilters = function () {
    // Baca dari gigSearchInput (hidden, disync oleh onDiscoverSearch) atau discoverSearch
    const gigInput    = document.getElementById('gigSearchInput');
    const unifiedInput = document.getElementById('discoverSearch');
    const q        = (gigInput?.value || unifiedInput?.value || '').toLowerCase().trim();
    const kota     = document.getElementById('gigKotaFilter')?.value   || '';

    let filtered = _gigsData;

    if (q)     filtered = filtered.filter(g =>
      g.title.toLowerCase().includes(q) ||
      g.musisiName.toLowerCase().includes(q) ||
      g.venue.toLowerCase().includes(q) ||
      g.kota.toLowerCase().includes(q)
    );
    if (kota)  filtered = filtered.filter(g => g.kota === kota);
    if (genre) filtered = filtered.filter(g => g.genre === genre);

    // Chip aktif
    if (_gigChipActive === 'free')  filtered = filtered.filter(g => g.isFree);
    if (_gigChipActive === 'today') {
      const today = new Date().toISOString().split('T')[0];
      filtered = filtered.filter(g => g.date === today);
    }
    if (_gigChipActive === 'week') {
      const today = new Date(); today.setHours(0,0,0,0);
      const week  = new Date(today); week.setDate(week.getDate() + 7);
      filtered = filtered.filter(g => {
        const d = new Date(g.date + 'T00:00:00');
        return d >= today && d <= week;
      });
    }
    if (_gigChipActive === 'month') {
      const now = new Date();
      filtered = filtered.filter(g => {
        const d = new Date(g.date + 'T00:00:00');
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      });
    }

    renderGigCards(filtered);
  };

  window.resetGigFilters = function () {
    const ids = ['gigSearchInput','gigKotaFilter','gigGenreFilter','gigDateFrom','gigDateTo'];
    ids.forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
    _gigChipActive = null;
    document.querySelectorAll('.gig-chip').forEach(b => b.classList.remove('border-brand','text-brand','bg-brand/10'));
    renderGigCards(_gigsData);
  };

  // ── Toggle going ──────────────────────────────────────────
  window.toggleGoing = async function (gigId, btn) {
    if (!cu?.id) { showToast('Login dulu untuk tandai kehadiran', 'error'); return; }
    btn.disabled = true;

    try {
      const res = await API.gigs.toggleGoing(gigId, cu.id);
      const going = res.going;

      if (going) {
        _gigGoingSet.add(gigId);
        showToast('Ditandai! Kamu akan hadir di acara ini 🎉');
      } else {
        _gigGoingSet.delete(gigId);
        showToast('Kehadiran dibatalkan');
      }

      // Simpan ke local storage
      localStorage.setItem('tt_going_' + cu.id, JSON.stringify([..._gigGoingSet]));

      // Update semua elemen untuk gig ini (ada di grid & list view)
      document.querySelectorAll(`[id="going-label-${gigId}"]`).forEach(el => {
        el.textContent = going ? 'Hadir' : 'Tandai Hadir';
      });

      // Update counter
      const countEl = document.getElementById('going-count-' + gigId);
      if (countEl) {
        const cur = parseInt(countEl.textContent) || 0;
        countEl.textContent = going ? cur + 1 : Math.max(0, cur - 1);
      }

      // Update gaya tombol
      const isGrid = btn.classList.contains('flex-1');
      if (going) {
        btn.className = btn.className.replace('border-white/10 text-gray-400 hover:border-brand/30 hover:text-brand', 'bg-brand/15 border-brand/40 text-brand');
        btn.querySelector('i').className = 'fa-solid fa-calendar-check' + (isGrid ? '' : ' mr-1');
      } else {
        btn.className = btn.className.replace('bg-brand/15 border-brand/40 text-brand', 'border-white/10 text-gray-400 hover:border-brand/30 hover:text-brand');
        btn.querySelector('i').className = 'fa-regular fa-calendar-check' + (isGrid ? '' : ' mr-1');
      }

    } catch (e) {
      showToast('Gagal. Coba lagi.', 'error');
    } finally {
      btn.disabled = false;
    }
  };

 
  // ── SHARE ENGINE ─────────────────────────────────────────
  // ══════════════════════════════════════════════════════════
  let _shareSong = null;

  function getSongPageUrl(song) {
    // Halaman publik lagu — bisa diakses tanpa login
    const base = location.origin + location.pathname.replace('user-dashboard.html', '');
    return `${base}lagu.php?id=${encodeURIComponent(song.id)}`;
  }

  function getShareText(song) {
    return `Dengerin "${song.title}" oleh ${song.musisiName} di TerraTones 🎵`;
  }

  window.openShare = function (song) {
    _shareSong = song;

    // Isi preview modal
    document.getElementById('shareCover').textContent  = song.cover;
    document.getElementById('shareTitle').textContent  = song.title;
    document.getElementById('shareArtist').textContent = song.musisiName + ' · ' + song.genre;

    const shareUrl = getSongPageUrl(song);
    document.getElementById('shareLinkPreview').textContent = shareUrl;

    // Coba Web Share API dulu (mobile native share sheet)
    if (navigator.share) {
      navigator.share({
        title: song.title,
        text:  getShareText(song),
        url:   shareUrl,
      }).catch(() => {
        // User cancel atau tidak support — tampilkan modal kustom
        document.getElementById('shareModal').classList.add('open');
      });
      return;
    }

    // Desktop — tampilkan modal kustom
    document.getElementById('shareModal').classList.add('open');
  };

  window.shareCurrentSong = function () {
    const s = playQueue[currentSongIndex];
    if (s) openShare(s);
  };

  window.closeShare = function (e) {
    if (e && document.getElementById('shareSheet').contains(e.target)) return;
    document.getElementById('shareModal').classList.remove('open');
    // Reset copy button
    const btn = document.getElementById('copyShareBtn');
    if (btn) { btn.textContent = 'Salin'; btn.classList.remove('text-green-400'); }
  };

  window.shareToWhatsApp = function () {
    if (!_shareSong) return;
    const url  = getSongPageUrl(_shareSong);
    const text = getShareText(_shareSong);
    window.open(`https://wa.me/?text=${encodeURIComponent(text + '\n' + url)}`, '_blank');
  };

  window.shareToTwitter = function () {
    if (!_shareSong) return;
    const url  = getSongPageUrl(_shareSong);
    const text = getShareText(_shareSong);
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank');
  };

  window.shareToTelegram = function () {
    if (!_shareSong) return;
    const url  = getSongPageUrl(_shareSong);
    const text = getShareText(_shareSong);
    window.open(`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`, '_blank');
  };

  window.shareToFacebook = function () {
    if (!_shareSong) return;
    const url = getSongPageUrl(_shareSong);
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
  };

  window.copyShareLink = async function () {
    if (!_shareSong) return;
    const url = getSongPageUrl(_shareSong);
    const btn = document.getElementById('copyShareBtn');
    try {
      await navigator.clipboard.writeText(url);
      btn.textContent = '✓ Tersalin!';
      btn.classList.add('text-green-400');
      setTimeout(() => {
        btn.textContent = 'Salin';
        btn.classList.remove('text-green-400');
      }, 2500);
    } catch {
      // Fallback untuk browser yang tidak support clipboard API
      const ta = document.createElement('textarea');
      ta.value = url;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      btn.textContent = '✓ Tersalin!';
      setTimeout(() => { btn.textContent = 'Salin'; }, 2500);
    }
  };

  window.openSharePage = function () {
    if (!_shareSong) return;
    window.open(getSongPageUrl(_shareSong), '_blank');
    closeShare();
  };

  // Aktifkan tombol share di player saat lagu diputar
  function updatePlayerShareBtn() {
    const btn = document.getElementById('playerShareBtn');
    if (btn) btn.disabled = !playQueue[currentSongIndex];
  }

  // ── INIT ─────────────────────────────────────────────────
  await Promise.all([fetchLikes(), fetchFollows()]);
  buildGenreFilters();
  filterSongs();
  renderGigs(); // Gigs dimuat langsung bersama lagu

  // Cek URL play param
  const playParam = new URLSearchParams(location.search).get('play');
  if (playParam) {
    const songs = await API.songs.all({ status: 'published' });
    const idx   = songs.findIndex(s => s.id === playParam);
    if (idx >= 0) { playQueue = songs; setTimeout(() => playSong(idx), 300); }
  }
});
