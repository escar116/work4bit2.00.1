// Logs View Renderer for Work4abit

function formatTime(timestamp) {
  if (!timestamp) return 'Just now';
  const now = Date.now();
  const diff = now - timestamp;
  if (diff < 60000) return 'Just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return new Date(timestamp).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });
}

function getCategoryIcon(category) {
  switch (category) {
    case 'Applications':
      return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect></svg>`;
    case 'Services':
      return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="16"></line><line x1="8" y1="12" x2="16" y2="12"></line></svg>`;
    case 'Orders':
      return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
    case 'Messages':
      return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>`;
    case 'Security':
    case 'Profile':
      return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>`;
    default:
      return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>`;
  }
}

export function renderLogsSection(logs, activeCategory = 'all', searchQuery = '') {
  let filtered = logs;
  if (activeCategory !== 'all') {
    filtered = filtered.filter(l => l.category?.toLowerCase() === activeCategory.toLowerCase());
  }
  if (searchQuery && searchQuery.trim()) {
    const q = searchQuery.toLowerCase().trim();
    filtered = filtered.filter(l => 
      (l.action && l.action.toLowerCase().includes(q)) ||
      (l.details && l.details.toLowerCase().includes(q)) ||
      (l.category && l.category.toLowerCase().includes(q))
    );
  }

  const totalLogs = logs.length;
  const marketplaceCount = logs.filter(l => l.category === 'Services' || l.category === 'Orders').length;
  const appCount = logs.filter(l => l.category === 'Applications').length;
  const latestLogTime = logs[0] ? formatTime(logs[0].timestamp) : 'No logs yet';

  const categories = [
    { id: 'all', label: 'All Actions' },
    { id: 'Services', label: 'Services & Offers' },
    { id: 'Applications', label: 'Applications' },
    { id: 'Orders', label: 'Orders & Payments' },
    { id: 'Messages', label: 'Messaging' },
    { id: 'Profile', label: 'Profile & Security' }
  ];

  return `
    <div class="logs-stats-grid mb-4">
      <article class="analytics-metric">
        <p>Total Recorded Actions</p>
        <strong>${totalLogs}</strong>
        <small>Real-time audit log events</small>
      </article>
      <article class="analytics-metric">
        <p>Marketplace & Orders</p>
        <strong>${marketplaceCount}</strong>
        <small>Offers, requests & deliveries</small>
      </article>
      <article class="analytics-metric">
        <p>Proposals & Applications</p>
        <strong>${appCount}</strong>
        <small>Accepted, pending & submitted</small>
      </article>
      <article class="analytics-metric">
        <p>Most Recent Action</p>
        <strong style="font-size: 1.25rem;">${latestLogTime}</strong>
        <small>Continuous session logging</small>
      </article>
    </div>

    <!-- Combined Search & Category Filter Bar for Logs -->
    <div class="logs-controls-bar mb-4">
      <div class="logs-search-box">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
        <input type="text" id="logs-search-input" class="logs-search-input" placeholder="Search logs by action or details..." value="${searchQuery}">
        ${searchQuery ? '<button type="button" id="btn-clear-logs-search" class="logs-search-clear">✕</button>' : ''}
      </div>
      <div class="logs-category-pills">
        ${categories.map(c => `
          <button type="button" class="logs-pill-btn ${activeCategory.toLowerCase() === c.id.toLowerCase() ? 'active' : ''}" data-log-cat="${c.id}">
            ${c.label}
          </button>
        `).join('')}
      </div>
    </div>

    <!-- Logs Timeline Feed -->
    <div class="logs-feed-container">
      ${filtered.length === 0 ? `
        <div class="empty-state text-center" style="padding: 3rem 1rem;">
          <div class="empty-icon-bubble" style="margin: 0 auto 1rem; width: 54px; height: 54px; border-radius: 50%; background: rgba(79, 70, 229, 0.1); display: flex; align-items: center; justify-content: center; color: var(--primary-purple);">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
          </div>
          <h3 style="font-size: 1.1rem; font-weight: 700;">No activity logs found</h3>
          <p class="text-muted text-sm mt-1">Try clearing your search query or switching categories.</p>
        </div>
      ` : `
        <div class="logs-list">
          ${filtered.map(item => `
            <div class="log-card log-cat-${(item.category || 'general').toLowerCase()}">
              <div class="log-card-left">
                <div class="log-icon-wrap">
                  ${getCategoryIcon(item.category)}
                </div>
                <div class="log-info">
                  <div class="log-header-line">
                    <span class="log-action-title">${item.action}</span>
                    <span class="log-category-pill">${item.category || 'General'}</span>
                    <span class="log-status-pill status-${item.status || 'info'}">${item.status || 'info'}</span>
                  </div>
                  <p class="log-details-text">${item.details}</p>
                </div>
              </div>
              <div class="log-card-right">
                <span class="log-time" title="${new Date(item.timestamp).toLocaleString()}">${formatTime(item.timestamp)}</span>
                <span class="log-device">${item.device || 'Web Client'}</span>
              </div>
            </div>
          `).join('')}
        </div>
      `}
    </div>
  `;
}
