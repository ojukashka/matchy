// public/js/script.js

document.addEventListener('DOMContentLoaded', () => {
  const API_URL = 'http://localhost:3000/api';

  // =================================================================
  // LOGIK FÜR DIE REGISTRIERUNGSSEITE (register.html)
  // =================================================================
  const registerForm = document.getElementById('register-form');
  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const username = document.getElementById('username').value;
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;

      try {
        const res = await fetch(`${API_URL}/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, email, password }),
        });
        const data = await res.json();
        if (res.status === 201) {
          alert('Registrierung erfolgreich! Du kannst dich jetzt einloggen.');
          window.location.href = '../pages/login.html'; // KORRIGIERTER PFAD
        } else {
          alert('Fehler: ' + data.message);
        }
      } catch (error) {
        alert('Ein Fehler ist aufgetreten.');
      }
    });
  }

  // =================================================================
  // LOGIK FÜR DIE LOGIN-SEITE (login.html)
  // =================================================================
  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;

      try {
        const res = await fetch(`${API_URL}/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });
        const data = await res.json();
        if (res.ok) {
          localStorage.setItem('token', data.token);
          localStorage.setItem('username', data.username);
          alert('Login erfolgreich!');
          window.location.href = '../pages/profile.html'; // KORRIGIERTER PFAD
        } else {
          alert('Fehler: ' + data.message);
        }
      } catch (error) {
        alert('Ein Fehler ist aufgetreten.');
      }
    });
  }

  // =================================================================
  // LOGIK FÜR DIE PROFILSEITE (profile.html)
  // =================================================================
  if (window.location.pathname.includes('profile.html')) {
    const token = localStorage.getItem('token');

    // Holt die Daten vom Backend
    async function fetchProfileData(token) {
      try {
        const response = await fetch(`${API_URL}/profile`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          localStorage.clear();
          window.location.href = '../pages/login.html'; // KORRIGIERTER PFAD
          return;
        }

        const userData = await response.json();
        displayProfileData(userData);
      } catch (error) {
        console.error('Fehler beim Abrufen der Profildaten:', error);
      }
    }

    // Schreibt die empfangenen Daten ins HTML
    function displayProfileData(userData) {
      const nameElement = document.querySelector(
        '#profile-name-field .main-info'
      );
      const roleElement = document.querySelector(
        '#profile-role-field .main-info'
      );
      const roleLabelElement = document.querySelector(
        '#profile-role-field .label'
      );

      if (nameElement && roleElement) {
        nameElement.textContent = userData.username;
        roleElement.textContent = userData.email;
        roleLabelElement.textContent = 'E-Mail';
      }
    }

    // Prüfen, ob ein Token vorhanden ist. Wenn nicht, zurück zum Login.
    if (!token) {
      alert('Bitte zuerst einloggen.');
      window.location.href = '../pages/login.html'; // KORRIGIERTER PFAD
    } else {
      fetchProfileData(token);
    }

    // Logout-Button-Logik
    const logoutButton = document.getElementById('logout-button');
    if (logoutButton) {
      logoutButton.addEventListener('click', () => {
        localStorage.removeItem('token');
        localStorage.removeItem('username');
        alert('Du wurdest erfolgreich ausgeloggt.');
        window.location.href = '/frontend';
      });
    }
  }

  // =================================================================
  // LOGIK FÜR DIE HAUPTSEITE (index.html)
  // =================================================================
  // Diese Logik prüft auf jeder Seite, ob der Login/Profil-Link angezeigt werden soll
  const token = localStorage.getItem('token');
  const loginLink = document.getElementById('login-link');
  const profileLink = document.getElementById('profile-link');
  const registerLink = document.getElementById('register-link'); // Hinzugefügt

  if (token && loginLink && profileLink && registerLink) {
    loginLink.style.display = 'none';
    registerLink.style.display = 'none'; // Registrierungslink auch ausblenden
    profileLink.style.display = 'inline';
  }
});
