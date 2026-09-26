// ── Imports ──────────────────────────────────────────────────────────────────
import { initializeApp } from 'firebase/app';
import {
  getAuth, onAuthStateChanged, signInWithEmailAndPassword,
  createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider,
  signOut, sendPasswordResetEmail
} from 'firebase/auth';
import { getDataConnect, subscribe } from 'firebase/data-connect';
import { getDatabase, ref, push, onChildAdded, serverTimestamp, off, get, query as databaseQuery, limitToLast } from 'firebase/database';
import { getFirestore, collection, addDoc, getDocs, query, where, serverTimestamp as firestoreTimestamp, setDoc, doc, getDoc } from 'firebase/firestore';
import {
  connectorConfig, getUser, createUser, listHelpRequests, createHelpRequest,
  listApplicationsByApplicant, listMyHelpRequestsWithApplications, listApplicationsForMyRequests,
  createApplication, updateApplicationStatus, updateHelpRequestStatus,
  createConversation, listConversations,
  listConversationsRef,
  listPendingUsers, listAllUsers, listAllHelpRequestsAdmin, listAllApplicationsAdmin,
  updateUserStatus, terminateJob, completeJob, getUserProfile,
  deleteUser, deleteApplication
} from '@work4abit/dataconnect';

// ── Firebase Config ──────────────────────────────────────────────────────────
const firebaseConfig = {
  apiKey: "AIzaSyAu53ZLxN_6p_BKZUWSE6R8aMbn_iKP91s",
  authDomain: "work4abit.firebaseapp.com",
  projectId: "work4abit",
  storageBucket: "work4abit.firebasestorage.app",
  messagingSenderId: "1019650332467",
  appId: "1:1019650332467:web:70a55093445cbf4689d046",
  measurementId: "G-3CD953WGTS",
  databaseURL: "https://work4abit-default-rtdb.asia-southeast1.firebasedatabase.app"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const dc = getDataConnect(app, connectorConfig);
const db = getDatabase(app);
const firestore = getFirestore(app);
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// ── Constants ────────────────────────────────────────────────────────────────
const ADMIN_EMAILS = [
  'charlesjanparaggua@gmail.com',
  'anryurmanita@gmail.com',
  'taguinodanathasia@gmail.com'
  // Add new admin emails here separated by commas:
  // 'anotheradmin@email.com'
];
const SERVER_ONLY = { fetchPolicy: 'SERVER_ONLY' };

// ── State ────────────────────────────────────────────────────────────────────
let currentUser = null;
let googleUser = null;


let userData = null;
const VALID_SECTIONS = ['dashboard', 'services', 'mentoring', 'applications', 'messages', 'transactions', 'ratings', 'profile', 'admin'];
const initialPath = window.location.pathname.replace(/^\/|\/$/g, '');
let activeSection = VALID_SECTIONS.includes(initialPath) ? initialPath : (sessionStorage.getItem('active_section') || 'dashboard');
if (VALID_SECTIONS.includes(initialPath)) {
  sessionStorage.setItem('active_section', initialPath);
}
let autoRefreshTimer = null;
let chatPollTimer = null;
let activeConvId = null;
let messageSubscription = null;
let conversationsSubscription = null;
let renderedMsgIds = new Set();
let pendingTempMessages = [];
let lastConversationsDigest = '';

// ── DOM Helpers ──────────────────────────────────────────────────────────────
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);
const peso = (n) => '₱' + Number(n || 0).toLocaleString('en-PH', { maximumFractionDigits: 0 });
const initials = (name = '') => name.split(' ').filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase();
const hide = (el) => el?.classList.add('hidden');
const show = (el) => el?.classList.remove('hidden');

function showToast(message, type = 'success') {
  const container = $('#toast-container');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = `toast ${type === 'error' ? 'toast-error' : ''}`;
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => {
    toast.remove();
  }, 3000);
}

function compressImage(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const max = 800;
        let w = img.width, h = img.height;
        if (w > max || h > max) {
          if (w > h) { h = Math.round(h * max / w); w = max; }
          else { w = Math.round(w * max / h); h = max; }
        }
        canvas.width = w; canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', 0.6));
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

// ── Realtime Multi-Client Synchronization Engine ─────────────────────────────
function startBackgroundSync() {
  if (autoRefreshTimer) clearInterval(autoRefreshTimer);

  // Background view synchronization
  // Increased interval to 60 seconds to prevent quota exhaustion
  autoRefreshTimer = setInterval(() => {
    if (!userData) return;
    if (activeSection === 'messages') {
      loadMessages(true);
    } else if (activeSection === 'dashboard') {
      loadDashboard(true);
    } else if (activeSection === 'applications') {
      loadApplications(true);
    } else if (activeSection === 'services') {
      loadServices(true);
    }
  }, 60000);
}

// Instant sync when tab gains focus
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && userData) {
    if (activeSection === 'messages') {
      loadMessages(true);
      
    } else if (activeSection === 'dashboard') {
      loadDashboard(true);
    } else if (activeSection === 'applications') {
      loadApplications(true);
    } else if (activeSection === 'services') {
      loadServices(true);
    }
  }
});

// ── Navigation ───────────────────────────────────────────────────────────────
function navigateTo(section, pushState = true) {
  activeSection = section;
  sessionStorage.setItem('active_section', section);

  $$('.content-section').forEach(s => s.classList.add('hidden'));
  const target = $(`#section-${section}`);
  if (target) {
    target.classList.remove('hidden');
  }

  $$('.nav-btn[data-target]').forEach(b => {
    b.classList.toggle('active', b.dataset.target === section);
  });

  if (pushState && window.location.pathname !== '/' + section) {
    history.pushState({ section }, '', '/' + section);
  }

  if (section === 'dashboard') loadDashboard();
  else if (section === 'services') loadServices();
    else if (section === 'mentoring') loadMentoring();
  else if (section === 'applications') loadApplications();
  else if (section === 'messages') loadMessages();
  else if (section === 'transactions') loadTransactions();
  else if (section === 'ratings') loadRatings();
  else if (section === 'profile') loadProfile();
  else if (section === 'admin') loadAdmin();
}

function showAuth(section = 'landing') {
  if (section === 'login') section = 'landing';
  if (autoRefreshTimer) { clearInterval(autoRefreshTimer); autoRefreshTimer = null; }
  if (chatPollTimer) { clearInterval(chatPollTimer); chatPollTimer = null; }
  if (messageSubscription) { 
    if (typeof messageSubscription === 'function') messageSubscription();
    else off(messageSubscription);
    messageSubscription = null; 
  }
  if (conversationsSubscription) { conversationsSubscription(); conversationsSubscription = null; }
  hide($('#app-views'));
  hide($('#loading-screen'));
  show($('#auth-views'));
  $$('#auth-views section').forEach(s => s.classList.add('hidden'));
  const target = $(`#section-${section}`);
  if (target) target.classList.remove('hidden');
}

function showApp() {
  hide($('#auth-views'));
  hide($('#loading-screen'));
  show($('#app-views'));

  // Admin button visibility
  const adminNav = $('#nav-admin');
  if (adminNav) {
    if (ADMIN_EMAILS.includes(userData?.email)) show(adminNav);
    else hide(adminNav);
  }

  // User Profile in Sidebar Footer & Header
  const userName = userData?.fullName || currentUser?.displayName || 'Student User';
  const userInitials = initials(userName);

  const sidebarName = $('#sidebar-user-name');
  if (sidebarName) sidebarName.textContent = userName;
  const sidebarAvatar = $('#sidebar-user-avatar');
  if (sidebarAvatar) sidebarAvatar.textContent = userInitials;

  const topAvatar = $('#dashboard-user-avatar');
  if (topAvatar) topAvatar.textContent = userInitials;

  navigateTo(activeSection || 'dashboard');
  startBackgroundSync();
}

// ── Auth Listener ────────────────────────────────────────────────────────────
function clearUserSessionDOM() {
  activeSection = 'dashboard';
  sessionStorage.removeItem('active_section');
  sessionStorage.removeItem('active_conversation_id');
  activeConvId = null;

  const avatar = $('#profile-avatar'); if (avatar) avatar.textContent = '';
  const name = $('#profile-name'); if (name) name.textContent = '';
  const faculty = $('#profile-faculty'); if (faculty) faculty.textContent = '';
  const studentId = $('#profile-student-id'); if (studentId) studentId.textContent = '';
  const bio = document.getElementById('profile-bio-display'); if (bio) bio.textContent = '';
  const skills = document.getElementById('profile-skills-display'); if (skills) skills.innerHTML = '';
  
  ['stat-app-pending', 'stat-app-completed', 'stat-app-terminated',
   'stat-emp-pending', 'stat-emp-completed', 'stat-emp-terminated'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = '0';
  });

  renderReviewsProfile([]);

  allTransactions = [];
  const transTbody = $('#transactions-tbody');
  if (transTbody) transTbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted" style="padding: 2rem;">No transaction history found.</td></tr>';
  const totalEl = $('#trans-total-earnings'); if (totalEl) totalEl.textContent = '₱0';
  const pendEl = $('#trans-pending-earnings'); if (pendEl) pendEl.textContent = '₱0';
  const compEl = $('#trans-completed-earnings'); if (compEl) compEl.textContent = '₱0';

  activeConvId = null;
  reviewTarget = null;
  conversations = [];
  lastConversationsDigest = '';
  activeAppliedIds = new Set();
}

onAuthStateChanged(auth, async (user) => {
  if (user) {
    if (userData && userData.id !== user.uid) {
      clearUserSessionDOM();
    }
    currentUser = user;
    try {
      const res = await getUser(dc, { id: user.uid }, SERVER_ONLY);
      if (res.data.user) {
        userData = { id: user.uid, ...res.data.user };
        if (userData.verificationStatus === 'pending') {
          showAuth('pending');
        } else {
          showApp();
        }
      } else {
        userData = null;
        showAuth('register');
      }
    } catch (err) {
      console.error('Data Connect user fetch error:', err);
      userData = null;
      showAuth('register');
    }
  } else {
    currentUser = null;
    userData = null;
    clearUserSessionDOM();
    showAuth('landing');
  }
});

// ── Landing Page ─────────────────────────────────────────────────────────────
function setupLanding() {
  const form = $('#landing-quick-login-form');
  const googleBtn = $('#landing-google-btn');
  const errorEl = $('#landing-login-error');
  const registerBtn = $('#landing-register-btn');
  const topRegisterBtn = $('#landing-top-register-btn');
  const topLoginBtn = $('#landing-top-login-btn');
  const forgotLink = $('#landing-forgot-link');

  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    hide(errorEl);
    const email = $('#landing-login-email').value.trim();
    const password = $('#landing-login-password').value;
    const btn = $('#landing-login-btn');
    btn.disabled = true; btn.textContent = 'Signing in...';
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      if (cred?.user?.uid) {
        setDoc(doc(firestore, "user_profiles", cred.user.uid), { authProvider: 'password' }, { merge: true }).catch(() => {});
      }
    } catch (err) {
      errorEl.textContent = err.code === 'auth/invalid-credential' ? 'Invalid email or password.' : (err.message || 'Login failed.');
      show(errorEl);
    } finally {
      btn.disabled = false;
      btn.textContent = 'Sign In';
    }
  });

  googleBtn?.addEventListener('click', async (e) => {
    e.preventDefault();
    hide(errorEl);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const res = await getUser(dc, { id: result.user.uid }, SERVER_ONLY);
      if (!res.data.user) {
        await signOut(auth);
        errorEl.textContent = 'Account not found. Please click Sign Up to register.';
        show(errorEl);
      } else {
        setDoc(doc(firestore, "user_profiles", result.user.uid), { authProvider: 'google' }, { merge: true }).catch(() => {});
      }
    } catch (err) {
      errorEl.textContent = err.message || 'Google login failed.';
      show(errorEl);
    }
  });

  registerBtn?.addEventListener('click', (e) => { e.preventDefault(); showAuth('register'); });
  topRegisterBtn?.addEventListener('click', (e) => { e.preventDefault(); showAuth('register'); });
  $('#landing-link-register')?.addEventListener('click', (e) => { e.preventDefault(); showAuth('register'); });
  topLoginBtn?.addEventListener('click', (e) => {
    e.preventDefault();
    $('#landing-login-email')?.focus();
  });
  forgotLink?.addEventListener('click', (e) => { e.preventDefault(); showAuth('forgot-password'); });
  $('#register-link-home')?.addEventListener('click', (e) => { e.preventDefault(); showAuth('landing'); });
}

// ── Register ─────────────────────────────────────────────────────────────────
function setupRegister() {
  const form = $('#register-form');
  const googleBtn = $('#register-google-btn');
  const errorEl = $('#register-error');
  
  const certInput = $('#register-certificate');
  const certPreview = $('#register-cert-preview');
  const certDropzone = $('#register-cert-dropzone');
  
  const facultySelect = $('#register-faculty');
  const facultyOtherGroup = $('#register-faculty-other-group');

  facultySelect?.addEventListener('change', (e) => {
    if (e.target.value === 'Others') {
      show(facultyOtherGroup);
    } else {
      hide(facultyOtherGroup);
    }
  });

  certDropzone?.addEventListener('click', () => { certInput?.click(); });

  // Global drag, drop and paste for the register page
  document.addEventListener('dragover', (e) => {
    const regSec = document.querySelector('#section-register');
    if (regSec && !regSec.classList.contains('hidden')) {
      e.preventDefault();
      if (certDropzone) certDropzone.style.borderColor = 'var(--primary-purple)';
    }
  });
  document.addEventListener('dragleave', (e) => {
    const regSec = document.querySelector('#section-register');
    if (regSec && !regSec.classList.contains('hidden')) {
      e.preventDefault();
      if (certDropzone) certDropzone.style.borderColor = '';
    }
  });
  document.addEventListener('drop', (e) => {
    const regSec = document.querySelector('#section-register');
    if (regSec && !regSec.classList.contains('hidden')) {
      e.preventDefault();
      if (certDropzone) certDropzone.style.borderColor = '';
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0 && certInput) {
        certInput.files = e.dataTransfer.files;
        certInput.dispatchEvent(new Event('change'));
      }
    }
  });
  
  document.addEventListener('paste', (e) => {
    const regSec = document.querySelector('#section-register');
    if (regSec && !regSec.classList.contains('hidden')) {
      if (e.clipboardData.files && e.clipboardData.files.length > 0 && certInput) {
        certInput.files = e.clipboardData.files;
        certInput.dispatchEvent(new Event('change'));
      }
    }
  });

  certInput?.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      certPreview.src = url;
      show(certPreview);
      hide(certDropzone);
    }
  });

  certPreview?.addEventListener('click', () => {
    certInput?.click();
  });

  googleBtn?.addEventListener('click', async (e) => {
    e.preventDefault();
    hide(errorEl);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const res = await getUser(dc, { id: result.user.uid }, SERVER_ONLY);
      if (res.data.user) {
        return;
      }
      googleUser = result.user;
      hide($('#register-email-group'));
      hide($('#register-password-row'));
      hide($('#register-divider'));
      hide(googleBtn);
      show($('#register-google-status'));
      $('#register-google-email').textContent = googleUser.email;
      $('#register-fullname').value = googleUser.displayName || '';
    } catch (err) {
      errorEl.textContent = err.message || 'Google link failed.';
      show(errorEl);
    }
  });

  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    hide(errorEl);
    const fullName = $('#register-fullname').value.trim();
    const studentId = $('#register-studentid').value.trim();
    const gender = $('#register-gender').value;
    const role = $('#register-role').value;
    let faculty = $('#register-faculty').value;
    const btn = $('#register-submit-btn');

    if (faculty === 'Others') {
      faculty = $('#register-faculty-other').value.trim();
      if (!faculty) {
        errorEl.textContent = 'Please specify your faculty reference.';
        show(errorEl);
        return;
      }
    }

    if (!fullName || !studentId) {
      errorEl.textContent = 'Please complete all required fields.';
      show(errorEl);
      return;
    }

    const certFile = certInput?.files?.[0];
    if (!certFile) {
      errorEl.textContent = 'Please upload your COE (Certificate of Enrollment).';
      show(errorEl);
      return;
    }

    btn.disabled = true; btn.textContent = 'Creating Account...';

    try {
      let uid, email, authProvider;
      if (googleUser) {
        uid = googleUser.uid;
        email = googleUser.email;
        authProvider = 'google';
      } else {
        email = $('#register-email').value.trim();
        const password = $('#register-password').value;
        const confirm = $('#register-confirm-password').value;
        if (!email || !password) {
          errorEl.textContent = 'Please enter an email and password.';
          show(errorEl);
          btn.disabled = false; btn.textContent = 'Create Account';
          return;
        }
        if (password !== confirm) {
          errorEl.textContent = 'Passwords do not match.';
          show(errorEl);
          btn.disabled = false; btn.textContent = 'Create Account';
          return;
        }
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        uid = cred.user.uid;
        authProvider = 'password';
      }

      let certUrl = 'none';
      if (certFile) {
        certUrl = await compressImage(certFile);
      }

      await createUser(dc, {
        id: uid, email, fullName,
        studentId: studentId || null,
        facultyReference: faculty || null,
        certificateUrl: certUrl,
        gender: gender || null
      });

      await setDoc(doc(firestore, "user_profiles", uid), { authProvider }, { merge: true });

      showAuth('pending');
    } catch (err) {
      errorEl.textContent = err.message || 'Registration failed.';
      show(errorEl);
    } finally {
      btn.disabled = false;
      btn.textContent = 'Create Account';
    }
  });

  $('#register-link-login')?.addEventListener('click', (e) => { e.preventDefault(); showAuth('landing'); });
}

// ── Forgot Password ──────────────────────────────────────────────────────────
function setupForgotPassword() {
  const form = $('#forgot-form');
  const emailInput = $('#forgot-email');
  const statusEl = $('#forgot-status-msg');
  const btn = $('#forgot-submit-btn');

  function showForgotMessage(htmlText, type = 'error') {
    if (!statusEl) return;
    statusEl.className = type === 'error' ? 'error-message' : (type === 'info' ? 'info-message' : 'success-message');
    statusEl.innerHTML = htmlText;
    show(statusEl);
  }

  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    hide(statusEl);
    const email = emailInput?.value.trim().toLowerCase();
    if (!email) return;

    btn.disabled = true;
    btn.textContent = 'Checking account...';

    try {
      // 1. Verify if account exists in the platform
      const usersRes = await listAllUsers(dc, SERVER_ONLY);
      const matchingUser = (usersRes?.data?.users || []).find(
        u => u.email && u.email.trim().toLowerCase() === email
      );

      if (!matchingUser) {
        showForgotMessage('Account does not exist. Please check your email or create a new account.', 'error');
        return;
      }

      // 2. Check registration method (Google Sign-In vs Email/Password)
      const profileDoc = await getDoc(doc(firestore, 'user_profiles', matchingUser.id));
      const profileData = profileDoc.exists() ? profileDoc.data() : null;

      if (profileData?.authProvider === 'google') {
        showForgotMessage(
          '<strong>Google Account:</strong> This account was created with Google Sign-In and does not have a separate password. Please sign in using the <strong>Sign in to Google</strong> button on the login page.',
          'info'
        );
        return;
      }

      // 3. For email/password accounts, send password reset link
      btn.textContent = 'Sending reset link...';
      await sendPasswordResetEmail(auth, email);
      showForgotMessage(
        `<strong>Password reset link sent!</strong> We've sent a link to <strong>${email}</strong>.<br><br>📬 <em>If you don't see it in your inbox, <strong>please check your Spam / Junk folder</strong>.</em>`,
        'success'
      );
    } catch (err) {
      showForgotMessage(err.message || 'Unable to send password reset link. Please try again.', 'error');
    } finally {
      btn.disabled = false;
      btn.textContent = 'Send Reset Link';
    }
  });

  $('#forgot-link-login')?.addEventListener('click', (e) => {
    e.preventDefault();
    hide(statusEl);
    showAuth('landing');
  });
  $('#pending-logout-btn')?.addEventListener('click', (e) => { e.preventDefault(); signOut(auth); });
}

