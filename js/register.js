// ============================================================
// js/register.js — Logika Halaman Registrasi
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
  let selectedRole = '';

  // Pre-select role dari URL param
  const rp = new URLSearchParams(location.search).get('role');
  if (rp) { selectRole(rp); nextStep(); }

  // ── Pilih Role ────────────────────────────────────────────
  window.selectRole = function (role) {
    selectedRole = role;
    document.querySelectorAll('.role-card').forEach(c => c.classList.remove('selected'));
    document.getElementById('card-' + role).classList.add('selected');
  };

  // ── Navigasi Step ─────────────────────────────────────────
  window.nextStep = function () {
    if (!selectedRole) { showToast('Pilih peranmu terlebih dahulu!', 'error'); return; }
    document.getElementById('step1').classList.add('hidden');
    document.getElementById('step2').classList.remove('hidden');
    if (selectedRole === 'musisi') document.getElementById('musisiFields').classList.remove('hidden');
  };

  window.prevStep = function () {
    document.getElementById('step2').classList.add('hidden');
    document.getElementById('step1').classList.remove('hidden');
    document.getElementById('musisiFields').classList.add('hidden');
  };

  // ── Register ──────────────────────────────────────────────
  window.doRegister = async function () {
    const name  = document.getElementById('reg-name').value.trim();
    const email = document.getElementById('reg-email').value.trim();
    const pass  = document.getElementById('reg-pass').value;

    if (!name || !email || !pass) { showToast('Lengkapi semua kolom!', 'error'); return; }
    if (pass.length < 6) { showToast('Password minimal 6 karakter!', 'error'); return; }

    const payload = { name, email, password: pass, role: selectedRole };

    if (selectedRole === 'musisi') {
      payload.stage_name = document.getElementById('reg-stagename').value.trim();
      payload.genre      = document.getElementById('reg-genre').value;
      payload.kota       = document.getElementById('reg-kota').value.trim();
      if (!payload.stage_name || !payload.genre || !payload.kota) {
        showToast('Lengkapi data musisi!', 'error'); return;
      }
    }

    try {
      const user = await API.auth.register(payload);
      showToast('Akun berhasil dibuat! Mengalihkan...', 'success');
      setTimeout(() => {
        if (user.role === 'musisi') location.href = 'musisi-dashboard.html';
        else location.href = 'user-dashboard.html';
      }, 1200);
    } catch (err) {
      showToast(err.message || 'Registrasi gagal!', 'error');
    }
  };
});
