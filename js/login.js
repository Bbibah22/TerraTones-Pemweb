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