// ── Dashboard (Dynamic Live Data) ────────────────────────────────────────────
async function loadDashboard(isSilent = false) {
  const welcomeEl = $('#dashboard-welcome');
  if (welcomeEl) {
    const firstName = (userData?.fullName || 'Student').split(' ')[0];
    welcomeEl.textContent = `Welcome back, ${firstName}!`;
  }

  try {
    const [reqRes, appRes, myPostRes, convRes, usersRes] = await Promise.all([
      listHelpRequests(dc, SERVER_ONLY),
      userData?.id ? listApplicationsByApplicant(dc, { userId: userData.id }, SERVER_ONLY) : { data: { applications: [] } },
      userData?.id ? listMyHelpRequestsWithApplications(dc, { userId: userData.id }, SERVER_ONLY) : { data: { helpRequests: [] } },
      userData?.id ? listConversations(dc, { userId: userData.id }, SERVER_ONLY) : { data: { conversations: [] } },
      listAllUsers(dc, SERVER_ONLY)
    ]);
    const requests = reqRes.data.helpRequests || [];
    const applications = appRes.data.applications || [];
    const myPostedJobs = myPostRes.data.helpRequests || [];
    const conversations = convRes.data.conversations || [];
    const allUsers = usersRes.data.users || [];

    const activeApps = applications.filter(a => a.status === 'PENDING' || a.status === 'APPROVED').length;
    let completedJobs = applications.filter(a => a.status === 'COMPLETED').length;
    myPostedJobs.forEach(j => {
      const completedApps = (j.applications_on_helpRequest || []).filter(a => a.status === 'COMPLETED');
      if (completedApps.length > 0) {
        completedJobs += completedApps.length;
      } else if (!isJobOffer(j) && j.status === 'COMPLETED') {
        completedJobs += 1;
      }
    });

    // Total Transactions (Role-aware earnings and spendings)
    let totalEarnings = 0;
    let totalSpent = 0;

    applications.forEach(a => {
      if (a.status === 'COMPLETED') {
        const isOffer = isJobOffer(a.helpRequest);
        const amt = Number(a.priceOffer) || 0;
        if (isOffer) {
          totalSpent += amt;
        } else {
          totalEarnings += amt;
        }
      }
    });

    myPostedJobs.forEach(j => {
      const isOffer = isJobOffer(j);
      const apps = j.applications_on_helpRequest || [];
      apps.forEach(a => {
        if (a.status === 'COMPLETED') {
          const amt = Number(a.priceOffer) || Number(j.budget) || 0;
          if (isOffer) {
            totalEarnings += amt;
          } else {
            totalSpent += amt;
          }
        }
      });
    });

    $('#stat-applied').textContent = activeApps;
    $('#stat-completed').textContent = completedJobs;
    $('#stat-earnings').innerHTML = totalSpent > 0 
    ? `<div style="font-size: 1.75rem;">${peso(totalEarnings)} <span style="font-size: 0.85rem; font-weight: 600; color: var(--color-green);">Earned</span></div>
       <div style="font-size: 1.15rem; color: var(--text-heading); margin-top: 0.15rem;">${peso(totalSpent)} <span style="font-size: 0.75rem; font-weight: 500; color: var(--text-muted);">Spent</span></div>` 
    : peso(totalEarnings);
    
    // Fetch real rating from Firestore
    let realRating = '0.0';
    if (userData?.id) {
      try {
        const q = query(collection(firestore, "reviews"), where("targetUserId", "==", userData.id));
        const revSnap = await getDocs(q);
        if (!revSnap.empty) {
          let sum = 0;
          revSnap.forEach(doc => sum += doc.data().rating);
          realRating = (sum / revSnap.size).toFixed(1);
        }
      } catch (e) {
        console.warn("Could not fetch ratings for dashboard", e);
      }
    }
    $('#stat-rating').innerHTML = `${realRating} <span class="text-amber">★</span>`;

    // Recommended Services Feed
    const listEl = $('#dashboard-listings');
    if (!isSilent) listEl.innerHTML = `<div class="job-list-item" style="border: none;">    <div class="skeleton-loader" style="width: 44px; height: 44px; border-radius: 12px; flex-shrink: 0;"></div>    <div class="job-item-info" style="width: 100%;">        <div class="skeleton-loader skeleton-title" style="margin-bottom: 8px; width: 60%; height: 16px;"></div>        <div class="skeleton-loader skeleton-line-short" style="margin-bottom: 0; width: 40%; height: 12px;"></div>    </div></div><div class="job-list-item" style="border: none;">    <div class="skeleton-loader" style="width: 44px; height: 44px; border-radius: 12px; flex-shrink: 0;"></div>    <div class="job-item-info" style="width: 100%;">        <div class="skeleton-loader skeleton-title" style="margin-bottom: 8px; width: 50%; height: 16px;"></div>        <div class="skeleton-loader skeleton-line-short" style="margin-bottom: 0; width: 30%; height: 12px;"></div>    </div></div><div class="job-list-item" style="border: none;">    <div class="skeleton-loader" style="width: 44px; height: 44px; border-radius: 12px; flex-shrink: 0;"></div>    <div class="job-item-info" style="width: 100%;">        <div class="skeleton-loader skeleton-title" style="margin-bottom: 8px; width: 70%; height: 16px;"></div>        <div class="skeleton-loader skeleton-line-short" style="margin-bottom: 0; width: 45%; height: 12px;"></div>    </div></div>`;
    
    // Filter out jobs the user posted themselves, only show OPEN jobs, hide expired jobs, and exclude listings exceeding the 100k cap (e.g. 1B placeholder)
    const now = new Date();
    const recommended = requests.filter(r => 
      (r.status === 'OPEN' || !r.status) && 
      r.requester?.id !== userData?.id && 
      (!r.deadline || new Date(r.deadline + 'T23:59:59') >= now) &&
      (Number(r.budget) <= 100000 && Number(r.budget) > 0)
    );
    
    if (recommended.length === 0) {
      listEl.innerHTML = '<div class="empty-state text-center text-muted" style="padding: 1.5rem;">No services available right now. Be the first to post!</div>';
    } else {
      listEl.innerHTML = '';
      const colors = ['job-icon-green', 'job-icon-purple', 'job-icon-cyan'];
      recommended.slice(0, 3).forEach((r, idx) => {
        const item = document.createElement('div');
        item.className = 'job-list-item';
        item.innerHTML = `
          <div class="job-icon-box ${colors[idx % colors.length]}">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
          </div>
          <div class="job-item-info">
            <h3 class="job-item-title">${r.title}</h3>
            <p class="job-item-subtext">${peso(r.budget)} · ${r.category || 'General'}</p>
          </div>
          <button type="button" class="bookmark-btn" title="View details">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>
          </button>
        `;
        item.addEventListener('click', (e) => { e.preventDefault(); navigateTo('services'); });
        listEl.appendChild(item);
      });
    }


        // Recommended Mentors Feed (2 with rating, 1 without)
    const mentorsEl = $('#dashboard-mentors');
    if (mentorsEl) {
      if (!isSilent) mentorsEl.innerHTML = `<div class="job-list-item" style="border: none;">    <div class="skeleton-loader" style="width: 44px; height: 44px; border-radius: 12px; flex-shrink: 0;"></div>    <div class="job-item-info" style="width: 100%;">        <div class="skeleton-loader skeleton-title" style="margin-bottom: 8px; width: 60%; height: 16px;"></div>        <div class="skeleton-loader skeleton-line-short" style="margin-bottom: 0; width: 40%; height: 12px;"></div>    </div></div><div class="job-list-item" style="border: none;">    <div class="skeleton-loader" style="width: 44px; height: 44px; border-radius: 12px; flex-shrink: 0;"></div>    <div class="job-item-info" style="width: 100%;">        <div class="skeleton-loader skeleton-title" style="margin-bottom: 8px; width: 50%; height: 16px;"></div>        <div class="skeleton-loader skeleton-line-short" style="margin-bottom: 0; width: 30%; height: 12px;"></div>    </div></div><div class="job-list-item" style="border: none;">    <div class="skeleton-loader" style="width: 44px; height: 44px; border-radius: 12px; flex-shrink: 0;"></div>    <div class="job-item-info" style="width: 100%;">        <div class="skeleton-loader skeleton-title" style="margin-bottom: 8px; width: 70%; height: 16px;"></div>        <div class="skeleton-loader skeleton-line-short" style="margin-bottom: 0; width: 45%; height: 12px;"></div>    </div></div>`;
      
      try {
        // Fetch all reviews from Firestore to figure out ratings
        
          // Fetch all reviews and profiles from Firestore
          const [allReviewsSnap, profilesSnap] = await Promise.all([
             getDocs(collection(firestore, "reviews")),
             getDocs(collection(firestore, "user_profiles"))
          ]);
          
          const userRatings = {};
          allReviewsSnap.forEach(doc => {
              const data = doc.data();
              if (data.targetUserId) {
                  if (!userRatings[data.targetUserId]) userRatings[data.targetUserId] = { sum: 0, count: 0 };
                  userRatings[data.targetUserId].sum += data.rating;
                  userRatings[data.targetUserId].count += 1;
              }
          });

          const userProfiles = {};
          profilesSnap.forEach(doc => { userProfiles[doc.id] = doc.data(); });
          
          const otherUsers = allUsers.filter(u => u.id !== userData?.id);
          const withRating = otherUsers.filter(u => userRatings[u.id]);
          const withoutRating = otherUsers.filter(u => !userRatings[u.id]);
          
          // Shuffle arrays
          const shuffledWith = withRating.sort(() => 0.5 - Math.random());
          const shuffledWithout = withoutRating.sort(() => 0.5 - Math.random());
          
          // Pick 2 with rating, 1 without (if available)
          let selectedMentors = [];
          if (shuffledWith.length >= 2) {
              selectedMentors.push(shuffledWith[0], shuffledWith[1]);
          } else {
              selectedMentors.push(...shuffledWith);
          }
          
          if (shuffledWithout.length >= 1) {
              selectedMentors.push(shuffledWithout[0]);
          }
          
          // Fill remaining if needed to get 3
          while (selectedMentors.length < 3 && (shuffledWith.length + shuffledWithout.length) > selectedMentors.length) {
              const unused = [...shuffledWith, ...shuffledWithout].filter(u => !selectedMentors.includes(u));
              if (unused.length) selectedMentors.push(unused[0]);
              else break;
          }
          
          // Shuffle the final 3
          selectedMentors = selectedMentors.sort(() => 0.5 - Math.random());
          
          if (selectedMentors.length === 0) {
            mentorsEl.innerHTML = '<div class="empty-state text-center text-muted" style="padding: 1.5rem;">No mentors available right now.</div>';
          } else {
            mentorsEl.innerHTML = '';
            const mColors = ['job-icon-purple', 'job-icon-cyan', 'job-icon-green'];
            selectedMentors.forEach((m, idx) => {
              const item = document.createElement('div');
              item.className = 'job-list-item';
              item.style.cursor = 'pointer';
              item.style.transition = 'background 0.2s';
              item.onmouseenter = () => item.style.background = 'var(--bg-main)';
              item.onmouseleave = () => item.style.background = 'transparent';
              
              const rData = userRatings[m.id];
              const rScore = rData ? (rData.sum / rData.count).toFixed(1) : 'New';
              const rIcon = rData ? '<span class="text-amber">★</span>' : '';
              
              const skills = userProfiles[m.id]?.skills || [];
              let skillsHtml = '';
              if (skills.length > 0) {
                 skillsHtml = '<div class="mt-1 flex flex-wrap gap-1 items-center">' + skills.slice(0, 3).map(s => `<span class="badge" style="background: rgba(255,255,255,0.05); font-size: 0.65rem; padding: 0.1rem 0.4rem; white-space: nowrap; border: 1px solid var(--border-light); color: var(--text-muted);">${s}</span>`).join('') + (skills.length > 3 ? '<span class="text-xs text-muted" style="font-size: 0.65rem;">+' + (skills.length - 3) + '</span>' : '') + '</div>';
              }
              
              item.innerHTML = `
                <div class="job-icon-box ${mColors[idx % mColors.length]}">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                </div>
                <div class="job-item-info" style="display: flex; flex-direction: column; justify-content: center;">
                  <h3 class="job-item-title">${m.fullName}</h3>
                  <p class="job-item-subtext" style="margin-bottom: 2px;">${m.preferredRole || 'Student'} • ${rScore} ${rIcon}</p>
                  ${skillsHtml}
                </div>
                <div style="margin-left: auto; color: var(--text-muted);">
                   <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"></path></svg>
                </div>
              `;
              
              item.addEventListener('click', () => {
                 navigateTo('mentoring');
                 activeMentoringTarget = m;
                 document.getElementById('mentoring-target-name').textContent = m.fullName;
                 document.getElementById('mentoring-apply-form').reset();
                 document.getElementById('dialog-mentoring-apply').showModal();
              });

              mentorsEl.appendChild(item);
            });
          }
} catch (err) {
        mentorsEl.innerHTML = '<div class="empty-state text-center text-muted">Could not load mentors.</div>';
      }
    }

    // Recent Applications Feed
    const recentAppsEl = $('#dashboard-recent-apps');
    if (!isSilent) recentAppsEl.innerHTML = `<div class="job-list-item" style="border: none;">    <div class="skeleton-loader" style="width: 44px; height: 44px; border-radius: 12px; flex-shrink: 0;"></div>    <div class="job-item-info" style="width: 100%;">        <div class="skeleton-loader skeleton-title" style="margin-bottom: 8px; width: 60%; height: 16px;"></div>        <div class="skeleton-loader skeleton-line-short" style="margin-bottom: 0; width: 40%; height: 12px;"></div>    </div></div><div class="job-list-item" style="border: none;">    <div class="skeleton-loader" style="width: 44px; height: 44px; border-radius: 12px; flex-shrink: 0;"></div>    <div class="job-item-info" style="width: 100%;">        <div class="skeleton-loader skeleton-title" style="margin-bottom: 8px; width: 50%; height: 16px;"></div>        <div class="skeleton-loader skeleton-line-short" style="margin-bottom: 0; width: 30%; height: 12px;"></div>    </div></div><div class="job-list-item" style="border: none;">    <div class="skeleton-loader" style="width: 44px; height: 44px; border-radius: 12px; flex-shrink: 0;"></div>    <div class="job-item-info" style="width: 100%;">        <div class="skeleton-loader skeleton-title" style="margin-bottom: 8px; width: 70%; height: 16px;"></div>        <div class="skeleton-loader skeleton-line-short" style="margin-bottom: 0; width: 45%; height: 12px;"></div>    </div></div>`;
    if (applications.length === 0) {
      recentAppsEl.innerHTML = '<div class="empty-state text-center text-muted" style="padding: 1rem;">No applications submitted yet.</div>';
    } else {
      recentAppsEl.innerHTML = '';
      applications.slice(0, 3).forEach(app => {
        const row = document.createElement('div');
        row.className = 'app-row-item';
        const isPending = app.status === 'PENDING';
        row.innerHTML = `
          <div class="avatar avatar-sm">${initials(app.helpRequest?.title || 'AP')}</div>
          <div class="app-row-info">
            <h4 class="app-row-title">${app.helpRequest?.title || 'Service Request'}</h4>
            <p class="app-row-meta"><span class="${isPending ? 'text-amber font-semibold' : 'text-green font-semibold'}">${app.status || 'Pending'}</span> · ${peso(app.priceOffer)}</p>
          </div>
        `;
        row.addEventListener('click', () => navigateTo('applications'));
        recentAppsEl.appendChild(row);
      });
    }

    // Recent Messages Feed
    const recentMsgEl = $('#dashboard-recent-messages');
    if (!isSilent) recentMsgEl.innerHTML = `<div class="job-list-item" style="border: none;">    <div class="skeleton-loader" style="width: 44px; height: 44px; border-radius: 12px; flex-shrink: 0;"></div>    <div class="job-item-info" style="width: 100%;">        <div class="skeleton-loader skeleton-title" style="margin-bottom: 8px; width: 60%; height: 16px;"></div>        <div class="skeleton-loader skeleton-line-short" style="margin-bottom: 0; width: 40%; height: 12px;"></div>    </div></div><div class="job-list-item" style="border: none;">    <div class="skeleton-loader" style="width: 44px; height: 44px; border-radius: 12px; flex-shrink: 0;"></div>    <div class="job-item-info" style="width: 100%;">        <div class="skeleton-loader skeleton-title" style="margin-bottom: 8px; width: 50%; height: 16px;"></div>        <div class="skeleton-loader skeleton-line-short" style="margin-bottom: 0; width: 30%; height: 12px;"></div>    </div></div><div class="job-list-item" style="border: none;">    <div class="skeleton-loader" style="width: 44px; height: 44px; border-radius: 12px; flex-shrink: 0;"></div>    <div class="job-item-info" style="width: 100%;">        <div class="skeleton-loader skeleton-title" style="margin-bottom: 8px; width: 70%; height: 16px;"></div>        <div class="skeleton-loader skeleton-line-short" style="margin-bottom: 0; width: 45%; height: 12px;"></div>    </div></div>`;
    if (conversations.length === 0) {
      recentMsgEl.innerHTML = '<div class="empty-state text-center text-muted" style="padding: 1rem;">No active chats yet.</div>';
    } else {
      recentMsgEl.innerHTML = '';
      await sortConversationsByActivity(conversations);
      conversations.slice(0, 2).forEach(conv => {
        const isPoster = conv.poster?.id === userData?.id;
        const otherUser = isPoster ? conv.applicant : conv.poster;
        const isCompleted = isConversationCompleted(conv);
        const row = document.createElement('div');
        row.className = 'message-row-item';
        row.innerHTML = `
          <div class="avatar avatar-sm">${initials(otherUser?.fullName || '')}</div>
          <div class="message-row-info">
            <div class="flex-between">
              <h4 class="message-row-name">${otherUser?.fullName || 'Peer'}</h4>
              <span class="${isCompleted ? 'badge badge-approved' : 'badge badge-pending'}" style="font-size: 10px; padding: 2px 7px;">${isCompleted ? 'Job Completed' : 'In Progress'}</span>
            </div>
            <p class="message-row-text truncate">${conv.application?.helpRequest?.title || 'Chat conversation'}</p>
          </div>
        `;
        row.addEventListener('click', () => {
          activeConvId = conv.id;
          sessionStorage.setItem('active_conversation_id', conv.id);
          navigateTo('messages');
        });
        recentMsgEl.appendChild(row);
      });
    }

  } catch (err) {
    console.error('Dashboard load error:', err);
  }
}

