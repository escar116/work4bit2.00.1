// Logs View Renderer for Work4abit - Strictly Per User & Exact Action Types

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

function getActionIcon(action) {
  switch (action) {
    case 'log in':
      return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path><polyline points="10 17 15 12 10 7"></polyline><line x1="15" y1="12" x2="3" y2="12"></line></svg>`;
    case 'log out':
      return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>`;
    case 'message':
      return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>`;
    case 'apply':
      return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect></svg>`;
    case 'post':
      return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="16"></line><line x1="8" y1="12" x2="16" y2="12"></line></svg>`;
    case 'delete':
      return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>`;
    case 'get accepted':
      return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>`;
    case 'terminate':
      return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>`;
    case 'complete transaction':
      return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="5" width="20" height="14" rx="2"></rect><line x1="2" y1="10" x2="22" y2="10"></line></svg>`;
    case 'rate':
      return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>`;
    default:
      return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>`;
  }
}

export function renderLogsSection(logs, activeFilter = 'all', searchQuery = '') {
  let filtered = logs;
  if (activeFilter !== 'all') {
    filtered = filtered.filter(l => (l.action || '').toLowerCase() === activeFilter.toLowerCase());
  }
  if (searchQuery && searchQuery.trim()) {
    const q = searchQuery.toLowerCase().trim();
    filtered = filtered.filter(l => 
      (l.action && l.action.toLowerCase().includes(q)) ||
      (l.details && l.details.toLowerCase().includes(q))
    );
  }

  const actionFilters = [
    { id: 'all', label: 'All Actions' },
    { id: 'post', label: 'Post' },
    { id: 'apply', label: 'Apply' },
    { id: 'get accepted', label: 'Get Accepted' },
    { id: 'message', label: 'Message' },
    { id: 'complete transaction', label: 'Complete Transaction' },
    { id: 'rate', label: 'Rate' },
    { id: 'terminate', label: 'Terminate' },
    { id: 'delete', label: 'Delete' },
    { id: 'log in', label: 'Log In' },
    { id: 'log out', label: 'Log Out' }
  ];

  return `
    <!-- Controls Bar -->
    <div class="logs-controls-bar mb-4">
      <div class="logs-search-box">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
        <input type="text" id="logs-search-input" class="logs-search-input" placeholder="Search your activity logs..." value="${searchQuery}">
        ${searchQuery ? '<button type="button" id="btn-clear-logs-search" class="logs-search-clear">✕</button>' : ''}
      </div>
      <div class="logs-category-pills">
        ${actionFilters.map(c => `
          <button type="button" class="logs-pill-btn ${activeFilter.toLowerCase() === c.id.toLowerCase() ? 'active' : ''}" data-log-cat="${c.id}">
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
          <h3 style="font-size: 1.1rem; font-weight: 700;">No activity recorded for this action</h3>
          <p class="text-muted text-sm mt-1">Actions you perform on Work 4 A Bit will appear here.</p>
        </div>
      ` : `
        <div class="logs-list">
          ${filtered.map(item => `
            <div class="log-card log-action-${(item.action || 'general').replace(/\s+/g, '-')}">
              <div class="log-card-left">
                <div class="log-icon-wrap">
                  ${getActionIcon(item.action)}
                </div>
                <div class="log-info">
                  <div class="log-header-line">
                    <span class="log-action-badge action-badge-${(item.action || 'general').replace(/\s+/g, '-')}">${item.action.toUpperCase()}</span>
                  </div>
                  <p class="log-details-text">${item.details}</p>
                </div>
              </div>
              <div class="log-card-right">
                <span class="log-time" title="${new Date(item.timestamp).toLocaleString()}">${formatTime(item.timestamp)}</span>
                <span class="log-device">${item.device || 'Chromium / Web Desktop'}</span>
              </div>
            </div>
          `).join('')}
        </div>
      `}
    </div>
  `;
}
