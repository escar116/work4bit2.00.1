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

export function setupWorkspace({ navigate, search, getUser, refresh, getServices, isAdmin, isJobOffer }) {
  const app = $('#app-views');
  const sidebar = $('#sidebar');
  const header = document.createElement('header');
  header.className = 'workspace-header';
  header.innerHTML = `<a class="workspace-brand" href="/dashboard" aria-label="Work4abit dashboard"><img src="/favicon.png" alt="Work 4 A Bit Logo" class="brand-logo-img"></a><form class="workspace-search" role="search"><label class="sr-only" for="workspace-search">Search tabs, services, or actions</label>${icon('<circle cx="10" cy="10" r="7"/><path d="m15 15 6 6"/>')}<input id="workspace-search" type="search" placeholder="Search tabs, services, actions…" autocomplete="off"><button type="button" id="workspace-search-clear" class="workspace-search-clear-btn hidden" aria-label="Clear search">✕</button><button type="submit" aria-label="Search services">Search</button><div id="workspace-search-dropdown" class="workspace-search-dropdown hidden" role="listbox" aria-label="Search suggestions"></div></form><div class="workspace-actions"><button class="icon-button workspace-menu mobile-only" type="button" aria-label="Open navigation" aria-controls="sidebar" aria-expanded="false">${panelIcon}</button><button class="icon-button workspace-messages" type="button" title="Messages" aria-label="Messages">${icon('<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>')}</button><div class="workspace-account"><button type="button" class="icon-button account-toggle" aria-label="Open account menu" aria-expanded="false" aria-controls="workspace-account-menu"><span id="workspace-avatar">●</span></button><div id="workspace-account-menu" class="workspace-account-menu hidden"></div></div></div>`;
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

  // Header Global Command Search & Live Dropdown Setup
  const escapeHtml = str => String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  const SIDEBAR_TABS = [
    {
      id: 'dashboard',
      title: 'Dashboard',
      subtitle: 'Overview & dynamic statistics',
      keywords: ['dashboard', 'home', 'stats', 'analytics', 'overview', 'summary', 'earnings', 'metrics'],
      badge: 'Tab',
      icon: '<rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/>',
      action: () => navigate('dashboard')
    },
    {
      id: 'service-offers',
      title: 'Service Offers',
      subtitle: 'Browse student skills and standing offers',
      keywords: ['service offers', 'offers', 'skills', 'services', 'standing offers', 'hire', 'gigs', 'freelance'],
      badge: 'Tab',
      icon: '<rect width="20" height="14" x="2" y="7" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>',
      action: () => navigate('service-offers')
    },
    {
      id: 'service-requests',
      title: 'Service Requests',
      subtitle: 'Tasks and projects needing assistance',
      keywords: ['service requests', 'requests', 'tasks', 'jobs', 'help wanted', 'projects', 'bids'],
      badge: 'Tab',
      icon: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M16 13H8"/><path d="M16 17H8"/><path d="M10 9H8"/>',
      action: () => navigate('service-requests')
    },
    {
      id: 'mentoring',
      title: 'Mentoring',
      subtitle: 'Peer tutoring, academic guidance and consultations',
      keywords: ['mentoring', 'mentor', 'peer tutoring', 'tutor', 'guidance', 'study', 'academic', 'consultation'],
      badge: 'Tab',
      icon: '<path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"/><path d="M6 6h10"/><path d="M6 10h10"/>',
      action: () => navigate('mentoring')
    },
    {
      id: 'applications',
      title: 'Applications',
      subtitle: 'Manage applied tasks and incoming candidates',
      keywords: ['applications', 'applied', 'candidates', 'proposals', 'applicants', 'orders', 'pending'],
      badge: 'Tab',
      icon: '<path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>',
      action: () => navigate('applications')
    },
    {
      id: 'messages',
      title: 'Messages',
      subtitle: 'Chat with peers, buyers, and sellers',
      keywords: ['messages', 'chat', 'inbox', 'conversations', 'dm', 'direct message', 'contact'],
      badge: 'Tab',
      icon: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
      action: () => navigate('messages')
    },
    {
      id: 'transactions',
      title: 'Transactions',
      subtitle: 'Transaction history, receipts and escrow audit',
      keywords: ['transactions', 'history', 'payments', 'earnings', 'receipts', 'escrow', 'orders', 'completed'],
      badge: 'Tab',
      icon: '<circle cx="12" cy="12" r="10"/><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/><path d="M12 6v2m0 8v2"/>',
      action: () => navigate('transactions')
    },
    {
      id: 'logs',
      title: 'Activity Logs',
      subtitle: 'Audit trail and personal activity timeline',
      keywords: ['activity logs', 'logs', 'audit', 'timeline', 'events', 'history'],
      badge: 'Tab',
      icon: '<path d="M12 8v4l3 3"/><circle cx="12" cy="12" r="9"/>',
      action: () => navigate('logs')
    },
    {
      id: 'profile',
      title: 'Profile',
      subtitle: 'View and edit personal portfolio and account details',
      keywords: ['profile', 'account', 'user', 'bio', 'settings', 'avatar', 'student info'],
      badge: 'Tab',
      icon: '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
      action: () => navigate('profile')
    },
    {
      id: 'admin',
      title: 'Admin Portal',
      subtitle: 'User verification, disputes & system audit logs',
      keywords: ['admin', 'admin portal', 'moderation', 'verification', 'system audit', 'disputes', 'security'],
      badge: 'Admin',
      adminOnly: true,
      icon: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
      action: () => navigate('admin')
    },
    {
      id: 'guide',
      title: 'Getting Started Guide',
      subtitle: 'Interactive walkthrough and platform quiz',
      keywords: ['getting started', 'guide', 'tutorial', 'help', 'walkthrough', 'basics', 'quiz'],
      badge: 'Guide',
      icon: '<path d="M12 3v18M3 5c4-2 6-1 9 1 3-2 5-3 9-1v14c-4-2-6-1-9 1-3-2-5-3-9-1z"/>',
      action: () => $('.guide-open')?.click()
    }
  ];

  const QUICK_ACTIONS = [
    {
      id: 'action-post-offer',
      title: 'Post Service Offer',
      subtitle: 'Publish your skills, services, or equipment',
      keywords: ['post offer', 'create offer', 'new offer', 'publish service', 'add skill'],
      badge: 'Action',
      icon: '<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>',
      action: () => $('#btn-post-offer')?.click()
    },
    {
      id: 'action-post-request',
      title: 'Post Service Request',
      subtitle: 'Post a task, job or project you need help with',
      keywords: ['post request', 'create request', 'new request', 'post task', 'need help'],
      badge: 'Action',
      icon: '<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>',
      action: () => $('#btn-post-request')?.click()
    }
  ];

  const searchInput = $('#workspace-search');
  const searchDropdown = $('#workspace-search-dropdown');
  const searchClearBtn = $('#workspace-search-clear');
  let currentItems = [];
  let selectedIndex = -1;

  const updateActiveItem = () => {
    if (!searchDropdown) return;
    const itemEls = searchDropdown.querySelectorAll('.workspace-search-item');
    itemEls.forEach((el, idx) => {
      const isActive = idx === selectedIndex;
      el.classList.toggle('active', isActive);
      if (isActive) {
        el.scrollIntoView({ block: 'nearest' });
      }
    });
  };

  const closeDropdown = () => {
    if (!searchDropdown) return;
    searchDropdown.classList.add('hidden');
    selectedIndex = -1;
  };

  const executeItem = (item) => {
    closeDropdown();
    if (searchInput) {
      searchInput.value = '';
      searchClearBtn?.classList.add('hidden');
      searchInput.blur();
    }
    if (item && typeof item.action === 'function') {
      item.action();
    }
  };

  const renderDropdown = () => {
    if (!searchDropdown || !searchInput) return;
    const term = searchInput.value.trim().toLowerCase();
    const isUserAdmin = Boolean(isAdmin && isAdmin());

    const availableTabs = SIDEBAR_TABS.filter(tab => !tab.adminOnly || isUserAdmin);
    let sections = [];
    currentItems = [];

    if (!term) {
      sections.push({
        title: 'Sidebar Navigation',
        items: availableTabs
      });
      sections.push({
        title: 'Quick Actions',
        items: QUICK_ACTIONS
      });
    } else {
      const matchingTabs = availableTabs.filter(tab => {
        return tab.title.toLowerCase().includes(term) ||
          (tab.subtitle && tab.subtitle.toLowerCase().includes(term)) ||
          tab.keywords.some(k => k.toLowerCase().includes(term));
      });
      if (matchingTabs.length > 0) {
        sections.push({
          title: 'Sidebar Navigation',
          items: matchingTabs
        });
      }

      const matchingActions = QUICK_ACTIONS.filter(act => {
        return act.title.toLowerCase().includes(term) ||
          act.keywords.some(k => k.toLowerCase().includes(term));
      });
      if (matchingActions.length > 0) {
        sections.push({
          title: 'Quick Actions',
          items: matchingActions
        });
      }

      const services = typeof getServices === 'function' ? getServices() : [];
      const matchingListings = (services || [])
        .filter(req => {
          if (!req || req.status === 'CLOSED') return false;
          const title = (req.title || '').toLowerCase();
          const desc = (req.description || '').toLowerCase();
          const cat = (req.category || '').toLowerCase();
          return title.includes(term) || desc.includes(term) || cat.includes(term);
        })
        .slice(0, 4)
        .map(req => {
          const offer = isJobOffer ? isJobOffer(req) : ((req.urgency || '').toUpperCase() === 'OFFER');
          return {
            id: `listing-${req.id}`,
            title: req.title || 'Untitled Listing',
            subtitle: `${req.category || 'General'} • ₱${Number(req.budget || 0).toLocaleString()}`,
            badge: offer ? 'Offer' : 'Request',
            icon: offer
              ? '<rect width="20" height="14" x="2" y="7" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>'
              : '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/>',
            action: () => {
              navigate(offer ? 'service-offers' : 'service-requests');
              search(req.title);
            }
          };
        });

      if (matchingListings.length > 0) {
        sections.push({
          title: 'Marketplace Listings',
          items: matchingListings
        });
      }

      const fallbackItem = {
        id: 'action-search-marketplace',
        title: `Search marketplace for "${searchInput.value.trim()}"`,
        subtitle: 'Filter all offers & requests matching this query',
        badge: 'Search',
        icon: '<circle cx="10" cy="10" r="7"/><path d="m15 15 6 6"/>',
        action: () => {
          search(searchInput.value.trim());
        }
      };
      sections.push({
        title: 'Marketplace Search',
        items: [fallbackItem]
      });
    }

    let html = '';
    let globalIndex = 0;

    sections.forEach(sec => {
      if (!sec.items || sec.items.length === 0) return;
      html += `<div class="workspace-search-section-title">${escapeHtml(sec.title)}</div>`;
      sec.items.forEach(item => {
        const itemIdx = globalIndex++;
        currentItems.push(item);
        const isActive = itemIdx === selectedIndex;
        html += `
          <div class="workspace-search-item ${isActive ? 'active' : ''}" role="option" data-index="${itemIdx}">
            <div class="workspace-search-item-icon">${icon(item.icon)}</div>
            <div class="workspace-search-item-content">
              <div class="workspace-search-item-title">
                <span>${escapeHtml(item.title)}</span>
                ${item.badge ? `<span class="workspace-search-item-badge">${escapeHtml(item.badge)}</span>` : ''}
              </div>
              ${item.subtitle ? `<div class="workspace-search-item-subtitle">${escapeHtml(item.subtitle)}</div>` : ''}
            </div>
            <span class="workspace-search-item-action">Jump to</span>
          </div>
        `;
      });
    });

    if (currentItems.length === 0) {
      html = `<div class="workspace-search-empty">No matching tabs or listings found.</div>`;
    }

    searchDropdown.innerHTML = html;
    searchDropdown.classList.remove('hidden');
    selectedIndex = -1;
  };

  searchInput?.addEventListener('focus', () => {
    renderDropdown();
  });

  searchInput?.addEventListener('input', () => {
    const hasVal = Boolean(searchInput.value.trim());
    searchClearBtn?.classList.toggle('hidden', !hasVal);
    renderDropdown();
  });

  searchInput?.addEventListener('keydown', (e) => {
    if (searchDropdown?.classList.contains('hidden')) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        renderDropdown();
        return;
      }
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (currentItems.length === 0) return;
      selectedIndex = (selectedIndex + 1) % currentItems.length;
      updateActiveItem();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (currentItems.length === 0) return;
      selectedIndex = (selectedIndex - 1 + currentItems.length) % currentItems.length;
      updateActiveItem();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && currentItems[selectedIndex]) {
        executeItem(currentItems[selectedIndex]);
      } else if (searchInput.value.trim()) {
        closeDropdown();
        search(searchInput.value.trim());
      }
    } else if (e.key === 'Escape') {
      closeDropdown();
    }
  });

  searchClearBtn?.addEventListener('click', (e) => {
    e.preventDefault();
    if (searchInput) searchInput.value = '';
    searchClearBtn.classList.add('hidden');
    searchInput?.focus();
    renderDropdown();
  });

  searchDropdown?.addEventListener('click', (e) => {
    const itemEl = e.target.closest('.workspace-search-item');
    if (!itemEl) return;
    const idx = Number(itemEl.dataset.index);
    if (!isNaN(idx) && currentItems[idx]) {
      executeItem(currentItems[idx]);
    }
  });

  searchDropdown?.addEventListener('mousemove', (e) => {
    const itemEl = e.target.closest('.workspace-search-item');
    if (!itemEl) return;
    const idx = Number(itemEl.dataset.index);
    if (!isNaN(idx) && idx !== selectedIndex) {
      selectedIndex = idx;
      updateActiveItem();
    }
  });

  $('.workspace-search')?.addEventListener('submit', event => {
    event.preventDefault();
    if (selectedIndex >= 0 && currentItems[selectedIndex]) {
      executeItem(currentItems[selectedIndex]);
    } else {
      closeDropdown();
      search(searchInput?.value.trim() || '');
    }
  });
  const account = $('.account-toggle'); const accountMenu = $('.workspace-account-menu');
  const closeAccount = () => { accountMenu.classList.add('hidden'); account.setAttribute('aria-expanded', 'false'); };
  account.addEventListener('click', () => { const open = accountMenu.classList.toggle('hidden') === false; account.setAttribute('aria-expanded', String(open)); });
  accountMenu.addEventListener('click', closeAccount);
  document.addEventListener('click', event => { if (!event.target.closest('.workspace-account')) closeAccount(); });
  document.addEventListener('keydown', event => { if (event.key === 'Escape') { closeAccount(); closeDrawer(); closeDropdown(); $('#notification-dropdown').classList.add('hidden'); } });
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
      const u = getUser();
      const photo = u?.photoURL || (u?.id ? localStorage.getItem('cached_photo_' + u.id) : null);
      if (avatar) {
        if (photo) {
          avatar.innerHTML = `<img src="${photo}" alt="${u?.fullName || 'User'}" class="header-avatar-img">`;
        } else {
          avatar.textContent = (u?.fullName || 'Student').split(' ').filter(Boolean).slice(0, 2).map(word => word[0]).join('').toUpperCase();
        }
      }
      updateGuideBadge();
    },
    reset() {
      guide.close();
      closeAccount();
      closeDrawer();
      $('#notification-dropdown')?.classList.add('hidden');
      const search = $('#workspace-search'); if (search) search.value = '';
      $('#workspace-search-clear')?.classList.add('hidden');
      closeDropdown();
      const avatar = $('#workspace-avatar'); if (avatar) avatar.textContent = '';
      const count = $('#guide-count'); if (count) count.textContent = '';
      const dashBadge = $('#dash-guide-badge'); if (dashBadge) dashBadge.textContent = '';
    },
  };
}
