const DB = {
  // ---------- helpers ----------
  get(key) { try { return JSON.parse(localStorage.getItem('lb_' + key)) || null; } catch { return null; } },
  set(key, val) { localStorage.setItem('lb_' + key, JSON.stringify(val)); },
  remove(key) { localStorage.removeItem('lb_' + key); },

  // ---------- seed defaults ----------
  init() {
    if (!this.get('seeded')) {
      this.set('users', defaultUsers);
      this.set('songs', defaultSongs);
      this.set('musisi', defaultMusisi);
      this.set('seeded', true);
    }
  },

  // ---------- auth ----------
  login(email, password) {
    const users = this.get('users') || [];
    return users.find(u => u.email === email && u.password === password) || null;
  },
  currentUser() { return this.get('currentUser'); },
  setCurrentUser(u) { this.set('currentUser', u); },
  logout() { this.remove('currentUser'); },

  // ---------- users ----------
  getUsers() { return this.get('users') || []; },
  addUser(u) {
    const users = this.getUsers();
    if (users.find(x => x.email === u.email)) return false;
    users.push(u);
    this.set('users', users);
    return true;
  },
  updateUser(id, data) {
    const users = this.getUsers().map(u => u.id === id ? {...u, ...data} : u);
    this.set('users', users);
  },
  deleteUser(id) { this.set('users', this.getUsers().filter(u => u.id !== id)); },

  // ---------- songs ----------
  getSongs() { return this.get('songs') || []; },
  addSong(s) { const songs = this.getSongs(); songs.unshift(s); this.set('songs', songs); },
  updateSong(id, data) { this.set('songs', this.getSongs().map(s => s.id === id ? {...s, ...data} : s)); },
  deleteSong(id) { this.set('songs', this.getSongs().filter(s => s.id !== id)); },
  getSongsByMusisi(musisiId) { return this.getSongs().filter(s => s.musisiId === musisiId); },

  // ---------- musisi ----------
  getMusisi() { return this.get('musisi') || []; },
  getMusisiById(id) { return this.getMusisi().find(m => m.id === id); },
  updateMusisi(id, data) { this.set('musisi', this.getMusisi().map(m => m.id === id ? {...m, ...data} : m)); },

  // ---------- likes ----------
  getLikes() { return this.get('likes') || []; },
  toggleLike(userId, songId) {
    let likes = this.getLikes();
    const key = `${userId}_${songId}`;
    if (likes.includes(key)) { likes = likes.filter(l => l !== key); }
    else { likes.push(key); }
    this.set('likes', likes);
    return likes.includes(key);
  },
  isLiked(userId, songId) { return (this.getLikes()).includes(`${userId}_${songId}`); },

  // ---------- playlist ----------
  getPlaylists(userId) { return (this.get('playlists') || []).filter(p => p.userId === userId); },
  addPlaylist(p) { const pl = this.get('playlists') || []; pl.push(p); this.set('playlists', pl); },
};


// export-like (accessible globally)
window.DB = DB;
window.defaultMusisi = defaultMusisi;
window.defaultSongs = defaultSongs;
window.defaultUsers = defaultUsers;