function setupDashboardLinks() {
  $('#dash-view-all-jobs')?.addEventListener('click', (e) => { e.preventDefault(); navigateTo('services'); });
  $('#dash-view-all-apps')?.addEventListener('click', (e) => { e.preventDefault(); navigateTo('applications'); });
  $('#dash-view-all-messages')?.addEventListener('click', (e) => { e.preventDefault(); navigateTo('messages'); });
  $('#dashboard-avatar-btn')?.addEventListener('click', (e) => { e.preventDefault(); navigateTo('profile'); });
}

// ── Find Services ────────────────────────────────────────────────────────────
let allRequests = [];
let activeAppliedIds = new Set();
let requestFilters = { q: '', category: '', maxPrice: Infinity, sort: 'newest' };

let currentServicesTab = 'offers'; // 'offers' | 'requests'

const knownStandingOfferIds = new Set();
try {
  const saved = JSON.parse(localStorage.getItem('standing_offer_ids') || '[]');
  if (Array.isArray(saved)) saved.forEach(id => knownStandingOfferIds.add(id));
} catch (e) {}

function markAsStandingOffer(id) {
  if (!id) return;
  knownStandingOfferIds.add(id);
  try {
    localStorage.setItem('standing_offer_ids', JSON.stringify(Array.from(knownStandingOfferIds)));
  } catch (e) {}
}

function isJobOffer(job) {
  if (!job) return false;
  const urg = (job.urgency || '').toUpperCase();
  if (urg === 'OFFER' || urg === 'STANDING') return true;
  if (job.id && knownStandingOfferIds.has(job.id)) return true;
  if (allRequests && allRequests.length > 0) {
    const found = allRequests.find(r => r.id === job.id);
    if (found) {
      const fUrg = (found.urgency || '').toUpperCase();
      if (fUrg === 'OFFER' || fUrg === 'STANDING') return true;
    }
  }
  // Heuristic for standing campus services with no deadline (or empty)
  const hasNoDeadline = !job.deadline || job.deadline === '' || job.deadline === null;
  const lower = `${job.title || ''} ${job.description || ''} ${job.category || ''}`.toLowerCase();
  if (hasNoDeadline && (
    lower.includes('3d print') ||
    lower.includes('laser') ||
    lower.includes('printing') ||
    lower.includes('repair') ||
    lower.includes('pcb milling') ||
    lower.includes('prototyp') ||
    lower.includes('standing offer') ||
    lower.includes('standing service')
  )) {
    return true;
  }
  return false;
}

function setServicesTab(tab) {
  currentServicesTab = tab;
  const isOffer = tab === 'offers';

  $('#tab-service-offers')?.classList.toggle('active', isOffer);
  $('#tab-service-requests')?.classList.toggle('active', !isOffer);

  const sub = $('#services-header-subtitle');
  if (sub) {
    sub.textContent = isOffer
      ? 'Standing campus services, printing, and equipment provided by fellow students (3D printing, laser cutting, ink printing, repair).'
      : 'Tasks and projects posted by students in need of assistance or technical talent from campus peers.';
  }

  if (isOffer) {
    $('#btn-post-offer')?.classList.add('btn-purple');
    $('#btn-post-offer')?.classList.remove('btn-outline');
    $('#btn-post-request')?.classList.remove('btn-purple');
    $('#btn-post-request')?.classList.add('btn-outline');
  } else {
    $('#btn-post-request')?.classList.add('btn-purple');
    $('#btn-post-request')?.classList.remove('btn-outline');
    $('#btn-post-offer')?.classList.remove('btn-purple');
    $('#btn-post-offer')?.classList.add('btn-outline');
  }

  renderServices(allRequests);
}

async function loadServices(isSilent = false) {
  const grid = $('#requests-grid');
  if (!isSilent) grid.innerHTML = '<div class="loader"></div>';
  try {
    const [reqRes, appRes] = await Promise.all([
      listHelpRequests(dc, SERVER_ONLY),
      userData?.id ? listApplicationsByApplicant(dc, { userId: userData.id }, SERVER_ONLY) : { data: { applications: [] } }
    ]);
    allRequests = reqRes.data.helpRequests || [];

    // Cache any existing standing offers
    allRequests.forEach(r => {
      if (isJobOffer(r)) markAsStandingOffer(r.id);
    });

    // Auto-restore check: check if any standing offers were closed accidentally by previous bug
    if (userData?.id) {
      try {
        const myJobsRes = await listMyHelpRequestsWithApplications(dc, { userId: userData.id }, SERVER_ONLY);
        const myJobs = myJobsRes.data.helpRequests || [];
        let hasRestored = false;
        for (const j of myJobs) {
          if (isJobOffer(j) && j.status === 'CLOSED') {
            await updateHelpRequestStatus(dc, { id: j.id, status: 'OPEN' });
            hasRestored = true;
          }
        }
        if (hasRestored) {
          const refreshed = await listHelpRequests(dc, SERVER_ONLY);
          allRequests = refreshed.data.helpRequests || [];
        }
      } catch (err) {
        console.warn('Auto-restore check error:', err);
      }
    }

    // Also check all help requests if admin query available to restore standing offers
    try {
      const allAdminRes = await listAllHelpRequestsAdmin(dc, SERVER_ONLY);
      const allAdminReqs = allAdminRes.data.helpRequests || [];
      let reopenedCount = 0;
      for (const req of allAdminReqs) {
        if (req.status === 'CLOSED' && isJobOffer(req)) {
          await updateHelpRequestStatus(dc, { id: req.id, status: 'OPEN' });
          markAsStandingOffer(req.id);
          reopenedCount++;
        }
      }
      if (reopenedCount > 0) {
        const refreshed = await listHelpRequests(dc, SERVER_ONLY);
        allRequests = refreshed.data.helpRequests || [];
      }
    } catch (e) {
      // Ignore if public admin query restricted
    }

    activeAppliedIds = new Set((appRes.data.applications || [])
      .filter(a => !isJobOffer(a.helpRequest) || ['PENDING', 'APPROVED'].includes(a.status))
      .map(a => a.helpRequest?.id)
      .filter(Boolean));
    renderServices(allRequests);
  } catch (err) {
    if (!isSilent) console.error("loadServices error:", err); grid.innerHTML = '<div class="empty-state">Error loading services.</div>';
  }
}

function renderServices(requests) {
  const grid = $('#requests-grid');
  const now = new Date();

  // Exclude mentoring requests from regular services marketplace
  const marketplaceRequests = requests.filter(r => {
    const isMentoring = r.category === 'MENTORING' || (r.title && r.title.toLowerCase().startsWith('mentoring:'));
    return !isMentoring;
  });

  // Calculate counts for badges using isJobOffer
  const totalOffers = marketplaceRequests.filter(r => isJobOffer(r) && Number(r.budget) <= 100000 && Number(r.budget) > 0).length;
  const totalRequests = marketplaceRequests.filter(r => !isJobOffer(r) && Number(r.budget) <= 100000 && Number(r.budget) > 0 && (!r.deadline || new Date(r.deadline + 'T23:59:59') >= now)).length;

  if ($('#offers-count-badge')) $('#offers-count-badge').textContent = totalOffers;
  if ($('#requests-count-badge')) $('#requests-count-badge').textContent = totalRequests;

  let filtered = marketplaceRequests.filter(r => {
    // Hide listings exceeding the 100k platform cap or non-positive
    if (Number(r.budget) > 100000 || Number(r.budget) <= 0) return false;

    // Filter by tab: offers vs requests
    const isOffer = isJobOffer(r);
    if (currentServicesTab === 'offers' && !isOffer) return false;
    if (currentServicesTab === 'requests' && isOffer) return false;

    // Hide expired listings for one-time requests
    if (!isOffer && r.deadline && new Date(r.deadline + 'T23:59:59') < now) return false;

    if (requestFilters.q) {
      const hay = `${r.title} ${r.description} ${r.category} ${r.requester?.fullName}`.toLowerCase();
      if (!hay.includes(requestFilters.q.toLowerCase())) return false;
    }
    if (requestFilters.category && r.category !== requestFilters.category) return false;
    if (requestFilters.maxPrice && Number(r.budget) > requestFilters.maxPrice) return false;
    return true;
  });

  if (requestFilters.sort === 'price_asc') filtered.sort((a, b) => a.budget - b.budget);
  else if (requestFilters.sort === 'price_desc') filtered.sort((a, b) => b.budget - a.budget);

  if ($('#requests-count')) {
    $('#requests-count').textContent = `${filtered.length} ${currentServicesTab === 'offers' ? 'service offer(s)' : 'service request(s)'} found`;
  }

  grid.innerHTML = '';
  if (filtered.length === 0) {
    grid.innerHTML = `<div class="empty-state text-center text-muted" style="grid-column: 1/-1; padding: 2rem;">No ${currentServicesTab === 'offers' ? 'service offers' : 'service requests'} found matching your criteria.</div>`;
    return;
  }

  filtered.forEach(r => {
    const isOffer = isJobOffer(r);
    const isMine = r.requester?.id === userData?.id;
    const hasApplied = activeAppliedIds.has(r.id);
    const isExpired = !isOffer && r.deadline ? new Date(r.deadline + 'T23:59:59') < new Date() : false;
    const card = document.createElement('article');
    card.className = 'request-card';

    let btnText = isOffer ? 'Avail Service' : 'Apply Now';
    let btnClass = 'btn-purple';
    let btnDisabled = false;

    if (isMine) {
      btnText = isOffer ? 'Your Offer' : 'Your Request';
      btnClass = 'btn-mine';
      btnDisabled = true;
    } else if (hasApplied) {
      btnText = isOffer ? 'Order Sent' : 'Applied';
      btnClass = 'btn-applied';
      btnDisabled = true;
    } else if (isExpired) {
      btnText = 'Expired';
      btnClass = 'btn-mine';
      btnDisabled = true;
    }

    const standingOrDeadline = isOffer
      ? `<span class="request-card-deadline" style="color: #4ade80; font-weight: 600;">⚡ Standing Service (Always Open)</span>`
      : (r.deadline
          ? (isExpired
              ? `<span class="request-card-deadline" style="color: #ef4444; font-weight: 600;">📅 Due ${r.deadline} (Expired)</span>`
              : `<span class="request-card-deadline">📅 Due ${r.deadline}</span>`)
          : '');

    const rightBadge = isOffer
      ? `<span class="badge badge-standing">⚡ Standing</span>`
      : `<span class="${r.urgency === 'Urgent' ? 'badge-urgent' : r.urgency === 'Low' ? 'badge-low' : 'badge-normal'}">${r.urgency === 'Urgent' ? '🔥 ' : ''}${r.urgency || 'Normal'}</span>`;

    card.innerHTML = `
      <div class="request-card-header">
        <div class="avatar avatar-sm cursor-pointer flex-shrink-0" onclick="openViewProfileDialog('${r.requester?.id}')">${initials(r.requester?.fullName || 'S')}</div>
        <div class="request-card-user">
          <strong class="request-card-name cursor-pointer hover:underline" onclick="openViewProfileDialog('${r.requester?.id}')">${r.requester?.fullName || (isOffer ? 'Student Provider' : 'Student Client')}</strong>
          <small class="text-muted text-xs" style="display: block; margin-top: 1px;">${isOffer ? '🛠️ Service Provider' : '📌 Client in need'}</small>
        </div>
        <div class="request-card-badge">
          ${rightBadge}
        </div>
      </div>
      <h3 class="request-card-title">${r.title}</h3>
      <p class="request-card-desc line-clamp-3">${r.description || 'No description provided.'}</p>
      <div class="request-card-meta">
        <span class="badge badge-normal">${r.category || 'General'}</span>
        ${standingOrDeadline}
      </div>
      <div class="request-card-footer">
        <div>
          <small class="text-muted">${isOffer ? 'Starting Rate' : 'Budget'}</small>
          <div class="request-card-price">${peso(r.budget)}</div>
        </div>
        <button type="button" class="btn ${btnClass} btn-sm apply-btn" ${btnDisabled ? 'disabled' : ''}>
          ${btnText}
        </button>
      </div>
    `;

    if (!isMine && !hasApplied && !isExpired) {
      card.querySelector('.apply-btn').addEventListener('click', (e) => {
        e.preventDefault();
        openApplyDialog(r);
      });
    }
    grid.appendChild(card);
  });
}

function setupServiceFilters() {
  $('#tab-service-offers')?.addEventListener('click', (e) => {
    e.preventDefault();
    setServicesTab('offers');
  });

  $('#tab-service-requests')?.addEventListener('click', (e) => {
    e.preventDefault();
    setServicesTab('requests');
  });

  $('#filter-search')?.addEventListener('input', (e) => {
    requestFilters.q = e.target.value;
    renderServices(allRequests);
  });

  $('#filter-category')?.addEventListener('input', (e) => {
    requestFilters.category = e.target.value;
    renderServices(allRequests);
  });

  $('#filter-sort')?.addEventListener('change', (e) => {
    requestFilters.sort = e.target.value;
    renderServices(allRequests);
  });

  $('#filter-budget')?.addEventListener('input', (e) => {
    requestFilters.maxPrice = e.target.value ? Number(e.target.value) : Infinity;
    renderServices(allRequests);
  });

  $('#btn-reset-filters')?.addEventListener('click', (e) => {
    e.preventDefault();
    requestFilters = { q: '', category: '', maxPrice: 20000, sort: 'newest' };
    $('#filter-search').value = '';
    $('#filter-category').value = '';
    $('#filter-sort').value = 'newest';
    if ($('#filter-budget')) $('#filter-budget').value = '';
    requestFilters.maxPrice = Infinity;
    renderServices(allRequests);
  });
}

// ── New Listing Dialog (Service Offer vs Service Request) ────────────────────
function setNewListingModalMode(mode = 'OFFER') {
  const isOffer = mode === 'OFFER';
  const typeInput = $('#nr-listing-type');
  if (typeInput) typeInput.value = mode;

  $('#modal-tab-offer')?.classList.toggle('active', isOffer);
  $('#modal-tab-request')?.classList.toggle('active', !isOffer);

  const titleHeader = $('#new-listing-modal-title');
  const titleDesc = $('#new-listing-modal-desc');
  const titleLabel = $('#nr-title-label');
  const titleInput = $('#nr-title');
  const descLabel = $('#nr-desc-label');
  const descInput = $('#nr-description');
  const budgetLabel = $('#nr-budget-label');
  const budgetInput = $('#nr-budget');
  const urgencyGroup = $('#nr-urgency-group');
  const standingNoteGroup = $('#nr-standing-note-group');
  const deadlineGroup = $('#nr-deadline-group');
  const submitBtn = $('#new-request-submit');

  if (isOffer) {
    if (titleHeader) titleHeader.textContent = 'Post a Service Offer';
    if (titleDesc) titleDesc.textContent = 'Offer your equipment (3D printing, laser cutting, paper printing) or skills. Standing services stay active continuously for multiple orders.';
    if (titleLabel) titleLabel.textContent = 'Service Title *';
    if (titleInput) titleInput.placeholder = 'e.g. 3D Printing & Prototyping (FDM / Resin)';
    if (descLabel) descLabel.textContent = 'Service Description *';
    if (descInput) descInput.placeholder = 'Describe your service, materials, printer specifications, turnaround time...';
    if (budgetLabel) budgetLabel.textContent = 'Starting Price / Base Rate (₱) *';
    if (budgetInput) budgetInput.placeholder = '150';
    if (urgencyGroup) urgencyGroup.style.display = 'none';
    if (standingNoteGroup) standingNoteGroup.style.display = 'block';
    if (deadlineGroup) deadlineGroup.style.display = 'none';
    if (submitBtn) submitBtn.textContent = 'Publish Service Offer';
  } else {
    if (titleHeader) titleHeader.textContent = 'Post a Service Request';
    if (titleDesc) titleDesc.textContent = 'Describe a task, project, or problem where you need technical help or service from campus peers.';
    if (titleLabel) titleLabel.textContent = 'Request / Task Title *';
    if (titleInput) titleInput.placeholder = 'e.g. Help Debugging ESP32 FreeRTOS Code';
    if (descLabel) descLabel.textContent = 'Task Description & Requirements *';
    if (descInput) descInput.placeholder = 'Describe the job, tasks, deliverables, and expectations...';
    if (budgetLabel) budgetLabel.textContent = 'Budget / Payment (₱) *';
    if (budgetInput) budgetInput.placeholder = '800';
    if (urgencyGroup) urgencyGroup.style.display = 'block';
    if (standingNoteGroup) standingNoteGroup.style.display = 'none';
    if (deadlineGroup) deadlineGroup.style.display = 'block';
    if (submitBtn) submitBtn.textContent = 'Publish Service Request';
  }
}

function setupNewRequestDialog() {
  $('#btn-post-offer')?.addEventListener('click', (e) => {
    e.preventDefault();
    setNewListingModalMode('OFFER');
    $('#dialog-new-request').showModal();
  });

  $('#btn-post-request')?.addEventListener('click', (e) => {
    e.preventDefault();
    setNewListingModalMode('REQUEST');
    const dl = $('#nr-deadline');
    if (dl) dl.min = new Date().toISOString().split('T')[0];
    $('#dialog-new-request').showModal();
  });

  $('#modal-tab-offer')?.addEventListener('click', (e) => {
    e.preventDefault();
    setNewListingModalMode('OFFER');
  });

  $('#modal-tab-request')?.addEventListener('click', (e) => {
    e.preventDefault();
    setNewListingModalMode('REQUEST');
  });

  $('#new-request-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const budget = Number($('#nr-budget').value);
    if (budget > 100000) {
      showToast('Maximum amount allowed is ₱100,000.', 'error');
      return;
    }
    if (budget < 1) {
      showToast('Minimum amount is ₱1.', 'error');
      return;
    }

    const mode = $('#nr-listing-type')?.value || 'OFFER';
    const isOffer = mode === 'OFFER';
    const urgency = isOffer ? 'OFFER' : ($('#nr-urgency').value || 'Normal');
    const deadline = isOffer ? null : ($('#nr-deadline').value || null);

    if (!isOffer && deadline && new Date(deadline + 'T23:59:59') < new Date()) {
      showToast('Deadline cannot be in the past.', 'error');
      return;
    }

    const btn = $('#new-request-submit');
    btn.disabled = true; btn.textContent = 'Publishing...';
    try {
      await createHelpRequest(dc, {
        title: $('#nr-title').value.trim(),
        description: $('#nr-description').value.trim(),
        budget: budget,
        requesterId: userData.id,
        category: $('#nr-category').value || null,
        urgency: urgency,
        deadline: deadline
      });
      showToast(isOffer ? 'Service offer published! It will stay active for ongoing orders.' : 'Service request published successfully!');
      $('#dialog-new-request').close();
      e.target.reset();
      setServicesTab(isOffer ? 'offers' : 'requests');
      loadServices();
      loadDashboard(true);
    } catch (err) {
      showToast('Could not post: ' + err.message, 'error');
    } finally {
      btn.disabled = false;
      btn.textContent = isOffer ? 'Publish Service Offer' : 'Publish Service Request';
    }
  });
}

