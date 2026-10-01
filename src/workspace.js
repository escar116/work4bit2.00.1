const $ = selector => document.querySelector(selector);
const icon = path => `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${path}</svg>`;
const panelIcon = icon('<rect x="3" y="4" width="18" height="16" rx="3"/><path d="M9 4v16"/>');
const questions = [
  { title: 'Offer your skills', question: 'You provide printing regularly. What should you publish?', options: ['A service offer', 'A one-time service request'], answer: 0, explanation: 'A service offer stays available so other students can order again after a completed transaction.' },
  { title: 'Ask for help', question: 'You need someone to help with a single project. What should you post?', options: ['A service offer', 'A service request'], answer: 1, explanation: 'A service request describes a specific task, its budget and deadline. Other students can apply.' },
  { title: 'Agree on the work', question: 'Where do you coordinate an accepted application or order?', options: ['In Messages', 'By posting another listing'], answer: 0, explanation: 'Use the conversation for that job to agree on scope, timing and deliverables. You can also attach project files.' },
  { title: 'Complete a transaction', question: 'When should you confirm completion and leave a review?', options: ['Immediately after an application arrives', 'After checking the delivered work and agreed amount'], answer: 1, explanation: 'Review the delivered work and payment summary first. A completed transaction contributes to your statistics and reviews.' },
  { title: 'Learn with a peer', question: 'Where can you find student mentors?', options: ['Mentoring', 'Transactions'], answer: 0, explanation: 'Use Mentoring to find peer guidance. Transactions shows your recorded earnings and payments.' },
];

