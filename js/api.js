// ============================================================
// js/api.js — LokalBeat API Client
// Menggantikan data.js (localStorage) dengan fetch ke PHP backend
// ============================================================

// Deteksi base path secara otomatis (works di /lokalbeat/ atau root)
const BASE = (() => {
  const p = location.pathname;
  // Jika berada di /pages/, naik satu level
  const inPages = p.includes('/pages/');
  const root = inPages ? '../' : './';
  return root;
})();

const API = {

  // ─── Helper fetch ─────────────────────────────────────────
  async _req(method, url, body = null) {
    const opts = {
      method,
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    };
    if (body) opts.body = JSON.stringify(body);
    const res = await fetch(BASE + url, opts);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
    return data;
  },

  get:    (url)         => API._req('GET',    url),
  post:   (url, body)   => API._req('POST',   url, body),
  patch:  (url, body)   => API._req('PATCH',  url, body),
  delete: (url)         => API._req('DELETE', url),

  // ─── Auth ─────────────────────────────────────────────────
  auth: {
    me()                    { return API.get('api/auth.php?action=me'); },
    login(email, pw, role)  { return API.post('api/auth.php?action=login', { email, password: pw, role }); },
    logout()                { return API.post('api/auth.php?action=logout'); },
    register(data)          { return API.post('api/auth.php?action=register', data); },
  },

  // ─── Songs ────────────────────────────────────────────────
  songs: {
    all(params = {})   {
      const qs = new URLSearchParams(params).toString();
      return API.get('api/songs.php' + (qs ? '?' + qs : ''));
    },
    add(data)          { return API.post('api/songs.php', data); },
    update(id, data)   { return API.patch(`api/songs.php?id=${id}`, data); },
    delete(id)         { return API.delete(`api/songs.php?id=${id}`); },
    byMusisi(msId)     { return API.songs.all({ musisi_id: msId }); },

    // Upload file MP3 ke server, kemudian update song record dengan file_url
    async uploadFile(file, songId = null) {
      const formData = new FormData();
      formData.append('file', file);
      if (songId) formData.append('song_id', songId);

      const res = await fetch(BASE + 'api/upload.php', {
        method: 'POST',
        credentials: 'include',
        body: formData,   // JANGAN set Content-Type manual — browser akan set boundary otomatis
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `Upload gagal: HTTP ${res.status}`);
      return data;  // { success, url, filename, size }
    },
  },

  // ─── Musisi ───────────────────────────────────────────────
  musisi: {
    all()              { return API.get('api/musisi.php'); },
    get(id)            { return API.get(`api/musisi.php?id=${id}`); },
    update(id, data)   { return API.patch(`api/musisi.php?id=${id}`, data); },
    delete(id)         { return API.delete(`api/musisi.php?id=${id}`); },
  },

  // ─── Users (admin) ────────────────────────────────────────
  users: {
    all(q = '')        { return API.get('api/users.php' + (q ? `?q=${encodeURIComponent(q)}` : '')); },
    delete(id)         { return API.delete(`api/users.php?id=${id}`); },
  },

  // ─── Likes ────────────────────────────────────────────────
  likes: {
    byUser(userId)            { return API.get(`api/likes.php?user_id=${userId}`); },
    toggle(userId, songId)    { return API.post('api/likes.php', { userId, songId }); },
  },

  // ─── Follows ──────────────────────────────────────────────
  follows: {
    // Daftar musisi yang difollow user
    byUser(userId)              { return API.get(`api/follows.php?user_id=${userId}`); },
    // Cek apakah user follow musisi tertentu
    check(userId, musisiId)     { return API.get(`api/follows.php?user_id=${userId}&musisi_id=${musisiId}`); },
    // Feed lagu dari musisi yang difollow
    feed(userId, limit = 30)    { return API.get(`api/follows.php?feed=1&user_id=${userId}&limit=${limit}`); },
    // Toggle follow / unfollow
    toggle(userId, musisiId)    { return API.post('api/follows.php', { userId, musisiId }); },
  },

  // ─── Gigs ─────────────────────────────────────────────────
  gigs: {
    all(params = {}) {
      const qs = new URLSearchParams(params).toString();
      return API.get('api/gigs.php' + (qs ? '?' + qs : ''));
    },
    withMeta(params = {}) {
      return API.get('api/gigs.php?' + new URLSearchParams({ ...params, with_meta: 1 }));
    },
    get(id)            { return API.get(`api/gigs.php?id=${id}`); },
    add(data)          { return API.post('api/gigs.php', data); },
    update(id, data)   { return API.patch(`api/gigs.php?id=${id}`, data); },
    delete(id)         { return API.delete(`api/gigs.php?id=${id}`); },
    toggleGoing(gigId, userId)  { return API.post('api/gigs.php?action=going', { gigId, userId }); },
    checkGoing(gigId, userId)   { return API.get(`api/gigs.php?action=check_going&gig_id=${gigId}&user_id=${userId}`); },
    byMusisi(musisiId) { return API.gigs.all({ musisi_id: musisiId }); },
  },
};

// ─── Utilitas global ────────────────────────────────────────

function fmtNum(n) {
  return n >= 1000 ? (n / 1000).toFixed(1) + 'K' : n;
}

function showToast(msg, type = 'success') {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.className = `toast ${type} show`;
  setTimeout(() => t.classList.remove('show'), 3000);
}

// Expose secara global
window.API      = API;
window.fmtNum   = fmtNum;
window.showToast = showToast;
