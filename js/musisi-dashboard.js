document.addEventListener('DOMContentLoaded', async () => {
  let cu, musisiData;
  try {
    cu = await API.auth.me();
    if (cu.role !== 'musisi') throw new Error('bukan musisi');
    musisiData = await API.musisi.get(cu.musisi_id);
  } catch {
    location.href = 'login.html';
    return;
  }

  document.getElementById('sidebarName').textContent = musisiData?.name || cu.name;
  if (musisiData?.verified) {
    document.getElementById('verifyStatus').innerHTML =
      '<span class="w-1.5 h-1.5 rounded-full bg-green-400"></span><span class="text-green-400">Verified ✓</span>';
  }

  window.showTab = function (name, el) {
    document.querySelectorAll('main > div[id^="tab-"]').forEach(d => d.classList.add('hidden'));
    document.getElementById('tab-' + name).classList.remove('hidden');
    document.querySelectorAll('.nav-item').forEach(n => {
      n.classList.remove('active');
      n.classList.add('text-gray-400');
    });
    el.classList.add('active');
    el.classList.remove('text-gray-400');
    if (name === 'my-songs') renderMySongs();
    if (name === 'profil')   loadProfile();
    if (name === 'upload')   buildEmojiPicker();
  };

  async function loadOverview() {
    const songs = await API.songs.byMusisi(cu.musisi_id);
    document.getElementById('mySongCount').textContent  = songs.length;
    document.getElementById('myStreams').textContent    = fmtNum(songs.reduce((a, s) => a + s.streams, 0));
    document.getElementById('myLikes').textContent     = fmtNum(songs.reduce((a, s) => a + s.likes, 0));
    document.getElementById('myFollowers').textContent = fmtNum(musisiData?.followers || 0);

    const top = [...songs].sort((a, b) => b.streams - a.streams).slice(0, 5);
    document.getElementById('topSongs').innerHTML = top.map((s, i) => `
      <div class="flex items-center gap-4 p-3 rounded-xl hover:bg-white/5 transition">
        <span class="text-gray-600 text-sm w-4">${i + 1}</span>
        <div class="w-10 h-10 rounded-lg bg-brand/20 flex items-center justify-center text-xl">${s.cover}</div>
        <div class="flex-1">
          <div class="text-sm font-semibold text-white">${s.title}</div>
          <div class="text-xs text-gray-500">${s.genre} · ${s.duration}</div>
        </div>
        <span class="badge-${s.status}">${s.status === 'published' ? 'Aktif' : 'Review'}</span>
        <div class="text-right text-xs text-gray-400">
          <div>${fmtNum(s.streams)} stream</div>
          <div>${fmtNum(s.likes)} ♥</div>
        </div>
      </div>
    `).join('') || '<p class="text-gray-500 text-sm">Belum ada lagu. Yuk upload karya pertamamu!</p>';
  }

  const emojis = ['🎵','🎸','🎹','🎤','🎷','🥁','🪕','🎺','🎻','🌿','☀️','🌧️','🌊','⭐','🌋','🏡','🏮','🎭','🌙','🔥'];
  let selectedEmoji = '🎵';

  function buildEmojiPicker() {
    const picker = document.getElementById('emojiPicker');
    picker.innerHTML = emojis.map(e => `
      <button onclick="pickEmoji('${e}',this)" class="emoji-btn w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 text-xl transition ${e === selectedEmoji ? 'ring-2 ring-brand' : ''}">
        ${e}
      </button>
    `).join('');
  }

  window.pickEmoji = function (e, btn) {
    selectedEmoji = e;
    document.getElementById('up-cover').value = e;
    document.querySelectorAll('.emoji-btn').forEach(b => b.classList.remove('ring-2', 'ring-brand'));
    btn.classList.add('ring-2', 'ring-brand');
  };

  window.fileSelected = function (input) {
    const file = input.files[0];
    if (!file) return;

    // Tampilkan info file
    document.getElementById('fileInfo').classList.remove('hidden');
    document.getElementById('fileName').textContent = file.name;
    document.getElementById('fileSize').textContent = (file.size / (1024 * 1024)).toFixed(2) + ' MB';

    const url = URL.createObjectURL(file);
    const tmpAudio = new Audio(url);
    tmpAudio.addEventListener('loadedmetadata', () => {
      const dur = tmpAudio.duration;
      if (dur && isFinite(dur)) {
        const m = Math.floor(dur / 60), s = Math.floor(dur % 60);
        const formatted = m + ':' + String(s).padStart(2, '0');
        document.getElementById('up-duration').value = formatted;
        document.getElementById('durasiAuto').classList.remove('hidden');
      }
      URL.revokeObjectURL(url);
    });
    tmpAudio.addEventListener('error', () => URL.revokeObjectURL(url));
  };

  window.clearFile = function () {
    document.getElementById('fileInput').value = '';
    document.getElementById('fileInfo').classList.add('hidden');
    document.getElementById('fileName').textContent = '';
    document.getElementById('durasiAuto').classList.add('hidden');
  };

  window.uploadSong = async function () {
    const title    = document.getElementById('up-title').value.trim();
    const genre    = document.getElementById('up-genre').value;
    const duration = document.getElementById('up-duration').value.trim();
    const cover    = document.getElementById('up-cover').value || '🎵';
    const desc     = document.getElementById('up-desc').value.trim();

    if (!title || !genre) {
      showToast('Lengkapi judul dan genre!', 'error'); return;
    }

    let fileUrl = '';
    const fileInput = document.getElementById('fileInput');
    const hasFile   = fileInput.files.length > 0;

    if (!hasFile) {
      showToast('Pilih file MP3 terlebih dahulu!', 'error'); return;
    }

    const btn = document.querySelector('[onclick="uploadSong()"]');
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-2"></i> Memproses...';

    try {

      const newSong = await API.songs.add({
        title, genre,
        duration: duration || '0:00',
        cover, description: desc,
        musisiId:   cu.musisi_id,
        musisiName: musisiData?.name || cu.name,
        fileUrl:    '',
      });

      if (hasFile) {
        const file = fileInput.files[0];
        document.getElementById('uploadProgress').classList.remove('hidden');

        let pct = 0;
        const progInterval = setInterval(() => {
          pct = Math.min(pct + 5, 90);
          document.getElementById('progressBar').style.width = pct + '%';
          document.getElementById('progressPct').textContent = pct + '%';
        }, 200);

        const uploadResult = await API.songs.uploadFile(file, newSong.id);

        clearInterval(progInterval);
        document.getElementById('progressBar').style.width = '100%';
        document.getElementById('progressPct').textContent = '100%';

        if (!duration && uploadResult.url) {
        }

        fileUrl = uploadResult.url;
      }

      showToast('Lagu berhasil disubmit! Menunggu review admin.');

      document.getElementById('up-title').value    = '';
      document.getElementById('up-genre').value    = '';
      document.getElementById('up-duration').value = '';
      document.getElementById('up-desc').value     = '';
      clearFile();
      document.getElementById('uploadProgress').classList.add('hidden');
      document.getElementById('durasiAuto').classList.add('hidden');
      selectedEmoji = '🎵';
      buildEmojiPicker();
      loadOverview();

    } catch (err) {
      showToast(err.message || 'Upload gagal!', 'error');
    } finally {
      btn.disabled = false;
      btn.innerHTML = '<i class="fa-solid fa-paper-plane mr-2"></i> Submit untuk Review';
    }
  };

  window.renderMySongs = async function () {
    const songs = await API.songs.byMusisi(cu.musisi_id);
    const el    = document.getElementById('mySongList');
    if (!songs.length) {
      el.innerHTML = '<div class="card p-12 text-center text-gray-500"><i class="fa-solid fa-music text-4xl mb-3 block text-brand/30"></i>Belum ada lagu. Upload sekarang!</div>';
      return;
    }
    el.innerHTML = songs.map(s => `
      <div class="card p-5 flex items-center gap-5">
        <div class="w-14 h-14 rounded-xl bg-brand/20 flex items-center justify-center text-3xl flex-shrink-0">${s.cover}</div>
        <div class="flex-1">
          <div class="flex items-center gap-3 mb-1">
            <h4 class="font-bold text-white">${s.title}</h4>
            <span class="badge-${s.status}">${s.status === 'published' ? 'Aktif' : 'Menunggu Review'}</span>
          </div>
          <p class="text-gray-400 text-xs">${s.genre} · ${s.duration} · Upload: ${s.uploaded}</p>
        </div>
        <div class="flex gap-6 text-center text-xs">
          <div><div class="font-bold text-white">${fmtNum(s.streams)}</div><div class="text-gray-500">Stream</div></div>
          <div><div class="font-bold text-white">${fmtNum(s.likes)}</div><div class="text-gray-500">Likes</div></div>
        </div>
        <button onclick="deleteMySong('${s.id}')" class="text-red-400 hover:text-red-300 p-2 rounded-lg hover:bg-red-500/10 transition">
          <i class="fa-solid fa-trash text-xs"></i>
        </button>
      </div>
    `).join('');
  };

  window.deleteMySong = async function (id) {
    if (!confirm('Hapus lagu ini?')) return;
    await API.songs.delete(id);
    renderMySongs();
    loadOverview();
    showToast('Lagu dihapus');
  };
  window.loadProfile = function () {
    if (!musisiData) return;
    document.getElementById('profileName').textContent  = musisiData.name;
    document.getElementById('profileGenre').textContent = musisiData.genre;
    document.getElementById('profileKota').textContent  = '📍 ' + musisiData.kota;
    document.getElementById('profileCover').textContent = musisiData.cover || '🎸';
    document.getElementById('edit-name').value  = musisiData.name;
    document.getElementById('edit-bio').value   = musisiData.bio || '';
    document.getElementById('edit-genre').value = musisiData.genre;
    document.getElementById('edit-kota').value  = musisiData.kota;
  };

  window.saveProfile = async function () {
    const name  = document.getElementById('edit-name').value.trim();
    const bio   = document.getElementById('edit-bio').value.trim();
    const genre = document.getElementById('edit-genre').value;
    const kota  = document.getElementById('edit-kota').value.trim();
    if (!name) { showToast('Nama tidak boleh kosong!', 'error'); return; }

    try {
      musisiData = await API.musisi.update(cu.musisi_id, { name, bio, genre, kota });
      loadProfile();
      showToast('Profil berhasil disimpan!');
    } catch (err) {
      showToast(err.message || 'Gagal menyimpan profil', 'error');
    }
  };

  window.logout = async function () {
    await API.auth.logout();
    location.href = 'login.html';
  };

  loadOverview();
  buildEmojiPicker();
});
