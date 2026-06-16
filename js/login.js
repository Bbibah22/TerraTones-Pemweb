// ============================================================
// js/login.js — Logika Halaman Login
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
  const params    = new URLSearchParams(location.search);
  const roleParam = params.get('role');
  let currentRole = roleParam || 'user';

  const hints = {
    user:   'Demo: budi@mail.com / user123',
    musisi: 'Demo: arjuna@mail.com / musisi123',
    admin:  'Demo: admin@lokalbeat.id / admin123',
  };

  // Set role awal dari query param jika ada
  if (roleParam) setRole(roleParam);

  // ── Set Role Tab ──────────────────────────────────────────
  window.setRole = function (role) {
    currentRole = role;
    document.querySelectorAll('.role-tab').forEach(t => t.classList.remove('active-tab'));
    document.getElementById('tab-' + role).classList.add('active-tab');
    document.getElementById('hintText').textContent = hints[role];
  };

  // ── Toggle Password Visibility ───────────────────────────
  window.togglePass = function () {
    const inp = document.getElementById('password');
    const ico = document.getElementById('eyeIcon');
    if (inp.type === 'password') {
      inp.type = 'text';
      ico.className = 'fa-regular fa-eye-slash';
    } else {
      inp.type = 'password';
      ico.className = 'fa-regular fa-eye';
    }
  };

  // ── Do Login ──────────────────────────────────────────────
  window.doLogin = async function () {
    const email = document.getElementById('email').value.trim();
    const pass  = document.getElementById('password').value;

    if (!email || !pass) { showToast('Isi email dan password!', 'error'); return; }

    try {
      const user = await API.auth.login(email, pass, currentRole);
      showToast('Login berhasil! Mengalihkan...', 'success');
      setTimeout(() => {
        if (user.role === 'admin')  location.href = 'admin-dashboard.html';
        else if (user.role === 'musisi') location.href = 'musisi-dashboard.html';
        else location.href = 'user-dashboard.html';
      }, 1000);
    } catch (err) {
      showToast(err.message || 'Login gagal!', 'error');
    }
  };

  // Enter key shortcut
  document.addEventListener('keydown', e => { if (e.key === 'Enter') doLogin(); });
});
