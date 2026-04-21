// ── Elementos del DOM ────────────────────────────────────────────────────────
const form      = document.getElementById('login-form');
const submitBtn = document.getElementById('submit-btn');
const alert     = document.getElementById('alert');
const alertText = document.getElementById('alert-text');
const togglePw  = document.getElementById('toggle-pw');
const pwInput   = document.getElementById('password');
const eyeIcon   = document.getElementById('eye-icon');

// ── Mostrar / ocultar contraseña ─────────────────────────────────────────────
togglePw.addEventListener('click', () => {
  const isHidden = pwInput.type === 'password';
  pwInput.type = isHidden ? 'text' : 'password';

  eyeIcon.innerHTML = isHidden
    // ícono "ojo cerrado"
    ? `<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
       <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
       <line x1="1" y1="1" x2="23" y2="23"/>`
    // ícono "ojo abierto"
    : `<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
       <circle cx="12" cy="12" r="3"/>`;
});

// ── Mostrar error ─────────────────────────────────────────────────────────────
function showError(msg) {
  alertText.textContent = msg;
  alert.classList.add('visible');
}

function hideError() {
  alert.classList.remove('visible');
}

// ── Submit ────────────────────────────────────────────────────────────────────
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  hideError();

  const email    = document.getElementById('email').value.trim();
  const password = pwInput.value;

  // Validación básica en cliente
  if (!email || !password) {
    showError('Completá todos los campos');
    return;
  }

  // Estado de carga
  submitBtn.disabled = true;
  submitBtn.classList.add('loading');

  try {
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (res.ok) {
      // Redirigir al dashboard (o donde necesites)
      window.location.href = data.redirect || '/dashboard.html';
    } else {
      showError(data.message || 'Credenciales incorrectas');
    }
  } catch {
    showError('No se pudo conectar con el servidor');
  } finally {
    submitBtn.disabled = false;
    submitBtn.classList.remove('loading');
  }
});