// ── Apply / Avail Dialog ─────────────────────────────────────────────────────
let applyTarget = null;

function openApplyDialog(request) {
  applyTarget = request;
  const isOffer = isJobOffer(request);

  $('#apply-modal-title').textContent = isOffer ? 'Avail / Order Service' : 'Submit Your Application';
  $('#apply-job-title').textContent = `${isOffer ? 'Service Offer' : 'Job Request'}: ${request.title}`;
  $('#apply-amount-label').textContent = isOffer ? 'Your Proposed Budget / Rate (₱) *' : 'Proposed Rate (₱) *';
  $('#apply-amount').value = request.budget || '';

  const msgLabel = $('#apply-message-label');
  const msgInput = $('#apply-message');
  if (isOffer) {
    if (msgLabel) msgLabel.textContent = 'Order Details & Scope *';
    if (msgInput) msgInput.placeholder = 'Describe what you need printed/done, dimensions, materials, or project specifications...';
  } else {
    if (msgLabel) msgLabel.textContent = 'Cover Message & Proposal *';
    if (msgInput) msgInput.placeholder = 'Introduce yourself and explain why you are a good fit for this job...';
  }
  if (msgInput) msgInput.value = '';

  $('#apply-submit').textContent = isOffer ? 'Send Order Request' : 'Submit Application';
  $('#dialog-apply').showModal();
}

function setupApplyDialog() {
  $('#apply-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const amount = Number($('#apply-amount').value);
    if (amount > 100000) {
      showToast('Proposed rate cannot exceed ₱100,000.', 'error');
      return;
    }
    const isOffer = isJobOffer(applyTarget);
    const btn = $('#apply-submit');
    btn.disabled = true; btn.textContent = 'Submitting...';
    try {
      await createApplication(dc, {
        helpRequestId: applyTarget.id,
        applicantId: userData.id,
        priceOffer: amount,
        message: $('#apply-message').value.trim()
      });
      showToast(isOffer ? `Order request sent! Proposed budget: ${peso(amount)}` : `Application sent! Proposed rate: ${peso(amount)}`);
      $('#dialog-apply').close();
      loadServices();
      loadDashboard(true);
    } catch (err) {
      showToast('Could not submit: ' + err.message, 'error');
    } finally {
      btn.disabled = false;
      btn.textContent = isOffer ? 'Send Order Request' : 'Submit Application';
    }
  });
}

// ── Applications Hub ─────────────────────────────────────────────────────────
let appTab = 'posted';

async function loadApplications(isSilent = false) {
  if (appTab === 'posted') await loadPostedJobs(isSilent);
  else if (appTab === 'applied') await loadMyApplications(isSilent);
  else if (appTab === 'mentoring') await loadMentoringRequests(isSilent);
}

async function loadPostedJobs(isSilent = false) {
  const container = $('#posted-jobs-list');
  if (!isSilent) container.innerHTML = '<div class="loader"></div>';
  try {
    const res = await listMyHelpRequestsWithApplications(dc, { userId: userData.id }, SERVER_ONLY);
    const allMyJobs = res.data.helpRequests || [];

    // Auto-restore any of the user's standing offers that were closed accidentally by the previous bug
    for (const j of allMyJobs) {
      if (isJobOffer(j) && j.status === 'CLOSED') {
        try {
          await updateHelpRequestStatus(dc, { id: j.id, status: 'OPEN' });
          markAsStandingOffer(j.id);
          j.status = 'OPEN';
        } catch (e) {
          console.warn('Auto-reopen standing offer error:', e);
        }
      }
    }

    const jobs = allMyJobs.filter(j => {
      const isMentoring = j.category === 'MENTORING' || (j.title && j.title.toLowerCase().startsWith('mentoring:'));
      return (j.status === 'OPEN' || !j.status) && !isMentoring;
    });

    container.innerHTML = '';
    if (jobs.length === 0) {
      container.innerHTML = '<div class="empty-state text-center text-muted" style="padding: 2rem;">You have not posted any open services or requests.</div>';
      return;
    }
    jobs.forEach(job => {
      const isOffer = isJobOffer(job);
      if (isOffer) markAsStandingOffer(job.id);
      const typeBadge = isOffer
        ? `<span class="badge badge-standing">🛠️ Service Offer</span>`
        : `<span class="badge badge-request">📌 Service Request</span>`;
      const pending = (job.applications_on_helpRequest || []).filter(a => a.status === 'PENDING');
      const countLabel = isOffer ? `${pending.length} order request(s)` : `${pending.length} candidate(s)`;
      
      const jobEl = document.createElement('div');
      jobEl.className = 'job-card';
      jobEl.innerHTML = `
        <div class="job-card-header">
          <div>
            <h3 style="display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; margin-bottom: 0.25rem;">
              ${job.title} ${typeBadge}
            </h3>
            <small class="text-muted">${isOffer ? '⚡ Standing Service (Always Open for Campus Orders)' : (job.deadline ? `📅 Due: ${job.deadline}` : '📌 One-Time Request')}</small>
          </div>
          <div style="display: flex; gap: 0.5rem; align-items: center;">
            <span class="badge badge-normal">${peso(job.budget)} ${isOffer ? 'base' : ''}</span>
            <span class="badge badge-pending">${countLabel}</span>
          </div>
        </div>
        <div class="candidates-list"></div>
      `;
      const candList = jobEl.querySelector('.candidates-list');
      
      if (pending.length === 0) {
        candList.innerHTML = `<div class="text-sm text-muted italic" style="padding: 1rem 0;">No ${isOffer ? 'incoming orders' : 'applicants'} yet.</div>`;
      } else {
        pending.forEach(app => {
          const row = document.createElement('div');
          row.className = 'candidate-row';
          row.innerHTML = `
            <div class="avatar avatar-sm cursor-pointer" onclick="openViewProfileDialog('${app.applicant?.id}')">${initials(app.applicant?.fullName || '')}</div>
            <div class="candidate-info">
              <strong class="cursor-pointer hover:underline" onclick="openViewProfileDialog('${app.applicant?.id}')">${app.applicant?.fullName || (isOffer ? 'Client' : 'Applicant')}</strong>
              <small class="text-muted">${app.applicant?.studentId || ''}</small>
              <div class="candidate-message"><strong>${isOffer ? 'Order Scope & Details:' : 'Proposal:'}</strong> "${app.message}"</div>
            </div>
            <div class="candidate-price">${peso(app.priceOffer)}</div>
            <div class="candidate-actions">
              <button type="button" class="btn btn-outline btn-sm reject-btn">Decline</button>
              <button type="button" class="btn btn-purple btn-sm approve-btn">${isOffer ? 'Accept Order' : 'Approve'}</button>
            </div>
          `;
          row.querySelector('.approve-btn').addEventListener('click', (e) => { e.preventDefault(); handleApprove(app, job); });
          row.querySelector('.reject-btn').addEventListener('click', (e) => { e.preventDefault(); handleReject(app); });
          candList.appendChild(row);
        });
      }
      container.appendChild(jobEl);
    });
  } catch (err) {
    if (!isSilent) container.innerHTML = '<div class="empty-state">Error loading posted jobs.</div>';
  }
}

async function loadMentoringRequests(isSilent = false) {
  const container = document.getElementById('mentoring-requests-list');
  if (!container) return;
  if (!isSilent) container.innerHTML = '<div class="loader"></div>';
  try {
    const res = await listMyHelpRequestsWithApplications(dc, { userId: userData.id }, SERVER_ONLY);
    const jobs = (res.data.helpRequests || []).filter(j => {
      const isMentoring = j.category === 'MENTORING' || (j.title && j.title.toLowerCase().startsWith('mentoring:'));
      return (j.status === 'OPEN' || !j.status) && isMentoring;
    });
    container.innerHTML = '';
    if (jobs.length === 0) {
      container.innerHTML = '<div class="empty-state text-center text-muted" style="padding: 2rem;">No pending mentoring requests received.</div>';
      return;
    }
    jobs.forEach(job => {
      const pending = (job.applications_on_helpRequest || []).filter(a => a.status === 'PENDING');
      const proposedAmt = (pending[0] && pending[0].priceOffer !== undefined) ? pending[0].priceOffer : job.budget;

      const jobEl = document.createElement('div');
      jobEl.className = 'job-card';
      jobEl.innerHTML = `
        <div class="flex justify-between items-start mb-2">
          <div>
            <h3 class="job-title" style="margin: 0;">${job.title}</h3>
            <p class="text-sm text-muted mt-1">${job.description || ''}</p>
          </div>
          <span class="badge badge-normal" style="font-weight: 700; color: var(--color-green);">${peso(proposedAmt)}</span>
        </div>
        <div class="mt-4">
          <h4 class="text-sm font-bold mb-2">Mentoring Proposals (${pending.length})</h4>
          <div class="candidates-list"></div>
        </div>
      `;
      const candList = jobEl.querySelector('.candidates-list');

      if (pending.length === 0) {
        candList.innerHTML = `<div class="text-sm text-muted italic" style="padding: 1rem 0;">No pending applications for this request.</div>`;
      } else {
        pending.forEach(app => {
          const row = document.createElement('div');
          row.className = 'candidate-row';
          row.innerHTML = `
            <div class="avatar avatar-sm cursor-pointer" onclick="openViewProfileDialog('${app.applicant?.id || ''}')">${initials(app.applicant?.fullName || '')}</div>
            <div class="candidate-info">
              <strong class="cursor-pointer hover:underline" onclick="openViewProfileDialog('${app.applicant?.id || ''}')">${app.applicant?.fullName || 'Mentoree'}</strong>
              <small class="text-muted">${app.applicant?.studentId || ''}</small>
              <div class="candidate-message">"${app.message}"</div>
            </div>
            <div class="candidate-price">${peso(app.priceOffer)}</div>
            <div class="candidate-actions">
              <button type="button" class="btn btn-outline btn-sm reject-btn" style="border-color:#ef4444; color:#ef4444;">Decline</button>
              <button type="button" class="btn btn-purple btn-sm approve-btn">Accept</button>
            </div>
          `;
          row.querySelector('.approve-btn').addEventListener('click', (e) => { e.preventDefault(); handleApprove(app, job); });
          row.querySelector('.reject-btn').addEventListener('click', (e) => { e.preventDefault(); handleReject(app); });
          candList.appendChild(row);
        });
      }
      container.appendChild(jobEl);
    });
  } catch (e) {
    console.error(e);
    container.innerHTML = '<div class="empty-state">Error loading mentoring requests.</div>';
  }
}

async function loadMyApplications(isSilent = false) {
  const container = $('#my-applications-list');
  if (!isSilent) container.innerHTML = '<div class="loader"></div>';
  try {
    const res = await listApplicationsByApplicant(dc, { userId: userData.id }, SERVER_ONLY);
    const apps = (res.data.applications || []).filter(a => a.status !== 'REJECTED');
    container.innerHTML = '';
    if (apps.length === 0) {
      container.innerHTML = '<div class="empty-state text-center text-muted" style="padding: 2rem;">No applications or orders submitted yet.</div>';
      return;
    }
    apps.forEach(app => {
      const isOffer = isJobOffer(app.helpRequest);
      const card = document.createElement('div');
      card.className = 'application-card';
      const statusClass = app.status === 'APPROVED' ? 'badge-approved' : app.status === 'COMPLETED' ? 'badge-normal' : 'badge-pending';
      const statusText = app.status === 'APPROVED' 
        ? (isOffer ? '✅ Order Accepted' : '✅ Application Accepted')
        : app.status === 'COMPLETED' 
          ? (isOffer ? '🎉 Order Completed' : '🎉 Job Completed')
          : (isOffer ? '⏳ Order Pending' : '⏳ Application Pending');

      card.innerHTML = `
        <div style="flex: 1; min-width: 0;">
          <div style="display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap;">
            <h4 style="margin: 0;">${app.helpRequest?.title || (isOffer ? 'Service Order' : 'Service Request')}</h4>
            <span class="badge ${isOffer ? 'badge-standing' : 'badge-request'}">${isOffer ? '🛠️ Service Order' : '📌 Service Request'}</span>
          </div>
          <small class="text-muted" style="display: block; margin-top: 0.25rem;">
            ${isOffer ? 'Agreed Rate / Budget' : 'Proposed Rate'}: <strong>${peso(app.priceOffer)}</strong>
            ${app.helpRequest?.requester?.fullName ? ` &bull; ${isOffer ? 'Service Provider' : 'Client / Requester'}: ${app.helpRequest.requester.fullName}` : ''}
          </small>
        </div>
        <span class="badge ${statusClass}">${statusText}</span>
      `;
      container.appendChild(card);
    });
  } catch (err) {
    if (!isSilent) container.innerHTML = '<div class="empty-state">Error loading applications.</div>';
  }
}

async function handleApprove(application, job) {
  try {
    const isOffer = isJobOffer(job);
    await updateApplicationStatus(dc, { id: application.id, status: 'APPROVED' });

    // CRITICAL: Standing services remain OPEN on the marketplace so additional campus peers can place orders!
    if (!isOffer) {
      await updateHelpRequestStatus(dc, { id: job.id, status: 'CLOSED' });
    } else {
      await updateHelpRequestStatus(dc, { id: job.id, status: 'OPEN' });
      markAsStandingOffer(job.id);
    }

    const convRes = await createConversation(dc, {
      applicationId: application.id,
      posterId: userData.id,
      applicantId: application.applicant.id
    });
    const convId = convRes.data.conversation_insert?.id;
    if (convId) {
      const initialText = isOffer
        ? `📋 Service Order Accepted\n\nAgreed Budget: ${peso(application.priceOffer)}\nOrder Scope & Details: ${application.message}`
        : `📋 Application Accepted\n\nProposed Rate: ${peso(application.priceOffer)}\nProposal: ${application.message}`;

      await push(ref(db, `conversations/${convId}/messages`), {
        senderId: application.applicant.id,
        content: initialText,
        timestamp: serverTimestamp()
      });
      activeConvId = convId;
      sessionStorage.setItem('active_conversation_id', convId);

      // Pre-seed newly created conversation into memory to prevent stale chat view on immediate navigation
      const newConvObj = {
        id: convId,
        poster: userData,
        applicant: application.applicant,
        application: {
          id: application.id,
          status: 'APPROVED',
          priceOffer: Number(application.priceOffer),
          message: application.message,
          helpRequest: job
        },
        createdAt: new Date().toISOString()
      };
      const existingIdx = conversations.findIndex(c => c.id === convId);
      if (existingIdx >= 0) {
        conversations[existingIdx] = newConvObj;
      } else {
        conversations.unshift(newConvObj);
      }
    }
    showToast(isOffer ? 'Order accepted! Chat created.' : 'Application approved! Chat created.');
    navigateTo('messages');
  } catch (err) {
    showToast('Error: ' + err.message, 'error');
  }
}

async function handleReject(application) {
  try {
    await updateApplicationStatus(dc, { id: application.id, status: 'REJECTED' });
    showToast('Application rejected.');
    loadApplications();
  } catch (err) {
    showToast('Error: ' + err.message, 'error');
  }
}

window.approveApplication = async function(appId, jobId) {
  try {
    const res = await listMyHelpRequestsWithApplications(dc, { userId: userData.id }, SERVER_ONLY);
    const jobs = res.data.helpRequests || [];
    const job = jobs.find(j => j.id === jobId);
    const app = job?.applications_on_helpRequest?.find(a => a.id === appId);
    if (app && job) {
      await handleApprove(app, job);
    } else {
      const isOffer = job ? isJobOffer(job) : false;
      await updateApplicationStatus(dc, { id: appId, status: 'APPROVED' });
      if (jobId && !isOffer) {
        await updateHelpRequestStatus(dc, { id: jobId, status: 'CLOSED' });
      } else if (jobId && isOffer) {
        await updateHelpRequestStatus(dc, { id: jobId, status: 'OPEN' });
        markAsStandingOffer(jobId);
      }
      showToast(isOffer ? 'Order accepted!' : 'Application approved!');
      loadApplications();
    }
  } catch (err) {
    showToast('Error: ' + err.message, 'error');
  }
};

window.rejectApplication = async function(appId) {
  try {
    await updateApplicationStatus(dc, { id: appId, status: 'REJECTED' });
    showToast('Application rejected.');
    loadApplications();
  } catch (err) {
    showToast('Error: ' + err.message, 'error');
  }
};

function setupApplicationTabs() {
  $$('.tab-btn[data-tab]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      appTab = btn.dataset.tab;
      $$('.tab-btn[data-tab]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      hide($('#posted-jobs-list'));
      hide($('#my-applications-list'));
      hide($('#mentoring-requests-list'));

      if (appTab === 'posted') {
        show($('#posted-jobs-list'));
      } else if (appTab === 'applied') {
        show($('#my-applications-list'));
      } else if (appTab === 'mentoring') {
        show($('#mentoring-requests-list'));
      }
      loadApplications();
    });
  });
}

// ── Messages & Realtime Chat Engine ──────────────────────────────────────────
let conversations = [];
let reviewTarget = null;
let activeSubscriptionConvId = null;

const isConversationCompleted = (conv) =>
  conv.application?.status === 'COMPLETED' || conv.application?.helpRequest?.status === 'COMPLETED';

async function sortConversationsByActivity(items) {
  await Promise.all(items.map(async (conv) => {
    const createdAt = Date.parse(conv.createdAt || '') || 0;
    try {
      const latest = await get(databaseQuery(ref(db, `conversations/${conv.id}/messages`), limitToLast(1)));
      const message = latest.exists() ? Object.values(latest.val())[0] : null;
      const messageTime = Number(message?.timestamp);
      conv.lastActivityAt = Number.isFinite(messageTime) && messageTime > 0 ? messageTime : createdAt;
    } catch (err) {
      conv.lastActivityAt = conv.lastActivityAt || createdAt;
      console.warn('Could not load latest message date:', err);
    }
  }));
  items.sort((a, b) => b.lastActivityAt - a.lastActivityAt || b.id.localeCompare(a.id));
  return items;
}

function touchConversationActivity(convId, timestamp) {
  const conv = conversations.find(c => c.id === convId);
  const time = Number(timestamp);
  if (!conv || !Number.isFinite(time) || time <= (conv.lastActivityAt || 0)) return;
  conv.lastActivityAt = time;
  conversations.sort((a, b) => b.lastActivityAt - a.lastActivityAt || b.id.localeCompare(a.id));
  renderConversationList();
}

