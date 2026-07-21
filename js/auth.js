// Authentication flow with local demo accounts.
(() => {
  const AUTH_KEY = 'northstar-hms-auth';
  const demoUsers = {
    admin: { password: 'admin123', role: 'Admin' },
    doctor: { password: 'doctor123', role: 'Doctor' },
    reception: { password: 'reception123', role: 'Receptionist' }
  };

  function login(username, password) {
    const user = demoUsers[username];
    if (!user || user.password !== password) {
      window.HMS.utils.showToast('Invalid username or password', 'error');
      return false;
    }
    localStorage.setItem(AUTH_KEY, JSON.stringify({ username, role: user.role }));
    window.HMS.utils.showToast(`Welcome ${username}`, 'success');
    return true;
  }

  function requireAuth() {
    const auth = JSON.parse(localStorage.getItem(AUTH_KEY) || 'null');
    if (!auth) {
      window.location.href = 'login.html';
      return false;
    }
    return true;
  }

  function logout() {
    localStorage.removeItem(AUTH_KEY);
    window.location.href = 'login.html';
  }

  document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
      loginForm.addEventListener('submit', (event) => {
        event.preventDefault();
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value.trim();
        if (login(username, password)) {
          window.location.href = 'dashboard.html';
        }
      });
    }

    const logoutLink = document.getElementById('logout-link');
    if (logoutLink) {
      logoutLink.addEventListener('click', (event) => {
        event.preventDefault();
        logout();
      });
    }

    if (document.body.dataset.page !== 'login') {
      requireAuth();
    }
  });

  window.HMS = window.HMS || {};
  window.HMS.auth = { login, logout, requireAuth };
})();
