import { auth, db } from './firebase-config.js';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js';
import { doc, setDoc, getDoc } from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js';

const provider = new GoogleAuthProvider();

function $(id) { return document.getElementById(id); }

async function createUserDocIfMissing(user, displayName) {
  const ref = doc(db, 'users', user.uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, {
      name: displayName || user.displayName || '',
      email: user.email || '',
      progress: { favorites: [], seen: [] },
      createdAt: new Date().toISOString()
    });
  }
}

async function mergeProgressToLocal(user) {
  try {
    const ref = doc(db, 'users', user.uid);
    const snap = await getDoc(ref);
    if (!snap.exists()) return;
    const data = snap.data();
    const progress = data.progress || { favorites: [], seen: [] };
    const localFavs = JSON.parse(localStorage.getItem('termosFavoritos') || '[]');
    const mergedFavs = Array.from(new Set([...(localFavs || []), ...(progress.favorites || [])]));
    localStorage.setItem('termosFavoritos', JSON.stringify(mergedFavs));
    const localSeen = JSON.parse(localStorage.getItem('sinaisVistos') || '[]');
    const mergedSeen = Array.from(new Set([...(localSeen || []), ...(progress.seen || [])]));
    localStorage.setItem('sinaisVistos', JSON.stringify(mergedSeen));
  } catch (err) { console.error('mergeProgressToLocal', err); }
}

async function saveProgressFromLocalToFirestore(user) {
  try {
    const favs = JSON.parse(localStorage.getItem('termosFavoritos') || '[]');
    const seen = JSON.parse(localStorage.getItem('sinaisVistos') || '[]');
    const ref = doc(db, 'users', user.uid);
    await setDoc(ref, { progress: { favorites: favs, seen: seen } }, { merge: true });
  } catch (err) { console.error('saveProgressFromLocalToFirestore', err); }
}

onAuthStateChanged(auth, async (user) => {
  if (user) {
    await createUserDocIfMissing(user);
    await mergeProgressToLocal(user);
    window.currentUser = { uid: user.uid, email: user.email, name: user.displayName };
    // Persiste a sessão para o Header 2 (Praticar/Sinalário) reconhecê-la.
    localStorage.setItem('isLoggedIn', 'true');
  } else {
    localStorage.removeItem('isLoggedIn');
    const protectedPages = ['/sinalario.html', '/praticar.html'];
    const pathname = window.location.pathname;
    if (protectedPages.some(p => pathname.endsWith(p))) {
      const redirect = encodeURIComponent(window.location.pathname + window.location.search);
      window.location.href = `index.html?auth=login&next=${redirect}`;
    }
  }
  window.dispatchEvent(new CustomEvent('auth-changed'));
});

window.Auth = {
  isLoggedIn: () => !!auth.currentUser,
  registerWithEmail: async (name, email, pass) => {
    const cred = await createUserWithEmailAndPassword(auth, email, pass);
    try { await cred.user.updateProfile({ displayName: name }); } catch (e) {}
    await createUserDocIfMissing(cred.user, name);
    await mergeProgressToLocal(cred.user);
    return cred.user;
  },
  loginWithEmail: async (email, pass) => {
    const cred = await signInWithEmailAndPassword(auth, email, pass);
    await mergeProgressToLocal(cred.user);
    return cred.user;
  },
  loginWithGoogle: async () => {
    const cred = await signInWithPopup(auth, provider);
    await createUserDocIfMissing(cred.user);
    await mergeProgressToLocal(cred.user);
    return cred.user;
  },
  saveProgress: async () => {
    const user = auth.currentUser;
    if (user) await saveProgressFromLocalToFirestore(user);
  }
};

document.addEventListener('DOMContentLoaded', () => {
  const regForm = $('registerForm');
  if (regForm) {
    regForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = $('regName').value.trim();
      const email = $('regEmail').value.trim();
      const pass = $('regPass').value;
      const fb = $('registerFeedback');
      if (fb) fb.textContent = '';
      try {
        await window.Auth.registerWithEmail(name, email, pass);
        if (fb) { fb.style.color = '#059669'; fb.textContent = 'Conta criada com sucesso. Redirecionando...'; }
        setTimeout(() => location.href = 'index.html', 800);
      } catch (err) { if (fb) { fb.style.color = '#ef4444'; fb.textContent = err.message || 'Erro'; } }
    });
  }

  const loginForm = $('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = $('loginEmail').value.trim();
      const pass = $('loginPass').value;
      const fb = $('loginFeedback');
      if (fb) fb.textContent = '';
      try {
        await window.Auth.loginWithEmail(email, pass);
        const params = new URLSearchParams(window.location.search);
        const next = params.get('next');
        location.href = next ? decodeURIComponent(next) : 'index.html';
      } catch (err) { if (fb) { fb.style.color = '#ef4444'; fb.textContent = err.message || 'Erro'; } }
    });

    const btnGoogle = $('btnGoogle');
    if (btnGoogle) {
      btnGoogle.addEventListener('click', async () => {
        const fb = $('loginFeedback');
        if (fb) fb.textContent = '';
        try { await window.Auth.loginWithGoogle(); location.href = 'index.html'; }
        catch (err) { if (fb) { fb.style.color = '#ef4444'; fb.textContent = 'Erro no login'; } }
      });
    }
  }

  const btnGoogleRegister = $('btnGoogleRegister');
  if (btnGoogleRegister) {
    btnGoogleRegister.addEventListener('click', async () => {
      const fb = $('registerFeedback');
      if (fb) fb.textContent = '';
      try { await window.Auth.loginWithGoogle(); location.href = 'index.html'; }
      catch (err) { if (fb) { fb.style.color = '#ef4444'; fb.textContent = 'Erro no cadastro'; } }
    });
  }

  setInterval(async () => {
    if (auth.currentUser) {
      try { await window.Auth.saveProgress(); } catch (e) {}
    }
  }, 10000);
});