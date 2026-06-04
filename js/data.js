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

// =============================================
// SEED DATA
// =============================================

const defaultUsers = [
  { id: 'u1', name: 'Admin LokalBeat', email: 'admin@lokalbeat.id', password: 'admin123', role: 'admin', avatar: '🛡️', joined: '2024-01-01', status: 'active' },
  { id: 'u2', name: 'Budi Santoso', email: 'budi@mail.com', password: 'user123', role: 'user', avatar: '🎧', joined: '2024-03-15', status: 'active' },
  { id: 'u3', name: 'Rina Melati', email: 'rina@mail.com', password: 'user123', role: 'user', avatar: '🎵', joined: '2024-04-20', status: 'active' },
  { id: 'm1', name: 'Arjuna Band', email: 'arjuna@mail.com', password: 'musisi123', role: 'musisi', avatar: '🎸', joined: '2024-02-10', status: 'active', musisiId: 'ms1' },
  { id: 'm2', name: 'Dewi Nada', email: 'dewi@mail.com', password: 'musisi123', role: 'musisi', avatar: '🎤', joined: '2024-03-05', status: 'active', musisiId: 'ms2' },
  { id: 'm3', name: 'Trio Kota', email: 'trio@mail.com', password: 'musisi123', role: 'musisi', avatar: '🥁', joined: '2024-04-01', status: 'pending', musisiId: 'ms3' },
];

const defaultMusisi = [
  { id: 'ms1', userId: 'm1', name: 'Arjuna Band', genre: 'Indie Folk', kota: 'Yogyakarta', bio: 'Band indie folk dari Jogja yang menggabungkan gamelan dengan gitar akustik.', followers: 2840, songs: 12, verified: true, cover: '🎸', streams: 48200 },
  { id: 'ms2', userId: 'm2', name: 'Dewi Nada', genre: 'Jazz Lokal', kota: 'Jakarta', bio: 'Penyanyi jazz muda dengan nuansa lokal yang kental. Terinspirasi dari keroncong dan bossanova.', followers: 1560, songs: 8, verified: true, cover: '🎤', streams: 31000 },
  { id: 'ms3', userId: 'm3', name: 'Trio Kota', genre: 'Pop Alternatif', kota: 'Bandung', bio: 'Trio dari Bandung yang membawa warna pop alternatif segar di kancah musik Indonesia.', followers: 980, songs: 5, verified: false, cover: '🥁', streams: 15400 },
  { id: 'ms4', userId: null, name: 'Senja Merah', genre: 'R&B Lokal', kota: 'Surabaya', bio: 'Duo R&B yang membawa nuansa urban Surabaya ke dalam musik modern.', followers: 3200, songs: 15, verified: true, cover: '🎹', streams: 62000 },
];

const defaultSongs = [
  { id: 's1', title: 'Rindu Tanah Air', musisiId: 'ms1', musisiName: 'Arjuna Band', genre: 'Indie Folk', duration: '4:12', streams: 12400, likes: 342, status: 'published', uploaded: '2025-04-01', cover: '🌿', desc: 'Lagu tentang kerinduan akan kampung halaman.' },
  { id: 's2', title: 'Mentari Pagi', musisiId: 'ms2', musisiName: 'Dewi Nada', genre: 'Jazz Lokal', duration: '3:45', streams: 8900, likes: 218, status: 'published', uploaded: '2025-04-10', cover: '☀️', desc: 'Jazz manis untuk mengawali hari.' },
  { id: 's3', title: 'Kota Hujan', musisiId: 'ms3', musisiName: 'Trio Kota', genre: 'Pop Alternatif', duration: '3:58', streams: 5600, likes: 176, status: 'published', uploaded: '2025-04-15', cover: '🌧️', desc: 'Ode untuk Bogor, kota hujan.' },
  { id: 's4', title: 'Senja di Bromo', musisiId: 'ms4', musisiName: 'Senja Merah', genre: 'R&B Lokal', duration: '4:30', streams: 19800, likes: 504, status: 'published', uploaded: '2025-03-28', cover: '🌋', desc: 'Pesona senja di kaki Bromo.' },
  { id: 's5', title: 'Jalan Pulang', musisiId: 'ms1', musisiName: 'Arjuna Band', genre: 'Indie Folk', duration: '5:02', streams: 9200, likes: 267, status: 'published', uploaded: '2025-03-20', cover: '🏡', desc: 'Perjalanan kembali ke rumah.' },
  { id: 's6', title: 'Bintang Selatan', musisiId: 'ms2', musisiName: 'Dewi Nada', genre: 'Jazz Lokal', duration: '3:22', streams: 7100, likes: 194, status: 'published', uploaded: '2025-04-18', cover: '⭐', desc: 'Bintang yang selalu menemani.' },
  { id: 's7', title: 'Pasar Malam', musisiId: 'ms4', musisiName: 'Senja Merah', genre: 'R&B Lokal', duration: '3:55', streams: 14300, likes: 388, status: 'review', uploaded: '2025-04-22', cover: '🏮', desc: 'Suasana pasar malam yang meriah.' },
  { id: 's8', title: 'Angin Laut', musisiId: 'ms3', musisiName: 'Trio Kota', genre: 'Pop Alternatif', duration: '4:08', streams: 3400, likes: 98, status: 'review', uploaded: '2025-04-25', cover: '🌊', desc: 'Semilir angin pantai selatan.' },
];

// export-like (accessible globally)
window.DB = DB;
window.defaultMusisi = defaultMusisi;
window.defaultSongs = defaultSongs;
window.defaultUsers = defaultUsers;