async function loadMessages(isSilent = false) {
  const convList = $('#conversations-list');
  if (!isSilent && convList.children.length === 0) convList.innerHTML = '<div class="loader"></div>';
  try {
    const res = await listConversations(dc, { userId: userData.id }, SERVER_ONLY);
    const fetched = (res.data.conversations || []).filter(c =>
      c.application?.status !== 'TERMINATED'
    );
    // If activeConvId was just created and not yet in fetched, preserve it from local memory
    const activeFromMemory = conversations.find(c => c.id === activeConvId);
    if (activeFromMemory && !fetched.some(c => c.id === activeConvId)) {
      fetched.unshift(activeFromMemory);
    }
    conversations = await sortConversationsByActivity(fetched);
    renderConversationList();

    if (!activeConvId) {
      const savedConvId = sessionStorage.getItem('active_conversation_id');
      if (savedConvId && conversations.some(c => c.id === savedConvId)) {
        activeConvId = savedConvId;
      }
    }

    if (conversations.length > 0) {
      if (activeConvId && conversations.some(c => c.id === activeConvId)) {
        selectConversation(activeConvId);
      } else {
        const defaultConv = conversations[0];
        selectConversation(defaultConv.id);
      }
    } else {
      activeConvId = null;
      sessionStorage.removeItem('active_conversation_id');
      $('#chat-panel').innerHTML = '<div class="empty-state text-center text-muted" style="padding: 2rem;">No conversations yet.<br><br><a href="#" onclick="navigateTo(\'dashboard\')" class="btn btn-purple">Find Jobs</a></div>';
    }
  } catch (err) {
    if (!isSilent) convList.innerHTML = '<div class="empty-state">Error loading conversations.</div>';
  }
}

function renderConversationList() {
  const convList = $('#conversations-list');
  const digest = conversations.map(c => `${c.id}:${c.lastActivityAt || 0}:${c.application?.status}:${c.application?.helpRequest?.status}`).join(',') + '|' + activeConvId;
  if (digest === lastConversationsDigest && convList.children.length > 0) return;
  lastConversationsDigest = digest;

  convList.innerHTML = '';
  if (conversations.length === 0) {
    convList.innerHTML = '<div style="padding:2rem; text-align:center; color:var(--text-muted);">No conversations yet.<br><br><button onclick="navigateTo(\'dashboard\')" class="btn btn-outline-purple btn-sm">Browse Jobs</button></div>';
    return;
  }
  conversations.forEach(conv => {
    const isPoster = conv.poster?.id === userData?.id;
    const otherName = isPoster ? conv.applicant?.fullName : conv.poster?.fullName;
    const isCompleted = isConversationCompleted(conv);
    const activityDate = conv.lastActivityAt ? new Date(conv.lastActivityAt) : null;
    const dateText = activityDate ? activityDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : '';
    const item = document.createElement('div');
    item.className = `conversation-item ${conv.id === activeConvId ? 'active' : ''}`;
    item.innerHTML = `
      <div class="avatar avatar-sm">${initials(otherName || '')}</div>
      <div class="flex-1 truncate">
        <div class="flex justify-between items-center">
          <strong class="truncate block">${otherName || 'User'}</strong>
          ${isCompleted ? '<span class="badge badge-approved" style="font-size: 9px; padding: 1px 5px; flex-shrink: 0;">Completed</span>' : ''}
        </div>
        <div class="conversation-meta">
          <small class="text-muted truncate block">${conv.application?.helpRequest?.title || ''}</small>
          <time class="text-muted" datetime="${activityDate ? activityDate.toISOString() : ''}" title="${activityDate ? activityDate.toLocaleString() : ''}">${dateText}</time>
        </div>
      </div>
    `;
    item.addEventListener('click', (e) => { e.preventDefault(); selectConversation(conv.id); });
    convList.appendChild(item);
  });
}

async function selectConversation(convId) {
  const isNewSelection = (activeSubscriptionConvId !== convId) || !messageSubscription;
  if (isNewSelection) {
    renderedMsgIds.clear();
    pendingTempMessages = [];
    const msgArea = $('#chat-messages');
    if (msgArea) msgArea.innerHTML = '<div class="loader"></div>';
  }
  activeConvId = convId;
  sessionStorage.setItem('active_conversation_id', convId);
  renderConversationList();
  
  // Add class for mobile messenger-style view
  $('#messages-container')?.classList.add('chat-open');

  const conv = conversations.find(c => c.id === convId);
  if (!conv) return;

  const isPoster = conv.poster?.id === userData?.id;
  const otherUser = isPoster ? conv.applicant : conv.poster;

  // Pre-resolve application price in background if missing
  if (conv.application && (!conv.application.priceOffer || conv.application.priceOffer === 0)) {
    (async () => {
      try {
        if (isPoster) {
          const myJobsRes = await listMyHelpRequestsWithApplications(dc, { userId: userData.id }, SERVER_ONLY);
          const myJobs = myJobsRes.data.helpRequests || [];
          for (const j of myJobs) {
            const matchedApp = (j.applications_on_helpRequest || []).find(a => a.id === conv.application.id);
            if (matchedApp) {
              conv.application.priceOffer = Number(matchedApp.priceOffer) || Number(j.budget) || 0;
              break;
            }
          }
        } else {
          const myAppsRes = await listApplicationsByApplicant(dc, { userId: userData.id }, SERVER_ONLY);
          const myApps = myAppsRes.data.applications || [];
          const matchedApp = myApps.find(a => a.id === conv.application.id);
          if (matchedApp) {
            conv.application.priceOffer = Number(matchedApp.priceOffer) || Number(matchedApp.helpRequest?.budget) || 0;
          }
        }
      } catch (e) {
        console.warn('Pre-fetching conv priceOffer error:', e);
      }
    })();
  }

  const isCompleted = conv.application?.helpRequest?.status === 'COMPLETED' || conv.application?.status === 'COMPLETED';
  const isOffer = isJobOffer(conv.application?.helpRequest);
  const isClient = (!isOffer && isPoster) || (isOffer && !isPoster);
  const typeTag = isOffer
    ? '<span class="badge badge-standing" style="font-size: 10px; padding: 2px 7px;">🛠️ Service Offer</span>'
    : '<span class="badge badge-request" style="font-size: 10px; padding: 2px 7px;">📌 Service Request</span>';

  const chatHeader = $('#chat-header-content');
  chatHeader.innerHTML = `
    <div class="chat-header-user-info">
      <div class="avatar avatar-sm cursor-pointer flex-shrink-0" onclick="openViewProfileDialog('${otherUser?.id}')">${initials(otherUser?.fullName || '')}</div>
      <div class="chat-header-user-text">
        <strong class="cursor-pointer hover:underline" onclick="openViewProfileDialog('${otherUser?.id}')">${otherUser?.fullName || 'User'}</strong>
        <div style="display: flex; align-items: center; gap: 0.4rem; margin-top: 2px; flex-wrap: wrap;">
          <small class="text-muted">${conv.application?.helpRequest?.title || ''}</small>
          ${typeTag}
        </div>
      </div>
    </div>
    <div class="chat-header-actions">
      ${isCompleted 
        ? '<span class="badge badge-approved" style="padding: 4px 10px; font-size: 12px;">Completed</span>'
        : `<button type="button" class="btn btn-terminate" id="btn-terminate">Terminate</button>
           <button type="button" class="btn btn-complete" id="btn-complete">Complete</button>`
      }
    </div>
  `;

  $('#btn-terminate')?.addEventListener('click', async (e) => {
    e.preventDefault();
    if (!confirm('Are you sure you want to terminate this job?')) return;
    try {
      await terminateJob(dc, { applicationId: conv.application.id, helpRequestId: conv.application.helpRequest.id });
      showToast('Job terminated.');
      activeConvId = null;
      activeSubscriptionConvId = null;
      sessionStorage.removeItem('active_conversation_id');
      loadMessages();
    } catch (err) {
      showToast('Error: ' + err.message, 'error');
    }
  });

  $('#btn-complete')?.addEventListener('click', async (e) => {
    e.preventDefault();
    reviewTarget = { conv, otherUser, isOffer, isPoster, isClient };

    const jobTitle = conv.application?.helpRequest?.title || (isOffer ? 'Standing Service Offer' : 'Service Request');
    let price = Number(conv.application?.priceOffer) || Number(conv.application?.helpRequest?.budget) || 0;

    // 1. Resolve from listMyHelpRequestsWithApplications (client view)
    if (!price && conv.application?.id) {
      try {
        const myJobsRes = await listMyHelpRequestsWithApplications(dc, { userId: userData.id }, SERVER_ONLY);
        const myJobs = myJobsRes.data.helpRequests || [];
        for (const j of myJobs) {
          const matchedApp = (j.applications_on_helpRequest || []).find(a => a.id === conv.application.id);
          if (matchedApp) {
            price = Number(matchedApp.priceOffer) || Number(j.budget) || 0;
            if (conv.application) conv.application.priceOffer = price;
            break;
          }
        }
      } catch (err) {
        console.warn('Could not resolve price from listMyHelpRequestsWithApplications', err);
      }
    }

    // 2. Resolve from listApplicationsForMyRequests
    if (!price && conv.application?.id) {
      try {
        const appsRes = await listApplicationsForMyRequests(dc, { userId: userData.id }, SERVER_ONLY);
        const matched = (appsRes.data.applications || []).find(a => a.id === conv.application.id);
        if (matched) {
          price = Number(matched.priceOffer) || Number(matched.helpRequest?.budget) || 0;
          if (conv.application) conv.application.priceOffer = price;
        }
      } catch (err) {
        console.warn('Could not resolve price from listApplicationsForMyRequests', err);
      }
    }

    // 3. Fallback to listHelpRequests
    if (!price && conv.application?.helpRequest?.id) {
      try {
        const reqsRes = await listHelpRequests(dc, SERVER_ONLY);
        const matchedReq = (reqsRes.data.helpRequests || []).find(r => r.id === conv.application.helpRequest.id);
        if (matchedReq && matchedReq.budget) {
          price = Number(matchedReq.budget) || 0;
          if (conv.application) conv.application.priceOffer = price;
        }
      } catch (err) {}
    }

    // 4. Fallback to welcome message in Realtime Database chat
    if (!price && convId) {
      try {
        const msgSnap = await get(ref(db, `conversations/${convId}/messages`));
        if (msgSnap.exists()) {
          const msgs = msgSnap.val();
          for (const k in msgs) {
            const mText = msgs[k].content || '';
            const match = mText.match(/(?:Proposed Rate|Agreed Budget):\s*₱?([\d,]+)/i);
            if (match) {
              price = Number(match[1].replace(/,/g, ''));
              if (conv.application) conv.application.priceOffer = price;
              break;
            }
          }
        }
      } catch (err) {}
    }

    const modalTitleEl = $('#review-modal-title');
    if (modalTitleEl) {
      modalTitleEl.textContent = isClient ? 'Complete & Release Payment' : 'Confirm Order Completion';
    }
    const payStatusEl = $('#review-payment-status');
    if (payStatusEl) {
      payStatusEl.textContent = isClient ? 'Payment Release' : 'Settlement Summary';
    }
    const jobEl = $('#review-payment-job');
    if (jobEl) jobEl.textContent = jobTitle;
    const recEl = $('#review-payment-recipient');
    if (recEl) {
      recEl.textContent = isClient 
        ? `Pay to Provider: ${otherUser.fullName}`
        : `Client: ${otherUser.fullName} (You: Provider)`;
    }
    const amtEl = $('#review-payment-amount');
    if (amtEl) amtEl.textContent = peso(price);
    const confAmtEl = $('#review-payment-confirm-amt');
    if (confAmtEl) confAmtEl.textContent = peso(price);
    const noteEl = $('#review-payment-note');
    if (noteEl) {
      noteEl.innerHTML = isClient
        ? `✓ Completing this order confirms deliverables were received and releases payment of <strong><span id="review-payment-confirm-amt">${peso(price)}</span></strong> to ${otherUser.fullName}.`
        : `✓ Confirming completion certifies that deliverables were fulfilled for ${otherUser.fullName}. Your earnings of <strong><span id="review-payment-confirm-amt">${peso(price)}</span></strong> will be settled.`;
    }
    const submitBtn = $('#review-submit-btn');
    if (submitBtn) {
      submitBtn.textContent = isClient ? 'Confirm Payment & Complete' : 'Confirm Delivery & Complete';
    }

    const commentEl = $('#review-comment');
    if (commentEl) commentEl.value = '';

    $('#dialog-review').showModal();
  });

  if (isNewSelection) {
    if (messageSubscription) {
      off(messageSubscription);
      messageSubscription = null;
    }
    activeSubscriptionConvId = convId;
    try {
      const msgArea = $('#chat-messages');
      if (msgArea) msgArea.innerHTML = '';
      
      const messagesRef = ref(db, `conversations/${convId}/messages`);
      messageSubscription = messagesRef;
      onChildAdded(messagesRef, (snapshot) => {
        const msg = snapshot.val();
        msg.id = snapshot.key;
        renderIncomingMessages([msg]);
        touchConversationActivity(convId, msg.timestamp);
      });
    } catch (err) {
      console.warn('Subscription fallback to SERVER_ONLY polling:', err);
    }
  }
}

function renderIncomingMessages(messages) {
  const msgArea = $('#chat-messages');
  if (!msgArea) return;

  if (messages.length > 0 || pendingTempMessages.length > 0) {
    const emptyState = msgArea.querySelector('.empty-state');
    if (emptyState) emptyState.remove();
  }

  let hasNew = false;
  messages.forEach(msg => {
    if (!renderedMsgIds.has(msg.id)) {
      renderedMsgIds.add(msg.id);
      hasNew = true;

      const tempIdx = pendingTempMessages.findIndex(t => t.content === msg.content);
      if (tempIdx !== -1) {
        const tempEl = pendingTempMessages[tempIdx].el;
        if (tempEl && tempEl.parentNode) {
          tempEl.dataset.msgId = msg.id;
          tempEl.removeAttribute('data-temp');
          pendingTempMessages.splice(tempIdx, 1);
          return;
        }
      }

      const senderId = msg.sender?.id || msg.senderId;
      const isMe = senderId === userData?.id;
      const div = document.createElement('div');
      div.className = `message ${isMe ? 'outgoing' : 'incoming'}`;
      div.dataset.msgId = msg.id;
      div.innerHTML = `<div class="message-bubble">${msg.content}</div>`;
      msgArea.appendChild(div);
    }
  });

  if (hasNew) {
    msgArea.scrollTop = msgArea.scrollHeight;
  }
}

function setupChat() {
  const input = $('#chat-input');
  const sendBtn = $('#chat-send-btn');

  const send = async () => {
    const content = input.value.trim();
    if (!content || !activeConvId) return;
    input.value = '';

    const msgArea = $('#chat-messages');
    const emptyState = msgArea.querySelector('.empty-state');
    if (emptyState) emptyState.remove();

    // Instant local outgoing bubble
    const tempDiv = document.createElement('div');
    tempDiv.className = 'message outgoing';
    tempDiv.dataset.temp = 'true';
    tempDiv.innerHTML = `<div class="message-bubble">${content}</div>`;
    msgArea.appendChild(tempDiv);
    msgArea.scrollTop = msgArea.scrollHeight;

    const tempObj = { content, el: tempDiv, time: Date.now() };
    pendingTempMessages.push(tempObj);

    sendBtn.disabled = true;
    try {
      const sendingConvId = activeConvId;
      await push(ref(db, `conversations/${sendingConvId}/messages`), {
        senderId: userData.id,
        content: content,
        timestamp: serverTimestamp()
      });
      touchConversationActivity(sendingConvId, Date.now());
    } catch (err) {
      showToast('Error sending message: ' + err.message, 'error');
      tempDiv.remove();
      const idx = pendingTempMessages.indexOf(tempObj);
      if (idx !== -1) pendingTempMessages.splice(idx, 1);
    } finally {
      sendBtn.disabled = false;
      input.focus();
    }
  };

  sendBtn?.addEventListener('click', (e) => { e.preventDefault(); send(); });
  input?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  });

  $('#chat-back-btn')?.addEventListener('click', (e) => {
    e.preventDefault();
    $('#messages-container')?.classList.remove('chat-open');
  });
}

