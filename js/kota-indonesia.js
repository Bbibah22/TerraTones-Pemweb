// ============================================================
// js/kota-indonesia.js — Data kota & provinsi Indonesia
// ============================================================

const PROVINSI_INDONESIA = [
  'Aceh','Sumatera Utara','Sumatera Barat','Riau','Kepulauan Riau',
  'Jambi','Bengkulu','Sumatera Selatan','Kepulauan Bangka Belitung','Lampung',
  'DKI Jakarta','Jawa Barat','Banten','Jawa Tengah','DI Yogyakarta','Jawa Timur',
  'Bali','Nusa Tenggara Barat','Nusa Tenggara Timur',
  'Kalimantan Barat','Kalimantan Tengah','Kalimantan Selatan','Kalimantan Timur','Kalimantan Utara',
  'Sulawesi Utara','Gorontalo','Sulawesi Tengah','Sulawesi Barat','Sulawesi Selatan','Sulawesi Tenggara',
  'Maluku','Maluku Utara','Papua Barat','Papua','Papua Selatan','Papua Tengah','Papua Pegunungan'
];

const KOTA_PER_PROVINSI = {
  'Aceh': ['Banda Aceh','Langsa','Lhokseumawe','Sabang','Subulussalam'],
  'Sumatera Utara': ['Medan','Binjai','Gunungsitoli','Padangsidimpuan','Pematangsiantar','Sibolga','Tanjungbalai','Tebing Tinggi'],
  'Sumatera Barat': ['Padang','Bukittinggi','Padangpanjang','Pariaman','Payakumbuh','Sawahlunto','Solok'],
  'Riau': ['Pekanbaru','Dumai'],
  'Kepulauan Riau': ['Tanjungpinang','Batam'],
  'Jambi': ['Jambi','Sungai Penuh'],
  'Bengkulu': ['Bengkulu'],
  'Sumatera Selatan': ['Palembang','Lubuklinggau','Pagar Alam','Prabumulih'],
  'Kepulauan Bangka Belitung': ['Pangkalpinang'],
  'Lampung': ['Bandar Lampung','Metro'],
  'DKI Jakarta': ['Jakarta Pusat','Jakarta Utara','Jakarta Barat','Jakarta Selatan','Jakarta Timur'],
  'Jawa Barat': ['Bandung','Bekasi','Bogor','Cimahi','Cirebon','Depok','Sukabumi','Tasikmalaya','Banjar'],
  'Banten': ['Serang','Cilegon','Tangerang','Tangerang Selatan'],
  'Jawa Tengah': ['Semarang','Magelang','Pekalongan','Salatiga','Solo','Surakarta','Tegal'],
  'DI Yogyakarta': ['Yogyakarta'],
  'Jawa Timur': ['Surabaya','Batu','Blitar','Kediri','Madiun','Malang','Mojokerto','Pasuruan','Probolinggo'],
  'Bali': ['Denpasar'],
  'Nusa Tenggara Barat': ['Mataram','Bima'],
  'Nusa Tenggara Timur': ['Kupang'],
  'Kalimantan Barat': ['Pontianak','Singkawang'],
  'Kalimantan Tengah': ['Palangka Raya'],
  'Kalimantan Selatan': ['Banjarmasin','Banjarbaru'],
  'Kalimantan Timur': ['Samarinda','Balikpapan','Bontang'],
  'Kalimantan Utara': ['Tarakan'],
  'Sulawesi Utara': ['Manado','Bitung','Kotamobagu','Tomohon'],
  'Gorontalo': ['Gorontalo'],
  'Sulawesi Tengah': ['Palu'],
  'Sulawesi Barat': ['Mamuju'],
  'Sulawesi Selatan': ['Makassar','Palopo','Parepare'],
  'Sulawesi Tenggara': ['Kendari','Baubau'],
  'Maluku': ['Ambon','Tual'],
  'Maluku Utara': ['Ternate','Tidore Kepulauan'],
  'Papua Barat': ['Manokwari','Sorong'],
  'Papua': ['Jayapura'],
  'Papua Selatan': ['Merauke'],
  'Papua Tengah': ['Nabire'],
  'Papua Pegunungan': ['Wamena'],
};

// Render dropdown provinsi
function renderProvinsiSelect(selectId, selectedVal = '') {
  const el = document.getElementById(selectId);
  if (!el) return;
  el.innerHTML = '<option value="">Pilih provinsi...</option>' +
    PROVINSI_INDONESIA.map(p =>
      `<option value="${p}" ${p === selectedVal ? 'selected' : ''}>${p}</option>`
    ).join('');
}

// Render dropdown kota berdasarkan provinsi yang dipilih
function renderKotaSelect(selectId, provinsi, selectedVal = '') {
  const el = document.getElementById(selectId);
  if (!el) return;
  const kota = KOTA_PER_PROVINSI[provinsi] || [];
  el.innerHTML = '<option value="">Pilih kota...</option>' +
    kota.map(k =>
      `<option value="${k}" ${k === selectedVal ? 'selected' : ''}>${k}</option>`
    ).join('');
}

// Expose global
window.PROVINSI_INDONESIA  = PROVINSI_INDONESIA;
window.KOTA_PER_PROVINSI   = KOTA_PER_PROVINSI;
window.renderProvinsiSelect = renderProvinsiSelect;
window.renderKotaSelect     = renderKotaSelect;