export function setupWorkspace({ navigate, search, getUser, refresh }) {
  const app = $('#app-views');
  const sidebar = $('#sidebar');
  const header = document.createElement('header');
  header.className = 'workspace-header';
  header.innerHTML = `<a class="workspace-brand" href="/dashboard" aria-label="Work4abit dashboard"><img src="/favicon.png" alt="Work 4 A Bit Logo" class="brand-logo-img"></a><form class="workspace-search" role="search"><label class="sr-only" for="workspace-search">Search service listings</label>${icon('<circle cx="10" cy="10" r="7"/><path d="m15 15 6 6"/>')}<input id="workspace-search" type="search" placeholder="Search services…" autocomplete="off"><button type="submit" aria-label="Search services">Search</button></form><div class="workspace-actions"><button class="icon-button workspace-menu mobile-only" type="button" aria-label="Open navigation" aria-controls="sidebar" aria-expanded="false">${panelIcon}</button><button class="icon-button workspace-messages" type="button" title="Messages" aria-label="Messages">${icon('<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>')}</button><div class="workspace-account"><button type="button" class="icon-button account-toggle" aria-label="Open account menu" aria-expanded="false" aria-controls="workspace-account-menu"><span id="workspace-avatar">●</span></button><div id="workspace-account-menu" class="workspace-account-menu hidden"></div></div></div>`;
  header.querySelector('.workspace-brand').append($('#sidebar .logo'));
  header.querySelector('.workspace-actions').insertBefore($('#sidebar .header-bell-wrapper'), header.querySelector('.workspace-account'));
  header.querySelector('.workspace-account-menu').append($('.sidebar-user-footer'));
  const profile = header.querySelector('.user-footer-profile');
  profile.setAttribute('role', 'button'); profile.tabIndex = 0;
  profile.addEventListener('keydown', event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); profile.click(); } });
  app.prepend(header);
  $('.mobile-top-bar')?.remove();
  // Section headers are now directly organized inside .nav-links groups
  const tools = document.createElement('div'); tools.className = 'workspace-sidebar-tools';
  tools.innerHTML = `<button type="button" class="nav-btn guide-open" title="Getting started">${icon('<path d="M12 3v18M3 5c4-2 6-1 9 1 3-2 5-3 9-1v14c-4-2-6-1-9 1-3-2-5-3-9-1z"/>')}<span class="nav-btn-label">Getting started</span><span id="guide-count" class="guide-count"></span></button><button class="nav-btn sidebar-toggle" type="button" title="Collapse sidebar" aria-label="Collapse sidebar" aria-controls="sidebar" aria-expanded="true">${panelIcon}<span class="nav-btn-label">Collapse</span></button>`;
  sidebar.append(tools);
  sidebar.querySelectorAll('.nav-btn').forEach(button => button.setAttribute('aria-label', button.title || button.textContent.trim()));
  const read = key => { try { return localStorage.getItem(key); } catch { return null; } };
  const write = (key, value) => { try { localStorage.setItem(key, value); } catch { /* Session still works without persistence. */ } };
  const toggle = $('.sidebar-toggle');
  const setCollapsed = collapsed => {
    app.classList.toggle('sidebar-collapsed', collapsed);
    toggle.setAttribute('aria-expanded', String(!collapsed));
    toggle.title = collapsed ? 'Expand sidebar' : 'Collapse sidebar';
    toggle.setAttribute('aria-label', toggle.title);
    toggle.querySelector('span').textContent = collapsed ? 'Expand' : 'Collapse';
  };
  setCollapsed(read('w4a-sidebar-collapsed') === 'true');
  toggle.addEventListener('click', () => { const collapsed = !app.classList.contains('sidebar-collapsed'); setCollapsed(collapsed); write('w4a-sidebar-collapsed', String(collapsed)); });
  const menu = $('.workspace-menu');
  const closeDrawer = () => { sidebar.classList.remove('sidebar-open'); $('#sidebar-overlay').classList.add('hidden'); $('#sidebar-overlay').style.display = 'none'; menu?.setAttribute('aria-expanded', 'false'); };
  menu?.addEventListener('click', () => { if (sidebar.classList.contains('sidebar-open')) return closeDrawer(); sidebar.classList.add('sidebar-open'); $('#sidebar-overlay').classList.remove('hidden'); $('#sidebar-overlay').style.display = 'block'; menu?.setAttribute('aria-expanded', 'true'); $('#sidebar .nav-btn').focus(); });
  $('#sidebar-overlay').addEventListener('click', closeDrawer);
  $('#sidebar-close-btn').addEventListener('click', () => { closeDrawer(); menu?.focus(); });
  sidebar.addEventListener('click', event => { if (event.target.closest('[data-target], .guide-open')) closeDrawer(); });
  header.querySelector('.workspace-brand').addEventListener('click', event => { event.preventDefault(); navigate('dashboard'); });
  $('.workspace-messages').addEventListener('click', () => navigate('messages'));
  $('.workspace-search').addEventListener('submit', event => { event.preventDefault(); search($('#workspace-search').value.trim()); });
  const account = $('.account-toggle'); const accountMenu = $('.workspace-account-menu');
  const closeAccount = () => { accountMenu.classList.add('hidden'); account.setAttribute('aria-expanded', 'false'); };
  account.addEventListener('click', () => { const open = accountMenu.classList.toggle('hidden') === false; account.setAttribute('aria-expanded', String(open)); });
  accountMenu.addEventListener('click', closeAccount);
  document.addEventListener('click', event => { if (!event.target.closest('.workspace-account')) closeAccount(); });
  document.addEventListener('keydown', event => { if (event.key === 'Escape') { closeAccount(); closeDrawer(); $('#notification-dropdown').classList.add('hidden'); } });
  $('#dashboard-refresh')?.addEventListener('click', () => refresh());
  $('#dash-btn-start-guide')?.addEventListener('click', () => $('.guide-open')?.click());

  const guide = document.createElement('dialog'); guide.className = 'workspace-guide'; guide.setAttribute('aria-labelledby', 'guide-title');
  guide.innerHTML = `<div class="guide-top"><button class="icon-button guide-close" type="button" aria-label="Close getting started">×</button><progress id="guide-progress" max="5" value="0" aria-label="Guide progress"></progress><span id="guide-step"></span></div><div class="guide-body"><p class="eyebrow">WORK4ABIT BASICS</p><h2 id="guide-title"></h2><p id="guide-question"></p><div id="guide-options" role="group" aria-labelledby="guide-question"></div><p id="guide-feedback" role="status"></p></div><div class="guide-bottom"><span>Progress is saved for this account on this browser.</span><button class="btn btn-purple" id="guide-next" type="button">Check answer</button></div>`;
  document.body.append(guide);
  let step = 0, selected = null, checked = false;
  const guideKey = () => `w4a-guide-v1-${getUser()?.id || 'guest'}`;
  const progress = () => Math.max(0, Math.min(questions.length, Number(read(guideKey())) || 0));
  const updateGuideBadge = () => {
    const p = progress();
    const isDone = p === questions.length;
    const guideCountEl = $('#guide-count');
    if (guideCountEl) guideCountEl.textContent = isDone ? '✓' : `${p}/${questions.length}`;
    const dashBadge = $('#dash-guide-badge');
    if (dashBadge) dashBadge.textContent = isDone ? 'Completed ✓' : `${p} / ${questions.length} completed`;
  };
  const renderGuide = () => {
    selected = null; checked = false; $('#guide-feedback').textContent = '';
    $('#guide-progress').value = step; $('#guide-step').textContent = `${step} / ${questions.length}`;
    if (step === questions.length) {
      $('#guide-title').textContent = 'You’re ready to get started'; $('#guide-question').textContent = 'Find services, share your skills, and coordinate your work with other students.';
      $('#guide-options').replaceChildren(); $('#guide-next').textContent = 'Done'; $('#guide-next').disabled = false; return;
    }
    const item = questions[step]; $('#guide-title').textContent = item.title; $('#guide-question').textContent = item.question;
    $('#guide-options').replaceChildren(...item.options.map((label, index) => {
      const button = document.createElement('button'); button.type = 'button'; button.className = 'guide-choice'; button.textContent = label; button.setAttribute('aria-pressed', 'false');
      button.addEventListener('click', () => { if (checked) return; selected = index; [...$('#guide-options').children].forEach(option => option.setAttribute('aria-pressed', String(option === button))); $('#guide-next').disabled = false; $('#guide-feedback').textContent = ''; });
      return button;
    }));
    $('#guide-next').textContent = 'Check answer'; $('#guide-next').disabled = true;
  };
  $('.guide-open').addEventListener('click', () => { step = progress(); renderGuide(); guide.showModal(); });
  $('.guide-close').addEventListener('click', () => guide.close());
  $('#guide-next').addEventListener('click', () => {
    if (step === questions.length) { guide.close(); return; }
    if (checked) { step++; renderGuide(); $('#guide-options button')?.focus(); return; }
    if (selected !== questions[step].answer) { $('#guide-feedback').textContent = 'Try again. Think about what you want to accomplish.'; return; }
    checked = true; write(guideKey(), String(step + 1)); updateGuideBadge(); $('#guide-progress').value = step + 1;
    $('#guide-feedback').textContent = questions[step].explanation; $('#guide-next').textContent = step === questions.length - 1 ? 'Finish' : 'Continue';
    [...$('#guide-options').children].forEach(button => button.disabled = true);
  });
  guide.addEventListener('close', () => $('.guide-open').focus());
  return {
    updateUser() {
      const avatar = $('#workspace-avatar');
      if (avatar) avatar.textContent = (getUser()?.fullName || 'Student').split(' ').filter(Boolean).slice(0, 2).map(word => word[0]).join('').toUpperCase();
      updateGuideBadge();
    },
    reset() {
      guide.close();
      closeAccount();
      closeDrawer();
      $('#notification-dropdown')?.classList.add('hidden');
      const search = $('#workspace-search'); if (search) search.value = '';
      const avatar = $('#workspace-avatar'); if (avatar) avatar.textContent = '';
      const count = $('#guide-count'); if (count) count.textContent = '';
      const dashBadge = $('#dash-guide-badge'); if (dashBadge) dashBadge.textContent = '';
    },
  };
}