// ── Transactions (Real Dynamic Data) ─────────────────────────────────────────
let allTransactions = [];
async function loadTransactions() {
  const tbody = $('#transactions-tbody');
  tbody.innerHTML = '<tr><td colspan="4" class="text-center"><div class="loader"></div></td></tr>';
  try {
    const [appRes, myPostRes, posterAppRes] = await Promise.all([
      listApplicationsByApplicant(dc, { userId: userData.id }, SERVER_ONLY),
      listMyHelpRequestsWithApplications(dc, { userId: userData.id }, SERVER_ONLY),
      listApplicationsForMyRequests(dc, { userId: userData.id }, SERVER_ONLY)
    ]);
    const apps = appRes.data.applications || [];
    const myPosts = myPostRes.data.helpRequests || [];
    const posterApplicationDates = new Map((posterAppRes.data.applications || []).map(a => [a.id, a.createdAt]));
    const submittedDate = (app) => {
      const value = app.createdAt || posterApplicationDates.get(app.id);
      return value ? new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'Unknown';
    };

    const txList = [];

    // 1. Applicant applications/orders
    apps.forEach(a => {
      const isOffer = isJobOffer(a.helpRequest);
      const counterpartName = a.helpRequest?.requester?.fullName || 'Peer';

      if (isOffer) {
        // Applicant ordered a standing service -> USER IS CLIENT (Paying)
        txList.push({
          id: a.id,
          title: a.helpRequest?.title || 'Standing Service Order',
          counterpart: `Paid to Provider: ${counterpartName}`,
          amount: Number(a.priceOffer) || Number(a.helpRequest?.budget) || 0,
          status: a.status,
          type: 'PAYMENT',
          date: submittedDate(a)
        });
      } else {
        // Applicant applied to a freelance request -> USER IS FREELANCER (Earning)
        txList.push({
          id: a.id,
          title: a.helpRequest?.title || 'Job Proposal',
          counterpart: `Client: ${counterpartName}`,
          amount: Number(a.priceOffer) || 0,
          status: a.status,
          type: 'EARNING',
          date: submittedDate(a)
        });
      }
    });

    // 2. Poster postings (myPosts)
    myPosts.forEach(p => {
      const isOffer = isJobOffer(p);
      const appsOnJob = p.applications_on_helpRequest || [];
      appsOnJob.forEach(a => {
        const clientOrFreelancer = a.applicant?.fullName || 'Peer';
        if (isOffer) {
          // Poster offered a standing service -> USER IS PROVIDER (Earning)
          txList.push({
            id: a.id,
            title: p.title || 'Standing Service Offer',
            counterpart: `Client: ${clientOrFreelancer}`,
            amount: Number(a.priceOffer) || Number(p.budget) || 0,
            status: a.status,
            type: 'EARNING',
            date: submittedDate(a)
          });
        } else {
          // Poster requested a freelance job -> USER IS CLIENT (Paying)
          txList.push({
            id: a.id,
            title: p.title || 'Service Request',
            counterpart: `Paid to Provider: ${clientOrFreelancer}`,
            amount: Number(a.priceOffer) || Number(p.budget) || 0,
            status: a.status,
            type: 'PAYMENT',
            date: submittedDate(a)
          });
        }
      });
    });

    allTransactions = txList;

    // Calculate totals
    const completedEarnings = txList.filter(t => t.type === 'EARNING' && t.status === 'COMPLETED').reduce((sum, t) => sum + t.amount, 0);
    const pendingEarnings = txList.filter(t => t.type === 'EARNING' && (t.status === 'PENDING' || t.status === 'APPROVED')).reduce((sum, t) => sum + t.amount, 0);

    const completedPayments = txList.filter(t => t.type === 'PAYMENT' && t.status === 'COMPLETED').reduce((sum, t) => sum + t.amount, 0);
    const pendingPayments = txList.filter(t => t.type === 'PAYMENT' && (t.status === 'PENDING' || t.status === 'APPROVED')).reduce((sum, t) => sum + t.amount, 0);

    const totalEarned = completedEarnings;
    const totalSpent = completedPayments;

    // Update stat cards
    const totalEl = $('#trans-total-earnings');
    if (totalEl) {
      if (totalSpent > 0 && totalEarned > 0) {
        totalEl.innerHTML = `<div style="font-size: 1.5rem; line-height: 1.2;">${peso(totalEarned)} <span style="font-size: 0.8rem; font-weight: 600; color: var(--color-green);">Earned</span></div>
                             <div style="font-size: 1.1rem; color: var(--text-heading); margin-top: 0.2rem;">${peso(totalSpent)} <span style="font-size: 0.75rem; font-weight: 500; color: var(--text-muted);">Spent</span></div>`;
      } else if (totalSpent > 0) {
        totalEl.innerHTML = `<div style="font-size: 1.5rem; line-height: 1.2; color: var(--text-heading);">${peso(totalSpent)} <span style="font-size: 0.8rem; font-weight: 600; color: var(--text-muted);">Spent</span></div>`;
      } else {
        totalEl.textContent = peso(totalEarned);
      }
    }

    const pendingEl = $('#trans-pending-earnings');
    if (pendingEl) {
      if (pendingPayments > 0 && pendingEarnings > 0) {
        pendingEl.innerHTML = `<div style="font-size: 1.3rem;">${peso(pendingEarnings)}</div><div style="font-size: 0.85rem; color: var(--text-muted);">${peso(pendingPayments)} Out</div>`;
      } else if (pendingPayments > 0) {
        pendingEl.textContent = `${peso(pendingPayments)} Out`;
      } else {
        pendingEl.textContent = peso(pendingEarnings);
      }
    }

    const completedEl = $('#trans-completed-earnings');
    if (completedEl) {
      if (completedPayments > 0 && completedEarnings > 0) {
        completedEl.innerHTML = `<div style="font-size: 1.3rem; color: var(--color-green);">${peso(completedEarnings)}</div><div style="font-size: 0.85rem; color: var(--text-muted);">${peso(completedPayments)} Paid</div>`;
      } else if (completedPayments > 0) {
        completedEl.textContent = `${peso(completedPayments)} Paid`;
      } else {
        completedEl.textContent = peso(completedEarnings);
      }
    }

    renderTransactionsTable('all');
  } catch (err) {
    console.error('Error loading transactions:', err);
    tbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted" style="padding: 2rem;">Error loading transactions.</td></tr>';
  }
}

function renderTransactionsTable(filter = 'all') {
  const tbody = $('#transactions-tbody');
  let list = allTransactions;
  if (filter === 'pending') list = list.filter(a => a.status === 'PENDING' || a.status === 'APPROVED');
  else if (filter === 'completed') list = list.filter(a => a.status === 'COMPLETED');

  tbody.innerHTML = '';
  if (list.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted" style="padding: 2rem;">No transaction records found.<br><br><button class="btn btn-purple btn-sm" onclick="navigateTo(\'services\')">Find Services</button></td></tr>';
    return;
  }

  list.forEach(item => {
    const tr = document.createElement('tr');
    const isCompleted = item.status === 'COMPLETED';
    const isEarning = item.type === 'EARNING';
    const amountPrefix = isEarning ? '+ ' : '- ';
    const amountColor = isEarning ? 'color: var(--color-green);' : 'color: var(--text-heading);';
    const typeBadge = isEarning
      ? '<span class="badge" style="background: rgba(16, 185, 129, 0.1); color: var(--color-green); border: 1px solid rgba(16, 185, 129, 0.2); font-size: 11px; padding: 2px 6px;">Earning</span>'
      : '<span class="badge" style="background: rgba(99, 102, 241, 0.1); color: var(--primary-purple); border: 1px solid rgba(99, 102, 241, 0.2); font-size: 11px; padding: 2px 6px;">Payment</span>';

    // Clear financial status labels
    let statusLabel = item.status || 'Pending';
    let statusBadgeClass = 'badge-pending';
    if (item.status === 'COMPLETED') {
      statusLabel = 'Completed';
      statusBadgeClass = 'badge-approved';
    } else if (item.status === 'APPROVED') {
      statusLabel = isEarning ? 'Payment Pending' : 'Payment Scheduled';
      statusBadgeClass = 'badge-pending';
    } else if (item.status === 'PENDING') {
      statusLabel = isEarning ? 'Order Pending' : 'Pending Approval';
      statusBadgeClass = 'badge-pending';
    } else if (item.status === 'TERMINATED') {
      statusLabel = 'Terminated';
      statusBadgeClass = 'badge-rejected';
    }

    tr.innerHTML = `
      <td>
        <strong>${item.title}</strong>
        <div class="text-xs text-muted" style="margin-top: 2px;">${item.counterpart} • ${typeBadge}</div>
      </td>
      <td>${item.date}</td>
      <td><strong style="${amountColor}">${amountPrefix}${peso(item.amount)}</strong></td>
      <td><span class="badge ${statusBadgeClass}">${statusLabel}</span></td>
    `;
    tbody.appendChild(tr);
  });
}

function setupTransactionTabs() {
  $$('.trans-tab').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      $$('.trans-tab').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderTransactionsTable(btn.dataset.filter);
    });
  });
}

// ── Ratings & Feedback ───────────────────────────────────────────────────────
async function loadRatings() {
  const score = '5.0';
  $('#ratings-avg-score').textContent = score;
  $('#ratings-total-count').textContent = 'Based on reviews';
}

function setupInlineRatingForm() {
  $('#inline-rating-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    showToast('Feedback submitted! Thank you.');
    $('#inline-feedback-text').value = '';
  });
}

// ── Review Dialog ────────────────────────────────────────────────────────────
function setupReviewDialog() {
  let selectedRating = 5;
  const starButtons = $$('#review-stars .star-btn');

  function updateStars(val) {
    selectedRating = Math.max(1, Math.min(5, val));
    starButtons.forEach((btn, idx) => {
      const starVal = idx + 1;
      const isFilled = starVal <= selectedRating;
      btn.classList.toggle('filled', isFilled);
      btn.setAttribute('aria-checked', starVal === selectedRating ? 'true' : 'false');
      btn.setAttribute('tabindex', starVal === selectedRating ? '0' : '-1');
    });
  }

  starButtons.forEach((btn, idx) => {
    btn.addEventListener('click', () => {
      updateStars(Number(btn.dataset.value));
    });

    btn.addEventListener('keydown', (e) => {
      let nextRating = selectedRating;
      if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
        e.preventDefault();
        nextRating = Math.min(5, selectedRating + 1);
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
        e.preventDefault();
        nextRating = Math.max(1, selectedRating - 1);
      } else if (e.key === 'Home') {
        e.preventDefault();
        nextRating = 1;
      } else if (e.key === 'End') {
        e.preventDefault();
        nextRating = 5;
      } else if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        nextRating = Number(btn.dataset.value);
      } else {
        return;
      }
      updateStars(nextRating);
      const targetBtn = starButtons[nextRating - 1];
      if (targetBtn) targetBtn.focus();
    });
  });

  $('#review-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!selectedRating || !reviewTarget) return;
    const submitBtn = $('#review-submit-btn') || e.target.querySelector('button[type="submit"]');
    if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Processing...'; }
    try {
      const helpReq = reviewTarget.conv?.application?.helpRequest;
      const isOffer = isJobOffer(helpReq);

      // 1. Complete the job / order
      if (isOffer) {
        // Individual order completion - keep the standing offer open!
        await updateApplicationStatus(dc, { id: reviewTarget.conv.application.id, status: 'COMPLETED' });
        try {
          await updateHelpRequestStatus(dc, { id: helpReq.id, status: 'OPEN' });
          markAsStandingOffer(helpReq.id);
        } catch (statusErr) {
          console.warn('Could not reset standing service status to OPEN:', statusErr);
        }
      } else {
        // One-time request completion
        await completeJob(dc, { applicationId: reviewTarget.conv.application.id, helpRequestId: helpReq.id });
      }

      if (reviewTarget.conv.application) {
        reviewTarget.conv.application.status = 'COMPLETED';
      }

      // 2. Submit the review to Firestore
      const revData = {
        rating: selectedRating,
        comment: document.getElementById('review-comment').value.trim(),
        reviewerId: userData.id,
        reviewerName: userData.fullName || 'Peer',
        targetUserId: reviewTarget.otherUser.id,
        createdAt: firestoreTimestamp()
      };
      await addDoc(collection(firestore, "reviews"), revData);

      const actionSuccessMsg = isOffer 
        ? (reviewTarget.isClient ? 'Payment confirmed and order completed!' : 'Order marked as completed!')
        : 'Payment confirmed and job completed!';
      showToast(actionSuccessMsg);
      $('#dialog-review').close();

      // 3. Post completion confirmation in Realtime Database chat
      try {
        const ratingStars = '★'.repeat(selectedRating) + '☆'.repeat(5 - selectedRating);
        const completionText = isOffer
          ? (reviewTarget.isClient
              ? `✅ Deliverables Received & Payment Released!\nRating given: ${ratingStars} (${selectedRating}/5)`
              : `✅ Order Fulfilled & Completed!\nRating given: ${ratingStars} (${selectedRating}/5)`)
          : `✅ Job Completed & Payment Released!\nRating given: ${ratingStars} (${selectedRating}/5)`;

        await push(ref(db, `conversations/${reviewTarget.conv.id}/messages`), {
          senderId: userData.id,
          content: completionText + (revData.comment ? `\n\n"${revData.comment}"` : ''),
          timestamp: serverTimestamp()
        });
      } catch (chatErr) {
        console.warn('Could not send completion message to chat:', chatErr);
      }

      // 4. Reset selection and refresh UI
      activeConvId = null;
      activeSubscriptionConvId = null;
      sessionStorage.removeItem('active_conversation_id');
      $('#messages-container')?.classList.remove('chat-open');
      loadMessages();
      loadDashboard(true);
      if (activeSection === 'transactions') loadTransactions();
      if (activeSection === 'applications') loadApplications();
    } catch (err) {
      showToast('Error: ' + err.message, 'error');
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Confirm Payment & Complete';
      }
    }
  });
}

// ── Profile ──────────────────────────────────────────────────────────────────
function renderReviews(reviews, prefix) {
  if (!reviews || reviews.length === 0) {
    $(`#${prefix}-avg`).textContent = '0.0';
    $(`#${prefix}-count`).textContent = 'Based on 0 reviews';
    $(`#${prefix}-list`).innerHTML = '<div class="empty-state text-center text-muted">No reviews yet.</div>';
    [1,2,3,4,5].forEach(r => {
      if ($(`#pb-${r}`)) $(`#pb-${r}`).style.width = '0%';
      if ($(`#pc-${r}`)) $(`#pc-${r}`).textContent = '0';
    });
    return;
  }
  
  let sum = 0;
  const counts = {1:0, 2:0, 3:0, 4:0, 5:0};
  reviews.forEach(r => {
    sum += Number(r.rating);
    counts[Number(r.rating)] = (counts[Number(r.rating)] || 0) + 1;
  });
  
  const avg = sum / reviews.length;
  $(`#${prefix}-avg`).textContent = avg.toFixed(1);
  $(`#${prefix}-count`).textContent = `Based on ${reviews.length} review${reviews.length > 1 ? 's' : ''}`;
  
  [1,2,3,4,5].forEach(r => {
    const pct = (counts[r] / reviews.length) * 100;
    if ($(`#pb-${r}`)) $(`#pb-${r}`).style.width = pct + '%';
    if ($(`#pc-${r}`)) $(`#pc-${r}`).textContent = counts[r];
  });
  
  $(`#${prefix}-list`).innerHTML = reviews.map(r => `
    <div class="feedback-item">
      <div class="flex justify-between items-start">
        <strong class="text-white">${r.reviewerName || 'Anonymous'}</strong>
        <span class="text-yellow-400 font-bold">${'★'.repeat(Number(r.rating))}${'☆'.repeat(5 - Number(r.rating))}</span>
      </div>
      <p class="text-sm text-gray-300 mt-2">${r.comment || ''}</p>
    </div>
  `).join('');
}

async function loadProfile() {
  if (!userData) return;
  $('#profile-avatar').textContent = initials(userData.fullName);
  $('#profile-name').textContent = userData.fullName || 'Student User';
  $('#profile-faculty').textContent = userData.facultyReference || 'Not provided';
  $('#profile-student-id').textContent = userData.studentId || 'N/A';

  const bioDisplay = document.getElementById('profile-bio-display');
  if (bioDisplay) bioDisplay.textContent = userData.bio ? userData.bio : 'Loading bio...';
  
  const skillsDisplay = document.getElementById('profile-skills-display');
  if (skillsDisplay) {
    if (userData.skills && userData.skills.length > 0) {
      skillsDisplay.innerHTML = userData.skills.map(s => `<span class="skill-pill" style="display:inline-block; margin:2px; background:var(--accent-purple-light); color:var(--primary-purple); border:1px solid rgba(79, 70, 229, 0.2); font-weight:600; padding:4px 10px; border-radius:999px; font-size:12px;">${s}</span>`).join('');
    } else {
      skillsDisplay.innerHTML = '<span class="text-xs text-muted">Loading skills...</span>';
    }
  }

  try {
    const resUser = await getUserProfile(dc, { id: userData.id }, SERVER_ONLY);
    const userProfile = resUser.data.user;
    if (!userProfile) return;

    // Set stats
    const apps = userProfile.applications_on_applicant || [];
    $('#stat-app-pending').textContent = apps.filter(a => a.status === 'PENDING').length;
    $('#stat-app-completed').textContent = apps.filter(a => a.status === 'COMPLETED').length;
    $('#stat-app-terminated').textContent = apps.filter(a => a.status === 'TERMINATED').length;

    const reqs = userProfile.helpRequests_on_requester || [];
    $('#stat-emp-pending').textContent = reqs.filter(r => r.status === 'OPEN').length;
    $('#stat-emp-completed').textContent = reqs.filter(r => r.status === 'COMPLETED').length;
    $('#stat-emp-terminated').textContent = reqs.filter(r => r.status === 'TERMINATED').length;

    try {
      const profileDoc = await getDoc(doc(firestore, "user_profiles", userData.id));
      if (profileDoc.exists()) {
        const data = profileDoc.data();
        userData.bio = data.bio || '';
        userData.skills = data.skills || [];
      } else {
        userData.bio = '';
        userData.skills = [];
      }
      
      if (bioDisplay) bioDisplay.textContent = userData.bio || 'No bio provided yet.';
      if (skillsDisplay) {
        if (userData.skills && userData.skills.length > 0) {
          skillsDisplay.innerHTML = userData.skills.map(s => `<span class="skill-pill" style="display:inline-block; margin:2px; background:var(--accent-purple-light); color:var(--primary-purple); border:1px solid rgba(79, 70, 229, 0.2); font-weight:600; padding:4px 10px; border-radius:999px; font-size:12px;">${s}</span>`).join('');
        } else {
          skillsDisplay.innerHTML = '<span class="text-xs text-muted">No skills listed yet.</span>';
        }
      }
    } catch(e) {
      console.error('Failed to fetch user_profile', e);
      if (bioDisplay) bioDisplay.textContent = userData.bio || 'No bio provided yet.';
      if (skillsDisplay) skillsDisplay.innerHTML = '<span class="text-xs text-muted">No skills listed yet.</span>';
    }

    const reviewsSnap = await getDocs(query(collection(firestore, "reviews"), where("targetUserId", "==", userData.id)));
    const reviews = reviewsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    for (let r of reviews) {
      if (!r.reviewerName && r.reviewerId) {
        try {
          const res = await getUserProfile(dc, { id: r.reviewerId });
          if (res.data.user) r.reviewerName = res.data.user.fullName;
        } catch(e) {}
      }
    }
            renderReviewsProfile(reviews);
  } catch (err) {
    console.error('Error loading profile:', err);
  }
}

function renderReviewsProfile(reviews) {
  if (!reviews || reviews.length === 0) {
    if (document.getElementById('ratings-avg-score')) document.getElementById('ratings-avg-score').textContent = '0.0';
    if (document.getElementById('ratings-avg-stars')) document.getElementById('ratings-avg-stars').textContent = '★★★★★';
    if (document.getElementById('ratings-total-count')) document.getElementById('ratings-total-count').textContent = '0';
    if (document.getElementById('profile-feedback-list')) document.getElementById('profile-feedback-list').innerHTML = '<div class="empty-state text-center text-muted" style="padding: 2rem 0;">No reviews yet.</div>';
    [1,2,3,4,5].forEach(r => {
      const pb = document.getElementById('pb-' + r);
      if (pb) pb.style.width = '0%';
    });
    return;
  }
  
  let sum = 0;
  const counts = {1:0, 2:0, 3:0, 4:0, 5:0};
  reviews.forEach(r => { sum += Number(r.rating); counts[Number(r.rating)] = (counts[Number(r.rating)] || 0) + 1; });
  const avg = sum / reviews.length;
  
  if (document.getElementById('ratings-avg-score')) document.getElementById('ratings-avg-score').textContent = avg.toFixed(1);
  if (document.getElementById('ratings-avg-stars')) document.getElementById('ratings-avg-stars').textContent = '★'.repeat(Math.round(avg)) + '☆'.repeat(5 - Math.round(avg));
  if (document.getElementById('ratings-total-count')) document.getElementById('ratings-total-count').textContent = reviews.length.toLocaleString();
  
  [1,2,3,4,5].forEach(r => {
    const pb = document.getElementById('pb-' + r);
    if (pb) pb.style.width = ((counts[r] / reviews.length) * 100) + '%';
  });
  
  const html = reviews.map(r => {
    const stars = '★'.repeat(Number(r.rating)) + '☆'.repeat(5 - Number(r.rating));
    const name = r.reviewerName || (r.reviewer ? r.reviewer.fullName : 'Student');
    const initial = name.charAt(0).toUpperCase();
    return `
    <div class="feedback-item mb-4 pb-4" style="border-bottom: 1px solid var(--border-card);">
        <div style="display: flex; align-items: center; margin-bottom: 8px;">
            <div style="width: 36px; height: 36px; border-radius: 50%; background-color: var(--color-purple); color: white; display: flex; align-items: center; justify-content: center; font-weight: bold; margin-right: 12px; flex-shrink: 0; font-size: 0.95rem;">${initial}</div>
            <strong style="color: var(--text-heading); font-size: 0.95rem;">${name}</strong>
        </div>
        <div style="margin-bottom: 8px;">
            <span style="color: var(--color-rating); font-size: 0.85rem; letter-spacing: 1px;">${stars}</span>
        </div>
        <p class="text-sm" style="color: var(--text-heading); line-height: 1.5; margin: 0; word-break: break-word;">${r.comment || ''}</p>
    </div>`;
  }).join('');
  
  if (document.getElementById('profile-feedback-list')) document.getElementById('profile-feedback-list').innerHTML = html;
}
  
