// ← Update this to your deployed Render URL after deployment
const API_BASE = 'http://localhost:8000'
const API = `${API_BASE}/api`

// ── DOM refs ──────────────────────────────────────────────────────────────────
const loadingView  = document.getElementById('loading-view')
const loginView    = document.getElementById('login-view')
const loggedInView = document.getElementById('logged-in-view')
const emailInput   = document.getElementById('email')
const passwordInput= document.getElementById('password')
const loginBtn     = document.getElementById('login-btn')
const logoutBtn    = document.getElementById('logout-btn')
const alertBox     = document.getElementById('alert')
const userNameEl   = document.getElementById('user-name')
const userAvatarEl = document.getElementById('user-avatar')

// ── View helpers ──────────────────────────────────────────────────────────────
function showView(name) {
  loadingView.style.display  = name === 'loading'   ? 'block' : 'none'
  loginView.style.display    = name === 'login'     ? 'block' : 'none'
  loggedInView.style.display = name === 'loggedIn'  ? 'block' : 'none'
}

function showAlert(msg, type = 'error') {
  alertBox.textContent = msg
  alertBox.className   = `alert ${type} show`
}

function hideAlert() {
  alertBox.className = 'alert'
}

function setLoginLoading(on) {
  loginBtn.disabled    = on
  loginBtn.textContent = on ? 'Signing in...' : 'Sign In'
}

// ── On popup open: check if already logged in ─────────────────────────────────
chrome.storage.local.get(['access_token', 'username'], ({ access_token, username }) => {
  if (access_token && username) {
    showLoggedIn(username)
  } else {
    showView('login')
  }
})

function showLoggedIn(username) {
  userNameEl.textContent   = username
  userAvatarEl.textContent = username.charAt(0).toUpperCase()
  showView('loggedIn')
}

// ── Login ─────────────────────────────────────────────────────────────────────
loginBtn.addEventListener('click', async () => {
  const email    = emailInput.value.trim()
  const password = passwordInput.value

  if (!email || !password) {
    showAlert('Please enter email and password.')
    return
  }

  hideAlert()
  setLoginLoading(true)

  try {
    const res = await fetch(`${API}/auth/login/`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ email, password }),
    })

    const data = await res.json()

    if (res.ok) {
      // Store token + username in chrome.storage (persists across sessions)
      await chrome.storage.local.set({
        access_token:  data.tokens.access,
        refresh_token: data.tokens.refresh,
        username:      data.user.username,
      })
      showLoggedIn(data.user.username)
    } else {
      const msg = data.non_field_errors?.[0] || data.detail || 'Invalid email or password.'
      showAlert(msg)
    }
  } catch {
    showAlert('Cannot connect to server. Is the backend running?')
  } finally {
    setLoginLoading(false)
  }
})

// Submit on Enter key
passwordInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') loginBtn.click()
})

// ── Logout ────────────────────────────────────────────────────────────────────
logoutBtn.addEventListener('click', async () => {
  await chrome.storage.local.remove(['access_token', 'refresh_token', 'username'])
  emailInput.value    = ''
  passwordInput.value = ''
  showView('login')
})
