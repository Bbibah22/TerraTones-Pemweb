document.addEventListener('DOMContentLoaded', async () => {
  // ── Auth guard ────────────────────────────────────────────
  let cu;
  try {
    cu = await API.auth.me();
    if (cu.role !== 'admin') throw new Error('bukan admin');
  } catch {
    location.href = 'login.html';
    return;
  }
  document.getElementById('sidebarName').textContent = cu.name;

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

    if (name === 'users')  renderUsersTable();
    if (name === 'musisi') renderMusisiTable();
    if (name === 'gigs')   renderGigsAdmin();
    if (name === 'review') renderReview();
  };

  // ── OVERVIEW ──────────────────────────────────────────────
  async function loadOverview() {
    const [users, musisi, songs] = await Promise.all([
      API.users.all(),
      API.musisi.all(),
      API.songs.all(),
    ]);

    const pending  = musisi.filter(m => !m.verified).length;
    const review   = songs.filter(s => s.status === 'review').length;
    const streams  = songs.reduce((a, s) => a + s.streams, 0);

    document.getElementById('statUsers').textContent   = users.length;
    document.getElementById('statMusisi').textContent  = musisi.length;
    document.getElementById('statPending').textContent = pending + ' menunggu verifikasi';
    document.getElementById('statSongs').textContent   = songs.length;
    document.getElementById('statReview').textContent  = review + ' menunggu review';
    document.getElementById('statStreams').textContent = fmtNum(streams);
    document.getElementById('reviewBadge').textContent = review;

    document.getElementById('recentSongsTable').innerHTML = songs.slice(0, 6).map(s => `
      <tr>
        <td class="text-white font-semibold">${s.cover} ${s.title}</td>
        <td class="text-gray-400">${s.musisiName}</td>
        <td class="text-gray-400">${s.genre}</td>
        <td><span class="badge badge-${s.status}">${s.status === 'published' ? 'Aktif' : 'Review'}</span></td>
        <td class="text-gray-400">${fmtNum(s.streams)}</td>
      </tr>
    `).join('');
  }

  // ── USERS TABLE ───────────────────────────────────────────
  window.renderUsersTable = async function () {
    const q     = document.getElementById('searchUser')?.value || '';
    const users = await API.users.all(q);
    document.getElementById('usersTable').innerHTML = users.map(u => `
      <tr>
        <td class="text-white font-semibold">${u.avatar} ${u.name}</td>
        <td class="text-gray-400">${u.email}</td>
        <td><span class="badge badge-${u.role === 'admin' ? 'published' : u.role === 'musisi' ? 'pending' : 'review'}">${u.role}</span></td>
        <td class="text-gray-500 text-xs">${u.joined}</td>
        <td><span class="badge badge-active">${u.status || 'active'}</span></td>
        <td>
          ${u.role !== 'admin'
            ? `<button onclick="deleteUser('${u.id}')" class="text-red-400 hover:text-red-300 text-xs px-2 py-1 rounded hover:bg-red-500/10 transition"><i class="fa-solid fa-trash"></i></button>`
            : '—'}
        </td>
      </tr>
    `).join('');
  };

  // ── MUSISI TABLE ──────────────────────────────────────────
  window.renderMusisiTable = async function () {
    const list = await API.musisi.all();
    document.getElementById('musisiTable').innerHTML = list.map(m => `
      <tr class="cursor-pointer hover:bg-brand/5 transition" onclick="openMusisiSongs('${m.id}','${m.name}','${m.genre}','${m.kota}')">
        <td class="text-white font-semibold">${m.cover} ${m.name} <span class="text-xs text-brand ml-1"><i class="fa-solid fa-chevron-right opacity-40"></i></span></td>
        <td class="text-gray-400 text-xs">${m.genre}</td>
        <td class="text-gray-400 text-xs">${m.kota}</td>
        <td class="text-gray-400">${m.songs}</td>
        <td class="text-gray-400">${fmtNum(m.followers)}</td>
        <td><span class="badge ${m.verified ? 'badge-verified' : 'badge-review'}">${m.verified ? 'Verified' : 'Pending'}</span></td>
        <td onclick="event.stopPropagation()">
          ${!m.verified ? `<button onclick="verifyMusisi('${m.id}')" class="text-green-400 hover:text-green-300 text-xs px-3 py-1 rounded-lg hover:bg-green-500/10 transition mr-1"><i class="fa-solid fa-check"></i> Verify</button>` : ''}
          <button onclick="deleteMusisi('${m.id}')" class="text-red-400 hover:text-red-300 text-xs px-2 py-1 rounded hover:bg-red-500/10 transition"><i class="fa-solid fa-trash"></i></button>
        </td>
      </tr>
    `).join('');
  };

  // ── MUSISI SONGS MODAL ────────────────────────────────────
  window.openMusisiSongs = async function (musisiId, musisiName, genre, kota) {
    document.getElementById('modalMusisiName').textContent = musisiName;
    document.getElementById('modalMusisiMeta').textContent = genre + ' · ' + kota;
    document.getElementById('modalSongsList').innerHTML = '<p class="text-gray-500 text-sm text-center py-6">Memuat lagu...</p>';
    document.getElementById('musisiSongsModal').classList.remove('hidden');

    const allSongs = await API.songs.all();
    const songs = allSongs.filter(s => s.musisiId === musisiId || s.musisiName === musisiName);

    if (!songs.length) {
      document.getElementById('modalSongsList').innerHTML = '<p class="text-gray-500 text-sm text-center py-8"><i class="fa-solid fa-music-slash block text-3xl mb-2 opacity-30"></i>Musisi ini belum memiliki lagu</p>';
      return;
    }

    document.getElementById('modalSongsList').innerHTML = songs.map(s => `
      <div class="flex items-center gap-4 p-4 rounded-2xl bg-black/20 hover:bg-black/30 transition" id="msong-${s.id}">
        <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-brand/30 to-yellow-500/20 flex items-center justify-center text-2xl flex-shrink-0">${s.cover}</div>
        <div class="flex-1 min-w-0">
          <div class="text-sm font-semibold text-white truncate">${s.title}</div>
          <div class="text-xs text-gray-400 mt-0.5">${s.genre} · ${s.duration} · <span class="text-gray-500">${fmtNum(s.streams)} stream</span></div>
        </div>
        <span class="badge ${s.status === 'published' ? 'badge-published' : 'badge-review'} mr-2">${s.status === 'published' ? 'Aktif' : 'Review'}</span>
        <div class="flex gap-2">
          ${s.status === 'review' ? `<button onclick="approveModalSong('${s.id}')" class="text-green-400 hover:text-green-300 text-xs px-3 py-1.5 rounded-lg hover:bg-green-500/10 transition flex items-center gap-1"><i class="fa-solid fa-check"></i> Setujui</button>` : ''}
          <button onclick="deleteModalSong('${s.id}')" class="text-red-400 hover:text-red-300 text-xs px-3 py-1.5 rounded-lg hover:bg-red-500/10 transition flex items-center gap-1"><i class="fa-solid fa-trash"></i> Hapus</button>
        </div>
      </div>
    `).join('');
  };

  window.closeMusisiSongs = function (e) {
    if (!e || e.target === document.getElementById('musisiSongsModal')) {
      document.getElementById('musisiSongsModal').classList.add('hidden');
    }
  };

  window.approveModalSong = async function (id) {
    await API.songs.update(id, { status: 'published' });
    const el = document.getElementById('msong-' + id);
    if (el) {
      el.querySelector('.badge').className = 'badge badge-published mr-2';
      el.querySelector('.badge').textContent = 'Aktif';
      const approveBtn = el.querySelector('button:first-child');
      if (approveBtn && approveBtn.textContent.includes('Setujui')) approveBtn.remove();
    }
    showToast('Lagu disetujui dan dipublikasikan!');
    loadOverview();
  };

  window.deleteModalSong = async function (id) {
    if (!confirm('Hapus lagu ini?')) return;
    await API.songs.delete(id);
    const el = document.getElementById('msong-' + id);
    if (el) el.remove();
    showToast('Lagu dihapus');
    loadOverview();
    renderMusisiTable();
  };


  // ── GIGS ADMIN TABLE ──────────────────────────────────────
  window.openAdminAddGig = function () {
    const form = document.getElementById('addGigForm');
    form.classList.toggle('hidden');
    if (!form.classList.contains('hidden')) {
      // Isi dropdown kota & provinsi
      const kotaSel = document.getElementById('ag-kota');
      if (kotaSel && window.KOTA_PER_PROVINSI) {
        const allKota = Object.values(window.KOTA_PER_PROVINSI).flat().sort();
        kotaSel.innerHTML = '<option value="">Pilih kota...</option>' +
          allKota.map(k => `<option value="${k}">${k}</option>`).join('');
      }
      if (window.renderProvinsiSelect) renderProvinsiSelect('ag-provinsi');
      // Min tanggal = hari ini
      const agDate = document.getElementById('ag-date');
      if (agDate) agDate.min = new Date().toISOString().split('T')[0];
    }
  };

  window.adminAddGig = async function () {
    const title      = document.getElementById('ag-title')?.value.trim();
    const musisiName = document.getElementById('ag-musisi-name')?.value.trim();
    const venue      = document.getElementById('ag-venue')?.value.trim();
    const kota       = document.getElementById('ag-kota')?.value;
    const provinsi   = document.getElementById('ag-provinsi')?.value || '';
    const genre      = document.getElementById('ag-genre')?.value   || '';
    const date       = document.getElementById('ag-date')?.value;
    const timeStart  = document.getElementById('ag-time')?.value    || '19:00';
    const priceMin   = parseInt(document.getElementById('ag-price-min')?.value || '0');
    const priceMax   = parseInt(document.getElementById('ag-price-max')?.value || '0');
    const isFree     = priceMin === 0 && priceMax === 0;
    const desc       = document.getElementById('ag-desc')?.value.trim()       || '';
    const ticketUrl  = document.getElementById('ag-ticket-url')?.value.trim() || '';

    if (!title || !musisiName || !venue || !kota || !date) {
      showToast('Lengkapi semua field wajib!'); return;
    }

    const btn = document.querySelector('#addGigForm button[onclick="adminAddGig()"]');
    if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-2"></i>Menyimpan...'; }

    try {
      await API.gigs.add({
        title, musisiName, venue, kota, provinsi, genre,
        date, timeStart, priceMin, priceMax, isFree,
        poster: '🎸', description: desc, ticketUrl,
        submittedBy: 'admin',
      });
      showToast('Gig berhasil ditambahkan!');
      document.getElementById('addGigForm').classList.add('hidden');
      // Reset form
      ['ag-title','ag-musisi-name','ag-venue','ag-desc','ag-ticket-url','ag-price-min','ag-price-max'].forEach(id => {
        const el = document.getElementById(id); if (el) el.value = '';
      });
      renderGigsAdmin();
    } catch (e) {
      showToast(e.message || 'Gagal menyimpan gig.');
    } finally {
      if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fa-solid fa-paper-plane mr-2"></i>Simpan Gig'; }
    }
  };

  window.renderGigsAdmin = async function () {
    const tbody = document.getElementById('gigsAdminTable');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="8" class="text-center py-8 text-gray-500">Memuat...</td></tr>';
    try {
      const gigs = await API.gigs.all({ status: 'all' });
      if (!gigs.length) {
        tbody.innerHTML = '<tr><td colspan="8" class="text-center py-8 text-gray-500">Belum ada gig</td></tr>';
        return;
      }
      tbody.innerHTML = gigs.map(g => {
        const months = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Ags','Sep','Okt','Nov','Des'];
        const d      = new Date(g.date + 'T00:00:00');
        const dateStr = `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
        const price   = g.isFree ? '<span class="text-green-400 text-xs">Gratis</span>'
          : `<span class="text-xs text-gray-300">Rp${(g.priceMin/1000).toFixed(0)}k</span>`;
        const statusBadge = {
          upcoming:  '<span class="badge badge-published">Upcoming</span>',
          completed: '<span class="badge badge-verified">Selesai</span>',
          cancelled: '<span class="badge" style="background:#3a1010;color:#f06">Batal</span>',
        }[g.status] || '';

        return `<tr>
          <td class="text-white font-semibold">${g.poster} ${g.title}</td>
          <td class="text-gray-400 text-xs">${g.venue}<br><span class="text-gray-500">${g.kota}</span></td>
          <td class="text-gray-400 text-xs">${dateStr}<br><span class="text-gray-500">${g.timeStart}</span></td>
          <td class="text-gray-400 text-xs">${g.musisiName}</td>
          <td>${price}</td>
          <td class="text-gray-400">${g.goingCount}</td>
          <td>${statusBadge}</td>
          <td>
            <select onchange="updateGigStatus('${g.id}', this.value)"
              class="text-xs bg-black/30 border border-[#222230] rounded-lg px-2 py-1 text-gray-300 mr-1">
              <option value="upcoming"   ${g.status==='upcoming'   ? 'selected':''}>Upcoming</option>
              <option value="completed"  ${g.status==='completed'  ? 'selected':''}>Selesai</option>
              <option value="cancelled"  ${g.status==='cancelled'  ? 'selected':''}>Batal</option>
            </select>
            <button onclick="deleteGig('${g.id}')"
              class="text-red-400 hover:text-red-300 text-xs px-2 py-1 rounded hover:bg-red-500/10 transition">
              <i class="fa-solid fa-trash"></i>
            </button>
          </td>
        </tr>`;
      }).join('');
    } catch (e) {
      tbody.innerHTML = '<tr><td colspan="8" class="text-center py-8 text-red-400 text-xs">Gagal memuat gigs</td></tr>';
    }
  };

  window.updateGigStatus = async function (id, status) {
    await API.gigs.update(id, { status });
    showToast('Status gig diperbarui');
  };

  window.deleteGig = async function (id) {
    if (!confirm('Hapus gig ini?')) return;
    await API.gigs.delete(id);
    showToast('Gig dihapus');
    renderGigsAdmin();
  };

  // ── REVIEW LIST ───────────────────────────────────────────
  window.renderReview = async function () {
    const songs = (await API.songs.all()).filter(s => s.status === 'review');
    const el    = document.getElementById('reviewList');
    if (!songs.length) {
      el.innerHTML = '<div class="card p-12 text-center text-gray-500"><i class="fa-solid fa-check-circle text-4xl mb-3 block"></i>Tidak ada lagu yang perlu direview</div>';
      return;
    }
    el.innerHTML = songs.map(s => `
      <div class="card p-6 flex items-start gap-6">
        <div class="w-16 h-16 rounded-xl bg-gradient-to-br from-brand/30 to-yellow-500/20 flex items-center justify-center text-3xl flex-shrink-0">${s.cover}</div>
        <div class="flex-1">
          <div class="flex items-start justify-between">
            <div>
              <h4 class="font-bold text-white">${s.title}</h4>
              <p class="text-gray-400 text-sm">${s.musisiName} · ${s.genre} · ${s.duration}</p>
              <p class="text-gray-500 text-xs mt-1">${s.desc || ''}</p>
            </div>
            <span class="text-xs text-gray-500">${s.uploaded}</span>
          </div>
          <div class="flex gap-3 mt-4">
            <button onclick="approveSong('${s.id}');renderReview();" class="bg-green-500/20 hover:bg-green-500/30 text-green-400 text-sm px-5 py-2 rounded-xl transition flex items-center gap-2">
              <i class="fa-solid fa-check"></i> Setujui
            </button>
            <button onclick="deleteSong('${s.id}');renderReview();" class="bg-red-500/10 hover:bg-red-500/20 text-red-400 text-sm px-5 py-2 rounded-xl transition flex items-center gap-2">
              <i class="fa-solid fa-times"></i> Tolak
            </button>
          </div>
        </div>
      </div>
    `).join('');
  };

  // ── ACTIONS ───────────────────────────────────────────────
  window.verifyMusisi = async function (id) {
    await API.musisi.update(id, { verified: true });
    renderMusisiTable();
    showToast('Musisi berhasil diverifikasi!');
  };

  window.deleteUser = async function (id) {
    if (!confirm('Hapus pengguna ini?')) return;
    await API.users.delete(id);
    renderUsersTable();
    showToast('Pengguna dihapus');
  };

  window.deleteSong = async function (id) {
    await API.songs.delete(id);
    loadOverview();
    showToast('Lagu dihapus');
  };

  window.approveSong = async function (id) {
    await API.songs.update(id, { status: 'published' });
    loadOverview();
    showToast('Lagu disetujui dan dipublikasikan!');
  };

  window.deleteMusisi = async function (id) {
    if (!confirm('Hapus musisi ini?')) return;
    await API.musisi.delete(id);
    renderMusisiTable();
    showToast('Musisi dihapus');
  };

  window.logout = async function () {
    await API.auth.logout();
    location.href = 'login.html';
  };

  // Init
  loadOverview();
});