window.openViewProfileDialog = async function(userId) {
  const vpDialog = document.getElementById('dialog-view-profile');
  const vpBody = document.getElementById('vp-body');
  const vpSkeleton = document.getElementById('vp-skeleton');
  // Clear old data so it never flashes
  document.getElementById('vp-avatar').textContent = '';
  document.getElementById('vp-name').textContent = '';
  document.getElementById('vp-student-id').textContent = '';
  if (document.getElementById('vp-faculty')) document.getElementById('vp-faculty').textContent = '';
  if (document.getElementById('vp-bio')) document.getElementById('vp-bio').textContent = '';
  if (document.getElementById('vp-skills')) document.getElementById('vp-skills').innerHTML = '';
  ['vp-app-pending','vp-app-completed','vp-app-terminated','vp-emp-pending','vp-emp-completed','vp-emp-terminated'].forEach(id => { const el = document.getElementById(id); if (el) el.textContent = '0'; });
  
  if (document.getElementById('vp-ratings-list')) document.getElementById('vp-ratings-list').innerHTML = '';
  if (document.getElementById('vp-ratings-avg')) document.getElementById('vp-ratings-avg').textContent = '0.0';
    if (document.getElementById('vp-ratings-avg-stars')) document.getElementById('vp-ratings-avg-stars').textContent = '★★★★★';
  if (document.getElementById('vp-ratings-count')) document.getElementById('vp-ratings-count').textContent = '';
  vpDialog.showModal();
  if (vpBody) vpBody.classList.add('hidden');
  if (vpSkeleton) vpSkeleton.classList.remove('hidden');

  // User requested: Always hide skeleton after 1 second
  setTimeout(() => {
    if (vpBody) vpBody.classList.remove('hidden');
    if (vpSkeleton) vpSkeleton.classList.add('hidden');
  }, 1000);

  try {
    const res = await getUserProfile(dc, { id: userId }, SERVER_ONLY);
    const user = res.data.user;
    if (!user) return;
    
    try {
      const allRes = await listAllUsers(dc);
      const fullUser = allRes.data.users.find(u => u.id === userId);
      if (fullUser) {
        user.facultyReference = fullUser.facultyReference;
      }
    } catch(e) {}
    
    document.getElementById('vp-avatar').textContent = initials(user.fullName);
    document.getElementById('vp-name').textContent = user.fullName;
    if (document.getElementById('vp-program')) document.getElementById('vp-program').textContent = user.program || 'N/A';
    if (document.getElementById('vp-faculty')) document.getElementById('vp-faculty').textContent = user.facultyReference || 'Not provided';
    document.getElementById('vp-student-id').textContent = user.studentId || 'N/A';

    // Set stats
    const apps = user.applications_on_applicant || [];
    document.getElementById('vp-app-pending').textContent = apps.filter(a => a.status === 'PENDING').length;
    document.getElementById('vp-app-completed').textContent = apps.filter(a => a.status === 'COMPLETED').length;
    document.getElementById('vp-app-terminated').textContent = apps.filter(a => a.status === 'TERMINATED').length;

    const reqs = user.helpRequests_on_requester || [];
    document.getElementById('vp-emp-pending').textContent = reqs.filter(r => r.status === 'OPEN').length;
    document.getElementById('vp-emp-completed').textContent = reqs.filter(r => r.status === 'COMPLETED').length;
    document.getElementById('vp-emp-terminated').textContent = reqs.filter(r => r.status === 'TERMINATED').length;

    try {
      const profileDoc = await getDoc(doc(firestore, "user_profiles", userId));
      if (profileDoc.exists()) {
        const data = profileDoc.data();
        const vpBio = document.getElementById('vp-bio');
        if (vpBio) vpBio.textContent = data.bio || 'No bio provided.';
        
        const vpSkills = document.getElementById('vp-skills');
        if (vpSkills) {
          if (data.skills && data.skills.length > 0) {
            vpSkills.innerHTML = '<div class="flex flex-wrap gap-2">' + data.skills.map(s => `<span class="badge" style="background: rgba(255,255,255,0.05);">${s}</span>`).join('') + '</div>';
          } else {
            vpSkills.innerHTML = '<span class="text-sm text-muted">No skills listed.</span>';
          }
        }
      } else {
        document.getElementById('vp-bio').textContent = 'No bio provided.';
        document.getElementById('vp-skills').innerHTML = '<span class="text-sm text-muted">No skills listed.</span>';
      }
    } catch(e) {
      console.error(e);
    }
    
    // Fetch reviews from Firestore
    const reviewsSnap = await getDocs(query(collection(firestore, "reviews"), where("targetUserId", "==", userId)));
    const reviews = reviewsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    
    for (let r of reviews) {
      if (!r.reviewerName && r.reviewerId) {
        try {
          const res = await getUserProfile(dc, { id: r.reviewerId });
          if (res.data.user) r.reviewerName = res.data.user.fullName;
        } catch(e) {}
      }
    }
    
    if (reviews.length === 0) {
      document.getElementById('vp-ratings-avg').textContent = '0.0';
      document.getElementById('vp-ratings-avg-stars').textContent = '★★★★★';
      document.getElementById('vp-ratings-count').textContent = '0';
      document.getElementById('vp-ratings-list').innerHTML = '<div class="empty-state text-center text-muted" style="padding: 2rem 0;">No reviews yet.</div>';
      [1,2,3,4,5].forEach(r => { const pb = document.getElementById('vp-pb-' + r); if (pb) pb.style.width = '0%'; });
    } else {
      let sum = 0;
      const counts = {1:0, 2:0, 3:0, 4:0, 5:0};
      reviews.forEach(r => { sum += Number(r.rating); counts[Number(r.rating)] = (counts[Number(r.rating)] || 0) + 1; });
      const avg = sum / reviews.length;
      
      document.getElementById('vp-ratings-avg').textContent = avg.toFixed(1);
      document.getElementById('vp-ratings-avg-stars').textContent = '★'.repeat(Math.round(avg)) + '☆'.repeat(5 - Math.round(avg));
      document.getElementById('vp-ratings-count').textContent = reviews.length.toLocaleString();
      
      [1,2,3,4,5].forEach(r => {
        const pb = document.getElementById('vp-pb-' + r);
        if (pb) pb.style.width = ((counts[r] / reviews.length) * 100) + '%';
      });
      
      document.getElementById('vp-ratings-list').innerHTML = reviews.map(r => {
        const stars = '★'.repeat(Number(r.rating)) + '☆'.repeat(5 - Number(r.rating));
        const name = r.reviewerName || (r.reviewer ? r.reviewer.fullName : 'Student');
        const initial = name.charAt(0).toUpperCase();
            return `
        <div class="feedback-item mb-4 pb-4" style="border-bottom: 1px solid var(--border-card);">
            <div style="display: flex; align-items: center; margin-bottom: 8px;">
                <div style="width: 36px; height: 36px; border-radius: 50%; background-color: var(--color-purple); color: white; display: flex; align-items: center; justify-content: center; font-weight: bold; margin-right: 12px; flex-shrink: 0; font-size: 0.95rem;">${initial}</div>
                <strong style="color: var(--text-heading); font-size: 0.95rem;">${name}</strong>
            </div>
            <div style="margin-bottom: 8px;">
                <span style="color: var(--color-rating); font-size: 0.85rem; letter-spacing: 1px;">${stars}</span>
            </div>
            <p class="text-sm" style="color: var(--text-heading); line-height: 1.5; margin: 0; word-break: break-word;">${r.comment || ''}</p>
        </div>`;
      }).join('');
    }
    
  } catch (err) {
    console.error('Profile Dialog Error:', err);
    showToast('Failed to load profile', 'error');
  }
};

  // ── Mentoring ────────────────────────────────────────────────────────────────
  async function loadMentoring() {
    const grid = document.getElementById('mentoring-users-grid');
    if (grid.children.length === 0 || grid.querySelector('.skeleton-loader') || grid.querySelector('.loader')) {
      const skeletonCard = `
        <div class="job-card" style="box-shadow: none; border: 1px solid var(--border-light);">
          <div class="flex items-center gap-3 mb-4">
            <div class="skeleton-loader skeleton-avatar" style="width: 44px; height: 44px;"></div>
            <div style="flex: 1;">
              <div class="skeleton-loader skeleton-line-short" style="margin-bottom: 6px;"></div>
              <div class="skeleton-loader skeleton-line-xs" style="margin-bottom: 0;"></div>
            </div>
          </div>
          <div class="skeleton-loader skeleton-line" style="margin-bottom: 8px;"></div>
          
          <div class="flex gap-2 mb-4">
            <div class="skeleton-loader skeleton-badge" style="width: 50px;"></div>
            <div class="skeleton-loader skeleton-badge" style="width: 60px;"></div>
            <div class="skeleton-loader skeleton-badge" style="width: 40px;"></div>
          </div>
          
          <div class="flex justify-between gap-3 mt-auto border-t" style="padding-top: 1rem; border-color: var(--border-light);">
            <div class="skeleton-loader" style="width: 48%; height: 36px; border-radius: 999px;"></div>
            <div class="skeleton-loader" style="width: 48%; height: 36px; border-radius: 999px;"></div>
          </div>
        </div>
      `;
      grid.innerHTML = skeletonCard.repeat(6);
    }
    
    try {
      const res = await listAllUsers(dc);
      let users = res.data.users || [];
      users = users.filter(u => u.id !== userData.id);
      
      try {
        const profilesSnap = await getDocs(collection(firestore, "user_profiles"));
        const profilesMap = {};
        profilesSnap.forEach(d => { profilesMap[d.id] = d.data(); });
        
        const revSnap = await getDocs(collection(firestore, "reviews"));
        const revMap = {};
        revSnap.forEach(d => {
          const data = d.data();
          if(!revMap[data.targetUserId]) revMap[data.targetUserId] = { sum: 0, count: 0 };
          revMap[data.targetUserId].sum += Number(data.rating) || 5;
          revMap[data.targetUserId].count++;
        });

        users.forEach(u => {
          u.bio = profilesMap[u.id]?.bio || '';
          u.skills = profilesMap[u.id]?.skills || [];
          u.rating = revMap[u.id] ? (revMap[u.id].sum / revMap[u.id].count).toFixed(1) : 'New';
        });
      } catch(e) {}
      
      allUsersData = users;
      renderMentoringGrid(users);
    } catch(e) {
      console.error(e);
      grid.innerHTML = '<div class="empty-state">Error loading users.</div>';
    }
  }

  function renderMentoringGrid(users) {
    const grid = document.getElementById('mentoring-users-grid');
    grid.innerHTML = '';
    if (users.length === 0) {
      grid.innerHTML = '<div class="empty-state">No users available for mentoring.</div>';
      return;
    }
    
    users.forEach(u => {
      const card = document.createElement('div');
      card.className = 'job-card';
      
      const skills = u.skills || [];
      let skillsHtml = '';
      if (skills.length > 0) {
        skillsHtml = '<div class="mt-2 mb-3 flex flex-wrap gap-1">' + skills.slice(0, 5).map(s => `<span class="badge" style="background: rgba(255,255,255,0.05);">${s}</span>`).join('') + (skills.length > 5 ? '<span class="text-xs text-muted">+' + (skills.length - 5) + '</span>' : '') + '</div>';
      } else {
        skillsHtml = '<div class="mt-2 mb-3 text-xs text-muted">No skills listed</div>';
      }

      card.innerHTML = `
        <div class="flex items-center gap-2 mb-3">
          <div class="avatar cursor-pointer" onclick="openViewProfileDialog('${u.id}')">${initials(u.fullName)}</div>
          <div class="flex-1">
            <div class="flex justify-between items-center">
              <h3 class="job-title cursor-pointer hover:underline" style="margin:0;" onclick="openViewProfileDialog('${u.id}')">${u.fullName}</h3>
              <span class="flex items-center gap-1 text-sm font-bold" style="color: var(--color-amber);">
                <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                ${u.rating || 'New'}
              </span>
            </div>
          </div>
        </div>
        <p class="text-sm text-muted mb-2 line-clamp-2">${u.bio || 'No bio provided.'}</p>
        ${skillsHtml}
        <div class="flex justify-between items-center mt-auto" style="padding-top: 1rem; border-top: 1px solid var(--border-card);">
          <button type="button" class="btn btn-outline btn-sm view-profile-btn">View Profile</button>
          <button type="button" class="btn btn-purple btn-sm apply-mentor-btn">Apply</button>
        </div>
      `;
      
      card.querySelector('.view-profile-btn').addEventListener('click', () => openViewProfileDialog(u.id));
      card.querySelector('.apply-mentor-btn').addEventListener('click', () => {
        activeMentoringTarget = u;
        document.getElementById('mentoring-target-name').textContent = u.fullName;
        document.getElementById('mentoring-apply-form').reset();
        document.getElementById('dialog-mentoring-apply').showModal();
      });
      
      grid.appendChild(card);
    });
  }

  function setupMentoringDialog() {
    const searchInput = document.getElementById('mentoring-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        const q = e.target.value.toLowerCase();
        const filtered = allUsersData.filter(u => 
          (u.fullName || '').toLowerCase().includes(q) || 
          (u.preferredRole || '').toLowerCase().includes(q) ||
          (u.skills || []).some(s => s.toLowerCase().includes(q))
        );
        renderMentoringGrid(filtered);
      });
    }

    const form = document.getElementById('mentoring-apply-form');
    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!activeMentoringTarget) return;
        const btn = document.getElementById('btn-submit-mentoring');
        btn.disabled = true;
        btn.textContent = 'Submitting...';
        
        try {
          const title = document.getElementById('mentoring-title').value.trim();
          const desc = document.getElementById('mentoring-desc').value.trim();
          const time = document.getElementById('mentoring-time').value.trim();
          const amount = Number(document.getElementById('mentoring-amount').value);
          if (amount > 100000) {
            showToast('Proposed price cannot exceed ₱100,000.', 'error');
            btn.disabled = false;
            btn.textContent = 'Submit Proposal';
            return;
          }
          
          const reqRes = await createHelpRequest(dc, {
            title: "Mentoring: " + title,
            description: desc,
            budget: amount,
            requesterId: activeMentoringTarget.id,
            category: 'MENTORING'
          });
          
          const newReqId = reqRes.data.helpRequest_insert.id;
          
          await createApplication(dc, {
            helpRequestId: newReqId,
            applicantId: userData.id,
            priceOffer: amount,
            message: "Expected Time: " + time
          });
          
          showToast('Mentoring proposal sent!');
          document.getElementById('dialog-mentoring-apply').close();
        } catch (err) {
          console.error(err);
          showToast('Error sending proposal: ' + err.message, 'error');
        } finally {
          btn.disabled = false;
          btn.textContent = 'Submit Proposal';
        }
      });
    }
  }

  function setupEditProfile() {
  const btnEditProfile = document.getElementById('btn-edit-profile');
  if (btnEditProfile) {
    btnEditProfile.addEventListener('click', () => {
      const bioEl = document.getElementById('edit-bio');
      if (bioEl) bioEl.value = userData?.bio || '';
      
      const userSkills = userData?.skills || [];
      document.querySelectorAll('#edit-skills-grid input[type="checkbox"]').forEach(cb => {
        cb.checked = userSkills.includes(cb.value);
      });
      
      const searchEl = document.getElementById('edit-skills-search');
      if (searchEl) searchEl.value = '';
      
      document.querySelectorAll('#edit-skills-grid .skill-pill').forEach(pill => {
        pill.style.display = 'inline-flex';
      });
      
      const dialog = document.getElementById('dialog-edit-profile');
      if (dialog) dialog.showModal();
    });
  }

  const searchInput = document.getElementById('edit-skills-search');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const q = e.target.value.toLowerCase();
      document.querySelectorAll('#edit-skills-grid .skill-pill').forEach(pill => {
        const text = pill.textContent.toLowerCase();
        pill.style.display = text.includes(q) ? 'inline-flex' : 'none';
      });
    });
  }

  const form = document.getElementById('edit-profile-form');
  if (form) {
          form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const bioEl = document.getElementById('edit-bio');
        const bio = bioEl ? bioEl.value.trim() : '';
        
        const skills = Array.from(document.querySelectorAll('#edit-skills-grid input[type="checkbox"]:checked')).map(cb => cb.value);
        
        const btn = form.querySelector('button[type="submit"]');
        if (btn) { btn.disabled = true; btn.textContent = 'Saving...'; }
        
        try {
          if (userData) {
            userData.bio = bio;
            userData.skills = skills;
            
            await setDoc(doc(firestore, "user_profiles", userData.id), {
              bio: bio,
              skills: skills
            }, { merge: true });
          }
          
          const bioDisplay = document.getElementById('profile-bio-display');
          if (bioDisplay) bioDisplay.textContent = bio || 'No bio provided yet.';
          
          const skillsDisplay = document.getElementById('profile-skills-display');
          if (skillsDisplay) {
            if (skills.length === 0) {
              skillsDisplay.innerHTML = '<p class="text-muted text-sm">No skills added yet.</p>';
            } else {
              skillsDisplay.innerHTML = skills.map(s => `<span class="skill-pill" style="display:inline-block; margin:2px; background:var(--accent-purple-light); color:var(--primary-purple); border:1px solid rgba(79, 70, 229, 0.2); font-weight:600; padding:4px 10px; border-radius:999px; font-size:12px;">${s}</span>`).join('');
            }
          }
          
          showToast('Profile successfully updated!');
          const dialog = document.getElementById('dialog-edit-profile');
          if (dialog) dialog.close();
        } catch (err) {
          console.error(err);
          showToast('Failed to save profile.', 'error');
        } finally {
          if (btn) { btn.disabled = false; btn.textContent = 'Save Changes'; }
        }
      });
  }
}

// ΓöÇΓöÇ Admin Dashboard & Platform Intelligence ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
let adminActiveTab = 'pending';
let adminUsersData = [];
let adminPendingData = [];
let adminAppsData = [];
let adminRequestsData = [];
let adminSearchQuery = '';
  let activeMentoringTarget = null;
  let allUsersData = [];

async function loadAdmin() {
  if (!ADMIN_EMAILS.includes(userData?.email)) {
    navigateTo('dashboard');
    return;
  }

  try {
    const [usersRes, reqsRes, appsRes] = await Promise.all([
      listAllUsers(dc, SERVER_ONLY),
      listAllHelpRequestsAdmin(dc, SERVER_ONLY),
      listAllApplicationsAdmin(dc, SERVER_ONLY)
    ]);

    adminUsersData = usersRes.data?.users || [];
    adminRequestsData = reqsRes.data?.helpRequests || [];
    adminAppsData = appsRes.data?.applications || [];
    adminPendingData = adminUsersData.filter(u => u.verificationStatus === 'pending');

    // 1. Registered Students Count
    const totalStudents = adminUsersData.filter(u => u.verificationStatus !== 'pending').length;
    $('#admin-stat-registered').textContent = totalStudents;

    // 2. Pending Verification Count
    const pendingCount = adminPendingData.length;
    $('#admin-stat-pending').textContent = pendingCount;
    const tabBadge = $('#admin-pending-tab-badge');
    if (tabBadge) tabBadge.textContent = pendingCount;

    // 3. Active Jobs Count
    const activeJobs = adminRequestsData.filter(r => r.status === 'OPEN' || !r.status).length;
    $('#admin-stat-active-jobs').textContent = activeJobs;

    // 4. Completed Jobs Count
    const completedJobs = adminRequestsData.filter(r => r.status === 'COMPLETED').length;
    $('#admin-stat-completed-jobs').textContent = completedJobs;

    // 5. Terminated Jobs Count
    const terminatedJobs = adminAppsData.filter(a => a.status === 'TERMINATED').length;
    $('#admin-stat-terminated-jobs').textContent = terminatedJobs;

    // 6. Total Transactions Across Whole Website (Sum of completed earnings)
    const totalTrans = adminAppsData
      .filter(a => a.status === 'COMPLETED')
      .reduce((sum, a) => sum + (Number(a.priceOffer) || 0), 0);
    $('#admin-stat-total-transactions').textContent = peso(totalTrans);

    // Render active tab view
    renderCurrentAdminTab();

  } catch (err) {
    console.error('Admin data load error:', err);
    showToast('Error loading platform metrics: ' + err.message, 'error');
  }
}

function renderCurrentAdminTab() {
  if (adminActiveTab === 'pending') renderAdminPending();
  else if (adminActiveTab === 'users') renderAdminUsers();
  else if (adminActiveTab === 'applications') renderAdminApplications();
}

function renderAdminPending() {
  const container = $('#admin-list');
  if (!container) return;

  let list = adminPendingData;
  if (adminSearchQuery) {
    const q = adminSearchQuery.toLowerCase();
    list = list.filter(u =>
      (u.fullName || '').toLowerCase().includes(q) ||
      (u.studentId || '').toLowerCase().includes(q) ||
      (u.email || '').toLowerCase().includes(q) ||
      (u.facultyReference || '').toLowerCase().includes(q)
    );
  }

  container.innerHTML = '';
  if (list.length === 0) {
    container.innerHTML = '<div class="empty-state text-center text-muted" style="padding: 2rem;">No pending student verifications.</div>';
    return;
  }

  list.forEach(u => {
    const card = document.createElement('div');
    card.className = 'admin-card';
    card.innerHTML = `
      <div class="admin-card-info">
        <div class="avatar cursor-pointer" onclick="openViewProfileDialog('${u.id}')">${initials(u.fullName)}</div>
        <div>
          <strong class="cursor-pointer hover:underline" onclick="openViewProfileDialog('${u.id}')">${u.fullName}</strong>
          <div class="text-muted text-sm">${u.email} &bull; ID: ${u.studentId || 'N/A'} &bull; ${u.preferredRole || 'Student'}</div>
          <div class="admin-card-meta">
            <span class="badge badge-pending">Pending</span>
            <small class="text-muted">Faculty: ${u.facultyReference || 'None'}</small>
          </div>
        </div>
      </div>
      <div class="flex items-center gap-2">
        <button type="button" class="btn btn-outline btn-sm view-profile-btn">Full Info</button>
        ${u.certificateUrl && u.certificateUrl !== 'none'
        ? `<button type="button" class="btn btn-outline btn-sm view-cert-btn">View COE</button>`
        : ''}
        <button type="button" class="btn btn-outline btn-sm reject-btn">Reject</button>
        <button type="button" class="btn btn-purple btn-sm approve-btn">Approve</button>
      </div>
    `;

    card.querySelector('.view-profile-btn')?.addEventListener('click', (e) => {
      e.preventDefault();
      openApplicantDetails(u);
    });

    card.querySelector('.approve-btn')?.addEventListener('click', async (e) => {
      e.preventDefault();
      try {
        await updateUserStatus(dc, { id: u.id, status: 'verified' });
        showToast(`${u.fullName} approved and verified!`);
        loadAdmin();
      } catch (err) {
        showToast('Error: ' + err.message, 'error');
      }
    });

    card.querySelector('.reject-btn')?.addEventListener('click', async (e) => {
      e.preventDefault();
      try {
        await updateUserStatus(dc, { id: u.id, status: 'rejected' });
        showToast(`${u.fullName} rejected.`);
        loadAdmin();
      } catch (err) {
        showToast('Error: ' + err.message, 'error');
      }
    });

    card.querySelector('.view-cert-btn')?.addEventListener('click', (e) => {
      e.preventDefault();
      $('#cert-preview-img').src = u.certificateUrl;
      $('#dialog-certificate').showModal();
    });

    container.appendChild(card);
  });
}

function renderAdminUsers() {
  const tbody = $('#admin-all-users-tbody');
  if (!tbody) return;

  let list = adminUsersData.filter(u => u.verificationStatus !== 'pending');
  if (adminSearchQuery) {
    const q = adminSearchQuery.toLowerCase();
    list = list.filter(u =>
      (u.fullName || '').toLowerCase().includes(q) ||
      (u.studentId || '').toLowerCase().includes(q) ||
      (u.email || '').toLowerCase().includes(q) ||
      (u.facultyReference || '').toLowerCase().includes(q)
    );
  }

  tbody.innerHTML = '';
  if (list.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted" style="padding: 2rem;">No registered students found.</td></tr>';
    return;
  }

  list.forEach(u => {
    const tr = document.createElement('tr');
    const isVerified = u.verificationStatus === 'verified';
    const isPending = u.verificationStatus === 'pending';
    const badgeClass = isVerified ? 'badge-approved' : isPending ? 'badge-pending' : 'badge-rejected';

    tr.innerHTML = `
      <td>
        <div class="flex items-center gap-2">
          <div class="avatar avatar-sm">${initials(u.fullName)}</div>
          <div>
            <strong>${u.fullName}</strong>
            <div class="text-xs text-muted">${u.email}</div>
          </div>
        </div>
      </td>
      <td><strong>${u.studentId || 'N/A'}</strong></td>
      <td>
        <div>${u.preferredRole || 'Student'}</div>
        <small class="text-muted">${u.facultyReference || 'No Faculty'}</small>
      </td>
      <td><span class="badge ${badgeClass}">${u.verificationStatus || 'Unknown'}</span></td>
      <td>
        ${u.certificateUrl && u.certificateUrl !== 'none'
        ? `<button type="button" class="btn btn-outline btn-sm view-cert-btn">View COE</button>`
        : `<span class="text-muted text-sm italic">No COE provided</span>`}
      </td>
      <td>
        <div class="flex items-center gap-1">
          <button type="button" class="btn btn-outline btn-sm view-info-btn">Details</button>
          ${!isVerified ? `<button type="button" class="btn btn-purple btn-sm quick-verify-btn">Verify</button>` : ''}
          <button type="button" class="btn btn-outline btn-sm delete-user-btn" style="border-color: #ef4444; color: #ef4444;">Delete</button>
        </div>
      </td>
    `;

    tr.querySelector('.view-info-btn')?.addEventListener('click', () => openApplicantDetails(u));
    tr.querySelector('.view-cert-btn')?.addEventListener('click', () => {
      $('#cert-preview-img').src = u.certificateUrl;
      $('#dialog-certificate').showModal();
    });
    tr.querySelector('.quick-verify-btn')?.addEventListener('click', async () => {
      await updateUserStatus(dc, { id: u.id, status: 'verified' });
      showToast(`${u.fullName} marked as verified.`);
      loadAdmin();
    });
    tr.querySelector('.delete-user-btn')?.addEventListener('click', async () => {
      if (confirm(`Are you sure you want to permanently delete user ${u.fullName}?`)) {
        try {
          await deleteUser(dc, { id: u.id });
          showToast(`User ${u.fullName} deleted.`);
          loadAdmin();
        } catch (err) {
          showToast('Failed to delete user: ' + err.message, 'error');
        }
      }
    });

    tbody.appendChild(tr);
  });
}

function renderAdminApplications() {
  const tbody = $('#admin-all-apps-tbody');
  if (!tbody) return;

  let list = adminAppsData;
  if (adminSearchQuery) {
    const q = adminSearchQuery.toLowerCase();
    list = list.filter(a =>
      (a.helpRequest?.title || '').toLowerCase().includes(q) ||
      (a.applicant?.fullName || '').toLowerCase().includes(q) ||
      (a.applicant?.studentId || '').toLowerCase().includes(q) ||
      (a.message || '').toLowerCase().includes(q)
    );
  }

  tbody.innerHTML = '';
  if (list.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted" style="padding: 2rem;">No applications submitted yet.</td></tr>';
    return;
  }

  list.forEach(a => {
    const tr = document.createElement('tr');
    const isCompleted = a.status === 'COMPLETED';
    const isApproved = a.status === 'APPROVED';
    const badgeClass = isCompleted ? 'badge-approved' : isApproved ? 'badge-normal' : a.status === 'TERMINATED' ? 'badge-rejected' : 'badge-pending';

    tr.innerHTML = `
      <td><strong>${a.helpRequest?.title || 'Service Request'}</strong></td>
      <td>
        <div class="flex items-center gap-2">
          <div class="avatar avatar-sm">${initials(a.applicant?.fullName || '')}</div>
          <div>
            <strong>${a.applicant?.fullName || 'Applicant'}</strong>
            <div class="text-xs text-muted">${a.applicant?.email || ''}</div>
          </div>
        </div>
      </td>
      <td>${a.applicant?.studentId || 'N/A'}</td>
      <td><strong>${peso(a.priceOffer)}</strong></td>
      <td><div class="truncate" style="max-width: 220px;">"${a.message}"</div></td>
      <td><span class="badge ${badgeClass}">${a.status || 'Pending'}</span></td>
      <td>
        <button type="button" class="btn btn-outline btn-sm delete-app-btn" style="border-color: #ef4444; color: #ef4444;">Delete</button>
      </td>
    `;
    
    tr.querySelector('.delete-app-btn')?.addEventListener('click', async () => {
      if (confirm(`Are you sure you want to permanently delete application for "${a.helpRequest?.title}"?`)) {
        try {
          await deleteApplication(dc, { id: a.id });
          showToast(`Application deleted.`);
          loadAdmin();
        } catch (err) {
          showToast('Failed to delete application: ' + err.message, 'error');
        }
      }
    });

    tbody.appendChild(tr);
  });
}

function openApplicantDetails(user) {
  const body = $('#applicant-modal-body');
  if (!body) return;

  const isVerified = user.verificationStatus === 'verified';
  const isPending = user.verificationStatus === 'pending';
  const badgeClass = isVerified ? 'badge-approved' : isPending ? 'badge-pending' : 'badge-rejected';

  body.innerHTML = `
    <div class="flex items-center gap-3 mb-4">
      <div class="avatar avatar-md">${initials(user.fullName)}</div>
      <div>
        <h3 class="font-bold text-lg">${user.fullName}</h3>
        <p class="text-muted text-sm">${user.email}</p>
        <span class="badge ${badgeClass} mt-1">${user.verificationStatus || 'Pending'}</span>
      </div>
    </div>

    <div class="applicant-detail-grid">
      <div class="applicant-detail-item">
        <span class="text-xs text-muted font-bold">STUDENT ID</span>
        <strong>${user.studentId || 'N/A'}</strong>
      </div>
      <div class="applicant-detail-item">
        <span class="text-xs text-muted font-bold">GENDER</span>
        <strong>${user.gender || 'Not specified'}</strong>
      </div>
      <div class="applicant-detail-item">
        <span class="text-xs text-muted font-bold">PREFERRED ROLE</span>
        <strong>${user.preferredRole || 'Student Freelancer'}</strong>
      </div>
      <div class="applicant-detail-item">
        <span class="text-xs text-muted font-bold">FACULTY REFERENCE</span>
        <strong>${user.facultyReference || 'None'}</strong>
      </div>
    </div>

    ${user.certificateUrl && user.certificateUrl !== 'none' ? `
      <div class="mt-4">
        <span class="text-xs text-muted font-bold block mb-1">STUDENT ID / CERTIFICATE PREVIEW</span>
        <img src="${user.certificateUrl}" class="admin-cert-thumb cert-open-preview" style="width: 100%; max-height: 240px; object-fit: contain; background: #000; border-radius: 8px; cursor: pointer;" title="Click to view full size" alt="Student Document">
      </div>
    ` : '<p class="text-muted text-sm mt-3">No certificate document uploaded.</p>'}
  `;

  content.querySelector('.cert-open-preview')?.addEventListener('click', () => {
    $('#cert-preview-img').src = user.certificateUrl;
    $('#dialog-certificate').showModal();
  });

  $('#dialog-applicant-details')?.showModal();
}

function setupAdminTabs() {
  $$('.admin-tab-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      adminActiveTab = btn.dataset.admintab;
      $$('.admin-tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      $$('.admin-tab-content').forEach(c => c.classList.add('hidden'));
      $(`#admin-tab-${adminActiveTab}`)?.classList.remove('hidden');

      renderCurrentAdminTab();
    });
  });
}

function setupAdminSearch() {
  $('#admin-search-input')?.addEventListener('input', (e) => {
    adminSearchQuery = e.target.value.trim();
    renderCurrentAdminTab();
  });
}


function setupMobileSidebar() {
  const btn = document.getElementById('mobile-menu-btn');
  if(btn) {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const sidebar = document.getElementById('sidebar');
      if(sidebar) sidebar.classList.add('sidebar-open');
      const overlay = document.getElementById('sidebar-overlay');
      if(overlay) { overlay.style.display = 'block'; overlay.classList.remove('hidden'); }
    });
  }
  const closeMobileSidebar = (e) => {
    if(e) e.preventDefault();
    const sidebar = document.getElementById('sidebar');
    if(sidebar) sidebar.classList.remove('sidebar-open');
    const overlay = document.getElementById('sidebar-overlay');
    if(overlay) { overlay.style.display = 'none'; overlay.classList.add('hidden'); }
  };
  const overlay = document.getElementById('sidebar-overlay');
  if(overlay) overlay.addEventListener('click', closeMobileSidebar);
  const closeBtn = document.getElementById('sidebar-close-btn');
  if(closeBtn) closeBtn.addEventListener('click', closeMobileSidebar);
}

// ── Logout ───────────────────────────────────────────────────────────────────
function setupLogout() {
  $('#btn-logout')?.addEventListener('click', async (e) => {
    e.preventDefault();
    const forms = ['#landing-quick-login-form', '#login-form', '#register-form'];
    forms.forEach(sel => { const f = document.querySelector(sel); if (f) f.reset(); });
    hide($('#register-faculty-other-group'));
    if (autoRefreshTimer) { clearInterval(autoRefreshTimer); autoRefreshTimer = null; }
    if (chatPollTimer) { clearInterval(chatPollTimer); chatPollTimer = null; }
    if (messageSubscription) { 
      if (typeof messageSubscription === 'function') messageSubscription();
      else off(messageSubscription);
      messageSubscription = null; 
    }
    if (conversationsSubscription) { conversationsSubscription(); conversationsSubscription = null; }
    clearUserSessionDOM();
    history.pushState(null, '', '/');
    await signOut(auth);
  });
}

// ── Dialog Helpers ───────────────────────────────────────────────────────────
function setupDialogCloseButtons() {
  $$('.dialog-close-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      btn.closest('dialog')?.close();
    });
  });
  $$('dialog').forEach(dialog => {
    dialog.addEventListener('click', (e) => {
      if (e.target === dialog) dialog.close();
    });
  });
}

// ── Universal Password Visibility Toggle ───────────────────────────────────────
function setupPasswordToggles() {
  const eyeSvg = `
    <svg class="eye-icon eye-show" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
    <svg class="eye-icon eye-hide hidden" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/>
      <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/>
      <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/>
      <line x1="2" x2="22" y1="2" y2="22"/>
    </svg>`;

  // 1. Ensure any password input on the entire website has a wrapper and button
  $$('input[type="password"], input[data-password-toggle]').forEach(input => {
    let wrapper = input.closest('.password-input-wrapper');
    if (!wrapper) {
      wrapper = document.createElement('div');
      wrapper.className = 'password-input-wrapper';
      input.parentNode.insertBefore(wrapper, input);
      wrapper.appendChild(input);
    }
    if (!wrapper.querySelector('.password-toggle-btn')) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'password-toggle-btn';
      btn.setAttribute('aria-label', 'Toggle password visibility');
      btn.setAttribute('tabindex', '-1');
      btn.innerHTML = eyeSvg;
      wrapper.appendChild(btn);
    }
  });

  // 2. Attach toggle behavior
  $$('.password-toggle-btn').forEach(btn => {
    if (btn.dataset.toggleBound) return;
    btn.dataset.toggleBound = 'true';
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const wrapper = btn.closest('.password-input-wrapper');
      if (!wrapper) return;
      const input = wrapper.querySelector('input');
      if (!input) return;
      const isCurrentlyPassword = input.type === 'password';
      input.type = isCurrentlyPassword ? 'text' : 'password';

      const showIcon = btn.querySelector('.eye-show');
      const hideIcon = btn.querySelector('.eye-hide');
      if (showIcon && hideIcon) {
        showIcon.classList.toggle('hidden', isCurrentlyPassword);
        hideIcon.classList.toggle('hidden', !isCurrentlyPassword);
      }
      btn.setAttribute('aria-label', isCurrentlyPassword ? 'Hide password' : 'Show password');
    });
  });
}

// ── Initialization ───────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  window.addEventListener('popstate', (e) => {
    if (e.state && e.state.section) {
      navigateTo(e.state.section, false);
    } else {
      const path = window.location.pathname.replace(/^\/|\/$/g, '');
      if (VALID_SECTIONS.includes(path)) navigateTo(path, false);
      else navigateTo('dashboard', false);
    }
  });

  setupLanding();
  setupRegister();
  setupForgotPassword();
  setupPasswordToggles();
  setupDashboardLinks();
  setupServiceFilters();
  setupNewRequestDialog();
  setupApplyDialog();
  setupApplicationTabs();
  setupChat();
  setupTransactionTabs();
  setupInlineRatingForm();
  setupReviewDialog();
  setupEditProfile();
    setupMentoringDialog();
  setupMobileSidebar();
  setupLogout();
  setupAdminTabs();
  setupAdminSearch();
  setupDialogCloseButtons();

  $$('.nav-btn[data-target]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      navigateTo(btn.dataset.target);
      $('#sidebar')?.classList.remove('sidebar-open');
      hide($('#sidebar-overlay'));
    });
  });

  $('.user-footer-profile')?.addEventListener('click', (e) => {
    e.preventDefault();
    navigateTo('profile');
  });
});







